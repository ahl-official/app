import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   AMERICAN HAIRLINE  ·  Light Edition  ·  Mobile-First
═══════════════════════════════════════════════════════════════════════════ */

const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;500;600;700&family=Barlow:wght@300;400;500&family=IBM+Plex+Mono:wght@300;400&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --white:   #FFFFFF;
      --off:     #F8F8F7;
      --light:   #F2F2F0;
      --mist:    #E8E8E5;
      --grey1:   #D4D4D0;
      --grey2:   #AEAEAA;
      --grey3:   #7A7A76;
      --grey4:   #4A4A48;
      --black:   #111110;
      --ink:     #1E1E1C;
      --display: 'Barlow Condensed', sans-serif;
      --body:    'Barlow', sans-serif;
      --mono:    'IBM Plex Mono', monospace;
    }

    html { scroll-behavior: smooth; }
    body { background:var(--white); color:var(--ink); font-family:var(--body); overflow-x:hidden; cursor:none; }

    #c-dot  { position:fixed;width:6px;height:6px;border-radius:50%;background:var(--black);pointer-events:none;z-index:99999;transform:translate(-50%,-50%); }
    #c-ring { position:fixed;width:24px;height:24px;border-radius:50%;border:1px solid rgba(17,17,16,.22);pointer-events:none;z-index:99998;transform:translate(-50%,-50%); }

    ::-webkit-scrollbar { width:2px; }
    ::-webkit-scrollbar-track { background:var(--light); }
    ::-webkit-scrollbar-thumb { background:var(--grey2); }
    ::selection { background:var(--black); color:var(--white); }

    button { cursor:none; border:none; outline:none; background:none; font-family:inherit; }
    a      { cursor:none; }

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

    @media print {
      body { cursor:auto !important; background:white !important; }
      #c-dot, #c-ring, nav, .no-print { display:none !important; }
      .print-only { display:block !important; }
      @page { size: A4 portrait; margin: 18mm 16mm; }
    }
    .print-only { display:none; }
  `}</style>
);

// ── Mobile hook ───────────────────────────────────────────────────────────────
function useIsMobile() {
  const [mob, setMob] = useState(window.innerWidth <= 640);
  useEffect(() => {
    const h = () => setMob(window.innerWidth <= 640);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return mob;
}

// ── Cursor (desktop only) ─────────────────────────────────────────────────────
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

// ── Nav ───────────────────────────────────────────────────────────────────────
const Nav = ({ onDownload, showDownload }) => {
  const mob = useIsMobile();
  return (
    <nav className="no-print" style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: mob ? '0 16px' : '0 48px',
      height: mob ? '48px' : '52px',
      background: 'rgba(255,255,255,.95)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--mist)'
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '18px', height: '18px', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 4L5 6L2 8M10 4L7 6L10 8" stroke="white" strokeWidth="1.2" strokeLinecap="round" /></svg>
        </div>
        <div style={{ fontFamily: 'var(--display)', fontSize: mob ? '12px' : '13px', fontWeight: 700, letterSpacing: '.15em', color: 'var(--black)', textTransform: 'uppercase' }}>
          {mob ? 'AHL' : 'American Hairline'}
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', gap: mob ? '12px' : '20px', alignItems: 'center' }}>
        {!mob && ['Upload', 'Results'].map(l => (
          <a key={l} href={`#${l.toLowerCase()}`}
            style={{ fontFamily: 'var(--body)', fontSize: '12px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--grey3)', textDecoration: 'none', transition: 'color .15s' }}
            onMouseEnter={e => e.target.style.color = 'var(--black)'}
            onMouseLeave={e => e.target.style.color = 'var(--grey3)'}
          >{l}</a>
        ))}
        {showDownload && (
          <button onClick={onDownload}
            style={{ fontFamily: 'var(--display)', fontSize: mob ? '10px' : '11px', fontWeight: 600, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--white)', background: 'var(--black)', padding: mob ? '7px 12px' : '8px 18px', display: 'flex', alignItems: 'center', gap: '6px', transition: 'background .2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--grey4)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--black)'}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            {mob ? 'Report' : 'Download Report'}
          </button>
        )}
      </div>
    </nav>
  );
};

// ── Ticker ────────────────────────────────────────────────────────────────────
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

// ── Hero ──────────────────────────────────────────────────────────────────────
const Hero = ({ onBegin }) => {
  const mob = useIsMobile();
  const r1 = useReveal(), r2 = useReveal(), r3 = useReveal();
  return (
    <section className="no-print" style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      padding: mob ? '0 20px 72px' : '0 48px 88px',
      position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(160deg,var(--white) 0%,var(--light) 55%,var(--mist) 100%)'
    }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(var(--grey1) 1px,transparent 1px),linear-gradient(90deg,var(--grey1) 1px,transparent 1px)', backgroundSize: '80px 80px', opacity: .18 }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: 'var(--display)', fontSize: mob ? 'clamp(120px,40vw,200px)' : 'clamp(200px,32vw,460px)', fontWeight: 700, color: 'rgba(17,17,16,.04)', lineHeight: 1, pointerEvents: 'none', userSelect: 'none', letterSpacing: '-.03em', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>AH</div>

      {!mob && (
        <>
          <div style={{ position: 'absolute', top: 0, left: '48px', width: '1px', height: '100%', background: 'linear-gradient(to bottom,transparent,var(--grey1) 30%,var(--grey1) 70%,transparent)', opacity: .6 }} />
          <div style={{ position: 'absolute', top: '80px', right: '48px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--grey2)', lineHeight: 2.2 }}>
            <div>40.7128° N</div><div>74.0060° W</div><div style={{ color: 'var(--grey3)', marginTop: '4px' }}>SYS.ONLINE</div>
          </div>
        </>
      )}

      <div style={{ maxWidth: '960px', position: 'relative', zIndex: 1 }}>
        <div ref={r1} className="rv" style={{ transitionDelay: '.08s', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--body)', fontSize: '10px', fontWeight: 400, letterSpacing: '.28em', textTransform: 'uppercase', color: 'var(--grey3)' }}>
            <div style={{ width: '28px', height: '1px', background: 'var(--grey2)' }} />4-Angle AI Hair Consultation
          </div>
        </div>
        <div ref={r2} className="rv" style={{ transitionDelay: '.18s' }}>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: mob ? 'clamp(56px,18vw,90px)' : 'clamp(64px,11vw,148px)', fontWeight: 700, lineHeight: .92, letterSpacing: '-.01em', textTransform: 'uppercase', color: 'var(--black)' }}>
            <span style={{ display: 'block' }}>American</span>
            <span style={{ display: 'block', color: 'transparent', WebkitTextStroke: `${mob ? '1px' : '1.5px'} var(--grey2)`, marginTop: '-.02em' }}>Hairline</span>
          </h1>
        </div>
        <div ref={r3} className="rv" style={{ transitionDelay: '.32s', marginTop: mob ? '28px' : '44px' }}>
          <p style={{ fontFamily: 'var(--body)', fontSize: mob ? '14px' : 'clamp(15px,1.3vw,18px)', color: 'var(--grey3)', maxWidth: '420px', lineHeight: 1.8, fontWeight: 300, marginBottom: mob ? '24px' : '0' }}>
            Upload four photos — front, back, side, and top. Our AI maps your head geometry and generates the perfect hairstyle.
          </p>
          {mob && (
            <button onClick={onBegin}
              style={{ fontFamily: 'var(--display)', fontSize: '13px', fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--white)', background: 'var(--black)', padding: '14px 36px', width: '100%', marginTop: '20px' }}
            >Begin Analysis</button>
          )}
        </div>
        {!mob && (
          <div style={{ marginTop: '44px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
            <button onClick={onBegin}
              style={{ fontFamily: 'var(--display)', fontSize: '13px', fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--white)', background: 'var(--black)', padding: '15px 48px', transition: 'all .25s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--grey4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--black)'; e.currentTarget.style.transform = 'none'; }}
            >Begin Analysis</button>
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
        {mob && (
          <div style={{ display: 'flex', gap: '28px', marginTop: '28px' }}>
            {[['4', 'Angles'], ['1', 'Style'], ['100%', 'Coverage']].map(([n, l]) => (
              <div key={n}>
                <div style={{ fontFamily: 'var(--display)', fontSize: '22px', fontWeight: 700, color: 'var(--black)' }}>{n}</div>
                <div style={{ fontFamily: 'var(--body)', fontSize: '9px', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--grey2)', marginTop: '1px' }}>{l}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

// ── Guided 4-angle camera flow ────────────────────────────────────────────────
const ANGLE_SEQUENCE = [
  { id: 'front', label: 'Front Face', instruction: 'Look straight at the camera. Keep your head level.' },
  { id: 'back', label: 'Back of Head', instruction: 'Turn fully away. Keep your neck straight.' },
  { id: 'side', label: 'Side Profile', instruction: 'Turn 90° to your left. Keep your chin level.' },
  { id: 'top', label: 'Top / Crown', instruction: 'Hold camera directly above your head, pointing down.' },
];

function CameraFlow({ onCaptures, onClose }) {
  const [step, setStep] = useState(0);
  const [captured, setCaptured] = useState({});
  const [stream, setStream] = useState(null);
  const [camErr, setCamErr] = useState(null);
  const vidRef = useRef(null);

  useEffect(() => {
    let s;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } } })
      .then(st => { s = st; setStream(st); if (vidRef.current) vidRef.current.srcObject = st; })
      .catch(() => setCamErr('Camera permission denied. Please allow camera access and try again.'));
    return () => s?.getTracks().forEach(t => t.stop());
  }, []);

  const capture = () => {
    if (!vidRef.current) return;
    const c = document.createElement('canvas');
    c.width = vidRef.current.videoWidth; c.height = vidRef.current.videoHeight;
    const ctx = c.getContext('2d');
    ctx.translate(c.width, 0); ctx.scale(-1, 1);
    ctx.drawImage(vidRef.current, 0, 0);
    const url = c.toDataURL('image/jpeg', .95);
    const angleId = ANGLE_SEQUENCE[step].id;
    const next = { ...captured, [angleId]: url };
    setCaptured(next);
    if (step < ANGLE_SEQUENCE.length - 1) setStep(s => s + 1);
    else onCaptures(next);
  };

  const current = ANGLE_SEQUENCE[step];
  const done = Object.keys(captured).length;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,17,16,.92)', zIndex: 950, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', animation: 'fadeIn .2s ease' }}>
      <div style={{ background: 'var(--white)', width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', maxHeight: '96vh', overflowY: 'auto' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--mist)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--display)', fontSize: '15px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--black)' }}>Capture {current.label}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--grey3)', marginTop: '2px' }}>Step {step + 1} of 4</div>
          </div>
          <button onClick={onClose} style={{ fontSize: '22px', lineHeight: 1, color: 'var(--grey3)', padding: '4px 8px' }}>×</button>
        </div>
        <div style={{ display: 'flex', gap: '4px', padding: '12px 20px 0' }}>
          {ANGLE_SEQUENCE.map((a, i) => (
            <div key={a.id} style={{ flex: 1, height: '3px', background: i < done ? 'var(--black)' : i === step ? 'var(--grey3)' : 'var(--mist)', transition: 'background .3s' }} />
          ))}
        </div>
        {camErr ? (
          <div style={{ padding: '24px 20px', fontFamily: 'var(--mono)', fontSize: '12px', color: '#b84040', background: '#fdf5f5', margin: '16px 20px', border: '1px solid #e5b4b4' }}>{camErr}</div>
        ) : (
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
            <div style={{ padding: '10px 20px', background: 'var(--off)', margin: '0 20px', borderTop: '1px solid var(--mist)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--grey3)', lineHeight: 1.5 }}>{current.instruction}</div>
            </div>
            {/* Thumbnails */}
            {done > 0 && (
              <div style={{ display: 'flex', gap: '6px', padding: '10px 20px 0' }}>
                {ANGLE_SEQUENCE.slice(0, done).map(a => (
                  <div key={a.id} style={{ width: '44px', height: '44px', overflow: 'hidden', border: '1px solid var(--grey1)', flexShrink: 0 }}>
                    <img src={captured[a.id]} alt={a.id} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
            <div style={{ padding: '16px 20px' }}>
              <button onClick={capture}
                style={{ width: '100%', fontFamily: 'var(--display)', fontSize: '13px', fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--white)', background: 'var(--black)', padding: '14px', transition: 'background .2s' }}
              >Capture Photo {step + 1}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Angle Slot ────────────────────────────────────────────────────────────────
const SLOT_LABEL = { front: 'Front Face', back: 'Back of Head', side: 'Side Profile', top: 'Top / Crown' };

function AngleSlot({ id, image, onImage }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const loadFile = file => {
    const r = new FileReader();
    r.onload = e => onImage(id, e.target.result);
    r.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--grey3)', letterSpacing: '.18em', textTransform: 'uppercase', textAlign: 'center' }}>{SLOT_LABEL[id]}</div>
      <div
        onClick={() => !image && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f && f.type.startsWith('image/')) loadFile(f); }}
        style={{ aspectRatio: '3/4', border: `1px ${drag ? 'solid' : 'dashed'} ${image ? 'var(--grey2)' : drag ? 'var(--black)' : 'var(--grey1)'}`, background: image ? 'var(--light)' : drag ? 'var(--off)' : 'transparent', position: 'relative', overflow: 'hidden', transition: 'all .2s', cursor: image ? 'default' : 'pointer' }}
      >
        {image ? (
          <>
            <img src={image} alt={id} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(17,17,16,0)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', transition: 'background .2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(17,17,16,.45)'; e.currentTarget.querySelector('button').style.opacity = '1'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(17,17,16,0)'; e.currentTarget.querySelector('button').style.opacity = '0'; }}
            >
              <button onClick={() => inputRef.current?.click()} style={{ fontFamily: 'var(--body)', fontSize: '10px', letterSpacing: '.15em', textTransform: 'uppercase', color: 'white', opacity: 0, transition: 'opacity .2s', background: 'none', border: 'none' }}>Replace</button>
            </div>
          </>
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--grey2)" strokeWidth="1.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--grey2)', letterSpacing: '.1em', textAlign: 'center', lineHeight: 1.5 }}>Drop or tap</div>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={e => { if (e.target.files[0]) loadFile(e.target.files[0]); }} />
    </div>
  );
}

// ── Upload ────────────────────────────────────────────────────────────────────
const Upload = ({ images, onImage, uploadRef, onRun, running }) => {
  const mob = useIsMobile();
  const [camFlowOpen, setCamFlowOpen] = useState(false);
  const keys = ['front', 'back', 'side', 'top'];
  const filled = keys.filter(k => images[k]).length;
  const allFilled = filled === 4;

  const handleCaptures = useCallback(captured => {
    Object.entries(captured).forEach(([id, url]) => onImage(id, url));
    setCamFlowOpen(false);
  }, [onImage]);

  return (
    <section id="upload" ref={uploadRef} className="no-print" style={{ padding: mob ? '72px 16px 60px' : '100px 48px 80px', maxWidth: '1100px', margin: '0 auto', background: 'var(--white)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--grey2)' }}>01</span>
        <div className="divider" style={{ flex: 1 }} />
        <h2 style={{ fontFamily: 'var(--display)', fontSize: mob ? '26px' : 'clamp(22px,2.8vw,38px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--black)' }}>Upload 4 Angles</h2>
      </div>
      <p style={{ fontFamily: 'var(--body)', fontSize: '13px', fontWeight: 300, color: 'var(--grey3)', lineHeight: 1.7, marginBottom: '24px' }}>
        All four views required — front, back, side, and top.
      </p>

      {/* Camera CTA */}
      <button onClick={() => setCamFlowOpen(true)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: mob ? '100%' : 'auto', fontFamily: 'var(--display)', fontSize: '13px', fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--white)', background: 'var(--black)', padding: '14px 28px', marginBottom: '24px', transition: 'background .2s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--grey4)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--black)'}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
        Capture 4 Photos with Camera
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div className="divider" style={{ flex: 1 }} />
        <span style={{ fontFamily: 'var(--body)', fontSize: '10px', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--grey2)', whiteSpace: 'nowrap' }}>or upload individually</span>
        <div className="divider" style={{ flex: 1 }} />
      </div>

      {/* Slots grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: mob ? '8px' : '16px', marginBottom: '24px' }}>
        {keys.map(id => <AngleSlot key={id} id={id} image={images[id]} onImage={onImage} />)}
      </div>

      {/* Progress */}
      <div style={{ height: '2px', background: 'var(--mist)', marginBottom: '16px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${filled / 4 * 100}%`, background: 'var(--black)', transition: 'width .4s cubic-bezier(.16,1,.3,1)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: mob ? 'column' : 'row', alignItems: mob ? 'stretch' : 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--grey3)', textAlign: mob ? 'center' : 'left' }}>
          {allFilled ? 'All angles loaded — ready to analyse' : `${4 - filled} photo${4 - filled !== 1 ? 's' : ''} remaining`}
        </div>
        <button onClick={onRun} disabled={!allFilled || running}
          style={{ fontFamily: 'var(--display)', fontSize: '12px', fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', padding: '14px 40px', transition: 'all .25s', color: allFilled && !running ? 'var(--white)' : 'var(--grey2)', background: allFilled && !running ? 'var(--black)' : 'var(--mist)' }}
        >{running ? 'Analysing…' : 'Analyse & Generate'}</button>
      </div>

      {camFlowOpen && <CameraFlow onCaptures={handleCaptures} onClose={() => setCamFlowOpen(false)} />}
    </section>
  );
};

// ── Scanner ───────────────────────────────────────────────────────────────────
const Scanner = ({ images }) => {
  const mob = useIsMobile();
  const LOG = ['LOADING FACIAL MESH ENGINE', 'MAPPING FRONT GEOMETRY', 'ANALYSING BACK CONTOUR', 'MEASURING SIDE PROFILE', 'READING CROWN TOPOLOGY', 'COMPUTING HEAD SHAPE INDEX', 'HAIRLINE COVERAGE ALGORITHM', 'SELECTING OPTIMAL HAIRSTYLE', 'HAIRLINE COVERAGE: CONFIRMED', 'RENDERING FRONT VIEW', 'RENDERING BACK VIEW', 'RENDERING SIDE VIEW', 'RENDERING TOP VIEW', 'FINALISING OUTPUT'];
  const [idx, setIdx] = useState(0);
  useEffect(() => { const t = setInterval(() => setIdx(i => (i + 1) % LOG.length), 700); return () => clearInterval(t); }, []);
  return (
    <div className="no-print" style={{ padding: mob ? '40px 16px 60px' : '60px 48px 80px', maxWidth: '900px', margin: '0 auto', textAlign: 'center', animation: 'fadeIn .5s ease', background: 'var(--white)' }}>
      <div style={{ fontFamily: 'var(--body)', fontSize: '10px', letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--grey3)', marginBottom: '28px' }}>Neural Processing · 4-Angle Analysis</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: mob ? '6px' : '8px', marginBottom: '24px' }}>
        {['front', 'back', 'side', 'top'].map((k, i) => (
          <div key={k} style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', border: '1px solid var(--mist)', background: 'var(--light)' }}>
            {images[k] && <img src={images[k]} alt={k} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) brightness(.95)', display: 'block' }} />}
            <div style={{ position: 'absolute', left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(17,17,16,.6),transparent)', animation: `scan 2s ease-in-out infinite`, animationDelay: `${i * .3}s` }} />
            <div style={{ position: 'absolute', bottom: '3px', left: 0, right: 0, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--grey3)', letterSpacing: '.12em' }}>{k.toUpperCase()}</div>
          </div>
        ))}
      </div>
      <div style={{ background: 'var(--off)', border: '1px solid var(--mist)', padding: '12px 16px', maxWidth: '360px', margin: '0 auto', textAlign: 'left' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--grey4)', letterSpacing: '.04em', minHeight: '18px' }}>
          <span style={{ color: 'var(--grey2)' }}>$ </span>{LOG[idx]}<span style={{ animation: 'blink .8s infinite', marginLeft: '2px' }}>_</span>
        </div>
      </div>
    </div>
  );
};

// ── Error ─────────────────────────────────────────────────────────────────────
const ErrorBanner = ({ msg, onRetry, onDismiss }) => (
  <div className="no-print" style={{ maxWidth: '960px', margin: '0 auto', padding: '0 16px 24px', animation: 'fadeUp .3s ease' }}>
    <div style={{ padding: '16px 18px', border: '1px solid #e5b4b4', background: '#fdf5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
      <div>
        <div style={{ fontFamily: 'var(--body)', fontSize: '10px', fontWeight: 500, letterSpacing: '.2em', textTransform: 'uppercase', color: '#b84040', marginBottom: '4px' }}>Error</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: '#b84040', lineHeight: 1.6, wordBreak: 'break-word' }}>{msg}</div>
      </div>
      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
        <button onClick={onRetry} style={{ fontFamily: 'var(--body)', fontSize: '10px', fontWeight: 500, letterSpacing: '.12em', textTransform: 'uppercase', color: 'white', background: '#b84040', padding: '7px 12px' }}>Retry</button>
        <button onClick={onDismiss} style={{ fontFamily: 'var(--body)', fontSize: '10px', color: 'var(--grey3)', padding: '7px' }}>✕</button>
      </div>
    </div>
  </div>
);

// ── PDF print layout ──────────────────────────────────────────────────────────
const PrintReport = ({ analysis, results, inputImages }) => {
  if (!analysis) return null;
  const LABEL = { front: 'Front', back: 'Back', side: 'Side', top: 'Top' };
  return (
    <div className="print-only" style={{ fontFamily: 'var(--body)', color: '#111', background: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #111', paddingBottom: '12px', marginBottom: '20px' }}>
        <div>
          <div style={{ fontFamily: 'var(--display)', fontSize: '30px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', lineHeight: 1 }}>American Hairline</div>
          <div style={{ fontSize: '11px', color: '#666', letterSpacing: '.18em', textTransform: 'uppercase', marginTop: '4px' }}>AI Hair Consultation Report</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '10px', color: '#999', fontFamily: 'var(--mono)' }}>
          <div>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
          <div style={{ marginTop: '2px' }}>For Consultation Purposes Only</div>
        </div>
      </div>
      <div style={{ background: '#f8f8f7', border: '1px solid #ddd', padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '.28em', textTransform: 'uppercase', color: '#888', marginBottom: '6px' }}>Recommended Hairstyle</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: '24px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>{analysis.hairstyle_name}</div>
          <div style={{ fontSize: '10px', color: '#555', border: '1px solid #ccc', padding: '4px 10px', whiteSpace: 'nowrap', fontFamily: 'var(--mono)' }}>{analysis.length}</div>
        </div>
        <p style={{ fontSize: '13px', color: '#444', lineHeight: 1.7, marginBottom: '14px' }}>{analysis.description}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
          {[['Front', analysis.front_notes], ['Back', analysis.back_notes], ['Side', analysis.side_notes], ['Top', analysis.top_notes]].map(([l, t]) => t && (
            <div key={l} style={{ background: 'white', border: '1px solid #e8e8e5', padding: '10px 12px' }}>
              <div style={{ fontSize: '8px', fontWeight: 500, letterSpacing: '.25em', textTransform: 'uppercase', color: '#888', marginBottom: '5px' }}>{l}</div>
              <div style={{ fontSize: '11px', color: '#555', lineHeight: 1.6 }}>{t}</div>
            </div>
          ))}
        </div>
        {analysis.styling_tip && (
          <div style={{ borderTop: '1px solid #ddd', paddingTop: '10px', marginTop: '12px', fontSize: '12px', color: '#666', lineHeight: 1.7 }}>
            <span style={{ fontWeight: 500, color: '#444' }}>Styling tip: </span>{analysis.styling_tip}
          </div>
        )}
      </div>
      <div style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '.25em', textTransform: 'uppercase', color: '#888', marginBottom: '10px' }}>Before → After · 4 Angles</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '16px' }}>
        {['front', 'back', 'side', 'top'].map(key => {
          const gen = results?.find(r => r.id === key);
          return (
            <div key={key}>
              <div style={{ fontSize: '8px', color: '#aaa', letterSpacing: '.12em', textAlign: 'center', marginBottom: '4px' }}>ORIGINAL</div>
              <div style={{ aspectRatio: '3/4', overflow: 'hidden', border: '1px solid #e8e8e5', background: '#f2f2f0', marginBottom: '4px' }}>
                {inputImages?.[key] && <img src={inputImages[key]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
              </div>
              <div style={{ fontSize: '8px', color: '#555', letterSpacing: '.12em', textAlign: 'center', marginBottom: '4px' }}>GENERATED</div>
              <div style={{ aspectRatio: '3/4', overflow: 'hidden', border: '1px solid #ddd', background: '#f8f8f7' }}>
                {gen?.url && <img src={gen.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
              </div>
              <div style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '.12em', textTransform: 'uppercase', color: '#666', textAlign: 'center', marginTop: '4px' }}>{LABEL[key]}</div>
            </div>
          );
        })}
      </div>
      <div style={{ borderTop: '1px solid #ddd', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#aaa', fontFamily: 'var(--mono)' }}>
        <span>American Hairline · AI Hair Consultation</span>
        <span>Nano Banana · {new Date().getFullYear()}</span>
      </div>
    </div>
  );
};

// ── Results ───────────────────────────────────────────────────────────────────
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
    <section id="results" ref={resultsRef} style={{ padding: mob ? '64px 0 80px' : '72px 0 100px', background: 'var(--white)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: mob ? '0 16px' : '0 48px' }}>

        {/* ── Header row ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--grey2)' }}>02</span>
          <div className="divider" style={{ flex: 1, minWidth: '16px' }} />
          <h2 style={{ fontFamily: 'var(--display)', fontSize: mob ? '26px' : 'clamp(22px,3vw,38px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--black)' }}>Your Result</h2>
          <button onClick={onReset}
            style={{ fontFamily: 'var(--body)', fontSize: '10px', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--grey3)', transition: 'color .15s', marginLeft: 'auto' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--black)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--grey3)'}
          >← New Session</button>
        </div>

        {/* ── Angle tabs ── */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '2px' }}>
          {ANGLES.map((a, i) => (
            <button key={a} onClick={() => setActiveIdx(i)}
              style={{ fontFamily: 'var(--body)', fontSize: mob ? '9px' : '10px', fontWeight: 500, letterSpacing: '.15em', textTransform: 'uppercase', padding: mob ? '7px 10px' : '8px 16px', border: '1px solid', borderColor: activeIdx === i ? 'var(--black)' : 'var(--grey1)', background: activeIdx === i ? 'var(--black)' : 'transparent', color: activeIdx === i ? 'var(--white)' : 'var(--grey3)', transition: 'all .2s', whiteSpace: 'nowrap', flexShrink: 0 }}
            >{mob ? a.charAt(0).toUpperCase() + a.slice(1) : LABEL[a]}</button>
          ))}
        </div>

        {/* ── Main carousel: Before / After side by side ── */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>

          {/* Prev arrow */}
          <button onClick={prev}
            style={{ position: 'absolute', left: mob ? '-4px' : '-20px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: '36px', height: '36px', background: 'var(--white)', border: '1px solid var(--grey1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'border-color .15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--black)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--grey1)'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          </button>

          {/* Next arrow */}
          <button onClick={next}
            style={{ position: 'absolute', right: mob ? '-4px' : '-20px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: '36px', height: '36px', background: 'var(--white)', border: '1px solid var(--grey1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'border-color .15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--black)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--grey1)'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </button>

          {/* Before / After columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: mob ? '8px' : '16px', maxWidth: mob ? '100%' : '600px', margin: '0 auto', padding: mob ? '0 36px' : '0 28px' }}>

            {/* BEFORE */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--grey2)', letterSpacing: '.2em', textAlign: 'center' }}>BEFORE</div>
              <div style={{ aspectRatio: '3/4', overflow: 'hidden', border: '1px solid var(--mist)', background: 'var(--light)' }}>
                {inputImages?.[activeKey] && <img src={inputImages[activeKey]} alt="before" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
              </div>
            </div>

            {/* AFTER */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--grey4)', letterSpacing: '.2em', textAlign: 'center' }}>AFTER</div>
              <div
                onClick={() => activeGen?.url && setLightbox(activeGen)}
                style={{ aspectRatio: '3/4', overflow: 'hidden', border: `1px solid ${activeGen?.url ? 'var(--grey2)' : 'var(--mist)'}`, background: 'var(--off)', position: 'relative', cursor: activeGen?.url ? 'pointer' : 'default', transition: 'border-color .2s' }}
                onMouseEnter={e => { if (activeGen?.url) e.currentTarget.style.borderColor = 'var(--black)'; }}
                onMouseLeave={e => { if (activeGen?.url) e.currentTarget.style.borderColor = 'var(--grey2)'; }}
              >
                {activeGen?.url ? (
                  <>
                    <img src={activeGen.url} alt="after" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <div style={{ position: 'absolute', bottom: '5px', right: '5px', fontFamily: 'var(--mono)', fontSize: '7px', color: 'rgba(0,0,0,.35)', background: 'rgba(255,255,255,.8)', padding: '2px 5px' }}>↗ zoom</div>
                  </>
                ) : activeGen?.error ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px', gap: '6px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(180,60,60,.5)" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'rgba(180,60,60,.6)', textAlign: 'center', lineHeight: 1.4 }}>Failed</div>
                  </div>
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <div style={{ width: '16px', height: '16px', border: '1px solid var(--grey1)', borderTop: '1px solid var(--grey4)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--grey2)' }}>generating…</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Angle label */}
          <div style={{ textAlign: 'center', marginTop: '10px', fontFamily: 'var(--body)', fontSize: '10px', fontWeight: 500, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--grey3)' }}>
            {LABEL[activeKey]}
          </div>

          {/* Dot indicators */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginTop: '10px' }}>
            {ANGLES.map((_, i) => (
              <button key={i} onClick={() => setActiveIdx(i)}
                style={{ width: activeIdx === i ? '18px' : '5px', height: '5px', borderRadius: '3px', background: activeIdx === i ? 'var(--black)' : 'var(--grey1)', border: 'none', padding: 0, transition: 'all .3s' }}
              />
            ))}
          </div>
        </div>

        {/* ── Thumbnail strip — all 4 generated results ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: mob ? '6px' : '10px', marginBottom: '32px', marginTop: '8px' }}>
          {ANGLES.map((k, i) => {
            const g = results?.find(r => r.id === k);
            const isActive = i === activeIdx;
            return (
              <div key={k} onClick={() => setActiveIdx(i)} style={{ cursor: 'pointer' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: isActive ? 'var(--black)' : 'var(--grey2)', letterSpacing: '.1em', textAlign: 'center', marginBottom: '4px', textTransform: 'uppercase', transition: 'color .2s' }}>{mob ? k : LABEL[k]}</div>
                <div style={{ aspectRatio: '3/4', overflow: 'hidden', border: `1px solid ${isActive ? 'var(--black)' : 'var(--grey1)'}`, background: 'var(--off)', opacity: isActive ? 1 : .55, transition: 'all .2s' }}>
                  {g?.url
                    ? <img src={g.url} alt={k} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '10px', height: '10px', border: '1px solid var(--grey1)', borderTop: '1px solid var(--grey3)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    </div>
                  }
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Analysis card ── */}
        {analysis && (
          <div style={{ background: 'linear-gradient(135deg,var(--off) 0%,var(--light) 100%)', border: '1px solid var(--grey1)', padding: mob ? '20px 16px' : '28px 32px', animation: 'fadeUp .6s ease' }}>

            {/* Name + length */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'var(--body)', fontSize: '9px', fontWeight: 500, letterSpacing: '.28em', textTransform: 'uppercase', color: 'var(--grey3)', marginBottom: '6px' }}>Recommended Hairstyle</div>
                <h3 style={{ fontFamily: 'var(--display)', fontSize: mob ? '22px' : 'clamp(20px,2.6vw,30px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--black)', lineHeight: 1 }}>{analysis.hairstyle_name}</h3>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--grey4)', background: 'var(--white)', padding: '5px 10px', border: '1px solid var(--grey1)', letterSpacing: '.07em', flexShrink: 0, alignSelf: 'flex-start', marginTop: mob ? '0' : '4px' }}>{analysis.length}</div>
            </div>

            {/* Description */}
            <p style={{ fontFamily: 'var(--body)', fontSize: mob ? '13px' : '14px', fontWeight: 300, color: 'var(--grey4)', lineHeight: 1.8, marginBottom: '16px' }}>{analysis.description}</p>

            {/* Angle notes */}
            <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr 1fr' : 'repeat(auto-fit,minmax(150px,1fr))', gap: '8px', marginBottom: '16px' }}>
              {[['Front', analysis.front_notes], ['Back', analysis.back_notes], ['Side', analysis.side_notes], ['Top', analysis.top_notes]].map(([label, text]) => text && (
                <div key={label} style={{ background: 'var(--white)', border: '1px solid var(--mist)', padding: '10px 12px' }}>
                  <div style={{ fontFamily: 'var(--body)', fontSize: '8px', fontWeight: 500, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--grey3)', marginBottom: '5px' }}>{label}</div>
                  <div style={{ fontFamily: 'var(--body)', fontSize: '12px', fontWeight: 300, color: 'var(--grey4)', lineHeight: 1.65 }}>{text}</div>
                </div>
              ))}
            </div>

            {/* Styling tip */}
            {analysis.styling_tip && (
              <div style={{ borderTop: '1px solid var(--grey1)', paddingTop: '12px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--grey3)', fontSize: '11px', flexShrink: 0, marginTop: '2px' }}>—</span>
                <div style={{ fontFamily: 'var(--body)', fontSize: '13px', fontWeight: 300, color: 'var(--grey3)', lineHeight: 1.75 }}>{analysis.styling_tip}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,.96)', zIndex: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: mob ? '16px' : '40px', animation: 'fadeIn .2s ease', cursor: 'zoom-out' }}>
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

// ── Image compression ─────────────────────────────────────────────────────────
function compressImage(dataUrl, maxPx = 900, quality = 0.82) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// ── API ───────────────────────────────────────────────────────────────────────
async function post(path, body, timeoutMs = 200_000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(path, { method: 'POST', signal: ctrl.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    clearTimeout(timer);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
    return data;
  } catch (e) { clearTimeout(timer); throw new Error(e.name === 'AbortError' ? 'Request timed out' : e.message); }
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [images, setImages] = useState({ front: null, back: null, side: null, top: null });
  const [phase, setPhase] = useState('idle');
  const [analysis, setAnalysis] = useState(null);
  const [results, setResults] = useState([]);
  const [err, setErr] = useState(null);

  const uploadRef = useRef(null);
  const resultsRef = useRef(null);
  const printRef = useRef(null);
  const savedImgs = useRef(null);

  const scrollTo = ref => ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const handleImage = useCallback((id, val) => setImages(prev => ({ ...prev, [id]: val })), []);

  const run = async () => {
    savedImgs.current = { ...images };
    setPhase('running'); setErr(null); setAnalysis(null); setResults([]);
    const [cf, cb, cs, ct] = await Promise.all([
      compressImage(images.front), compressImage(images.back),
      compressImage(images.side), compressImage(images.top),
    ]);
    const compressed = { front: cf, back: cb, side: cs, top: ct };
    let analysisData;
    try {
      const r = await post('/api/analyze', compressed);
      analysisData = r.analysis;
      setAnalysis(analysisData);
    } catch (e) { setErr(e.message); setPhase('idle'); return; }
    try {
      const r = await post('/api/generate', { ...compressed, analysis: analysisData }, 240_000);
      setResults(r.results || []);
    } catch (e) { console.warn('[App] gen error:', e.message); setResults([]); }
    setPhase('done');
    setTimeout(() => scrollTo(resultsRef), 400);
  };

  const reset = () => {
    setImages({ front: null, back: null, side: null, top: null });
    setPhase('idle'); setAnalysis(null); setResults([]); setErr(null);
    setTimeout(() => scrollTo(uploadRef), 200);
  };

  const downloadReport = () => {
    if (printRef.current) {
      printRef.current.style.display = 'block';
      window.print();
      setTimeout(() => { if (printRef.current) printRef.current.style.display = 'none'; }, 1000);
    }
  };

  return (
    <>
      <Styles />
      <Cursor />
      <Nav onDownload={downloadReport} showDownload={phase === 'done'} />
      <Ticker />
      <Hero onBegin={() => scrollTo(uploadRef)} />
      <div className="divider no-print" style={{ margin: '0 16px' }} />

      {phase !== 'done' && <Upload images={images} onImage={handleImage} uploadRef={uploadRef} onRun={run} running={phase === 'running'} />}
      {phase === 'running' && <Scanner images={images} />}
      {err && <ErrorBanner msg={err} onRetry={run} onDismiss={() => setErr(null)} />}
      {phase === 'done' && <Results analysis={analysis} results={results} inputImages={savedImgs.current} onReset={reset} resultsRef={resultsRef} />}

      <div ref={printRef} style={{ display: 'none' }}>
        <PrintReport analysis={analysis} results={results} inputImages={savedImgs.current} />
      </div>

      <footer className="no-print" style={{ borderTop: '1px solid var(--mist)', padding: '28px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'var(--off)' }}>
        <div style={{ fontFamily: 'var(--display)', fontSize: '13px', fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--black)' }}>American Hairline</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--grey2)' }}>Nano Banana · {new Date().getFullYear()}</div>
        <div style={{ fontFamily: 'var(--body)', fontSize: '10px', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--grey2)' }}>For Consultation Purposes Only</div>
      </footer>
    </>
  );
}