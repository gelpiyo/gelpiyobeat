import React, { useEffect, useRef, useState } from 'react';
import { CHARACTERS, type CharacterDef } from '../constants/characters';
import { useCollection } from '../hooks/useCollection';

interface GameResult {
  score: number; maxCombo: number; perfectCount: number;
  greatCount: number; goodCount: number; missCount: number; cleared: boolean;
}

interface Props {
  result: GameResult;
  level: number;
  onNext: () => void;
  onTitle: () => void;
}

const ResultScreen: React.FC<Props> = ({ result, level, onNext, onTitle }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [showCard, setShowCard] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [showBadge, setShowBadge] = useState(false);

  const { unlockCharacter } = useCollection();
  const [rewardChar, setRewardChar] = useState<CharacterDef | null>(null);
  const rollRef = useRef(false);
  const [ranking, setRanking] = useState<number[]>([]);
  const saveRankingRef = useRef(false);

  useEffect(() => {
    if (saveRankingRef.current) return;
    saveRankingRef.current = true;

    // 1. Update highscore
    const songId = `song${level}`;
    const currentHigh = localStorage.getItem(`gelpiyobeat_highscore_${songId}`);
    const currentHighVal = currentHigh ? parseInt(currentHigh, 10) : 0;
    if (result.score > currentHighVal) {
      localStorage.setItem(`gelpiyobeat_highscore_${songId}`, result.score.toString());
    }

    // 2. Save score to list and retrieve top 3
    const rankingKey = `gelpiyobeat_ranking_level_${level}`;
    const savedRanking = localStorage.getItem(rankingKey);
    let rankingList: number[] = savedRanking ? JSON.parse(savedRanking) : [];

    rankingList.push(result.score);
    rankingList.sort((a, b) => b - a);
    rankingList = rankingList.slice(0, 3);

    localStorage.setItem(rankingKey, JSON.stringify(rankingList));
    setRanking(rankingList);
  }, [level, result.score]);

  useEffect(() => {
    if (result.cleared && !rollRef.current) {
      rollRef.current = true;
      const char = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
      setRewardChar(char);
      // Let it take effect after a tiny delay so it feels like it unlocks now
      setTimeout(() => unlockCharacter(char.id), 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.cleared]);

  // Staggered reveal
  useEffect(() => {
    const t1 = setTimeout(() => setShowBadge(true), 300);
    const t2 = setTimeout(() => setShowCard(true), 700);
    const t3 = setTimeout(() => setShowStats(true), 1200);
    const t4 = setTimeout(() => setShowReward(true), 1600);
    const t5 = setTimeout(() => setShowButtons(true), 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, []);

  // Rolling score counter
  useEffect(() => {
    if (!showCard) return;
    let cur = 0;
    const target = result.score;
    const startTime = Date.now();
    const duration = 1500;
    let raf: number;
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease-out curve
      const eased = 1 - Math.pow(1 - progress, 3);
      cur = Math.floor(target * eased);
      setDisplayScore(cur);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [showCard, result.score]);

  // Celebration particles
  useEffect(() => {
    if (!result.cleared) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    const particles: { x: number; y: number; vx: number; vy: number; r: number; color: string; alpha: number; life: number; type: 'circle' | 'star' }[] = [];
    const colors = ['#e91e8c', '#7b2ff2', '#00e5ff', '#ff6ec7', '#39ff14', '#ffd700'];

    // Multiple bursts
    for (let burst = 0; burst < 3; burst++) {
      setTimeout(() => {
        const cx = canvas.offsetWidth * (0.2 + Math.random() * 0.6);
        const cy = canvas.offsetHeight * (0.2 + Math.random() * 0.4);
        for (let i = 0; i < 30; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1.5 + Math.random() * 5;
          particles.push({
            x: cx, y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1.5,
            r: 2 + Math.random() * 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: 1,
            life: 80 + Math.random() * 140,
            type: Math.random() > 0.5 ? 'star' : 'circle'
          });
        }
      }, burst * 400);
    }

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      let alive = false;
      for (const p of particles) {
        if (p.life <= 0) continue;
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04;
        p.life--;
        p.alpha = Math.max(0, p.life / 100);

        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        if (p.type === 'star') {
          // Draw star
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(Date.now() / 500 + p.r);
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const r1 = p.r, r2 = p.r * 0.4;
            ctx.lineTo(Math.cos((i * 4 * Math.PI) / 5) * r1, Math.sin((i * 4 * Math.PI) / 5) * r1);
            ctx.lineTo(Math.cos(((i * 4 + 2) * Math.PI) / 5) * r2, Math.sin(((i * 4 + 2) * Math.PI) / 5) * r2);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      if (alive || particles.length < 90) {
        animId = requestAnimationFrame(animate);
      }
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [result.cleared]);

  const totalNotes = result.perfectCount + result.greatCount + result.goodCount + result.missCount;
  const perfectRate = totalNotes > 0 ? Math.round((result.perfectCount / totalNotes) * 100) : 0;

  return (
    <div className="screen" style={{
      background: `url('./assets/title_bg.png') center/cover`,
      position: 'relative'
    }}>
      {/* White overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.5)' }} />

      {/* Particle canvas */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 3 }} />

      {/* Top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', zIndex: 10, background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent), var(--color-secondary))' }} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 5,
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '20px', overflow: 'hidden'
      }}>
        {/* CLEAR/FAIL Badge — appears first with big animation */}
        {showBadge && (
          <div style={{
            marginBottom: '16px',
            animation: 'badgeSlam 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            position: 'relative'
          }}>
            {/* Glow behind badge */}
            <div style={{
              position: 'absolute', inset: '-20px',
              background: result.cleared
                ? 'radial-gradient(ellipse, rgba(57,255,20,0.3), transparent 70%)'
                : 'radial-gradient(ellipse, rgba(255,23,68,0.3), transparent 70%)',
              animation: 'pulseGlow 1.5s infinite',
              borderRadius: '50%'
            }} />
            <div style={{
              position: 'relative',
              padding: '8px 24px',
              background: result.cleared
                ? 'linear-gradient(135deg, #39ff14, #00e676)'
                : 'linear-gradient(135deg, #ff1744, #ff5252)',
              color: '#fff', borderRadius: '8px',
              fontFamily: "'Orbitron'", fontSize: '1.2rem', fontWeight: 900,
              letterSpacing: '0.15em',
              boxShadow: result.cleared
                ? '0 0 30px rgba(57,255,20,0.4), 0 4px 20px rgba(0,0,0,0.1)'
                : '0 0 30px rgba(255,23,68,0.4), 0 4px 20px rgba(0,0,0,0.1)',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              {result.cleared ? '✦ STAGE CLEAR ✦' : '✗ FAILED ✗'}
            </div>
          </div>
        )}

        {/* Main card — slides up */}
        {showCard && (
          <div style={{
            textAlign: 'center', width: '100%', maxWidth: '340px',
            padding: '16px 20px',
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            border: '2px solid rgba(233,30,140,0.2)',
            boxShadow: '0 0 40px rgba(233,30,140,0.15), 0 8px 32px rgba(0,0,0,0.06)',
            animation: 'slideInUp 0.5s ease',
            position: 'relative', overflow: 'hidden'
          }}>
            {/* Scan lines */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(233,30,140,0.015) 2px, rgba(233,30,140,0.015) 4px)',
              pointerEvents: 'none'
            }} />

            <div className="iidx-bar" />

            {/* Score with rolling counter */}
            <div style={{ margin: '12px 0 16px' }}>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', fontFamily: "'Orbitron'", marginBottom: '4px', letterSpacing: '0.1em' }}>TOTAL SCORE</p>
              <p className="text-gradient" style={{
                fontSize: '2.6rem', fontFamily: "'Orbitron'",
                fontWeight: 900, margin: 0, lineHeight: 1,
                transition: 'transform 0.1s',
                transform: displayScore === result.score ? 'scale(1.05)' : 'scale(1)'
              }}>
                {displayScore.toLocaleString()}
              </p>
            </div>

            {/* Stats grid */}
            {showStats && (
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
                marginBottom: '8px', animation: 'fadeIn 0.4s ease'
              }}>
                {[
                  { label: 'MAX COMBO', value: result.maxCombo, color: '#e91e8c', bg: 'rgba(233,30,140,0.06)' },
                  { label: 'PERFECT', value: `${perfectRate}%`, color: '#7b2ff2', bg: 'rgba(123,47,242,0.06)' },
                  { label: 'GREAT', value: result.greatCount, color: '#00b8d4', bg: 'rgba(0,229,255,0.06)' },
                  { label: 'GOOD', value: result.goodCount, color: '#ffab00', bg: 'rgba(255,171,0,0.06)' },
                ].map((stat, i) => (
                  <div key={stat.label} style={{
                    padding: '8px 10px', background: stat.bg,
                    borderRadius: '8px', border: `1px solid ${stat.color}20`,
                    animation: `popIn 0.3s ease ${i * 0.08}s both`,
                    cursor: 'pointer', transition: 'transform 0.1s'
                  }}
                  onPointerDown={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                  onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                  onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <div style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)', fontFamily: "'Orbitron'" }}>{stat.label}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: stat.color, fontFamily: "'Orbitron'" }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Ranking list (Top 3) */}
            {showStats && ranking.length > 0 && (
              <div style={{
                marginTop: '10px', marginBottom: '10px', padding: '10px 14px',
                background: 'rgba(123,47,242,0.04)',
                border: '1px dashed rgba(123,47,242,0.3)',
                borderRadius: '10px', textAlign: 'left',
                animation: 'fadeIn 0.5s ease 0.3s both'
              }}>
                <div style={{
                  fontSize: '0.65rem', color: 'var(--color-secondary)',
                  fontFamily: "'Orbitron'", fontWeight: 900, marginBottom: '6px',
                  letterSpacing: '0.08em', textAlign: 'center'
                }}>
                  🏆 LEVEL {level} RANKING (TOP 3)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {ranking.map((score, idx) => {
                    const isCurrent = score === result.score;
                    return (
                      <div key={idx} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        fontFamily: "'Orbitron'", fontSize: '0.8rem',
                        color: isCurrent ? 'var(--color-primary)' : 'var(--color-text-dark)',
                        fontWeight: isCurrent ? 950 : 500,
                        background: isCurrent ? 'rgba(233,30,140,0.08)' : 'transparent',
                        padding: '2px 6px', borderRadius: '4px',
                        border: isCurrent ? '1px solid rgba(233,30,140,0.2)' : 'none',
                        boxShadow: isCurrent ? '0 2px 8px rgba(233,30,140,0.1)' : 'none'
                      }}>
                        <span style={{ fontWeight: 800 }}>#{idx + 1}</span>
                        <span>{score.toLocaleString()} PTS</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="iidx-bar" />

            {/* Reward Box */}
            {showReward && result.cleared && rewardChar && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(233,30,140,0.1), rgba(0,229,255,0.1))',
                border: '2px solid rgba(0,229,255,0.4)',
                borderRadius: '12px', padding: '8px', margin: '8px 0',
                animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                display: 'flex', flexDirection: 'column', alignItems: 'center'
              }}>
                <div style={{ color: 'var(--color-primary)', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '4px' }}>★ CLEAR REWARD ★</div>
                <div style={{
                  width: '60px', height: '60px',
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  background: 'rgba(255,255,255,0.8)',
                  borderRadius: '50%',
                  boxShadow: '0 0 20px rgba(0,229,255,0.6)',
                  marginBottom: '4px'
                }}>
                  <img src={`./assets/characters/${rewardChar.file}`} alt={rewardChar.name} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
                </div>
                <div style={{ color: 'var(--color-text-dark)', fontSize: '1rem', fontWeight: 900, fontFamily: "'Orbitron'" }}>{rewardChar.name}</div>
                <div style={{ fontSize: '0.6rem', color: '#ff1744', fontWeight: 800 }}>RARITY: {rewardChar.rarity}</div>
              </div>
            )}

            {/* Buttons */}
            {showButtons && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px', animation: 'fadeIn 0.4s ease' }}>
                <button className="btn btn-primary"
                  onClick={onNext}
                  onPointerDown={e => (e.currentTarget.style.transform = 'scale(1.06)')}
                  onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                  onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  style={{ width: '100%', padding: '14px', animation: 'pulseGlow 2s infinite' }}
                >
                  NEXT STAGE ▶
                </button>
                <button className="btn btn-secondary"
                  onClick={onTitle}
                  onPointerDown={e => (e.currentTarget.style.transform = 'scale(1.06)')}
                  onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                  onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  style={{ width: '100%', padding: '12px' }}
                >
                  TITLE
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', zIndex: 10, background: 'linear-gradient(90deg, var(--color-secondary), var(--color-accent), var(--color-primary))' }} />

      <style>{`
        @keyframes badgeSlam {
          0% { transform: scale(3) rotate(-5deg); opacity: 0; }
          60% { transform: scale(0.95) rotate(1deg); opacity: 1; }
          80% { transform: scale(1.05) rotate(-0.5deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ResultScreen;
