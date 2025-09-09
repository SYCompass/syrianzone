# Scripts

## Root: `list-projects-for-repo.mjs`
Fetches issues from GitHub for `SYCompass/syrianzone`, groups them by labels (`todo`, `in_progress`, `done`) into a `board` object, and writes `board/board.json`.
- Uses `Octokit` with an optional `GITHUB_TOKEN`.
- Normalizes labels by removing board-specific ones from the `issue.labels` array in the output while using `label.description` for categorization.

## `/poll/scripts`
- `apply-sql.ts`, `check-candidates-columns.ts`, `copy-assets.ts`, `get-today.ts`, `list-candidates.ts`, `seed.ts` — Operational scripts for the Next.js tierlist app (database migrations, seeding, and utilities).
