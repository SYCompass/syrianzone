# Political Organizations Directory (`/party`)

A directory of Syrian political organizations with search, filters, pagination, and social/contact links. Data is pulled from a Google Sheets CSV.

## Main Files
- `index.html` — Layout with hero, search/filter controls, results grid, status messages, and footer.
- `config.js` — App configuration: CSV URL, caching, columns mapping, feature flags, and social platform base URLs.
- `script.js` — Application class implementing fetching, parsing, caching, filtering, sorting, pagination, rendering, and interactions.

## Data Flow
- Uses shared utilities (`window.SZ`):
  - HTTP fetch: `SZ.http.fetchWithRetry(CSV_URL, { retries })`
  - CSV parsing: `SZ.csv.parseCSVToObjects(text)`
  - TTL cache: `SZ.cache.createCache('party').get/set('organizations', data, ttl)`
  - Offline retry/banner: `SZ.offline.runWithOfflineRetry(loader, { onError })`
- After fetch: `processData()` → `this.organizations`.

## Core Features
- Search across many columns (name, type, country, city, description, leanings, contacts, language, website, socials).
- Filters: type, country, city, language; dynamic options from dataset.
- Sorting by name, type, country, city.
- Pagination with “Load more” and results count summary.
- Cards with badges (type + leanings), location, MVP members, website/manifesto/email/phone, language, and social links.
- Back-to-top button; keyboard nav (Esc clears search when focused).

## Key Functions
- CSV: `parseCSVRow`, `parseCSV` (now via shared utils), `processData`.
- UI: `displayOrganizations`, `createOrganizationCard`, `populateFilter`, `updateResultsCount`.
- Controls: `handleSearch`, `applyFilters`, `applySorting`, `loadMore`, `clearSearch`, `clearFilters`, `clearAllFilters`.
- Caching: `cacheData`, `getCachedData` (now via shared TTL cache).

## Notes
- Absolute paths respected for assets and scripts.
- Social base URLs are empty in config; consider filling to generate full URLs.
