import { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import {
  Canvas as FabricCanvas,
  Image as FabricImage,
  IText,
  Text as FabricText,
  Rect,
  Circle,
  Triangle,
  Polygon,
  Group as FabricGroup,
  Point,
} from 'fabric';
import { saveBoard, generateThumbnail } from '../utils/saveLoad';

const AUTO_SAVE_MS = 30_000;
const GRID_SIZE = 20;
let _uidCounter = 0;
const uid = () => `obj-${++_uidCounter}`;

function drawGrid(ctx, width, height, vpt) {
  ctx.save();
  ctx.strokeStyle = 'rgba(30, 58, 95, 0.5)';
  ctx.lineWidth = 0.5;
  const scale = vpt[0];
  const step = GRID_SIZE * scale;
  const startX = (vpt[4] % step) - step;
  const startY = (vpt[5] % step) - step;
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
  const rafRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [saveKey, setSaveKey] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  // ── Save ──────────────────────────────────────────────────────────────────

  const persistSave = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc || !boardId) return;
    const json = fc.toJSON(['id', 'name', '__uid']);
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

  // ── Video helpers ─────────────────────────────────────────────────────────

  const makeVideoElement = (url, trimStart = 0, trimEnd = null) => {
    const video = document.createElement('video');
    video.src = url;
    video.muted = true;
    video.loop = trimEnd === null;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    if (trimEnd !== null) {
      video.addEventListener('timeupdate', () => {
        if (video.currentTime >= trimEnd) {
          video.currentTime = trimStart;
          video.play().catch(() => {});
        }
      });
    }
    return video;
  };

  const addVideoFromUrl = useCallback((url, trimStart = 0, trimEnd = null) => {
    const fc = fabricRef.current;
    if (!fc) return;
    const video = makeVideoElement(url, trimStart, trimEnd);
    video.onloadedmetadata = () => {
      if (trimStart > 0) video.currentTime = trimStart;
      const maxDim = 500;
      const scale = Math.min(maxDim / (video.videoWidth || 640), maxDim / (video.videoHeight || 360), 1);
      const fv = new FabricImage(video, {
        left: 200 + Math.random() * 200,
        top: 200 + Math.random() * 200,
        scaleX: scale,
        scaleY: scale,
        objectCaching: false,
      });
      fv.__uid = uid();
      fv._isVideo = true;
      fv._isMuted = true;
      video.play().catch(() => {});
      fc.add(fv);
      fc.setActiveObject(fv);
      fc.renderAll();
      scheduleSave();
    };
  }, [scheduleSave]);

  // ── Add image from File ───────────────────────────────────────────────────

  const addImageFromFile = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const fc = fabricRef.current;
      if (!fc) return;
      FabricImage.fromURL(e.target.result).then((img) => {
        const maxDim = 420;
        const scale = Math.min(maxDim / (img.width || 420), maxDim / (img.height || 420), 1);
        img.set({ left: 180 + Math.random() * 200, top: 180 + Math.random() * 200, scaleX: scale, scaleY: scale });
        img.__uid = uid();
        fc.add(img);
        fc.setActiveObject(img);
        fc.renderAll();
        scheduleSave();
      }).catch(() => {});
    };
    reader.readAsDataURL(file);
  }, [scheduleSave]);

  const addImageFromUrl = useCallback((url) => {
    const fc = fabricRef.current;
    if (!fc) return;
    FabricImage.fromURL(url, { crossOrigin: 'anonymous' }).then((img) => {
      const maxDim = 420;
      const scale = Math.min(maxDim / (img.width || 420), maxDim / (img.height || 420), 1);
      img.set({ left: 200 + Math.random() * 200, top: 200 + Math.random() * 200, scaleX: scale, scaleY: scale });
      img.__uid = uid();
      fc.add(img);
      fc.setActiveObject(img);
      fc.renderAll();
      scheduleSave();
    }).catch(() => {});
  }, [scheduleSave]);

  // ── Add text ──────────────────────────────────────────────────────────────

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
    text.__uid = uid();
    fc.add(text);
    fc.setActiveObject(text);
    fc.renderAll();
    scheduleSave();
  }, [scheduleSave]);

  // ── Add shape ─────────────────────────────────────────────────────────────

  const addShapeObject = useCallback((shape) => {
    const fc = fabricRef.current;
    if (!fc) return;
    const base = { left: 300 + Math.random() * 200, top: 300 + Math.random() * 200 };
    let obj;
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
        const pts = starPoints(5, 80, 40, base.left + 80, base.top + 80);
        obj = new Polygon(pts, { fill: 'rgba(82,217,160,0.18)', stroke: '#52D9A0', strokeWidth: 2 });
        break;
      }
      default: return;
    }
    obj.__uid = uid();
    fc.add(obj);
    fc.setActiveObject(obj);
    fc.renderAll();
    scheduleSave();
  }, [scheduleSave]);

  // ── Add media group ───────────────────────────────────────────────────────

  const addMediaGroup = useCallback(async (files, metadata) => {
    const fc = fabricRef.current;
    if (!fc) return;

    const COLS = Math.min(files.length, 3);
    const CELL_W = 160, CELL_H = 120, GAP = 8, PAD = 14, LABEL_H = 52;
    const ROWS = Math.ceil(files.length / COLS);
    const gridW = COLS * CELL_W + (COLS - 1) * GAP;
    const groupW = gridW + PAD * 2;
    const groupH = ROWS * CELL_H + (ROWS - 1) * GAP + PAD * 2 + LABEL_H;

    // Start position on canvas (relative to group top-left)
    const gx = 160, gy = 160;

    // Background
    const bg = new Rect({
      left: 0, top: 0,
      width: groupW, height: groupH,
      fill: 'rgba(15,30,56,0.92)', stroke: '#1E3A5F', strokeWidth: 2, rx: 14, ry: 14,
    });

    // Label
    const title = new FabricText(metadata.label || 'Media Group', {
      left: PAD, top: PAD,
      fontSize: 15, fill: '#00B4D8', fontWeight: '700',
      fontFamily: 'Inter, system-ui, sans-serif',
    });

    const subParts = [metadata.eventName, metadata.date].filter(Boolean);
    const sub = subParts.length ? new FabricText(subParts.join(' · '), {
      left: PAD, top: PAD + 22,
      fontSize: 11, fill: '#7BA7C8',
      fontFamily: 'Inter, system-ui, sans-serif',
    }) : null;

    // Load images
    const imageObjects = await Promise.all(files.map((file, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const imgLeft = PAD + col * (CELL_W + GAP);
      const imgTop = LABEL_H + row * (CELL_H + GAP);

      if (file.type.startsWith('video/')) {
        return Promise.resolve(new Rect({
          left: imgLeft, top: imgTop,
          width: CELL_W, height: CELL_H,
          fill: '#0A1628', stroke: '#52D9A0', strokeWidth: 1, rx: 6, ry: 6,
        }));
      }

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          FabricImage.fromURL(e.target.result).then((img) => {
            const scale = Math.min(CELL_W / (img.width || CELL_W), CELL_H / (img.height || CELL_H));
            const offX = (CELL_W - (img.width || CELL_W) * scale) / 2;
            const offY = (CELL_H - (img.height || CELL_H) * scale) / 2;
            img.set({ left: imgLeft + offX, top: imgTop + offY, scaleX: scale, scaleY: scale });
            resolve(img);
          }).catch(() => {
            resolve(new Rect({ left: imgLeft, top: imgTop, width: CELL_W, height: CELL_H, fill: '#1E3A5F', rx: 6, ry: 6 }));
          });
        };
        reader.readAsDataURL(file);
      });
    }));

    const children = [bg, title, ...(sub ? [sub] : []), ...imageObjects];
    const group = new FabricGroup(children, { left: gx, top: gy, subTargetCheck: true });
    group.__uid = uid();
    fc.add(group);
    fc.setActiveObject(group);
    fc.requestRenderAll();
    scheduleSave();
  }, [scheduleSave]);

  // ── Zoom ──────────────────────────────────────────────────────────────────

  const applyZoom = useCallback((newZoom) => {
    const fc = fabricRef.current;
    if (!fc) return;
    const center = fc.getCenter();
    fc.zoomToPoint(new Point(center.left, center.top), newZoom);
    setZoom(newZoom);
  }, []);

  // ── Imperative API ────────────────────────────────────────────────────────

  useImperativeHandle(ref, () => ({
    getFabric: () => fabricRef.current,
    save: persistSave,
    zoomIn: () => applyZoom(Math.min((fabricRef.current?.getZoom() || 1) * 1.2, 5)),
    zoomOut: () => applyZoom(Math.max((fabricRef.current?.getZoom() || 1) * 0.8, 0.05)),
    resetZoom: () => applyZoom(1),
    addImage: addImageFromUrl,
    addImageFile: addImageFromFile,
    addVideoFile: addVideoFromUrl,
    addText: addTextBlock,
    addShape: addShapeObject,
    addMediaGroup,
    getObjects: () => fabricRef.current?.getObjects() || [],
    loadJSON: (json) => {
      const fc = fabricRef.current;
      if (!fc) return;
      fc.loadFromJSON(json).then(() => fc.renderAll());
    },
  }), [persistSave, applyZoom, addImageFromUrl, addImageFromFile, addVideoFromUrl, addTextBlock, addShapeObject, addMediaGroup]);

  // ── Init Fabric ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!canvasElRef.current) return;
    const container = containerRef.current;
    const w = container?.clientWidth || window.innerWidth;
    const h = container?.clientHeight || window.innerHeight;

    const fc = new FabricCanvas(canvasElRef.current, {
      width: w, height: h,
      backgroundColor: '#0A1628',
      selection: true,
      preserveObjectStacking: true,
    });

    // Grid background
    fc.on('after:render', () => {
      drawGrid(fc.getContext(), fc.width, fc.height, fc.viewportTransform);
    });

    if (initialJSON) {
      fc.loadFromJSON(initialJSON).then(() => fc.renderAll());
    }

    // Dirty tracking
    fc.on('object:modified', () => scheduleSave());
    fc.on('object:added', () => scheduleSave());
    fc.on('object:removed', () => scheduleSave());

    // Mouse: pan (Alt+drag / middle-click) + video click
    fc.on('mouse:down', (opt) => {
      const evt = opt.e;
      if (evt.altKey || evt.button === 1) {
        isPanningRef.current = true;
        fc.selection = false;
        lastPosRef.current = { x: evt.clientX, y: evt.clientY };
        return;
      }
      // Video unmute / pause-play
      const target = opt.target;
      if (target?._isVideo) {
        const el = target.getElement?.();
        if (el instanceof HTMLVideoElement) {
          if (target._isMuted) {
            el.muted = false;
            target._isMuted = false;
          } else {
            el.paused ? el.play().catch(() => {}) : el.pause();
          }
        }
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

    // Auto-save interval
    const interval = setInterval(() => { if (isDirtyRef.current) persistSave(); }, AUTO_SAVE_MS);

    // Video animation render loop
    const loop = () => { fc.requestRenderAll(); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);

    // Resize observer
    const ro = new ResizeObserver(() => {
      if (!container) return;
      fc.setWidth(container.clientWidth);
      fc.setHeight(container.clientHeight);
      fc.renderAll();
    });
    if (container) ro.observe(container);

    return () => {
      clearInterval(interval);
      clearTimeout(autoSaveTimerRef.current);
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      fc.dispose();
    };
  }, [boardId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload when board switches
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
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    Array.from(e.dataTransfer.files).forEach((f) => {
      if (f.type.startsWith('image/')) addImageFromFile(f);
      // videos via drop go directly (no trim modal for simple drag)
      else if (f.type.startsWith('video/')) {
        const url = URL.createObjectURL(f);
        addVideoFromUrl(url, 0, null);
      }
    });
  }, [addImageFromFile, addVideoFromUrl]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e) => {
      const fc = fabricRef.current;
      if (!fc) return;
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
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
        <button className="zoom-badge" onClick={() => applyZoom(Math.max(zoom * 0.8, 0.05))} style={{ cursor: 'pointer' }}>−</button>
        <span className="zoom-badge">{zoomPct}%</span>
        <button className="zoom-badge" onClick={() => applyZoom(Math.min(zoom * 1.2, 5))} style={{ cursor: 'pointer' }}>+</button>
        <button className="zoom-badge" onClick={() => applyZoom(1)} style={{ cursor: 'pointer' }}>⌂</button>
      </div>

      {/* Empty state */}
      {!initialJSON && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div style={{ color: 'rgba(123,167,200,0.28)', textAlign: 'center', fontSize: 15 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎨</div>
            <div>Drop images here or use the toolbar to add content</div>
            <div style={{ marginTop: 6, fontSize: 12 }}>Alt+drag · Scroll to zoom · Del to remove · Click video to unmute</div>
          </div>
        </div>
      )}
    </div>
  );
});

export default Canvas;

function starPoints(n, outer, inner, cx, cy) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i * Math.PI) / n - Math.PI / 2;
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  return pts;
}
