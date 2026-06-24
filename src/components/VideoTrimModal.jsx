import { useEffect, useRef, useState } from 'react';
import { ModalOverlay, ModalHeader, ModalFooter, Btn } from './ModalBase';

const fmt = (s) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.round((s % 1) * 10);
  return `${m}:${String(sec).padStart(2, '0')}.${ms}`;
};

export default function VideoTrimModal({ file, onPlace, onCancel }) {
  const videoRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [url] = useState(() => URL.createObjectURL(file));

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  const onMeta = () => {
    const d = videoRef.current?.duration || 0;
    setDuration(d);
    setTrimEnd(d);
  };

  const handleStartChange = (v) => {
    const val = Math.min(Number(v), trimEnd - 0.1);
    setTrimStart(val);
    if (videoRef.current) videoRef.current.currentTime = val;
  };

  const handleEndChange = (v) => {
    const val = Math.max(Number(v), trimStart + 0.1);
    setTrimEnd(val);
    if (videoRef.current) videoRef.current.currentTime = val;
  };

  const previewStart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = trimStart;
    videoRef.current.play();
  };

  return (
    <ModalOverlay onClose={onCancel}>
      <div style={{ width: 520, display: 'flex', flexDirection: 'column' }}>
        <ModalHeader title="Trim Video" icon="✂️" onClose={onCancel} />

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Video preview */}
          <video
            ref={videoRef}
            src={url}
            onLoadedMetadata={onMeta}
            controls
            style={{ width: '100%', maxHeight: 280, borderRadius: 10, background: '#000', outline: 'none' }}
          />

          {/* Range sliders */}
          <div style={{ background: 'var(--color-surface2)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="field-label">Start</span>
                <span style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(trimStart)}</span>
              </div>
              <input
                type="range" className="styled"
                min={0} max={duration} step={0.1}
                value={trimStart}
                onChange={(e) => handleStartChange(e.target.value)}
                style={{ '--thumb-color': '#00B4D8' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="field-label">End</span>
                <span style={{ fontSize: 12, color: 'var(--color-secondary)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(trimEnd)}</span>
              </div>
              <input
                type="range" className="styled"
                min={0} max={duration} step={0.1}
                value={trimEnd}
                onChange={(e) => handleEndChange(e.target.value)}
              />
            </div>

            {/* Duration display */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="field-label" style={{ marginBottom: 0 }}>Clip duration</span>
              <span style={{ fontSize: 13, color: 'var(--color-secondary)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {fmt(Math.max(0, trimEnd - trimStart))}
              </span>
            </div>
          </div>

          {/* Preview button */}
          <button
            onClick={previewStart}
            style={{ background: 'transparent', border: '1px dashed var(--color-border)', borderRadius: 8, padding: '8px', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
          >
            ▶ Preview from trim start
          </button>
        </div>

        <ModalFooter>
          <Btn onClick={() => onPlace(file, 0, null, url)} variant="ghost">Skip Trim</Btn>
          <Btn onClick={() => onPlace(file, trimStart, trimEnd, url)} variant="primary">✂️ Add to Canvas</Btn>
        </ModalFooter>
      </div>
    </ModalOverlay>
  );
}
