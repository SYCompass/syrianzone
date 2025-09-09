# Board (`/board`)

Displays GitHub issues grouped into columns (To do, In Progress, Done). Clicking a card opens a modal with the issue body rendered as Markdown.

## Main Files
- `index.html` — Layout for three columns, modal container, styles.
- `app.js` — Uses Octokit to fetch issues from `SYCompass/syrianzone`, groups by labels, builds cards, and renders a modal using `marked`.
- `styles.css` — Styles for columns and cards with colored borders.

## Data Flow
- Client-side fetch via Octokit REST: `issues.listForRepo({ owner, repo, state: 'all' })`.
- Label mapping uses `label.description` to classify issues as `todo`, `in_progress`, or `done`.

## Core Functions
- `createCard(issueData, status)` — Builds a card with labels, assignee (avatar/name), and Arabic-formatted dates.
- `showCardDetails(title, content)` — Renders body Markdown in a modal using `marked`.
- `loadBoard()` — Fetch issues, build category arrays, and populate columns; shows friendly empty states and errors.

## Notes
- No auth token used in client; subject to GitHub rate limits.
- Absolute paths for components and CSS.
