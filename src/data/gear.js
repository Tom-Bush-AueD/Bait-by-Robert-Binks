// Gear definitions — rods, lines, bait, and tackle

export const GEAR = {
  rods: [
    {
      id: 'basic_rod',
      name: 'Bamboo Rod',
      description: 'A simple bamboo rod. Gets the job done.',
      price: 0,
      castBonus: 0,
      reelSpeed: 1.0,
      tensionRange: 1.0
    },
    {
      id: 'fiber_rod',
      name: 'Fiberglass Rod',
      description: 'Lighter and more flexible. Better casts.',
      price: 80,
      castBonus: 0.1,
      reelSpeed: 1.15,
      tensionRange: 1.1
    },
    {
      id: 'carbon_rod',
      name: 'Carbon Fiber Rod',
      description: 'Professional grade. Excellent control.',
      price: 400,
      castBonus: 0.2,
      reelSpeed: 1.3,
      tensionRange: 1.25
    },
    {
      id: 'master_rod',
      name: 'Master Angler Rod',
      description: 'The finest rod money can buy.',
      price: 800,
      castBonus: 0.3,
      reelSpeed: 1.5,
      tensionRange: 1.4
    }
  ],
  lines: [
    {
      id: 'basic_line',
      name: 'Nylon Line',
      description: 'Standard fishing line.',
      price: 0,
      strengthBonus: 0,
      snapThreshold: 0.95
    },
    {
      id: 'braided_line',
      name: 'Braided Line',
      description: 'Stronger and less stretch.',
      price: 60,
      strengthBonus: 0.1,
      snapThreshold: 0.97
    },
    {
      id: 'fluoro_line',
      name: 'Fluorocarbon Line',
      description: 'Nearly invisible underwater. Fish bite more.',
      price: 300,
      strengthBonus: 0.15,
      snapThreshold: 0.96,
      biteBonus: 0.1
    },
    {
      id: 'steel_line',
      name: 'Steel Leader Line',
      description: 'Unbreakable. For the biggest catches.',
      price: 500,
      strengthBonus: 0.25,
      snapThreshold: 0.99
    }
  ],
  baits: [
    {
      id: 'worm',
      name: 'Earthworm',
      description: 'Basic bait. Attracts common fish.',
      price: 0,
      biteBonus: 0,
      rarityBonus: 0
    },
    {
      id: 'minnow',
      name: 'Live Minnow',
      description: 'Attracts predatory fish.',
      price: 25,
      biteBonus: 0.1,
      rarityBonus: 0.1
    },
    {
      id: 'lure_spinner',
      name: 'Spinner Lure',
      description: 'Reusable. Good for uncommon fish.',
      price: 75,
      biteBonus: 0.15,
      rarityBonus: 0.15,
      reusable: true
    },
    {
      id: 'golden_lure',
      name: 'Golden Lure',
      description: 'Irresistible to rare and legendary fish.',
      price: 200,
      biteBonus: 0.25,
      rarityBonus: 0.3,
      reusable: true
    }
  ],
  tackle: [
    {
      id: 'weight_sinker',
      name: 'Lead Sinker',
      description: 'Cast further. Reach deeper fish.',
      price: 30,
      castDistBonus: 50
    },
    {
      id: 'swivel',
      name: 'Barrel Swivel',
      description: 'Reduces line twist. Better tension control.',
      price: 120,
      tensionStability: 0.15
    },
    {
      id: 'fish_finder',
      name: 'Fish Finder',
      description: 'Shows fish activity. Shorter bite wait.',
      price: 250,
      biteSpeedBonus: 0.3
    }
  ]
};

// Fish sale prices by rarity
export const SELL_PRICES = {
  common: { base: 8, perKg: 12 },
  uncommon: { base: 20, perKg: 18 },
  rare: { base: 40, perKg: 25 },
  legendary: { base: 100, perKg: 50 }
};

export function getFishSellPrice(fish) {
  const pricing = SELL_PRICES[fish.rarity] || SELL_PRICES.common;
  return Math.round(pricing.base + fish.weight * pricing.perKg);
}

export function getGearById(id) {
  for (const category of Object.values(GEAR)) {
    const item = category.find(g => g.id === id);
    if (item) return item;
  }
  return null;
}

export function getGearCategory(id) {
  for (const [cat, items] of Object.entries(GEAR)) {
    if (items.find(g => g.id === id)) return cat;
  }
  return null;
}
