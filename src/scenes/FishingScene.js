import Phaser from 'phaser';
import { GAME } from '../constants.js';
import { drawBackground } from '../objects/Background.js';
import CastingBar from '../objects/CastingBar.js';
import FishingRod from '../objects/FishingRod.js';

const STATES = {
  IDLE: 'idle',
  CASTING: 'casting',
  ANIMATING: 'animating',
  RESULT: 'result'
};

export default class FishingScene extends Phaser.Scene {
  constructor() {
    super('FishingScene');
    this.state = STATES.IDLE;
  }

  create() {
    this.cameras.main.fadeIn(500);

    // Draw the environment
    drawBackground(this);

    // Create game objects
    this.castingBar = new CastingBar(this);
    this.fishingRod = new FishingRod(this);

    // HUD text elements
    this.promptText = this.add.text(GAME.WIDTH / 2, 30, 'Press SPACE to cast', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(20);

    this.ratingText = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 60, '', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(20).setVisible(false);

    this.distanceText = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 20, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#C2B280',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(20).setVisible(false);

    // Blink prompt
    this.promptTween = this.tweens.add({
      targets: this.promptText,
      alpha: 0.4,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // Input handling
    this.input.keyboard.on('keydown-SPACE', () => this.handleInput());
    this.input.on('pointerdown', () => this.handleInput());

    this.state = STATES.IDLE;
  }

  handleInput() {
    switch (this.state) {
      case STATES.IDLE:
        this.startCasting();
        break;
      case STATES.CASTING:
        this.stopCasting();
        break;
      case STATES.RESULT:
        this.resetToIdle();
        break;
    }
  }

  startCasting() {
    this.state = STATES.CASTING;

    // Update prompt
    this.promptText.setText('Press SPACE to stop!');
    this.promptText.setColor('#FFFF00');

    // Hide result texts
    this.ratingText.setVisible(false);
    this.distanceText.setVisible(false);

    // Show and start casting bar
    this.castingBar.start();
  }

  stopCasting() {
    this.state = STATES.ANIMATING;

    // Stop the bar and get accuracy
    const result = this.castingBar.stop();

    // Show rating
    this.showRating(result);

    // Hide casting bar after brief delay
    this.time.delayedCall(300, () => {
      this.castingBar.hide();
    });

    // Update prompt
    this.promptText.setText('');

    // Play cast animation
    this.fishingRod.playCastAnimation(result.accuracy, (distance) => {
      this.onCastComplete(distance, result);
    });
  }

  showRating(result) {
    const ratingConfig = {
      perfect: { text: 'Perfect!', color: '#44FF44' },
      good: { text: 'Good', color: '#FFDD44' },
      poor: { text: 'Poor', color: '#FF6644' }
    };

    const config = ratingConfig[result.rating];
    this.ratingText.setText(config.text);
    this.ratingText.setColor(config.color);
    this.ratingText.setVisible(true);
    this.ratingText.setAlpha(1);
    this.ratingText.setScale(1.5);

    // Animate rating text
    this.tweens.add({
      targets: this.ratingText,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });

    // Fade out after a moment
    this.time.delayedCall(1500, () => {
      this.tweens.add({
        targets: this.ratingText,
        alpha: 0,
        duration: 500
      });
    });
  }

  onCastComplete(distance, result) {
    this.state = STATES.RESULT;

    // Show distance
    const distanceMeters = Math.round(distance / 10);
    this.distanceText.setText(`Cast distance: ${distanceMeters}m`);
    this.distanceText.setVisible(true);

    // Update prompt
    this.promptText.setText('Press SPACE to cast again');
    this.promptText.setColor('#ffffff');
  }

  resetToIdle() {
    this.state = STATES.IDLE;

    // Reset game objects
    this.fishingRod.reset();
    this.castingBar.reset();

    // Reset HUD
    this.ratingText.setVisible(false);
    this.distanceText.setVisible(false);
    this.promptText.setText('Press SPACE to cast');
    this.promptText.setColor('#ffffff');
  }

  update(time, delta) {
    if (this.state === STATES.CASTING) {
      this.castingBar.update(delta);
    }

    // Continuously redraw the line when bobber is visible
    if (this.state === STATES.RESULT) {
      this.fishingRod.drawLine();
    }
  }
}
