import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { soundManager } from '../audio/SoundManager';

interface GameResult {
  score: number; maxCombo: number; perfectCount: number;
  greatCount: number; goodCount: number; missCount: number; cleared: boolean;
}

const HEADER_H = 76;
const FOOTER_H = 88;
const GEL_W = 56;
const GEL_H = 70;

const CHAR_KEYS = ['gelpiyo', 'momopiyo', 'parupiyo', 'warupiyo', 'gelchiki'];
const CHAR_FILES = [
  './assets/characters/gelpiyo.png',
  './assets/characters/momopiyo.png',
  './assets/characters/parupiyo.png',
  './assets/characters/warupiyo.png',
  './assets/characters/gelchiki.png',
];

interface Props {
  level: number;
  onFinish: (result: GameResult) => void;
  onExit: () => void;
}

const GameScreen: React.FC<Props> = ({ level, onFinish, onExit }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  const realScoreRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const gaugeRef = useRef(0);
  const perfectRef = useRef(0);
  const greatRef = useRef(0);
  const goodRef = useRef(0);
  const missRef = useRef(0);

  const [displayScore, setDisplayScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [gauge, setGauge] = useState(0);
  const [judgment, setJudgment] = useState('');
  const [judgmentKey, setJudgmentKey] = useState(0);
  const [screenFlash, setScreenFlash] = useState('');
  const [addedScoreText, setAddedScoreText] = useState('');
  const [addedKey, setAddedKey] = useState(0);
  const [countdown, setCountdown] = useState(3); // 3,2,1,0(GO),-1(playing)
  const [gameStarted, setGameStarted] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (countdown <= -1) return;
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c > 1) return c - 1;
        if (c === 1) {
          setGameStarted(true);
          const bpm = level === 1 ? 120 : level === 2 ? 140 : level === 3 ? 170 : level === 4 ? 200 : 230;
          soundManager.startGameBGM(bpm);
          return -1;
        }
        return -1;
      });
    }, 800);
    return () => clearInterval(timer);
  }, [countdown, level]);

  // Rolling score counter
  const displayScoreRef = useRef(0);
  useEffect(() => {
    let raf: number;
    const tick = () => {
      const target = realScoreRef.current;
      const cur = displayScoreRef.current;
      if (cur < target) {
        const step = Math.max(1, Math.ceil((target - cur) * 0.08));
        displayScoreRef.current = Math.min(target, cur + step);
        setDisplayScore(displayScoreRef.current);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const triggerFlash = useCallback((color: string) => {
    setScreenFlash(color);
    setTimeout(() => setScreenFlash(''), 120);
  }, []);

  // isCollision: true = don't count in judgment stats, only score/gauge
  const handleScore = useCallback((pts: number, isHit: boolean, judg: string, isCollision: boolean = false) => {
    if (isHit) {
      const newCombo = comboRef.current + 1;
      const bonus = Math.floor(newCombo * 10);
      const total = pts + bonus;
      realScoreRef.current += total;
      comboRef.current = newCombo;
      if (newCombo > maxComboRef.current) maxComboRef.current = newCombo;
      // Only increase groove gauge on player tap (not on auto-collision hits)
      if (!isCollision) {
        gaugeRef.current = Math.min(100, gaugeRef.current + 8);
      }

      setCombo(newCombo);
      setGauge(gaugeRef.current);
      setAddedScoreText(`+${total}`);
      setAddedKey(k => k + 1);

      // Only count in stats if NOT a collision tap
      if (!isCollision) {
        if (judg === 'PERFECT') { perfectRef.current++; triggerFlash('rgba(233,30,140,0.25)'); }
        else if (judg === 'GREAT') { greatRef.current++; triggerFlash('rgba(123,47,242,0.15)'); }
        else { goodRef.current++; }
      } else {
        triggerFlash('rgba(255,215,0,0.2)');
      }
    } else {
      missRef.current++;
      comboRef.current = 0;
      gaugeRef.current = Math.max(0, gaugeRef.current - 4); // Reduced penalty from -6 to -4
      setCombo(0);
      setGauge(gaugeRef.current);
    }
    setJudgment(judg);
    setJudgmentKey(k => k + 1);
  }, [triggerFlash]);

  const [cooldowns, setCooldowns] = useState<{ [key: string]: boolean }>({});

  const handleSkill = (skill: string) => {
    if (cooldowns[skill]) return;
    soundManager.playSkill(skill);
    setCooldowns(prev => ({ ...prev, [skill]: true }));
    setTimeout(() => {
      setCooldowns(prev => ({ ...prev, [skill]: false }));
    }, skill === 'BOM' ? 8000 : 5000); // 8s for BOM, 5s for others
    window.dispatchEvent(new CustomEvent('use-skill', { detail: skill }));
  };

  // Start Phaser only after countdown finishes
  useEffect(() => {
    if (!gameStarted) return;
    const container = containerRef.current;
    if (!container) return;

    const initTimer = requestAnimationFrame(() => {
      const W = container.clientWidth;
      const H = container.clientHeight;
      if (W === 0 || H === 0) return;

      const aT = HEADER_H;
      const aB = H - FOOTER_H;
      const hW = GEL_W / 2;
      const hH = GEL_H / 2;
      const numGelpiyos = level;
      const scoreCallback = handleScore;

      // Store original scales for each gelpiyo
      const origScales: { sx: number; sy: number }[] = [];

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.CANVAS,
        width: W, height: H,
        parent: container,
        transparent: true,
        physics: {
          default: 'arcade',
          arcade: { gravity: { x: 0, y: 0 }, debug: false }
        },
        scene: {
          preload() {
            for (let i = 0; i < numGelpiyos; i++) {
              this.load.image(CHAR_KEYS[i], CHAR_FILES[i]);
            }
          },
          create() {
            const scene = this as Phaser.Scene;

            // Grid (subtle, no border rect)
            const grid = scene.add.graphics();
            grid.lineStyle(1, 0xe91e8c, 0.04);
            for (let x = 0; x < W; x += 30) { grid.moveTo(x, aT); grid.lineTo(x, aB); }
            for (let y = aT; y < aB; y += 30) { grid.moveTo(0, y); grid.lineTo(W, y); }
            grid.strokePath();

            // Game Area Border (Phaser graphics removed in favor of DOM cyber frame)
            // Create gelpiyos
            const sprites: Phaser.Physics.Arcade.Sprite[] = [];
            const shadows: Phaser.GameObjects.Image[] = [];

            for (let i = 0; i < numGelpiyos; i++) {
              const startX = W / 2 + (i - (numGelpiyos - 1) / 2) * 80;
              const startY = aT + (aB - aT) / 2 + (i % 2 === 0 ? -30 : 30);
              const gel = scene.physics.add.sprite(startX, startY, CHAR_KEYS[i]);
              gel.setDisplaySize(GEL_W, GEL_H);

              const baseSpeed = (140 + level * 20) * 0.72;
              const angle = (Math.PI * 2 * i) / numGelpiyos + 0.3 + Math.random() * 0.5;
              gel.setVelocity(Math.cos(angle) * baseSpeed, Math.sin(angle) * baseSpeed);
              gel.setBounce(1, 1);
              gel.setCollideWorldBounds(false);
              (gel.body as Phaser.Physics.Arcade.Body).enable = true;

              // Store original scale after setDisplaySize
              origScales.push({ sx: gel.scaleX, sy: gel.scaleY });

              const shadow = scene.add.image(gel.x, gel.y + 6, CHAR_KEYS[i]);
              shadow.setDisplaySize(GEL_W, GEL_H);
              shadow.setAlpha(0.12); shadow.setTint(0x000000); shadow.setDepth(-1);

              sprites.push(gel);
              shadows.push(shadow);
            }

            // Skill Events
            const applySkill = (e: Event) => {
              const skill = (e as CustomEvent).detail;
              if (skill === 'STOP') {
                 // Stop gels for 2s
                 triggerFlash('rgba(0,229,255,0.3)');
                 sprites.forEach(gel => {
                   const b = gel.body as Phaser.Physics.Arcade.Body;
                   if (!gel.getData('saveVx')) {
                     gel.setData('saveVx', b.velocity.x);
                     gel.setData('saveVy', b.velocity.y);
                   }
                   b.setVelocity(0, 0);
                 });
                 setTimeout(() => {
                   sprites.forEach(gel => {
                     const b = gel.body as Phaser.Physics.Arcade.Body;
                     if (b.velocity.x === 0 && b.velocity.y === 0 && gel.getData('saveVx')) {
                       b.setVelocity(gel.getData('saveVx'), gel.getData('saveVy'));
                     }
                     gel.setData('saveVx', null);
                   });
                 }, 2000);
              } else if (skill === 'SLOW') {
                 // Slow gels for 3.5s
                 triggerFlash('rgba(123,47,242,0.3)');
                 sprites.forEach(gel => {
                   const b = gel.body as Phaser.Physics.Arcade.Body;
                   if (!gel.getData('saveVx')) {
                     gel.setData('saveVx', b.velocity.x);
                     gel.setData('saveVy', b.velocity.y);
                     b.setVelocity(b.velocity.x * 0.25, b.velocity.y * 0.25);
                   }
                 });
                 setTimeout(() => {
                   sprites.forEach(gel => {
                     const b = gel.body as Phaser.Physics.Arcade.Body;
                     if (gel.getData('saveVx')) {
                       const signX = b.velocity.x < 0 ? -1 : 1;
                       const signY = b.velocity.y < 0 ? -1 : 1;
                       b.setVelocity(Math.abs(gel.getData('saveVx')) * signX, Math.abs(gel.getData('saveVy')) * signY);
                       gel.setData('saveVx', null);
                     }
                   });
                 }, 3500);
              } else if (skill === 'BOM') {
                 // Instant PERFECT on all gels, reposition them
                 triggerFlash('rgba(255,215,0,0.5)');
                 scene.cameras.main.shake(300, 0.015);
                 sprites.forEach(gel => {
                    scoreCallback(500, true, 'PERFECT', true); 
                    const b = gel.body as Phaser.Physics.Arcade.Body;
                    gel.x = W/2 + (Math.random()-0.5)*100;
                    gel.y = aT + (aB-aT)/2 + (Math.random()-0.5)*100;
                    const baseSpeed = (140 + level * 20) * 0.72;
                    const angle = Math.random() * Math.PI * 2;
                    b.setVelocity(Math.cos(angle)*baseSpeed, Math.sin(angle)*baseSpeed);
                    gel.setData('saveVx', null); 
                 });
              }
            };
            window.addEventListener('use-skill', applySkill);
            scene.events.on('destroy', () => window.removeEventListener('use-skill', applySkill));

            // Gelpiyo-vs-gelpiyo collision
            let lastCollisionFx = 0;
            if (numGelpiyos > 1) {
              const collisionHandler = (a: any, b: any) => {
                const now = Date.now();
                if (now - lastCollisionFx < 300) return;
                lastCollisionFx = now;
                const mx = (a.x + b.x) / 2;
                const my = (a.y + b.y) / 2;
                collisionBurst(scene, mx, my);
                
                // Automatic judgment when gels hit each other
                soundManager.playHit('GREAT');
                scoreCallback(150, true, 'GREAT', true);
                
                const floatText = scene.add.text(mx, my - 20, '+150', {
                  fontFamily: 'Orbitron, sans-serif', fontSize: '18px',
                  color: '#7b2ff2', fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 3,
                });
                floatText.setOrigin(0.5); floatText.setDepth(40);
                scene.tweens.add({
                  targets: floatText, y: my - 80, alpha: 0, scale: 1.4,
                  duration: 700, ease: 'Power2', onComplete: () => floatText.destroy()
                });

                // Increment collision epoch to allow tapping
                a.setData('colEpoch', (a.getData('colEpoch') || 0) + 1);
                b.setData('colEpoch', (b.getData('colEpoch') || 0) + 1);
              };
              for (let i = 0; i < sprites.length; i++) {
                for (let j = i + 1; j < sprites.length; j++) {
                  scene.physics.add.collider(sprites[i], sprites[j], collisionHandler);
                }
              }
            }

            // Prediction
            const predictGfx = scene.add.graphics();
            predictGfx.setDepth(10);

            // Wall FX debounce
            const lastWallFx = new Array(numGelpiyos).fill(0);

            function wallSparks(sc: Phaser.Scene, x: number, y: number) {
              const colors = [0xe91e8c, 0x7b2ff2, 0x00e5ff, 0xff6ec7, 0xffffff];
              for (let i = 0; i < 10; i++) {
                const sp = sc.add.circle(x, y, 2 + Math.random() * 2, colors[i % 5]);
                sp.setDepth(30);
                const a = (Math.PI * 2 * i) / 10 + (Math.random() - 0.5);
                const d = 30 + Math.random() * 50;
                sc.tweens.add({
                  targets: sp, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d,
                  alpha: 0, scale: 0.1, duration: 280 + Math.random() * 150,
                  onComplete: () => sp.destroy()
                });
              }
              const ring = sc.add.circle(x, y, 4, 0xe91e8c, 0.5);
              ring.setDepth(25);
              sc.tweens.add({ targets: ring, scaleX: 3.5, scaleY: 3.5, alpha: 0, duration: 350, onComplete: () => ring.destroy() });
            }

            function collisionBurst(sc: Phaser.Scene, x: number, y: number) {
              const colors = [0xffd700, 0xff6ec7, 0x00e5ff, 0x39ff14];
              for (let i = 0; i < 14; i++) {
                const sp = sc.add.star(x, y, 5, 2, 5, colors[i % 4]);
                sp.setDepth(30); sp.setAlpha(0.9);
                const a = (Math.PI * 2 * i) / 14;
                const d = 40 + Math.random() * 60;
                sc.tweens.add({
                  targets: sp, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d,
                  alpha: 0, scale: 0.2, angle: 180, duration: 400 + Math.random() * 200,
                  onComplete: () => sp.destroy()
                });
              }
              const r1 = sc.add.circle(x, y, 6, 0xffd700, 0.6);
              r1.setDepth(25);
              sc.tweens.add({ targets: r1, scaleX: 4, scaleY: 4, alpha: 0, duration: 400, onComplete: () => r1.destroy() });
            }

            function hitBurst(sc: Phaser.Scene, x: number, y: number, judg: string) {
              const colors = [0xe91e8c, 0x7b2ff2, 0x00e5ff, 0xff6ec7, 0x39ff14, 0xffd700];
              const cnt = judg === 'PERFECT' ? 24 : judg === 'GREAT' ? 16 : 8;
              for (let i = 0; i < cnt; i++) {
                const sz = judg === 'PERFECT' ? 3 + Math.random() * 5 : 2 + Math.random() * 3;
                const shape = Math.random() > 0.5
                  ? sc.add.circle(x, y, sz, colors[i % 6]) as Phaser.GameObjects.Shape
                  : sc.add.star(x, y, 5, sz * 0.5, sz, colors[i % 6]) as Phaser.GameObjects.Shape;
                shape.setDepth(30);
                const a = (Math.PI * 2 * i) / cnt + (Math.random() - 0.5) * 0.6;
                const d = 50 + Math.random() * 90;
                sc.tweens.add({
                  targets: shape, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d,
                  alpha: 0, scale: 0, angle: Math.random() * 360,
                  duration: 350 + Math.random() * 350, onComplete: () => shape.destroy()
                });
              }
              // Thin ring outline only (no filled circles)
              const rc = judg === 'PERFECT' ? 0xe91e8c : judg === 'GREAT' ? 0x7b2ff2 : 0x00e5ff;
              const ringGfx = sc.add.graphics();
              ringGfx.lineStyle(2, rc, 0.6);
              ringGfx.strokeCircle(x, y, 10);
              ringGfx.setDepth(25);
              sc.tweens.add({
                targets: ringGfx, scaleX: 3, scaleY: 3, alpha: 0,
                duration: 350, onComplete: () => ringGfx.destroy()
              });
            }

            function getMinWallDist(gel: Phaser.Physics.Arcade.Sprite) {
              return Math.min(
                gel.x - hW - 2, (W - 2) - (gel.x + hW),
                gel.y - hH - aT, aB - (gel.y + hH)
              );
            }

            function areColliding(a: Phaser.Physics.Arcade.Sprite, b: Phaser.Physics.Arcade.Sprite) {
              const dx = a.x - b.x; const dy = a.y - b.y;
              return Math.sqrt(dx * dx + dy * dy) < GEL_W * 1.2;
            }

            // Update
            scene.events.on('update', () => {
              predictGfx.clear();
              for (let i = 0; i < sprites.length; i++) {
                const gel = sprites[i];
                const body = gel.body as Phaser.Physics.Arcade.Body;
                const vx = body.velocity.x; const vy = body.velocity.y;

                // Wall bounce
                if (gel.x - hW <= 2) { 
                  gel.x = 2 + hW; body.velocity.x = Math.abs(vx); 
                  const now = Date.now(); if (now - lastWallFx[i] > 180) { lastWallFx[i] = now; wallSparks(scene, 2, gel.y); } 
                }
                else if (gel.x + hW >= W - 2) { 
                  gel.x = W - 2 - hW; body.velocity.x = -Math.abs(vx); 
                  const now = Date.now(); if (now - lastWallFx[i] > 180) { lastWallFx[i] = now; wallSparks(scene, W - 2, gel.y); } 
                }
                if (gel.y - hH <= aT) { 
                  gel.y = aT + hH; body.velocity.y = Math.abs(vy); 
                  const now = Date.now(); if (now - lastWallFx[i] > 180) { lastWallFx[i] = now; wallSparks(scene, gel.x, aT); } 
                }
                else if (gel.y + hH >= aB) { 
                  gel.y = aB - hH; body.velocity.y = -Math.abs(vy); 
                  const now = Date.now(); if (now - lastWallFx[i] > 180) { lastWallFx[i] = now; wallSparks(scene, gel.x, aB); } 
                }

                // Zone epochs to prevent double taps on single approach
                const dL = gel.x - hW - 2;
                if (dL < 65) { if (!gel.getData('inZone_left')) { gel.setData('inZone_left', true); gel.setData('zEpoch_left', (gel.getData('zEpoch_left')||0)+1); } }
                else gel.setData('inZone_left', false);

                const dR = (W - 2) - (gel.x + hW);
                if (dR < 65) { if (!gel.getData('inZone_right')) { gel.setData('inZone_right', true); gel.setData('zEpoch_right', (gel.getData('zEpoch_right')||0)+1); } }
                else gel.setData('inZone_right', false);

                const dT = gel.y - hH - aT;
                if (dT < 65) { if (!gel.getData('inZone_top')) { gel.setData('inZone_top', true); gel.setData('zEpoch_top', (gel.getData('zEpoch_top')||0)+1); } }
                else gel.setData('inZone_top', false);

                const dB = aB - (gel.y + hH);
                if (dB < 65) { if (!gel.getData('inZone_bottom')) { gel.setData('inZone_bottom', true); gel.setData('zEpoch_bottom', (gel.getData('zEpoch_bottom')||0)+1); } }
                else gel.setData('inZone_bottom', false);

                gel.rotation += (body.velocity.x > 0 ? 0.008 : -0.008);
                shadows[i].x = gel.x + 3;
                shadows[i].y = gel.y + 6;
                shadows[i].rotation = gel.rotation;

                // Prediction
                const md = getMinWallDist(gel);
                if (md < 80) {
                  const al = Math.max(0, 1 - md / 80) * 0.6;
                  const pulse = 16 + Math.sin(Date.now() / 100 + i * 2) * 5;
                  const dL = gel.x - hW - 2; const dR = (W - 2) - (gel.x + hW);
                  const dT = gel.y - hH - aT; const dB = aB - (gel.y + hH);
                  const minD = Math.min(dL, dR, dT, dB);
                  let hx = gel.x, hy = gel.y;
                  if (minD === dL) hx = 2 + hW;
                  else if (minD === dR) hx = W - 2 - hW;
                  if (minD === dT) hy = aT + hH;
                  else if (minD === dB) hy = aB - hH;
                  predictGfx.lineStyle(3, 0xe91e8c, al);
                  predictGfx.strokeCircle(hx, hy, pulse);
                  predictGfx.lineStyle(1, 0xe91e8c, al * 0.4);
                  predictGfx.strokeCircle(hx, hy, pulse + 12);
                }
              }
            });

            // Tap
            scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
              if (pointer.y < aT || pointer.y > aB) return;

              let tappedGelIdx = -1;
              let tappedGelDist = Infinity;

              // 1. Find which gelpiyo was tapped (generous hitbox)
              for (let i = 0; i < sprites.length; i++) {
                const gel = sprites[i];
                const dx = pointer.x - gel.x;
                const dy = pointer.y - gel.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < GEL_W * 1.5) { // Generous tap radius
                  if (dist < tappedGelDist) {
                    tappedGelDist = dist;
                    tappedGelIdx = i;
                  }
                }
              }

              if (tappedGelIdx === -1) {
                // Tapped empty space -> MISS
                scoreCallback(0, false, 'MISS', false);
                const miss = scene.add.circle(pointer.x, pointer.y, 4, 0xff1744, 0.4);
                miss.setDepth(30);
                scene.tweens.add({ targets: miss, scaleX: 3, scaleY: 3, alpha: 0, duration: 250, onComplete: () => miss.destroy() });
                return;
              }

              const bestGel = sprites[tappedGelIdx];
              const bestIdx = tappedGelIdx;
              
              const distLeft = bestGel.x - hW - 2;
              const distRight = (W - 2) - (bestGel.x + hW);
              const distTop = bestGel.y - hH - aT;
              const distBottom = aB - (bestGel.y + hH);
              const wallDist = Math.min(distLeft, distRight, distTop, distBottom);

              let wallKey = '';
              if (wallDist === distLeft) wallKey = 'left';
              else if (wallDist === distRight) wallKey = 'right';
              else if (wallDist === distTop) wallKey = 'top';
              else if (wallDist === distBottom) wallKey = 'bottom';

              // 2. Check if this gelpiyo is colliding with another gelpiyo
              let isCollision = false;
              for (let j = 0; j < sprites.length; j++) {
                if (j !== bestIdx && areColliding(bestGel, sprites[j])) {
                  isCollision = true;
                  break;
                }
              }

              let judg = 'MISS'; let pts = 0; let hit = false;
              
              if (isCollision) { 
                // Collision tap allowance
                const colEpoch = bestGel.getData('colEpoch') || 0;
                if (bestGel.getData('tappedColEpoch') !== colEpoch) {
                  judg = 'PERFECT'; pts = 500; hit = true; 
                  bestGel.setData('tappedColEpoch', colEpoch);
                }
              } else if (wallDist < 60) {
                // Wall tap allowance
                const zEpoch = bestGel.getData(`zEpoch_${wallKey}`) || 0;
                if (bestGel.getData(`tappedZEpoch_${wallKey}`) !== zEpoch) {
                  if (wallDist < 16) { judg = 'PERFECT'; pts = 300; hit = true; } 
                  else if (wallDist < 36) { judg = 'GREAT'; pts = 150; hit = true; } 
                  else if (wallDist < 60) { judg = 'GOOD'; pts = 50; hit = true; }
                  if (hit) bestGel.setData(`tappedZEpoch_${wallKey}`, zEpoch);
                }
              }

              if (hit) {
                soundManager.playHit(judg);
              } else {
                soundManager.playMiss();
              }
              scoreCallback(pts, hit, judg, isCollision);

              if (hit && bestGel) {
                hitBurst(scene, bestGel.x, bestGel.y, judg);
                if (judg === 'PERFECT') scene.cameras.main.shake(100, 0.008);

                // Flash tint
                const tintColor = judg === 'PERFECT' ? 0xffe0f0 : judg === 'GREAT' ? 0xe0d0ff : 0xd0f8ff;
                bestGel.setTint(tintColor);
                scene.time.delayedCall(120, () => { if (bestGel) bestGel.clearTint(); });

                // Pop-up and EXPLICITLY restore original scale
                const osx = origScales[bestIdx].sx;
                const osy = origScales[bestIdx].sy;
                const popScale = judg === 'PERFECT' ? 1.5 : judg === 'GREAT' ? 1.35 : 1.2;

                scene.tweens.killTweensOf(bestGel); // Kill any ongoing scale tweens
                bestGel.setScale(osx * popScale, osy * popScale); // Instantly pop up

                scene.tweens.add({
                  targets: bestGel,
                  scaleX: osx,
                  scaleY: osy,
                  duration: 250,
                  ease: 'Back.easeOut',
                });

                // Floating score text
                const scoreColor = judg === 'PERFECT' ? '#e91e8c' : judg === 'GREAT' ? '#7b2ff2' : '#00b8d4';
                const floatText = scene.add.text(bestGel.x, bestGel.y - 20, `+${pts}`, {
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: judg === 'PERFECT' ? '22px' : '18px',
                  color: scoreColor, fontStyle: 'bold',
                  stroke: '#ffffff', strokeThickness: 3,
                });
                floatText.setOrigin(0.5); floatText.setDepth(40);
                scene.tweens.add({
                  targets: floatText, y: bestGel.y - 80, alpha: 0, scale: 1.4,
                  duration: 700, ease: 'Power2', onComplete: () => floatText.destroy()
                });

                // Ripple on other gelpiyos
                for (let g = 0; g < sprites.length; g++) {
                  if (g !== bestIdx) {
                    const gs = origScales[g];
                    scene.tweens.killTweensOf(sprites[g]);
                    sprites[g].setScale(gs.sx * 1.1, gs.sy * 0.92);
                    scene.tweens.add({
                      targets: sprites[g], scaleX: gs.sx, scaleY: gs.sy,
                      duration: 150, delay: 40, ease: 'Quad.easeOut'
                    });
                  }
                }
              } else {
                const miss = scene.add.circle(pointer.x, pointer.y, 4, 0xff1744, 0.4);
                miss.setDepth(30);
                scene.tweens.add({ targets: miss, scaleX: 3, scaleY: 3, alpha: 0, duration: 250, onComplete: () => miss.destroy() });
              }
            });
          }
        }
      };

      const game = new Phaser.Game(config);
      gameRef.current = game;
    });

    const endTimer = setTimeout(() => {
      onFinish({
        score: realScoreRef.current, maxCombo: maxComboRef.current,
        perfectCount: perfectRef.current, greatCount: greatRef.current,
        goodCount: goodRef.current, missCount: missRef.current,
        cleared: gaugeRef.current >= 70
      });
    }, 40000);

    return () => {
      cancelAnimationFrame(initTimer);
      clearTimeout(endTimer);
      if (gameRef.current) { gameRef.current.destroy(true); gameRef.current = null; }
    };
  }, [gameStarted, handleScore, onFinish, level]);

  const jColor = judgment === 'PERFECT' ? '#e91e8c' : judgment === 'GREAT' ? '#7b2ff2' : judgment === 'GOOD' ? '#00b8d4' : '#ff1744';
  const jSize = judgment === 'PERFECT' ? '2rem' : judgment === 'GREAT' ? '1.6rem' : judgment === 'GOOD' ? '1.3rem' : '1.1rem';

  return (
    <div className="screen" style={{ background: `url('./assets/game_bg.png') center/cover no-repeat` }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', zIndex: 0 }} />

      {/* Flash */}
      {screenFlash && <div style={{ position: 'absolute', inset: 0, background: screenFlash, zIndex: 50, pointerEvents: 'none' }} />}

      {/* ===== COUNTDOWN OVERLAY ===== */}
      {countdown >= 0 && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 100,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)'
        }}>
          <div key={countdown} style={{
            fontFamily: "'Orbitron'", fontWeight: 900,
            fontSize: countdown === 0 ? '4rem' : '5rem',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            animation: 'countdownPop 0.6s ease',
            textShadow: 'none',
            filter: 'drop-shadow(0 4px 20px rgba(233,30,140,0.3))'
          }}>
            {countdown === 0 ? 'GO!' : countdown}
          </div>
          <div style={{
            width: '120px', height: '4px', borderRadius: '2px', marginTop: '20px',
            background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent), var(--color-secondary))',
            animation: 'shimmer 1s infinite'
          }} />
        </div>
      )}

      {/* HEADER */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: `${HEADER_H}px`, zIndex: 10,
        background: 'rgba(255,255,255,0.93)', backdropFilter: 'blur(12px)',
        borderBottom: '2px solid rgba(233,30,140,0.15)',
        display: 'flex', alignItems: 'center', padding: '0 12px'
      }}>
        <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem', background: '#e0e0e0', color: '#333', marginRight: '12px', cursor: 'pointer' }} onClick={onExit}>EXIT</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', fontFamily: "'Orbitron'", letterSpacing: '0.1em' }}>SCORE</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: "'Orbitron'", color: 'var(--color-text-dark)', lineHeight: 1 }}>
            {displayScore.toString().padStart(7, '0')}
          </div>
        </div>
        <div style={{ textAlign: 'center', minWidth: '60px' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', fontFamily: "'Orbitron'" }}>COMBO</div>
          <div style={{
            fontSize: '1.4rem', fontWeight: 900, fontFamily: "'Orbitron'", lineHeight: 1,
            color: combo >= 20 ? 'var(--color-primary)' : combo >= 10 ? 'var(--color-secondary)' : 'var(--color-text-dark)',
            textShadow: combo >= 20 ? '0 0 10px rgba(233,30,140,0.4)' : 'none',
            transition: 'transform 0.1s', transform: combo > 0 ? 'scale(1.1)' : 'scale(1)'
          }}>{combo}</div>
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', fontFamily: "'Orbitron'", marginBottom: '3px' }}>GROOVE</div>
          <div className="groove-gauge">
            <div className="groove-gauge-fill" style={{
              width: `${gauge}%`,
              background: gauge >= 70 ? 'linear-gradient(90deg,#39ff14,#00e676)' : gauge >= 40 ? 'linear-gradient(90deg,#ffab00,#ff6d00)' : 'linear-gradient(90deg,#ff1744,#ff5252)'
            }} />
          </div>
          <div style={{ fontSize: '0.55rem', fontFamily: "'Orbitron'", marginTop: '1px', color: gauge >= 70 ? '#00c853' : 'var(--color-text-muted)', fontWeight: gauge >= 70 ? 700 : 400 }}>
            {gauge}%{gauge >= 70 ? ' CLEAR!' : ''}
          </div>
        </div>
      </div>

      {/* JUDGMENT (no extra pink line) */}
      {judgment && gameStarted && (
        <div key={judgmentKey} style={{
          position: 'absolute', top: `${HEADER_H + 16}px`, left: 0, right: 0,
          textAlign: 'center', zIndex: 15, pointerEvents: 'none'
        }}>
          <span style={{
            fontFamily: "'Orbitron'", fontWeight: 900, letterSpacing: '0.15em',
            fontSize: jSize, color: jColor,
            animation: 'popInOut 0.6s ease forwards', display: 'inline-block'
          }}>{judgment}</span>
        </div>
      )}
      {combo >= 5 && gameStarted && (
        <div key={`c-${judgmentKey}`} style={{
          position: 'absolute', top: `${HEADER_H + 52}px`, left: 0, right: 0,
          textAlign: 'center', zIndex: 15, pointerEvents: 'none'
        }}>
          <span style={{ fontFamily: "'Orbitron'", fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-secondary)', opacity: 0.8, animation: 'popInOut 0.8s ease forwards' }}>{combo} COMBO</span>
        </div>
      )}
      {addedScoreText && gameStarted && (
        <div key={addedKey} style={{
          position: 'absolute', top: `${HEADER_H + 70}px`, left: 0, right: 0,
          textAlign: 'center', zIndex: 15, pointerEvents: 'none',
          animation: 'floatUp 0.6s ease forwards'
        }}>
          <span style={{ fontFamily: "'Orbitron'", fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)' }}>{addedScoreText}</span>
        </div>
      )}

      {/* PHASER */}
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 1 }} />

      {/* PLAY AREA CYBER FRAME */}
      {gameStarted && (
        <div style={{
          position: 'absolute', top: `${HEADER_H}px`, bottom: `${FOOTER_H}px`, left: '2px', right: '2px',
          pointerEvents: 'none', zIndex: 12,
          border: '3px solid rgba(0, 229, 255, 0.4)',
          borderRadius: '4px',
          animation: 'cyberFrame 4s infinite alternate'
        }}>
          {/* Corner accents */}
          <div style={{ position: 'absolute', top: '-3px', left: '-3px', width: '20px', height: '20px', borderTop: '4px solid #e91e8c', borderLeft: '4px solid #e91e8c' }} />
          <div style={{ position: 'absolute', top: '-3px', right: '-3px', width: '20px', height: '20px', borderTop: '4px solid #e91e8c', borderRight: '4px solid #e91e8c' }} />
          <div style={{ position: 'absolute', bottom: '-3px', left: '-3px', width: '20px', height: '20px', borderBottom: '4px solid #e91e8c', borderLeft: '4px solid #e91e8c' }} />
          <div style={{ position: 'absolute', bottom: '-3px', right: '-3px', width: '20px', height: '20px', borderBottom: '4px solid #e91e8c', borderRight: '4px solid #e91e8c' }} />
        </div>
      )}

      {/* FOOTER */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: `${FOOTER_H}px`, zIndex: 10,
        background: 'rgba(255,255,255,0.93)', backdropFilter: 'blur(12px)',
        borderTop: '2px solid rgba(233,30,140,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '18px'
      }}>
        {['STOP', 'SLOW', 'BOM'].map(label => (
          <button key={label} className={`skill-btn ${label.toLowerCase()}`}
            style={{ 
              opacity: cooldowns[label] ? 0.4 : 1, 
              filter: cooldowns[label] ? 'grayscale(1)' : 'none',
              transform: cooldowns[label] ? 'scale(0.95)' : 'scale(1)',
              cursor: cooldowns[label] ? 'not-allowed' : 'pointer'
            }}
            disabled={cooldowns[label]}
            onClick={e => { e.stopPropagation(); handleSkill(label); }}>
            {label}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes countdownPop {
          0% { transform: scale(2.5) rotate(-5deg); opacity: 0; }
          50% { transform: scale(0.9) rotate(1deg); opacity: 1; }
          70% { transform: scale(1.1) rotate(-0.5deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes popInOut {
          0% { transform: scale(0.5); opacity: 0; }
          15% { transform: scale(1.1); opacity: 1; }
          25% { transform: scale(1); opacity: 1; }
          80% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0; }
        }
        @keyframes cyberFrame {
          0% {
            box-shadow: 0 0 10px rgba(0, 229, 255, 0.3), inset 0 0 10px rgba(0, 229, 255, 0.3);
            border-color: rgba(0, 229, 255, 0.4);
          }
          33% {
            box-shadow: 0 0 20px rgba(123, 47, 242, 0.5), inset 0 0 20px rgba(123, 47, 242, 0.5);
            border-color: rgba(123, 47, 242, 0.6);
          }
          66% {
            box-shadow: 0 0 25px rgba(233, 30, 140, 0.6), inset 0 0 25px rgba(233, 30, 140, 0.6);
            border-color: rgba(233, 30, 140, 0.7);
          }
          100% {
            box-shadow: 0 0 10px rgba(0, 229, 255, 0.3), inset 0 0 10px rgba(0, 229, 255, 0.3);
            border-color: rgba(0, 229, 255, 0.4);
          }
        }
      `}</style>
    </div>
  );
};

export default GameScreen;
