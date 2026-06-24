import { useEffect, useRef, useState } from 'react';
import { ModalOverlay, ModalHeader, ModalFooter, Btn, Toggle, ComingSoonBadge } from './ModalBase';

const TRANSITIONS = ['fade', 'slide', 'zoom', 'flip'];
const TRANS_ICONS = { fade: '🌫️', slide: '➡️', zoom: '🔍', flip: '🔄' };

const ANIM_IN = {
  fade:  'ss-fadeIn  0.6s ease forwards',
  slide: 'ss-slideIn 0.5s ease forwards',
  zoom:  'ss-zoomIn  0.5s ease forwards',
  flip:  'ss-flipIn  0.5s ease forwards',
};
const ANIM_OUT = {
  fade:  'ss-fadeOut  0.4s ease forwards',
  slide: 'ss-slideOut 0.4s ease forwards',
  zoom:  'ss-zoomOut  0.4s ease forwards',
  flip:  'ss-flipOut  0.4s ease forwards',
};

function getSlideData(obj) {
  const el = obj.getElement?.();
  if (!el) return null;
  if (el instanceof HTMLVideoElement) {
    try {
      const c = document.createElement('canvas');
      c.width = el.videoWidth || 320; c.height = el.videoHeight || 240;
      c.getContext('2d').drawImage(el, 0, 0);
      return { type: 'video', src: c.toDataURL(), videoEl: el, id: obj.__uid };
    } catch { return null; }
  }
  if (el instanceof HTMLImageElement || el instanceof HTMLCanvasElement) {
    return { type: 'image', src: el.src || el.toDataURL?.(), id: obj.__uid };
  }
  return null;
}

// ── Step 1: Select ───────────────────────────────────────────────────────────

function StepSelect({ canvasRef, selected, setSelected, onNext, onClose }) {
  const [objects, setObjects] = useState([]);

  useEffect(() => {
    const fc = canvasRef.current?.getFabric();
    if (!fc) return;
    const uid = (o, i) => { o.__uid = o.__uid || `obj-${i}`; return o; };
    const imgs = fc.getObjects()
      .map(uid)
      .filter((o) => o.type === 'image')
      .map((o) => {
        const slide = getSlideData(o);
        return slide ? { ...slide, fabricObj: o } : null;
      })
      .filter(Boolean);
    setObjects(imgs);
  }, [canvasRef]);

  const toggle = (id) =>
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  const selectAll = () => setSelected(objects.map((o) => o.id));
  const clearAll = () => setSelected([]);

  return (
    <>
      <ModalHeader title="Create Slideshow — Select Slides" icon="🎞️" onClose={onClose} />
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {objects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🖼️</div>
            <div>No images on the canvas yet.</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>Add images or photos first, then create a slideshow.</div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>
                {objects.length} image{objects.length !== 1 ? 's' : ''} on canvas · {selected.length} selected
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={selectAll} style={{ fontSize: 12, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Select all</button>
                <button onClick={clearAll} style={{ fontSize: 12, color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
              </div>
            </div>
            <div className="thumb-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))' }}>
              {objects.map((obj) => {
                const isSelected = selected.includes(obj.id);
                return (
                  <div
                    key={obj.id}
                    onClick={() => toggle(obj.id)}
                    className="thumb-cell"
                    style={{ cursor: 'pointer' }}
                  >
                    {obj.src
                      ? <img src={obj.src} alt="" />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, background: 'var(--color-surface2)' }}>🎬</div>
                    }
                    {isSelected && (
                      <>
                        <div className="thumb-check" />
                        <div className="thumb-checkmark">✓</div>
                        <div style={{ position: 'absolute', bottom: 3, left: 4, fontSize: 10, color: 'var(--color-primary)', fontWeight: 700 }}>
                          #{selected.indexOf(obj.id) + 1}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      <ModalFooter>
        <Btn onClick={onClose} variant="ghost">Cancel</Btn>
        <Btn onClick={onNext} disabled={selected.length < 1} variant="primary">Configure →</Btn>
      </ModalFooter>
    </>
  );
}

// ── Step 2: Configure ────────────────────────────────────────────────────────

function StepConfigure({ transition, setTransition, duration, setDuration, loop, setLoop, selectedCount, onBack, onNext, onClose }) {
  return (
    <>
      <ModalHeader title="Create Slideshow — Configure" icon="⚙️" onClose={onClose} />
      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Transition type */}
        <div>
          <div className="field-label" style={{ marginBottom: 10 }}>Transition Effect</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {TRANSITIONS.map((t) => (
              <button
                key={t}
                onClick={() => setTransition(t)}
                className={`transition-pill${transition === t ? ' selected' : ''}`}
              >
                <div style={{ fontSize: 20, marginBottom: 2 }}>{TRANS_ICONS[t]}</div>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="field-label">Duration per Slide</span>
            <span style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 700 }}>{duration}s</span>
          </div>
          <input
            type="range" className="styled"
            min={1} max={10} step={0.5}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>1s</span>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>10s</span>
          </div>
        </div>

        {/* Loop */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>Loop Slideshow</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>Automatically restart after last slide</div>
          </div>
          <Toggle checked={loop} onChange={setLoop} />
        </div>

        {/* Summary */}
        <div style={{ background: 'rgba(0,180,216,0.06)', border: '1px solid rgba(0,180,216,0.2)', borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>SUMMARY</div>
          <div style={{ fontSize: 13, color: 'var(--color-text)' }}>
            {selectedCount} slide{selectedCount !== 1 ? 's' : ''} · {TRANS_ICONS[transition]} {transition} · {duration}s each · {loop ? '🔁 Loop on' : 'Play once'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
            Total: ~{Math.round(selectedCount * duration)}s
          </div>
        </div>

        {/* MP4 export placeholder */}
        <button
          disabled
          style={{ width: '100%', padding: '12px 14px', background: 'rgba(15,30,56,0.5)', border: '1px solid var(--color-border)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12, cursor: 'not-allowed', opacity: 0.55 }}
        >
          <span style={{ fontSize: 22 }}>🎬</span>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <div style={{ color: 'var(--color-text)', fontSize: 13, fontWeight: 600 }}>Export as MP4</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 11, marginTop: 2 }}>Render slideshow with audio track using ffmpeg.wasm</div>
          </div>
          <ComingSoonBadge />
        </button>
      </div>
      <ModalFooter>
        <Btn onClick={onBack} variant="ghost">← Back</Btn>
        <Btn onClick={onNext} variant="primary">▶ Preview Slideshow</Btn>
      </ModalFooter>
    </>
  );
}

// ── Step 3: Preview (fullscreen) ─────────────────────────────────────────────

function StepPreview({ slides, transition, duration, loop, audioEl, onClose }) {
  const [current, setCurrent] = useState(0);
  const [phase, setPhase] = useState('in'); // 'in' | 'hold' | 'out'
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef(null);
  const TRANS_MS = 600;

  const advance = (dir = 1) => {
    setPhase('out');
    setTimeout(() => {
      setCurrent((c) => {
        const next = c + dir;
        if (next >= slides.length) return loop ? 0 : c;
        if (next < 0) return loop ? slides.length - 1 : 0;
        return next;
      });
      setPhase('in');
    }, TRANS_MS);
  };

  useEffect(() => {
    if (!isPlaying) { clearTimeout(timerRef.current); return; }
    timerRef.current = setTimeout(() => advance(1), duration * 1000);
    return () => clearTimeout(timerRef.current);
  }, [current, isPlaying, duration]);

  useEffect(() => {
    if (audioEl) audioEl.play().catch(() => {});
    return () => { if (audioEl) { audioEl.pause(); audioEl.currentTime = 0; } };
  }, [audioEl]);

  const slideStyle = {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    animation: phase === 'in' ? ANIM_IN[transition] : phase === 'out' ? ANIM_OUT[transition] : 'none',
  };

  const slide = slides[current];

  return (
    <div className="slideshow-fullscreen">
      {/* Slide content */}
      <div className="slide-wrap">
        <div className="slide-img" key={`${current}-${phase}`} style={slideStyle}>
          {slide?.type === 'video'
            ? <video src={slide.src} autoPlay loop muted style={{ maxWidth: '100vw', maxHeight: '100vh', objectFit: 'contain' }} />
            : <img src={slide?.src} alt="" style={{ maxWidth: '100vw', maxHeight: '100vh', objectFit: 'contain' }} />
          }
        </div>

        {/* Slide counter */}
        <div style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: '4px 12px', color: '#fff', fontSize: 12, fontWeight: 600 }}>
          {current + 1} / {slides.length}
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
        >
          ✕ Exit
        </button>
      </div>

      {/* Controls bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '40px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        {/* Progress dots */}
        <div className="ss-dots">
          {slides.map((_, i) => (
            <div key={i} className={`ss-dot${i === current ? ' active' : ''}`} onClick={() => { setCurrent(i); setPhase('in'); }} style={{ cursor: 'pointer' }} />
          ))}
        </div>

        {/* Playback controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => advance(-1)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', padding: '8px 14px', cursor: 'pointer', fontSize: 16 }}>‹</button>
          <button
            onClick={() => setIsPlaying((p) => !p)}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10, color: '#fff', padding: '10px 24px', cursor: 'pointer', fontSize: 18, minWidth: 64 }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button onClick={() => advance(1)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', padding: '8px 14px', cursor: 'pointer', fontSize: 16 }}>›</button>
        </div>

        {/* Transition label */}
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>
          {TRANS_ICONS[transition]} {transition} · {duration}s · {loop ? '🔁 loop' : 'play once'}
        </div>
      </div>
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

export default function SlideshowModal({ canvasRef, audioEl, onClose }) {
  const [step, setStep] = useState('select'); // 'select' | 'configure' | 'preview'
  const [selected, setSelected] = useState([]);
  const [slides, setSlides] = useState([]);
  const [transition, setTransition] = useState('fade');
  const [duration, setDuration] = useState(3);
  const [loop, setLoop] = useState(true);

  const goToPreview = () => {
    const fc = canvasRef.current?.getFabric();
    if (!fc) return;
    const objs = fc.getObjects().filter((o) => o.type === 'image' && selected.includes(o.__uid));
    const slideData = objs.map(getSlideData).filter(Boolean);
    setSlides(slideData);
    setStep('preview');
  };

  if (step === 'preview') {
    return (
      <StepPreview
        slides={slides}
        transition={transition}
        duration={duration}
        loop={loop}
        audioEl={audioEl}
        onClose={onClose}
      />
    );
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ width: step === 'select' ? 560 : 480, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        {/* Step indicator */}
        <div style={{ padding: '10px 20px 0', display: 'flex', gap: 8, alignItems: 'center' }}>
          {['select', 'configure', 'preview'].map((s, i) => (
            <div key={s} className={`step-dot${step === s ? ' active' : ((['select','configure','preview'].indexOf(step) > i) ? ' done' : '')}`} />
          ))}
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 4 }}>
            Step {step === 'select' ? 1 : step === 'configure' ? 2 : 3} of 3
          </span>
        </div>

        {step === 'select' && (
          <StepSelect
            canvasRef={canvasRef}
            selected={selected}
            setSelected={setSelected}
            onNext={() => setStep('configure')}
            onClose={onClose}
          />
        )}
        {step === 'configure' && (
          <StepConfigure
            transition={transition} setTransition={setTransition}
            duration={duration} setDuration={setDuration}
            loop={loop} setLoop={setLoop}
            selectedCount={selected.length}
            onBack={() => setStep('select')}
            onNext={goToPreview}
            onClose={onClose}
          />
        )}
      </div>
    </ModalOverlay>
  );
}
