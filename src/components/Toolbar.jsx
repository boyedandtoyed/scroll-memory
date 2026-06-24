import { useRef } from 'react';

const ICON = {
  image:   '🖼️',
  video:   '🎬',
  text:    '✏️',
  rect:    '⬛',
  circle:  '⭕',
  triangle:'🔺',
  star:    '⭐',
  save:    '💾',
  export:  '📤',
  import:  '📥',
  html:    '🌐',
  delete:  '🗑️',
  zoomIn:  '🔍',
  zoomOut: '🔎',
  reset:   '⌂',
};

const Divider = () => (
  <div style={{ height: 1, background: 'var(--color-border)', margin: '6px 8px' }} />
);

const Section = ({ label }) => (
  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', padding: '8px 8px 2px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
    {label}
  </div>
);

export default function Toolbar({ canvasRef, board, onExportJSON, onImportJSON, onExportHTML }) {
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const importInputRef = useRef(null);

  const fc = () => canvasRef.current?.getFabric();

  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => canvasRef.current?.addImage(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleVideoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Canvas component handles video via URL
    const url = URL.createObjectURL(file);
    canvasRef.current?.addImage(url);
    e.target.value = '';
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onImportJSON?.(file);
    e.target.value = '';
  };

  const deleteSelected = () => {
    const canvas = fc();
    if (!canvas) return;
    const active = canvas.getActiveObjects();
    if (!active.length) return;
    active.forEach((o) => canvas.remove(o));
    canvas.discardActiveObject();
    canvas.renderAll();
  };

  const bringForward = () => { const o = fc()?.getActiveObject(); if (o) { fc().bringForward(o); fc().renderAll(); } };
  const sendBackward = () => { const o = fc()?.getActiveObject(); if (o) { fc().sendBackwards(o); fc().renderAll(); } };

  return (
    <aside
      style={{
        width: 80,
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '12px 4px',
        overflowY: 'auto',
        flexShrink: 0,
      }}
    >
      {/* Logo mark */}
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 22 }}>🎨</div>
        <div style={{ fontSize: 9, color: 'var(--color-primary)', fontWeight: 700, letterSpacing: '0.1em', marginTop: 2 }}>MEMORY</div>
      </div>

      <Divider />

      <Section label="Add" />

      <button className="tool-btn" onClick={() => imageInputRef.current?.click()} title="Add Image">
        <span style={{ fontSize: 20 }}>{ICON.image}</span>
        Image
      </button>
      <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageFile} />

      <button className="tool-btn" onClick={() => videoInputRef.current?.click()} title="Add Video">
        <span style={{ fontSize: 20 }}>{ICON.video}</span>
        Video
      </button>
      <input ref={videoInputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleVideoFile} />

      <button className="tool-btn" onClick={() => canvasRef.current?.addText()} title="Add Text">
        <span style={{ fontSize: 20 }}>{ICON.text}</span>
        Text
      </button>

      <Divider />
      <Section label="Shapes" />

      <button className="tool-btn" onClick={() => canvasRef.current?.addShape('rect')} title="Rectangle">
        <span style={{ fontSize: 20 }}>{ICON.rect}</span>
        Rect
      </button>

      <button className="tool-btn" onClick={() => canvasRef.current?.addShape('circle')} title="Circle">
        <span style={{ fontSize: 20 }}>{ICON.circle}</span>
        Circle
      </button>

      <button className="tool-btn" onClick={() => canvasRef.current?.addShape('triangle')} title="Triangle">
        <span style={{ fontSize: 20 }}>{ICON.triangle}</span>
        Triangle
      </button>

      <button className="tool-btn" onClick={() => canvasRef.current?.addShape('star')} title="Star">
        <span style={{ fontSize: 20 }}>{ICON.star}</span>
        Star
      </button>

      <Divider />
      <Section label="Arrange" />

      <button className="tool-btn" onClick={bringForward} title="Bring forward">
        <span style={{ fontSize: 18 }}>⬆️</span>
        Forward
      </button>

      <button className="tool-btn" onClick={sendBackward} title="Send backward">
        <span style={{ fontSize: 18 }}>⬇️</span>
        Back
      </button>

      <button className="tool-btn" onClick={deleteSelected} title="Delete selected (Del)">
        <span style={{ fontSize: 18 }}>{ICON.delete}</span>
        Delete
      </button>

      <Divider />
      <Section label="View" />

      <button className="tool-btn" onClick={() => canvasRef.current?.zoomIn()} title="Zoom in">
        <span style={{ fontSize: 18 }}>{ICON.zoomIn}</span>
        Zoom+
      </button>

      <button className="tool-btn" onClick={() => canvasRef.current?.zoomOut()} title="Zoom out">
        <span style={{ fontSize: 18 }}>{ICON.zoomOut}</span>
        Zoom−
      </button>

      <button className="tool-btn" onClick={() => canvasRef.current?.resetZoom()} title="Reset zoom">
        <span style={{ fontSize: 18 }}>{ICON.reset}</span>
        Reset
      </button>

      <Divider />
      <Section label="File" />

      <button className="tool-btn" onClick={() => canvasRef.current?.save()} title="Save now (Ctrl+S)">
        <span style={{ fontSize: 18 }}>{ICON.save}</span>
        Save
      </button>

      <button className="tool-btn" onClick={onExportJSON} title="Export as JSON">
        <span style={{ fontSize: 18 }}>{ICON.export}</span>
        Export
      </button>

      <button className="tool-btn" onClick={onExportHTML} title="Export as standalone HTML">
        <span style={{ fontSize: 18 }}>{ICON.html}</span>
        HTML
      </button>

      <button className="tool-btn" onClick={() => importInputRef.current?.click()} title="Import JSON">
        <span style={{ fontSize: 18 }}>{ICON.import}</span>
        Import
      </button>
      <input ref={importInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
    </aside>
  );
}
