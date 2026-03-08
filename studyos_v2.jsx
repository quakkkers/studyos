import { useState, useEffect, useRef } from "react";

/* ─── FONTS & BASE STYLES ─────────────────────────────────────────────────── */
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Outfit:wght@300;400;500;600;700&display=swap');`;
const STYLES = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --paper:#F6F3ED;--paper2:#EDE8DE;--paper3:#E2DACE;
  --ink:#1A1714;--ink2:#3D3830;--ink3:#7A7168;--ink4:#B5ADA3;
  --white:#FFFCF8;
  --amber:#C8860A;--amber-bg:#FEF5E4;--amber-mid:#F59E0B;
  --teal:#0A7C6E;--teal-bg:#E6F7F4;
  --rose:#C0364A;--rose-bg:#FDEEF1;
  --blue:#2451B7;--blue-bg:#EBF0FD;
  --violet:#6B35C9;--violet-bg:#F0EAFD;
  --lime:#4A7C1F;--lime-bg:#EDF7E4;
  --shadow:0 2px 10px rgba(26,23,20,0.07),0 1px 3px rgba(26,23,20,0.04);
  --shadow-lg:0 8px 36px rgba(26,23,20,0.11),0 2px 10px rgba(26,23,20,0.06);
  --radius:14px;--radius-sm:9px;
}
body{font-family:'Outfit',sans-serif;background:var(--paper);color:var(--ink);min-height:100vh}
h1,h2,h3,h4{font-family:'Lora',serif}
textarea,input,button,select{font-family:'Outfit',sans-serif}
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-track{background:var(--paper2)}
::-webkit-scrollbar-thumb{background:var(--ink4);border-radius:3px}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideRight{from{transform:translateX(110%)}to{transform:translateX(0)}}
.fu{animation:fadeUp .35s ease both}
.fu1{animation:fadeUp .35s .05s ease both}
.fu2{animation:fadeUp .35s .1s ease both}
.fu3{animation:fadeUp .35s .15s ease both}
.fu4{animation:fadeUp .35s .2s ease both}
.fu5{animation:fadeUp .35s .25s ease both}
.dot{width:7px;height:7px;border-radius:50%;background:var(--ink3);display:inline-block;animation:pulse 1.2s ease-in-out infinite}
.dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}
.btn{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:var(--radius-sm);border:none;font-size:14px;font-weight:500;cursor:pointer;transition:all .15s ease;text-decoration:none;line-height:1.2}
.btn:active{transform:scale(.97)}
.btn-ink{background:var(--ink);color:var(--white)}
.btn-ink:hover{background:var(--ink2)}
.btn-amber{background:var(--amber);color:#fff}
.btn-amber:hover{background:var(--amber-mid)}
.btn-ghost{background:transparent;color:var(--ink2);border:1.5px solid var(--paper3)}
.btn-ghost:hover{background:var(--paper2)}
.btn-sm{padding:6px 12px;font-size:13px}
.btn-lg{padding:12px 26px;font-size:15px}
.btn:disabled{opacity:.45;cursor:not-allowed}
.card{background:var(--white);border-radius:var(--radius);box-shadow:var(--shadow);border:1px solid rgba(26,23,20,.06)}
.tag{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:500}
.inp{width:100%;padding:11px 14px;border-radius:var(--radius-sm);border:1.5px solid var(--paper3);background:var(--white);font-size:14px;outline:none;transition:border-color .15s;color:var(--ink);line-height:1.5}
.inp:focus{border-color:var(--ink)}
.inp::placeholder{color:var(--ink4)}
.tab-btn{padding:11px 20px;background:transparent;border:none;border-bottom:2px solid transparent;cursor:pointer;font-size:14px;font-weight:400;color:var(--ink3);transition:all .15s;white-space:nowrap}
.tab-btn.active{border-bottom-color:var(--amber);color:var(--ink);font-weight:600}
`;

/* ─── CONSTANTS ───────────────────────────────────────────────────────────── */
const MODULE_COLORS = [
  {id:"amber", accent:"#C8860A", bg:"#FEF5E4", text:"#7C4F06"},
  {id:"teal",  accent:"#0A7C6E", bg:"#E6F7F4", text:"#065048"},
  {id:"rose",  accent:"#C0364A", bg:"#FDEEF1", text:"#7B1D2D"},
  {id:"blue",  accent:"#2451B7", bg:"#EBF0FD", text:"#162E75"},
  {id:"violet",accent:"#6B35C9", bg:"#F0EAFD", text:"#3E1580"},
  {id:"lime",  accent:"#4A7C1F", bg:"#EDF7E4", text:"#274010"},
];
const SUBJECT_TYPES = [
  {id:"language",label:"Language",icon:"💬"},
  {id:"stem",    label:"STEM",    icon:"🔬"},
  {id:"essay",   label:"Essay / Humanities",icon:"✍️"},
  {id:"arts",    label:"Arts",    icon:"🎨"},
  {id:"other",   label:"Other",   icon:"📚"},
];
const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const EMOJIS = ["📚","🧪","💬","✍️","🎨","🔬","🌍","🎵","⚡","🧮","🏛️","🌿","🔭","📐","🗣️","🧬","🖥️","📖"];

/* ─── STORAGE ─────────────────────────────────────────────────────────────── */
async function load(key){try{const r=await window.storage.get(key);return r?JSON.parse(r.value):null}catch{return null}}
async function save(key,val){try{await window.storage.set(key,JSON.stringify(val))}catch{}}

/* ─── AI HELPERS ──────────────────────────────────────────────────────────── */
async function callAI(system, msgs, onChunk){
  const res = await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2000,stream:true,system,messages:msgs})
  });
  const reader=res.body.getReader(),dec=new TextDecoder();
  let full="";
  while(true){
    const{done,value}=await reader.read();
    if(done)break;
    for(const line of dec.decode(value).split("\n")){
      if(line.startsWith("data: ")){
        try{const d=JSON.parse(line.slice(6));if(d.delta?.text){full+=d.delta.text;onChunk(full)}}catch{}
      }
    }
  }
  return full;
}
async function callAIFull(system,msgs){
  const res=await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2000,system,messages:msgs})
  });
  const d=await res.json();
  return d.content?.map(b=>b.text||"").join("")||"";
}

/* ─── PDF TEXT EXTRACTION ─────────────────────────────────────────────────── */
async function extractFileText(file){
  return new Promise((resolve)=>{
    const reader=new FileReader();
    if(file.type==="application/pdf"){
      reader.onload=async(e)=>{
        try{
          const arr=new Uint8Array(e.target.result);
          // Simple PDF text extraction: look for stream text between BT and ET markers
          let text="";
          const str=new TextDecoder("latin1").decode(arr);
          const matches=str.matchAll(/BT[\s\S]*?ET/g);
          for(const m of matches){
            const tj=m[0].matchAll(/\(([^)]+)\)\s*T[jJ]/g);
            for(const t of tj) text+=t[1].replace(/\\n/g,"\n").replace(/\\r/g,"")+" ";
          }
          if(text.trim().length>50){resolve(text.trim())}
          else{
            // Fallback: extract readable ASCII runs
            let raw="";
            for(let i=0;i<arr.length;i++){
              const c=arr[i];
              if(c>=32&&c<=126)raw+=String.fromCharCode(c);
              else if(c===10||c===13)raw+="\n";
            }
            resolve(raw.replace(/[^\x20-\x7E\n]/g," ").replace(/ {4,}/g," ").trim());
          }
        }catch{resolve("Could not extract PDF text. Please paste the content manually.")}
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload=e=>resolve(e.target.result);
      reader.readAsText(file);
    }
  });
}

/* ─── MARKDOWN RENDERER ───────────────────────────────────────────────────── */
function md(text){
  if(!text)return"";
  return text
    .replace(/^### (.+)$/gm,'<h4 style="font-family:Lora,serif;font-size:15px;margin:14px 0 5px;color:var(--ink)">$1</h4>')
    .replace(/^## (.+)$/gm,'<h3 style="font-family:Lora,serif;font-size:18px;margin:18px 0 8px;color:var(--ink)">$1</h3>')
    .replace(/^# (.+)$/gm,'<h2 style="font-family:Lora,serif;font-size:22px;margin:20px 0 10px;color:var(--ink)">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/^[-•] (.+)$/gm,'<li style="margin:4px 0 4px 20px;line-height:1.7">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm,'<li style="margin:4px 0 4px 20px;list-style:decimal;line-height:1.7">$2</li>')
    .replace(/`([^`]+)`/g,'<code style="background:var(--paper2);padding:1px 6px;border-radius:4px;font-size:13px">$1</code>')
    .replace(/\n\n/g,'</p><p style="margin:8px 0">')
    .replace(/\n/g,'<br/>');
}

/* ─── LESSON GENERATION ───────────────────────────────────────────────────── */
function generateLessons(lessonDay, lessonTime, termStart, termEnd){
  if(!lessonDay||!termStart||!termEnd)return[];
  const dayMap={Monday:1,Tuesday:2,Wednesday:3,Thursday:4,Friday:5,Saturday:6,Sunday:0};
  const target=dayMap[lessonDay];
  const start=new Date(termStart), end=new Date(termEnd);
  const today=new Date(); today.setHours(0,0,0,0);
  const lessons=[];
  let d=new Date(start);
  while(d.getDay()!==target) d.setDate(d.getDate()+1);
  while(d<=end){
    lessons.push({
      id:`l-${d.getTime()}`,
      date:d.toISOString().split("T")[0],
      time:lessonTime||"",
      status: d<today?"past":"upcoming",
      rawDump:"",notes:"",summary:"",topics:[],
    });
    d=new Date(d); d.setDate(d.getDate()+7);
  }
  return lessons;
}

/* ─── COLOR HELPER ────────────────────────────────────────────────────────── */
function col(colorId){return MODULE_COLORS.find(c=>c.id===colorId)||MODULE_COLORS[0]}

/* ════════════════════════════════════════════════════════════════════════════
   ROOT APP
   ════════════════════════════════════════════════════════════════════════════ */
export default function App(){
  const [screen,setScreen]=useState("loading");
  const [modules,setModules]=useState([]);
  const [activeMod,setActiveMod]=useState(null);
  const [activeLesson,setActiveLesson]=useState(null);
  const [toast,setToast]=useState(null);

  useEffect(()=>{load("sos:mods").then(m=>{setModules(m||[]);setScreen("dash")});},[]);

  function notify(msg,type="ok"){
    setToast({msg,type});setTimeout(()=>setToast(null),3200);
  }
  async function saveMods(mods){setModules(mods);await save("sos:mods",mods);}

  async function updateMod(updated){
    const mods=modules.map(m=>m.id===updated.id?updated:m);
    await saveMods(mods);
    setActiveMod(updated);
  }

  if(screen==="loading") return <Splash/>;

  if(screen==="setup") return(
    <SetupWizard
      onComplete={async mod=>{
        const mods=[...modules,mod];
        await saveMods(mods);
        setActiveMod(mod);setScreen("mod");notify(`${mod.emoji} ${mod.name} is ready!`);
      }}
      onCancel={()=>setScreen("dash")}
    />
  );

  if(screen==="mod"&&activeMod) return(
    <ModulePage
      mod={activeMod}
      onBack={()=>setScreen("dash")}
      onUpdate={updateMod}
      onOpenLesson={l=>{setActiveLesson(l);setScreen("lesson");}}
      notify={notify}
    />
  );

  if(screen==="lesson"&&activeLesson&&activeMod) return(
    <LessonPage
      lesson={activeLesson}
      mod={activeMod}
      onBack={()=>setScreen("mod")}
      onUpdate={async ul=>{
        const um={...activeMod,lessons:(activeMod.lessons||[]).map(l=>l.id===ul.id?ul:l)};
        await updateMod(um);setActiveLesson(ul);
      }}
      notify={notify}
    />
  );

  return(
    <Dashboard
      modules={modules}
      onNew={()=>setScreen("setup")}
      onOpen={m=>{setActiveMod(m);setScreen("mod");}}
      toast={toast}
    />
  );
}

/* ─── SPLASH ──────────────────────────────────────────────────────────────── */
function Splash(){
  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"var(--paper)"}}>
      <style>{FONTS}{STYLES}</style>
      <div style={{fontSize:44,marginBottom:14}}>📖</div>
      <h1 style={{fontSize:32,letterSpacing:"-0.5px",color:"var(--ink)"}}>StudyOS</h1>
      <p style={{color:"var(--ink3)",marginTop:8,fontSize:14}}>Loading your study space…</p>
      <div style={{marginTop:22,display:"flex",gap:6}}><span className="dot"/><span className="dot"/><span className="dot"/></div>
    </div>
  );
}

/* ─── TOAST ───────────────────────────────────────────────────────────────── */
function Toast({toast}){
  if(!toast)return null;
  return(
    <div style={{position:"fixed",top:22,right:22,zIndex:9999,background:toast.type==="err"?"var(--rose)":"var(--ink)",color:"#fff",padding:"11px 20px",borderRadius:10,fontSize:14,fontWeight:500,boxShadow:"var(--shadow-lg)",animation:"slideRight .3s ease"}}>
      {toast.type==="err"?"⚠ ":"✓ "}{toast.msg}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   DASHBOARD
   ════════════════════════════════════════════════════════════════════════════ */
function Dashboard({modules,onNew,onOpen,toast}){
  const today=new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"});
  const upcoming=modules.flatMap(m=>(m.lessons||[]).filter(l=>l.status==="upcoming").map(l=>({...l,mod:m}))).sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(0,6);

  return(
    <div style={{minHeight:"100vh",background:"var(--paper)"}}>
      <style>{FONTS}{STYLES}</style>
      <Toast toast={toast}/>

      <header style={{padding:"26px 40px 22px",display:"flex",justifyContent:"space-between",alignItems:"flex-end",borderBottom:"1px solid var(--paper2)",background:"var(--white)"}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:3}}>
            <span style={{fontSize:26}}>📖</span>
            <h1 style={{fontSize:28,letterSpacing:"-0.5px",color:"var(--ink)"}}>StudyOS</h1>
          </div>
          <p style={{fontSize:13,color:"var(--ink3)"}}>{today}</p>
        </div>
        <button className="btn btn-ink btn-lg fu" onClick={onNew}>+ New Module</button>
      </header>

      <main style={{padding:"32px 40px",maxWidth:1100,margin:"0 auto"}}>
        {upcoming.length>0&&(
          <section className="fu1" style={{marginBottom:36}}>
            <Label>Coming Up</Label>
            <div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:6}}>
              {upcoming.map(l=>{
                const c=col(l.mod.color);
                const isToday=l.date===new Date().toISOString().split("T")[0];
                return(
                  <div key={l.id} style={{minWidth:160,padding:"14px 16px",borderRadius:12,background:c.bg,border:`1.5px solid ${c.accent}${isToday?"":"33"}`,flexShrink:0,cursor:"default"}}>
                    {isToday&&<div style={{fontSize:10,fontWeight:700,color:c.accent,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>TODAY</div>}
                    <div style={{fontSize:20,marginBottom:5}}>{l.mod.emoji}</div>
                    <div style={{fontSize:13,fontWeight:600,color:c.text}}>{l.mod.name}</div>
                    <div style={{fontSize:12,color:c.text,opacity:.75,marginTop:2}}>
                      {new Date(l.date).toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"})}
                      {l.time&&` · ${l.time}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {modules.length===0?(
          <div className="fu3" style={{textAlign:"center",padding:"80px 20px"}}>
            <div style={{fontSize:60,marginBottom:18}}>🎒</div>
            <h2 style={{fontSize:28,marginBottom:10,color:"var(--ink)"}}>Your study space awaits</h2>
            <p style={{color:"var(--ink3)",fontSize:15,maxWidth:380,margin:"0 auto 30px",lineHeight:1.7}}>Add your first module — a subject, course, or class — and StudyOS organises everything for you.</p>
            <button className="btn btn-ink btn-lg" onClick={onNew}>+ Add Your First Module</button>
          </div>
        ):(
          <>
            <div className="fu2" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <Label>Your Modules</Label>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:18}}>
              {modules.map((m,i)=><ModCard key={m.id} m={m} i={i} onClick={()=>onOpen(m)}/>)}
              <AddCard onClick={onNew}/>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Label({children}){
  return <p style={{fontSize:11,fontWeight:700,color:"var(--ink3)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:14}}>{children}</p>;
}

function ModCard({m,i,onClick}){
  const c=col(m.color);
  const lessons=m.lessons||[];
  const done=lessons.filter(l=>l.notes).length;
  const total=lessons.length;
  return(
    <div className={`card fu${Math.min(i+2,5)}`} onClick={onClick} style={{padding:22,cursor:"pointer",transition:"all .2s",borderTop:`3px solid ${c.accent}`}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="var(--shadow-lg)"}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=""}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <span style={{fontSize:30}}>{m.emoji}</span>
        <span className="tag" style={{background:c.bg,color:c.text,fontSize:11}}>{SUBJECT_TYPES.find(s=>s.id===m.subjectType)?.label}</span>
      </div>
      <h3 style={{fontSize:19,marginBottom:5,color:"var(--ink)"}}>{m.name}</h3>
      {m.schedule&&<p style={{fontSize:12,color:"var(--ink3)",marginBottom:10}}>📅 {m.schedule}</p>}
      {total>0&&(
        <div style={{marginTop:14}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--ink3)",marginBottom:5}}>
            <span>{done} notes · {total} lessons</span>
            <span>{Math.round(done/total*100)}%</span>
          </div>
          <div style={{height:3,background:c.bg,borderRadius:2}}>
            <div style={{height:"100%",background:c.accent,borderRadius:2,width:`${done/total*100}%`,transition:"width .4s"}}/>
          </div>
        </div>
      )}
    </div>
  );
}

function AddCard({onClick}){
  return(
    <div onClick={onClick} style={{borderRadius:"var(--radius)",border:"2px dashed var(--paper3)",padding:22,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:160,color:"var(--ink3)",transition:"all .2s",gap:8}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--ink3)";e.currentTarget.style.color="var(--ink)"}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--paper3)";e.currentTarget.style.color="var(--ink3)"}}>
      <span style={{fontSize:26}}>+</span>
      <span style={{fontSize:14,fontWeight:500}}>Add Module</span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   SETUP WIZARD
   ════════════════════════════════════════════════════════════════════════════ */
function SetupWizard({onComplete,onCancel}){
  const [step,setStep]=useState(0);
  const [data,setData]=useState({});
  const [busy,setBusy]=useState(false);
  const TOTAL=6;

  async function next(patch){
    const d={...data,...patch};
    setData(d);
    if(step===4){
      // Generate AI study profile
      setBusy(true);
      try{
        const raw=await callAIFull(
          "You are StudyOS. Return JSON only, no markdown fences.",
          [{role:"user",content:`Module: ${d.name}, Type: ${d.subjectType}, Schedule: ${d.schedule||"unknown"}, Syllabus snippet: ${(d.syllabus||"").slice(0,400)}. Return: {"studyProfile":"2-3 sentence personalised study approach","tips":["tip1","tip2","tip3"],"starterInstruction":"one suggested AI instruction for this module"}`}]
        );
        const clean=raw.replace(/```json|```/g,"").trim();
        const ai=JSON.parse(clean);
        setData({...d,ai});
      }catch{}
      setBusy(false);
    }
    if(step<TOTAL-1){setStep(s=>s+1);}
    else{
      // Build module
      const mod={
        id:Date.now().toString(),
        name:d.name,emoji:d.emoji||"📚",color:d.color||"amber",
        subjectType:d.subjectType,schedule:d.schedule||"",
        syllabus:d.syllabus||"",assessmentCriteria:d.assessmentCriteria||"",
        instructions:d.instructions||d.ai?.starterInstruction||"",
        studyProfile:d.ai?.studyProfile||"",
        learningProfile:{
          processingStyle:d.processingStyle||"unknown",
          noteStyle:d.noteStyle||"unknown",
          memoryStyle:d.memoryStyle||"unknown",
          memoryOther:d.memoryOther||"",
        },
        habitLog:[],
        lessons:generateLessons(d.lessonDay,d.lessonTime,d.termStart,d.termEnd),
        contentPage:[],
        createdAt:new Date().toISOString(),
      };
      onComplete(mod);
    }
  }

  const titles=[
    ["Name your module","Pick a name, icon and colour theme"],
    ["Subject type","Helps StudyOS tailor how it organises your notes"],
    ["Lesson schedule","When does this class happen, and how long is your term?"],
    ["Your syllabus & criteria","Paste or upload — StudyOS will remember it forever"],
    ["Your learning style","Helps StudyOS adapt to how you think — skip anything you're unsure about"],
    ["All set!","Here's what StudyOS has prepared for you"],
  ];

  return(
    <div style={{minHeight:"100vh",background:"var(--paper)",display:"flex",flexDirection:"column"}}>
      <style>{FONTS}{STYLES}</style>
      <div style={{padding:"18px 36px",display:"flex",alignItems:"center",gap:16,borderBottom:"1px solid var(--paper2)",background:"var(--white)"}}>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>← Back</button>
        <div style={{flex:1,height:3,background:"var(--paper2)",borderRadius:2}}>
          <div style={{height:"100%",background:"var(--ink)",borderRadius:2,width:`${step/(TOTAL-1)*100}%`,transition:"width .4s"}}/>
        </div>
        <span style={{fontSize:12,color:"var(--ink3)",fontWeight:500}}>{step+1} / {TOTAL}</span>
      </div>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"36px 20px"}}>
        <div className="card fu" style={{width:"100%",maxWidth:540,padding:"38px 42px"}}>
          <div style={{marginBottom:28}}>
            <h2 style={{fontSize:24,marginBottom:7,color:"var(--ink)"}}>{titles[step][0]}</h2>
            <p style={{fontSize:14,color:"var(--ink3)",lineHeight:1.6}}>{titles[step][1]}</p>
          </div>
          {step===0&&<WStep0 data={data} onNext={next}/>}
          {step===1&&<WStep1 data={data} onNext={next}/>}
          {step===2&&<WStep2 data={data} onNext={next}/>}
          {step===3&&<WStep3 data={data} onNext={next}/>}
          {step===4&&<WStep4 data={data} onNext={next} busy={busy}/>}
          {step===5&&<WStep5 data={data} onNext={next}/>}
        </div>
      </div>
    </div>
  );
}

/* ── Wizard steps ─── */
function WStep0({data,onNext}){
  const [name,setName]=useState(data.name||"");
  const [emoji,setEmoji]=useState(data.emoji||"📚");
  const [color,setColor]=useState(data.color||"amber");
  return(
    <div style={{display:"flex",flexDirection:"column",gap:22}}>
      <div>
        <label style={{fontSize:13,fontWeight:600,color:"var(--ink2)",display:"block",marginBottom:7}}>Module Name</label>
        <input className="inp" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Spanish, Physics, History…"/>
      </div>
      <div>
        <label style={{fontSize:13,fontWeight:600,color:"var(--ink2)",display:"block",marginBottom:9}}>Icon</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
          {EMOJIS.map(e=>(
            <button key={e} onClick={()=>setEmoji(e)} style={{width:38,height:38,borderRadius:8,border:emoji===e?"2px solid var(--ink)":"2px solid transparent",background:emoji===e?"var(--paper2)":"transparent",fontSize:19,cursor:"pointer",transition:"all .12s"}}>{e}</button>
          ))}
        </div>
      </div>
      <div>
        <label style={{fontSize:13,fontWeight:600,color:"var(--ink2)",display:"block",marginBottom:9}}>Colour</label>
        <div style={{display:"flex",gap:10}}>
          {MODULE_COLORS.map(c=>(
            <button key={c.id} onClick={()=>setColor(c.id)} style={{width:34,height:34,borderRadius:"50%",background:c.accent,cursor:"pointer",border:color===c.id?"3px solid var(--ink)":"3px solid transparent",outline:color===c.id?"2px solid var(--white)":"none",outlineOffset:"-4px",transition:"all .12s"}}/>
          ))}
        </div>
      </div>
      <button className="btn btn-ink" style={{alignSelf:"flex-end"}} onClick={()=>name&&onNext({name,emoji,color})} disabled={!name}>Continue →</button>
    </div>
  );
}

function WStep1({data,onNext}){
  const [type,setType]=useState(data.subjectType||"");
  return(
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {SUBJECT_TYPES.map(s=>(
        <button key={s.id} onClick={()=>setType(s.id)} style={{padding:"14px 18px",borderRadius:10,border:type===s.id?"2px solid var(--ink)":"2px solid var(--paper3)",background:type===s.id?"var(--ink)":"var(--white)",color:type===s.id?"var(--white)":"var(--ink)",cursor:"pointer",display:"flex",alignItems:"center",gap:12,transition:"all .15s",textAlign:"left"}}>
          <span style={{fontSize:20}}>{s.icon}</span>
          <span style={{fontWeight:600,fontSize:15}}>{s.label}</span>
        </button>
      ))}
      <button className="btn btn-ink" style={{alignSelf:"flex-end",marginTop:6}} onClick={()=>type&&onNext({subjectType:type})} disabled={!type}>Continue →</button>
    </div>
  );
}

function WStep2({data,onNext}){
  const [day,setDay]=useState(data.lessonDay||"");
  const [time,setTime]=useState(data.lessonTime||"09:00");
  const [termStart,setTermStart]=useState(data.termStart||"");
  const [termEnd,setTermEnd]=useState(data.termEnd||"");
  const schedule=day?`Every ${day} at ${time}`:"";
  const lessonCount=day&&termStart&&termEnd?generateLessons(day,time,termStart,termEnd).length:0;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div>
        <label style={{fontSize:13,fontWeight:600,color:"var(--ink2)",display:"block",marginBottom:9}}>Lesson Day</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
          {DAYS.map(d=>(
            <button key={d} onClick={()=>setDay(d)} style={{padding:"7px 14px",borderRadius:8,border:day===d?"2px solid var(--ink)":"2px solid var(--paper3)",background:day===d?"var(--ink)":"var(--white)",color:day===d?"var(--white)":"var(--ink)",cursor:"pointer",fontSize:13,fontWeight:500,transition:"all .12s"}}>{d.slice(0,3)}</button>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:16}}>
        <div style={{flex:1}}>
          <label style={{fontSize:13,fontWeight:600,color:"var(--ink2)",display:"block",marginBottom:7}}>Lesson Time</label>
          <input type="time" className="inp" value={time} onChange={e=>setTime(e.target.value)} style={{width:"100%"}}/>
        </div>
      </div>
      <div style={{display:"flex",gap:14}}>
        <div style={{flex:1}}>
          <label style={{fontSize:13,fontWeight:600,color:"var(--ink2)",display:"block",marginBottom:7}}>Term Start</label>
          <input type="date" className="inp" value={termStart} onChange={e=>setTermStart(e.target.value)}/>
        </div>
        <div style={{flex:1}}>
          <label style={{fontSize:13,fontWeight:600,color:"var(--ink2)",display:"block",marginBottom:7}}>Term End</label>
          <input type="date" className="inp" value={termEnd} onChange={e=>setTermEnd(e.target.value)}/>
        </div>
      </div>
      {schedule&&lessonCount>0&&(
        <div style={{padding:"11px 15px",background:"var(--amber-bg)",borderRadius:9,fontSize:13,color:"var(--amber)",fontWeight:500}}>
          📅 {schedule} · {lessonCount} lesson{lessonCount!==1?"s":""} this term
        </div>
      )}
      <div style={{display:"flex",justifyContent:"space-between"}}>
        <button className="btn btn-ghost" onClick={()=>onNext({lessonDay:"",lessonTime:"",termStart:"",termEnd:"",schedule:""})}>Skip</button>
        <button className="btn btn-ink" onClick={()=>onNext({lessonDay:day,lessonTime:time,termStart,termEnd,schedule})} disabled={!day}>Continue →</button>
      </div>
    </div>
  );
}

function WStep3({data,onNext}){
  const [syllabus,setSyllabus]=useState(data.syllabus||"");
  const [criteria,setCriteria]=useState(data.assessmentCriteria||"");
  const [uploading,setUploading]=useState(false);
  const syllabusRef=useRef();
  const criteriaRef=useRef();

  async function handleFile(e,setter){
    const file=e.target.files[0];
    if(!file)return;
    setUploading(true);
    const text=await extractFileText(file);
    setter(text);
    setUploading(false);
  }

  return(
    <div style={{display:"flex",flexDirection:"column",gap:22}}>
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
          <label style={{fontSize:13,fontWeight:600,color:"var(--ink2)"}}>Syllabus / Course Outline</label>
          <button className="btn btn-ghost btn-sm" onClick={()=>syllabusRef.current.click()} disabled={uploading}>
            {uploading?"Extracting…":"📎 Upload file"}
          </button>
          <input ref={syllabusRef} type="file" accept=".pdf,.txt,.md" style={{display:"none"}} onChange={e=>handleFile(e,setSyllabus)}/>
        </div>
        <p style={{fontSize:12,color:"var(--ink3)",marginBottom:8,lineHeight:1.5}}>Paste or upload your syllabus, topic list, or course outline. Supports PDF, TXT, or MD files.</p>
        <textarea className="inp" value={syllabus} onChange={e=>setSyllabus(e.target.value)}
          placeholder={"e.g. Unit 1: Present tense verbs\nUnit 2: Past tense (preterite)\nUnit 3: Vocabulary — family & relationships…"}
          style={{height:110,resize:"vertical",lineHeight:1.6}}/>
      </div>
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
          <label style={{fontSize:13,fontWeight:600,color:"var(--ink2)"}}>Assessment Criteria <span style={{fontWeight:400,color:"var(--ink3)"}}>(optional)</span></label>
          <button className="btn btn-ghost btn-sm" onClick={()=>criteriaRef.current.click()} disabled={uploading}>
            📎 Upload file
          </button>
          <input ref={criteriaRef} type="file" accept=".pdf,.txt,.md" style={{display:"none"}} onChange={e=>handleFile(e,setCriteria)}/>
        </div>
        <textarea className="inp" value={criteria} onChange={e=>setCriteria(e.target.value)}
          placeholder="e.g. 30% oral exam, 40% written paper, 30% coursework…"
          style={{height:75,resize:"vertical",lineHeight:1.6}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between"}}>
        <button className="btn btn-ghost" onClick={()=>onNext({syllabus:"",assessmentCriteria:""})}>Skip</button>
        <button className="btn btn-ink" onClick={()=>onNext({syllabus,assessmentCriteria:criteria})}>Continue →</button>
      </div>
    </div>
  );
}

function WStep4({data,onNext,busy}){
  const [ps,setPs]=useState(data.processingStyle||"");
  const [ns,setNs]=useState(data.noteStyle||"");
  const [ms,setMs]=useState(data.memoryStyle||"");
  const [mo,setMo]=useState(data.memoryOther||"");

  const OptionBtn=({val,label,sub,selected,onClick,small})=>(
    <button onClick={onClick} style={{padding:small?"8px 12px":"11px 14px",borderRadius:10,border:selected?"2px solid var(--ink)":"2px solid var(--paper3)",background:selected?"var(--ink)":"var(--white)",color:selected?"var(--white)":"var(--ink)",cursor:"pointer",transition:"all .15s",textAlign:"left",fontFamily:"inherit"}}>
      <div style={{fontWeight:600,fontSize:small?12:13}}>{label}</div>
      {sub&&<div style={{fontSize:11,opacity:.65,marginTop:2}}>{sub}</div>}
    </button>
  );

  const IDK=({val,set})=>(
    <button onClick={()=>set("unknown")} style={{padding:"8px 14px",borderRadius:10,border:val==="unknown"?"2px solid var(--amber)":"2px dashed var(--paper3)",background:val==="unknown"?"var(--amber-bg)":"transparent",color:val==="unknown"?"var(--amber)":"var(--ink3)",cursor:"pointer",fontSize:12,fontFamily:"inherit",transition:"all .15s"}}>
      🤷 I don't know yet
    </button>
  );

  return(
    <div style={{display:"flex",flexDirection:"column",gap:22}}>
      <div style={{padding:"11px 14px",background:"var(--blue-bg)",borderRadius:9,fontSize:13,color:"var(--blue)",lineHeight:1.5}}>
        💡 Not sure? Select "I don't know yet" — StudyOS will watch how you study and ask you after 3 lessons.
      </div>

      {/* Processing style */}
      <div>
        <p style={{fontSize:13,fontWeight:600,color:"var(--ink)",marginBottom:9}}>When learning something new, you prefer…</p>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <OptionBtn val="big-picture" label="🗺 Big picture first" sub="Overview → details" selected={ps==="big-picture"} onClick={()=>setPs("big-picture")}/>
          <OptionBtn val="detail-first" label="🔍 Details first" sub="Build up to the overview" selected={ps==="detail-first"} onClick={()=>setPs("detail-first")}/>
          <IDK val={ps} set={setPs}/>
        </div>
      </div>

      {/* Note encounter style */}
      <div>
        <p style={{fontSize:13,fontWeight:600,color:"var(--ink)",marginBottom:9}}>How do you like to first encounter new material?</p>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <OptionBtn val="summary-first" label="📋 Summary first" sub="Get the gist, then the detail" selected={ns==="summary-first"} onClick={()=>setNs("summary-first")}/>
          <OptionBtn val="detail-first" label="📄 Full detail first" sub="Everything, then the summary" selected={ns==="detail-first"} onClick={()=>setNs("detail-first")}/>
          <IDK val={ns} set={setNs}/>
        </div>
      </div>

      {/* Memory style */}
      <div>
        <p style={{fontSize:13,fontWeight:600,color:"var(--ink)",marginBottom:9}}>You remember things best by…</p>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
          {[{v:"reading",l:"📖 Reading"},{v:"writing",l:"✍️ Writing"},{v:"examples",l:"💡 Examples"},{v:"talking",l:"🗣 Talking"}].map(o=>(
            <OptionBtn key={o.v} val={o.v} label={o.l} selected={ms===o.v} onClick={()=>{setMs(o.v);setMo("");}} small/>
          ))}
          <OptionBtn val="other" label="✏️ Other" selected={ms==="other"} onClick={()=>setMs("other")} small/>
          <IDK val={ms} set={v=>{setMs(v);setMo("");}}/>
        </div>
        {ms==="other"&&(
          <input className="inp" value={mo} onChange={e=>setMo(e.target.value)} placeholder="Describe how you best remember things…" style={{marginTop:4}}/>
        )}
      </div>

      <div style={{display:"flex",justifyContent:"space-between"}}>
        <button className="btn btn-ghost" onClick={()=>onNext({processingStyle:"unknown",noteStyle:"unknown",memoryStyle:"unknown"})}>Skip all</button>
        <button className="btn btn-amber" onClick={()=>onNext({processingStyle:ps||"unknown",noteStyle:ns||"unknown",memoryStyle:ms||"unknown",memoryOther:mo})} disabled={busy}>
          {busy?<><span className="dot"/><span className="dot"/><span className="dot"/></>:"Set up module →"}
        </button>
      </div>
    </div>
  );
}

function WStep5({data,onNext}){
  const c=col(data.color);
  const ai=data.ai;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <div style={{padding:"18px 22px",borderRadius:12,background:c.bg,border:`1.5px solid ${c.accent}33`,textAlign:"center"}}>
        <div style={{fontSize:44,marginBottom:8}}>{data.emoji}</div>
        <h3 style={{fontSize:22,color:c.text}}>{data.name}</h3>
        {data.schedule&&<p style={{fontSize:13,color:c.text,opacity:.8,marginTop:4}}>📅 {data.schedule}</p>}
        {data.lessons?.length>0&&<p style={{fontSize:12,color:c.text,opacity:.7,marginTop:2}}>{data.lessons.length} lessons this term</p>}
      </div>
      {ai?.studyProfile&&(
        <div style={{padding:"14px 18px",background:"var(--paper2)",borderRadius:10}}>
          <p style={{fontSize:11,fontWeight:700,color:"var(--ink3)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Your Study Approach</p>
          <p style={{fontSize:14,color:"var(--ink2)",lineHeight:1.65}}>{ai.studyProfile}</p>
        </div>
      )}
      {ai?.tips&&(
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {ai.tips.map((t,i)=>(
            <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:15,flexShrink:0}}>{"💡✏️🎯"[i]}</span>
              <p style={{fontSize:13,color:"var(--ink2)",lineHeight:1.55}}>{t}</p>
            </div>
          ))}
        </div>
      )}
      <button className="btn btn-ink btn-lg" style={{alignSelf:"stretch",justifyContent:"center",marginTop:6}} onClick={()=>onNext({})}>
        Open {data.name} →
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MODULE PAGE
   ════════════════════════════════════════════════════════════════════════════ */
function ModulePage({mod,onBack,onUpdate,onOpenLesson,notify}){
  const [tab,setTab]=useState("overview");
  const [showInstr,setShowInstr]=useState(false);
  const [instr,setInstr]=useState(mod.instructions||"");
  const c=col(mod.color);
  const lessons=mod.lessons||[];
  const past=lessons.filter(l=>l.status==="past"||l.notes).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const upcoming=lessons.filter(l=>l.status==="upcoming"&&!l.notes).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const todayStr=new Date().toISOString().split("T")[0];

  // Habit infer check
  const habitCheck=useCallback(()=>{
    const lp=mod.learningProfile||{};
    const log=mod.habitLog||[];
    if(log.length>=3&&lp.processingStyle==="unknown"){
      const bigPCount=log.filter(h=>h.preferredOrder==="big-picture").length;
      const detailCount=log.filter(h=>h.preferredOrder==="detail-first").length;
      const inferred=bigPCount>=detailCount?"big-picture":"detail-first";
      return inferred;
    }
    return null;
  },[mod]);

  const [habitSuggestion,setHabitSuggestion]=useState(null);
  useEffect(()=>{const s=habitCheck();if(s)setHabitSuggestion(s);},[habitCheck]);

  async function saveInstr(){
    await onUpdate({...mod,instructions:instr});
    notify("Instructions saved");setShowInstr(false);
  }

  async function acceptHabit(){
    await onUpdate({...mod,learningProfile:{...mod.learningProfile,processingStyle:habitSuggestion}});
    setHabitSuggestion(null);notify("Learning style updated ✓");
  }

  return(
    <div style={{minHeight:"100vh",background:"var(--paper)",display:"flex",flexDirection:"column"}}>
      <style>{FONTS}{STYLES}</style>

      {/* Header */}
      <header style={{background:"var(--white)",borderBottom:"1px solid var(--paper2)"}}>
        <div style={{padding:"14px 36px",display:"flex",alignItems:"center",gap:14}}>
          <button className="btn btn-ghost btn-sm" onClick={onBack}>← Dashboard</button>
          <div style={{flex:1}}/>
          <button className="btn btn-ghost btn-sm" onClick={()=>setShowInstr(!showInstr)}>⚙️ Instructions</button>
        </div>

        {showInstr&&(
          <div className="fu" style={{margin:"0 36px 18px",padding:"18px 22px",background:"var(--paper)",borderRadius:12,border:"1.5px solid var(--paper3)"}}>
            <p style={{fontSize:13,fontWeight:600,color:"var(--ink)",marginBottom:6}}>Custom AI Instructions for {mod.name}</p>
            <p style={{fontSize:12,color:"var(--ink3)",marginBottom:10,lineHeight:1.5}}>Tell StudyOS how to behave for this module. e.g. "Always extract vocab as a table" or "Flag anything exam-relevant."</p>
            <textarea className="inp" value={instr} onChange={e=>setInstr(e.target.value)} style={{height:80,resize:"vertical",lineHeight:1.6}} placeholder="Custom instructions…"/>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:10}}>
              <button className="btn btn-ghost btn-sm" onClick={()=>setShowInstr(false)}>Cancel</button>
              <button className="btn btn-ink btn-sm" onClick={saveInstr}>Save</button>
            </div>
          </div>
        )}

        {/* Habit suggestion banner */}
        {habitSuggestion&&(
          <div className="fu" style={{margin:"0 36px 16px",padding:"13px 18px",background:"var(--amber-bg)",borderRadius:10,border:"1.5px solid var(--amber)",display:"flex",gap:14,alignItems:"center"}}>
            <span style={{fontSize:18}}>🧠</span>
            <p style={{fontSize:13,color:"var(--amber)",flex:1,lineHeight:1.5}}>Based on your last 3 sessions, I think you prefer <strong>{habitSuggestion==="big-picture"?"big picture first":"details first"}</strong> — want me to set that?</p>
            <button className="btn btn-amber btn-sm" onClick={acceptHabit}>Yes, set it</button>
            <button className="btn btn-ghost btn-sm" onClick={()=>setHabitSuggestion(null)}>Not now</button>
          </div>
        )}

        {/* Module hero */}
        <div style={{padding:"22px 36px 0",borderTop:`3px solid ${c.accent}`}}>
          <div style={{display:"flex",alignItems:"flex-end",gap:18,marginBottom:14}}>
            <span style={{fontSize:48}}>{mod.emoji}</span>
            <div>
              <h1 style={{fontSize:30,letterSpacing:"-0.4px",color:"var(--ink)",marginBottom:5}}>{mod.name}</h1>
              <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                <span className="tag" style={{background:c.bg,color:c.text}}>{SUBJECT_TYPES.find(s=>s.id===mod.subjectType)?.label}</span>
                {mod.schedule&&<span style={{fontSize:12,color:"var(--ink3)"}}>📅 {mod.schedule}</span>}
                <span style={{fontSize:12,color:"var(--ink3)"}}>📝 {past.length} notes · {upcoming.length} upcoming</span>
              </div>
            </div>
          </div>
          {/* Tabs */}
          <div style={{display:"flex",gap:0,borderTop:"1px solid var(--paper2)",marginTop:4}}>
            {[["overview","🗓 Overview"],["notes","📝 Notes"],["content","📋 Contents"],["revise","🧠 Revise"]].map(([id,label])=>(
              <button key={id} className={`tab-btn${tab===id?" active":""}`} onClick={()=>setTab(id)} style={{color:tab===id?"var(--ink)":"var(--ink3)"}}>{label}</button>
            ))}
          </div>
        </div>
      </header>

      <main style={{flex:1,padding:"28px 36px",maxWidth:960,margin:"0 auto",width:"100%"}}>
        {tab==="overview"&&<OverviewTab mod={mod} upcoming={upcoming} past={past} c={c} todayStr={todayStr} onOpenLesson={onOpenLesson}/>}
        {tab==="notes"&&<NotesTab mod={mod} past={past} upcoming={upcoming} c={c} onOpenLesson={onOpenLesson} onUpdate={onUpdate} notify={notify}/>}
        {tab==="content"&&<ContentTab mod={mod} c={c} onOpenLesson={onOpenLesson}/>}
        {tab==="revise"&&<ReviseTab mod={mod} c={c} notify={notify}/>}
      </main>
    </div>
  );
}

/* ── Overview tab ── */
function OverviewTab({mod,upcoming,past,c,todayStr,onOpenLesson}){
  return(
    <div>
      {/* Study profile */}
      {mod.studyProfile&&(
        <div className="card fu1" style={{padding:"18px 22px",marginBottom:24,borderLeft:`3px solid ${c.accent}`}}>
          <p style={{fontSize:11,fontWeight:700,color:"var(--ink3)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Your Study Approach</p>
          <p style={{fontSize:14,color:"var(--ink2)",lineHeight:1.65}}>{mod.studyProfile}</p>
        </div>
      )}
      {/* Upcoming */}
      {upcoming.length>0&&(
        <section className="fu2" style={{marginBottom:32}}>
          <Label>Upcoming Lessons</Label>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12}}>
            {upcoming.slice(0,8).map((l,i)=><UpcomingCard key={l.id} l={l} c={c} i={i} onClick={()=>onOpenLesson(l)} todayStr={todayStr}/>)}
          </div>
        </section>
      )}
      {/* Past with notes */}
      {past.length>0&&(
        <section className="fu3">
          <Label>Recent Notes</Label>
          {past.slice(0,4).map((l,i)=><NoteRow key={l.id} l={l} c={c} i={i} onClick={()=>onOpenLesson(l)}/>)}
        </section>
      )}
      {upcoming.length===0&&past.length===0&&(
        <div className="card" style={{padding:"48px 32px",textAlign:"center"}}>
          <div style={{fontSize:44,marginBottom:14}}>📅</div>
          <h3 style={{fontSize:19,marginBottom:8}}>No lessons yet</h3>
          <p style={{color:"var(--ink3)",fontSize:14}}>Set up a lesson schedule in module settings to generate your lesson calendar.</p>
        </div>
      )}
    </div>
  );
}

/* ── Notes tab ── */
function NotesTab({mod,past,upcoming,c,onOpenLesson,onUpdate,notify}){
  const [addingPast,setAddingPast]=useState(false);
  const [newDate,setNewDate]=useState("");

  async function addPastLesson(){
    if(!newDate)return;
    const nl={id:`l-manual-${Date.now()}`,date:newDate,time:"",status:"past",rawDump:"",notes:"",summary:"",topics:[],manual:true};
    await onUpdate({...mod,lessons:[...(mod.lessons||[]),nl]});
    setAddingPast(false);setNewDate("");
    notify("Past lesson added");
  }

  const all=[...past,...upcoming].sort((a,b)=>new Date(b.date)-new Date(a.date));
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <Label>All Lessons</Label>
        <button className="btn btn-ghost btn-sm" onClick={()=>setAddingPast(!addingPast)}>+ Add past lesson</button>
      </div>
      {addingPast&&(
        <div className="card fu" style={{padding:"16px 20px",marginBottom:18,display:"flex",gap:12,alignItems:"center"}}>
          <input type="date" className="inp" value={newDate} onChange={e=>setNewDate(e.target.value)} style={{width:"auto"}}/>
          <button className="btn btn-ink btn-sm" onClick={addPastLesson} disabled={!newDate}>Add Lesson</button>
          <button className="btn btn-ghost btn-sm" onClick={()=>setAddingPast(false)}>Cancel</button>
        </div>
      )}
      {all.length===0&&<p style={{color:"var(--ink3)",fontSize:14}}>No lessons yet. Add your first past lesson above or set up a schedule.</p>}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {all.map((l,i)=>(
          <div key={l.id} onClick={()=>onOpenLesson(l)} className="card" style={{padding:"16px 20px",cursor:"pointer",display:"flex",gap:16,alignItems:"center",transition:"all .2s"}}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateX(4px)";e.currentTarget.style.boxShadow="var(--shadow-lg)"}}
            onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=""}}>
            <div style={{minWidth:52,textAlign:"center",padding:"8px 10px",background:c.bg,borderRadius:8}}>
              <div style={{fontFamily:"Lora,serif",fontSize:19,color:c.text,lineHeight:1}}>{new Date(l.date).getDate()}</div>
              <div style={{fontSize:10,color:c.text,opacity:.75}}>{new Date(l.date).toLocaleDateString("en-GB",{month:"short"})}</div>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:3}}>
                <span style={{fontSize:13,fontWeight:600,color:"var(--ink)"}}>{new Date(l.date).toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}</span>
                {l.notes?<span className="tag" style={{background:"#DCFCE7",color:"#166534",fontSize:10}}>✓ Notes</span>
                  :l.status==="past"?<span className="tag" style={{background:"var(--rose-bg)",color:"var(--rose)",fontSize:10}}>Missing notes</span>
                  :<span className="tag" style={{background:"var(--paper2)",color:"var(--ink3)",fontSize:10}}>Upcoming</span>}
              </div>
              {l.summary&&<p style={{fontSize:12,color:"var(--ink3)",lineHeight:1.5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical"}}>{l.summary}</p>}
              {!l.notes&&l.status==="past"&&<p style={{fontSize:12,color:"var(--rose)",opacity:.8}}>Click to add notes for this lesson</p>}
            </div>
            <span style={{fontSize:16,color:"var(--ink4)"}}>→</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Content page tab ── */
function ContentTab({mod,c,onOpenLesson}){
  const lessons=(mod.lessons||[]).filter(l=>l.notes).sort((a,b)=>new Date(a.date)-new Date(b.date));
  return(
    <div>
      <div style={{marginBottom:20}}>
        <h2 style={{fontSize:20,marginBottom:6,color:"var(--ink)"}}>{mod.name} — Contents</h2>
        <p style={{fontSize:13,color:"var(--ink3)",lineHeight:1.6}}>Auto-generated after each lesson. Updated as you add notes.</p>
      </div>
      {lessons.length===0?(
        <div className="card" style={{padding:"40px 32px",textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:12}}>📋</div>
          <h3 style={{fontSize:18,marginBottom:8}}>No content yet</h3>
          <p style={{color:"var(--ink3)",fontSize:14}}>This page will fill in automatically as you complete lesson notes.</p>
        </div>
      ):(
        <div className="card" style={{overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{background:"var(--paper2)"}}>
                <th style={{padding:"11px 18px",textAlign:"left",fontSize:12,fontWeight:700,color:"var(--ink3)",textTransform:"uppercase",letterSpacing:"0.07em",width:130}}>Date</th>
                <th style={{padding:"11px 18px",textAlign:"left",fontSize:12,fontWeight:700,color:"var(--ink3)",textTransform:"uppercase",letterSpacing:"0.07em"}}>Topics Covered</th>
                <th style={{padding:"11px 18px",textAlign:"left",fontSize:12,fontWeight:700,color:"var(--ink3)",textTransform:"uppercase",letterSpacing:"0.07em",width:80}}></th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((l,i)=>(
                <tr key={l.id} style={{borderTop:"1px solid var(--paper2)",background:i%2===0?"var(--white)":"var(--paper)"}}>
                  <td style={{padding:"13px 18px",fontSize:13,color:"var(--ink3)",whiteSpace:"nowrap"}}>
                    {new Date(l.date).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"2-digit"})}
                  </td>
                  <td style={{padding:"13px 18px"}}>
                    <p style={{fontSize:13,color:"var(--ink)",lineHeight:1.5,margin:0}}>{l.topics?.join(" · ")||l.summary?.slice(0,120)||"—"}</p>
                  </td>
                  <td style={{padding:"13px 18px"}}>
                    <button className="btn btn-ghost btn-sm" onClick={()=>onOpenLesson(l)} style={{fontSize:12}}>Open →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Revise tab ── */
function ReviseTab({mod,c,notify}){
  const [msgs,setMsgs]=useState([]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [started,setStarted]=useState(false);
  const bottomRef=useRef();

  const notesContext=(mod.lessons||[]).filter(l=>l.notes).map(l=>`=== Lesson ${l.date} ===\nTopics: ${(l.topics||[]).join(", ")}\n${l.notes}`).join("\n\n");

  async function start(){
    setStarted(true);
    setLoading(true);
    const sysPrompt=`You are StudyOS's revision tutor for ${mod.name} (${mod.subjectType}).
SYLLABUS:\n${mod.syllabus||"Not provided"}
ASSESSMENT CRITERIA:\n${mod.assessmentCriteria||"Not provided"}
LESSON NOTES:\n${notesContext||"No notes yet"}
CUSTOM INSTRUCTIONS:\n${mod.instructions||"None"}

Rules:
- Ask the student what they want to revise. If they say "I don't know", suggest 2-3 specific topics from the syllabus/notes.
- When answering questions or testing knowledge, ALWAYS cite the source: e.g. "(from Lesson ${new Date().toLocaleDateString("en-GB")}" or "(Syllabus: Unit 2)".
- Ask follow-up questions to test understanding. Don't just lecture.
- Be warm and encouraging. Keep responses concise.
- If they get something wrong, gently correct and re-explain.`;

    let out="";
    try{
      out=await callAI(sysPrompt,[{role:"user",content:"Hi, I want to start revising."}],
        txt=>{setMsgs([{role:"ai",text:txt}]);}
      );
      setMsgs([{role:"ai",text:out}]);
    }catch{notify("Could not connect","err");}
    setLoading(false);
  }

  async function send(){
    if(!input.trim()||loading)return;
    const userMsg={role:"user",text:input};
    const newMsgs=[...msgs,userMsg];
    setMsgs(newMsgs);setInput("");setLoading(true);

    const sysPrompt=`You are StudyOS's revision tutor for ${mod.name} (${mod.subjectType}).
SYLLABUS:\n${mod.syllabus||"Not provided"}
ASSESSMENT CRITERIA:\n${mod.assessmentCriteria||"Not provided"}
LESSON NOTES:\n${notesContext||"No notes yet"}
CUSTOM INSTRUCTIONS:\n${mod.instructions||"None"}

Rules:
- Answer questions using only the provided syllabus and lesson notes.
- ALWAYS cite where info comes from: e.g. "(Lesson ${new Date().toLocaleDateString("en-GB")})" or "(Syllabus: Unit 2)".
- If the topic isn't in the notes/syllabus, say so and suggest what lesson it might be in.
- Ask follow-up questions to check understanding. Keep responses concise and engaging.
- Be encouraging. If they get something wrong, correct gently.`;

    const apiMsgs=newMsgs.map(m=>({role:m.role==="ai"?"assistant":"user",content:m.text}));
    let out="";
    try{
      const streamMsgs=[...newMsgs,{role:"ai",text:""}];
      out=await callAI(sysPrompt,apiMsgs,
        txt=>{setMsgs([...newMsgs,{role:"ai",text:txt}]);}
      );
      setMsgs([...newMsgs,{role:"ai",text:out}]);
    }catch{notify("Connection error","err");}
    setLoading(false);
    setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}),100);
  }

  if(!started){
    return(
      <div style={{textAlign:"center",padding:"60px 20px"}}>
        <div style={{fontSize:48,marginBottom:16}}>🧠</div>
        <h2 style={{fontSize:24,marginBottom:10,color:"var(--ink)"}}>Revision Mode</h2>
        <p style={{color:"var(--ink3)",fontSize:15,maxWidth:400,margin:"0 auto 28px",lineHeight:1.7}}>
          StudyOS will quiz you on your notes and syllabus, cite sources, and guide you to what you need to focus on.
        </p>
        {notesContext?
          <button className="btn btn-amber btn-lg" onClick={start}>Start Revising →</button>
          :<div style={{padding:"16px 20px",background:"var(--paper2)",borderRadius:10,fontSize:14,color:"var(--ink3)",maxWidth:380,margin:"0 auto"}}>
            Add lesson notes first — then revision mode will use them as your study material.
          </div>
        }
      </div>
    );
  }

  return(
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 280px)",minHeight:400}}>
      {/* Chat area */}
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:14,paddingBottom:16}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
            {m.role==="ai"&&(
              <div style={{width:30,height:30,borderRadius:"50%",background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginRight:10,fontSize:14,marginTop:2}}>{mod.emoji}</div>
            )}
            <div style={{maxWidth:"75%",padding:"13px 17px",borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",background:m.role==="user"?"var(--ink)":"var(--white)",color:m.role==="user"?"var(--white)":"var(--ink)",fontSize:14,lineHeight:1.7,boxShadow:"var(--shadow)"}}>
              {m.role==="ai"?<div dangerouslySetInnerHTML={{__html:md(m.text)}}/>:m.text}
            </div>
          </div>
        ))}
        {loading&&(
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:30,height:30,borderRadius:"50%",background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{mod.emoji}</div>
            <div className="card" style={{padding:"11px 16px",display:"flex",gap:5}}>
              <span className="dot"/><span className="dot"/><span className="dot"/>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>
      {/* Input */}
      <div style={{display:"flex",gap:10,paddingTop:12,borderTop:"1px solid var(--paper2)"}}>
        <input className="inp" value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),send())}
          placeholder="Ask anything, or say 'test me'…" style={{flex:1}}/>
        <button className="btn btn-amber" onClick={send} disabled={!input.trim()||loading}>Send</button>
      </div>
    </div>
  );
}

/* ── Small card helpers ── */
function UpcomingCard({l,c,i,onClick,todayStr}){
  const d=new Date(l.date);
  const isToday=l.date===todayStr;
  return(
    <div className="card" onClick={onClick} style={{padding:"15px 16px",cursor:"pointer",transition:"all .2s",border:isToday?`2px solid ${c.accent}`:"1px solid rgba(26,23,20,.06)",background:isToday?c.bg:"var(--white)"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="var(--shadow-lg)"}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=""}}>
      {isToday&&<div style={{fontSize:10,fontWeight:700,color:c.accent,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:5}}>Today</div>}
      <div style={{fontFamily:"Lora,serif",fontSize:22,color:"var(--ink)",lineHeight:1}}>{d.getDate()}</div>
      <div style={{fontSize:12,color:"var(--ink3)",marginTop:3}}>{d.toLocaleDateString("en-GB",{weekday:"short",month:"short"})}</div>
      {l.time&&<div style={{fontSize:11,color:"var(--ink4)",marginTop:3}}>🕐 {l.time}</div>}
      <div style={{marginTop:10,fontSize:12,color:c.accent,fontWeight:600}}>Open →</div>
    </div>
  );
}

function NoteRow({l,c,i,onClick}){
  const d=new Date(l.date);
  return(
    <div className="card" onClick={onClick} style={{padding:"16px 20px",cursor:"pointer",display:"flex",gap:15,alignItems:"center",marginBottom:10,transition:"all .2s"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateX(4px)";e.currentTarget.style.boxShadow="var(--shadow-lg)"}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=""}}>
      <div style={{minWidth:50,textAlign:"center",padding:"7px 10px",background:c.bg,borderRadius:8}}>
        <div style={{fontFamily:"Lora,serif",fontSize:18,color:c.text,lineHeight:1}}>{d.getDate()}</div>
        <div style={{fontSize:10,color:c.text,opacity:.75}}>{d.toLocaleDateString("en-GB",{month:"short"})}</div>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:600,color:"var(--ink)",marginBottom:3}}>
          {d.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}
        </div>
        {l.summary&&<p style={{fontSize:12,color:"var(--ink3)",lineHeight:1.5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{l.summary}</p>}
      </div>
      <span style={{fontSize:16,color:"var(--ink4)"}}>→</span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   LESSON PAGE
   ════════════════════════════════════════════════════════════════════════════ */
function LessonPage({lesson,mod,onBack,onUpdate,notify}){
  const [tab,setTab]=useState(lesson.notes?"notes":"dump");
  const [dump,setDump]=useState(lesson.rawDump||"");
  const [processing,setProcessing]=useState(false);
  const [stream,setStream]=useState("");
  const [checkIn,setCheckIn]=useState({familiar:"",depth:mod.learningProfile?.noteStyle==="summary-first"?"summary-first":"detail-first",confusion:""});
  const c=col(mod.color);
  const date=new Date(lesson.date);

  const lp=mod.learningProfile||{};
  const noteOrderPref=lp.noteStyle||"unknown";

  async function process(){
    if(!dump.trim())return;
    setProcessing(true);setStream("");setTab("notes");

    const processStyle=lp.processingStyle==="unknown"||!lp.processingStyle?"balanced":lp.processingStyle;
    const noteStyle=checkIn.depth==="summary-first"?"Start with a ## Summary section, then the full detailed notes":"Start with full detailed notes, then end with a ## Summary section";

    const sys=`You are StudyOS organising lesson notes for ${mod.name} (${mod.subjectType}).
SYLLABUS: ${mod.syllabus||"Not provided"}
ASSESSMENT CRITERIA: ${mod.assessmentCriteria||"Not provided"}
CUSTOM INSTRUCTIONS: ${mod.instructions||"None"}
LEARNING PROFILE: processing=${processStyle}, memory=${lp.memoryStyle||"mixed"}${lp.memoryOther?` (${lp.memoryOther})`:""}
FAMILIARITY: ${checkIn.familiar||"not stated"}
CONFUSION FLAGS: ${checkIn.confusion||"none"}

Format rules:
- ${noteStyle}
- Use markdown: ## for sections, **bold** for key terms, bullet lists for items
- ${mod.subjectType==="language"?"Include a ## 📚 New Vocabulary section: **word** — definition — *example sentence*":""}
- ${mod.subjectType==="stem"?"Include a ## 🔬 Key Concepts / Formulas section":""}
- ${mod.subjectType==="essay"?"Include a ## 🗝 Key Themes & Arguments section":""}
- Flag exam-relevant content with ⭐
- ${checkIn.confusion?`Address confusion about: "${checkIn.confusion}" clearly in the notes`:""}
- End with a JSON block on the very last line (and ONLY the last line): {"topics":["topic1","topic2","topic3"]}
This JSON line will be stripped from display — do not mention it.`;

    let full="";
    try{
      full=await callAI(sys,[{role:"user",content:`Raw lesson notes:\n\n${dump}`}],txt=>{
        // Strip trailing JSON line from display
        const display=txt.replace(/\n?\{"topics":\[.*?\]\}\s*$/,"");
        setStream(display);
      });

      // Extract topics JSON
      let topics=[];
      const jsonMatch=full.match(/\{"topics":\[.*?\]\}\s*$/);
      if(jsonMatch){try{topics=JSON.parse(jsonMatch[0]).topics;}catch{}}
      const notesDisplay=full.replace(/\n?\{"topics":\[.*?\]\}\s*$/,"").trim();

      // Extract summary (last ## Summary section)
      const sumMatch=notesDisplay.match(/## Summary\n([\s\S]+?)(?=\n##|$)/);
      const summary=sumMatch?sumMatch[1].trim():notesDisplay.slice(0,200);

      // Log habit for inference
      const habitEntry={date:lesson.date,preferredOrder:checkIn.depth==="summary-first"?"big-picture":"detail-first"};
      const updatedMod={...mod,habitLog:[...(mod.habitLog||[]),habitEntry]};

      const updatedLesson={...lesson,rawDump:dump,notes:notesDisplay,summary,topics,status:lesson.date<new Date().toISOString().split("T")[0]?"past":"upcoming",processedAt:new Date().toISOString()};

      // Update content page
      const cp=(updatedMod.lessons||[]).filter(l=>l.notes||l.id===updatedLesson.id).map(l=>({
        id:l.id,date:l.date,topics:l.id===updatedLesson.id?topics:(l.topics||[]),summary:l.id===updatedLesson.id?summary:l.summary
      }));
      updatedMod.contentPage=cp;
      updatedMod.lessons=(updatedMod.lessons||[]).map(l=>l.id===updatedLesson.id?updatedLesson:l);
      await onUpdate(updatedLesson);
      // Also pass mod update up — we'll do it via onUpdate which only updates lesson; mod habits tracked separately
      notify("Notes organised! ✨");
    }catch(e){notify("Failed to process","err");}
    setProcessing(false);
  }

  const notesText=lesson.notes||stream;

  return(
    <div style={{minHeight:"100vh",background:"var(--paper)",display:"flex",flexDirection:"column"}}>
      <style>{FONTS}{STYLES}</style>
      <header style={{padding:"14px 36px",borderBottom:"1px solid var(--paper2)",background:"var(--white)",display:"flex",alignItems:"center",gap:14}}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← {mod.name}</button>
        <div style={{flex:1}}>
          <span style={{fontSize:14,fontWeight:600,color:"var(--ink)"}}>{date.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</span>
          {lesson.time&&<span style={{fontSize:13,color:"var(--ink3)",marginLeft:10}}>🕐 {lesson.time}</span>}
        </div>
        {lesson.notes&&<span className="tag" style={{background:"#DCFCE7",color:"#166534"}}>✓ Notes done</span>}
      </header>

      <div style={{padding:"0 36px",background:"var(--white)",borderBottom:"1px solid var(--paper2)",display:"flex",gap:0}}>
        {[["dump","🧠 Brain Dump"],["notes","📝 Notes"]].map(([id,label])=>(
          <button key={id} className={`tab-btn${tab===id?" active":""}`} onClick={()=>setTab(id)}>{label}</button>
        ))}
      </div>

      <main style={{flex:1,padding:"28px 36px",maxWidth:860,margin:"0 auto",width:"100%"}}>
        {tab==="dump"&&(
          <div className="fu">
            <h2 style={{fontSize:21,marginBottom:6,color:"var(--ink)"}}>Brain Dump</h2>
            <p style={{fontSize:14,color:"var(--ink3)",lineHeight:1.65,marginBottom:20}}>Write everything from today's class — raw, messy, incomplete. StudyOS will structure it all.</p>

            {/* Check-in */}
            <div className="card fu1" style={{padding:"18px 22px",marginBottom:20,background:"var(--amber-bg)",border:`1px solid ${c.accent}33`}}>
              <p style={{fontSize:12,fontWeight:700,color:"var(--amber)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:14}}>Quick check-in</p>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div>
                  <p style={{fontSize:13,fontWeight:500,color:"var(--ink2)",marginBottom:8}}>How did today's lesson feel?</p>
                  <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                    {[{v:"familiar",l:"😌 Familiar"},{v:"mixed",l:"🤔 Some new stuff"},{v:"new",l:"🤯 Lots new"}].map(o=>(
                      <button key={o.v} onClick={()=>setCheckIn(ci=>({...ci,familiar:o.v}))} style={{padding:"7px 12px",borderRadius:8,fontSize:12,cursor:"pointer",border:checkIn.familiar===o.v?"2px solid var(--amber)":"2px solid transparent",background:checkIn.familiar===o.v?"var(--amber)":"var(--white)",color:checkIn.familiar===o.v?"white":"var(--ink2)",fontFamily:"inherit",transition:"all .12s"}}>{o.l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{fontSize:13,fontWeight:500,color:"var(--ink2)",marginBottom:8}}>
                    How do you want to encounter these notes?
                    {noteOrderPref==="unknown"&&<span style={{fontSize:11,color:"var(--ink3)",marginLeft:6}}>(we'll learn your preference from this)</span>}
                  </p>
                  <div style={{display:"flex",gap:7}}>
                    {[{v:"summary-first",l:"📋 Summary first, then detail"},{v:"detail-first",l:"📄 Full detail, then summary"}].map(o=>(
                      <button key={o.v} onClick={()=>setCheckIn(ci=>({...ci,depth:o.v}))} style={{padding:"7px 12px",borderRadius:8,fontSize:12,cursor:"pointer",border:checkIn.depth===o.v?"2px solid var(--amber)":"2px solid transparent",background:checkIn.depth===o.v?"var(--amber)":"var(--white)",color:checkIn.depth===o.v?"white":"var(--ink2)",fontFamily:"inherit",transition:"all .12s"}}>{o.l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{fontSize:13,fontWeight:500,color:"var(--ink2)",marginBottom:6}}>Anything confusing? <span style={{fontWeight:400,color:"var(--ink3)"}}>(optional)</span></p>
                  <input className="inp" value={checkIn.confusion} onChange={e=>setCheckIn(ci=>({...ci,confusion:e.target.value}))} placeholder="e.g. The difference between ser and estar…" style={{fontSize:13}}/>
                </div>
              </div>
            </div>

            <textarea className="inp" value={dump} onChange={e=>setDump(e.target.value)}
              placeholder={`Just write everything from today's ${mod.name} lesson. Don't worry about structure or spelling.\n\nExample: "teacher talked about preterite tense, basically past tense, -ar verbs change to -é -aste -ó, she said this will be on exam, fui al mercado = I went to the market, key thing is irregular verbs like ser/ir both use same form..."`}
              style={{minHeight:260,lineHeight:1.8,fontSize:15,resize:"vertical"}}/>
            <div style={{marginTop:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:12,color:"var(--ink4)"}}>{dump.trim().split(/\s+/).filter(Boolean).length} words</span>
              <button className="btn btn-amber btn-lg" onClick={process} disabled={!dump.trim()||processing}>
                {processing?<><span className="dot"/><span className="dot"/><span className="dot"/> Organising…</>:"✨ Organise My Notes →"}
              </button>
            </div>
          </div>
        )}

        {tab==="notes"&&(
          <div className="fu">
            {!notesText&&!processing&&(
              <div style={{textAlign:"center",padding:"70px 20px"}}>
                <div style={{fontSize:44,marginBottom:14}}>📝</div>
                <h3 style={{fontSize:19,marginBottom:8}}>No notes yet</h3>
                <p style={{color:"var(--ink3)",fontSize:14,marginBottom:22}}>Go to Brain Dump to add your lesson notes.</p>
                <button className="btn btn-ink" onClick={()=>setTab("dump")}>Go to Brain Dump →</button>
              </div>
            )}
            {processing&&!notesText&&(
              <div style={{textAlign:"center",padding:"70px 20px"}}>
                <div style={{fontSize:44,marginBottom:14,animation:"spin 2s linear infinite",display:"inline-block"}}>✨</div>
                <h3 style={{fontSize:19,marginBottom:8}}>Organising your notes…</h3>
                <p style={{color:"var(--ink3)",fontSize:14}}>Reading your dump and structuring everything.</p>
              </div>
            )}
            {notesText&&(
              <div className="card fu" style={{padding:"32px 36px"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:22,paddingBottom:16,borderBottom:"1px solid var(--paper2)"}}>
                  <span style={{fontSize:22}}>{mod.emoji}</span>
                  <div>
                    <div style={{fontFamily:"Lora,serif",fontSize:16,color:"var(--ink)"}}>
                      {date.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
                    </div>
                    <div style={{fontSize:12,color:c.text,fontWeight:500}}>{mod.name}</div>
                  </div>
                  {processing&&<div style={{marginLeft:"auto",display:"flex",gap:5,alignItems:"center",fontSize:12,color:"var(--ink3)"}}><span className="dot"/><span className="dot"/><span className="dot"/><span style={{marginLeft:4}}>Writing…</span></div>}
                </div>
                <div style={{fontSize:14,color:"var(--ink2)",lineHeight:1.85}} dangerouslySetInnerHTML={{__html:md(notesText)}}/>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
