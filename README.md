# 2048 Game

Browser implementation of the classic [2048](https://en.wikipedia.org/wiki/2048_(video_game)) puzzle, built with plain JavaScript, SCSS and [Parcel](https://parceljs.org/) (via `@mate-academy/scripts`).

## How to play

1. Press **Start** to place the first tile.
2. Use the **arrow keys** (← ↑ → ↓) to slide all tiles in that direction.
3. Tiles with the same number merge into one with their sum, and the sum is added to your score.
4. After every move that changes the board, a new tile (`2` with 90% chance, `4` with 10%) appears.
5. Reach the **2048** tile to win. If the board is full and no merges are possible, you lose.
6. Press **Restart** to begin a new game.

### Abilities

Each ability can be used **3 times per game** (the counter is shown on the button):

- **Shuffle** — randomly rearranges all tiles on the board.
- **Delete** — click it, then click any tile to remove it.
- **Back** — undoes the last move (or ability).

## Getting started

```bash
npm install     # install dependencies
npm start       # dev server with live reload (http://localhost:8080)
npm run build   # production build into dist/
npm run lint    # eslint, stylelint and html lint
npm test        # lint + tests
```

## Project structure

```
src/
├── index.html              # page markup
├── images/                 # static images
├── modules/
│   └── Game.class.js       # game logic (board, moves, merge, win/lose checks, score)
├── scripts/
│   └── main.js             # DOM rendering, button and keyboard handlers
└── styles/
    └── main.scss           # styles (tile colors and animations)
```

## Game API (`Game.class.js`)

| Method | Description |
| --- | --- |
| `start()` | Places a random `2`/`4` tile on an empty cell |
| `restart()` | Resets the board, score and status |
| `moveLeft/Right/Up/Down()` | Slides and merges tiles; returns `true` if the board changed |
| `getState()` | Returns the 4×4 board as a 2D array |
| `getScore()` | Returns the current score |
| `getStatus()` | Returns the game status (`playing`, `win`, `lose`) |
| `shuffle()` / `deleteTile(row, col)` / `undo()` | Abilities, 3 charges each per game; return `true` if used |
| `getAbilityCharges(name)` | Remaining charges of `shuffle`, `delete` or `undo` |
| `checkWin()` / `checkLose()` | Check for a 2048 tile / no moves left |

## Troubleshooting

- **`npm start` fails with "Browser scripts cannot have imports or exports"** — the script must be loaded as a module: `<script type="module" src="scripts/main.js"></script>` in `src/index.html`.
