# Chrome Web Store Listing

Copy-paste ready content for the Chrome Web Store submission form at
https://chrome.google.com/webstore/devconsole/

---

## Short description (132 chars max)

> Auto-fix mixed Arabic, Hebrew, Persian + English text rendering on any website. Keep numbers in LTR, Arabic in RTL, always readable.

## Category

**Productivity** (primary) — alternatively "Accessibility".

## Language

**English** (primary). Arabic and other locales are bundled.

---

## Detailed description

Bidi Fixer repairs one of the most common readability problems on the web: mixed Arabic / Hebrew / Persian (RTL) text tangled with English names, URLs, and digits (LTR). On sites that don't declare `dir` correctly, product names reverse, timestamps flip, and paragraphs jump around. Bidi Fixer fixes that — automatically, on every website, with zero configuration.

**What it does**
• Scans each page for elements carrying Arabic, Hebrew, or Persian/Urdu text
• Applies `dir="auto"` and `unicode-bidi: plaintext` so mixed runs segment correctly
• Keeps Latin words, numbers, and URLs in their natural LTR order inside RTL sentences
• Handles SPAs and dynamically-loaded content via a MutationObserver
• Fully reversible — turn it off and the original page rendering returns

**Three modes**
• Auto (recommended) — detect the right direction per element
• Force RTL — for sites that mis-declared their content as LTR
• Force LTR — for over-aggressive RTL stylesheets

**Power features**
• Per-site overrides (enable/disable + mode)
• Right-click menu: "Fix this element", "Ignore this element", "Toggle on this site"
• Optional Arabic text normalization (tatweel removal, Alef unification)
• Optional digit conversion (٠١٢٣ ↔ 0123)
• Keyboard shortcuts: Alt+Shift+B (toggle), Alt+Shift+M (cycle mode)
• Full options page with JSON import/export of settings
• Localized UI in English and Arabic
• Auto light/dark theme

**Privacy**
Bidi Fixer makes zero network requests. No analytics, no tracking, no data collection. Your preferences stay on your device (or sync via your own Chrome account if enabled). 100% open source — MIT licensed — at github.com/BNhashem16/bidi-fixer.

**Performance**
Built on a single MutationObserver batched through `requestIdleCallback`. Typical per-page cost is a few milliseconds even on large DOMs. No external libraries, no background polling.

**Who is it for?**
• Arabic, Hebrew, Persian, and Urdu readers browsing content that mixes scripts
• Web developers testing RTL behavior without editing site CSS
• Anyone annoyed by reversed product names inside Arabic sentences

---

## Permissions justification (for review)

• **storage** — Save your direction preferences and per-site overrides locally.
• **activeTab** — Allow the popup "Rescan" button to re-apply fixes on the current tab.
• **scripting** — Required by MV3 for content scripts.
• **tabs** — When you change settings, push the change to every open tab so the fix updates live without a reload.
• **contextMenus** — Show "Fix this element / Ignore / Toggle on this site" on right-click.
• **host_permissions `<all_urls>`** — Mixed-direction text appears on every kind of site (news, social, shopping, docs). The extension only reads text content to detect Arabic/Hebrew/Persian characters and does not send any of it anywhere.

## Single-purpose justification

Fix the rendering of bidirectional text on web pages.

## Data usage disclosures

- Website content: **Accessed, not transmitted.** Needed to detect RTL characters.
- User activity: **Not collected.**
- Authentication info, personally identifiable info, health, financial, location, web history, communications: **Not collected.**

## Assets to upload

| Slot | Size | File |
|------|------|------|
| Small tile | 440 × 280 | `docs/images/store-small-tile.png` |
| Marquee | 1400 × 560 | `docs/images/store-marquee.png` |
| Screenshot 1 (popup, dark) | 1280 × 800 recommended; 720 × 600 provided | `docs/images/popup-dark.png` |
| Screenshot 2 (popup, light) | same | `docs/images/popup-light.png` |
| Screenshot 3 (before/after) | 1280 × 800 | `docs/images/hero.png` |
| Icon 128×128 | 128 × 128 | `icons/icon128.png` |

_Note: the 440×280 and 1400×560 sizes match the Web Store exactly. Chrome will accept the popup screenshots at any 16:10 aspect ratio between 640×400 and 1280×800._

## Privacy policy URL

`https://github.com/BNhashem16/bidi-fixer/blob/main/PRIVACY.md`

## Support URL

`https://github.com/BNhashem16/bidi-fixer/issues`

## Homepage URL

`https://github.com/BNhashem16/bidi-fixer`

## Pricing

Free.

---

## Submission checklist

- [ ] Register a Chrome Web Store developer account ($5 one-time).
- [ ] Run `npm run build:chrome` (or `./build.sh chrome`) to produce `dist/bidi-fixer-chrome.zip`.
- [ ] Upload the ZIP at https://chrome.google.com/webstore/devconsole/.
- [ ] Fill in the fields above.
- [ ] Upload the five images listed under _Assets to upload_.
- [ ] Paste the privacy policy URL.
- [ ] Submit for review. First reviews typically take 1–3 business days.
