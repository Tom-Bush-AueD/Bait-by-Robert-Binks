// AI Crew system — hire crew members that provide passive bonuses

export const CREW_MEMBERS = [
  {
    id: 'old_pete',
    name: 'Old Pete',
    title: 'Veteran Fisher',
    description: 'Years of experience. Increases bite chance.',
    price: 300,
    bonus: { biteBonus: 0.15 },
    color: 0x8B7355
  },
  {
    id: 'marina',
    name: 'Marina',
    title: 'Marine Biologist',
    description: 'Knows where rare fish hide. Boosts rarity.',
    price: 400,
    bonus: { rarityBonus: 0.2 },
    color: 0x4488AA
  },
  {
    id: 'jack',
    name: 'Strong Jack',
    title: 'Dock Worker',
    description: 'Helps reel in big fish. Reduces fight difficulty.',
    price: 450,
    bonus: { reelBonus: 0.2 },
    color: 0xAA6633
  },
  {
    id: 'lucky_lin',
    name: 'Lucky Lin',
    title: 'Fortune Teller',
    description: 'Brings good luck. Better sell prices.',
    price: 500,
    bonus: { sellBonus: 0.25 },
    color: 0xCC44AA
  },
  {
    id: 'weather_wes',
    name: 'Weather Wes',
    title: 'Meteorologist',
    description: 'Predicts weather changes. Extended forecast.',
    price: 350,
    bonus: { forecastBonus: true },
    color: 0x5599CC
  }
];

export function getCrewById(id) {
  return CREW_MEMBERS.find(c => c.id === id) || null;
}

export function getActiveCrewBonus(saveData) {
  if (!saveData.crewActive) return {};
  const member = getCrewById(saveData.crewActive);
  return member ? member.bonus : {};
}
