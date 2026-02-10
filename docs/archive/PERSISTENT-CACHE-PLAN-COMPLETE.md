# Persistent API Cache, Search Simplification, and Monthly Usage Tracking

**Status:** IMPLEMENTED AND VERIFIED — All changes applied Feb 8, 2026. Code audit completed Feb 9, 2026.

## Context

Numista free accounts have a **2,000 API calls/month quota** counting against `searchTypes`, `getType`, `getTypeIssues`, `getIssuePricing`, and `getIssuers`. Currently all API responses are cached only in-memory per NumistaAPI instance, and since index.js creates a **new instance** for 7 of 8 IPC handlers, those caches are thrown away immediately. The issuers list (stable data) costs 1 API call on every app launch. Type and issue data are re-fetched across sessions even though they rarely change.

The search flow has a redundant Strategy 2 (strip parentheticals as a separate retry) that burns an extra API call — parentheticals should be stripped before the first search.

Users need visibility into their monthly quota usage and control over cache durations.

---

## Change 1: Strip Parentheticals Upfront — VERIFIED

**File: `src/renderer/app.js`**

### 1a. Modify `buildSearchParams()` (~line 3000) — VERIFIED
- ~~At line 3007: Apply `stripParenthetical()` to `coin.title` before adding to query~~ Done at line 3187
- ~~At line 3049: Apply `stripParenthetical()` to `coin.country` before passing to `resolveIssuer`~~ Done at lines 3190, 3224

### 1b. Remove Strategy 2 from `searchForMatches()` (lines 2886-2901) — VERIFIED
- ~~Delete the entire "Strategy 2: Remove parenthetical content if no results" block~~ Done
- ~~Renumber Strategy 3 → 2, Strategy 4 → 3 in comments~~ Done — now 4 strategies: 1 (full), 2 (core), 3 (minimal), 4 (alt forms)

**Result:** Worst-case search drops from 4 API calls to 3. Parenthetical cases (e.g., "Germany (Nazi)") resolve on the first search attempt.

---

## Change 2: Persistent Disk Cache — VERIFIED

### 2a. Create `src/modules/api-cache.js` (new file) — VERIFIED

**Location:** App-wide cache at `app.getPath('userData')/numista_api_cache.json` — issuers/types/issues are global Numista catalog data, not collection-specific.

**Class: `ApiCache`**
- `constructor(cacheFilePath)` — loads JSON from disk (or empty if missing/corrupt), prunes expired entries on load
- `get(key)` — returns data if exists and not expired, else `null`
- `set(key, data, ttl)` — stores `{ data, cachedAt, ttl }`, saves to disk
- `has(key)` — checks if non-expired entry exists
- `prune()` — removes expired entries
- `clear()` — wipes all entries
- `getStats()` — returns entry count, size info

**Disk format:**
```json
{
  "version": "1.0",
  "entries": {
    "issuers:all": { "data": [...], "cachedAt": 1706000000000, "ttl": 7776000000 }
  },
  "monthlyUsage": {
    "2026-02": { "searchTypes": 291, "getType": 164, "getIssues": 164, "getPrices": 166, "getIssuers": 40 }
  }
}
```

**Follow existing persistence pattern** from `settings-manager.js` (lines 138-153, 223-232): `fs.readFileSync`/`fs.writeFileSync`, UTF-8 JSON, 2-space indent, try/catch with graceful fallback to empty structure.

**Null handling:** Do NOT persist `null` issuer code resolutions — the issuers list itself is cached, so re-resolving only costs local fuzzy matching, not an API call.

### 2b. Modify `src/modules/numista-api.js` — VERIFIED

**Constructor** (~line 78): Add optional `persistentCache = null` second parameter.

**Add local TTL constant defaults** at module level (avoids coupling to api-cache.js):
```js
const DEFAULT_CACHE_TTL = {
  ISSUERS: 90 * 24 * 60 * 60 * 1000,      // 90 days
  ISSUER_CODE: 90 * 24 * 60 * 60 * 1000,   // 90 days
  TYPE_DATA: 30 * 24 * 60 * 60 * 1000,     // 30 days
  ISSUES_DATA: 30 * 24 * 60 * 60 * 1000    // 30 days
};
```

These defaults are overridden by user settings (see Change 4). The constructor should also accept a `cacheTTLs` object parameter so index.js can pass in user-configured values.

**Modify these methods** — check persistent cache between in-memory miss and API call, write to persistent cache after fetch:
- `getIssuers()` (~line 616) — uses ISSUERS TTL
- `resolveIssuerCode()` (~line 638) — uses ISSUER_CODE TTL (skip null results)
- `getType()` (~line 203) — uses TYPE_DATA TTL
- `getTypeIssues()` (~line 223) — uses ISSUES_DATA TTL

**DO NOT add persistent caching to:**
- `searchTypes()` — search results are situational, session-only
- `getIssuePricing()` — pricing freshness is the whole point, session-only

**Pattern for each method:**
1. Check `this.cache` (in-memory) → return if hit
2. Check `this.persistentCache` → if hit, promote to in-memory + return
3. Make API call → write to both caches

**Also:** Modify `request()` method (~line 119) to return response metadata (the endpoint called) so index.js can track which endpoint was called for monthly usage counting. Alternatively, have each method that calls `request()` report what was called — simplest approach is to have the `request()` method call a callback/emit when a real API call is made.

### 2c. Modify `src/main/index.js` — VERIFIED

**Import** `ApiCache` from `../modules/api-cache` (~line 29)

**Add lazy-init helper** (after `typeDataCache` at line 47):
```js
let apiCache = null;
function getApiCache() {
  if (!apiCache) {
    apiCache = new ApiCache(path.join(app.getPath('userData'), 'numista_api_cache.json'));
  }
  return apiCache;
}
```
Lazy because `app.getPath()` requires `app.whenReady()`.

**Update all 8 `new NumistaAPI()` calls** to pass `getApiCache()` and user-configured TTLs:
- Line 835 (`resolve-issuer`)
- Line 857 (`search-numista`)
- Line 880 (`manual-search-numista`)
- Line 909 (`get-numista-type`)
- Line 926 (`fetch-coin-data`)
- Line 1010 (`fetch-pricing-for-issue`)
- Line 1039 (`fetch-issue-data`)
- Line 2537 (`fast-pricing-update`)

### 2d. Keep existing `typeDataCache` as-is — VERIFIED

The `typeDataCache` Map in index.js serves session-level silent reuse in `fetch-coin-data` (skips the entire orchestration call). The persistent cache handles `getType()` level caching. Both are needed — different purposes.

---

## Change 3: Monthly Usage Tracking — VERIFIED

### 3a. Add monthly usage tracking to `ApiCache` — VERIFIED

The `monthlyUsage` section of the cache file tracks calls per endpoint per calendar month:
```json
"monthlyUsage": {
  "2026-02": { "searchTypes": 291, "getType": 164, "getIssues": 164, "getPrices": 166, "getIssuers": 40 }
}
```

**New methods on `ApiCache`:**
- `incrementUsage(endpoint)` — increments count for current month + endpoint, saves
- `getMonthlyUsage()` — returns current month's totals `{ searchTypes, getType, getIssues, getPrices, getIssuers, total }`
- `getMonthlyLimit()` — returns stored monthly limit (default 2000, user-configurable)
- `setMonthlyLimit(limit)` — stores user's monthly limit

### 3b. Track actual API calls in IPC handlers (index.js) — VERIFIED

Each IPC handler that makes Numista API calls already calls `progressTracker.incrementSessionCalls(count)`. Add corresponding `getApiCache().incrementUsage(endpointName)` calls at the same points:

| IPC Handler | Endpoint(s) Called | Lines |
|-------------|-------------------|-------|
| `search-numista` | searchTypes | ~863 |
| `manual-search-numista` | searchTypes | ~894 |
| `get-numista-type` | getType | ~912 |
| `fetch-coin-data` | getType, getIssues, getPrices (conditional) | ~969-993 |
| `fetch-pricing-for-issue` | getPrices | ~1020 |
| `fetch-issue-data` | getIssues | ~1044 |
| `fast-pricing-update` | getPrices | ~2540 |
| `resolve-issuer` | getIssuers (first call only) | ~839 |

**Important:** Only increment when an actual API call is made (not a cache hit). The persistent cache check happens inside NumistaAPI methods. We need a way to know if the API was actually called. Approach: have each modified NumistaAPI method set a flag or return metadata indicating cache hit vs API call, OR have `request()` call `this.persistentCache.incrementUsage(endpoint)` directly since `request()` is only reached when no cache hit occurred.

**Cleanest approach:** Have `request()` in numista-api.js call `this.persistentCache.incrementUsage(endpointName)` whenever it makes a real HTTP call. This way usage tracking is automatic and accurate — it only counts when the network is actually hit. The `endpoint` parameter is already passed to `request()`, so we can derive the endpoint name from it (`/types` → searchTypes, `/types/{id}` → getType, etc.).

### 3c. Add IPC handler for getting monthly usage — VERIFIED

New IPC handler in index.js:
```js
ipcMain.handle('get-monthly-usage', async () => {
  const cache = getApiCache();
  return { success: true, usage: cache.getMonthlyUsage(), limit: cache.getMonthlyLimit() };
});
```

Add to preload.js bridge.

### 3d. Add monthly usage display to footer (index.html + app.js) — VERIFIED

**Current footer-right** (index.html line 530-534):
```html
<div class="footer-right">
  <span id="fetchSettingsText">Fetch: Basic (2 calls)</span>
  <span class="separator">•</span>
  <span id="sessionCallsText">Session: 0 calls</span>
</div>
```

**Updated to add monthly tracker:**
```html
<div class="footer-right">
  <span id="fetchSettingsText">Fetch: Basic (2 calls)</span>
  <span class="separator">•</span>
  <span id="sessionCallsText">Session: 0</span>
  <span class="separator">•</span>
  <span id="monthlyUsageText">Month: 0/2,000</span>
</div>
```

**In app.js:** Update `refreshSessionCounter()` (~line 6185) to also fetch and display monthly usage. Color the monthly text based on usage percentage:
- Default color when < 75%
- Warning (orange/yellow) at 75-90%
- Critical (red) at > 90%

---

## Change 4: User-Configurable Cache TTLs in App Settings — VERIFIED

### 4a. Add cache settings section to App Settings (index.html) — VERIFIED

New `setting-group` after "Search Settings" (line 416), before "Image Handling" (line 418):

```html
<div class="setting-group">
  <h3>API Cache</h3>
  <p class="setting-help">
    Cache Numista API responses locally to reduce API calls against your monthly quota.
    Longer durations use fewer API calls but may show slightly stale data.
  </p>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
    <label>Issuers (countries):</label>
    <select id="cacheTtlIssuers">
      <option value="0">No caching</option>
      <option value="30">30 days</option>
      <option value="60">60 days</option>
      <option value="90" selected>90 days (recommended)</option>
      <option value="120">120 days</option>
      <option value="150">150 days</option>
      <option value="180">180 days</option>
      <option value="210">210 days</option>
      <option value="240">240 days</option>
      <option value="270">270 days</option>
      <option value="300">300 days</option>
      <option value="330">330 days</option>
      <option value="360">360 days</option>
    </select>
    <label>Type data (coin specs):</label>
    <select id="cacheTtlTypes">
      <!-- same options, default 30 days -->
    </select>
    <label>Issue data (mintage, mintmarks):</label>
    <select id="cacheTtlIssues">
      <!-- same options, default 30 days -->
    </select>
  </div>
  <div style="margin-top: 10px;">
    <label>Monthly API call limit:</label>
    <input type="number" id="monthlyApiLimit" value="2000" min="100" max="100000" step="100">
    <p class="setting-help">
      Free Numista accounts have a 2,000 call/month limit. Change this if you have a premium API plan.
    </p>
  </div>
  <button id="clearApiCacheBtn" class="btn btn-secondary" style="margin-top: 10px;">
    Clear API Cache
  </button>
</div>
```

### 4b. Persist cache settings in App Settings (app.js + index.js) — VERIFIED

Cache TTL settings are stored in App Settings (Phase 1 settings, `get-app-settings`/`save-app-settings`) because they're app-wide, not collection-specific.

**In `loadSettingsScreen()` (~line 4874):** Load cache TTL values from `AppState.settings`.

**In save handler (~line 5007):** Include cache TTL values in the settings object:
```js
settings.cacheTtlIssuers = parseInt(document.getElementById('cacheTtlIssuers').value);
settings.cacheTtlTypes = parseInt(document.getElementById('cacheTtlTypes').value);
settings.cacheTtlIssues = parseInt(document.getElementById('cacheTtlIssues').value);
settings.monthlyApiLimit = parseInt(document.getElementById('monthlyApiLimit').value) || 2000;
```

**In index.js:** When creating NumistaAPI instances, read cache TTLs from app settings and pass to constructor. When `cacheTtl*` is 0, that data type is not cached (equivalent to "No caching" option).

### 4c. Clear API Cache button — VERIFIED

Wire `clearApiCacheBtn` to a new IPC handler:
```js
ipcMain.handle('clear-api-cache', async () => {
  getApiCache().clear();
  return { success: true };
});
```

### 4d. Manual usage adjustment + Numista dashboard link — VERIFIED

Add to the API Cache settings group (below the monthly limit input):

- **"Current month usage" input field** — pre-populated with locally tracked total, editable so users can manually adjust to match their actual Numista dashboard
- **Link to Numista API dashboard** — `https://en.numista.com/api/dashboard.php` opens in external browser so users can cross-reference
- **Help text** explaining: "Usage is tracked locally and may not reflect API calls made by other applications using the same key. Visit the Numista dashboard to verify your actual usage and update this number if needed."

New IPC handler:
```js
ipcMain.handle('set-monthly-usage', async (event, total) => {
  const cache = getApiCache();
  cache.setMonthlyUsageTotal(total);
  return { success: true };
});
```

Add `setMonthlyUsageTotal(total)` method to ApiCache that distributes the total across existing endpoint proportions (or just sets a flat total field).

---

## Change 5: User Manual Update — VERIFIED

**File: `docs/user-manual.html`**

Add new section documenting:

1. **API Cache** — explains that Numista responses are cached locally to reduce API calls, with configurable TTLs per data type
2. **Monthly Usage Tracking** — explains the footer counter, that it tracks locally, and how to verify against Numista's dashboard
3. **Cache Settings** — documents each setting (Issuers TTL, Type Data TTL, Issue Data TTL, Monthly Limit, Clear Cache, Manual Usage Adjustment)
4. **Numista API Quota** — explains the 2,000 calls/month free limit, what counts as a call (searchTypes, getType, getIssues, getPrices, getIssuers), and how caching helps conserve quota
5. **Dashboard link** — directs users to `https://en.numista.com/api/dashboard.php` to view their actual server-side usage

---

## Files Modified

| File | Action |
|------|--------|
| `src/modules/api-cache.js` | **NEW** — persistent cache + monthly usage tracking |
| `src/modules/numista-api.js` | Add `persistentCache` param, modify 4 methods, add usage tracking in `request()` |
| `src/main/index.js` | Import ApiCache, add `getApiCache()`, update 8 instantiation points, add IPC handlers |
| `src/main/preload.js` | Add bridge for `get-monthly-usage`, `set-monthly-usage`, `clear-api-cache` |
| `src/renderer/index.html` | Add cache settings group to App Settings, add monthly usage to footer |
| `src/renderer/app.js` | Strip parentheticals in `buildSearchParams()`, remove Strategy 2, add cache settings load/save, update `refreshSessionCounter()`, manual usage adjustment handler |
| `docs/user-manual.html` | New section on API Cache, Usage Tracking, and Quota Management |
| `docs/CHANGELOG.md` | Document changes |

---

## Verification

1. **Parenthetical stripping:** Click a coin with parenthetical country (e.g., "Germany (Nazi)") — should find results on first attempt, console shows no "Strategy 2" log
2. **Cache file creation:** After first API call, verify `numista_api_cache.json` exists in userData directory
3. **Issuers cache hit:** Restart app, click a coin — console should NOT show API call to `/issuers` (persistent cache hit)
4. **Type/Issues cache hit:** Enrich a coin, restart app, click same type — should return from persistent cache
5. **Pricing NOT cached persistently:** Pricing should always make a fresh API call
6. **Cache TTL settings:** Change issuers TTL to "No caching" in App Settings, restart, verify issuers are fetched fresh
7. **Monthly usage display:** Footer shows "Month: X/2,000" that updates after each API operation, with color warning at 75%+
8. **Clear API Cache:** Click button in App Settings, verify cache file is emptied but monthly usage is preserved
9. **Corrupt cache recovery:** Delete or corrupt cache JSON — app should start with empty cache without errors
10. **Cache expiry:** Manually set `cachedAt` to 91+ days ago for an issuer entry — should re-fetch on next use
11. **Manual usage adjustment:** Change the usage number in settings, verify footer updates to new value
12. **Dashboard link:** Click the Numista dashboard link, verify it opens in external browser
13. **User manual:** Open Help > User Manual, verify new cache/usage section is present and accurate

---

## Code Audit — Feb 9, 2026

All 5 changes across 8 files verified against actual codebase. No missing items found.

| Change | Status | Key Locations |
|--------|--------|---------------|
| 1: Strip parentheticals upfront | VERIFIED | app.js:3187, 3190, 3224; Strategy 2 removed, renumbered |
| 2a: api-cache.js | VERIFIED | 262 lines, all methods present, null handling correct |
| 2b: numista-api.js persistent cache | VERIFIED | Constructor line 102, DEFAULT_CACHE_TTL lines 64-69, 4 methods use persistent cache, 2 do not |
| 2c: index.js integration | VERIFIED | Import line 30, getApiCache() lines 61-66, getCacheTTLs() lines 72-85, all 8 instantiation points pass cache |
| 2d: typeDataCache preserved | VERIFIED | Line 49, still used in fetch-coin-data |
| 3a: Monthly usage methods | VERIFIED | api-cache.js lines 199-259 |
| 3b: Usage tracking in request() | VERIFIED | numista-api.js lines 172-177, getEndpointName() lines 71-86 |
| 3c: IPC handlers | VERIFIED | index.js lines 2657-2712 (get-monthly-usage, set-monthly-usage, set-monthly-usage-total, clear-api-cache) |
| 3d: Footer display | VERIFIED | index.html line 632, app.js refreshSessionCounter() lines 6530-6564 with color warnings |
| 4a: HTML settings group | VERIFIED | index.html lines 434-508 |
| 4b: Settings load/save | VERIFIED | app.js load lines 5138-5146, save lines 5301-5304 |
| 4c: Clear cache button | VERIFIED | app.js lines 5365-5376 |
| 4d: Manual usage + dashboard link | VERIFIED | index.html lines 498-503, app.js lines 5166-5178, 5314-5321, 5391-5394 |
| 5: User manual | VERIFIED | user-manual.html lines 1742-1818, TOC lines 459-466 |
| 5: CHANGELOG | VERIFIED | CHANGELOG.md Feb 8 entry |
