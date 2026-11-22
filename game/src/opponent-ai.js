// Monsoon Market — Mara, the rival spice merchant: her plan and her turns.
// One job: decide what Mara does, and say it out loud BEFORE she does it,
// so the player can read her intent and counter it.

import { mulberry32 } from './cards.js';
import { chainMultiplier, triggersSurge } from './combo-rules.js';
import { canPlayCard, playCard } from './game-state.js';

// Mara's plan for the coming turn, computed from her hand and the board.
// The plan is shown as a banner while it is still the player's turn.
export function planOpponentTurn(state, seedOffset = 0) {
  const random = mulberry32(state.seed * 1000 + state.turn * 31 + seedOffset);
  const hand = state.opponent.hand;
  const playerStall = state.player.stall;
  const maraStall = state.opponent.stall;

  const attacks = hand.filter((c) => c.kind === 'attack');
  const shields = hand.filter((c) => c.kind === 'shield');
  const heals = hand.filter((c) => c.kind === 'heal');

  const attackValue = attacks.reduce((sum, c) => sum + c.value, 0);

  let plan;
  if (maraStall <= 10 && heals.length > 0) {
    plan = { kind: 'heal', label: `MARA PLANS: REPAIR ${heals[0].value} STALL`, detail: 'She will mend her stall — press the attack now.' };
  } else if (playerStall <= 8 && attacks.length > 0) {
    plan = { kind: 'finish', label: `MARA PLANS: FINISHING BLOW ${attackValue}`, detail: 'She smells blood. Block or heal this turn.' };
  } else if (shields.length > 0 && random() < 0.35) {
    plan = { kind: 'shield', label: `MARA PLANS: RAISE ${shields[0].value} BLOCK`, detail: 'She will turtle up. Save your big hits.' };
  } else if (attacks.length >= 2) {
    plan = { kind: 'attack', label: `MARA PLANS: HEAVY ATTACK ${attackValue}`, detail: 'Two or more strikes are coming. A shield card answers them.' };
  } else if (attacks.length === 1) {
    plan = { kind: 'attack', label: `MARA PLANS: ATTACK ${attacks[0].value}`, detail: 'One strike is coming.' };
  } else {
    plan = { kind: 'trade', label: 'MARA PLANS: TRADE & DRAW', detail: 'She will draw and gather coins instead of striking.' };
  }
  return plan;
}

// Play Mara's turn: spend her coins on the best cards she can afford,
// preferring same-family chains, then end her turn. Returns the cards played.
export function runOpponentTurn(state) {
  const played = [];
  const random = mulberry32(state.seed * 7919 + state.turn * 13);
  let guard = 0;
  while (guard < 12) {
    guard++;
    const affordable = state.opponent.hand
      .map((card, index) => ({ card, index }))
      .filter(({ card }) => canPlayCard(state, 'opponent', card));
    if (affordable.length === 0) break;

    // Prefer the play with the best chained value; break ties with a seeded pick.
    affordable.sort((a, b) => {
      const scoreA = chainedValue(state, a.card) - a.card.cost;
      const scoreB = chainedValue(state, b.card) - b.card.cost;
      return scoreB - scoreA;
    });
    const pick = affordable[0].card;
    const surgeSoon = triggersSurge(state.playedThisTurn, pick);
    // Mara stops early sometimes, so she does not always empty her hand.
    if (played.length >= 2 && !surgeSoon && random() < 0.45) break;
    const effect = playCard(state, 'opponent', affordable[0].index);
    if (!effect) break;
    played.push(pick);
    if (state.phase !== 'playing') break;
  }
  return played;
}

function chainedValue(state, card) {
  const mult = chainMultiplier(state.playedThisTurn, card);
  let value = card.value * mult;
  if (card.kind === 'attack') value += 2; // Mara likes hitting
  if (card.kind === 'heal' && state.opponent.stall > 24) value -= 4; // no need to heal
  if (card.kind === 'shield' && state.player.stall < 6) value -= 3; // finish instead
  return value;
}
