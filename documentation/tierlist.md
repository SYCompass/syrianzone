# Legacy Tierlist (`/legacytierlist`)

Legacy static assets and page for a minister tierlist. This has been superseded by the Next.js app in `/poll`, which is proxied under `/tierlist` by `server.js`.

## Directory
- `/legacytierlist/index.html`, `style.css`, `script.js`, `images/`.
- Static images for ministers and UI assets.

## Server Integration
- `server.js` proxies `/tierlist` to the Next.js app on `NEXT_PORT`. The legacy static `/legacytierlist` directory remains for archival/reference.

## Notes
- Ensure consistency between legacy assets and the Next.js app’s content if both are referenced.
