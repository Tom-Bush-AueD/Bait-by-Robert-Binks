import { CASTING_BAR, COLORS, CAST } from '../constants.js';

export default class CastingBar {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.x = options.x ?? CASTING_BAR.X;
    this.y = options.y ?? CASTING_BAR.Y;
    this.barWidth = options.width ?? CASTING_BAR.WIDTH;
    this.barHeight = options.height ?? CASTING_BAR.HEIGHT;
    this.indicatorHeight = CASTING_BAR.INDICATOR_HEIGHT;
    this.sweetSpotRatio = options.sweetSpotRatio ?? CASTING_BAR.SWEET_SPOT_RATIO;
    this.speed = options.speed ?? CASTING_BAR.BASE_SPEED;

    // Indicator state
    this.indicatorY = this.y;
    this.direction = 1; // 1 = down, -1 = up
    this.active = false;

    // Sweet spot bounds
    this.sweetSpotHeight = this.barHeight * this.sweetSpotRatio;
    this.sweetSpotY = this.y + (this.barHeight - this.sweetSpotHeight) / 2;

    // Graphics
    this.gfx = scene.add.graphics();
    this.gfx.setDepth(10);
    this.gfx.setVisible(false);

    this.drawBar();
  }

  drawBar() {
    this.gfx.clear();

    // Bar background
    this.gfx.fillStyle(COLORS.BAR_BG, 0.9);
    this.gfx.fillRect(this.x, this.y, this.barWidth, this.barHeight);

    // Outer zones (red/danger)
    this.gfx.fillStyle(COLORS.BAR_OUTER, 0.3);
    this.gfx.fillRect(this.x, this.y, this.barWidth, this.barHeight);

    // Sweet spot zone (green)
    this.gfx.fillStyle(COLORS.BAR_SWEET, 0.5);
    this.gfx.fillRect(this.x, this.sweetSpotY, this.barWidth, this.sweetSpotHeight);

    // Border
    this.gfx.lineStyle(2, COLORS.BAR_BORDER, 1);
    this.gfx.strokeRect(this.x, this.y, this.barWidth, this.barHeight);

    // Sweet spot border lines
    this.gfx.lineStyle(1, COLORS.BAR_SWEET, 0.8);
    this.gfx.lineBetween(this.x, this.sweetSpotY, this.x + this.barWidth, this.sweetSpotY);
    this.gfx.lineBetween(
      this.x, this.sweetSpotY + this.sweetSpotHeight,
      this.x + this.barWidth, this.sweetSpotY + this.sweetSpotHeight
    );

    // Indicator
    if (this.active || this.gfx.visible) {
      this.gfx.fillStyle(COLORS.BAR_INDICATOR, 1);
      this.gfx.fillRect(
        this.x - 2,
        this.indicatorY,
        this.barWidth + 4,
        this.indicatorHeight
      );
    }
  }

  update(delta) {
    if (!this.active) return;

    // Clamp delta to prevent indicator teleporting when tab is backgrounded
    const clampedDelta = Math.min(delta, 33);

    this.indicatorY += this.direction * this.speed * (clampedDelta / 1000);

    // Bounce off top/bottom edges
    if (this.indicatorY <= this.y) {
      this.indicatorY = this.y;
      this.direction = 1;
    } else if (this.indicatorY + this.indicatorHeight >= this.y + this.barHeight) {
      this.indicatorY = this.y + this.barHeight - this.indicatorHeight;
      this.direction = -1;
    }

    this.drawBar();
  }

  stop() {
    this.active = false;

    // Calculate accuracy based on distance from sweet spot center
    const indicatorCenter = this.indicatorY + this.indicatorHeight / 2;
    const sweetSpotCenter = this.sweetSpotY + this.sweetSpotHeight / 2;
    const maxDistance = this.barHeight / 2;
    const distance = Math.abs(indicatorCenter - sweetSpotCenter);

    // Normalize: 1.0 = perfect center, 0.0 = edge of bar
    const accuracy = Math.max(0, 1 - (distance / maxDistance));

    let rating;
    if (accuracy >= CAST.PERFECT_THRESHOLD) {
      rating = 'perfect';
    } else if (accuracy >= CAST.GOOD_THRESHOLD) {
      rating = 'good';
    } else {
      rating = 'poor';
    }

    this.drawBar();

    return { accuracy, rating };
  }

  start() {
    this.active = true;
    this.indicatorY = this.y;
    this.direction = 1;
    this.gfx.setVisible(true);
    this.drawBar();
  }

  reset() {
    this.active = false;
    this.indicatorY = this.y;
    this.direction = 1;
  }

  show() {
    this.gfx.setVisible(true);
    this.drawBar();
  }

  hide() {
    this.active = false;
    this.gfx.setVisible(false);
  }

  destroy() {
    this.gfx.destroy();
  }
}
