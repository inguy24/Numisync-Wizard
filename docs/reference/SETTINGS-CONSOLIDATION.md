# Settings File Consolidation

**Date:** February 10, 2026
**Status:** Complete

## Problem

Two settings files existed with redundant and conflicting data:

- **`app-settings.json`** - Created for cache configuration (version, cache object, cacheTtl structure)
- **`settings.json`** - Original settings file (apiKey, searchDelay, supporter, etc.)

This caused:
- Confusion about which file controlled which settings
- Duplicate data (logLevel, supporter, eulaAccepted, windowBounds, recentCollections)
- Maintenance burden keeping both files in sync
- Logger reading wrong path because folder name mismatch

## Solution

**Consolidated everything into `settings.json` as the single source of truth.**

### Changes Made

1. **[src/main/index.js:99-151](src/main/index.js#L99-L151)** - `loadAppSettings()`
   - Now reads from `settings.json` instead of `app-settings.json`
   - Adds default `cache` structure if missing
   - Creates `cacheTtl` structure from flat fields if needed
   - Returns full settings object with all fields

2. **[src/main/index.js:159-183](src/main/index.js#L159-L183)** - `saveAppSettings()`
   - Now writes to `settings.json` instead of `app-settings.json`
   - Merges with existing settings to preserve all fields
   - Updates flat `cacheTtlIssuers/Types/Issues` fields for backwards compatibility

3. **[src/main/index.js:189-240](src/main/index.js#L189-L240)** - `migrateAppSettings()`
   - Reverses migration direction: `app-settings.json` → `settings.json`
   - Merges cache config from `app-settings.json` into `settings.json`
   - Archives `app-settings.json` as `.bak` file for safety
   - Runs once on app startup

## Settings Structure

### `settings.json` (Consolidated - Complete Structure)

```json
{
  "version": "3.0",
  "apiKey": "...",
  "searchDelay": 2000,
  "imageHandling": "url",
  "autoBackup": true,
  "maxBackups": 20,
  "defaultCollectionPath": "...",
  "cache": {
    "location": "default",
    "customPath": null,
    "lockTimeout": 30000
  },
  "cacheTtl": {
    "issuers": 90,
    "types": 30,
    "issues": 30
  },
  "cacheTtlIssuers": 90,
  "cacheTtlTypes": 30,
  "cacheTtlIssues": 30,
  "monthlyApiLimit": 2000,
  "logLevel": "debug",
  "windowBounds": { ... },
  "recentCollections": [ ... ],
  "eulaAccepted": true,
  "eulaVersion": "2.0",
  "eulaAcceptedAt": "...",
  "supporter": {
    "isSupporter": true,
    "licenseKey": "...",
    "activationId": "...",
    "licenseKeyId": "...",
    "deviceLabel": "...",
    "validatedAt": "...",
    "customerId": "...",
    "offlineSkipUsed": false
  },
  "lifetimeStats": {
    "totalCoinsEnriched": 131
  }
}
```

### Field Notes

- **`cacheTtl` (object)** - Structured cache TTL settings (issuers, types, issues)
- **`cacheTtlIssuers/Types/Issues` (flat)** - Kept for backwards compatibility with `save-app-settings` IPC handler
- **`cache` (object)** - Cache location configuration (location, customPath, lockTimeout)
- **`version`** - Settings schema version (currently "3.0")

## Migration Behavior

On first app startup after this change:

1. If `app-settings.json` exists:
   - Read both `settings.json` and `app-settings.json`
   - Merge `cache` object from `app-settings.json` into `settings.json`
   - Merge `cacheTtl` structure (prefer existing flat fields if present)
   - Write consolidated data to `settings.json`
   - Rename `app-settings.json` to `app-settings.json.bak`
   - Log: "Consolidated app-settings.json into settings.json"

2. If only `settings.json` exists:
   - Add default `cache` structure if missing
   - Create `cacheTtl` structure from flat fields

3. If neither exists:
   - Return defaults with all required structures

## Developer Guidelines

### Reading Settings

```javascript
// Use loadAppSettings() for cache-related config
const settings = loadAppSettings();
console.log(settings.cache.location);
console.log(settings.cacheTtl.issuers);

// For other settings, read settings.json directly
const settingsPath = path.join(app.getPath('userData'), 'settings.json');
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
console.log(settings.apiKey);
```

### Updating Settings

```javascript
// Use saveAppSettings() for cache/window/general settings
saveAppSettings({
  cache: { location: 'custom', customPath: '/path/to/cache', lockTimeout: 30000 },
  logLevel: 'debug'
});

// Or use the save-app-settings IPC handler (already updates settings.json)
const result = await window.electronAPI.saveAppSettings({
  apiKey: '...',
  searchDelay: 2000,
  logLevel: 'info'
});
```

### Important

- **DO NOT create new code that writes to `app-settings.json`**
- **Use `settings.json` for all settings**
- **Call `loadAppSettings()` if you need cache config with defaults**
- **The flat `cacheTtlIssuers/Types/Issues` fields will be maintained for backwards compatibility**

## Verification

After migration:
- `settings.json` contains all settings
- `app-settings.json.bak` exists (backup)
- Log shows: "Consolidated app-settings.json into settings.json"
- App functions normally with cache configuration working

## Cleanup (Future)

After verifying no issues for 1+ month:
- Remove `app-settings.json.bak` file
- Consider removing flat `cacheTtlIssuers/Types/Issues` fields if no code depends on them

---

## Related Files

- [src/main/index.js](src/main/index.js) - `loadAppSettings()`, `saveAppSettings()`, `migrateAppSettings()`
- [src/main/logger.js](src/main/logger.js) - Reads `logLevel` from `settings.json`
- [docs/CHANGELOG.md](docs/CHANGELOG.md) - Feb 10, 2026 entry
