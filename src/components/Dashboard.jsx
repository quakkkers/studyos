import { useState } from 'react';
import { MODULE_COLORS, SUBJECT_TYPES } from '../constants';

function col(colorId) {
  return MODULE_COLORS.find(c => c.id === colorId) || MODULE_COLORS[0];
}

export default function Dashboard({ modules, profile, onNew, onOpen, onSettings, onReorderModules, notify }) {
  const [draggedIndex, setDraggedIndex] = useState(null);

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  function handleDragStart(e, index) {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newModules = [...modules];
    const [removed] = newModules.splice(draggedIndex, 1);
    newModules.splice(index, 0, removed);

    onReorderModules(newModules);
    setDraggedIndex(index);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
  }

  return (
    <div style={{minHeight:"100vh",background:"var(--paper)"}}>
      <header style={{padding:"26px 40px 22px",display:"flex",justifyContent:"space-between",alignItems:"flex-end",borderBottom:"1px solid var(--paper2)",background:"var(--white)"}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:3}}>
            <span style={{fontSize:26}}>📖</span>
            <h1 style={{fontSize:28,letterSpacing:"-0.5px",color:"var(--ink)"}}>StudyOS</h1>
          </div>
          <p style={{fontSize:13,color:"var(--ink3)"}}>{today}</p>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button className="btn btn-ghost fu" onClick={onSettings}>⚙️ Settings</button>
          <button className="btn btn-primary btn-lg fu" onClick={onNew}>+ New Module</button>
        </div>
      </header>

      <main style={{padding:"32px 40px",maxWidth:1100,margin:"0 auto"}}>
        {modules.length === 0 ? (
          <div className="fu3" style={{textAlign:"center",padding:"80px 20px"}}>
            <div style={{fontSize:60,marginBottom:18}}>🎒</div>
            <h2 style={{fontSize:28,marginBottom:10,color:"var(--ink)"}}>Your study space awaits</h2>
            <p style={{color:"var(--ink3)",fontSize:15,maxWidth:380,margin:"0 auto 30px",lineHeight:1.7}}>
              Add your first module — a subject, course, or class — and StudyOS organizes everything for you.
            </p>
            <button className="btn btn-primary btn-lg" onClick={onNew}>+ Add Your First Module</button>
          </div>
        ) : (
          <>
            <div className="fu2" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <p style={{fontSize:11,fontWeight:700,color:"var(--ink3)",textTransform:"uppercase",letterSpacing:"0.1em"}}>Your Modules</p>
              <p style={{fontSize:12,color:"var(--ink4)"}}>Drag to reorder</p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:18}}>
              {modules.map((m, i) => (
                <ModCard
                  key={m.id}
                  m={m}
                  i={i}
                  onClick={() => onOpen(m)}
                  onDragStart={(e) => handleDragStart(e, i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedIndex === i}
                />
              ))}
              <AddCard onClick={onNew} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function ModCard({ m, i, onClick, onDragStart, onDragOver, onDragEnd, isDragging }) {
  const c = col(m.color);

  return (
    <div
      className={`card fu${Math.min(i + 2, 5)} draggable ${isDragging ? 'dragging' : ''}`}
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      style={{
        padding: 22,
        cursor: "pointer",
        transition: "all .2s",
        borderTop: `3px solid ${c.accent}`,
        opacity: isDragging ? 0.5 : 1
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "var(--shadow-lg)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <span style={{fontSize:30}}>{m.emoji || '📚'}</span>
        <span className="tag" style={{background:c.bg,color:c.text,fontSize:11}}>
          {SUBJECT_TYPES.find(s => s.id === m.subject_type)?.label || 'Other'}
        </span>
      </div>
      <h3 style={{fontSize:19,marginBottom:5,color:"var(--ink)"}}>{m.name}</h3>
      {m.lesson_day && (
        <p style={{fontSize:12,color:"var(--ink3)",marginBottom:10}}>
          📅 Every {m.lesson_day}
        </p>
      )}
    </div>
  );
}

function AddCard({ onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: "var(--radius)",
        border: "2px dashed var(--paper3)",
        padding: 22,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 160,
        color: "var(--ink3)",
        transition: "all .2s",
        gap: 8
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--ink3)";
        e.currentTarget.style.color = "var(--ink)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--paper3)";
        e.currentTarget.style.color = "var(--ink3)";
      }}
    >
      <span style={{fontSize:26}}>+</span>
      <span style={{fontSize:14,fontWeight:500}}>Add Module</span>
    </div>
  );
}
