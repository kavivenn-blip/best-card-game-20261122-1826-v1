// Monsoon Market — boot and frame loop for the table.
// One job: own the canvas, the clock and the phase switch. Rules live in
// game-state.js, drawing in renderer.js, input in input.js.

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './config.js';
import { newMatch } from './game-state.js';
import { drawGame, drawTitle, drawWin, drawLoss } from './renderer.js';
import { installInput } from './input.js';
import { makeSounds } from './sounds.js';
import { buildShotState } from './screenshot-states.js';

const canvas = document.getElementById('game');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || '1');

const sounds = makeSounds();
const ui = { hoverCard: -1, cardRects: [], endTurnButton: null, flying: null, requestRestart: false };

// Screenshot mode: one fixed frame, no loop, no input — a real render of the
// game's own code at a state the game itself can reach.
if (shot) {
  const state = buildShotState(shot);
  const frozenTime = 1200;
  if (state.phase === 'title') drawTitle(ctx, frozenTime);
  else if (state.phase === 'won') drawWin(ctx, state);
  else if (state.phase === 'lost') drawLoss(ctx, state);
  else drawGame(ctx, state, ui, frozenTime);
  document.title = `Monsoon Market — ${shot}`;
} else {
  const holder = { state: newMatch(seed) };
  installInput(canvas, holder, ui, sounds);
  let lastPhase = holder.state.phase;

  function frame(time) {
    if (ui.requestRestart) {
      ui.requestRestart = false;
      holder.state = newMatch(seed + Math.floor(Math.random() * 1000));
      lastPhase = holder.state.phase;
    }
    const state = holder.state;
    if (state.phase === 'title') drawTitle(ctx, time);
    else if (state.phase === 'won') drawWin(ctx, state);
    else if (state.phase === 'lost') drawLoss(ctx, state);
    else drawGame(ctx, state, ui, time);

    if (state.phase !== lastPhase) {
      if (state.phase === 'won') sounds.play('win');
      if (state.phase === 'lost') sounds.play('lose');
      lastPhase = state.phase;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
