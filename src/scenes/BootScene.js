import Phaser from 'phaser';
import { GAME, COLORS } from '../constants.js';
import { loadGame, resetSave } from '../data/save.js';
import { audio } from '../objects/AudioManager.js';

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
    this.add.text(cx, cy - 80, 'BAIT', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '72px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#1B4965',
      strokeThickness: 6
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(cx, cy - 10, 'A Fishing Simulation', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '20px',
      color: '#C2B280'
    }).setOrigin(0.5);

    // Check for existing save
    const saveData = loadGame();
    const hasSave = saveData.stats.totalCasts > 0;

    if (hasSave) {
      // Show save info
      const uniqueSpecies = Object.keys(saveData.encyclopedia).filter(k => saveData.encyclopedia[k]?.caught).length;
      this.add.text(cx, cy + 30, `${saveData.stats.totalCatches} catches | ${uniqueSpecies}/7 species | ${saveData.money} coins`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: '#7777AA'
      }).setOrigin(0.5);

      // Continue button
      const continueBtn = this.add.text(cx, cy + 65, 'Continue', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#88AACC',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      this.tweens.add({
        targets: continueBtn,
        alpha: 0.4,
        duration: 800,
        yoyo: true,
        repeat: -1
      });

      continueBtn.on('pointerdown', () => this.startGame(saveData));

      // New game option
      const newBtn = this.add.text(cx, cy + 100, 'New Game', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#666688'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      newBtn.on('pointerdown', () => {
        const fresh = resetSave();
        this.startGame(fresh);
      });
      newBtn.on('pointerover', () => newBtn.setColor('#FF6644'));
      newBtn.on('pointerout', () => newBtn.setColor('#666688'));

      // Keyboard
      this.input.keyboard.once('keydown-SPACE', () => this.startGame(saveData));
      this.input.keyboard.once('keydown-N', () => this.startGame(resetSave()));
    } else {
      // First time — simple start
      const prompt = this.add.text(cx, cy + 80, 'Press any key to start', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#aaaacc'
      }).setOrigin(0.5);

      this.tweens.add({
        targets: prompt,
        alpha: 0.3,
        duration: 800,
        yoyo: true,
        repeat: -1
      });

      const startNew = () => this.startGame(saveData);
      this.input.keyboard.once('keydown', startNew);
      this.input.once('pointerdown', startNew);
    }
  }

  startGame(saveData) {
    // Initialize audio on first user interaction (required by browsers)
    audio.init();
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('FishingScene', { saveData });
    });
  }
}
