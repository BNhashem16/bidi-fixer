# Chrome Web Store clipboard helper.
#
# Pick the field you are filling in, and this script copies the exact text
# to your clipboard. Run with:
#
#   powershell -File clipboard-helper.ps1
#
# Then paste into the Chrome Web Store form with Ctrl+V.

$blocks = [ordered]@{
    "title" = "Bidi Fixer - Arabic/English Text"

    "summary" = "Auto-fix mixed Arabic, Hebrew, Persian + English text rendering on any website. Numbers stay LTR, Arabic stays RTL, always readable."

    "description" = @"
Bidi Fixer repairs one of the most common readability problems on the web: mixed Arabic, Hebrew, or Persian (RTL) text tangled with English names, URLs, and digits (LTR). On sites that do not declare "dir" correctly, product names reverse, timestamps flip, and paragraphs jump around. Bidi Fixer fixes that -- automatically, on every website, with zero configuration.

WHAT IT DOES
- Scans each page for elements carrying Arabic, Hebrew, or Persian/Urdu text
- Applies dir="auto" and unicode-bidi: plaintext so mixed runs segment correctly
- Keeps Latin words, numbers, and URLs in their natural LTR order inside RTL sentences
- Handles single-page apps and dynamically-loaded content via a MutationObserver
- Fully reversible -- turn it off and the original rendering returns

THREE MODES
- Auto (recommended) -- detect the right direction per element
- Force RTL -- for sites that mis-declared their content as LTR
- Force LTR -- for over-aggressive RTL stylesheets

POWER FEATURES
- Per-site overrides (enable/disable + mode)
- Right-click menu: "Fix this element", "Ignore this element", "Toggle on this site"
- Optional Arabic text normalization (tatweel removal, Alef unification)
- Optional digit conversion (Arabic-Indic to Western, and back)
- Keyboard shortcuts: Alt+Shift+B toggle, Alt+Shift+M cycle mode
- Full options page with JSON import/export of settings
- Localized UI in 11 languages: English, Arabic, French, Spanish, German, Turkish, Persian, Hebrew, Urdu, Chinese (Simplified), and Russian
- Auto light/dark theme

PRIVACY
Bidi Fixer makes zero network requests. No analytics, no tracking, no data collection. Your preferences stay on your device (or sync via your own Chrome account if enabled). 100% open source, MIT licensed, at github.com/BNhashem16/bidi-fixer.

PERFORMANCE
Built on a single MutationObserver batched through requestIdleCallback. Typical per-page cost is a few milliseconds even on large DOMs. No external libraries, no background polling.

WHO IS IT FOR?
- Arabic, Hebrew, Persian, and Urdu readers browsing content that mixes scripts
- Web developers testing RTL behavior without editing site CSS
- Anyone annoyed by reversed product names inside Arabic sentences
"@

    "single-purpose" = "Fix the rendering of bidirectional text (Arabic, Hebrew, Persian, Urdu mixed with English) on web pages by applying HTML dir attributes and CSS unicode-bidi rules so mixed-direction content reads correctly."

    "perm-activeTab" = "Used by the popup's Rescan button to re-apply bidi fixes on the currently visible tab on demand, and by the keyboard shortcut to toggle the fix for the active page. No content is read from the tab beyond what is strictly needed to detect RTL characters."

    "perm-contextMenus" = "Adds three right-click menu items: Fix this element, Ignore this element, and Toggle on this site. They let the user apply or undo the bidi fix to a specific DOM element, or disable the extension for the current domain, without opening the popup."

    "perm-host" = "Mixed-direction text rendering problems appear on every kind of website (news, social media, shopping, documentation, dashboards), so the content script must run on all URLs to be useful. The extension only reads text content to detect Arabic, Hebrew, or Persian characters and applies directional HTML/CSS attributes locally. No page content is transmitted or stored anywhere."

    "perm-scripting" = "Required by Manifest V3 for the content script that scans each page's DOM and applies the bidi fix. It is not used to execute remote code -- all scripts are bundled inside the extension package."

    "perm-storage" = "Saves the user's preferences (enabled/disabled, direction mode, per-site overrides, optional text transforms) in chrome.storage.sync. This lets the user's settings persist across browser restarts and sync across their own devices via Google's standard sync infrastructure."

    "perm-tabs" = "When the user changes a setting in the popup or options page, the service worker broadcasts the new state to every open tab so the fix updates live without a page reload. It is also used to read the active tab's URL hostname so per-site overrides can be resolved. No tab content or history is collected."

    "remote-code" = "Bidi Fixer does not load or execute any code from remote servers. All JavaScript, CSS, and HTML are bundled inside the extension package. The extension makes zero network requests and has no dependency on external scripts, CDNs, or eval-like mechanisms."

    "privacy-url" = "https://github.com/BNhashem16/bidi-fixer/blob/main/PRIVACY.md"

    "support-url" = "https://github.com/BNhashem16/bidi-fixer/issues"

    "homepage-url" = "https://github.com/BNhashem16/bidi-fixer"
}

Write-Host ""
Write-Host "  Chrome Web Store - clipboard helper" -ForegroundColor Cyan
Write-Host "  =====================================" -ForegroundColor Cyan
Write-Host ""

$i = 1
foreach ($key in $blocks.Keys) {
    Write-Host ("  {0,2}. {1}" -f $i, $key) -ForegroundColor Yellow
    $i++
}

Write-Host ""
$choice = Read-Host "  Pick a number (or q to quit)"

if ($choice -eq "q") { exit }

$idx = [int]$choice - 1
$key = @($blocks.Keys)[$idx]
$text = $blocks[$key]

Set-Clipboard -Value $text
Write-Host ""
Write-Host "  Copied '$key' to clipboard. Paste with Ctrl+V." -ForegroundColor Green
Write-Host ""
