import { useRef, useState, useEffect, useCallback } from 'react';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import {
  listBoards,
  createBoard,
  loadBoard,
  getActiveId,
  setActiveId,
  exportBoardJSON,
  exportBoardHTML,
  importBoardJSON,
} from './utils/saveLoad';

export default function App() {
  const canvasRef = useRef(null);
  const [boards, setBoards] = useState([]);
  const [activeBoardId, setActiveBoardId] = useState(null);
  const [activeBoard, setActiveBoard] = useState(null);
  const [notification, setNotification] = useState(null);

  const refreshBoards = useCallback(() => {
    const all = listBoards();
    setBoards(all);
    return all;
  }, []);

  // Bootstrap: load or create first board
  useEffect(() => {
    let all = refreshBoards();
    let id = getActiveId();
    if (!id || !all.find((b) => b.id === id)) {
      if (all.length === 0) {
        const board = createBoard('My First Canvas');
        all = refreshBoards();
        id = board.id;
      } else {
        id = all[0].id;
      }
    }
    selectBoard(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectBoard = useCallback((id) => {
    const board = loadBoard(id);
    if (!board) return;
    setActiveBoardId(id);
    setActiveBoard(board);
    setActiveId(id);
    refreshBoards();
  }, [refreshBoards]);

  const handleNew = useCallback(() => {
    const board = createBoard('Untitled Canvas');
    refreshBoards();
    selectBoard(board.id);
    notify('New canvas created');
  }, [refreshBoards, selectBoard]);

  const handleSaved = useCallback(() => {
    refreshBoards();
    const board = loadBoard(activeBoardId);
    if (board) setActiveBoard(board);
  }, [activeBoardId, refreshBoards]);

  const handleExportJSON = useCallback(() => {
    if (!activeBoard) return;
    const fc = canvasRef.current?.getFabric();
    const json = fc ? fc.toJSON(['id', 'name']) : activeBoard.canvasJSON;
    exportBoardJSON(activeBoard, json);
    notify('Exported as JSON');
  }, [activeBoard]);

  const handleExportHTML = useCallback(() => {
    if (!activeBoard) return;
    const fc = canvasRef.current?.getFabric();
    const json = fc ? fc.toJSON(['id', 'name']) : activeBoard.canvasJSON;
    exportBoardHTML(activeBoard, json);
    notify('Exported as standalone HTML');
  }, [activeBoard]);

  const handleImportJSON = useCallback(async (file) => {
    try {
      const board = await importBoardJSON(file);
      refreshBoards();
      selectBoard(board.id);
      notify(`Imported "${board.name}"`);
    } catch (err) {
      notify(`Import failed: ${err.message}`, 'error');
    }
  }, [refreshBoards, selectBoard]);

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type, id: Date.now() });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--color-bg)' }}>
      {/* Top bar */}
      <header
        style={{
          height: 44,
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 12,
          flexShrink: 0,
          zIndex: 30,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🎨</span>
          <span style={{ fontWeight: 800, fontSize: 15, background: 'linear-gradient(90deg, #00B4D8, #52D9A0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>
            MemoryCanvas
          </span>
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--color-border)' }} />
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {activeBoard?.name || '—'}
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <kbd style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>Alt+drag</kbd>
          <span>pan</span>
          <kbd style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>Scroll</kbd>
          <span>zoom</span>
          <kbd style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>Del</kbd>
          <span>remove</span>
          <kbd style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>Ctrl+S</kbd>
          <span>save</span>
        </div>
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Toolbar
          canvasRef={canvasRef}
          board={activeBoard}
          onExportJSON={handleExportJSON}
          onExportHTML={handleExportHTML}
          onImportJSON={handleImportJSON}
        />

        {activeBoardId && (
          <Canvas
            key={activeBoardId}
            ref={canvasRef}
            boardId={activeBoardId}
            initialJSON={activeBoard?.canvasJSON}
            onSaved={handleSaved}
          />
        )}

        <Sidebar
          boards={boards}
          activeBoardId={activeBoardId}
          onSelect={selectBoard}
          onNew={handleNew}
          onBoardsChange={refreshBoards}
        />
      </div>

      {/* Toast notification */}
      {notification && (
        <div
          key={notification.id}
          className="save-toast"
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: notification.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(82,217,160,0.15)',
            border: `1px solid ${notification.type === 'error' ? '#ef4444' : '#52D9A0'}`,
            color: notification.type === 'error' ? '#ef4444' : '#52D9A0',
            borderRadius: 8,
            padding: '8px 18px',
            fontSize: 13,
            fontWeight: 600,
            zIndex: 999,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {notification.msg}
        </div>
      )}
    </div>
  );
}
