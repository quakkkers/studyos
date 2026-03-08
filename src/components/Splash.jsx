export default function Splash() {
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"var(--paper)"}}>
      <div style={{fontSize:44,marginBottom:14}}>📖</div>
      <h1 style={{fontSize:32,letterSpacing:"-0.5px",color:"var(--ink)"}}>StudyOS</h1>
      <p style={{color:"var(--ink3)",marginTop:8,fontSize:14}}>Loading your study space</p>
      <div style={{marginTop:22,display:"flex",gap:6}}>
        <span className="dot"/>
        <span className="dot"/>
        <span className="dot"/>
      </div>
    </div>
  );
}
