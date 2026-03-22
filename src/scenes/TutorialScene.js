import Phaser from 'phaser';
import { GAME, COLORS } from '../constants.js';

const PAGES = [
  {
    title: 'Welcome to BAIT',
    lines: [
      'A peaceful fishing simulation where you',
      'cast your line, hook wild fish, and build',
      'your collection of rare catches.',
      '',
      'Fish from a quiet lakeside dock through',
      'changing weather and times of day.',
      'Upgrade your gear and discover all 7 species!'
    ],
    icon: 'fish'
  },
  {
    title: 'Casting',
    lines: [
      'Press SPACE to start the power bar.',
      'A yellow marker bounces up and down.',
      '',
      'Press SPACE again to stop it.',
      'Land it in the GREEN zone for a perfect cast!',
      '',
      'Better accuracy = longer cast distance,',
      'which means access to rarer fish.'
    ],
    icon: 'cast'
  },
  {
    title: 'Hooking a Fish',
    lines: [
      'After casting, your bobber floats on the water.',
      'Wait patiently for a fish to bite.',
      '',
      'When the bobber DIPS \u2014 press SPACE quickly!',
      'You have about 1.5 seconds to react.',
      '',
      'Miss the window and the fish escapes.'
    ],
    icon: 'hook'
  },
  {
    title: 'Reeling In',
    lines: [
      'Hold SPACE to reel the fish in.',
      'Watch the tension bar at the bottom!',
      '',
      'GREEN zone = safe. Keep it centered.',
      'Too HIGH (red) = your line SNAPS!',
      'Too LOW = the fish escapes.',
      '',
      'The fish fights back \u2014 watch for surges!'
    ],
    icon: 'reel'
  },
  {
    title: 'Collect & Upgrade',
    lines: [
      '7 species to discover, from common',
      'Bluegill to the legendary Golden Carp.',
      '',
      'Earn coins from each catch.',
      'Visit the Shop to upgrade your rod,',
      'line, and bait for better results.',
      '',
      'Check your Logbook to track records!'
    ],
    icon: 'collect'
  }
];

export default class TutorialScene extends Phaser.Scene {
  constructor() {
    super('TutorialScene');
  }

  init(data) {
    this.saveData = data?.saveData;
    this.returnToScene = data?.returnTo || 'FishingScene';
  }

  create() {
    this.cameras.main.fadeIn(400);
    this.currentPage = 0;

    // Background
    this.bg = this.add.graphics();
    this.bg.setDepth(0);

    // Content container
    this.contentGroup = this.add.group();

    this.drawPage(0);

    // Input
    this.input.keyboard.on('keydown-SPACE', () => this.nextPage());
    this.input.on('pointerdown', () => this.nextPage());
    this.input.keyboard.on('keydown-ESC', () => this.skip());
  }

  drawPage(index) {
    // Clear previous
    this.contentGroup.clear(true, true);
    this.bg.clear();

    const page = PAGES[index];
    const cx = GAME.WIDTH / 2;

    // Background gradient
    this.bg.fillGradientStyle(0x1A2A3A, 0x1A2A3A, 0x0A1520, 0x0A1520, 1);
    this.bg.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    // Decorative water line at bottom
    this.bg.fillGradientStyle(0x2E86AB, 0x2E86AB, 0x1B4965, 0x1B4965, 0.3);
    this.bg.fillRect(0, GAME.HEIGHT - 80, GAME.WIDTH, 80);
    this.bg.lineStyle(1, 0x3A9BC8, 0.2);
    this.bg.lineBetween(0, GAME.HEIGHT - 80, GAME.WIDTH, GAME.HEIGHT - 80);

    // Draw icon for the page
    this.drawPageIcon(cx, 100, page.icon);

    // Title
    const title = this.add.text(cx, 170, page.title, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#0A1520',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(5);
    this.contentGroup.add(title);

    // Divider line
    this.bg.lineStyle(2, 0x3A6A8A, 0.5);
    this.bg.lineBetween(cx - 100, 195, cx + 100, 195);

    // Body text
    let y = 220;
    page.lines.forEach(line => {
      if (line === '') { y += 10; return; }
      const txt = this.add.text(cx, y, line, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '17px',
        color: '#BBCCDD',
        stroke: '#0A1520',
        strokeThickness: 2
      }).setOrigin(0.5).setDepth(5);
      this.contentGroup.add(txt);
      y += 26;
    });

    // Page dots
    const dotY = GAME.HEIGHT - 45;
    for (let i = 0; i < PAGES.length; i++) {
      const dotX = cx - (PAGES.length - 1) * 10 + i * 20;
      const isActive = i === index;
      this.bg.fillStyle(isActive ? 0x44AADD : 0x334455, isActive ? 1 : 0.6);
      this.bg.fillCircle(dotX, dotY, isActive ? 5 : 3);
    }

    // Navigation prompt
    const isLast = index === PAGES.length - 1;
    const promptStr = isLast ? 'Press SPACE to start fishing!' : 'Press SPACE to continue';
    const prompt = this.add.text(cx, GAME.HEIGHT - 20, promptStr, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: isLast ? '#44DDAA' : '#667788',
      stroke: '#0A1520',
      strokeThickness: 1
    }).setOrigin(0.5).setDepth(5);
    this.contentGroup.add(prompt);

    this.tweens.add({
      targets: prompt,
      alpha: 0.4,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // Skip hint
    if (!isLast) {
      const skip = this.add.text(GAME.WIDTH - 15, 15, 'ESC to skip', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        color: '#445566'
      }).setOrigin(1, 0).setDepth(5);
      this.contentGroup.add(skip);
    }
  }

  drawPageIcon(cx, cy, type) {
    const g = this.add.graphics();
    g.setDepth(4);
    this.contentGroup.add(g);

    switch (type) {
      case 'fish':
        // Simple fish icon
        g.fillStyle(0x44AADD, 0.8);
        g.fillEllipse(cx, cy, 50, 22);
        g.fillStyle(0x44AADD, 0.7);
        g.fillTriangle(cx - 28, cy, cx - 42, cy - 12, cx - 42, cy + 12);
        g.fillStyle(0xFFFFFF, 0.9);
        g.fillCircle(cx + 15, cy - 3, 3);
        g.fillStyle(0x111111, 1);
        g.fillCircle(cx + 16, cy - 3, 1.5);
        break;
      case 'cast':
        // Power bar icon
        g.lineStyle(3, 0x444466, 0.8);
        g.strokeRect(cx - 8, cy - 30, 16, 60);
        g.fillStyle(0x44BB44, 0.6);
        g.fillRect(cx - 7, cy - 5, 14, 10);
        g.fillStyle(0xFFFF00, 1);
        g.fillRect(cx - 10, cy + 10, 20, 4);
        break;
      case 'hook':
        // Bobber icon
        g.fillStyle(0xFF3333, 0.9);
        g.fillCircle(cx, cy - 5, 10);
        g.fillStyle(0xFFFFFF, 0.9);
        g.fillCircle(cx, cy + 5, 8);
        g.lineStyle(2, 0xCCCCCC, 0.7);
        g.lineBetween(cx, cy - 18, cx, cy + 13);
        // Water line
        g.lineStyle(2, 0x3A9BC8, 0.4);
        g.beginPath();
        g.moveTo(cx - 30, cy + 15);
        for (let px = -30; px <= 30; px += 3) {
          g.lineTo(cx + px, cy + 15 + Math.sin(px * 0.2) * 3);
        }
        g.strokePath();
        break;
      case 'reel':
        // Tension bar icon
        g.fillStyle(0x1A1A2E, 0.9);
        g.fillRect(cx - 50, cy - 8, 100, 16);
        g.fillStyle(0xCC4444, 0.5);
        g.fillRect(cx - 50, cy - 8, 15, 16);
        g.fillRect(cx + 35, cy - 8, 15, 16);
        g.fillStyle(0x44BB44, 0.4);
        g.fillRect(cx - 35, cy - 8, 70, 16);
        g.lineStyle(2, 0x444466, 1);
        g.strokeRect(cx - 50, cy - 8, 100, 16);
        g.fillStyle(0x44FF44, 1);
        g.fillRect(cx - 2, cy - 11, 4, 22);
        break;
      case 'collect':
        // Collection grid icon
        const fishColors = [0x4488AA, 0xCCBB44, 0x88AA77, 0x5B8C3E, 0xFFCC33];
        fishColors.forEach((c, i) => {
          const fx = cx - 32 + i * 16;
          g.fillStyle(c, 0.8);
          g.fillEllipse(fx, cy, 12, 6);
        });
        g.fillStyle(0xFFD700, 0.7);
        g.fillCircle(cx, cy + 20, 6);
        g.fillStyle(0xFFD700, 0.4);
        g.fillCircle(cx, cy + 20, 10);
        break;
    }
  }

  nextPage() {
    this.currentPage++;
    if (this.currentPage >= PAGES.length) {
      this.startGame();
    } else {
      this.drawPage(this.currentPage);
    }
  }

  skip() {
    this.startGame();
  }

  startGame() {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(this.returnToScene, { saveData: this.saveData });
    });
  }
}
