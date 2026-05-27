import { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import TitleScreen from './components/TitleScreen';
import SongSelectScreen from './components/SongSelectScreen';
import GameScreen from './components/GameScreen';
import ResultScreen from './components/ResultScreen';
import CollectionScreen from './components/CollectionScreen';
import { soundManager } from './audio/SoundManager';

export type ScreenType = 'splash' | 'title' | 'select' | 'game' | 'result' | 'collection';

interface GameResult {
  score: number; maxCombo: number; perfectCount: number;
  greatCount: number; goodCount: number; missCount: number; cleared: boolean;
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('splash');
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [lastResult, setLastResult] = useState<GameResult>({
    score: 0, maxCombo: 0, perfectCount: 0, greatCount: 0,
    goodCount: 0, missCount: 0, cleared: false
  });
  const [transitioning, setTransitioning] = useState(false);
  const [nextScreen, setNextScreen] = useState<ScreenType | null>(null);

  // Transition handler
  const transitionTo = (screen: ScreenType) => {
    setTransitioning(true);
    setNextScreen(screen);
  };

  useEffect(() => {
    if (!transitioning || !nextScreen) return;
    const t = setTimeout(() => {
      setCurrentScreen(nextScreen);
      setNextScreen(null);
      // Fade out transition
      setTimeout(() => setTransitioning(false), 600);
    }, 750);
    return () => clearTimeout(t);
  }, [transitioning, nextScreen]);

  // Handle BGM changes based on screen
  useEffect(() => {
    if (currentScreen === 'title' || currentScreen === 'select' || currentScreen === 'result') {
      soundManager.startTitleBGM();
    } else if (currentScreen === 'game') {
      // GameScreen handles its own BGM start after countdown
      soundManager.stopBGM(); 
    }
  }, [currentScreen]);

  const handleGlobalClick = () => {
    soundManager.init();
  };

  return (
    <div 
      onClick={handleGlobalClick}
      style={{
      width: '100%', height: '100%',
      position: 'relative', overflow: 'hidden',
      background: '#f0f0f5'
    }}>
      {currentScreen === 'splash' && (
        <SplashScreen onFinish={() => transitionTo('title')} />
      )}

      {currentScreen === 'title' && (
        <TitleScreen
          onStart={() => transitionTo('select')}
          onCollection={() => transitionTo('collection')}
        />
      )}

      {currentScreen === 'collection' && (
        <CollectionScreen onBack={() => transitionTo('title')} />
      )}

      {currentScreen === 'select' && (
        <SongSelectScreen
          onSelect={(_song, level) => {
            setSelectedLevel(level);
            transitionTo('game');
          }}
          onBack={() => setCurrentScreen('title')}
        />
      )}

      {currentScreen === 'game' && (
        <GameScreen
          level={selectedLevel}
          onFinish={(result) => {
            setLastResult(result);
            transitionTo('result');
          }}
          onExit={() => {
            soundManager.playClick();
            transitionTo('select');
          }}
        />
      )}

      {currentScreen === 'result' && (
        <ResultScreen
          result={lastResult}
          level={selectedLevel}
          onNext={() => transitionTo('select')}
          onTitle={() => setCurrentScreen('title')}
        />
      )}

      {/* ===== CYBER TRANSITION OVERLAY ===== */}
      {transitioning && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 200,
          pointerEvents: 'all',
          animation: nextScreen ? 'cyberTransIn 0.75s ease forwards' : 'cyberTransOut 0.6s ease forwards'
        }}>
          {/* Scan lines */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(233,30,140,0.9) 0%, rgba(123,47,242,0.95) 50%, rgba(0,229,255,0.9) 100%)',
          }} />
          {/* Horizontal bars */}
          {[0.15, 0.35, 0.55, 0.75].map((pos, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: `${pos * 100}%`,
              left: 0, right: 0,
              height: '2px',
              background: 'rgba(255,255,255,0.6)',
              animation: `scanLine 0.45s ease ${i * 0.075}s both`,
              boxShadow: '0 0 10px rgba(255,255,255,0.4)'
            }} />
          ))}
          {/* Center text */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{
              fontFamily: "'Orbitron'", fontWeight: 900, fontSize: '1.2rem',
              color: '#fff', letterSpacing: '0.3em',
              textShadow: '0 0 20px rgba(255,255,255,0.5)',
              animation: 'popIn 0.45s ease 0.15s both'
            }}>
              {nextScreen === 'game' ? 'LOADING...' : nextScreen === 'result' ? 'STAGE END' : ''}
            </span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes cyberTransIn {
          0% { clip-path: inset(50% 0 50% 0); opacity: 0; }
          100% { clip-path: inset(0 0 0 0); opacity: 1; }
        }
        @keyframes cyberTransOut {
          0% { clip-path: inset(0 0 0 0); opacity: 1; }
          100% { clip-path: inset(50% 0 50% 0); opacity: 0; }
        }
        @keyframes scanLine {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}

export default App;
