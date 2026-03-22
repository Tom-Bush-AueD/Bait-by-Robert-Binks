import Phaser from 'phaser';
import { GAME } from '../constants.js';
import { FISH_SPECIES, RARITY_COLORS } from '../data/fish.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { saveGame } from '../data/save.js';

export default class LogbookScene extends Phaser.Scene {
  constructor() {
    super('LogbookScene');
  }

  init(data) {
    this.saveData = data.saveData;
    this.tab = 'encyclopedia'; // 'encyclopedia' | 'logbook' | 'achievements' | 'stats'
  }

  create() {
    this.cameras.main.fadeIn(300);
    const cx = GAME.WIDTH / 2;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1A1A2E, 0x1A1A2E, 0x0D0D1A, 0x0D0D1A, 1);
    bg.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    // Title
    this.add.text(cx, 25, 'LOGBOOK', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#88AACC',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Tabs
    this.createTabs();

    // Content container
    this.contentContainer = this.add.container(0, 0);
    this.renderContent();

    // Back button
    const backBtn = this.add.text(cx, GAME.HEIGHT - 35, 'Back to Fishing', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#88AACC',
      stroke: '#000000',
      strokeThickness: 2,
      backgroundColor: '#1A1A2E',
      padding: { x: 15, y: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('FishingScene', { saveData: this.saveData });
      });
    });
  }

  createTabs() {
    const tabs = [
      { key: 'encyclopedia', label: 'Fish', x: 120 },
      { key: 'logbook', label: 'Log', x: 270 },
      { key: 'achievements', label: 'Achievements', x: 440 },
      { key: 'stats', label: 'Stats', x: 620 }
    ];

    this.tabTexts = {};
    tabs.forEach(t => {
      const txt = this.add.text(t.x, 60, t.label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: this.tab === t.key ? '#FFD700' : '#666688',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      txt.on('pointerdown', () => {
        this.tab = t.key;
        Object.entries(this.tabTexts).forEach(([k, v]) => v.setColor(k === t.key ? '#FFD700' : '#666688'));
        this.renderContent();
      });

      this.tabTexts[t.key] = txt;
    });
  }

  renderContent() {
    this.contentContainer.removeAll(true);

    switch (this.tab) {
      case 'encyclopedia': this.renderEncyclopedia(); break;
      case 'logbook': this.renderLogbook(); break;
      case 'achievements': this.renderAchievements(); break;
      case 'stats': this.renderStats(); break;
    }
  }

  renderEncyclopedia() {
    let y = 90;
    const enc = this.saveData.encyclopedia || {};

    FISH_SPECIES.forEach(species => {
      const data = enc[species.name] || { seen: false, caught: false, count: 0, bestWeight: 0 };
      const discovered = data.caught;

      const rowBg = this.add.graphics();
      rowBg.fillStyle(discovered ? 0x1E2E1E : 0x1E1E32, 0.5);
      rowBg.fillRect(40, y - 3, GAME.WIDTH - 80, 55);
      this.contentContainer.add(rowBg);

      if (discovered) {
        // Draw mini fish
        const fishGfx = this.add.graphics();
        fishGfx.fillStyle(species.color, 1);
        fishGfx.fillEllipse(75, y + 20, 30, 16);
        fishGfx.fillStyle(species.accentColor, 0.6);
        fishGfx.fillEllipse(75, y + 22, 24, 8);
        fishGfx.fillStyle(0xFFFFFF, 1);
        fishGfx.fillCircle(85, y + 18, 3);
        fishGfx.fillStyle(0x111111, 1);
        fishGfx.fillCircle(86, y + 18, 1.5);
        this.contentContainer.add(fishGfx);

        // Name
        const rarityColor = RARITY_COLORS[species.rarity] || '#FFFFFF';
        this.contentContainer.add(
          this.add.text(100, y, species.name, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 2
          })
        );

        // Rarity
        this.contentContainer.add(
          this.add.text(100, y + 18, species.rarity.toUpperCase(), {
            fontFamily: 'Arial, sans-serif',
            fontSize: '10px',
            color: rarityColor
          })
        );

        // Description
        this.contentContainer.add(
          this.add.text(100, y + 32, species.description, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '10px',
            color: '#BBBBCC'
          })
        );

        // Stats
        this.contentContainer.add(
          this.add.text(GAME.WIDTH - 55, y + 5, `Caught: ${data.count}`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            color: '#AAAACC'
          }).setOrigin(1, 0)
        );

        this.contentContainer.add(
          this.add.text(GAME.WIDTH - 55, y + 22, `Best: ${data.bestWeight} kg`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            color: '#FFD700'
          }).setOrigin(1, 0)
        );

        this.contentContainer.add(
          this.add.text(GAME.WIDTH - 55, y + 38, `${species.minWeight}-${species.maxWeight} kg`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '10px',
            color: '#AABBCC'
          }).setOrigin(1, 0)
        );
      } else {
        // Unknown fish
        this.contentContainer.add(
          this.add.text(75, y + 15, '???', {
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: '20px',
            color: '#667788'
          }).setOrigin(0.5)
        );

        this.contentContainer.add(
          this.add.text(100, y + 15, 'Undiscovered Species', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            color: '#778899'
          })
        );
      }

      y += 62;
    });
  }

  renderLogbook() {
    const log = this.saveData.logbook || [];

    if (log.length === 0) {
      this.contentContainer.add(
        this.add.text(GAME.WIDTH / 2, 200, 'No entries yet.\nCatch some fish!', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '18px',
          color: '#AABBCC',
          align: 'center'
        }).setOrigin(0.5)
      );
      return;
    }

    // Show last 10 entries (newest first)
    const recent = log.slice(-10).reverse();
    let y = 90;

    recent.forEach(entry => {
      const rowBg = this.add.graphics();
      rowBg.fillStyle(0x1E1E32, 0.4);
      rowBg.fillRect(40, y - 3, GAME.WIDTH - 80, 42);
      this.contentContainer.add(rowBg);

      this.contentContainer.add(
        this.add.text(55, y, `${entry.species} — ${entry.weight} kg`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          fontStyle: 'bold',
          color: '#CCCCDD'
        })
      );

      const details = [];
      if (entry.weather) details.push(entry.weather);
      if (entry.time) details.push(entry.time);
      if (entry.day) details.push(entry.day);

      this.contentContainer.add(
        this.add.text(55, y + 20, details.join(' | '), {
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          color: '#AABBCC'
        })
      );

      this.contentContainer.add(
        this.add.text(GAME.WIDTH - 55, y + 10, entry.rarity.toUpperCase(), {
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          color: this.getRarityColor(entry.rarity)
        }).setOrigin(1, 0)
      );

      y += 48;
    });

    if (log.length > 10) {
      this.contentContainer.add(
        this.add.text(GAME.WIDTH / 2, y + 10, `${log.length} total entries`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          color: '#AABBCC'
        }).setOrigin(0.5)
      );
    }
  }

  renderAchievements() {
    const earned = this.saveData.achievements || [];
    let y = 90;

    ACHIEVEMENTS.forEach(ach => {
      const unlocked = earned.includes(ach.id);

      const rowBg = this.add.graphics();
      rowBg.fillStyle(unlocked ? 0x2A2A1E : 0x1A1A28, 0.5);
      rowBg.fillRect(40, y - 3, GAME.WIDTH - 80, 42);
      this.contentContainer.add(rowBg);

      // Icon placeholder
      this.contentContainer.add(
        this.add.text(60, y + 8, ach.icon || '*', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          color: unlocked ? '#FFD700' : '#333355'
        })
      );

      // Name
      this.contentContainer.add(
        this.add.text(95, y + 2, ach.name, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          fontStyle: 'bold',
          color: unlocked ? '#FFD700' : '#555577'
        })
      );

      // Description
      this.contentContainer.add(
        this.add.text(95, y + 20, ach.description, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          color: unlocked ? '#AAAACC' : '#444466'
        })
      );

      if (unlocked) {
        this.contentContainer.add(
          this.add.text(GAME.WIDTH - 55, y + 10, 'EARNED', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '11px',
            fontStyle: 'bold',
            color: '#44BB44'
          }).setOrigin(1, 0)
        );
      }

      y += 48;
    });
  }

  renderStats() {
    const stats = this.saveData.stats || {};
    const cx = GAME.WIDTH / 2;
    let y = 100;

    const entries = [
      ['Total Casts', stats.totalCasts || 0],
      ['Total Catches', stats.totalCatches || 0],
      ['Fish Lost', stats.totalFishLost || 0],
      ['Line Snaps', stats.totalLineSnaps || 0],
      ['Biggest Fish', `${stats.biggestFish || 0} kg`],
      ['Perfect Casts', stats.perfectCasts || 0],
      ['Storm Catches', stats.stormCatches || 0],
      ['Night Catches', stats.nightCatches || 0],
      ['Total Earnings', `${this.saveData.totalEarnings || 0} coins`],
      ['Species Found', `${Object.keys(this.saveData.encyclopedia || {}).filter(k => this.saveData.encyclopedia[k]?.caught).length}/7`]
    ];

    entries.forEach(([label, value]) => {
      this.contentContainer.add(
        this.add.text(cx - 120, y, label, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '15px',
          color: '#BBBBCC'
        })
      );

      this.contentContainer.add(
        this.add.text(cx + 120, y, `${value}`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '15px',
          fontStyle: 'bold',
          color: '#FFFFFF'
        }).setOrigin(1, 0)
      );

      y += 35;
    });
  }

  getRarityColor(rarity) {
    const colors = { common: '#AAAAAA', uncommon: '#44BB44', rare: '#4488FF', legendary: '#FFAA00' };
    return colors[rarity] || '#AAAAAA';
  }
}
