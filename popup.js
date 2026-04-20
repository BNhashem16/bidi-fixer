const DEFAULTS = {
  enabled: true,
  mode: "auto",
  siteOverrides: {}
};

const $ = (id) => document.getElementById(id);
const $enabled = $("pf-enabled");
const $modes = document.querySelectorAll('input[name="pf-mode"]');
const $rescan = $("pf-rescan");
const $options = $("pf-options");
const $statusText = $("pf-status-text");
const $status = $("pf-status");
const $host = $("pf-host");
const $siteOff = $("pf-site-disabled");
const $siteMode = $("pf-site-mode");
const $siteReset = $("pf-site-reset");
const $fixedCount = $("pf-fixed-count");
const $currentMode = $("pf-current-mode");

let currentHost = "";
let currentTab = null;

// ---------- i18n ----------
for (const el of document.querySelectorAll("[data-i18n]")) {
  const key = el.dataset.i18n;
  const msg = chrome.i18n.getMessage(key);
  if (msg) el.textContent = msg;
}
// Select options (they don't accept data-i18n via textContent loop above
// because they were already localised — re-apply to be safe).
for (const opt of $siteMode.options) {
  const key = opt.dataset.i18n;
  if (key) {
    const msg = chrome.i18n.getMessage(key);
    if (msg) opt.textContent = msg;
  }
}

function setStatus(key, kind = "idle") {
  const text = chrome.i18n.getMessage(key) || key;
  $statusText.textContent = text;
  $status.classList.toggle("ok", kind === "ok");
  $status.classList.toggle("warn", kind === "warn");
  if (kind === "ok") {
    setTimeout(() => {
      $statusText.textContent = chrome.i18n.getMessage("popup_status_ready") || "Ready";
      $status.classList.remove("ok");
    }, 1200);
  }
}

function readMode() {
  for (const el of $modes) if (el.checked) return el.value;
  return "auto";
}

function writeMode(mode) {
  for (const el of $modes) el.checked = el.value === mode;
}

function hostFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

async function activeHost() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return { tab, host: hostFromUrl(tab?.url || "") };
}

function getAll() {
  return new Promise((resolve) =>
    chrome.storage.sync.get(null, (cfg) => resolve({ ...DEFAULTS, ...cfg }))
  );
}

function broadcast(settings) {
  chrome.runtime.sendMessage({ type: "BIDI_FIXER_BROADCAST", settings });
}

async function queryContentStats() {
  if (!currentTab?.id) return { fixed: 0 };
  try {
    const resp = await chrome.tabs.sendMessage(currentTab.id, { type: "BIDI_FIXER_QUERY" });
    return resp || { fixed: 0 };
  } catch {
    return { fixed: 0 };
  }
}

async function render() {
  const { tab, host } = await activeHost();
  currentTab = tab;
  currentHost = host;
  $host.textContent = host || "—";

  const cfg = await getAll();
  $enabled.checked = cfg.enabled !== false;
  writeMode(cfg.mode || "auto");

  const override = cfg.siteOverrides?.[host];
  const siteOff = override?.enabled === false;
  $siteOff.checked = !!siteOff;
  $siteMode.value = override?.mode || "";
  const hasOverride = !!override && Object.keys(override).length > 0;
  $siteReset.disabled = !hasOverride;
  $siteReset.style.opacity = hasOverride ? "1" : "0.5";

  const effectiveMode = override?.mode || cfg.mode || "auto";
  $currentMode.textContent = effectiveMode.toUpperCase();

  if (siteOff) setStatus("popup_status_off_site", "warn");
  else if (!cfg.enabled) setStatus("popup_status_off_global", "warn");
  else setStatus("popup_status_active", "ok");

  const stats = await queryContentStats();
  $fixedCount.textContent = String(stats.fixed || 0);
}

async function commit() {
  const cfg = await getAll();
  const siteOverrides = { ...(cfg.siteOverrides || {}) };

  if (currentHost) {
    const existing = siteOverrides[currentHost] || {};
    const next = { ...existing };

    if ($siteOff.checked) next.enabled = false;
    else delete next.enabled;

    if ($siteMode.value) next.mode = $siteMode.value;
    else delete next.mode;

    if (Object.keys(next).length) siteOverrides[currentHost] = next;
    else delete siteOverrides[currentHost];
  }

  const settings = {
    enabled: $enabled.checked,
    mode: readMode(),
    siteOverrides
  };

  chrome.storage.sync.set(settings, () => {
    broadcast(settings);
    setStatus("popup_status_saved", "ok");
    const hasOverride = !!siteOverrides[currentHost];
    $siteReset.disabled = !hasOverride;
    $siteReset.style.opacity = hasOverride ? "1" : "0.5";
    const effective = siteOverrides[currentHost]?.mode || settings.mode;
    $currentMode.textContent = effective.toUpperCase();
  });
}

async function clearOverride() {
  const cfg = await getAll();
  if (!currentHost || !cfg.siteOverrides?.[currentHost]) return;
  const overrides = { ...cfg.siteOverrides };
  delete overrides[currentHost];
  const settings = {
    enabled: cfg.enabled,
    mode: cfg.mode,
    siteOverrides: overrides
  };
  chrome.storage.sync.set(settings, () => {
    broadcast(settings);
    render();
    setStatus("popup_status_cleared", "ok");
  });
}

$enabled.addEventListener("change", commit);
for (const el of $modes) el.addEventListener("change", commit);
$siteOff.addEventListener("change", commit);
$siteMode.addEventListener("change", commit);
$siteReset.addEventListener("click", clearOverride);

$rescan.addEventListener("click", async () => {
  if (!currentTab?.id) return;
  const cfg = await getAll();
  const override = cfg.siteOverrides?.[currentHost] || {};
  try {
    const resp = await chrome.tabs.sendMessage(currentTab.id, {
      type: "BIDI_FIXER_UPDATE",
      enabled: override.enabled ?? cfg.enabled,
      mode: override.mode || cfg.mode
    });
    setStatus("popup_status_rescanned", "ok");
    if (resp?.fixed !== undefined) {
      setTimeout(async () => {
        const stats = await queryContentStats();
        $fixedCount.textContent = String(stats.fixed || 0);
      }, 400);
    }
  } catch {
    setStatus("popup_status_unavailable", "warn");
  }
});

$options.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

render();
