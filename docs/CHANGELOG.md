# Changelog

All notable changes to NumiSync Wizard for OpenNumismat.

## Fix History (Compressed)

| Date | Files | Summary |
|------|-------|---------|
| Feb 6 | app.js | **Premium Features Advertising Update** - Updated license prompt modal and EULA to list both premium features: Fast Pricing Mode and Auto-Propagate. License prompt now shows feature names with descriptions. EULA Section 3(b) now mentions both batch pricing updates and batch type data propagation. |
| Feb 6 | user-manual.html, TASK-3.12, PHASE3-WORK-PLAN.md | **Task 3.12 Documentation Complete** - Added Auto-Propagate section to user manual with full feature documentation (how it works, what data gets propagated, matching criteria, skipped coins, disabling the feature). Updated License Tiers table to include Auto-Propagate. Updated FAQ with premium feature list. Marked Task 3.12 as fully complete in task document and work plan. |
| Feb 6 | app.js | **Auto-Propagate Progress Bar** - Added inline progress bar to batch type propagation modal. Shows "X/Y (Z%)" format with visual progress bar during operation, matching Fast Pricing Mode UX. Displays current coin being processed. Modal transitions to results view when complete. |
| Feb 6 | app.js | **Match List Scroll Fix** - Fixed matching coins list not returning to top when selecting a new coin. Added scroll-to-top logic in showScreen() when transitioning to match screen, ensuring `.app-main` container resets to top position. |
| Feb 6 | index.js, app.js | **Auto-Propagate Field Selection Fix** - Fixed auto-propagate overwriting fields that weren't selected for the original merge. Previously, propagate-type-data hardcoded all type-level fields to `true`. Now passes `selectedFields` from the original merge through the propagation flow (`showBatchTypePropagationPrompt` → `applyBatchTypePropagation` → `propagateTypeData` IPC). Handler now only propagates fields the user explicitly checked. Added skip logic for coins when no applicable fields are selected. |
| Feb 6 | index.js, app.js | **Auto-Propagate Bug Fix** - Fixed auto-propagate prompt not appearing after enrichment. Issue 1: `get-coins` IPC handler now parses metadata from note field so coins have `metadata.basicData.numistaId` available for matching. Issue 2: Fixed wrong fallback defaults in `getCatalogSlotMapping()` - was using 'Krause'/'Numista'/null/null, now correctly uses 'KM'/'Schön'/'Y'/'Numista' to match default-field-mapping.js and Numista API catalog codes. |
| Feb 6 | app.js, numista-api.js | **Coin Match Scoring Improvements** - Fixed broken denomination matching (was comparing numeric 1 vs 0.01, now uses text comparison). Added progressive search fallback for zero-result queries (strips parenthetical terms like "(Nazi)", tries simplified queries). Rebalanced scoring weights: Title 30pts, Year 25pts (+bonus) or -15pts (penalty for out-of-range), Country 20pts, Denomination 25pts (match) or -20pts (mismatch), Category +10pts (standard circulation) or -10pts (patterns/proofs). Fixed "1 Cent" vs "1 Dime" false match (same numeric value but different units now penalized). Extracts denomination from title as fallback when value.text missing from API response. |
| Feb 6 | settings-manager.js, app.js, index.html, TASK-3.12 | **Task 3.12.11 Auto-Propagate Toggle** - Added checkbox in Data Settings to enable/disable the Auto-Propagate feature (default: enabled). When disabled, the post-merge detection prompt is skipped. Updated PREMIUM_FEATURES name to "Auto-Propagate" for consistent user-facing terminology. Setting persists via fetchSettings.enableAutoPropagate. |
| Feb 6 | index.js, numista-api.js, app.js, index.html, main.css | **Task 3.12 Completion** - Silent Type Data Reuse (3.12.4): Added typeDataCache Map in main process, caches type data by typeId, cleared on collection load, skips API calls for previously fetched types. Empty Mintmark Setting UI (3.12.7): Added radio buttons in Data Settings for empty mintmark interpretation (no_mint_mark/unknown). Issue/Pricing Matching (3.12.8): matchIssue() now accepts options with emptyMintmarkInterpretation, detects privy marks and signatures in issues, returns privyMarksDetected/signaturesDetected flags. Skipped Coins Handling (3.12.9): Enhanced applyBatchTypePropagation() with detailed tracking of full-data vs type-only updates, skip reasons stored in batchProcessed metadata, improved results modal showing skip list with reasons. |
| Feb 6 | app.js, main.css, index.js, preload.js, settings-manager.js, PHASE3-WORK-PLAN.md | **Task 3.12 Batch Type Data Propagation (PREMIUM)** - After enriching a coin, detects other coins in the collection sharing the same Numista type (via numistaId or catalog numbers). Shows matching coins grouped into True Duplicates (same type+year+mintmark - can receive ALL data) and Same Type/Different Issue (type data only). Detection is FREE; applying to all matching coins requires premium license. Implements strict catalog matching (ALL populated slots must match), normalizeCatalogNumber() for prefix stripping, categorizeMatchingCoins() for duplicate detection. Adds propagate-type-data IPC handler for batch database updates. Adds emptyMintmarkInterpretation setting (no_mint_mark/unknown). Premium modal with gold gradient styling. |
| Feb 5 | index.html, app.js, main.css | **Header Consolidation** - Merged collection controls into main app header. Collection title now displays centered in header when collection is open. Combined "App Settings" and "Data Settings" into a single gear icon dropdown button (saves header space). Fast Pricing Mode and Close Collection buttons moved to header actions area. Removed separate collection-header section from collection screen for cleaner layout. |
| Feb 5 | index.html, app.js, main.css, settings-manager.js | **Sticky Info Bar Toggle** - Stats and filters area redesigned as a unified card with dog-ear corner pin toggle. Click the thumbtack icon on the top-left corner to pin/unpin the info bar. When pinned, the card stays fixed at the top while scrolling through the coin list. Thumbtack rotates from slanted (unpinned) to vertical (pinned) with smooth animation. Preference persists per-collection via uiPreferences.stickyInfoBar setting. |
| Feb 5 | index.html, app.js, main.css, index.js, preload.js, settings-manager.js | **Grid View Mode** - Added toggleable grid view as alternative to list view for coin collection. Responsive CSS Grid layout (auto-fill with 180px min cards, adapts to window size). Toggle button with SVG icons in filters bar. View Mode submenu in Electron View menu (List/Grid radio options). Preference persists per-collection via uiPreferences.defaultView setting. Grid cards show larger thumbnails (60px), 2-line truncated title, status borders preserved. Full Fast Pricing Mode compatibility: checkboxes in top-left corner with backdrop, fp-updated/fp-failed/fp-ineligible status styling. |
| Feb 5 | index.js, app.js, preload.js | **Fast Pricing Menu Integration** - Added Fast Pricing Mode controls to application menu bar. View menu: Enter/Exit Fast Pricing Mode (premium-gated with license prompt for non-supporters). Edit menu: Select All Eligible for Pricing, Select Displayed for Pricing, Clear Pricing Selection, Start Pricing Update (N)... with dynamic count. Menu state syncs in real-time with toolbar selections. |
| Feb 5 | user-manual.html | **User Manual v1.1 Update** - Comprehensive documentation update covering all Phase 3 features: EULA acceptance flow, License Management section (Free vs Supporter tiers, device limits, activation/deactivation), Fast Pricing Mode premium feature, expanded Menu Bar & Keyboard Shortcuts section with all menu items and accelerators, App Settings vs Data Settings separation, Default Collection feature, Search Category filter, improved Issue Picker with images and sorting, Image Lightbox feature, maxBackups setting. Added new troubleshooting items for license issues. Added 7 new licensing FAQ entries. Updated TOC navigation for all new sections. |
| Feb 5 | app.js, index.html, main.css | **Fast Pricing Mode UI Improvements** - Renamed button from "Fast Pricing Update" to "Fast Pricing Mode" for clearer toggle behavior. Added inline progress bar in toolbar showing "2/50 (4%)" format. Coin completion now uses persistent row highlighting (green border+tint for success, red for failure) instead of checkmark icons - highlighting persists after batch completes until exiting mode. Fixed multi-page tracking so coins updated on other pages show highlighting when navigating to them. |
| Feb 5 | app.js | **UX Fix** - Collection list now maintains position when returning from match/comparison screens. Uses `scrollIntoView()` to center the clicked coin in the viewport on return, works reliably across all pagination pages. Applies to all return paths (back to list, apply changes, skip). |
| Feb 5 | index.html, numista-api.js, app.js, main.css | **Bug Fixes** - Fixed "Skip This Coin" button (corrupted HTML tag), fixed issue picker to show ALL year-matched issues sorted by match quality (best matches first), fixed mintmark matching logic so "no mintmark" correctly matches "no mintmark" issues, added "Other options" section header when mixed match qualities |
| Feb 5 | app.js, index.html, main.css, index.js, preload.js | **Task 3.9 Fast Pricing Update (PREMIUM)** - Batch pricing updates for matched coins via "Fast Pricing Mode". Enter mode via button (premium-gated), checkboxes appear next to eligible coins (must have numistaId AND issueId). Selection options: Select All Eligible, Select Displayed, Clear. Confirmation dialog with estimated time, single pre-batch backup, 1-second rate limiting. Real-time progress in footer status bar, coin row visual feedback (checkmark/X), UI locking during batch. Successful coins deselected for easy resume on cancel. Completion modal with results summary. |
| Feb 5 | app.js | **EULA v2.0 Update** - Added License Tiers section (Free vs Supporter, 5-device limit, non-transferable, covers current major version + all updates, discounted upgrades to future major versions, feature access terms), Data Collection & Privacy section (local-only data, no PII collected, device fingerprint disclosure), California Privacy Rights (CCPA/CPRA compliance - right to know/delete/opt-out/non-discrimination), No Obligation to Support section (no guaranteed updates/support/maintenance, may discontinue at any time), Refunds section, Changes to Agreement section, updated restrictions to cover license key sharing/circumvention |
| Feb 5 | index.html, app.js, main.css, index.js | **License UI Indicators** - Version badge in header ("FREE VERSION" uppercase gray gradient / "Supporter Edition" gold), Fast Pricing button shows locked/unlocked state with lock icon and grayed styling, "Purchase License Key" menu item in Help menu (hidden for supporters), UI refresh on deactivation, device limit corrected to 5, removed neverAskAgain option (nag only stops with active license) |
| Feb 5 | index.js | **Polar Sandbox + License Fixes** - Switched to Polar sandbox for testing, fixed license validation to check `result.licenseKey.status` instead of `result.status`, fixed device fingerprinting to use consistent machine ID (hostname+platform+MAC hash) instead of timestamp to prevent duplicate activations |
| Feb 4 | index.js, preload.js, index.html, app.js | **License Management** - App Settings section for license management (device label, activation date, activation ID), validate/deactivate buttons, periodic license validation every 7 days with offline grace period, activation limit error handling (5 devices) |
| Feb 4 | index.js, preload.js, app.js, package.json | **Task 3.8 Licensing System** - Polar SDK integration, license key validation, About dialog with supporter status, license prompt at enrichment thresholds (20, then every 20), premium feature gating infrastructure |
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
- 2.6 About Page & Licensing System - COMPLETE (Task 3.8)
- 2.7 Multi-Source Data Fetching - NOT STARTED
- 2.8 OpenNumismat Plugin Integration - NOT STARTED
