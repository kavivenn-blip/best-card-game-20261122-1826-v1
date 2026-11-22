// Monsoon Market — combo rules: chains and the Monsoon Surge.
// One job: given the cards played this turn, say what each one is worth.

import { CHAIN_DOUBLE_AT, SURGE_AT, SURGE_BONUS } from './config.js';

// Count how many cards of this family were already played this turn.
export function familyChainCount(playedThisTurn, family) {
  return playedThisTurn.filter((card) => card.family === family).length;
}

// The multiplier on a card played now: the 2nd same-family card doubles,
// the 3rd (and later) triples before the Surge bonus is added.
export function chainMultiplier(playedThisTurn, card) {
  const chain = familyChainCount(playedThisTurn, card.family);
  if (chain + 1 >= SURGE_AT) return 3;
  if (chain + 1 >= CHAIN_DOUBLE_AT) return 2;
  return 1;
}

// True when playing this card completes a 3-card same-family chain.
export function triggersSurge(playedThisTurn, card) {
  return familyChainCount(playedThisTurn, card.family) + 1 === SURGE_AT;
}

// Resolve one played card into its concrete effect, after chain rules.
// Returns { damage, block, heal, draw, coins, surge }.
export function resolveCardEffect(playedThisTurn, card) {
  const mult = chainMultiplier(playedThisTurn, card);
  const surge = triggersSurge(playedThisTurn, card);
  const effect = { damage: 0, block: 0, heal: 0, draw: 0, coins: 0, surge, multiplier: mult };
  const value = card.value * mult;
  switch (card.kind) {
    case 'attack':
      effect.damage = value;
      if (card.name === 'Smoke Signal' || card.name === 'Thick Canopy') effect.draw = 1;
      if (card.name === 'Sunrise Deal') effect.coins = 1;
      break;
    case 'shield':
      effect.block = value;
      if (card.name === 'Thick Canopy') effect.draw = 1;
      break;
    case 'heal':
      effect.heal = value;
      break;
    case 'draw':
      if (card.name === 'Sun Ledger') effect.draw = value;
      else if (card.name === 'Market Bell') { effect.draw = 1; effect.coins = 1; }
      else effect.coins = value;
      break;
    case 'trick':
      effect.coins = value; // stolen from the rival
      break;
    case 'weather':
      break; // weather is handled by game-state, not by numbers
    default:
      break;
  }
  if (surge) effect.damage += SURGE_BONUS;
  return effect;
}

// A one-line summary of the chain state, shown above the table.
export function chainSummary(playedThisTurn) {
  if (playedThisTurn.length === 0) return 'No chain yet — play two of one spice to double the second.';
  const last = playedThisTurn[playedThisTurn.length - 1];
  const chain = familyChainCount(playedThisTurn, last.family);
  if (chain >= SURGE_AT) return `MONSOON SURGE! ${last.family.toUpperCase()} chain x${chain} — +${SURGE_BONUS} storm damage.`;
  if (chain === CHAIN_DOUBLE_AT) return `CHAIN x2 — ${last.family.toUpperCase()} doubled. One more for a Monsoon Surge!`;
  return `${last.family.toUpperCase()} chain x${chain}. Play another ${last.family} card to double it.`;
}
