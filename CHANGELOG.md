# Changelog

All notable changes to this project are documented here. This project follows [Semantic Versioning](https://semver.org/).

## [1.3.2] - 2026-04-22

### Changed
- Dropped the unused `scripting` permission. The content script is declared statically in the manifest, so `chrome.scripting` was never called. Removing it eliminates one permission warning at install time and improves Enhanced Safe Browsing trust.
- Removed the redundant `web_accessible_resources` entry for `styles.css`. The stylesheet is already injected via `content_scripts.css`; exposing it to page contexts was unnecessary.
- `PRIVACY.md` and `docs/STORE_LISTING.md` updated to match the new permission set.

## [1.3.0] - 2026-04-20

### Added
- **Firefox support** via `manifest.firefox.json` (MV3, `background.scripts`, `browser_specific_settings.gecko`).
- **Build scripts** `build.sh` and `build.ps1` — produce `dist/bidi-fixer-chrome-<v>.zip` and `dist/bidi-fixer-firefox-<v>.zip`.
- **Nine additional locales**: French, Spanish, German, Turkish, Persian, Hebrew, Urdu, Simplified Chinese, Russian. Total 11 bundled UI languages.
- **Screenshots and promo tiles** under `docs/images/` (popup dark/light, before/after hero, Chrome Web Store small tile + marquee). Regenerator at `docs/generate-screenshots.ps1`.
- **`PRIVACY.md`** — data-usage policy for store submission.
- **`docs/STORE_LISTING.md`** — copy-paste-ready Chrome Web Store listing content.

### Changed
- README now shows screenshots, badges, and both Chrome and Firefox install flows.
- Manifest version bumped to 1.2.0 for packaged zips (store release).

## [1.2.0] - 2026-04-20

### Added
- Multi-script detection: Arabic, Hebrew, Persian/Urdu (toggle each in Options).
- Options page with full settings, import/export as JSON, and reset.
- Right-click context menu: "Fix this element", "Ignore this element", "Toggle on this site".
- Per-site **mode** override in addition to per-site enable/disable.
- Arabic digit conversion (Eastern ↔ Western) as an opt-in transform.
- Tatweel stripping and Alef unification as opt-in normalisations.
- Second keyboard shortcut: `Alt + Shift + M` cycles Auto → RTL → LTR.
- Debug outline mode — highlights every fixed element with a dashed border.
- Stats counter in popup (fixed element count for current tab).
- Full i18n: English and Arabic UI (`_locales/en` and `_locales/ar`).
- Automatic light/dark theme for popup and options page.

### Changed
- Detection regex expanded to include Arabic Extended-B (`U+0870–U+089F`).
- Popup layout tightened; current effective mode now shown beside stats.
- Service worker rewritten to resolve per-site effective state and keep the
  toolbar badge in sync for every tab.

### Fixed
- Elements inside nested `contenteditable` regions are no longer touched.
- Disable flow correctly restores the author's original `dir` attribute.

## [1.1.0] - 2026-04-20

### Added
- Real PNG icons (16/32/48/128) with regenerator script (`icons/generate.ps1`).
- Per-site enable/disable override.
- Toolbar badge showing `off` for inactive tabs.
- Global `Alt + Shift + B` toggle shortcut.
- Rescan-current-tab button in popup.

### Fixed
- Manifest icon load error on fresh installs.

## [1.0.0] - 2026-04-19

### Added
- Initial release: MV3 extension with Auto / Force RTL / Force LTR modes.
- Content script with TreeWalker + MutationObserver + `requestIdleCallback` batching.
- `unicode-bidi: plaintext` strategy for mixed RTL/LTR runs.
- Popup UI with toggle and mode selector.
- Service worker for settings persistence and cross-tab broadcasting.
