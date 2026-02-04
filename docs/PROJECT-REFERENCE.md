# NumiSync Wizard for OpenNumismat - Project Reference

**Purpose:** Architecture reference for implementation. Read when building features.
**Last Updated:** February 3, 2026

---

## Project Structure

```
numismat-enrichment/
├── src/
│   ├── main/
│   │   ├── index.js          # Main process, IPC handlers
│   │   └── preload.js        # Renderer/Main bridge
│   ├── renderer/
│   │   ├── index.html        # UI structure (HAS EMOJIS)
│   │   ├── app.js            # UI logic (HAS EMOJIS)
│   │   ├── styles/main.css   # Styles
│   │   └── images/           # Logo and branding assets
│   │       ├── logo_with_text.svg   # Full logo (header, welcome, about, EULA, manual)
│   │       └── logo_no_text.svg     # Icon-only logo (source for app icon)
│   └── modules/
│       ├── opennumismat-db.js      # SQLite database access
│       ├── numista-api.js          # Numista API wrapper
│       ├── field-mapper.js         # Field mapping logic
│       ├── default-field-mapping.js # Field definitions + NUMISTA_SOURCES
│       ├── metadata-manager.js     # Note field HTML comment parsing
│       ├── progress-tracker.js     # Progress tracking
│       ├── settings-manager.js     # Settings persistence
│       ├── freshness-calculator.js # Pricing age calculation
│       ├── image-handler.js        # Image operations
│       └── mintmark-normalizer.js  # Mintmark utilities
├── build/
│   ├── icon.png              # App icon for dev/Linux (500x500)
│   ├── icon.ico              # App icon for Windows builds (256x256)
│   └── ICONS-README.txt      # Icon conversion instructions
├── docs/
│   ├── PROJECT-REFERENCE.md  # THIS FILE
│   ├── CHANGELOG.md          # Compressed fix history
│   ├── user-manual.html      # User manual (Help > User Manual, F1)
│   └── (archived docs)
└── CLAUDE.md                 # Operating rules (root level)
```

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
| `get-app-settings` | Phase 1 app-wide settings |
| `save-app-settings` | Save Phase 1 settings |
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

---

## API Methods (numista-api.js)

| Method | Description |
|--------|-------------|
| `searchTypes(params)` | Search for coin types |
| `getType(typeId)` | Get detailed type info |
| `getTypeIssues(typeId)` | Get all issues for a type |
| `getIssuePricing(typeId, issueId, currency)` | Get pricing for specific issue |
| `fetchCoinData(typeId, coin, fetchSettings)` | Main orchestration - conditional fetch |
| `matchIssue(coin, issuesResponse)` | Auto-match logic (year+mintmark+type) |
| `getIssuers()` | Fetch and cache full issuer list |
| `resolveIssuerCode(countryName)` | Resolve country to issuer code |

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
   - Calls compareFields(coin, numistaData, issueData, pricingData)
   ↓
6. User selects fields to merge
   ↓
7. mergeData(coinId, selectedFields, numistaData, issueData, pricingData)
   - Creates backup (if enabled)
   - Calls mergeFields() with all data
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
- Mintage, Mintmark: Require `issueData`
- Pricing (price1-4): Require `pricingData`
- Catalog Numbers: User-configurable catalog code (KM, Y, Schon, Numista)

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

## Storage Architecture

```
1. OpenNumismat Database (note field) - PERMANENT
   └─ Per-coin enrichment metadata (HTML comments)
   └─ Survives: App reinstall, device changes

2. Settings File ({database}_settings.json) - PORTABLE
   └─ API key, fetch settings, field mappings
   └─ Stored next to .db file

3. Progress Cache ({database}_enrichment_progress.json) - TEMPORARY
   └─ Status lookup cache, session stats
   └─ Rebuilt from database on startup
```

---

## Module Relationships

```
index.js (main process)
    ├── opennumismat-db.js    # Database operations
    ├── numista-api.js        # API calls
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
