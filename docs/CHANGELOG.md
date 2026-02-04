# Changelog

All notable changes to NumiSync Wizard for OpenNumismat.

## Fix History (Compressed)

| Date | Files | Summary |
|------|-------|---------|
| Feb 3 | index.html, app.js, main.css | **UI Compaction** - Stats bar + summary on same row (~250px saved), pagination moved to footer, error/skip counts as hover tooltips |
| Feb 3 | index.html, app.js, main.css, user-manual.html | **Logo Integration** - Added logo_with_text.svg to header, welcome screen, About dialog, EULA, and User Manual; icon.png/icon.ico added to build folder for app icon |
| Feb 3 | Multiple | **Rebrand** - Renamed from "Numismat Enrichment Tool" to "NumiSync Wizard" with subtitle "for OpenNumismat" |
| Feb 3 | index.js | Help menu - User Manual opens in dedicated Electron window (F1), centered on same screen as main window |
| Feb 3 | index.js, preload.js, app.js | Task 3.0 Application Menu Bar - Settings menu now separates App Settings (API key, backup) from Data Settings (fetch options, field mappings) |
| Feb 3 | index.js, preload.js, app.js | Task 3.0 Application Menu Bar - cross-platform Electron menu, Recent Collections tracking, keyboard shortcuts, menu state management |
| Feb 3 | PHASE3-WORK-PLAN.md | Added Task 3.0 Application Menu Bar - cross-platform Electron menu with Recent Collections, state management |
| Feb 3 | main.css | Issue picker image zoom - hover to enlarge 4x (matching coin selection behavior), overflow handling |
| Feb 3 | index.js, preload.js, index.html, app.js | Default Collection feature - auto-load on startup, browse/set/clear in Settings |
| Feb 3 | index.html, app.js, main.css | Task 2.5 Legal & Compliance - EULA modal, first-launch acceptance, Numista attribution in Settings |
| Feb 3 | electron-builder.yml, package.json, LICENSE.txt, build/*, docs/BUILD-GUIDE.md | Task 2.4 Packaging - electron-builder config, NSIS installer, build scripts, build documentation |
| Feb 2 | app.js, main.css | Advanced Field Mapping UI - tab bar, source dropdowns, bulk enable/disable |
| Feb 2 | opennumismat-db.js, settings-manager.js, index.js, index.html, app.js | Backup policy - maxBackups setting, autoBackup enforcement, PROTECTED_FIELDS guard |
| Feb 2 | mintmark-normalizer.js (NEW), numista-api.js, app.js, preload.js | Advanced matching - mintmark normalization, Dice coefficient fuzzy matching, issuer code caching |
| Feb 2 | index.js, app.js | Database safety check - lock detection, blocking warning dialog |
| Feb 2 | index.html, app.js, main.css | Image lightbox - click to view full size, hover zoom increase |
| Feb 2 | app.js, settings-manager.js, index.js, index.html | Category-based search parameter (coins/banknotes/exonumia filter) |
| Feb 2 | index.html, app.js, main.css, index.js, preload.js | Issue picker enhancements - user coin images, Numista link, mint registration fix |
| Feb 2 | app.js | Search results - confidence sorting, replaced Value with Category field |
| Feb 2 | index.js, app.js | Session call counter fix - increment on API calls, display refresh |
| Feb 1 | app.js | Status bar API call estimate fix - update after collection load |
| Feb 1 | settings-manager.js, index.js, index.html, app.js | Task 2.9 Settings file management - API key migration, field mappings defaults, reset button |
| Feb 1 | index.html, main.css, app.js | Counter strip redesign - 3 data-type cards with progress bars |
| Feb 1 | index.js | Pricing data fix - removed dead `incrementApiCalls` call blocking return |
| Feb 1 | opennumismat-db.js, main.css | Image display fix - photos table vs images table, enlarged selected coin images |
| Jan 31 | index.js, progress-tracker.js, app.js | Skip functionality - database persistence, statistics counters, prohibited icon |
| Jan 31 | index.html, main.css, app.js, index.js, preload.js | Issue Picker UI - modal, styling, pricing fetch for selected issue |
| Jan 31 | settings-manager.js, numista-api.js, index.html, app.js | Data independence - all three data types optional, smart issue matching |
| Jan 31 | app.js, numista-api.js | Image handling fixes - preserve thumbnails, correct table reference |
| Jan 31 | numista-api.js | Issue data fix - API returns array directly, not wrapped in `.issues` |
| Jan 31 | app.js | Automatic search fix - removed series field, year in query string |
| Jan 31 | package.json | Added axios dependency |
| Jan 31 | index.html, app.js | Emoji encoding fix - Python binary replacement for corrupted UTF-8 |
| Jan 31 | app.js, index.html, main.css | Pagination - 100 coins per page, navigation controls |
| Jan 28 | index.js | progressTracker method fix - updateCoinInCache not updateCoinStatus |
| Jan 28 | index.js | Metadata write after merge - icons now show merged status |

---

## Feature Releases

### Phase 2 - Enhanced Features (January-February 2026)

**Completed Tasks:**
- Task 2.1: Metadata storage in note field (HTML comments)
- Task 2.2: Granular status tracking (basic/issue/pricing)
- Task 2.3: Data Settings UI + Advanced Field Mapping
- Task 2.4: Conditional API calls + Issue Picker
- Task 2.5: Freshness indicators
- Task 2.6: Filter & Sort
- Task 2.8: Images (display, download, comparison)
- Task 2.9: Settings file management

**Not Started:**
- Task 2.7: Fetch More Data

### Phase 1 - Core Functionality (January 2026)

- Numista API integration
- Basic coin search and matching
- Field comparison and selective merging
- Progress tracking
- OpenNumismat database integration
- Settings management
- Manual search capability
- Skip coin functionality

---

## Notes Work Plan Status

### Phase 1 (Tackle Now) - COMPLETE
- 1.1 Session Call Counter Fix
- 1.2 Search Results Display Improvements
- 1.3 Select Issue Screen Enhancements
- 1.4 Metadata Preservation Verification
- 1.5 Category-Based Search Parameter
- 1.6 UI Polish Items
- 1.7 Database Safety Check

### Phase 2 (Tackle Later) - PARTIAL
- 2.1 Advanced Matching & Normalization - COMPLETE
- 2.2 Backup Policy & Data Safety - COMPLETE
- 2.3 User-Configurable Field Mapping - COMPLETE
- 2.4 Packaging & Distribution - COMPLETE
- 2.5 Legal & Compliance - COMPLETE
- 2.6 About Page & Donation Link - NOT STARTED
- 2.7 Multi-Source Data Fetching - NOT STARTED
- 2.8 OpenNumismat Plugin Integration - NOT STARTED
