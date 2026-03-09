import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { MODULE_COLORS } from '../constants';

function col(colorId) {
  return MODULE_COLORS.find(c => c.id === colorId) || MODULE_COLORS[0];
}

export default function LessonPage({ lesson, mod, userId, onBack, onUpdate, notify }) {
  const [tab, setTab] = useState(lesson.structured_notes ? 'notes' : 'dump');
  const [dump, setDump] = useState(lesson.raw_notes || '');
  const [notes, setNotes] = useState(lesson.structured_notes || '');
  const [processing, setProcessing] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [generatingNotes, setGeneratingNotes] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const fileInputRef = useRef(null);
  const generateTimeoutRef = useRef(null);

  const c = col(mod.color);
  const date = new Date(lesson.date);

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

  async function generateAiNotes() {
    if (dump.trim().length < 50) {
      setAiSuggestion("Keep writing... I'll help organize your thoughts once you've added more content.");
      return;
    }

    setGeneratingNotes(true);
    setAiSuggestion('');

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-notes`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          brainDump: dump,
          moduleName: mod.name,
          syllabus: mod.syllabus,
          customInstructions: mod.custom_instructions
        })
      });

      const data = await response.json();

      if (data.notes) {
        setAiSuggestion(data.notes);
      } else {
        throw new Error('No notes generated');
      }
    } catch (error) {
      notify('Failed to generate AI notes', 'err');
    } finally {
      setGeneratingNotes(false);
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
          updated_at: new Date().toISOString()
        })
        .eq('id', lesson.id);

      if (error) throw error;

      onUpdate({ ...lesson, raw_notes: dump, structured_notes: notesToSave });
      setNotes(notesToSave);
      setTab('notes');
      notify('Notes saved');
    } catch (error) {
      notify('Failed to save notes', 'err');
    } finally {
      setProcessing(false);
    }
  }

  function handleDumpChange(value) {
    setDump(value);

    if (generateTimeoutRef.current) {
      clearTimeout(generateTimeoutRef.current);
    }

    generateTimeoutRef.current = setTimeout(() => {
      if (value.trim().length >= 100) {
        generateAiNotes();
      }
    }, 2000);
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
          ["notes", "📝 Notes"]
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
            <p style={{fontSize:14,color:"var(--ink3)",lineHeight:1.65,marginBottom:20}}>
              Write everything from today's class. AI will help organize your thoughts as you type.
            </p>

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
                      onClick={generateAiNotes}
                      disabled={!dump.trim() || generatingNotes || dump.trim().length < 50}
                    >
                      {generatingNotes ? '✨ Organizing...' : '✨ Organize Notes'}
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={saveNotes}
                      disabled={!dump.trim() || processing}
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
                      <span style={{fontSize: 14, fontWeight: 600, color: '#166534'}}>AI Organized Notes</span>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setAiSuggestion('')}
                    >
                      ×
                    </button>
                  </div>
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
              <div className="card fu" style={{padding:"32px 36px"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:22,paddingBottom:16,borderBottom:"1px solid var(--paper2)"}}>
                  <span style={{fontSize:22}}>{mod.emoji}</span>
                  <div>
                    <div style={{fontFamily:"Lora,serif",fontSize:16,color:"var(--ink)"}}>
                      {date.toLocaleDateString('en-GB', {weekday:'long', day:'numeric', month:'long', year:'numeric'})}
                    </div>
                    <div style={{fontSize:12,color:c.text,fontWeight:500}}>{mod.name}</div>
                  </div>
                </div>
                <div style={{fontSize:14,color:"var(--ink2)",lineHeight:1.85,whiteSpace:"pre-wrap"}}>
                  {notes}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
