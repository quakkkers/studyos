import { useState } from 'react';
import { COLOR_PALETTES } from '../constants';
import { supabase } from '../supabase';

export default function SettingsPage({ profile, onBack, onUpdate, onSignOut, notify }) {
  const [tab, setTab] = useState('profile');
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [selectedPalette, setSelectedPalette] = useState(profile?.color_palette || 'ocean');
  const [learningStyle, setLearningStyle] = useState(profile?.learning_style || {});

  async function saveProfile() {
    try {
      await onUpdate({
        display_name: displayName,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      notify('Failed to save profile', 'err');
    }
  }

  async function savePalette(paletteId) {
    setSelectedPalette(paletteId);
    try {
      await onUpdate({
        color_palette: paletteId,
        updated_at: new Date().toISOString()
      });
      window.location.reload();
    } catch (error) {
      notify('Failed to save theme', 'err');
    }
  }

  async function saveLearningStyle() {
    try {
      await onUpdate({
        learning_style: learningStyle,
        updated_at: new Date().toISOString()
      });
      notify('Learning style updated');
    } catch (error) {
      notify('Failed to save learning style', 'err');
    }
  }

  async function resetOnboarding() {
    try {
      await onUpdate({
        has_completed_onboarding: false,
        updated_at: new Date().toISOString()
      });
      window.location.reload();
    } catch (error) {
      notify('Failed to reset onboarding', 'err');
    }
  }

  return (
    <div style={{minHeight:"100vh",background:"var(--paper)"}}>
      <header style={{padding:"18px 36px",borderBottom:"1px solid var(--paper2)",background:"var(--white)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <button className="btn btn-ghost btn-sm" onClick={onBack}>← Dashboard</button>
          <h1 style={{fontSize:22,color:"var(--ink)"}}>Settings</h1>
        </div>
        <button className="btn btn-danger btn-sm" onClick={onSignOut}>Sign Out</button>
      </header>

      <div style={{display:"flex",minHeight:"calc(100vh - 70px)"}}>
        <aside style={{width:220,background:"var(--white)",borderRight:"1px solid var(--paper2)",padding:"20px 0"}}>
          {[
            {id: 'profile', label: 'Profile', icon: '👤'},
            {id: 'appearance', label: 'Appearance', icon: '🎨'},
            {id: 'learning', label: 'Learning Style', icon: '🧠'},
            {id: 'advanced', label: 'Advanced', icon: '⚙️'}
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              style={{
                width: '100%',
                padding: '12px 20px',
                textAlign: 'left',
                background: tab === item.id ? 'var(--primary-bg)' : 'transparent',
                border: 'none',
                borderLeft: tab === item.id ? '3px solid var(--primary)' : '3px solid transparent',
                color: tab === item.id ? 'var(--ink)' : 'var(--ink3)',
                fontSize: 14,
                fontWeight: tab === item.id ? 600 : 400,
                cursor: 'pointer',
                transition: 'all .15s',
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </aside>

        <main style={{flex:1,padding:"32px 40px",maxWidth:800}}>
          {tab === 'profile' && (
            <div className="fu">
              <h2 style={{fontSize:20,marginBottom:8,color:"var(--ink)"}}>Profile</h2>
              <p style={{fontSize:14,color:"var(--ink3)",marginBottom:24,lineHeight:1.6}}>
                Manage your account information
              </p>

              <div className="card" style={{padding:"24px 26px",marginBottom:20}}>
                <div style={{marginBottom:20}}>
                  <label style={{fontSize:13,fontWeight:600,color:"var(--ink2)",display:"block",marginBottom:7}}>
                    Email
                  </label>
                  <input
                    type="text"
                    className="inp"
                    value={profile?.email || ''}
                    disabled
                    style={{opacity:0.6}}
                  />
                  <p style={{fontSize:12,color:"var(--ink4)",marginTop:4}}>Email cannot be changed</p>
                </div>

                <div style={{marginBottom:20}}>
                  <label style={{fontSize:13,fontWeight:600,color:"var(--ink2)",display:"block",marginBottom:7}}>
                    Display Name
                  </label>
                  <input
                    type="text"
                    className="inp"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>

                <button className="btn btn-primary" onClick={saveProfile}>
                  Save Changes
                </button>
              </div>

              <div className="card" style={{padding:"20px 24px"}}>
                <div style={{fontSize:13,color:"var(--ink3)",lineHeight:1.6}}>
                  <strong style={{color:"var(--ink2)"}}>Account Created:</strong> {new Date(profile?.created_at).toLocaleDateString('en-GB', {day: 'numeric', month: 'long', year: 'numeric'})}
                </div>
              </div>
            </div>
          )}

          {tab === 'appearance' && (
            <div className="fu">
              <h2 style={{fontSize:20,marginBottom:8,color:"var(--ink)"}}>Appearance</h2>
              <p style={{fontSize:14,color:"var(--ink3)",marginBottom:24,lineHeight:1.6}}>
                Customize the look and feel of StudyOS
              </p>

              <div className="card" style={{padding:"24px 26px"}}>
                <h3 style={{fontSize:16,marginBottom:16,color:"var(--ink)"}}>Color Palette</h3>
                <p style={{fontSize:13,color:"var(--ink3)",marginBottom:20,lineHeight:1.6}}>
                  Choose a color theme for your study space. This affects all interface elements.
                </p>

                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))",gap:16}}>
                  {COLOR_PALETTES.map(palette => (
                    <div
                      key={palette.id}
                      onClick={() => savePalette(palette.id)}
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        border: selectedPalette === palette.id ? `2px solid ${palette.primary}` : '2px solid var(--paper3)',
                        cursor: 'pointer',
                        transition: 'all .2s',
                        background: 'var(--white)'
                      }}
                    >
                      <div style={{display:"flex",gap:6,marginBottom:10}}>
                        <div style={{width:24,height:24,borderRadius:6,background:palette.primary}}/>
                        <div style={{width:24,height:24,borderRadius:6,background:palette.secondary}}/>
                        <div style={{width:24,height:24,borderRadius:6,background:palette.accent}}/>
                      </div>
                      <div style={{fontSize:14,fontWeight:600,color:"var(--ink)",marginBottom:2}}>
                        {palette.name}
                      </div>
                      {selectedPalette === palette.id && (
                        <div style={{fontSize:11,color:palette.primary,fontWeight:600}}>✓ Active</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'learning' && (
            <div className="fu">
              <h2 style={{fontSize:20,marginBottom:8,color:"var(--ink)"}}>Learning Style</h2>
              <p style={{fontSize:14,color:"var(--ink3)",marginBottom:24,lineHeight:1.6}}>
                Update how StudyOS adapts to your learning preferences
              </p>

              <div className="card" style={{padding:"24px 26px"}}>
                <div style={{marginBottom:24}}>
                  <label style={{fontSize:14,fontWeight:600,color:"var(--ink)",display:"block",marginBottom:12}}>
                    When learning something new, you prefer...
                  </label>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                    {[
                      {v: 'big-picture', l: '🗺 Big picture first'},
                      {v: 'detail-first', l: '🔍 Details first'},
                      {v: 'unknown', l: '🤷 Not sure'}
                    ].map(opt => (
                      <button
                        key={opt.v}
                        onClick={() => setLearningStyle({...learningStyle, processingStyle: opt.v})}
                        className="btn"
                        style={{
                          background: learningStyle.processingStyle === opt.v ? 'var(--primary)' : 'var(--white)',
                          color: learningStyle.processingStyle === opt.v ? '#fff' : 'var(--ink2)',
                          border: `2px solid ${learningStyle.processingStyle === opt.v ? 'var(--primary)' : 'var(--paper3)'}`
                        }}
                      >
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{marginBottom:24}}>
                  <label style={{fontSize:14,fontWeight:600,color:"var(--ink)",display:"block",marginBottom:12}}>
                    You remember things best by...
                  </label>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                    {[
                      {v: 'reading', l: '📖 Reading'},
                      {v: 'writing', l: '✍️ Writing'},
                      {v: 'examples', l: '💡 Examples'},
                      {v: 'talking', l: '🗣 Talking'}
                    ].map(opt => (
                      <button
                        key={opt.v}
                        onClick={() => setLearningStyle({...learningStyle, memoryStyle: opt.v})}
                        className="btn btn-sm"
                        style={{
                          background: learningStyle.memoryStyle === opt.v ? 'var(--primary)' : 'var(--white)',
                          color: learningStyle.memoryStyle === opt.v ? '#fff' : 'var(--ink2)',
                          border: `2px solid ${learningStyle.memoryStyle === opt.v ? 'var(--primary)' : 'var(--paper3)'}`
                        }}
                      >
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>

                <button className="btn btn-primary" onClick={saveLearningStyle}>
                  Save Learning Style
                </button>
              </div>
            </div>
          )}

          {tab === 'advanced' && (
            <div className="fu">
              <h2 style={{fontSize:20,marginBottom:8,color:"var(--ink)"}}>Advanced</h2>
              <p style={{fontSize:14,color:"var(--ink3)",marginBottom:24,lineHeight:1.6}}>
                Advanced settings and data management
              </p>

              <div className="card" style={{padding:"24px 26px",marginBottom:20}}>
                <h3 style={{fontSize:15,marginBottom:10,color:"var(--ink)"}}>Restart Tutorial</h3>
                <p style={{fontSize:13,color:"var(--ink3)",marginBottom:16,lineHeight:1.6}}>
                  View the onboarding tutorial again to learn about StudyOS features
                </p>
                <button className="btn btn-ghost" onClick={resetOnboarding}>
                  Restart Onboarding
                </button>
              </div>

              <div className="card" style={{padding:"24px 26px",border:"1.5px solid var(--rose)",background:"var(--rose-bg)"}}>
                <h3 style={{fontSize:15,marginBottom:10,color:"var(--rose)"}}>Danger Zone</h3>
                <p style={{fontSize:13,color:"var(--ink3)",marginBottom:16,lineHeight:1.6}}>
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button
                  className="btn btn-danger"
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete your account? This cannot be undone.')) {
                      try {
                        await supabase.auth.signOut();
                        notify('Account deleted');
                      } catch (error) {
                        notify('Failed to delete account', 'err');
                      }
                    }
                  }}
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
