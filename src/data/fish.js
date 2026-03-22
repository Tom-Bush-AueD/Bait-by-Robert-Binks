// Fish species data — rarity, size, fight behavior
// minDist/maxDist = cast distance range where this fish appears (in pixels)

export const FISH_SPECIES = [
  {
    name: 'Bluegill',
    minWeight: 0.2, maxWeight: 0.8,
    minDist: 0, maxDist: 200,
    rarity: 'common',
    color: 0x4488AA,
    accentColor: 0x66AACC,
    strength: 0.3,
    stamina: 0.4,
    biteChance: 0.9,
    biteDelay: [1500, 3500],
    description: 'A small but eager panfish.'
  },
  {
    name: 'Perch',
    minWeight: 0.3, maxWeight: 1.2,
    minDist: 50, maxDist: 250,
    rarity: 'common',
    color: 0xCCBB44,
    accentColor: 0x88AA33,
    strength: 0.35,
    stamina: 0.5,
    biteChance: 0.85,
    biteDelay: [2000, 4000],
    description: 'Striped and scrappy.'
  },
  {
    name: 'Trout',
    minWeight: 0.5, maxWeight: 2.5,
    minDist: 100, maxDist: 350,
    rarity: 'uncommon',
    color: 0x88AA77,
    accentColor: 0xCC6644,
    strength: 0.55,
    stamina: 0.6,
    biteChance: 0.7,
    biteDelay: [2500, 5000],
    description: 'A beautiful spotted fighter.'
  },
  {
    name: 'Bass',
    minWeight: 1.0, maxWeight: 4.0,
    minDist: 150, maxDist: 400,
    rarity: 'uncommon',
    color: 0x5B8C3E,
    accentColor: 0x3D6B2E,
    strength: 0.65,
    stamina: 0.7,
    biteChance: 0.6,
    biteDelay: [3000, 6000],
    description: 'The king of freshwater sport.'
  },
  {
    name: 'Pike',
    minWeight: 2.0, maxWeight: 8.0,
    minDist: 250, maxDist: 450,
    rarity: 'rare',
    color: 0x4A7A4A,
    accentColor: 0xCCCC88,
    strength: 0.8,
    stamina: 0.75,
    biteChance: 0.4,
    biteDelay: [4000, 8000],
    description: 'A fierce ambush predator.'
  },
  {
    name: 'Catfish',
    minWeight: 3.0, maxWeight: 12.0,
    minDist: 200, maxDist: 450,
    rarity: 'rare',
    color: 0x6B5B4A,
    accentColor: 0x8B7B6A,
    strength: 0.7,
    stamina: 0.85,
    biteChance: 0.35,
    biteDelay: [5000, 10000],
    description: 'A bottom-dwelling heavyweight.'
  },
  {
    name: 'Golden Carp',
    minWeight: 4.0, maxWeight: 15.0,
    minDist: 280, maxDist: 450,
    rarity: 'legendary',
    color: 0xFFCC33,
    accentColor: 0xFF9900,
    strength: 0.75,
    stamina: 0.8,
    biteChance: 0.3,
    biteDelay: [5000, 10000],
    description: 'A mythical golden fish. Incredibly rare.'
  }
];

export const RARITY_COLORS = {
  common: '#AAAAAA',
  uncommon: '#44BB44',
  rare: '#4488FF',
  legendary: '#FFAA00'
};

// Select a fish based on cast distance and optional rarity bonus
export function selectFish(castDistance, rarityBonus = 0) {
  const candidates = FISH_SPECIES.filter(
    f => castDistance >= f.minDist && castDistance <= f.maxDist
  );

  if (candidates.length === 0) return candidates[0] || FISH_SPECIES[0];

  // Weight by bite chance — rarity bonus shifts weight toward rarer fish
  const rarityWeights = { common: 1, uncommon: 1.5, rare: 2.5, legendary: 4 };
  const totalWeight = candidates.reduce((sum, f) => {
    const rarityMult = 1 + rarityBonus * (rarityWeights[f.rarity] || 1);
    return sum + f.biteChance * rarityMult;
  }, 0);
  let roll = Math.random() * totalWeight;

  for (const fish of candidates) {
    const rarityMult = 1 + rarityBonus * (rarityWeights[fish.rarity] || 1);
    roll -= fish.biteChance * rarityMult;
    if (roll <= 0) return fish;
  }

  return candidates[candidates.length - 1];
}

// Generate a specific fish instance with random weight
export function generateFishInstance(species) {
  const weight = species.minWeight + Math.random() * (species.maxWeight - species.minWeight);
  return {
    species: species.name,
    weight: Math.round(weight * 100) / 100,
    rarity: species.rarity,
    color: species.color,
    accentColor: species.accentColor,
    strength: species.strength,
    stamina: species.stamina,
    description: species.description
  };
}
