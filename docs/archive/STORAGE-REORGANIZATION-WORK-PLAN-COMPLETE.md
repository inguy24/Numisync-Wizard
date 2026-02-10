# Storage Architecture Reorganization - Work Plan

**Status:** ✅ COMPLETED
**Created:** February 9, 2026
**Completed:** February 10, 2026
**Priority:** High - Improves multi-machine workflows and prepares for uninstaller

**Completion Notes:**
- All tasks completed successfully (Phases 1-4)
- Cache location UI refactored from modal to integrated Settings screen
- All collection-specific files now organized in `.NumiSync/` subdirectory
- File locking implemented for shared cache scenarios
- Cache location configurable via Settings with automatic migration
- All documentation updated (CHANGELOG, user manual, PROJECT-REFERENCE)
- `uuid` dependency added (v9.0.1 for CommonJS compatibility)

---

## Background & Context

### Current Problem

NumiSync Wizard stores collection-specific files (settings, progress, backups) directly in the same directory as the OpenNumismat `.db` file, which clutters the user's data directory. The API cache is stored in the app's userData directory, but the location is hardcoded - users cannot configure it.

**User Scenario:** A collector accesses the same `.db` file from both their laptop and desktop computer. Currently, each machine builds its own separate API cache, wasting API quota. If the cache location were configurable, both machines could point to a shared network location and reuse cached API responses.

### Goals

1. **Organize collection-specific files** in a hidden `.NumiSync` subdirectory (cleaner, less clutter)
2. **Make cache location configurable** to support multi-machine scenarios with shared cache
3. **Implement file locking** for shared cache to prevent corruption when multiple machines access it
4. **Improve file naming** for user clarity (especially backups)
5. **Migrate existing installations** silently and automatically
6. **Document file locations** for uninstaller integration and user manual

---

## Proposed Architecture

### Collection-Specific Files (next to `.db` file)

**Current:**
```
/path/to/mycollection.db
/path/to/mycollection_settings.json
/path/to/mycollection_enrichment_progress.json
/path/to/backups/
    └── mycollection_backup_2026-02-09T14-35-22-123Z.db
```

**New:**
```
/path/to/mycollection.db
/path/to/.NumiSync/                           # Hidden folder
    ├── mycollection_settings.json
    ├── mycollection_progress.json             # Renamed (shorter)
    └── backups/
        └── mycollection_2026-02-09_143522.db  # Readable timestamp
```

### App-Wide Files

**Current (hardcoded to userData):**
```
%APPDATA%\NumiSync Wizard\
├── settings.json
├── numista_api_cache.json
└── logs/numisync-wizard.log
```

**New (configurable):**
```
%APPDATA%\NumiSync Wizard\
├── app-settings.json           # Renamed for clarity
├── api-cache.json              # Renamed, location configurable
├── api-cache.lock              # NEW: Lock file
└── logs/numisync-wizard.log
```

When user configures custom cache location:
- `api-cache.json` and `api-cache.lock` move to custom path
- `app-settings.json` and logs stay in userData

---

## File Naming Changes

| Current | New | Reason |
|---------|-----|--------|
| `{name}_enrichment_progress.json` | `{name}_progress.json` | Shorter, "enrichment" implied |
| `settings.json` | `app-settings.json` | Distinguish from collection settings |
| `numista_api_cache.json` | `api-cache.json` | Shorter, "numista" implied |
| `{name}_backup_{ISO}.db` | `{name}_{YYYY-MM-DD}_{HHMMSS}.db` | Human-readable timestamp |

---

## Implementation Tasks

### Phase 1: Core Infrastructure

#### Task 1.1: Create Cache Lock Module
**File:** `src/modules/cache-lock.js` (NEW)

Implement file-based locking:
- Use `fs.openSync(path, 'wx')` for atomic exclusive file creation
- Lock file contains: owner ID, hostname, PID, acquisition timestamp
- Stale lock detection: auto-remove locks older than 5 minutes
- Configurable timeout (default: 30 seconds)
- Cross-platform compatible (Windows/Mac/Linux/network shares)

**Key Class:**
```javascript
class CacheLock {
  constructor(cachePath, timeout = 30000)
  async acquire()   // Acquire lock or timeout
  async release()   // Release if owned
  isStale()         // Check if > 5 minutes old
  async sleep(ms)   // Helper for retry loop
}
```

**References:**
- Pattern similar to database lock check in `src/main/index.js:707-762`
- Use atomic operations like backup creation in `src/modules/opennumismat-db.js:362-380`

---

#### Task 1.2: Update API Cache Module
**File:** `src/modules/api-cache.js`

**Changes:**
- Accept `cacheFilePath` in constructor (remove hardcoded userData path)
- Add `CacheLock` integration:
  - Acquire lock before `_save()` operations
  - Release lock in finally block
  - Read operations (`get()`) remain unlocked (stale data acceptable)
- Add error handling for lock timeouts with helpful messages

**Current Constructor (line 28):**
```javascript
constructor(cacheFilePath) {
  this.cacheFilePath = cacheFilePath;
  this.data = this._load();
  this._prune();
}
```

**New Constructor:**
```javascript
constructor(cacheFilePath, options = {}) {
  this.cacheFilePath = cacheFilePath;
  this.lock = new CacheLock(cacheFilePath, options.lockTimeout || 30000);
  this.data = this._load();
  this._prune();
}
```

**Write Operation Update:**
```javascript
async set(key, data, ttl) {
  await this.lock.acquire();
  try {
    this.data.entries[key] = { data, cachedAt: Date.now(), ttl };
    this._save();
  } finally {
    await this.lock.release();
  }
}
```

---

### Phase 2: Path Updates & Migration

#### Task 2.1: Update Settings Manager
**File:** `src/modules/settings-manager.js`

**Changes in `getSettingsFilePath()` (around line 90):**
```javascript
getSettingsFilePath() {
  const dir = path.dirname(this.collectionPath);
  const basename = path.basename(this.collectionPath, '.db');
  const numiSyncDir = path.join(dir, '.NumiSync');

  // Create directory if needed
  if (!fs.existsSync(numiSyncDir)) {
    fs.mkdirSync(numiSyncDir, { recursive: true });
  }

  const newPath = path.join(numiSyncDir, `${basename}_settings.json`);

  // Migration: Check old location
  const oldPath = path.join(dir, `${basename}_settings.json`);
  if (!fs.existsSync(newPath) && fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    log.info('Migrated settings to .NumiSync directory');
  }

  return newPath;
}
```

**Add to default settings (lines 45-81):**
```javascript
cache: {
  location: 'default',     // 'default' | 'custom'
  customPath: null,        // null or absolute path
  lockTimeout: 30000       // milliseconds
}
```

---

#### Task 2.2: Update Progress Tracker
**File:** `src/modules/progress-tracker.js`

**Changes in path resolution (around line 30-50):**
- Move to `.NumiSync/` subdirectory
- Rename from `_enrichment_progress.json` to `_progress.json`
- Add migration from old location

**Pattern:**
```javascript
const dir = path.dirname(collectionPath);
const basename = path.basename(collectionPath, '.db');
const numiSyncDir = path.join(dir, '.NumiSync');

if (!fs.existsSync(numiSyncDir)) {
  fs.mkdirSync(numiSyncDir, { recursive: true });
}

const newPath = path.join(numiSyncDir, `${basename}_progress.json`);

// Migration
const oldPath = path.join(dir, `${basename}_enrichment_progress.json`);
if (!fs.existsSync(newPath) && fs.existsSync(oldPath)) {
  fs.renameSync(oldPath, newPath);
}

return newPath;
```

---

#### Task 2.3: Update Backup System
**File:** `src/modules/opennumismat-db.js`

**Changes in `createBackup()` (lines 362-380):**

1. Update backup directory to `.NumiSync/backups/`:
```javascript
const dir = path.dirname(this.filePath);
const numiSyncDir = path.join(dir, '.NumiSync');
const backupDir = path.join(numiSyncDir, 'backups');

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}
```

2. Change timestamp format (line 363):
```javascript
// Old: const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

// New: Readable format
const now = new Date();
const dateStr = now.toISOString().split('T')[0];  // YYYY-MM-DD
const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');  // HHMMSS
const timestamp = `${dateStr}_${timeStr}`;  // 2026-02-09_143522
```

3. Update `pruneOldBackups()` pattern matching to handle both old and new formats during transition

---

#### Task 2.4: Migrate App-Wide Settings
**File:** `src/main/index.js`

**Add new function (call in `app.whenReady()`):**
```javascript
function migrateAppSettings() {
  const userDataPath = app.getPath('userData');
  const oldSettingsPath = path.join(userDataPath, 'settings.json');
  const newSettingsPath = path.join(userDataPath, 'app-settings.json');

  // Migrate settings.json → app-settings.json
  if (fs.existsSync(oldSettingsPath) && !fs.existsSync(newSettingsPath)) {
    const oldData = JSON.parse(fs.readFileSync(oldSettingsPath, 'utf8'));

    const newData = {
      version: '3.0',
      cache: {
        location: 'default',
        customPath: null,
        lockTimeout: 30000
      },
      cacheTtl: {
        issuers: oldData.cacheTtlIssuers || 90,
        types: oldData.cacheTtlTypes || 30,
        issues: oldData.cacheTtlIssues || 30
      },
      windowBounds: oldData.windowBounds,
      recentCollections: oldData.recentCollections || [],
      logLevel: oldData.logLevel || 'info',
      supporter: oldData.supporter || {},
      eulaAccepted: oldData.eulaAccepted,
      eulaVersion: oldData.eulaVersion,
      eulaAcceptedAt: oldData.eulaAcceptedAt
    };

    fs.writeFileSync(newSettingsPath, JSON.stringify(newData, null, 2));
    log.info('Migrated app settings to new format');
    // Keep old file for safety (can delete in future version)
  }

  // Rename cache file
  const oldCachePath = path.join(userDataPath, 'numista_api_cache.json');
  const newCachePath = path.join(userDataPath, 'api-cache.json');

  if (fs.existsSync(oldCachePath) && !fs.existsSync(newCachePath)) {
    fs.renameSync(oldCachePath, newCachePath);
    log.info('Renamed cache file to new name');
  }
}
```

**Call in `app.whenReady()` (before any collections load):**
```javascript
app.whenReady().then(() => {
  migrateAppSettings();  // NEW: Migrate before anything else
  createWindow();
  // ... rest of initialization
});
```

---

### Phase 3: Cache Configuration UI

#### Task 3.1: Update Cache Initialization
**File:** `src/main/index.js`

**Modify `getApiCache()` function (around line 63):**
```javascript
function getApiCache() {
  if (!apiCache) {
    const appSettings = loadAppSettings();

    let cachePath;
    if (appSettings.cache?.location === 'custom' && appSettings.cache?.customPath) {
      cachePath = path.join(appSettings.cache.customPath, 'api-cache.json');
      log.info('Using custom cache location:', cachePath);
    } else {
      cachePath = path.join(app.getPath('userData'), 'api-cache.json');
    }

    try {
      apiCache = new ApiCache(cachePath, {
        lockTimeout: appSettings.cache?.lockTimeout || 30000
      });
    } catch (error) {
      log.error('Failed to initialize cache at custom location:', error);
      log.info('Falling back to default cache location');

      // Fallback to default
      cachePath = path.join(app.getPath('userData'), 'api-cache.json');
      apiCache = new ApiCache(cachePath);

      // Update settings to reflect fallback
      appSettings.cache.location = 'default';
      appSettings.cache.customPath = null;
      saveAppSettings(appSettings);
    }
  }
  return apiCache;
}
```

---

#### Task 3.2: Add IPC Handlers for Cache Settings
**File:** `src/main/index.js`

Add new handlers:
```javascript
ipcMain.handle('get-cache-settings', async () => {
  const appSettings = loadAppSettings();
  return {
    location: appSettings.cache?.location || 'default',
    customPath: appSettings.cache?.customPath || null,
    lockTimeout: appSettings.cache?.lockTimeout || 30000,
    defaultPath: path.join(app.getPath('userData'), 'api-cache.json')
  };
});

ipcMain.handle('set-cache-settings', async (event, settings) => {
  const appSettings = loadAppSettings();
  appSettings.cache = {
    location: settings.location,
    customPath: settings.customPath,
    lockTimeout: settings.lockTimeout
  };
  saveAppSettings(appSettings);
  return { success: true };
});

ipcMain.handle('browse-cache-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Cache Location'
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('validate-cache-path', async (event, customPath) => {
  const { CacheLock } = require('./modules/cache-lock');
  try {
    // Test write permission
    const testFile = path.join(customPath, '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);

    // Test lock support
    const lock = new CacheLock(path.join(customPath, 'test-cache.json'));
    await lock.acquire();
    await lock.release();
    fs.unlinkSync(path.join(customPath, 'test-cache.lock'));

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      reason: error.code === 'EACCES' ? 'Permission denied' :
              error.code === 'ENOENT' ? 'Path does not exist' :
              error.message.includes('lock') ? 'File locking not supported' :
              'Unknown error: ' + error.message
    };
  }
});
```

---

#### Task 3.3: Expose IPC Handlers in Preload
**File:** `src/main/preload.js`

Add to API object:
```javascript
cacheSettings: {
  get: () => ipcRenderer.invoke('get-cache-settings'),
  set: (settings) => ipcRenderer.invoke('set-cache-settings', settings),
  browseDirectory: () => ipcRenderer.invoke('browse-cache-directory'),
  validatePath: (path) => ipcRenderer.invoke('validate-cache-path', path)
}
```

---

#### Task 3.4: Create Cache Location Dialog UI
**File:** `src/renderer/index.html`

Add modal dialog (after other modals, before closing `</body>`):
```html
<!-- Cache Location Settings Modal -->
<div id="cacheLocationModal" class="modal">
  <div class="modal-content">
    <span class="close" data-modal="cacheLocationModal">&times;</span>
    <h2>Cache Location Settings</h2>

    <div class="settings-section">
      <h3>API Cache Storage Location</h3>

      <div class="form-group">
        <label>
          <input type="radio" name="cacheLocation" value="default" checked>
          Default Location (Recommended)
        </label>
        <div class="help-text" id="defaultCachePath">
          <!-- Populated by JS with actual path -->
        </div>
      </div>

      <div class="form-group">
        <label>
          <input type="radio" name="cacheLocation" value="custom">
          Custom Location (Advanced)
        </label>
        <div class="input-group">
          <input type="text" id="customCachePath" placeholder="Select a folder..." disabled>
          <button id="browseCachePath" disabled>Browse...</button>
        </div>
      </div>

      <div class="info-box">
        <strong>💡 Multi-Machine Scenario:</strong><br>
        If you access the same .db from multiple computers, you can store the cache
        on a shared network drive to avoid wasting API calls.
      </div>

      <div class="warning-box">
        <strong>⚠️ Warning:</strong> Shared cache locations require file locking support.
        Local folders and most modern cloud sync services work fine.
      </div>

      <div class="form-group">
        <label>
          Lock Timeout:
          <input type="number" id="lockTimeout" value="30" min="5" max="300"> seconds
        </label>
        <div class="help-text">
          How long to wait for cache file access before timing out.
        </div>
      </div>
    </div>

    <div class="modal-buttons">
      <button id="cancelCacheLocation" class="secondary">Cancel</button>
      <button id="applyCacheLocation" class="primary">Apply & Restart</button>
    </div>
  </div>
</div>
```

---

#### Task 3.5: Implement Cache Settings UI Logic
**File:** `src/renderer/app.js`

Add UI handlers:
```javascript
// Cache Location Modal
let cacheLocationModal;

async function openCacheLocationSettings() {
  if (!cacheLocationModal) {
    cacheLocationModal = document.getElementById('cacheLocationModal');
  }

  // Load current settings
  const settings = await window.electronAPI.cacheSettings.get();

  // Populate UI
  document.getElementById('defaultCachePath').textContent = settings.defaultPath;
  document.querySelector(`input[name="cacheLocation"][value="${settings.location}"]`).checked = true;
  document.getElementById('customCachePath').value = settings.customPath || '';
  document.getElementById('lockTimeout').value = settings.lockTimeout / 1000;

  // Update enabled state
  updateCacheLocationInputs();

  cacheLocationModal.style.display = 'block';
}

function updateCacheLocationInputs() {
  const isCustom = document.querySelector('input[name="cacheLocation"]:checked').value === 'custom';
  document.getElementById('customCachePath').disabled = !isCustom;
  document.getElementById('browseCachePath').disabled = !isCustom;
}

document.querySelectorAll('input[name="cacheLocation"]').forEach(radio => {
  radio.addEventListener('change', updateCacheLocationInputs);
});

document.getElementById('browseCachePath').addEventListener('click', async () => {
  const path = await window.electronAPI.cacheSettings.browseDirectory();
  if (path) {
    document.getElementById('customCachePath').value = path;

    // Validate path
    const result = await window.electronAPI.cacheSettings.validatePath(path);
    if (!result.valid) {
      alert(`Invalid cache location: ${result.reason}\n\nPlease choose a different folder.`);
      document.getElementById('customCachePath').value = '';
    }
  }
});

document.getElementById('applyCacheLocation').addEventListener('click', async () => {
  const location = document.querySelector('input[name="cacheLocation"]:checked').value;
  const customPath = document.getElementById('customCachePath').value;
  const lockTimeout = parseInt(document.getElementById('lockTimeout').value) * 1000;

  // Validate custom path if selected
  if (location === 'custom') {
    if (!customPath) {
      alert('Please select a custom cache location or choose Default.');
      return;
    }

    const result = await window.electronAPI.cacheSettings.validatePath(customPath);
    if (!result.valid) {
      alert(`Invalid cache location: ${result.reason}\n\nPlease choose a different folder.`);
      return;
    }
  }

  // Save settings
  await window.electronAPI.cacheSettings.set({
    location,
    customPath: location === 'custom' ? customPath : null,
    lockTimeout
  });

  // Prompt restart
  const restart = confirm(
    'Cache location updated!\n\n' +
    'The application needs to restart for changes to take effect.\n\n' +
    'Restart now?'
  );

  if (restart) {
    window.electronAPI.restartApp();
  } else {
    cacheLocationModal.style.display = 'none';
  }
});

document.getElementById('cancelCacheLocation').addEventListener('click', () => {
  cacheLocationModal.style.display = 'none';
});
```

Add menu item trigger (in settings dropdown menu initialization):
```javascript
// Add to settings dropdown
{ label: 'Cache Location...', action: openCacheLocationSettings }
```

---

### Phase 4: Documentation

#### Task 4.1: Create File Locations Reference
**File:** `docs/reference/FILE-LOCATIONS.md` (NEW)

Document all file locations for uninstaller:
- Collection-specific files in `.NumiSync/` subdirectory (with examples)
- App-wide files in userData directory (platform-specific paths)
- Custom cache location (how to find it)
- Uninstaller recommendations

---

#### Task 4.2: Update Project Reference
**File:** `docs/reference/PROJECT-REFERENCE.md`

Update Storage Architecture section (lines 427-447) with new structure.

---

#### Task 4.3: Update User Manual
**File:** `src/resources/user-manual.html`

Add/update sections:
1. **"Where Files Are Stored"** - Explain `.NumiSync` folder, app-wide files
2. **"Multi-Machine Usage"** - Configure shared cache, requirements, troubleshooting
3. **"Uninstalling NumiSync Wizard"** - What gets deleted, what remains, how to clean up
4. **"Managing Backups"** - New location, naming format, restoration
5. **"Cache Location Settings"** - When/why to use, how to configure

---

## Testing & Verification

### Unit Tests (Manual)

1. **Cache Lock:**
   - ✅ Lock acquired successfully
   - ✅ Timeout when lock held by another process
   - ✅ Stale lock cleanup (>5 minutes)
   - ✅ Lock released on error

2. **Path Migration:**
   - ✅ Old files moved to `.NumiSync/`
   - ✅ Settings preserved
   - ✅ Progress data maintained
   - ✅ Backups accessible

### Integration Tests

1. **Multi-Machine Scenario:**
   - Configure custom cache on network share (Machine A)
   - Load collection, fetch data (cache populated)
   - Point Machine B to same cache
   - Verify cache hit (no duplicate API calls)
   - Verify no corruption

2. **Migration Flow:**
   - Start with old structure
   - Launch new version
   - Verify silent migration
   - Verify all data preserved

3. **Error Handling:**
   - Invalid custom path → fallback to default
   - Network unavailable → graceful fallback
   - Lock timeout → clear error message

---

## Critical File References

### New Files to Create
1. `src/modules/cache-lock.js` - Lock implementation
2. `docs/reference/FILE-LOCATIONS.md` - Uninstaller docs

### Files to Modify
1. `src/modules/api-cache.js` - Add locking, configurable path
2. `src/modules/settings-manager.js` - `.NumiSync/` subdirectory
3. `src/modules/progress-tracker.js` - `.NumiSync/` subdirectory, rename
4. `src/modules/opennumismat-db.js` - Backup path and naming
5. `src/main/index.js` - Migration, cache init, IPC handlers
6. `src/main/preload.js` - Expose cache settings IPC
7. `src/renderer/app.js` - Cache location UI logic
8. `src/renderer/index.html` - Cache location dialog
9. `src/resources/user-manual.html` - Documentation updates
10. `docs/reference/PROJECT-REFERENCE.md` - Storage Architecture section

---

## Implementation Notes

- `.NumiSync` is hidden on Mac/Linux (dot prefix), visible on Windows
- 30-second lock timeout balances speed vs. network reliability
- Migration is silent (no user notification)
- Old files kept for rollback safety
- Cache version checking handles multi-version scenarios
- All file operations remain synchronous (current pattern)

---

## Success Criteria

- [ ] All collection-specific files organized in `.NumiSync/` subdirectory
- [ ] Cache location configurable via Settings UI
- [ ] File locking prevents corruption on shared cache
- [ ] Migration happens silently on first load
- [ ] Multi-machine scenario works without API waste
- [ ] Backup naming is human-readable
- [ ] Documentation complete (user manual, file locations, project reference)
- [ ] No data loss during migration
