import Phaser from 'phaser';

export interface GameCallbacks {
  onScore: (addedScore: number, combo: number, isHit: boolean, judgment: string) => void;
  onWallHit: () => void;
}

export class GameScene extends Phaser.Scene {
  private gelpiyos: Phaser.Physics.Matter.Sprite[] = [];
  private callbacks?: GameCallbacks;
  private playAreaTop: number = 0;
  private playAreaBottom: number = 0;
  private predictCircles: Phaser.GameObjects.Graphics[] = [];

  constructor() {
    super('GameScene');
  }

  init(data: { callbacks?: GameCallbacks; playAreaTop?: number; playAreaBottom?: number }) {
    this.callbacks = data.callbacks;
    this.playAreaTop = data.playAreaTop || 80;
    this.playAreaBottom = data.playAreaBottom || 90;
  }

  preload() {
    this.load.image('gelpiyo1', './assets/characters/gelpiyo.png');
  }

  create() {
    const { width, height } = this.scale;
    const areaTop = this.playAreaTop;
    const areaBottom = height - this.playAreaBottom;
    const areaHeight = areaBottom - areaTop;

    // Set world bounds to the play area only (not overlapping UI)
    this.matter.world.setBounds(0, areaTop, width, areaHeight);

    // Draw a subtle border for the play area
    const border = this.add.graphics();
    border.lineStyle(2, 0xe91e8c, 0.3);
    border.strokeRect(1, areaTop, width - 2, areaHeight);

    // Light grid inside play area
    const grid = this.add.graphics();
    grid.lineStyle(1, 0xe91e8c, 0.04);
    for (let x = 0; x < width; x += 40) {
      grid.moveTo(x, areaTop);
      grid.lineTo(x, areaBottom);
    }
    for (let y = areaTop; y < areaBottom; y += 40) {
      grid.moveTo(0, y);
      grid.lineTo(width, y);
    }
    grid.strokePath();

    // Create Gelpiyo with proper character image
    const gelpiyo = this.matter.add.sprite(width / 2, areaTop + areaHeight / 2, 'gelpiyo1');
    const spriteSize = 72;
    gelpiyo.setDisplaySize(spriteSize, spriteSize);
    gelpiyo.setCircle(spriteSize / 2);
    gelpiyo.setFriction(0, 0, 0);
    gelpiyo.setBounce(1);

    // ** MUCH SLOWER velocity for playability **
    gelpiyo.setVelocity(2.5, 3);
    gelpiyo.setAngularVelocity(0.02);

    this.gelpiyos.push(gelpiyo);

    // Collision prediction graphics
    const predictGfx = this.add.graphics();
    this.predictCircles.push(predictGfx);

    // Tap detection
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleTap(pointer);
    });

    // Wall collision event
    this.matter.world.on('collisionstart', (_event: any, bodyA: any, bodyB: any) => {
      // Check if one of the bodies is a wall (static)
      const isWallCollision = bodyA.isStatic || bodyB.isStatic;
      if (isWallCollision && this.callbacks?.onWallHit) {
        this.callbacks.onWallHit();
      }
    });
  }

  update() {
    this.drawPredictions();
  }

  private drawPredictions() {
    const { width, height } = this.scale;
    const areaTop = this.playAreaTop;
    const areaBottom = height - this.playAreaBottom;

    if (this.predictCircles.length > 0) {
      const gfx = this.predictCircles[0];
      gfx.clear();

      for (const g of this.gelpiyos) {
        const vx = (g.body as any).velocity.x;
        const vy = (g.body as any).velocity.y;
        const speed = Math.sqrt(vx * vx + vy * vy);
        if (speed < 0.1) continue;

        const px = g.x;
        const py = g.y;
        const r = 36; // half of display size

        // Predict wall hit position (time-based, ~0.4s ahead)
        const lookAhead = 0.4 * 60; // frames at 60fps
        let futureX = px + vx * lookAhead;
        let futureY = py + vy * lookAhead;

        // Clamp to walls
        let hitX = futureX;
        let hitY = futureY;

        if (futureX - r < 0) hitX = r;
        else if (futureX + r > width) hitX = width - r;

        if (futureY - r < areaTop) hitY = areaTop + r;
        else if (futureY + r > areaBottom) hitY = areaBottom - r;

        // Only draw if we predict a wall collision soon
        const distToWallX = Math.min(px - r, width - px - r);
        const distToWallY = Math.min(py - r - areaTop, areaBottom - py - r);
        const minDistToWall = Math.min(distToWallX, distToWallY);

        if (minDistToWall < 120) {
          const alpha = Math.max(0, 1 - minDistToWall / 120) * 0.6;

          // Pulsing circle at predicted hit point
          const pulseSize = 20 + Math.sin(this.time.now / 150) * 6;

          gfx.lineStyle(2, 0xe91e8c, alpha);
          gfx.strokeCircle(hitX, hitY, pulseSize);

          gfx.lineStyle(1, 0xe91e8c, alpha * 0.5);
          gfx.strokeCircle(hitX, hitY, pulseSize + 10);
        }
      }
    }
  }

  private handleTap(_pointer: Phaser.Input.Pointer) {
    const { width, height } = this.scale;
    const areaTop = this.playAreaTop;
    const areaBottom = height - this.playAreaBottom;

    let bestDist = Infinity;
    let hitSuccess = false;
    let judgment = 'MISS';

    for (const g of this.gelpiyos) {
      const bounds = g.getBounds();
      const distLeft = bounds.left;
      const distRight = width - bounds.right;
      const distTop = bounds.top - areaTop;
      const distBottom = areaBottom - bounds.bottom;
      const minDist = Math.min(distLeft, distRight, distTop, distBottom);

      if (minDist < bestDist) {
        bestDist = minDist;
      }
    }

    // Judgment thresholds based on distance to wall
    if (bestDist < 8) {
      hitSuccess = true;
      judgment = 'PERFECT';
    } else if (bestDist < 20) {
      hitSuccess = true;
      judgment = 'GREAT';
    } else if (bestDist < 40) {
      hitSuccess = true;
      judgment = 'GOOD';
    }

    if (this.callbacks?.onScore) {
      let scoreAdd = 0;
      if (judgment === 'PERFECT') scoreAdd = 200;
      else if (judgment === 'GREAT') scoreAdd = 100;
      else if (judgment === 'GOOD') scoreAdd = 50;
      this.callbacks.onScore(scoreAdd, hitSuccess ? 1 : 0, hitSuccess, judgment);
    }

    if (hitSuccess) {
      // Hit flash — bright white
      this.cameras.main.flash(120, 233, 30, 140);

      // Particle burst at gelpiyo position
      for (const g of this.gelpiyos) {
        this.createHitParticles(g.x, g.y);
      }
    }
  }

  private createHitParticles(x: number, y: number) {
    const colors = [0xe91e8c, 0x7b2ff2, 0x00e5ff, 0xff6ec7];
    for (let i = 0; i < 8; i++) {
      const particle = this.add.circle(x, y, 4, colors[i % colors.length], 1);
      const angle = (Math.PI * 2 * i) / 8;
      const speed = 80 + Math.random() * 40;

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.2,
        duration: 400,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
  }
}
