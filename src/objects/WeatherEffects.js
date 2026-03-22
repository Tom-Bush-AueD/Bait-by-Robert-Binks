import { GAME, WATER_LINE_Y } from '../constants.js';

// Visual weather effects drawn on top of the scene
export default class WeatherEffects {
  constructor(scene) {
    this.scene = scene;
    this.gfx = scene.add.graphics();
    this.gfx.setDepth(18);
    this.particles = [];
    this.weatherId = 'sunny';
    this.timeAlpha = 0;
    this.timeColor = 0x000000;
  }

  setWeather(weather) {
    this.weatherId = weather.id;
    this.particles = [];

    // Generate rain/fog particles
    if (weather.id === 'rainy' || weather.id === 'stormy') {
      for (let i = 0; i < (weather.id === 'stormy' ? 80 : 40); i++) {
        this.particles.push({
          x: Math.random() * GAME.WIDTH,
          y: Math.random() * GAME.HEIGHT,
          speed: 300 + Math.random() * 200,
          length: 8 + Math.random() * 12,
          drift: weather.id === 'stormy' ? -2 + Math.random() * 4 : 0
        });
      }
    } else if (weather.id === 'foggy') {
      for (let i = 0; i < 15; i++) {
        this.particles.push({
          x: Math.random() * GAME.WIDTH,
          y: WATER_LINE_Y - 50 + Math.random() * 150,
          radius: 40 + Math.random() * 80,
          drift: 0.2 + Math.random() * 0.5,
          alpha: 0.05 + Math.random() * 0.1
        });
      }
    }
  }

  setTimeTint(color, alpha) {
    this.timeColor = color;
    this.timeAlpha = alpha;
  }

  update(delta) {
    this.gfx.clear();
    const dt = Math.min(delta, 33) / 1000;

    // Weather overlay tint
    if (this.weatherId === 'rainy' || this.weatherId === 'stormy') {
      this.drawRain(dt);
    } else if (this.weatherId === 'foggy') {
      this.drawFog(dt);
    } else if (this.weatherId === 'cloudy') {
      this.drawClouds();
    }

    // Time-of-day tint overlay
    if (this.timeAlpha > 0) {
      this.gfx.fillStyle(this.timeColor, this.timeAlpha);
      this.gfx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
    }

    // Lightning flash for storms
    if (this.weatherId === 'stormy' && Math.random() < 0.002) {
      this.gfx.fillStyle(0xFFFFFF, 0.3);
      this.gfx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
    }
  }

  drawRain(dt) {
    this.gfx.lineStyle(1, 0x8899BB, 0.4);

    this.particles.forEach(p => {
      p.y += p.speed * dt;
      p.x += p.drift;

      if (p.y > GAME.HEIGHT) {
        p.y = -p.length;
        p.x = Math.random() * GAME.WIDTH;
      }
      if (p.x < 0) p.x = GAME.WIDTH;
      if (p.x > GAME.WIDTH) p.x = 0;

      this.gfx.lineBetween(p.x, p.y, p.x + p.drift * 2, p.y + p.length);
    });

    // Ripples on water
    if (Math.random() < 0.3) {
      const rx = Math.random() * GAME.WIDTH;
      const ry = WATER_LINE_Y + Math.random() * (GAME.HEIGHT - WATER_LINE_Y);
      this.gfx.lineStyle(1, 0xBBCCDD, 0.15);
      this.gfx.strokeCircle(rx, ry, 3 + Math.random() * 5);
    }
  }

  drawFog(dt) {
    this.particles.forEach(p => {
      p.x += p.drift;
      if (p.x > GAME.WIDTH + p.radius) p.x = -p.radius;

      this.gfx.fillStyle(0xAABBCC, p.alpha);
      this.gfx.fillCircle(p.x, p.y, p.radius);
    });
  }

  drawClouds() {
    // Simple dark overlay for cloudy
    this.gfx.fillStyle(0x334455, 0.1);
    this.gfx.fillRect(0, 0, GAME.WIDTH, WATER_LINE_Y);
  }

  destroy() {
    this.gfx.destroy();
  }
}
