// Monsoon Market — input: mouse clicks and keyboard for the table.
// One job: turn pointer and key events into game actions. No drawing here.

import { playCard, endTurn, startMatch, startOpponentTurn, startPlayerTurn } from './game-state.js';
import { runOpponentTurn, planOpponentTurn } from './opponent-ai.js';

export function installInput(canvas, holder, ui, sounds) {
  canvas.addEventListener('mousemove', (event) => {
    const pos = canvasPos(canvas, event);
    ui.hoverCard = -1;
    (ui.cardRects || []).forEach((rect) => {
      if (pos.x >= rect.x && pos.x <= rect.x + rect.w && pos.y >= rect.y && pos.y <= rect.y + rect.h) {
        ui.hoverCard = rect.index;
      }
    });
  });

  canvas.addEventListener('click', (event) => {
    const state = holder.state;
    const pos = canvasPos(canvas, event);
    if (state.phase === 'title') {
      startMatch(state);
      state.intent = planOpponentTurn(state);
      sounds.play('start');
      return;
    }
    if (state.phase === 'won' || state.phase === 'lost') return;
    if (state.turnOwner !== 'player') return;

    // End Turn button
    const btn = ui.endTurnButton;
    if (btn && pos.x >= btn.x && pos.x <= btn.x + btn.w && pos.y >= btn.y && pos.y <= btn.y + btn.h) {
      endPlayerTurn(state, ui, sounds);
      return;
    }

    // A card in hand
    const rect = (ui.cardRects || []).find(
      (r) => pos.x >= r.x && pos.x <= r.x + r.w && pos.y >= r.y && pos.y <= r.y + r.h,
    );
    if (rect) playPlayerCard(state, ui, sounds, rect.index);
  });

  window.addEventListener('keydown', (event) => {
    const state = holder.state;
    if (event.key >= '1' && event.key <= '5') {
      const index = Number(event.key) - 1;
      if (state.phase === 'playing' && state.turnOwner === 'player') {
        playPlayerCard(state, ui, sounds, index);
      }
    } else if (event.key === 'Enter' || event.key === ' ') {
      if (state.phase === 'playing' && state.turnOwner === 'player') endPlayerTurn(state, ui, sounds);
      else if (state.phase === 'title') {
        startMatch(state);
        state.intent = planOpponentTurn(state);
      }
    } else if (event.key === 'r' || event.key === 'R') {
      ui.requestRestart = true;
    } else if (event.key === 'm' || event.key === 'M') {
      sounds.toggleMute();
    }
  });
}

function playPlayerCard(state, ui, sounds, index) {
  const card = state.player.hand[index];
  if (!card) return;
  const rect = (ui.cardRects || [])[index];
  const effect = playCard(state, 'player', index);
  if (!effect) {
    sounds.play('deny');
    return;
  }
  sounds.play(effect.surge ? 'surge' : 'play');
  if (rect) {
    ui.flying = {
      card,
      fromX: rect.x,
      fromY: rect.y,
      toX: 565,
      toY: 196,
      start: performance.now(),
    };
    window.setTimeout(() => { ui.flying = null; }, 400);
  }
}

// End the player's turn, run Mara's turn with pauses, then open the next round.
export function endPlayerTurn(state, ui, sounds) {
  endTurn(state);
  sounds.play('endturn');
  startOpponentTurn(state);
  window.setTimeout(() => {
    runOpponentTurn(state);
    sounds.play('opponent');
    if (state.phase !== 'playing') return;
    window.setTimeout(() => {
      startPlayerTurn(state);
      state.intent = planOpponentTurn(state);
    }, 650);
  }, 500);
}

function canvasPos(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}
