# OpenNumismat Enrichment Tool - Master Project Document

**Last Updated:** February 1, 2026
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
       ├── image-handler.js        - Image operations (Phase 2, Task 2.8)
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
n**image-handler.js** (Task 2.8)  
- Converts BLOBs to base64 data URIs for display
- Downloads images from Numista URLs
- Detects MIME types and validates image data
- Generates SVG placeholders for missing images
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

### Task 2.4 - Conditional API Calls ✅ COMPLETE (January 31, 2026)
- Modified numista-api.js with smart issue matching
- Added fetchCoinData() method for conditional data fetching
- Smart auto-match by year+mintmark or year+type (adaptive algorithm)
- **Issue Picker UI fully implemented:**
  - Modal dialog for USER_PICK scenarios
  - Displays all candidate issues with year, mintmark, mintage, type
  - Visual badges for exact/partial matches
  - Automatic pricing fetch for selected issue
  - Skip option for uncertain selections
- IPC handler fetchPricingForIssue for manual issue selection
- Graceful edge case handling (NO_MATCH, NO_DATA, ERROR)

### Task 2.5 - Freshness Indicators Ã¢Å“â€¦ COMPLETE
- Created freshness-calculator.js
- CSS styles for badges
- Helper functions for UI integration

### Task 2.6 - Filter & Sort ✅ COMPLETE (January 31, 2026)
- Fixed broken Phase 1 filters by adding missing event listeners- Implemented frontend filtering for all status types- Added Phase 2 data type filters (Complete, Partial, Missing Basic/Issue/Pricing)- Added Phase 2 freshness filters (Current <3mo, Recent 3mo-1yr, Aging 1-2yr, Outdated >2yr, Never)- Added Phase 2 sort options (Last Updated, Pricing Freshness, Status)- Implemented filter counts display showing statistics for each category- Updated HTML with enhanced filter dropdowns using optgroups- Added CSS styling for filter summary section- Frontend filtering supports up to 10k coins for large collections
### Task 2.7 - Fetch More Data Ã¢ÂÅ’ NOT STARTED  
### Task 2.8 - Images ✅ COMPLETE (January 31, 2026)
- Created image-handler.js module for all image operations
- Extended opennumismat-db.js with image table access methods
- Added IPC handlers (get-coin-images, download-and-store-images)
- Implemented coin list thumbnails (40x40px) with lazy loading
- Added Numista images to search results (80x80px obverse/reverse)
- Built side-by-side image comparison in field comparison screen
- Added user's coin images to match screen header (60x60px)
- Implemented hover zoom (3x for user images, 2.5x for search results)
- Images download from Numista at 400x400 resolution
- Stored in OpenNumismat images table with proper foreign key relationships
- Zero API calls - images are free (direct HTTP from Numista CDN)
### Task 2.9 - Settings File Management COMPLETE (February 1, 2026)
- Updated getApiKey() to check collection settings first, Phase 1 fallback
- Auto-migrate API key from Phase 1 to collection settings on load
- Sync API key and rate limit saves from Phase 1 settings to collection settings
- Populated fieldMappings defaults from default-field-mapping.js
- Fixed currency field missing from mergeWithDefaults
- Added Reset to Defaults button to Data Settings modal
- Added reset-settings IPC handler and preload method
- Wired Phase 1 and Phase 2 reset buttons

n### Coin List Pagination u2705 COMPLETE (January 31, 2026)
- Added pagination state to AppState (currentPage, pageSize, totalPages)
- Created pagination UI controls with navigation buttons
- Implemented smart button states (auto-disable at boundaries)
- Updated loadCoins to support offset-based pagination
- Added updatePaginationControls function
- Displays 100 coins per page with clear page indicators
- Shows current range (e.g., "Showing 101-200 of 500 coins")

---

## CURRENT STATUS - All Issues Resolved (Feb 1, 2026)

### Pricing and Mintage Fields - RESOLVED

All pricing and issue data flows are now working correctly. See fix log entries for details.

**Previous Status:** FIXED (was CURRENTLY BEING DEBUGGED)

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
| SKIPPED | 🚫 | All data types when user skips |

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

## PREVIOUSLY NEEDED FIXES (NOW RESOLVED)

### merge-data handler - FIXED (Jan 31, 2026)
mergeFields now correctly receives issueData and pricingData parameters.

### fetch-pricing-for-issue handler - FIXED (Feb 1, 2026)
Removed dead `settingsManager.incrementApiCalls(1)` call that was throwing TypeError and preventing pricing data from being returned to the renderer.

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

1. **Continue Phase 2:**
   - Task 2.7 - Fetch More Data feature (NOT STARTED)

2. **Update this master document:**
   - After each fix, update the relevant section
   - Do not create new fix documents
   - Keep lessons learned section up to date

---

**Document Version:** 1.1
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


### Fix: Corrupted Emoji Encoding in UI Files (January 31, 2026)

**Problem:** All emoji icons throughout the application UI were displaying as corrupted garbage characters (e.g., "äs™,□" instead of "⚙️", "ðŸ"‚" instead of "📂"). This affected buttons, status messages, tooltips, and other UI elements.

**Root Cause:** Previous file operations had corrupted UTF-8 emoji byte sequences. The corruption existed at the byte level, with multi-byte UTF-8 sequences being mangled into invalid character combinations. Standard text editing tools (including the Edit and Write tools in Claude Code) could not fix this because they would further corrupt the encoding when attempting to read and write the files.

**Files Fixed:**
- `src/renderer/index.html` - Fixed 17+ corrupted emoji instances
- `src/renderer/app.js` - Fixed 3+ corrupted emoji instances

**Affected Emojis:**
- ⚙️ Settings gear (multiple locations)
- 📂 Folder icon (Load Collection button)
- 💡 Light bulb (tip/info messages)
- 💰 Money bag (Fast Pricing button)
- ← Left arrow (navigation buttons)
- 📋 Clipboard (empty state messages)
- 🔄 Refresh (search again button)
- 🔍 Magnifying glass (search button)
- ✅ Checkmark (success status, merged status)
- ⚠️ Warning (alert messages)
- • Bullet point (status bar separator)
- → Right arrow (workflow steps)
- ❌ X mark (error status)

**Solution Approach:**
1. Created Python scripts using bash heredoc to avoid encoding corruption
2. Used binary mode file operations to read and replace exact byte sequences
3. Identified corrupted byte patterns through hex dump analysis
4. Replaced corrupted sequences with correct UTF-8 emoji bytes
5. Multiple iterations needed to clean up residual garbage after partial fixes

**Key Learnings:**
- The Write tool in Claude Code corrupts emojis when creating new files
- The Edit tool cannot match corrupted byte sequences accurately
- Shell sed commands struggle with multi-byte UTF-8 characters
- Python in binary mode with explicit byte sequence replacement is the most reliable approach
- Corruption can leave residual garbage bytes after the emoji even when the emoji itself is partially fixed

**Prevention:**
- Always follow EMOJI-ENCODING-GUIDANCE.md when working with files containing emojis
- Use bash commands (cp, sed) rather than Write/Edit tools for files with emojis
- Never use create_file or str_replace on sections containing emojis
- Test emoji rendering after any file modifications

**Commit:** 913e8d7 - Fix corrupted emoji encoding in UI files


### Fix: Missing axios Dependency (January 31, 2026)

**Problem:** Application failed to start with error "Cannot find module 'axios'" when running `npm start`.

**Root Cause:** The `axios` package was required by `numista-api.js` but was not listed in `package.json` dependencies.

**Files Fixed:**
- `package.json` - Added `axios: "^1.13.4"` to dependencies

**Solution:**
```bash
npm install axios
```

**Result:** Application now starts successfully with all dependencies installed.


### Fix: Automatic Search Returning No Results (January 31, 2026)

**Problem:** Automatic search (when clicking a coin) was returning 0 results, but manual search with the same coin title worked fine.

**Root Cause:** The `buildSearchParams` function in `app.js` was:
1. Adding the `series` field to the query, making it too specific (e.g., "Australia 2 Shillings 1944 WWII florin")
2. Initially used incorrect API parameter `year` instead of `min_year`/`max_year`

**Files Fixed:**
- `src/renderer/app.js` - Rewrote `buildSearchParams` function

**Solution:**
- Only use the `title` field for the query
- Check if year is already in the title
- If year is NOT in title, append it to the query string
- Don't use min_year/max_year API parameters (they're too restrictive)
- Don't include the series field (too specific)

**Before:**
```javascript
params.q = 'Australia 2 Shillings 1944 WWII florin';
params.year = 1944;  // Invalid parameter
```

**After:**
```javascript
params.q = 'Australia 2 Shillings 1944';  // Clean, specific enough
```

**Result:** Automatic search now finds matches successfully, just like manual search.


### Fix: Issue and Pricing Data Always Null (January 31, 2026)

**Problem:** Even though the Numista API was returning issue data (mintage, mintmark, etc.), the `matchIssue` function was detecting 0 issues and returning `NO_ISSUES`, causing issue and pricing data to never be fetched.

**Root Cause:** The Numista API `/types/{id}/issues` endpoint returns an **array directly**, but the code was trying to access `issuesResponse.issues` (as if it were wrapped in an object).

**Debug Evidence:**
```javascript
// API returned:
[{ id: 27148, year: 1938, mintage: 2864000 }, ...]

// Code was looking for:
issuesResponse.issues  // undefined!

// Result:
const issues = issuesResponse?.issues || [];  // []
issues.length === 0  // true → NO_ISSUES
```

**Files Fixed:**
- `src/modules/numista-api.js` - Fixed `matchIssue` method

**Solution:**
```javascript
// Before:
const issues = issuesResponse?.issues || [];

// After:
const issues = Array.isArray(issuesResponse)
  ? issuesResponse
  : (issuesResponse?.issues || []);
```

**Result:**
- Issue data now correctly identified and matched
- Auto-matching by year + mintmark works
- Pricing data can now be fetched (requires issue)
- Mintage and mintmark fields now available in field comparison

**Impact:** This was a critical bug preventing the entire Phase 2 multi-tier data fetching system from working. With this fix, users can now fetch:
- ✅ Basic coin type data
- ✅ Issue-specific data (mintage, mintmark)
- ✅ Pricing data (price1-4 in selected currency)


### Enhancement: Coin List Pagination (January 31, 2026)

**Feature Added:** Pagination controls for navigating through large coin collections.

**Motivation:** The coin list was limited to loading only the first 100 coins. Users with large collections (hundreds or thousands of coins) had no way to access coins beyond the first 100.

**Files Modified:**
- `src/renderer/app.js` - Added pagination state, updated loadCoins function, added updatePaginationControls function, added event handlers
- `src/renderer/index.html` - Added pagination controls UI between filters and coin list
- `src/renderer/styles/main.css` - Added pagination button and info styling

**Implementation Details:**

1. **Pagination State (AppState):**
```javascript
pagination: {
  currentPage: 1,
  pageSize: 100,
  totalPages: 1
}
```

2. **UI Controls:**
- ⏮️ First Page button
- ◀️ Previous button
- Page indicator showing "Page X of Y"
- ▶️ Next button
- ⏭️ Last Page button

3. **Smart Button States:**
- First/Previous buttons disabled on page 1
- Next/Last buttons disabled on final page

4. **Status Display:**
Shows current range: "Showing 101-200 of 500 coins"

5. **Backend Integration:**
- Backend already supported limit/offset parameters via getCoins method
- Frontend now calculates offset: `(currentPage - 1) * pageSize`
- Total pages calculated: `Math.ceil(totalCoins / pageSize)`

**Result:**
- Users can now navigate through entire collection regardless of size
- Performance improved - only 100 coins rendered at a time
- Clear visual feedback on current position in collection
- Seamless integration with existing filter/sort controls

**Documentation Updated:**
- PHASE2-WORK-PLAN.md - Added "Completed Enhancements" section
- CHANGELOG.md - Created with pagination feature entry
- MASTER-PROJECT-DOCUMENT.md - Updated Phase 2 status and fix log

---

## SESSION: January 31, 2026 Evening - Data Independence & Smart Issue Matching

**Date:** January 31, 2026 (Evening)
**Focus:** Fixed data fetching independence, implemented smart issue matching, fixed image handling

### Changes Made

#### 1. DATA INDEPENDENCE - All Three Data Types Now Optional ✅

**Problem:** Basic data was hardcoded as required, preventing independent fetching of issue/pricing data.

**Files Modified:**
- `src/modules/settings-manager.js` - Removed enforcement of basicData=true
- `src/modules/numista-api.js` - Made basic data fetch conditional  
- `src/renderer/index.html` - Made Basic Data checkbox optional (removed disabled state)
- `src/renderer/app.js` - Updated to read basicData checkbox value
- `PHASE2-WORK-PLAN.md` - Updated architecture decisions

**Changes:**
1. **Settings Manager (settings-manager.js)**
   - Line 47: Changed comment from "REQUIRED - always true" to "Optional - can be independently fetched"
   - Lines 106-109: Removed enforcement of `basicData: true` in mergeWithDefaults
   - Lines 186-193: Updated setFetchSettings to allow basicData to be set by user
   - Lines 214-230: Updated getCallsPerCoin to start at 0 instead of 2

2. **API (numista-api.js)**
   - Lines 235-239: Wrapped basic data fetch in conditional: `if (fetchSettings.basicData)`
   - Line 255: Only set issueData if explicitly requested

3. **UI (index.html)**
   - Line 404: Removed `disabled` class from data-setting-card
   - Line 407: Removed `disabled` attribute from checkbox
   - Line 408: Changed badge from "REQUIRED" to "OPTIONAL"

4. **Renderer (app.js)**
   - populateSettings(): Now reads basicData from settings instead of forcing true
   - applyDataSettings(): Now reads basicData checkbox value
   - getCurrentSettings(): Now reads basicData checkbox value

**Result:**
- Users can now fetch ONLY issue data without basic data
- Users can now fetch ONLY pricing data without basic data
- Users can fetch any combination of the three data types
- API call count accurately reflects selected data types

#### 2. SMART ISSUE MATCHING - Adaptive Differentiating Fields ✅

**Problem:** Issue matching only checked year + mintmark, failing to handle year + type/comment differentiation (e.g., Proof vs regular circulation coins).

**File Modified:** `src/modules/numista-api.js` (matchIssue method, lines 168-284)

**Old Logic:**
- Filter by year
- If year + mintmark both present → try exact match
- If only year → return USER_PICK if multiple matches
- Static approach that didn't adapt to available fields

**New Smart Logic:**
1. **Filter by year** (always required)
2. **Analyze differentiating fields** among year matches:
   - Check if `mint_letter` varies → mintmark is a differentiator
   - Check if `comment` varies → type is a differentiator
3. **Apply filters based on available user data:**
   - If mintmark varies AND user has mintmark → filter by mint_letter
   - If comment varies → filter by type/comment:
     - User type blank/undefined → match issues with NO comment (regular)
     - User type = "Proof" → match issues with comment containing "Proof"
     - User type = other → match issues with that comment value
4. **Return result:**
   - 1 candidate → AUTO_MATCH
   - Multiple candidates → USER_PICK (with filtered list)
   - 0 candidates → USER_PICK (reset to year matches)

**Key Features:**
- Handles year + mintmark (e.g., US coins: 1943-D, 1943-S)
- Handles year + type (e.g., Austrian coins: 1951 regular, 1951 Proof)
- Handles year + mintmark + type (e.g., 1943-D Proof)
- Adapts to whichever fields actually vary in the data
- Extensive console logging for debugging

**Result:**
- Austrian 10 Groschen coins now auto-match correctly (year + type=blank matches regular circulation, not proof)
- US coins still auto-match by year + mintmark
- Coins with multiple differentiating fields handled correctly
- Reduces unnecessary USER_PICK prompts

#### 3. IMAGE HANDLING FIXES ✅

**Problem 1:** Images not displaying in comparison view
**Cause:** thumbnail URLs from search results were being overwritten when fetching detailed type data

**File Modified:** `src/renderer/app.js` (lines 1121-1145)

**Fix:**
- Preserve `obverse_thumbnail`, `reverse_thumbnail`, `edge_thumbnail` from search result
- Merge these into detailed type data before overwriting selectedMatch
- Images now display correctly in side-by-side comparison

**Problem 2:** Image download failing with "table images has no column named title"
**Cause:** insertImage method trying to insert title column that doesn't exist

**File Modified:** `src/modules/opennumismat-db.js` (line 455)

**Fix:**
- Changed SQL from `INSERT INTO images (image, title) VALUES (?, ?)` 
- To: `INSERT INTO images (image) VALUES (?)`
- OpenNumismat images table only has `id` and `image` columns

**Problem 3:** Download button styling inconsistent
**File Modified:** `src/renderer/app.js` (lines 1337-1345)

**Fix:**
- Changed class from `btn btn-small` → `btn btn-primary`
- Moved button to appear AFTER images (below them)
- Made button full-width with increased margin

**Result:**
- Images display correctly in all views
- Image download works without errors
- Button matches other UI buttons in size, shape, and color

### Documentation Updates

**Files Updated:**
- `MASTER-PROJECT-DOCUMENT.md` - This session log added
- `PHASE2-WORK-PLAN.md` - Architecture Decisions updated with data independence note

**Key Points:**
- All three data types (Basic, Issue, Pricing) are now truly independent
- Smart matching adapts to whatever differentiating fields exist in the data
- Issue matching handles year+mintmark, year+type, and combinations
- Image handling fully functional end-to-end

### Testing Status

**Tested:**
- ✅ Data settings with only Issue Data selected
- ✅ Data settings with only Pricing Data selected  
- ✅ Austrian 10 Groschen auto-matching by year + type (blank = regular)
- ✅ Image display in comparison view
- ✅ Image download to collection
- ✅ Button styling and positioning

**Next Steps:**
- ✅ Issue picker UI implemented
- Test with US coins (year + mintmark differentiation)
- Test with coins having multiple differentiating fields
- Begin Task 2.7 - Fetch More Data feature

---

## SESSION: January 31, 2026 Late Evening - Issue Picker UI Implementation

**Date:** January 31, 2026 (Late Evening)
**Focus:** Completed Phase 2 Task 2.4 - Issue Picker UI for manual issue selection

### Implementation Summary

Implemented the missing Issue Picker UI component that allows users to manually select the correct issue when the smart matching algorithm finds multiple candidates.

### Changes Made

#### 1. Issue Picker Modal UI ✅

**File Modified:** `src/renderer/index.html`

**Added:**
- New modal dialog `issuePickerModal` with clean, user-friendly layout
- Displays coin name and user's coin information (year, mintmark, type)
- Dynamic list container for issue options
- "Apply Selection" and "Skip Issue Data" buttons
- Close button for cancellation

**Structure:**
```html
<div id="issuePickerModal">
  - Header with coin name
  - User's coin info display
  - Issue options list (populated dynamically)
  - Action buttons (Apply/Skip)
</div>
```

#### 2. Issue Picker Styling ✅

**File Modified:** `src/renderer/styles/main.css`

**Added:** 112 lines of CSS (lines 1568-1679)
- Modal layout and responsive design
- Issue option cards with hover effects
- Selection state visualization (blue border, background)
- Badge styling for exact/partial matches (green/orange)
- Detail grid layout for issue information
- Empty value styling (gray, italic)

**Key Styles:**
- `.issue-option` - Card layout with transitions
- `.issue-option.selected` - Blue theme for selected state
- `.issue-option-match-badge` - Green badge for exact matches
- `.issue-option-partial-badge` - Orange badge for partial matches

#### 3. Issue Picker JavaScript Logic ✅

**File Modified:** `src/renderer/app.js`

**Added:** `showIssuePicker()` function (lines 1476-1626)

**Features:**
- Displays modal with all candidate issues
- Renders issue details (year, mintmark, mintage, type)
- Analyzes match quality:
  - Exact match: year + mintmark both match
  - Partial match: year matches OR type matches
  - Visual badges indicate match quality
- Interactive selection with radio buttons
- Returns Promise with user's choice:
  - `{ action: 'selected', issue: <selected> }`
  - `{ action: 'skip', issue: null }`
  - `{ action: 'cancel', issue: null }`

**Match Quality Logic:**
```javascript
const matchesYear = issue.year == coin.year;
const matchesMintmark = coin.mintmark && issue.mint_letter &&
  issue.mint_letter.toLowerCase() === coin.mintmark.toLowerCase();
const matchesType = !coin.type || coin.type === '' ?
  (!issue.comment || issue.comment === '') :
  (issue.comment && issue.comment.toLowerCase().includes(coin.type.toLowerCase()));

const isFullMatch = matchesYear && matchesMintmark;
const isPartialMatch = matchesYear && (matchesMintmark || matchesType);
```

#### 4. Integration into Match Flow ✅

**File Modified:** `src/renderer/app.js` (handleMatchSelection function)

**Logic Flow:**
1. After `fetchCoinData` completes, check `issueMatchResult.type`
2. **If USER_PICK:**
   - Show issue picker modal with `result.issueOptions`
   - Wait for user selection
   - **If user selects an issue:**
     - Store as `AppState.issueData`
     - Check if pricing is enabled in settings
     - If yes, fetch pricing for selected issue
     - Store pricing as `AppState.pricingData`
   - **If user skips:**
     - Set `issueData` and `pricingData` to null
   - **If user cancels:**
     - Abort flow, return early
3. Proceed to field comparison with selected/skipped data

#### 5. Pricing Fetch for Selected Issue ✅

**Files Modified:**
- `src/main/index.js` - Added IPC handler `fetch-pricing-for-issue`
- `src/main/preload.js` - Exposed `fetchPricingForIssue()` API method

**IPC Handler:** (lines 284-306 in index.js)
```javascript
ipcMain.handle('fetch-pricing-for-issue', async (event, { typeId, issueId }) => {
  // Get currency from settings
  // Call api.getIssuePricing(typeId, issueId, currency)
  // Return pricing data
});
```

**Purpose:**
- Allows fetching pricing for a manually selected issue
- Respects currency settings
- Used after user selects from issue picker

### Files Modified Summary

1. `src/renderer/index.html` - Issue Picker modal HTML
2. `src/renderer/styles/main.css` - Issue Picker styling (112 lines)
3. `src/renderer/app.js` - showIssuePicker() function and integration
4. `src/main/index.js` - fetch-pricing-for-issue IPC handler
5. `src/main/preload.js` - fetchPricingForIssue API exposure

### User Experience

**Scenario: 1943 Lincoln Cent (Multiple Mints)**

1. User searches for and selects a match
2. Smart matching finds 3 issues: 1943-P, 1943-D, 1943-S
3. **Issue Picker modal appears:**
   ```
   Select Issue for 1943 Lincoln Cent

   Your coin: Year: 1943, Mintmark: (not specified), Type: (regular)

   ○ 1943 - P [EXACT MATCH]
     Year: 1943
     Mintmark: P
     Mintage: 684,628,670

   ○ 1943 - D
     Year: 1943
     Mintmark: D
     Mintage: 217,660,000

   ○ 1943 - S
     Year: 1943
     Mintmark: S
     Mintage: 191,550,000

   [Apply Selection]  [Skip Issue Data]
   ```
4. User selects the correct mint
5. System fetches pricing for that mint (if enabled)
6. Proceeds to field comparison with mint-specific data

### Key Features

- **Visual Match Indicators** - Green "EXACT MATCH" badge, orange "PARTIAL MATCH" badge
- **Detailed Information** - Mintage helps identify rare vs common variants
- **Smart Default** - Exact matches highlighted for quick selection
- **Skip Option** - Users can proceed without issue data if unsure
- **Automatic Pricing** - Fetches pricing for selected issue if enabled
- **Clean Cancellation** - Closing modal aborts the operation

### Testing Recommendations

Test with coins having multiple issues:
- **US Coins:** 1943 Lincoln Cent (P/D/S), 1964 Kennedy Half (P/D)
- **Austrian Coins:** 1951 10 Groschen (Regular/Proof)
- **Canadian Coins:** Various years with multiple mints

The picker appears automatically when smart matching returns USER_PICK.

### Task 2.4 Status

**All Components Complete:**
- ✅ Conditional API calls based on settings
- ✅ Smart issue matching (adaptive algorithm)
- ✅ Issue Picker UI (modal, styling, logic)
- ✅ Pricing fetch for selected issue
- ✅ Integration into match flow
- ✅ Edge case handling

**Phase 2 Task 2.4 is now 100% COMPLETE** ✅

---

## SESSION: January 31, 2026 Late Night - Skip Functionality and Icon Fixes

**Date:** January 31, 2026 (Late Night)
**Focus:** Fixed skip metadata persistence and improved skipped icon intuitiveness

### Issues Reported by User

1. **Skip not marking all data types**: When skipping a coin, basicData and issueData were marked as SKIPPED but pricingData was not being marked, even though all three data types were selected in settings.

2. **Skipped icon not intuitive**: The yellow star ⭐ icon used for skipped coins was not intuitive. User suggested NO symbol or something more clearly indicating "skipped".

### Root Causes

**Issue 1: Skip Not Marking All Data Types**

Multiple interconnected issues prevented all three data types from showing as skipped:

1. **No database persistence**: `update-coin-status` handler only updated in-memory cache, not the database note field
2. **Incomplete metadata**: Partial metadata object passed to cache didn't include all required fields (numistaId, fieldsMerged, etc.)
3. **Missing statistics counters**: `progress-tracker.js` statistics structure lacked `skipped: 0` for each data type (basicData, issueData, pricingData)
4. **Wrong status mapping**: `getStatKeyForStatus()` mapped `'SKIPPED'` to `'pending'` instead of `'skipped'`
5. **Missing icon in pricing function**: `getPricingIcon()` lacked SKIPPED entry in its iconMap, causing pricing to show ⚪ instead of 🚫

**Issue 2: Non-Intuitive Icon**
- The star emoji ⭐ doesn't clearly communicate "skipped" or "not processed"
- Users expected a more negative/prohibitive symbol to indicate intentional skipping

### Fixes Applied

#### Fix 1: Database Persistence for Skip Status

**File Modified:** `src/main/index.js` (update-coin-status handler)

**Changes Made:**
1. Fixed method name: Changed `db.getCoin()` to `db.getCoinById()` (correct API)
2. Fixed metadata extraction: Changed `metadataManager.extractUserNotes()` to `metadataManager.readEnrichmentMetadata()` (correct API that returns `{userNotes, metadata}`)
3. Added database write for skip status:
   - Read coin from database
   - Extract user notes from existing note field
   - Build phase2Metadata with all three data types set to SKIPPED
   - Write metadata to database note field
   - Read back complete metadata (includes all fields added by ensureValidMetadata)
   - Update cache with complete metadata
4. Update progress tracker's currentFetchSettings before cache update

**Code Pattern:**
```javascript
if (status === 'skipped' || status === 'SKIPPED') {
  phase2Metadata.basicData = { status: 'SKIPPED', timestamp };
  phase2Metadata.issueData = { status: 'SKIPPED', timestamp };
  phase2Metadata.pricingData = { status: 'SKIPPED', timestamp };

  const coin = db.getCoinById(coinId);
  if (coin) {
    const { userNotes } = metadataManager.readEnrichmentMetadata(coin.note || '');
    const updatedNote = metadataManager.writeEnrichmentMetadata(userNotes, phase2Metadata);
    db.updateCoin(coinId, { note: updatedNote });

    // Read back complete metadata
    const { metadata: completeMetadata } = metadataManager.readEnrichmentMetadata(updatedNote);
    phase2Metadata = completeMetadata;
  }
}

// Update progress tracker's current fetch settings
progressTracker.currentFetchSettings = fetchSettings;
progressTracker.updateCoinInCache(coinId, phase2Metadata, fetchSettings);
```

#### Fix 2: Progress Tracker Statistics Structure

**File Modified:** `src/modules/progress-tracker.js` (resetStatistics method, lines 169-195)

**Changes Made:**
Added `skipped: 0` counter to each data type's statistics:
```javascript
basicData: {
  merged: 0,
  pending: 0,
  notQueried: 0,
  skipped: 0,  // NEW
  error: 0,
  noData: 0
},
issueData: {
  merged: 0,
  pending: 0,
  notQueried: 0,
  skipped: 0,  // NEW
  error: 0,
  noMatch: 0,
  noData: 0
},
pricingData: {
  merged: 0,
  pending: 0,
  notQueried: 0,
  skipped: 0,  // NEW
  error: 0,
  noData: 0,
  // freshness counters...
}
```

#### Fix 3: Status Mapping Correction

**File Modified:** `src/modules/progress-tracker.js` (getStatKeyForStatus method, line 299)

**Changes Made:**
Changed SKIPPED status mapping:
```javascript
// Before:
'SKIPPED': 'pending',  // Skipped coins count as pending for data type stats

// After:
'SKIPPED': 'skipped',
```

#### Fix 4: Skipped Icon Changed to Prohibited Symbol

**File Modified:** `src/renderer/app.js` (multiple icon functions)

**Changes Made:**
1. Changed SKIPPED icon from ⭐ (star) to 🚫 (prohibited/no entry)
2. Updated in THREE locations (pricing was missing):
   - `getStatusIcon()` function (line 707) - overall status icon
   - `getDataTypeIcon()` function (line 772) - basic and issue data icons
   - `getPricingIcon()` function (line 799) - **CRITICAL FIX** - was missing SKIPPED entry

**Implementation Method:**
- Used Python binary file operation to replace corrupted emoji bytes
- The star emoji was already corrupted in the file (double UTF-8 encoding)
- Replaced corrupted bytes `c3 a2 c2 8f c2 ad c3 af c2 b8 c2 8f` with prohibited emoji bytes `f0 9f 9a ab`
- This approach prevented further emoji corruption

**Code Changes:**

`getDataTypeIcon()` and `getStatusIcon()`:
```javascript
// Before:
'SKIPPED': { icon: '⭐', title: label + ': Skipped' }

// After:
'SKIPPED': { icon: '🚫', title: label + ': Skipped' }
```

`getPricingIcon()` - **NEW ADDITION**:
```javascript
const iconMap = {
  'NOT_QUERIED': { icon: '⚪', title: 'Pricing: Not requested' },
  'PENDING': { icon: '⏳', title: 'Pricing: Pending' },
  'ERROR': { icon: '❌', title: 'Pricing: Error' },
  'NO_DATA': { icon: '📭', title: 'Pricing: No data available' },
  'SKIPPED': { icon: '🚫', title: 'Pricing: Skipped' }  // NEW - was missing!
};
```

**Result:**
- 🚫 symbol clearly indicates "not allowed" or "intentionally not processed"
- Much more intuitive than star emoji
- All three data type icons (basic, issue, pricing) now show 🚫 for skipped coins
- Matches user expectations for a "skipped" status

### Summary of Changes

**Files Modified:**
1. `src/main/index.js` - Fixed update-coin-status handler for database persistence
2. `src/modules/progress-tracker.js` - Added skipped counters to statistics, fixed status mapping
3. `src/renderer/app.js` - Updated SKIPPED icons in three locations (getStatusIcon, getDataTypeIcon, getPricingIcon)

**Total Code Changes:**
- 5 bugs fixed
- 3 files modified
- ~15 lines of code changed

### Testing Verification

**Test Case: Skip Australia 2 Shillings 1944**
1. User has all three data types enabled in settings (basicData, issueData, pricingData)
2. User clicks coin and selects "Skip"
3. **Expected Result:**
   - All three icons show 🚫 (not ⭐)
   - Metadata is written to database note field
   - Status persists across app restart
   - Statistics show correct counts for each data type
4. **Actual Result:** ✅ ALL TESTS PASSED
   - Coin list shows three 🚫 icons
   - Database note field contains complete SKIPPED metadata
   - App restart shows three 🚫 icons (persistence verified)
   - Statistics: `basicData.skipped: 3`, `issueData.skipped: 3`, `pricingData.skipped: 3`

### Icon Map Updated

| Status | Old Icon | New Icon | Used For |
|--------|----------|----------|----------|
| SKIPPED | ⭐ | 🚫 | All data types when user skips |

### Lessons Learned

1. **Always persist status changes to database**: In-memory cache updates are not sufficient for stateful data that needs to survive app restarts

2. **Read back complete metadata after write**: Using ensureValidMetadata fills in required fields; read back after write to get complete structure

3. **Check ALL icon rendering functions**: Different data types may use different icon rendering functions (getDataTypeIcon vs getPricingIcon)

4. **Verify statistics structure matches status types**: Missing counter fields cause silent failures in statistics tracking

5. **Icon choice matters for UX**: Intuitive icons (🚫 = prohibited/skipped) reduce cognitive load vs ambiguous icons (⭐ = favorite/starred?)

6. **Emoji corruption handling**: When working with files containing emojis, use Python binary operations rather than text-based tools to avoid further corruption

---

## SESSION: February 1, 2026 - Image Display Fix (Task 2.8 Troubleshooting)

**Date:** February 1, 2026
**Focus:** Fixed wrong coin images displaying in collection list and match header

### Issue Reported

1. **Wrong coin images**: Collection list showing images from wrong coins (e.g., US Indian Head Cent showing for a French Liard)
2. **Multiple/split imaging**: Thumbnails showing tiled/composite images from different coins

### Root Cause

OpenNumismat databases have TWO separate image storage systems:

1. **`images` table** (520 rows) - Referenced by `coins.image` column - stores **composite angel-wing thumbnails** (obverse+reverse side-by-side in a single image)
2. **`photos` table** (1042 rows) - Referenced by `coins.obverseimg`/`coins.reverseimg` columns - stores **separate obverse and reverse images**

The original Task 2.8 code queried the `images` table using `obverseimg`/`reverseimg` IDs. But these IDs actually reference the `photos` table (range 1-1042), not the `images` table (range 1-520). This caused:
- **Wrong images**: IDs within 1-520 returned unrelated composite images from the `images` table
- **Missing images (placeholders)**: IDs above 520 returned nothing since the `images` table only has 520 rows
- **Split/tiled appearance**: The composite angel-wing images showed two coin sides in one thumbnail

### Fix Applied

**File Modified:** `src/modules/opennumismat-db.js`

**Changes:**

1. **`getCoinImages()` method** - Changed `obverseimg`/`reverseimg` lookups from `getImageData()` (images table) to `getPhotoData()` (photos table)

2. **`getCoinImageIds()` method** - Simplified to use `obverseimg`/`reverseimg` directly

**OpenNumismat Image Table Mapping:**
```
coins.obverseimg → photos table (separate obverse image)
coins.reverseimg → photos table (separate reverse image)
coins.image      → images table (composite angel-wing thumbnail)
```

**File Modified:** `src/renderer/styles/main.css`

**UI Improvements:**
1. **Enlarged selected coin images** from 60x60px to 120x120px for easier visual comparison
2. **Sticky match header** - Selected coin pane stays pinned at top when scrolling through matches

**All image display locations are fixed** (all use the same `getCoinImages` IPC call):
- Collection list thumbnails (40x40px)
- Match screen header (user's coin images, 120x120px)
- Field comparison view (side-by-side image comparison)

### Key Learning

7. **OpenNumismat image column mapping is non-obvious**: `obverseimg`/`reverseimg` reference the `photos` table, NOT the `images` table. The `images` table stores composite thumbnails referenced by `coins.image`. Always verify which table foreign keys actually point to via row counts and ID ranges.

---

## SESSION: February 1, 2026 (Evening) - Pricing Data Not Returned to Renderer

**Date:** February 1, 2026 (Evening)
**Focus:** Fixed pricing data fetch error preventing all pricing fields from populating

### Issue Reported

Pricing data was not being displayed or merged. All four price fields (price1-4) were being skipped with "requires pricing data" during field mapping. The pricingData was always null throughout the entire flow.

### Root Cause

**File:** `src/main/index.js` (line 302 in `fetch-pricing-for-issue` IPC handler)

The handler successfully fetched pricing data from the Numista API, but then called `settingsManager.incrementApiCalls(1)` - a method that **does not exist** on the SettingsManager class. This threw a TypeError which was caught by the catch block, causing the handler to return `{ success: false, error: "settingsManager.incrementApiCalls is not a function" }` instead of `{ success: true, pricingData }`.

**Debug Evidence:**

    Pricing fetched: true
    Error fetching pricing for issue: TypeError: settingsManager.incrementApiCalls is not a function

The pricing was fetched but never returned to the renderer.

### Fix Applied

**File Modified:** `src/main/index.js`

**Change:** Removed the dead code call to non-existent `settingsManager.incrementApiCalls(1)` (lines 300-303).

    // REMOVED:
    // Increment API call counter
    if (settingsManager) {
      settingsManager.incrementApiCalls(1);
    }

The SettingsManager class has no API call counting functionality. This was likely a leftover from a planned feature that was never implemented.

### Result

- Pricing data now flows correctly from API through IPC to renderer
- All four price fields (price1-4) populate in field comparison view
- Users can select and merge pricing data into their collection

### Lesson Learned

8. **Dead code referencing non-existent methods can silently break features**: The `incrementApiCalls` call was guarded by `if (settingsManager)` which passed (settingsManager existed), but the method itself didn't exist. Because this was inside a try/catch, the error was caught and the entire handler returned failure, silently discarding the successfully-fetched pricing data. Always verify that called methods actually exist on their target objects.

---

## SESSION: February 1, 2026 (Late Evening) - Counter Strip Redesign

**Date:** February 1, 2026 (Late Evening)
**Focus:** Redesigned progress counter strip to show per-data-type status

### Problem

The original counter strip had 4 generic cards (Total Coins, Processed, Merged, Remaining) that incremented by 1 when ANY of the three data types were pulled. This did not give the user meaningful visibility into the status of each data type (Basic, Issue, Pricing) independently.

### Solution

Replaced the 4 generic cards with a **Total card + 3 data-type cards** layout:

```
┌──────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   521    │  │  BASIC DATA     │  │  ISSUE DATA     │  │  PRICING DATA   │
│  TOTAL   │  │  1 / 521        │  │  1 / 521        │  │  1 / 521        │
│  COINS   │  │  ██░░░░░░░░░░░  │  │  ██░░░░░░░░░░░  │  │  ██░░░░░░░░░░░  │
│          │  │  0 err · 0 skip │  │  0 err · 0 skip │  │  0 err · 0 skip │
└──────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

Each data-type card shows:
- Label (BASIC DATA / ISSUE DATA / PRICING DATA)
- Merged / Total count as primary number
- Blue progress bar proportional to merged/total
- Secondary line with error count (red if > 0) and skipped count (hidden when both are 0)
- Clickable error/skipped counts that filter the coin list

All three data-type cards are always visible regardless of current fetch settings, since the purpose is to track overall collection status.

### Files Modified

1. **`src/renderer/index.html`** (lines 74-106) - Replaced 4 generic stat cards with Total + 3 data-type cards. Each card has progress bar div, merged/total spans, and error/skipped count spans with data-filter attributes.

2. **`src/renderer/styles/main.css`** (lines 201-290) - Changed `.progress-summary` from CSS grid to flexbox layout. Added styles for `.data-type-card`, `.progress-bar` (6px height, border-radius), `.progress-bar-fill` (blue with transition animation), `.stat-secondary` (hidden by default, shown via `.visible` class), `.stat-error-count.has-errors` (red #dc2626), `.stat-clickable` (cursor pointer, hover underline).

3. **`src/renderer/app.js`**:
   - Added `AppState.fetchSettings` property (line 22)
   - `loadCollectionScreen()` now fetches collection-specific settings via `window.api.getSettings()` and stores on `AppState.fetchSettings`
   - Rewrote `updateProgressStats()` to iterate over three data types, reading per-type stats from `AppState.progressStats.basicData/.issueData/.pricingData`, setting progress bar widths and error/skipped counts
   - Added click handlers on `.stat-clickable` elements that set the status filter dropdown and reload the coin list
   - Updated `DataSettingsUI.saveSettings()` to sync `AppState.fetchSettings` and refresh counter strip

### Key Design Decisions

1. **Always show all three cards** - Cards are never hidden based on fetch settings. The counter strip tracks overall collection status regardless of what's currently enabled.
2. **"Processed" and "Remaining" removed** - These were ambiguous with three data types. Each card now shows merged/total which is more precise.
3. **Progress bars** - Provide instant visual sense of completion per data type.
4. **Error counts in red** - Only when > 0, via `.has-errors` CSS class toggle.
5. **Clickable counts** - Error clicks filter to `missing_basic`/`missing_issue`/`missing_pricing`; skipped clicks filter to `skipped`. Uses existing filter infrastructure.

### Bug Fixed During Implementation

**`AppState.settings` vs `AppState.fetchSettings`** - Initially used `AppState.settings?.fetchSettings` to determine card visibility, but `AppState.settings` stores Phase 1 app-level settings (API key, delay) which has no `fetchSettings` property. Collection-specific fetch settings come from a separate IPC call (`window.api.getSettings()` / `get-settings` handler). Added `AppState.fetchSettings` populated during `loadCollectionScreen()`. Ultimately made moot by deciding to always show all three cards.

### Lesson Learned

9. **Understand the two settings systems**: Phase 1 app settings (`window.electronAPI.getAppSettings()` → `AppState.settings`) and Phase 2 collection settings (`window.api.getSettings()` → separate object) are completely different IPC channels with different data structures. Never assume one contains the other's properties.

---

---

## SESSION: February 1, 2026 (Night) - Task 2.9 Settings File Management

**Date:** February 1, 2026 (Night)
**Focus:** Completed Phase 2 Task 2.9 - Settings File Management

### Changes Made

#### 1. API Key Migration to Collection Settings

**File Modified:** `src/main/index.js`

- **getApiKey():** Now checks `settingsManager.getApiKey()` first, falls back to Phase 1 app-wide settings
- **load-collection handler:** Auto-migrates API key from Phase 1 (`userData/settings.json`) to collection-specific settings on first load
- **save-app-settings handler:** Syncs API key and rate limit to collection settings when Phase 1 settings are saved

This means the API key is now portable with the collection database.

#### 2. Field Mappings Populated from Defaults

**File Modified:** `src/modules/settings-manager.js`

- Imported `DEFAULT_FIELD_MAPPING` from `default-field-mapping.js`
- Added `buildDefaultFieldMappings()` method that creates serializable mapping: `{ fieldName: { enabled, priority, description } }`
- Transform functions are NOT stored (not serializable); they remain in `default-field-mapping.js`
- Fixed `currency` field missing from `mergeWithDefaults()` - was silently lost on reload

#### 3. Reset to Defaults UI

**Files Modified:**
- `src/renderer/index.html` - Added "Reset to Defaults" button to Data Settings modal
- `src/renderer/app.js` - Added `resetToDefaults()` method to DataSettingsUI class, wired Phase 1 reset button
- `src/main/index.js` - Added `reset-settings` IPC handler
- `src/main/preload.js` - Exposed `resetSettings()` API method

**Behavior:**
- Phase 2 Reset: Calls `settingsManager.resetToDefaults()`, preserves API key, repopulates modal with defaults
- Phase 1 Reset: Resets search delay, image handling, backup settings to defaults, preserves API key

### Files Modified Summary

1. `src/main/index.js` - getApiKey() update, API key migration, save sync, reset handler
2. `src/main/preload.js` - resetSettings method
3. `src/modules/settings-manager.js` - Import default mappings, buildDefaultFieldMappings(), currency in merge
4. `src/renderer/index.html` - Reset button in Data Settings modal
5. `src/renderer/app.js` - resetToDefaults() method, Phase 1 reset wiring

### Task 2.9 Checklist

- [x] Create settings-manager.js (already existed)
- [x] Implement loadSettings / saveSettings (already existed)
- [x] Generate filename {dbname}_settings.json (already existed)
- [x] Store next to database file (already existed)
- [x] Define settings structure (already existed)
- [x] Fall back to default-field-mapping.js (NEW - populated fieldMappings)
- [x] Handle multiple collections (already worked)
- [x] Switch settings when switching databases (already worked)
- [x] Settings UI - allow editing (fetch settings + currency existed, reset added)
- [x] Save on change (already existed)
- [x] Reset to defaults option (method existed, UI added)
- [x] API key in collection settings (NEW - migration + sync)

**Phase 2 Task 2.9 - Settings File Management: 100% COMPLETE**

---

## SESSION: February 1, 2026 (Late Night) - Status Bar API Call Estimate Fix

**Date:** February 1, 2026 (Late Night)
**Focus:** Fixed incorrect API call estimate display in status bar

### Issue Reported

Status bar at the bottom of the screen always showed "Fetch: Basic (2 calls)" even when all three data types (Basic, Issue, Pricing) were selected in Data Settings.

### Root Cause

Two bugs combined to produce the incorrect display:

1. **Status bar never updated after collection load**: `updateStatusBarDisplay()` was called on DOMContentLoaded, but that call failed with "Error: No collection loaded" because no collection is open at app startup. When the collection later loaded via `loadCollectionScreen()`, the status bar was never refreshed, so it stayed at the HTML default text "Fetch: Basic (2 calls)".

2. **Basic data hardcoded in call count**: Both `updateStatusBarDisplay()` and `updateCostDisplay()` always started with `parts = ['Basic']` and `callCount = 2`, ignoring whether `settings.basicData` was actually enabled. Issue and Pricing were conditionally added, but Basic was assumed always-on (leftover from when Basic was required).

### Fix Applied

**File Modified:** `src/renderer/app.js`

**Changes:**

1. **`updateStatusBarDisplay()` (line ~2299)** - Changed from hardcoded `parts = ['Basic']` / `callCount = 2` to checking `settings.basicData` before including Basic and adding 2 to call count. Added fallback for zero selections showing "Fetch: None (0 calls)".

2. **`updateCostDisplay()` (line ~2203)** - Changed from hardcoded `callsPerCoin = 2` to checking the `fetchBasicData` checkbox, starting at 0.

3. **`loadCollectionScreen()` (line ~164)** - Added call to `dataSettingsUI.updateStatusBarDisplay(AppState.fetchSettings)` after loading collection settings, so the status bar reflects actual settings immediately.

### Result

- Status bar now correctly shows "Fetch: Basic + Issue + Pricing (4 calls)" when all three types are selected
- Status bar updates immediately when a collection is loaded
- Call count accurately reflects which data types are enabled

### Lesson Learned

10. **Always update UI after async data loads**: If a UI element depends on data that isn't available at DOMContentLoaded (like collection-specific settings), ensure the UI is updated again after the data actually loads. Relying solely on initialization-time updates leaves stale defaults visible.

---

## SESSION: February 2, 2026 - Session Call Counter Fix (Task 1.1)

**Date:** February 2, 2026
**Focus:** Fixed session call counter staying at 0, not tracking API calls

### Issue Reported

Session call counter remained at 0 and never incremented when making API calls to Numista. The display infrastructure existed (footer + Data Settings modal), but the counter was never updated.

### Root Cause

The session counter infrastructure existed in both backend and frontend, but was never called:

1. **Backend**: API handlers (`search-numista`, `fetch-coin-data`, `fetch-pricing-for-issue`, `fetch-issue-data`) were making API calls but never calling `progressTracker.incrementSessionCalls()`
2. **Frontend**: After API operations completed, the frontend never called `refreshSessionCounter()` to update the display
3. **Session reset**: Counter was loaded from progress file on collection load, not reset to 0

### Files Fixed

1. `src/main/index.js` - Added session counter increments to API handlers
2. `src/renderer/app.js` - Added `refreshSessionCounter()` helper and calls after API operations

### Changes Made

#### Backend Session Counter Increments (index.js)

Added `progressTracker.incrementSessionCalls(count)` to all API handlers:

1. **search-numista** (line 235) - Increments by 1 after successful search
2. **manual-search-numista** (line 264) - Increments by 1 after successful search
3. **fetch-coin-data** (lines 320-333) - Increments based on actual API calls made:
   - +1 if `result.basicData` exists (getType was called)
   - +1 if issueData or pricingData was requested (getTypeIssues was called)
   - +1 if `result.pricingData` exists (getIssuePricing was called)
4. **fetch-pricing-for-issue** (line 361) - Increments by 1 after successful pricing fetch
5. **fetch-issue-data** (line 387) - Increments by 1 after successful issue fetch
6. **load-collection** (line 127) - Calls `progressTracker.resetSessionCallCount()` to reset counter to 0 on collection load

#### Frontend Session Counter Refresh (app.js)

1. **Added helper function** `refreshSessionCounter()` (line 2646) - Fetches statistics from backend and updates display
2. **Added refresh calls** after all API operations:
   - After automatic search (line 1011)
   - After manual search (line 2154)
   - After fetching coin data in match selection (line 1269)
   - After fetching issue data (line 1663)
   - After fetching pricing data (line 1733)

### Expected Behavior (Now Working)

- ✅ Counter starts at 0 when collection loads
- ✅ Increments by 1 for each search operation
- ✅ Increments based on data actually fetched:
  - +1 when fetching basic data (getType)
  - +1 when fetching issue data (getTypeIssues)
  - +1 when fetching pricing data (getIssuePricing)
- ✅ Displays correctly in footer: "Session: X calls"
- ✅ Displays correctly in Data Settings modal: "X call(s) used"
- ✅ Updates in real-time as API calls are made

### Testing Verification

**Test Case 1: Single coin with all data types enabled**
1. Load collection → Counter shows 0
2. Select coin, automatic search runs → Counter shows 1
3. Select match, fetch basic + issue + pricing → Counter shows 4 (1 search + 3 data fetches)
4. Result: ✅ Counter tracks all API calls correctly

**Test Case 2: Multiple searches**
1. Load collection → Counter shows 0
2. Search for coin 1 → Counter shows 1
3. Search for coin 2 → Counter shows 2
4. Result: ✅ Counter accumulates across multiple operations

**Test Case 3: Session reset on collection load**
1. Load collection → Counter shows 0
2. Make several API calls → Counter shows N
3. Close and reopen same collection → Counter shows 0
4. Result: ✅ Counter resets properly

### Lesson Learned

11. **Infrastructure without integration is invisible**: Having all the pieces (backend counter methods, frontend display functions, IPC handlers) doesn't matter if they're never connected. Always trace the complete flow from trigger → backend → frontend → display to ensure functionality works end-to-end.

---

## SESSION: February 2, 2026 - Search Results Display Improvements (Task 1.2)

**Date:** February 2, 2026
**Focus:** Improved search results display with confidence sorting and better field display

### Changes Made

#### 1. Confidence Score Sorting

**File Modified:** `src/renderer/app.js` (renderMatches function, lines 1060-1130)

**Problem:** Search results were displayed in the order returned by the Numista API, with no regard for relevance to the user's coin.

**Solution:** Added pre-sort of search results by confidence score (high to low) before rendering. The existing `calculateConfidence()` function scores each result based on title similarity, year match, country match, and value match.

**Implementation:**
- Map each match with its original index and pre-calculated confidence score
- Sort by confidence descending
- Render in sorted order
- Use `originalIndex` for click handlers and data attributes so `handleMatchSelection()` still correctly references `AppState.currentMatches`

**Result:** Best matches now appear at the top of the results list, making it faster for users to find the correct coin.

#### 2. Replaced "Value" Field with "Category"

**File Modified:** `src/renderer/app.js` (renderMatches function)

**Problem:** The "Value" field (denomination) shown in search result cards was often not useful for distinguishing between results. The Numista search API returns minimal data per result - the `value` field was frequently N/A.

**Solution:** Replaced "Value" with "Category" which shows the object type (Coin, Banknote, Exonumia). This field IS available in search results as `object_type.name` with fallback to `category`.

**Design Decision:** The work plan suggested showing Material/Composition and Catalog Numbers, but these fields are NOT available in Numista search results. They require fetching full type details per result (20 extra API calls per search), which would be too expensive. The Category field provides useful filtering information that IS available in the search response.

### Files Modified

1. `src/renderer/app.js` - renderMatches() function: confidence sorting + Value->Category replacement

### Notes

- No emoji content was modified in this change
- The confidence badge was already rendering but results were unsorted - now they're sorted by that score
- Category field uses `match.object_type?.name` with fallback to `match.category` for compatibility

---

## SESSION: February 2, 2026 - Select Issue Screen Enhancements (Task 1.3)

**Date:** February 2, 2026
**Focus:** Three improvements to the Issue Picker modal: user coin images, Numista link, mint registration fix

### Changes Made

#### 1. User's Coin Images in Issue Picker (Task 1.3A)

**Problem:** When the issue picker modal appeared, users had no visual reference of their own coin to help them choose the correct issue.

**Solution:** Added user's coin images (obverse + reverse) to the "Your coin" section of the issue picker modal.

**Files Modified:**
- `src/renderer/index.html` - Restructured `.user-coin-info` to include image container and detail columns side-by-side
- `src/renderer/app.js` - Added `getCoinImages()` call in `showIssuePicker()` to fetch and display user's coin images
- `src/renderer/styles/main.css` - Added styles for `.user-coin-info-content`, `.user-coin-images`, `.issue-picker-coin-img` (80x80px), `.no-images-text`

**Implementation:**
- Uses existing `getCoinImages` IPC call (same as other image display locations)
- Shows obverse and reverse side-by-side at 80x80px
- Graceful fallback to "No images available" text if images don't exist
- Error handling for failed image loads

#### 2. "View on Numista" Link (Task 1.3B)

**Problem:** Users had no way to view the coin type on the Numista website from the issue picker, making it harder to verify their selection.

**Solution:** Added a "View on Numista" link that opens the coin type page in the user's default browser.

**Files Modified:**
- `src/main/index.js` - Added `open-external` IPC handler with URL protocol validation (https/http only)
- `src/main/preload.js` - Exposed `openExternal()` API method
- `src/renderer/app.js` - Dynamically creates Numista link in issue picker header
- `src/renderer/styles/main.css` - Styled `.numista-link` as a button-style link with hover effect

**Implementation:**
- URL format: `https://en.numista.com/catalogue/pieces{typeId}.html`
- Opens in default browser via `electron.shell.openExternal()`
- Security: Only allows https:// and http:// URLs
- `showIssuePicker()` now accepts `typeId` as third parameter
- All three call sites updated to pass `typeId`

#### 3. Mint Registration Fix (Task 1.3C)

**Problem:** In `handleMatchSelection()`, after user selected an issue from the picker, `AppState.issueMatchResult` was not updated from `USER_PICK` to `USER_SELECTED`. This was inconsistent with the `handleFetchIssueData()` flow which properly set `{ type: 'USER_SELECTED', issue: pickerResult.issue }`.

**Root Cause:** The `handleMatchSelection` function set `AppState.issueData = pickerResult.issue` (correct) but did not update `AppState.issueMatchResult` to reflect the user's selection. While this didn't prevent the merge from working (merge uses `issueData` directly), it left the state inconsistent.

**Fix:** Added `AppState.issueMatchResult = { type: 'USER_SELECTED', issue: pickerResult.issue };` after user selects issue in `handleMatchSelection()`, matching the pattern already used in `handleFetchIssueData()`.

**Note:** The mint_letter field mapping itself was already working correctly. The `field-mapper.js` extracts `issueData.mint_letter` when `onField === 'mintmark'`, and the merge-data handler properly passes `issueData` through. The fix ensures state consistency across all code paths.

### Files Modified Summary

1. `src/renderer/index.html` - Issue picker modal HTML restructured with image container
2. `src/renderer/app.js` - `showIssuePicker()` enhanced with images, Numista link, typeId param; issueMatchResult fix in `handleMatchSelection()`
3. `src/renderer/styles/main.css` - New styles for coin images, Numista link in issue picker
4. `src/main/index.js` - Added `shell` import, `open-external` IPC handler
5. `src/main/preload.js` - Added `openExternal()` API method

### Emoji Integrity

- Verified emojis in index.html remain intact after editing (gear, folder, bulb, clipboard all present)
- Edits were confined to non-emoji sections of the files

### Bugfixes Applied During Testing (Task 1.3 Follow-up)

#### Fix: Issue Picker Images Not Loading

**Problem:** Issue picker showed "No images available" even though the user's coin had images displayed elsewhere (match screen header).

**Root Cause:** The `getCoinImages` IPC handler returns `{ success: true, images: { obverse: ..., reverse: ... } }`, but the issue picker code was accessing `images.obverse` directly instead of `result.images.obverse`.

**Fix:** Updated image loading code in `showIssuePicker()` to use `result.success && result.images` pattern, matching the working `renderCurrentCoinInfo()` implementation.

#### Fix: Auto-Match Not Triggering When Exact Match Exists

**Problem:** When a coin with mintmark "D" had two issues (no-mint and "D"), the issue picker was shown instead of auto-matching to the "D" issue.

**Root Cause:** In `numista-api.js` `matchIssue()`, the mint variation check filtered out null/empty values: `new Set(candidates.map(c => c.mint_letter).filter(m => m))`. When issues had `[null, "D"]`, the Set became `{"D"}` (size 1), so `hasMintVariation` was `false`. The mintmark filter was never applied, leaving 2 candidates → USER_PICK.

**Fix:** Changed to include null as a distinct value: `new Set(candidates.map(c => c.mint_letter || null))`. Now `{null, "D"}` has size 2 → `hasMintVariation = true`. Also added case-insensitive comparison and handling for when user has NO mintmark (matches issues with blank/null mint_letter).

**File Modified:** `src/modules/numista-api.js` (matchIssue method, lines 213-242)

#### Fix: "View on Numista" Button Styling

**Problem:** The Numista link used a thin-bordered text style that didn't match the app's button design.

**Fix:** Updated `.numista-link` CSS to use `var(--secondary-color)` background with white text, matching the `.btn-secondary` style used throughout the app.

### Lesson Learned

12. **Always match the return value format of existing IPC calls**: When reusing an IPC call like `getCoinImages`, check how existing code handles the return value before writing new consumers. The IPC response wraps data in `{ success, images }` - accessing `result.obverse` directly silently returns undefined.

13. **Null/empty values ARE data in set comparisons**: When checking if a field "varies" across a set of records, null/empty must count as a distinct value. Filtering them out before building a Set can hide important variations (e.g., "no mint" vs "D mint").

---

## SESSION: February 2, 2026 - Category-Based Search Parameter (Task 1.5)

**Date:** February 2, 2026
**Focus:** Added category filtering to Numista searches (coins, banknotes, exonumia)

### Changes Made

#### Category Filtering for Search Results

**Problem:** Numista searches returned all types (coins, banknotes, exonumia) with no way to narrow results by category, making it harder to find the correct match.

**Solution:** Added category filtering in two places: Data Settings (global default) and Manual Search (per-search override).

**Dropdown Options:**
- **All** - No filter, search everything
- **Default** - Read coin's OpenNumismat `category` field, map to Numista value. If blank/unmapped, search all
- **Coins** - Filter to `category=coin`
- **Banknotes** - Filter to `category=banknote`
- **Exonumia** - Filter to `category=exonumia` (tokens, medals)

**API Parameter:** Uses Numista's `category` string parameter (deprecated but functional). Values: "coin", "banknote", "exonumia".

**Category Mapping (OpenNumismat to Numista):**
- coin/coins -> coin
- banknote/banknotes -> banknote
- token/tokens/medal/medals/exonumia -> exonumia
- Unmapped values (Stamp, Postcard, etc.) -> null (no filter)

### Files Modified

1. **`src/modules/settings-manager.js`** - Added `searchCategory: 'all'` to fetchSettings defaults; updated `setFetchSettings()` to persist it
2. **`src/renderer/index.html`** - Added Search Category dropdown to Data Settings modal; added category dropdown to manual search form
3. **`src/renderer/app.js`** - Added `CATEGORY_MAP` constant, `resolveSearchCategory()` function; updated `buildSearchParams()` to add category; updated `populateSettings()`/`saveSettings()` in DataSettingsUI; wired manual search category dropdown with pre-population from settings
4. **`src/main/index.js`** - Updated `manual-search-numista` handler to accept and pass `category` parameter
5. **`src/renderer/styles/main.css`** - Added `.manual-search-category` styles

### Data Flow

**Automatic search:**
1. `buildSearchParams(coin)` reads `AppState.fetchSettings.searchCategory`
2. Calls `resolveSearchCategory(setting, coin)` to get Numista value
3. Adds `category` param to search request if not null
4. Backend passes all params through to `api.searchTypes(searchParams)`

**Manual search:**
1. Manual search panel opens, category dropdown pre-populated from settings
2. User can override per-search
3. Category resolved via `resolveSearchCategory()` and passed through IPC
4. Backend includes `category` in `searchParams` object

### Setting Persistence

- Stored in `{collection}_settings.json` under `fetchSettings.searchCategory`
- Merged with defaults on load (existing settings files get 'all' as default)
- Reset to Defaults sets it back to 'all'

---

## SESSION: February 2, 2026 - UI Polish Items (Task 1.6)

**Date:** February 2, 2026
**Focus:** UI polish quick wins - button rename, image lightbox, field comparison verification

### Changes Made

#### 1. Renamed "Try Different Search" to "Try Manual Search" (Task 1.6A)

**File Modified:** `src/renderer/index.html` (line 220)

**Change:** Simple text replacement from "Try Different Search" to "Try Manual Search" to better communicate the button's purpose.

#### 2. Image Lightbox Modal for Full-Size Viewing (Task 1.6B)

**Problem:** Images could only be enlarged via CSS hover zoom (2x-2.5x), which was limited and didn't show full resolution. Users had no way to view images at their full size.

**Solution:** Implemented a click-to-open lightbox modal that displays any coin image at maximum resolution in an overlay.

**Files Modified:**
- `src/renderer/index.html` - Added lightbox modal HTML (before `<script>` tag)
- `src/renderer/styles/main.css` - Added 70+ lines of lightbox styling (backdrop, content, close button, image sizing, caption)
- `src/renderer/app.js` - Added `openImageLightbox()`, `closeImageLightbox()`, `attachLightbox()` functions; wired close handlers (backdrop click, X button, Escape key)

**Implementation:**
- `attachLightbox(imgElement, caption)` - Helper that adds click handler and title to any image element
- Lightbox opens with dark backdrop (85% opacity), image scaled to fit viewport (90vw x 85vh max)
- Close via: backdrop click, X button, or Escape key
- Optional caption text displayed below image

**Images with lightbox enabled:**
1. **Match screen header** - User's obverse/reverse coin images (`.current-coin-image`)
2. **Search result cards** - Obverse/reverse thumbnails (`.match-thumbnail`)
3. **Field comparison screen** - User's and Numista's obverse/reverse images (`.comparison-image`)
4. **Issue picker modal** - User's coin images (`.issue-picker-coin-img`)

**Previous hover zoom behavior is preserved** - hover still shows CSS zoom effect, click opens lightbox.

#### 3. Field Comparison Image Display Verified (Task 1.6C)

**Status:** Already fully working. Confirmed `renderImageComparison()` (app.js:1410-1514) displays side-by-side user vs Numista images with obverse and reverse. Originally implemented in Task 2.8.

### Files Modified Summary

1. `src/renderer/index.html` - Button text rename + lightbox modal HTML
2. `src/renderer/app.js` - Lightbox functions + `attachLightbox()` wired to all image locations (4 locations)
3. `src/renderer/styles/main.css` - Lightbox modal styling

### Emoji Integrity

- Button text change made via `sed` to preserve emoji encoding
- Lightbox code added to non-emoji sections of files
- Verified `file -i` shows UTF-8 encoding intact

### Task 1.6 Status

- [x] 1.6A - Rename "Try Different Search" to "Try Manual Search"
- [x] 1.6B - Image lightbox at maximum size on click
- [x] 1.6C - Field comparison image display verified

---

## SESSION: February 2, 2026 - Image Hover Zoom Increase (Task 1.6B Follow-up)

**Date:** February 2, 2026
**Focus:** Increase hover zoom scale factors and upgrade lightbox to use larger Numista image URLs

### Problem
CSS hover zoom was too small to see coin detail:
- `.current-coin-image:hover` was `scale(2)` (120px -> 240px)
- `.match-thumbnail:hover` was `scale(2.5)` (80px -> 200px)
- `.comparison-image:hover` was `scale(1.05)` (150px -> ~158px)

Additionally, the lightbox was opening Numista thumbnail URLs (150x150) instead of larger versions.

### Changes Made

#### 1. Increased Hover Zoom Scale Factors
**File:** `src/renderer/styles/main.css`

| Image Class | Before | After | Hover Size |
|---|---|---|---|
| `.current-coin-image:hover` | `scale(2)` | `scale(3.5)` | 120px -> 420px |
| `.match-thumbnail:hover` | `scale(2.5)` | `scale(4)` | 80px -> 320px |
| `.comparison-image:hover` | `scale(1.05)` | `scale(3)` | 150px -> 450px |

Also added `z-index: 1000`, enhanced box-shadow, and border-color to `.comparison-image:hover` (previously only had minimal styling).

#### 2. Lightbox URL Upgrade for Numista Images
**File:** `src/renderer/app.js` - `attachLightbox()` function

Added URL upgrade logic: when a Numista thumbnail URL contains `150x150`, it's replaced with `400x400` before opening in the lightbox. This matches the existing pattern used in `image-handler.js:177` and `app.js:1530`.

### Files Modified
1. `src/renderer/styles/main.css` - Three hover zoom scale increases
2. `src/renderer/app.js` - `attachLightbox()` URL upgrade logic

**Task 1.6 - UI Polish Items: 100% COMPLETE**

---

## SESSION: February 2, 2026 - Database Safety Check (Task 1.7)

**Date:** February 2, 2026
**Focus:** Prevent database corruption by detecting if collection file is open in OpenNumismat before loading

### Problem
The app had zero protection against opening a database that was already open in OpenNumismat or another SQLite application. Since the app uses sql.js (in-memory SQLite) and writes back via `fs.writeFileSync()`, concurrent access could corrupt the database.

### Changes Made

#### 1. Database Lock Detection Function
**File:** `src/main/index.js` - `checkDatabaseInUse(filePath)`

New function with three detection methods:
- **WAL/SHM file detection:** Checks for `{filePath}-wal` and `{filePath}-shm` files (created by native SQLite in WAL mode)
- **Journal file detection:** Checks for `{filePath}-journal` (created by native SQLite in rollback journal mode)
- **Windows exclusive file lock test (PowerShell):** Uses `[System.IO.File]::Open()` with `FileShare.None` via PowerShell to request exclusive access. This is the primary detection method on Windows — Node.js `fs.openSync('r+')` uses shared access and cannot detect SQLite's locks. The PowerShell approach catches any process holding the file open.

Added `const { execSync } = require('child_process')` import for the PowerShell call.

Returns `{ inUse: boolean, reason: string }`.

#### 2. Blocking Warning Dialog
**File:** `src/main/index.js` - `load-collection` IPC handler

Added check before database open with a blocking dialog loop:
- If database is in use, shows warning dialog with "Check Again" and "Cancel" buttons
- No "Open Anyway" option - user must close OpenNumismat first
- "Check Again" re-runs the detection; loops until clear or cancelled
- "Cancel" returns `{ success: false, error: 'cancelled' }` to renderer

#### 3. Graceful Cancel Handling
**File:** `src/renderer/app.js` - loadCollectionBtn click handler

When `result.error === 'cancelled'`, the renderer hides the progress bar and shows "Collection load cancelled" status without displaying an error modal.

### Files Modified
1. `src/main/index.js` - Added `checkDatabaseInUse()` function + blocking dialog in `load-collection` handler
2. `src/renderer/app.js` - Graceful cancel handling for database-in-use dialog

**Task 1.7 - Database Safety Check: COMPLETE**

---

## PHASE 1 COMPLETE - Summary

**Date:** February 2, 2026
**All Phase 1 (Tackle Now) items from NOTES-WORK-PLAN.md are complete:**

| Task | Description | Status |
|---|---|---|
| 1.1 | Session Call Counter Fix | COMPLETE |
| 1.2 | Search Results Display Improvements | COMPLETE |
| 1.3 | Select Issue Screen Enhancements | COMPLETE |
| 1.4 | Metadata Preservation Verification | VERIFIED (no issues) |
| 1.5 | Category-Based Search Parameter | COMPLETE |
| 1.6 | UI Polish Items (button rename, image lightbox, field comparison images) | COMPLETE |
| 1.7 | Database Safety Check (lock detection + blocking dialog) | COMPLETE |

**Next:** Phase 2 items (Advanced Matching, Backup Policy, Packaging, Legal, etc.) per NOTES-WORK-PLAN.md.

---

## SESSION: February 2, 2026 - Advanced Matching & Normalization (Task 2.1)

### What Was Done
Implemented three matching improvements:

**A. Mintmark Normalization**
- Created new module `src/modules/mintmark-normalizer.js`
- Strips formatting characters (parentheses, brackets, periods) before comparison
- Maps common US mint city names to letters (Denver->D, San Francisco->S, etc.)
- Maps common world mint names to marks (Paris->A, Hamburg->J, etc.)
- Integrated `mintmarksMatch()` into `matchIssue()` in numista-api.js, replacing direct string comparison

**B. Fuzzy Matching (Dice Coefficient)**
- Implemented Dice's coefficient algorithm directly in numista-api.js (no external dependency)
- Updated `calculateConfidence()` in app.js to use graduated title similarity scoring (0-40 points) instead of binary exact/includes (0 or 20 or 40 points)
- Updated `calculateMatchConfidence()` in numista-api.js for consistency
- Exposed `diceCoefficient` to renderer via `window.stringSimilarity.diceCoefficient` through preload.js

**C. Issuer Code Caching**
- Added `getIssuers()` method to NumistaAPI that fetches and caches the full issuer list from `/issuers` endpoint
- Added `resolveIssuerCode(countryName)` method with three-tier resolution: alias map -> exact name match -> fuzzy match (Dice >= 0.6 threshold)
- Added persistent `issuerApi` instance in index.js for cross-request caching
- Added `resolve-issuer` IPC handler and preload bridge
- Updated `buildSearchParams()` in app.js (now async) to resolve and include `issuer` parameter in Numista API searches
- Common aliases handled: USA/US/U.S.A. -> united-states, UK/Great Britain -> united-kingdom, USSR/Soviet Union -> ussr, etc.

### Technical Notes
- `string-similarity` NPM package was evaluated but is deprecated; implemented Dice coefficient inline (~15 lines)
- Each IPC handler in index.js creates a new NumistaAPI instance (existing pattern), so a dedicated persistent `issuerApi` instance was created for issuer resolution to preserve the cache
- The `/issuers` endpoint returns ~4000+ entries; fetched once per session and cached permanently
- Country->code mappings are cached in a separate Map, so repeat lookups are instant

### Files Modified
1. `src/modules/mintmark-normalizer.js` - **NEW** - Mintmark normalization + city name maps
2. `src/modules/numista-api.js` - Integrated normalizer, added issuer resolution, added Dice coefficient, updated confidence scoring
3. `src/renderer/app.js` - Fuzzy confidence scoring, async buildSearchParams with issuer resolution
4. `src/main/index.js` - Added `resolve-issuer` IPC handler with persistent API instance
5. `src/main/preload.js` - Exposed `resolveIssuer` IPC + `stringSimilarity.diceCoefficient` utility

**Task 2.1 - Advanced Matching & Normalization: COMPLETE**

---

## SESSION: February 2, 2026 - Task 2.2 Backup Policy & Data Safety

**Date:** February 2, 2026
**Focus:** Backup retention limits, autoBackup enforcement, and cross-reference ID protection

### Implementation Summary

**Sub-task A: Backup Policy**
- Added configurable `maxBackups` setting (default: 5, 0 = unlimited)
- Added `pruneOldBackups()` method that deletes oldest backups beyond the limit
- Fixed bug: `autoBackup` setting was defined but never checked — merge handler always created backups regardless of the setting
- Merge handler now respects autoBackup toggle and prunes after each backup
- Settings synced between Phase 1 (app-wide) and Phase 2 (collection-specific) settings

**Sub-task B: Cross-Reference ID Safety**
- Added `PROTECTED_FIELDS` constant blocking: `id`, `obverseimg`, `reverseimg`, `edgeimg`, `image`
- `updateCoin()` now filters out protected fields before building the SQL UPDATE query
- Logs a warning if a protected field update is attempted — safety net for future code changes

**UI Changes:**
- Integer input for maximum backups + "Unlimited" checkbox
- Warning text shown when auto-backup is disabled
- Controls disabled/enabled based on autoBackup state

### Files Modified
1. `src/modules/opennumismat-db.js` - PROTECTED_FIELDS, guard in updateCoin(), pruneOldBackups()
2. `src/modules/settings-manager.js` - maxBackups default + getMaxBackups()/setMaxBackups()
3. `src/main/index.js` - autoBackup check in merge handler, backup settings sync, default settings
4. `src/renderer/index.html` - maxBackups input, unlimited checkbox, warning text
5. `src/renderer/app.js` - Backup UI wiring, updateBackupControlsState(), success message update

**Task 2.2 - Backup Policy & Data Safety: COMPLETE**

