import { COLOR_PALETTES } from './constants';

export function getGlobalStyles(palette = 'ocean') {
  const selectedPalette = COLOR_PALETTES.find(p => p.id === palette) || COLOR_PALETTES[0];

  return `
    @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Outfit:wght@300;400;500;600;700&display=swap');

    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{
      --paper:#F6F3ED;--paper2:#EDE8DE;--paper3:#E2DACE;
      --ink:#1A1714;--ink2:#3D3830;--ink3:#7A7168;--ink4:#B5ADA3;
      --white:#FFFCF8;
      --primary:${selectedPalette.primary};
      --secondary:${selectedPalette.secondary};
      --accent:${selectedPalette.accent};
      --primary-bg:${selectedPalette.bg};
      --secondary-bg:${selectedPalette.bg2};
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
    .btn-primary{background:var(--primary);color:#fff}
    .btn-primary:hover{background:var(--accent)}
    .btn-amber{background:var(--amber);color:#fff}
    .btn-amber:hover{background:var(--amber-mid)}
    .btn-ghost{background:transparent;color:var(--ink2);border:1.5px solid var(--paper3)}
    .btn-ghost:hover{background:var(--paper2)}
    .btn-danger{background:var(--rose);color:#fff}
    .btn-danger:hover{opacity:0.9}
    .btn-sm{padding:6px 12px;font-size:13px}
    .btn-lg{padding:12px 26px;font-size:15px}
    .btn:disabled{opacity:.45;cursor:not-allowed}
    .card{background:var(--white);border-radius:var(--radius);box-shadow:var(--shadow);border:1px solid rgba(26,23,20,.06)}
    .tag{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:500}
    .inp{width:100%;padding:11px 14px;border-radius:var(--radius-sm);border:1.5px solid var(--paper3);background:var(--white);font-size:14px;outline:none;transition:border-color .15s;color:var(--ink);line-height:1.5}
    .inp:focus{border-color:var(--ink)}
    .inp::placeholder{color:var(--ink4)}
    .tab-btn{padding:11px 20px;background:transparent;border:none;border-bottom:2px solid transparent;cursor:pointer;font-size:14px;font-weight:400;color:var(--ink3);transition:all .15s;white-space:nowrap}
    .tab-btn.active{border-bottom-color:var(--primary);color:var(--ink);font-weight:600}
    .draggable{cursor:move}
    .dragging{opacity:0.5}
  `;
}
