import { useState, useEffect, useRef, useCallback } from "react";

const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;500;600;700&family=Barlow:wght@300;400;500&family=IBM+Plex+Mono:wght@300;400&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --white:#FFFFFF; --off:#F8F8F7; --light:#F2F2F0; --mist:#E8E8E5;
      --grey1:#D4D4D0; --grey2:#AEAEAA; --grey3:#7A7A76; --grey4:#4A4A48;
      --black:#111110; --ink:#1E1E1C;
      --display:'Barlow Condensed',sans-serif; --body:'Barlow',sans-serif; --mono:'IBM Plex Mono',monospace;
      /* Soft beacon gradient (Blue to Purple) */
      --beacon-grad: linear-gradient(135deg, #EEF2FF 0%, #F3E8FF 50%, #FAE8FF 100%);
    }
    html { scroll-behavior:smooth; }
    /* Applied gradient to body */
    body { background:var(--beacon-grad); color:var(--ink); font-family:var(--body); overflow-x:hidden; cursor:none; min-height: 100vh; }
    #c-dot  { position:fixed;width:6px;height:6px;border-radius:50%;background:var(--black);pointer-events:none;z-index:99999;transform:translate(-50%,-50%); }
    #c-ring { position:fixed;width:24px;height:24px;border-radius:50%;border:1px solid rgba(17,17,16,.22);pointer-events:none;z-index:99998;transform:translate(-50%,-50%); }
    ::-webkit-scrollbar { width:2px; }
    ::-webkit-scrollbar-track { background:var(--light); }
    ::-webkit-scrollbar-thumb { background:var(--grey2); }
    ::-selection { background:var(--black); color:var(--white); }
    button { cursor:none; border:none; outline:none; background:none; font-family:inherit; }
    a { cursor:none; }
    .rv { opacity:0; transform:translateY(28px); transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1); }
    .rv.in { opacity:1; transform:translateY(0); }
    .divider { height:1px; background:var(--grey1); }
    @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
    @keyframes scan   { 0%{top:-2px;opacity:0} 8%{opacity:1} 92%{opacity:1} 100%{top:100%;opacity:0} }
    @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0} }
    @keyframes spin   { from{transform:rotate(0)} to{transform:rotate(360deg)} }
    @media (max-width:640px) {
      body { cursor:auto; }
      #c-dot, #c-ring { display:none; }
      button { cursor:pointer; }
      a { cursor:pointer; }
    }
  `}</style>
);

function useIsMobile() {
  const [mob, setMob] = useState(window.innerWidth <= 640);
  useEffect(() => {
    const h = () => setMob(window.innerWidth <= 640);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return mob;
}

function Cursor() {
  const dot = useRef(null), ring = useRef(null);
  useEffect(() => {
    let rx = 0, ry = 0, raf;
    const lerp = (a, b, t) => a + (b - a) * t;
    const move = e => {
      if (dot.current) { dot.current.style.left = e.clientX + 'px'; dot.current.style.top = e.clientY + 'px'; }
      cancelAnimationFrame(raf);
      const step = () => {
        rx = lerp(rx, e.clientX, .14); ry = lerp(ry, e.clientY, .14);
        if (ring.current) { ring.current.style.left = rx + 'px'; ring.current.style.top = ry + 'px'; }
        if (Math.abs(rx - e.clientX) > .5 || Math.abs(ry - e.clientY) > .5) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    window.addEventListener('mousemove', move);
    return () => { window.removeEventListener('mousemove', move); cancelAnimationFrame(raf); };
  }, []);
  return <><div id="c-dot" ref={dot} /><div id="c-ring" ref={ring} /></>;
}

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) e.target.classList.add('in') }, { threshold: .05 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return ref;
}

const Nav = ({ onDownload, showDownload }) => {
  const mob = useIsMobile();
  return (
    <nav className="no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: mob ? '0 16px' : '0 48px', height: mob ? '48px' : '52px', background: 'rgba(255,255,255,.6)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--mist)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '18px', height: '18px', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 4L5 6L2 8M10 4L7 6L10 8" stroke="white" strokeWidth="1.2" strokeLinecap="round" /></svg>
        </div>
        <div style={{ fontFamily: 'var(--display)', fontSize: mob ? '12px' : '13px', fontWeight: 700, letterSpacing: '.15em', color: 'var(--black)', textTransform: 'uppercase' }}>{mob ? 'AHL' : 'American Hairline'}</div>
      </div>
      <div style={{ display: 'flex', gap: mob ? '12px' : '20px', alignItems: 'center' }}>
        {!mob && ['Upload', 'Results'].map(l => (
          <a key={l} href={`#${l.toLowerCase()}`} style={{ fontFamily: 'var(--body)', fontSize: '12px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--grey3)', textDecoration: 'none', transition: 'color .15s' }}
            onMouseEnter={e => e.target.style.color = 'var(--black)'} onMouseLeave={e => e.target.style.color = 'var(--grey3)'}>{l}</a>
        ))}
        {showDownload && (
          <button onClick={onDownload} style={{ fontFamily: 'var(--display)', fontSize: mob ? '10px' : '11px', fontWeight: 600, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--white)', background: 'var(--black)', padding: mob ? '7px 12px' : '8px 18px', display: 'flex', alignItems: 'center', gap: '6px', transition: 'background .2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--grey4)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--black)'}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            {mob ? 'Report' : 'View Report'}
          </button>
        )}
      </div>
    </nav>
  );
};

const Ticker = () => {
  const t = '4-ANGLE ANALYSIS  ·  FRONT  ·  BACK  ·  SIDE  ·  TOP  ·  HAIRLINE COVERAGE  ·  AMERICAN HAIRLINE  ·  ';
  return (
    <div className="no-print" style={{ overflow: 'hidden', background: 'var(--black)', padding: '8px 0', zIndex: 10, position: 'relative' }}>
      <div style={{ display: 'flex', width: 'max-content', animation: 'ticker 30s linear infinite' }}>
        {[0, 1, 2, 3].map(i => <span key={i} style={{ fontFamily: 'var(--body)', fontSize: '9px', fontWeight: 400, letterSpacing: '.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', whiteSpace: 'nowrap', padding: '0 32px' }}>{t}</span>)}
      </div>
    </div>
  );
};

const Hero = ({ onBegin }) => {
  const mob = useIsMobile();
  const r1 = useReveal(), r2 = useReveal(), r3 = useReveal();
  return (
    <section className="no-print" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: mob ? '0 20px 72px' : '0 48px 88px', position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(var(--grey1) 1px,transparent 1px),linear-gradient(90deg,var(--grey1) 1px,transparent 1px)', backgroundSize: '80px 80px', opacity: .18 }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: 'var(--display)', fontSize: mob ? 'clamp(120px,40vw,200px)' : 'clamp(200px,32vw,460px)', fontWeight: 700, color: 'rgba(17,17,16,.04)', lineHeight: 1, pointerEvents: 'none', userSelect: 'none', letterSpacing: '-.03em', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>AH</div>
      {!mob && (<><div style={{ position: 'absolute', top: 0, left: '48px', width: '1px', height: '100%', background: 'linear-gradient(to bottom,transparent,var(--grey1) 30%,var(--grey1) 70%,transparent)', opacity: .6 }} /><div style={{ position: 'absolute', top: '80px', right: '48px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--grey2)', lineHeight: 2.2 }}><div>40.7128° N</div><div>74.0060° W</div><div style={{ color: 'var(--grey3)', marginTop: '4px' }}>SYS.ONLINE</div></div></>)}
      <div style={{ maxWidth: '960px', position: 'relative', zIndex: 1 }}>
        <div ref={r1} className="rv" style={{ transitionDelay: '.08s', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--body)', fontSize: '10px', fontWeight: 400, letterSpacing: '.28em', textTransform: 'uppercase', color: 'var(--grey3)' }}><div style={{ width: '28px', height: '1px', background: 'var(--grey2)' }} />4-Angle AI Hair Consultation</div>
        </div>
        <div ref={r2} className="rv" style={{ transitionDelay: '.18s' }}>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: mob ? 'clamp(56px,18vw,90px)' : 'clamp(64px,11vw,148px)', fontWeight: 700, lineHeight: .92, letterSpacing: '-.01em', textTransform: 'uppercase', color: 'var(--black)' }}>
            <span style={{ display: 'block' }}>American</span>
            <span style={{ display: 'block', color: 'transparent', WebkitTextStroke: `${mob ? '1px' : '1.5px'} var(--grey3)`, marginTop: '-.02em' }}>Hairline</span>
          </h1>
        </div>
        <div ref={r3} className="rv" style={{ transitionDelay: '.32s', marginTop: mob ? '28px' : '44px' }}>
          <p style={{ fontFamily: 'var(--body)', fontSize: mob ? '14px' : 'clamp(15px,1.3vw,18px)', color: 'var(--grey3)', maxWidth: '420px', lineHeight: 1.8, fontWeight: 300, marginBottom: mob ? '24px' : '0' }}>Upload four photos — front, back, side, and top. Our AI maps your head geometry and generates the perfect hairstyle.</p>
          {mob && <button onClick={onBegin} style={{ fontFamily: 'var(--display)', fontSize: '13px', fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--white)', background: 'var(--black)', padding: '14px 36px', width: '100%', marginTop: '20px' }}>Begin Analysis</button>}
        </div>
        {!mob && (
          <div style={{ marginTop: '44px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
            <button onClick={onBegin} style={{ fontFamily: 'var(--display)', fontSize: '13px', fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--white)', background: 'var(--black)', padding: '15px 48px', transition: 'all .25s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--grey4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'var(--black)'; e.currentTarget.style.transform = 'none'; }}>Begin Analysis</button>
            <div style={{ display: 'flex', gap: '44px' }}>
              {[['4', 'Angles'], ['1', 'Style'], ['100%', 'Coverage']].map(([n, l]) => (
                <div key={n} style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--display)', fontSize: '28px', fontWeight: 700, color: 'var(--black)', letterSpacing: '-.01em' }}>{n}</div>
                  <div style={{ fontFamily: 'var(--body)', fontSize: '10px', fontWeight: 400, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--grey2)', marginTop: '2px' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {mob && (<div style={{ display: 'flex', gap: '28px', marginTop: '28px' }}>{[['4', 'Angles'], ['1', 'Style'], ['100%', 'Coverage']].map(([n, l]) => (<div key={n}><div style={{ fontFamily: 'var(--display)', fontSize: '22px', fontWeight: 700, color: 'var(--black)' }}>{n}</div><div style={{ fontFamily: 'var(--body)', fontSize: '9px', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--grey2)', marginTop: '1px' }}>{l}</div></div>))}</div>)}
      </div>
    </section>
  );
};

const ANGLE_SEQUENCE = [
  { id: 'front', label: 'Front Face', instruction: 'Look straight at the camera. Keep your head level.' },
  { id: 'back', label: 'Back of Head', instruction: 'Turn fully away. Keep your neck straight.' },
  { id: 'side', label: 'Side Profile', instruction: 'Turn 90° to your left. Keep your chin level.' },
  { id: 'top', label: 'Top / Crown', instruction: 'Hold camera directly above your head, pointing down.' },
];

function CameraFlow({ onCaptures, onClose }) {
  const [step, setStep] = useState(0); const [captured, setCaptured] = useState({}); const [camErr, setCamErr] = useState(null); const vidRef = useRef(null);
  useEffect(() => { let s; navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } } }).then(st => { s = st; if (vidRef.current) vidRef.current.srcObject = st; }).catch(() => setCamErr('Camera permission denied.')); return () => s?.getTracks().forEach(t => t.stop()); }, []);
  const capture = () => {
    if (!vidRef.current) return; const c = document.createElement('canvas'); c.width = vidRef.current.videoWidth; c.height = vidRef.current.videoHeight;
    const ctx = c.getContext('2d'); ctx.translate(c.width, 0); ctx.scale(-1, 1); ctx.drawImage(vidRef.current, 0, 0);
    const url = c.toDataURL('image/jpeg', .95); const angleId = ANGLE_SEQUENCE[step].id; const next = { ...captured, [angleId]: url }; setCaptured(next);
    if (step < ANGLE_SEQUENCE.length - 1) setStep(s => s + 1); else onCaptures(next);
  };
  const current = ANGLE_SEQUENCE[step]; const done = Object.keys(captured).length;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,17,16,.92)', zIndex: 950, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', animation: 'fadeIn .2s ease' }}>
      <div style={{ background: 'var(--white)', width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', maxHeight: '96vh', overflowY: 'auto' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--mist)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><div style={{ fontFamily: 'var(--display)', fontSize: '15px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--black)' }}>Capture {current.label}</div><div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--grey3)', marginTop: '2px' }}>Step {step + 1} of 4</div></div>
          <button onClick={onClose} style={{ fontSize: '22px', lineHeight: 1, color: 'var(--grey3)', padding: '4px 8px' }}>×</button>
        </div>
        <div style={{ display: 'flex', gap: '4px', padding: '12px 20px 0' }}>{ANGLE_SEQUENCE.map((a, i) => <div key={a.id} style={{ flex: 1, height: '3px', background: i < done ? 'var(--black)' : i === step ? 'var(--grey3)' : 'var(--mist)', transition: 'background .3s' }} />)}</div>
        {camErr ? (<div style={{ padding: '24px 20px', fontFamily: 'var(--mono)', fontSize: '12px', color: '#b84040', background: '#fdf5f5', margin: '16px 20px', border: '1px solid #e5b4b4' }}>{camErr}</div>) : (
          <>
            <div style={{ position: 'relative', background: '#000', aspectRatio: '4/3', overflow: 'hidden', margin: '12px 20px 0' }}>
              <video ref={vidRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '50px', height: '50px', position: 'relative', opacity: .35 }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '14px', height: '14px', borderTop: '1.5px solid white', borderLeft: '1.5px solid white' }} />
                  <div style={{ position: 'absolute', top: 0, right: 0, width: '14px', height: '14px', borderTop: '1.5px solid white', borderRight: '1.5px solid white' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, width: '14px', height: '14px', borderBottom: '1.5px solid white', borderLeft: '1.5px solid white' }} />
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: '14px', height: '14px', borderBottom: '1.5px solid white', borderRight: '1.5px solid white' }} />
                </div>
              </div>
            </div>
            <div style={{ padding: '10px 20px', background: 'var(--off)', margin: '0 20px', borderTop: '1px solid var(--mist)' }}><div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--grey3)', lineHeight: 1.5 }}>{current.instruction}</div></div>
            {done > 0 && <div style={{ display: 'flex', gap: '6px', padding: '10px 20px 0' }}>{ANGLE_SEQUENCE.slice(0, done).map(a => (<div key={a.id} style={{ width: '44px', height: '44px', overflow: 'hidden', border: '1px solid var(--grey1)', flexShrink: 0 }}><img src={captured[a.id]} alt={a.id} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>))}</div>}
            <div style={{ padding: '16px 20px' }}><button onClick={capture} style={{ width: '100%', fontFamily: 'var(--display)', fontSize: '13px', fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--white)', background: 'var(--black)', padding: '14px', transition: 'background .2s' }}>Capture Photo {step + 1}</button></div>
          </>
        )}
      </div>
    </div>
  );
}

const SLOT_LABEL = { front: 'Front Face', back: 'Back of Head', side: 'Side Profile', top: 'Top / Crown' };
function AngleSlot({ id, image, onImage }) {
  const inputRef = useRef(null); const [drag, setDrag] = useState(false);
  const loadFile = file => { const r = new FileReader(); r.onload = e => onImage(id, e.target.result); r.readAsDataURL(file); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--grey3)', letterSpacing: '.18em', textTransform: 'uppercase', textAlign: 'center' }}>{SLOT_LABEL[id]}</div>
      <div onClick={() => !image && inputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f && f.type.startsWith('image/')) loadFile(f); }}
        style={{ aspectRatio: '3/4', border: `1px ${drag ? 'solid' : 'dashed'} ${image ? 'var(--grey2)' : drag ? 'var(--black)' : 'var(--grey1)'}`, background: image ? 'rgba(255,255,255,.5)' : drag ? 'rgba(255,255,255,.8)' : 'rgba(255,255,255,.3)', position: 'relative', overflow: 'hidden', transition: 'all .2s', cursor: image ? 'default' : 'pointer', backdropFilter: 'blur(4px)' }}>
        {image ? (<><img src={image} alt={id} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /><div style={{ position: 'absolute', inset: 0, background: 'rgba(17,17,16,0)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', transition: 'background .2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(17,17,16,.45)'; e.currentTarget.querySelector('button').style.opacity = '1'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(17,17,16,0)'; e.currentTarget.querySelector('button').style.opacity = '0'; }}><button onClick={() => inputRef.current?.click()} style={{ fontFamily: 'var(--body)', fontSize: '10px', letterSpacing: '.15em', textTransform: 'uppercase', color: 'white', opacity: 0, transition: 'opacity .2s', background: 'none', border: 'none' }}>Replace</button></div></>)
          : (<div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--grey2)" strokeWidth="1.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg><div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--grey2)', letterSpacing: '.1em', textAlign: 'center', lineHeight: 1.5 }}>Drop or tap</div></div>)}
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={e => { if (e.target.files[0]) loadFile(e.target.files[0]); }} />
    </div>
  );
}

const Upload = ({ images, onImage, uploadRef, onRun, running, patient, onPatientChange }) => {
  const mob = useIsMobile(); const [camFlowOpen, setCamFlowOpen] = useState(false);
  const keys = ['front', 'back', 'side', 'top']; const filled = keys.filter(k => images[k]).length; const allFilled = filled === 4;
  const inpStyle = { width: '100%', fontFamily: 'var(--body)', fontSize: '13px', color: 'var(--black)', background: 'rgba(255,255,255,.6)', border: '1px solid var(--grey1)', padding: '10px 13px', outline: 'none', letterSpacing: '.02em', transition: 'border-color .2s', borderRadius: '2px' };
  const handleCaptures = useCallback(captured => { Object.entries(captured).forEach(([id, url]) => onImage(id, url)); setCamFlowOpen(false); }, [onImage]);
  return (
    <section id="upload" ref={uploadRef} className="no-print" style={{ padding: mob ? '72px 16px 60px' : '100px 48px 80px', maxWidth: '1100px', margin: '0 auto', background: 'transparent' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}><span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--grey2)' }}>01</span><div className="divider" style={{ flex: 1 }} /><h2 style={{ fontFamily: 'var(--display)', fontSize: mob ? '26px' : 'clamp(22px,2.8vw,38px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--black)' }}>Upload 4 Angles</h2></div>
      <p style={{ fontFamily: 'var(--body)', fontSize: '13px', fontWeight: 300, color: 'var(--grey3)', lineHeight: 1.7, marginBottom: '28px' }}>All four views required — front, back, side, and top.</p>
      <div style={{ marginBottom: '32px', padding: '20px 22px', background: 'rgba(255,255,255,.4)', backdropFilter: 'blur(10px)', border: '1px solid var(--mist)', borderRadius: '4px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--grey2)', marginBottom: '14px' }}>Client Details — for report</div>
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr 1fr', gap: '14px' }}>
          {[{ key: 'name', label: 'Full Name', placeholder: 'e.g. Arjun Sharma', type: 'text' }, { key: 'age', label: 'Age', placeholder: 'e.g. 28', type: 'number' }, { key: 'phone', label: 'Phone Number', placeholder: 'e.g. +91 98765 43210', type: 'tel' }].map(({ key, label, placeholder, type }) => (
            <div key={key}><label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--grey3)', marginBottom: '6px' }}>{label}</label><input type={type} value={patient[key] || ''} onChange={e => onPatientChange(key, e.target.value)} placeholder={placeholder} style={inpStyle} onFocus={e => e.target.style.borderColor = 'var(--black)'} onBlur={e => e.target.style.borderColor = 'var(--grey1)'} /></div>
          ))}
        </div>
      </div>
      <button onClick={() => setCamFlowOpen(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: mob ? '100%' : 'auto', fontFamily: 'var(--display)', fontSize: '13px', fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--white)', background: 'var(--black)', padding: '14px 28px', marginBottom: '24px', transition: 'background .2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--grey4)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--black)'}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
        Capture 4 Photos with Camera
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}><div className="divider" style={{ flex: 1 }} /><span style={{ fontFamily: 'var(--body)', fontSize: '10px', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--grey2)', whiteSpace: 'nowrap' }}>or upload individually</span><div className="divider" style={{ flex: 1 }} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: mob ? '8px' : '16px', marginBottom: '24px' }}>{keys.map(id => <AngleSlot key={id} id={id} image={images[id]} onImage={onImage} />)}</div>
      <div style={{ height: '2px', background: 'var(--mist)', marginBottom: '16px', overflow: 'hidden' }}><div style={{ height: '100%', width: `${filled / 4 * 100}%`, background: 'var(--black)', transition: 'width .4s cubic-bezier(.16,1,.3,1)' }} /></div>
      <div style={{ display: 'flex', flexDirection: mob ? 'column' : 'row', alignItems: mob ? 'stretch' : 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--grey3)', textAlign: mob ? 'center' : 'left' }}>{allFilled ? 'All angles loaded — ready to analyse' : `${4 - filled} photo${4 - filled !== 1 ? 's' : ''} remaining`}</div>
        <button onClick={onRun} disabled={!allFilled || running} style={{ fontFamily: 'var(--display)', fontSize: '12px', fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', padding: '14px 40px', transition: 'all .25s', color: allFilled && !running ? 'var(--white)' : 'var(--grey2)', background: allFilled && !running ? 'var(--black)' : 'var(--mist)' }}>{running ? 'Analysing…' : 'Analyse & Generate'}</button>
      </div>
      {camFlowOpen && <CameraFlow onCaptures={handleCaptures} onClose={() => setCamFlowOpen(false)} />}
    </section>
  );
};

const Scanner = ({ images }) => {
  const mob = useIsMobile();
  const LOG = ['LOADING FACIAL MESH ENGINE', 'MAPPING FRONT GEOMETRY', 'ANALYSING BACK CONTOUR', 'MEASURING SIDE PROFILE', 'READING CROWN TOPOLOGY', 'COMPUTING HEAD SHAPE INDEX', 'HAIRLINE COVERAGE ALGORITHM', 'SELECTING OPTIMAL HAIRSTYLE', 'HAIRLINE COVERAGE: CONFIRMED', 'RENDERING FRONT VIEW', 'RENDERING BACK VIEW', 'RENDERING SIDE VIEW', 'RENDERING TOP VIEW', 'FINALISING OUTPUT'];
  const [idx, setIdx] = useState(0);
  useEffect(() => { const t = setInterval(() => setIdx(i => (i + 1) % LOG.length), 700); return () => clearInterval(t); }, []);
  return (
    <div className="no-print" style={{ padding: mob ? '40px 16px 60px' : '60px 48px 80px', maxWidth: '900px', margin: '0 auto', textAlign: 'center', animation: 'fadeIn .5s ease', background: 'transparent' }}>
      <div style={{ fontFamily: 'var(--body)', fontSize: '10px', letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--grey3)', marginBottom: '28px' }}>Neural Processing · 4-Angle Analysis</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: mob ? '6px' : '8px', marginBottom: '24px' }}>
        {['front', 'back', 'side', 'top'].map((k, i) => (
          <div key={k} style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', border: '1px solid var(--mist)', background: 'rgba(255,255,255,.5)' }}>
            {images[k] && <img src={images[k]} alt={k} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) brightness(.95)', display: 'block' }} />}
            <div style={{ position: 'absolute', left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(17,17,16,.6),transparent)', animation: `scan 2s ease-in-out infinite`, animationDelay: `${i * .3}s` }} />
            <div style={{ position: 'absolute', bottom: '3px', left: 0, right: 0, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--grey3)', letterSpacing: '.12em' }}>{k.toUpperCase()}</div>
          </div>
        ))}
      </div>
      <div style={{ background: 'rgba(255,255,255,.5)', backdropFilter: 'blur(5px)', border: '1px solid var(--mist)', padding: '12px 16px', maxWidth: '360px', margin: '0 auto', textAlign: 'left' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--grey4)', letterSpacing: '.04em', minHeight: '18px' }}><span style={{ color: 'var(--grey2)' }}>$ </span>{LOG[idx]}<span style={{ animation: 'blink .8s infinite', marginLeft: '2px' }}>_</span></div>
      </div>
    </div>
  );
};

const ErrorBanner = ({ msg, onRetry, onDismiss }) => (
  <div className="no-print" style={{ maxWidth: '960px', margin: '0 auto', padding: '0 16px 24px', animation: 'fadeUp .3s ease' }}>
    <div style={{ padding: '16px 18px', border: '1px solid #e5b4b4', background: '#fdf5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
      <div><div style={{ fontFamily: 'var(--body)', fontSize: '10px', fontWeight: 500, letterSpacing: '.2em', textTransform: 'uppercase', color: '#b84040', marginBottom: '4px' }}>Error</div><div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: '#b84040', lineHeight: 1.6, wordBreak: 'break-word' }}>{msg}</div></div>
      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}><button onClick={onRetry} style={{ fontFamily: 'var(--body)', fontSize: '10px', fontWeight: 500, letterSpacing: '.12em', textTransform: 'uppercase', color: 'white', background: '#b84040', padding: '7px 12px' }}>Retry</button><button onClick={onDismiss} style={{ fontFamily: 'var(--body)', fontSize: '10px', color: 'var(--grey3)', padding: '7px' }}>✕</button></div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════
//  PRINT REPORT (FIXED PDF BLANKING ISSUE)
// ═══════════════════════════════════════════════════════
function printReport(analysis, results, inputImages, patient) {
  if (!analysis) return;
  const name = (patient?.name || '').trim() || 'Client';
  const age = (patient?.age || '').trim() || '—';
  const phone = (patient?.phone || '').trim() || '—';
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const year = new Date().getFullYear();

  const gen = {};
  (results || []).forEach(r => { if (r.url) gen[r.id] = r.url; });

  // ── Dos / Don'ts parser ──────────────────────────────────────────────────
  function parseLists(a) {
    const text = [a.description, a.front_notes, a.back_notes, a.side_notes, a.top_notes, a.styling_tip].filter(Boolean).join(' ').toLowerCase();
    const dos = [], donts = [];
    if (text.includes('volume') || text.includes('fuller') || text.includes('lift')) dos.push('Add volume and lift on top for facial balance');
    if (text.includes('texture')) dos.push('Use texturising products for natural movement');
    if (text.includes('taper') || text.includes('fade')) dos.push('Tapered or faded sides for a clean modern silhouette');
    if (text.includes('matte') || text.includes('pomade') || text.includes('cream')) dos.push('Lightweight matte pomade for flexible daily hold');
    if (text.includes('fringe') || text.includes('forward')) dos.push('Style fringe forward to fully cover the hairline');
    if (text.includes('layered') || text.includes('layers')) dos.push('Layered cuts to add dimension and movement');
    if (text.includes('natural')) dos.push('Embrace a natural finish for everyday wearability');
    if (text.includes('feather') || text.includes('soft')) dos.push('Soft feathered edges around the front hairline');
    if (text.includes('clean') || text.includes('nape')) dos.push('Keep the nape and sides clean and defined');
    while (dos.length < 4) { const fb = ['Regular trims every 4–6 weeks to maintain shape', 'Protect hair from heat with a quality heat spray', 'Hydrate scalp with a lightweight conditioning treatment']; dos.push(fb[dos.length - 1] || fb[0]); }

    if (text.includes('harsh') || text.includes('straight line')) donts.push('Harsh straight cut lines at the front hairline');
    if (text.includes('heavy') || text.includes('weigh')) donts.push('Heavy products that flatten and weigh hair down');
    if (text.includes('bulky') || text.includes('disconnected')) donts.push('Bulky or disconnected transitions at the sides');
    if (text.includes('blocky')) donts.push('Blocky unblended cuts at the back and nape');
    if (text.includes('scalp') || text.includes('bald') || text.includes('thinning')) donts.push('Very short buzz cuts that expose the scalp');
    if (text.includes('slick') || text.includes('slicked')) donts.push('Fully slicked-back styles that expose the crown');
    if (text.includes('too short') || text.includes('very short')) donts.push('Going too short — it can expose the hairline');
    while (donts.length < 4) { const fb = ['Over-washing which strips natural scalp oils', 'Skipping heat protection before blow-drying', 'Neglecting scalp health — it directly affects density']; donts.push(fb[donts.length - 1] || fb[0]); }

    return { dos: dos.slice(0, 5), donts: donts.slice(0, 5) };
  }
  const { dos, donts } = parseLists(analysis);

  // ── "Why this style" paragraph ───────────────────────────────────────────
  const whyText = analysis.face_shape_analysis ||
    `Based on a 4-angle cephalometric assessment of your head geometry, hairline position, hair density, and growth patterns, the <strong>${analysis.hairstyle_name}</strong> was identified as the optimal recommendation. The style creates directional volume where coverage is most needed, balances your facial proportions, and delivers a clean polished silhouette from every angle. The taper ratio and length distribution were calibrated to complement — not fight — your natural hair characteristics.`;

  // ── SVG face diagram ─────────────────────────────────────────────────────
  function faceDiagramSVG(a) {
    const text = [a.description, a.front_notes, a.side_notes, a.top_notes].filter(Boolean).join(' ').toLowerCase();
    const isRound = text.includes('round');
    const isSquare = text.includes('square') || text.includes('angular');
    const isLong = text.includes('long') || text.includes('oblong');
    const hasTaper = text.includes('taper') || text.includes('fade') || text.includes('side');
    const hasCoverage = text.includes('cover') || text.includes('hairline') || text.includes('fringe');
    const hasVolume = text.includes('volume') || text.includes('lift') || text.includes('top');
    const faceD = isRound
      ? 'M 100 30 C 160 30, 190 70, 190 115 C 190 165, 165 205, 100 220 C 35 205, 10 165, 10 115 C 10 70, 40 30, 100 30 Z'
      : isSquare
        ? 'M 55 30 L 145 30 C 165 30, 185 50, 185 75 L 185 175 C 185 205, 160 220, 100 220 C 40 220, 15 205, 15 175 L 15 75 C 15 50, 35 30, 55 30 Z'
        : isLong
          ? 'M 100 18 C 145 18, 178 55, 178 100 C 178 165, 155 225, 100 235 C 45 225, 22 165, 22 100 C 22 55, 55 18, 100 18 Z'
          : 'M 100 25 C 148 25, 182 62, 182 108 C 182 158, 160 210, 100 220 C 40 210, 18 158, 18 108 C 18 62, 52 25, 100 25 Z';
    const hairTopD = hasCoverage
      ? 'M 42 80 C 52 28, 148 28, 158 80 C 140 55, 60 55, 42 80 Z'
      : hasVolume
        ? 'M 35 85 C 45 22, 155 22, 165 85 C 145 50, 55 50, 35 85 Z'
        : 'M 40 82 C 50 28, 150 28, 160 82 C 145 52, 55 52, 40 82 Z';
    const taperLeft = hasTaper ? '<line x1="18" y1="115" x2="5"  y2="115" stroke="#9B99A2" stroke-width="1" stroke-dasharray="2,2"/><line x1="18" y1="155" x2="5"  y2="155" stroke="#9B99A2" stroke-width="1" stroke-dasharray="2,2"/><line x1="5" y1="115" x2="5" y2="155" stroke="#9B99A2" stroke-width="1"/>' : '';
    const taperRight = hasTaper ? '<line x1="182" y1="115" x2="195" y2="115" stroke="#9B99A2" stroke-width="1" stroke-dasharray="2,2"/><line x1="182" y1="155" x2="195" y2="155" stroke="#9B99A2" stroke-width="1" stroke-dasharray="2,2"/><line x1="195" y1="115" x2="195" y2="155" stroke="#9B99A2" stroke-width="1"/>' : '';
    const hairlineBar = hasCoverage ? '<line x1="50" y1="78" x2="150" y2="78" stroke="#4A7C59" stroke-width="1.5" stroke-dasharray="3,2"/>' : '';
    const volumeArc = hasVolume ? '<path d="M 40 82 Q 100 10, 160 82" fill="none" stroke="#6B8FAF" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.7"/>' : '';
    return `
    <svg viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;">
      <defs>
        <linearGradient id="faceGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#F8F8F6"/>
          <stop offset="100%" stop-color="#EEEEEA"/>
        </linearGradient>
        <linearGradient id="hairGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3A3A38" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="#5A5A56" stop-opacity="0.6"/>
        </linearGradient>
      </defs>
      <path d="${faceD}" fill="url(#faceGrad)" stroke="#C8C8C4" stroke-width="1.2"/>
      <path d="${hairTopD}" fill="url(#hairGrad)" opacity="0.82"/>
      <ellipse cx="72" cy="118" rx="12" ry="7" fill="none" stroke="#9B99A2" stroke-width="1"/>
      <ellipse cx="128" cy="118" rx="12" ry="7" fill="none" stroke="#9B99A2" stroke-width="1"/>
      <circle cx="72" cy="118" r="3.5" fill="#3A3A38" opacity="0.6"/>
      <circle cx="128" cy="118" r="3.5" fill="#3A3A38" opacity="0.6"/>
      <line x1="100" y1="128" x2="100" y2="152" stroke="#C0BEBC" stroke-width="1"/>
      <ellipse cx="93" cy="154" rx="6" ry="3" fill="none" stroke="#C0BEBC" stroke-width="0.8"/>
      <ellipse cx="107" cy="154" rx="6" ry="3" fill="none" stroke="#C0BEBC" stroke-width="0.8"/>
      <path d="M 85 172 Q 100 182, 115 172" fill="none" stroke="#B8B6B2" stroke-width="1.2" stroke-linecap="round"/>
      ${hairlineBar}
      ${volumeArc}
      ${taperLeft}
      ${taperRight}
      ${hasCoverage ? '<text x="100" y="72" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="5.5" fill="#4A7C59" letter-spacing="0.08em">HAIRLINE COVERED</text>' : ''}
      ${hasTaper ? '<text x="100" y="140" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="5" fill="#9B99A2" letter-spacing="0.06em" opacity="0.9">TAPER ZONE</text>' : ''}
      ${hasVolume ? '<text x="100" y="15" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="5.5" fill="#6B8FAF" letter-spacing="0.06em">VOLUME LIFT</text>' : ''}
      <text x="100" y="235" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="5" fill="#AEAEAA" letter-spacing="0.08em">CHIN</text>
      <text x="8" y="108" font-family="IBM Plex Mono,monospace" font-size="5" fill="#AEAEAA" letter-spacing="0.05em">L</text>
      <text x="190" y="108" font-family="IBM Plex Mono,monospace" font-size="5" fill="#AEAEAA" letter-spacing="0.05em">R</text>
    </svg>`;
  }

  // ── Image card helper ────────────────────────────────────────────────────
  function imgCard(src, label, dark) {
    return `
    <div style="flex:1;display:flex;flex-direction:column;border-radius:8px;overflow:hidden;border:1px solid #D5D0EE;background:#F5F2FF;min-height:0;">
      <div style="padding:7px 11px 6px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #E2DCFA;flex-shrink:0;background:${dark ? '#1C1838' : '#FFFFFF'};">
        <span style="font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:${dark ? '#FFFFFF' : '#4A4A48'};">${label}</span>
        <span style="font-family:'IBM Plex Mono',monospace;font-size:6.5px;letter-spacing:.1em;color:${dark ? 'rgba(255,255,255,.4)' : '#AEAEAA'};text-transform:uppercase;">${dark ? 'AI GENERATED' : 'ORIGINAL'}</span>
      </div>
      <div style="flex:1;overflow:hidden;min-height:155px;">
        ${src ? `<img src="${src}" crossorigin="anonymous" style="width:100%;height:100%;object-fit:cover;object-position:center top;display:block;"/>`
        : `<div style="width:100%;height:100%;min-height:155px;display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Mono',monospace;font-size:8px;color:#AEAEAA;background:#EDE8FF;">No image</div>`}
      </div>
    </div>`;
  }

  // ── Angle section for pages 2 & 3 — BLUE/PURPLE tinted ──────────────────
  function angleSection(key, title, accentRgb, notes) {
    return `
    <div style="flex:1;background:linear-gradient(148deg,#F2EEFF 0%,#EAE2FF 45%,#DDD5FF 100%);border-radius:12px;border:1px solid #D0C8EE;box-shadow:0 2px 18px rgba(80,60,160,.08);overflow:hidden;display:flex;flex-direction:column;min-height:0;">
      <div style="padding:12px 16px 10px;background:linear-gradient(90deg,rgba(${accentRgb},.12) 0%,transparent 55%);border-bottom:1px solid rgba(80,60,160,.08);flex-shrink:0;">
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:700;letter-spacing:.04em;color:#111110;text-transform:uppercase;line-height:1;">${title}</div>
        <div style="width:22px;height:2px;background:linear-gradient(90deg,rgba(${accentRgb},1),transparent);border-radius:1px;margin-top:5px;"></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:10px 13px;flex:1;min-height:0;">
        ${imgCard(inputImages?.[key], 'Before', false)}
        ${imgCard(gen[key], 'After', true)}
      </div>
      ${notes ? `<div style="padding:0 14px 13px;flex-shrink:0;"><p style="font-family:'Barlow',sans-serif;font-size:12px;font-weight:400;color:#3A3860;line-height:1.85;margin:0;">${notes}</p></div>` : ''}
    </div>`;
  }

  // ── Page wrapper — BLUE/PURPLE gradient bg ────────────────────────────────
  function page(num, content, isLast) {
    const bgs = [
      'linear-gradient(148deg,#EDE8FF 0%,#E2DAFF 30%,#D5CCFF 60%,#CBBEFF 85%,#D4CAFF 100%)', // cover — deep lavender/violet
      'linear-gradient(148deg,#E8ECFF 0%,#DCE2FF 35%,#CCCFFF 65%,#BFC5FF 85%,#C8C8FF 100%)', // p2 — periwinkle blue/indigo
      'linear-gradient(148deg,#EDE8FF 0%,#E2DAFF 35%,#D5CCFF 60%,#CABEFF 85%,#D2C8FF 100%)', // p3 — violet/purple
    ];
    const bg = bgs[num - 1] || bgs[0];
    return `
    <div class="page" style="width:210mm;height:297mm;background:${bg};display:flex;flex-direction:column;position:relative;overflow:hidden;${isLast ? '' : 'page-break-after:always;break-after:page;'}">
      <div style="position:absolute;inset:0;pointer-events:none;" aria-hidden="true">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="dots${num}" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.8" fill="rgba(80,60,180,.045)"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#dots${num})"/>
        </svg>
      </div>
      <div style="position:absolute;top:-40px;right:-40px;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(160,140,255,.45),transparent 70%);pointer-events:none;"></div>
      <div style="position:absolute;bottom:-30px;left:-30px;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(110,90,220,.3),transparent 70%);pointer-events:none;"></div>
      <div style="position:absolute;bottom:13px;right:20px;font-family:'IBM Plex Mono',monospace;font-size:8px;color:rgba(80,60,160,.35);letter-spacing:.14em;z-index:2;">0${num} / 03</div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:11px 22px 10px;border-bottom:1px solid rgba(80,60,160,.12);flex-shrink:0;position:relative;z-index:1;background:rgba(255,255,255,.45);backdrop-filter:blur(8px);">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:16px;height:16px;background:#111110;display:flex;align-items:center;justify-content:center;border-radius:2px;flex-shrink:0;">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 4L5 6L2 8M10 4L7 6L10 8" stroke="white" stroke-width="1.2" stroke-linecap="round"/></svg>
          </div>
          <span style="font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:.26em;color:#221858;text-transform:uppercase;">AMERICAN HAIRLINE</span>
        </div>
        <span style="font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:.1em;color:rgba(80,60,160,.45);text-transform:uppercase;">AI Hair Consultation · ${year}</span>
      </div>
      <div style="flex:1;display:flex;flex-direction:column;position:relative;z-index:1;min-height:0;overflow:hidden;">
        ${content}
      </div>
    </div>`;
  }

  // ═══════════════════════════════
  //  PAGE 1 — COVER
  // ═══════════════════════════════
  const p1 = page(1, `
    <div style="padding:16px 22px 12px;flex-shrink:0;">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:7.5px;letter-spacing:.28em;text-transform:uppercase;color:rgba(80,60,160,.45);margin-bottom:8px;">HAIR ANALYSIS REPORT · ${date}</div>
      <div style="font-family:'Barlow Condensed',sans-serif;line-height:.88;margin-bottom:11px;">
        <div style="font-size:52px;font-weight:700;color:#111110;letter-spacing:-.01em;">HAIR</div>
        <div style="font-size:52px;font-weight:700;color:transparent;-webkit-text-stroke:1.5px rgba(80,60,180,.28);letter-spacing:-.01em;">ANALYSIS</div>
      </div>
      <div style="width:40px;height:2px;background:linear-gradient(90deg,#6040C0,transparent);border-radius:1px;"></div>
    </div>

    <div style="padding:0 22px;display:grid;grid-template-columns:1fr 1.35fr;gap:10px;flex-shrink:0;">
      <div style="background:linear-gradient(140deg,rgba(255,255,255,.88),rgba(235,230,255,.88));border-radius:10px;border:1px solid #CEC8EC;padding:13px 15px;box-shadow:0 2px 12px rgba(80,60,160,.08);">
        <div style="font-family:'IBM Plex Mono',monospace;font-size:6.5px;letter-spacing:.26em;text-transform:uppercase;color:rgba(80,60,160,.45);margin-bottom:10px;">CLIENT PROFILE</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${[['NAME', name], ['AGE', age + ' yrs'], ['PHONE', phone]].map(([l, v]) => `
          <div>
            <div style="font-family:'IBM Plex Mono',monospace;font-size:6px;letter-spacing:.2em;text-transform:uppercase;color:rgba(80,60,160,.35);margin-bottom:2px;">${l}</div>
            <div style="font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:600;color:#111110;letter-spacing:.01em;">${v}</div>
          </div>`).join('')}
        </div>
      </div>
      <div style="background:linear-gradient(140deg,rgba(244,240,255,.95),rgba(230,224,255,.95));border-radius:10px;border:1px solid #C4BCE8;padding:13px 15px;box-shadow:0 2px 14px rgba(80,60,160,.1);">
        <div style="font-family:'IBM Plex Mono',monospace;font-size:6.5px;letter-spacing:.26em;text-transform:uppercase;color:rgba(80,60,160,.55);margin-bottom:8px;">RECOMMENDED HAIRSTYLE</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:26px;font-weight:700;color:#111110;letter-spacing:.01em;line-height:1.05;margin-bottom:7px;">${analysis.hairstyle_name || '—'}</div>
        <div style="display:inline-flex;padding:3px 10px;border-radius:3px;background:rgba(80,60,160,.08);border:1px solid rgba(80,60,160,.18);font-family:'IBM Plex Mono',monospace;font-size:7px;letter-spacing:.1em;color:#4A38A0;text-transform:uppercase;margin-bottom:9px;">${analysis.length || 'Medium'} LENGTH</div>
        <p style="font-family:'Barlow',sans-serif;font-size:12px;font-weight:400;color:#38366A;line-height:1.82;margin:0;">${analysis.description || ''}</p>
      </div>
    </div>

    <div style="margin:10px 22px 0;display:grid;grid-template-columns:175px 1fr;gap:12px;flex-shrink:0;">
      <div style="background:linear-gradient(140deg,rgba(255,255,255,.85),rgba(235,230,255,.85));border-radius:10px;border:1px solid #CEC8EC;padding:10px;display:flex;flex-direction:column;box-shadow:0 1px 10px rgba(80,60,160,.07);">
        <div style="font-family:'IBM Plex Mono',monospace;font-size:6.5px;letter-spacing:.22em;text-transform:uppercase;color:rgba(80,60,160,.4);margin-bottom:7px;text-align:center;">FACE STRUCTURE</div>
        <div style="flex:1;min-height:160px;">${faceDiagramSVG(analysis)}</div>
        <div style="margin-top:6px;display:flex;flex-direction:column;gap:4px;">
          ${[['#6B8FAF', 'Volume lift zone'], ['#4A7C59', 'Hairline coverage'], ['#9B99A2', 'Taper region']].map(([c, l]) => `
          <div style="display:flex;align-items:center;gap:5px;">
            <div style="width:10px;height:2px;background:${c};border-radius:1px;flex-shrink:0;"></div>
            <span style="font-family:'IBM Plex Mono',monospace;font-size:6px;color:#6A5EA0;letter-spacing:.06em;">${l}</span>
          </div>`).join('')}
        </div>
      </div>
      <div style="background:linear-gradient(140deg,rgba(255,255,255,.85),rgba(240,236,255,.85));border-radius:10px;border:1px solid #CEC8EC;padding:13px 15px;box-shadow:0 1px 10px rgba(80,60,160,.06);display:flex;flex-direction:column;gap:9px;">
        <div style="font-family:'IBM Plex Mono',monospace;font-size:6.5px;letter-spacing:.26em;text-transform:uppercase;color:rgba(80,60,160,.4);">WHY THIS STYLE WORKS FOR YOU</div>
        <p style="font-family:'Barlow',sans-serif;font-size:12px;font-weight:400;color:#30285A;line-height:1.88;margin:0;">${whyText}</p>
        ${analysis.styling_tip ? `<div style="border-top:1px solid rgba(80,60,160,.12);padding-top:8px;"><div style="font-family:'IBM Plex Mono',monospace;font-size:6px;letter-spacing:.22em;text-transform:uppercase;color:rgba(80,60,160,.35);margin-bottom:4px;">STYLING NOTE</div><p style="font-family:'Barlow',sans-serif;font-size:11px;font-weight:400;color:#6858A8;line-height:1.8;margin:0;font-style:italic;">${analysis.styling_tip}</p></div>` : ''}
      </div>
    </div>

    <div style="margin:9px 22px 0;display:grid;grid-template-columns:1fr 1fr;gap:10px;flex-shrink:0;">
      <div style="background:linear-gradient(140deg,rgba(242,250,244,.95),rgba(232,246,235,.95));border-radius:10px;border:1px solid #BCD8BE;padding:12px 14px;box-shadow:0 1px 8px rgba(35,110,50,.05);">
        <div style="display:flex;align-items:center;gap:7px;margin-bottom:9px;">
          <div style="width:16px;height:16px;border-radius:50%;background:#287A3C;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M1.5 5.5L4 8L8.5 2" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <span style="font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:.14em;color:#1A5C2A;text-transform:uppercase;">What Works</span>
        </div>
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px;">
          ${dos.map(d => `<li style="display:flex;gap:7px;align-items:flex-start;"><span style="color:#287A3C;font-size:10px;margin-top:1px;flex-shrink:0;line-height:1.4;">✓</span><span style="font-family:'Barlow',sans-serif;font-size:12px;font-weight:400;color:#235C2E;line-height:1.65;">${d}</span></li>`).join('')}
        </ul>
      </div>
      <div style="background:linear-gradient(140deg,rgba(253,243,243,.95),rgba(250,234,234,.95));border-radius:10px;border:1px solid #DFC0C0;padding:12px 14px;box-shadow:0 1px 8px rgba(150,35,35,.05);">
        <div style="display:flex;align-items:center;gap:7px;margin-bottom:9px;">
          <div style="width:16px;height:16px;border-radius:50%;background:#B03030;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5" stroke="white" stroke-width="1.6" stroke-linecap="round"/></svg>
          </div>
          <span style="font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:.14em;color:#7A1E1E;text-transform:uppercase;">Avoid These</span>
        </div>
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px;">
          ${donts.map(d => `<li style="display:flex;gap:7px;align-items:flex-start;"><span style="color:#B03030;font-size:10px;margin-top:1px;flex-shrink:0;line-height:1.4;">✗</span><span style="font-family:'Barlow',sans-serif;font-size:12px;font-weight:400;color:#662020;line-height:1.65;">${d}</span></li>`).join('')}
        </ul>
      </div>
    </div>

    <div style="flex:1;"></div>
    <div style="padding:8px 22px 12px;border-top:1px solid rgba(80,60,160,.1);flex-shrink:0;background:rgba(255,255,255,.3);">
      <p style="font-family:'IBM Plex Mono',monospace;font-size:7px;color:rgba(80,60,160,.3);letter-spacing:.06em;margin:0;line-height:1.6;">AI-generated consultation report · For review with a qualified stylist only.</p>
    </div>
  `, false);

  // ═══════════════════════════════
  //  PAGE 2 — FRONT + BACK
  // ═══════════════════════════════
  const p2 = page(2, `
    <div style="padding:13px 22px 7px;flex-shrink:0;">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:7.5px;letter-spacing:.28em;color:rgba(80,60,160,.45);margin-bottom:3px;">ANGLE ANALYSIS · 01 OF 02</div>
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:28px;font-weight:700;color:rgba(80,60,180,.08);letter-spacing:.03em;line-height:1;text-transform:uppercase;">FRONT &amp; BACK</div>
    </div>
    <div style="flex:1;padding:0 22px 15px;display:flex;flex-direction:column;gap:11px;min-height:0;">
      ${angleSection('front', 'Front View', '80,130,220', analysis.front_notes || '')}
      ${angleSection('back', 'Back View', '65,100,200', analysis.back_notes || '')}
    </div>
  `, false);

  // ═══════════════════════════════
  //  PAGE 3 — SIDE + TOP
  // ═══════════════════════════════
  const p3 = page(3, `
    <div style="padding:13px 22px 7px;flex-shrink:0;">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:7.5px;letter-spacing:.28em;color:rgba(80,60,160,.45);margin-bottom:3px;">ANGLE ANALYSIS · 02 OF 02</div>
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:28px;font-weight:700;color:rgba(80,60,180,.08);letter-spacing:.03em;line-height:1;text-transform:uppercase;">SIDE &amp; TOP</div>
    </div>
    <div style="flex:1;padding:0 22px 15px;display:flex;flex-direction:column;gap:11px;min-height:0;">
      ${angleSection('side', 'Side Profile', '120,90,210', analysis.side_notes || '')}
      ${angleSection('top', 'Top / Crown', '150,100,200', analysis.top_notes || '')}
    </div>
  `, true);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Hair Report — ${name}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700&family=Barlow:wght@300;400;500&family=IBM+Plex+Mono:wght@300;400&display=swap" rel="stylesheet">
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html,body{background:#CBBEFF;font-family:'Barlow',sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  @media print {
    @page { size: A4 portrait; margin: 0; }
    html, body { margin: 0; padding: 0; background: #CBBEFF; height: 100%; overflow: visible !important; }
    /* Force blocks to render and not clip during print cycle */
    .page { overflow: visible !important; display: block !important; }
  }
</style>
</head>
<body>
${p1}${p2}${p3}
<script>
  // Robust execution script: Wait for all images to paint, THEN trigger print
  function executePrint() {
    setTimeout(function() { window.print(); }, 500);
  }
  
  window.addEventListener('load', function() {
    var imgs = Array.from(document.querySelectorAll('img'));
    if (!imgs.length) { executePrint(); return; }
    
    var doneCount = 0;
    var total = imgs.length;
    
    function checkDone() {
      doneCount++;
      if (doneCount >= total) {
        // Double RAF to ensure browser paint cycle is completely finished
        requestAnimationFrame(function() {
          requestAnimationFrame(executePrint);
        });
      }
    }
    
    imgs.forEach(function(img) {
      if (img.complete && img.naturalWidth > 0) {
        checkDone();
      } else {
        img.addEventListener('load', checkDone);
        img.addEventListener('error', checkDone);
      }
    });
  });
</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) { alert('Please allow pop-ups for this site.'); return; }
  win.document.open(); win.document.write(html); win.document.close();
}

// ═══════════════════════════════════════════════════════
//  Results
// ═══════════════════════════════════════════════════════
const ANGLES = ['front', 'back', 'side', 'top'];
const LABEL = { front: 'Front View', back: 'Back View', side: 'Side View', top: 'Top / Crown' };

const Results = ({ analysis, results, inputImages, onReset, resultsRef }) => {
  const mob = useIsMobile();
  const [lightbox, setLightbox] = useState(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const prev = () => setActiveIdx(i => (i - 1 + 4) % 4);
  const next = () => setActiveIdx(i => (i + 1) % 4);
  const activeKey = ANGLES[activeIdx];
  const activeGen = results?.find(g => g.id === activeKey);
  return (
    <section id="results" ref={resultsRef} style={{ padding: mob ? '64px 0 80px' : '72px 0 100px', background: 'transparent' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: mob ? '0 16px' : '0 48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--grey2)' }}>02</span>
          <div className="divider" style={{ flex: 1, minWidth: '16px' }} />
          <h2 style={{ fontFamily: 'var(--display)', fontSize: mob ? '26px' : 'clamp(22px,3vw,38px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--black)' }}>Your Result</h2>
          <button onClick={onReset} style={{ fontFamily: 'var(--body)', fontSize: '10px', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--grey3)', transition: 'color .15s', marginLeft: 'auto' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--black)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--grey3)'}>← New Session</button>
        </div>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '2px' }}>
          {ANGLES.map((a, i) => (<button key={a} onClick={() => setActiveIdx(i)} style={{ fontFamily: 'var(--body)', fontSize: mob ? '9px' : '10px', fontWeight: 500, letterSpacing: '.15em', textTransform: 'uppercase', padding: mob ? '7px 10px' : '8px 16px', border: '1px solid', borderColor: activeIdx === i ? 'var(--black)' : 'var(--grey2)', background: activeIdx === i ? 'var(--black)' : 'rgba(255,255,255,.4)', color: activeIdx === i ? 'var(--white)' : 'var(--grey3)', transition: 'all .2s', whiteSpace: 'nowrap', flexShrink: 0, backdropFilter: 'blur(5px)' }}>{mob ? a.charAt(0).toUpperCase() + a.slice(1) : LABEL[a]}</button>))}
        </div>
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <button onClick={prev} style={{ position: 'absolute', left: mob ? '-4px' : '-20px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: '36px', height: '36px', background: 'rgba(255,255,255,.8)', border: '1px solid var(--grey1)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color .15s', backdropFilter: 'blur(5px)' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--black)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--grey1)'}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg></button>
          <button onClick={next} style={{ position: 'absolute', right: mob ? '-4px' : '-20px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: '36px', height: '36px', background: 'rgba(255,255,255,.8)', border: '1px solid var(--grey1)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color .15s', backdropFilter: 'blur(5px)' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--black)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--grey1)'}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg></button>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: mob ? '8px' : '16px', maxWidth: mob ? '100%' : '600px', margin: '0 auto', padding: mob ? '0 36px' : '0 28px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--grey2)', letterSpacing: '.2em', textAlign: 'center' }}>BEFORE</div>
              <div style={{ aspectRatio: '3/4', overflow: 'hidden', border: '1px solid var(--mist)', background: 'rgba(255,255,255,.5)' }}>{inputImages?.[activeKey] && <img src={inputImages[activeKey]} alt="before" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--grey4)', letterSpacing: '.2em', textAlign: 'center' }}>AFTER</div>
              <div onClick={() => activeGen?.url && setLightbox(activeGen)} style={{ aspectRatio: '3/4', overflow: 'hidden', border: `1px solid ${activeGen?.url ? 'var(--grey2)' : 'var(--mist)'}`, background: 'rgba(255,255,255,.7)', position: 'relative', cursor: activeGen?.url ? 'pointer' : 'default', transition: 'border-color .2s' }} onMouseEnter={e => { if (activeGen?.url) e.currentTarget.style.borderColor = 'var(--black)'; }} onMouseLeave={e => { if (activeGen?.url) e.currentTarget.style.borderColor = 'var(--grey2)'; }}>
                {activeGen?.url ? (<><img src={activeGen.url} alt="after" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /><div style={{ position: 'absolute', bottom: '5px', right: '5px', fontFamily: 'var(--mono)', fontSize: '7px', color: 'rgba(0,0,0,.35)', background: 'rgba(255,255,255,.8)', padding: '2px 5px' }}>↗ zoom</div></>)
                  : activeGen?.error ? (<div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px', gap: '6px' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(180,60,60,.5)" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg><div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'rgba(180,60,60,.6)', textAlign: 'center' }}>Failed</div></div>)
                    : (<div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><div style={{ width: '16px', height: '16px', border: '1px solid var(--grey1)', borderTop: '1px solid var(--grey4)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /><div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--grey2)' }}>generating…</div></div>)}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '10px', fontFamily: 'var(--body)', fontSize: '10px', fontWeight: 500, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--grey3)' }}>{LABEL[activeKey]}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginTop: '10px' }}>{ANGLES.map((_, i) => <button key={i} onClick={() => setActiveIdx(i)} style={{ width: activeIdx === i ? '18px' : '5px', height: '5px', borderRadius: '3px', background: activeIdx === i ? 'var(--black)' : 'var(--grey2)', border: 'none', padding: 0, transition: 'all .3s' }} />)}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: mob ? '6px' : '10px', marginBottom: '32px', marginTop: '8px' }}>
          {ANGLES.map((k, i) => {
            const g = results?.find(r => r.id === k); const isActive = i === activeIdx; return (
              <div key={k} onClick={() => setActiveIdx(i)} style={{ cursor: 'pointer' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: isActive ? 'var(--black)' : 'var(--grey3)', letterSpacing: '.1em', textAlign: 'center', marginBottom: '4px', textTransform: 'uppercase', transition: 'color .2s' }}>{mob ? k : LABEL[k]}</div>
                <div style={{ aspectRatio: '3/4', overflow: 'hidden', border: `1px solid ${isActive ? 'var(--black)' : 'var(--grey1)'}`, background: 'rgba(255,255,255,.4)', opacity: isActive ? 1 : .55, transition: 'all .2s' }}>
                  {g?.url ? <img src={g.url} alt={k} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: '10px', height: '10px', border: '1px solid var(--grey1)', borderTop: '1px solid var(--grey3)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /></div>}
                </div>
              </div>
            );
          })}
        </div>
        {analysis && (
          <div style={{ background: 'linear-gradient(135deg,rgba(255,255,255,.7) 0%,rgba(255,255,255,.4) 100%)', backdropFilter: 'blur(10px)', border: '1px solid var(--mist)', padding: mob ? '20px 16px' : '28px 32px', animation: 'fadeUp .6s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <div><div style={{ fontFamily: 'var(--body)', fontSize: '9px', fontWeight: 500, letterSpacing: '.28em', textTransform: 'uppercase', color: 'var(--grey3)', marginBottom: '6px' }}>Recommended Hairstyle</div><h3 style={{ fontFamily: 'var(--display)', fontSize: mob ? '22px' : 'clamp(20px,2.6vw,30px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--black)', lineHeight: 1 }}>{analysis.hairstyle_name}</h3></div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--grey4)', background: 'var(--white)', padding: '5px 10px', border: '1px solid var(--grey1)', letterSpacing: '.07em', flexShrink: 0, alignSelf: 'flex-start', marginTop: mob ? '0' : '4px' }}>{analysis.length}</div>
            </div>
            <p style={{ fontFamily: 'var(--body)', fontSize: mob ? '13px' : '14px', fontWeight: 300, color: 'var(--grey4)', lineHeight: 1.8, marginBottom: '16px' }}>{analysis.description}</p>
            <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr 1fr' : 'repeat(auto-fit,minmax(150px,1fr))', gap: '8px', marginBottom: '16px' }}>
              {[['Front', analysis.front_notes], ['Back', analysis.back_notes], ['Side', analysis.side_notes], ['Top', analysis.top_notes]].map(([label, text]) => text && (
                <div key={label} style={{ background: 'var(--white)', border: '1px solid var(--mist)', padding: '10px 12px' }}>
                  <div style={{ fontFamily: 'var(--body)', fontSize: '8px', fontWeight: 500, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--grey3)', marginBottom: '5px' }}>{label}</div>
                  <div style={{ fontFamily: 'var(--body)', fontSize: '12px', fontWeight: 300, color: 'var(--grey4)', lineHeight: 1.65 }}>{text}</div>
                </div>
              ))}
            </div>
            {analysis.styling_tip && (<div style={{ borderTop: '1px solid var(--grey1)', paddingTop: '12px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}><span style={{ color: 'var(--grey3)', fontSize: '11px', flexShrink: 0, marginTop: '2px' }}>—</span><div style={{ fontFamily: 'var(--body)', fontSize: '13px', fontWeight: 300, color: 'var(--grey3)', lineHeight: 1.75 }}>{analysis.styling_tip}</div></div>)}
          </div>
        )}
      </div>
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,.96)', zIndex: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: mob ? '16px' : '40px', animation: 'fadeIn .2s ease', cursor: 'zoom-out' }}>
          <div style={{ maxWidth: '480px', width: '100%', animation: 'fadeUp .22s ease' }}>
            <img src={lightbox.url} alt={lightbox.id} style={{ width: '100%', display: 'block', border: '1px solid var(--grey1)' }} />
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--display)', fontSize: mob ? '16px' : '18px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--black)' }}>{LABEL[lightbox.id]}</div>
              <div style={{ fontFamily: 'var(--body)', fontSize: '10px', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--grey3)' }}>tap to close</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

function compressImage(dataUrl, maxPx = 900, quality = 0.82) {
  return new Promise(resolve => {
    const img = new Image(); img.onload = () => { const scale = Math.min(1, maxPx / Math.max(img.width, img.height)); const w = Math.round(img.width * scale), h = Math.round(img.height * scale); const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h); resolve(c.toDataURL('image/jpeg', quality)); }; img.onerror = () => resolve(dataUrl); img.src = dataUrl;
  });
}

async function post(path, body, timeoutMs = 200_000) {
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try { const res = await fetch(path, { method: 'POST', signal: ctrl.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); clearTimeout(timer); const data = await res.json(); if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`); return data; }
  catch (e) { clearTimeout(timer); throw new Error(e.name === 'AbortError' ? 'Request timed out' : e.message); }
}

export default function App() {
  const [images, setImages] = useState({ front: null, back: null, side: null, top: null });
  const [phase, setPhase] = useState('idle');
  const [analysis, setAnalysis] = useState(null);
  const [results, setResults] = useState([]);
  const [err, setErr] = useState(null);
  const [patient, setPatient] = useState({ name: '', age: '', phone: '' });
  const handlePatientChange = useCallback((key, val) => setPatient(prev => ({ ...prev, [key]: val })), []);
  const uploadRef = useRef(null), resultsRef = useRef(null), savedImgs = useRef(null);
  const scrollTo = ref => ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const handleImage = useCallback((id, val) => setImages(prev => ({ ...prev, [id]: val })), []);

  const run = async () => {
    savedImgs.current = { ...images }; setPhase('running'); setErr(null); setAnalysis(null); setResults([]);
    const [cf, cb, cs, ct] = await Promise.all([compressImage(images.front), compressImage(images.back), compressImage(images.side), compressImage(images.top)]);
    const compressed = { front: cf, back: cb, side: cs, top: ct };
    let analysisData;
    try { const r = await post('/api/analyze', compressed); analysisData = r.analysis; setAnalysis(analysisData); }
    catch (e) { setErr(e.message); setPhase('idle'); return; }
    try { const r = await post('/api/generate', { ...compressed, analysis: analysisData }, 240_000); setResults(r.results || []); }
    catch (e) { console.warn('[App] gen error:', e.message); setResults([]); }
    setPhase('done'); setTimeout(() => scrollTo(resultsRef), 400);
  };

  const reset = () => { setImages({ front: null, back: null, side: null, top: null }); setPhase('idle'); setAnalysis(null); setResults([]); setErr(null); setPatient({ name: '', age: '', phone: '' }); setTimeout(() => scrollTo(uploadRef), 200); };
  const openReport = () => printReport(analysis, results, savedImgs.current, patient);

  return (
    <>
      <Styles /><Cursor />
      <Nav onDownload={openReport} showDownload={phase === 'done'} />
      <Ticker />
      <Hero onBegin={() => scrollTo(uploadRef)} />
      <div className="divider no-print" style={{ margin: '0 16px' }} />
      {phase !== 'done' && <Upload images={images} onImage={handleImage} uploadRef={uploadRef} onRun={run} running={phase === 'running'} patient={patient} onPatientChange={handlePatientChange} />}
      {phase === 'running' && <Scanner images={images} />}
      {err && <ErrorBanner msg={err} onRetry={run} onDismiss={() => setErr(null)} />}
      {phase === 'done' && <Results analysis={analysis} results={results} inputImages={savedImgs.current} onReset={reset} resultsRef={resultsRef} />}
      <footer className="no-print" style={{ borderTop: '1px solid var(--mist)', padding: '28px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'transparent' }}>
        <div style={{ fontFamily: 'var(--display)', fontSize: '13px', fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--black)' }}>American Hairline</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--grey3)' }}>Nano Banana · {new Date().getFullYear()}</div>
        <div style={{ fontFamily: 'var(--body)', fontSize: '10px', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--grey3)' }}>For Consultation Purposes Only</div>
      </footer>
    </>
  );
}