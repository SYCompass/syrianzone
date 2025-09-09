# Syrian Visual Identity (`/syid`)

Public resources related to the Syrian visual identity: color palettes, flag proportions, downloadable assets, and helpful links.

## Main Files
- `index.html` — Page with sections: Colors, Typography, Flag proportions (with annotated diagram), Materials; uses `nav-bar` and `wallpaper-item` components.
- `script.js` — Clipboard copy notifications and back-to-top functionality; binds click on color swatches via `[data-hex]` to copy color codes.
- `style.css` — Local styles for visuals.
- `materials/` — Official assets (SVG, PNG, DWG) and previews.

## Features
- Color palette tiles with click-to-copy hex codes and notification.
- Flag proportions: detailed diagram with numeric guides; downloads for PNG/SVG/DWG.
- Materials: links to official media/press page and in-repo previews (e.g., `logo.ai.svg`).
- Back-to-top visibility toggle on scroll.

## Key Functions
- `copyToClipboard(text)` → Uses Clipboard API with fallback to `execCommand`.
- `showNotification(message, type)` → Displays a temporary notification banner; themed by success/ error.
- `initializeNavigation()` → Sets up back-to-top behavior.

## Notes
- Absolute asset paths for images and downloads (e.g., `/syid/materials/...`).
- All text is Arabic-first with right-to-left layout.
