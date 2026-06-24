export function ModalOverlay({ children, onClose }) {
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };
  return (
    <div className="modal-overlay" onMouseDown={handleBackdrop}>
      <div className="modal-box">{children}</div>
    </div>
  );
}

export function ModalHeader({ title, onClose, icon }) {
  return (
    <div className="modal-header">
      <span className="modal-title">
        {icon && <span style={{ marginRight: 8 }}>{icon}</span>}
        {title}
      </span>
      <button className="modal-close" onClick={onClose}>✕</button>
    </div>
  );
}

export function ModalFooter({ children }) {
  return <div className="modal-footer">{children}</div>;
}

export function Btn({ children, onClick, variant = 'ghost', disabled, style }) {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
}

export function FieldGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="field-label">{label}</div>
      {children}
    </div>
  );
}

export function Toggle({ checked, onChange }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="toggle-track" />
    </label>
  );
}

export function ComingSoonBadge() {
  return <span className="coming-soon-badge">🔒 Coming Soon</span>;
}
