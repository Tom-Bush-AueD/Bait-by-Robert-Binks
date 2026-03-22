import { GAME, COLORS, WATER_LINE_Y, DOCK_CONFIG } from '../constants.js';

export function drawBackground(scene) {
  const gfx = scene.add.graphics();
  gfx.setDepth(0);

  // === SKY ===
  // Multi-stop sky gradient for richer look
  const skyStops = [
    { y: 0, color: 0x4A90D9 },
    { y: WATER_LINE_Y * 0.4, color: 0x6BB3E0 },
    { y: WATER_LINE_Y * 0.7, color: 0x87CEEB },
    { y: WATER_LINE_Y, color: 0xB0D8F0 }
  ];
  for (let i = 0; i < skyStops.length - 1; i++) {
    const s0 = skyStops[i];
    const s1 = skyStops[i + 1];
    gfx.fillGradientStyle(s0.color, s0.color, s1.color, s1.color, 1);
    gfx.fillRect(0, s0.y, GAME.WIDTH, s1.y - s0.y);
  }

  // === CLOUDS ===
  drawClouds(gfx);

  // === SUN ===
  // Soft glow layers
  gfx.fillStyle(0xFFF8E0, 0.08);
  gfx.fillCircle(640, 75, 90);
  gfx.fillStyle(0xFFF4C2, 0.15);
  gfx.fillCircle(640, 75, 55);
  gfx.fillStyle(0xFFFAE6, 0.7);
  gfx.fillCircle(640, 75, 32);
  gfx.fillStyle(0xFFFFF0, 0.9);
  gfx.fillCircle(640, 75, 22);

  // === DISTANT MOUNTAINS ===
  drawMountains(gfx);

  // === TREELINE ===
  drawTreeline(gfx);

  // === WATER ===
  // Multi-stop water gradient
  const waterStops = [
    { y: WATER_LINE_Y, color: 0x3A9BC8 },
    { y: WATER_LINE_Y + 40, color: 0x2E86AB },
    { y: WATER_LINE_Y + 120, color: 0x1F6F8B },
    { y: GAME.HEIGHT, color: 0x15506A }
  ];
  for (let i = 0; i < waterStops.length - 1; i++) {
    const s0 = waterStops[i];
    const s1 = waterStops[i + 1];
    gfx.fillGradientStyle(s0.color, s0.color, s1.color, s1.color, 1);
    gfx.fillRect(0, s0.y, GAME.WIDTH, s1.y - s0.y);
  }

  // Water surface highlight line
  gfx.lineStyle(2, 0xAADDEE, 0.3);
  gfx.lineBetween(0, WATER_LINE_Y, GAME.WIDTH, WATER_LINE_Y);

  // Water shimmer highlights
  for (let i = 0; i < 8; i++) {
    const sx = 30 + i * 100 + Math.random() * 40;
    const sw = 25 + Math.random() * 50;
    const sy = WATER_LINE_Y + 4 + Math.random() * 15;
    gfx.fillStyle(0xFFFFFF, 0.06 + Math.random() * 0.04);
    gfx.fillRect(sx, sy, sw, 2);
  }

  // Subtle water ripple curves
  for (let r = 0; r < 5; r++) {
    const ry = WATER_LINE_Y + 30 + r * 40 + Math.random() * 20;
    const rx = 50 + Math.random() * 600;
    const rw = 60 + Math.random() * 80;
    gfx.lineStyle(1, 0xFFFFFF, 0.04);
    gfx.beginPath();
    gfx.moveTo(rx, ry);
    for (let px = 0; px <= rw; px += 4) {
      gfx.lineTo(rx + px, ry + Math.sin(px * 0.15) * 1.5);
    }
    gfx.strokePath();
  }

  // === DOCK ===
  drawDock(gfx);

  // === FISHER ===
  drawFisher(gfx);

  // === FOREGROUND GRASS/REEDS on left bank ===
  drawBankDetails(gfx);

  return gfx;
}

function drawClouds(gfx) {
  const clouds = [
    { x: 120, y: 50, s: 1.0 },
    { x: 350, y: 30, s: 1.3 },
    { x: 550, y: 65, s: 0.8 },
    { x: 750, y: 40, s: 0.6 }
  ];

  clouds.forEach(c => {
    gfx.fillStyle(0xFFFFFF, 0.5);
    gfx.fillEllipse(c.x, c.y, 60 * c.s, 20 * c.s);
    gfx.fillEllipse(c.x - 20 * c.s, c.y + 3, 40 * c.s, 16 * c.s);
    gfx.fillEllipse(c.x + 25 * c.s, c.y + 2, 45 * c.s, 18 * c.s);
    // Brighter center
    gfx.fillStyle(0xFFFFFF, 0.3);
    gfx.fillEllipse(c.x + 5 * c.s, c.y - 2, 35 * c.s, 12 * c.s);
  });
}

function drawMountains(gfx) {
  // Far distant mountains (lighter, more blue)
  gfx.fillStyle(0x6B8DAF, 0.5);
  drawMountainShape(gfx, -30, WATER_LINE_Y, 200, 100);
  drawMountainShape(gfx, 250, WATER_LINE_Y, 280, 130);
  drawMountainShape(gfx, 500, WATER_LINE_Y, 220, 90);
  drawMountainShape(gfx, 680, WATER_LINE_Y, 180, 110);

  // Snow caps on taller mountains
  gfx.fillStyle(0xFFFFFF, 0.25);
  drawPeak(gfx, 390, WATER_LINE_Y - 130, 20, 18);
  drawPeak(gfx, 770, WATER_LINE_Y - 110, 16, 14);

  // Nearer hills (darker green)
  gfx.fillStyle(0x3D7A4F, 0.7);
  drawHillShape(gfx, -20, WATER_LINE_Y, 180, 55);
  drawHillShape(gfx, 140, WATER_LINE_Y, 200, 70);
  drawHillShape(gfx, 400, WATER_LINE_Y, 250, 50);
  drawHillShape(gfx, 620, WATER_LINE_Y, 200, 60);
}

function drawMountainShape(gfx, x, baseY, width, height) {
  gfx.beginPath();
  gfx.moveTo(x, baseY);
  gfx.lineTo(x + width * 0.3, baseY - height * 0.7);
  gfx.lineTo(x + width * 0.5, baseY - height);
  gfx.lineTo(x + width * 0.65, baseY - height * 0.8);
  gfx.lineTo(x + width, baseY);
  gfx.closePath();
  gfx.fillPath();
}

function drawPeak(gfx, x, y, w, h) {
  gfx.fillTriangle(x, y, x - w, y + h, x + w, y + h);
}

function drawHillShape(gfx, x, baseY, width, height) {
  gfx.beginPath();
  gfx.moveTo(x, baseY);
  const steps = 12;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = x + t * width;
    const py = baseY - Math.sin(t * Math.PI) * height;
    gfx.lineTo(px, py);
  }
  gfx.lineTo(x + width, baseY);
  gfx.closePath();
  gfx.fillPath();
}

function drawTreeline(gfx) {
  // Conifer trees along the hills
  const treePositions = [
    { x: 40, h: 35 }, { x: 65, h: 42 }, { x: 95, h: 38 },
    { x: 160, h: 50 }, { x: 190, h: 45 }, { x: 220, h: 52 }, { x: 248, h: 40 },
    { x: 280, h: 35 }, { x: 310, h: 48 },
    { x: 430, h: 30 }, { x: 460, h: 38 }, { x: 490, h: 42 },
    { x: 540, h: 35 },
    { x: 640, h: 45 }, { x: 670, h: 40 }, { x: 700, h: 48 },
    { x: 740, h: 36 }, { x: 770, h: 42 }
  ];

  treePositions.forEach(t => {
    const baseY = WATER_LINE_Y - 2;
    // Dark tree shape
    gfx.fillStyle(0x2A5A3A, 0.85);
    // Triangle tree (conifer)
    const w = t.h * 0.4;
    gfx.fillTriangle(
      t.x, baseY - t.h,
      t.x - w, baseY,
      t.x + w, baseY
    );
    // Second layer slightly offset
    gfx.fillStyle(0x1E4A2E, 0.7);
    gfx.fillTriangle(
      t.x, baseY - t.h * 0.7,
      t.x - w * 0.8, baseY - t.h * 0.1,
      t.x + w * 0.8, baseY - t.h * 0.1
    );
  });
}

function drawDock(gfx) {
  const dock = DOCK_CONFIG;

  // Dock support posts (in water)
  gfx.fillStyle(0x5A4A30, 1);
  gfx.fillRect(dock.X + 20, dock.Y + dock.HEIGHT, 10, dock.POST_HEIGHT);
  gfx.fillRect(dock.X + dock.WIDTH - 28, dock.Y + dock.HEIGHT, 10, dock.POST_HEIGHT);
  gfx.fillRect(dock.X + dock.WIDTH / 2 - 5, dock.Y + dock.HEIGHT, 10, dock.POST_HEIGHT);

  // Post reflections in water
  gfx.fillStyle(0x3A3020, 0.15);
  gfx.fillRect(dock.X + 20, dock.Y + dock.HEIGHT + dock.POST_HEIGHT, 10, 30);
  gfx.fillRect(dock.X + dock.WIDTH - 28, dock.Y + dock.HEIGHT + dock.POST_HEIGHT, 10, 30);

  // Dock surface
  gfx.fillStyle(0x8B7340, 1);
  gfx.fillRect(dock.X, dock.Y, dock.WIDTH, dock.HEIGHT);

  // Dock top highlight
  gfx.fillStyle(0xA08850, 0.6);
  gfx.fillRect(dock.X, dock.Y, dock.WIDTH, 3);

  // Dock planks
  gfx.lineStyle(1, 0x6B5320, 0.5);
  for (let px = dock.X + 18; px < dock.X + dock.WIDTH; px += 20) {
    gfx.lineBetween(px, dock.Y, px, dock.Y + dock.HEIGHT);
  }

  // Dock edge shadow
  gfx.fillStyle(0x000000, 0.1);
  gfx.fillRect(dock.X, dock.Y + dock.HEIGHT - 2, dock.WIDTH, 3);

  // Cross braces
  gfx.lineStyle(2, 0x6B5320, 0.4);
  gfx.lineBetween(dock.X + 25, dock.Y + dock.HEIGHT + 10, dock.X + dock.WIDTH / 2, dock.Y + dock.HEIGHT + 30);
  gfx.lineBetween(dock.X + dock.WIDTH - 23, dock.Y + dock.HEIGHT + 10, dock.X + dock.WIDTH / 2, dock.Y + dock.HEIGHT + 30);
}

function drawFisher(gfx) {
  const x = 142;
  const y = 268;

  // Shadow on dock
  gfx.fillStyle(0x000000, 0.08);
  gfx.fillEllipse(x, DOCK_CONFIG.Y - 1, 24, 6);

  // Legs (sitting, dangling)
  gfx.fillStyle(0x3A3A5A, 0.9);
  gfx.fillRect(x - 6, y + 26, 6, 10);
  gfx.fillRect(x + 2, y + 26, 6, 10);

  // Torso
  gfx.fillStyle(0x4A5A3A, 0.9);
  gfx.fillRect(x - 6, y + 8, 14, 18);

  // Arms
  gfx.fillStyle(0x4A5A3A, 0.85);
  gfx.fillRect(x - 9, y + 10, 4, 12);
  gfx.fillRect(x + 8, y + 10, 4, 14);

  // Head
  gfx.fillStyle(0xD4A574, 0.9);
  gfx.fillCircle(x + 1, y, 7);

  // Hat
  gfx.fillStyle(0x5A7A4A, 0.95);
  gfx.fillRect(x - 10, y - 9, 22, 4);
  gfx.fillRect(x - 6, y - 15, 14, 7);
}

function drawBankDetails(gfx) {
  // Left bank ground
  gfx.fillStyle(0x5A8A4A, 0.4);
  gfx.beginPath();
  gfx.moveTo(0, WATER_LINE_Y);
  gfx.lineTo(0, WATER_LINE_Y - 8);
  gfx.lineTo(15, WATER_LINE_Y - 5);
  gfx.lineTo(DOCK_CONFIG.X - 2, WATER_LINE_Y);
  gfx.closePath();
  gfx.fillPath();

  // Reeds near dock
  const reedX = DOCK_CONFIG.X + DOCK_CONFIG.WIDTH + 10;
  gfx.lineStyle(2, 0x4A7A3A, 0.5);
  for (let i = 0; i < 4; i++) {
    const rx = reedX + i * 8;
    const rh = 25 + Math.random() * 15;
    gfx.lineBetween(rx, WATER_LINE_Y + 5, rx + (i % 2 ? 3 : -2), WATER_LINE_Y - rh);
  }

  // Small rocks at water edge (right side)
  gfx.fillStyle(0x7A8A7A, 0.3);
  gfx.fillCircle(GAME.WIDTH - 60, WATER_LINE_Y + 3, 5);
  gfx.fillCircle(GAME.WIDTH - 45, WATER_LINE_Y + 2, 3);
  gfx.fillCircle(GAME.WIDTH - 72, WATER_LINE_Y + 4, 4);
}
