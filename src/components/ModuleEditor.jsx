import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { MODULE_COLORS, SUBJECT_TYPES, DAYS, EMOJIS } from '../constants';

export default function ModuleEditor({ module, onClose, onUpdate, notify }) {
  const [name, setName] = useState(module.name);
  const [emoji, setEmoji] = useState(module.emoji || '📚');
  const [color, setColor] = useState(module.color || 'amber');
  const [subjectType, setSubjectType] = useState(module.subject_type || 'other');
  const [lessonDay, setLessonDay] = useState(module.lesson_day || '');
  const [syllabus, setSyllabus] = useState(module.syllabus || '');
  const [instructions, setInstructions] = useState(module.custom_instructions || '');
  const [terms, setTerms] = useState([]);
  const [syllabusAttachments, setSyllabusAttachments] = useState([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const syllabusFileInputRef = useRef(null);

  useEffect(() => {
    loadTerms();
    loadSyllabusAttachments();
  }, [module.id]);

  async function loadTerms() {
    try {
      const { data } = await supabase
        .from('terms')
        .select('*')
        .eq('module_id', module.id)
        .order('position');

      setTerms(data || []);
    } catch (error) {
      notify('Failed to load terms', 'err');
    }
  }

  async function loadSyllabusAttachments() {
    try {
      const { data, error } = await supabase
        .from('syllabus_attachments')
        .select('*')
        .eq('module_id', module.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSyllabusAttachments(data || []);
    } catch (error) {
      notify('Failed to load syllabus files', 'err');
    }
  }

  async function handleSyllabusFileUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);

    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `syllabus-attachments/${module.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('lesson-files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('lesson-files')
          .getPublicUrl(filePath);

        const { error: dbError } = await supabase
          .from('syllabus_attachments')
          .insert([{
            module_id: module.id,
            file_name: file.name,
            file_url: publicUrl,
            file_type: file.type,
            file_size: file.size
          }]);

        if (dbError) throw dbError;
      }

      await loadSyllabusAttachments();
      notify('Files uploaded successfully');
    } catch (error) {
      notify('Failed to upload files', 'err');
    } finally {
      setUploading(false);
      if (syllabusFileInputRef.current) syllabusFileInputRef.current.value = '';
    }
  }

  async function deleteSyllabusAttachment(attachmentId, fileUrl) {
    if (!window.confirm('Delete this file?')) return;

    try {
      const filePath = fileUrl.split('/lesson-files/')[1];

      await supabase.storage
        .from('lesson-files')
        .remove([filePath]);

      await supabase
        .from('syllabus_attachments')
        .delete()
        .eq('id', attachmentId);

      await loadSyllabusAttachments();
      notify('File deleted');
    } catch (error) {
      notify('Failed to delete file', 'err');
    }
  }

  async function saveChanges() {
    setBusy(true);
    try {
      const { error: moduleError } = await supabase
        .from('modules')
        .update({
          name,
          emoji,
          color,
          subject_type: subjectType,
          lesson_day: lessonDay,
          syllabus,
          custom_instructions: instructions,
          updated_at: new Date().toISOString()
        })
        .eq('id', module.id);

      if (moduleError) throw moduleError;

      for (const term of terms) {
        if (term.id) {
          await supabase
            .from('terms')
            .update({
              name: term.name,
              start_date: term.start_date,
              end_date: term.end_date,
              position: term.position
            })
            .eq('id', term.id);
        } else {
          await supabase
            .from('terms')
            .insert([{
              module_id: module.id,
              name: term.name,
              start_date: term.start_date,
              end_date: term.end_date,
              position: term.position
            }]);
        }
      }

      onUpdate({
        ...module,
        name,
        emoji,
        color,
        subject_type: subjectType,
        lesson_day: lessonDay,
        syllabus,
        custom_instructions: instructions
      });

      notify('Module updated successfully');
      onClose();
    } catch (error) {
      notify('Failed to update module', 'err');
    } finally {
      setBusy(false);
    }
  }

  function addTerm() {
    setTerms([...terms, {
      name: `Term ${terms.length + 1}`,
      start_date: '',
      end_date: '',
      position: terms.length
    }]);
  }

  function updateTerm(index, field, value) {
    const updated = [...terms];
    updated[index][field] = value;
    setTerms(updated);
  }

  async function removeTerm(index) {
    const term = terms[index];

    if (term.id) {
      if (!window.confirm('Delete this term? This will remove all associated lessons.')) return;

      try {
        await supabase.from('terms').delete().eq('id', term.id);
        notify('Term deleted');
      } catch (error) {
        notify('Failed to delete term', 'err');
        return;
      }
    }

    setTerms(terms.filter((_, i) => i !== index));
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      zIndex: 1000
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: 600,
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '32px 36px'
      }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
          <h2 style={{fontSize: 22, color: 'var(--ink)'}}>Edit Module</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
          <div>
            <label style={{fontSize: 13, fontWeight: 600, color: 'var(--ink2)', display: 'block', marginBottom: 7}}>
              Module Name
            </label>
            <input
              className="inp"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Spanish, Physics, History…"
            />
          </div>

          <div>
            <label style={{fontSize: 13, fontWeight: 600, color: 'var(--ink2)', display: 'block', marginBottom: 9}}>
              Icon
            </label>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: 7}}>
              {EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    border: emoji === e ? '2px solid var(--ink)' : '2px solid transparent',
                    background: emoji === e ? 'var(--paper2)' : 'transparent',
                    fontSize: 19,
                    cursor: 'pointer',
                    transition: 'all .12s'
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{fontSize: 13, fontWeight: 600, color: 'var(--ink2)', display: 'block', marginBottom: 9}}>
              Color
            </label>
            <div style={{display: 'flex', gap: 10}}>
              {MODULE_COLORS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setColor(c.id)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: c.accent,
                    cursor: 'pointer',
                    border: color === c.id ? '3px solid var(--ink)' : '3px solid transparent',
                    outline: color === c.id ? '2px solid var(--white)' : 'none',
                    outlineOffset: '-4px',
                    transition: 'all .12s'
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <label style={{fontSize: 13, fontWeight: 600, color: 'var(--ink2)', display: 'block', marginBottom: 9}}>
              Subject Type
            </label>
            <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
              {SUBJECT_TYPES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSubjectType(s.id)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: subjectType === s.id ? '2px solid var(--primary)' : '2px solid var(--paper3)',
                    background: subjectType === s.id ? 'var(--primary)' : 'var(--white)',
                    color: subjectType === s.id ? '#fff' : 'var(--ink)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    transition: 'all .15s',
                    textAlign: 'left',
                    fontSize: 14
                  }}
                >
                  <span style={{fontSize: 18}}>{s.icon}</span>
                  <span style={{fontWeight: 600}}>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{fontSize: 13, fontWeight: 600, color: 'var(--ink2)', display: 'block', marginBottom: 9}}>
              Lesson Day (optional)
            </label>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: 7}}>
              {DAYS.map(d => (
                <button
                  key={d}
                  onClick={() => setLessonDay(d)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    border: lessonDay === d ? '2px solid var(--primary)' : '2px solid var(--paper3)',
                    background: lessonDay === d ? 'var(--primary)' : 'var(--white)',
                    color: lessonDay === d ? '#fff' : 'var(--ink)',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                    transition: 'all .12s'
                  }}
                >
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10}}>
              <label style={{fontSize: 13, fontWeight: 600, color: 'var(--ink2)'}}>Terms</label>
              <button className="btn btn-ghost btn-sm" onClick={addTerm}>+ Add Term</button>
            </div>
            {terms.map((term, i) => (
              <div key={i} style={{marginBottom: 12, padding: '12px 14px', background: 'var(--paper2)', borderRadius: 8}}>
                <div style={{display: 'flex', gap: 10, marginBottom: 8, alignItems: 'center'}}>
                  <input
                    className="inp"
                    value={term.name}
                    onChange={(e) => updateTerm(i, 'name', e.target.value)}
                    placeholder="Term name"
                    style={{flex: 1}}
                  />
                  <button className="btn btn-danger btn-sm" onClick={() => removeTerm(i)}>×</button>
                </div>
                <div style={{display: 'flex', gap: 10}}>
                  <input
                    type="date"
                    className="inp"
                    value={term.start_date}
                    onChange={(e) => updateTerm(i, 'start_date', e.target.value)}
                    style={{flex: 1}}
                  />
                  <input
                    type="date"
                    className="inp"
                    value={term.end_date}
                    onChange={(e) => updateTerm(i, 'end_date', e.target.value)}
                    style={{flex: 1}}
                  />
                </div>
              </div>
            ))}
          </div>

          <div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7}}>
              <label style={{fontSize: 13, fontWeight: 600, color: 'var(--ink2)'}}>
                Syllabus (optional)
              </label>
              <input
                ref={syllabusFileInputRef}
                type="file"
                multiple
                onChange={handleSyllabusFileUpload}
                style={{display: 'none'}}
              />
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => syllabusFileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : '+ Add Files'}
              </button>
            </div>

            {syllabusAttachments.length > 0 && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                marginBottom: 10,
                padding: '10px 12px',
                background: 'var(--paper2)',
                borderRadius: 8
              }}>
                {syllabusAttachments.map(att => (
                  <div
                    key={att.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 8px',
                      background: 'var(--white)',
                      borderRadius: 6,
                      fontSize: 13
                    }}
                  >
                    <span style={{fontSize: 16}}>
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
                      <div style={{fontSize: 11, color: 'var(--ink3)'}}>
                        {(att.file_size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => window.open(att.file_url, '_blank')}
                      style={{padding: '4px 8px', fontSize: 11}}
                    >
                      View
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => deleteSyllabusAttachment(att.id, att.file_url)}
                      style={{padding: '4px 8px'}}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <textarea
              className="inp"
              value={syllabus}
              onChange={(e) => setSyllabus(e.target.value)}
              placeholder="Paste your syllabus or course outline here..."
              style={{height: 80, resize: 'vertical', lineHeight: 1.6}}
            />
          </div>

          <div>
            <label style={{fontSize: 13, fontWeight: 600, color: 'var(--ink2)', display: 'block', marginBottom: 7}}>
              Custom Instructions (optional)
            </label>
            <textarea
              className="inp"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Always extract vocab as a table"
              style={{height: 60, resize: 'vertical', lineHeight: 1.6}}
            />
          </div>

          <div style={{display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10}}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={saveChanges}
              disabled={!name || busy}
            >
              {busy ? (
                <>
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </>
              ) : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
