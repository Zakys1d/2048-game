'use strict';

const Game = require('../modules/Game.class');

const game = new Game();

const SIZE = 4;
const MOVE_TIME = 130;

const board = document.querySelector('.board');
const layer = document.querySelector('.tiles');
const scoreElement = document.querySelector('.game-score');
const button = document.querySelector('.button');
const abilityButtons = [...document.querySelectorAll('.ability')];
const messages = {
  start: document.querySelector('.message-start'),
  win: document.querySelector('.message-win'),
  lose: document.querySelector('.message-lose'),
};

const KEYS = {
  ArrowLeft: 'moveLeft',
  ArrowRight: 'moveRight',
  ArrowUp: 'moveUp',
  ArrowDown: 'moveDown',
};

let tiles = [];
let started = false;
let busy = false;
let deleteMode = false;
let previousScore = 0;

function restartAnimation(element, className) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

function placeTile(tile, row, col) {
  tile.row = row;
  tile.col = col;
  tile.el.style.setProperty('--row', row);
  tile.el.style.setProperty('--col', col);
}

function createTile(row, col, value, effect) {
  const el = document.createElement('div');
  const inner = document.createElement('div');

  el.className = `tile tile--${value}`;
  inner.className = 'tile__inner';
  inner.textContent = value;

  if (effect) {
    el.classList.add(`tile--${effect}`);
  }

  el.append(inner);

  const tile = {
    el, value,
  };

  placeTile(tile, row, col);
  layer.append(el);
  tiles.push(tile);

  return tile;
}

/**
 * Throws away all tile elements and draws them again from the game state.
 */
function rebuild(effect) {
  layer.innerHTML = '';
  tiles = [];

  game.getState().forEach((line, row) => {
    line.forEach((value, col) => {
      if (value) {
        createTile(row, col, value, effect);
      }
    });
  });
}

/**
 * After the slide animation: merges tiles that landed on the same cell
 * and adds the tile that has just spawned.
 */
function reconcile() {
  const state = game.getState();

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const here = tiles.filter((tile) => tile.row === row && tile.col === col);
      const value = state[row][col];

      if (here.length === 1 && here[0].value === value) {
        continue;
      }

      here.forEach((tile) => tile.el.remove());
      tiles = tiles.filter((tile) => !here.includes(tile));

      if (value) {
        createTile(row, col, value, here.length > 1 ? 'merged' : 'new');
      }
    }
  }
}

function updateScore() {
  const score = game.getScore();

  scoreElement.textContent = score;

  if (score > previousScore) {
    restartAnimation(scoreElement, 'bump');
  }

  previousScore = score;
}

function updateAbilities() {
  const playing = started && game.getStatus() === 'playing';

  abilityButtons.forEach((abilityButton) => {
    const name = abilityButton.dataset.ability;
    const charges = game.getAbilityCharges(name);

    abilityButton.querySelector('.ability__charges').textContent = charges;

    abilityButton.disabled
      = charges === 0 || (!playing && !(name === 'undo' && started));
  });
}

function showStatus() {
  const status = game.getStatus();

  messages.win.classList.toggle('hidden', status !== 'win');
  messages.lose.classList.toggle('hidden', status !== 'lose');
}

function refresh() {
  updateScore();
  updateAbilities();
  showStatus();
}

function setDeleteMode(value) {
  deleteMode = value;
  board.classList.toggle('deleting', value);

  document
    .querySelector('[data-ability="delete"]')
    .classList.toggle('active', value);
}

function startGame() {
  game.restart();
  setDeleteMode(false);
  started = true;
  previousScore = 0;

  game.start();
  game.start();

  rebuild('new');

  button.textContent = 'Restart';
  button.classList.remove('start');
  button.classList.add('restart');
  messages.start.classList.add('hidden');

  refresh();
}

function makeMove(action) {
  setDeleteMode(false);

  if (!game[action]()) {
    restartAnimation(board, 'shake');

    return;
  }

  busy = true;

  game.getLastMoves().forEach(({ from, to }) => {
    const tile = tiles.find((t) => t.row === from.row && t.col === from.col);

    placeTile(tile, to.row, to.col);
  });

  game.start();
  refresh();

  setTimeout(() => {
    reconcile();
    busy = false;
  }, MOVE_TIME);
}

button.addEventListener('click', () => {
  button.blur();
  startGame();
});

document.addEventListener('keydown', (e) => {
  const action = KEYS[e.key];

  if (!action || !started || busy || game.getStatus() !== 'playing') {
    return;
  }

  e.preventDefault();
  makeMove(action);
});

abilityButtons.forEach((abilityButton) => {
  abilityButton.addEventListener('click', () => {
    const name = abilityButton.dataset.ability;

    if (busy) {
      return;
    }

    if (name === 'delete') {
      setDeleteMode(!deleteMode && game.getAbilityCharges('delete') > 0);

      return;
    }

    setDeleteMode(false);

    if (name === 'shuffle' && game.shuffle()) {
      rebuild('shuffled');
    } else if (name === 'undo' && game.undo()) {
      rebuild();
    }

    refresh();
  });
});

layer.addEventListener('click', (e) => {
  const el = e.target.closest('.tile');
  const tile = deleteMode && tiles.find((t) => t.el === el);

  if (!tile || !game.deleteTile(tile.row, tile.col)) {
    return;
  }

  busy = true;
  setDeleteMode(false);
  tile.el.classList.add('tile--removed');

  setTimeout(() => {
    rebuild();
    refresh();
    busy = false;
  }, 300);
});

refresh();
