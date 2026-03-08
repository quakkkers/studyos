import { useState } from 'react';
import { supabase } from '../supabase';
import { MODULE_COLORS, SUBJECT_TYPES, DAYS, EMOJIS } from '../constants';

export default function ModuleSetup({ userId, onComplete, onCancel }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({});
  const [busy, setBusy] = useState(false);
  const TOTAL = 3;

  async function next(patch) {
    const d = { ...data, ...patch };
    setData(d);

    if (step < TOTAL - 1) {
      setStep(s => s + 1);
    } else {
      setBusy(true);
      try {
        const mod = {
          user_id: userId,
          name: d.name,
          emoji: d.emoji || '📚',
          color: d.color || 'amber',
          subject_type: d.subjectType || 'other',
          lesson_day: d.lessonDay || '',
          syllabus: d.syllabus || '',
          custom_instructions: d.instructions || '',
          position: 0
        };

        const { data: inserted, error } = await supabase
          .from('modules')
          .insert([mod])
          .select()
          .single();

        if (error) throw error;

        if (d.terms && d.terms.length > 0) {
          const termInserts = d.terms.map((t, i) => ({
            module_id: inserted.id,
            name: t.name,
            start_date: t.start,
            end_date: t.end,
            position: i
          }));

          await supabase.from('terms').insert(termInserts);
        }

        onComplete(inserted);
      } catch (error) {
        console.error(error);
      } finally {
        setBusy(false);
      }
    }
  }

  const titles = [
    ["Name your module", "Pick a name, icon and color theme"],
    ["Subject type", "Helps StudyOS tailor how it organizes your notes"],
    ["Terms & Schedule", "Add term dates and lesson schedule"]
  ];

  return (
    <div style={{minHeight:"100vh",background:"var(--paper)",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"18px 36px",display:"flex",alignItems:"center",gap:16,borderBottom:"1px solid var(--paper2)",background:"var(--white)"}}>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>← Back</button>
        <div style={{flex:1,height:3,background:"var(--paper2)",borderRadius:2}}>
          <div style={{height:"100%",background:"var(--primary)",borderRadius:2,width:`${step / (TOTAL - 1) * 100}%`,transition:"width .4s"}} />
        </div>
        <span style={{fontSize:12,color:"var(--ink3)",fontWeight:500}}>{step + 1} / {TOTAL}</span>
      </div>

      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"36px 20px"}}>
        <div className="card fu" style={{width:"100%",maxWidth:540,padding:"38px 42px"}}>
          <div style={{marginBottom:28}}>
            <h2 style={{fontSize:24,marginBottom:7,color:"var(--ink)"}}>{titles[step][0]}</h2>
            <p style={{fontSize:14,color:"var(--ink3)",lineHeight:1.6}}>{titles[step][1]}</p>
          </div>

          {step === 0 && <Step0 data={data} onNext={next} />}
          {step === 1 && <Step1 data={data} onNext={next} />}
          {step === 2 && <Step2 data={data} onNext={next} busy={busy} />}
        </div>
      </div>
    </div>
  );
}

function Step0({ data, onNext }) {
  const [name, setName] = useState(data.name || '');
  const [emoji, setEmoji] = useState(data.emoji || '📚');
  const [color, setColor] = useState(data.color || 'amber');

  return (
    <div style={{display:"flex",flexDirection:"column",gap:22}}>
      <div>
        <label style={{fontSize:13,fontWeight:600,color:"var(--ink2)",display:"block",marginBottom:7}}>Module Name</label>
        <input className="inp" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Spanish, Physics, History…" />
      </div>
      <div>
        <label style={{fontSize:13,fontWeight:600,color:"var(--ink2)",display:"block",marginBottom:9}}>Icon</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
          {EMOJIS.map(e => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                border: emoji === e ? "2px solid var(--ink)" : "2px solid transparent",
                background: emoji === e ? "var(--paper2)" : "transparent",
                fontSize: 19,
                cursor: "pointer",
                transition: "all .12s"
              }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label style={{fontSize:13,fontWeight:600,color:"var(--ink2)",display:"block",marginBottom:9}}>Color</label>
        <div style={{display:"flex",gap:10}}>
          {MODULE_COLORS.map(c => (
            <button
              key={c.id}
              onClick={() => setColor(c.id)}
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: c.accent,
                cursor: "pointer",
                border: color === c.id ? "3px solid var(--ink)" : "3px solid transparent",
                outline: color === c.id ? "2px solid var(--white)" : "none",
                outlineOffset: "-4px",
                transition: "all .12s"
              }}
            />
          ))}
        </div>
      </div>
      <button
        className="btn btn-primary"
        style={{alignSelf:"flex-end"}}
        onClick={() => name && onNext({ name, emoji, color })}
        disabled={!name}
      >
        Continue →
      </button>
    </div>
  );
}

function Step1({ data, onNext }) {
  const [type, setType] = useState(data.subjectType || '');

  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {SUBJECT_TYPES.map(s => (
        <button
          key={s.id}
          onClick={() => setType(s.id)}
          style={{
            padding: "14px 18px",
            borderRadius: 10,
            border: type === s.id ? "2px solid var(--primary)" : "2px solid var(--paper3)",
            background: type === s.id ? "var(--primary)" : "var(--white)",
            color: type === s.id ? "#fff" : "var(--ink)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 12,
            transition: "all .15s",
            textAlign: "left"
          }}
        >
          <span style={{fontSize:20}}>{s.icon}</span>
          <span style={{fontWeight:600,fontSize:15}}>{s.label}</span>
        </button>
      ))}
      <button
        className="btn btn-primary"
        style={{alignSelf:"flex-end",marginTop:6}}
        onClick={() => type && onNext({ subjectType: type })}
        disabled={!type}
      >
        Continue →
      </button>
    </div>
  );
}

function Step2({ data, onNext, busy }) {
  const [day, setDay] = useState(data.lessonDay || '');
  const [terms, setTerms] = useState(data.terms || [{ name: 'Term 1', start: '', end: '' }]);
  const [syllabus, setSyllabus] = useState(data.syllabus || '');
  const [instructions, setInstructions] = useState(data.instructions || '');

  function addTerm() {
    setTerms([...terms, { name: `Term ${terms.length + 1}`, start: '', end: '' }]);
  }

  function updateTerm(index, field, value) {
    const updated = [...terms];
    updated[index][field] = value;
    setTerms(updated);
  }

  function removeTerm(index) {
    setTerms(terms.filter((_, i) => i !== index));
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20,maxHeight:"60vh",overflowY:"auto",paddingRight:10}}>
      <div>
        <label style={{fontSize:13,fontWeight:600,color:"var(--ink2)",display:"block",marginBottom:9}}>Lesson Day (optional)</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
          {DAYS.map(d => (
            <button
              key={d}
              onClick={() => setDay(d)}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                border: day === d ? "2px solid var(--primary)" : "2px solid var(--paper3)",
                background: day === d ? "var(--primary)" : "var(--white)",
                color: day === d ? "#fff" : "var(--ink)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
                transition: "all .12s"
              }}
            >
              {d.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <label style={{fontSize:13,fontWeight:600,color:"var(--ink2)"}}>Terms</label>
          <button className="btn btn-ghost btn-sm" onClick={addTerm}>+ Add Term</button>
        </div>
        {terms.map((term, i) => (
          <div key={i} style={{marginBottom:12,padding:"12px 14px",background:"var(--paper2)",borderRadius:8}}>
            <div style={{display:"flex",gap:10,marginBottom:8,alignItems:"center"}}>
              <input
                className="inp"
                value={term.name}
                onChange={(e) => updateTerm(i, 'name', e.target.value)}
                placeholder="Term name"
                style={{flex:1}}
              />
              {terms.length > 1 && (
                <button className="btn btn-danger btn-sm" onClick={() => removeTerm(i)}>×</button>
              )}
            </div>
            <div style={{display:"flex",gap:10}}>
              <input
                type="date"
                className="inp"
                value={term.start}
                onChange={(e) => updateTerm(i, 'start', e.target.value)}
                style={{flex:1}}
              />
              <input
                type="date"
                className="inp"
                value={term.end}
                onChange={(e) => updateTerm(i, 'end', e.target.value)}
                style={{flex:1}}
              />
            </div>
          </div>
        ))}
      </div>

      <div>
        <label style={{fontSize:13,fontWeight:600,color:"var(--ink2)",display:"block",marginBottom:7}}>
          Syllabus (optional)
        </label>
        <textarea
          className="inp"
          value={syllabus}
          onChange={(e) => setSyllabus(e.target.value)}
          placeholder="Paste your syllabus or course outline here..."
          style={{height:80,resize:"vertical",lineHeight:1.6}}
        />
      </div>

      <div>
        <label style={{fontSize:13,fontWeight:600,color:"var(--ink2)",display:"block",marginBottom:7}}>
          Custom Instructions (optional)
        </label>
        <textarea
          className="inp"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="e.g. Always extract vocab as a table"
          style={{height:60,resize:"vertical",lineHeight:1.6}}
        />
      </div>

      <button
        className="btn btn-primary"
        style={{alignSelf:"flex-end"}}
        onClick={() => onNext({ lessonDay: day, terms, syllabus, instructions })}
        disabled={busy}
      >
        {busy ? (
          <>
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </>
        ) : 'Create Module →'}
      </button>
    </div>
  );
}
