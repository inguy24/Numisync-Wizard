# IPC Handlers Quick Reference

**Source:** `src/main/index.js` (~65 handlers)
**Purpose:** Avoid reading the full 3,420-line index.js — use this to find any handler's channel name, parameters, return shape, and module delegate.

---

## Domain Index

- [Collection & Database](#collection--database)
- [Search & Enrichment (Numista API)](#search--enrichment-numista-api)
- [Field Mapping & Merge](#field-mapping--merge)
- [Progress Tracking](#progress-tracking)
- [Settings (Phase 1 — App-wide)](#settings-phase-1--app-wide)
- [Settings (Phase 2 — Per-collection)](#settings-phase-2--per-collection)
- [Cache Management](#cache-management)
- [Image Operations](#image-operations)
- [Field Mapping Configuration](#field-mapping-configuration)
- [Menu & Recent Collections](#menu--recent-collections)
- [Licensing (Polar SDK)](#licensing-polar-sdk)
- [Batch Operations](#batch-operations)
- [Utility](#utility)

---

## Collection & Database

| Channel | Params | Returns | Delegates To |
|---------|--------|---------|-------------|
| `select-collection-file` | *(none)* | `string \| null` — selected file path | Electron dialog |
| `load-collection` | `filePath: string` | `{ success, summary, progress }` | `opennumismat-db.js`, `settings-manager.js`, `progress-tracker.js` |
| `get-coins` | `options?: { limit, offset, status, sortBy, sortOrder }` | `{ success, coins: Coin[] }` — each coin has `.metadata` and `.status` attached | `opennumismat-db.js`, `metadata-manager.js`, `progress-tracker.js` |
| `get-coin-details` | `coinId: number` | `{ success, coin }` — coin has `.metadata` attached | `opennumismat-db.js`, `metadata-manager.js` |

---

## Search & Enrichment (Numista API)

| Channel | Params | Returns | Delegates To |
|---------|--------|---------|-------------|
| `resolve-issuer` | `countryName: string` | `{ success, code: string \| null }` | `numista-api.js` → `resolveIssuerCode()` |
| `search-numista` | `searchParams: { q?, issuer?, min_year?, max_year?, category? }` | `{ success, results: { types[], count } }` | `numista-api.js` → `searchTypes()` |
| `manual-search-numista` | `{ query, coinId, category?, issuer?, page? }` | `{ success, results: { types[], count } }` | `numista-api.js` → `searchTypes()` |
| `get-numista-type` | `typeId: number` | `{ success, typeData }` | `numista-api.js` → `getType()` |
| `fetch-coin-data` | `{ typeId: number, coin: Coin }` | `{ success, basicData?, issueData?, pricingData?, issueMatchResult, issueOptions? }` | `numista-api.js` → `fetchCoinData()` |
| `fetch-pricing-for-issue` | `{ typeId: number, issueId: number }` | `{ success, pricingData }` | `numista-api.js` → `getIssuePricing()` |
| `fetch-issue-data` | `{ typeId: number, coin: Coin }` | `{ success, issueData \| null, issueMatchResult, issueOptions? }` | `numista-api.js` → `getTypeIssues()` + `matchIssue()` |

---

## Field Mapping & Merge

| Channel | Params | Returns | Delegates To |
|---------|--------|---------|-------------|
| `compare-fields` | `{ coin, numistaData, issueData?, pricingData? }` | `{ success, comparison: { fields[], hasChanges } }` | `field-mapper.js` → `compareFields()` |
| `merge-data` | `{ coinId, selectedFields, numistaData, issueData?, pricingData? }` | `{ success, backupPath?, updatedFields, message }` | `field-mapper.js`, `opennumismat-db.js`, `metadata-manager.js`, `image-handler.js` |

---

## Progress Tracking

| Channel | Params | Returns | Delegates To |
|---------|--------|---------|-------------|
| `update-coin-status` | `{ coinId, status: 'skipped'\|'SKIPPED'\|metadata, metadata? }` | `{ success }` | `progress-tracker.js`, `metadata-manager.js`, `opennumismat-db.js` |
| `get-progress-stats` | *(none)* | `{ success, stats: ProgressStats }` | `progress-tracker.js` → `getStatistics()` |
| `get-statistics` | *(none)* | `ProgressStats` (direct, no wrapper) | `progress-tracker.js` → `getStatistics()` |
| `increment-api-calls` | `count?: number` (default 1) | `number` — new session call count | `progress-tracker.js` → `incrementSessionCalls()` |

---

## Settings (Phase 1 — App-wide)

> **Note (Lesson 9):** Phase 1 (`get-app-settings`) and Phase 2 (`get-settings`) are different channels for different settings files.

| Channel | Params | Returns | Delegates To |
|---------|--------|---------|-------------|
| `get-app-settings` | *(none)* | `{ success, settings: AppSettings }` | Reads `userData/settings.json` directly |
| `save-app-settings` | `settings: Partial<AppSettings>` | `{ success }` | Writes `userData/settings.json`, syncs to `settings-manager.js` |
| `get-default-collection` | *(none)* | `{ success, path: string \| null }` | Reads `userData/settings.json` |
| `set-default-collection` | `collectionPath: string` | `{ success }` | Writes `userData/settings.json` |
| `browse-default-collection` | *(none)* | `{ success, path: string \| null }` | Electron dialog |

---

## Settings (Phase 2 — Per-collection)

> Requires a collection to be loaded. Stored in `{collectionDir}/.NumiSync/{name}_settings.json`.

| Channel | Params | Returns | Delegates To |
|---------|--------|---------|-------------|
| `get-settings` | *(none)* | `Settings` (direct object, no success wrapper) | `settings-manager.js` → `getSettings()` |
| `save-fetch-settings` | `fetchSettings: { basicData, issueData, pricingData, searchCategory, emptyMintmarkInterpretation, enableAutoPropagate }` | `true` | `settings-manager.js`, `progress-tracker.js` |
| `save-currency` | `currency: string` (e.g., 'USD') | `true` | `settings-manager.js` → `setCurrency()` |
| `get-currency` | *(none)* | `string` (currency code) | `settings-manager.js` → `getCurrency()` |
| `save-ui-preference` | `key: string, value: any` | `true` | `settings-manager.js` → `setUiPreferences()` |
| `reset-settings` | *(none)* | `{ success, settings }` | `settings-manager.js` → `resetToDefaults()` |

---

## Cache Management

| Channel | Params | Returns | Delegates To |
|---------|--------|---------|-------------|
| `get-cache-settings` | *(none)* | `{ location, customPath, lockTimeout, defaultPath }` | Reads `userData/settings.json` |
| `set-cache-settings` | `{ location, customPath, lockTimeout }` | `{ success }` | Writes `userData/settings.json` |
| `browse-cache-directory` | *(none)* | `string \| null` — selected directory path | Electron dialog |
| `validate-cache-path` | `customPath: string` | `{ valid, reason? } \| { valid, collision: { cacheExists, lockStatus, lockAge, cacheMetadata, lockOwner } }` | `cache-lock.js` → `checkCacheLockStatus()`, `getCacheMetadata()` |
| `migrate-cache` | `newLocation: string, newCustomPath: string, useExisting?: boolean` | `{ success, migrated, usedExisting? }` | File system operations |
| `clear-api-cache` | *(none)* | `{ success }` | `api-cache.js` → `clear()` |
| `get-monthly-usage` | *(none)* | Monthly usage stats object | `api-cache.js` → `getMonthlyUsage()` |
| `set-monthly-usage` | `limit: number` | `{ success }` | `api-cache.js` → `setMonthlyLimit()` |
| `set-monthly-usage-total` | `total: number` | `{ success }` | `api-cache.js` → `setMonthlyUsageTotal()` |

---

## Image Operations

| Channel | Params | Returns | Delegates To |
|---------|--------|---------|-------------|
| `get-coin-images` | `coinId: number` | `{ success, images: { obverse, reverse, edge } }` — values are base64 data URIs | `opennumismat-db.js` → `getCoinImages()`, `image-handler.js` → `blobToDataUri()` |
| `download-and-store-images` | `{ coinId, imageUrls: { obverse?, reverse?, edge? } }` | `{ success, imageIds: { obverse?, reverse?, edge? } }` | `image-handler.js` → `downloadImage()`, `opennumismat-db.js` → `storeImagesForCoin()` |

---

## Field Mapping Configuration

| Channel | Params | Returns | Delegates To |
|---------|--------|---------|-------------|
| `get-field-mappings` | *(none)* | `{ success, fieldMappings, sources }` | `settings-manager.js` → `getFieldMappings()`, `default-field-mapping.js` → `getSerializableSources()` |
| `save-field-mappings` | `fieldMappings: Object` | `{ success }` | `settings-manager.js` → `setFieldMappings()` |
| `get-available-sources` | *(none)* | `{ success, sources }` | `default-field-mapping.js` → `getSerializableSources()` |
| `export-field-mappings` | *(none)* | `{ success, filePath }` | Electron dialog, `settings-manager.js` |
| `import-field-mappings` | *(none)* | `{ success, fieldMappings }` | Electron dialog, `settings-manager.js` |
| `reset-field-mappings` | *(none)* | `{ success, fieldMappings }` | `settings-manager.js` → `buildDefaultFieldMappings()` |

---

## Menu & Recent Collections

| Channel | Params | Returns | Delegates To |
|---------|--------|---------|-------------|
| `menu:update-state` | `state: Partial<MenuState>` | `{ success }` | Internal `menuState` + `rebuildMenu()` |
| `get-recent-collections` | *(none)* | `{ success, collections: string[] }` | `loadRecentCollections()` (local helper) |
| `clear-recent-collections` | *(none)* | `{ success }` | `saveRecentCollections([])` (local helper) |

---

## Licensing (Polar SDK)

| Channel | Params | Returns | Delegates To |
|---------|--------|---------|-------------|
| `get-supporter-status` | *(none)* | Supporter status object from `userData/settings.json` | Reads `userData/settings.json` |
| `validate-license-key` | `licenseKey: string` | `{ success, activated?, validated?, status?, supporter? }` | `@polar-sh/sdk` → `activate()` + `validate()` (Lesson 24) |
| `update-supporter-status` | `updates: Partial<SupporterStatus>` | `{ success }` | Writes `userData/settings.json` |
| `increment-lifetime-enrichments` | `count?: number` (default 1) | `{ success, total }` | Writes `userData/settings.json` |
| `get-lifetime-stats` | *(none)* | `{ success, stats: { totalCoinsEnriched } }` | Reads `userData/settings.json` |
| `clear-license` | *(none)* | `{ success }` | Clears license from `userData/settings.json` |
| `validate-license` | *(none)* | `{ success, valid, supporter? }` | `@polar-sh/sdk` → `validate()` only |
| `deactivate-license` | *(none)* | `{ success }` | `@polar-sh/sdk` → `deactivate()` |
| `check-feature-access` | `featureName: string` | `{ access: boolean, reason? }` | Reads supporter status + feature gating logic |

---

## Batch Operations

| Channel | Params | Returns | Delegates To |
|---------|--------|---------|-------------|
| `create-backup-before-batch` | *(none)* | `{ success, backupPath }` | `opennumismat-db.js` → `createBackup()` |
| `fast-pricing-update` | `{ coinId, numistaId, issueId }` | `{ success, updated, priceFields? }` | `numista-api.js` → `getIssuePricing()`, `opennumismat-db.js` → `updateCoin()`, `metadata-manager.js` |
| `propagate-type-data` | `{ coinId, numistaData, issueData?, pricingData?, isDuplicate, sourceNumistaId, issueSkipReason?, selectedFields }` | `{ success, updated, skipped, reason? }` | `field-mapper.js`, `opennumismat-db.js`, `metadata-manager.js`, `progress-tracker.js` |

---

## Utility

| Channel | Params | Returns | Delegates To |
|---------|--------|---------|-------------|
| `open-external` | `url: string` | `{ success }` | Electron `shell.openExternal()` |
| `check-installer-eula-marker` | *(none)* | `boolean` | File system check for `eula-installer-accepted.marker` |
| `check-for-updates` | *(none)* | *(void)* | `updater.js` → `checkForUpdatesManually()` |
| `get-app-version` | *(none)* | `string` (semver) | Electron `app.getVersion()` |
| `open-manual` | *(none)* | `{ success }` | `openUserManual()` (local helper) |
| `export-log-file` | *(none)* | `{ success, filePath? }` | `logger.js`, Electron dialog |

---

## Notes

- **Most handlers return** `{ success: true, ...data }` on success and `{ success: false, error: string }` on failure.
- **Exceptions** (return data directly without wrapper): `get-settings`, `save-fetch-settings`, `save-currency`, `save-ui-preference`, `get-statistics`, `increment-api-calls`, `get-currency`, `get-app-version`, `check-installer-eula-marker`.
- **Phase 1 vs Phase 2 settings** — Lesson 9 critical: `get-app-settings` reads `userData/settings.json` (global); `get-settings` reads `{collectionDir}/.NumiSync/{name}_settings.json` (per-collection).
- **Price field mapping** (Lesson 21): `price1=UNC`, `price2=XF`, `price3=VF`, `price4=F` — defined in `field-mapper.js:121-126`.
- **Image columns** (Lesson 5): `obverseimg`/`reverseimg` reference `photos` table, NOT `images` table.
