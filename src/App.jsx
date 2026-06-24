import { useRef, useState, useEffect, useCallback } from 'react';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import MediaImportModal from './components/MediaImportModal';
import GroupingModal from './components/GroupingModal';
import VideoTrimModal from './components/VideoTrimModal';
import SlideshowModal from './components/SlideshowModal';
import MusicPanel from './components/MusicPanel';
import {
  listBoards, createBoard, loadBoard,
  getActiveId, setActiveId,
  exportBoardJSON, exportBoardHTML, importBoardJSON,
} from './utils/saveLoad';

export default function App() {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);

  // Board state
  const [boards, setBoards] = useState([]);
  const [activeBoardId, setActiveBoardId] = useState(null);
  const [activeBoard, setActiveBoard] = useState(null);

  // UI modals
  const [showMediaImport, setShowMediaImport] = useState(false);
  const [groupingFiles, setGroupingFiles] = useState(null);   // File[] | null
  const [videoQueue, setVideoQueue] = useState([]);           // File[] waiting for trim
  const [trimFile, setTrimFile] = useState(null);            // current File in trim modal
  const [showSlideshow, setShowSlideshow] = useState(false);
  const [showMusicPanel, setShowMusicPanel] = useState(false);

  // Music state
  const [currentTrack, setCurrentTrack] = useState(null);    // { name, url, source }
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);

  // Notifications
  const [notification, setNotification] = useState(null);

  // ── Board management ──────────────────────────────────────────────────────

  const refreshBoards = useCallback(() => {
    const all = listBoards();
    setBoards(all);
    return all;
  }, []);

  const selectBoard = useCallback((id) => {
    const board = loadBoard(id);
    if (!board) return;
    setActiveBoardId(id);
    setActiveBoard(board);
    setActiveId(id);
    refreshBoards();
  }, [refreshBoards]);

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

  // ── File export / import ──────────────────────────────────────────────────

  const handleExportJSON = useCallback(() => {
    if (!activeBoard) return;
    const fc = canvasRef.current?.getFabric();
    const json = fc ? fc.toJSON(['id', 'name', '__uid']) : activeBoard.canvasJSON;
    exportBoardJSON(activeBoard, json);
    notify('Exported as JSON');
  }, [activeBoard]);

  const handleExportHTML = useCallback(() => {
    if (!activeBoard) return;
    const fc = canvasRef.current?.getFabric();
    const json = fc ? fc.toJSON(['id', 'name', '__uid']) : activeBoard.canvasJSON;
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

  // ── Media import flow ─────────────────────────────────────────────────────

  const handlePlaceDirect = useCallback((files) => {
    const images = files.filter((f) => f.type.startsWith('image/'));
    const videos = files.filter((f) => f.type.startsWith('video/'));

    // Place images immediately
    images.forEach((f) => canvasRef.current?.addImageFile(f));

    // Queue videos through trim modal
    if (videos.length > 0) {
      setVideoQueue(videos.slice(1));
      setTrimFile(videos[0]);
    }
  }, []);

  const handleCreateGroup = useCallback((files) => {
    setGroupingFiles(files);
  }, []);

  // Video trim: user confirmed trim → add to canvas, process queue
  const handleTrimDone = useCallback((file, trimStart, trimEnd, url) => {
    canvasRef.current?.addVideoFile(url, trimStart, trimEnd);
    setTrimFile(null);
    // Process next video in queue
    setVideoQueue((q) => {
      if (q.length > 0) {
        setTrimFile(q[0]);
        return q.slice(1);
      }
      return [];
    });
  }, []);

  // Video trim: user skipped trim
  const handleTrimSkip = useCallback((file, _s, _e, url) => {
    canvasRef.current?.addVideoFile(url, 0, null);
    setTrimFile(null);
    setVideoQueue((q) => {
      if (q.length > 0) {
        setTrimFile(q[0]);
        return q.slice(1);
      }
      return [];
    });
  }, []);

  // After grouping modal creates group
  const handleGroupDone = useCallback(() => {
    setGroupingFiles(null);
    notify('Group created on canvas');
    refreshBoards();
  }, [refreshBoards]);

  // ── Music ─────────────────────────────────────────────────────────────────

  const handleTrackChange = useCallback((track) => {
    setCurrentTrack(track);
    setIsPlayingMusic(false);
    if (audioRef.current) {
      audioRef.current.src = track.url;
      audioRef.current.currentTime = 0;
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setIsPlayingMusic(true);
    const onPause = () => setIsPlayingMusic(false);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    return () => { audio.removeEventListener('play', onPlay); audio.removeEventListener('pause', onPause); };
  }, []);

  // ── Notifications ─────────────────────────────────────────────────────────

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type, id: Date.now() });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--color-bg)' }}>
      {/* ── Audio element (singleton for music playback) ── */}
      <audio ref={audioRef} loop style={{ display: 'none' }} />

      {/* ── Top bar ── */}
      <header style={{ height: 44, background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0, zIndex: 30 }}>
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

        {/* Music now-playing indicator */}
        {currentTrack && (
          <>
            <div style={{ width: 1, height: 20, background: 'var(--color-border)' }} />
            <div
              onClick={() => setShowMusicPanel((v) => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '3px 8px', borderRadius: 6, background: isPlayingMusic ? 'rgba(82,217,160,0.1)' : 'transparent', border: `1px solid ${isPlayingMusic ? '#52D9A0' : 'transparent'}`, transition: 'all 0.2s' }}
            >
              <span style={{ fontSize: 13 }}>{isPlayingMusic ? '🎵' : '⏸'}</span>
              <span style={{ fontSize: 12, color: isPlayingMusic ? '#52D9A0' : 'var(--color-text-muted)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                {currentTrack.name}
              </span>
            </div>
          </>
        )}

        <div style={{ flex: 1 }} />

        {/* Keyboard hints */}
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', gap: 8, alignItems: 'center' }}>
          {[['Alt+drag', 'pan'], ['Scroll', 'zoom'], ['Del', 'remove'], ['Ctrl+S', 'save']].map(([k, v]) => (
            <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <kbd style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>{k}</kbd>
              <span>{v}</span>
            </span>
          ))}
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <Toolbar
          canvasRef={canvasRef}
          board={activeBoard}
          onImportMedia={() => setShowMediaImport(true)}
          onExportJSON={handleExportJSON}
          onExportHTML={handleExportHTML}
          onImportJSON={handleImportJSON}
          onSlideshow={() => setShowSlideshow(true)}
          onToggleMusic={() => setShowMusicPanel((v) => !v)}
          musicActive={showMusicPanel}
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

        {/* Music panel (floating) */}
        {showMusicPanel && (
          <MusicPanel
            track={currentTrack}
            isPlaying={isPlayingMusic}
            audioEl={audioRef.current}
            onTrackChange={handleTrackChange}
            onClose={() => setShowMusicPanel(false)}
          />
        )}
      </div>

      {/* ── Modals ── */}

      {showMediaImport && (
        <MediaImportModal
          onClose={() => setShowMediaImport(false)}
          onPlaceDirect={handlePlaceDirect}
          onCreateGroup={(files) => { handleCreateGroup(files); setShowMediaImport(false); }}
        />
      )}

      {groupingFiles && (
        <GroupingModal
          files={groupingFiles}
          canvasRef={canvasRef}
          onClose={() => setGroupingFiles(null)}
          onDone={handleGroupDone}
        />
      )}

      {trimFile && (
        <VideoTrimModal
          file={trimFile}
          onPlace={handleTrimDone}
          onCancel={handleTrimSkip}
        />
      )}

      {showSlideshow && (
        <SlideshowModal
          canvasRef={canvasRef}
          audioEl={audioRef.current}
          onClose={() => setShowSlideshow(false)}
        />
      )}

      {/* ── Toast notification ── */}
      {notification && (
        <div
          key={notification.id}
          className="save-toast"
          style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            background: notification.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(82,217,160,0.15)',
            border: `1px solid ${notification.type === 'error' ? '#ef4444' : '#52D9A0'}`,
            color: notification.type === 'error' ? '#ef4444' : '#52D9A0',
            borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600,
            zIndex: 9999, pointerEvents: 'none', whiteSpace: 'nowrap',
          }}
        >
          {notification.msg}
        </div>
      )}
    </div>
  );
}
