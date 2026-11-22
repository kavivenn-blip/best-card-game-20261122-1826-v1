// Monsoon Market — deterministic screenshot states for ?shot=<name>&seed=1.
// One job: build a fixed, honest game state for each screenshot the bounty asks
// for. Every card here is a real card from the deck; nothing is drawn by hand.

import { newMatch, startMatch } from './game-state.js';
import { buildCardList } from './cards.js';

function cardByName(name, occurrence = 0) {
  const matches = buildCardList().filter((c) => c.name === name);
  return matches[occurrence % matches.length];
}

function withHand(state, names) {
  state.player.hand = names.map((n) => cardByName(n));
  state.opponent.hand = [
    cardByName('Ghost Pepper'), cardByName('Green Awning'), cardByName('Sun Ledger'),
    cardByName('Eight Points'), cardByName('Dry Spell'),
  ];
}

// The mid-game table: a chain x2 is live, Mara's intent is showing, both stalls hurt.
export function buildTableState() {
  const state = newMatch(1);
  startMatch(state);
  state.turn = 3;
  state.player.stall = 24;
  state.player.block = 4;
  state.player.coins = 2;
  state.opponent.stall = 18;
  state.opponent.coins = 1;
  withHand(state, ['Ghost Pepper', 'Fire Pot', 'Green Awning', 'Sun Ledger', 'Monsoon Burst']);
  state.playedThisTurn = [cardByName('Ember Sizzle'), cardByName('Chili Roast')];
  state.lastPlayed = cardByName('Chili Roast');
  state.intent = {
    kind: 'attack',
    label: 'MARA PLANS: HEAVY ATTACK 8',
    detail: 'Two strikes are coming. A shield card answers them.',
  };
  state.log = [
    'Round 3 — your turn. +3 coins, drew 2.',
    'You play Chili Roast for 10 (x2) — 10 lands.',
  ];
  return state;
}

export function buildWinState() {
  const state = buildTableState();
  state.phase = 'won';
  state.winner = 'player';
  state.intent = null;
  state.turn = 5;
  state.player.stall = 9;
  state.player.block = 0;
  state.opponent.stall = 0;
  state.playedThisTurn = [
    cardByName('Ember Sizzle'), cardByName('Chili Roast'), cardByName('Fire Pot'),
  ];
  state.log = [
    'You play Fire Pot for 32 (x3 + Surge 5) — the storm breaks.',
    'Mara’s stall falls — the market is yours!',
  ];
  return state;
}

export function buildLossState() {
  const state = buildTableState();
  state.phase = 'lost';
  state.winner = 'opponent';
  state.intent = null;
  state.turn = 4;
  state.player.stall = 0;
  state.player.block = 0;
  state.opponent.stall = 14;
  state.playedThisTurn = [cardByName('Ghost Pepper')];
  state.log = [
    'Mara plays Night Bargain for 8 — 8 lands.',
    'Your stall falls — Mara takes the market.',
  ];
  return state;
}

export function buildShotState(shot) {
  switch (shot) {
    case 'table':
      return buildTableState();
    case 'win':
      return buildWinState();
    case 'loss':
      return buildLossState();
    case 'start':
    default: {
      const state = newMatch(1);
      return state; // phase 'title'
    }
  }
}
