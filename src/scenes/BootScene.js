import Phaser from 'phaser';
import { GAME, COLORS } from '../constants.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    const cx = GAME.WIDTH / 2;
    const cy = GAME.HEIGHT / 2;

    // Draw a subtle water background
    const bg = this.add.graphics();
    bg.fillGradientStyle(COLORS.SKY_BOTTOM, COLORS.SKY_BOTTOM, COLORS.WATER_TOP, COLORS.WATER_TOP, 1);
    bg.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    // Title
    this.add.text(cx, cy - 60, 'BAIT', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '72px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#1B4965',
      strokeThickness: 6
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(cx, cy + 10, 'A Fishing Simulation', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '20px',
      color: '#C2B280'
    }).setOrigin(0.5);

    // Prompt
    const prompt = this.add.text(cx, cy + 80, 'Press any key to start', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#aaaacc'
    }).setOrigin(0.5);

    // Blink the prompt
    this.tweens.add({
      targets: prompt,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // Start on any input
    const startGame = () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('FishingScene');
      });
    };

    this.input.keyboard.once('keydown', startGame);
    this.input.once('pointerdown', startGame);
  }
}
