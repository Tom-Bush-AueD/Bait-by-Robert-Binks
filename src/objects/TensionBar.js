import { COLORS, GAME } from '../constants.js';

// Horizontal tension bar for the reeling mini-game
export default class TensionBar {
  constructor(scene) {
    this.scene = scene;

    // Position and dimensions
    this.x = GAME.WIDTH / 2 - 150;
    this.y = GAME.HEIGHT - 60;
    this.barWidth = 300;
    this.barHeight = 20;

    // Tension state (0 = slack, 1 = max)
    this.tension = 0.3;
    this.reelProgress = 0; // 0 to 1, fish is caught at 1

    // Danger zones
    this.snapThreshold = 0.95;  // line snaps above this
    this.slackThreshold = 0.05; // fish escapes below this

    // Fish fight parameters (set per-fish)
    this.fishStrength = 0.5;
    this.fishStamina = 0.5;
    this.fishEnergy = 1.0; // depletes as fight goes on

    // Gear bonuses
    this.reelSpeedMult = 1.0;
    this.tensionRangeMult = 1.0;
    this.reelBonus = 0;
    this.tensionStability = 0;

    // Fight behavior
    this.pullTimer = 0;
    this.pullDirection = 0;
    this.pullInterval = 1500;
    this.surgeTimer = 0;
    this.isSurging = false;

    // Graphics
    this.gfx = scene.add.graphics();
    this.gfx.setDepth(15);
    this.gfx.setVisible(false);

    // Labels
    this.tensionLabel = scene.add.text(this.x + this.barWidth / 2, this.y - 12, 'LINE TENSION', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: '#AAAACC',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(15).setVisible(false);

    this.progressLabel = scene.add.text(this.x + this.barWidth / 2, this.y + this.barHeight + 14, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#C2B280',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(15).setVisible(false);
  }

  configure(fishInstance, bonuses = {}) {
    this.fishStrength = fishInstance.strength;
    this.fishStamina = fishInstance.stamina;
    this.fishEnergy = 1.0;
    this.tension = 0.3;
    this.reelProgress = 0;
    this.pullTimer = 0;
    this.surgeTimer = 0;
    this.isSurging = false;
    this.pullDirection = 0;
    this.pullInterval = 1200 + Math.random() * 800;

    // Apply gear bonuses
    this.reelSpeedMult = bonuses.reelSpeed || 1.0;
    this.tensionRangeMult = bonuses.tensionRange || 1.0;
    this.snapThreshold = bonuses.snapThreshold || 0.95;
    this.reelBonus = bonuses.reelBonus || 0;
    this.tensionStability = bonuses.tensionStability || 0;

    // Line strength reduces effective fish strength
    const lineStrength = bonuses.lineStrength || 0;
    this.fishStrength = Math.max(0.1, this.fishStrength - lineStrength);
  }

  show() {
    this.gfx.setVisible(true);
    this.tensionLabel.setVisible(true);
    this.progressLabel.setVisible(true);
  }

  hide() {
    this.gfx.setVisible(false);
    this.tensionLabel.setVisible(false);
    this.progressLabel.setVisible(false);
  }

  // Returns: 'reeling' | 'caught' | 'snapped' | 'escaped'
  update(delta, isReeling) {
    const dt = Math.min(delta, 33) / 1000;

    // Fish energy depletes over time
    this.fishEnergy = Math.max(0.1, this.fishEnergy - dt * 0.02 * (1 - this.fishStamina));

    // Fish fight behavior — random pulls
    this.pullTimer += delta;
    if (this.pullTimer >= this.pullInterval) {
      this.pullTimer = 0;
      this.pullInterval = 800 + Math.random() * 1200;

      const rand = Math.random();
      if (rand < 0.4) {
        this.pullDirection = 1;
      } else if (rand < 0.7) {
        this.pullDirection = -1;
      } else {
        this.pullDirection = 0;
      }

      if (Math.random() < this.fishStrength * 0.4 * this.fishEnergy) {
        this.isSurging = true;
        this.surgeTimer = 400 + Math.random() * 600;
      }
    }

    if (this.isSurging) {
      this.surgeTimer -= delta;
      if (this.surgeTimer <= 0) this.isSurging = false;
    }

    // Calculate tension changes
    const fishPull = this.pullDirection * this.fishStrength * this.fishEnergy * 0.6;
    const surgeMult = this.isSurging ? 2.0 : 1.0;
    // Tension stability from gear reduces fish pull effect
    const stabilityMod = 1 - this.tensionStability;

    this.tension += fishPull * surgeMult * stabilityMod * dt;

    // Reeling increases tension and progress
    if (isReeling) {
      this.tension += 0.4 * dt * this.reelSpeedMult;
      const tensionQuality = 1 - Math.abs(this.tension - 0.5) * 2;
      // Better reel speed from gear and crew
      const progressRate = 0.12 * (1 + this.reelBonus) * this.reelSpeedMult
        * Math.max(0, tensionQuality) * (1 + (1 - this.fishEnergy) * 0.5);
      this.reelProgress += progressRate * dt;
    } else {
      this.tension -= 0.25 * dt;
    }

    // Clamp tension
    this.tension = Math.max(0, Math.min(1, this.tension));
    this.reelProgress = Math.max(0, Math.min(1, this.reelProgress));

    const pct = Math.floor(this.reelProgress * 100);
    this.progressLabel.setText(`Reeling in: ${pct}%`);

    this.draw();

    if (this.reelProgress >= 1) return 'caught';
    if (this.tension >= this.snapThreshold) return 'snapped';
    if (this.tension <= this.slackThreshold && !isReeling && this.pullDirection === -1) {
      return 'reeling';
    }

    return 'reeling';
  }

  draw() {
    this.gfx.clear();

    // Background
    this.gfx.fillStyle(0x1A1A2E, 0.9);
    this.gfx.fillRect(this.x, this.y, this.barWidth, this.barHeight);

    // Danger zones (red edges)
    const dangerWidth = this.barWidth * 0.15;
    this.gfx.fillStyle(0xCC4444, 0.4);
    this.gfx.fillRect(this.x, this.y, dangerWidth, this.barHeight);
    this.gfx.fillRect(this.x + this.barWidth - dangerWidth, this.y, dangerWidth, this.barHeight);

    // Safe zone (green center)
    this.gfx.fillStyle(0x44BB44, 0.2);
    this.gfx.fillRect(this.x + dangerWidth, this.y, this.barWidth - dangerWidth * 2, this.barHeight);

    // Tension indicator
    const indicatorX = this.x + this.tension * this.barWidth;
    let indicatorColor = 0x44FF44;
    if (this.tension > 0.8 || this.tension < 0.15) {
      indicatorColor = 0xFF4444;
    } else if (this.tension > 0.65 || this.tension < 0.25) {
      indicatorColor = 0xFFAA44;
    }

    this.gfx.fillStyle(indicatorColor, 1);
    this.gfx.fillRect(indicatorX - 3, this.y - 3, 6, this.barHeight + 6);

    // Border
    this.gfx.lineStyle(2, 0x444466, 1);
    this.gfx.strokeRect(this.x, this.y, this.barWidth, this.barHeight);

    // Progress bar
    const progBarY = this.y + this.barHeight + 4;
    const progBarH = 6;
    this.gfx.fillStyle(0x1A1A2E, 0.7);
    this.gfx.fillRect(this.x, progBarY, this.barWidth, progBarH);
    this.gfx.fillStyle(0x44AAFF, 0.8);
    this.gfx.fillRect(this.x, progBarY, this.barWidth * this.reelProgress, progBarH);
    this.gfx.lineStyle(1, 0x444466, 0.6);
    this.gfx.strokeRect(this.x, progBarY, this.barWidth, progBarH);

    // Surge warning flash
    if (this.isSurging) {
      this.gfx.lineStyle(2, 0xFF4444, 0.6 + Math.sin(Date.now() * 0.02) * 0.4);
      this.gfx.strokeRect(this.x - 2, this.y - 2, this.barWidth + 4, this.barHeight + 4);
    }
  }

  destroy() {
    this.gfx.destroy();
    this.tensionLabel.destroy();
    this.progressLabel.destroy();
  }
}
