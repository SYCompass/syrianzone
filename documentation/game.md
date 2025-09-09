# Game (`/game`)

A prototype for a multiplayer platformer with shooting. Includes local physics, input handling, rendering, network synchronization stubs, and a basic stage format.

## Main Files
- `js/game.js` — Game loop, fixed timestep update, rendering, bullet management, UI updates, and network callbacks.
- `js/player.js` — Player physics (gravity, friction), double jump, wall slide/jump, shooting, health/damage, particles, collision resolution, and network serialization.
- `js/renderer.js`, `js/input.js`, `js/network.js`, `js/stage.js`, `js/bullet.js` — Rendering, input, networking, stage, and bullet implementations (not documented here in detail).
- `stages/stage1.json` — Example stage data.

## Core Systems
- Loop: fixed-timestep update with accumulator; FPS tracking.
- Input: keyboard + mouse input merged each tick; mouse for aiming; click to shoot.
- Player: responsive movement, double jump, wall slide/jump, bounds constraints, respawn, damage/health.
- Bullets: created locally and broadcast to peers; collisions with players; removal on impact.
- Network: callbacks for join/leave/update, player/bullet broadcast methods on `NetworkManager`.
- Rendering: draws stage, players, bullets, and a simple UI (status, FPS, player count).

## Notes
- Prototype quality; networking specifics depend on `NetworkManager` implementation.
- Absolute paths should be used when linking from HTML.
