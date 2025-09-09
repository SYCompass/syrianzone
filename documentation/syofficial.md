# SyOfficial (`/syofficial`)

Official Syrian accounts directory with categories, search/filter, toggleable grid/table view, and multi-language support.

## Main Files
- `index.html` — Page layout, category sections, table view container, language switcher, and controls.
- `script.js` — Fetches CSV from Google Sheets, parses to structured data, renders grid and table views, filters/search, and i18n updates.
- `i18n.js` — Loads translation JSON files (`/syofficial/languages/*.json`), sets `currentLanguage`, updates DOM via `data-i18n`.
- Assets under `/syofficial/images` and category folders.

## Data Flow
- Uses shared utilities (`window.SZ`):
  - HTTP fetch: `SZ.http.fetchWithRetry(CSV_URL, { retries })`
  - CSV parsing: `SZ.csv.parseCSVToObjects(text)`
  - TTL cache: `SZ.cache.createCache('syofficial').get/set('data', structuredData, ttl)`
  - Offline retry/banner: `SZ.offline.runWithOfflineRetry(loader, { onError })`
- Transforms rows to per-category arrays and caches the structured result.

## Core Functions
- `convertCSVToStructuredData` — Normalizes each row, collects social links from multiple columns into `item.socials`.
- `populateAllGrids`/`populateGrid` — Renders category grids with lazy-loaded images and social icons.
- `populateTable` — Sectioned table view with the same data, with social links per-row.
- `filterAndSearch` — Client-side filtering by category and name in both grid and table modes.
- Language:
  - `setupLanguageSwitcher`, `updatePageLanguage` — Toggle language, re-render content, and update all `[data-i18n]` texts.
  - `i18n.js` → `loadTranslations(lang)`, `initTranslations()`, `switchLanguage(lang)`, `updatePageLanguage()` and direction/`lang` attributes.

## UI Controls
- Filter buttons per category, active-state styling, and search box.
- View toggle button switches between grid and table and re-renders localized content accordingly.
- Back-to-top button managed in `script.js`.

## Notes
- Absolute paths used for all assets and scripts.
- Missing images fall back to a placeholder.
- Social icons use Font Awesome with accessible titles.
