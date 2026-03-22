import Phaser from 'phaser';
import { COLORS, ROD_CONFIG, CAST, CAST_ARC, WATER_LINE_Y, GAME } from '../constants.js';
import { audio } from './AudioManager.js';

export default class FishingRod {
  constructor(scene) {
    this.scene = scene;
    this.baseX = ROD_CONFIG.BASE_X;
    this.baseY = ROD_CONFIG.BASE_Y;
    this.tipX = ROD_CONFIG.TIP_X;
    this.tipY = ROD_CONFIG.TIP_Y;

    // Current hook/bobber position (during and after cast)
    this.hookX = this.tipX;
    this.hookY = this.tipY;
    this.bobberVisible = false;
    this.casting = false;

    // Fighting fish visual state
    this.fishGfx = scene.add.graphics();
    this.fishGfx.setDepth(3);
    this.fishVisible = false;
    this.fishX = 0;
    this.fishY = 0;
    this.fishTargetX = 0;
    this.fishTargetY = 0;
    this.fishDirection = 1; // 1 = facing right, -1 = facing left
    this.fishColor = 0x4488AA;
    this.fishAccentColor = 0x66AACC;
    this.fishSize = 1;

    // Graphics layers
    this.rodGfx = scene.add.graphics();
    this.rodGfx.setDepth(5);

    this.lineGfx = scene.add.graphics();
    this.lineGfx.setDepth(4);

    this.drawRod();
  }

  drawRod() {
    this.rodGfx.clear();

    // Rod shaft
    this.rodGfx.lineStyle(4, COLORS.ROD, 1);
    this.rodGfx.lineBetween(this.baseX, this.baseY, this.tipX, this.tipY);

    // Rod handle (thicker base)
    this.rodGfx.lineStyle(6, 0x3A2A1A, 1);
    this.rodGfx.lineBetween(this.baseX, this.baseY, this.baseX + 15, this.baseY - 10);

    // Rod tip guide
    this.rodGfx.fillStyle(COLORS.HOOK, 1);
    this.rodGfx.fillCircle(this.tipX, this.tipY, 2);
  }

  drawLine() {
    this.lineGfx.clear();

    if (!this.bobberVisible && !this.casting) return;

    // Line from rod tip to hook/bobber
    this.lineGfx.lineStyle(1, COLORS.LINE, 0.8);

    if (this.bobberVisible) {
      // Slight sag in the line using a curve
      const midX = (this.tipX + this.hookX) / 2;
      const midY = Math.max(this.tipY, this.hookY) + 15;

      const curve = new Phaser.Curves.QuadraticBezier(
        new Phaser.Math.Vector2(this.tipX, this.tipY),
        new Phaser.Math.Vector2(midX, midY),
        new Phaser.Math.Vector2(this.hookX, this.hookY)
      );

      const points = curve.getPoints(20);
      this.lineGfx.beginPath();
      this.lineGfx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        this.lineGfx.lineTo(points[i].x, points[i].y);
      }
      this.lineGfx.strokePath();

      // Bobber
      this.drawBobber(this.hookX, this.hookY);
    }
  }

  drawBobber(x, y) {
    // Bobber top (red)
    this.lineGfx.fillStyle(COLORS.BOBBER_RED, 1);
    this.lineGfx.fillCircle(x, y - 4, 5);

    // Bobber bottom (white)
    this.lineGfx.fillStyle(COLORS.BOBBER_WHITE, 1);
    this.lineGfx.fillCircle(x, y + 2, 4);

    // Bobber stick
    this.lineGfx.lineStyle(1, 0x333333, 1);
    this.lineGfx.lineBetween(x, y - 10, x, y + 6);
  }

  // === FIGHTING FISH VISUAL ===

  setupFightingFish(fishInstance) {
    this.fishVisible = true;
    this.fishColor = fishInstance.color;
    this.fishAccentColor = fishInstance.accentColor;
    this.fishSize = 0.6 + fishInstance.weight * 0.08;
    this.fishSize = Math.min(this.fishSize, 2.5);
    this.fishX = this.hookX;
    this.fishY = this.hookY + 25;
    this.fishTargetX = this.fishX;
    this.fishTargetY = this.fishY;
    this.fishDirection = -1;
  }

  updateFightingFish(pullDirection, fishEnergy, reelProgress, delta) {
    if (!this.fishVisible) return;

    const dt = Math.min(delta, 33) / 1000;

    // Fish moves closer to player (dock) as reel progress increases
    // At 0% progress, fish is far out near the bobber
    // At 100% progress, fish is right at the bobber/dock
    const farX = this.hookX + 60; // start position (far from dock)
    const nearX = this.hookX - 10; // end position (near bobber)
    const progressX = farX + (nearX - farX) * reelProgress;

    const farY = this.hookY + 40;
    const nearY = this.hookY + 15;
    const progressY = farY + (nearY - farY) * reelProgress;

    // Movement offset based on pull direction
    const moveRange = 60 * fishEnergy;
    const vertRange = 25 * fishEnergy;

    // Organic swimming oscillation
    const t = Date.now() * 0.001;
    const swimOscX = Math.sin(t * 2.5) * 12 * fishEnergy;
    const swimOscY = Math.sin(t * 1.8 + 1) * 6 * fishEnergy;

    if (pullDirection === 1) {
      // Fish swimming AWAY — moves right and deeper
      this.fishTargetX = progressX + moveRange * 0.7 + swimOscX;
      this.fishTargetY = progressY + vertRange * 0.5 + swimOscY;
    } else if (pullDirection === -1) {
      // Fish swimming TOWARD player — moves left and up
      this.fishTargetX = progressX - moveRange * 0.5 + swimOscX;
      this.fishTargetY = progressY - vertRange * 0.4 + swimOscY;
    } else {
      // Resting — gentle drift around progress position
      this.fishTargetX = progressX + swimOscX * 1.2;
      this.fishTargetY = progressY + swimOscY * 0.8;
    }

    // Clamp fish to stay within screen and below water
    this.fishTargetX = Math.max(50, Math.min(GAME.WIDTH - 30, this.fishTargetX));
    this.fishTargetY = Math.max(WATER_LINE_Y + 10, Math.min(GAME.HEIGHT - 20, this.fishTargetY));

    // Smooth lerp toward target
    const lerpSpeed = 3 * dt;
    this.fishX += (this.fishTargetX - this.fishX) * lerpSpeed;
    this.fishY += (this.fishTargetY - this.fishY) * lerpSpeed;

    // Update facing direction based on movement
    const dx = this.fishTargetX - this.fishX;
    if (Math.abs(dx) > 1) {
      this.fishDirection = dx > 0 ? 1 : -1;
    }

    this.drawFightingFish();
  }

  drawFightingFish() {
    this.fishGfx.clear();
    if (!this.fishVisible) return;

    const x = this.fishX;
    const y = this.fishY;
    const s = this.fishSize;
    const dir = this.fishDirection;

    // Underwater darkening — fish is slightly transparent
    const alpha = 0.7;

    // Water ripples above fish
    const rippleY = WATER_LINE_Y + 5;
    if (y < WATER_LINE_Y + 60) {
      const rippleAlpha = 0.15 * (1 - (y - WATER_LINE_Y) / 60);
      this.fishGfx.lineStyle(1, 0xAADDEE, rippleAlpha);
      this.fishGfx.strokeCircle(x, rippleY, 8 + Math.sin(Date.now() * 0.005) * 3);
      this.fishGfx.strokeCircle(x, rippleY, 14 + Math.sin(Date.now() * 0.004 + 1) * 4);
    }

    // Fish shadow (deeper = more offset)
    const shadowDepth = (y - WATER_LINE_Y) * 0.05;
    this.fishGfx.fillStyle(0x000000, 0.08);
    this.fishGfx.fillEllipse(x + shadowDepth, y + 8 * s, 22 * s, 6 * s);

    // Body
    const bodyW = 20 * s;
    const bodyH = 10 * s;
    this.fishGfx.fillStyle(this.fishColor, alpha);
    this.fishGfx.fillEllipse(x, y, bodyW, bodyH);

    // Accent stripe
    this.fishGfx.fillStyle(this.fishAccentColor, alpha * 0.5);
    this.fishGfx.fillEllipse(x, y + bodyH * 0.08, bodyW * 0.8, bodyH * 0.35);

    // Tail fin
    const tailX = x - dir * bodyW * 0.55;
    this.fishGfx.fillStyle(this.fishColor, alpha * 0.85);
    this.fishGfx.fillTriangle(
      tailX, y,
      tailX - dir * 8 * s, y - 5 * s,
      tailX - dir * 8 * s, y + 5 * s
    );

    // Dorsal fin
    this.fishGfx.fillStyle(this.fishAccentColor, alpha * 0.6);
    this.fishGfx.fillTriangle(
      x + dir * 2 * s, y - bodyH * 0.5,
      x - dir * 3 * s, y - bodyH * 0.5 - 5 * s,
      x - dir * 6 * s, y - bodyH * 0.5
    );

    // Eye
    const eyeX = x + dir * bodyW * 0.3;
    this.fishGfx.fillStyle(0xFFFFFF, alpha);
    this.fishGfx.fillCircle(eyeX, y - 1.5 * s, 2.5 * s);
    this.fishGfx.fillStyle(0x111111, alpha);
    this.fishGfx.fillCircle(eyeX + dir * 0.5, y - 1.5 * s, 1.2 * s);

    // Line from bobber to fish (thin leader line)
    this.fishGfx.lineStyle(1, COLORS.LINE, 0.3);
    this.fishGfx.lineBetween(this.hookX, this.hookY + 6, x, y);
  }

  hideFightingFish() {
    this.fishVisible = false;
    this.fishGfx.clear();
  }

  playCastAnimation(accuracy, onComplete) {
    this.casting = true;
    this.bobberVisible = false;

    // Calculate landing position based on accuracy
    const distance = accuracy * CAST.MAX_DISTANCE;
    const landingX = this.tipX + distance;
    const landingY = WATER_LINE_Y + 10 + Math.random() * 20;

    // Build bezier path for the arc
    const controlX = (this.tipX + landingX) / 2;
    const controlY = this.tipY - CAST_ARC.ARC_HEIGHT * accuracy;

    const path = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(this.tipX, this.tipY),
      new Phaser.Math.Vector2(controlX, controlY),
      new Phaser.Math.Vector2(landingX, landingY)
    );

    // Animate along the path
    const counter = { t: 0 };
    this.scene.tweens.add({
      targets: counter,
      t: 1,
      duration: CAST_ARC.DURATION,
      ease: 'Quad.easeIn',
      onUpdate: () => {
        const point = path.getPoint(counter.t);
        this.hookX = point.x;
        this.hookY = point.y;

        // Draw the arc trail
        this.lineGfx.clear();
        this.lineGfx.lineStyle(1, COLORS.LINE, 0.6);

        const trailPoints = path.getPoints(20);
        const endIndex = Math.floor(counter.t * 20);
        this.lineGfx.beginPath();
        this.lineGfx.moveTo(this.tipX, this.tipY);
        for (let i = 0; i <= endIndex; i++) {
          this.lineGfx.lineTo(trailPoints[i].x, trailPoints[i].y);
        }
        this.lineGfx.strokePath();

        // Draw the hook/weight at current position
        this.lineGfx.fillStyle(COLORS.HOOK, 1);
        this.lineGfx.fillCircle(this.hookX, this.hookY, 3);
      },
      onComplete: () => {
        this.casting = false;
        this.bobberVisible = true;
        this.hookX = landingX;
        this.hookY = landingY;
        this.drawLine();

        // Splash effect
        audio.playSplash();
        this.playSplash(landingX, landingY);

        if (onComplete) onComplete(distance);
      }
    });
  }

  playSplash(x, y) {
    const splash = this.scene.add.graphics();
    splash.setDepth(6);

    // Splash droplets
    const droplets = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 6) + (Math.PI * 2 / 6) * i * (0.5 + Math.random() * 0.5);
      droplets.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * (20 + Math.random() * 15),
        vy: -Math.abs(Math.sin(angle)) * (15 + Math.random() * 20)
      });
    }

    let elapsed = 0;
    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 400,
      onUpdate: (tween) => {
        elapsed = tween.getValue();
        splash.clear();
        splash.fillStyle(COLORS.WATER_TOP, 1 - elapsed);
        droplets.forEach(d => {
          const dx = d.x + d.vx * elapsed;
          const dy = d.y + d.vy * elapsed + 30 * elapsed * elapsed;
          splash.fillCircle(dx, dy, 2 * (1 - elapsed));
        });

        // Ring
        splash.lineStyle(1, COLORS.SHIMMER, 0.3 * (1 - elapsed));
        splash.strokeCircle(x, y, 10 + 20 * elapsed);
      },
      onComplete: () => {
        splash.destroy();
      }
    });
  }

  playLineSnap() {
    // Quick visual: line recoils to rod tip
    const startX = this.hookX;
    const startY = this.hookY;
    const counter = { t: 0 };

    this.bobberVisible = false;
    this.hideFightingFish();

    this.scene.tweens.add({
      targets: counter,
      t: 1,
      duration: 200,
      ease: 'Quad.easeIn',
      onUpdate: () => {
        this.lineGfx.clear();
        const cx = Phaser.Math.Linear(startX, this.tipX, counter.t);
        const cy = Phaser.Math.Linear(startY, this.tipY, counter.t);
        this.lineGfx.lineStyle(1, COLORS.LINE, 1 - counter.t);
        this.lineGfx.lineBetween(this.tipX, this.tipY, cx, cy);
      },
      onComplete: () => {
        this.lineGfx.clear();
      }
    });
  }

  reset() {
    this.bobberVisible = false;
    this.casting = false;
    this.hookX = this.tipX;
    this.hookY = this.tipY;
    this.lineGfx.clear();
    this.hideFightingFish();
    this.drawRod();
  }

  destroy() {
    this.rodGfx.destroy();
    this.lineGfx.destroy();
    this.fishGfx.destroy();
  }
}
