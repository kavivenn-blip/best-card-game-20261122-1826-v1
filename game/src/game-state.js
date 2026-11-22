// Monsoon Market — game state: phases, turns, and what a played card does.
// One job: the rules of a match. Rendering and input live elsewhere.

import {
  STARTING_STALL,
  STARTING_COINS,
  MAX_COINS,
  HAND_SIZE,
  DRAW_PER_TURN,
} from './config.js';
import { dealDecks } from './cards.js';
import { resolveCardEffect } from './combo-rules.js';

export const PHASES = ['title', 'playing', 'won', 'lost'];

export function newMatch(seed = 1) {
  const { playerDeck, opponentDeck } = dealDecks(seed);
  const state = {
    seed,
    phase: 'title',
    turn: 1,
    turnOwner: 'player',
    player: {
      stall: STARTING_STALL,
      coins: STARTING_COINS,
      block: 0,
      deck: playerDeck,
      hand: [],
      discard: [],
    },
    opponent: {
      stall: STARTING_STALL,
      coins: STARTING_COINS,
      block: 0,
      deck: opponentDeck,
      hand: [],
      discard: [],
    },
    playedThisTurn: [],
    lastPlayed: null,
    lastEffect: null,
    intent: null, // what Mara plans to do — shown to the player before her turn
    weatherFreeNext: false,
    rivalPaysExtra: false,
    log: ['Welcome to Monsoon Market.'],
    winner: null,
  };
  drawCards(state.player, HAND_SIZE);
  drawCards(state.opponent, HAND_SIZE);
  return state;
}

export function drawCards(side, count) {
  for (let i = 0; i < count; i++) {
    if (side.hand.length >= 7) return; // the table holds at most seven cards
    if (side.deck.length === 0) {
      if (side.discard.length === 0) return;
      side.deck = side.discard.splice(0).reverse();
    }
    side.hand.push(side.deck.shift());
  }
}

export function startMatch(state) {
  state.phase = 'playing';
  state.log.push('Round 1 — your turn. Play cards, then End Turn.');
}

export function cardCost(state, side, card) {
  let cost = card.cost;
  if (side === 'player' && state.weatherFreeNext) cost = 0;
  if (side === 'opponent' && state.rivalPaysExtra) cost += 1;
  return Math.max(0, cost);
}

export function canPlayCard(state, side, card) {
  if (state.phase !== 'playing') return false;
  if (state.turnOwner !== side) return false;
  const actor = side === 'player' ? state.player : state.opponent;
  return actor.coins >= cardCost(state, side, card);
}

// Apply damage through block first, then stall. Returns damage that landed.
export function dealDamage(state, target, amount) {
  const side = target === 'player' ? state.player : state.opponent;
  let left = amount;
  if (side.block > 0) {
    const absorbed = Math.min(side.block, left);
    side.block -= absorbed;
    left -= absorbed;
  }
  side.stall = Math.max(0, side.stall - left);
  return left;
}

export function playCard(state, side, cardIndex) {
  const actor = side === 'player' ? state.player : state.opponent;
  const foe = side === 'player' ? state.opponent : state.player;
  const card = actor.hand[cardIndex];
  if (!card || !canPlayCard(state, side, card)) return null;

  const cost = cardCost(state, side, card);
  actor.coins -= cost;
  actor.hand.splice(cardIndex, 1);
  actor.discard.push(card);

  const effect = resolveCardEffect(state.playedThisTurn, card);
  state.playedThisTurn.push(card);
  state.lastPlayed = card;
  state.lastEffect = effect;

  if (card.kind === 'weather') {
    if (card.name === 'Monsoon Burst') {
      state.weatherFreeNext = true;
      state.log.push(`${who(side)} calls a Monsoon Burst — next card is free.`);
    } else if (card.name === 'Dry Spell') {
      state.rivalPaysExtra = true;
      state.log.push(`${who(side)} casts a Dry Spell — rival pays +1 next card.`);
    }
  } else {
    if (effect.damage > 0) {
      const landed = dealDamage(state, side === 'player' ? 'opponent' : 'player', effect.damage);
      state.log.push(`${who(side)} plays ${card.name} for ${effect.damage} (x${effect.multiplier}${effect.surge ? ' + Surge 5' : ''}) — ${landed} lands.`);
    }
    if (effect.block > 0) {
      actor.block += effect.block;
      state.log.push(`${who(side)} raises ${effect.block} block.`);
    }
    if (effect.heal > 0) {
      actor.stall = Math.min(STARTING_STALL, actor.stall + effect.heal);
      state.log.push(`${who(side)} repairs ${effect.heal} stall.`);
    }
    if (effect.draw > 0) {
      drawCards(actor, effect.draw);
      state.log.push(`${who(side)} draws ${effect.draw}.`);
    }
    if (effect.coins > 0) {
      if (card.kind === 'trick') {
        const stolen = Math.min(foe.coins, effect.coins);
        foe.coins -= stolen;
        actor.coins += stolen;
        state.log.push(`${who(side)} steals ${stolen} coins.`);
      } else {
        actor.coins = Math.min(MAX_COINS, actor.coins + effect.coins);
        state.log.push(`${who(side)} gains ${effect.coins} coins.`);
      }
    }
  }

  if (side === 'player' && state.weatherFreeNext && card.kind !== 'weather') {
    state.weatherFreeNext = false;
  }
  checkEnd(state);
  return effect;
}

function who(side) {
  return side === 'player' ? 'You' : 'Mara';
}

export function endTurn(state) {
  if (state.phase !== 'playing' || state.turnOwner !== 'player') return;
  state.turnOwner = 'opponent';
  state.playedThisTurn = [];
  state.log.push('— Mara takes her turn —');
}

export function startPlayerTurn(state) {
  state.turn += 1;
  state.turnOwner = 'player';
  state.playedThisTurn = [];
  state.player.block = 0;
  state.player.coins = Math.min(MAX_COINS, state.player.coins + 3);
  drawCards(state.player, DRAW_PER_TURN);
  state.log.push(`Round ${state.turn} — your turn. +3 coins, drew ${DRAW_PER_TURN}.`);
}

export function startOpponentTurn(state) {
  state.opponent.block = 0;
  state.opponent.coins = Math.min(MAX_COINS, state.opponent.coins + 3);
  drawCards(state.opponent, DRAW_PER_TURN);
}

function checkEnd(state) {
  if (state.opponent.stall <= 0) {
    state.phase = 'won';
    state.winner = 'player';
    state.intent = null;
    state.log.push('Mara’s stall falls — the market is yours!');
  } else if (state.player.stall <= 0) {
    state.phase = 'lost';
    state.winner = 'opponent';
    state.intent = null;
    state.log.push('Your stall falls — Mara takes the market.');
  }
}
