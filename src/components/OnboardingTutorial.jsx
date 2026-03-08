import { useState } from 'react';

export default function OnboardingTutorial({ profile, onComplete }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to StudyOS",
      icon: "👋",
      content: (
        <div style={{textAlign:"center"}}>
          <p style={{fontSize:16,color:"var(--ink2)",lineHeight:1.7,marginBottom:20}}>
            StudyOS is your self-organizing study companion that remembers everything so you don't have to re-explain yourself every session.
          </p>
          <div style={{display:"flex",flexDirection:"column",gap:12,textAlign:"left"}}>
            <div style={{padding:"14px 16px",background:"var(--primary-bg)",borderRadius:10}}>
              <div style={{fontWeight:600,fontSize:14,marginBottom:4,color:"var(--ink)"}}>Set it up once</div>
              <div style={{fontSize:13,color:"var(--ink3)",lineHeight:1.6}}>Add your syllabus, term dates, and learning preferences per subject</div>
            </div>
            <div style={{padding:"14px 16px",background:"var(--secondary-bg)",borderRadius:10}}>
              <div style={{fontWeight:600,fontSize:14,marginBottom:4,color:"var(--ink)"}}>Brain dump your notes</div>
              <div style={{fontSize:13,color:"var(--ink3)",lineHeight:1.6}}>Paste messy class notes, StudyOS structures them automatically</div>
            </div>
            <div style={{padding:"14px 16px",background:"var(--primary-bg)",borderRadius:10}}>
              <div style={{fontWeight:600,fontSize:14,marginBottom:4,color:"var(--ink)"}}>Revise smarter</div>
              <div style={{fontSize:13,color:"var(--ink3)",lineHeight:1.6}}>Chat-based revision using your own notes with citations</div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "How Brain Dump Works",
      icon: "🧠",
      content: (
        <div>
          <p style={{fontSize:15,color:"var(--ink2)",lineHeight:1.7,marginBottom:20}}>
            The brain dump is where the magic happens. Here's how it works:
          </p>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{display:"flex",gap:12}}>
              <div style={{fontSize:24,flexShrink:0}}>1️⃣</div>
              <div>
                <div style={{fontWeight:600,fontSize:14,marginBottom:4,color:"var(--ink)"}}>Quick Check-In</div>
                <div style={{fontSize:13,color:"var(--ink3)",lineHeight:1.6}}>
                  Tell us how familiar the material felt and if anything was confusing
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:12}}>
              <div style={{fontSize:24,flexShrink:0}}>2️⃣</div>
              <div>
                <div style={{fontWeight:600,fontSize:14,marginBottom:4,color:"var(--ink)"}}>Paste Your Raw Notes</div>
                <div style={{fontSize:13,color:"var(--ink3)",lineHeight:1.6}}>
                  Write everything from class. Messy, incomplete, bullet points or paragraphs, it doesn't matter
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:12}}>
              <div style={{fontSize:24,flexShrink:0}}>3️⃣</div>
              <div>
                <div style={{fontWeight:600,fontSize:14,marginBottom:4,color:"var(--ink)"}}>AI Structures Everything</div>
                <div style={{fontSize:13,color:"var(--ink3)",lineHeight:1.6}}>
                  StudyOS organizes your notes based on your syllabus, learning style, and module type
                </div>
              </div>
            </div>
          </div>
          <div style={{marginTop:20,padding:"14px 16px",background:"var(--amber-bg)",borderRadius:10,fontSize:13,color:"var(--amber)"}}>
            For language modules, you'll get vocab tables. For STEM, key formulas. For essays, argument maps.
          </div>
        </div>
      )
    },
    {
      title: "Module Organization",
      icon: "📚",
      content: (
        <div>
          <p style={{fontSize:15,color:"var(--ink2)",lineHeight:1.7,marginBottom:20}}>
            Each module you create is a complete subject with:
          </p>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{padding:"12px 14px",background:"var(--white)",border:"1.5px solid var(--paper3)",borderRadius:8}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <span>📅</span>
                <span style={{fontWeight:600,fontSize:13}}>Multiple Terms</span>
              </div>
              <div style={{fontSize:12,color:"var(--ink3)",lineHeight:1.5}}>
                Add Term 1, Term 2, or any custom date range. All lessons auto-generated.
              </div>
            </div>
            <div style={{padding:"12px 14px",background:"var(--white)",border:"1.5px solid var(--paper3)",borderRadius:8}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <span>📋</span>
                <span style={{fontWeight:600,fontSize:13}}>Auto Contents Page</span>
              </div>
              <div style={{fontSize:12,color:"var(--ink3)",lineHeight:1.5}}>
                Every lesson is catalogued with topics covered, updated as you add notes.
              </div>
            </div>
            <div style={{padding:"12px 14px",background:"var(--white)",border:"1.5px solid var(--paper3)",borderRadius:8}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <span>🗓️</span>
                <span style={{fontWeight:600,fontSize:13}}>Calendar Views</span>
              </div>
              <div style={{fontSize:12,color:"var(--ink3)",lineHeight:1.5}}>
                View lessons by week, month, or year. Delete past lessons if needed.
              </div>
            </div>
            <div style={{padding:"12px 14px",background:"var(--white)",border:"1.5px solid var(--paper3)",borderRadius:8}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <span>⚙️</span>
                <span style={{fontWeight:600,fontSize:13}}>Custom Instructions</span>
              </div>
              <div style={{fontSize:12,color:"var(--ink3)",lineHeight:1.5}}>
                Tell the AI how to behave per module in plain English.
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "You're All Set!",
      icon: "🎉",
      content: (
        <div style={{textAlign:"center"}}>
          <p style={{fontSize:16,color:"var(--ink2)",lineHeight:1.7,marginBottom:24}}>
            You're ready to start using StudyOS. Here are some quick tips:
          </p>
          <div style={{display:"flex",flexDirection:"column",gap:10,textAlign:"left",marginBottom:24}}>
            <div style={{fontSize:13,color:"var(--ink3)",lineHeight:1.6}}>
              • Create your first module for any subject or course
            </div>
            <div style={{fontSize:13,color:"var(--ink3)",lineHeight:1.6}}>
              • Add multiple terms to track the full academic year
            </div>
            <div style={{fontSize:13,color:"var(--ink3)",lineHeight:1.6}}>
              • Drag and drop modules to reorder them on your dashboard
            </div>
            <div style={{fontSize:13,color:"var(--ink3)",lineHeight:1.6}}>
              • Customize your color theme in Settings anytime
            </div>
            <div style={{fontSize:13,color:"var(--ink3)",lineHeight:1.6}}>
              • Your data auto-saves to your account as you work
            </div>
          </div>
          <div style={{padding:"16px 18px",background:"var(--primary-bg)",borderRadius:10,fontSize:14,color:"var(--primary)",lineHeight:1.6}}>
            StudyOS learns your study habits. After 3 lessons, we'll suggest your learning style preferences if you skipped them.
          </div>
        </div>
      )
    }
  ];

  const current = steps[step];

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--paper)",padding:"20px"}}>
      <div className="card" style={{width:"100%",maxWidth:600,padding:"40px 36px"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:64,marginBottom:12}}>{current.icon}</div>
          <h2 style={{fontSize:24,marginBottom:8,color:"var(--ink)"}}>{ current.title}</h2>
          <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:16}}>
            {steps.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === step ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i === step ? "var(--primary)" : "var(--paper3)",
                  transition: "all .3s"
                }}
              />
            ))}
          </div>
        </div>

        <div style={{marginBottom:32}}>
          {current.content}
        </div>

        <div style={{display:"flex",justifyContent:"space-between",gap:12}}>
          {step > 0 && (
            <button
              className="btn btn-ghost"
              onClick={() => setStep(step - 1)}
            >
              ← Back
            </button>
          )}
          <div style={{flex:1}} />
          <button
            className="btn btn-primary btn-lg"
            onClick={() => {
              if (step < steps.length - 1) {
                setStep(step + 1);
              } else {
                onComplete();
              }
            }}
          >
            {step < steps.length - 1 ? 'Next →' : 'Get Started →'}
          </button>
        </div>
      </div>
    </div>
  );
}
