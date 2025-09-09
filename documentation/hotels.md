# Hotels Directory (`/hotels`)

A directory of Syrian hotels with search, filters, sort, and two views (table and grid). Data is pulled from a Google Sheets CSV (or sample fallback).

## Main Files
- `index.html` — Layout with hero, search/filters, view toggle (table/grid), results, and footer.
- `script.js` — Application class implementing fetch/parse/cache, filtering, sorting, pagination, view switching, and rendering.
- `config.js` — Defines CSV URL, caching, app settings, social platforms, and column mappings.

## Data Flow
- Uses shared utilities (`window.SZ`):
  - HTTP fetch: `SZ.http.fetchWithRetry(CSV_URL, { retries })`
  - CSV parsing: `SZ.csv.parseCSVToObjects(text)`
  - TTL cache: `SZ.cache.createCache('hotels').get/set('hotels', data, ttl)`
  - Offline retry/banner: `SZ.offline.runWithOfflineRetry(loader, { onError })`
- If no CSV URL configured, falls back to local sample data.

## Features
- Search across hotel name, city, style, description, amenities, and location.
- Filters: city and architectural style with dynamically generated options.
- Sorting: name, city, style.
- Views: table (detailed rows) and grid (cards with badges and optional map embeds).
- Contact info: phone(s), websites; social links (Instagram/Facebook/X) rendered as text buttons.
- Back-to-top and responsive behaviors; remembers active view during the session.

## Key Functions
- CSV: parsing via shared utils, `processData` for normalization.
- UI: `displayHotels`, `displayHotelsTable`, `displayHotelsGrid`, `createHotelTableRow`, `createHotelCard`.
- Controls: `handleSearch`, `applyFilters`, `applySorting`, `loadMore`, `clearSearch`, `clearFilters`, `clearAllFilters`, `switchView`, `initializeView`.
- Caching: via shared TTL cache helpers.

## Notes
- Absolute asset/script paths are used.
- `CONFIG.FEATURES.ENABLE_MAP_EMBEDS` gates map embeds.
