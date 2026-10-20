'use strict';

const SIZE = 4;
const WIN_VALUE = 2048;
const ABILITY_USES = 3;

/**
 * This class represents the 2048 game.
 * Besides the classic rules it supports three abilities
 * (`shuffle`, `delete`, `undo`), each usable up to 3 times per game.
 */
class Game {
  /**
   * Creates a new game instance.
   * @param {number[][]} [initialState] - initial board state.
   */
  constructor(initialState) {
    this.initialState = initialState || [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    this.restart();
  }

  /**
   * Slides one line towards its start, merging equal neighbours.
   * @param {number[]} line
   * @returns {{result: number[], moves: {from: number, to: number}[]}}
   *   the new line and where every tile of the old line went.
   */
  slideLine(line) {
    const result = [];
    const moves = [];
    const tiles = line
      .map((value, index) => ({
        value, index,
      }))
      .filter((tile) => tile.value !== 0);

    for (let i = 0; i < tiles.length; i++) {
      const to = result.length;
      const tile = tiles[i];
      const next = tiles[i + 1];

      moves.push({
        from: tile.index, to,
      });

      if (next && next.value === tile.value) {
        moves.push({
          from: next.index, to,
        });
        result.push(tile.value * 2);
        this.score += tile.value * 2;
        i++;
      } else {
        result.push(tile.value);
      }
    }

    while (result.length < SIZE) {
      result.push(0);
    }

    return {
      result, moves,
    };
  }

  /**
   * Slides the whole board in the given direction.
   * @param {'left' | 'right' | 'up' | 'down'} direction
   * @returns {boolean} true if the board changed
   */
  move(direction) {
    const before = this.board.join();
    const snapshot = this.takeSnapshot();
    const vertical = direction === 'up' || direction === 'down';
    const reverse = direction === 'right' || direction === 'down';

    this.lastMoves = [];

    for (let i = 0; i < SIZE; i++) {
      let line = vertical
        ? this.board.map((row) => row[i])
        : [...this.board[i]];

      if (reverse) {
        line.reverse();
      }

      const { result, moves } = this.slideLine(line);

      line = result;

      const cell = (position) => {
        const index = reverse ? SIZE - 1 - position : position;

        return vertical ? {
          row: index, col: i,
        } : {
          row: i, col: index,
        };
      };

      moves.forEach(({ from, to }) => {
        this.lastMoves.push({
          from: cell(from), to: cell(to),
        });
      });

      if (reverse) {
        line.reverse();
      }

      for (let j = 0; j < SIZE; j++) {
        if (vertical) {
          this.board[j][i] = line[j];
        } else {
          this.board[i][j] = line[j];
        }
      }
    }

    const moved = this.board.join() !== before;

    if (moved) {
      this.history.push(snapshot);
      this.updateStatus();
    } else {
      this.score = snapshot.score;
    }

    return moved;
  }

  moveLeft() {
    return this.move('left');
  }

  moveRight() {
    return this.move('right');
  }

  moveUp() {
    return this.move('up');
  }

  moveDown() {
    return this.move('down');
  }

  checkWin() {
    return this.board.some((row) => row.includes(WIN_VALUE));
  }

  checkLose() {
    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE; j++) {
        const current = this.board[i][j];

        if (current === 0) {
          return false;
        }

        if (j < SIZE - 1 && current === this.board[i][j + 1]) {
          return false;
        }

        if (i < SIZE - 1 && current === this.board[i + 1][j]) {
          return false;
        }
      }
    }

    return true;
  }

  updateStatus() {
    if (this.checkWin()) {
      this.status = 'win';
    } else if (this.checkLose()) {
      this.status = 'lose';
    } else {
      this.status = 'playing';
    }
  }

  /**
   * @returns {number}
   */
  getScore() {
    return this.score;
  }

  /**
   * @returns {number[][]}
   */
  getState() {
    return this.board;
  }

  /**
   * Returns the current game status:
   * `playing`, `win` or `lose`.
   */
  getStatus() {
    return this.status;
  }

  /**
   * Adds a random tile (`2` with 90% chance, `4` otherwise) to an empty cell.
   * @returns {{row: number, col: number} | null} the cell that was filled
   */
  start() {
    const emptyCells = [];

    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        if (this.board[row][col] === 0) {
          emptyCells.push({
            row, col,
          });
        }
      }
    }

    if (emptyCells.length === 0) {
      return null;
    }

    const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];

    this.board[cell.row][cell.col] = Math.random() < 0.9 ? 2 : 4;
    this.updateStatus();

    return cell;
  }

  /**
   * Resets the board, score, status, history and ability charges.
   */
  restart() {
    this.board = this.initialState.map((row) => [...row]);
    this.score = 0;
    this.status = 'playing';
    this.history = [];
    this.lastMoves = [];

    this.abilities = {
      shuffle: ABILITY_USES,
      delete: ABILITY_USES,
      undo: ABILITY_USES,
    };
  }

  takeSnapshot() {
    return {
      board: this.board.map((row) => [...row]),
      score: this.score,
    };
  }

  /**
   * Where every tile went during the last move.
   * @returns {{from: Cell, to: Cell}[]} where Cell is `{row, col}`
   */
  getLastMoves() {
    return this.lastMoves;
  }

  /**
   * @param {'shuffle' | 'delete' | 'undo'} name
   * @returns {number} charges left
   */
  getAbilityCharges(name) {
    return this.abilities[name];
  }

  /**
   * Randomly rearranges the existing tiles over the whole board.
   * @returns {boolean} true if the ability was used
   */
  shuffle() {
    const tiles = this.board.flat().filter((value) => value !== 0);

    if (this.abilities.shuffle === 0 || tiles.length < 2) {
      return false;
    }

    this.history.push(this.takeSnapshot());

    const cells = Array.from({ length: SIZE * SIZE }, (_, i) => i);

    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    this.board = this.board.map((row) => row.map(() => 0));

    tiles.forEach((value, index) => {
      const cell = cells[index];

      this.board[Math.floor(cell / SIZE)][cell % SIZE] = value;
    });

    this.abilities.shuffle--;
    this.updateStatus();

    return true;
  }

  /**
   * Removes the tile at the given cell.
   * @returns {boolean} true if the ability was used
   */
  deleteTile(row, col) {
    const hasTile = this.board[row] && this.board[row][col];

    if (this.abilities.delete === 0 || !hasTile) {
      return false;
    }

    this.history.push(this.takeSnapshot());
    this.board[row][col] = 0;
    this.abilities.delete--;
    this.updateStatus();

    return true;
  }

  /**
   * Reverts the last move (or ability).
   * @returns {boolean} true if the ability was used
   */
  undo() {
    if (this.abilities.undo === 0 || this.history.length === 0) {
      return false;
    }

    const snapshot = this.history.pop();

    this.board = snapshot.board;
    this.score = snapshot.score;
    this.abilities.undo--;
    this.updateStatus();

    return true;
  }
}

module.exports = Game;
