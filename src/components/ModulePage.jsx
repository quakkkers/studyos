import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { MODULE_COLORS, SUBJECT_TYPES, CALENDAR_VIEWS } from '../constants';
import ModuleEditor from './ModuleEditor';
import { generateLessonsFromTerms } from '../utils/lessonGenerator';

function col(colorId) {
  return MODULE_COLORS.find(c => c.id === colorId) || MODULE_COLORS[0];
}

export default function ModulePage({ mod, userId, onBack, onUpdate, onOpenLesson, notify }) {
  const [tab, setTab] = useState('overview');
  const [lessons, setLessons] = useState([]);
  const [terms, setTerms] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(mod.name);
  const [calendarView, setCalendarView] = useState('month');
  const [showEditModule, setShowEditModule] = useState(false);
  const [creatingLesson, setCreatingLesson] = useState(false);
  const [newLessonDate, setNewLessonDate] = useState('');
  const [showLessonDayConfig, setShowLessonDayConfig] = useState(false);
  const [tempLessonDay, setTempLessonDay] = useState(mod.lesson_day || '');
  const [generatingLessons, setGeneratingLessons] = useState(false);
  const [showCustomGenerate, setShowCustomGenerate] = useState(false);
  const [customTermName, setCustomTermName] = useState('');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [customLessonDay, setCustomLessonDay] = useState(mod.lesson_day || '');
  const [selectedLessons, setSelectedLessons] = useState(new Set());
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);

  const c = col(mod.color);

  useEffect(() => {
    loadTermsAndLessons();
  }, [mod.id]);

  async function loadTermsAndLessons() {
    try {
      const { data: termsData } = await supabase
        .from('terms')
        .select('*')
        .eq('module_id', mod.id)
        .order('position');

      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*')
        .eq('module_id', mod.id)
        .order('date');

      setTerms(termsData || []);
      setLessons(lessonsData || []);
    } catch (error) {
      notify('Failed to load data', 'err');
    }
  }

  async function saveModuleName() {
    try {
      const { error } = await supabase
        .from('modules')
        .update({ name: editName, updated_at: new Date().toISOString() })
        .eq('id', mod.id);

      if (error) throw error;
      onUpdate({ ...mod, name: editName });
      setEditing(false);
      notify('Module updated');
    } catch (error) {
      notify('Failed to update module', 'err');
    }
  }

  async function deleteModule() {
    if (!window.confirm(`Delete ${mod.name}? This will remove all lessons and notes.`)) return;

    try {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', mod.id);

      if (error) throw error;
      notify('Module deleted');
      onBack();
    } catch (error) {
      notify('Failed to delete module', 'err');
    }
  }

  async function deleteLesson(lessonId) {
    if (!window.confirm('Delete this lesson?')) return;

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;
      await loadTermsAndLessons();
      notify('Lesson deleted');
    } catch (error) {
      notify('Failed to delete lesson', 'err');
    }
  }

  function toggleLessonSelection(lessonId) {
    const newSelected = new Set(selectedLessons);
    if (newSelected.has(lessonId)) {
      newSelected.delete(lessonId);
    } else {
      newSelected.add(lessonId);
    }
    setSelectedLessons(newSelected);
  }

  function selectAllLessons() {
    const allIds = new Set(lessons.map(l => l.id));
    setSelectedLessons(allIds);
  }

  function deselectAllLessons() {
    setSelectedLessons(new Set());
  }

  async function bulkDeleteLessons() {
    if (selectedLessons.size === 0) return;

    if (!window.confirm(`Delete ${selectedLessons.size} selected lesson${selectedLessons.size > 1 ? 's' : ''}?`)) return;

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .in('id', Array.from(selectedLessons));

      if (error) throw error;

      notify(`Deleted ${selectedLessons.size} lesson${selectedLessons.size > 1 ? 's' : ''}`);
      setSelectedLessons(new Set());
      setBulkDeleteMode(false);
      await loadTermsAndLessons();
    } catch (error) {
      notify('Failed to delete lessons', 'err');
    }
  }

  async function createManualLesson() {
    if (!newLessonDate) {
      notify('Please select a date', 'err');
      return;
    }

    try {
      const nextLessonNumber = lessons.length + 1;

      const { data, error } = await supabase
        .from('lessons')
        .insert([{
          module_id: mod.id,
          term_id: null,
          lesson_number: nextLessonNumber,
          date: newLessonDate
        }])
        .select()
        .single();

      if (error) throw error;

      notify('Lesson created');
      setCreatingLesson(false);
      setNewLessonDate('');
      loadTermsAndLessons();
      onOpenLesson(data);
    } catch (error) {
      notify('Failed to create lesson', 'err');
    }
  }

  async function generateCustomLessons() {
    if (!customLessonDay) {
      notify('Please select a lesson day', 'err');
      return;
    }

    if (!customStartDate || !customEndDate) {
      notify('Please select start and end dates', 'err');
      return;
    }

    if (new Date(customEndDate) < new Date(customStartDate)) {
      notify('End date must be after start date', 'err');
      return;
    }

    setGeneratingLessons(true);

    try {
      let termId = null;

      if (customTermName.trim()) {
        const { data: newTerm, error: termError } = await supabase
          .from('terms')
          .insert([{
            module_id: mod.id,
            name: customTermName.trim(),
            start_date: customStartDate,
            end_date: customEndDate,
            position: terms.length
          }])
          .select()
          .single();

        if (termError) throw termError;
        termId = newTerm.id;
      }

      const fakeTerm = {
        id: termId,
        start_date: customStartDate,
        end_date: customEndDate
      };

      const lessonsToCreate = generateLessonsFromTerms([fakeTerm], customLessonDay);

      if (lessonsToCreate.length === 0) {
        notify('No lessons to generate in this date range', 'err');
        setGeneratingLessons(false);
        return;
      }

      const existingDates = new Set(lessons.map(l => l.date));
      const newLessons = lessonsToCreate.filter(l => !existingDates.has(l.date));

      if (newLessons.length === 0) {
        notify('All lessons already exist for these dates');
        setGeneratingLessons(false);
        return;
      }

      const maxLessonNumber = lessons.length > 0
        ? Math.max(...lessons.map(l => l.lesson_number || 0))
        : 0;

      const lessonInserts = newLessons.map((l, index) => ({
        module_id: mod.id,
        term_id: termId,
        lesson_number: maxLessonNumber + index + 1,
        date: l.date
      }));

      const { error } = await supabase
        .from('lessons')
        .insert(lessonInserts);

      if (error) throw error;

      notify(`Generated ${newLessons.length} new lessons`);
      setShowCustomGenerate(false);
      setCustomTermName('');
      setCustomStartDate('');
      setCustomEndDate('');
      setCustomLessonDay(mod.lesson_day || '');
      await loadTermsAndLessons();
    } catch (error) {
      notify('Failed to generate lessons', 'err');
    } finally {
      setGeneratingLessons(false);
    }
  }

  async function saveLessonDay() {
    try {
      const { error } = await supabase
        .from('modules')
        .update({ lesson_day: tempLessonDay, updated_at: new Date().toISOString() })
        .eq('id', mod.id);

      if (error) throw error;

      if (tempLessonDay && terms.length > 0) {
        const lessonsToCreate = generateLessonsFromTerms(terms, tempLessonDay);

        if (lessonsToCreate.length > 0) {
          const existingDates = new Set(lessons.map(l => l.date));
          const newLessons = lessonsToCreate.filter(l => !existingDates.has(l.date));

          if (newLessons.length > 0) {
            const maxLessonNumber = lessons.length > 0
              ? Math.max(...lessons.map(l => l.lesson_number || 0))
              : 0;

            const lessonInserts = newLessons.map((l, index) => ({
              module_id: mod.id,
              term_id: l.term_id,
              lesson_number: maxLessonNumber + index + 1,
              date: l.date
            }));

            const { error: insertError } = await supabase
              .from('lessons')
              .insert(lessonInserts);

            if (insertError) throw insertError;

            notify(`Generated ${newLessons.length} new lessons`);
          } else {
            notify('No new lessons to generate');
          }
        }
      }

      onUpdate({ ...mod, lesson_day: tempLessonDay });
      setShowLessonDayConfig(false);
      await loadTermsAndLessons();
    } catch (error) {
      notify('Failed to update lesson day', 'err');
    }
  }

  const upcoming = lessons.filter(l => new Date(l.date) >= new Date()).slice(0, 6);
  const past = lessons.filter(l => new Date(l.date) < new Date()).sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div style={{minHeight:"100vh",background:"var(--paper)",display:"flex",flexDirection:"column"}}>
      {showEditModule && (
        <ModuleEditor
          module={mod}
          onClose={() => {
            setShowEditModule(false);
            loadTermsAndLessons();
          }}
          onUpdate={(updated) => {
            onUpdate(updated);
            loadTermsAndLessons();
          }}
          notify={notify}
        />
      )}

      <header style={{background:"var(--white)",borderBottom:"1px solid var(--paper2)"}}>
        <div style={{padding:"14px 36px",display:"flex",alignItems:"center",gap:14}}>
          <button className="btn btn-ghost btn-sm" onClick={onBack}>← Dashboard</button>
          <div style={{flex:1}} />
          {editing ? (
            <>
              <input
                className="inp"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{width:200}}
              />
              <button className="btn btn-primary btn-sm" onClick={saveModuleName}>Save</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowEditModule(true)}>⚙️ Edit Module</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>✏️ Edit Name</button>
              <button className="btn btn-danger btn-sm" onClick={deleteModule}>🗑️ Delete</button>
            </>
          )}
        </div>

        <div style={{padding:"22px 36px 0",borderTop:`3px solid ${c.accent}`}}>
          <div style={{display:"flex",alignItems:"flex-end",gap:18,marginBottom:14}}>
            <span style={{fontSize:48}}>{mod.emoji}</span>
            <div>
              <h1 style={{fontSize:30,letterSpacing:"-0.4px",color:"var(--ink)",marginBottom:5}}>{mod.name}</h1>
              <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                <span className="tag" style={{background:c.bg,color:c.text}}>
                  {SUBJECT_TYPES.find(s => s.id === mod.subject_type)?.label}
                </span>
                {mod.lesson_day && <span style={{fontSize:12,color:"var(--ink3)"}}>📅 Every {mod.lesson_day}</span>}
              </div>
            </div>
          </div>

          <div style={{display:"flex",gap:0,borderTop:"1px solid var(--paper2)",marginTop:4}}>
            {[
              ["overview", "🗓 Overview"],
              ["lessons", "📝 Lessons"],
              ["calendar", "📅 Calendar"]
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
        </div>
      </header>

      <main style={{flex:1,padding:"28px 36px",maxWidth:960,margin:"0 auto",width:"100%"}}>
        {tab === 'overview' && (
          <div>
            {upcoming.length > 0 && (
              <section className="fu2" style={{marginBottom:32}}>
                <p style={{fontSize:11,fontWeight:700,color:"var(--ink3)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:14}}>
                  Upcoming Lessons
                </p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12}}>
                  {upcoming.map(l => (
                    <div
                      key={l.id}
                      onClick={() => onOpenLesson(l)}
                      className="card"
                      style={{padding:"15px 16px",cursor:"pointer",transition:"all .2s"}}
                    >
                      <div style={{fontFamily:"Lora,serif",fontSize:22,color:"var(--ink)",lineHeight:1}}>
                        {new Date(l.date).getDate()}
                      </div>
                      <div style={{fontSize:12,color:"var(--ink3)",marginTop:3}}>
                        {new Date(l.date).toLocaleDateString('en-GB', {weekday:'short', month:'short'})}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section className="fu3">
                <p style={{fontSize:11,fontWeight:700,color:"var(--ink3)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:14}}>
                  Recent Lessons
                </p>
                {past.slice(0, 5).map(l => (
                  <div
                    key={l.id}
                    onClick={() => onOpenLesson(l)}
                    className="card"
                    style={{padding:"16px 20px",cursor:"pointer",display:"flex",gap:15,alignItems:"center",marginBottom:10}}
                  >
                    <div style={{minWidth:50,textAlign:"center",padding:"7px 10px",background:c.bg,borderRadius:8}}>
                      <div style={{fontFamily:"Lora,serif",fontSize:18,color:c.text,lineHeight:1}}>
                        {new Date(l.date).getDate()}
                      </div>
                      <div style={{fontSize:10,color:c.text,opacity:.75}}>
                        {new Date(l.date).toLocaleDateString('en-GB', {month:'short'})}
                      </div>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600,color:"var(--ink)"}}>
                        {new Date(l.date).toLocaleDateString('en-GB', {weekday:'long', day:'numeric', month:'long'})}
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {lessons.length === 0 && (
              <div className="card" style={{padding:"48px 32px",textAlign:"center"}}>
                <div style={{fontSize:44,marginBottom:14}}>📅</div>
                <h3 style={{fontSize:19,marginBottom:8}}>No lessons yet</h3>
                <p style={{color:"var(--ink3)",fontSize:14}}>Add terms with dates to generate lessons automatically.</p>
              </div>
            )}
          </div>
        )}

        {tab === 'lessons' && (
          <div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14}}>
              <p style={{fontSize:11,fontWeight:700,color:"var(--ink3)",textTransform:"uppercase",letterSpacing:"0.1em",margin:0}}>
                All Lessons
              </p>
              <div style={{display:'flex', gap:8}}>
                {bulkDeleteMode ? (
                  <>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={selectAllLessons}
                    >
                      Select All
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={deselectAllLessons}
                    >
                      Deselect All
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={bulkDeleteLessons}
                      disabled={selectedLessons.size === 0}
                    >
                      Delete {selectedLessons.size > 0 ? `(${selectedLessons.size})` : ''}
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setBulkDeleteMode(false);
                        setSelectedLessons(new Set());
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    {lessons.length > 0 && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setBulkDeleteMode(true)}
                      >
                        Bulk Delete
                      </button>
                    )}
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setShowLessonDayConfig(true)}
                    >
                      Set Lesson Day
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setShowCustomGenerate(true)}
                    >
                      🔄 Generate Lessons
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setCreatingLesson(true)}
                    >
                      + Add Lesson
                    </button>
                  </>
                )}
              </div>
            </div>

            {showLessonDayConfig && (
              <div className="card" style={{padding:'20px', marginBottom:14, background:'var(--paper)'}}>
                <h3 style={{fontSize:16, marginBottom:12, color:'var(--ink)'}}>Set Recurring Lesson Day</h3>
                <p style={{fontSize:13, color:'var(--ink3)', marginBottom:14}}>
                  Choose which day of the week lessons occur. If you have terms configured, lessons will be automatically generated for all matching days within those term dates.
                </p>
                <div style={{display:'flex', gap:10, alignItems:'center'}}>
                  <select
                    className="inp"
                    value={tempLessonDay}
                    onChange={(e) => setTempLessonDay(e.target.value)}
                    style={{flex:1}}
                  >
                    <option value="">Select day...</option>
                    <option value="monday">Monday</option>
                    <option value="tuesday">Tuesday</option>
                    <option value="wednesday">Wednesday</option>
                    <option value="thursday">Thursday</option>
                    <option value="friday">Friday</option>
                    <option value="saturday">Saturday</option>
                    <option value="sunday">Sunday</option>
                  </select>
                  <button
                    className="btn btn-primary"
                    onClick={saveLessonDay}
                    disabled={!tempLessonDay}
                  >
                    {terms.length > 0 ? 'Save & Generate' : 'Save'}
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      setShowLessonDayConfig(false);
                      setTempLessonDay(mod.lesson_day || '');
                    }}
                  >
                    Cancel
                  </button>
                </div>
                {terms.length === 0 && (
                  <p style={{fontSize:12, color:'var(--ink3)', marginTop:10, fontStyle:'italic'}}>
                    Note: You need to add terms first (via Edit Module) to auto-generate lessons.
                  </p>
                )}
              </div>
            )}

            {showCustomGenerate && (
              <div className="card" style={{padding:'24px', marginBottom:14, background:'var(--white)', border:'2px solid var(--paper2)'}}>
                <h3 style={{fontSize:17, marginBottom:8, color:'var(--ink)'}}>Generate Recurring Lessons</h3>
                <p style={{fontSize:13, color:'var(--ink3)', marginBottom:20}}>
                  Create lessons for a specific date range based on a recurring day of the week.
                </p>

                <div style={{display:'grid', gap:16}}>
                  <div>
                    <label style={{display:'block', fontSize:12, fontWeight:600, color:'var(--ink2)', marginBottom:6}}>
                      Term Name (optional)
                    </label>
                    <input
                      type="text"
                      className="inp"
                      value={customTermName}
                      onChange={(e) => setCustomTermName(e.target.value)}
                      placeholder="e.g., Term 2, Spring Semester..."
                      style={{width:'100%'}}
                    />
                    <p style={{fontSize:11, color:'var(--ink3)', marginTop:4}}>
                      If provided, a new term will be created and lessons will be linked to it.
                    </p>
                  </div>

                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                    <div>
                      <label style={{display:'block', fontSize:12, fontWeight:600, color:'var(--ink2)', marginBottom:6}}>
                        Start Date *
                      </label>
                      <input
                        type="date"
                        className="inp"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        style={{width:'100%'}}
                      />
                    </div>
                    <div>
                      <label style={{display:'block', fontSize:12, fontWeight:600, color:'var(--ink2)', marginBottom:6}}>
                        End Date *
                      </label>
                      <input
                        type="date"
                        className="inp"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        style={{width:'100%'}}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{display:'block', fontSize:12, fontWeight:600, color:'var(--ink2)', marginBottom:6}}>
                      Lesson Day *
                    </label>
                    <select
                      className="inp"
                      value={customLessonDay}
                      onChange={(e) => setCustomLessonDay(e.target.value)}
                      style={{width:'100%'}}
                    >
                      <option value="">Select day...</option>
                      <option value="monday">Monday</option>
                      <option value="tuesday">Tuesday</option>
                      <option value="wednesday">Wednesday</option>
                      <option value="thursday">Thursday</option>
                      <option value="friday">Friday</option>
                      <option value="saturday">Saturday</option>
                      <option value="sunday">Sunday</option>
                    </select>
                  </div>
                </div>

                <div style={{display:'flex', gap:10, marginTop:20, justifyContent:'flex-end'}}>
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      setShowCustomGenerate(false);
                      setCustomTermName('');
                      setCustomStartDate('');
                      setCustomEndDate('');
                      setCustomLessonDay(mod.lesson_day || '');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={generateCustomLessons}
                    disabled={!customLessonDay || !customStartDate || !customEndDate || generatingLessons}
                  >
                    {generatingLessons ? 'Generating...' : 'Generate Lessons'}
                  </button>
                </div>
              </div>
            )}

            {creatingLesson && (
              <div className="card" style={{padding:'20px', marginBottom:14, background:'var(--paper)'}}>
                <h3 style={{fontSize:16, marginBottom:12, color:'var(--ink)'}}>Create New Lesson</h3>
                <p style={{fontSize:13, color:'var(--ink3)', marginBottom:14}}>
                  Add a single lesson manually by selecting a specific date.
                </p>
                <div style={{display:'flex', gap:10, alignItems:'center'}}>
                  <input
                    type="date"
                    className="inp"
                    value={newLessonDate}
                    onChange={(e) => setNewLessonDate(e.target.value)}
                    style={{flex:1}}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={createManualLesson}
                    disabled={!newLessonDate}
                  >
                    Create
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      setCreatingLesson(false);
                      setNewLessonDate('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {lessons.length === 0 && !creatingLesson && !showLessonDayConfig && (
              <div className="card" style={{padding:"48px 32px",textAlign:"center"}}>
                <div style={{fontSize:44,marginBottom:14}}>📚</div>
                <h3 style={{fontSize:19,marginBottom:8}}>No lessons yet</h3>
                <p style={{color:"var(--ink3)",fontSize:14,marginBottom:20}}>
                  Set a lesson day and add terms to auto-generate lessons, or create them manually one by one.
                </p>
                <div style={{display:'flex', gap:10, justifyContent:'center'}}>
                  <button
                    className="btn btn-ghost"
                    onClick={() => setShowLessonDayConfig(true)}
                  >
                    Set Lesson Day
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => setCreatingLesson(true)}
                  >
                    + Create Lesson
                  </button>
                </div>
              </div>
            )}

            {lessons.map(l => (
              <div
                key={l.id}
                className="card"
                style={{
                  padding:"16px 20px",
                  marginBottom:10,
                  display:"flex",
                  alignItems:"center",
                  gap:15,
                  background: bulkDeleteMode && selectedLessons.has(l.id) ? c.bg : 'var(--white)',
                  border: bulkDeleteMode && selectedLessons.has(l.id) ? `2px solid ${c.text}` : '1px solid var(--paper2)',
                  transition: 'all 0.15s ease'
                }}
              >
                {bulkDeleteMode && (
                  <input
                    type="checkbox"
                    checked={selectedLessons.has(l.id)}
                    onChange={() => toggleLessonSelection(l.id)}
                    style={{
                      width:18,
                      height:18,
                      cursor:'pointer',
                      accentColor: c.text
                    }}
                  />
                )}
                <div
                  onClick={() => bulkDeleteMode ? toggleLessonSelection(l.id) : onOpenLesson(l)}
                  style={{flex:1,cursor:"pointer",display:"flex",gap:15,alignItems:"center"}}
                >
                  <div style={{minWidth:50,textAlign:"center",padding:"7px 10px",background:c.bg,borderRadius:8}}>
                    <div style={{fontFamily:"Lora,serif",fontSize:18,color:c.text,lineHeight:1}}>
                      {new Date(l.date).getDate()}
                    </div>
                    <div style={{fontSize:10,color:c.text,opacity:.75}}>
                      {new Date(l.date).toLocaleDateString('en-GB', {month:'short'})}
                    </div>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:"var(--ink)"}}>
                      {new Date(l.date).toLocaleDateString('en-GB', {weekday:'long', day:'numeric', month:'long'})}
                    </div>
                  </div>
                </div>
                {!bulkDeleteMode && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteLesson(l.id);
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'calendar' && (
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <p style={{fontSize:11,fontWeight:700,color:"var(--ink3)",textTransform:"uppercase",letterSpacing:"0.1em"}}>
                Calendar View
              </p>
              <div style={{display:"flex",gap:8}}>
                {CALENDAR_VIEWS.map(v => (
                  <button
                    key={v.id}
                    className={`btn btn-sm ${calendarView === v.id ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setCalendarView(v.id)}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
            <CalendarView lessons={lessons} view={calendarView} onOpenLesson={onOpenLesson} />
          </div>
        )}
      </main>
    </div>
  );
}

function CalendarView({ lessons, view, onOpenLesson }) {
  if (view === 'year') {
    const months = {};
    lessons.forEach(l => {
      const month = new Date(l.date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      if (!months[month]) months[month] = [];
      months[month].push(l);
    });

    return (
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:16}}>
        {Object.entries(months).map(([month, monthLessons]) => (
          <div key={month} className="card" style={{padding:"16px 18px"}}>
            <h3 style={{fontSize:15,marginBottom:12,color:"var(--ink)"}}>{month}</h3>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {monthLessons.map(l => (
                <div
                  key={l.id}
                  onClick={() => onOpenLesson(l)}
                  style={{fontSize:13,color:"var(--ink2)",cursor:"pointer",padding:"6px 8px",borderRadius:6,background:"var(--paper2)"}}
                >
                  {new Date(l.date).getDate()} {new Date(l.date).toLocaleDateString('en-GB', {weekday:'short'})}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {lessons.map(l => (
        <div
          key={l.id}
          onClick={() => onOpenLesson(l)}
          className="card"
          style={{padding:"14px 18px",cursor:"pointer",display:"flex",gap:12,alignItems:"center"}}
        >
          <div style={{fontSize:13,fontWeight:600,color:"var(--ink)",minWidth:120}}>
            {new Date(l.date).toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric'})}
          </div>
          <div style={{fontSize:13,color:"var(--ink3)"}}>
            {new Date(l.date).toLocaleDateString('en-GB', {weekday:'long'})}
          </div>
        </div>
      ))}
    </div>
  );
}
