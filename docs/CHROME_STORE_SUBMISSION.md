# Chrome Web Store — Complete Submission Guide

**Account:** `a.mohamed.salah.hashem@gmail.com`
**Package:** `dist/bidi-fixer-chrome-1.2.0.zip`
**Dashboard:** https://chrome.google.com/webstore/devconsole/

Every field the store validator asked for, with copy-paste ready content.

---

## Step 0 — Account setup (one-time)

### Contact email
1. Dashboard → **Account** tab.
2. Set **Contact email** to `a.mohamed.salah.hashem@gmail.com`.
3. Click **Verify** → open the verification email Google sends → click the link.
4. Wait for "Verified" badge.

### Developer fee
If you haven't paid the one-time $5 developer registration yet, Google will prompt you at submission time.

---

## Step 1 — Upload the package

1. Dashboard → **Items** → **+ New item**.
2. Upload `dist/bidi-fixer-chrome-1.2.0.zip`.
3. After the upload finishes you land on the item edit page. Work through the tabs left to right.

---

## Step 2 — "Package" tab

Nothing to fill in here. Just confirm v1.2.0 is recognised.

---

## Step 3 — "Store listing" tab

### Title
```
Bidi Fixer - Arabic/English Text
```

### Summary (short description, 132 char max)
```
Auto-fix mixed Arabic, Hebrew, Persian + English text rendering on any website. Numbers stay LTR, Arabic stays RTL, always readable.
```
(130 characters.)

### Category
**Productivity**

### Language
**English**

### Detailed description (paste as-is)

```
Bidi Fixer repairs one of the most common readability problems on the web: mixed Arabic, Hebrew, or Persian (RTL) text tangled with English names, URLs, and digits (LTR). On sites that do not declare "dir" correctly, product names reverse, timestamps flip, and paragraphs jump around. Bidi Fixer fixes that — automatically, on every website, with zero configuration.

WHAT IT DOES
• Scans each page for elements carrying Arabic, Hebrew, or Persian/Urdu text
• Applies dir="auto" and unicode-bidi: plaintext so mixed runs segment correctly
• Keeps Latin words, numbers, and URLs in their natural LTR order inside RTL sentences
• Handles single-page apps and dynamically-loaded content via a MutationObserver
• Fully reversible — turn it off and the original rendering returns

THREE MODES
• Auto (recommended) — detect the right direction per element
• Force RTL — for sites that mis-declared their content as LTR
• Force LTR — for over-aggressive RTL stylesheets

POWER FEATURES
• Per-site overrides (enable/disable + mode)
• Right-click menu: "Fix this element", "Ignore this element", "Toggle on this site"
• Optional Arabic text normalization (tatweel removal, Alef unification)
• Optional digit conversion (Arabic-Indic to Western, and back)
• Keyboard shortcuts: Alt+Shift+B toggle, Alt+Shift+M cycle mode
• Full options page with JSON import/export of settings
• Localized UI in 11 languages: English, Arabic, French, Spanish, German, Turkish, Persian, Hebrew, Urdu, Chinese (Simplified), and Russian
• Auto light/dark theme

PRIVACY
Bidi Fixer makes zero network requests. No analytics, no tracking, no data collection. Your preferences stay on your device (or sync via your own Chrome account if enabled). 100% open source, MIT licensed, at github.com/BNhashem16/bidi-fixer.

PERFORMANCE
Built on a single MutationObserver batched through requestIdleCallback. Typical per-page cost is a few milliseconds even on large DOMs. No external libraries, no background polling.

WHO IS IT FOR?
• Arabic, Hebrew, Persian, and Urdu readers browsing content that mixes scripts
• Web developers testing RTL behavior without editing site CSS
• Anyone annoyed by reversed product names inside Arabic sentences
```

---

## Step 4 — "Graphic assets"

### Store icon — 128×128 (REQUIRED)
Upload: `icons/icon128.png`

### Screenshots — at least one required, up to five, 1280×800 (REQUIRED)
Upload all four — Chrome shows them as a carousel:
1. `docs/images/popup-dark.png`
2. `docs/images/popup-light.png`
3. `docs/images/options.png`
4. `docs/images/hero.png` (before/after comparison)

### Small promo tile — 440×280 (optional but recommended)
Upload: `docs/images/store-small-tile.png`

### Marquee promo tile — 1400×560 (optional, for Chrome Web Store "featured" slot)
Upload: `docs/images/store-marquee.png`

---

## Step 5 — "Privacy practices" tab

### Single purpose (REQUIRED)
```
Fix the rendering of bidirectional text (Arabic, Hebrew, Persian, Urdu mixed with English) on web pages by applying HTML dir attributes and CSS unicode-bidi rules so mixed-direction content reads correctly.
```

### Permission justifications (one per permission)

**activeTab**
```
Used by the popup's "Rescan" button to re-apply bidi fixes on the currently visible tab on demand, and by the keyboard shortcut to toggle the fix for the active page. No content is read from the tab beyond what is strictly needed to detect RTL characters.
```

**contextMenus**
```
Adds three right-click menu items: "Fix this element", "Ignore this element", and "Toggle on this site". They let the user apply or undo the bidi fix to a specific DOM element, or disable the extension for the current domain, without opening the popup.
```

**host permission (<all_urls>)**
```
Mixed-direction text rendering problems appear on every kind of website (news, social media, shopping, documentation, dashboards), so the content script must run on all URLs to be useful. The extension only reads text content to detect Arabic, Hebrew, or Persian characters and applies directional HTML/CSS attributes locally. No page content is transmitted or stored anywhere.
```

**scripting**
```
Required by Manifest V3 for the content script that scans each page's DOM and applies the bidi fix. It is not used to execute remote code — all scripts are bundled inside the extension package.
```

**storage**
```
Saves the user's preferences (enabled/disabled, direction mode, per-site overrides, optional text transforms) in chrome.storage.sync. This lets the user's settings persist across browser restarts and sync across their own devices via Google's standard sync infrastructure.
```

**tabs**
```
When the user changes a setting in the popup or options page, the service worker broadcasts the new state to every open tab so the fix updates live without a page reload. It is also used to read the active tab's URL hostname so per-site overrides can be resolved. No tab content or history is collected.
```

### Remote code use (REQUIRED answer)

Select: **"No, I am not using remote code"**

Justification (paste into the text area):
```
Bidi Fixer does not load or execute any code from remote servers. All JavaScript, CSS, and HTML are bundled inside the extension package. The extension makes zero network requests and has no dependency on external scripts, CDNs, or eval-like mechanisms.
```

### Data usage certification (REQUIRED checkboxes)

Tick: **"I certify that the data usage disclosures above are accurate."**
Tick: **"I certify that this extension complies with the Developer Program Policies."**

Data collected: **None** — tick nothing under the "What user data does your extension collect" checklist.

Data transmission: **None** — leave all "Is this data transmitted" boxes as No.

### Privacy policy URL
```
https://github.com/BNhashem16/bidi-fixer/blob/main/PRIVACY.md
```

---

## Step 6 — "Distribution" tab

### Visibility
**Public**

### Regions
**All regions** (unless you want to restrict).

### Pricing
**Free**

---

## Step 7 — Submit for review

1. Click **Submit for review** (top right).
2. Google review typically takes **1–3 business days** for new publishers, sometimes longer on first submissions.
3. You will receive an email at `a.mohamed.salah.hashem@gmail.com` when the item is approved or if the reviewer requests changes.

---

## Troubleshooting the errors you saw

| Error | Fix |
|-------|-----|
| "justification for activeTab is required" | Paste the **activeTab** block above into Privacy practices → Permission justifications. |
| "justification for contextMenus is required" | Paste the **contextMenus** block. |
| "justification for host permission use is required" | Paste the **host permission** block. |
| "justification for remote code use is required" | Select **"No, I am not using remote code"** and paste the remote code block. |
| "justification for scripting is required" | Paste the **scripting** block. |
| "justification for storage is required" | Paste the **storage** block. |
| "justification for tabs is required" | Paste the **tabs** block. |
| "At least one screenshot or video is required" | Upload `docs/images/popup-dark.png` (1280×800). |
| "Icon image is missing" | Upload `icons/icon128.png`. |
| "Please select a Category" | **Productivity**. |
| "The detailed description is too short" | Paste the long description block above (>1500 chars). |
| "The single purpose description is required" | Paste the single purpose block above. |
| "data usage complies with our Developer Program Policies" | Tick the two certification checkboxes in Privacy practices. |
| "provide a contact email" | Account tab → set and verify `a.mohamed.salah.hashem@gmail.com`. |
| "verify your contact email" | Open Google's verification email, click the link. |

---

## After approval

- Add the Chrome Web Store badge to `README.md`:
  ```markdown
  [![Chrome Web Store](https://img.shields.io/chrome-web-store/v/<YOUR_EXT_ID>?color=4bb5ff&label=Chrome%20Web%20Store)](https://chrome.google.com/webstore/detail/<YOUR_EXT_ID>)
  ```
  Replace `<YOUR_EXT_ID>` with the 32-character ID Google assigns after approval.
- Consider also submitting the Firefox build to [addons.mozilla.org](https://addons.mozilla.org/developers/) — it's free, and the manifest is already at `manifest.firefox.json`.
