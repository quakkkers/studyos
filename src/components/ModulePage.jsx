import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { MODULE_COLORS, SUBJECT_TYPES, CALENDAR_VIEWS } from '../constants';
import ModuleEditor from './ModuleEditor';

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
            <p style={{fontSize:11,fontWeight:700,color:"var(--ink3)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:14}}>
              All Lessons
            </p>
            {lessons.map(l => (
              <div
                key={l.id}
                className="card"
                style={{padding:"16px 20px",marginBottom:10,display:"flex",alignItems:"center",gap:15}}
              >
                <div
                  onClick={() => onOpenLesson(l)}
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
                <button
                  className="btn btn-danger btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteLesson(l.id);
                  }}
                >
                  Delete
                </button>
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
