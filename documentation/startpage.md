# Start Page (`/index.html`)

The root landing page provides a dashboard with weather, clock, search, and links. It relies on `/startpage/script.js` and `/startpage/languages.js`, plus the reusable `nav-bar` web component.

## Main Files
- `/index.html` — Markup, modals (About, Weather, Add Link), settings panel, and UI containers.
- `/startpage/script.js` — Implements `Startpage` class handling state, UI, translations, weather, links, and storage.
- `/startpage/languages.js` — Arabic and English UI strings for dynamic text.
- `/components/navbar.js` — Navigation component used across pages.

## Key Features and Flows
- Theme: `applyTheme`, `cycleTheme`, `setTheme`, and `updateThemeIcon` manage theme and UI icon; persisted to localStorage.
- Language/i18n: `applyLanguage`, `toggleLanguage`, `updateLanguageIcon`, `translatePage`, `translateSettingsPanel`, `translateAddLinkModal`, `updatePresetLinkTexts` use `languages` to translate all texts.
- Clock: `initClock` + `updateClock` update time/date every second; 12/24h toggle stored in settings.
- Weather: `updateWeatherDisplay` -> `fetchWeather` via a Cloudflare Worker; uses either selected governorate (`getGovernorateCoordinates`) or custom coordinates; `displayWeather` renders temperature, wind, humidity; error displays fallback.
- Search: `setupSearchEngine`, `getSearchUrl`, `handleSearchEngineChange`, `handleSearch` redirect to selected engine; custom URL supports `{query}` substitution.
- Custom Links: `loadCustomLinks`, `renderCustomLinks`, `createLinkElement`, `addCustomLink`, `removeCustomLink`, `updateCustomLinksList` manage user-defined links with favicon resolution and edit mode.
- Modals/Settings: `openSettings`, `closeSettings`, `openWeatherSettings`, `saveWeatherSettings`, `saveWeatherSettingsFromPanel`, `toggleLocationSettings`, `toggleModalLocationSettings`, add-link modal helpers, and outside-click/escape handling.
- Data Management: `exportSettings`, `importSettings`, `handleFileImport`, `resetSettings` manage settings persistence and portability.
- Donation Reminder: `checkDonationReminder`, `showDonationReminder`, `createDonationNotification`, `closeDonationNotification`, `hideDonationNotification`, `updateDonationNotificationText` implement a monthly nudge.
- Events: `setupEventListeners` wires all UI controls and keyboard shortcuts (Ctrl+K focus search, Ctrl+, open settings, Esc closes modals).

## Settings Schema (localStorage key: `startpage-settings`)
- `theme`, `language`, `searchEngine`, `customSearchUrl`
- `weather`: `locationType` ('governorate'|'coordinates'), `governorate`, `coordinates { lat, lon }`
- `clockFormat` ('12'|'24')
- `customLinks.row1` array of `{ name, url, icon }`
- `donationReminder`: `enabled`, `lastDismissed`, `currentlyShowing`, `firstShownAt`

## Notable Implementation Details
- Absolute asset paths for all scripts, styles, and images (e.g., `/startpage/script.js`).
- Favicon resolution tries Google/DuckDuckGo endpoints and site `/favicon.ico` with fallback emoji.
- Weather fetch errors are caught and replaced with a simple error message.

## Extending
- Add more preset links by updating the preset links section in `/index.html` and translating labels in `/startpage/languages.js`.
- For more themes, extend the `themes` array and CSS variables handling in the page stylesheet.
