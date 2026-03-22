import Phaser from 'phaser';
import { COLORS, ROD_CONFIG, CAST, CAST_ARC, WATER_LINE_Y } from '../constants.js';

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
    const splashTween = this.scene.tweens.addCounter({
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

  reset() {
    this.bobberVisible = false;
    this.casting = false;
    this.hookX = this.tipX;
    this.hookY = this.tipY;
    this.lineGfx.clear();
    this.drawRod();
  }

  destroy() {
    this.rodGfx.destroy();
    this.lineGfx.destroy();
  }
}
