import React, { useEffect, useRef } from 'react';
import { soundManager } from '../audio/SoundManager';

interface Props {
  onStart: () => void;
  onCollection: () => void;
}

const TitleScreen: React.FC<Props> = ({ onStart, onCollection }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Background particle effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    const particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number; color: string }[] = [];
    const colors = ['#e91e8c', '#7b2ff2', '#00e5ff', '#ff6ec7'];

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -Math.random() * 0.6 - 0.2,
        r: Math.random() * 3 + 1,
        alpha: Math.random() * 0.6 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) { p.y = canvas.offsetHeight + 10; p.x = Math.random() * canvas.offsetWidth; }
        if (p.x < -10) p.x = canvas.offsetWidth + 10;
        if (p.x > canvas.offsetWidth + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        grad.addColorStop(0, p.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.globalAlpha = p.alpha * 0.3;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="screen" style={{
      background: `url('./assets/title_bg.png') center/cover`,
      position: 'relative'
    }}>
      {/* Particle canvas overlay */}
      <canvas ref={canvasRef} style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 1
      }} />

      {/* Semi-transparent overlay for readability */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.6) 40%, rgba(255,255,255,0.4) 100%)',
        zIndex: 2
      }} />

      {/* Top gradient bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '4px', zIndex: 10,
        background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent), var(--color-secondary))'
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 5,
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '24px'
      }}>
        {/* Logo card */}
        <div style={{
          textAlign: 'center', width: '100%', maxWidth: '340px',
          padding: '40px 28px',
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '2px solid rgba(233,30,140,0.2)',
          boxShadow: '0 0 40px rgba(233,30,140,0.15), 0 8px 32px rgba(0,0,0,0.06)',
          animation: 'fadeInScale 0.6s ease'
        }}>
          {/* Gelpiyo character */}
          <div style={{
            marginBottom: '12px',
            animation: 'floatUp 3s ease-in-out infinite alternate',
            animationName: 'none'
          }}>
            <img
              src="./assets/characters/gelpiyo.png"
              alt="Gelpiyo"
              style={{
                width: 'auto', height: '120px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 6px 20px rgba(233,30,140,0.35))',
                animation: 'floatBounce 2s ease-in-out infinite'
              }}
            />
          </div>

          <h1 className="text-gradient" style={{ fontSize: '2.2rem', marginBottom: '0', lineHeight: 1 }}>
            GELPIYO
          </h1>
          <h2 style={{
            fontSize: '3rem', lineHeight: 1, marginBottom: '8px',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
          }}>
            BEAT
          </h2>

          <div className="iidx-bar" />

          <p style={{
            marginBottom: '28px', color: 'var(--color-text-muted)',
            fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.08em',
            fontFamily: "'Orbitron', sans-serif"
          }}>
            PHYSICS × RHYTHM
          </p>

          <button
            className="btn btn-primary"
            style={{ 
              width: '100%', marginBottom: '12px', padding: '16px', fontSize: '1.05rem',
              animation: 'pulseGlow 2s infinite' 
            }}
            onMouseEnter={() => soundManager.playHover()}
            onClick={() => {
              soundManager.playClick();
              onStart();
            }}
          >
            ▶ GAME START
          </button>

          <button className="btn btn-secondary" style={{
            width: '100%', padding: '13px', fontSize: '0.9rem'
          }}
          onMouseEnter={() => soundManager.playHover()}
          onClick={() => {
            soundManager.playClick();
            onCollection();
          }}>
            ◆ COLLECTION
          </button>
        </div>
      </div>

      {/* Bottom gradient bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', zIndex: 10,
        background: 'linear-gradient(90deg, var(--color-secondary), var(--color-accent), var(--color-primary))'
      }} />

      <style>{`
        @keyframes floatBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
};

export default TitleScreen;
