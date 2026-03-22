// Weather system — affects fish behavior, visuals, and gameplay

export const WEATHER_TYPES = [
  {
    id: 'sunny',
    name: 'Sunny',
    icon: 'SUN',
    biteModifier: 1.0,
    rarityModifier: 1.0,
    castModifier: 1.0,
    description: 'Clear skies. Normal fishing conditions.',
    skyTint: 0x000000,
    skyAlpha: 0,
    waterTint: 0x000000,
    waterAlpha: 0
  },
  {
    id: 'cloudy',
    name: 'Cloudy',
    icon: 'CLD',
    biteModifier: 1.15,
    rarityModifier: 1.1,
    castModifier: 1.0,
    description: 'Overcast. Fish are more active.',
    skyTint: 0x444455,
    skyAlpha: 0.25,
    waterTint: 0x222233,
    waterAlpha: 0.15
  },
  {
    id: 'rainy',
    name: 'Rainy',
    icon: 'RAN',
    biteModifier: 1.3,
    rarityModifier: 1.2,
    castModifier: 0.9,
    description: 'Rain brings fish to the surface.',
    skyTint: 0x334455,
    skyAlpha: 0.35,
    waterTint: 0x223344,
    waterAlpha: 0.2
  },
  {
    id: 'stormy',
    name: 'Stormy',
    icon: 'STM',
    biteModifier: 0.85,
    rarityModifier: 1.5,
    castModifier: 0.85,
    description: 'Dangerous conditions. Rare fish appear.',
    skyTint: 0x222233,
    skyAlpha: 0.5,
    waterTint: 0x112233,
    waterAlpha: 0.35
  },
  {
    id: 'foggy',
    name: 'Foggy',
    icon: 'FOG',
    biteModifier: 1.1,
    rarityModifier: 1.3,
    castModifier: 0.85,
    description: 'Mysterious conditions. Unusual catches.',
    skyTint: 0x777788,
    skyAlpha: 0.3,
    waterTint: 0x555566,
    waterAlpha: 0.2
  }
];

export const TIME_PERIODS = [
  { id: 'dawn', name: 'Dawn', hour: 5, biteModifier: 1.3, rarityModifier: 1.2, skyColor: 0xFF9966, skyAlpha: 0.2 },
  { id: 'morning', name: 'Morning', hour: 8, biteModifier: 1.1, rarityModifier: 1.0, skyColor: 0x000000, skyAlpha: 0 },
  { id: 'noon', name: 'Noon', hour: 12, biteModifier: 0.8, rarityModifier: 0.9, skyColor: 0xFFFF88, skyAlpha: 0.05 },
  { id: 'afternoon', name: 'Afternoon', hour: 15, biteModifier: 1.0, rarityModifier: 1.0, skyColor: 0x000000, skyAlpha: 0 },
  { id: 'dusk', name: 'Dusk', hour: 18, biteModifier: 1.25, rarityModifier: 1.3, skyColor: 0xFF6644, skyAlpha: 0.25 },
  { id: 'night', name: 'Night', hour: 21, biteModifier: 0.85, rarityModifier: 1.5, skyColor: 0x111133, skyAlpha: 0.45 }
];

// In-game clock: 1 real second = 4 in-game minutes
// A full day cycle takes 6 real minutes
export class GameClock {
  constructor(startHour = 6) {
    this.gameMinutes = startHour * 60; // total minutes since midnight
    this.dayCount = 1;
    this.speed = 4; // minutes per real second (24h in 6 real minutes)
  }

  update(deltaSec) {
    this.gameMinutes += deltaSec * this.speed;
    if (this.gameMinutes >= 1440) { // 24 * 60
      this.gameMinutes -= 1440;
      this.dayCount++;
    }
  }

  getHour() {
    return Math.floor(this.gameMinutes / 60);
  }

  getMinute() {
    return Math.floor(this.gameMinutes % 60);
  }

  getTimeString() {
    const h = this.getHour().toString().padStart(2, '0');
    const m = this.getMinute().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  getTimePeriod() {
    const hour = this.getHour();
    // Find the current period (last one whose hour <= current hour)
    let current = TIME_PERIODS[TIME_PERIODS.length - 1];
    for (let i = 0; i < TIME_PERIODS.length; i++) {
      if (hour >= TIME_PERIODS[i].hour) {
        current = TIME_PERIODS[i];
      }
    }
    return current;
  }

  getDayString() {
    return `Day ${this.dayCount}`;
  }
}

export class WeatherSystem {
  constructor() {
    this.current = WEATHER_TYPES[0]; // start sunny
    this.forecast = [];
    this.changeTimer = 0;
    this.changeInterval = 60000; // weather changes every ~1 real minute
    this.generateForecast();
  }

  generateForecast() {
    this.forecast = [];
    for (let i = 0; i < 3; i++) {
      this.forecast.push(this.randomWeather());
    }
  }

  randomWeather() {
    // Weighted random — sunny/cloudy more common
    const weights = [35, 25, 20, 10, 10]; // sunny, cloudy, rainy, stormy, foggy
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return WEATHER_TYPES[i];
    }
    return WEATHER_TYPES[0];
  }

  update(delta) {
    this.changeTimer += delta;
    if (this.changeTimer >= this.changeInterval) {
      this.changeTimer = 0;
      this.current = this.forecast.shift();
      this.forecast.push(this.randomWeather());
    }
  }

  getForecastStrings() {
    return this.forecast.map(w => w.name);
  }
}
