# Political Compass (`/compass`)

An interactive political compass tailored to Syrian contexts with six axes, animated results, and shareable images. Questions are loaded from a CSV (Google Sheets or local fallback).

## Main Files
- `index.html` — Page UI for intro, question flow, results with six scales, modal for per-category breakdown, and footer.
- `app.js` — All logic: configuration, CSV loading/caching, question flow, scoring, results rendering, canvas export, GSAP animations, back-to-top, previous results storage, scales loading, and enhanced sharing.
- `style.css` — Styling for scales, buttons, markers, RTL corrections, and modal scrollbars.
- `questions.csv` — Local questions fallback.
- `scales.json` — Externalized definition of the six scales (id, name, left, right).

## Data Flow
- Uses shared utilities (`window.SZ`):
  - HTTP fetch: `SZ.http.fetchWithRetry(CSV_URL, { retries })` and for local `/compass/questions.csv` and `/compass/scales.json`
  - CSV parsing: `SZ.csv.parseCSVToObjects(text)`
  - (Optional) localStorage caching remains app-controlled
- Scales are fetched from `scales.json` on load with defaults as fallback.

## Core Features
- Six scales: loaded from `scales.json`; click each to open a modal listing contributing questions and the strength/direction of effects.
- Question navigation with +2..-2 responses; keyboard 1..5 shortcuts.
- Results: percentages and ratings per scale; animated markers and fills via GSAP; canvas export.
- Enhanced sharing: PNG (1200px) and JPEG (1200/800/600) generation; simple share dialog with download buttons and copy-to-clipboard (JPEG 800) fallback when Web Share API is unavailable.
- Previous results list stored in localStorage with date/time; can reload to re-animate results.

## Key Functions
- Data: shared fetch+CSV parsing, processing to normalized questions, scales loading from JSON, caching utilities.
- Flow: `startTest`, `showQuestion`, `selectAnswer`, `showPreviousQuestion`, `handleNextButtonClick`.
- Scoring: `calculateResults` (normalized -1..1 per scale), `getRating` (text bucket), `updateResultsVisuals`, `animateResultScales`.
- Export & Share: `createResultsCanvas`, `shareResults` (PNG+JPEG sizes), `scaleCanvasDataURL`, share dialog with copy-to-clipboard.
- UX: `initializeBackToTop`, previous results loader.

## Notes
- Absolute asset/script paths; GSAP and TextPlugin loaded from CDN.
- RTL-friendly UI and Arabic texts; extendable to more languages if needed.
