// Monsoon Market — the 48-card spice deck: every card, its cost, value and kind.
// One job: the card catalogue and the shuffled decks. No game flow here.

import { FAMILIES, FAMILY_KEYS } from './config.js';

export const CARD_KINDS = ['attack', 'shield', 'heal', 'draw', 'weather', 'trick'];

// [family, name, cost, value, kind, text]
// value means: damage for attack, block for shield, stall repaired for heal,
// cards drawn for draw, coins stolen for trick. Weather cards carry their rule in text.
const CARD_ROWS = [
  // Chili — attack family (red flame)
  ['chili', 'Ember Sizzle', 1, 3, 'attack', 'Deal 3.'],
  ['chili', 'Ember Sizzle', 1, 3, 'attack', 'Deal 3.'],
  ['chili', 'Ghost Pepper', 2, 6, 'attack', 'Deal 6.'],
  ['chili', 'Ghost Pepper', 2, 6, 'attack', 'Deal 6.'],
  ['chili', 'Chili Roast', 2, 5, 'attack', 'Deal 5.'],
  ['chili', 'Chili Roast', 2, 5, 'attack', 'Deal 5.'],
  ['chili', 'Fire Pot', 3, 9, 'attack', 'Deal 9.'],
  ['chili', 'Fire Pot', 3, 9, 'attack', 'Deal 9.'],
  ['chili', 'Smoke Signal', 1, 2, 'attack', 'Deal 2. Draw 1.'],
  ['chili', 'Smoke Signal', 1, 2, 'attack', 'Deal 2. Draw 1.'],
  ['chili', 'Scorching Rain', 3, 7, 'attack', 'Deal 7.'],
  ['chili', 'Scorching Rain', 3, 7, 'attack', 'Deal 7.'],
  // Turmeric — coin and draw family (gold sun)
  ['turmeric', 'Golden Weigh', 1, 2, 'draw', 'Gain 2 coins.'],
  ['turmeric', 'Golden Weigh', 1, 2, 'draw', 'Gain 2 coins.'],
  ['turmeric', 'Sun Ledger', 2, 2, 'draw', 'Draw 2 cards.'],
  ['turmeric', 'Sun Ledger', 2, 2, 'draw', 'Draw 2 cards.'],
  ['turmeric', 'Market Bell', 1, 1, 'draw', 'Draw 1. Gain 1 coin.'],
  ['turmeric', 'Market Bell', 1, 1, 'draw', 'Draw 1. Gain 1 coin.'],
  ['turmeric', 'Saffron Purse', 3, 4, 'draw', 'Gain 4 coins.'],
  ['turmeric', 'Saffron Purse', 3, 4, 'draw', 'Gain 4 coins.'],
  ['turmeric', 'Fair Scales', 2, 3, 'draw', 'Gain 3 coins.'],
  ['turmeric', 'Fair Scales', 2, 3, 'draw', 'Gain 3 coins.'],
  ['turmeric', 'Sunrise Deal', 1, 2, 'attack', 'Deal 2. Gain 1 coin.'],
  ['turmeric', 'Sunrise Deal', 1, 2, 'attack', 'Deal 2. Gain 1 coin.'],
  // Cardamom — shield and heal family (green leaf)
  ['cardamom', 'Green Awning', 1, 4, 'shield', 'Block 4.'],
  ['cardamom', 'Green Awning', 1, 4, 'shield', 'Block 4.'],
  ['cardamom', 'Leaf Mend', 2, 6, 'heal', 'Repair 6 stall.'],
  ['cardamom', 'Leaf Mend', 2, 6, 'heal', 'Repair 6 stall.'],
  ['cardamom', 'Pod Shelter', 2, 7, 'shield', 'Block 7.'],
  ['cardamom', 'Pod Shelter', 2, 7, 'shield', 'Block 7.'],
  ['cardamom', 'Root Cellar', 3, 10, 'shield', 'Block 10.'],
  ['cardamom', 'Root Cellar', 3, 10, 'shield', 'Block 10.'],
  ['cardamom', 'Herb Poultice', 1, 3, 'heal', 'Repair 3 stall.'],
  ['cardamom', 'Herb Poultice', 1, 3, 'heal', 'Repair 3 stall.'],
  ['cardamom', 'Thick Canopy', 2, 5, 'shield', 'Block 5. Draw 1.'],
  ['cardamom', 'Thick Canopy', 2, 5, 'shield', 'Block 5. Draw 1.'],
  // Star Anise — trick family (purple star)
  ['anise', 'Star Swap', 2, 2, 'trick', 'Steal 2 coins.'],
  ['anise', 'Star Swap', 2, 2, 'trick', 'Steal 2 coins.'],
  ['anise', 'Eight Points', 1, 4, 'attack', 'Deal 4.'],
  ['anise', 'Eight Points', 1, 4, 'attack', 'Deal 4.'],
  ['anise', 'Night Bargain', 3, 8, 'attack', 'Deal 8.'],
  ['anise', 'Night Bargain', 3, 8, 'attack', 'Deal 8.'],
  ['anise', 'Monsoon Burst', 2, 0, 'weather', 'Your next card this turn is free.'],
  ['anise', 'Monsoon Burst', 2, 0, 'weather', 'Your next card this turn is free.'],
  ['anise', 'Dry Spell', 1, 0, 'weather', 'Rival pays +1 for their next card.'],
  ['anise', 'Dry Spell', 1, 0, 'weather', 'Rival pays +1 for their next card.'],
  ['anise', 'Hidden Star', 2, 5, 'attack', 'Deal 5.'],
  ['anise', 'Hidden Star', 2, 5, 'attack', 'Deal 5.'],
];

export function buildCardList() {
  return CARD_ROWS.map(([family, name, cost, value, kind, text], index) => ({
    id: `card-${index + 1}`,
    family,
    name,
    cost,
    value,
    kind,
    text,
  }));
}

// A seeded shuffle (mulberry32), so a given seed always deals the same hands.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function nextRandom() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleDeck(cards, seed) {
  const random = mulberry32(seed);
  const deck = cards.slice();
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Each side plays its own 24-card deck: the 48-card set split by copy number.
export function dealDecks(seed) {
  const all = buildCardList();
  const playerDeck = shuffleDeck(all.filter((_, i) => i % 2 === 0), seed);
  const opponentDeck = shuffleDeck(all.filter((_, i) => i % 2 === 1), seed + 7);
  return { playerDeck, opponentDeck };
}

export function familyName(family) {
  return FAMILIES[family].name;
}
