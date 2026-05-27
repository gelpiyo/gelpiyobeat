import React, { useState, useEffect } from 'react';
import { soundManager } from '../audio/SoundManager';

interface Props {
  onSelect: (song: string, level: number) => void;
  onBack: () => void;
}

interface Song {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  difficulty: string;
  level: number;
  color: string;
}

const SongSelectScreen: React.FC<Props> = ({ onSelect, onBack }) => {
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [activeSongId, setActiveSongId] = useState<string | null>(null);
  const [highscores, setHighscores] = useState<{ [key: string]: number }>({});

  const songs: Song[] = [
    { id: 'song1', title: 'TUTORIAL BEAT', artist: 'GELPIYO SOUND TEAM', bpm: 120, difficulty: 'EASY', level: 1, color: '#00e5ff' },
    { id: 'song2', title: 'TUTORIAL BEAT', artist: 'GELPIYO SOUND TEAM', bpm: 120, difficulty: 'NORMAL', level: 2, color: '#39ff14' },
    { id: 'song3', title: 'TUTORIAL BEAT', artist: 'GELPIYO SOUND TEAM', bpm: 120, difficulty: 'HYPER', level: 3, color: '#ffab00' },
    { id: 'song4', title: 'TUTORIAL BEAT', artist: 'GELPIYO SOUND TEAM', bpm: 120, difficulty: 'ANOTHER', level: 4, color: '#ff1744' },
    { id: 'song5', title: 'TUTORIAL BEAT', artist: 'GELPIYO SOUND TEAM', bpm: 120, difficulty: 'PIYO', level: 5, color: '#ff007f' }
  ];

  useEffect(() => {
    const scores: { [key: string]: number } = {};
    songs.forEach(song => {
      const saved = localStorage.getItem(`gelpiyobeat_highscore_${song.id}`);
      scores[song.id] = saved ? parseInt(saved, 10) : 0;
    });
    setHighscores(scores);
  }, []);

  const handleSongTap = (song: Song) => {
    soundManager.playClick();
    if (activeSongId === song.id) {
      // Second tap = open popup
      setSelectedSong(song);
    } else {
      // First tap = highlight
      setActiveSongId(song.id);
    }
  };

  return (
    <div className="screen" style={{
      background: 'linear-gradient(180deg, #f8f9ff 0%, #fef0f8 50%, #f0e8ff 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Dynamic Cyber Lights Background */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {/* Animated Cyber Grid */}
        <div style={{
          position: 'absolute', width: '200%', height: '200%', top: 0, left: '-50%',
          backgroundImage: `
            linear-gradient(rgba(233,30,140,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(233,30,140,0.15) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          transform: 'perspective(500px) rotateX(60deg)',
          transformOrigin: 'top center',
          animation: 'gridScroll 4s linear infinite',
          opacity: 0.8
        }} />

        {/* Glowing Orbs */}
        <div style={{
          position: 'absolute', width: '150%', height: '150%', top: '-25%', left: '-25%',
          background: 'radial-gradient(circle at 50% 50%, rgba(233,30,140,0.4) 0%, transparent 60%)',
          animation: 'spinSlow 15s linear infinite',
          mixBlendMode: 'screen'
        }} />
        <div style={{
          position: 'absolute', width: '150%', height: '150%', top: '-25%', left: '-25%',
          background: 'radial-gradient(circle at 30% 70%, rgba(0,229,255,0.4) 0%, transparent 50%)',
          animation: 'spinSlow 10s linear infinite reverse',
          mixBlendMode: 'screen'
        }} />
        <div style={{
          position: 'absolute', width: '100%', height: '100%', top: 0, left: 0,
          background: 'radial-gradient(circle at 80% 20%, rgba(123,47,242,0.4) 0%, transparent 50%)',
          animation: 'bgPulse 4s ease-in-out infinite',
          mixBlendMode: 'screen'
        }} />

        {/* Thick Scanlines */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.6) 3px, rgba(255,255,255,0.6) 6px)',
          animation: 'scrollBg 3s linear infinite',
          opacity: 0.4
        }} />
      </div>
      <style>{`
        @keyframes scrollBg {
          0% { transform: translateY(0); }
          100% { transform: translateY(6px); }
        }
        @keyframes gridScroll {
          0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
          100% { transform: perspective(500px) rotateX(60deg) translateY(40px); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        padding: '14px 16px',
        background: 'rgba(255,255,255,0.95)',
        borderBottom: '2px solid rgba(233,30,140,0.15)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0, zIndex: 5
      }}>
        <button className="btn btn-secondary" 
          onClick={() => { soundManager.playClick(); onBack(); }} 
          onMouseEnter={() => soundManager.playHover()}
          style={{ padding: '6px 16px', fontSize: '0.8rem' }}
        >◀ BACK</button>
        <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-dark)' }}>SELECT MUSIC</h2>
        <div style={{ width: '80px' }} />
      </div>

      {/* Gradient bar */}
      <div style={{
        height: '3px', flexShrink: 0,
        background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent), var(--color-secondary))'
      }} />

      {/* Stage instruction */}
      <div style={{
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0
      }}>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>曲をタップして選択</span>
      </div>

      {/* Song list */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '0 16px 16px',
        display: 'flex', flexDirection: 'column', gap: '10px'
      }}>
        {songs.map((song, index) => {
          const isActive = activeSongId === song.id;
          return (
            <div
              key={song.id}
              onMouseEnter={() => soundManager.playHover()}
              onClick={() => handleSongTap(song)}
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, rgba(233,30,140,0.08), rgba(123,47,242,0.06))'
                  : 'rgba(255,255,255,0.9)',
                borderTop: isActive ? '2px solid var(--color-primary)' : '1px solid rgba(233,30,140,0.12)',
                borderRight: isActive ? '2px solid var(--color-primary)' : '1px solid rgba(233,30,140,0.12)',
                borderBottom: isActive ? '2px solid var(--color-primary)' : '1px solid rgba(233,30,140,0.12)',
                borderLeft: `4px solid ${song.color}`,
                borderRadius: '10px',
                padding: isActive ? '18px 16px' : '14px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                transition: 'all 0.2s ease',
                transform: isActive ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isActive
                  ? '0 4px 24px rgba(233,30,140,0.15), 0 0 12px rgba(233,30,140,0.1)'
                  : '0 2px 6px rgba(0,0,0,0.04)',
                cursor: 'pointer',
                animation: `slideInRight 0.3s ease ${index * 0.1}s both`
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{
                    padding: '2px 8px', background: song.color, color: '#fff',
                    borderRadius: '3px', fontSize: '0.65rem',
                    fontFamily: "'Orbitron'", fontWeight: 700
                  }}>{song.difficulty}</span>
                  <span style={{
                    fontSize: '0.7rem', color: 'var(--color-text-muted)',
                    fontFamily: "'Orbitron'"
                  }}>Lv.{song.level} {'🐤'.repeat(song.level)}</span>
                  <span style={{
                    fontSize: '0.7rem', color: 'var(--color-text-muted)',
                    fontFamily: "'Orbitron'"
                  }}>BPM {song.bpm}</span>
                </div>
                <h3 style={{
                  margin: 0, fontSize: isActive ? '1.15rem' : '1.05rem',
                  color: 'var(--color-text-dark)',
                  fontFamily: "'Orbitron'",
                  transition: 'font-size 0.2s ease'
                }}>{song.title}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{song.artist}</span>
                  <span style={{
                    color: 'var(--color-primary)',
                    fontFamily: "'Orbitron'", fontSize: '0.75rem', fontWeight: 800,
                    textShadow: '0 0 8px rgba(233,30,140,0.1)'
                  }}>
                    HI: {highscores[song.id] ? highscores[song.id].toLocaleString() : '0'}
                  </span>
                </div>
              </div>

              {/* Play icon */}
              <div style={{
                width: isActive ? '50px' : '40px',
                height: isActive ? '50px' : '40px',
                background: isActive
                  ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))'
                  : 'rgba(233,30,140,0.1)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isActive ? '#fff' : 'var(--color-primary)',
                fontSize: isActive ? '1.2rem' : '0.9rem',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 4px 16px rgba(233,30,140,0.3)' : 'none',
                animation: isActive ? 'pulseGlow 1.5s infinite' : 'none'
              }}>
                ▶
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom bar */}
      <div style={{
        height: '3px', flexShrink: 0,
        background: 'linear-gradient(90deg, var(--color-secondary), var(--color-accent), var(--color-primary))'
      }} />

      {/* ===== POPUP when song is confirmed ===== */}
      {selectedSong && (
        <div className="popup-overlay" onClick={() => setSelectedSong(null)}>
          <div className="popup-card" onClick={(e) => e.stopPropagation()}>
            {/* Decorative top */}
            <div style={{
              height: '4px', borderRadius: '2px', marginBottom: '20px',
              background: `linear-gradient(90deg, ${selectedSong.color}, var(--color-primary), var(--color-accent))`
            }} />

            {/* Gelpiyo icon */}
            <img
              src="./assets/characters/gelpiyo.png" alt="Gelpiyo"
              style={{
                width: 'auto', height: '80px', objectFit: 'contain',
                filter: 'drop-shadow(0 4px 12px rgba(233,30,140,0.3))',
                marginBottom: '12px',
                animation: 'floatBounce 1.5s ease-in-out infinite'
              }}
            />

            {/* Song info */}
            <div style={{
              padding: '3px 14px', display: 'inline-block',
              background: selectedSong.color, color: '#fff', borderRadius: '4px',
              fontFamily: "'Orbitron'", fontSize: '0.7rem', fontWeight: 700,
              marginBottom: '8px'
            }}>{selectedSong.difficulty} Lv.{selectedSong.level} {'🐤'.repeat(selectedSong.level)}</div>

            <h2 style={{
              fontSize: '1.4rem', color: 'var(--color-text-dark)',
              marginBottom: '4px'
            }}>{selectedSong.title}</h2>

            <p style={{
              color: 'var(--color-text-muted)', fontSize: '0.85rem',
              marginBottom: '4px'
            }}>{selectedSong.artist}</p>

            <p style={{
              fontFamily: "'Orbitron'", fontSize: '0.8rem',
              color: 'var(--color-secondary)', fontWeight: 700, marginBottom: '4px'
            }}>BPM {selectedSong.bpm}</p>

            <p style={{
              fontFamily: "'Orbitron'", fontSize: '0.85rem',
              color: 'var(--color-primary)', fontWeight: 800, marginBottom: '20px',
              textShadow: '0 0 10px rgba(233,30,140,0.15)'
            }}>
              HI-SCORE: {highscores[selectedSong.id] ? highscores[selectedSong.id].toLocaleString() : '0'}
            </p>

            <div className="iidx-bar" />

            <button className="btn btn-primary" 
              onMouseEnter={() => soundManager.playHover()}
              onClick={() => {
                soundManager.playClick();
                onSelect(selectedSong.id, selectedSong.level);
              }} 
              style={{
                width: '100%', padding: '14px', fontSize: '1rem', marginTop: '12px',
                animation: 'pulseGlow 1.5s infinite'
              }}>
              ▶ PLAY START
            </button>

            <button className="btn btn-secondary" 
              onMouseEnter={() => soundManager.playHover()}
              onClick={() => {
                soundManager.playClick();
                setSelectedSong(null);
              }} 
              style={{
                width: '100%', padding: '10px', fontSize: '0.85rem', marginTop: '10px'
              }}>
              CANCEL
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes floatBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
};

export default SongSelectScreen;
