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
        notify('Account created successfully! You can now sign in.');
        setMode('signin');
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
