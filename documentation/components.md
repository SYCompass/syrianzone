# Components

Reusable components and helpers used across subpages.

## `/components/navbar.js`
Custom element `nav-bar` that renders a responsive navigation bar with active link highlighting and a mobile menu.
- `connectedCallback` → `render` + `addEventListeners` + `highlightActivePage`.
- `highlightActivePage()` compares `window.location.pathname` to each item `href` and sets `.active`.
- Mobile menu toggled by `.menu-button`; CSS scoped in shadow DOM.
- All links use absolute paths like `/syofficial`, `/syid`, `/party`, `/tierlist`, `/compass`, `/sites`.

## `/components/markdown-renderer.js`
Lightweight markdown-to-HTML renderer used to inject README content onto a page element with id `readme-content`.
- Performs simple regex-based replacements for headers, bold/italic, links, code blocks, and lists.
- Intended for basic formatting only.

## `/components/wallpaper-item.js`
Custom element rendering a wallpaper card with title, image, and optional download links.
- Observed attributes: `title`, `image-src`, `download-png`, `download-svg`, `download-jpg`, `designer-name`, `designer-link`.
- Generates a styled card with lazy-friendly markup and download buttons when URLs are present.

## Shared Utilities (window.SZ)
Utilities available globally via `window.SZ` and imported as scripts in pages.
- `/components/utils-csv.js` → `window.SZ.csv`
  - `parseCSVLine(line, delim)`, `parseCSV(text, delim)`, `parseCSVToObjects(text, { delimiter, trimHeaders })`, `detectRedirectHTML(text)`
- `/components/utils-http.js` → `window.SZ.http`
  - `fetchWithRetry(url, { retries, backoffMs, factor, timeoutMs, acceptTypes, method, headers, body })`
- `/components/utils-cache.js` → `window.SZ.cache`
  - `createCache(namespace)` → `{ set(key, value, ttlMs), get(key), remove(key), clearAll() }`
- `/components/utils-offline.js` → `window.SZ.offline`
  - `runWithOfflineRetry(loader, { retries, backoffMs, factor, onSuccess, onError })`, `showBanner()`, `hideBanner()`

These are used by `/party`, `/hotels`, `/compass`, `/sites`, and `/syofficial` to centralize CSV parsing, HTTP retries, TTL caching, and offline handling.
