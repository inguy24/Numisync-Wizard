# Implementation Plan: Use Stored Numista ID (Skip Re-Search)

**Status:** Approved
**Type:** Feature + Bug Fix
**Touches:** settings-manager.js, index.html, app.js, user-manual.html, CHANGELOG.md

---

## Problem Being Solved

Every time a user opens a coin for enrichment, `handleCoinClick()` (app.js:2912) unconditionally calls `searchForMatches()`, burning 1 Numista search API call. This is wasteful when the Numista type ID is already known:

- **Case A:** User previously enriched basicData — `numistaId` is stored in `coin.metadata.basicData.numistaId` (written to the DB note field by `merge-data` at index.js:1574)
- **Case B:** User manually entered the Numista ID in their OpenNumismat catalog field (e.g., `coin.catalognum4 = "12345"`) before ever using NumiSync

In both cases, the Numista `/types/search` endpoint is unnecessary. We can call `GET /types/{id}` directly, skipping the search entirely.

**Bonus fix:** The "Search Again" button on the match screen (`id="searchAgainBtn"`, index.html:290) has never had an event listener — it doesn't work at all. We wire it up as part of this work.

---

## Architecture Context

### Where the Numista ID Lives

**Source 1 — Enrichment metadata** (reliable, integer):
```
coin.metadata.basicData.numistaId
```
Populated only after `merge-data` completes. `get-coins` IPC parses this from the note field JSON and attaches it as `coin.metadata`.

**Source 2 — Catalog field** (string, requires parseInt):
```
coin[AppState.numistaIdColumn]   // e.g. coin.catalognum4
```
`AppState.numistaIdColumn` = whichever `catalognum1–4` has `sourceKey === 'numista_id'` in the active field mapping. Default is `catalognum4` (default-field-mapping.js:697–708). User can remap it. Must be determined at collection load time.

### Field Mapping System
- `settingsManager.getFieldMappings()` returns `{ catalognum4: { enabled, sourceKey, catalogCode, ... }, ... }` keyed by OpenNumismat column name
- Find the Numista ID column: `Object.entries(fieldMappings).find(([, cfg]) => cfg.sourceKey === 'numista_id')`
- IPC: `window.electronAPI.getFieldMappings()` → `{ success, fieldMappings, sources }`

### IPC Handlers Used (No Changes to Main Process)

| IPC Channel | Preload Method | Used For |
|---|---|---|
| `get-field-mappings` | `window.electronAPI.getFieldMappings()` | Find which catalognum = numistaId |
| `get-numista-type` | `window.electronAPI.getNumistaType(typeId)` | Fetch type data for card display |
| `fetch-coin-data` | `window.electronAPI.fetchCoinData({typeId, coin})` | Full enrichment when user clicks card |

`get-numista-type` (index.js:1278) calls `api.getType(typeId)` which stores result in **persistent API cache** (`cacheKey = 'type:{typeId}:en'`). When `fetch-coin-data` later calls `api.fetchCoinData()` → `api.getType()`, it gets a **cache hit → 0 extra API calls**.

### getType() Response — Image Fields
The `/types/{id}` response has nested image objects (NOT flat like search results):
```js
result.typeData.obverse.thumbnail  // 180px URL
result.typeData.reverse.thumbnail  // 180px URL
result.typeData.edge?.thumbnail    // 180px URL (optional)
```
Search results have flat `obverse_thumbnail`, `reverse_thumbnail`. When adapting type data to a match-card shape, extract from the nested structure.

### Existing Match Card Rendering (renderMatches — app.js:3322)
Cards use: `match.obverse_thumbnail`, `match.reverse_thumbnail` (falls back to `getImagePlaceholder('obverse/reverse')` if null), `match.title`, `match.issuer.name`, `match.min_year`, `match.max_year`, `match.object_type?.name || match.category?.name`, `match.id`.

Confidence badge: `calculateConfidence(coin, match)` already returns 100 when `coin.metadata?.basicData?.numistaId === match.id` (app.js:3515–3518). For catalog-field-only coins, `resolveNumistaId()` result equals `match.id` — see note below.

> **Note on 100% confidence for catalog-only coins:** `calculateConfidence()` checks `coin.metadata?.basicData?.numistaId`. If the ID came from the catalog field (no metadata), the score won't auto-return 100 — it will score by title/year/country like any other match. Since we're only ever showing this one card, the score is still the highest (and only) result, but the badge may not show 100%. This is acceptable; we can note it in the status message instead.

### Settings Pattern (mirrors enableAutoPropagate exactly)

**settings-manager.js defaults object (~line 97–104):**
```js
fetchSettings: {
  basicData: true,
  issueData: false,
  pricingData: false,
  searchCategory: 'all',
  emptyMintmarkInterpretation: 'no_mint_mark',
  enableAutoPropagate: true,
  useStoredNumistaId: true,   // ← ADD THIS
}
```

**setFetchSettings() (~line 335–345) — add one ternary:**
```js
setFetchSettings(fetchSettings) {
  this.settings.fetchSettings = {
    basicData: ...,
    issueData: ...,
    pricingData: ...,
    searchCategory: ...,
    emptyMintmarkInterpretation: ...,
    enableAutoPropagate: fetchSettings.enableAutoPropagate !== undefined
      ? fetchSettings.enableAutoPropagate : this.settings.fetchSettings.enableAutoPropagate,
    useStoredNumistaId: fetchSettings.useStoredNumistaId !== undefined   // ← ADD
      ? fetchSettings.useStoredNumistaId : this.settings.fetchSettings.useStoredNumistaId,
  };
  this.saveSettings();
}
```

`mergeWithDefaults()` spread pattern automatically backfills the new field for existing collections.

---

## Implementation Steps

### STEP 1 — settings-manager.js

File: `src/modules/settings-manager.js`

1a. Add `useStoredNumistaId: true` to the `fetchSettings` defaults object (~line 103).

1b. Add the ternary for `useStoredNumistaId` inside `setFetchSettings()` (~line 342), following the exact same pattern as `enableAutoPropagate` on the line above it.

---

### STEP 2 — index.html (Data Settings Modal)

File: `src/renderer/index.html`

Add a new `data-setting-card` div **immediately after** the `enableAutoPropagate` card block (~line 950). Copy the structure of the `enableAutoPropagate` card exactly:

```html
<!-- Use Stored Numista ID Toggle -->
<div class="data-setting-card">
  <div class="data-setting-header">
    <label class="checkbox-label">
      <input type="checkbox" id="useStoredNumistaId" checked>
      <strong>Use Stored Numista ID</strong>
    </label>
  </div>
  <div class="data-setting-details">
    <p class="data-description">
      When enabled, coins with a known Numista ID (from a previous merge or entered manually
      in your catalog field) skip the search step and load the matched coin directly,
      saving 1 API call per enrichment session.
    </p>
    <ul class="data-fields-list">
      <li>Checks enrichment metadata first, then your mapped Numista catalog field</li>
      <li>Shows the previously matched coin on the match screen for your confirmation</li>
      <li>Falls back to search automatically if the stored ID is no longer valid on Numista</li>
      <li>Disable if you prefer to always re-confirm matches from fresh search results</li>
    </ul>
  </div>
</div>
```

---

### STEP 3 — app.js (main work)

File: `src/renderer/app.js`

#### 3a. Fix "Search Again" button — missing listener (~line 4880 area)

Find where `backToListBtn` and `skipCoinBtn` listeners are attached (around line 4880–4900). Add immediately after them:

```js
const searchAgainBtn = document.getElementById('searchAgainBtn');
if (searchAgainBtn) {
  searchAgainBtn.addEventListener('click', () => {
    AppState.currentMatches = [];
    searchForMatches();
  });
}
```

`AppState.currentMatches = []` clears any direct-match card state before the fresh search populates results.

#### 3b. Add `resolveNumistaId(coin)` helper

Insert near `calculateConfidence()` (around line 3513) or just before `searchForMatches()` (~line 3086):

```js
/**
 * Resolve the Numista type ID for a coin from enrichment metadata
 * or the catalog field mapped to the numista_id source key.
 * Returns an integer typeId, or null if not known.
 * @param {Object} coin - Coin from get-coins (has .metadata attached)
 * @returns {number|null}
 */
function resolveNumistaId(coin) {
  // Priority 1: enrichment metadata (set by NumiSync after merge — reliable integer)
  const metaId = coin.metadata?.basicData?.numistaId;
  if (metaId) return metaId;

  // Priority 2: catalog field mapped to numista_id source key (manually pre-populated)
  if (AppState.numistaIdColumn) {
    const raw = coin[AppState.numistaIdColumn];
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  }
  return null;
}
```

#### 3c. Cache `AppState.numistaIdColumn` at collection load

Find the collection-load success path — the code that runs after `load-collection` IPC returns success and shows the collection screen. Add:

```js
// Cache which catalog column is mapped to the Numista ID source key
try {
  const fmResult = await window.electronAPI.getFieldMappings();
  if (fmResult.success) {
    const entry = Object.entries(fmResult.fieldMappings)
      .find(([, cfg]) => cfg.sourceKey === 'numista_id');
    AppState.numistaIdColumn = entry ? entry[0] : null;
  }
} catch (e) {
  AppState.numistaIdColumn = null;
}
```

#### 3d. Add `showDirectMatch(coin, typeId)` function

Insert adjacent to `searchForMatches()` (~line 3086). Full function:

```js
/**
 * Show the match screen with the previously stored Numista type pre-selected.
 * Calls GET /types/{typeId} directly (no search). Falls back to searchForMatches()
 * if the stored ID is invalid (404) or any other error occurs.
 * @param {Object} coin - AppState.currentCoin
 * @param {number} typeId - Resolved Numista type ID from resolveNumistaId()
 */
async function showDirectMatch(coin, typeId) {
  document.getElementById('searchStatus').textContent = 'Loading stored match...';

  try {
    const result = await window.electronAPI.getNumistaType(typeId);

    if (!result.success) {
      const isNotFound = result.error && result.error.toLowerCase().includes('not found');
      log.warn(`[Direct Match] Stored numistaId ${typeId} lookup failed (${result.error}) — falling back to search`);
      showStatus(
        isNotFound
          ? 'Previously matched coin no longer found on Numista. Searching again...'
          : `Could not load stored match: ${result.error}. Searching again...`
      );
      document.getElementById('searchStatus').textContent = 'Searching...';
      await searchForMatches();
      return;
    }

    // Adapt type data to the shape renderMatches() expects
    const typeData = result.typeData;
    const adaptedMatch = {
      id: typeData.id,
      title: typeData.title,
      issuer: typeData.issuer,
      min_year: typeData.min_year,
      max_year: typeData.max_year,
      category: typeData.category,
      object_type: typeData.object_type,
      // Extract 180px thumbnails from nested structure (same quality as search results)
      obverse_thumbnail: typeData.obverse?.thumbnail || null,
      reverse_thumbnail: typeData.reverse?.thumbnail || null,
      edge_thumbnail: typeData.edge?.thumbnail || null,
    };

    // Render single pre-selected card using existing renderMatches() infrastructure
    AppState.currentMatches = [adaptedMatch];
    renderMatches();

    // Apply pre-selected state after render
    const firstCard = document.querySelector('.match-card[data-match-index="0"]');
    if (firstCard) firstCard.classList.add('selected');

    showStatus('Previously matched coin loaded. Click the card to proceed, or Search Again to find a different match.');
    document.getElementById('searchStatus').textContent = 'Stored match found';

  } catch (error) {
    log.error('[Direct Match] Unexpected error:', error);
    showStatus('Error loading stored match. Searching again...');
    document.getElementById('searchStatus').textContent = 'Searching...';
    await searchForMatches();
  }
}
```

**Why the existing `handleMatchSelection(0)` works when user clicks the card:**
- `AppState.currentMatches[0]` = `adaptedMatch` (has `obverse_thumbnail` from type data)
- `handleMatchSelection()` calls `fetchCoinData({ typeId: adaptedMatch.id, coin })`
- `fetchCoinData` → `api.getType()` gets a **persistent cache hit** (populated by `getNumistaType` above) → 0 extra API calls
- The thumbnail copy logic at lines 3675–3681 runs: `result.basicData.obverse_thumbnail = searchResult.obverse_thumbnail` where `searchResult` = `adaptedMatch` → thumbnails propagate correctly
- `calculateConfidence(coin, adaptedMatch)` returns 100 for metadata-sourced IDs (existing check at line 3515–3518); for catalog-only coins it scores by normal heuristics but the card is still the only result shown

#### 3e. Modify `handleCoinClick()` (~line 2912)

`showScreen('match')` and `renderCurrentCoinInfo()` stay unchanged. Replace only the status + `searchForMatches()` tail:

```js
// BEFORE (remove these two lines):
showStatus(`Searching for ${coin.title || 'coin'}...`);
await searchForMatches();

// AFTER (replace with):
const storedNumistaId = resolveNumistaId(coin);
if (storedNumistaId) {
  // Only read settings when a stored ID exists (skips IPC call for unmatched coins)
  const settings = await window.api.getSettings();
  if (settings.fetchSettings.useStoredNumistaId !== false) {
    showStatus('Loading previously matched coin...');
    await showDirectMatch(coin, storedNumistaId);
    return;
  }
}
showStatus(`Searching for ${coin.title || 'coin'}...`);
await searchForMatches();
```

#### 3f. `populateSettings()` (~line 6722)

Add after the `enableAutoPropagate` block (same `!== false` pattern):

```js
const useStoredIdCheckbox = document.getElementById('useStoredNumistaId');
if (useStoredIdCheckbox) {
  useStoredIdCheckbox.checked = fetchSettings.useStoredNumistaId !== false;
}
```

#### 3g. `saveSettings()` (~line 6779)

Add after the `enableAutoPropagate` read (~line 6781):

```js
const useStoredNumistaIdCheckbox = document.getElementById('useStoredNumistaId');
const useStoredNumistaId = useStoredNumistaIdCheckbox ? useStoredNumistaIdCheckbox.checked : true;
```

Add `useStoredNumistaId` to the `newSettings` object (~line 6783).

Also add at the end of `saveSettings()` (after `window.api.saveFetchSettings(newSettings)` succeeds), to refresh the cached column if the user changes their field mapping via the Data Settings tab:

```js
try {
  const fmResult = await window.electronAPI.getFieldMappings();
  if (fmResult.success) {
    const entry = Object.entries(fmResult.fieldMappings)
      .find(([, cfg]) => cfg.sourceKey === 'numista_id');
    AppState.numistaIdColumn = entry ? entry[0] : null;
  }
} catch (e) { /* non-critical */ }
```

---

### STEP 4 — user-manual.html

File: `src/resources/user-manual.html`

Add a new subsection inside the "Data Settings" section. Content to cover:
- **What it does:** Coins with a known Numista ID skip the search step and load the previously matched coin directly
- **Where the ID comes from:** Two sources — prior enrichment metadata, OR a Numista ID you entered manually in your catalog field
- **What you see:** The match screen shows a single pre-selected card for that coin; click it to proceed to field comparison
- **API savings:** 1 search call saved per re-enrichment session (e.g., going back to add issue data or pricing to an already-matched coin)
- **Automatic fallback:** If the stored ID is no longer valid on Numista (coin renumbered/removed), search runs automatically
- **Search Again:** The "Search Again" button lets you ignore the stored ID and find a different match at any time
- **When to disable:** If stored IDs may be inaccurate and you prefer to always re-confirm matches from fresh search results

---

### STEP 5 — docs/CHANGELOG.md

Prepend two rows to `## v{current-version} *(unreleased)*`:

```
| {date} | Feature | src/modules/settings-manager.js, src/renderer/app.js, src/renderer/index.html, src/resources/user-manual.html | **Use Stored Numista ID — skip search for previously matched coins** — Adds "Use Stored Numista ID" toggle (default ON) in Data Settings. When enabled, coins with a known Numista type ID — from a prior NumiSync merge (metadata) or manually entered in the mapped Numista catalog field — skip the /types/search call and load the matched coin directly via GET /types/{id}, saving 1 API call per re-enrichment session. The match screen shows the stored coin as a pre-selected card; clicking it proceeds to field comparison via the normal handleMatchSelection() flow; "Search Again" overrides it for the session. Falls back to search on 404 or any error. |

| {date} | Fix | src/renderer/app.js | **"Search Again" button on match screen had no event listener and never worked** — Added missing click listener that resets AppState.currentMatches and calls searchForMatches(). |
```

---

## Edge Cases & Error Handling

| Scenario | Behaviour |
|---|---|
| No numistaId in metadata AND no value in catalog field | Normal `searchForMatches()` |
| `useStoredNumistaId` setting is OFF | Normal `searchForMatches()` |
| `AppState.numistaIdColumn` is null (no field mapped to numista_id) | Only metadata is checked; catalog lookup skipped |
| Catalog field has non-numeric / garbage value | `parseInt` returns NaN → treated as null → search |
| Numista returns 404 for stored ID (type deleted/renumbered) | "Not found" status + fall back to search |
| Any other API or network error | Error status + fall back to search |
| User clicks "Search Again" on direct-match card | `searchForMatches()` runs; if user selects a different match, `merge-data` overwrites old numistaId |
| `calculateConfidence()` for metadata-sourced ID | Returns 100 (line 3515–3518 check) — "100% match" badge |
| `calculateConfidence()` for catalog-field-only coin | Normal heuristic scoring (no 100% shortcut); still highest/only result shown |
| No `obverse.thumbnail` in type data | `getImagePlaceholder('obverse')` fallback — gray "OBV" placeholder, same as any missing-image card |
| User remaps catalog column away from numista_id | `AppState.numistaIdColumn` updates on next collection load or after saving Data Settings |

---

## Verification Checklist

1. **Direct path — metadata:** Open a coin with `basicData.status = MERGED`. Confirm `main.log` has `[Direct Match]` (no search log), match screen shows pre-selected card with correct title/images, clicking card proceeds to comparison.
2. **Direct path — catalog field only:** Set `catalognum4` to a valid Numista ID on a coin with no enrichment metadata. Confirm direct path fires and card loads.
3. **Setting OFF:** Toggle `useStoredNumistaId` OFF in Data Settings, re-open a matched coin — confirm normal search runs.
4. **404 fallback:** Edit a coin's note field to set a bogus numistaId. Confirm "not found" status + search fallback.
5. **Search Again button:** Open any coin on the match screen and click "Search Again" — confirm fresh search runs (was broken before).
6. **Search Again from direct card:** Open direct-match card, click "Search Again", select a different match — confirm new numistaId stored.
7. **Persistent cache — no double API call:** After `showDirectMatch` loads card, click it — `main.log` should show cache hit for type data, not a second network request.
8. **Catalog column remapping:** Change `catalognum4` source in Data Settings → confirm `AppState.numistaIdColumn` updates and old column no longer queried.
