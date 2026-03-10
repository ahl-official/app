import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   AMERICAN HAIRLINE  ·  Light Edition
   White/grey minimal  ·  Barlow Condensed  ·  Camera + PDF report
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

    /* ── PDF print styles ── */
    @media print {
      body { cursor:auto !important; background:white !important; }
      #c-dot, #c-ring, nav, .no-print { display:none !important; }
      .print-only { display:block !important; }
      @page { size: A4 portrait; margin: 18mm 16mm; }
    }
    .print-only { display:none; }
  `}</style>
);

// ── Cursor ────────────────────────────────────────────────────────────────────
function Cursor() {
  const dot = useRef(null), ring = useRef(null);
  useEffect(() => {
    let rx=0,ry=0,raf;
    const lerp=(a,b,t)=>a+(b-a)*t;
    const move = e => {
      if(dot.current){dot.current.style.left=e.clientX+'px';dot.current.style.top=e.clientY+'px';}
      cancelAnimationFrame(raf);
      const step=()=>{
        rx=lerp(rx,e.clientX,.14);ry=lerp(ry,e.clientY,.14);
        if(ring.current){ring.current.style.left=rx+'px';ring.current.style.top=ry+'px';}
        if(Math.abs(rx-e.clientX)>.5||Math.abs(ry-e.clientY)>.5)raf=requestAnimationFrame(step);
      };
      raf=requestAnimationFrame(step);
    };
    window.addEventListener('mousemove',move);
    return()=>{window.removeEventListener('mousemove',move);cancelAnimationFrame(raf);};
  },[]);
  return <><div id="c-dot" ref={dot}/><div id="c-ring" ref={ring}/></>;
}

function useReveal() {
  const ref=useRef(null);
  useEffect(()=>{
    const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting)e.target.classList.add('in')},{threshold:.05});
    if(ref.current)obs.observe(ref.current);
    return()=>obs.disconnect();
  },[]);
  return ref;
}

// ── Nav ───────────────────────────────────────────────────────────────────────
const Nav = ({ onDownload, showDownload }) => (
  <nav className="no-print" style={{ position:'fixed',top:0,left:0,right:0,zIndex:500,display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0 48px',height:'52px',background:'rgba(255,255,255,.93)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--mist)' }}>
    <div style={{ display:'flex',alignItems:'center',gap:'12px' }}>
      <div style={{ width:'20px',height:'20px',background:'var(--black)',display:'flex',alignItems:'center',justifyContent:'center' }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4L5 6L2 8M10 4L7 6L10 8" stroke="white" strokeWidth="1.2" strokeLinecap="round"/></svg>
      </div>
      <div style={{ fontFamily:'var(--display)',fontSize:'13px',fontWeight:700,letterSpacing:'.18em',color:'var(--black)',textTransform:'uppercase' }}>American Hairline</div>
    </div>
    <div style={{ display:'flex',gap:'24px',alignItems:'center' }}>
      {['Upload','Results'].map(l=>(
        <a key={l} href={`#${l.toLowerCase()}`}
          style={{ fontFamily:'var(--body)',fontSize:'12px',fontWeight:400,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--grey3)',textDecoration:'none',transition:'color .15s' }}
          onMouseEnter={e=>e.target.style.color='var(--black)'}
          onMouseLeave={e=>e.target.style.color='var(--grey3)'}
        >{l}</a>
      ))}
      {showDownload && (
        <button onClick={onDownload}
          style={{ fontFamily:'var(--display)',fontSize:'11px',fontWeight:600,letterSpacing:'.18em',textTransform:'uppercase',color:'var(--white)',background:'var(--black)',padding:'8px 20px',transition:'background .2s',display:'flex',alignItems:'center',gap:'7px' }}
          onMouseEnter={e=>e.currentTarget.style.background='var(--grey4)'}
          onMouseLeave={e=>e.currentTarget.style.background='var(--black)'}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download Report
        </button>
      )}
    </div>
  </nav>
);

// ── Ticker ────────────────────────────────────────────────────────────────────
const Ticker = () => {
  const t='4-ANGLE ANALYSIS  ·  FRONT  ·  BACK  ·  SIDE  ·  TOP  ·  HAIRLINE COVERAGE GUARANTEED  ·  AMERICAN HAIRLINE  ·  ';
  return (
    <div className="no-print" style={{ overflow:'hidden',background:'var(--black)',padding:'9px 0',zIndex:10,position:'relative' }}>
      <div style={{ display:'flex',width:'max-content',animation:'ticker 30s linear infinite' }}>
        {[0,1,2,3].map(i=><span key={i} style={{ fontFamily:'var(--body)',fontSize:'10px',fontWeight:400,letterSpacing:'.28em',textTransform:'uppercase',color:'rgba(255,255,255,.5)',whiteSpace:'nowrap',padding:'0 40px' }}>{t}</span>)}
      </div>
    </div>
  );
};

// ── Hero ──────────────────────────────────────────────────────────────────────
const Hero = ({ onBegin }) => {
  const r1=useReveal(),r2=useReveal(),r3=useReveal();
  return (
    <section className="no-print" style={{ minHeight:'100vh',display:'flex',flexDirection:'column',justifyContent:'flex-end',padding:'0 48px 88px',position:'relative',overflow:'hidden',background:'linear-gradient(160deg,var(--white) 0%,var(--light) 55%,var(--mist) 100%)' }}>
      <div style={{ position:'absolute',inset:0,pointerEvents:'none',backgroundImage:'linear-gradient(var(--grey1) 1px,transparent 1px),linear-gradient(90deg,var(--grey1) 1px,transparent 1px)',backgroundSize:'80px 80px',opacity:.2 }}/>
      <div style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',fontFamily:'var(--display)',fontSize:'clamp(200px,32vw,460px)',fontWeight:700,color:'rgba(17,17,16,.04)',lineHeight:1,pointerEvents:'none',userSelect:'none',letterSpacing:'-.03em',whiteSpace:'nowrap',textTransform:'uppercase' }}>AH</div>
      <div style={{ position:'absolute',top:0,left:'48px',width:'1px',height:'100%',background:'linear-gradient(to bottom,transparent,var(--grey1) 30%,var(--grey1) 70%,transparent)',opacity:.6 }}/>
      <div style={{ position:'absolute',top:'80px',right:'48px',textAlign:'right',fontFamily:'var(--mono)',fontSize:'10px',color:'var(--grey2)',lineHeight:2.2 }}>
        <div>40.7128° N</div><div>74.0060° W</div><div style={{ color:'var(--grey3)',marginTop:'4px' }}>SYS.ONLINE</div>
      </div>
      <div style={{ maxWidth:'960px',position:'relative',zIndex:1 }}>
        <div ref={r1} className="rv" style={{ transitionDelay:'.08s',marginBottom:'24px' }}>
          <div style={{ display:'flex',alignItems:'center',gap:'12px',fontFamily:'var(--body)',fontSize:'11px',fontWeight:400,letterSpacing:'.3em',textTransform:'uppercase',color:'var(--grey3)' }}>
            <div style={{ width:'36px',height:'1px',background:'var(--grey2)' }}/>4-Angle AI Hair Consultation
          </div>
        </div>
        <div ref={r2} className="rv" style={{ transitionDelay:'.18s' }}>
          <h1 style={{ fontFamily:'var(--display)',fontSize:'clamp(64px,11vw,148px)',fontWeight:700,lineHeight:.9,letterSpacing:'-.01em',textTransform:'uppercase',color:'var(--black)' }}>
            <span style={{ display:'block' }}>American</span>
            <span style={{ display:'block',color:'transparent',WebkitTextStroke:'1.5px var(--grey2)',marginTop:'-.02em' }}>Hairline</span>
          </h1>
        </div>
        <div ref={r3} className="rv" style={{ transitionDelay:'.32s',marginTop:'44px',display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:'28px' }}>
          <p style={{ fontFamily:'var(--body)',fontSize:'clamp(15px,1.3vw,18px)',color:'var(--grey3)',maxWidth:'420px',lineHeight:1.8,fontWeight:300 }}>
            Upload four photos of your head — front, back, side, and top. Our AI reads all four angles and generates a hairstyle that fits your exact geometry, with full hairline coverage.
          </p>
          <button onClick={onBegin}
            style={{ fontFamily:'var(--display)',fontSize:'13px',fontWeight:600,letterSpacing:'.2em',textTransform:'uppercase',color:'var(--white)',background:'var(--black)',padding:'15px 48px',transition:'all .25s',flexShrink:0 }}
            onMouseEnter={e=>{e.currentTarget.style.background='var(--grey4)';e.currentTarget.style.transform='translateY(-2px)';}}
            onMouseLeave={e=>{e.currentTarget.style.background='var(--black)';e.currentTarget.style.transform='none';}}
          >Begin Analysis</button>
        </div>
      </div>
      <div style={{ position:'absolute',bottom:'88px',right:'48px',display:'flex',gap:'44px',zIndex:1 }}>
        {[['4','Angles'],['1','Style'],['100%','Coverage']].map(([n,l])=>(
          <div key={n} style={{ textAlign:'right' }}>
            <div style={{ fontFamily:'var(--display)',fontSize:'28px',fontWeight:700,color:'var(--black)',letterSpacing:'-.01em' }}>{n}</div>
            <div style={{ fontFamily:'var(--body)',fontSize:'10px',fontWeight:400,letterSpacing:'.2em',textTransform:'uppercase',color:'var(--grey2)',marginTop:'2px' }}>{l}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

// ── Guided 4-angle camera flow ────────────────────────────────────────────────
const ANGLE_SEQUENCE = [
  { id:'front', label:'Front Face',   instruction:'Look straight at the camera. Keep your head level.' },
  { id:'back',  label:'Back of Head', instruction:'Turn fully away from the camera. Keep your neck straight.' },
  { id:'side',  label:'Side Profile', instruction:'Turn 90° to your left. Keep your chin level.' },
  { id:'top',   label:'Top / Crown',  instruction:'Hold the camera directly above your head, pointing down.' },
];

function CameraFlow({ onCaptures, onClose }) {
  const [step, setStep]       = useState(0);
  const [captured, setCaptured] = useState({});
  const [stream, setStream]   = useState(null);
  const [camErr, setCamErr]   = useState(null);
  const vidRef = useRef(null);

  useEffect(() => {
    let s;
    navigator.mediaDevices.getUserMedia({ video:{ facingMode:'user', width:{ideal:1280}, height:{ideal:960} } })
      .then(st => {
        s = st; setStream(st);
        if (vidRef.current) vidRef.current.srcObject = st;
      })
      .catch(() => setCamErr('Camera permission denied. Please allow camera access and try again.'));
    return () => s?.getTracks().forEach(t => t.stop());
  }, []);

  const capture = () => {
    if (!vidRef.current) return;
    const c = document.createElement('canvas');
    c.width = vidRef.current.videoWidth;
    c.height = vidRef.current.videoHeight;
    const ctx = c.getContext('2d');
    ctx.translate(c.width, 0); ctx.scale(-1, 1);
    ctx.drawImage(vidRef.current, 0, 0);
    const url = c.toDataURL('image/jpeg', .95);
    const angleId = ANGLE_SEQUENCE[step].id;
    const next = { ...captured, [angleId]: url };
    setCaptured(next);
    if (step < ANGLE_SEQUENCE.length - 1) {
      setStep(s => s + 1);
    } else {
      // all 4 done — hand back and close
      onCaptures(next);
    }
  };

  const current = ANGLE_SEQUENCE[step];
  const done = Object.keys(captured).length;

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(17,17,16,.92)',zIndex:950,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',animation:'fadeIn .2s ease' }}>
      <div style={{ background:'var(--white)',width:'100%',maxWidth:'520px',display:'flex',flexDirection:'column' }}>

        {/* header */}
        <div style={{ padding:'18px 24px',borderBottom:'1px solid var(--mist)',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <div>
            <div style={{ fontFamily:'var(--display)',fontSize:'16px',fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'var(--black)' }}>
              Capture {current.label}
            </div>
            <div style={{ fontFamily:'var(--mono)',fontSize:'10px',color:'var(--grey3)',marginTop:'3px' }}>
              Step {step+1} of 4
            </div>
          </div>
          <button onClick={onClose}
            style={{ fontFamily:'var(--body)',fontSize:'22px',lineHeight:1,color:'var(--grey3)',transition:'color .15s' }}
            onMouseEnter={e=>e.currentTarget.style.color='var(--black)'}
            onMouseLeave={e=>e.currentTarget.style.color='var(--grey3)'}
          >×</button>
        </div>

        {/* step dots */}
        <div style={{ display:'flex',gap:'6px',padding:'14px 24px 0' }}>
          {ANGLE_SEQUENCE.map((a,i) => (
            <div key={a.id} style={{ flex:1,height:'3px',background: i < done ? 'var(--black)' : i === step ? 'var(--grey3)' : 'var(--mist)',transition:'background .3s' }}/>
          ))}
        </div>

        {camErr ? (
          <div style={{ padding:'32px 24px',fontFamily:'var(--mono)',fontSize:'12px',color:'#b84040',background:'#fdf5f5',margin:'16px 24px',border:'1px solid #e5b4b4' }}>{camErr}</div>
        ) : (
          <>
            {/* live viewfinder */}
            <div style={{ position:'relative',background:'#000',aspectRatio:'4/3',overflow:'hidden',margin:'14px 24px 0' }}>
              <video ref={vidRef} autoPlay playsInline muted
                style={{ width:'100%',height:'100%',objectFit:'cover',transform:'scaleX(-1)',display:'block' }}/>
              {/* crosshair overlay */}
              <div style={{ position:'absolute',inset:0,pointerEvents:'none',display:'flex',alignItems:'center',justifyContent:'center' }}>
                <div style={{ width:'60px',height:'60px',position:'relative',opacity:.4 }}>
                  <div style={{ position:'absolute',top:'50%',left:0,right:0,height:'1px',background:'white' }}/>
                  <div style={{ position:'absolute',left:'50%',top:0,bottom:0,width:'1px',background:'white' }}/>
                </div>
              </div>
              {/* angle label overlay */}
              <div style={{ position:'absolute',top:'10px',left:'10px',fontFamily:'var(--mono)',fontSize:'10px',letterSpacing:'.15em',color:'rgba(255,255,255,.6)',background:'rgba(0,0,0,.4)',padding:'4px 8px' }}>
                {current.label.toUpperCase()}
              </div>
            </div>

            {/* instruction */}
            <div style={{ padding:'14px 24px 0',fontFamily:'var(--body)',fontSize:'13px',fontWeight:300,color:'var(--grey3)',lineHeight:1.6 }}>
              {current.instruction}
            </div>

            {/* thumbnail strip of captured */}
            {done > 0 && (
              <div style={{ display:'flex',gap:'6px',padding:'12px 24px 0' }}>
                {ANGLE_SEQUENCE.slice(0, done).map(a => (
                  <div key={a.id} style={{ flex:1,aspectRatio:'3/4',overflow:'hidden',border:'1px solid var(--grey1)',position:'relative' }}>
                    <img src={captured[a.id]} alt={a.id} style={{ width:'100%',height:'100%',objectFit:'cover',display:'block' }}/>
                    <div style={{ position:'absolute',inset:0,background:'rgba(0,0,0,.2)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                      <span style={{ color:'white',fontSize:'14px' }}>✓</span>
                    </div>
                  </div>
                ))}
                {ANGLE_SEQUENCE.slice(done).map(a => (
                  <div key={a.id} style={{ flex:1,aspectRatio:'3/4',border:'1px dashed var(--grey1)',background:'var(--off)' }}/>
                ))}
              </div>
            )}

            {/* capture button */}
            <div style={{ padding:'16px 24px 24px' }}>
              <button onClick={capture}
                style={{ width:'100%',fontFamily:'var(--display)',fontSize:'14px',fontWeight:700,letterSpacing:'.2em',textTransform:'uppercase',color:'var(--white)',background:'var(--black)',padding:'16px',transition:'background .2s' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--grey4)'}
                onMouseLeave={e=>e.currentTarget.style.background='var(--black)'}
              >
                {step < 3 ? `Capture ${current.label} →` : 'Capture & Finish'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Angle slot (drag & drop only, camera handled at section level) ─────────────
const ANGLE_META = {
  front: { label:'Front Face',   hint:'Face the camera directly',  num:'01' },
  back:  { label:'Back of Head', hint:'Turn fully away',           num:'02' },
  side:  { label:'Side Profile', hint:'Turn 90° to one side',      num:'03' },
  top:   { label:'Top / Crown',  hint:'Camera above, looking down',num:'04' },
};

function AngleSlot({ id, image, onImage }) {
  const meta = ANGLE_META[id];
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const loadFile = useCallback(file => {
    if (!file?.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => onImage(id, e.target.result);
    reader.readAsDataURL(file);
  }, [id, onImage]);

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:'8px' }}>
      <div style={{ display:'flex',alignItems:'baseline',gap:'6px' }}>
        <span style={{ fontFamily:'var(--mono)',fontSize:'9px',color:'var(--grey2)' }}>{meta.num}</span>
        <span style={{ fontFamily:'var(--body)',fontSize:'10px',fontWeight:500,letterSpacing:'.2em',textTransform:'uppercase',color:'var(--grey4)' }}>{meta.label}</span>
      </div>

      {!image ? (
        <>
          <div
            onDragOver={e=>{e.preventDefault();setDrag(true);}}
            onDragLeave={()=>setDrag(false)}
            onDrop={e=>{e.preventDefault();setDrag(false);loadFile(e.dataTransfer.files[0]);}}
            onClick={()=>inputRef.current.click()}
            style={{ aspectRatio:'3/4',border:`1px dashed ${drag?'var(--grey4)':'var(--grey1)'}`,background:drag?'var(--mist)':'var(--off)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'10px',transition:'all .2s' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--grey3)';e.currentTarget.style.background='var(--light)';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=drag?'var(--grey4)':'var(--grey1)';e.currentTarget.style.background=drag?'var(--mist)':'var(--off)';}}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--grey2)" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span style={{ fontFamily:'var(--body)',fontSize:'9px',fontWeight:400,letterSpacing:'.15em',textTransform:'uppercase',color:'var(--grey2)' }}>Drop or click</span>
          </div>
          <div style={{ fontFamily:'var(--mono)',fontSize:'9px',color:'var(--grey2)',letterSpacing:'.05em' }}>{meta.hint}</div>
        </>
      ) : (
        <div style={{ position:'relative',aspectRatio:'3/4',overflow:'hidden',border:'1px solid var(--grey1)' }}>
          <img src={image} alt={meta.label} style={{ width:'100%',height:'100%',objectFit:'cover',display:'block' }}/>
          <div style={{ position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,.28) 0%,transparent 40%)',pointerEvents:'none' }}/>
          <div style={{ position:'absolute',bottom:'8px',left:'8px',right:'8px',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
            <span style={{ fontFamily:'var(--mono)',fontSize:'9px',color:'rgba(255,255,255,.7)' }}>✓</span>
            <button onClick={()=>onImage(id,null)}
              style={{ fontFamily:'var(--body)',fontSize:'9px',letterSpacing:'.15em',textTransform:'uppercase',color:'rgba(255,255,255,.6)',background:'rgba(0,0,0,.4)',padding:'3px 8px',transition:'color .15s' }}
              onMouseEnter={e=>e.currentTarget.style.color='white'}
              onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,.6)'}
            >Replace</button>
          </div>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={e=>{if(e.target.files[0])loadFile(e.target.files[0]);}}/>
    </div>
  );
}

// ── Upload ────────────────────────────────────────────────────────────────────
const Upload = ({ images, onImage, uploadRef, onRun, running }) => {
  const [camFlowOpen, setCamFlowOpen] = useState(false);
  const keys = ['front','back','side','top'];
  const filled = keys.filter(k=>images[k]).length;
  const allFilled = filled===4;

  const handleCaptures = useCallback(captured => {
    Object.entries(captured).forEach(([id, url]) => onImage(id, url));
    setCamFlowOpen(false);
  }, [onImage]);

  return (
    <section id="upload" ref={uploadRef} className="no-print" style={{ padding:'100px 48px 80px',maxWidth:'1100px',margin:'0 auto',background:'var(--white)' }}>
      <div>

        {/* Section header row */}
        <div style={{ display:'flex',alignItems:'center',gap:'16px',marginBottom:'10px',flexWrap:'wrap' }}>
          <span style={{ fontFamily:'var(--mono)',fontSize:'10px',color:'var(--grey2)' }}>01</span>
          <div className="divider" style={{ flex:1,minWidth:'20px' }}/>
          <h2 style={{ fontFamily:'var(--display)',fontSize:'clamp(22px,2.8vw,38px)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',color:'var(--black)' }}>Upload 4 Angles</h2>
        </div>

        <p style={{ fontFamily:'var(--body)',fontSize:'14px',fontWeight:300,color:'var(--grey3)',lineHeight:1.75,marginBottom:'28px',maxWidth:'520px' }}>
          All four views required — front, back, side, and top. Same person, same session.
        </p>

        {/* Camera CTA */}
        <button
          onClick={()=>setCamFlowOpen(true)}
          style={{ display:'inline-flex',alignItems:'center',gap:'10px',fontFamily:'var(--display)',fontSize:'13px',fontWeight:600,letterSpacing:'.18em',textTransform:'uppercase',color:'var(--white)',background:'var(--black)',padding:'14px 28px',marginBottom:'40px',transition:'background .2s',border:'none' }}
          onMouseEnter={e=>e.currentTarget.style.background='var(--grey4)'}
          onMouseLeave={e=>e.currentTarget.style.background='var(--black)'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
          </svg>
          Capture 4 Photos with Camera
        </button>

        <div style={{ display:'flex',alignItems:'center',gap:'12px',marginBottom:'28px' }}>
          <div className="divider" style={{ flex:1 }}/>
          <span style={{ fontFamily:'var(--body)',fontSize:'10px',fontWeight:400,letterSpacing:'.2em',textTransform:'uppercase',color:'var(--grey2)',whiteSpace:'nowrap' }}>or upload individually</span>
          <div className="divider" style={{ flex:1 }}/>
        </div>

        {/* Drag & drop slots */}
        <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px',marginBottom:'32px' }}>
          {keys.map(id=><AngleSlot key={id} id={id} image={images[id]} onImage={onImage}/>)}
        </div>

        {/* progress bar */}
        <div style={{ height:'2px',background:'var(--mist)',marginBottom:'20px',position:'relative',overflow:'hidden' }}>
          <div style={{ position:'absolute',left:0,top:0,bottom:0,width:`${filled/4*100}%`,background:'var(--black)',transition:'width .4s cubic-bezier(.16,1,.3,1)' }}/>
        </div>

        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'16px' }}>
          <div style={{ fontFamily:'var(--mono)',fontSize:'11px',color:'var(--grey3)' }}>
            {allFilled ? 'All angles loaded — ready to analyse' : `${4-filled} photo${4-filled!==1?'s':''} remaining`}
          </div>
          <button onClick={onRun} disabled={!allFilled||running}
            style={{ fontFamily:'var(--display)',fontSize:'12px',fontWeight:600,letterSpacing:'.2em',textTransform:'uppercase',padding:'14px 52px',transition:'all .25s',color:allFilled&&!running?'var(--white)':'var(--grey2)',background:allFilled&&!running?'var(--black)':'var(--mist)' }}
            onMouseEnter={e=>{if(allFilled&&!running){e.currentTarget.style.background='var(--grey4)';e.currentTarget.style.transform='translateY(-1px)';}}}
            onMouseLeave={e=>{e.currentTarget.style.background=allFilled&&!running?'var(--black)':'var(--mist)';e.currentTarget.style.transform='none';}}
          >{running?'Analysing…':'Analyse & Generate'}</button>
        </div>
      </div>

      {camFlowOpen && <CameraFlow onCaptures={handleCaptures} onClose={()=>setCamFlowOpen(false)}/>}
    </section>
  );
};

// ── Scanner ───────────────────────────────────────────────────────────────────
const Scanner = ({ images }) => {
  const LOG=['LOADING FACIAL MESH ENGINE','MAPPING FRONT GEOMETRY','ANALYSING BACK CONTOUR','MEASURING SIDE PROFILE','READING CROWN TOPOLOGY','COMPUTING HEAD SHAPE INDEX','HAIRLINE COVERAGE ALGORITHM','SELECTING OPTIMAL HAIRSTYLE','HAIRLINE COVERAGE: CONFIRMED','RENDERING FRONT VIEW','RENDERING BACK VIEW','RENDERING SIDE VIEW','RENDERING TOP VIEW','FINALISING OUTPUT'];
  const [idx,setIdx]=useState(0);
  useEffect(()=>{const t=setInterval(()=>setIdx(i=>(i+1)%LOG.length),700);return()=>clearInterval(t);},[]);
  return (
    <div className="no-print" style={{ padding:'60px 48px 80px',maxWidth:'900px',margin:'0 auto',textAlign:'center',animation:'fadeIn .5s ease',background:'var(--white)' }}>
      <div style={{ fontFamily:'var(--body)',fontSize:'11px',fontWeight:400,letterSpacing:'.28em',textTransform:'uppercase',color:'var(--grey3)',marginBottom:'40px' }}>Neural Processing · 4-Angle Analysis</div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px',marginBottom:'32px' }}>
        {['front','back','side','top'].map((k,i)=>(
          <div key={k} style={{ position:'relative',aspectRatio:'3/4',overflow:'hidden',border:'1px solid var(--mist)',background:'var(--light)' }}>
            {images[k]&&<img src={images[k]} alt={k} style={{ width:'100%',height:'100%',objectFit:'cover',filter:'grayscale(1) brightness(.95) contrast(1.05)',display:'block' }}/>}
            <div style={{ position:'absolute',left:0,right:0,height:'1px',background:'linear-gradient(90deg,transparent,rgba(17,17,16,.6),transparent)',animation:`scan 2s ease-in-out infinite`,animationDelay:`${i*.3}s` }}/>
            <div style={{ position:'absolute',bottom:'4px',left:0,right:0,textAlign:'center',fontFamily:'var(--mono)',fontSize:'8px',color:'var(--grey3)',letterSpacing:'.15em' }}>{k.toUpperCase()}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'var(--off)',border:'1px solid var(--mist)',padding:'14px 20px',maxWidth:'420px',margin:'0 auto',textAlign:'left' }}>
        <div style={{ fontFamily:'var(--mono)',fontSize:'11px',color:'var(--grey4)',letterSpacing:'.04em',minHeight:'18px' }}>
          <span style={{ color:'var(--grey2)' }}>$ </span>{LOG[idx]}<span style={{ animation:'blink .8s infinite',marginLeft:'2px' }}>_</span>
        </div>
      </div>
    </div>
  );
};

// ── Error ─────────────────────────────────────────────────────────────────────
const ErrorBanner = ({ msg, onRetry, onDismiss }) => (
  <div className="no-print" style={{ maxWidth:'960px',margin:'0 auto',padding:'0 48px 32px',animation:'fadeUp .3s ease' }}>
    <div style={{ padding:'18px 22px',border:'1px solid #e5b4b4',background:'#fdf5f5',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'16px' }}>
      <div>
        <div style={{ fontFamily:'var(--body)',fontSize:'10px',fontWeight:500,letterSpacing:'.2em',textTransform:'uppercase',color:'#b84040',marginBottom:'6px' }}>Error</div>
        <div style={{ fontFamily:'var(--mono)',fontSize:'12px',color:'#b84040',lineHeight:1.6,whiteSpace:'pre-wrap',wordBreak:'break-word' }}>{msg}</div>
      </div>
      <div style={{ display:'flex',gap:'8px',flexShrink:0 }}>
        <button onClick={onRetry} style={{ fontFamily:'var(--body)',fontSize:'10px',fontWeight:500,letterSpacing:'.15em',textTransform:'uppercase',color:'white',background:'#b84040',padding:'8px 16px',transition:'background .2s' }}
          onMouseEnter={e=>e.currentTarget.style.background='#963030'}
          onMouseLeave={e=>e.currentTarget.style.background='#b84040'}>Retry</button>
        <button onClick={onDismiss} style={{ fontFamily:'var(--body)',fontSize:'10px',color:'var(--grey3)',padding:'8px',transition:'color .15s' }}
          onMouseEnter={e=>e.currentTarget.style.color='var(--black)'}
          onMouseLeave={e=>e.currentTarget.style.color='var(--grey3)'}>✕</button>
      </div>
    </div>
  </div>
);

// ── PDF print layout (hidden on screen, shown on print) ───────────────────────
const PrintReport = ({ analysis, results, inputImages, printRef }) => {
  if (!analysis) return null;
  const LABEL = { front:'Front', back:'Back', side:'Side', top:'Top' };
  return (
    <div ref={printRef} className="print-only" style={{ fontFamily:'var(--body)',color:'#111',background:'white',padding:'0' }}>
      {/* Header */}
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-end',borderBottom:'2px solid #111',paddingBottom:'12px',marginBottom:'20px' }}>
        <div>
          <div style={{ fontFamily:'var(--display)',fontSize:'32px',fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase',lineHeight:1 }}>American Hairline</div>
          <div style={{ fontSize:'11px',color:'#666',letterSpacing:'.2em',textTransform:'uppercase',marginTop:'4px' }}>AI Hair Consultation Report</div>
        </div>
        <div style={{ textAlign:'right',fontSize:'10px',color:'#999',fontFamily:'var(--mono)' }}>
          <div>{new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'})}</div>
          <div style={{ marginTop:'2px' }}>For Consultation Purposes Only</div>
        </div>
      </div>

      {/* Hairstyle recommendation */}
      <div style={{ background:'#f8f8f7',border:'1px solid #ddd',padding:'16px 20px',marginBottom:'20px' }}>
        <div style={{ fontSize:'9px',fontWeight:500,letterSpacing:'.3em',textTransform:'uppercase',color:'#888',marginBottom:'6px' }}>Recommended Hairstyle</div>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'16px',marginBottom:'10px' }}>
          <div style={{ fontFamily:'var(--display)',fontSize:'26px',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em' }}>{analysis.hairstyle_name}</div>
          <div style={{ fontSize:'10px',color:'#555',border:'1px solid #ccc',padding:'4px 10px',whiteSpace:'nowrap',letterSpacing:'.08em',fontFamily:'var(--mono)' }}>{analysis.length}</div>
        </div>
        <p style={{ fontSize:'13px',color:'#444',lineHeight:1.7,marginBottom:'14px' }}>{analysis.description}</p>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px' }}>
          {[['Front',analysis.front_notes],['Back',analysis.back_notes],['Side',analysis.side_notes],['Top',analysis.top_notes]].map(([l,t])=>t&&(
            <div key={l} style={{ background:'white',border:'1px solid #e8e8e5',padding:'10px 12px' }}>
              <div style={{ fontSize:'8px',fontWeight:500,letterSpacing:'.28em',textTransform:'uppercase',color:'#888',marginBottom:'5px' }}>{l}</div>
              <div style={{ fontSize:'11px',color:'#555',lineHeight:1.6 }}>{t}</div>
            </div>
          ))}
        </div>
        {analysis.styling_tip&&(
          <div style={{ borderTop:'1px solid #ddd',paddingTop:'10px',marginTop:'12px',fontSize:'12px',color:'#666',lineHeight:1.7 }}>
            <span style={{ fontWeight:500,color:'#444' }}>Styling tip: </span>{analysis.styling_tip}
          </div>
        )}
      </div>

      {/* Before / After grid */}
      <div style={{ fontSize:'9px',fontWeight:500,letterSpacing:'.28em',textTransform:'uppercase',color:'#888',marginBottom:'10px' }}>Before → After · 4 Angles</div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px',marginBottom:'16px' }}>
        {['front','back','side','top'].map(key=>{
          const gen=results?.find(r=>r.id===key);
          return(
            <div key={key}>
              <div style={{ fontSize:'8px',color:'#aaa',letterSpacing:'.15em',textAlign:'center',marginBottom:'4px' }}>ORIGINAL</div>
              <div style={{ aspectRatio:'3/4',overflow:'hidden',border:'1px solid #e8e8e5',background:'#f2f2f0',marginBottom:'4px' }}>
                {inputImages?.[key]&&<img src={inputImages[key]} alt="" style={{ width:'100%',height:'100%',objectFit:'cover',display:'block' }}/>}
              </div>
              <div style={{ fontSize:'8px',color:'#555',letterSpacing:'.15em',textAlign:'center',marginBottom:'4px' }}>GENERATED</div>
              <div style={{ aspectRatio:'3/4',overflow:'hidden',border:'1px solid #ddd',background:'#f8f8f7' }}>
                {gen?.url&&<img src={gen.url} alt="" style={{ width:'100%',height:'100%',objectFit:'cover',display:'block' }}/>}
              </div>
              <div style={{ fontSize:'9px',fontWeight:500,letterSpacing:'.15em',textTransform:'uppercase',color:'#666',textAlign:'center',marginTop:'4px' }}>{LABEL[key]}</div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ borderTop:'1px solid #ddd',paddingTop:'10px',display:'flex',justifyContent:'space-between',fontSize:'9px',color:'#aaa',fontFamily:'var(--mono)' }}>
        <span>American Hairline · AI Hair Consultation System</span>
        <span>Nano Banana · {new Date().getFullYear()}</span>
      </div>
    </div>
  );
};

// ── Results ───────────────────────────────────────────────────────────────────
const Results = ({ analysis, results, inputImages, onReset, resultsRef }) => {
  const r = useReveal();
  const [lightbox, setLightbox] = useState(null);
  const LABEL = { front:'Front View', back:'Back View', side:'Side View', top:'Top / Crown' };

  return (
    <section id="results" ref={resultsRef} style={{ padding:'80px 48px 100px',maxWidth:'1200px',margin:'0 auto',background:'var(--white)' }}>
      <div ref={r} className="rv">
        <div style={{ display:'flex',alignItems:'center',gap:'16px',marginBottom:'14px',flexWrap:'wrap' }}>
          <span style={{ fontFamily:'var(--mono)',fontSize:'10px',color:'var(--grey2)' }}>02</span>
          <div className="divider" style={{ flex:1,minWidth:'40px' }}/>
          <h2 style={{ fontFamily:'var(--display)',fontSize:'clamp(24px,3vw,40px)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',color:'var(--black)' }}>Your Result</h2>
          <button onClick={onReset}
            style={{ fontFamily:'var(--body)',fontSize:'11px',fontWeight:400,letterSpacing:'.18em',textTransform:'uppercase',color:'var(--grey3)',marginLeft:'auto',transition:'color .15s' }}
            onMouseEnter={e=>e.currentTarget.style.color='var(--black)'}
            onMouseLeave={e=>e.currentTarget.style.color='var(--grey3)'}
          >← New Session</button>
        </div>

        {/* Before/After grid */}
        <div style={{ fontFamily:'var(--body)',fontSize:'10px',fontWeight:400,letterSpacing:'.22em',textTransform:'uppercase',color:'var(--grey2)',marginBottom:'16px' }}>Before → After · 4 Angles</div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'14px',marginBottom:'56px' }}>
          {['front','back','side','top'].map(key=>{
            const gen=results?.find(g=>g.id===key);
            return(
              <div key={key} style={{ display:'flex',flexDirection:'column',gap:'6px' }}>
                <div style={{ fontFamily:'var(--mono)',fontSize:'8px',color:'var(--grey2)',letterSpacing:'.15em',textAlign:'center' }}>ORIGINAL</div>
                <div style={{ aspectRatio:'3/4',overflow:'hidden',border:'1px solid var(--mist)',background:'var(--light)' }}>
                  {inputImages?.[key]&&<img src={inputImages[key]} alt={`orig-${key}`} style={{ width:'100%',height:'100%',objectFit:'cover',display:'block' }}/>}
                </div>
                <div style={{ fontFamily:'var(--mono)',fontSize:'8px',color:'var(--grey4)',letterSpacing:'.15em',textAlign:'center' }}>GENERATED</div>
                <div
                  onClick={()=>gen?.url&&setLightbox(gen)}
                  style={{ aspectRatio:'3/4',overflow:'hidden',border:`1px solid ${gen?.url?'var(--grey2)':'var(--mist)'}`,background:'var(--off)',cursor:gen?.url?'none':'default',transition:'border-color .25s',position:'relative' }}
                  onMouseEnter={e=>{if(gen?.url)e.currentTarget.style.borderColor='var(--black)';}}
                  onMouseLeave={e=>{if(gen?.url)e.currentTarget.style.borderColor='var(--grey2)';}}
                >
                  {gen?.url?(
                    <>
                      <img src={gen.url} alt={`gen-${key}`} style={{ width:'100%',height:'100%',objectFit:'cover',display:'block',transition:'transform .35s' }}
                        onMouseEnter={e=>e.target.style.transform='scale(1.03)'}
                        onMouseLeave={e=>e.target.style.transform='none'}/>
                      <div style={{ position:'absolute',bottom:'5px',right:'5px',fontFamily:'var(--mono)',fontSize:'8px',color:'rgba(0,0,0,.3)',background:'rgba(255,255,255,.7)',padding:'2px 5px' }}>↗</div>
                    </>
                  ):gen?.error?(
                    <div style={{ width:'100%',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'12px',gap:'6px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(180,60,60,.5)" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <div style={{ fontFamily:'var(--mono)',fontSize:'8px',color:'rgba(180,60,60,.6)',lineHeight:1.5,textAlign:'center' }}>{gen.error}</div>
                    </div>
                  ):(
                    <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center' }}>
                      <div style={{ width:'16px',height:'16px',border:'1px solid var(--grey1)',borderTop:'1px solid var(--grey4)',borderRadius:'50%',animation:'spin 1s linear infinite' }}/>
                    </div>
                  )}
                </div>
                <div style={{ fontFamily:'var(--body)',fontSize:'9px',fontWeight:500,letterSpacing:'.18em',textTransform:'uppercase',color:'var(--grey3)',textAlign:'center' }}>{LABEL[key]}</div>
              </div>
            );
          })}
        </div>

        {/* Analysis card */}
        {analysis&&(
          <div style={{ background:'linear-gradient(135deg,var(--off) 0%,var(--light) 100%)',border:'1px solid var(--grey1)',padding:'36px 40px',animation:'fadeUp .6s ease' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'16px',marginBottom:'20px' }}>
              <div>
                <div style={{ fontFamily:'var(--body)',fontSize:'10px',fontWeight:500,letterSpacing:'.3em',textTransform:'uppercase',color:'var(--grey3)',marginBottom:'8px' }}>Recommended Hairstyle</div>
                <h3 style={{ fontFamily:'var(--display)',fontSize:'clamp(22px,2.6vw,34px)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',color:'var(--black)' }}>{analysis.hairstyle_name}</h3>
              </div>
              <div style={{ fontFamily:'var(--mono)',fontSize:'10px',color:'var(--grey4)',background:'var(--white)',padding:'7px 14px',border:'1px solid var(--grey1)',letterSpacing:'.08em',alignSelf:'flex-start' }}>{analysis.length}</div>
            </div>
            <p style={{ fontFamily:'var(--body)',fontSize:'15px',fontWeight:300,color:'var(--grey4)',lineHeight:1.85,marginBottom:'24px',maxWidth:'680px' }}>{analysis.description}</p>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:'10px',marginBottom:'22px' }}>
              {[['Front',analysis.front_notes],['Back',analysis.back_notes],['Side',analysis.side_notes],['Top',analysis.top_notes]].map(([label,text])=>text&&(
                <div key={label} style={{ background:'var(--white)',border:'1px solid var(--mist)',padding:'14px 16px' }}>
                  <div style={{ fontFamily:'var(--body)',fontSize:'9px',fontWeight:500,letterSpacing:'.28em',textTransform:'uppercase',color:'var(--grey3)',marginBottom:'7px' }}>{label}</div>
                  <div style={{ fontFamily:'var(--body)',fontSize:'13px',fontWeight:300,color:'var(--grey4)',lineHeight:1.75 }}>{text}</div>
                </div>
              ))}
            </div>
            {analysis.styling_tip&&(
              <div style={{ borderTop:'1px solid var(--grey1)',paddingTop:'16px',display:'flex',gap:'10px',alignItems:'flex-start' }}>
                <span style={{ color:'var(--grey3)',fontSize:'12px',flexShrink:0,marginTop:'2px' }}>—</span>
                <div style={{ fontFamily:'var(--body)',fontSize:'14px',fontWeight:300,color:'var(--grey3)',lineHeight:1.8 }}>{analysis.styling_tip}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox&&(
        <div onClick={()=>setLightbox(null)}
          style={{ position:'fixed',inset:0,background:'rgba(255,255,255,.96)',zIndex:800,display:'flex',alignItems:'center',justifyContent:'center',padding:'40px',animation:'fadeIn .2s ease',cursor:'none' }}>
          <div style={{ maxWidth:'540px',width:'100%',animation:'fadeUp .22s ease' }}>
            <img src={lightbox.url} alt={lightbox.id} style={{ width:'100%',display:'block',border:'1px solid var(--grey1)' }}/>
            <div style={{ marginTop:'14px',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <div style={{ fontFamily:'var(--display)',fontSize:'18px',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--black)' }}>{LABEL[lightbox.id]}</div>
              <div style={{ fontFamily:'var(--body)',fontSize:'10px',letterSpacing:'.2em',textTransform:'uppercase',color:'var(--grey3)' }}>click to close</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

// ── API ───────────────────────────────────────────────────────────────────────
async function post(path, body, timeoutMs=200_000) {
  const ctrl=new AbortController();
  const timer=setTimeout(()=>ctrl.abort(),timeoutMs);
  try {
    const res=await fetch(path,{method:'POST',signal:ctrl.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    clearTimeout(timer);
    const data=await res.json();
    if(!res.ok)throw new Error(data?.error||data?.message||`HTTP ${res.status}`);
    return data;
  }catch(e){clearTimeout(timer);throw new Error(e.name==='AbortError'?'Request timed out':e.message);}
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [images,   setImages]   = useState({ front:null,back:null,side:null,top:null });
  const [phase,    setPhase]    = useState('idle');
  const [analysis, setAnalysis] = useState(null);
  const [results,  setResults]  = useState([]);
  const [err,      setErr]      = useState(null);

  const uploadRef  = useRef(null);
  const resultsRef = useRef(null);
  const printRef   = useRef(null);
  const savedImgs  = useRef(null);

  const scrollTo = ref => ref?.current?.scrollIntoView({ behavior:'smooth', block:'start' });

  const handleImage = useCallback((id,val) => setImages(prev=>({...prev,[id]:val})), []);

  const run = async () => {
    savedImgs.current = { ...images };
    setPhase('running'); setErr(null); setAnalysis(null); setResults([]);

    let analysisData;
    try {
      const r = await post('/api/analyze', { front:images.front,back:images.back,side:images.side,top:images.top });
      analysisData = r.analysis;
      setAnalysis(analysisData);
    } catch(e) { setErr(e.message); setPhase('idle'); return; }

    try {
      const r = await post('/api/generate', { front:images.front,back:images.back,side:images.side,top:images.top,analysis:analysisData }, 240_000);
      setResults(r.results || []);
    } catch(e) { console.warn('[App] gen error:', e.message); setResults([]); }

    setPhase('done');
    setTimeout(() => scrollTo(resultsRef), 400);
  };

  const reset = () => {
    setImages({front:null,back:null,side:null,top:null});
    setPhase('idle'); setAnalysis(null); setResults([]); setErr(null);
    setTimeout(() => scrollTo(uploadRef), 200);
  };

  const downloadReport = () => {
    // Inject print-only section into DOM then trigger print
    if (printRef.current) {
      printRef.current.style.display = 'block';
      window.print();
      // hide again after print dialog closes
      setTimeout(() => { if (printRef.current) printRef.current.style.display = 'none'; }, 1000);
    }
  };

  return (
    <>
      <Styles/>
      <Cursor/>
      <Nav onDownload={downloadReport} showDownload={phase==='done'}/>
      <Ticker/>
      <Hero onBegin={() => scrollTo(uploadRef)}/>
      <div className="divider no-print" style={{ margin:'0 48px' }}/>

      {phase!=='done' && <Upload images={images} onImage={handleImage} uploadRef={uploadRef} onRun={run} running={phase==='running'}/>}
      {phase==='running' && <Scanner images={images}/>}
      {err && <ErrorBanner msg={err} onRetry={run} onDismiss={()=>setErr(null)}/>}
      {phase==='done' && <Results analysis={analysis} results={results} inputImages={savedImgs.current} onReset={reset} resultsRef={resultsRef}/>}

      {/* Hidden print report — shown only during window.print() */}
      <div ref={printRef} style={{ display:'none' }}>
        <PrintReport analysis={analysis} results={results} inputImages={savedImgs.current} printRef={null}/>
      </div>

      <footer className="no-print" style={{ borderTop:'1px solid var(--mist)',padding:'36px 48px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'16px',background:'var(--off)' }}>
        <div style={{ fontFamily:'var(--display)',fontSize:'13px',fontWeight:700,letterSpacing:'.2em',textTransform:'uppercase',color:'var(--black)' }}>American Hairline</div>
        <div style={{ fontFamily:'var(--mono)',fontSize:'11px',color:'var(--grey2)' }}>Nano Banana · {new Date().getFullYear()}</div>
        <div style={{ fontFamily:'var(--body)',fontSize:'10px',fontWeight:400,letterSpacing:'.18em',textTransform:'uppercase',color:'var(--grey2)' }}>For Consultation Purposes Only</div>
      </footer>
    </>
  );
}
