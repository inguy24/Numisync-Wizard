# NumiSync Wizard for OpenNumismat - Project Reference

**Purpose:** Architecture reference for implementation. Read when building features.
**Last Updated:** February 10, 2026 (Settings Consolidation + License Validation Fixes + Polar Environment Guide)

---

## Project Structure

```
numismat-enrichment/
├── src/
│   ├── main/
│   │   ├── index.js          # Main process, IPC handlers
│   │   ├── preload.js        # Renderer/Main bridge
│   │   ├── logger.js         # Centralized electron-log configuration
│   │   └── updater.js        # Auto-update module (electron-updater)
│   ├── renderer/
│   │   ├── index.html        # UI structure (HAS EMOJIS)
│   │   ├── app.js            # UI logic (HAS EMOJIS)
│   │   ├── styles/main.css   # Styles
│   │   └── images/           # Logo and branding assets
│   │       ├── logo_with_text.svg   # Full logo (header, welcome, about, EULA, manual)
│   │       └── logo_no_text.svg     # Icon-only logo (source for app icon)
│   ├── resources/            # Runtime bundled resources
│   │   └── user-manual.html  # User manual (Help > User Manual, F1)
│   ├── data/
│   │   ├── denomination-aliases.json # Denomination variant mappings
│   │   └── issuer-aliases.json      # Country/territory name aliases
│   └── modules/              # Business logic modules
│       ├── opennumismat-db.js      # SQLite database access
│       ├── numista-api.js          # Numista API wrapper
│       ├── field-mapper.js         # Field mapping logic
│       ├── default-field-mapping.js # Field definitions + NUMISTA_SOURCES
│       ├── metadata-manager.js     # Note field HTML comment parsing
│       ├── progress-tracker.js     # Progress tracking
│       ├── settings-manager.js     # Settings persistence
│       ├── freshness-calculator.js # Pricing age calculation
│       ├── image-handler.js        # Image operations
│       ├── mintmark-normalizer.js  # Mintmark utilities
│       ├── denomination-normalizer.js # Denomination alias normalization
│       └── api-cache.js              # Persistent API cache + monthly usage
├── build/                    # Build resources (icons, installer scripts)
│   ├── icon.png              # App icon source (512x512)
│   ├── icon.ico              # Windows app icon (256x256)
│   ├── icon.icns             # macOS app icon (all resolutions)
│   ├── icons/                # Linux multi-resolution PNGs (16x16-512x512)
│   ├── logo_no_text.svg      # Vector source for app icon
│   ├── ICONS-README.txt      # Icon conversion instructions
│   ├── installer.nsh         # NSIS custom script (EULA marker, cache deletion prompt)
│   └── eula/
│       └── eula-windows.rtf  # RTF EULA for NSIS installer
├── scripts/                  # Build/version scripts
│   ├── validate-version.js   # Pre-version validation
│   ├── post-version.js       # Post-version reminders
│   ├── generate-linux-icons.ps1   # PowerShell icon generator (Linux)
│   └── generate-macos-icon.js     # Node.js icon generator (macOS)
├── .github/
│   └── workflows/            # GitHub Actions CI/CD
│       ├── build.yml         # Multi-platform release builds
│       └── pr-check.yml      # PR validation
├── docs/                     # GitHub Pages + Project documentation
│   ├── index.html            # GitHub Pages homepage (to be created)
│   ├── _config.yml           # Jekyll configuration (optional, to be created)
│   ├── reference/            # Architecture & API docs
│   │   ├── PROJECT-REFERENCE.md  # THIS FILE
│   │   ├── swagger.yaml      # Numista API documentation
│   │   ├── EMOJI-ENCODING-GUIDANCE.md
│   │   └── numista-terms-of-use.txt
│   ├── guides/               # How-to guides
│   │   ├── BUILD-GUIDE.md
│   │   ├── INSTALLER-DISTRIBUTION-PLAN.md
│   │   ├── POLAR-ENVIRONMENT-SWITCHING.md    # Sandbox ↔ Production switching
│   │   └── POLAR-PRODUCTION-CONFIG.md
│   ├── planning/             # Current work plans
│   │   └── PHASE3-WORK-PLAN.md
│   ├── assets/               # Design files + website assets
│   │   ├── logo_no_text.ai
│   │   └── logo_with_text.ai
│   ├── archive/              # Completed work plans
│   └── CHANGELOG.md          # Version history
├── examples/                 # Example databases (tracked for multi-machine sync)
│   ├── mycollection.db       # Sample collection for testing
│   └── test.db               # Test database
├── EULA.txt                  # Plain text EULA (bundled as extraResource) - REQUIRED by SignPath
├── LICENSE.txt               # Project license (OSI-approved) - REQUIRED by SignPath
├── README.md                 # Must contain Code Signing Policy - REQUIRED by SignPath
├── CLAUDE.md                 # AI assistant operating instructions
├── package.json
├── electron-builder.yml
└── .gitignore
```

---

**File Organization:** See [FILE-ORGANIZATION.md](FILE-ORGANIZATION.md) for comprehensive rules on where files belong, including compliance requirements (SignPath, electron-builder) and decision trees for file placement.


---

## IPC Handlers (index.js)

| Handler | Description |
|---------|-------------|
| `select-collection-file` | Opens file picker dialog for .db files |
| `load-collection` | Opens database, initializes progress tracker & settings |
| `get-coins` | Returns paginated coin list with status info |
| `get-coin-details` | Returns single coin details by ID |
| `get-coin-images` | Returns base64 obverse/reverse images for a coin |
| `search-numista` | Automatic search using coin data |
| `manual-search-numista` | User-entered search query |
| `get-numista-type` | Get full type data by Numista ID |
| `fetch-coin-data` | Conditional fetch (basic/issue/pricing based on settings) |
| `fetch-pricing-for-issue` | Fetch pricing for manually selected issue |
| `fetch-issue-data` | Fetch issue data for a type |
| `compare-fields` | Compare coin vs Numista data for field selection |
| `merge-data` | Apply selected fields to database |
| `update-coin-status` | Update coin status in progress cache |
| `get-progress-stats` | Get overall progress statistics |
| `get-app-settings` | App-wide settings (reads from settings.json) |
| `save-app-settings` | Save app settings (writes to settings.json with merge) |
| `get-settings` | Phase 2 collection-specific settings |
| `save-fetch-settings` | Save Phase 2 fetch settings |
| `get-field-mappings` | Returns user's field mappings + NUMISTA_SOURCES |
| `save-field-mappings` | Persist modified field mappings |
| `export-field-mappings` | Export mappings to JSON file |
| `import-field-mappings` | Import mappings from JSON file |
| `reset-field-mappings` | Reset to defaults |
| `reset-settings` | Reset all settings to defaults |
| `resolve-issuer` | Resolve country name to Numista issuer code |
| `open-external` | Open URL in default browser (https/http only) |
| `download-and-store-images` | Download images from Numista CDN |
| `get-supporter-status` | Get license/supporter status and lifetime stats |
| `validate-license-key` | Activate license key with Polar API (registers device) |
| `validate-license` | Re-validate existing license without creating new activation |
| `deactivate-license` | Deactivate license on this device (frees activation slot) |
| `update-supporter-status` | Update supporter settings (e.g., neverAskAgain, offlineSkipUsed) |
| `increment-lifetime-enrichments` | Track coins enriched, check prompt thresholds |
| `get-lifetime-stats` | Get lifetime enrichment statistics |
| `clear-license` | Remove stored license key (local only, doesn't call Polar) |
| `create-backup-before-batch` | Create single backup before batch operations (avoids per-coin backups) |
| `fast-pricing-update` | Update pricing for a single coin using existing numistaId/issueId (premium) |
| `propagate-type-data` | Apply type data to a matching coin from batch operation (premium) |
| `get-monthly-usage` | Get current month's API usage breakdown and total |
| `set-monthly-usage` | Set the monthly API call limit (minimum 100) |
| `set-monthly-usage-total` | Manually adjust current month's total usage count |
| `clear-api-cache` | Clear all persistent API cache entries |
| `export-log-file` | Export current log file to user-chosen location via Save As |

---

## API Methods (numista-api.js)

| Method | Description |
|--------|-------------|
| `searchTypes(params)` | Search for coin types |
| `getType(typeId)` | Get detailed type info |
| `getTypeIssues(typeId)` | Get all issues for a type |
| `getIssuePricing(typeId, issueId, currency)` | Get pricing for specific issue |
| `fetchCoinData(typeId, coin, fetchSettings)` | Main orchestration - conditional fetch |
| `matchIssue(coin, issuesResponse)` | Auto-match logic (year/gregorian_year+mintmark+type) |
| `calculateMatchConfidence(coin, type)` | Scoring with denomination normalization via `denomination-normalizer.js` (alias + plural/singular) |
| `getIssuers()` | Fetch and cache full issuer list |
| `resolveIssuerCode(countryName)` | Resolve country to issuer code (aliases loaded from `issuer-aliases.json`) |

---

## Data Flow

```
1. User clicks coin in list
   ↓
2. Automatic search (or manual search)
   ↓
3. User selects match from results
   ↓
4. fetchCoinData(typeId, coin, fetchSettings)
   - Fetches basic data if enabled
   - Fetches issue data if enabled (auto-matches by year+mintmark+type)
   - Shows Issue Picker if multiple matches (USER_PICK)
   - Fetches pricing data if enabled (requires issue)
   ↓
5. Show field comparison screen
   - Calls compareFields(coin, numistaData, issueData, pricingData) — passes coin.mintmark for mint resolution
   ↓
6. User selects fields to merge
   ↓
7. mergeData(coinId, selectedFields, numistaData, issueData, pricingData)
   - Creates backup (if enabled)
   - Looks up coin.mintmark for mint resolution
   - Calls mergeFields() with all data + coinData
   - Updates database
   - Writes metadata to note field
   - Updates progress tracker
```

---

## Field Mapping System

**Key Files:**
- `default-field-mapping.js` - 39 field definitions + 49 NUMISTA_SOURCES
- `settings-manager.js` - User overrides, `buildFieldMapperConfig()`
- `field-mapper.js` - Actual mapping logic

**How It Works:**
1. Each field has `defaultSourceKey` pointing to NUMISTA_SOURCES
2. User can override source per field in Data Settings
3. `buildFieldMapperConfig()` resolves sourceKey to full config (numistaPath + transform)
4. `FieldMapper` uses resolved config to extract/transform data

**Special Fields:**
- Mint: Resolved from mint letter via `resolveMintName()` in `mintmark-normalizer.js`. Prefers `issueData.mint_letter`, falls back to coin's `.db` mintmark. Uses three strategies: direct letter match, reverse city-name map lookup, parenthetical match. Falls back to `transformMintName()` (first mint) when no mint letter available. Bypasses general transform — handled entirely in its own special-case block. When resolved from a letter, sets `_recommendUpdate` flag to pre-check the field in comparison screen.
- Mintage, Mintmark: Require `issueData`
- Pricing (price1-4): Require `pricingData`
- Catalog Numbers: User-configurable catalog code (KM, Y, Schon, Numista)

**Array Transform Patterns:**
- Joins all values: `transformRulerNames`, `transformRulerPeriod`, `transformDesigners`, `transformEngravers` — use `.join(' / ')` separator
- `transformRulerPeriod` deduplicates via `Set` (co-rulers often share the same dynasty)
- `transformMintName` picks first mint — only used as fallback when `resolveMintName()` cannot determine the correct mint

---

## Data Settings (fetchSettings)

Stored in `{database}_settings.json` via `settings-manager.js`.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `basicData` | boolean | `true` | Fetch type-level data (title, material, weight, etc.) |
| `issueData` | boolean | `false` | Fetch issue-level data (mintage, mintmark) |
| `pricingData` | boolean | `false` | Fetch pricing data (requires issue match) |
| `searchCategory` | string | `'all'` | Filter search: 'all', 'default', 'coin', 'banknote', 'exonumia' |
| `emptyMintmarkInterpretation` | string | `'no_mint_mark'` | How empty mintmark is interpreted: 'no_mint_mark' or 'unknown' |
| `enableAutoPropagate` | boolean | `true` | Show Auto-Propagate prompt after merge to apply type data to matching coins |

**Auto-Propagate Feature (Task 3.12):**
- After merging, detects other coins sharing the same Numista type
- Offers to propagate type-level data to all matching coins
- Detection is FREE; applying to multiple coins requires premium license
- When disabled, merge completes silently without showing the prompt

---

## Icon System (Coin List)

Each coin displays THREE status icons: `[B] [I] [P]`

| Icon | Meaning |
|------|---------|
| ✅ | MERGED - Data successfully saved |
| ⚪ | NOT_QUERIED - User didn't request this data type |
| ⏳ | PENDING - Awaiting processing |
| ❌ | ERROR - Fetch/save failed |
| ❓ | NO_MATCH - Issue couldn't be matched |
| 📭 | NO_DATA - API returned nothing |
| 🚫 | SKIPPED - User intentionally skipped |

**Pricing Freshness Colors:**
| Color | Threshold |
|-------|-----------|
| 🟢 | < 3 months |
| 🟡 | 3-12 months |
| 🟠 | 1-2 years |
| 🔴 | > 2 years |

---

## License Status UI System

The app tracks supporter/license status and updates multiple UI elements dynamically.

**Menu State (index.js):**
```javascript
let menuState = {
  collectionLoaded: false,
  fieldComparisonActive: false,
  recentCollections: [],
  isSupporter: false  // Controls license-dependent menu items
};
```

**UI Elements Affected by License Status:**

| Element | Location | Unlicensed State | Licensed State |
|---------|----------|------------------|----------------|
| Version Badge | Header (below logo) | "FREE VERSION" gray gradient | "Supporter Edition" gold gradient |
| Fast Pricing Button | Collection screen | 🔒 icon, 65% opacity, shows premium gate on click | Full opacity, no icon, feature enabled |
| Purchase License Key | Help menu | Visible | Hidden |

**Update Flow:**

```
License status changes (activation, deactivation, validation)
    ↓
updateVersionBadge() in app.js
    ├── Updates header version badge text/styling
    ├── Updates Fast Pricing button classes (locked/unlocked)
    └── Calls updateMenuState({ isSupporter })
            ↓
        IPC to main process → rebuildMenu()
            └── Menu rebuilt with/without "Purchase License Key" item
```

**When Updates Are Triggered:**
- App initialization (DOMContentLoaded)
- After successful license activation (About dialog or App Settings)
- After license removal (About dialog)
- After license deactivation (App Settings)

**License Entry Locations:**

Users can activate a license in two places:

1. **App Settings → License Management** (Primary, always visible)
   - Dual-state component that shows license entry form when no license exists
   - Password input field for license key
   - "Activate License" button (Enter key also works)
   - Purchase link to Polar checkout
   - After activation: form switches to license info display with Validate/Deactivate buttons

2. **About Dialog** (Help menu or click version badge)
   - Legacy entry point, still functional
   - Shows license entry controls when no license exists
   - Displays supporter badge when license is active

**Premium Feature Gating (app.js):**
```javascript
// Gate a premium feature - shows purchase prompt if unavailable
async function requirePremiumFeature(featureId) {
  const available = await isPremiumFeatureAvailable(featureId);
  if (!available) {
    // Shows modal with "Get a License" and "Enter License Key" buttons
    return false;
  }
  return true;
}

// Usage in button handler:
document.getElementById('fastPricingBtn').addEventListener('click', async () => {
  const canUse = await requirePremiumFeature('fast-pricing');
  if (!canUse) return;
  // ... feature implementation
});
```

**PREMIUM_FEATURES Registry (app.js):**

| Feature ID | Display Name | Description |
|------------|--------------|-------------|
| `fast-pricing` | Fast Pricing Mode | Batch update pricing for matched coins |
| `batch-type-propagation` | Auto-Propagate | Propagate type data to matching coins |

---

## Header Layout

The app header adapts based on whether a collection is open:

**Default State (No Collection):**
```
[Logo + Version Badge]                              [⚙️ Dropdown]
```

**Collection Open:**
```
[Logo + Version Badge]    [Collection Title]    [Fast Pricing] [Close] | [⚙️ Dropdown]
```

**Settings Dropdown (⚙️ icon):**
- App Settings - Always visible
- Data Settings - Only visible when collection is open

---

## Info Bar Card (Collection Screen)

The stats and filters area is wrapped in a unified card with a pinnable header feature:

**Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│📌│ [521 COINS | Basic: 78/521 | Issue: 78/521 | Pricing: 78/521] │
│  │ Status: Complete: 78 · Partial: 0 · Unprocessed: 443 · Skipped: 30  │
│  │ Pricing: Current: 78 · Recent: 0 · Aging: 0 · Outdated: 0 · Never: 443  │
│  ├─────────────────────────────────────────────────────────────────────────│
│  │ Show: [All Coins ▼]  Pricing Freshness: [All Ages ▼]  Sort by: [Title ▼]  [Reset] [≡][⊞]  │
└─────────────────────────────────────────────────────────────┘
```

**Pin Toggle (📌 dog-ear corner):**
- **Unpinned (default):** Thumbtack rotated -45° (slanted), card scrolls with content
- **Pinned:** Thumbtack rotated 0° (vertical), card is sticky at top of scroll area

**Setting:** `uiPreferences.stickyInfoBar` (boolean, default: false)

---

## EULA and Legal Compliance

**EULA Version:** 2.0 (February 2026)

The EULA is defined in `EULA_CONTENT` constant in `src/renderer/app.js` with version tracked in `EULA_VERSION`. Also exists as `EULA.txt` (plain text, bundled as extraResource) and `build/eula/eula-windows.rtf` (RTF for NSIS installer license screen).

**Key Sections:**
| Section | Content |
|---------|---------|
| License Tiers (§3) | Free vs Supporter Edition terms, 5-device limit, non-transferable, covers current major version + updates, discounted upgrades to future major versions |
| Data Collection (§6) | Local-only data, no PII collected, device fingerprint disclosure |
| California Privacy (§7) | CCPA/CPRA compliance - right to know/delete/opt-out/non-discrimination |
| Refunds (§11) | Subject to Polar.sh policies, case-by-case |
| No Obligation to Support (§14) | No guaranteed updates/support/maintenance, may discontinue at any time |
| Governing Law (§15) | California, USA |

**EULA Acceptance Flow:**
```
App launch → checkEulaOnStartup()
    ↓
1. Check for installer marker (eula-installer-accepted.marker in install dir)
    ├── Marker exists → saveEulaAcceptance() to app settings, return true
    └── No marker → continue to step 2
    ↓
2. isEulaAccepted() checks app settings for eulaAccepted && eulaVersion match
    ↓
If not accepted → showEulaModal(true)
    ├── User accepts → saveEulaAcceptance() stores version + timestamp
    └── User declines → window.close()
```

**Installer EULA Marker:** NSIS installer shows EULA via `build/eula/eula-windows.rtf`. On install, `build/installer.nsh` creates `eula-installer-accepted.marker` in `$INSTDIR`. App checks for this marker via `check-installer-eula-marker` IPC handler. Marker is deleted on uninstall.

## Auto-Update

Uses `electron-updater` with GitHub Releases (`src/main/updater.js`).

- **Auto-check:** 10 seconds after app launch (packaged builds only)
- **Manual check:** Help > Check for Updates...
- **Download:** User-initiated (autoDownload: false)
- **Install:** On app restart (quitAndInstall) or next app quit (autoInstallOnAppQuit)
- **Logging:** via `electron-log` (file + console)
- **IPC channels:** `check-for-updates`, `update:download-started`, `update:progress`

**Privacy Compliance:**
- No personal information collected or transmitted to Developer
- Collection data stored locally in OpenNumismat database only
- API requests to Numista contain coin identifiers (not PII)
- Device fingerprint sent to Polar.sh for license activation only
- California residents have explicit rights under CCPA/CPRA (documented in §7)

---

## Storage Architecture

```
1. OpenNumismat Database (note field) - PERMANENT
   └─ Per-coin enrichment metadata (HTML comments)
   └─ Survives: App reinstall, device changes

2. Collection-Specific Files (.NumiSync/ subdirectory) - PORTABLE
   ├─ {database}_settings.json
   │  └─ API key, fetch settings, field mappings, UI preferences
   ├─ {database}_progress.json
   │  └─ Status lookup cache, session stats (rebuilt from database on startup)
   └─ backups/
      └─ {database}_YYYY-MM-DD_HHMMSS.db (timestamped backups)
   └─ Location: Next to .db file in hidden .NumiSync folder
   └─ Migration: Auto-migrated from old location (v3.0+)

3. App-Wide Files (userData directory) - CROSS-COLLECTION
   ├─ settings.json (CONSOLIDATED - single source of truth)
   │  └─ All app settings: API key, search delay, image handling, backups
   │  └─ Window state, recent collections, cache config, EULA
   │  └─ Supporter/license status, lifetime stats
   │  └─ Log level, monthly API limit
   │  └─ Cache TTL settings (flat + structured format)
   ├─ api-cache.json (v3.0+, configurable location)
   │  └─ Persistent Numista API response cache (issuers, types, issues)
   │  └─ Monthly usage tracking per endpoint
   └─ api-cache.lock (v3.0+)
      └─ File lock for multi-machine cache access
   └─ Survives: App restart, collection switches
   └─ Cache location: Default (userData) or custom (user-configurable)
   └─ Path: %APPDATA%/numisync-wizard/ (Windows - lowercase with hyphen)
   └─ Path: ~/.config/numisync-wizard/ (Linux/macOS - lowercase with hyphen)
```

**IMPORTANT - Folder Name Capitalization:**
- **userData folder:** `numisync-wizard` (lowercase with hyphen)
  - Matches package.json "name" field, NOT electron-builder productName
  - Logger and all code must use lowercase 'numisync-wizard' to find settings
  - Mismatch causes logger to fail loading settings.json, defaulting to 'info' level

**Key Changes in v3.0:**
- Collection files now organized in `.NumiSync/` subdirectory (cleaner, less clutter)
- Backup timestamps now human-readable: `2026-02-09_143522` instead of ISO format
- Progress file renamed from `_enrichment_progress.json` to `_progress.json` (shorter)
- API cache renamed from `numista_api_cache.json` to `api-cache.json`
- API cache location now configurable (supports multi-machine scenarios)
- File locking prevents cache corruption when shared across machines
- **Settings consolidated:** `app-settings.json` merged back into `settings.json` (Feb 2026)
  - Eliminated dual settings files that caused redundancy and confusion
  - See `docs/reference/SETTINGS-CONSOLIDATION.md` for migration details

**See Also:** [FILE-LOCATIONS.md](FILE-LOCATIONS.md) for complete documentation of all file locations, uninstaller guidance, and migration details.

---

## Module Relationships

```
index.js (main process)
    ├── opennumismat-db.js    # Database operations
    ├── numista-api.js        # API calls (loads issuer-aliases.json)
    │   └── api-cache.js      # Persistent cache (shared singleton)
    ├── denomination-normalizer.js # Denomination normalization (loads denomination-aliases.json)
    ├── field-mapper.js       # Field mapping
    │   └── default-field-mapping.js
    ├── settings-manager.js   # Settings
    ├── progress-tracker.js   # Progress
    │   └── metadata-manager.js
    └── image-handler.js      # Images

app.js (renderer)
    └── Communicates via preload.js bridge
```

---

## Phase Status

| Phase | Status |
|-------|--------|
| Phase 1 (Core functionality) | COMPLETE |
| Phase 2 (Enhanced features) | COMPLETE |
| Phase 3 (Numista Collection Sync) | IN PROGRESS |

See `PHASE3-WORK-PLAN.md` for current work items.
