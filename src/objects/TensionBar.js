import { COLORS, GAME } from '../constants.js';

// Horizontal tension bar for the reeling mini-game
// Tension model:
//   Fish swims AWAY → tension increases (line gets tight)
//   Fish stays STILL → tension slowly drops, can reel gently
//   Fish swims TOWARD you → tension drops fast, easy to reel
//   Reeling adds tension. Not reeling lets tension drop naturally.
//   Line snaps if tension exceeds threshold. No slack-escape mechanic.
//   Surges = tension spike + reel progress loss.
//   Random chance of final surge at 90%+ reel progress.

export default class TensionBar {
  constructor(scene) {
    this.scene = scene;

    // Position and dimensions
    this.x = GAME.WIDTH / 2 - 150;
    this.y = GAME.HEIGHT - 60;
    this.barWidth = 300;
    this.barHeight = 20;

    // Tension state (0 = no tension, 1 = max)
    this.tension = 0.15;
    this.reelProgress = 0; // 0 to 1, fish is caught at 1

    // Snap threshold — only danger is HIGH tension
    this.snapThreshold = 0.95;

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
    this.pullDirection = 0; // 1 = away, -1 = toward, 0 = still
    this.pullInterval = 1500;
    this.surgeTimer = 0;
    this.isSurging = false;
    this.hadFinalSurge = false;

    // Graphics
    this.gfx = scene.add.graphics();
    this.gfx.setDepth(15);
    this.gfx.setVisible(false);

    // Labels
    this.tensionLabel = scene.add.text(this.x + this.barWidth / 2, this.y - 14, 'LINE TENSION', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(15).setVisible(false);

    this.progressLabel = scene.add.text(this.x + this.barWidth / 2, this.y + this.barHeight + 14, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(15).setVisible(false);

    // Fish direction indicator
    this.dirLabel = scene.add.text(this.x + this.barWidth + 10, this.y + this.barHeight / 2, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0, 0.5).setDepth(15).setVisible(false);
  }

  configure(fishInstance, bonuses = {}) {
    this.fishStrength = fishInstance.strength;
    this.fishStamina = fishInstance.stamina;
    this.fishEnergy = 1.0;
    this.tension = 0.15;
    this.reelProgress = 0;
    this.pullTimer = 0;
    this.surgeTimer = 0;
    this.isSurging = false;
    this.hadFinalSurge = false;
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
    this.dirLabel.setVisible(true);
  }

  hide() {
    this.gfx.setVisible(false);
    this.tensionLabel.setVisible(false);
    this.progressLabel.setVisible(false);
    this.dirLabel.setVisible(false);
  }

  // Returns: 'reeling' | 'caught' | 'snapped'
  update(delta, isReeling) {
    const dt = Math.min(delta, 33) / 1000;

    // Fish energy depletes over time
    this.fishEnergy = Math.max(0.1, this.fishEnergy - dt * 0.02 * (1 - this.fishStamina));

    // Fish fight behavior — random direction changes
    this.pullTimer += delta;
    if (this.pullTimer >= this.pullInterval) {
      this.pullTimer = 0;
      this.pullInterval = 800 + Math.random() * 1200;

      const rand = Math.random();
      if (rand < 0.4) {
        this.pullDirection = 1;  // swimming away — tension rises
      } else if (rand < 0.65) {
        this.pullDirection = -1; // swimming toward — tension drops
      } else {
        this.pullDirection = 0;  // staying still — tension slowly drops
      }

      // Surge chance — based on fish strength and remaining energy
      if (Math.random() < this.fishStrength * 0.35 * this.fishEnergy) {
        this.isSurging = true;
        this.surgeTimer = 400 + Math.random() * 600;
      }
    }

    // Final surge chance at 90%+ progress
    if (this.reelProgress >= 0.9 && !this.hadFinalSurge) {
      if (Math.random() < 0.5) {
        // Desperate final fight!
        this.hadFinalSurge = true;
        this.isSurging = true;
        this.surgeTimer = 600 + Math.random() * 500;
        this.pullDirection = 1; // fish bolts away
        this.fishEnergy = Math.max(this.fishEnergy, 0.5); // temporary energy boost
      } else {
        // Fish gives up — energy drops
        this.hadFinalSurge = true;
        this.fishEnergy = Math.min(this.fishEnergy, 0.15);
      }
    }

    if (this.isSurging) {
      this.surgeTimer -= delta;
      if (this.surgeTimer <= 0) this.isSurging = false;
    }

    // === TENSION PHYSICS ===
    // Fish swimming away increases tension
    // Fish swimming toward decreases tension
    // Fish still = slight tension decrease
    const stabilityMod = 1 - this.tensionStability;

    if (this.pullDirection === 1) {
      // Fish swimming AWAY — line gets tight
      const pullForce = this.fishStrength * this.fishEnergy * 0.5;
      const surgeMult = this.isSurging ? 2.5 : 1.0;
      this.tension += pullForce * surgeMult * stabilityMod * dt;

      // Surges also pull line back out (lose reel progress)
      if (this.isSurging) {
        const progressLoss = this.fishStrength * this.fishEnergy * 0.06 * dt;
        this.reelProgress = Math.max(0, this.reelProgress - progressLoss);
      }
    } else if (this.pullDirection === -1) {
      // Fish swimming TOWARD player — tension drops fast
      this.tension -= 0.35 * dt;
    } else {
      // Fish staying still — tension drops slowly
      this.tension -= 0.15 * dt;
    }

    // Reeling increases tension and progress
    if (isReeling) {
      // Reeling always adds some tension
      this.tension += 0.35 * dt * this.reelSpeedMult;

      // Reel progress depends on how manageable the tension is
      // Best progress when tension is moderate (0.3-0.6 range)
      // Poor progress when tension is very high (fighting the fish)
      // Good progress when tension is low (fish is calm/toward)
      let progressMult;
      if (this.tension < 0.7) {
        // Comfortable range — good progress
        progressMult = 1.0;
      } else {
        // High tension — diminishing returns, risky
        progressMult = Math.max(0.2, 1.0 - (this.tension - 0.7) * 3);
      }

      const baseRate = 0.10 * (1 + this.reelBonus) * this.reelSpeedMult;
      const tiredBonus = 1 + (1 - this.fishEnergy) * 0.5; // tired fish = faster reel
      this.reelProgress += baseRate * progressMult * tiredBonus * dt;
    } else {
      // Not reeling — tension drops naturally
      this.tension -= 0.20 * dt;
    }

    // Clamp tension (can reach 0, that's fine — no slack penalty)
    this.tension = Math.max(0, Math.min(1, this.tension));
    this.reelProgress = Math.max(0, Math.min(1, this.reelProgress));

    // Update labels
    const pct = Math.floor(this.reelProgress * 100);
    this.progressLabel.setText(`Reeling in: ${pct}%`);

    // Direction indicator
    if (this.pullDirection === 1) {
      this.dirLabel.setText(this.isSurging ? 'SURGE!' : 'pulling away');
      this.dirLabel.setColor(this.isSurging ? '#FF4444' : '#FFAA44');
    } else if (this.pullDirection === -1) {
      this.dirLabel.setText('swimming in');
      this.dirLabel.setColor('#44DD88');
    } else {
      this.dirLabel.setText('resting');
      this.dirLabel.setColor('#88AACC');
    }

    this.draw();

    // Check end conditions
    if (this.reelProgress >= 1) return 'caught';
    if (this.tension >= this.snapThreshold) return 'snapped';

    return 'reeling';
  }

  draw() {
    this.gfx.clear();

    // Background
    this.gfx.fillStyle(0x1A1A2E, 0.9);
    this.gfx.fillRect(this.x, this.y, this.barWidth, this.barHeight);

    // Danger zone (HIGH tension only — right side)
    const dangerStart = this.barWidth * 0.75;
    this.gfx.fillStyle(0xCC4444, 0.3);
    this.gfx.fillRect(this.x + dangerStart, this.y, this.barWidth - dangerStart, this.barHeight);

    // Warning zone (medium-high)
    const warnStart = this.barWidth * 0.6;
    this.gfx.fillStyle(0xCCAA44, 0.15);
    this.gfx.fillRect(this.x + warnStart, this.y, dangerStart - warnStart, this.barHeight);

    // Safe zone (low-medium tension — the bulk of the bar)
    this.gfx.fillStyle(0x44BB44, 0.15);
    this.gfx.fillRect(this.x, this.y, warnStart, this.barHeight);

    // Tension indicator
    const indicatorX = this.x + this.tension * this.barWidth;
    let indicatorColor = 0x44FF44;
    if (this.tension > 0.85) {
      indicatorColor = 0xFF4444;
    } else if (this.tension > 0.7) {
      indicatorColor = 0xFFAA44;
    } else if (this.tension > 0.55) {
      indicatorColor = 0xFFFF44;
    }

    this.gfx.fillStyle(indicatorColor, 1);
    this.gfx.fillRect(indicatorX - 3, this.y - 3, 6, this.barHeight + 6);

    // Border
    this.gfx.lineStyle(2, 0x444466, 1);
    this.gfx.strokeRect(this.x, this.y, this.barWidth, this.barHeight);

    // Snap threshold marker
    const snapX = this.x + this.snapThreshold * this.barWidth;
    this.gfx.lineStyle(2, 0xFF2222, 0.6);
    this.gfx.lineBetween(snapX, this.y - 4, snapX, this.y + this.barHeight + 4);

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
    this.dirLabel.destroy();
  }
}
