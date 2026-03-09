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
  const [showGenerateLessons, setShowGenerateLessons] = useState(false);
  const [generateLessonDay, setGenerateLessonDay] = useState(mod.lesson_day || '');
  const [generateStartDate, setGenerateStartDate] = useState('');
  const [generateEndDate, setGenerateEndDate] = useState('');
  const [generatingLessons, setGeneratingLessons] = useState(false);
  const [selectedLessons, setSelectedLessons] = useState(new Set());

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

  async function generateLessons() {
    if (!generateLessonDay) {
      notify('Please select a lesson day', 'err');
      return;
    }

    if (!generateStartDate || !generateEndDate) {
      notify('Please select start and end dates', 'err');
      return;
    }

    if (new Date(generateEndDate) < new Date(generateStartDate)) {
      notify('End date must be after start date', 'err');
      return;
    }

    setGeneratingLessons(true);

    try {
      const fakeTerm = {
        id: null,
        start_date: generateStartDate,
        end_date: generateEndDate
      };

      const lessonsToCreate = generateLessonsFromTerms([fakeTerm], generateLessonDay);

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
        term_id: null,
        lesson_number: maxLessonNumber + index + 1,
        date: l.date
      }));

      const { error } = await supabase
        .from('lessons')
        .insert(lessonInserts);

      if (error) throw error;

      notify(`Generated ${newLessons.length} new lessons`);
      setShowGenerateLessons(false);
      setGenerateStartDate('');
      setGenerateEndDate('');
      setGenerateLessonDay(mod.lesson_day || '');
      await loadTermsAndLessons();
    } catch (error) {
      notify('Failed to generate lessons', 'err');
    } finally {
      setGeneratingLessons(false);
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
            {lessons.length > 0 && (
              <section className="fu2" style={{marginBottom:32}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <p style={{fontSize:11,fontWeight:700,color:"var(--ink3)",textTransform:"uppercase",letterSpacing:"0.1em"}}>
                    Lesson Overview
                  </p>
                  <p style={{fontSize:12,color:"var(--ink4)"}}>
                    {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="card" style={{padding:0,overflow:"hidden"}}>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse"}}>
                      <thead>
                        <tr style={{background:"var(--paper2)",borderBottom:"2px solid var(--paper3)"}}>
                          <th style={{padding:"14px 18px",textAlign:"left",fontSize:12,fontWeight:700,color:"var(--ink2)",textTransform:"uppercase",letterSpacing:"0.05em"}}>
                            Date
                          </th>
                          <th style={{padding:"14px 18px",textAlign:"left",fontSize:12,fontWeight:700,color:"var(--ink2)",textTransform:"uppercase",letterSpacing:"0.05em"}}>
                            Topic
                          </th>
                          <th style={{padding:"14px 18px",textAlign:"left",fontSize:12,fontWeight:700,color:"var(--ink2)",textTransform:"uppercase",letterSpacing:"0.05em"}}>
                            Key Points
                          </th>
                          <th style={{padding:"14px 18px",textAlign:"center",fontSize:12,fontWeight:700,color:"var(--ink2)",textTransform:"uppercase",letterSpacing:"0.05em",width:80}}>
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {lessons.map((l, idx) => {
                          const lessonDate = new Date(l.date);
                          const isToday = lessonDate.toDateString() === new Date().toDateString();
                          const isPast = lessonDate < new Date() && !isToday;
                          const hasNotes = l.structured_notes || l.raw_notes;
                          const keyConcepts = l.key_concepts || [];

                          return (
                            <tr
                              key={l.id}
                              onClick={() => onOpenLesson(l)}
                              style={{
                                borderBottom:"1px solid var(--paper2)",
                                cursor:"pointer",
                                background: isToday ? "var(--sky-bg)" : "transparent",
                                transition:"background 0.15s"
                              }}
                              onMouseEnter={(e) => {
                                if (!isToday) e.currentTarget.style.background = "var(--paper)";
                              }}
                              onMouseLeave={(e) => {
                                if (!isToday) e.currentTarget.style.background = "transparent";
                              }}
                            >
                              <td style={{padding:"16px 18px",fontSize:13,color:isPast ? "var(--ink4)" : "var(--ink)",fontWeight:500,verticalAlign:"top"}}>
                                <div>{lessonDate.toLocaleDateString('en-US', {month:'short', day:'numeric'})}</div>
                                <div style={{fontSize:11,color:"var(--ink4)",marginTop:2}}>
                                  {lessonDate.toLocaleDateString('en-US', {weekday:'short'})}
                                </div>
                              </td>
                              <td style={{padding:"16px 18px",fontSize:14,color:isPast ? "var(--ink3)" : "var(--ink2)",fontWeight:500,verticalAlign:"top"}}>
                                {l.topic || `Lesson ${l.lesson_number}`}
                              </td>
                              <td style={{padding:"16px 18px",fontSize:13,color:"var(--ink3)",lineHeight:1.6,verticalAlign:"top"}}>
                                {l.ai_summary ? (
                                  <div style={{maxWidth:500}}>{l.ai_summary}</div>
                                ) : keyConcepts.length > 0 ? (
                                  <ul style={{margin:0,paddingLeft:20}}>
                                    {keyConcepts.slice(0,3).map((concept, i) => (
                                      <li key={i} style={{marginBottom:4}}>{concept}</li>
                                    ))}
                                    {keyConcepts.length > 3 && (
                                      <li style={{color:"var(--ink4)",fontStyle:"italic"}}>+{keyConcepts.length - 3} more</li>
                                    )}
                                  </ul>
                                ) : hasNotes ? (
                                  <span style={{fontStyle:"italic",color:"var(--ink4)"}}>Click to view notes</span>
                                ) : (
                                  <span style={{fontStyle:"italic",color:"var(--ink4)"}}>No notes yet</span>
                                )}
                              </td>
                              <td style={{padding:"16px 18px",textAlign:"center",verticalAlign:"top"}}>
                                {isToday ? (
                                  <span className="tag" style={{background:"var(--sky)",color:"var(--sky-text)",fontSize:10}}>
                                    Today
                                  </span>
                                ) : isPast ? (
                                  hasNotes ? (
                                    <span style={{fontSize:18}}>✅</span>
                                  ) : (
                                    <span style={{fontSize:18,opacity:0.3}}>⭕</span>
                                  )
                                ) : (
                                  <span style={{fontSize:18,opacity:0.2}}>⏳</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {upcoming.length > 0 && (
              <section className="fu2" style={{marginBottom:32}}>
                <p style={{fontSize:11,fontWeight:700,color:"var(--ink3)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:14}}>
                  Upcoming This Week
                </p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12}}>
                  {upcoming.slice(0, 7).map(l => (
                    <div
                      key={l.id}
                      onClick={() => onOpenLesson(l)}
                      className="card"
                      style={{padding:"15px 16px",cursor:"pointer",transition:"all .2s",borderTop:`3px solid ${c.accent}`}}
                    >
                      <div style={{fontFamily:"Lora,serif",fontSize:22,color:"var(--ink)",lineHeight:1}}>
                        {new Date(l.date).getDate()}
                      </div>
                      <div style={{fontSize:12,color:"var(--ink3)",marginTop:3}}>
                        {new Date(l.date).toLocaleDateString('en-US', {weekday:'short', month:'short'})}
                      </div>
                      {l.topic && (
                        <div style={{fontSize:11,color:"var(--ink2)",marginTop:8,fontWeight:500}}>
                          {l.topic.length > 20 ? l.topic.substring(0,20) + '...' : l.topic}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
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
                {selectedLessons.size > 0 ? (
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
                    >
                      Delete ({selectedLessons.size})
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setSelectedLessons(new Set())}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    {lessons.length > 0 && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={selectAllLessons}
                      >
                        Select
                      </button>
                    )}
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setShowGenerateLessons(true)}
                    >
                      Generate Lessons
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

            {showGenerateLessons && (
              <div className="card" style={{padding:'24px', marginBottom:14, background:'var(--white)', border:'2px solid var(--paper2)'}}>
                <h3 style={{fontSize:17, marginBottom:8, color:'var(--ink)'}}>Generate Recurring Lessons</h3>
                <p style={{fontSize:13, color:'var(--ink3)', marginBottom:20}}>
                  Create lessons for a specific date range based on a recurring day of the week.
                </p>

                <div style={{display:'grid', gap:16}}>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                    <div>
                      <label style={{display:'block', fontSize:12, fontWeight:600, color:'var(--ink2)', marginBottom:6}}>
                        Start Date
                      </label>
                      <input
                        type="date"
                        className="inp"
                        value={generateStartDate}
                        onChange={(e) => setGenerateStartDate(e.target.value)}
                        style={{width:'100%'}}
                      />
                    </div>
                    <div>
                      <label style={{display:'block', fontSize:12, fontWeight:600, color:'var(--ink2)', marginBottom:6}}>
                        End Date
                      </label>
                      <input
                        type="date"
                        className="inp"
                        value={generateEndDate}
                        onChange={(e) => setGenerateEndDate(e.target.value)}
                        style={{width:'100%'}}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{display:'block', fontSize:12, fontWeight:600, color:'var(--ink2)', marginBottom:6}}>
                      Lesson Day
                    </label>
                    <select
                      className="inp"
                      value={generateLessonDay}
                      onChange={(e) => setGenerateLessonDay(e.target.value)}
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
                      setShowGenerateLessons(false);
                      setGenerateStartDate('');
                      setGenerateEndDate('');
                      setGenerateLessonDay(mod.lesson_day || '');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={generateLessons}
                    disabled={!generateLessonDay || !generateStartDate || !generateEndDate || generatingLessons}
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

            {lessons.length === 0 && !creatingLesson && !showGenerateLessons && (
              <div className="card" style={{padding:"48px 32px",textAlign:"center"}}>
                <div style={{fontSize:44,marginBottom:14}}>📚</div>
                <h3 style={{fontSize:19,marginBottom:8}}>No lessons yet</h3>
                <p style={{color:"var(--ink3)",fontSize:14,marginBottom:20}}>
                  Generate recurring lessons or create them manually one by one.
                </p>
                <div style={{display:'flex', gap:10, justifyContent:'center'}}>
                  <button
                    className="btn btn-ghost"
                    onClick={() => setShowGenerateLessons(true)}
                  >
                    Generate Lessons
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
                  background: selectedLessons.has(l.id) ? c.bg : 'var(--white)',
                  border: selectedLessons.has(l.id) ? `2px solid ${c.text}` : '1px solid var(--paper2)',
                  transition: 'all 0.15s ease'
                }}
              >
                {selectedLessons.size > 0 && (
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
                  onClick={() => selectedLessons.size > 0 ? toggleLessonSelection(l.id) : onOpenLesson(l)}
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
                {selectedLessons.size === 0 && (
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
  const now = new Date();
  const sortedLessons = [...lessons].sort((a, b) => new Date(a.date) - new Date(b.date));

  if (view === 'year') {
    const yearMonths = {};
    sortedLessons.forEach(l => {
      const d = new Date(l.date);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      const monthYear = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!yearMonths[key]) yearMonths[key] = { label: monthYear, lessons: [], date: d };
      yearMonths[key].lessons.push(l);
    });

    const sortedMonths = Object.entries(yearMonths).sort((a, b) => new Date(a[1].date) - new Date(b[1].date));

    return (
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
        {sortedMonths.map(([key, data]) => (
          <div key={key} className="card" style={{padding:"18px 20px"}}>
            <h3 style={{fontSize:16,marginBottom:14,color:"var(--ink)",fontWeight:600}}>{data.label}</h3>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {data.lessons.map(l => {
                const lessonDate = new Date(l.date);
                const isToday = lessonDate.toDateString() === now.toDateString();
                const isPast = lessonDate < now && !isToday;

                return (
                  <div
                    key={l.id}
                    onClick={() => onOpenLesson(l)}
                    style={{
                      fontSize:13,
                      color: isPast ? "var(--ink4)" : "var(--ink2)",
                      cursor:"pointer",
                      padding:"10px 12px",
                      borderRadius:8,
                      background: isToday ? "var(--primary)" : "var(--paper2)",
                      border: isToday ? "none" : "1px solid var(--paper3)",
                      fontWeight: isToday ? 500 : 400,
                      display:"flex",
                      justifyContent:"space-between",
                      alignItems:"center",
                      transition: "all 0.15s"
                    }}
                    onMouseEnter={(e) => {
                      if (!isToday) {
                        e.currentTarget.style.background = "var(--paper3)";
                        e.currentTarget.style.borderColor = "var(--ink4)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isToday) {
                        e.currentTarget.style.background = "var(--paper2)";
                        e.currentTarget.style.borderColor = "var(--paper3)";
                      }
                    }}
                  >
                    <span style={{color: isToday ? "#fff" : "inherit"}}>
                      {lessonDate.toLocaleDateString('en-US', {weekday:'short', day:'numeric'})}
                    </span>
                    {isToday && <span style={{fontSize:11,color:"#fff",opacity:0.9}}>Today</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (view === 'month') {
    const monthWeeks = {};
    sortedLessons.forEach(l => {
      const d = new Date(l.date);
      const startOfYear = new Date(d.getFullYear(), 0, 1);
      const weekNum = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
      const monthYear = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const weekKey = `${monthYear} - Week ${weekNum}`;

      if (!monthWeeks[weekKey]) monthWeeks[weekKey] = { lessons: [], minDate: d };
      monthWeeks[weekKey].lessons.push(l);
      if (d < monthWeeks[weekKey].minDate) monthWeeks[weekKey].minDate = d;
    });

    const sortedWeeks = Object.entries(monthWeeks).sort((a, b) => a[1].minDate - b[1].minDate);

    return (
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        {sortedWeeks.map(([weekLabel, data]) => (
          <div key={weekLabel}>
            <p style={{fontSize:12,fontWeight:600,color:"var(--ink3)",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.05em"}}>
              {weekLabel}
            </p>
            <div style={{display:"grid",gap:10}}>
              {data.lessons.map(l => {
                const lessonDate = new Date(l.date);
                const isToday = lessonDate.toDateString() === now.toDateString();
                const isPast = lessonDate < now && !isToday;

                return (
                  <div
                    key={l.id}
                    onClick={() => onOpenLesson(l)}
                    className="card"
                    style={{
                      padding:"16px 20px",
                      cursor:"pointer",
                      display:"flex",
                      gap:16,
                      alignItems:"center",
                      borderLeft: isToday ? "4px solid var(--primary)" : isPast ? "4px solid var(--paper3)" : "4px solid var(--sky)",
                      background: isToday ? "var(--paper2)" : "var(--white)"
                    }}
                  >
                    <div style={{minWidth:90}}>
                      <div style={{fontSize:15,fontWeight:600,color: isPast ? "var(--ink4)" : "var(--ink)"}}>
                        {lessonDate.toLocaleDateString('en-US', {month:'short', day:'numeric'})}
                      </div>
                      <div style={{fontSize:12,color: isPast ? "var(--ink4)" : "var(--ink3)",marginTop:2}}>
                        {lessonDate.toLocaleDateString('en-US', {weekday:'short'})}
                      </div>
                    </div>
                    <div style={{flex:1,fontSize:13,color: isPast ? "var(--ink4)" : "var(--ink2)"}}>
                      {l.topic || 'Lesson'}
                    </div>
                    {isToday && (
                      <span className="tag" style={{background:"var(--primary)",color:"#fff",fontSize:11}}>
                        Today
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const weekGroups = {};
  sortedLessons.forEach(l => {
    const d = new Date(l.date);
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - d.getDay());
    const weekKey = startOfWeek.toISOString().split('T')[0];

    if (!weekGroups[weekKey]) {
      weekGroups[weekKey] = {
        start: new Date(startOfWeek),
        lessons: []
      };
    }
    weekGroups[weekKey].lessons.push(l);
  });

  const sortedWeeks = Object.entries(weekGroups).sort((a, b) => a[1].start - b[1].start);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {sortedWeeks.map(([key, data]) => {
        const weekEnd = new Date(data.start);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const weekLabel = `${data.start.toLocaleDateString('en-US', {month:'short', day:'numeric'})} - ${weekEnd.toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'})}`;

        return (
          <div key={key}>
            <p style={{fontSize:13,fontWeight:600,color:"var(--ink2)",marginBottom:12}}>
              {weekLabel}
            </p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8}}>
              {[0,1,2,3,4,5,6].map(dayOffset => {
                const date = new Date(data.start);
                date.setDate(date.getDate() + dayOffset);
                const dateStr = date.toISOString().split('T')[0];
                const dayLessons = data.lessons.filter(l => l.date === dateStr);
                const isToday = date.toDateString() === now.toDateString();
                const isPast = date < now && !isToday;

                return (
                  <div
                    key={dayOffset}
                    style={{
                      padding:"12px 8px",
                      borderRadius:8,
                      background: isToday ? "var(--primary)" : dayLessons.length > 0 ? "var(--sky)" : "var(--paper2)",
                      border: "1px solid",
                      borderColor: isToday ? "var(--primary)" : dayLessons.length > 0 ? "var(--sky)" : "var(--paper3)",
                      minHeight:80,
                      cursor: dayLessons.length > 0 ? "pointer" : "default",
                      opacity: isPast && dayLessons.length === 0 ? 0.4 : 1
                    }}
                    onClick={() => dayLessons.length > 0 && onOpenLesson(dayLessons[0])}
                  >
                    <div style={{fontSize:11,fontWeight:600,color: isToday ? "#fff" : isPast ? "var(--ink4)" : "var(--ink3)",marginBottom:6}}>
                      {date.toLocaleDateString('en-US', {weekday:'short'})}
                    </div>
                    <div style={{fontSize:16,fontWeight:600,color: isToday ? "#fff" : isPast ? "var(--ink4)" : "var(--ink)"}}>
                      {date.getDate()}
                    </div>
                    {dayLessons.length > 0 && (
                      <div style={{fontSize:10,marginTop:6,color: isToday ? "#fff" : "var(--ink3)",opacity:0.8}}>
                        {dayLessons.length} lesson{dayLessons.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
