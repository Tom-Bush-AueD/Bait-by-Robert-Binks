import Phaser from 'phaser';
import { GAME, COLORS } from '../constants.js';
import { RARITY_COLORS } from '../data/fish.js';

export default class CatchScene extends Phaser.Scene {
  constructor() {
    super('CatchScene');
  }

  init(data) {
    this.caughtFish = data.fish;        // the fish instance just caught
    this.catchLog = data.catchLog || []; // full catch history
    this.isNewRecord = data.isNewRecord || false;
  }

  create() {
    this.cameras.main.fadeIn(300);
    const cx = GAME.WIDTH / 2;

    // Background overlay
    const bg = this.add.graphics();
    bg.fillGradientStyle(
      COLORS.WATER_BOTTOM, COLORS.WATER_BOTTOM,
      0x0A0A1A, 0x0A0A1A, 1
    );
    bg.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    // Draw the caught fish
    this.drawFishDisplay(cx, 200, this.caughtFish);

    // "CATCH!" header
    const rarityColor = RARITY_COLORS[this.caughtFish.rarity] || '#FFFFFF';
    this.add.text(cx, 50, 'CATCH!', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '48px',
      fontStyle: 'bold',
      color: rarityColor,
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5);

    // Fish name
    this.add.text(cx, 290, this.caughtFish.species, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Rarity tag
    this.add.text(cx, 325, this.caughtFish.rarity.toUpperCase(), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: rarityColor,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Weight
    this.add.text(cx, 355, `${this.caughtFish.weight} kg`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#C2B280',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // New record badge
    if (this.isNewRecord) {
      const recordText = this.add.text(cx, 385, 'NEW RECORD!', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#FFDD44',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5);

      this.tweens.add({
        targets: recordText,
        scale: 1.15,
        duration: 600,
        yoyo: true,
        repeat: -1
      });
    }

    // Description
    this.add.text(cx, 415, `"${this.caughtFish.description}"`, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '14px',
      fontStyle: 'italic',
      color: '#8888AA',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);

    // Catch stats
    const uniqueSpecies = new Set(this.catchLog.map(f => f.species)).size;
    const totalCatches = this.catchLog.length;

    this.add.text(cx, 470, `Total catches: ${totalCatches}  |  Species found: ${uniqueSpecies}/7`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#7777AA',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);

    // Continue prompt
    const prompt = this.add.text(cx, 540, 'Press any key to continue fishing', {
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

    // Input to go back
    const goBack = () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('FishingScene', { catchLog: this.catchLog });
      });
    };

    this.input.keyboard.once('keydown', goBack);
    this.input.once('pointerdown', goBack);
  }

  drawFishDisplay(x, y, fish) {
    const gfx = this.add.graphics();
    gfx.setDepth(2);

    const bodyWidth = 60 + fish.weight * 4;
    const bodyHeight = 30 + fish.weight * 2;

    // Fish body (ellipse)
    gfx.fillStyle(fish.color, 1);
    gfx.fillEllipse(x, y, bodyWidth, bodyHeight);

    // Accent stripe
    gfx.fillStyle(fish.accentColor, 0.6);
    gfx.fillEllipse(x, y + bodyHeight * 0.1, bodyWidth * 0.85, bodyHeight * 0.4);

    // Tail fin
    gfx.fillStyle(fish.color, 0.9);
    gfx.fillTriangle(
      x - bodyWidth / 2 - 5, y,
      x - bodyWidth / 2 - 20, y - bodyHeight * 0.4,
      x - bodyWidth / 2 - 20, y + bodyHeight * 0.4
    );

    // Dorsal fin
    gfx.fillStyle(fish.accentColor, 0.7);
    gfx.fillTriangle(
      x - 5, y - bodyHeight / 2,
      x + 15, y - bodyHeight / 2 - 12,
      x + 20, y - bodyHeight / 2
    );

    // Eye
    gfx.fillStyle(0xFFFFFF, 1);
    gfx.fillCircle(x + bodyWidth * 0.3, y - 3, 5);
    gfx.fillStyle(0x111111, 1);
    gfx.fillCircle(x + bodyWidth * 0.3 + 1, y - 3, 2.5);

    // Mouth
    gfx.lineStyle(1, 0x333333, 0.6);
    gfx.lineBetween(x + bodyWidth / 2, y + 2, x + bodyWidth / 2 - 8, y + 5);

    // Glow for rare fish
    if (fish.rarity === 'legendary') {
      gfx.lineStyle(2, fish.accentColor, 0.3);
      gfx.strokeEllipse(x, y, bodyWidth + 15, bodyHeight + 15);
      gfx.lineStyle(1, fish.accentColor, 0.15);
      gfx.strokeEllipse(x, y, bodyWidth + 25, bodyHeight + 25);
    } else if (fish.rarity === 'rare') {
      gfx.lineStyle(1, 0x4488FF, 0.2);
      gfx.strokeEllipse(x, y, bodyWidth + 12, bodyHeight + 12);
    }
  }
}
