import Phaser from 'phaser';
import { GAME, COLORS } from '../constants.js';
import { RARITY_COLORS } from '../data/fish.js';
import { getFishSellPrice } from '../data/gear.js';
import { saveGame } from '../data/save.js';

export default class CatchScene extends Phaser.Scene {
  constructor() {
    super('CatchScene');
  }

  init(data) {
    this.caughtFish = data.fish;
    this.saveData = data.saveData;
    this.isNewRecord = data.isNewRecord || false;
    this.extraAchievements = data.extraAchievements || [];
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
      fontSize: '34px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Rarity tag
    this.add.text(cx, 325, this.caughtFish.rarity.toUpperCase(), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: rarityColor,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Weight
    this.add.text(cx, 355, `${this.caughtFish.weight} kg`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#C2B280',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Sell value
    const sellPrice = getFishSellPrice(this.caughtFish);
    this.add.text(cx, 382, `Value: ${sellPrice} coins`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // New record badge
    let nextY = 410;
    if (this.isNewRecord) {
      const recordText = this.add.text(cx, nextY, 'NEW RECORD!', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
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
      nextY += 25;
    }

    // Description
    this.add.text(cx, nextY, `"${this.caughtFish.description}"`, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '15px',
      fontStyle: 'italic',
      color: '#8888AA',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    nextY += 28;

    // Extra achievements summary (if any)
    if (this.extraAchievements.length > 0) {
      const names = this.extraAchievements.map(a => a.name).join(', ');
      this.add.text(cx, nextY, `+${this.extraAchievements.length} more: ${names}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
      nextY += 22;
    }

    // Money display
    this.add.text(cx, nextY, `Money: ${this.saveData.money} coins`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    nextY += 22;

    // Catch stats
    const uniqueSpecies = Object.keys(this.saveData.encyclopedia).filter(
      k => this.saveData.encyclopedia[k]?.caught
    ).length;
    const totalCatches = this.saveData.stats.totalCatches || 0;

    this.add.text(cx, nextY, `Total catches: ${totalCatches}  |  Species found: ${uniqueSpecies}/7`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: '#7777AA',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);

    // Action buttons
    const btnY = Math.max(nextY + 40, 530);

    const continueBtn = this.add.text(cx - 80, btnY, 'Continue', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#88AACC',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const shopBtn = this.add.text(cx + 80, btnY, 'Go to Shop', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    continueBtn.on('pointerdown', () => this.goFishing());
    continueBtn.on('pointerover', () => continueBtn.setColor('#FFFFFF'));
    continueBtn.on('pointerout', () => continueBtn.setColor('#88AACC'));

    shopBtn.on('pointerdown', () => this.goShop());
    shopBtn.on('pointerover', () => shopBtn.setColor('#FFFFFF'));
    shopBtn.on('pointerout', () => shopBtn.setColor('#FFD700'));

    // Keyboard: SPACE to continue, S for shop
    this.input.keyboard.once('keydown-SPACE', () => this.goFishing());
    this.input.keyboard.once('keydown-S', () => this.goShop());

    // Prompt hint
    this.add.text(cx, btnY + 28, 'SPACE: continue  |  S: shop', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#555577'
    }).setOrigin(0.5);
  }

  goFishing() {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('FishingScene', { saveData: this.saveData });
    });
  }

  goShop() {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('ShopScene', { saveData: this.saveData });
    });
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
