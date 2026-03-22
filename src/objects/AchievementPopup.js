import { GAME } from '../constants.js';

// Shows a brief achievement unlock notification
export default class AchievementPopup {
  constructor(scene) {
    this.scene = scene;
    this.queue = [];
    this.showing = false;
  }

  show(achievement) {
    this.queue.push(achievement);
    if (!this.showing) this.showNext();
  }

  showNext() {
    if (this.queue.length === 0) {
      this.showing = false;
      return;
    }

    this.showing = true;
    const ach = this.queue.shift();

    const y = 50;
    const cx = GAME.WIDTH / 2;

    // Background
    const bg = this.scene.add.graphics();
    bg.setDepth(50);
    bg.fillStyle(0x2A2A1E, 0.9);
    bg.fillRoundedRect(cx - 140, y - 5, 280, 50, 8);
    bg.lineStyle(2, 0xFFD700, 0.6);
    bg.strokeRoundedRect(cx - 140, y - 5, 280, 50, 8);

    const title = this.scene.add.text(cx, y + 5, 'Achievement Unlocked!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5).setDepth(51);

    const name = this.scene.add.text(cx, y + 25, ach.name, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(51);

    // Animate in
    const elements = [bg, title, name];
    elements.forEach(e => { e.setAlpha(0); e.y -= 20; });

    this.scene.tweens.add({
      targets: elements,
      alpha: 1,
      y: '+=20',
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Hold, then fade out
        this.scene.time.delayedCall(2000, () => {
          this.scene.tweens.add({
            targets: elements,
            alpha: 0,
            y: '-=20',
            duration: 300,
            onComplete: () => {
              elements.forEach(e => e.destroy());
              this.showNext();
            }
          });
        });
      }
    });
  }
}
