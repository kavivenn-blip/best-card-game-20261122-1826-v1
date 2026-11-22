// Monsoon Market — shared table constants: canvas size, colours, families.
// One job: every number the rest of the game agrees on lives here.

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

export const CARD_WIDTH = 150;
export const CARD_HEIGHT = 210;
export const HAND_Y = 470;
export const OPPONENT_HAND_Y = 96;

// Four spice families. Each is told apart by colour AND shape, never text alone.
export const FAMILIES = {
  chili: { name: 'Chili', colour: '#e5484d', dark: '#8f1d22', shape: 'flame', light: '#ffb3ab' },
  turmeric: { name: 'Turmeric', colour: '#f5a623', dark: '#8a5a00', shape: 'sun', light: '#ffe1a1' },
  cardamom: { name: 'Cardamom', colour: '#3fae6a', dark: '#14532d', shape: 'leaf', light: '#b5ecc9' },
  anise: { name: 'Star Anise', colour: '#9b6dd6', dark: '#4c2a86', shape: 'star', light: '#dccdfb' },
};

export const FAMILY_KEYS = ['chili', 'turmeric', 'cardamom', 'anise'];

export const STARTING_STALL = 30;
export const STARTING_COINS = 3;
export const MAX_COINS = 6;
export const HAND_SIZE = 5;
export const DRAW_PER_TURN = 2;
export const CHAIN_DOUBLE_AT = 2; // 2nd same-family card in a turn: value x2
export const SURGE_AT = 3; // 3rd same-family card in a turn: Monsoon Surge +5
export const SURGE_BONUS = 5;

export const OPPONENT_NAME = 'MARA';
export const PLAYER_NAME = 'YOU';
