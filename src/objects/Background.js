import { GAME, COLORS, WATER_LINE_Y, DOCK_CONFIG } from '../constants.js';

export function drawBackground(scene) {
  const gfx = scene.add.graphics();
  gfx.setDepth(0);

  // Sky gradient
  gfx.fillGradientStyle(
    COLORS.SKY_TOP, COLORS.SKY_TOP,
    COLORS.SKY_BOTTOM, COLORS.SKY_BOTTOM, 1
  );
  gfx.fillRect(0, 0, GAME.WIDTH, WATER_LINE_Y);

  // Sun
  gfx.fillStyle(COLORS.SUN, 0.8);
  gfx.fillCircle(650, 80, 40);

  // Sun glow
  gfx.fillStyle(COLORS.SUN, 0.15);
  gfx.fillCircle(650, 80, 70);

  // Distant hills
  gfx.fillStyle(COLORS.HILLS, 0.6);
  gfx.fillTriangle(0, WATER_LINE_Y, 120, WATER_LINE_Y - 60, 240, WATER_LINE_Y);
  gfx.fillTriangle(180, WATER_LINE_Y, 350, WATER_LINE_Y - 90, 520, WATER_LINE_Y);
  gfx.fillTriangle(450, WATER_LINE_Y, 600, WATER_LINE_Y - 50, 750, WATER_LINE_Y);
  gfx.fillStyle(COLORS.HILLS, 0.4);
  gfx.fillTriangle(600, WATER_LINE_Y, 720, WATER_LINE_Y - 70, 800, WATER_LINE_Y);

  // Water gradient
  gfx.fillGradientStyle(
    COLORS.WATER_TOP, COLORS.WATER_TOP,
    COLORS.WATER_BOTTOM, COLORS.WATER_BOTTOM, 1
  );
  gfx.fillRect(0, WATER_LINE_Y, GAME.WIDTH, GAME.HEIGHT - WATER_LINE_Y);

  // Water surface shimmer
  for (let i = 0; i < 6; i++) {
    const sx = 50 + i * 130 + Math.random() * 40;
    const sw = 40 + Math.random() * 60;
    gfx.fillStyle(COLORS.SHIMMER, 0.08);
    gfx.fillRect(sx, WATER_LINE_Y + 2, sw, 3);
  }

  // Dock
  const dock = DOCK_CONFIG;

  // Dock support posts
  gfx.fillStyle(COLORS.DOCK_DARK, 1);
  gfx.fillRect(dock.X + 20, dock.Y + dock.HEIGHT, dock.POST_WIDTH, dock.POST_HEIGHT);
  gfx.fillRect(dock.X + dock.WIDTH - 30, dock.Y + dock.HEIGHT, dock.POST_WIDTH, dock.POST_HEIGHT);
  gfx.fillRect(dock.X + dock.WIDTH / 2 - 6, dock.Y + dock.HEIGHT, dock.POST_WIDTH, dock.POST_HEIGHT);

  // Dock surface
  gfx.fillStyle(COLORS.DOCK, 1);
  gfx.fillRect(dock.X, dock.Y, dock.WIDTH, dock.HEIGHT);

  // Dock planks (subtle lines)
  gfx.lineStyle(1, COLORS.DOCK_DARK, 0.4);
  for (let px = dock.X + 20; px < dock.X + dock.WIDTH; px += 22) {
    gfx.lineBetween(px, dock.Y, px, dock.Y + dock.HEIGHT);
  }

  // Dock edge highlight
  gfx.lineStyle(1, COLORS.DOCK_PLANK, 0.5);
  gfx.lineBetween(dock.X, dock.Y, dock.X + dock.WIDTH, dock.Y);

  // Simple fisher silhouette on dock
  drawFisher(gfx);

  return gfx;
}

function drawFisher(gfx) {
  const x = 140;
  const y = 268;

  // Body (dark silhouette)
  gfx.fillStyle(0x2A2A3A, 0.9);

  // Head
  gfx.fillCircle(x, y, 8);

  // Torso
  gfx.fillRect(x - 5, y + 8, 10, 18);

  // Legs (sitting position)
  gfx.fillRect(x - 6, y + 26, 7, 8);
  gfx.fillRect(x + 1, y + 26, 7, 8);

  // Hat brim
  gfx.fillStyle(0x3A3A4A, 0.9);
  gfx.fillRect(x - 10, y - 10, 20, 4);
  gfx.fillRect(x - 6, y - 16, 12, 7);
}
