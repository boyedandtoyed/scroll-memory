import { useState } from 'react';
import { ModalOverlay, ModalHeader, ModalFooter, Btn, FieldGroup } from './ModalBase';

export default function GroupingModal({ files, canvasRef, onClose, onDone }) {
  const [label, setLabel] = useState('');
  const [eventName, setEventName] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  const previews = files.map((f) => ({
    url: URL.createObjectURL(f),
    isVideo: f.type.startsWith('video/'),
    name: f.name,
  }));

  const handleCreate = async () => {
    setLoading(true);
    try {
      await canvasRef.current?.addMediaGroup(files, {
        label: label || 'Media Group',
        eventName,
        date,
      });
    } finally {
      setLoading(false);
      onDone();
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ width: 560, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <ModalHeader title="Create Media Group" icon="🗂️" onClose={onClose} />

        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── Thumbnail strip ── */}
          <div>
            <div className="field-label" style={{ marginBottom: 8 }}>{files.length} item{files.length !== 1 ? 's' : ''} selected</div>
            <div className="thumb-grid">
              {previews.map((p, i) => (
                <div key={i} className="thumb-cell">
                  {p.isVideo
                    ? <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, background: 'var(--color-surface2)' }}>🎬</div>
                    : <img src={p.url} alt={p.name} />
                  }
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--color-border)' }} />

          {/* ── Metadata fields ── */}
          <FieldGroup label="Group Label *">
            <input
              className="field-input"
              placeholder='e.g. "Summer Trip 2024"'
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              autoFocus
            />
          </FieldGroup>

          <FieldGroup label="Event Name">
            <input
              className="field-input"
              placeholder='e.g. "Birthday Party" or "Beach Day"'
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
            />
          </FieldGroup>

          <FieldGroup label="Date / Date Range">
            <input
              className="field-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ colorScheme: 'dark' }}
            />
          </FieldGroup>

          {/* Preview */}
          {(label || eventName || date) && (
            <div style={{ background: 'rgba(0,180,216,0.06)', border: '1px solid rgba(0,180,216,0.2)', borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 600 }}>GROUP LABEL PREVIEW</div>
              <div style={{ color: 'var(--color-primary)', fontSize: 15, fontWeight: 700 }}>{label || 'Media Group'}</div>
              {(eventName || date) && (
                <div style={{ color: 'var(--color-text-muted)', fontSize: 12, marginTop: 2 }}>
                  {[eventName, date].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
          )}
        </div>

        <ModalFooter>
          <Btn onClick={onClose} variant="ghost">Cancel</Btn>
          <Btn onClick={handleCreate} disabled={loading} variant="primary">
            {loading ? <><span className="spinner" /> Creating…</> : '🗂️ Create Group on Canvas'}
          </Btn>
        </ModalFooter>
      </div>
    </ModalOverlay>
  );
}
