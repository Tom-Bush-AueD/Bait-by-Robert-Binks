// Achievement definitions — priority: lower number = more important (shown first)

export const ACHIEVEMENTS = [
  // Catching milestones
  { id: 'first_catch', name: 'First Catch', description: 'Catch your first fish.', icon: 'FISH', priority: 1, check: s => s.stats.totalCatches >= 1 },
  { id: 'catch_10', name: 'Angler', description: 'Catch 10 fish.', icon: 'FISH', priority: 5, check: s => s.stats.totalCatches >= 10 },
  { id: 'catch_50', name: 'Seasoned Fisher', description: 'Catch 50 fish.', icon: 'FISH', priority: 5, check: s => s.stats.totalCatches >= 50 },
  { id: 'catch_100', name: 'Master Angler', description: 'Catch 100 fish.', icon: 'STAR', priority: 4, check: s => s.stats.totalCatches >= 100 },

  // Species collection
  { id: 'species_3', name: 'Explorer', description: 'Catch 3 different species.', icon: 'BOOK', priority: 3, check: s => Object.keys(s.encyclopedia).filter(k => s.encyclopedia[k].caught).length >= 3 },
  { id: 'species_all', name: 'Completionist', description: 'Catch all 7 species.', icon: 'CROWN', priority: 2, check: s => Object.keys(s.encyclopedia).filter(k => s.encyclopedia[k].caught).length >= 7 },

  // Rarity
  { id: 'catch_rare', name: 'Rare Find', description: 'Catch a rare fish.', icon: 'GEM', priority: 2, check: s => s.catchLog.some(f => f.rarity === 'rare') },
  { id: 'catch_legendary', name: 'Legend', description: 'Catch a legendary fish.', icon: 'CROWN', priority: 1, check: s => s.catchLog.some(f => f.rarity === 'legendary') },

  // Money
  { id: 'earn_500', name: 'Making a Living', description: 'Earn 500 coins total.', icon: 'COIN', priority: 7, check: s => s.totalEarnings >= 500 },
  { id: 'earn_2000', name: 'Prosperous', description: 'Earn 2000 coins total.', icon: 'COIN', priority: 6, check: s => s.totalEarnings >= 2000 },
  { id: 'earn_5000', name: 'Tycoon', description: 'Earn 5000 coins total.', icon: 'COIN', priority: 5, check: s => s.totalEarnings >= 5000 },

  // Weight records
  { id: 'big_5kg', name: 'Big Catch', description: 'Catch a fish over 5 kg.', icon: 'SCALE', priority: 3, check: s => s.stats.biggestFish >= 5 },
  { id: 'big_10kg', name: 'Monster Fish', description: 'Catch a fish over 10 kg.', icon: 'SCALE', priority: 2, check: s => s.stats.biggestFish >= 10 },

  // Gear
  { id: 'buy_gear', name: 'Upgrading', description: 'Buy your first gear upgrade.', icon: 'GEAR', priority: 6, check: s => Object.keys(s.gear).length > 3 },
  { id: 'full_gear', name: 'Fully Equipped', description: 'Own all gear.', icon: 'GEAR', priority: 3, check: s => Object.keys(s.gear).length >= 15 },

  // Casting
  { id: 'perfect_cast', name: 'Bullseye', description: 'Get a perfect cast.', icon: 'TARGET', priority: 8, check: s => s.stats.perfectCasts >= 1 },
  { id: 'casts_100', name: 'Persistent', description: 'Cast 100 times.', icon: 'ROD', priority: 6, check: s => s.stats.totalCasts >= 100 },

  // Weather
  { id: 'storm_catch', name: 'Storm Chaser', description: 'Catch a fish during a storm.', icon: 'BOLT', priority: 8, check: s => s.stats.stormCatches >= 1 },
  { id: 'night_catch', name: 'Night Owl', description: 'Catch a fish at night.', icon: 'MOON', priority: 8, check: s => s.stats.nightCatches >= 1 },

  // Crew
  { id: 'hire_crew', name: 'Team Player', description: 'Hire your first crew member.', icon: 'PERSON', priority: 6, check: s => s.crewUnlocked.length >= 1 }
];

export function checkAchievements(saveData) {
  const newAchievements = [];
  for (const ach of ACHIEVEMENTS) {
    if (!saveData.achievements.includes(ach.id) && ach.check(saveData)) {
      newAchievements.push(ach);
    }
  }
  // Sort by priority (lower = more important = first)
  newAchievements.sort((a, b) => a.priority - b.priority);
  return newAchievements;
}
