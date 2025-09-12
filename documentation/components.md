# Components

Reusable components and helpers used across subpages.

## `/components/navbar.js`
Custom element `nav-bar` that renders a responsive navigation bar with active link highlighting and a mobile menu.
- `connectedCallback` → `render` + `addEventListeners` + `highlightActivePage`.
- `highlightActivePage()` compares `window.location.pathname` to each item `href` and sets `.active`.
- Mobile menu toggled by `.menu-button`; CSS scoped in shadow DOM.
- All links use absolute paths like `/syofficial`, `/syid`, `/party`, `/tierlist`, `/compass`, `/sites`.
- Includes an optional theme toggle button that calls `window.SZ.theme.cycle()` when available.

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
- `/components/utils-theme.js` → `window.SZ.theme`
  - Methods: `init()`, `get()`, `set(theme)`, `apply(theme)`, `cycle()`, and `themes` list.
  - Storage: saves to `localStorage['sz-theme']` and mirrors `startpage-settings.theme` for backward compatibility.
  - Apply: sets `data-theme` on `documentElement`, driving `/styles/theme.css` variables.

Include in pages (before other CSS for minimal FOUC):

```html
<script>(function(){try{var s=localStorage.getItem('sz-theme');if(!s){var sp=localStorage.getItem('startpage-settings');if(sp){s=(JSON.parse(sp)||{}).theme}};document.documentElement.setAttribute('data-theme', s||'dark');}catch(e){}})();</script>
<link rel="stylesheet" href="/styles/theme.css">
<script src="/components/utils-theme.js" defer></script>
```

These are used by `/party`, `/hotels`, `/compass`, `/sites`, and `/syofficial` to centralize CSV parsing, HTTP retries, TTL caching, and offline handling.
