import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'memorycanvas_boards';
const ACTIVE_KEY = 'memorycanvas_active';

// ── Board list ───────────────────────────────────────────────────────────────

export function listBoards() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveBoards(boards) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(boards));
}

// ── Active board id ──────────────────────────────────────────────────────────

export function getActiveId() {
  return localStorage.getItem(ACTIVE_KEY) || null;
}

export function setActiveId(id) {
  localStorage.setItem(ACTIVE_KEY, id);
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

export function createBoard(name = 'Untitled') {
  const boards = listBoards();
  const board = {
    id: uuidv4(),
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    canvasJSON: null,
    thumbnail: null,
  };
  boards.unshift(board);
  saveBoards(boards);
  return board;
}

export function loadBoard(id) {
  const boards = listBoards();
  return boards.find((b) => b.id === id) || null;
}

export function saveBoard(id, canvasJSON, thumbnail = null) {
  const boards = listBoards();
  const idx = boards.findIndex((b) => b.id === id);
  if (idx === -1) return;
  boards[idx] = {
    ...boards[idx],
    canvasJSON,
    thumbnail,
    updatedAt: Date.now(),
  };
  saveBoards(boards);
}

export function renameBoard(id, name) {
  const boards = listBoards();
  const idx = boards.findIndex((b) => b.id === id);
  if (idx === -1) return;
  boards[idx].name = name;
  boards[idx].updatedAt = Date.now();
  saveBoards(boards);
}

export function deleteBoard(id) {
  const boards = listBoards().filter((b) => b.id !== id);
  saveBoards(boards);
}

// ── JSON export / import ─────────────────────────────────────────────────────

export function exportBoardJSON(board, canvasJSON) {
  const data = JSON.stringify({ ...board, canvasJSON }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  triggerDownload(blob, `${board.name || 'canvas'}.json`);
}

export function importBoardJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const boards = listBoards();
        const board = {
          id: uuidv4(),
          name: data.name || 'Imported Canvas',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          canvasJSON: data.canvasJSON || null,
          thumbnail: data.thumbnail || null,
        };
        boards.unshift(board);
        saveBoards(boards);
        resolve(board);
      } catch {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// ── Standalone HTML export ───────────────────────────────────────────────────

export function exportBoardHTML(board, canvasJSON) {
  const canvasData = JSON.stringify(canvasJSON);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(board.name || 'MemoryCanvas')}</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js"><\/script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0A1628; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui, sans-serif; }
    #toolbar { position: fixed; top: 16px; left: 50%; transform: translateX(-50%); background: #0F1E38; border: 1px solid #1E3A5F; border-radius: 12px; padding: 8px 16px; display: flex; gap: 12px; align-items: center; z-index: 100; }
    #toolbar span { color: #E8F4FD; font-size: 14px; font-weight: 600; }
    #toolbar .tag { background: rgba(0,180,216,0.12); border: 1px solid #00B4D8; color: #00B4D8; border-radius: 6px; padding: 2px 8px; font-size: 12px; }
    canvas { display: block; }
    #canvas-wrap { position: relative; }
  </style>
</head>
<body>
  <div id="toolbar">
    <span>${escapeHtml(board.name || 'MemoryCanvas')}</span>
    <span class="tag">Read Only</span>
  </div>
  <div id="canvas-wrap">
    <canvas id="c"></canvas>
  </div>
  <script>
    const data = ${canvasData};
    const w = (data.width || 3000);
    const h = (data.height || 2000);
    const canvas = new fabric.Canvas('c', {
      width: Math.min(w, window.innerWidth),
      height: Math.min(h, window.innerHeight),
      selection: false,
    });
    canvas.loadFromJSON(data, () => {
      canvas.getObjects().forEach(o => { o.selectable = false; o.evented = false; });
      canvas.renderAll();
    });
    // Pan with mouse drag
    let isPanning = false, lastX = 0, lastY = 0;
    canvas.on('mouse:down', e => { isPanning = true; lastX = e.e.clientX; lastY = e.e.clientY; });
    canvas.on('mouse:up', () => { isPanning = false; });
    canvas.on('mouse:move', e => {
      if (!isPanning) return;
      const vpt = canvas.viewportTransform;
      vpt[4] += e.e.clientX - lastX;
      vpt[5] += e.e.clientY - lastY;
      lastX = e.e.clientX; lastY = e.e.clientY;
      canvas.requestRenderAll();
    });
    // Zoom with wheel
    canvas.on('mouse:wheel', opt => {
      const delta = opt.e.deltaY;
      let zoom = canvas.getZoom() * (delta > 0 ? 0.95 : 1.05);
      zoom = Math.min(Math.max(zoom, 0.1), 5);
      canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });
  <\/script>
</body>
</html>`;
  const blob = new Blob([html], { type: 'text/html' });
  triggerDownload(blob, `${board.name || 'canvas'}.html`);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function generateThumbnail(fabricCanvas) {
  try {
    return fabricCanvas.toDataURL({ format: 'jpeg', quality: 0.4, multiplier: 0.15 });
  } catch {
    try {
      return fabricCanvas.toDataURL('jpeg');
    } catch {
      return null;
    }
  }
}
