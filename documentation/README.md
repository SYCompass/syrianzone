# Syrian Zone Documentation

This documentation describes the overall project structure and provides an overview of each subpage/app. Each subpage has a dedicated markdown file under this directory with details about features, data flow, and key functions.

## Deployment topology (prod)

```
                Internet (Cloudflare)
                        |
                   VPS (Apache)
                 reverse proxy :443
                        |
                 127.0.0.1:3030
                        |
                 Coolify → Container
                        |
                 Next.js (poll/) on :3000
                 ├─ SSR app under /tierlist
                 └─ Static subapps copied into poll/public
                    (/bingo, /house, /syofficial, ...)
```

Key points:
- Apache has a single catch‑all proxy to the Coolify-published port (3030). No extra /tierlist rules.
- The Next.js app serves the landing page at `/` from `public/index.html` and the dynamic app under `/tierlist`.
- Static subapps are copied into `poll/public` at build/start (see `poll/scripts/link-static.mjs`).

## Repository Structure (High-level)

- `/index.html` — Start page (dashboard-style landing) with weather, clock, search, and quick links
- `/components/` — Reusable web components and helpers
  - `navbar.js` — Custom element for the site navigation bar
  - `utils-csv.js`, `utils-http.js`, `utils-cache.js`, `utils-offline.js` — Shared utilities (see below)
- `/startpage/` — Scripts and assets supporting the start page (`script.js`, `languages.js`)
- `/syofficial/` — Official Syrian accounts directory (multi-category, i18n, CSV-fed)
- `/syid/` — Syrian visual identity resources (colors, flag specs, assets)
- `/party/` — Syrian political organizations directory (CSV-fed)
- `/hotels/` — Syrian hotels directory (CSV-fed, grid/table views)
- `/compass/` — Political compass test for Syria (CSV-fed questions, animated results)
- `/alignment/` — Custom political compass generator (interactive canvas, export options)
- `/board/` — Issues board viewer (reads GitHub issues via Octokit)
- `/bingo/` — Moussa Alomar Bingo (client-side game)
- `/game/` — Multiplayer platformer (static prototype)
- `/sites/` — Syrian websites link directory
- `/stats/` — Stats landing (static)
- `/legacytierlist/` — Legacy static tierlist page and assets (replaced by Next.js app)
- `/poll/` — Next.js app (tierlist) served under `/tierlist` behind Apache→Coolify
- `/flag-replacer/` — Twitter SVG Syrian Flag Replacer (extension assets)
- Root utilities
  - `server.js` — Express static server + historical notes (not used in prod routing)
  - `list-projects-for-repo.mjs` — Script to fetch issues and synthesize a board
  - `styles/` and `output.css` — Shared CSS output

## Shared Utilities

The following utilities are available globally via `window.SZ` and are used by `/party`, `/hotels`, `/compass`, `/sites`, and `/syofficial`:
- CSV: `window.SZ.csv` (from `/components/utils-csv.js`)
- HTTP with retry: `window.SZ.http` (from `/components/utils-http.js`)
- TTL cache: `window.SZ.cache` (from `/components/utils-cache.js`)
- Offline banner + background retry: `window.SZ.offline` (from `/components/utils-offline.js`)

## Subpage Documentation

- `startpage.md` — Root landing page (`/index.html`)
- `components.md` — Reusable components
- `syofficial.md` — Official accounts directory
- `syid.md` — Visual identity resources
- `party.md` — Political organizations directory
- `hotels.md` — Hotels directory
- `compass.md` — Political compass test
- `board.md` — GitHub issues board viewer
- `bingo.md` — Moussa Alomar Bingo
- `game.md` — Multiplayer platformer prototype
- `sites.md` — Syrian websites page
- `stats.md` — Stats landing
- `legacytierlist.md` — Legacy static tierlist page (renamed from `/tierlist`)
- `poll.md` — Next.js tierlist app (basePath, rewrites, static copy)
- `flag-replacer.md` — Flag Replacer extension
- `server.md` — Production routing (Cloudflare → Apache → Coolify → Next.js)
- `scripts.md` — Utility scripts (Octokit board generator)

## Conventions

- All HTML/JS use absolute paths from the project root (e.g., `/components/navbar.js`).
- Client-side data is loaded from Google Sheets CSV exports with localStorage caching.
- i18n is implemented per-app where applicable (e.g., `syofficial`).

See `REFACTOR_IDEAS.md` for optimization and refactoring suggestions.
