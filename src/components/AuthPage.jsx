import { useState } from 'react';
import { supabase } from '../supabase';

export default function AuthPage({ onSuccess, notify }) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleEmailAuth(e) {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        notify('Check your email to confirm your account');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onSuccess();
      }
    } catch (error) {
      notify(error.message, 'err');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://quakkkers-studyos-im-zpsp.bolt.host'
        }
      });
      if (error) throw error;
    } catch (error) {
      notify(error.message, 'err');
      setLoading(false);
    }
  }

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--paper)",padding:"20px"}}>
      <div className="card" style={{width:"100%",maxWidth:420,padding:"40px 36px"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:48,marginBottom:12}}>📖</div>
          <h1 style={{fontSize:28,marginBottom:8,color:"var(--ink)"}}>Welcome to StudyOS</h1>
          <p style={{fontSize:14,color:"var(--ink3)",lineHeight:1.6}}>
            Your self-organizing study companion
          </p>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="btn btn-ink btn-lg"
          style={{width:"100%",justifyContent:"center",marginBottom:20}}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9.003 18z" fill="#34A853"/>
            <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.427 0 9.002 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29c.708-2.127 2.692-3.71 5.039-3.71z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <div style={{flex:1,height:1,background:"var(--paper3)"}}/>
          <span style={{fontSize:12,color:"var(--ink3)"}}>or</span>
          <div style={{flex:1,height:1,background:"var(--paper3)"}}/>
        </div>

        <form onSubmit={handleEmailAuth} style={{display:"flex",flexDirection:"column",gap:16}}>
          <div>
            <label style={{fontSize:13,fontWeight:600,color:"var(--ink2)",display:"block",marginBottom:7}}>
              Email
            </label>
            <input
              type="email"
              className="inp"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label style={{fontSize:13,fontWeight:600,color:"var(--ink2)",display:"block",marginBottom:7}}>
              Password
            </label>
            <input
              type="password"
              className="inp"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{width:"100%",justifyContent:"center"}}
          >
            {loading ? (
              <>
                <span className="dot"/>
                <span className="dot"/>
                <span className="dot"/>
              </>
            ) : mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div style={{textAlign:"center",marginTop:20}}>
          <button
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            style={{background:"none",border:"none",color:"var(--ink3)",fontSize:13,cursor:"pointer",textDecoration:"underline"}}
          >
            {mode === 'signin' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
