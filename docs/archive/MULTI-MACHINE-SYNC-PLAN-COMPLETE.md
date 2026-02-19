# Plan: Multi-Machine Sync (Premium) + API Count Fix

**Date:** 2026-02-18
**Status:** Approved — ready for implementation

---

## Context

The user runs NumiSync on multiple machines sharing a network folder (Dropbox/NAS/network share) via the existing custom cache path feature. Two problems need solving:

1. **API count tracking bug** — `api-cache.js:incrementUsage()` increments in-memory state and writes the full in-memory object to disk. Two machines with stale in-memory copies overwrite each other's count updates. The lock only prevents *simultaneous* writes — it doesn't prevent lost updates.

2. **App-level settings not shared** — API key, monthly limit, TTL settings, and license key all live in each machine's local `%APPDATA%/numisync-wizard/settings.json`. New machines must be manually reconfigured.

**New requirement:** The shared cache / multi-machine sync capability is to become a **premium (Supporter Edition) feature**, gated by the existing `check-feature-access` mechanism. Free users can still use the default local cache; only supporters can configure a custom/shared cache location.

**Note on field mappings:** Per-collection settings (field mappings, fetch settings, currency) live in `{collectionDir}/.NumiSync/{basename}_settings.json`. When both machines access the same `.db` file from the same network path, this folder is on the shared drive and is **already shared automatically** — no additional work needed. This should be stated clearly in the UI.

**Note on recent collections:** Excluded from shared config — file paths differ between machines (drive letters, mount points) and would cause confusion.

---

## Uninstall Safety

The shared folder is **never touched** during uninstall on any platform:

- **Windows (NSIS):** `electron-builder.yml` has `deleteAppDataOnUninstall: false` — the local userData folder (`%APPDATA%\numisync-wizard\`) is preserved. The custom uninstall script (`build/installer.nsh`) only deletes the EULA marker from `$INSTDIR`. The shared network folder is a user-configured external path; it is never referenced by the installer/uninstaller.
- **Windows (MSIX/Store):** Electron's `app.getPath('userData')` resolves outside the MSIX container, so local settings survive uninstallation from the Store.
- **Per-collection `.NumiSync/` folders** alongside `.db` files are user data in user-controlled locations — never touched by the installer.

No changes needed to the installer for uninstall safety.

---

## Part 1: Fix API Count Sharing Bug

### Root Cause

`api-cache.js:incrementUsage()` (lines 241–254) operates on `this.data.monthlyUsage` (loaded once at startup in the constructor at line 53: `this.data = this._load()`). It then calls `_save()` (lines 98–112) which writes the entire in-memory `this.data` to disk. Two machines each have stale copies and overwrite each other.

`_save()` acquires the file lock before writing, but this only prevents *simultaneous* writes. It does NOT prevent Machine A from overwriting counts that Machine B wrote between Machine A's last read (startup) and Machine A's current write.

**Critical:** `_save()` acquires `this.lock`. We cannot call `_save()` from within a block that already holds `this.lock` — that would deadlock. The fix must write directly (not via `_save()`).

### Current Code — `src/modules/api-cache.js`

```javascript
// Lines 241–254 — CURRENT (broken for multi-machine)
async incrementUsage(endpoint) {
  if (!this.pruned) {
    await this._prune();
    this.pruned = true;
  }
  const month = this._monthKey();
  if (!this.data.monthlyUsage[month]) {
    this.data.monthlyUsage[month] = {};
  }
  this.data.monthlyUsage[month][endpoint] = (this.data.monthlyUsage[month][endpoint] || 0) + 1;
  await this._save();  // writes stale in-memory monthlyUsage — clobbers other machine's writes
}

// Lines 260–265 — CURRENT (shows stale in-memory count)
getMonthlyUsage() {
  const month = this._monthKey();
  const usage = this.data.monthlyUsage[month] || {};
  const total = Object.values(usage).reduce((sum, count) => sum + count, 0);
  return { ...usage, total };
}
```

### Fix — `src/modules/api-cache.js`

**Replace `incrementUsage()` (lines 241–254):**

```javascript
async incrementUsage(endpoint) {
  if (!this.pruned) {
    await this._prune();
    this.pruned = true;
  }
  // Atomic: lock → re-read monthlyUsage from disk → increment → write → unlock
  // Cannot call _save() here (it also acquires the lock — deadlock). Write directly.
  await this.lock.acquire();
  try {
    // Re-read monthly usage from disk to prevent clobbering concurrent machine writes
    if (fs.existsSync(this.cacheFilePath)) {
      try {
        const diskData = JSON.parse(fs.readFileSync(this.cacheFilePath, 'utf8'));
        if (diskData.monthlyUsage) this.data.monthlyUsage = diskData.monthlyUsage;
      } catch (_) { /* fall through — use in-memory state if disk read fails */ }
    }
    const month = this._monthKey();
    if (!this.data.monthlyUsage[month]) this.data.monthlyUsage[month] = {};
    this.data.monthlyUsage[month][endpoint] = (this.data.monthlyUsage[month][endpoint] || 0) + 1;
    const dir = path.dirname(this.cacheFilePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.cacheFilePath, JSON.stringify(this.data, null, 2), 'utf8');
  } finally {
    await this.lock.release();
  }
}
```

**Replace `getMonthlyUsage()` (lines 260–265):**

```javascript
getMonthlyUsage() {
  // Re-read from disk so the UI shows the combined total across all machines
  if (fs.existsSync(this.cacheFilePath)) {
    try {
      const diskData = JSON.parse(fs.readFileSync(this.cacheFilePath, 'utf8'));
      if (diskData.monthlyUsage) this.data.monthlyUsage = diskData.monthlyUsage;
    } catch (_) { /* fall through */ }
  }
  const month = this._monthKey();
  const usage = this.data.monthlyUsage[month] || {};
  const total = Object.values(usage).reduce((sum, count) => sum + count, 0);
  return { ...usage, total };
}
```

**Add three new methods** (insert after `getMonthlyUsage()`, before the next method):

```javascript
/**
 * Returns the path for the shared config file alongside the cache, or null if using default path.
 * @returns {string|null}
 */
getSharedConfigPath() {
  if (!this._isCustomPath) return null;
  return path.join(path.dirname(this.cacheFilePath), 'numisync-shared-config.json');
}

/**
 * Reads the shared config file from the cache directory.
 * @returns {{version: string, exportedAt: string, config: Object}|null}
 */
readSharedConfig() {
  const configPath = this.getSharedConfigPath();
  if (!configPath) return null;
  try {
    if (!fs.existsSync(configPath)) return null;
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {
    log.warn('ApiCache: Failed to read shared config:', e.message);
    return null;
  }
}

/**
 * Writes the shared config file to the cache directory.
 * @param {Object} config - Portable settings to share across machines
 * @async
 */
async writeSharedConfig(config) {
  const configPath = this.getSharedConfigPath();
  if (!configPath) return;
  const payload = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    config
  };
  await this.lock.acquire();
  try {
    fs.writeFileSync(configPath, JSON.stringify(payload, null, 2), 'utf8');
    log.info('ApiCache: Shared config written to', configPath);
  } catch (e) {
    log.error('ApiCache: Failed to write shared config:', e.message);
  } finally {
    await this.lock.release();
  }
}
```

**Constructor change** — add `this._isCustomPath` flag (lines 50–55). Compare against the default userData path to avoid a signature change:

```javascript
constructor(cacheFilePath, options = {}) {
  this.cacheFilePath = cacheFilePath;
  this.lock = new CacheLock(cacheFilePath, options.lockTimeout || 30000);
  this.data = this._load();
  this.pruned = false;
  // Track whether this is a custom (shared) path vs. the default userData location
  try {
    const defaultPath = path.join(require('electron').app.getPath('userData'), 'api-cache.json');
    this._isCustomPath = (cacheFilePath !== defaultPath);
  } catch (_) {
    this._isCustomPath = options.isCustomPath || false;
  }
}
```

---

## Part 2: Premium Feature Gate — Custom Cache Location

### FEATURE_VERSIONS entry — `src/main/index.js` (~line 2547)

Add `'multiMachineSync': '1.0.0'` to the V1 block of the existing `FEATURE_VERSIONS` map:

```javascript
const FEATURE_VERSIONS = {
  'fastPricing': '1.0.0',
  'batchEnrichment': '1.0.0',
  'advancedSearch': '1.0.0',
  'multiMachineSync': '1.0.0',   // ADD
  'numismaticSync': '2.0.0',
  'aiPricing': '2.0.0',
  'cloudBackup': '2.0.0',
  'marketplaceIntegration': '3.0.0'
};
```

### New IPC handlers — `src/main/index.js` (insert after `set-cache-settings`, ~line 1773)

```javascript
/**
 * Read the shared config file from the custom cache directory (if present).
 * @returns {{ found: boolean, config?: Object, exportedAt?: string }}
 */
ipcMain.handle('get-shared-config', async () => {
  try {
    const shared = apiCache.readSharedConfig();
    if (!shared) return { found: false };
    return { found: true, config: shared.config, exportedAt: shared.exportedAt };
  } catch (error) {
    log.error('Error reading shared config:', error);
    return { found: false };
  }
});

/**
 * Apply settings from the shared config file to the local settings.json.
 * Merges: apiKey, monthlyApiLimit, searchDelay, cacheTtl, licenseKey (as pendingLicenseKey).
 * Does NOT auto-activate license. Stores lastSharedConfigImport timestamp.
 * @returns {{ success: boolean, settings?: Object }}
 */
ipcMain.handle('apply-shared-config', async () => {
  try {
    const shared = apiCache.readSharedConfig();
    if (!shared || !shared.config) return { success: false, error: 'No shared config found' };

    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    let settings = {};
    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }

    const { apiKey, monthlyApiLimit, searchDelay, cacheTtl, licenseKey } = shared.config;
    if (apiKey !== undefined) settings.apiKey = apiKey;
    if (monthlyApiLimit !== undefined) settings.monthlyApiLimit = monthlyApiLimit;
    if (searchDelay !== undefined) settings.searchDelay = searchDelay;
    if (cacheTtl !== undefined) {
      settings.cacheTtl = cacheTtl;
      // Also update flat fields for backwards compatibility
      if (cacheTtl.issuers !== undefined) settings.cacheTtlIssuers = cacheTtl.issuers;
      if (cacheTtl.types !== undefined) settings.cacheTtlTypes = cacheTtl.types;
      if (cacheTtl.issues !== undefined) settings.cacheTtlIssues = cacheTtl.issues;
    }
    if (licenseKey !== undefined) {
      settings.supporter = settings.supporter || {};
      settings.supporter.pendingLicenseKey = licenseKey; // Pre-fill only — not activated
    }
    settings.lastSharedConfigImport = new Date().toISOString();

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    log.info('Shared config applied to local settings');
    return { success: true, settings };
  } catch (error) {
    log.error('Error applying shared config:', error);
    return { success: false, error: error.message };
  }
});
```

### Modify `save-app-settings` handler — `src/main/index.js` (~lines 1700–1751)

After writing `settings.json` and before `return { success: true }`, add:

```javascript
// Write shared config to shared folder if supporter with custom cache
const updatedSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
if (updatedSettings.cache?.location === 'custom' && updatedSettings.cache?.customPath && updatedSettings.supporter?.isSupporter) {
  await apiCache.writeSharedConfig({
    apiKey: updatedSettings.apiKey || '',
    monthlyApiLimit: updatedSettings.monthlyApiLimit || 2000,
    searchDelay: updatedSettings.searchDelay || 2000,
    cacheTtl: updatedSettings.cacheTtl || { issuers: 90, types: 30, issues: 30 },
    licenseKey: updatedSettings.supporter?.licenseKey || ''
  });
}
```

### New preload.js entries — `src/main/preload.js` (~line 231, after `cacheSettings` block)

```javascript
// Shared config (multi-machine sync)
getSharedConfig: () => ipcRenderer.invoke('get-shared-config'),
applySharedConfig: () => ipcRenderer.invoke('apply-shared-config'),
```

---

## Part 3: Shared Config File

**Filename:** `numisync-shared-config.json`
**Location:** Same directory as `api-cache.json` (the custom cache path)
**Written by:** Any machine when app-level settings are saved (supporter + custom cache)
**Read by:** Any machine on settings panel open

```json
{
  "version": "1.0",
  "exportedAt": "2026-02-18T12:00:00.000Z",
  "config": {
    "apiKey": "...",
    "monthlyApiLimit": 2000,
    "searchDelay": 2000,
    "cacheTtl": { "issuers": 90, "types": 30, "issues": 30 },
    "licenseKey": "polar_sk_..."
  }
}
```

**Not included:** Activation details, window bounds, EULA status, lifetime stats, recent collections, log level, cache path.

**License key on import:** Stored as `supporter.pendingLicenseKey`. License settings UI should detect this field and pre-populate the input. User still clicks Activate — no auto-activation.

---

## Part 4: UI Changes

### `src/renderer/index.html` — Cache Location section (lines 510–547)

**Replace lines 524–538** (the existing Custom Location label + controls block) with:

```html
<label style="display: block; margin-bottom: 8px;">
  <input type="radio" name="cacheLocation" value="custom" id="customCacheLocationRadio">
  Custom Location
  <span id="cacheLocationPremiumBadge" class="premium-badge" style="display:none;">
    <span class="emoji-placeholder" data-ui-key="ICON_GEM"></span>
  </span>
</label>
<p id="cacheLocationPremiumNote" class="setting-help" style="display:none; color: #6f42c1; margin-left: 24px; margin-top: -4px; margin-bottom: 8px;">
  Requires a Supporter Edition license.
  <a href="#" id="cacheLocationUpgradeLink">Get Supporter License →</a>
</p>
<div id="customCacheLocationControls" style="margin-left: 24px; display: none;">
  <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
    <input type="text" id="customCacheLocationInput" placeholder="Select cache directory..." style="flex: 1;" readonly>
    <button id="browseCacheLocationBtn" class="btn btn-secondary">Browse...</button>
  </div>
  <p class="setting-help">
    <span class="emoji-placeholder" data-ui-key="ICON_INFO"></span> <strong>Multi-Machine Sync:</strong> Select a folder on a network drive accessible from all computers. Settings and API call counts are automatically shared.
  </p>
  <p class="setting-help" style="color: #d97706;">
    <span class="emoji-placeholder" data-ui-key="ICON_WARNING"></span> <strong>Requirements:</strong> The folder must be accessible with read/write permissions. Network drives, Dropbox, OneDrive, and NAS shares all work.
  </p>
</div>
```

**Add shared config banner** immediately after the `customCacheLocationControls` closing `</div>`, before the lock timeout `<div>`:

```html
<div id="sharedConfigBanner" class="callout callout-info" style="display:none; margin-top: 12px; margin-left: 24px;">
  <strong>Shared settings available</strong> — Updated <span id="sharedConfigDate"></span>.
  <a href="#" id="importSharedConfigBtn" style="margin-left: 8px;">Import Now</a>
  <a href="#" id="dismissSharedConfigBtn" style="margin-left: 8px; color: #666;">Dismiss</a>
  <p class="setting-help" style="margin-top: 6px; margin-bottom: 0;">
    Field mappings and collection settings are shared automatically when your .db file is on a shared network path — no extra steps needed.
  </p>
</div>
```

### `src/renderer/app.js` — updateVersionBadge() (~lines 6243–6255)

Add after the existing `fastPricingBtn` block:

```javascript
// Update cache location premium gate (multi-machine sync)
const customCacheRadio = document.getElementById('customCacheLocationRadio');
const cacheLocationPremiumBadge = document.getElementById('cacheLocationPremiumBadge');
const cacheLocationPremiumNote = document.getElementById('cacheLocationPremiumNote');
if (customCacheRadio) {
  customCacheRadio.disabled = !isSupporter;
  if (cacheLocationPremiumBadge) cacheLocationPremiumBadge.style.display = isSupporter ? 'none' : '';
  if (cacheLocationPremiumNote) cacheLocationPremiumNote.style.display = isSupporter ? 'none' : '';
}
```

### `src/renderer/app.js` — Cache settings initialization (~line 5886)

**Update radio change handler** to guard against disabled state:

```javascript
document.getElementsByName('cacheLocation').forEach(radio => {
  radio.addEventListener('change', async (e) => {
    if (e.target.value === 'custom' && e.target.disabled) {
      e.preventDefault();
      document.querySelector('input[name="cacheLocation"][value="default"]').checked = true;
      return;
    }
    updateCacheLocationControlsVisibility();
  });
});
```

**Wire upgrade link:**

```javascript
const upgradeLink = document.getElementById('cacheLocationUpgradeLink');
if (upgradeLink) {
  upgradeLink.addEventListener('click', (e) => {
    e.preventDefault();
    showUpgradeModal('Multi-machine sync requires a Supporter Edition license.', null, '1.0.0');
  });
}
```

**After `cacheSettings.set()` call (~line 5775):** call `checkAndShowSharedConfigBanner()` to detect any existing shared config at the newly configured path.

**Add new helper function** (place near other cache settings helpers):

```javascript
/**
 * Check for a shared config file at the configured cache location.
 * Shows the import banner if the shared config is newer than the last import.
 */
async function checkAndShowSharedConfigBanner() {
  try {
    const result = await window.electronAPI.getSharedConfig();
    const banner = document.getElementById('sharedConfigBanner');
    const dateSpan = document.getElementById('sharedConfigDate');
    if (!banner) return;

    if (!result.found) {
      banner.style.display = 'none';
      return;
    }

    const appSettings = await window.electronAPI.getAppSettings();
    const lastImport = appSettings.settings?.lastSharedConfigImport;
    const sharedDate = new Date(result.exportedAt);

    if (!lastImport || sharedDate > new Date(lastImport)) {
      if (dateSpan) dateSpan.textContent = sharedDate.toLocaleDateString();
      banner.style.display = '';
    } else {
      banner.style.display = 'none';
    }
  } catch (e) {
    console.error('Error checking shared config:', e);
  }
}
```

**Wire banner buttons** (in settings panel initialization):

```javascript
document.getElementById('importSharedConfigBtn')?.addEventListener('click', async (e) => {
  e.preventDefault();
  const result = await window.electronAPI.applySharedConfig();
  if (result.success) {
    document.getElementById('sharedConfigBanner').style.display = 'none';
    await loadAppSettings(); // refresh settings UI
    showStatus('Shared settings imported successfully.');
  } else {
    showModal('Import Failed', 'Could not import shared settings: ' + (result.error || 'Unknown error'));
  }
});

document.getElementById('dismissSharedConfigBtn')?.addEventListener('click', async (e) => {
  e.preventDefault();
  await window.electronAPI.saveAppSettings({ lastSharedConfigImport: new Date().toISOString() });
  document.getElementById('sharedConfigBanner').style.display = 'none';
});
```

**Call `checkAndShowSharedConfigBanner()` when settings panel opens** — find the existing settings panel open handler and add the call there.

---

## Part 5: Documentation Updates

### `src/resources/user-manual.html`

**TOC** — add under Settings section:
```html
<li><a href="#multi-machine-sync">Multi-Machine Sync <small>(Premium)</small></a></li>
```

**New section** — add after Cache settings section, matching the PREMIUM badge pattern at line ~989 (`id="fast-pricing"`):

```html
<h3 id="multi-machine-sync">Multi-Machine Sync
  <span class="badge" style="background: linear-gradient(135deg, #d4af37, #f4e4ba); color: #333;">PREMIUM</span>
</h3>
<p>
  <strong>Multi-Machine Sync</strong> allows you to share your Numista API cache and app settings
  across multiple computers — ideal if you work on your collection from both a desktop and a laptop.
</p>
<div class="callout callout-info">
  <strong>Premium Feature:</strong> Multi-Machine Sync requires a Supporter Edition license.
  Free users can continue using the default local cache on a single machine.
</div>
<h4>Setting Up on Your Primary Machine</h4>
<ol class="steps">
  <li>Go to <strong>Settings → Cache Location → Custom Location</strong>.</li>
  <li>Select a folder on a shared network drive, Dropbox folder, or NAS.</li>
  <li>NumiSync automatically writes a <code>numisync-shared-config.json</code> file to that folder
      containing your API key, rate limits, and other portable settings.</li>
</ol>
<h4>Setting Up on Additional Machines (Bootstrap Import)</h4>
<p>
  On a fresh machine, you won't have a license yet — but you can import one from your shared folder
  without needing to configure the cache location first.
</p>
<ol class="steps">
  <li>Install NumiSync on the new machine.</li>
  <li>Go to <strong>Settings → Supporter Edition → Import from Shared Folder</strong>.</li>
  <li>Browse to the same shared folder you configured on your primary machine.</li>
  <li>NumiSync reads the shared config and attempts to activate the license key on this device.
      <strong>The import only proceeds if activation succeeds.</strong> If the key is invalid,
      expired, or the device limit has been reached, the import is cancelled and an error is shown.</li>
  <li>On success, all shared settings are applied (API key, rate limits, TTL settings) and the
      license is activated. Supporter features — including setting the custom cache location — are
      unlocked immediately.</li>
  <li>Go to <strong>Settings → Cache Location → Custom Location</strong> and point it at the same
      shared folder to complete the setup.</li>
</ol>
<div class="callout callout-warning">
  <strong>License requirement:</strong> The import will only succeed if the shared config contains
  a valid license key that can be activated on this device. Each license supports up to 5 devices.
  If you have reached the device limit, deactivate an unused device from your license dashboard
  before importing on the new machine.
</div>
<h4>What Is Shared</h4>
<ul>
  <li><strong>API cache</strong> — Coin type data, search results, issue data (no re-fetching cached data)</li>
  <li><strong>API call counts</strong> — Monthly usage accumulates correctly across all machines</li>
  <li><strong>Numista API key</strong> — Enter once; other machines import it automatically</li>
  <li><strong>Rate limits and TTL settings</strong> — Consistent cache behavior across machines</li>
  <li><strong>License key</strong> — Automatically activated on import (subject to device limit)</li>
</ul>
<h4>What Is NOT Shared via the Config File</h4>
<ul>
  <li><strong>Collection settings and field mappings</strong> — These live in the <code>.NumiSync/</code>
      folder alongside your <code>.db</code> file. If your collection database is on the same shared
      drive, these are already shared automatically with no extra steps.</li>
  <li><strong>Recent collections list</strong> — File paths differ between machines</li>
  <li><strong>License activation record</strong> — Each device activates individually (up to 5 devices per license)</li>
</ul>
<h4>Requirements</h4>
<ul>
  <li>Supporter Edition license (with at least one available device slot)</li>
  <li>Shared folder with read/write access from all machines</li>
  <li>Internet connection at the time of bootstrap import (for license activation)</li>
  <li>Works with network drives, Dropbox, OneDrive, NAS, and similar</li>
</ul>
```

### `docs/index.md` (GitHub Pages — three targeted edits)

**Edit 1** — Features section (~line 51–52): Replace "Multi-Machine Support" entry:
```markdown
### Multi-Machine Sync *(Supporter Edition)*
Share API cache and settings across multiple computers via a shared network drive, Dropbox, or NAS.
API call counts accumulate correctly across all machines. One-click settings import on new machines.
```

**Edit 2** — Free features list (~line 177): Change:
```markdown
- Smart caching — reduces API calls and works offline with cached data
```
(remove "and multi-machine support")

**Edit 3** — Supporter Edition list (~line 183): Add:
```markdown
- **Multi-Machine Sync** — Share cache and settings across all your computers
```

---

## Part 6: Bootstrap Import for New Machines (Free Entry Point)

### Problem — Circular Dependency

The custom cache location radio is gated behind a supporter license. On a brand-new machine the
license key lives inside the shared config — but the user can't reach the shared config without
setting the cache location, and can't set the cache location without a license. This is a circular
dependency that makes the feature unusable without manual license entry.

### Solution — Separate One-Time Import Path

Add an **"Import from Shared Folder"** button in the **Supporter Edition** settings section (not
the Cache section). This button is visible to **all users** — no supporter gate — because its
sole purpose is to bootstrap a new machine into supporter status.

**Critical principle: the import is atomic with license activation.** If the license key in the
shared config cannot be activated on this device (invalid key, expired, device limit reached,
network error), the import is aborted entirely. No settings are written. This prevents a partially
configured machine where an API key is present but no supporter access exists.

### Flow

1. User clicks **"Import from Shared Folder"** → folder browser opens (no cache location change).
2. App reads `numisync-shared-config.json` from the selected folder.
   - If no file found → error: "No shared settings file found in this folder."
3. App attempts to **activate** the license key from the config via Polar SDK.
   - Activation failure (invalid key) → error: "The license key in the shared config is not valid."
   - Activation failure (device limit) → error: "This license has reached its device limit. Deactivate an unused device from your license dashboard and try again."
   - Network error → error: "Could not reach the license server. Check your internet connection and try again."
4. On activation success → write all settings to `settings.json` (API key, limits, TTL, fully
   activated license). Call `updateVersionBadge()` to unlock supporter features immediately.
5. Success message: "Settings imported and license activated. You can now configure the cache
   location under Settings → Cache."

### New IPC Handler — `import-from-folder`

Accepts an arbitrary `folderPath` argument — independent of the configured cache location. This
is what breaks the circular dependency; the cache module's `_isCustomPath` flag is irrelevant here.

```javascript
/**
 * Bootstrap import: read shared config from an arbitrary folder, attempt license activation,
 * and on success apply all portable settings to local settings.json.
 * Aborts entirely if license activation fails — no partial writes.
 * @param {string} folderPath - Absolute path to the folder containing numisync-shared-config.json
 * @returns {{ success: boolean, error?: string, settings?: Object }}
 */
ipcMain.handle('import-from-folder', async (event, folderPath) => {
  try {
    const configPath = path.join(folderPath, 'numisync-shared-config.json');
    if (!fs.existsSync(configPath)) {
      return { success: false, error: 'No shared settings file found in this folder.' };
    }
    const shared = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (!shared?.config?.licenseKey) {
      return { success: false, error: 'Shared config does not contain a license key.' };
    }

    // Attempt activation BEFORE writing any settings — abort on failure
    const activationResult = await licenseManager.activate(shared.config.licenseKey);
    if (!activationResult.success) {
      return { success: false, error: activationResult.error || 'License activation failed.' };
    }
    await licenseManager.validate(shared.config.licenseKey); // increment validation counter

    // Activation succeeded — now write settings
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    let settings = fs.existsSync(settingsPath)
      ? JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
      : {};

    const { apiKey, monthlyApiLimit, searchDelay, cacheTtl, licenseKey } = shared.config;
    if (apiKey !== undefined) settings.apiKey = apiKey;
    if (monthlyApiLimit !== undefined) settings.monthlyApiLimit = monthlyApiLimit;
    if (searchDelay !== undefined) settings.searchDelay = searchDelay;
    if (cacheTtl !== undefined) {
      settings.cacheTtl = cacheTtl;
      if (cacheTtl.issuers !== undefined) settings.cacheTtlIssuers = cacheTtl.issuers;
      if (cacheTtl.types !== undefined) settings.cacheTtlTypes = cacheTtl.types;
      if (cacheTtl.issues !== undefined) settings.cacheTtlIssues = cacheTtl.issues;
    }
    settings.supporter = settings.supporter || {};
    settings.supporter.licenseKey = licenseKey;
    settings.supporter.isSupporter = true;
    settings.lastSharedConfigImport = new Date().toISOString();

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    log.info('Bootstrap import from shared folder succeeded');
    return { success: true, settings };
  } catch (error) {
    log.error('Error in import-from-folder:', error);
    return { success: false, error: error.message };
  }
});
```

### New preload.js entry

```javascript
importFromFolder: (folderPath) => ipcRenderer.invoke('import-from-folder', folderPath),
```

### UI — Supporter Edition section (`src/renderer/index.html`)

Add after the existing license key input block in the Supporter section:

```html
<div id="bootstrapImportBlock" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e0e0e0;">
  <p class="setting-help">
    <strong>Already using NumiSync on another machine?</strong> Import your API key and license
    from your shared folder. The import only proceeds if the license can be activated on this device.
  </p>
  <button id="importFromFolderBtn" class="btn btn-secondary">Import from Shared Folder...</button>
  <span id="importFromFolderStatus" style="margin-left: 12px; display: none;"></span>
</div>
```

### UI — `src/renderer/app.js` (Supporter section initialization)

```javascript
document.getElementById('importFromFolderBtn')?.addEventListener('click', async () => {
  const folderPath = await window.electronAPI.selectFolder(); // existing folder picker IPC
  if (!folderPath) return;

  const statusEl = document.getElementById('importFromFolderStatus');
  statusEl.textContent = 'Importing...';
  statusEl.style.display = '';

  const result = await window.electronAPI.importFromFolder(folderPath);
  if (result.success) {
    statusEl.textContent = '';
    statusEl.style.display = 'none';
    await loadAppSettings();       // refresh settings UI with imported values
    await updateVersionBadge();    // unlock supporter features immediately
    showStatus('Settings imported and license activated. You can now configure the cache location under Settings \u2192 Cache.');
  } else {
    statusEl.textContent = result.error || 'Import failed.';
    statusEl.style.color = '#c0392b';
  }
});
```

### `docs/reference/IPC-HANDLERS-QUICK-REF.md` — new row

Add to the **Licensing / Settings** domain section:

| `import-from-folder` | `(folderPath: string)` | `{ success, error?, settings? }` | Read shared config from arbitrary folder, activate license, apply settings atomically |

---

## Files to Modify (Summary)

| File | Lines | Change |
|------|-------|--------|
| `src/modules/api-cache.js` | 50–55, 241–254, 260–265, after 265 | Fix constructor (`_isCustomPath`); fix `incrementUsage()`; fix `getMonthlyUsage()`; add 3 new methods |
| `src/main/index.js` | ~2547, after ~1773, ~1700–1751, new handler | Add `multiMachineSync` to FEATURE_VERSIONS; add `get-shared-config` + `apply-shared-config` handlers; update `save-app-settings`; add `import-from-folder` handler (Part 6) |
| `src/main/preload.js` | after ~231 | Add `getSharedConfig`, `applySharedConfig`, and `importFromFolder` |
| `src/renderer/index.html` | 524–538, after 538, Supporter section | Replace Custom Location label block; add `sharedConfigBanner`; add `bootstrapImportBlock` + button in Supporter section (Part 6) |
| `src/renderer/app.js` | ~6243, ~5886, ~5775, Supporter section init | Update `updateVersionBadge()`; gate radio + wire upgrade link; add banner logic + `checkAndShowSharedConfigBanner()`; wire `importFromFolderBtn` (Part 6) |
| `src/resources/user-manual.html` | TOC + after cache section | Add Multi-Machine Sync section (with bootstrap import flow, license validation warning, device limit callout) + TOC entry |
| `docs/index.md` | ~51, ~177, ~183 | Move multi-machine to premium; update free/supporter lists |
| `docs/CHANGELOG.md` | Top of unreleased section | Prepend Feature rows |
| `docs/reference/IPC-HANDLERS-QUICK-REF.md` | Cache domain + Licensing section | Add `get-shared-config`, `apply-shared-config`, and `import-from-folder` rows |

---

## Verification

1. **Non-supporter sees lock**: Open settings as free user → "Custom Location" radio is disabled, premium badge visible, "Requires Supporter Edition" note shown. Clicking upgrade link triggers `showUpgradeModal`.

2. **Supporter unlocks it**: Add valid license → `updateVersionBadge()` fires → radio enabled, premium badge hidden.

3. **API count fix**: Machine A makes 50 calls → file shows 50. Machine B starts (reads 50), makes 30 → file shows 80. Machine A makes 20 more → re-reads disk (80), adds 20 → file shows 100. Both machines' UI shows 100.

4. **Shared config write**: Supporter saves API key with custom cache → `numisync-shared-config.json` appears in shared folder.

5. **New machine import (bootstrap)**: Fresh install → Supporter section → "Import from Shared Folder" → browse to shared folder → app reads config → activates license → on success: settings applied, `updateVersionBadge()` called, custom cache radio unlocked. On failure (invalid key / device limit / network): no settings written, specific error shown.

5a. **Bootstrap activation failure**: Simulate expired license in shared config → click Import → error shown, no settings written, UI unchanged.

5b. **Bootstrap device limit**: All 5 device slots occupied → click Import → specific device-limit error shown with link to license dashboard.

6. **Offline fallback**: Network disconnected → app starts normally from local `settings.json`, no errors.

7. **Uninstall**: Uninstall from either machine → shared folder untouched, local userData preserved.

8. **Docs**: "Multi-Machine Sync" listed as Supporter Edition on GitHub Pages; manual section has PREMIUM badge and setup steps.
