import { useState } from 'react';
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

  const c = col(mod.color);
  const date = new Date(lesson.date);

  async function saveNotes() {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('lessons')
        .update({
          raw_notes: dump,
          structured_notes: dump,
          updated_at: new Date().toISOString()
        })
        .eq('id', lesson.id);

      if (error) throw error;

      onUpdate({ ...lesson, raw_notes: dump, structured_notes: dump });
      setNotes(dump);
      setTab('notes');
      notify('Notes saved');
    } catch (error) {
      notify('Failed to save notes', 'err');
    } finally {
      setProcessing(false);
    }
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
              Write everything from today's class — raw, messy, incomplete. StudyOS will structure it all.
            </p>

            <textarea
              className="inp"
              value={dump}
              onChange={(e) => setDump(e.target.value)}
              placeholder="Just write everything from today's lesson. Don't worry about structure or spelling."
              style={{minHeight:260,lineHeight:1.8,fontSize:15,resize:"vertical"}}
            />

            <div style={{marginTop:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:12,color:"var(--ink4)"}}>
                {dump.trim().split(/\s+/).filter(Boolean).length} words
              </span>
              <button
                className="btn btn-primary btn-lg"
                onClick={saveNotes}
                disabled={!dump.trim() || processing}
              >
                {processing ? (
                  <>
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                    Saving
                  </>
                ) : '✨ Save Notes →'}
              </button>
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
