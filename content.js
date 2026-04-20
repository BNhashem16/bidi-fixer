/**
 * Bidi Fixer - Content Script
 *
 * Scans the DOM for elements carrying RTL script (Arabic / Hebrew / Persian)
 * mixed with Latin or digits, and applies minimal, reversible bidi fixes.
 *
 * Features:
 *  - Unicode-accurate Arabic + Hebrew + Persian/Urdu detection (configurable).
 *  - dir="auto" + unicode-bidi: plaintext for mixed runs (safe default).
 *  - Force RTL / Force LTR overrides for mis-tagged sites.
 *  - Optional text normalization: tatweel stripping, alef unification.
 *  - Optional digit conversion (Eastern ↔ Western Arabic digits).
 *  - Right-click "fix this / ignore this" via context menu.
 *  - MutationObserver + requestIdleCallback batching for SPAs.
 *  - Reversible: disabling removes every attribute and style added.
 *  - Per-tab stats reported to service worker.
 */

(() => {
  if (window.__bidiFixerLoaded) return;
  window.__bidiFixerLoaded = true;

  const MARK_ATTR = "data-bidi-fixer";
  const ORIG_DIR_ATTR = "data-bidi-fixer-orig-dir";
  const IGNORE_ATTR = "data-bidi-fixer-ignore";
  const MARKED_SELECTOR = `[${MARK_ATTR}]`;

  // Arabic blocks: base + supplement + extended A/B + presentation forms A/B.
  const ARABIC_RE =
    /[\u0600-\u06FF\u0750-\u077F\u0870-\u089F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  // Hebrew block + presentation forms.
  const HEBREW_RE = /[\u0590-\u05FF\uFB1D-\uFB4F]/;
  // Persian/Urdu extras live inside the Arabic range; toggle just turns on
  // acceptance of code points that Persian/Urdu users rely on.
  const PERSIAN_EXTRAS_RE = /[\u06A9\u06AF\u067E\u0686\u0698\u06CC\u06F0-\u06F9]/;

  const LATIN_DIGIT_RE = /[A-Za-z0-9]/;
  const TATWEEL_RE = /\u0640+/g;
  const ALEF_VARIANTS_RE = /[\u0622\u0623\u0625]/g;
  const EASTERN_DIGITS_RE = /[\u0660-\u0669]/g;
  const WESTERN_DIGITS_RE = /[0-9]/g;

  const SKIP_TAGS = new Set([
    "SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "IFRAME", "OBJECT", "EMBED",
    "CANVAS", "SVG", "MATH", "CODE", "PRE", "KBD", "SAMP", "VAR",
    "INPUT", "TEXTAREA", "SELECT", "OPTION", "BUTTON"
  ]);

  const state = {
    enabled: true,
    mode: "auto",
    scripts: { arabic: true, hebrew: true, persianExtras: true },
    digits: "off",
    normalizeTatweel: false,
    normalizeAlef: false,
    debugOutline: false,
    observer: null,
    pending: new Set(),
    scheduled: false,
    fixedCount: 0,
    lastContextTarget: null
  };

  const idle =
    window.requestIdleCallback ||
    ((cb) => setTimeout(() => cb({ timeRemaining: () => 16, didTimeout: false }), 16));

  function buildDetectionRegex() {
    const parts = [];
    if (state.scripts.arabic) parts.push(ARABIC_RE.source);
    if (state.scripts.hebrew) parts.push(HEBREW_RE.source);
    if (state.scripts.persianExtras) parts.push(PERSIAN_EXTRAS_RE.source);
    state._detectRe = parts.length ? new RegExp(parts.join("|")) : null;
  }

  function hasRTL(text) {
    return !!(state._detectRe && state._detectRe.test(text));
  }

  function isMixed(text) {
    return hasRTL(text) && LATIN_DIGIT_RE.test(text);
  }

  function shouldSkip(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return true;
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (el.isContentEditable) return true;
    if (el.closest && el.closest('[contenteditable="true"]')) return true;
    if (el.hasAttribute(IGNORE_ATTR)) return true;
    if (el.hasAttribute("dir") && !el.hasAttribute(MARK_ATTR)) return true;
    return false;
  }

  function getDirectText(el) {
    let out = "";
    const children = el.childNodes;
    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      if (node.nodeType === Node.TEXT_NODE) {
        out += node.nodeValue;
        if (out.length > 512) break;
      }
    }
    return out;
  }

  function applyTextTransforms(el) {
    if (!state.normalizeTatweel && !state.normalizeAlef && state.digits === "off") return;
    const children = el.childNodes;
    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      if (node.nodeType !== Node.TEXT_NODE) continue;
      let t = node.nodeValue;
      const before = t;
      if (state.normalizeTatweel) t = t.replace(TATWEEL_RE, "");
      if (state.normalizeAlef) t = t.replace(ALEF_VARIANTS_RE, "\u0627");
      if (state.digits === "toWestern") {
        t = t.replace(EASTERN_DIGITS_RE, (d) => String(d.charCodeAt(0) - 0x0660));
      } else if (state.digits === "toEastern") {
        t = t.replace(WESTERN_DIGITS_RE, (d) => String.fromCharCode(0x0660 + Number(d)));
      }
      if (t !== before) node.nodeValue = t;
    }
  }

  function applyFix(el) {
    if (shouldSkip(el)) return;

    const text = getDirectText(el);
    if (!text || !text.trim()) return;
    if (!hasRTL(text)) return;

    applyTextTransforms(el);

    const mode = state.mode;
    const dir = mode === "rtl" ? "rtl" : mode === "ltr" ? "ltr" : "auto";

    if (!el.hasAttribute(MARK_ATTR)) {
      const existing = el.getAttribute("dir");
      if (existing !== null) el.setAttribute(ORIG_DIR_ATTR, existing);
    }

    if (el.getAttribute("dir") !== dir) el.setAttribute("dir", dir);
    if (el.getAttribute(MARK_ATTR) !== mode) el.setAttribute(MARK_ATTR, mode);

    if (mode === "auto" && isMixed(text)) {
      el.style.setProperty("unicode-bidi", "plaintext", "important");
    } else {
      el.style.removeProperty("unicode-bidi");
    }

    state.fixedCount++;
  }

  function undoFix(el) {
    if (!el?.hasAttribute?.(MARK_ATTR)) return;
    if (el.hasAttribute(ORIG_DIR_ATTR)) {
      el.setAttribute("dir", el.getAttribute(ORIG_DIR_ATTR));
      el.removeAttribute(ORIG_DIR_ATTR);
    } else {
      el.removeAttribute("dir");
    }
    el.removeAttribute(MARK_ATTR);
    el.style.removeProperty("unicode-bidi");
    if (el.getAttribute("style") === "") el.removeAttribute("style");
  }

  function undoAll(root = document) {
    const nodes = root.querySelectorAll(MARKED_SELECTOR);
    for (const el of nodes) undoFix(el);
    state.fixedCount = 0;
  }

  function collectCandidates(root, out) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      if (root.parentElement) out.add(root.parentElement);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    if (SKIP_TAGS.has(root.tagName)) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
      acceptNode(node) {
        if (SKIP_TAGS.has(node.tagName)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    out.add(root);
    let current = walker.nextNode();
    while (current) {
      out.add(current);
      current = walker.nextNode();
    }
  }

  function flush() {
    state.scheduled = false;
    if (!state.enabled) {
      state.pending.clear();
      return;
    }
    const batch = Array.from(state.pending);
    state.pending.clear();

    const CHUNK = 300;
    let i = 0;
    const work = (deadline) => {
      while (
        i < batch.length &&
        (!deadline || deadline.timeRemaining() > 2 || deadline.didTimeout)
      ) {
        const end = Math.min(i + CHUNK, batch.length);
        for (; i < end; i++) applyFix(batch[i]);
      }
      if (i < batch.length) idle(work);
      else reportStats();
    };
    idle(work);
  }

  function schedule(nodes) {
    for (const n of nodes) state.pending.add(n);
    if (state.scheduled) return;
    state.scheduled = true;
    idle(flush);
  }

  function scanDocument() {
    const candidates = new Set();
    collectCandidates(document.body || document.documentElement, candidates);
    schedule(candidates);
  }

  function startObserver() {
    if (state.observer) return;
    state.observer = new MutationObserver((mutations) => {
      if (!state.enabled) return;
      const candidates = new Set();
      for (const m of mutations) {
        if (m.type === "childList") {
          for (const added of m.addedNodes) collectCandidates(added, candidates);
        } else if (m.type === "characterData" && m.target.parentElement) {
          candidates.add(m.target.parentElement);
        }
      }
      if (candidates.size) schedule(candidates);
    });
    state.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  function stopObserver() {
    if (!state.observer) return;
    state.observer.disconnect();
    state.observer = null;
  }

  function applyDebugOutline() {
    document.documentElement.classList.toggle("bidi-fixer-debug", !!state.debugOutline);
  }

  function enable() {
    state.enabled = true;
    buildDetectionRegex();
    applyDebugOutline();
    startObserver();
    scanDocument();
  }

  function disable() {
    state.enabled = false;
    stopObserver();
    state.pending.clear();
    undoAll();
    document.documentElement.classList.remove("bidi-fixer-debug");
    reportStats();
  }

  function reportStats() {
    try {
      chrome.runtime?.sendMessage({
        type: "BIDI_FIXER_REPORT_STATS",
        fixed: state.fixedCount
      });
    } catch {}
  }

  function applyState(next) {
    const modeChanged = typeof next.mode === "string" && next.mode !== state.mode;
    const scriptsChanged =
      next.scripts && JSON.stringify(next.scripts) !== JSON.stringify(state.scripts);
    const transformsChanged =
      next.normalizeTatweel !== undefined && next.normalizeTatweel !== state.normalizeTatweel ||
      next.normalizeAlef !== undefined && next.normalizeAlef !== state.normalizeAlef ||
      next.digits !== undefined && next.digits !== state.digits;

    if (typeof next.mode === "string") state.mode = next.mode;
    if (next.scripts) state.scripts = { ...state.scripts, ...next.scripts };
    if (next.digits !== undefined) state.digits = next.digits;
    if (next.normalizeTatweel !== undefined) state.normalizeTatweel = !!next.normalizeTatweel;
    if (next.normalizeAlef !== undefined) state.normalizeAlef = !!next.normalizeAlef;
    if (next.debugOutline !== undefined) state.debugOutline = !!next.debugOutline;

    if (next.enabled === false) {
      if (state.enabled) disable();
      return;
    }

    if (modeChanged || scriptsChanged || transformsChanged) undoAll();
    enable();
  }

  function bootstrap() {
    if (!chrome.runtime?.sendMessage) {
      applyState({ enabled: true, mode: "auto" });
      return;
    }
    try {
      chrome.runtime.sendMessage(
        { type: "BIDI_FIXER_GET_STATE", url: location.href },
        (resp) => {
          if (chrome.runtime.lastError || !resp) {
            chrome.storage?.sync.get(null, (cfg) => applyState(cfg || {}));
            return;
          }
          applyState(resp);
        }
      );
    } catch {
      chrome.storage?.sync.get(null, (cfg) => applyState(cfg || {}));
    }
  }

  // ---------- Context menu handling ----------

  document.addEventListener(
    "contextmenu",
    (e) => {
      state.lastContextTarget = e.target;
    },
    true
  );

  function handleContext(action) {
    const target = state.lastContextTarget;
    if (!target) return;
    const el = target.nodeType === Node.ELEMENT_NODE ? target : target.parentElement;
    if (!el) return;

    if (action === "fix") {
      el.removeAttribute(IGNORE_ATTR);
      const candidates = new Set();
      collectCandidates(el, candidates);
      schedule(candidates);
    } else if (action === "ignore") {
      el.setAttribute(IGNORE_ATTR, "1");
      undoAll(el);
      reportStats();
    }
  }

  // ---------- Messaging ----------

  chrome.runtime?.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg) return;
    if (msg.type === "BIDI_FIXER_UPDATE") {
      applyState(msg);
      sendResponse({ ok: true, fixed: state.fixedCount });
      return true;
    }
    if (msg.type === "BIDI_FIXER_QUERY") {
      sendResponse({
        enabled: state.enabled,
        mode: state.mode,
        fixed: state.fixedCount,
        host: location.hostname.replace(/^www\./, "")
      });
      return true;
    }
    if (msg.type === "BIDI_FIXER_CTX") {
      handleContext(msg.action);
      sendResponse({ ok: true });
      return true;
    }
  });

  bootstrap();
})();
