# Poll (Next.js Tierlist App) (`/poll`)

A Next.js app that powers the dynamic tierlist experience, proxied under `/tierlist` by the root `server.js`.

## Key Areas
- `/poll/app` — App Router pages (`page.tsx`, leaderboard, API routes under `/app/api/*`).
- `/poll/components` — UI components (navbar, charts, theme provider, etc.).
- `/poll/db` and `/poll/drizzle` — Database schema and migrations using Drizzle ORM.
- `/poll/server` — Realtime and tRPC server-side logic.
- `/poll/public` — Static assets used by the app.
- `/poll/lib` — Utilities (hash, rate limiting, turnstile, export image, etc.).
- `/poll/scripts` — Maintenance scripts (apply-sql, copy assets, seeding helpers).

## Runtime Integration
- The root Express server proxies `/tierlist` and `/api` to the Next.js app on `NEXT_PORT` with WebSocket upgrades supported.
- Ensure `basePath` is configured (see `/poll/next.config.ts`) to match `/tierlist` for correctness behind the proxy.

## Notes
- Use `pnpm` (lockfile present) for dependency management.
- Be mindful of asset paths when generating image exports; they must work under `/tierlist` basePath.
