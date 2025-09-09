# Syrian Websites (`/sites`)

A categorized directory of Syrian websites with search and filter by type. Data is fetched from Google Sheets CSV (with sample fallback).

## Main Files
- `index.html` — UI with hero, search bar, dynamic filter buttons, sections for categories, loading/no-results states.
- `script.js` — Fetches/parse CSV, groups by type, renders icon grids per type, and provides filtering/search.
- `style.css` — Local styles.

## Data Flow
- Uses shared utilities (`window.SZ`):
  - HTTP fetch: `SZ.http.fetchWithRetry(CSV_URL, { retries })`
  - CSV parsing: `SZ.csv.parseCSVToObjects(text)`
- No persistent caching; loads per visit.

## UI Behavior
- Each category (type) becomes a section with a grid of site icons.
- Icon resolution: attempts favicon via Google endpoint; falls back to a Font Awesome icon for the type.
- Search filters by name and description; filter buttons narrow by type; sections hide if no visible items.

## Key Functions
- CSV: parsing via shared utils, `convertCSVToWebsites` mapping.
- Rendering: `populateWebsitesGrid`, `createWebsiteIcon`, `getTypeDisplayName`, `getTypeOrder`.
- Controls: `generateFilterButtons`, `setupFilterButtonEvents`, `filterAndSearch`.

## Notes
- Absolute script/component paths; uses shared `nav-bar`.
