# Work Plan: Notes Review & Prioritization
**Project:** OpenNumismat Enrichment Tool
**Date:** February 2, 2026
**Status:** Planning - Organizing user notes into actionable work items

---

## Executive Summary

This plan organizes user-reported issues, UI improvements, and feature requests from various notes into a structured work plan. Items are categorized by priority (Now vs Later) and grouped by theme for efficient implementation.

---

## Phase 1: TACKLE NOW - High Priority Items

These items should be addressed in the near term as they either:
- Fix bugs affecting core functionality
- Improve critical user experience issues
- Address data integrity concerns

### 1.1 - Session Call Counter Fix 🔴 CRITICAL BUG ✅ COMPLETE
**Priority:** CRITICAL
**Issue:** Session call counter remains at 0, not tracking API calls properly

**Current Status:**
- Display infrastructure exists in UI (footer + modal)
- `updateSessionCallDisplay()` function implemented (app.js:2579-2591)
- Unknown: Backend counter logic status

**Investigation Needed:**
1. Verify if `progress-tracker.js` has session counting logic
2. Check if IPC handlers increment session counter on API calls
3. Verify if counter resets properly on collection load
4. Check if counter persists/loads from progress file

**Files to Investigate:**
- `src/modules/progress-tracker.js` - Session counting logic
- `src/main/index.js` - IPC handlers for API calls
- `src/renderer/app.js` - Counter update calls

**Expected Behavior:**
- Counter starts at 0 when collection loads
- Increments by 2 when fetching basic data
- Increments by 1 when fetching issue data
- Increments by 1 when fetching pricing data
- Displays correctly in footer and Data Settings modal

---

### 1.2 - Search Results Display Improvements 🎨 UX ENHANCEMENT ✅ COMPLETE
**Priority:** HIGH
**Issue:** Search results show "value" field which is not helpful

**Current Display:** (from renderMatches function)
- Title
- Issuer name
- Year range
- Value/denomination
- Numista ID

**Proposed Changes:**
1. **Replace "Value" with more useful fields:**
   - Material/Composition (e.g., "Bronze", "Silver 0.900")
   - Catalog numbers (e.g., "KM# 45")
   - Mintmark (if available at type level)

2. **Add percentage match sorting:**
   - Already have `calculateConfidence()` function
   - Sort results by confidence score (high to low)
   - Consider making sort order user-selectable

**Files to Modify:**
- `src/renderer/app.js` - `renderMatches()` function (lines 1044-1119)
- May need to fetch additional fields from Numista API

**Design Considerations:**
- Keep card layout clean (don't overcrowd)
- Use icons for quick visual scanning (🪙 material, 📖 catalog)
- Consider expanding catalog numbers on click/hover

---

### 1.3 - Select Issue Screen Enhancements 🎨 UX IMPROVEMENT ✅ COMPLETE
**Priority:** HIGH
**Issues:**
1. "Your coin" section missing images (user can't reference their coin while picking)
2. No link to view the coin on Numista website
3. Mint selection doesn't register properly when issue is selected

**Proposed Changes:**

**A. Add User's Coin Images to Issue Picker Modal**
- Location: `issuePickerModal` in index.html (lines 553-581)
- Add image display next to year/mintmark/type info
- Use existing `getCoinImages` IPC call
- Style similar to field comparison screen

**B. Add "View on Numista" Link**
- Add link button next to coin name in modal header
- Format: `https://en.numista.com/catalogue/pieces{typeId}.html`
- Opens in default browser (electron.shell.openExternal)

**C. Fix Mint Registration**
- When user selects issue from picker, ensure mint_letter is properly stored
- Verify metadata update includes mint information
- Check field mapper handles mint_letter correctly

**Files to Modify:**
- `src/renderer/index.html` - Issue picker modal structure
- `src/renderer/app.js` - `showIssuePicker()` function (lines 1822-1959)
- `src/renderer/styles/main.css` - Image styling in issue picker
- `src/main/index.js` - Verify mint field storage in merge-data handler

---

### 1.4 - Metadata Preservation Verification ✅ DATA INTEGRITY ✅ VERIFIED (No issues found)
**Priority:** HIGH
**Question:** "In storing metadata in OpenNumismat notes field, we are appending that data correct? If user has user notes, we are not wiping those out?"

**Investigation Needed:**
1. Review `metadata-manager.js` implementation
2. Verify `writeEnrichmentMetadata()` preserves user notes
3. Test scenarios:
   - Coin with no notes → add metadata
   - Coin with user notes → add metadata (preserve notes)
   - Coin with user notes + metadata → update metadata (preserve notes)

**Expected Behavior:**
- Metadata stored as HTML comment: `<!-- ENRICHMENT_DATA_V2: {...} -->`
- User notes appear outside the comment block
- Read/write operations preserve user notes

**Files to Review:**
- `src/modules/metadata-manager.js`
- Test with actual database to verify behavior

**If Issue Found:**
- Document the bug
- Fix read/write logic
- Add safety checks to prevent data loss

---

### 1.5 - Category-Based Search Parameter 🔍 FEATURE ENHANCEMENT ✅ COMPLETE
**Priority:** MEDIUM
**Issue:** "Need to send coins, banknotes, tokens, medals, paper exonumia to Numista to narrow down search... pull from category, but we should allow user to select if category is blank... maybe in data settings there is a default check"

**Current Behavior:**
- Search uses title, year, country
- No category filtering

**Proposed Implementation:**

**A. Add Category to Search Parameters**
- OpenNumismat has `type` field (coin, banknote, token, etc.)
- Map to Numista search category parameter
- Include in automatic search

**Mapping:**
```javascript
const categoryMap = {
  'coin': 'coins',
  'banknote': 'banknotes',
  'token': 'exonumia',
  'medal': 'exonumia',
  // Add more mappings
};
```

**B. Add Category Default in Data Settings**
- New setting: "Default category for items with no type"
- Dropdown: Coins, Banknotes, Exonumia, All
- Stored in settings file

**C. UI Enhancement**
- Show category in search results for clarity
- Allow user to override category in manual search

**Files to Modify:**
- `src/renderer/app.js` - `buildSearchParams()` function
- `src/modules/settings-manager.js` - Add defaultCategory setting
- `src/renderer/index.html` - Add category setting to Data Settings modal

---

### 1.6 - UI Polish Items 🎨 QUICK WINS ✅ COMPLETE
**Priority:** LOW
**Quick fixes that improve user experience:**

**A. Rename "Try Different Search" → "Try Manual Search"**
- Location: Match screen buttons
- File: `src/renderer/index.html` and `app.js`
- Simple text change

**B. Image Flyover at Maximum Size**
- Current: Hover zoom (3x user images, 2.5x search results)
- Proposed: Show at full resolution in lightbox/modal
- Implementation: Click image → show full size in modal overlay

**C. Ensure Image Display in Field Comparison**
- Verify user's coin images appear in comparison screen
- Already implemented per MASTER-PROJECT-DOCUMENT (lines 1357-1408)

**Files to Modify:**
- `src/renderer/index.html` - Button text
- `src/renderer/app.js` - Image modal functionality
- `src/renderer/styles/main.css` - Modal styling

---

### 1.7 - Database Safety Check 🔒 CRITICAL SAFETY ✅ COMPLETE
**Priority:** HIGH
**Issue:** "Should check if OpenNumismat is open prior to opening database files and prompt user to close it if it is indeed open to avoid database corruption"

**Implementation:**

**A. Lock File Detection**
- Check for `.db-shm` and `.db-wal` files (SQLite Write-Ahead Log)
- These indicate database is in use
- Warn user before opening

**B. Database Lock Test**
- Try to acquire exclusive lock
- If fails, database is open elsewhere
- Show error dialog... do not allow option to proceed until it is closed. 

**C. User Warning Dialog**
```
⚠️ Database In Use

The collection file appears to be open in OpenNumismat or another application.

Opening the database while it's in use can cause corruption.

Please close OpenNumismat and try again.

[Check Again]  [Cancel]
```

**Files to Modify:**
- `src/main/index.js` - Add lock detection to `load-collection` handler
- `src/renderer/app.js` - Add warning dialog

---

## Phase 2: TACKLE LATER - Future Enhancements

These items are valuable but not urgent. They can be addressed after Phase 1 items or as part of future phases.

### 2.1 - Advanced Matching & Normalization 🤖 ALGORITHM IMPROVEMENT ✅ COMPLETE
**Category:** Technical Improvement
**When:** After core bugs fixed, before Phase 3

**Items:**

**A. Mintmark Normalization**
- Issue: Mintmark variations cause match failures (e.g., "D" vs "d" vs "(D)")
- Solution: Create normalization map for common mintmarks
- Location: New module `src/modules/mintmark-normalizer.js`

**B. Fuzzy Matching Enhancements**
- Question: "Do we use a Levenshtein Distance algorithm?"
- Research: Evaluate fuzzysort or natural NPM packages
- Current: Basic string similarity in `calculateConfidence()`
- Improvement: Use established fuzzy matching library

**C. Issuer ID Caching**
- Question: "Do we cache issuer_id to speed up searches from the same country?"
- Implementation: Cache issuer lookups in memory or progress file
- Benefit: Reduce API calls for same-country searches

**Files to Create/Modify:**
- `src/modules/mintmark-normalizer.js` (NEW)
- `src/modules/fuzzy-matcher.js` (NEW or enhance existing)
- `src/modules/numista-api.js` - Add caching

---

### 2.2 - Backup Policy & Data Safety 💾 DATA MANAGEMENT ✅ COMPLETE
**Category:** Data Safety
**When:** Before releasing as installable app

**Items:**

**A. Backup Policy Definition**
- Backups created before each merge in `{dbfolder}/backups/` subdirectory
- Format: `{dbname}_backup_{ISO-timestamp}.db`
- Configurable retention limit (default: 5, 0 = unlimited)
- Settings UI: integer input + "Unlimited" checkbox
- Auto-backup toggle now properly checked before creating backups (was previously ignored)
- Warning shown when auto-backup is disabled

**B. Cross-Reference ID Safety**
- Added `PROTECTED_FIELDS` blocklist in `opennumismat-db.js` (id, obverseimg, reverseimg, edgeimg, image)
- `updateCoin()` filters out protected fields before building UPDATE query
- Logs warning if a protected field update is attempted
- Field mapper already only maps text fields — this is an additional safety net

**Files Modified:**
- `src/modules/opennumismat-db.js` - PROTECTED_FIELDS guard, pruneOldBackups()
- `src/modules/settings-manager.js` - maxBackups setting + accessors
- `src/main/index.js` - autoBackup check in merge handler, backup settings sync
- `src/renderer/index.html` - maxBackups input, unlimited checkbox, warning text
- `src/renderer/app.js` - Backup UI wiring, state management

---

### 2.3 - User-Configurable Field Mapping ⚙️ ADVANCED FEATURE  ✅ COMPLETE
**Category:** Settings Enhancement
**When:** Phase 2.5 or Phase 3

**Issue:** "Expand settings to allow the user to develop user-specific field mapping as opposed to default... need to have validation and safety checks to avoid SQLite crashes"

**Proposed Implementation:**

**A. Field Mapping Editor UI**
- New modal: "Advanced Field Mappings"
- Table view of all field mappings
- Enable/disable toggle per field
- Priority selector (HIGH/MEDIUM/LOW)
- Custom transform function editor (advanced users only)

**B. Validation System**
- Prevent mapping to non-existent OpenNumismat fields
- Validate transform functions (syntax check)
- Warn about dangerous operations (changing IDs)
- Sandbox transform execution

**C. Import/Export Mappings**
- Save custom mappings to JSON
- Share mappings with other users
- Restore to defaults option

**Challenges:**
- Transform functions are code → security risk
- Need robust validation to prevent crashes
- Complex UI for advanced feature

**Decision:** Defer to Phase 3 or later. Current default mappings are comprehensive.

---

### 2.4 - Packaging & Distribution 📦 DEPLOYMENT
**Category:** Deployment
**When:** After Phase 2 complete, before public release

**Issue:** "What is best option for turning this into an installable Windows application?"

**Research Needed:**
1. **Electron Forge** - Official Electron packaging tool
2. **Electron Builder** - Popular alternative
3. **NSIS Installer** - Windows-specific installer

**Requirements:**
- Single-file installer (.exe)
- Start menu shortcut
- Desktop shortcut (optional)
- File association (.db files)
- Auto-updates (optional but nice)
- Code signing certificate (for trust)

**Recommended: Electron Builder**
- Industry standard
- NSIS support
- Auto-update support
- Good documentation

**Implementation Tasks:**
- Add electron-builder to package.json
- Create build configuration
- Set up icon files (.ico)
- Test installer on clean Windows VM
- Document installation process

**Files to Create:**
- `electron-builder.yml` - Build configuration
- `build/icon.ico` - Application icon
- `build/installer.nsi` - NSIS script (if custom)

---

### 2.5 - Legal & Compliance ⚖️ LEGAL PROTECTION
**Category:** Legal
**When:** Before public distribution

**Issue:** "Need EULA to ensure it protects me and also doesn't run foul of Numista EULA"

**Action Items:**

**A. Create EULA (End User License Agreement)**
- Limit liability for data loss
- Disclaim warranties
- State intended use (personal collections only)
- Require compliance with Numista Terms of Service
- Reference Numista attribution requirements

**B. Review Numista Terms of Service**
- Check API usage restrictions
- Verify compliance with attribution requirements
- Document any limitations (e.g., no commercial use)

**C. Add Attribution**
- Credit Numista in About screen
- Link to Numista website
- Display Numista logo (if permitted)

**D. EULA Display**
- Show on first launch
- Require acceptance to continue
- Store acceptance in settings
- Add "View EULA" to Help menu

**Legal Disclaimer:** *Consult with a lawyer for proper EULA language. This is a technical implementation plan, not legal advice.*

**Files to Create:**
- `EULA.txt` or `EULA.md`
- `src/renderer/eula-dialog.html`

---

### 2.6 - About Page and Donation Link 🌐 LONG-TERM VISION
**Category:** Major Feature
**When:** Phase 4 or 5

**Issue:** "This would be a good location for the EULA as well as general information on version, link to github, and for user to donate"

**Details**
- Need a page that would contain basic information such as legal, version, link to github, and notice of updates
- Some way to check with github on version change and notice to user to go to github to download update
- Information on author and way to donate to the project
- Polite notification system to bug new users to donate, perhaps after set number of updated coins? Message needs to guilt them into understanding value they are receiving for free
- Polite notification should include information like amount of time saved, etc. Do we make them "supporters for life?"
- Link to donation site such as Ko-fi or Buy Me a Coffee to donate to the project
- Future expansions like the batch processing for pricing updates is freemium and would require the donation



### 2.7 - Multi-Source Data Fetching 🌐 LONG-TERM VISION
**Category:** Major Feature
**When:** Phase 4 or 5

**Issue:** "Long-term item: What would it take to be able to change the system to pull from more than just Numista, but also from..."

**Potential Additional Sources:**
1. **PCGS** (Professional Coin Grading Service) - Pricing data
2. **NGC** (Numismatic Guaranty Corporation) - Pricing data
3. **Colnect** - Alternative coin database
4. **UCOIN** - Community-driven database
5. **CoinArchives** - Auction results

**Architecture Changes Needed:**

**A. Abstraction Layer**
- Create `DataSourceInterface` abstract class
- Implement per source: `NumistaDataSource`, `PCGSDataSource`, etc.
- Unified field mapping system
- Source priority/fallback logic

**B. Source Configuration**
- Settings: Enable/disable sources
- API keys per source
- Source priority order

**C. Conflict Resolution**
- Multiple sources return different data
- User selects which to trust
- Show data provenance (which source)

**Complexity:**
- Each source has different API structure
- Rate limits vary
- Authentication methods differ
- Field mappings won't align perfectly

**Recommendation:** Major undertaking. Defer until Numista integration is rock-solid and user base requests it.

---

### 2.8 - OpenNumismat Plugin Integration 🔌 EXTERNAL LAUNCH
**Category:** Integration Feature
**When:** After app is stable and packaged

**Issue:** "Add future support for OpenNumismat external plugin option where OpenNumismat can launch this app and send current database as an argument"

**OpenNumismat External Tools:**
- OpenNumismat supports launching external tools
- Can pass database path as command-line argument
- Tool can open database in read/write mode

**Implementation:**

**A. Command-Line Argument Handling**
- Electron supports command-line args: `process.argv`
- Parse `--database="path/to/file.db"` argument
- Auto-load database on startup if arg present

**B. OpenNumismat Configuration**
- Create XML configuration snippet for users
- Document how to add tool to OpenNumismat
- Include icon and description

**C. Return Code / Exit Behavior**
- Close app when done → return to OpenNumismat
- Status codes for success/error
- Log file for debugging

**Example OpenNumismat Tool Config:**
```xml
<tool>
  <name>Numismat Enrichment Tool</name>
  <command>C:\Program Files\NumismatEnrichment\NumismatEnrichment.exe</command>
  <arguments>--database="%file%"</arguments>
  <icon>enrichment.ico</icon>
</tool>
```

**Files to Modify:**
- `src/main/index.js` - Parse command-line args
- `docs/OpenNumismat-Integration.md` - User instructions

---

## Summary & Recommendations

### Tackle Now (Phase 1) - Priority Order

1. **Session Call Counter Fix** - Critical bug, investigate and fix
2. **Database Safety Check** - Prevent corruption, high priority
3. **Metadata Preservation Verification** - Ensure no data loss
4. **Select Issue Screen Enhancements** - High-impact UX improvements
5. **Search Results Display Improvements** - Better search experience
6. **Category-Based Search** - Narrow results, reduce noise
7. **UI Polish Items** - Quick wins for better UX

**Estimated Timeline:** 1-2 weeks

### Tackle Later (Phase 2+) - Deferred Items

1. **Advanced Matching & Normalization** - After core bugs fixed
2. **Backup Policy & Data Safety** - Before public release
3. **Packaging & Distribution** - After Phase 2 complete
4. **Legal & Compliance** - Before public distribution
5. **User-Configurable Field Mapping** - Phase 3 or later
6. **Multi-Source Data Fetching** - Phase 4 or 5 (major undertaking)
7. **OpenNumismat Plugin Integration** - After app is stable

---

## Next Steps

1. **Review & Approve Plan** - User confirms prioritization
2. **Session Counter Investigation** - Deep dive into counter logic
3. **Begin Phase 1 Implementation** - Work through items in priority order
4. **Document Findings** - Update MASTER-PROJECT-DOCUMENT.md as work progresses

---

## Critical Files Reference

**For Phase 1 Work:**
- `src/renderer/app.js` - UI logic, counter display, search results
- `src/main/index.js` - IPC handlers, database loading
- `src/modules/progress-tracker.js` - Session counting (suspected)
- `src/modules/metadata-manager.js` - Note field preservation
- `src/renderer/index.html` - UI structure, modals
- `src/renderer/styles/main.css` - Styling

**For Phase 2 Work:**
- `src/modules/opennumismat-db.js` - Backup logic
- `src/modules/field-mapper.js` - Field mapping validation
- `src/modules/settings-manager.js` - Settings expansion
- Package.json - Electron builder configuration
- EULA.md - Legal document

---

**Plan Status:** Ready for review and approval
**Plan Version:** 1.0
**Author:** Claude (with user notes)
