import { useRef, useState } from 'react';
import { ComingSoonBadge } from './ModalBase';

const FAKE_SONGS = [
  { id: 1, title: 'Gentle Afternoon', artist: 'Lo-Fi Collective', mood: 'Calm', duration: '3:24' },
  { id: 2, title: 'Summer Breeze', artist: 'Pixel Soundscapes', mood: 'Happy', duration: '2:58' },
  { id: 3, title: 'Fading Photographs', artist: 'Ambient Waves', mood: 'Nostalgic', duration: '4:12' },
  { id: 4, title: 'City Rush', artist: 'Urban Beats Studio', mood: 'Energetic', duration: '3:45' },
];
const MOODS = ['Calm', 'Happy', 'Nostalgic', 'Energetic'];
const MOOD_ICONS = { Calm: '🌊', Happy: '☀️', Nostalgic: '🍂', Energetic: '⚡' };

export default function MusicPanel({ track, isPlaying, audioEl, onTrackChange, onClose }) {
  const fileInputRef = useRef(null);
  const [activeMood, setActiveMood] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onTrackChange({ name: file.name.replace(/\.[^.]+$/, ''), url, source: 'upload' });
    e.target.value = '';
  };

  const togglePlay = () => {
    if (!audioEl) return;
    isPlaying ? audioEl.pause() : audioEl.play().catch(() => {});
  };

  return (
    <div className="music-panel">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🎵</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>Music</span>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 16 }}>✕</button>
      </div>

      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 440, overflowY: 'auto' }}>

        {/* ── Now Playing ── */}
        {track ? (
          <div style={{ background: 'rgba(0,180,216,0.08)', border: '1px solid rgba(0,180,216,0.25)', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Now Playing</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 28 }}>{isPlaying ? '🎵' : '⏸️'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.name}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>{track.source === 'upload' ? 'Uploaded file' : 'Free library'}</div>
              </div>
              <button
                onClick={togglePlay}
                style={{ background: isPlaying ? 'rgba(0,180,216,0.15)' : 'var(--color-primary)', border: '1px solid var(--color-primary)', borderRadius: 8, color: isPlaying ? 'var(--color-primary)' : '#0A1628', padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
            </div>
            {audioEl && (
              <audio
                ref={(el) => { if (el) { el.src = track.url; } }}
                loop
                style={{ display: 'none' }}
              />
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '10px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>
            No track loaded — add music below
          </div>
        )}

        {/* ── Upload section ── */}
        <div>
          <div className="field-label" style={{ marginBottom: 8 }}>Upload Your Own Music</div>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ width: '100%', padding: '10px 14px', background: 'var(--color-surface2)', border: '1px dashed var(--color-border)', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'border-color 0.15s' }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
          >
            <span style={{ fontSize: 22 }}>📂</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: 'var(--color-text)', fontSize: 13, fontWeight: 600 }}>Browse files</div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>MP3, WAV, OGG, M4A supported</div>
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={handleFileUpload} />
        </div>

        <div style={{ height: 1, background: 'var(--color-border)' }} />

        {/* ── Mood filter placeholder ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="field-label">Search by Mood</span>
            <ComingSoonBadge />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {MOODS.map((m) => (
              <button
                key={m}
                disabled
                onClick={() => setActiveMood(m)}
                style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  border: `1px solid ${activeMood === m ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: activeMood === m ? 'rgba(0,180,216,0.12)' : 'transparent',
                  color: activeMood === m ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  cursor: 'not-allowed', opacity: 0.55,
                }}
              >
                {MOOD_ICONS[m]} {m}
              </button>
            ))}
          </div>
        </div>

        {/* ── Free library placeholder ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="field-label">Free Music Library</span>
            <ComingSoonBadge />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {FAKE_SONGS.map((song) => (
              <div
                key={song.id}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--color-surface2)', border: '1px solid var(--color-border)', opacity: 0.6 }}
              >
                <span style={{ fontSize: 16 }}>🎵</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{song.artist} · {MOOD_ICONS[song.mood]} {song.mood}</div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>{song.duration}</span>
                <button disabled style={{ background: 'rgba(0,180,216,0.1)', border: '1px solid rgba(0,180,216,0.3)', borderRadius: 6, color: 'var(--color-primary)', padding: '3px 8px', cursor: 'not-allowed', fontSize: 11, fontWeight: 600 }}>▶</button>
              </div>
            ))}
            <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--color-text-muted)', padding: '4px 0' }}>
              Powered by Pixabay Audio API · Integration coming soon
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
