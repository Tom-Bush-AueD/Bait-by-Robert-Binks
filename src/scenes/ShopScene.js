import Phaser from 'phaser';
import { GAME, COLORS } from '../constants.js';
import { GEAR, getGearById, getFishSellPrice } from '../data/gear.js';
import { CREW_MEMBERS, getCrewById } from '../data/crew.js';
import { saveGame } from '../data/save.js';
import { audio } from '../objects/AudioManager.js';

export default class ShopScene extends Phaser.Scene {
  constructor() {
    super('ShopScene');
  }

  init(data) {
    this.saveData = data.saveData;
    this.unsoldFish = data.unsoldFish || null; // fish to sell if coming from catch
    this.tab = 'buy'; // 'buy' | 'sell' | 'crew'
    this.buyCategory = 'rods';
    this.scrollY = 0;
  }

  create() {
    this.cameras.main.fadeIn(300);
    const cx = GAME.WIDTH / 2;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1A1A2E, 0x1A1A2E, 0x0D0D1A, 0x0D0D1A, 1);
    bg.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    // Title
    this.add.text(cx, 25, 'SHOP', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Money display
    this.moneyText = this.add.text(GAME.WIDTH - 20, 20, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(1, 0);
    this.updateMoneyDisplay();

    // Tab buttons
    this.createTabs();

    // Content area
    this.contentContainer = this.add.container(0, 0);

    // Auto-sell fish if coming with one
    if (this.unsoldFish) {
      this.sellFish(this.unsoldFish);
      this.unsoldFish = null;
    }

    this.renderContent();

    // Back button
    this.createButton(cx, GAME.HEIGHT - 35, 'Back to Fishing', '#88AACC', () => {
      saveGame(this.saveData);
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('FishingScene', { saveData: this.saveData });
      });
    });
  }

  createTabs() {
    const tabs = [
      { key: 'buy', label: 'Buy Gear', x: 130 },
      { key: 'sell', label: 'Sell Fish', x: 310 },
      { key: 'crew', label: 'Hire Crew', x: 490 }
    ];

    this.tabTexts = {};
    tabs.forEach(t => {
      const txt = this.add.text(t.x, 60, t.label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: this.tab === t.key ? '#FFD700' : '#666688',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      txt.on('pointerdown', () => {
        this.tab = t.key;
        this.scrollY = 0;
        this.updateTabHighlights();
        this.renderContent();
      });

      txt.on('pointerover', () => txt.setColor('#FFFFFF'));
      txt.on('pointerout', () => txt.setColor(this.tab === t.key ? '#FFD700' : '#666688'));

      this.tabTexts[t.key] = txt;
    });
  }

  updateTabHighlights() {
    Object.entries(this.tabTexts).forEach(([key, txt]) => {
      txt.setColor(this.tab === key ? '#FFD700' : '#666688');
    });
  }

  updateMoneyDisplay() {
    this.moneyText.setText(`${this.saveData.money} coins`);
  }

  renderContent() {
    this.contentContainer.removeAll(true);

    if (this.tab === 'buy') {
      this.renderBuyTab();
    } else if (this.tab === 'sell') {
      this.renderSellTab();
    } else if (this.tab === 'crew') {
      this.renderCrewTab();
    }
  }

  renderBuyTab() {
    // Category sub-tabs
    const categories = [
      { key: 'rods', label: 'Rods' },
      { key: 'lines', label: 'Lines' },
      { key: 'baits', label: 'Bait' },
      { key: 'tackle', label: 'Tackle' }
    ];

    let catX = 100;
    categories.forEach(cat => {
      const txt = this.add.text(catX, 90, cat.label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: this.buyCategory === cat.key ? '#FFFFFF' : '#555577',
        stroke: '#000000',
        strokeThickness: 1
      }).setInteractive({ useHandCursor: true });

      txt.on('pointerdown', () => {
        this.buyCategory = cat.key;
        this.renderContent();
      });

      this.contentContainer.add(txt);
      catX += 90;
    });

    // Items list
    const items = GEAR[this.buyCategory] || [];
    let y = 125;

    items.forEach(item => {
      const owned = this.saveData.gear[item.id];
      const equipped = this.isEquipped(item.id);
      const canAfford = this.saveData.money >= item.price;

      // Item row background
      const rowBg = this.add.graphics();
      rowBg.fillStyle(owned ? 0x223322 : 0x1E1E32, 0.6);
      rowBg.fillRect(40, y - 5, GAME.WIDTH - 80, 55);
      if (equipped) {
        rowBg.lineStyle(1, 0x44BB44, 0.5);
        rowBg.strokeRect(40, y - 5, GAME.WIDTH - 80, 55);
      }
      this.contentContainer.add(rowBg);

      // Name
      this.contentContainer.add(
        this.add.text(55, y, item.name, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '15px',
          fontStyle: 'bold',
          color: owned ? '#88CC88' : '#FFFFFF',
          stroke: '#000000',
          strokeThickness: 2
        })
      );

      // Description
      this.contentContainer.add(
        this.add.text(55, y + 20, item.description, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          color: '#888899'
        })
      );

      // Stats summary
      const stats = this.getGearStats(item);
      if (stats) {
        this.contentContainer.add(
          this.add.text(55, y + 35, stats, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '10px',
            color: '#66AACC'
          })
        );
      }

      // Price / status
      if (owned && equipped) {
        this.contentContainer.add(
          this.add.text(GAME.WIDTH - 55, y + 10, 'EQUIPPED', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#44BB44'
          }).setOrigin(1, 0)
        );
      } else if (owned) {
        const equipBtn = this.add.text(GAME.WIDTH - 55, y + 10, '[Equip]', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '13px',
          fontStyle: 'bold',
          color: '#44AAFF'
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

        equipBtn.on('pointerdown', () => {
          this.equipGear(item.id);
          this.renderContent();
        });
        equipBtn.on('pointerover', () => equipBtn.setColor('#FFFFFF'));
        equipBtn.on('pointerout', () => equipBtn.setColor('#44AAFF'));
        this.contentContainer.add(equipBtn);
      } else if (item.price === 0) {
        // Free starter item, auto-own
        this.saveData.gear[item.id] = true;
        this.renderContent();
        return;
      } else {
        const priceColor = canAfford ? '#FFD700' : '#FF4444';
        const buyBtn = this.add.text(GAME.WIDTH - 55, y + 5, `${item.price}`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          fontStyle: 'bold',
          color: priceColor
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

        if (canAfford) {
          const buyLabel = this.add.text(GAME.WIDTH - 55, y + 24, '[Buy]', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            color: '#44FF44'
          }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

          buyLabel.on('pointerdown', () => {
            this.buyGear(item);
            this.renderContent();
          });
          buyLabel.on('pointerover', () => buyLabel.setColor('#FFFFFF'));
          buyLabel.on('pointerout', () => buyLabel.setColor('#44FF44'));
          this.contentContainer.add(buyLabel);
        }

        this.contentContainer.add(buyBtn);
      }

      y += 65;
    });
  }

  renderSellTab() {
    const catchLog = this.saveData.catchLog || [];

    if (catchLog.length === 0) {
      this.contentContainer.add(
        this.add.text(GAME.WIDTH / 2, 200, 'No fish to sell.\nGo catch some!', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '18px',
          color: '#666688',
          align: 'center'
        }).setOrigin(0.5)
      );
      return;
    }

    // Sell all button
    const totalValue = catchLog.reduce((sum, f) => sum + getFishSellPrice(f), 0);
    const sellAllBtn = this.add.text(GAME.WIDTH / 2, 95, `Sell All (${catchLog.length} fish) — ${totalValue} coins`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 2,
      backgroundColor: '#2A2A4A',
      padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    sellAllBtn.on('pointerdown', () => {
      this.sellAllFish();
      this.renderContent();
    });
    sellAllBtn.on('pointerover', () => sellAllBtn.setColor('#FFFFFF'));
    sellAllBtn.on('pointerout', () => sellAllBtn.setColor('#FFD700'));
    this.contentContainer.add(sellAllBtn);

    // Individual fish list
    let y = 135;
    const shown = catchLog.slice(-8); // show last 8
    shown.forEach((fish, i) => {
      const price = getFishSellPrice(fish);
      const idx = catchLog.length - shown.length + i;

      const rowBg = this.add.graphics();
      rowBg.fillStyle(0x1E1E32, 0.5);
      rowBg.fillRect(60, y - 3, GAME.WIDTH - 120, 38);
      this.contentContainer.add(rowBg);

      this.contentContainer.add(
        this.add.text(75, y, `${fish.species} (${fish.weight} kg)`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          color: '#CCCCDD'
        })
      );

      this.contentContainer.add(
        this.add.text(75, y + 18, fish.rarity.toUpperCase(), {
          fontFamily: 'Arial, sans-serif',
          fontSize: '10px',
          color: this.getRarityColor(fish.rarity)
        })
      );

      const sellBtn = this.add.text(GAME.WIDTH - 75, y + 8, `Sell: ${price}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#FFD700'
      }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

      sellBtn.on('pointerdown', () => {
        this.sellFishByIndex(idx);
        this.renderContent();
      });
      sellBtn.on('pointerover', () => sellBtn.setColor('#FFFFFF'));
      sellBtn.on('pointerout', () => sellBtn.setColor('#FFD700'));
      this.contentContainer.add(sellBtn);

      y += 45;
    });

    if (catchLog.length > 8) {
      this.contentContainer.add(
        this.add.text(GAME.WIDTH / 2, y + 10, `... and ${catchLog.length - 8} more fish`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          color: '#555577'
        }).setOrigin(0.5)
      );
    }
  }

  renderCrewTab() {
    let y = 100;

    CREW_MEMBERS.forEach(member => {
      const owned = this.saveData.crewUnlocked.includes(member.id);
      const active = this.saveData.crewActive === member.id;
      const canAfford = this.saveData.money >= member.price;

      const rowBg = this.add.graphics();
      rowBg.fillStyle(owned ? 0x222238 : 0x1E1E32, 0.6);
      rowBg.fillRect(40, y - 5, GAME.WIDTH - 80, 65);
      if (active) {
        rowBg.lineStyle(1, 0x44BB44, 0.5);
        rowBg.strokeRect(40, y - 5, GAME.WIDTH - 80, 65);
      }
      this.contentContainer.add(rowBg);

      // Crew member avatar (colored circle)
      const avatar = this.add.graphics();
      avatar.fillStyle(member.color, 1);
      avatar.fillCircle(70, y + 20, 15);
      avatar.fillStyle(0xFFFFFF, 0.3);
      avatar.fillCircle(70, y + 15, 5);
      this.contentContainer.add(avatar);

      // Name & title
      this.contentContainer.add(
        this.add.text(95, y, member.name, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '15px',
          fontStyle: 'bold',
          color: active ? '#44BB44' : '#FFFFFF',
          stroke: '#000000',
          strokeThickness: 2
        })
      );

      this.contentContainer.add(
        this.add.text(95, y + 18, member.title, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          color: '#AAAACC'
        })
      );

      this.contentContainer.add(
        this.add.text(95, y + 34, member.description, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          color: '#777799'
        })
      );

      // Action button
      if (active) {
        this.contentContainer.add(
          this.add.text(GAME.WIDTH - 55, y + 15, 'ACTIVE', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#44BB44'
          }).setOrigin(1, 0)
        );
      } else if (owned) {
        const activateBtn = this.add.text(GAME.WIDTH - 55, y + 15, '[Activate]', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '13px',
          fontStyle: 'bold',
          color: '#44AAFF'
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

        activateBtn.on('pointerdown', () => {
          this.saveData.crewActive = member.id;
          saveGame(this.saveData);
          this.renderContent();
        });
        this.contentContainer.add(activateBtn);
      } else {
        const priceColor = canAfford ? '#FFD700' : '#FF4444';
        this.contentContainer.add(
          this.add.text(GAME.WIDTH - 55, y + 5, `${member.price}`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            fontStyle: 'bold',
            color: priceColor
          }).setOrigin(1, 0)
        );

        if (canAfford) {
          const hireBtn = this.add.text(GAME.WIDTH - 55, y + 24, '[Hire]', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            color: '#44FF44'
          }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

          hireBtn.on('pointerdown', () => {
            this.saveData.money -= member.price;
            this.saveData.crewUnlocked.push(member.id);
            this.saveData.crewActive = member.id;
            saveGame(this.saveData);
            this.updateMoneyDisplay();
            this.renderContent();
          });
          this.contentContainer.add(hireBtn);
        }
      }

      y += 75;
    });
  }

  // === Helpers ===

  getGearStats(item) {
    const parts = [];
    if (item.castBonus) parts.push(`Cast +${Math.round(item.castBonus * 100)}%`);
    if (item.reelSpeed && item.reelSpeed !== 1) parts.push(`Reel ${Math.round(item.reelSpeed * 100)}%`);
    if (item.tensionRange && item.tensionRange !== 1) parts.push(`Control +${Math.round((item.tensionRange - 1) * 100)}%`);
    if (item.strengthBonus) parts.push(`Strength +${Math.round(item.strengthBonus * 100)}%`);
    if (item.snapThreshold) parts.push(`Snap at ${Math.round(item.snapThreshold * 100)}%`);
    if (item.biteBonus) parts.push(`Bite +${Math.round(item.biteBonus * 100)}%`);
    if (item.rarityBonus) parts.push(`Rarity +${Math.round(item.rarityBonus * 100)}%`);
    if (item.castDistBonus) parts.push(`Distance +${item.castDistBonus}`);
    if (item.tensionStability) parts.push(`Stability +${Math.round(item.tensionStability * 100)}%`);
    if (item.biteSpeedBonus) parts.push(`Bite speed +${Math.round(item.biteSpeedBonus * 100)}%`);
    if (item.reusable) parts.push('Reusable');
    return parts.join(' | ');
  }

  isEquipped(id) {
    const inv = this.saveData.inventory;
    return inv.rod === id || inv.line === id || inv.bait === id || inv.tackle === id;
  }

  equipGear(id) {
    // Determine category from GEAR data
    for (const [cat, items] of Object.entries(GEAR)) {
      if (items.find(g => g.id === id)) {
        // Map category to inventory slot (rods->rod, lines->line, baits->bait, tackle->tackle)
        const slot = cat === 'rods' ? 'rod' : cat === 'lines' ? 'line' : cat === 'baits' ? 'bait' : 'tackle';
        this.saveData.inventory[slot] = id;
        saveGame(this.saveData);
        return;
      }
    }
  }

  buyGear(item) {
    if (this.saveData.money < item.price) return;
    audio.playBuy();
    this.saveData.money -= item.price;
    this.saveData.gear[item.id] = true;
    this.equipGear(item.id);
    saveGame(this.saveData);
    this.updateMoneyDisplay();
  }

  sellFish(fish) {
    audio.playBuy();
    const price = getFishSellPrice(fish);
    const crewBonus = this.getCrewSellBonus();
    const finalPrice = Math.round(price * (1 + crewBonus));
    this.saveData.money += finalPrice;
    this.saveData.totalEarnings += finalPrice;
    saveGame(this.saveData);
    this.updateMoneyDisplay();
  }

  sellFishByIndex(idx) {
    const fish = this.saveData.catchLog[idx];
    if (!fish) return;
    this.sellFish(fish);
    this.saveData.catchLog.splice(idx, 1);
    saveGame(this.saveData);
  }

  sellAllFish() {
    const catchLog = this.saveData.catchLog;
    catchLog.forEach(fish => this.sellFish(fish));
    this.saveData.catchLog = [];
    saveGame(this.saveData);
  }

  getCrewSellBonus() {
    if (!this.saveData.crewActive) return 0;
    const member = getCrewById(this.saveData.crewActive);
    return member?.bonus?.sellBonus || 0;
  }

  getRarityColor(rarity) {
    const colors = { common: '#AAAAAA', uncommon: '#44BB44', rare: '#4488FF', legendary: '#FFAA00' };
    return colors[rarity] || '#AAAAAA';
  }

  createButton(x, y, label, color, callback) {
    const btn = this.add.text(x, y, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: color,
      stroke: '#000000',
      strokeThickness: 2,
      backgroundColor: '#1A1A2E',
      padding: { x: 15, y: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerdown', callback);
    btn.on('pointerover', () => btn.setColor('#FFFFFF'));
    btn.on('pointerout', () => btn.setColor(color));
    return btn;
  }
}
