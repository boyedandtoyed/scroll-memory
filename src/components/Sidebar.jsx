import { useState } from 'react';
import { renameBoard, deleteBoard } from '../utils/saveLoad';

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Sidebar({ boards, activeBoardId, onSelect, onNew, onBoardsChange }) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  const startRename = (board, e) => {
    e.stopPropagation();
    setEditingId(board.id);
    setEditName(board.name);
  };

  const commitRename = (id) => {
    const name = editName.trim() || 'Untitled';
    renameBoard(id, name);
    onBoardsChange();
    setEditingId(null);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const confirmDelete = (id) => {
    deleteBoard(id);
    onBoardsChange();
    setConfirmDeleteId(null);
    if (activeBoardId === id) {
      const remaining = boards.filter((b) => b.id !== id);
      if (remaining.length) onSelect(remaining[0].id);
    }
  };

  if (collapsed) {
    return (
      <aside
        style={{
          width: 32,
          background: 'var(--color-surface)',
          borderLeft: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '12px 0',
          flexShrink: 0,
          cursor: 'pointer',
        }}
        onClick={() => setCollapsed(false)}
        title="Expand sidebar"
      >
        <span style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>◀</span>
      </aside>
    );
  }

  return (
    <aside
      style={{
        width: 220,
        background: 'var(--color-surface)',
        borderLeft: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 14px 10px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '0.04em' }}>CANVASES</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={onNew}
            title="New canvas"
            style={{
              background: 'rgba(0,180,216,0.12)',
              border: '1px solid var(--color-primary)',
              borderRadius: 6,
              color: 'var(--color-primary)',
              cursor: 'pointer',
              fontSize: 14,
              padding: '2px 8px',
              fontWeight: 700,
              lineHeight: 1.5,
            }}
          >
            +
          </button>
          <button
            onClick={() => setCollapsed(true)}
            title="Collapse"
            style={{
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              fontSize: 12,
              padding: '2px 6px',
            }}
          >
            ▶
          </button>
        </div>
      </div>

      {/* Board list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
        {boards.length === 0 && (
          <div style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', marginTop: 24, lineHeight: 1.6 }}>
            No canvases yet.<br />
            <button onClick={onNew} style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: 13 }}>
              Create one
            </button>
          </div>
        )}

        {boards.map((board) => (
          <div
            key={board.id}
            className={`sidebar-item${board.id === activeBoardId ? ' active' : ''}`}
            onClick={() => onSelect(board.id)}
            style={{ marginBottom: 4 }}
          >
            {/* Thumbnail */}
            {board.thumbnail && (
              <div style={{ marginBottom: 6, borderRadius: 6, overflow: 'hidden', height: 56, background: '#0A1628' }}>
                <img src={board.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            {!board.thumbnail && (
              <div style={{ marginBottom: 6, borderRadius: 6, height: 40, background: 'var(--color-surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 18 }}>🎨</span>
              </div>
            )}

            {/* Name */}
            {editingId === board.id ? (
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => commitRename(board.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename(board.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: 'var(--color-surface2)',
                  border: '1px solid var(--color-primary)',
                  borderRadius: 4,
                  color: 'var(--color-text)',
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '2px 6px',
                  width: '100%',
                  outline: 'none',
                }}
              />
            ) : (
              <div
                style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                onDoubleClick={(e) => startRename(board, e)}
                title="Double-click to rename"
              >
                {board.name}
              </div>
            )}

            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{formatDate(board.updatedAt)}</div>

            {/* Actions row */}
            <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
              <button
                onClick={(e) => startRename(board, e)}
                title="Rename"
                style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 4, color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 11, padding: '1px 6px', flex: 1 }}
              >
                Rename
              </button>
              {confirmDeleteId === board.id ? (
                <button
                  onClick={(e) => { e.stopPropagation(); confirmDelete(board.id); }}
                  title="Confirm delete"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', borderRadius: 4, color: '#ef4444', cursor: 'pointer', fontSize: 11, padding: '1px 6px', flex: 1 }}
                >
                  Confirm
                </button>
              ) : (
                <button
                  onClick={(e) => handleDelete(board.id, e)}
                  title="Delete"
                  style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 4, color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 11, padding: '1px 6px', flex: 1 }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)', fontSize: 11, color: 'var(--color-text-muted)' }}>
        {boards.length} canvas{boards.length !== 1 ? 'es' : ''} · Auto-saves every 30s
      </div>
    </aside>
  );
}
