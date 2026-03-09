import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { MODULE_COLORS } from '../constants';
import { generateLessonSummary } from '../utils/summaryGenerator';

function col(colorId) {
  return MODULE_COLORS.find(c => c.id === colorId) || MODULE_COLORS[0];
}

export default function LessonPage({ lesson, mod, userId, onBack, onUpdate, notify, profile }) {
  const [tab, setTab] = useState(lesson.structured_notes ? 'notes' : 'dump');
  const [dump, setDump] = useState(lesson.raw_notes || '');
  const [notes, setNotes] = useState(lesson.structured_notes || '');
  const [processing, setProcessing] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [generatingNotes, setGeneratingNotes] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [topic, setTopic] = useState(lesson.topic || '');
  const [summary, setSummary] = useState(lesson.ai_summary || '');
  const [keyConcepts, setKeyConcepts] = useState(lesson.key_concepts || []);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [showRegenerateOptions, setShowRegenerateOptions] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const fileInputRef = useRef(null);
  const generateTimeoutRef = useRef(null);

  const c = col(mod.color);
  const date = new Date(lesson.date);
  const learningStyle = profile?.learning_style || {};
  const noteStyle = learningStyle.noteStyle || 'balanced';

  useEffect(() => {
    loadAttachments();
  }, [lesson.id]);

  async function loadAttachments() {
    try {
      const { data, error } = await supabase
        .from('lesson_attachments')
        .select('*')
        .eq('lesson_id', lesson.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAttachments(data || []);
    } catch (error) {
      notify('Failed to load attachments', 'err');
    }
  }

  async function handleFileUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);

    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `lesson-attachments/${lesson.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('lesson-files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('lesson-files')
          .getPublicUrl(filePath);

        const { error: dbError } = await supabase
          .from('lesson_attachments')
          .insert([{
            lesson_id: lesson.id,
            file_name: file.name,
            file_url: publicUrl,
            file_type: file.type,
            file_size: file.size
          }]);

        if (dbError) throw dbError;
      }

      await loadAttachments();
      notify('Files uploaded successfully');
    } catch (error) {
      notify('Failed to upload files', 'err');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function deleteAttachment(attachmentId, fileUrl) {
    if (!window.confirm('Delete this file?')) return;

    try {
      const filePath = fileUrl.split('/lesson-files/')[1];

      await supabase.storage
        .from('lesson-files')
        .remove([filePath]);

      await supabase
        .from('lesson_attachments')
        .delete()
        .eq('id', attachmentId);

      await loadAttachments();
      notify('File deleted');
    } catch (error) {
      notify('Failed to delete file', 'err');
    }
  }

  async function generateAiNotes(regenerate = false, regeneratePrompt = '') {
    if (!regenerate && dump.trim().length < 50 && attachments.length === 0) {
      setAiSuggestion("Keep writing or attach files... I'll help organize your thoughts once you've added more content.");
      return;
    }

    setGeneratingNotes(true);
    setAiSuggestion('');

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-lesson-notes`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const pdfAttachments = attachments
        .filter(att => att.file_type === 'application/pdf')
        .map(att => att.file_url);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          brainDump: dump || 'Please create notes from the attached materials.',
          attachmentUrls: pdfAttachments,
          moduleName: mod.name,
          syllabus: mod.syllabus,
          learningStyle: learningStyle,
          regenerate: regenerate,
          customPrompt: regeneratePrompt
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.notes) {
        setAiSuggestion(data.notes);
        if (data.summary) {
          setSummary(data.summary);
        }
        if (data.keyConcepts && data.keyConcepts.length > 0) {
          setKeyConcepts(data.keyConcepts);
        }
        setShowRegenerateOptions(false);
        setCustomPrompt('');
      } else {
        throw new Error('No notes generated');
      }
    } catch (error) {
      notify(error.message || 'Failed to generate AI notes', 'err');
    } finally {
      setGeneratingNotes(false);
    }
  }

  async function generateSummaryFromNotes(notesText) {
    setGeneratingSummary(true);
    try {
      const result = await generateLessonSummary(
        notesText || notes,
        topic || mod.name,
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      if (result.summary) {
        setSummary(result.summary);
      }
      if (result.keyConcepts.length > 0) {
        setKeyConcepts(result.keyConcepts);
      }
    } catch (error) {
      console.error('Failed to generate summary:', error);
    } finally {
      setGeneratingSummary(false);
    }
  }

  async function saveNotes() {
    setProcessing(true);
    try {
      const notesToSave = aiSuggestion || dump;

      const { error } = await supabase
        .from('lessons')
        .update({
          raw_notes: dump,
          structured_notes: notesToSave,
          topic: topic || null,
          ai_summary: summary || null,
          key_concepts: keyConcepts.length > 0 ? keyConcepts : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', lesson.id);

      if (error) throw error;

      onUpdate({ ...lesson, raw_notes: dump, structured_notes: notesToSave, topic, ai_summary: summary, key_concepts: keyConcepts });
      setNotes(notesToSave);
      setAiSuggestion('');
      setTab('notes');
      notify('Notes saved');
    } catch (error) {
      notify('Failed to save notes', 'err');
    } finally {
      setProcessing(false);
    }
  }

  async function sendChatMessage() {
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-notes`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const context = `Lesson Notes: ${notes || dump}\n\nQuestion: ${chatInput}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          brainDump: context,
          moduleName: mod.name,
          syllabus: mod.syllabus,
          customInstructions: 'Answer the student\'s question based on the lesson notes provided.'
        })
      });

      const data = await response.json();

      if (data.notes) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.notes }]);
      } else {
        throw new Error('No response generated');
      }
    } catch (error) {
      notify('Failed to get response', 'err');
    } finally {
      setChatLoading(false);
    }
  }

  function handleDumpChange(value) {
    setDump(value);

    if (generateTimeoutRef.current) {
      clearTimeout(generateTimeoutRef.current);
    }

    generateTimeoutRef.current = setTimeout(() => {
      if (value.trim().length >= 100 || attachments.length > 0) {
        generateAiNotes(false, '');
      }
    }, 2000);
  }

  async function handleRegenerateWithPrompt() {
    if (!customPrompt.trim()) {
      notify('Please enter what you\'d like to change', 'err');
      return;
    }
    await generateAiNotes(true, customPrompt);
  }

  return (
    <div style={{minHeight:"100vh",background:"var(--paper)",display:"flex",flexDirection:"column"}}>
      <header style={{padding:"14px 36px",borderBottom:"1px solid var(--paper2)",background:"var(--white)",display:"flex",alignItems:"center",gap:14}}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← {mod.name}</button>
        <div style={{flex:1}}>
          <span style={{fontSize:14,fontWeight:600,color:"var(--ink)"}}>
            {date.toLocaleDateString('en-GB', {weekday:'long', day:'numeric', month:'long', year:'numeric'})}
          </span>
        </div>
        {notes && <span className="tag" style={{background:"#DCFCE7",color:"#166534"}}>✓ Notes done</span>}
      </header>

      <div style={{padding:"0 36px",background:"var(--white)",borderBottom:"1px solid var(--paper2)",display:"flex",gap:0}}>
        {[
          ["dump", "🧠 Brain Dump"],
          ["notes", "📝 Notes"],
          ["chat", "💬 Chat"]
        ].map(([id, label]) => (
          <button
            key={id}
            className={`tab-btn${tab === id ? " active" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <main style={{flex:1,padding:"28px 36px",maxWidth:860,margin:"0 auto",width:"100%"}}>
        {tab === 'dump' && (
          <div className="fu">
            <h2 style={{fontSize:21,marginBottom:6,color:"var(--ink)"}}>Brain Dump</h2>
            <p style={{fontSize:14,color:"var(--ink3)",lineHeight:1.65,marginBottom:12}}>
              Write everything from today's class or attach PDF notes. AI will help organize your thoughts.
            </p>
            {attachments.filter(att => att.file_type === 'application/pdf').length > 0 && (
              <div style={{
                padding: '12px 16px',
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 13,
                color: '#1E40AF'
              }}>
                💡 Tip: Click "Generate Notes" to have AI read your PDF and create organized notes based on your learning preferences
              </div>
            )}


            <div style={{display: 'grid', gridTemplateColumns: aiSuggestion ? '1fr 1fr' : '1fr', gap: 16}}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                background: 'var(--white)',
                border: '1px solid var(--paper2)',
                borderRadius: 12,
                padding: '16px',
                minHeight: 300
              }}>
                {attachments.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    paddingBottom: 12,
                    borderBottom: '1px solid var(--paper2)'
                  }}>
                    {attachments.map(att => (
                      <div
                        key={att.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          background: 'var(--paper)',
                          borderRadius: 8,
                          fontSize: 14
                        }}
                      >
                        <span style={{fontSize: 20}}>
                          {att.file_type.startsWith('image/') ? '🖼️' : '📎'}
                        </span>
                        <div style={{flex: 1, minWidth: 0}}>
                          <div style={{
                            color: 'var(--ink)',
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {att.file_name}
                          </div>
                          <div style={{fontSize: 12, color: 'var(--ink3)'}}>
                            {(att.file_size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => window.open(att.file_url, '_blank')}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => deleteAttachment(att.id, att.file_url)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <textarea
                  className="inp"
                  value={dump}
                  onChange={(e) => handleDumpChange(e.target.value)}
                  placeholder="Start typing your notes here... Don't worry about structure or spelling. AI will help organize them."
                  style={{
                    minHeight: 200,
                    lineHeight: 1.8,
                    fontSize: 15,
                    resize: 'vertical',
                    border: 'none',
                    background: 'transparent',
                    flex: 1
                  }}
                />

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 8,
                  borderTop: '1px solid var(--paper2)'
                }}>
                  <div style={{display: 'flex', gap: 10, alignItems: 'center'}}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      style={{display: 'none'}}
                    />
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      style={{
                        width: 36,
                        height: 36,
                        padding: 0,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {uploading ? '...' : '+'}
                    </button>
                    <span style={{fontSize: 12, color: 'var(--ink4)'}}>
                      {dump.trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                  <div style={{display: 'flex', gap: 8}}>
                    <button
                      className="btn btn-ghost"
                      onClick={() => generateAiNotes(false, '')}
                      disabled={(!dump.trim() && attachments.length === 0) || generatingNotes}
                    >
                      {generatingNotes ? '✨ Organizing...' : '✨ Generate Notes'}
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={saveNotes}
                      disabled={(!dump.trim() && !aiSuggestion) || processing}
                    >
                      {processing ? (
                        <>
                          <span className="dot" />
                          <span className="dot" />
                          <span className="dot" />
                        </>
                      ) : 'Save Notes'}
                    </button>
                  </div>
                </div>
              </div>

              {aiSuggestion && (
                <div style={{
                  background: 'var(--white)',
                  border: '2px solid #DCFCE7',
                  borderRadius: 12,
                  padding: '16px',
                  minHeight: 300,
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                    paddingBottom: 12,
                    borderBottom: '1px solid var(--paper2)'
                  }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                      <span style={{fontSize: 16}}>✨</span>
                      <span style={{fontSize: 14, fontWeight: 600, color: '#166534'}}>AI Generated Notes</span>
                    </div>
                    <div style={{display: 'flex', gap: 8}}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setShowRegenerateOptions(!showRegenerateOptions)}
                        title="Customize and regenerate"
                      >
                        🔄
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setAiSuggestion('')}
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {showRegenerateOptions && (
                    <div style={{
                      marginBottom: 12,
                      padding: 12,
                      background: 'var(--paper)',
                      borderRadius: 8,
                      border: '1px solid var(--paper2)'
                    }}>
                      <p style={{fontSize: 13, color: 'var(--ink3)', marginBottom: 8}}>
                        What would you like to change about these notes?
                      </p>
                      <div style={{display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10}}>
                        {[
                          'Make it more concise',
                          'Add more details',
                          'Add more examples',
                          'Use bullet points',
                          'More visual hierarchy',
                          'Focus on key concepts'
                        ].map(suggestion => (
                          <button
                            key={suggestion}
                            className="btn btn-ghost btn-sm"
                            onClick={() => setCustomPrompt(suggestion)}
                            style={{fontSize: 12, padding: '4px 10px'}}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                      <textarea
                        className="inp"
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Or type your own instructions..."
                        style={{
                          minHeight: 60,
                          fontSize: 13,
                          marginBottom: 8
                        }}
                      />
                      <div style={{display: 'flex', gap: 8}}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={handleRegenerateWithPrompt}
                          disabled={!customPrompt.trim() || generatingNotes}
                        >
                          {generatingNotes ? 'Regenerating...' : 'Regenerate'}
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setShowRegenerateOptions(false);
                            setCustomPrompt('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{
                    fontSize: 14,
                    color: 'var(--ink2)',
                    lineHeight: 1.8,
                    whiteSpace: 'pre-wrap',
                    flex: 1,
                    overflowY: 'auto'
                  }}>
                    {aiSuggestion}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'notes' && (
          <div className="fu">
            {!notes && !processing && (
              <div style={{textAlign:"center",padding:"70px 20px"}}>
                <div style={{fontSize:44,marginBottom:14}}>📝</div>
                <h3 style={{fontSize:19,marginBottom:8}}>No notes yet</h3>
                <p style={{color:"var(--ink3)",fontSize:14,marginBottom:22}}>Go to Brain Dump to add your lesson notes.</p>
                <button className="btn btn-primary" onClick={() => setTab('dump')}>Go to Brain Dump →</button>
              </div>
            )}

            {notes && (
              <div className="fu">
                <div style={{marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
                  <input
                    type="text"
                    className="inp"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onBlur={async () => {
                      if (topic !== lesson.topic) {
                        try {
                          await supabase.from('lessons').update({ topic }).eq('id', lesson.id);
                          notify('Topic updated');
                        } catch (error) {
                          notify('Failed to update topic', 'err');
                        }
                      }
                    }}
                    placeholder="Lesson topic or title..."
                    style={{flex:1,fontSize:16,fontWeight:600}}
                  />
                  <button className="btn btn-ghost btn-sm" onClick={() => setTab('dump')}>✏️ Edit</button>
                </div>

                {noteStyle === 'summary-first' && (
                  <>
                    {(summary || keyConcepts.length > 0) && (
                      <div className="card" style={{padding:"24px 28px",marginBottom:20,background:"var(--sky-bg)",border:"1px solid var(--sky)"}}>
                        <h3 style={{fontSize:14,fontWeight:700,color:"var(--ink2)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:14}}>
                          📝 Summary
                        </h3>
                        {summary && (
                          <p style={{fontSize:14,color:"var(--ink)",lineHeight:1.7,marginBottom:16}}>
                            {summary}
                          </p>
                        )}
                        {keyConcepts.length > 0 && (
                          <>
                            <h4 style={{fontSize:13,fontWeight:600,color:"var(--ink2)",marginBottom:10}}>Key Concepts:</h4>
                            <ul style={{margin:0,paddingLeft:20,fontSize:14,color:"var(--ink2)",lineHeight:1.8}}>
                              {keyConcepts.map((concept, i) => (
                                <li key={i}>{concept}</li>
                              ))}
                            </ul>
                          </>
                        )}
                        {!summary && !generatingSummary && notes && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => generateSummaryFromNotes(notes)}
                            style={{marginTop:10}}
                          >
                            Generate Summary
                          </button>
                        )}
                        {generatingSummary && (
                          <p style={{fontSize:12,color:"var(--ink4)",fontStyle:"italic"}}>Generating summary...</p>
                        )}
                      </div>
                    )}
                    <div className="card" style={{padding:"32px 36px"}}>
                      <h3 style={{fontSize:14,fontWeight:700,color:"var(--ink3)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:16}}>
                        Detailed Notes
                      </h3>
                      <div style={{fontSize:14,color:"var(--ink2)",lineHeight:1.85,whiteSpace:"pre-wrap"}}>
                        {notes}
                      </div>
                    </div>
                  </>
                )}

                {noteStyle === 'details-first' && (
                  <>
                    <div className="card" style={{padding:"32px 36px",marginBottom:20}}>
                      <div style={{fontSize:14,color:"var(--ink2)",lineHeight:1.85,whiteSpace:"pre-wrap"}}>
                        {notes}
                      </div>
                    </div>
                    {(summary || keyConcepts.length > 0) && (
                      <div className="card" style={{padding:"24px 28px",background:"var(--sky-bg)",border:"1px solid var(--sky)"}}>
                        <h3 style={{fontSize:14,fontWeight:700,color:"var(--ink2)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:14}}>
                          📝 Summary
                        </h3>
                        {summary && (
                          <p style={{fontSize:14,color:"var(--ink)",lineHeight:1.7,marginBottom:16}}>
                            {summary}
                          </p>
                        )}
                        {keyConcepts.length > 0 && (
                          <>
                            <h4 style={{fontSize:13,fontWeight:600,color:"var(--ink2)",marginBottom:10}}>Key Concepts:</h4>
                            <ul style={{margin:0,paddingLeft:20,fontSize:14,color:"var(--ink2)",lineHeight:1.8}}>
                              {keyConcepts.map((concept, i) => (
                                <li key={i}>{concept}</li>
                              ))}
                            </ul>
                          </>
                        )}
                        {!summary && !generatingSummary && notes && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => generateSummaryFromNotes(notes)}
                            style={{marginTop:10}}
                          >
                            Generate Summary
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}

                {(noteStyle === 'balanced' || !noteStyle) && (
                  <div className="card" style={{padding:"32px 36px"}}>
                    {(summary || keyConcepts.length > 0) && (
                      <div style={{padding:"20px 24px",marginBottom:24,background:"var(--sky-bg)",border:"1px solid var(--sky)",borderRadius:8}}>
                        <h3 style={{fontSize:14,fontWeight:700,color:"var(--ink2)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:12}}>
                          Summary
                        </h3>
                        {summary && (
                          <p style={{fontSize:13,color:"var(--ink)",lineHeight:1.7,marginBottom:12}}>
                            {summary}
                          </p>
                        )}
                        {keyConcepts.length > 0 && (
                          <ul style={{margin:0,paddingLeft:20,fontSize:13,color:"var(--ink2)",lineHeight:1.7}}>
                            {keyConcepts.map((concept, i) => (
                              <li key={i}>{concept}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    <div style={{fontSize:14,color:"var(--ink2)",lineHeight:1.85,whiteSpace:"pre-wrap"}}>
                      {notes}
                    </div>
                    {!summary && !generatingSummary && notes && (
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => generateSummaryFromNotes(notes)}
                        style={{marginTop:16}}
                      >
                        Generate Summary
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'chat' && (
          <div className="fu">
            <h2 style={{fontSize:21,marginBottom:6,color:"var(--ink)"}}>Lesson Chat</h2>
            <p style={{fontSize:14,color:"var(--ink3)",lineHeight:1.65,marginBottom:20}}>
              Ask questions about this lesson's content
            </p>

            <div style={{
              display:"flex",
              flexDirection:"column",
              height:"500px",
              background:"var(--white)",
              border:"1px solid var(--paper2)",
              borderRadius:12
            }}>
              <div style={{
                flex:1,
                overflowY:"auto",
                padding:"20px",
                display:"flex",
                flexDirection:"column",
                gap:16
              }}>
                {chatMessages.length === 0 && (
                  <div style={{textAlign:"center",padding:"50px 20px",color:"var(--ink3)"}}>
                    <div style={{fontSize:40,marginBottom:12}}>💬</div>
                    <p style={{fontSize:14,marginBottom:16}}>Ask me anything about this lesson!</p>
                    <div style={{display:"flex",flexDirection:"column",gap:8,maxWidth:300,margin:"0 auto"}}>
                      {[
                        "Explain the main concepts",
                        "What are the key takeaways?",
                        "Give me practice questions"
                      ].map(suggestion => (
                        <button
                          key={suggestion}
                          className="btn btn-ghost btn-sm"
                          onClick={() => setChatInput(suggestion)}
                          style={{fontSize:12}}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '75%',
                      padding: '12px 16px',
                      borderRadius: 12,
                      background: msg.role === 'user' ? 'var(--primary)' : 'var(--paper2)',
                      color: msg.role === 'user' ? '#fff' : 'var(--ink)',
                      fontSize: 14,
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {msg.content}
                  </div>
                ))}

                {chatLoading && (
                  <div style={{alignSelf:"flex-start",padding:"12px 16px"}}>
                    <div style={{display:"flex",gap:6}}>
                      <span className="dot" />
                      <span className="dot" />
                      <span className="dot" />
                    </div>
                  </div>
                )}
              </div>

              <div style={{
                padding:"16px",
                borderTop:"1px solid var(--paper2)",
                display:"flex",
                gap:10
              }}>
                <input
                  className="inp"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                  placeholder="Ask a question..."
                  style={{flex:1}}
                />
                <button
                  className="btn btn-primary"
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim() || chatLoading}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
