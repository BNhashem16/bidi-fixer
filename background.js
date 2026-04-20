/**
 * Bidi Fixer - Service Worker
 *
 * - Seeds defaults on install.
 * - Broadcasts popup/options changes to every tab.
 * - Keeps the action badge in sync (ON / off).
 * - Handles global shortcuts (Alt+Shift+B toggle, Alt+Shift+M cycle mode).
 * - Hosts the right-click context menu.
 * - Resolves per-site effective state for content scripts.
 */

const DEFAULTS = {
  enabled: true,
  mode: "auto",
  siteOverrides: {}, // { "example.com": { enabled?: false, mode?: "rtl" } }
  scripts: { arabic: true, hebrew: true, persianExtras: true },
  digits: "off",           // "off" | "toWestern" | "toEastern"
  normalizeTatweel: false,
  normalizeAlef: false,
  debugOutline: false
};

const MODE_CYCLE = ["auto", "rtl", "ltr"];

function getHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function effective(cfg, host) {
  const override = (cfg.siteOverrides && host && cfg.siteOverrides[host]) || {};
  return {
    enabled: override.enabled ?? cfg.enabled ?? true,
    mode: override.mode || cfg.mode || "auto",
    scripts: cfg.scripts || DEFAULTS.scripts,
    digits: cfg.digits || "off",
    normalizeTatweel: !!cfg.normalizeTatweel,
    normalizeAlef: !!cfg.normalizeAlef,
    debugOutline: !!cfg.debugOutline
  };
}

function setBadge(tabId, enabled) {
  if (!tabId) return;
  chrome.action.setBadgeBackgroundColor({
    color: enabled ? "#4ade80" : "#64748b",
    tabId
  });
  chrome.action.setBadgeText({ text: enabled ? "" : "off", tabId });
}

function syncTab(tab, cfg) {
  if (!tab?.id || !tab.url) return;
  const host = getHost(tab.url);
  const state = effective(cfg, host);
  setBadge(tab.id, state.enabled);
  chrome.tabs
    .sendMessage(tab.id, { type: "BIDI_FIXER_UPDATE", ...state })
    .catch(() => {
      // Not scriptable (chrome://, Web Store, PDF viewer, pre-install tabs).
    });
}

function syncAll() {
  chrome.storage.sync.get(DEFAULTS, (cfg) => {
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) syncTab(tab, cfg);
    });
  });
}

function withConfig(fn) {
  chrome.storage.sync.get(DEFAULTS, (cfg) => fn({ ...DEFAULTS, ...cfg }));
}

// ---------- Context menus ----------

function ensureContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "bf-fix",
      title: chrome.i18n.getMessage("ctx_fix_selection") || "Bidi Fixer: fix this element",
      contexts: ["all"]
    });
    chrome.contextMenus.create({
      id: "bf-ignore",
      title: chrome.i18n.getMessage("ctx_ignore_selection") || "Bidi Fixer: ignore this element",
      contexts: ["all"]
    });
    chrome.contextMenus.create({ id: "bf-sep", type: "separator", contexts: ["all"] });
    chrome.contextMenus.create({
      id: "bf-toggle-site",
      title: chrome.i18n.getMessage("ctx_toggle_site") || "Bidi Fixer: toggle on this site",
      contexts: ["all"]
    });
  });
}

chrome.contextMenus?.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;
  if (info.menuItemId === "bf-fix") {
    chrome.tabs.sendMessage(tab.id, { type: "BIDI_FIXER_CTX", action: "fix" }).catch(() => {});
  } else if (info.menuItemId === "bf-ignore") {
    chrome.tabs.sendMessage(tab.id, { type: "BIDI_FIXER_CTX", action: "ignore" }).catch(() => {});
  } else if (info.menuItemId === "bf-toggle-site") {
    toggleSite(tab);
  }
});

function toggleSite(tab) {
  const host = getHost(tab.url || "");
  if (!host) return;
  withConfig((cfg) => {
    const overrides = { ...(cfg.siteOverrides || {}) };
    const current = overrides[host] || {};
    const isDisabled = current.enabled === false;
    if (isDisabled) {
      const { enabled, ...rest } = current;
      if (Object.keys(rest).length) overrides[host] = rest;
      else delete overrides[host];
    } else {
      overrides[host] = { ...current, enabled: false };
    }
    chrome.storage.sync.set({ siteOverrides: overrides }, syncAll);
  });
}

// ---------- Lifecycle ----------

chrome.runtime.onInstalled.addListener(() => {
  withConfig((cfg) => {
    chrome.storage.sync.set({ ...DEFAULTS, ...cfg }, () => {
      ensureContextMenus();
      syncAll();
    });
  });
});

chrome.runtime.onStartup.addListener(() => {
  ensureContextMenus();
  syncAll();
});

// Also ensure menus exist for the current session (service worker may wake).
ensureContextMenus();

// ---------- Messaging ----------

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg) return;

  if (msg.type === "BIDI_FIXER_BROADCAST") {
    // Popup / options persisted a patch; mirror to every tab.
    const patch = { ...msg.settings };
    delete patch.type;
    chrome.storage.sync.set(patch, () => {
      syncAll();
      sendResponse({ ok: true });
    });
    return true;
  }

  if (msg.type === "BIDI_FIXER_GET_STATE") {
    const host = getHost(sender.tab?.url || msg.url || "");
    withConfig((cfg) => sendResponse({ ...effective(cfg, host), host }));
    return true;
  }

  if (msg.type === "BIDI_FIXER_REQUEST_SYNC") {
    syncAll();
    sendResponse({ ok: true });
    return true;
  }

  if (msg.type === "BIDI_FIXER_REPORT_STATS" && sender.tab?.id) {
    // Content script reports element count; stash per-tab for popup.
    const data = tabStats.get(sender.tab.id) || {};
    tabStats.set(sender.tab.id, {
      ...data,
      fixed: msg.fixed || 0,
      host: getHost(sender.tab.url || "")
    });
    return;
  }

  if (msg.type === "BIDI_FIXER_GET_TAB_STATS") {
    sendResponse(tabStats.get(msg.tabId) || { fixed: 0 });
    return true;
  }
});

// Per-tab stats kept only in memory (service worker lifetime).
const tabStats = new Map();
chrome.tabs.onRemoved.addListener((id) => tabStats.delete(id));

// ---------- Tab updates ----------

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status !== "complete") return;
  withConfig((cfg) => syncTab(tab, cfg));
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) return;
    withConfig((cfg) => syncTab(tab, cfg));
  });
});

// ---------- Commands ----------

chrome.commands?.onCommand.addListener((command) => {
  withConfig((cfg) => {
    if (command === "toggle-enabled") {
      chrome.storage.sync.set({ enabled: !cfg.enabled }, syncAll);
    } else if (command === "cycle-mode") {
      const idx = MODE_CYCLE.indexOf(cfg.mode);
      const next = MODE_CYCLE[(idx + 1) % MODE_CYCLE.length];
      chrome.storage.sync.set({ mode: next }, syncAll);
    }
  });
});
