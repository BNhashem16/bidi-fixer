const DEFAULTS = {
  enabled: true,
  mode: "rtl",
  siteOverrides: {},
  scripts: { arabic: true, hebrew: true, persianExtras: true },
  digits: "off",
  normalizeTatweel: false,
  normalizeAlef: false,
  debugOutline: false
};

const $ = (id) => document.getElementById(id);

const controls = {
  enabled: $("op-enabled"),
  modes: document.querySelectorAll('input[name="op-mode"]'),
  arabic: $("op-script-arabic"),
  hebrew: $("op-script-hebrew"),
  persian: $("op-script-persian"),
  tatweel: $("op-tatweel"),
  alef: $("op-alef"),
  digits: document.querySelectorAll('input[name="op-digits"]'),
  outline: $("op-outline"),
  sites: $("op-sites"),
  status: $("op-status"),
  export: $("op-export"),
  import: $("op-import"),
  reset: $("op-reset")
};

// ---------- i18n ----------
document.documentElement.dir = chrome.i18n.getMessage("@@bidi_dir") || "ltr";
document.documentElement.lang = chrome.i18n.getMessage("@@ui_locale") || "en";

for (const el of document.querySelectorAll("[data-i18n]")) {
  const msg = chrome.i18n.getMessage(el.dataset.i18n);
  if (msg) el.textContent = msg;
}
for (const el of document.querySelectorAll("[data-i18n-title]")) {
  const msg = chrome.i18n.getMessage(el.dataset.i18nTitle);
  if (msg) el.title = msg;
}
for (const el of document.querySelectorAll("[data-i18n-aria-label]")) {
  const msg = chrome.i18n.getMessage(el.dataset.i18nAriaLabel);
  if (msg) el.setAttribute("aria-label", msg);
}

// Version from manifest (single source of truth)
const $version = document.getElementById("op-version");
if ($version) {
  const manifest = chrome.runtime.getManifest();
  $version.textContent = `v${manifest.version}`;
}

function setStatus(key, kind = "idle") {
  const msg = chrome.i18n.getMessage(key) || key;
  controls.status.textContent = msg;
  controls.status.classList.toggle("ok", kind === "ok");
  controls.status.classList.toggle("warn", kind === "warn");
  if (kind === "ok") setTimeout(() => (controls.status.textContent = ""), 1500);
}

function readRadio(nodes) {
  for (const el of nodes) if (el.checked) return el.value;
  return "";
}
function writeRadio(nodes, value) {
  for (const el of nodes) el.checked = el.value === value;
}

function getAll() {
  return new Promise((resolve) =>
    chrome.storage.sync.get(null, (cfg) => resolve({ ...DEFAULTS, ...cfg }))
  );
}

function broadcast(settings) {
  chrome.runtime.sendMessage({ type: "BIDI_FIXER_BROADCAST", settings });
}

async function render() {
  const cfg = await getAll();
  controls.enabled.checked = cfg.enabled !== false;
  writeRadio(controls.modes, cfg.mode || "auto");
  controls.arabic.checked = cfg.scripts?.arabic !== false;
  controls.hebrew.checked = cfg.scripts?.hebrew !== false;
  controls.persian.checked = cfg.scripts?.persianExtras !== false;
  controls.tatweel.checked = !!cfg.normalizeTatweel;
  controls.alef.checked = !!cfg.normalizeAlef;
  writeRadio(controls.digits, cfg.digits || "off");
  controls.outline.checked = !!cfg.debugOutline;
  renderSites(cfg.siteOverrides || {});
}

function renderSites(overrides) {
  const entries = Object.entries(overrides);
  if (!entries.length) {
    controls.sites.innerHTML = `<p class="op-empty">${chrome.i18n.getMessage("options_no_sites") || "No per-site overrides yet."}</p>`;
    return;
  }
  controls.sites.innerHTML = "";
  for (const [host, rules] of entries) {
    const row = document.createElement("div");
    row.className = "op-site";

    const name = document.createElement("span");
    name.className = "op-site-host";
    name.textContent = host;
    row.appendChild(name);

    if (rules.enabled === false) {
      const tag = document.createElement("span");
      tag.className = "op-site-tag warn";
      tag.textContent = chrome.i18n.getMessage("options_site_tag_disabled") || "disabled";
      row.appendChild(tag);
    } else {
      const spacer = document.createElement("span");
      row.appendChild(spacer);
    }

    if (rules.mode) {
      const tag = document.createElement("span");
      tag.className = "op-site-tag";
      tag.textContent = rules.mode.toUpperCase();
      row.appendChild(tag);
    } else {
      const spacer = document.createElement("span");
      row.appendChild(spacer);
    }

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "op-btn op-btn-ghost";
    remove.textContent = chrome.i18n.getMessage("options_remove_site") || "Remove";
    remove.addEventListener("click", async () => {
      const cfg = await getAll();
      const next = { ...cfg.siteOverrides };
      delete next[host];
      const settings = { siteOverrides: next };
      chrome.storage.sync.set(settings, () => {
        broadcast(settings);
        render();
        setStatus("options_save_ok", "ok");
      });
    });
    row.appendChild(remove);

    controls.sites.appendChild(row);
  }
}

async function commit() {
  const settings = {
    enabled: controls.enabled.checked,
    mode: readRadio(controls.modes) || "auto",
    scripts: {
      arabic: controls.arabic.checked,
      hebrew: controls.hebrew.checked,
      persianExtras: controls.persian.checked
    },
    normalizeTatweel: controls.tatweel.checked,
    normalizeAlef: controls.alef.checked,
    digits: readRadio(controls.digits) || "off",
    debugOutline: controls.outline.checked
  };
  chrome.storage.sync.set(settings, () => {
    broadcast(settings);
    setStatus("options_save_ok", "ok");
  });
}

// ---------- Wire ----------

controls.enabled.addEventListener("change", commit);
for (const el of controls.modes) el.addEventListener("change", commit);
for (const el of [controls.arabic, controls.hebrew, controls.persian, controls.tatweel, controls.alef, controls.outline]) {
  el.addEventListener("change", commit);
}
for (const el of controls.digits) el.addEventListener("change", commit);

controls.export.addEventListener("click", async () => {
  const cfg = await getAll();
  const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bidi-fixer-settings-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

controls.import.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    const merged = { ...DEFAULTS, ...data };
    chrome.storage.sync.clear(() =>
      chrome.storage.sync.set(merged, () => {
        broadcast(merged);
        render();
        setStatus("options_imported_ok", "ok");
      })
    );
  } catch {
    setStatus("options_import_error", "warn");
  } finally {
    e.target.value = "";
  }
});

controls.reset.addEventListener("click", () => {
  const msg = chrome.i18n.getMessage("options_reset_confirm") || "Reset all Bidi Fixer settings?";
  if (!confirm(msg)) return;
  chrome.storage.sync.clear(() => {
    chrome.storage.sync.set(DEFAULTS, () => {
      broadcast(DEFAULTS);
      render();
      setStatus("options_save_ok", "ok");
    });
  });
});

// ---------- Donation copy-to-clipboard ----------
for (const btn of document.querySelectorAll(".op-donate-copy")) {
  const originalLabel = btn.textContent;
  btn.addEventListener("click", async () => {
    const value = btn.dataset.copy || "";
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch {}
      ta.remove();
    }
    btn.classList.add("is-copied");
    btn.textContent = chrome.i18n.getMessage("options_donate_copied") || "Copied";
    setTimeout(() => {
      btn.classList.remove("is-copied");
      btn.textContent = chrome.i18n.getMessage("options_donate_copy") || originalLabel;
    }, 1400);
  });
}

render();
