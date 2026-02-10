# Structured Logging, Support Workflow, and Report an Issue

**Created:** February 8, 2026
**Status:** Complete

---

## Context

When NumiSync Wizard is distributed as a standalone app, there is no console visible to capture debug output. All 383 `console.*` statements across 16 files produce output that is silently lost. Users reporting issues have no way to provide diagnostic information.

This plan:
1. Migrates `console.*` to `electron-log` for persistent file logging
2. Adds a user-configurable log level setting in App Settings
3. Adds a **"Report an Issue"** Help menu item that opens a support modal with links + log download
4. Adds a **"Download Log File"** button in the Logging settings group
5. Updates `docs/user-manual.html` with a new "Getting Help" section

`electron-log` v5.4.3 is already installed and used by `updater.js`. This plan extends it to the entire codebase.

**Log file location (automatic):** `%APPDATA%/NumiSync Wizard/logs/numisync-wizard.log`

---

## Architecture Decisions

### 1. Centralized logger module: `src/main/logger.js`

Follows the precedent set by `updater.js` -- infrastructure utilities live in `src/main/`. Configures transports, rotation, and format in one place. All other files import this singleton. Exports a `setLogLevel(level)` function so the level can be changed at runtime when settings are saved.

### 2. Modules import logger directly (no constructor injection)

Each module does `const log = require('../main/logger').scope('ModuleName')` at the top. The `.scope()` method tags log entries with the module name (e.g., `[NumistaAPI]`, `[Database]`). No constructor signature changes needed.

### 3. Renderer (app.js) -- TARGETED CHANGES ONLY

electron-log v5's `spyRendererConsole: true` option automatically captures all renderer `console.*` calls and forwards them to the log file via IPC. Existing console.* calls in app.js stay as-is (avoids emoji encoding corruption per CLAUDE.md). Renderer changes are limited to: log level setting in settings handlers, "Report an Issue" modal function, and "Download Log" button handler.

### 4. User-configurable log level in App Settings

A new "Logging" setting group in the settings screen lets users choose the file log level. This is critical for support: users can be told "set log level to Debug and reproduce the issue" to get detailed diagnostics.

- **Setting name:** `logLevel`
- **Options:** `error`, `warn`, `info` (default), `debug`
- **Default:** `info` -- captures operational milestones + errors without verbose trace noise
- **Storage:** `settings.json` alongside existing settings (e.g., `"logLevel": "info"`)
- **Applied:** On app startup (read from settings.json in logger.js) and live when settings are saved (via `setLogLevel()` call in save-app-settings handler)

### 5. "Report an Issue" modal (follows About dialog pattern)

Uses the existing `showModal()` function with dynamic HTML content, same as `showAboutDialog()` (app.js line 352). The modal contains:
- Link to User Manual (opens manual window via `window.electronAPI.openManual()`)
- Link to GitHub Issues (`https://github.com/inguy24/Numisync-Wizard/issues`) via `window.electronAPI.openExternal()`
- "Download Log File" button that triggers a Save As dialog via new IPC handler `export-log-file`
- Brief instructions on how to report effectively (set Debug, reproduce, download log, attach to issue)

Triggered from Help menu via `sendMenuAction('menu:report-issue')`, handled in `handleMenuAction()`.

### 6. "Download Log File" IPC handler

New IPC handler `export-log-file` in index.js that:
1. Gets the current log file path from electron-log
2. Opens a `dialog.showSaveDialog()` with default filename `numisync-wizard-log-YYYY-MM-DD.log`
3. Copies the log file to the user-chosen location via `fs.copyFileSync()`

This is reused by both the "Report an Issue" modal and the Settings screen "Download Log" button.

### 7. Log level mapping for code migration

| electron-log level | Source | Examples |
|---|---|---|
| `log.error()` | `console.error()` | Catch blocks, failed operations |
| `log.warn()` | `console.warn()` | Non-fatal issues, blocked fields |
| `log.info()` | Key `console.log()` | Collection loaded, search executed, backup created |
| `log.debug()` | Verbose `console.log()` | SQL params, field mappings, `=== DEBUG ===` blocks |

---

## Implementation Steps

### Step 1: Create `src/main/logger.js` (new file)

~40 lines. Configures electron-log v5:
- Reads `logLevel` from `settings.json` at startup (with `info` as default)
- File transport: level from settings, 5 MB max size, `numisync-wizard.log` filename
- Console transport: `debug` in dev, disabled in production
- `spyRendererConsole: true` to capture renderer logs
- Format: `[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}`
- Exports configured `log` instance + `setLogLevel(level)` function for runtime changes

**Key context:** Settings file is at `path.join(app.getPath('userData'), 'settings.json')`. Use `require('electron').app` but read synchronously at import time since logger is loaded before app is ready -- use `try/catch` with a fallback to `'info'` if the file doesn't exist yet.

### Step 2: Update `src/main/updater.js` (1 change)

Change `require('electron-log')` (line 8) to `require('./logger')`. Remove line 12 (`autoUpdater.logger.transports.file.level = 'info'`) since this is now centralized. Keep `autoUpdater.logger = log` (line 11).

### Step 3: Update small modules (1-3 statements each)

Files and their console.* counts:
- `src/modules/settings-manager.js` -- 3 `console.error` (lines 148, 229, 464)
- `src/modules/api-cache.js` -- 1 `console.warn` (line 51), 1 `console.error` (line 80)
- `src/modules/image-handler.js` -- 1 `console.error` (line 58)
- `src/utils/freshness-calculator.js` -- 1 `console.error` (line 87)

Each file: add `const log = require('../main/logger').scope('Name')` (or `'../../main/logger'` for utils), replace `console.error/warn` with `log.error/warn`.

Scope names: `Settings`, `ApiCache`, `ImageHandler`, `Freshness`

### Step 4: Update `src/modules/metadata-manager.js` (5 statements)

Add `const log = require('../main/logger').scope('Metadata')`.

- Line 64 (`Malformed metadata block`): `log.warn()`
- Line 82 (`Invalid metadata structure`): `log.warn()`
- Line 86 (`Failed to parse metadata JSON`): `log.error()`
- Line 92 (`Error reading enrichment metadata`): `log.error()`
- Line 129 (`Error writing enrichment metadata`): `log.error()`

### Step 5: Update `src/modules/progress-tracker.js` (5 statements)

Add `const log = require('../main/logger').scope('Progress')`.

- Line 65 (`Error loading progress file`): `log.error()`
- Line 129 (`Rebuilding progress from database metadata`): `log.info()`
- Line 161 (`Progress rebuilt: N coins processed`): `log.info()`
- Line 164 (`Error rebuilding progress`): `log.error()`
- Line 330 (`Error saving progress file`): `log.error()`

### Step 6: Update `src/modules/numista-api.js` (33 statements)

Add `const log = require('../main/logger').scope('NumistaAPI')`.

Most statements become `log.debug()` (smart issue matching traces at lines 344-481, fetch step details at lines 505-536). Exceptions:
- Line 789 (`Resolved issuer`): `log.info()`
- Line 795 (`Could not resolve issuer`): `log.warn()`
- Line 799 (`Failed to resolve issuer code`): `log.warn()`

### Step 7: Update `src/modules/opennumismat-db.js` (44 statements, HAS EMOJIS)

Add `const log = require('../main/logger').scope('Database')`.

**EMOJI HANDLING (CLAUDE.md compliance):** Lines with emojis must have emoji characters replaced with ASCII:
- Line 332: `console.log('✔ Field...')` -> `log.debug('[OK] Field...')`
- Line 334: `console.warn('✗ Field...')` -> `log.warn('[MISMATCH] Field...')`

Level assignments:
- SQL execution details (lines 135-136, 144): `log.debug()`
- `Database file saved` (line 149): `log.debug()`
- `Error in _run` (line 152): `log.error()`
- Export/save operations (lines 164-176): `log.debug()`
- `Error saving database file` (line 178): `log.error()`
- `Blocked attempt to update protected field` (line 303): `log.warn()`
- `No fields to update` (line 309): `log.debug()`
- `Updating coin` (line 313): `log.debug()`
- Field verification (lines 332-334): `log.debug()` / `log.warn()`
- `Pruned old backup` (line 411): `log.info()`
- Image read errors (lines 469, 497): `log.error()`
- Image storage operations (lines 584-710): `log.debug()`

### Step 8: Update `src/modules/field-mapper.js` (35 statements, HAS EMOJIS)

Add `const log = require('../main/logger').scope('FieldMapper')`.

**EMOJI HANDLING:** Replace emojis with ASCII:
- Line 128: `'✔ Added...'` -> `'[OK] Added...'`
- Line 286: `'✔ Adding...'` -> `'[OK] Adding...'`
- Line 288: `'✗ Skipping...'` -> `'[SKIP] Skipping...'`

All statements become `log.debug()` except:
- Line 133 (`Error mapping field`): `log.error()`

### Step 9: Update `src/main/index.js` (160 statements + menu + IPC + settings)

Largest file (~2812 lines). Five parts:

**a)** Add import after existing module imports (around line 30):
```javascript
const log = require('./logger');
```

**b)** Replace 160 `console.*` calls. Level assignment rules:
- All `console.error(...)` -> `log.error(...)` (~55 statements)
- All `console.warn(...)` -> `log.warn(...)` (~3 statements)
- Operational milestones `console.log(...)` -> `log.info(...)` (~30 statements):
  - Collection loading/summary, search execution, backup creation, settings sync, metadata writes, progress rebuilds, startup message, API key migration
- Verbose traces `console.log(...)` -> `log.debug(...)` (~70 statements):
  - `=== SECTION HEADER ===` debug blocks, fetch parameters, field details, image byte counts, JSON dumps, `[LICENSE DEBUG]` block, SQL parameters

**c)** Add "Report an Issue..." to Help menu (line ~492, before "Check for Updates..."):
```javascript
{
  label: 'Report an Issue...',
  click: () => sendMenuAction('menu:report-issue')
},
{ type: 'separator' },
```

Resulting Help menu:
```
Help
  User Manual (F1)
  ---
  About NumiSync Wizard (Win/Linux only)
  ---
  Numista Website
  Get Numista API Key
  ---
  Purchase License Key (conditional)
  ---
  View License Agreement
  ---
  Report an Issue...       <-- NEW
  ---
  Check for Updates...
```

**d)** Add `export-log-file` IPC handler (in the IPC handlers section):
```javascript
ipcMain.handle('export-log-file', async () => {
  const logPath = log.transports.file.getFile().path;
  const date = new Date().toISOString().slice(0, 10);
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: `numisync-wizard-log-${date}.log`,
    filters: [{ name: 'Log Files', extensions: ['log', 'txt'] }]
  });
  if (!result.canceled && result.filePath) {
    fs.copyFileSync(logPath, result.filePath);
    return { success: true, filePath: result.filePath };
  }
  return { success: false };
});
```

**e)** In `save-app-settings` handler (line 1403): after the existing settings syncs (API key, rate limit, backup), add:
```javascript
// Sync log level to logger
if (settings.logLevel) {
  const { setLogLevel } = require('./logger');
  setLogLevel(settings.logLevel);
  log.info('Log level changed to:', settings.logLevel);
}
```

### Step 10: Expose new IPC methods in `src/main/preload.js`

Add to the API methods object exposed via `contextBridge.exposeInMainWorld('electronAPI', ...)`:
```javascript
exportLogFile: () => ipcRenderer.invoke('export-log-file'),
```

**Key context:** The preload.js exposes methods via `contextBridge` (line 1). The API object starts around line 109. Follow the existing pattern of other `ipcRenderer.invoke()` calls.

### Step 11: Add log level setting + download button to Settings UI

**`src/renderer/index.html`** -- Add new "Logging" setting group before the "Safety" section (insert before line 510, the `<div class="setting-group">` that contains `<h3>Safety</h3>`):

```html
<div class="setting-group">
  <h3>Logging</h3>
  <label for="logLevelSelect">Log detail level:</label>
  <select id="logLevelSelect">
    <option value="error">Error - Errors only</option>
    <option value="warn">Warning - Errors + warnings</option>
    <option value="info" selected>Info - Standard (recommended)</option>
    <option value="debug">Debug - Verbose (for troubleshooting)</option>
  </select>
  <p class="setting-help">
    Controls how much detail is written to the log file. Use <strong>Debug</strong> when
    troubleshooting an issue, then switch back to <strong>Info</strong> for normal use.
  </p>
  <button id="downloadLogBtn" class="btn btn-secondary" style="margin-top: 10px;">
    Download Log File
  </button>
  <p class="setting-help">
    Save a copy of the application log to share when reporting an issue.
  </p>
</div>
```

**`src/renderer/app.js`** -- Settings handler changes:

1. In `loadSettingsScreen()` (line 4874), after the cache TTL loading (around line 4896), add:
```javascript
const logLevelSelect = document.getElementById('logLevelSelect');
if (logLevelSelect) logLevelSelect.value = AppState.settings.logLevel || 'info';
```

2. In save handler (line 5040), add to the settings object:
```javascript
logLevel: document.getElementById('logLevelSelect').value,
```

3. In reset handler (line 5086), add to defaultSettings:
```javascript
logLevel: 'info',
```

4. Add click handler for download button (near the other settings button handlers, around line 5108):
```javascript
document.getElementById('downloadLogBtn').addEventListener('click', async () => {
  try {
    const result = await window.electronAPI.exportLogFile();
    if (result.success) {
      showModal('Success', 'Log file saved successfully.');
    }
  } catch (error) {
    showModal('Error', 'Failed to save log file: ' + error.message);
  }
});
```

### Step 12: Add "Report an Issue" modal to `src/renderer/app.js`

New function `showReportIssueDialog()` following the `showAboutDialog()` pattern (line 352). Place it near `showAboutDialog()` for code organization.

```javascript
/**
 * Show the Report an Issue dialog with support links and log download
 */
function showReportIssueDialog() {
  const html = `
    <div style="text-align: left;">
      <p>If you're experiencing a problem or have a suggestion, here's how to get help:</p>

      <h4 style="margin: 15px 0 8px;">1. Check the User Manual</h4>
      <p>The manual covers common issues and FAQs.</p>
      <a href="#" id="reportManualLink" style="color: var(--accent);">Open User Manual</a>

      <h4 style="margin: 15px 0 8px;">2. Report on GitHub</h4>
      <p>Search existing issues or create a new one.</p>
      <a href="#" id="reportGithubLink" style="color: var(--accent);">Open GitHub Issues</a>

      <h4 style="margin: 15px 0 8px;">3. Include Your Log File</h4>
      <p>For troubleshooting, set the log level to <strong>Debug</strong> in Settings,
         reproduce the issue, then download and attach the log file.</p>
      <button id="reportDownloadLogBtn" class="btn btn-secondary" style="margin-top: 8px;">
        Download Log File
      </button>
    </div>
  `;

  showModal('Report an Issue', html);

  setTimeout(() => {
    document.getElementById('reportManualLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      window.electronAPI.openManual();
    });
    document.getElementById('reportGithubLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      window.electronAPI.openExternal('https://github.com/inguy24/Numisync-Wizard/issues');
    });
    document.getElementById('reportDownloadLogBtn')?.addEventListener('click', async () => {
      const result = await window.electronAPI.exportLogFile();
      if (result.success) {
        showModal('Success', 'Log file saved successfully.');
      }
    });
  }, 0);
}
```

Add to `handleMenuAction()` switch statement (around line 6530, near the existing `case 'about':` at line 6530):
```javascript
case 'report-issue':
  showReportIssueDialog();
  break;
```

### Step 13: Update `docs/user-manual.html`

Add a new **"Getting Help"** section between Troubleshooting (section 17) and FAQ (section 18). This becomes section 18, bumping FAQ to 19 and subsequent sections.

**Sidebar nav** -- After `<li><a href="#troubleshooting">17. Troubleshooting</a></li>` (line 456), add:
```html
<li><a href="#getting-help">18. Getting Help</a></li>
```
Then update subsequent entries: FAQ becomes 19, API Cache becomes 20, etc.

**Content** -- After the Troubleshooting "Back to top" link (after line 1611), insert:
```html
<!-- ──────────────────────────────────────────────────────────────────────── -->
<h2 id="getting-help">18. Getting Help</h2>

<h3>Report an Issue</h3>
<p>If you encounter a bug or unexpected behavior:</p>
<ol>
  <li>Open <strong>Help &rarr; Report an Issue</strong> from the menu bar.</li>
  <li>Check the <a href="#troubleshooting">Troubleshooting</a> section to see if your
      issue is already covered.</li>
  <li>If not, click <strong>Open GitHub Issues</strong> to search for existing reports
      or create a new one.</li>
</ol>

<h3>Including Log Files</h3>
<p>Log files help diagnose issues by recording what the application was doing when a
   problem occurred. To provide a useful log:</p>
<ol>
  <li>Go to <strong>Settings &rarr; Logging</strong> and set the log level to
      <strong>Debug</strong>.</li>
  <li>Reproduce the issue (perform the action that caused the problem).</li>
  <li>Click <strong>Download Log File</strong> in Settings, or use
      <strong>Help &rarr; Report an Issue &rarr; Download Log File</strong>.</li>
  <li>Attach the downloaded <code>.log</code> file to your GitHub issue.</li>
  <li>Set the log level back to <strong>Info</strong> for normal use.</li>
</ol>

<div class="callout-info">
  <strong>Privacy:</strong> Log files contain technical details about application operations
  (API calls, database operations, error messages) but do not contain your personal data,
  API keys, or collection content. You can open the .log file in any text editor to review
  its contents before sharing.
</div>

<h3>Resources</h3>
<table>
  <tr><th>Resource</th><th>Description</th></tr>
  <tr>
    <td><a href="https://github.com/inguy24/Numisync-Wizard/issues" target="_blank">GitHub Issues</a></td>
    <td>Report bugs, request features, or search existing issues</td>
  </tr>
  <tr>
    <td><a href="https://en.numista.com/api/" target="_blank">Numista API Dashboard</a></td>
    <td>Check your API key status and monthly usage</td>
  </tr>
</table>

<a href="#introduction" class="back-to-top">Back to top &uarr;</a>
```

Also update section numbering throughout the document:
- FAQ: 17 -> 19 (heading, sidebar, any internal references)
- API Cache & Usage: 18 -> 20
- Appendix A and B: update if they have numbered references

---

## Key Reference Points for Implementation

### Existing patterns to follow

| Pattern | Location | Notes |
|---------|----------|-------|
| `showAboutDialog()` | `app.js:352` | Template for `showReportIssueDialog()` -- dynamic HTML in `showModal()`, `setTimeout` for event wiring |
| `showModal()` | `app.js:314` | Generic modal function: `showModal(title, bodyHtml, showCancel?)` |
| `handleMenuAction()` | `app.js:6528` | Switch statement handling menu events -- add `case 'report-issue'` |
| `sendMenuAction()` | `index.js` | Sends menu action string to renderer via `mainWindow.webContents.send()` |
| `openUserManual()` | `index.js:137` | Opens manual in separate BrowserWindow |
| `window.electronAPI.openExternal()` | `preload.js` | Already exposed, opens URLs in system browser |
| `window.electronAPI.openManual()` | `preload.js` | Already exposed, triggers manual window |
| `loadSettingsScreen()` | `app.js:4874` | Loads saved settings values into form elements |
| Save settings handler | `app.js:5038` | Collects form values into settings object |
| Reset settings handler | `app.js:5085` | Defines default values for reset |
| `save-app-settings` IPC | `index.js:1403` | Merges new settings with existing, writes to `settings.json` |
| Settings file path | `index.js:1405` | `path.join(app.getPath('userData'), 'settings.json')` |

### Console.* statement counts by file

| File | `console.log` | `console.error` | `console.warn` | Total |
|------|:---:|:---:|:---:|:---:|
| `src/main/index.js` | 93 | 64 | 3 | 160 |
| `src/renderer/app.js` | 41 | 49 | 4 | 94 (NO CHANGES - captured by spy) |
| `src/modules/opennumismat-db.js` | 34 | 7 | 3 | 44 |
| `src/modules/field-mapper.js` | 34 | 1 | 0 | 35 |
| `src/modules/numista-api.js` | 32 | 0 | 1 | 33 |
| `src/modules/progress-tracker.js` | 2 | 3 | 0 | 5 |
| `src/modules/metadata-manager.js` | 0 | 3 | 2 | 5 |
| `src/modules/settings-manager.js` | 0 | 3 | 0 | 3 |
| `src/modules/api-cache.js` | 0 | 1 | 1 | 2 |
| `src/modules/image-handler.js` | 0 | 1 | 0 | 1 |
| `src/utils/freshness-calculator.js` | 0 | 1 | 0 | 1 |

### Files with emojis (CLAUDE.md encoding risk)

- `src/modules/opennumismat-db.js` -- lines 332, 334 (checkmark/cross in log messages)
- `src/modules/field-mapper.js` -- lines 128, 286, 288 (checkmark/cross in log messages)
- Replace emoji chars with ASCII equivalents: `[OK]`, `[MISMATCH]`, `[SKIP]`

---

## Files Modified

| File | Action |
|------|--------|
| `src/main/logger.js` | **Create** -- configured electron-log singleton |
| `src/main/updater.js` | Redirect import to `./logger` |
| `src/main/index.js` | Replace 160 console.*, add menu item, add `export-log-file` IPC, log level sync |
| `src/main/preload.js` | Expose `exportLogFile` IPC method |
| `src/modules/numista-api.js` | Replace 33 console.* |
| `src/modules/opennumismat-db.js` | Replace 44 console.* + emoji fix |
| `src/modules/field-mapper.js` | Replace 35 console.* + emoji fix |
| `src/modules/progress-tracker.js` | Replace 5 console.* |
| `src/modules/metadata-manager.js` | Replace 5 console.* |
| `src/modules/settings-manager.js` | Replace 3 console.* |
| `src/modules/api-cache.js` | Replace 2 console.* |
| `src/modules/image-handler.js` | Replace 1 console.* |
| `src/utils/freshness-calculator.js` | Replace 1 console.* |
| `src/renderer/index.html` | Add Logging setting group (dropdown + download button) |
| `src/renderer/app.js` | Log level load/save/reset, `showReportIssueDialog()`, download log handler, menu action |
| `docs/user-manual.html` | Add "Getting Help" section (18), renumber FAQ (19) and subsequent sections |

---

## Verification

1. `npm start` launches without errors
2. Log file appears at `%APPDATA%/NumiSync Wizard/logs/numisync-wizard.log`
3. Log entries show correct timestamps, levels, and scope labels
4. Console still shows output during development
5. **Settings > Logging:** dropdown loads saved value and persists on save
6. **Settings > Logging:** changing to Debug immediately produces more verbose file output
7. **Settings > Logging:** "Download Log File" button opens Save As dialog and copies log
8. **Settings > Logging:** Reset to Defaults sets log level back to Info
9. **Help > Report an Issue:** modal opens with User Manual link, GitHub Issues link, Download Log button
10. **Help > Report an Issue > Download Log File:** Save As dialog works correctly
11. **Help > Report an Issue > Open GitHub Issues:** opens `https://github.com/inguy24/Numisync-Wizard/issues`
12. **Help > Report an Issue > Open User Manual:** opens the manual window
13. Full workflow test: open collection -> search -> fetch -> merge -> verify log captures entire flow
14. Files with emojis (opennumismat-db.js, field-mapper.js): verify no encoding corruption with `file -i`
15. User manual: "Getting Help" section renders correctly, sidebar nav link works, section numbering is consistent
16. Update CHANGELOG.md and PROJECT-REFERENCE.md after completion
