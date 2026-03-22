// Save/load system using localStorage
const SAVE_KEY = 'bait_save_data';

const DEFAULT_SAVE = {
  money: 50,
  totalEarnings: 0,
  catchLog: [],
  records: {},        // species -> heaviest weight
  inventory: {
    rod: 'basic_rod',
    line: 'basic_line',
    bait: 'worm',
    tackle: null
  },
  gear: {
    basic_rod: true,
    basic_line: true,
    worm: true
  },
  logbook: [],         // { species, weight, timestamp, location, weather }
  achievements: [],     // earned achievement ids
  encyclopedia: {},     // species -> { seen: bool, caught: bool, count: int, bestWeight: num }
  crewUnlocked: [],     // AI crew member ids
  crewActive: null,     // currently active crew member id
  stats: {
    totalCasts: 0,
    totalCatches: 0,
    totalFishLost: 0,
    totalLineSnaps: 0,
    longestFight: 0,
    biggestFish: 0,
    totalPlayTime: 0
  },
  settings: {
    sfxVolume: 0.7,
    musicVolume: 0.5
  }
};

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { ...structuredClone(DEFAULT_SAVE) };
    const saved = JSON.parse(raw);
    // Merge with defaults to handle new fields added in updates
    return mergeDeep(structuredClone(DEFAULT_SAVE), saved);
  } catch {
    return { ...structuredClone(DEFAULT_SAVE) };
  }
}

export function saveGame(data) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export function resetSave() {
  localStorage.removeItem(SAVE_KEY);
  return structuredClone(DEFAULT_SAVE);
}

function mergeDeep(target, source) {
  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      mergeDeep(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

export { DEFAULT_SAVE };
