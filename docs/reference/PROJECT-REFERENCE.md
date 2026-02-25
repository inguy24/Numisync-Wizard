# NumiSync Wizard for OpenNumismat - Project Reference

**Purpose:** Architecture reference for implementation. Read when building features.
**Last Updated:** February 16, 2026 (Issuer-Aware Denomination Override System)

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
│   │   ├── denomination-aliases.json          # Denomination variant spellings → canonical + default plural
│   │   ├── issuer-denomination-overrides.json # Country-specific denomination forms (canonical + issuer → singular/plural)
│   │   └── issuer-aliases.json                # Country/territory name aliases
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

## Automatic Search Strategy

**Owner: `searchForMatches()` in `src/renderer/app.js`**

All strategies share a single `baseParams` object built by `buildSearchParams(coin)`, which contains:
- `issuer` — resolved Numista issuer code (e.g., `afrique_du_sud`), absent if resolution fails
- `q` — denomination string (e.g., `"1 shilling"`), built from structured `value`+`unit` fields; falls back to stripped title only when both are absent
- `date` — Gregorian year string (e.g., `"1896"`); **never placed in `q`** — Numista type titles don't contain years, so putting year in `q` returns 0 results
- `category` — from fetch settings (`coin`, `banknote`, `exonumia`, or absent for all)
- `page` — always 1 for initial call; pagination handled by `fetchAllSearchPages()`

Strategies fire in sequence; each is skipped if the previous one found results.

| # | `issuer` | `q` | `date` | Purpose |
|---|----------|-----|--------|---------|
| S1 | resolved code | `"1 shilling"` | `"1896"` | Exact structured query — the common case |
| S2 | resolved code | `"1 haléřů"` (alt form) | `"1896"` | Alternate denomination spelling (e.g., Czech "haléřů" vs English "heller") — issuer kept, only `q` varies |
| S3 | *(omitted)* | `"South Africa 1 shilling"` | `"1896"` | No-issuer fallback — country name moves into `q`; handles coins whose country label maps to a modern issuer that doesn't cover historical sub-issuers |

### Why this structure

**S1** handles the vast majority of coins. The issuer parameter is the primary precision tool — it constrains results to the correct country without requiring the country name to appear in the Numista coin title (titles are just the denomination, e.g. "1 Shilling", never "South Africa 1 Shilling").

**S2** handles denominations with language variants. When `denomination-aliases.json` has cross-referenced entries (e.g., "heller" ↔ "haléřů"), `getAlternateSearchForms()` returns the alternate forms and S2 retries with each, still keeping the issuer filter for precision.

**S3** handles the historical issuer mismatch problem. Some coins in OpenNumismat are labeled with a modern country name (e.g., "South Africa") that resolves to a modern Numista issuer code (`afrique_du_sud`) that only covers post-Union coins. Pre-Union coins (e.g., 1896 ZAR Shilling) are cataloged under a completely different Numista sub-issuer ("South African Republic"). S1 and S2 both return 0 for these. S3 drops the `issuer` param entirely and puts the country name into `q`, mirroring how the Numista website's own full-text search finds coins regardless of issuer hierarchy. `date` and `category` are retained for precision.

### What was removed and why (do not re-add)

Two strategies and their builder functions were removed in Feb 2026 after analysis showed they were either dead code or architecturally contradictory:

- **"Core query" (removed)** — `buildCoreQuery()` produced `value + normalizedUnit`, identical to what `buildSearchParams()` already produces when `coin.value` is present. The guard `coreQuery !== baseParams.q` prevented it from ever firing. Dead code; deleted.

- **"Minimal query" (removed)** — `buildMinimalQuery()` produced `country + denominationUnit` (no value) and was passed to the API **with the issuer param still set**. This was contradictory: the issuer param already scopes results to the correct country, so adding the country name to `q` required it to appear in the Numista coin title too — which it never does. The combination was strictly more restrictive than S1 and always returned a subset of S1's results (usually 0 when S1 also returned 0). The "country in q" concept was correct but belongs only in S3 where the issuer is absent.

---

## Match Confidence Scoring

**Single owner: `calculateConfidence(coin, match)` in `src/renderer/app.js`**

Match confidence scoring lives entirely in the renderer. The main process has no scoring role.

| Component | Points | Notes |
|-----------|--------|-------|
| Title (Dice) | 0–30 | `window.stringSimilarity.diceCoefficient` |
| Year in range | +25 / −15 | Penalty if coin year outside `min_year`–`max_year` |
| Country match | +20 | String inclusion OR alias-code match via `window.stringSimilarity.issuerAliases` |
| Denomination | +25 / −20 | Value + unit match; partial credit when unit unknown |
| Category | +10 / −10 | Boost for standard circulation; penalty for proof/pattern/specimen |

**Country match logic** (in order of precedence):
1. Exact or substring string match (`"British Palestine".includes("British Palestine")`)
2. Alias-code match: `issuerAliases[coinCountry] === match.issuer.code` — handles cases where OpenNumismat country name differs from Numista catalog name (e.g. "Mandatory Palestine" → code `palestine` = `match.issuer.code`)

**`window.stringSimilarity.issuerAliases`** is built in `preload.js` at startup by reading `src/data/issuer-aliases.json` and flattening all alias arrays into a single `alias → code` map. It is exposed via `contextBridge` alongside the denomination utilities.

**Do not add scoring logic to `numista-api.js` or `index.js`** — the renderer cannot call main-process functions synchronously during UI rendering, so any scoring placed there is unreachable from the display path.

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

## External Link Policy

All links to external websites **must** open in the user's system default browser. Opening external sites inside the app (even in a new `BrowserWindow`) is a security risk and violates user expectations.

### Enforcement (two layers, both required)

**Layer 1 — `setWindowOpenHandler` in `src/main/index.js`** (safety net, covers all windows):
```javascript
window.webContents.setWindowOpenHandler(({ url }) => {
  if (url.startsWith('https://') || url.startsWith('http://')) {
    shell.openExternal(url);
  }
  return { action: 'deny' };
});
```
Add this immediately after every `BrowserWindow.loadFile()` call — `mainWindow`, `manualWindow`, and any future windows. Without this, `target="_blank"` links open a new in-app `BrowserWindow` with no preload and no context isolation.

**Layer 2 — Link markup per HTML context:**

| HTML file | Has preload? | Correct pattern |
|-----------|-------------|-----------------|
| `src/renderer/index.html` | Yes (`preload.js`) | `<a href="#" class="ext-link" onclick="window.electronAPI.openExternal('URL'); return false;" title="Opens in your browser">text</a>` |
| `src/resources/user-manual.html` | No | `<a href="URL" target="_blank" title="Opens in your browser">text</a>` — `setWindowOpenHandler` intercepts it |

**Never use:**
- `<a href="https://..." target="_blank">` in `index.html` (no preload interception before handler fires)
- `<a href="https://...">` with no `onclick`/`target` anywhere — navigates the current window away from the app

### Visual indicator (required on all external links)

Every external link must display a `↗` arrow to signal it opens outside the app:

| Context | CSS |
|---------|-----|
| `index.html` (via `main.css`) | `.ext-link::after { content: "\2197"; font-size: 0.75em; opacity: 0.6; }` |
| `user-manual.html` (inline `<style>`) | `a[target="_blank"]::after { content: "\2197"; font-size: 0.75em; opacity: 0.6; }` |

Also add `title="Opens in your browser"` to every external link for accessibility/tooltip.

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
    ├── denomination-normalizer.js # Denomination normalization (loads denomination-aliases.json + issuer-denomination-overrides.json)
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

## Denomination Normalization Architecture

Two data files work together to produce the correct denomination string for Numista API searches:

### File 1: `src/data/denomination-aliases.json`
**Purpose:** Spelling normalization — "what are all the variant spellings of this denomination?"

- Maps spelling variants → canonical (singular) form (e.g., "kopeks", "kopek", "kopeek" → "kopeck")
- Stores the **default plural** form used by the majority of issuers (e.g., `centesimo.plural = "centesimi"` for Italian coins)
- Used by `denomination-normalizer.js` to build `DENOMINATION_ALIASES` and `DENOMINATION_PLURALS` lookup maps
- Default plural is correct for the primary issuer of that denomination; country-specific exceptions go in the override file

### File 2: `src/data/issuer-denomination-overrides.json`
**Purpose:** Search form selection — "what exact singular/plural form does Numista use for this denomination in a specific country?"

- Maps `canonical → Numista issuer code → { singular, plural }` override forms
- Only exception cases are listed; issuers not listed fall through to `denomination-aliases.json` defaults
- Covers denomination families where the same canonical has language-specific plurals:
  - **centesimo**: default "centesimi" (Italian); override "centésimos" for Uruguay, Panama, Chile
  - **centimo**: default "centimos"; override "céntimos" for Spain, Costa Rica, Venezuela, Paraguay
  - **krone**: default "kroner" (Danish/Norwegian); overrides for Sweden (kronor), Czech/Slovak/Czechoslovak (korun)
  - **lira**: default "lire" (Italian); overrides for Turkey (lira unchanged) and Israel (lirot)
  - **dinar**: default "dinars"; overrides for Yugoslavia/Serbia (dinara)
  - **real**: default "reais" (Brazilian); overrides for Spanish colonial issuers (reales)

### Data Flow

```
buildSearchParams(coin)
  └── resolveIssuer(coin.country) → issuerCode          ← resolved FIRST
  └── normalizeUnitForSearch(unit, value, issuerCode)
        └── normalizeUnit(unit) → canonical              ← via preload.js / denomination-aliases.json
        └── issuerOverrides[canonical][issuerCode]?      ← check override table first
              YES → return override.singular or .plural
              NO  → getSearchForm(canonical, value)       ← denomination-aliases.json default
```

**Why two files?**
`denomination-aliases.json` answers the normalization question (variant spellings → canonical). `issuer-denomination-overrides.json` answers the search question (canonical + country → exact Numista form). Keeping them separate means the alias file stays a pure spelling-variant table while the override file is a living lookup table that can be extended with one JSON entry per new country/denomination combination — no code changes required.

**Adding a new override:** Add a `"issuer_code": { "singular": "...", "plural": "..." }` entry under the appropriate canonical key in `issuer-denomination-overrides.json`. Use the Numista issuer code exactly as returned by `resolveIssuerCode()` (verified from `api-cache.json` → `entries['issuers:all']`).

---

## OpenNumismat Database Schema

Schema introspected from `examples/test.db` via `PRAGMA table_info()`. All tables listed.

### coins (primary coin records)

#### Identity & Denomination
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto-increment primary key |
| title | TEXT | Coin name/title |
| value | NUMERIC | Denomination face value (numeric) |
| unit | TEXT | Denomination unit label (e.g., "Cent", "Franc") |
| country | TEXT | Issuing country name |
| year | INTEGER | Gregorian mint year |
| native_year | TEXT | Era-specific year string (e.g., "Meiji 14") — see Lesson 15 |
| period | TEXT | Historical period/era label |
| ruler | TEXT | Ruling monarch/head of state |
| region | TEXT | Geographic region |
| emitent | TEXT | Issuing authority |

#### Physical Characteristics
| Column | Type | Notes |
|--------|------|-------|
| material | TEXT | Primary metal/material |
| material2 | TEXT | Secondary material (bi-metallic) |
| composition | TEXT | Full composition description |
| fineness | INTEGER | Metal fineness (purity) |
| shape | TEXT | Coin shape |
| diameter | NUMERIC | Diameter in mm |
| width | NUMERIC | Width in mm (non-round coins) |
| height | NUMERIC | Height in mm (non-round coins) |
| thickness | NUMERIC | Thickness in mm |
| weight | NUMERIC | Specified weight in grams |
| real_weight | NUMERIC | Actual measured weight |
| real_diameter | NUMERIC | Actual measured diameter |
| axis | INTEGER | Die axis in degrees |
| technique | TEXT | Minting technique |
| format | TEXT | Format description |

#### Edge & Design
| Column | Type | Notes |
|--------|------|-------|
| edge | TEXT | Edge type (reeded, plain, lettered…) |
| edgelabel | TEXT | Lettering on edge |
| edgevar | TEXT | Edge variety |
| obversedesign | TEXT | Obverse design description |
| obversedesigner | TEXT | Obverse designer name |
| obverseengraver | TEXT | Obverse engraver name |
| obversecolor | TEXT | Obverse color (colorized coins) |
| obversevar | TEXT | Obverse variety label |
| reversedesign | TEXT | Reverse design description |
| reversedesigner | TEXT | Reverse designer name |
| reverseengraver | TEXT | Reverse engraver name |
| reversecolor | TEXT | Reverse color |
| reversevar | TEXT | Reverse variety label |
| subject | TEXT | Full commemorative subject text |
| subjectshort | TEXT | Short subject label |

#### Classification & Catalog
| Column | Type | Notes |
|--------|------|-------|
| type | TEXT | Coin type classification |
| series | TEXT | Series name |
| category | TEXT | OpenNumismat collection category |
| mint | TEXT | Mint name |
| mintmark | TEXT | Mint mark character(s) |
| issuedate | TEXT | Issue date string |
| dateemis | TEXT | Emission date range |
| mintage | INTEGER | Official mintage figure |
| quality | TEXT | Strike quality (Proof, BU, etc.) |
| obvrev | TEXT | Obverse/reverse orientation |
| variety | TEXT | Variety label |
| varietydesc | TEXT | Variety description |
| modification | TEXT | Modification note |
| rarity | TEXT | Rarity classification |
| catalognum1 | TEXT | Catalog reference 1 |
| catalognum2 | TEXT | Catalog reference 2 |
| catalognum3 | TEXT | Catalog reference 3 |
| catalognum4 | TEXT | Catalog reference 4 |
| url | TEXT | Reference URL |
| barcode | TEXT | Barcode/inventory number |

#### Pricing — CRITICAL MAPPING (see Lessons 21, 34, 35 — driven by field mapping config, never hardcoded)
| Column | Type | Grade |
|--------|------|-------|
| price1 | NUMERIC | F (Fine / Fair) |
| price2 | NUMERIC | VF (Very Fine) |
| price3 | NUMERIC | XF (Extremely Fine) |
| price4 | NUMERIC | UNC (Uncirculated) |

#### Collection Management
| Column | Type | Notes |
|--------|------|-------|
| status | TEXT | Collection status (owned, wanted, sold…) |
| grade | TEXT | Condition grade string |
| condition | TEXT | Detailed condition notes |
| defect | TEXT | Known defects |
| grader | TEXT | Grading service name |
| quantity | INTEGER | Number of specimens owned |
| storage | TEXT | Physical storage location |
| seat | TEXT | Album seat/slot |
| features | TEXT | Special features |
| rating | TEXT | Personal rating |
| sort_id | INTEGER | Manual sort order |

#### Acquisition & Sale
| Column | Type | Notes |
|--------|------|-------|
| paydate | TEXT | Purchase date |
| payprice | NUMERIC | Purchase price (per coin) |
| totalpayprice | NUMERIC | Total purchase price (inc. fees) |
| saller | TEXT | Seller name (note: typo in schema) |
| payplace | TEXT | Purchase venue |
| payinfo | TEXT | Purchase notes |
| buying_invoice | TEXT | Invoice reference |
| saledate | TEXT | Sale date |
| saleprice | NUMERIC | Sale price (per coin) |
| totalsaleprice | NUMERIC | Total sale price |
| buyer | TEXT | Buyer name |
| saleplace | TEXT | Sale venue |
| saleinfo | TEXT | Sale notes |
| sale_invoice | TEXT | Sale invoice reference |
| address | TEXT | Postal address |
| latitude | NUMERIC | GPS latitude |
| longitude | NUMERIC | GPS longitude |

#### Signature
| Column | Type | Notes |
|--------|------|-------|
| signaturetype | TEXT | Signature type label |
| signature | TEXT | Signature text |
| signatureimg | INTEGER | FK → photos.id |

#### Metadata & Timestamps
| Column | Type | Notes |
|--------|------|-------|
| note | TEXT | **NumiSync metadata JSON stored here** — parsed by metadata-manager.js |
| createdat | TEXT | Record creation timestamp |
| updatedat | TEXT | Record last-update timestamp |

#### Image Foreign Keys — CRITICAL (see Lesson 5)
| Column | Type | References | Notes |
|--------|------|------------|-------|
| image | INTEGER | **images.id** | Composite thumbnail (ONLY column using images table) |
| obverseimg | INTEGER | **photos.id** | Obverse full-resolution image |
| reverseimg | INTEGER | **photos.id** | Reverse full-resolution image |
| edgeimg | INTEGER | **photos.id** | Edge image |
| photo1 | INTEGER | **photos.id** | Additional photo 1 |
| photo2 | INTEGER | **photos.id** | Additional photo 2 |
| photo3 | INTEGER | **photos.id** | Additional photo 3 |
| photo4 | INTEGER | **photos.id** | Additional photo 4 |
| photo5 | INTEGER | **photos.id** | Additional photo 5 |
| photo6 | INTEGER | **photos.id** | Additional photo 6 |
| varietyimg | INTEGER | **photos.id** | Variety image |

---

### photos (high-resolution images)
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Referenced by coins.obverseimg, reverseimg, edgeimg, photo1-6, varietyimg, signatureimg |
| title | TEXT | Image caption/title |
| image | BLOB | Full-resolution image binary data |

---

### images (composite thumbnails)
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Referenced ONLY by coins.image |
| image | BLOB | Composite thumbnail binary data (side-by-side obverse+reverse) |

---

### Supporting Tables

#### tags / coins_tags (tagging system)
| Table | Columns | Notes |
|-------|---------|-------|
| tags | id, tag, parent_id, position | Hierarchical tag tree |
| coins_tags | coin_id, tag_id | Many-to-many join |

#### pages (collection views/pages)
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| title | TEXT | Page name |
| isopen | INTEGER | Whether page is expanded |
| position | INTEGER | Display order |
| type | INTEGER | Page type enum |

#### fields (column visibility config)
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| title | TEXT | Field/column name |
| enabled | INTEGER | 1 = visible in UI |

#### prices (price history log)
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| coin_id | INTEGER | FK → coins.id |
| action | TEXT | Action type (buy/sell/estimate) |
| date | TEXT | Price date |
| quantity | INTEGER | |
| price | NUMERIC | |
| currency | TEXT | |
| commission | NUMERIC | |
| shipping | NUMERIC | |
| grade | TEXT | Grade at time of pricing |

#### Other tables
| Table | Purpose |
|-------|---------|
| description | Collection-level metadata (title, description, author) |
| settings | OpenNumismat app settings (key-value pairs) |
| filters | Saved filter configurations per page |
| lists | Column layout/order per page |
| statistics | Saved statistics/chart configurations |
| treeparam | Tree view parameters per page |
| tags | Tag hierarchy |

---

## Phase Status

| Phase | Status |
|-------|--------|
| Phase 1 (Core functionality) | COMPLETE |
| Phase 2 (Enhanced features) | COMPLETE |
| Phase 3 (Numista Collection Sync) | IN PROGRESS |

See `PHASE3-WORK-PLAN.md` for current work items.
