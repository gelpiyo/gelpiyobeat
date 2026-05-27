import React, { useEffect, useState } from 'react';

interface Props {
  onFinish: () => void;
}

const SplashScreen: React.FC<Props> = ({ onFinish }) => {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // We no longer auto-transition. Wait for user tap to initialize AudioContext.
  }, []);

  return (
    <div className="screen" style={{
      background: '#0a0a0f', // Dark cyber background
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: fadingOut ? 0 : 1,
      transition: 'opacity 0.8s ease-in-out',
      zIndex: 999
    }} onClick={() => {
      if (!fadingOut) {
        setFadingOut(true);
        setTimeout(onFinish, 800);
      }
    }}>
      <div style={{
        textAlign: 'center',
        animation: 'popIn 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      }}>
        <div style={{
          fontFamily: "'Orbitron', sans-serif",
          fontWeight: 900,
          fontSize: '3.5rem',
          letterSpacing: '0.15em',
          background: 'linear-gradient(135deg, var(--color-primary), #00e5ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 0 15px rgba(233,30,140,0.5))',
          lineHeight: 1.1,
          marginBottom: '8px'
        }}>
          GELPIYO
          <br />
          BEAT
        </div>
        <div style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '0.9rem',
          color: '#ffffff',
          letterSpacing: '0.3em',
          opacity: 0.6
        }}>
          CYBER RHYTHM ACTION
        </div>
        
        <div style={{
          marginTop: '40px',
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '1.2rem',
          color: '#e91e8c',
          letterSpacing: '0.2em',
          animation: 'pulseGlow 1.5s infinite'
        }}>
          - TAP TO START -
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
