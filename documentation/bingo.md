# Bingo (`/bingo`)

A simple client-side Bingo game themed on Moussa Alomar. Users click cells when matching elements appear; winning plays a random audio clip.

## Main Files
- `index.html` — UI with a navbar, instructions, image, grid container, audio element, and controls (reshuffle, mute toggle).
- `script.js` — Grid generation, click handling, win detection, URL import/export for custom lists, and audio playback.

## Features
- Generates a 5×5 grid with a fixed center “FREE” cell; fills from a provided list or a predefined pool.
- Clicking toggles `marked` and background color; `checkWin()` tests rows, columns, and diagonals.
- `reshuffleItems()` regenerates the grid preserving the original items list.
- URL encoding: `saveList()` and `loadListFromUrl()` allow sharing a custom 24-item list via `?list=` query.
- Audio: randomly selects one of bundled mp3 files and plays on win; mute toggle clears `src`.

## Key Functions
- `generateBingoCard()`, `shuffleArray(array)`, `markCell()`, `checkWin()`, `announceWinner()`.
- `saveList()`, `loadListFromUrl()`, `updateSavedListLink()`.

## Notes
- Absolute asset paths for shared components and CSS; image `moussa.jpeg` loaded locally.
