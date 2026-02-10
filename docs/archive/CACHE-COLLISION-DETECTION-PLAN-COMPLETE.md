# Cache Collision Detection and Multi-Instance Handling

**Status:** ✅ Complete
**Created:** February 10, 2026
**Completed:** February 10, 2026
**Priority:** High - Prevents silent cache overwrites and improves multi-machine UX
**Estimated Effort:** 6-8 hours
**Actual Effort:** ~4 hours

---

## Getting Started

### Prerequisites

Before implementing this plan, ensure you understand:

1. **Storage Reorganization Context** - Completed February 10, 2026
   - Cache location is now configurable (default or custom)
   - Settings stored in `app-settings.json` with `cache.location` and `cache.customPath`
   - File locking already implemented via `CacheLock` class ([src/modules/cache-lock.js](../src/modules/cache-lock.js))

2. **Existing Infrastructure**
   - `CacheLock` class handles file locking for cache writes
   - `validate-cache-path` IPC handler validates directory permissions
   - `migrate-cache` IPC handler copies cache files when location changes
   - Settings screen has cache location section with radio buttons

3. **Key Files to Review First**
   - [src/modules/cache-lock.js](../src/modules/cache-lock.js) - Lock mechanism (lines 102-117: `isStale()` method)
   - [src/main/index.js](../src/main/index.js) - IPC handlers (lines 1718-1801)
   - [src/renderer/app.js](../src/renderer/app.js) - Settings save flow (lines 5378-5418)

### Implementation Order

**Recommended sequence:**

```
Phase 1: Cache Detection (2 hours)
├─→ 1.1: Add static methods to cache-lock.js
└─→ 1.2: Update validate-cache-path handler

Phase 2: UI Modals (2 hours)
├─→ 2.1: Add HTML modals to index.html
└─→ 2.2: Implement modal logic in app.js

Phase 3: Integration (1 hour)
├─→ 2.3: Update settings save handler
├─→ 3.1: Update migrate-cache handler
└─→ 3.2: Update preload API

Phase 4: Testing (2 hours)
├─→ Test all 7 scenarios (see Verification Plan)
└─→ Fix edge cases

Phase 5: Documentation (1 hour)
├─→ 5.1: Update FILE-LOCATIONS.md
└─→ 5.2: Update INSTALLER-DISTRIBUTION-PLAN.md
```

### Testing Strategy

**During Development:**
- Test with a local cache directory first (`C:\TestCache`)
- Create fake lock files to simulate locked scenarios
- Use `setTimeout` to simulate network delays

**Before Committing:**
- Run all 7 manual test scenarios (see Verification Plan)
- Test on network share if available
- Verify uninstaller documentation is accurate

### Key Dependencies

- **No new npm packages required** - Uses existing `fs`, `path`, `uuid` modules
- **CacheLock class** - Already exists, just exposing new static methods
- **IPC infrastructure** - Already set up for cache settings

---

## Context

The Storage Reorganization feature (completed February 10, 2026) introduced configurable cache locations to support multi-machine workflows where users can point multiple NumiSync Wizard instances to a shared network cache. However, the current implementation has a critical gap: it doesn't detect or handle collisions when a user sets up a second machine pointing to an existing cache location.

**Problem Scenario:**
1. User has NumiSync Wizard on Machine A with cache at `\\NetworkShare\NumiSyncCache\`
2. User installs NumiSync Wizard on Machine B
3. User configures Machine B to also use `\\NetworkShare\NumiSyncCache\`
4. Current behavior: Machine B silently starts using existing cache files without user awareness

**Issues with Current Behavior:**
- No detection of existing cache files at the target location
- No user prompting about using existing vs. creating new cache
- No check if cache is currently locked (in use by another instance)
- Silent migration could overwrite active caches from other machines
- No guidance if cache is locked and unavailable

**User Requirements:**
1. Detect if cache files already exist at selected custom location
2. Check if existing cache is currently locked (active instance)
3. Prompt user: "Use existing cache" or "Select different location"
4. If locked, show error and prompt user to close other instance and retry
5. Prevent accidental cache corruption from simultaneous access

---

## Current Implementation Analysis

### Cache Validation (src/main/index.js:1718-1749)

**validate-cache-path handler** currently checks:
- ✅ Path exists
- ✅ Is a directory
- ✅ Write permission (test file creation)

**Missing checks:**
- ❌ Existing `api-cache.json` at location
- ❌ Existing `api-cache.lock` at location
- ❌ Lock status (stale vs. active)
- ❌ Cache file validity (parseable, correct structure)
- ❌ Cache file metadata (last modified, size)

### Cache Migration (src/main/index.js:1751-1801)

**migrate-cache handler** currently:
- Copies old cache to new location if it exists
- Silently overwrites if target files exist
- Returns `{ success, migrated }` status

**Missing logic:**
- ❌ Pre-migration collision detection
- ❌ User choice: use existing vs. overwrite vs. cancel
- ❌ Lock status check before overwriting
- ❌ Option to use existing cache without migration

### Cache Lock Detection (src/modules/cache-lock.js:102-117)

**CacheLock.isStale()** method:
- Returns `true` if lock age > 5 minutes
- Returns `true` if lock file can't be read
- Used by `acquire()` to clean up stale locks

**Capabilities:**
- ✅ Can detect if lock file exists
- ✅ Can determine if lock is stale (5+ minutes old)
- ✅ Can read lock metadata (ownerId, hostname, pid, acquiredAt)

**Gap:**
- Not exposed as a utility function for collision detection
- Only used internally during lock acquisition

### Settings Save Flow (src/renderer/app.js:5378-5418)

**Current flow:**
1. Validate custom path (if selected)
2. Attempt migration
3. Save cache settings
4. No restart required

**Missing:**
- ❌ Pre-save collision detection
- ❌ User confirmation dialog for existing cache
- ❌ Retry logic for locked caches
- ❌ Clear messaging about what will happen

---

## Proposed Solution

### Phase 1: Enhanced Cache Detection

#### 1.1 Add Cache Collision Detection Utility (src/modules/cache-lock.js)

Add new methods to `CacheLock` class:

```javascript
/**
 * Check cache lock status at a given location
 * @param {string} cachePath - Path to api-cache.json
 * @returns {Object} Lock status information
 */
static async checkCacheLockStatus(cachePath) {
  const lockPath = cachePath.replace(/\.json$/, '.lock');

  try {
    // Check if cache file exists
    const cacheExists = fs.existsSync(cachePath);
    const lockExists = fs.existsSync(lockPath);

    if (!cacheExists && !lockExists) {
      return { status: 'none', cacheExists: false, lockExists: false };
    }

    if (!lockExists) {
      return { status: 'unlocked', cacheExists, lockExists: false };
    }

    // Lock file exists - check if stale
    const lockData = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    const age = Date.now() - lockData.acquiredAt;
    const STALE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

    if (age > STALE_THRESHOLD) {
      return {
        status: 'stale',
        cacheExists,
        lockExists: true,
        lockAge: age,
        lockOwner: {
          hostname: lockData.hostname,
          pid: lockData.pid,
          acquiredAt: new Date(lockData.acquiredAt)
        }
      };
    }

    // Active lock
    return {
      status: 'locked',
      cacheExists,
      lockExists: true,
      lockAge: age,
      lockOwner: {
        hostname: lockData.hostname,
        pid: lockData.pid,
        acquiredAt: new Date(lockData.acquiredAt)
      }
    };
  } catch (error) {
    // Lock file corrupt or unreadable - treat as stale
    return {
      status: 'stale',
      cacheExists: fs.existsSync(cachePath),
      lockExists: true,
      error: error.message
    };
  }
}

/**
 * Get cache file metadata
 * @param {string} cachePath - Path to api-cache.json
 * @returns {Object|null} Cache metadata or null if doesn't exist
 */
static getCacheMetadata(cachePath) {
  if (!fs.existsSync(cachePath)) {
    return null;
  }

  try {
    const stats = fs.statSync(cachePath);
    const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

    return {
      exists: true,
      size: stats.size,
      lastModified: stats.mtime,
      entryCount: Object.keys(data.entries || {}).length,
      version: data.version,
      valid: data.version === '1.0'
    };
  } catch (error) {
    return {
      exists: true,
      valid: false,
      error: error.message
    };
  }
}
```

Export these as static methods that can be called without instantiating CacheLock.

#### 1.2 Update validate-cache-path Handler (src/main/index.js:1718)

Enhance validation to include collision detection:

```javascript
ipcMain.handle('validate-cache-path', async (event, customPath) => {
  try {
    // Existing validation
    if (!fs.existsSync(customPath)) {
      return { valid: false, reason: 'Path does not exist' };
    }

    const stats = fs.statSync(customPath);
    if (!stats.isDirectory()) {
      return { valid: false, reason: 'Path must be a directory' };
    }

    // Test write permission
    const testFile = path.join(customPath, '.write-test-' + Date.now());
    try {
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
    } catch (err) {
      return { valid: false, reason: 'No write permission in this directory' };
    }

    // NEW: Check for existing cache collision
    const cachePath = path.join(customPath, 'api-cache.json');
    const lockStatus = await CacheLock.checkCacheLockStatus(cachePath);
    const cacheMetadata = CacheLock.getCacheMetadata(cachePath);

    return {
      valid: true,
      collision: {
        cacheExists: lockStatus.cacheExists,
        lockStatus: lockStatus.status, // 'none', 'unlocked', 'stale', 'locked'
        cacheMetadata: cacheMetadata,
        lockOwner: lockStatus.lockOwner || null
      }
    };
  } catch (error) {
    return {
      valid: false,
      reason: error.code === 'EACCES' ? 'Permission denied' :
              error.code === 'ENOENT' ? 'Path does not exist' :
              'Unknown error: ' + error.message
    };
  }
});
```

### Phase 2: User Prompting and Confirmation

#### 2.1 Add Collision Detection Modal (src/renderer/index.html)

Add new modal dialog after Settings screen:

```html
<!-- Cache Collision Detection Modal -->
<div id="cacheCollisionModal" class="modal">
  <div class="modal-content">
    <h2>⚠️ Existing Cache Detected</h2>

    <div class="info-box" style="margin-bottom: 20px;">
      <p>An API cache already exists at the selected location:</p>
      <p style="font-family: monospace; margin-top: 10px;" id="collisionCachePath"></p>

      <div id="collisionCacheDetails" style="margin-top: 15px;">
        <!-- Populated by JS with cache metadata -->
      </div>
    </div>

    <div id="collisionLockWarning" class="warning-box" style="display: none; margin-bottom: 20px;">
      <strong>🔒 Cache In Use</strong>
      <p id="lockWarningText"></p>
    </div>

    <p style="margin-bottom: 20px;">What would you like to do?</p>

    <div class="modal-buttons" style="flex-direction: column; gap: 10px;">
      <button id="useExistingCacheBtn" class="primary" style="width: 100%;">
        ✅ Use Existing Cache (Recommended for multi-machine setup)
      </button>
      <button id="selectDifferentLocationBtn" class="secondary" style="width: 100%;">
        📁 Select Different Location
      </button>
      <button id="cancelCollisionBtn" class="secondary" style="width: 100%;">
        ❌ Cancel
      </button>
    </div>

    <div class="info-box" style="margin-top: 20px;">
      <strong>💡 Multi-Machine Tip:</strong> If you're setting up NumiSync Wizard on a second computer,
      choose "Use Existing Cache" to share cached API data between machines and save API quota.
    </div>
  </div>
</div>

<!-- Cache Locked Error Modal -->
<div id="cacheLockedModal" class="modal">
  <div class="modal-content">
    <h2>🔒 Cache Locked</h2>

    <div class="warning-box" style="margin-bottom: 20px;">
      <p>The selected cache location is currently in use by another NumiSync Wizard instance:</p>
      <div id="lockOwnerInfo" style="margin-top: 10px; font-family: monospace; font-size: 0.9em;">
        <!-- Populated with hostname, timestamp -->
      </div>
    </div>

    <p style="margin-bottom: 20px;">To use this cache location:</p>
    <ol style="text-align: left; margin-left: 20px; margin-bottom: 20px;">
      <li>Close the other NumiSync Wizard instance</li>
      <li>Wait a few seconds for the lock to release</li>
      <li>Click "Retry" below</li>
    </ol>

    <p style="font-size: 0.9em; color: #666; margin-bottom: 20px;">
      Or select a different cache location to use a separate cache.
    </p>

    <div class="modal-buttons">
      <button id="retryLockedCacheBtn" class="primary">🔄 Retry</button>
      <button id="selectDifferentFromLockedBtn" class="secondary">📁 Select Different Location</button>
      <button id="cancelLockedBtn" class="secondary">❌ Cancel</button>
    </div>
  </div>
</div>
```

#### 2.2 Implement Collision Detection Logic (src/renderer/app.js)

Add handlers after cache location settings loading:

```javascript
// Cache collision detection state
let pendingCacheLocationChange = null;

/**
 * Handle cache location change with collision detection
 */
async function handleCacheLocationChange(cacheLocation, customCachePath, cacheLockTimeout) {
  // Store pending change
  pendingCacheLocationChange = { cacheLocation, customCachePath, cacheLockTimeout };

  // Only check collision for custom locations
  if (cacheLocation === 'custom' && customCachePath) {
    const validation = await window.electronAPI.cacheSettings.validatePath(customCachePath);

    if (!validation.valid) {
      showModal('Error', `Invalid cache location: ${validation.reason}\n\nPlease select a different folder.`);
      return false;
    }

    // Check for collision
    if (validation.collision && validation.collision.cacheExists) {
      const lockStatus = validation.collision.lockStatus;

      if (lockStatus === 'locked') {
        // Cache is actively locked - show locked modal
        showCacheLockedModal(validation.collision);
        return false;
      } else {
        // Cache exists but not locked - show collision modal
        showCacheCollisionModal(validation.collision, customCachePath);
        return false;
      }
    }
  }

  // No collision, proceed with save
  return await saveCacheLocationSettings(cacheLocation, customCachePath, cacheLockTimeout, false);
}

/**
 * Show cache collision modal
 */
function showCacheCollisionModal(collision, cachePath) {
  const modal = document.getElementById('cacheCollisionModal');

  // Populate cache path
  document.getElementById('collisionCachePath').textContent = cachePath;

  // Populate cache details
  const detailsDiv = document.getElementById('collisionCacheDetails');
  const metadata = collision.cacheMetadata;

  if (metadata && metadata.valid) {
    detailsDiv.innerHTML = `
      <strong>Cache Information:</strong>
      <ul style="margin-top: 8px; margin-left: 20px;">
        <li>Entries: ${metadata.entryCount || 0} cached items</li>
        <li>Size: ${formatBytes(metadata.size)}</li>
        <li>Last Modified: ${new Date(metadata.lastModified).toLocaleString()}</li>
      </ul>
    `;
  } else if (metadata) {
    detailsDiv.innerHTML = `
      <p style="color: #d97706;">⚠️ Cache file exists but may be corrupted or invalid.</p>
    `;
  }

  // Show stale lock warning if applicable
  if (collision.lockStatus === 'stale') {
    const lockWarning = document.getElementById('collisionLockWarning');
    const lockText = document.getElementById('lockWarningText');
    lockText.textContent = 'The cache has a stale lock file (older than 5 minutes), which will be automatically cleaned up when used.';
    lockWarning.style.display = 'block';
  }

  modal.style.display = 'block';
}

/**
 * Show cache locked modal
 */
function showCacheLockedModal(collision) {
  const modal = document.getElementById('cacheLockedModal');

  // Populate lock owner info
  const lockOwnerDiv = document.getElementById('lockOwnerInfo');
  const owner = collision.lockOwner;

  if (owner) {
    const lockAge = formatDuration(collision.lockAge);
    lockOwnerDiv.innerHTML = `
      <strong>Locked by:</strong> ${owner.hostname}<br>
      <strong>Process ID:</strong> ${owner.pid}<br>
      <strong>Since:</strong> ${owner.acquiredAt.toLocaleString()} (${lockAge} ago)
    `;
  }

  modal.style.display = 'block';
}

/**
 * Save cache location settings
 * @param {boolean} useExisting - If true, don't migrate, just point to existing cache
 */
async function saveCacheLocationSettings(cacheLocation, customCachePath, cacheLockTimeout, useExisting) {
  try {
    // Save cache location settings first
    await window.electronAPI.cacheSettings.set({
      location: cacheLocation,
      customPath: customCachePath,
      lockTimeout: cacheLockTimeout
    });

    // If not using existing, perform migration
    if (!useExisting) {
      const migrationResult = await window.electronAPI.cacheSettings.migrate(cacheLocation, customCachePath);
      if (!migrationResult.success) {
        showModal('Warning', `Settings saved, but cache migration failed: ${migrationResult.error}\n\nThe cache will be rebuilt at the new location.`);
      }
    }

    showStatus('Cache location settings saved');
    return true;
  } catch (error) {
    console.error('Error saving cache settings:', error);
    showModal('Error', 'Failed to save cache location settings: ' + error.message);
    return false;
  }
}

// Event handlers for collision modal
document.getElementById('useExistingCacheBtn').addEventListener('click', async () => {
  document.getElementById('cacheCollisionModal').style.display = 'none';

  if (pendingCacheLocationChange) {
    const { cacheLocation, customCachePath, cacheLockTimeout } = pendingCacheLocationChange;
    const success = await saveCacheLocationSettings(cacheLocation, customCachePath, cacheLockTimeout, true);
    if (success) {
      showStatus('Now using existing cache at selected location');
    }
    pendingCacheLocationChange = null;
  }
});

document.getElementById('selectDifferentLocationBtn').addEventListener('click', () => {
  document.getElementById('cacheCollisionModal').style.display = 'none';
  pendingCacheLocationChange = null;
  // Re-open browse dialog
  document.getElementById('browseCacheLocationBtn').click();
});

document.getElementById('cancelCollisionBtn').addEventListener('click', () => {
  document.getElementById('cacheCollisionModal').style.display = 'none';
  pendingCacheLocationChange = null;
});

// Event handlers for locked cache modal
document.getElementById('retryLockedCacheBtn').addEventListener('click', async () => {
  document.getElementById('cacheLockedModal').style.display = 'none';

  if (pendingCacheLocationChange) {
    const { cacheLocation, customCachePath, cacheLockTimeout } = pendingCacheLocationChange;
    // Retry validation - will re-show collision modal or proceed
    await handleCacheLocationChange(cacheLocation, customCachePath, cacheLockTimeout);
  }
});

document.getElementById('selectDifferentFromLockedBtn').addEventListener('click', () => {
  document.getElementById('cacheLockedModal').style.display = 'none';
  pendingCacheLocationChange = null;
  document.getElementById('browseCacheLocationBtn').click();
});

document.getElementById('cancelLockedBtn').addEventListener('click', () => {
  document.getElementById('cacheLockedModal').style.display = 'none';
  pendingCacheLocationChange = null;
});

// Helper functions
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}
```

#### 2.3 Update Settings Save Handler (src/renderer/app.js:5378)

Replace direct migration with collision-aware flow:

```javascript
// In saveSettingsBtn click handler, replace cache location section:

// Handle cache location settings
const cacheLocation = document.querySelector('input[name="cacheLocation"]:checked').value;
const customCachePath = document.getElementById('customCacheLocationInput').value;
const cacheLockTimeout = parseInt(document.getElementById('cacheLockTimeout').value) * 1000;

// Validate custom path if selected
if (cacheLocation === 'custom' && !customCachePath) {
  showModal('Error', 'Please select a custom cache location or choose the default location.');
  return;
}

// Handle cache location change with collision detection
const cacheSuccess = await handleCacheLocationChange(cacheLocation, customCachePath, cacheLockTimeout);
if (!cacheSuccess) {
  return; // User will handle via modal dialogs
}

// Continue with rest of settings save...
```

### Phase 3: Migration Logic Updates

#### 3.1 Update migrate-cache Handler (src/main/index.js:1751)

Add `useExisting` parameter to skip migration:

```javascript
ipcMain.handle('migrate-cache', async (event, newLocation, newCustomPath, useExisting = false) => {
  try {
    const appSettings = loadAppSettings();
    const oldLocation = appSettings.cache?.location || 'default';
    const oldCustomPath = appSettings.cache?.customPath;

    // Determine old and new cache paths
    let oldCachePath, newCachePath;

    if (oldLocation === 'custom' && oldCustomPath) {
      oldCachePath = path.join(oldCustomPath, 'api-cache.json');
    } else {
      oldCachePath = path.join(app.getPath('userData'), 'api-cache.json');
    }

    if (newLocation === 'custom' && newCustomPath) {
      newCachePath = path.join(newCustomPath, 'api-cache.json');
    } else {
      newCachePath = path.join(app.getPath('userData'), 'api-cache.json');
    }

    // If paths are the same, no migration needed
    if (oldCachePath === newCachePath) {
      return { success: true, migrated: false };
    }

    // If useExisting is true, don't copy old cache
    if (useExisting) {
      log.info(`Using existing cache at new location: ${newCachePath}`);
      return { success: true, migrated: false, usedExisting: true };
    }

    // Copy cache files if they exist
    let migrated = false;
    if (fs.existsSync(oldCachePath)) {
      const destDir = path.dirname(newCachePath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      // Check if destination already has a cache (shouldn't happen if collision detection worked)
      if (fs.existsSync(newCachePath)) {
        log.warn(`Overwriting existing cache at ${newCachePath}`);
        // Could backup the existing cache here if desired
      }

      fs.copyFileSync(oldCachePath, newCachePath);
      migrated = true;
      log.info(`Cache migrated from ${oldCachePath} to ${newCachePath}`);
    }

    // Copy lock file if it exists
    const oldLockPath = oldCachePath.replace(/\.json$/, '.lock');
    const newLockPath = newCachePath.replace(/\.json$/, '.lock');
    if (fs.existsSync(oldLockPath)) {
      fs.copyFileSync(oldLockPath, newLockPath);
    }

    return { success: true, migrated };
  } catch (error) {
    log.error('Cache migration failed:', error);
    return { success: false, error: error.message };
  }
});
```

#### 3.2 Update Preload API (src/main/preload.js:223)

Update migrate handler signature:

```javascript
cacheSettings: {
  get: () => ipcRenderer.invoke('get-cache-settings'),
  set: (settings) => ipcRenderer.invoke('set-cache-settings', settings),
  browseDirectory: () => ipcRenderer.invoke('browse-cache-directory'),
  validatePath: (path) => ipcRenderer.invoke('validate-cache-path', path),
  migrate: (newLocation, newCustomPath, useExisting = false) =>
    ipcRenderer.invoke('migrate-cache', newLocation, newCustomPath, useExisting)
},
```

### Phase 4: Edge Cases and Error Handling

#### 4.1 Handle First-Time Setup

When app is installed on a new machine:
- Default location: No collision possible (userData is unique per machine)
- Custom location: Collision detection runs automatically

#### 4.2 Handle Network Issues

If custom path is on a network share:
- Timeout on lock status check → Treat as error, prompt user
- Network path unavailable → Validation fails with clear message
- Intermittent connection → Lock status may be stale, warn user

#### 4.3 Handle Corrupted Cache

If existing cache is invalid:
- Show warning in collision modal
- Allow "Use Existing" but warn it may be rebuilt
- Consider adding "Delete and Replace" option

#### 4.4 Handle Multiple Active Instances

If user has two machines both using the cache:
- First machine: Acquires lock successfully
- Second machine: Detects lock, shows locked modal
- After first machine closes: Lock becomes stale after 5 minutes
- Second machine: Can clean up stale lock and proceed

### Phase 5: Documentation Updates

#### 5.1 Update FILE-LOCATIONS.md (docs/reference/FILE-LOCATIONS.md)

Add new section documenting cache collision detection behavior:

**After "Custom Cache Location" section (after line 100), add:**

```markdown
### Cache Collision Detection

When configuring a custom cache location, NumiSync Wizard detects if cache files already exist at that location and prompts the user for action.

**Scenarios:**

1. **No Existing Cache** - Cache files are created normally
2. **Existing Unlocked Cache** - User prompted to "Use Existing" or "Select Different Location"
3. **Existing Locked Cache** - User warned that another instance is using the cache, offered "Retry" or "Select Different Location"
4. **Stale Lock (>5 minutes)** - User warned about stale lock, which will be automatically cleaned up

**Multi-Instance Workflow:**

When setting up NumiSync Wizard on multiple machines to share a cache:
1. First machine creates cache at custom location (e.g., network share)
2. Second machine detects existing cache during setup
3. User chooses "Use Existing Cache" to share cached API data
4. Both machines can use the cache (with file locking to prevent conflicts)
5. If one machine is actively using the cache (lock present), the other machine is blocked until the lock is released

**Cache Metadata Display:**

When an existing cache is detected, the user sees:
- Number of cached entries
- Cache file size
- Last modified timestamp
- Lock status (none, unlocked, stale, active)
- Lock owner information (hostname, process ID) if locked
```

**Update "Troubleshooting" section (after line 228), add:**

```markdown
### "Cache is locked by another instance"

This occurs when you try to use a custom cache location that's currently in use by another NumiSync Wizard instance.

**Resolution:**
1. Close the other NumiSync Wizard instance
2. Wait a few seconds for the lock to release
3. Click "Retry" in the dialog

**Note:** If the other instance crashed, the lock will become stale after 5 minutes and be automatically cleaned up.
```

#### 5.2 Update INSTALLER-DISTRIBUTION-PLAN.md (docs/guides/INSTALLER-DISTRIBUTION-PLAN.md)

Update uninstaller section to handle custom cache locations:

**Update Phase 1 uninstaller instructions (around line 1215), modify the customUnInstall macro:**

```nsis
!macro customUnInstall
  ; Remove EULA marker on uninstall
  Delete "$INSTDIR\eula-installer-accepted.marker"

  ; Prompt user about cache deletion
  MessageBox MB_YESNO|MB_ICONQUESTION \
    "Do you want to delete the API cache as well?$\r$\n$\r$\n\
     This will remove all cached Numista data.$\r$\n$\r$\n\
     If you use a custom cache location or share the cache$\r$\n\
     with other machines, that cache will also be detected$\r$\n\
     and removed.$\r$\n$\r$\n\
     Select No to keep the cache for future use." \
    IDYES delete_cache IDNO skip_cache

  delete_cache:
    ; Read app-settings.json to find cache location
    ; Default location
    SetShellVarContext current
    StrCpy $0 "$APPDATA\NumiSync Wizard\api-cache.json"
    IfFileExists "$0" 0 +3
      Delete "$0"
      Delete "$APPDATA\NumiSync Wizard\api-cache.lock"

    ; Check for custom cache location in app-settings.json
    nsJSON::New
    nsJSON::LoadFile "$APPDATA\NumiSync Wizard\app-settings.json"
    nsJSON::Get "cache" "location" /end
    Pop $1 ; Result: "default" or "custom"

    StrCmp $1 "custom" 0 skip_custom_cache
      nsJSON::Get "cache" "customPath" /end
      Pop $2 ; Custom cache directory path

      StrCmp $2 "" skip_custom_cache
        ; Delete custom cache files if they exist
        IfFileExists "$2\api-cache.json" 0 skip_custom_cache
          Delete "$2\api-cache.json"
          Delete "$2\api-cache.lock"

    skip_custom_cache:
      nsJSON::Free

  skip_cache:
!macroend
```

**Add new section after "Uninstaller Recommendations" (after line 133):**

```markdown
### Uninstaller Cache Detection

The NSIS installer includes logic to detect and optionally delete cache files during uninstallation:

**Detection Process:**
1. Reads `app-settings.json` to determine cache location (`default` or `custom`)
2. If `default`: Deletes cache from `%APPDATA%\NumiSync Wizard\`
3. If `custom`: Reads `cache.customPath` and deletes cache from custom location
4. Prompts user before deletion

**User Prompt:**
```
Do you want to delete the API cache as well?

This will remove all cached Numista data.

If you use a custom cache location or share the cache
with other machines, that cache will also be detected
and removed.

Select No to keep the cache for future use.
```

**Files Deleted (if user selects Yes):**
- `api-cache.json` (default or custom location)
- `api-cache.lock` (default or custom location)

**Files Preserved:**
- `app-settings.json` (can be manually deleted by user)
- Collection-specific files in `.NumiSync` folders
- Log files

**Multi-Machine Consideration:**

If the user has set up a shared cache on a network drive:
- The uninstaller on Machine A will detect the custom cache location
- If user selects "Yes" to delete cache, it will be deleted from the shared location
- This affects Machine B's cache access
- Consider warning in the prompt about shared cache implications
```

**Add to "Requirements to Qualify" section for SignPath (around line 431), add:**

```markdown
- Uninstaller respects user privacy and provides clear choices about data deletion
- Custom cache locations are detected via app-settings.json and optionally deleted
```

---

## Files to Modify

### New Files
None - all changes are additions to existing files

### Modified Files

#### Implementation Files

1. **src/modules/cache-lock.js**
   - Add `static async checkCacheLockStatus(cachePath)` method
   - Add `static getCacheMetadata(cachePath)` method
   - Export as static utilities

2. **src/main/index.js**
   - Update `validate-cache-path` handler (lines 1718-1749) to include collision detection
   - Update `migrate-cache` handler (lines 1751-1801) to accept `useExisting` parameter
   - Add collision info to validation response
   - Add logging for collision scenarios

3. **src/main/preload.js**
   - Update `cacheSettings.migrate` signature (line 223) to include `useExisting` param

4. **src/renderer/index.html**
   - Add `cacheCollisionModal` after Settings screen
   - Add `cacheLockedModal` after collision modal
   - Include collision metadata display elements
   - Add action buttons for user choices

5. **src/renderer/app.js**
   - Add `handleCacheLocationChange()` function before settings save handler
   - Add `showCacheCollisionModal()` function
   - Add `showCacheLockedModal()` function
   - Add `saveCacheLocationSettings()` function with `useExisting` parameter
   - Add event handlers for collision modal buttons
   - Add event handlers for locked cache modal buttons
   - Add `formatBytes()` and `formatDuration()` helper functions
   - Update settings save handler (line 5378) to use collision-aware flow
   - Add `pendingCacheLocationChange` state variable

#### Documentation Files

6. **docs/reference/FILE-LOCATIONS.md**
   - Add "Cache Collision Detection" section after "Custom Cache Location" (after line 100)
   - Add multi-instance workflow documentation
   - Add cache metadata display documentation
   - Update "Troubleshooting" section with "Cache is locked" guidance (after line 228)

7. **docs/guides/INSTALLER-DISTRIBUTION-PLAN.md**
   - Update `customUnInstall` NSIS macro (around line 1215) to detect and delete custom cache
   - Add "Uninstaller Cache Detection" section after "Uninstaller Recommendations" (after line 133)
   - Document custom cache detection process
   - Add user prompt text for cache deletion
   - Add multi-machine considerations for shared caches
   - Update SignPath requirements (around line 431) to mention uninstaller behavior

#### Build Configuration Files

8. **build/installer.nsh** (will need to be updated when implementing uninstaller logic)
   - Add nsJSON plugin usage for reading app-settings.json
   - Implement cache location detection in `customUnInstall` macro
   - Add user prompt for cache deletion with multi-machine warning

---

## Verification Plan

### Manual Testing Scenarios

#### Test 1: First Machine Setup (No Collision)
1. Install NumiSync Wizard on Machine A
2. Configure custom cache location: `C:\SharedCache`
3. Expected: No collision modal, cache created successfully
4. Verify: Cache files created at `C:\SharedCache\api-cache.json`

#### Test 2: Second Machine Setup (Collision - Use Existing)
1. Ensure Machine A cache exists at `\\NetworkShare\NumiSyncCache`
2. Install NumiSync Wizard on Machine B
3. Configure custom cache: `\\NetworkShare\NumiSyncCache`
4. Expected: Collision modal appears showing cache metadata
5. Click "Use Existing Cache"
6. Expected: Settings saved, no migration, Machine B uses existing cache
7. Verify: No duplicate cache files created

#### Test 3: Second Machine Setup (Locked Cache)
1. Ensure Machine A is running with cache at `\\NetworkShare\NumiSyncCache`
2. Machine A actively using cache (lock file present)
3. On Machine B, configure custom cache: `\\NetworkShare\NumiSyncCache`
4. Expected: Locked modal appears with hostname/PID from Machine A
5. Click "Retry" while Machine A still running
6. Expected: Locked modal appears again
7. Close Machine A
8. Click "Retry"
9. Expected: Collision modal appears (lock now released)
10. Click "Use Existing Cache"
11. Expected: Success

#### Test 4: Stale Lock Detection
1. Create cache at `C:\TestCache\api-cache.json`
2. Create fake stale lock file with timestamp > 5 minutes old
3. Configure custom cache to `C:\TestCache`
4. Expected: Collision modal shows warning about stale lock
5. Click "Use Existing Cache"
6. Expected: Stale lock cleaned up automatically on first use

#### Test 5: Corrupted Cache Detection
1. Create `C:\TestCache\api-cache.json` with invalid JSON
2. Configure custom cache to `C:\TestCache`
3. Expected: Collision modal shows corruption warning
4. Click "Use Existing Cache"
5. Expected: Warning that cache may be rebuilt
6. Verify: Cache is rebuilt with valid structure on first use

#### Test 6: Network Path Unavailable
1. Configure custom cache to `\\UnavailableServer\Cache`
2. Expected: Validation fails with "Path does not exist" error
3. No collision modal appears (path validation fails first)

#### Test 7: Select Different Location
1. Configure custom cache to location with existing cache
2. Collision modal appears
3. Click "Select Different Location"
4. Expected: Browse dialog opens
5. Select different path
6. Expected: Proceeds without collision (if new path is empty)

### Automated Testing (Future Enhancement)

Consider adding unit tests for:
- `CacheLock.checkCacheLockStatus()` with various lock scenarios
- `CacheLock.getCacheMetadata()` with valid/invalid/missing caches
- Collision detection in `validate-cache-path` handler
- Migration logic with `useExisting` flag

---

## Security Considerations

1. **Lock file validation**: Ensure lock files can't be spoofed to denial-of-service other instances
2. **Path traversal**: Validate custom paths don't escape intended directories
3. **File permissions**: Verify user has appropriate permissions before showing collision options
4. **Network shares**: Warn users about performance implications of network cache locations

---

## User Experience Flow

### Happy Path (Multi-Machine Setup)
```
User installs on Machine B
├─→ Selects custom cache location (network share)
├─→ Collision detected (cache from Machine A exists)
├─→ Modal: "Existing Cache Detected - Use or Select Different?"
├─→ User clicks "Use Existing Cache"
├─→ Settings saved immediately
└─→ Machine B now shares cache with Machine A ✅
```

### Edge Case (Active Instance Collision)
```
User selects location with active lock
├─→ Collision detected + Lock is active
├─→ Modal: "Cache Locked - Close other instance"
├─→ User clicks "Retry"
│   ├─→ If still locked: Show modal again
│   └─→ If released: Show collision modal → User chooses
└─→ Success ✅
```

### Error Case (Invalid Cache)
```
User selects location with corrupted cache
├─→ Collision detected + Cache invalid
├─→ Modal: "Existing Cache Detected (⚠️ may be corrupted)"
├─→ User clicks "Use Existing Cache"
├─→ Warning shown: "Cache may be rebuilt"
└─→ Cache rebuilt on first API call ✅
```

---

## Implementation Notes

- All collision detection is non-destructive (read-only checks)
- Lock status checks use same 5-minute stale threshold as CacheLock
- User always has option to cancel and keep current settings
- Migration only happens when user explicitly confirms
- Clear messaging explains implications of each choice
- Retry logic for transient network/lock issues
- Graceful fallback if collision detection fails (proceed with warning)

---

## Success Criteria

✅ User is always aware when selecting a cache location that already contains cache files
✅ User can choose to use existing cache (multi-machine scenario) or select different location
✅ Active lock detection prevents cache corruption from simultaneous access
✅ Clear error messages guide user when cache is locked by another instance
✅ Retry logic allows user to resolve lock conflicts without restarting app
✅ Stale locks (>5 minutes) are treated as available with automatic cleanup
✅ Cache metadata (size, entries, last modified) helps user make informed decisions
✅ No silent overwrites of existing cache files
✅ Settings save flow is non-destructive (can cancel at any point)
✅ Multi-machine workflow is intuitive and clearly documented in UI
