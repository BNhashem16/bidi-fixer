# Contributing to Bidi Fixer

Thanks for your interest — contributions of all sizes are welcome.

## Development setup

1. Clone the repo:
   ```bash
   git clone https://github.com/BNhashem16/bidi-fixer.git
   cd bidi-fixer
   ```
2. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select the project folder.
3. After editing files, hit the reload button on the extension card in `chrome://extensions`. For content script changes you'll also need to reload the target web page.

There is no build step — the extension ships as plain HTML/CSS/JS so it runs directly.

## Project layout

| Path | Purpose |
|------|---------|
| `manifest.json` | MV3 manifest (host permissions, commands, options page, context menus). |
| `content.js` | DOM walker, bidi fix application, MutationObserver, text transforms. |
| `styles.css` | Injected stylesheet (`unicode-bidi: plaintext` + debug outline). |
| `background.js` | Service worker — storage, per-site resolution, context menu, badge, shortcuts. |
| `popup.*` | Toolbar popup UI. |
| `options.*` | Full-page settings UI. |
| `_locales/<lang>/messages.json` | Translations (add a language by creating a new folder). |
| `icons/` | PNG icons + `generate.ps1` regenerator. |

## Adding a translation

1. Copy `_locales/en/messages.json` into a new folder, e.g. `_locales/fr/`.
2. Translate the `message` values — leave the keys alone.
3. Reload the extension. Chrome picks the closest locale automatically.
4. Open a PR with the new folder.

## Guidelines

- **Keep it reversible.** Any DOM change the extension makes must be undone cleanly when the user disables it.
- **Respect authors.** Elements that already carry a `dir` attribute should never be overridden unless the user explicitly forces a mode.
- **Stay fast.** Don't add synchronous DOM walks. New scanning work must go through `schedule()` / `requestIdleCallback`.
- **No dependencies.** The extension is dependency-free. Keep it that way unless there's a very strong reason.
- **Small files.** Aim for <400 lines per file, <800 hard cap.

## Commit style

Conventional Commits format:

```
feat: add Kurdish locale
fix: skip iframes without srcdoc
refactor: extract digit conversion into its own module
```

## Reporting issues

Please include:

- Chrome version
- Site URL (if not sensitive) or a minimal reproduction
- Screenshot of the broken vs. fixed rendering
- Extension version (visible in the options page footer)

## Code of conduct

Be kind. Assume good intent. Report unacceptable behaviour to the maintainer.
