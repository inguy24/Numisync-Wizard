# Code-Splitting Plan: NumiSync Wizard Monolithic File Refactor

**Created:** 2026-02-17
**Status:** READY FOR IMPLEMENTATION
**Scope:** Split `src/main/index.js` (3,420 LOC) and `src/renderer/app.js` (7,756 LOC) into domain-focused files to reduce per-task AI context consumption.
**Prerequisite:** All 8 fixes in CONTEXT-BURN-REDUCTION-PLAN.md are complete.

---

## Why This Refactor

Every maintenance task on `index.js` or `app.js` currently forces reading thousands of lines to find a few hundred relevant ones. After this split:
- A licensing bug → read `src/main/ipc/licensing.js` (~650 lines) instead of `index.js` (3,420 lines)
- A search UI bug → read `src/renderer/ui-search.js` (~415 lines) instead of `app.js` (7,756 lines)
- **Zero behavior change** — pure organizational refactor

---

## Architectural Facts (Established During Planning)

### Main Process (`src/main/index.js`)
- **Runtime:** Node.js CommonJS — `require()` throughout, no bundler needed
- **Pattern to use:** Each domain file exports `register(ipcMain, state)` which registers its handlers and receives shared singletons by reference
- **Existing structure:** `#region`/`#endregion` markers already define exact split boundaries
- **57 IPC handlers** across 13 semantically distinct domains

**Shared state object** (passed by reference to all domain files — mutations visible everywhere):
```javascript
const state = {
  db,               // OpenNumismatDB | null — database access, used in 15+ handlers
  settingsManager,  // SettingsManager | null — collection-level settings
  progressTracker,  // ProgressTracker | null — enrichment progress cache
  mainWindow,       // BrowserWindow | null — window reference for dialogs/sends
  typeDataCache,    // Map — in-memory Numista type data cache
  apiCache,         // ApiCache | null — lazy-initialized disk cache
  menuState,        // Object — tracks collectionLoaded, fastPricingMode, viewMode, etc.
  imageHandler,     // ImageHandler — image download instance
};
```

**Critical coupling points in index.js:**
- `db` is accessed in 30+ handlers — must remain in shared state
- `settingsManager` is accessed by data merge, batch ops, field mapping — must be in shared state
- `typeDataCache` is a Map cleared on collection load — shared state ensures cache coherence
- `menuState` is mutated by collection, licensing, and menu handlers — single shared object required
- `get-denomination-aliases` is `ipcMain.on` (synchronous, not `ipcMain.handle`) — keep in `index.js` because preload.js calls it with `ipcRenderer.sendSync()` during startup

### Renderer (`src/renderer/app.js`)
- **Runtime:** Browser (Electron renderer), plain `<script>` tags, global `window` scope
- **No bundler exists** and none is needed — adding `<script>` tags is sufficient
- **No module system** — all functions are global; extracted files share `window` scope with `app.js`
- **Key insight:** `AppState` is a global object referenced by 200+ functions. Since all `<script>` files share `window`, extracted files can reference `AppState` directly — zero coupling changes required
- **Load-order rule:** Functions are only called at runtime (not at script parse time), so script load order only matters for variable initialization, not for cross-file function calls. `AppState` must be defined before any function that reads it runs — it is initialized in `app.js` which loads last.

**Global variables in app.js (defined at file scope, accessible from all renderer files):**
- `AppState` — central state object (coins, currentCoin, settings, pagination, filterSort, fastPricingMode, etc.)
- `EULA_VERSION`, `EULA_CONTENT` — constants
- `UI_STRINGS` — from `ui-strings.js` (already extracted, loads first)

---

## Track 1: Split `src/main/index.js` (LOW RISK)

### Files to Create: `src/main/ipc/`

Each file follows the same pattern:
```javascript
// src/main/ipc/[domain].js
'use strict';
const SomeModule = require('../modules/some-module');

/**
 * @param {Electron.IpcMain} ipcMain
 * @param {object} state - Shared singleton state from index.js
 */
function register(ipcMain, state) {
  ipcMain.handle('channel-name', async (event, args) => {
    // handler body — reference state.db, state.mainWindow, etc.
  });
  // ... more handlers
}

module.exports = { register };
```

### Domain File Map

| File | IPC Channels | Approx Lines | Source Region in index.js |
|------|-------------|--------------|--------------------------|
| `src/main/ipc/collection.js` | `select-collection-file`, `load-collection`, `get-coins`, `get-coin-details`, `get-default-collection`, `set-default-collection` | ~270 | Lines 938–1138 (Database section) |
| `src/main/ipc/search.js` | `resolve-issuer`, `search-numista`, `manual-search-numista`, `get-numista-type`, `fetch-coin-data`, `fetch-pricing-for-issue`, `fetch-issue-data` | ~350 | Lines 1140–1394 (Search & Enrichment section) |
| `src/main/ipc/enrich.js` | `compare-fields`, `merge-data`, `update-coin-status`, `get-progress-stats` | ~300 | Lines 1396–1655 (Field Mapping & Progress sections) |
| `src/main/ipc/settings.js` | `get-app-settings`, `save-app-settings`, `get-settings`, `save-fetch-settings`, `save-ui-preference`, `reset-settings`, `save-currency`, `get-currency`, `get-statistics`, `increment-api-calls` | ~460 | Lines 1657–2114 (Settings section, partial) |
| `src/main/ipc/cache.js` | `get-cache-settings`, `set-cache-settings`, `browse-cache-directory`, `validate-cache-path`, `migrate-cache`, `clear-api-cache`, `get-monthly-usage`, `set-monthly-usage`, `set-monthly-usage-total` | ~250 | Lines 1754–1890, 3146–3210 |
| `src/main/ipc/field-mapping.js` | `get-field-mappings`, `save-field-mappings`, `get-available-sources`, `export-field-mappings`, `import-field-mappings` | ~140 | Lines 2295–2427 |
| `src/main/ipc/images.js` | `get-coin-images`, `download-and-store-images` | ~130 | Lines 2116–2245 |
| `src/main/ipc/licensing.js` | `get-supporter-status`, `validate-license-key`, `update-supporter-status`, `increment-lifetime-enrichments`, `get-lifetime-stats`, `clear-license`, `validate-license`, `deactivate-license`, `check-feature-access` | ~650 | Lines 2479–3131 (Licensing section) |
| `src/main/ipc/batch.js` | `create-backup-before-batch`, `fast-pricing-update`, `propagate-type-data` | ~320 | Lines 3133–3454 (Batch Operations section) |
| `src/main/ipc/utility.js` | `open-external`, `check-installer-eula-marker`, `check-for-updates`, `get-app-version`, `open-manual`, `get-recent-collections`, `clear-recent-collections`, `menu:update-state`, `export-log-file` | ~100 | Lines 2247–2293, 2429–2477, 3207–3231 |

### What Stays in `index.js` (~300 lines after split)

- All `require()` imports at top (lines 1–94)
- Singleton variable declarations: `let db`, `let settingsManager`, etc.
- `getApiCache()` helper and cache initialization (lines 62–93)
- `loadAppSettings()` and settings migration logic (lines 100–248)
- All window management code: `createWindow()`, `saveWindowState()`, `buildMenu()` (lines 271–866)
- `app.whenReady()`, `app.on('window-all-closed')`, `app.on('before-quit')` lifecycle events
- `get-denomination-aliases` synchronous `ipcMain.on` handler (keep here — preload uses `sendSync`)
- Registration calls at bottom:
  ```javascript
  const state = { db, settingsManager, progressTracker, mainWindow,
                  typeDataCache, apiCache, menuState, imageHandler };
  require('./ipc/collection').register(ipcMain, state);
  require('./ipc/search').register(ipcMain, state);
  require('./ipc/enrich').register(ipcMain, state);
  require('./ipc/settings').register(ipcMain, state);
  require('./ipc/cache').register(ipcMain, state);
  require('./ipc/field-mapping').register(ipcMain, state);
  require('./ipc/images').register(ipcMain, state);
  require('./ipc/licensing').register(ipcMain, state);
  require('./ipc/batch').register(ipcMain, state);
  require('./ipc/utility').register(ipcMain, state);
  ```

**Important:** The `state` object is passed by reference. When `index.js` sets `db = new OpenNumismatDB(...)` during collection load, the domain file's reference `state.db` reflects the change immediately — no re-passing needed.

---

## Track 2: Split `src/renderer/app.js` (PHASED)

### Phase 2A: Pure Utility Extraction (LOWEST RISK)

These functions have no `AppState` mutation and no IPC calls. Safe to extract as-is.

| New File | Functions | Approx Lines |
|----------|-----------|--------------|
| `src/renderer/ui-icons.js` | `getStatusIcon()`, `getStatusText()`, `getDataTypeIcons()`, `getDataTypeIcon()`, `getPricingIcon()`, `calculatePricingFreshness()` | ~140 |
| `src/renderer/coin-matching.js` | `normalizeCatalogNumber()`, `getCatalogSlotMapping()`, `countriesMatch()`, `findMatchingCoins()`, `categorizeMatchingCoins()` | ~60 |
| `src/renderer/filter-math.js` | `calculateFilterCounts()`, `updateFilterSummary()`, `getMostRecentTimestamp()`, `getPricingFreshnessScore()`, `getCompletionScore()` | ~95 |

**Script tag additions to `index.html`** (insert before the existing `app.js` tag):
```html
<script src="ui-strings.js"></script>    <!-- already exists — emoji-restricted -->
<script src="ui-icons.js"></script>       <!-- Phase 2A: new -->
<script src="coin-matching.js"></script>  <!-- Phase 2A: new -->
<script src="filter-math.js"></script>    <!-- Phase 2A: new -->
<script src="app.js"></script>            <!-- existing -->
```

### Phase 2B: Feature Area Extraction (MEDIUM RISK)

These files reference `AppState` and IPC — but since they share global scope, references work identically to when the code was inline in `app.js`.

| New File | Functions to Move | Approx Lines |
|----------|------------------|--------------|
| `src/renderer/ui-licensing.js` | `loadLicenseManagementDisplay()`, `performPeriodicLicenseValidation()`, `startPeriodicLicenseValidation()`, `checkFeatureAccess()`, `isPremiumFeatureAvailable()`, `requirePremiumFeature()`, `showUpgradeModal()`, `showLicensePromptModal()` | ~620 |
| `src/renderer/ui-eula.js` | `isEulaAccepted()`, `saveEulaAcceptance()`, `showEulaModal()`, `checkEulaOnStartup()` | ~185 |
| `src/renderer/ui-settings.js` | `loadSettingsScreen()`, `loadCacheLocationSettings()`, `loadMonthlyUsageForSettings()`, `loadDefaultCollectionDisplay()`, `handleCacheLocationChange()`, `showCacheCollisionModal()`, `showCacheLockedModal()`, `saveCacheLocationSettings()` | ~840 |
| `src/renderer/ui-search.js` | `searchForMatches()`, `buildSearchParams()`, `normalizeUnitForSearch()`, `buildCoreQuery()`, `buildMinimalQuery()`, `fetchAllSearchPages()`, `renderMatches()`, `calculateConfidence()`, `handleManualSearch()`, `resolveSearchCategory()` | ~415 |
| `src/renderer/ui-compare.js` | `handleMatchSelection()`, `showFieldComparison()`, `renderFieldComparison()`, `createDefaultSelection()`, `renderImageComparison()`, `handleImageDownload()`, `renderFetchMoreDataSection()`, `createFetchCard()`, `handleFetchIssueData()`, `handleFetchPricingData()`, `showIssuePicker()` | ~1,360 |
| `src/renderer/ui-batch.js` | `enterFastPricingMode()`, `exitFastPricingMode()`, `startFastPricingUpdate()`, `confirmFastPricingUpdate()`, `lockUIForBatch()`, `updateFpInlineProgress()`, `updateFastPricingCounts()`, `showFpCompleteModal()`, `checkFastPricingEligibility()`, `resetFastPricingProgress()`, `showBatchTypePropagationPrompt()`, `applyBatchTypePropagation()` | ~760 |

**Final `index.html` script tag order:**
```html
<script src="ui-strings.js"></script>      <!-- emoji-restricted — load first -->
<script src="ui-icons.js"></script>
<script src="coin-matching.js"></script>
<script src="filter-math.js"></script>
<script src="ui-licensing.js"></script>
<script src="ui-eula.js"></script>
<script src="ui-settings.js"></script>
<script src="ui-search.js"></script>
<script src="ui-compare.js"></script>
<script src="ui-batch.js"></script>
<script src="app.js"></script>             <!-- AppState init + DOMContentLoaded — load last -->
```

### What Stays in `app.js` (~1,200 lines after full split)

- `AppState` object declaration and initialization (global, referenced by all files)
- `EULA_VERSION` and `EULA_CONTENT` constants
- Screen navigation: `showScreen()`, `restoreCollectionScrollPosition()`
- Status/progress display: `showStatus()`, `showProgress()`, `showModal()`
- Collection list: `loadCollectionScreen()`, `loadCoins()`, `renderCoinList()`, `loadCoinImages()`, `handleCoinClick()`, `renderCurrentCoinInfo()`, `buildCoinDisplayLabel()`, `getImagePlaceholder()`
- Pagination orchestration: `applyFilters()`, `updatePaginationControls()`
- View mode: `setViewMode()`, `setStickyInfoBar()`, `saveViewState()`, `restoreViewState()`
- About dialog: `showAboutDialog()`, `showReportIssueDialog()`
- Image lightbox: `openImageLightbox()`, `closeImageLightbox()`, `attachLightbox()`
- Menu/update handlers: `handleMenuAction()`, `updateMenuState()`, `updateVersionBadge()`, `showStoreUpdateNotification()`, `showWhatsNewModal()`
- `DOMContentLoaded` init block and all event listener bindings (must remain in `app.js` — it wires the app together after all other scripts have loaded)

---

## Backup Strategy (Step 0 — Do Before Any Edits)

**No git repository exists** — manual backups are the only safety net.

**Backup location:** `_backup/code-split-originals/` at project root. This directory is OUTSIDE `src/` so electron-builder never packages it.

**Files to copy:**
```
src/main/index.js         →  _backup/code-split-originals/index.js
src/renderer/app.js       →  _backup/code-split-originals/app.js
src/renderer/index.html   →  _backup/code-split-originals/index.html
```

**Restore procedure:**
1. Copy `_backup/code-split-originals/index.js` → `src/main/index.js`
2. Copy `_backup/code-split-originals/app.js` → `src/renderer/app.js`
3. Copy `_backup/code-split-originals/index.html` → `src/renderer/index.html`
4. Delete `src/main/ipc/` directory (all new domain files)
5. Delete any new renderer files: `src/renderer/ui-icons.js`, `src/renderer/coin-matching.js`, `src/renderer/filter-math.js`, `src/renderer/ui-licensing.js`, `src/renderer/ui-eula.js`, `src/renderer/ui-settings.js`, `src/renderer/ui-search.js`, `src/renderer/ui-compare.js`, `src/renderer/ui-batch.js`
6. Run `npm start` to verify restore

**Mid-refactor checkpoint:** After Track 1 is verified working, create a checkpoint:
```
src/main/index.js  →  _backup/code-split-originals/index-post-track1.js
```

---

## Implementation Order & Safety Gates

| Step | Action | Risk | Smoke Test Gate |
|------|--------|------|-----------------|
| 0 | Create backups in `_backup/code-split-originals/` | None | Verify 3 files exist in backup dir |
| 1 | Track 1: Extract all 10 IPC domain files; update `index.js` to call `register()` | Low | Load collection, search a coin, apply enrichment, open settings |
| — | **Checkpoint backup** of new `index.js` after step 1 passes | — | — |
| 2 | Phase 2A: Extract `ui-icons.js`, `coin-matching.js`, `filter-math.js`; add 3 script tags | Lowest | Coin list renders with correct icons and status badges |
| 3 | Phase 2B: Extract `ui-licensing.js`; add script tag | Low | License entry, validation, feature-gating all work |
| 4 | Phase 2B: Extract `ui-eula.js`; add script tag | Low | EULA modal appears (simulate first-launch or clear acceptance) |
| 5 | Phase 2B: Extract `ui-settings.js`; add script tag | Medium | All settings tabs load; cache path change + migration works |
| 6 | Phase 2B: Extract `ui-search.js`; add script tag | Medium | Auto-search and manual search both return results |
| 7 | Phase 2B: Extract `ui-compare.js`; add script tag | Medium | Field comparison, issue picker, image download work end-to-end |
| 8 | Phase 2B: Extract `ui-batch.js`; add script tag | Medium | Fast pricing update runs and completes; batch propagation works |

---

## Post-Split Documentation Updates

After all steps pass smoke tests:

1. **`docs/reference/IPC-HANDLERS-QUICK-REF.md`** — Update the "Delegates To" column for each handler to reference the new `ipc/` file (e.g., `ipc/licensing.js`) instead of `index.js`

2. **`CLAUDE.md` QUICK CONTEXT** — Update file descriptions:
   - `src/main/index.js` → `~300 LOC, lifecycle + menu only; IPC handlers in src/main/ipc/ (10 files)`
   - `src/renderer/app.js` → `~1,200 LOC` + list new renderer files

3. **`docs/CHANGELOG.md`** — Add entry documenting the split with date and files created

4. **Add a lesson to CLAUDE.md §5** if any unexpected coupling is discovered during implementation

---

## What Is NOT Changing

- No bundler added — plain Node.js `require()` and plain `<script>` tags
- No module system in renderer — global scope preserved throughout
- `AppState` stays global in `app.js` — no state management library
- No IPC channel names or signatures change
- `src/modules/` files are untouched
- `src/renderer/ui-strings.js` is untouched (still emoji-restricted — Python binary ops only)
- `src/main/preload.js` is untouched
- electron-builder config is untouched (new `src/main/ipc/*.js` files are automatically included by the existing `src/**/*` glob)
