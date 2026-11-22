// Monsoon Market — the canvas renderer: table, cards, HUD and end screens.
// One job: draw the current state. It never changes the state.

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CARD_WIDTH,
  CARD_HEIGHT,
  HAND_Y,
  FAMILIES,
  STARTING_STALL,
} from './config.js';
import { chainSummary } from './combo-rules.js';
import { cardCost } from './game-state.js';
import { mulberry32 } from './cards.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ---- family icons: colour AND shape, never text alone ----
export function drawFamilyIcon(ctx, shape, cx, cy, size, colour) {
  ctx.save();
  ctx.fillStyle = colour;
  ctx.strokeStyle = colour;
  ctx.lineWidth = Math.max(2, size * 0.08);
  ctx.beginPath();
  if (shape === 'flame') {
    ctx.moveTo(cx, cy - size * 0.55);
    ctx.bezierCurveTo(cx + size * 0.5, cy - size * 0.1, cx + size * 0.42, cy + size * 0.4, cx, cy + size * 0.5);
    ctx.bezierCurveTo(cx - size * 0.42, cy + size * 0.4, cx - size * 0.5, cy - size * 0.1, cx, cy - size * 0.55);
    ctx.fill();
    ctx.fillStyle = '#ffd23e';
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.1);
    ctx.bezierCurveTo(cx + size * 0.22, cy + size * 0.12, cx + size * 0.18, cy + size * 0.32, cx, cy + size * 0.36);
    ctx.bezierCurveTo(cx - size * 0.18, cy + size * 0.32, cx - size * 0.22, cy + size * 0.12, cx, cy - size * 0.1);
    ctx.fill();
  } else if (shape === 'sun') {
    ctx.arc(cx, cy, size * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const x1 = cx + Math.cos(a) * size * 0.42;
      const y1 = cy + Math.sin(a) * size * 0.42;
      const x2 = cx + Math.cos(a) * size * 0.58;
      const y2 = cy + Math.sin(a) * size * 0.58;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.stroke();
  } else if (shape === 'leaf') {
    ctx.moveTo(cx, cy - size * 0.55);
    ctx.bezierCurveTo(cx + size * 0.5, cy - size * 0.2, cx + size * 0.45, cy + size * 0.45, cx, cy + size * 0.55);
    ctx.bezierCurveTo(cx - size * 0.45, cy + size * 0.45, cx - size * 0.5, cy - size * 0.2, cx, cy - size * 0.55);
    ctx.fill();
    ctx.strokeStyle = '#eafff0';
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.4);
    ctx.lineTo(cx, cy + size * 0.45);
    ctx.stroke();
  } else {
    // star — five points
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? size * 0.55 : size * 0.24;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function kindLabel(card) {
  switch (card.kind) {
    case 'attack': return 'DMG';
    case 'shield': return 'BLOCK';
    case 'heal': return 'REPAIR';
    case 'draw': return 'DRAW';
    case 'trick': return 'STEAL';
    case 'weather': return 'WEATHER';
    default: return '';
  }
}

// ---- one card ----
export function drawCard(ctx, x, y, card, opts = {}) {
  const w = opts.w || CARD_WIDTH;
  const h = opts.h || CARD_HEIGHT;
  const scale = w / CARD_WIDTH;
  const fam = FAMILIES[card.family];
  ctx.save();
  if (opts.dim) ctx.globalAlpha = 0.45;

  // card body
  roundRect(ctx, x, y, w, h, 12 * scale);
  ctx.fillStyle = '#fff8e7';
  ctx.fill();
  ctx.lineWidth = 3 * scale;
  ctx.strokeStyle = fam.dark;
  ctx.stroke();

  // family band
  roundRect(ctx, x + 3 * scale, y + 3 * scale, w - 6 * scale, 34 * scale, 9 * scale);
  ctx.fillStyle = fam.colour;
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${17 * scale}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(fam.name.toUpperCase(), x + w / 2, y + 21 * scale);

  // cost coin
  ctx.beginPath();
  ctx.arc(x + 24 * scale, y + 52 * scale, 17 * scale, 0, Math.PI * 2);
  ctx.fillStyle = '#f5a623';
  ctx.fill();
  ctx.lineWidth = 2.5 * scale;
  ctx.strokeStyle = '#8a5a00';
  ctx.stroke();
  ctx.fillStyle = '#3a2400';
  ctx.font = `bold ${19 * scale}px Georgia, serif`;
  ctx.fillText(String(opts.cost ?? card.cost), x + 24 * scale, y + 53 * scale);

  // family icon, large
  drawFamilyIcon(ctx, fam.shape, x + w / 2, y + 108 * scale, 52 * scale, fam.colour);

  // name
  ctx.fillStyle = '#2b1a08';
  ctx.font = `bold ${19 * scale}px Georgia, serif`;
  ctx.fillText(card.name, x + w / 2, y + 152 * scale);

  // value + kind
  if (card.kind !== 'weather') {
    ctx.font = `bold ${34 * scale}px Georgia, serif`;
    ctx.fillStyle = fam.dark;
    ctx.fillText(String(card.value), x + w / 2, y + 182 * scale);
    ctx.font = `bold ${12 * scale}px Georgia, serif`;
    ctx.fillStyle = '#6b4a1f';
    ctx.fillText(kindLabel(card), x + w / 2, y + 200 * scale);
  } else {
    ctx.font = `bold ${13 * scale}px Georgia, serif`;
    ctx.fillStyle = '#6b4a1f';
    ctx.textAlign = 'center';
    wrapText(ctx, card.text, x + w / 2, y + 178 * scale, w - 20 * scale, 15 * scale);
  }
  ctx.restore();
}

function wrapText(ctx, text, cx, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, cx, y + i * lineHeight));
}

function drawFaceDownCard(ctx, x, y, w, h) {
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = '#7a2e2e';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#f5a623';
  ctx.stroke();
  roundRect(ctx, x + 6, y + 6, w - 12, h - 12, 7);
  ctx.strokeStyle = '#f5a623';
  ctx.stroke();
  drawFamilyIcon(ctx, 'star', x + w / 2, y + h / 2, 30, '#f5a623');
}

// ---- background: night market, rain, lanterns ----
function drawBackground(ctx, time, seed, opts = {}) {
  // sky
  const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  sky.addColorStop(0, '#1d2b4a');
  sky.addColorStop(0.45, '#2c3e63');
  sky.addColorStop(1, '#4a2c3f');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // striped awning
  const stripeW = 80;
  for (let i = 0; i < CANVAS_WIDTH / stripeW + 1; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#c0392b' : '#f5e6c8';
    ctx.fillRect(i * stripeW, 0, stripeW, 44);
  }
  ctx.fillStyle = '#7a2e2e';
  ctx.fillRect(0, 44, CANVAS_WIDTH, 6);

  // lanterns (only where the sky is empty, e.g. the title screen)
  if (opts.lanterns) {
    const lanternX = [120, 420, 760, 1080];
    lanternX.forEach((x, i) => {
      const bob = Math.sin(time / 900 + i * 1.7) * 3;
      ctx.strokeStyle = '#3a2400';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 50);
      ctx.lineTo(x, 78 + bob);
      ctx.stroke();
      ctx.fillStyle = i % 2 === 0 ? '#ff5a3c' : '#f5a623';
      ctx.beginPath();
      ctx.ellipse(x, 96 + bob, 26, 32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffe9a8';
      ctx.beginPath();
      ctx.ellipse(x, 96 + bob, 12, 22, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // rain — fixed positions from the seed so screenshots are stable
  const random = mulberry32(seed * 31 + 5);
  ctx.strokeStyle = 'rgba(180, 210, 255, 0.35)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 70; i++) {
    const rx = random() * CANVAS_WIDTH;
    const ry = (random() * CANVAS_HEIGHT + time / 18) % CANVAS_HEIGHT;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - 6, ry + 16);
    ctx.stroke();
  }

  // wooden table
  ctx.fillStyle = '#6b4423';
  ctx.fillRect(0, 430, CANVAS_WIDTH, 290);
  ctx.fillStyle = '#7d5230';
  for (let y = 470; y < 720; y += 42) {
    ctx.fillRect(0, y, CANVAS_WIDTH, 3);
  }
  // spice piles along the table's bottom edge, clear of the HUD
  const piles = [
    [980, 706, '#e5484d'], [1100, 706, '#f5a623'], [1225, 706, '#3fae6a'],
  ];
  piles.forEach(([px, py, colour]) => {
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.ellipse(px, py, 34, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawStallBar(ctx, x, y, w, stall, block, label, align = 'left') {
  ctx.save();
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  const tx = align === 'left' ? x : x + w;
  ctx.fillText(label, tx, y - 16);
  ctx.fillStyle = '#2b1a08';
  roundRect(ctx, x, y, w, 26, 8);
  ctx.fill();
  const frac = Math.max(0, stall / STARTING_STALL);
  ctx.fillStyle = frac > 0.5 ? '#3fae6a' : frac > 0.25 ? '#f5a623' : '#e5484d';
  if (frac > 0) {
    roundRect(ctx, x + 2, y + 2, (w - 4) * frac, 22, 6);
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText(`${stall} / ${STARTING_STALL}${block > 0 ? `  (+${block} block)` : ''}`, tx, y + 13);
  ctx.restore();
}

function drawIntentBanner(ctx, state) {
  if (!state.intent) return;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  roundRect(ctx, 500, 66, 430, 62, 10);
  ctx.fillStyle = 'rgba(20, 12, 4, 0.85)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#f5a623';
  ctx.stroke();
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText(state.intent.label, 715, 88);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = '15px Georgia, serif';
  ctx.fillText(state.intent.detail, 715, 114);
  ctx.restore();
}

// ---- main table draw ----
export function drawGame(ctx, state, ui, time) {
  drawBackground(ctx, time, state.seed);

  // opponent row
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  // Mara portrait
  ctx.beginPath();
  ctx.arc(96, 108, 42, 0, Math.PI * 2);
  ctx.fillStyle = '#9b6dd6';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#f5e6c8';
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('M', 96, 110);
  ctx.textAlign = 'left';
  drawStallBar(ctx, 150, 100, 220, state.opponent.stall, state.opponent.block, 'MARA — RIVAL MERCHANT');
  ctx.restore();

  // opponent hand, face down
  const oppHand = state.opponent.hand;
  const oppW = 74;
  const oppH = 104;
  const oppTotal = oppHand.length * (oppW + 8);
  let ox = CANVAS_WIDTH - oppTotal - 24;
  oppHand.forEach(() => {
    drawFaceDownCard(ctx, ox, 62, oppW, oppH);
    ox += oppW + 8;
  });

  drawIntentBanner(ctx, state);

  // played cards + chain line in the middle of the table
  const played = state.playedThisTurn.slice(-3);
  const pw = 120;
  const ph = 168;
  const totalW = played.length * (pw + 14);
  let px = (CANVAS_WIDTH - totalW) / 2;
  played.forEach((card) => {
    drawCard(ctx, px, 196, card, { w: pw, h: ph, cost: cardCost(state, 'player', card) });
    px += pw + 14;
  });
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (state.phase === 'playing') {
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillText(chainSummary(state.playedThisTurn), CANVAS_WIDTH / 2, 392);
    ctx.font = '16px Georgia, serif';
    ctx.fillStyle = '#d8c9a8';
    const logLine = state.log[state.log.length - 1] || '';
    ctx.fillText(logLine, CANVAS_WIDTH / 2, 420);
  }
  ctx.restore();

  // player HUD row
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.fillText(`ROUND ${state.turn}`, 24, 452);
  // coins
  ctx.fillStyle = '#f5a623';
  ctx.beginPath();
  ctx.arc(200, 452, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a2400';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('¢', 200, 453);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText(`COINS ${state.player.coins} / ${6}`, 224, 452);
  ctx.fillStyle = '#d8c9a8';
  ctx.font = '16px Georgia, serif';
  ctx.fillText(`Deck ${state.player.deck.length} · Discard ${state.player.discard.length}`, 380, 452);
  ctx.restore();

  // end turn button
  const btn = { x: 1070, y: 434, w: 186, h: 40 };
  ctx.save();
  roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 9);
  ctx.fillStyle = state.turnOwner === 'player' ? '#3fae6a' : '#5a5a5a';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#eafff0';
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.turnOwner === 'player' ? 'END TURN  ⏎' : 'MARA…', btn.x + btn.w / 2, btn.y + btn.h / 2 + 1);
  ctx.restore();
  ui.endTurnButton = btn;

  // player stall bar (bottom-left, big and readable)
  drawStallBar(ctx, 24, 690, 260, state.player.stall, state.player.block, 'YOUR STALL');
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Click a card to play it · 1–5 select · Enter ends turn', 300, 703);
  ctx.restore();

  // player hand
  const hand = state.player.hand;
  const totalHandW = hand.length * (CARD_WIDTH + 12) - 12;
  let hx = (CANVAS_WIDTH - totalHandW) / 2;
  ui.cardRects = [];
  hand.forEach((card, i) => {
    const hovered = ui.hoverCard === i;
    const y = hovered ? HAND_Y - 18 : HAND_Y;
    const affordable = state.phase === 'playing' && state.turnOwner === 'player'
      && state.player.coins >= cardCost(state, 'player', card);
    drawCard(ctx, hx, y, card, { cost: cardCost(state, 'player', card), dim: !affordable });
    ui.cardRects.push({ x: hx, y, w: CARD_WIDTH, h: CARD_HEIGHT, index: i });
    hx += CARD_WIDTH + 12;
  });

  // flying card animation (slide from hand to table)
  if (ui.flying) {
    const f = ui.flying;
    const t = Math.min(1, (time - f.start) / 350);
    const x = f.fromX + (f.toX - f.fromX) * t;
    const y = f.fromY + (f.toY - f.fromY) * t;
    drawCard(ctx, x, y, f.card, { w: CARD_WIDTH, h: CARD_HEIGHT });
  }
}

// ---- title screen ----
export function drawTitle(ctx, time) {
  drawBackground(ctx, time, 1, { lanterns: true });
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // panel
  roundRect(ctx, 190, 130, 900, 440, 18);
  ctx.fillStyle = 'rgba(20, 12, 4, 0.88)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#f5a623';
  ctx.stroke();

  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 76px Georgia, serif';
  ctx.fillText('MONSOON MARKET', 640, 220);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px Georgia, serif';
  ctx.fillText('A spice-merchant card duel', 640, 282);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = '22px Georgia, serif';
  ctx.fillText('48 cards · 4 spice families · chain combos · a rival you can read', 640, 330);
  ctx.font = '20px Georgia, serif';
  ctx.fillStyle = '#d8c9a8';
  ctx.fillText('Chili burns · Turmeric pays · Cardamom shields · Star Anise tricks', 640, 366);
  ctx.fillText('Play two of one spice to double the second — three calls a Monsoon Surge.', 640, 398);

  const pulse = 0.75 + 0.25 * Math.sin(time / 350);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#3fae6a';
  roundRect(ctx, 490, 440, 300, 64, 12);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px Georgia, serif';
  ctx.fillText('CLICK TO PLAY', 640, 473);
  ctx.fillStyle = '#d8c9a8';
  ctx.font = '18px Georgia, serif';
  ctx.fillText('Mouse or keys 1–5 · Enter ends your turn · R restarts · M mutes', 640, 540);
  ctx.restore();
}

// ---- end screens ----
function drawEndScreen(ctx, state, won) {
  drawGame(ctx, state, { hoverCard: -1 }, 0);
  ctx.save();
  ctx.fillStyle = won ? 'rgba(10, 40, 16, 0.82)' : 'rgba(40, 10, 10, 0.82)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // lanterns / confetti dots
  const random = mulberry32(won ? 99 : 77);
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = ['#ffd23e', '#e5484d', '#3fae6a', '#9b6dd6', '#f5a623'][i % 5];
    ctx.beginPath();
    ctx.arc(random() * CANVAS_WIDTH, random() * CANVAS_HEIGHT, 4 + random() * 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = won ? '#ffd23e' : '#ff8a7a';
  ctx.font = 'bold 84px Georgia, serif';
  ctx.fillText(won ? 'MARKET CROWNED!' : 'STALL CLOSED', 640, 300);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px Georgia, serif';
  ctx.fillText(
    won ? 'Your stall stands. Mara packs up her spices.' : 'Mara takes the market. Your spices scatter in the rain.',
    640, 380,
  );
  ctx.font = '24px Georgia, serif';
  ctx.fillStyle = '#ffe9a8';
  const rounds = `Rounds played: ${state.turn} · Your stall: ${state.player.stall} · Mara’s stall: ${state.opponent.stall}`;
  ctx.fillText(rounds, 640, 430);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText('Press R to play again', 640, 500);
  ctx.restore();
}

export function drawWin(ctx, state) {
  drawEndScreen(ctx, state, true);
}

export function drawLoss(ctx, state) {
  drawEndScreen(ctx, state, false);
}
