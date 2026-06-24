import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ModalOverlay, ModalHeader, ModalFooter, Btn, ComingSoonBadge } from './ModalBase';

const ACCEPTED = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
};

export default function MediaImportModal({ onClose, onPlaceDirect, onCreateGroup }) {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const onDrop = useCallback((accepted) => {
    const next = accepted.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
      isVideo: f.type.startsWith('video/'),
    }));
    setFiles((p) => [...p, ...accepted]);
    setPreviews((p) => [...p, ...next]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    multiple: true,
  });

  const remove = (i) => {
    URL.revokeObjectURL(previews[i].url);
    setFiles((f) => f.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const placeDirect = () => { if (files.length) { onPlaceDirect(files); onClose(); } };
  const createGroup = () => { if (files.length) { onCreateGroup(files); onClose(); } };

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ width: 520, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <ModalHeader title="Import Media" icon="📁" onClose={onClose} />

        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── Dropzone ── */}
          <div
            {...getRootProps()}
            className={`dropzone${isDragActive ? ' active' : ''}`}
          >
            <input {...getInputProps()} />
            <div style={{ fontSize: 38, marginBottom: 8 }}>📁</div>
            <div style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
              {isDragActive ? 'Drop files here…' : 'Drag & drop or click to browse'}
            </div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
              JPG · PNG · WebP · GIF · MP4 · MOV — multi-select supported
            </div>
          </div>

          {/* ── Google Photos placeholder ── */}
          <div>
            <div className="field-label" style={{ marginBottom: 8 }}>Or connect an external source</div>
            <button
              disabled
              style={{
                width: '100%', padding: '12px 14px',
                background: 'rgba(15,30,56,0.5)',
                border: '1px solid var(--color-border)',
                borderRadius: 10, display: 'flex', alignItems: 'center',
                gap: 12, cursor: 'not-allowed', opacity: 0.6, textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 24 }}>📸</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--color-text)', fontSize: 13, fontWeight: 600 }}>Connect Google Photos</div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: 11, marginTop: 2 }}>Browse albums and import photos directly onto the canvas</div>
              </div>
              <ComingSoonBadge />
            </button>
          </div>

          {/* ── Preview grid ── */}
          {previews.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 10, fontWeight: 600 }}>
                {previews.length} file{previews.length !== 1 ? 's' : ''} ready
              </div>
              <div className="thumb-grid">
                {previews.map((p, i) => (
                  <div key={i} className="thumb-cell">
                    {p.isVideo
                      ? <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, background: 'var(--color-surface2)' }}>🎬</div>
                      : <img src={p.url} alt="" />
                    }
                    <button
                      onClick={() => remove(i)}
                      style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <ModalFooter>
          <Btn onClick={onClose} variant="ghost">Cancel</Btn>
          <Btn onClick={placeDirect} disabled={!files.length} variant="primary">Place on Canvas</Btn>
          <Btn onClick={createGroup} disabled={!files.length} variant="secondary">Create Group →</Btn>
        </ModalFooter>
      </div>
    </ModalOverlay>
  );
}
