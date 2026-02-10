# File Locations Reference

**Purpose:** Documents all file locations used by NumiSync Wizard for uninstaller integration and user reference.

**Last Updated:** February 9, 2026

---

## Overview

NumiSync Wizard stores files in two categories:
1. **Collection-Specific Files** - Stored next to each `.db` file in a `.NumiSync` subdirectory
2. **App-Wide Files** - Stored in the operating system's standard application data directory

---

## Collection-Specific Files

These files are stored in a `.NumiSync` subdirectory next to each OpenNumismat database file.

### Directory Structure

```
/path/to/mycollection.db
/path/to/.NumiSync/                           # Hidden folder (dot prefix)
    ├── mycollection_settings.json            # Collection settings
    ├── mycollection_progress.json            # Enrichment progress
    └── backups/
        ├── mycollection_2026-02-09_143522.db
        ├── mycollection_2026-02-09_151030.db
        └── mycollection_2026-02-10_091245.db
```

### Files

| File | Description | Can Delete? |
|------|-------------|-------------|
| `{name}_settings.json` | API key, fetch settings, field mappings, UI preferences | Yes, but will lose settings |
| `{name}_progress.json` | Tracks enrichment status per coin | Yes, but will lose progress tracking |
| `backups/*.db` | Automatic database backups | Yes, but recommended to keep at least one |

### Migration Notes

- **Old Location (pre-v3.0):** Files were stored directly next to the `.db` file
  - `mycollection_settings.json` → `.NumiSync/mycollection_settings.json`
  - `mycollection_enrichment_progress.json` → `.NumiSync/mycollection_progress.json`
  - `backups/` → `.NumiSync/backups/`
- **Migration:** Automatic and silent on first launch after upgrading to v3.0
- **Rollback:** Old files are preserved (not deleted) for safety

---

## App-Wide Files

These files are stored in the operating system's standard application data directory and apply to all collections.

### Platform-Specific Paths

| Platform | Default Location |
|----------|------------------|
| **Windows** | `%APPDATA%\NumiSync Wizard\` |
| **macOS** | `~/Library/Application Support/NumiSync Wizard/` |
| **Linux** | `~/.config/NumiSync Wizard/` |

### Directory Structure

```
{userData}/
├── app-settings.json                # App-wide settings (v3.0+)
├── api-cache.json                   # Numista API cache (v3.0+)
├── api-cache.lock                   # Cache lock file (v3.0+)
└── logs/
    └── numisync-wizard.log          # Application log file
```

### Files

| File | Description | Can Delete? |
|------|-------------|-------------|
| `app-settings.json` | Window state, recent collections, cache config, EULA acceptance | Yes, will reset app preferences |
| `api-cache.json` | Cached Numista API responses (issuers, types, issues) | Yes, but will increase API usage |
| `api-cache.lock` | Lock file for multi-machine cache access | Automatically managed, don't delete manually |
| `logs/numisync-wizard.log` | Application log file for troubleshooting | Yes, a new one will be created |

### Custom Cache Location

If the user configures a custom cache location (for multi-machine scenarios), the cache files will be stored there instead:

```
{custom-path}/
├── api-cache.json
└── api-cache.lock
```

To find the current cache location:
1. Read `app-settings.json`
2. Check `cache.location` field:
   - `"default"` → Cache is in userData directory
   - `"custom"` → Cache is in `cache.customPath` directory

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

### Migration Notes

- **Old Files (pre-v3.0):**
  - `settings.json` → `app-settings.json` (with structure upgrade)
  - `numista_api_cache.json` → `api-cache.json`
- **Migration:** Automatic on first launch, old files preserved

---

## Uninstaller Recommendations

### What to Delete on Uninstall

**Minimal (Application Only):**
- Application executable and installation directory
- Keep all data files

**Standard (Application + App-Wide Data):**
- Application executable and installation directory
- App-wide files: `{userData}/NumiSync Wizard/`
- Keep collection-specific files (`.NumiSync` folders)

**Complete (Everything):**
- Application executable and installation directory
- App-wide files: `{userData}/NumiSync Wizard/`
- All `.NumiSync` folders (requires scanning user's filesystem)

**Recommended Approach:**
1. Delete application and app-wide files by default
2. Prompt user: "Do you also want to delete collection-specific data (settings, progress, backups)?"
   - If Yes: Scan recent collections list and delete their `.NumiSync` folders
   - If No: Leave `.NumiSync` folders intact

### Finding Collection-Specific Files

To locate `.NumiSync` folders:

1. Read recent collections from `app-settings.json`:
   ```json
   {
     "recentCollections": [
       "C:\\Users\\Name\\Documents\\coins.db",
       "D:\\Backups\\collection.db"
     ]
   }
   ```

2. For each collection path, check for `.NumiSync` subdirectory:
   ```
   C:\Users\Name\Documents\.NumiSync\
   D:\Backups\.NumiSync\
   ```

3. Delete if found (optional, based on user choice)

---

## Manual Cleanup

If the user wants to manually remove NumiSync Wizard completely:

### Windows

```powershell
# Remove application (if installed)
# Use Add/Remove Programs or the installer

# Remove app-wide data
Remove-Item "$env:APPDATA\NumiSync Wizard" -Recurse -Force

# Remove collection-specific data (optional)
# Find all .NumiSync folders next to .db files
Get-ChildItem -Path C:\ -Filter ".NumiSync" -Recurse -Directory -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
```

### macOS / Linux

```bash
# Remove application
# Drag to Trash (macOS) or use package manager (Linux)

# Remove app-wide data
rm -rf ~/Library/Application\ Support/NumiSync\ Wizard  # macOS
rm -rf ~/.config/NumiSync\ Wizard                        # Linux

# Remove collection-specific data (optional)
find ~ -type d -name ".NumiSync" -exec rm -rf {} +
```

---

## Hidden Folder Visibility

The `.NumiSync` folder is **hidden by default** on Mac/Linux (dot prefix) but **visible on Windows**.

### Making .NumiSync Visible

**Windows:**
- Already visible (dot prefix doesn't hide folders on Windows)

**macOS:**
- Finder: Press `Cmd + Shift + .` to toggle hidden files
- Terminal: `ls -la` to list hidden items

**Linux:**
- File Manager: Press `Ctrl + H` to toggle hidden files
- Terminal: `ls -la` to list hidden items

---

## File Size Estimates

Typical file sizes (for planning disk space):

| Item | Typical Size | Notes |
|------|--------------|-------|
| Collection settings | 5-20 KB | Depends on field mapping customization |
| Progress file | 50-500 KB | Depends on collection size |
| Single backup | Same as `.db` | Typically 1-50 MB |
| API cache | 1-10 MB | Grows with unique API calls |
| Log file | 1-5 MB | Rotated automatically |

**Total per collection:** ~10-100 MB (including backups)
**App-wide:** ~5-15 MB

---

## Troubleshooting

### "Can't find my settings after upgrade"

Settings were migrated to `.NumiSync` folder. Check:
```
{collection-directory}/.NumiSync/{collection-name}_settings.json
```

### "Backups disappeared"

Backups moved to:
```
{collection-directory}/.NumiSync/backups/
```

Old backups from previous versions may still exist in the old location:
```
{collection-directory}/backups/
```

### "How do I reset everything?"

1. Close NumiSync Wizard
2. Delete app-wide data folder (see Platform-Specific Paths above)
3. Delete `.NumiSync` folders next to your collection files
4. Restart NumiSync Wizard - it will recreate defaults

### "Cache is locked by another instance"

This occurs when you try to use a custom cache location that's currently in use by another NumiSync Wizard instance.

**Resolution:**
1. Close the other NumiSync Wizard instance
2. Wait a few seconds for the lock to release
3. Click "Retry" in the dialog

**Note:** If the other instance crashed, the lock will become stale after 5 minutes and be automatically cleaned up.

---

## Version History

| Version | Changes |
|---------|---------|
| 3.0 | Introduced `.NumiSync` subdirectories, renamed cache files, configurable cache location |
| 2.0 | Collection-specific settings, progress tracking |
| 1.0 | App-wide settings only |
