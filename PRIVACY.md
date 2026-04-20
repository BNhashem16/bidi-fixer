# Privacy Policy — Bidi Fixer

_Last updated: 2026-04-20_

Bidi Fixer is designed with privacy as a core principle.

## What the extension does

Bidi Fixer runs entirely in your browser. It inspects the text content of web pages you visit to detect Arabic, Hebrew, or Persian/Urdu characters, and then applies HTML `dir` attributes and CSS `unicode-bidi` rules so mixed-direction text renders correctly.

## What data is collected

**None.**

- No personal data is collected.
- No browsing history is recorded.
- No analytics, telemetry, or crash reports are sent anywhere.
- No cookies, fingerprints, or identifiers are created.

## What data is stored

The extension stores your preferences — globally (enabled, mode, script toggles, transform toggles) and per site (override enabled/mode) — in `chrome.storage.sync`. If you are signed into Chrome with sync enabled, these settings sync across your own devices via Google's sync infrastructure. They are never transmitted to the extension author.

You can export or wipe all settings at any time from the Options page.

## What data is transmitted

**None.** The extension makes no network requests. It does not talk to any server owned by the author or by any third party.

## Permissions

| Permission | Why |
|------------|-----|
| `storage` | Save your preferences. |
| `activeTab` | Let the popup rescan the current tab on demand. |
| `scripting` | Required by Manifest V3 to inject the content script. |
| `tabs` | Broadcast setting changes to all open tabs so they take effect live. |
| `contextMenus` | Show the right-click "Fix / Ignore / Toggle" options. |
| `host_permissions: <all_urls>` | The extension works on every site, because mixed-direction text shows up everywhere. It does **not** read page content beyond what is strictly needed to detect RTL characters, and it does not send that content anywhere. |

## Source code

The extension is open source under the MIT license. You can audit every line at https://github.com/BNhashem16/bidi-fixer.

## Contact

Questions: open an issue at https://github.com/BNhashem16/bidi-fixer/issues.
