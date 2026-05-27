import React, { useState } from 'react';
import { CHARACTERS, type CharacterDef } from '../constants/characters';
import { useCollection } from '../hooks/useCollection';
import { soundManager } from '../audio/SoundManager';

interface Props {
  onBack: () => void;
}

const CollectionScreen: React.FC<Props> = ({ onBack }) => {
  const { hasCharacter, getGetCount } = useCollection();
  const [selectedChar, setSelectedChar] = useState<CharacterDef | null>(null);

  const handleBack = () => {
    soundManager.playClick();
    onBack();
  };

  return (
    <div className="screen" style={{
      background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Cyber Grid Background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0,229,255,0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,229,255,0.1) 1px, transparent 1px)
        `,
        backgroundSize: '30px 30px',
        animation: 'gridScroll 10s linear infinite',
        opacity: 0.5,
        pointerEvents: 'none'
      }} />

      {/* Header */}
      <div style={{
        padding: '20px',
        background: 'rgba(0,0,0,0.4)',
        borderBottom: '2px solid rgba(0,229,255,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10
      }}>
        <div style={{
          fontFamily: "'Orbitron'",
          fontSize: '1.5rem',
          fontWeight: 900,
          color: '#00e5ff',
          textShadow: '0 0 10px rgba(0,229,255,0.5)'
        }}>
          COLLECTION
        </div>
        <button className="btn btn-secondary" onClick={handleBack} style={{ padding: '6px 16px', fontSize: '0.9rem' }}>
          BACK
        </button>
      </div>

      {/* Grid Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        zIndex: 10
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: '16px'
        }}>
          {CHARACTERS.map(char => {
            const unlocked = hasCharacter(char.id);
            return (
              <div key={char.id} style={{
                background: unlocked ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.1)',
                border: unlocked ? '2px solid #e91e8c' : '2px solid rgba(255,255,255,0.2)',
                borderRadius: '12px',
                padding: '12px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: unlocked ? '0 0 15px rgba(233,30,140,0.3)' : 'none',
                transition: 'transform 0.2s',
                cursor: unlocked ? 'pointer' : 'default'
              }}
              onPointerDown={e => {
                if (unlocked) e.currentTarget.style.transform = 'scale(0.95)';
              }}
              onPointerUp={e => {
                if (unlocked) e.currentTarget.style.transform = 'scale(1)';
              }}
              onPointerLeave={e => {
                if (unlocked) e.currentTarget.style.transform = 'scale(1)';
              }}
              onClick={() => {
                if (unlocked) {
                  soundManager.playClick();
                  setSelectedChar(char);
                }
              }}
              >
                <div style={{
                  width: '60px', height: '60px',
                  marginBottom: '8px',
                  display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                  {unlocked ? (
                    <img
                      src={`/assets/characters/${char.file}`}
                      alt={char.name}
                      style={{
                        maxWidth: '100%', maxHeight: '100%',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))',
                        transition: 'all 0.3s'
                      }}
                    />
                  ) : (
                    <div style={{
                      fontSize: '2.5rem',
                      color: 'rgba(255,255,255,0.2)',
                      fontFamily: "'Orbitron'",
                      fontWeight: 900
                    }}>
                      ?
                    </div>
                  )}
                </div>
                <div style={{
                  fontFamily: "'Orbitron'",
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: unlocked ? '#333' : 'rgba(255,255,255,0.4)',
                  textAlign: 'center',
                  width: '100%',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {unlocked ? char.name : '???'}
                </div>
                {unlocked && (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '4px', gap: '2px'
                  }}>
                    <div style={{
                      fontSize: '0.65rem',
                      color: char.rarity === 'SSR' ? '#ff1744' : char.rarity === 'SR' ? '#ffab00' : char.rarity === 'R' ? '#7b2ff2' : '#888',
                      fontWeight: 900
                    }}>
                      {char.rarity}
                    </div>
                    <div style={{
                      fontSize: '0.6rem',
                      color: 'var(--color-primary)',
                      fontFamily: "'Orbitron'",
                      fontWeight: 800
                    }}>
                      GET: {getGetCount(char.id)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedChar && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.3s ease',
          cursor: 'pointer'
        }} onClick={() => {
          soundManager.playClick();
          setSelectedChar(null);
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(233,30,140,0.2), rgba(0,229,255,0.2))',
            border: '2px solid rgba(0,229,255,0.6)',
            borderRadius: '24px', padding: '32px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            boxShadow: '0 0 40px rgba(0,229,255,0.4)',
            animation: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
            <div style={{
              width: '200px', height: '200px',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              background: 'rgba(255,255,255,0.9)',
              borderRadius: '50%',
              boxShadow: '0 0 30px rgba(255,255,255,0.5)',
              marginBottom: '24px'
            }}>
              <img
                src={`/assets/characters/${selectedChar.file}`}
                alt={selectedChar.name}
                style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
              />
            </div>
            <div style={{ color: '#fff', fontSize: '2rem', fontWeight: 900, fontFamily: "'Orbitron'", marginBottom: '8px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
              {selectedChar.name}
            </div>
            <div style={{ fontSize: '1.2rem', color: '#ff1744', fontWeight: 900 }}>
              RARITY: {selectedChar.rarity}
            </div>
            <div style={{
              fontSize: '1rem', color: '#00e5ff',
              fontFamily: "'Orbitron'",
              fontWeight: 800,
              marginTop: '10px',
              textShadow: '0 0 10px rgba(0,229,255,0.4)'
            }}>
              GET COUNT: {getGetCount(selectedChar.id)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionScreen;
