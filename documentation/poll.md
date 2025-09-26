# Poll (Next.js Tierlist App) (`/poll`)

A Next.js app that powers the dynamic tierlist experience served under `/tierlist` in production

## Key Areas
- `/poll/app` — App Router pages (`page.tsx`, leaderboard, API routes under `/app/api/*`).
- `/poll/components` — UI components (navbar, charts, theme provider, etc.).
- `/poll/db` and `/poll/drizzle` — Database schema and migrations using Drizzle ORM.
- `/poll/server` — Realtime and tRPC server-side logic.
- `/poll/public` — Static assets used by the app.
- `/poll/lib` — Utilities (hash, rate limiting, turnstile, export image, etc.).
- `/poll/scripts` — Maintenance scripts (apply-sql, copy assets, seeding helpers).

## Runtime Integration
- Apache forwards all traffic to the container (single catch‑all). No dedicated `/tierlist` rule is required.
- `next.config.ts` sets `assetPrefix` and rewrites so the app works under `/tierlist`:
  - `/tierlist/_next/*` → `/_next/*`
  - `/tierlist/assets/*` → `/assets/*`
  - `/tierlist/images/*` → `/images/*`
  - `/tierlist/api/*` → `/api/*`
- The root `/` is served from `public/index.html` via a rewrite.

## Static subapps
- During build/start, `poll/scripts/link-static.mjs` copies sibling folders (`/bingo`, `/house`, `/syofficial`, etc.) into `poll/public`. This ensures they are available inside the container under `/`.

## Notes
- Use `pnpm` (lockfile present) for dependency management.
- Be mindful of asset paths when generating image exports; they must work under `/tierlist` basePath.
