# OpenNumismat Enrichment Tool - Master Project Document

**Last Updated:** January 28, 2026  
**Purpose:** Single source of truth for project state, fixes, and lessons learned  
**Replaces:** All individual fix documents (see deletion list at end)

---

## CRITICAL LESSONS LEARNED

### 1. EMOJI ENCODING - NEVER MODIFY FILES WITH EMOJIS USING create_file OR str_replace

**The Problem:**  
Files containing emojis (Ã¢Å¡â„¢Ã¯Â¸Â Ã°Å¸â€œâ€š Ã¢Å“â€¦ Ã°Å¸â€™Â¡ Ã°Å¸â€™Â° Ã¢â€ Â  Ã¢â€ â€™ Ã¢Å“â€œ) get corrupted when using `create_file` or `str_replace` tools.

**The Solution:**  
- Ã¢Å“â€¦ **ALWAYS use bash `cp` to copy files**
- Ã¢Å“â€¦ **Use bash `sed` for text replacements in files with emojis**
- Ã¢ÂÅ’ **NEVER use create_file with emoji content**
- Ã¢ÂÅ’ **NEVER use str_replace on sections containing emojis**

**Files with emojis:**
- `/mnt/project/index.html` - Has emoji buttons
- `/mnt/project/app.js` - Has emoji in status messages
- `/mnt/project/main.css` - Usually safe

**Code to check for emojis:**
```bash
grep -P "[\x{1F300}-\x{1F9FF}]" /path/to/file
```

### 2. NEVER STRIP OUT EXISTING CODE WITHOUT UNDERSTANDING IT

**What Happened:**  
Multiple times, working code was removed or replaced without understanding its purpose, breaking functionality.

**The Rule:**  
- Ã¢Å“â€¦ **Read the existing code first**
- Ã¢Å“â€¦ **Check what it's calling and what calls it**
- Ã¢Å“â€¦ **Make minimal targeted changes**
- Ã¢ÂÅ’ **Never replace entire handlers without understanding the full chain**

### 3. THE IMPORTANCE OF READING PROJECT DOCUMENTATION BEFORE CODING

**What Happened:**  
Created duplicate fix documents without reading existing docs, repeated mistakes that were already documented.

**The Rule:**  
- Ã¢Å“â€¦ **Read EMOJI-ENCODING-GUIDANCE.md before any file operations**
- Ã¢Å“â€¦ **Read this MASTER document before making changes**
- Ã¢Å“â€¦ **Check PHASE2-WORK-PLAN.md for architecture decisions**
- Ã¢ÂÅ’ **Never create a new fix document - update this master instead**


### 4. NEVER CREATE STANDALONE MODULE FILES - INTEGRATE INTO EXISTING FILES

**What Happened:**
Created separate files like `data-settings-modal.html` and `data-settings-ui.js` instead of integrating the code into the existing project files (`index.html` and `app.js`). This violates project structure and creates maintenance burden.

**The Rule:**
- All HTML goes in index.html (or main HTML file)
- All renderer JavaScript goes in app.js
- All main process code goes in index.js
- All IPC bridge code goes in preload.js
- Only create NEW files for genuinely new modules (like new classes)
- NEVER create separate UI component files - integrate into existing files
- NEVER give user standalone HTML snippets to insert manually

**Project File Structure:**
- `index.html` - ALL UI markup including modals
- `app.js` - ALL renderer-side JavaScript including DataSettingsUI class
- `index.js` - ALL main process IPC handlers
- `preload.js` - ALL IPC bridge methods
- `main.css` - ALL styles
---

## PROJECT STRUCTURE

### File Organization

```
numismat-enrichment/
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ src/
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ main/
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ index.js          - Main process, IPC handlers
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ preload.js        - Renderer/Main bridge
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ renderer/
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ index.html        - UI structure (HAS EMOJIS!)
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ app.js            - UI logic (HAS EMOJIS!)
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ main.css          - Styles
Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ modules/
Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ opennumismat-db.js      - SQLite database access
Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ numista-api.js          - Numista API wrapper
Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ field-mapper.js         - Field mapping logic
Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ default-field-mapping.js - Field definitions
Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ metadata-manager.js     - Note field HTML comment parsing
Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ progress-tracker.js     - Progress tracking (Phase 2)
Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ settings-manager.js     - Settings persistence (Phase 2)
Ã¢â€â€š       Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ freshness-calculator.js - Pricing age calculation
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ docs/
    Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ MASTER-PROJECT-DOCUMENT.md  - THIS FILE
    Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ PHASE2-WORK-PLAN.md         - Architecture & planning
    Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ EMOJI-ENCODING-GUIDANCE.md  - Critical encoding rules
```

### Phase 2 Modules (Added)

**metadata-manager.js** (Task 2.1)  
- Parses/writes enrichment metadata in coin note field as HTML comments
- Preserves user notes
- Handles malformed/missing metadata gracefully

**progress-tracker.js** (Task 2.2)  
- Three-tier status tracking (basicData/issueData/pricingData)
- Rebuilds from database on startup
- Session API call counting

**settings-manager.js** (Task 2.3)  
- Stores settings in `{database}_settings.json` next to .db file
- API configuration
- Fetch settings (which data types to fetch)
- Field mappings, UI preferences

**freshness-calculator.js** (Task 2.5)  
- Calculates pricing data age
- Returns freshness badges (Current/Recent/Aging/Outdated/Never)
- Thresholds: <3mo Current, <1yr Recent, <2yr Aging, >2yr Outdated

---

## PHASE 2 STATUS

### Task 2.1 - Metadata Storage Ã¢Å“â€¦ COMPLETE
- Created metadata-manager.js
- Reads/writes HTML comments in note field
- Preserves user notes
- Version 2.0 format with three data types

### Task 2.2 - Granular Status Tracking Ã¢Å“â€¦ COMPLETE
- Updated progress-tracker.js
- Three-tier tracking (basic/issue/pricing)
- Rebuilds from database metadata
- Session call counting

### Task 2.3 - Data Settings UI Ã¢Å“â€¦ COMPLETE  
- Created settings-manager.js
- Data settings modal in UI
- Status bar display
- Settings persist to JSON

### Task 2.4 - Conditional API Calls Ã¢Å“â€¦ COMPLETE
- Modified numista-api.js
- Added fetchCoinData() method
- Auto-match issues by year+mintmark
- Issue picker UI for manual selection
- Graceful edge case handling

### Task 2.5 - Freshness Indicators Ã¢Å“â€¦ COMPLETE
- Created freshness-calculator.js
- CSS styles for badges
- Helper functions for UI integration

### Task 2.6 - Filter & Sort Ã¢ÂÅ’ NOT STARTED
### Task 2.7 - Fetch More Data Ã¢ÂÅ’ NOT STARTED  
### Task 2.8 - Images Ã¢ÂÅ’ NOT STARTED

---

## CURRENT CRITICAL ISSUE

### Pricing and Mintage Fields Not Writing to Database

**Problem:**  
When user selects pricing fields (price_xf, price_vf, price_f) and mintage, the merge process skips them and writes 0 fields to the database.

**Root Cause:**  
The `mergeFields` function in field-mapper.js calls `mapToOpenNumismat` without passing `issueData` and `pricingData` parameters. This causes fields with `requiresIssueData` or `requiresPricingData` flags to be skipped.

**Status:** CURRENTLY BEING DEBUGGED

**What's Happening:**
1. Ã¢Å“â€¦ fetch-coin-data correctly fetches data from Numista
2. Ã¢Å“â€¦ compare-fields displays the data correctly in UI
3. Ã¢ÂÅ’ merge-data calls mergeFields WITHOUT issueData/pricingData
4. Ã¢ÂÅ’ mapToOpenNumismat skips all pricing/mintage fields
5. Ã¢ÂÅ’ Database gets {} (empty object) - no fields updated

**Files Involved:**
- index.js - merge-data IPC handler needs to accept and pass issueData/pricingData
- field-mapper.js - mergeFields needs to accept and pass parameters to mapToOpenNumismat
- default-field-mapping.js - Has correct field definitions with requiresPricingData flags
- app.js - May need to pass fetchResult data to merge call

---

## KEY ARCHITECTURE DECISIONS

### Data Flow

```
1. User clicks coin
   Ã¢â€ â€œ
2. Search Numista (or manual search)
   Ã¢â€ â€œ
3. User selects match
   Ã¢â€ â€œ
4. Call fetchCoinData(typeId, coin, fetchSettings)
   - Fetches basic data if requested
   - Fetches issue data if requested (auto-matches by year+mintmark)
   - Fetches pricing data if requested (requires issue)
   Ã¢â€ â€œ
5. Show field comparison
   - Extracts issueData and pricingData from fetchResult
   - Calls compareFields(coin, numistaData, issueData, pricingData)
   Ã¢â€ â€œ
6. User selects fields to merge
   Ã¢â€ â€œ
7. Call mergeData(coinId, selectedFields, numistaData, issueData, pricingData)
   - Creates backup
   - Calls mergeFields() with ALL data
   - Updates database
   - Updates progress tracker
```

### Field Mapping System

**How It Works:**
- `default-field-mapping.js` defines all field mappings
- Each field has: numistaPath, transform, priority, enabled, requiresIssueData, requiresPricingData
- `field-mapper.js` uses these definitions to map Numista data to OpenNumismat fields

**Special Fields:**
- **Mintage, Mintmark:** Require `issueData` (from getTypeIssues API call)
- **Pricing (price_unc, price_xf, price_vf, price_f):** Require `pricingData` (from getIssuePricing API call)
- **Catalog Numbers:** Special handling via getCatalogNumber() helper
- **Images:** Store URLs (download not yet implemented)

**OpenNumismat Pricing Fields (exactly 4):**
- price_unc - Uncirculated
- price_xf - Extremely Fine
- price_vf - Very Fine
- price_f - Fine

### Coin List Icon Display System

**CRITICAL: Each coin displays THREE separate icons, not one overall status icon.**

The three icons represent status for each data type:
```
[B] [I] [P]
 â”‚   â”‚   â””â”€â”€ pricingData icon (COLOR indicates freshness)
 â”‚   â””â”€â”€â”€â”€â”€â”€ issueData icon
 â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ basicData icon
```

**Icon Definitions:**

| Status | Icon | Used For |
|--------|------|----------|
| MERGED | âœ… | basicData, issueData |
| NOT_QUERIED | âšª | All types (user didn't request) |
| PENDING | â³ | All types |
| ERROR | âŒ | All types |
| NO_MATCH | â“ | issueData only |
| NO_DATA | ðŸ“­ | All types (API returned nothing) |
| SKIPPED | â­ | Overall coin status |

**Pricing Data Freshness Colors (per PHASE2-WORK-PLAN.md):**

| Freshness | Icon | Threshold |
|-----------|------|-----------|
| Current | ðŸŸ¢ | < 3 months old |
| Recent | ðŸŸ¡ | 3-12 months old |
| Aging | ðŸŸ  | 1-2 years old |
| Outdated | ðŸ”´ | > 2 years old |
| Never | âšª | No pricing timestamp |

**Example Display:**
- `âœ… âœ… ðŸŸ¢` = Basic merged, Issue merged, Pricing current
- `âœ… âšª âšª` = Basic merged, Issue not requested, Pricing not requested
- `âœ… â“ ðŸ”´` = Basic merged, Issue no match, Pricing outdated
- `â³ â³ â³` = All pending

**Implementation Location:** `app.js` - `renderCoinList()` function

---

### Issue Matching Strategy

**Auto-Match:**  
Match by year + mintmark. If single match found Ã¢â€ â€™ AUTO_MATCHED

**User Pick:**  
Multiple matches found Ã¢â€ â€™ Show picker modal Ã¢â€ â€™ USER_PICK

**No Match:**  
No matches for year/mintmark Ã¢â€ â€™ NO_MATCH Ã¢â€ â€™ User can still pick from all issues

**No Issues:**  
Type has no issue data Ã¢â€ â€™ NO_ISSUES

---

## IPC HANDLERS (index.js)

### File Operations
- `select-collection-file` - File picker dialog
- `load-collection` - Opens database, initializes progress tracker & settings
- `get-coins` - Returns coin list with status info
- `get-coin-details` - Returns single coin details

### Numista API
- `search-numista` - Search Numista by coin data
- `manual-search-numista` - User-entered search query
- `get-numista-type` - Get full type data by ID
- `fetch-coin-data` - **Conditional fetch** (calls api.fetchCoinData())
- `fetch-pricing-for-issue` - Fetch pricing for manually selected issue

### Field Mapping
- `compare-fields` - Compare coin vs Numista data
- `merge-data` - Apply selected fields to database

### Progress Tracking
- `update-coin-status` - Update coin status in progress cache
- `get-progress-stats` - Get overall progress statistics

### Settings
- `get-app-settings` - Phase 1 app-wide settings
- `save-app-settings` - Phase 1 app-wide settings
- `get-settings` - Phase 2 collection-specific settings
- `save-fetch-settings` - Phase 2 fetch settings
- `get-statistics` - Phase 2 progress statistics
- `increment-api-calls` - Phase 2 session call counter

---

## API METHODS (numista-api.js)

### Core Methods
- `searchTypes(params)` - Search for coin types
- `getType(typeId)` - Get detailed type info
- `getTypeIssues(typeId)` - Get all issues for a type
- `getIssuePricing(typeId, issueId)` - Get pricing for specific issue

### Phase 2.4 Methods
- `fetchCoinData(typeId, coin, fetchSettings)` - **Main orchestration method**
  - Conditionally fetches basic, issue, and pricing data
  - Auto-matches issues
  - Returns structured result with status for each data type
  
- `matchIssue(coin, issuesResponse)` - Auto-match logic
  - Returns: AUTO_MATCHED, USER_PICK, NO_MATCH, NO_ISSUES
  
- `fetchPricingForIssue(typeId, issueId)` - Helper for manual issue selection

---

## KNOWN WORKING STATE (Before Today's Changes)

**index(4).js was working correctly:**
- fetch-coin-data handler called `api.fetchCoinData(typeId, coin, fetchSettings)`
- compare-fields handler extracted issueData and pricingData from fetchResult
- merge-data handler DID NOT pass issueData/pricingData (THIS IS THE BUG)

**What Broke:**
- Replaced working fetch-coin-data handler with simplified version
- Didn't understand the existing data structure
- Lost matchedIssue object that app.js expected

**What Was Fixed:**
- Restored index(4).js
- Need to add issueData/pricingData parameters to merge-data

---

## CURRENT FIX NEEDED

### In index.js - merge-data handler

**Current (BROKEN):**
```javascript
const updatedData = mapper.mergeFields(selectedFields, numistaData);
```

**Needed (FIX):**
```javascript
const updatedData = mapper.mergeFields(selectedFields, numistaData, issueData, pricingData);
```

**Where to get issueData and pricingData:**
Need to check app.js to see if it passes fetchResult to merge-data call, or if we need to extract from compareFields result.

### In field-mapper.js

**Already Fixed:**
- Ã¢Å“â€¦ mapToOpenNumismat accepts pricingData parameter
- Ã¢Å“â€¦ mergeFields accepts issueData and pricingData parameters
- Ã¢Å“â€¦ compareFields accepts issueData and pricingData parameters
- Ã¢Å“â€¦ Pricing field extraction logic added
- Ã¢Å“â€¦ requiresPricingData check added

### In default-field-mapping.js

**Already Fixed:**
- Ã¢Å“â€¦ price_unc, price_xf, price_vf, price_f definitions added
- Ã¢Å“â€¦ All have requiresPricingData: true

---

## FILES TO DELETE (Redundant Fix Documents)

Once this master document is in place, these can be deleted:

1. COMPLETE-FIX-SUMMARY.md
2. CRITICAL-DATABASE-FIX.md
3. DEBUG-MAPPING-EMPTY.md
4. DEBUG-SELECTEDFIELDS.md
5. DEBUGGING-NO-FIELDS.md
6. DUPLICATE-HANDLER-FIX.md
7. ENCODING-FIX-COMPLETE.md
8. FIELD-MAPPING-FIXES.md
9. FINAL-FIXES-SUMMARY.md
10. FIXES-APPLIED.md
11. GETCOINSTATUS-FIX.md
12. INSTALL-BOTH-FIXES.md
13. INSTALL-PHASE2-COMPLETE.md
14. ISSUE-DATA-NOT-DISPLAYING-FIXED.md
15. MERGE-DATA-FIX.md
16. MERGE-PROGRESS-TRACKER-FIXED.md
17. PRICING-FIELDS-ADDED.md
18. PRICING-TRANSFORM-FIX.md
19. RESTORED-WORKING-VERSION.md
20. UI-ENCODING-FIX.md

**Keep These:**
- PHASE1-COMPLETION-PLAN.md (historical reference)
- PHASE2-WORK-PLAN.md (architecture & planning)
- EMOJI-ENCODING-GUIDANCE.md (critical reference)
- TASK-2_1-COMPLETE.md (task completion record)
- TASK-2_2-2_3-2_5-IMPLEMENTATION.md (task completion record)
- TASK-2_4-FULLY-COMPLETE.md (task completion record)
- QUICK-REFERENCE.md (if it exists as useful reference)
- TECHNICAL-SUMMARY.md (if it exists as useful reference)
- research-phase-summary.md (historical)
- fast-pricing-update-summary.md (historical)
- numismat-enrichment-guidelines.md (reference)
- final-field-mapping.md (reference)

---

## NEXT STEPS

1. **Fix the merge-data issue:**
   - Determine how app.js calls merge-data
   - Ensure issueData and pricingData are passed
   - Test that pricing/mintage fields write to database

2. **Continue Phase 2:**
   - Task 2.6 - Filter & Sort enhancements
   - Task 2.7 - Fetch More Data feature
   - Task 2.8 - Image support

3. **Update this master document:**
   - After each fix, update the relevant section
   - Do not create new fix documents
   - Keep lessons learned section up to date

---

**Document Version:** 1.0  
**Maintainer:** Update this file, not scattered fix docs

---

## FIX LOG - January 28, 2026

### Fix: progressTracker.updateCoinStatus is not a function

**Problem:** Multiple calls to `progressTracker.updateCoinStatus()` which doesn't exist in Phase 2.

**Root Cause:** Phase 2 progress-tracker uses `updateCoinInCache()` instead of `updateCoinStatus()`.

**Files Fixed:** `index.js`

**Changes Made:**
1. **manual-search-numista handler:** Removed unnecessary search tracking call
2. **merge-data handler:** Removed call - progress rebuilds from DB metadata on load
3. **update-coin-status IPC handler:** Rewrote to convert simple status to Phase 2 metadata format and call `updateCoinInCache()`

**Status Mapping:**
- `skipped` â†’ All data types set to SKIPPED
- `no_matches` â†’ basicData set to NO_MATCH
- `matched` â†’ basicData set to PENDING with numistaId
- `error` â†’ basicData set to ERROR


### Fix: Icons showing âšª after merge (metadata not written)

**Problem:** After merging, coin icons showed âšª (not queried) instead of âœ… (merged).

**Root Cause:** The merge-data handler was NOT writing enrichment metadata to the coin's note field. Progress tracking relies on this metadata.

**File Fixed:** `index.js`

**Changes Made:**
1. After successful merge, read current coin's note field
2. Build metadata object with basicData.status = 'MERGED'
3. Write metadata to note field using metadataManager.writeEnrichmentMetadata()
4. Update progress cache immediately using progressTracker.updateCoinInCache()

**Result:** Merged coins now properly show âœ… icon for basicData.


### Fix: Issue and Pricing Data Not Being Fetched

**Problem:** When user selected a match, only basic data was fetched. Issue data (mintage, mintmark) and pricing data were always null.

**Root Cause:** Missing `fetch-coin-data` IPC handler and the orchestration method `fetchCoinData` in numista-api.js. The flow was calling `getNumistaType` which only gets basic type data.

**Files Fixed:**
- `numista-api.js` - Added `getIssuePricing`, `matchIssue`, and `fetchCoinData` methods
- `preload.js` - Added `fetchCoinData` API exposure
- `index.js` - Added `fetch-coin-data` IPC handler
- `app.js` - Updated `handleMatchSelection` to call `fetchCoinData` instead of `getNumistaType`
- `app.js` - Updated `showFieldComparison` to pass issueData/pricingData
- `app.js` - Updated mergeData call to pass issueData/pricingData
- `field-mapper.js` - Updated `compareFields` and `mergeFields` to accept issueData/pricingData
- `field-mapper.js` - Updated `mapToOpenNumismat` to handle pricing fields (price1-4)

**Data Flow (Fixed):**
1. User selects match
2. `fetchCoinData(typeId, coin, fetchSettings)` called
3. Fetches basic data (always)
4. Fetches issue data if enabled in settings (auto-matches by year+mintmark)
5. Fetches pricing data if enabled and issue was matched
6. All data stored in AppState and passed to comparison and merge

**Issue Matching:**
- Auto-matches by year + mintmark
- Falls back to year only if no mintmark
- Returns USER_PICK if multiple matches (UI picker needed in future)


### Fix: Currency Selection Not Implemented Properly

**Problem:** `settingsManager.getSetting()` didn't exist. Currency selection wasn't being saved or read properly.

**Files Fixed:**
- `settings-manager.js` - Added `currency: 'USD'` to default settings, added `getCurrency()` and `setCurrency()` methods
- `index.js` - Added `save-currency` and `get-currency` IPC handlers, updated to use `getCurrency()` method
- `preload.js` - Added `saveCurrency` and `getCurrency` API methods
- `data-settings-ui.js` - Updated `populateSettings()` to load currency, updated `saveSettings()` to save currency
- `data-settings-modal.html` - Added currency selection dropdown with USD, EUR, GBP, CAD, AUD, JPY, CHF options

**Currency Flow:**
1. User selects currency in Data Settings modal
2. `saveSettings()` calls `window.api.saveCurrency(currency)`
3. IPC handler calls `settingsManager.setCurrency(currency)` which saves to settings file
4. When fetching pricing, `index.js` calls `settingsManager.getCurrency()` and passes to Numista API
5. Numista returns prices in the selected currency instead of defaulting to EUR


### Fix: Currency Selection Integrated Properly (January 29, 2026)

**Problem:** Previously gave user standalone files (data-settings-modal.html, data-settings-ui.js) instead of integrating code into existing project files.

**Correct Integration:**
- Currency dropdown added to `index.html` (inside dataSettingsModal)
- Currency load/save logic added to `app.js` (DataSettingsUI class)
- getCurrency/setCurrency methods added to `settings-manager.js`
- get-currency/save-currency IPC handlers added to `index.js`
- getCurrency/saveCurrency API methods added to `preload.js`
- Currency select CSS added to `main.css`

**Rule Added:** Added Rule 4 to CRITICAL LESSONS LEARNED: "NEVER CREATE STANDALONE MODULE FILES - INTEGRATE INTO EXISTING FILES"

