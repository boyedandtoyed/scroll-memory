import { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import {
  Canvas as FabricCanvas,
  Image as FabricImage,
  IText,
  Rect,
  Circle,
  Triangle,
  Polygon,
  Point,
} from 'fabric';
import { saveBoard, generateThumbnail } from '../utils/saveLoad';

const AUTO_SAVE_MS = 30_000;
const GRID_SIZE = 20;

function drawGrid(ctx, width, height, vpt) {
  ctx.save();
  ctx.strokeStyle = 'rgba(30, 58, 95, 0.6)';
  ctx.lineWidth = 0.5;
  const scale = vpt[0];
  const offsetX = vpt[4];
  const offsetY = vpt[5];
  const step = GRID_SIZE * scale;
  const startX = (offsetX % step) - step;
  const startY = (offsetY % step) - step;
  for (let x = startX; x < width; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = startY; y < height; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }
  ctx.restore();
}

const Canvas = forwardRef(function Canvas({ boardId, initialJSON, onSaved }, ref) {
  const canvasElRef = useRef(null);
  const fabricRef = useRef(null);
  const containerRef = useRef(null);
  const isPanningRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const autoSaveTimerRef = useRef(null);
  const isDirtyRef = useRef(false);
  const [zoom, setZoom] = useState(1);
  const [saveKey, setSaveKey] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  // ── Save ──────────────────────────────────────────────────────────────────

  const persistSave = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc || !boardId) return;
    const json = fc.toJSON(['id', 'name']);
    const thumb = generateThumbnail(fc);
    saveBoard(boardId, json, thumb);
    isDirtyRef.current = false;
    setSaveKey((k) => k + 1);
    onSaved?.();
  }, [boardId, onSaved]);

  const scheduleSave = useCallback(() => {
    isDirtyRef.current = true;
    clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(persistSave, AUTO_SAVE_MS);
  }, [persistSave]);

  // ── Imperative API ────────────────────────────────────────────────────────

  useImperativeHandle(ref, () => ({
    getFabric: () => fabricRef.current,
    save: persistSave,
    zoomIn: () => applyZoom(Math.min((fabricRef.current?.getZoom() || 1) * 1.2, 5)),
    zoomOut: () => applyZoom(Math.max((fabricRef.current?.getZoom() || 1) * 0.8, 0.05)),
    resetZoom: () => applyZoom(1),
    addImage: (url) => addImageFromUrl(url),
    addText: (text) => addTextBlock(text),
    addShape: (shape) => addShapeObject(shape),
    loadJSON: (json) => {
      const fc = fabricRef.current;
      if (!fc) return;
      fc.loadFromJSON(json).then(() => fc.renderAll());
    },
  }), [persistSave]);

  // ── Zoom ──────────────────────────────────────────────────────────────────

  const applyZoom = useCallback((newZoom) => {
    const fc = fabricRef.current;
    if (!fc) return;
    const center = fc.getCenter();
    fc.zoomToPoint(new Point(center.left, center.top), newZoom);
    setZoom(newZoom);
  }, []);

  // ── Add objects ───────────────────────────────────────────────────────────

  const addImageFromUrl = useCallback((url) => {
    const fc = fabricRef.current;
    if (!fc) return;
    FabricImage.fromURL(url, { crossOrigin: 'anonymous' }).then((img) => {
      const maxDim = 400;
      const scale = Math.min(maxDim / (img.width || 400), maxDim / (img.height || 400), 1);
      img.set({ left: 200 + Math.random() * 200, top: 200 + Math.random() * 200, scaleX: scale, scaleY: scale });
      fc.add(img);
      fc.setActiveObject(img);
      fc.renderAll();
      scheduleSave();
    }).catch(() => {});
  }, [scheduleSave]);

  const addImageFromFile = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const fc = fabricRef.current;
      if (!fc) return;
      if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = e.target.result;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.onloadedmetadata = () => {
          const maxDim = 500;
          const scale = Math.min(maxDim / video.videoWidth, maxDim / video.videoHeight, 1);
          const fvideo = new FabricImage(video, {
            left: 200 + Math.random() * 200,
            top: 200 + Math.random() * 200,
            scaleX: scale,
            scaleY: scale,
          });
          fc.add(fvideo);
          video.play();
          fc.setActiveObject(fvideo);
          fc.renderAll();
          scheduleSave();
        };
      } else {
        FabricImage.fromURL(e.target.result).then((img) => {
          const maxDim = 400;
          const scale = Math.min(maxDim / (img.width || 400), maxDim / (img.height || 400), 1);
          img.set({ left: 200 + Math.random() * 200, top: 200 + Math.random() * 200, scaleX: scale, scaleY: scale });
          fc.add(img);
          fc.setActiveObject(img);
          fc.renderAll();
          scheduleSave();
        });
      }
    };
    reader.readAsDataURL(file);
  }, [scheduleSave]);

  const addTextBlock = useCallback((initialText = 'Double-click to edit') => {
    const fc = fabricRef.current;
    if (!fc) return;
    const text = new IText(initialText, {
      left: 300 + Math.random() * 200,
      top: 300 + Math.random() * 200,
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 24,
      fill: '#E8F4FD',
      fontWeight: '500',
      padding: 8,
    });
    fc.add(text);
    fc.setActiveObject(text);
    fc.renderAll();
    scheduleSave();
  }, [scheduleSave]);

  const addShapeObject = useCallback((shape) => {
    const fc = fabricRef.current;
    if (!fc) return;
    let obj;
    const base = { left: 300 + Math.random() * 200, top: 300 + Math.random() * 200 };
    switch (shape) {
      case 'rect':
        obj = new Rect({ ...base, width: 200, height: 140, rx: 12, ry: 12, fill: 'rgba(0,180,216,0.18)', stroke: '#00B4D8', strokeWidth: 2 });
        break;
      case 'circle':
        obj = new Circle({ ...base, radius: 80, fill: 'rgba(82,217,160,0.18)', stroke: '#52D9A0', strokeWidth: 2 });
        break;
      case 'triangle':
        obj = new Triangle({ ...base, width: 160, height: 140, fill: 'rgba(0,180,216,0.18)', stroke: '#00B4D8', strokeWidth: 2 });
        break;
      case 'star': {
        const points = makeStarPoints(5, 80, 40, base.left + 80, base.top + 80);
        obj = new Polygon(points, { fill: 'rgba(82,217,160,0.18)', stroke: '#52D9A0', strokeWidth: 2 });
        break;
      }
      default:
        return;
    }
    fc.add(obj);
    fc.setActiveObject(obj);
    fc.renderAll();
    scheduleSave();
  }, [scheduleSave]);

  // ── Init Fabric ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!canvasElRef.current) return;

    const container = containerRef.current;
    const w = container?.clientWidth || window.innerWidth;
    const h = container?.clientHeight || window.innerHeight;

    const fc = new FabricCanvas(canvasElRef.current, {
      width: w,
      height: h,
      backgroundColor: '#0A1628',
      selection: true,
      preserveObjectStacking: true,
    });

    fc.on('after:render', () => {
      drawGrid(fc.getContext(), w, h, fc.viewportTransform);
    });

    if (initialJSON) {
      fc.loadFromJSON(initialJSON).then(() => fc.renderAll());
    }

    const markDirty = () => scheduleSave();
    fc.on('object:modified', markDirty);
    fc.on('object:added', markDirty);
    fc.on('object:removed', markDirty);

    fc.on('mouse:down', (opt) => {
      const evt = opt.e;
      if (evt.altKey || evt.button === 1) {
        isPanningRef.current = true;
        fc.selection = false;
        lastPosRef.current = { x: evt.clientX, y: evt.clientY };
      }
    });

    fc.on('mouse:move', (opt) => {
      if (!isPanningRef.current) return;
      const evt = opt.e;
      const vpt = fc.viewportTransform;
      vpt[4] += evt.clientX - lastPosRef.current.x;
      vpt[5] += evt.clientY - lastPosRef.current.y;
      lastPosRef.current = { x: evt.clientX, y: evt.clientY };
      fc.requestRenderAll();
    });

    fc.on('mouse:up', () => {
      isPanningRef.current = false;
      fc.selection = true;
    });

    fc.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let newZoom = fc.getZoom() * (delta > 0 ? 0.95 : 1.05);
      newZoom = Math.min(Math.max(newZoom, 0.05), 5);
      fc.zoomToPoint(new Point(opt.e.offsetX, opt.e.offsetY), newZoom);
      setZoom(newZoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    fabricRef.current = fc;

    const intervalId = setInterval(() => {
      if (isDirtyRef.current) persistSave();
    }, AUTO_SAVE_MS);

    const ro = new ResizeObserver(() => {
      if (!container) return;
      fc.setWidth(container.clientWidth);
      fc.setHeight(container.clientHeight);
      fc.renderAll();
    });
    if (container) ro.observe(container);

    return () => {
      clearInterval(intervalId);
      clearTimeout(autoSaveTimerRef.current);
      ro.disconnect();
      fc.dispose();
    };
  }, [boardId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    if (initialJSON) {
      fc.loadFromJSON(initialJSON).then(() => fc.renderAll());
    } else {
      fc.clear();
      fc.backgroundColor = '#0A1628';
      fc.renderAll();
    }
  }, [initialJSON]);

  // ── Drag & drop ───────────────────────────────────────────────────────────

  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    Array.from(e.dataTransfer.files).forEach((f) => {
      if (f.type.startsWith('image/') || f.type.startsWith('video/')) addImageFromFile(f);
    });
  };

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e) => {
      const fc = fabricRef.current;
      if (!fc) return;
      const target = e.target;
      const isInput = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput) {
        const active = fc.getActiveObjects();
        if (active.length) {
          active.forEach((o) => fc.remove(o));
          fc.discardActiveObject();
          fc.renderAll();
          scheduleSave();
        }
      }
      if (e.key === 'Escape') { fc.discardActiveObject(); fc.renderAll(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); persistSave(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [scheduleSave, persistSave]);

  const zoomPct = Math.round(zoom * 100);

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 overflow-hidden${isDragOver ? ' drag-over' : ''}`}
      style={{ background: '#0A1628' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <canvas ref={canvasElRef} />

      {isDragOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div style={{ background: 'rgba(0,180,216,0.12)', border: '2px dashed #00B4D8', borderRadius: 16, padding: '32px 48px', color: '#00B4D8', fontSize: 18, fontWeight: 600 }}>
            Drop images or videos here
          </div>
        </div>
      )}

      {/* HUD */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 z-10">
        <div key={saveKey} className="save-toast" style={{ background: 'rgba(82,217,160,0.15)', border: '1px solid #52D9A0', color: '#52D9A0', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>
          Saved
        </div>
        <button className="zoom-badge" onClick={() => applyZoom(Math.max(zoom * 0.8, 0.05))} title="Zoom out" style={{ cursor: 'pointer' }}>−</button>
        <span className="zoom-badge">{zoomPct}%</span>
        <button className="zoom-badge" onClick={() => applyZoom(Math.min(zoom * 1.2, 5))} title="Zoom in" style={{ cursor: 'pointer' }}>+</button>
        <button className="zoom-badge" onClick={() => applyZoom(1)} title="Reset zoom" style={{ cursor: 'pointer' }}>⌂</button>
      </div>

      {/* Empty state */}
      {!initialJSON && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div style={{ color: 'rgba(123,167,200,0.3)', textAlign: 'center', fontSize: 15 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎨</div>
            <div>Drop images here or use the toolbar to add content</div>
            <div style={{ marginTop: 6, fontSize: 12 }}>Alt+drag or middle-mouse to pan · Scroll to zoom · Del to remove</div>
          </div>
        </div>
      )}
    </div>
  );
});

export default Canvas;

function makeStarPoints(numPoints, outerRadius, innerRadius, cx, cy) {
  const points = [];
  for (let i = 0; i < numPoints * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / numPoints - Math.PI / 2;
    points.push({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });
  }
  return points;
}
