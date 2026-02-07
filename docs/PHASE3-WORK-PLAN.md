# Phase 3 Work Plan - Numista Collection Sync

**Project:** NumiSync Wizard for OpenNumismat
**Phase:** Phase 3 - Numista Collection Management
**Created:** February 1, 2026
**Last Updated:** February 4, 2026

---

## Quick Summary

Phase 3 adds one-way sync from OpenNumismat → Numista, enabling users to push coins to their Numista online collection with OAuth 2.0 authentication, comprehensive data mapping, and sync status tracking.

---

## Task Status Dashboard

| ID | Task | Status | Priority | Dependencies |
|----|------|--------|----------|--------------|
| **COMPLETED** |
| 3.0 | Application Menu Bar | ✅ Complete | HIGH | None |
| 3.8 | About Page & Licensing System | ✅ Complete | MEDIUM | None |
| **CORE IMPLEMENTATION** |
| 3.1 | OAuth 2.0 Integration | ⏳ Pending | CRITICAL | None |
| 3.2 | Data Mapper (Reverse Direction) | ⏳ Pending | HIGH | 3.1 |
| 3.3 | Collection Selection UI | ⏳ Pending | MEDIUM | 3.1 |
| 3.4 | Add Coin UI & Flow | ⏳ Pending | HIGH | 3.1, 3.2, 3.3 |
| 3.5 | Sync Status Display | ⏳ Pending | MEDIUM | 3.4 |
| **ENHANCEMENTS (Optional)** |
| 3.6 | Batch Add Feature | ⏳ Pending | LOW | 3.4 |
| 3.7 | Update Existing Coin | ⏳ Pending | LOW | 3.4 |
| 3.9 | Fast Pricing Update 💎 PREMIUM | ✅ Complete | MEDIUM | 3.8 |
| 3.12 | Batch Type Data Propagation (Auto-Propagate) 💎 PREMIUM | ✅ Complete | MEDIUM | 3.8 |
| **DEFERRED TO FUTURE PHASE** |
| 3.10 | Multi-Source Data Fetching | 🔮 Future | — | Phase 4+ |
| 3.11 | OpenNumismat Plugin Integration | 🔮 Future | — | After packaging |

**Legend:** ✅ Complete | 🔄 In Progress | ⏳ Pending | 🔮 Future/Deferred

**Critical Path:** 3.1 → 3.2 → 3.4 (OAuth → Data Mapper → Add Coin UI)

---

## Task Dependency Graph

```
3.0 Menu Bar ✅
      (independent - already complete)

3.1 OAuth 2.0 ⏳
  ├──→ 3.2 Data Mapper ⏳
  │      └──→ 3.4 Add Coin UI ⏳
  │             ├──→ 3.5 Sync Status ⏳
  │             ├──→ 3.6 Batch Add ⏳
  │             └──→ 3.7 Update Coin ⏳
  └──→ 3.3 Collection Selection ⏳
         └──→ 3.4 Add Coin UI ⏳

3.8 About Page & Licensing ✅
      (independent - complete)
  ├──→ 3.9 Fast Pricing Update 💎 PREMIUM ✅
  └──→ 3.12 Batch Type Data Propagation 💎 PREMIUM ✅
```

---

# COMPLETED TASKS

## 3.0 - Application Menu Bar ✅ COMPLETE

**Completed:** February 3, 2026

Implemented a fully customized Electron menu bar with cross-platform support (Windows + macOS), Recent Collections feature, and keyboard accelerators.

<details>
<summary>Click to expand implementation details</summary>

### Menu Structure Implemented

| Menu | Items |
|------|-------|
| **App** (macOS only) | About, Preferences, Hide, Quit |
| **File** | Load Collection, Recent Collections, Close Collection, Set/Clear Default, Exit (Win) |
| **Edit** | Select All Fields, Select None, Select Empty Only, Select Different Only |
| **View** | Filter by Status, Filter by Freshness, Sort By, Reset Filters, Refresh List |
| **Settings** (Win) | App Settings, Data Settings, Field Mappings, Export/Import/Reset Mappings, Reset All |
| **Window** (macOS only) | Minimize, Zoom, Bring All to Front |
| **Help** | User Manual (F1), About (Win), Numista Website, Get Numista API Key, View EULA |

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Load Collection | CmdOrCtrl+O |
| Close Collection | CmdOrCtrl+W |
| Select All Fields | CmdOrCtrl+A |
| Select None | CmdOrCtrl+Shift+A |
| App Settings | CmdOrCtrl+, |
| Refresh List | F5 / CmdOrCtrl+R |
| User Manual | F1 |

### Files Modified
- `src/main/index.js` - Menu creation, IPC handlers, state management
- `src/main/preload.js` - Expose menu event listeners
- `src/renderer/app.js` - Handle menu-triggered events
- `src/modules/settings-manager.js` - Add recentCollections to settings schema

### Verification (All Passed)
- [x] All menu items trigger correct actions
- [x] Keyboard shortcuts function on both platforms
- [x] Menu items enable/disable based on app state
- [x] Recent Collections populates and works
- [x] User Manual opens in Electron window on same screen

</details>

---

# PENDING TASKS - Core Implementation

## 3.1 - OAuth 2.0 Integration ⏳

**Priority:** CRITICAL - Required for all other features
**Dependencies:** None
**Blocks:** 3.2, 3.3, 3.4

### Objective
Implement OAuth 2.0 Client Credentials flow to authenticate users with the Numista API for write operations.

### Sub-Tasks

- [ ] **3.1.1** Create `src/modules/numista-oauth.js`
  - [ ] `requestAccessToken(apiKey)` - Get token from Numista
  - [ ] `ensureValidToken()` - Check/refresh token before API calls
  - [ ] `storeToken(token, expiry)` - Persist encrypted token
  - [ ] `getStoredToken()` - Retrieve and decrypt token
  - [ ] Handle token expiration automatically
  - [ ] Handle API errors (invalid key, network failure)

- [ ] **3.1.2** Implement secure token storage
  - [ ] Research encryption options (electron-store, safeStorage)
  - [ ] Encrypt token before saving
  - [ ] Decrypt token on load
  - [ ] Never log tokens or API keys

- [ ] **3.1.3** Add User ID detection
  - [ ] Try auto-detection via API `/me` endpoint
  - [ ] Fall back to user input if unavailable
  - [ ] Store in settings file

- [ ] **3.1.4** Update settings UI
  - [ ] Add "Numista User ID" field
  - [ ] Add "Test Connection" button
  - [ ] Show token status (valid/expired/missing)
  - [ ] Show last successful authentication timestamp

- [ ] **3.1.5** Add error handling
  - [ ] Invalid API key → clear error message
  - [ ] Network failure → retry logic
  - [ ] Token expired → auto-refresh
  - [ ] Quota exceeded → warn user

### Files to Create
- `src/modules/numista-oauth.js` (NEW)

### Files to Modify
- `src/modules/settings-manager.js` - Add userId, tokenData fields
- `src/renderer/index.html` - Add User ID field, Test Connection button
- `src/renderer/app.js` - Add OAuth UI handlers
- `src/main/index.js` - Add OAuth IPC handlers
- `src/main/preload.js` - Add OAuth API methods

### Verification Checklist
- [ ] Request token with valid API key → success
- [ ] Request token with invalid API key → clear error
- [ ] Token stored encrypted
- [ ] Token retrieval and decryption works
- [ ] Token expiration triggers auto-refresh
- [ ] Network failure handled gracefully

---

## 3.2 - Data Mapper (Reverse Direction) ⏳

**Priority:** HIGH
**Dependencies:** 3.1
**Blocks:** 3.4

### Objective
Map OpenNumismat coin data to Numista API format for uploading coins.

### Sub-Tasks

- [ ] **3.2.1** Create `src/modules/numista-uploader.js`
  - [ ] `mapCoinToNumista(coin, options)` - Main mapping function
  - [ ] Grade mapping logic (see Appendix B)
  - [ ] Price selection logic (see Appendix C)
  - [ ] Date formatting (YYYY-MM-DD)
  - [ ] Strip metadata from notes (preserve user notes only)
  - [ ] Handle missing/null fields gracefully

- [ ] **3.2.2** Implement validation
  - [ ] Require Numista Type ID (from metadata)
  - [ ] Warn if no grade can be mapped
  - [ ] Warn if no price available
  - [ ] Validate date format
  - [ ] Validate numeric fields (weight, size)

- [ ] **3.2.3** Create preview functionality
  - [ ] Show what data will be sent to Numista
  - [ ] Highlight fields that will be omitted
  - [ ] Show grade mapping result
  - [ ] Show selected price

- [ ] **3.2.4** Handle special cases
  - [ ] Multiple quantities → warn user
  - [ ] Missing Numista ID → error (can't add without it)
  - [ ] Issue ID present → include in request
  - [ ] Issue ID missing → omit (type-level add)

### Files to Create
- `src/modules/numista-uploader.js` (NEW)

### Verification Checklist
- [ ] Map coin with all fields populated
- [ ] Map coin with minimal data
- [ ] Grade mapping works for all variations
- [ ] Price selection based on grade works
- [ ] User notes preserved, metadata stripped
- [ ] Edge cases handled (nulls, empty strings)

---

## 3.3 - Collection Selection UI ⏳

**Priority:** MEDIUM
**Dependencies:** 3.1
**Blocks:** 3.4

### Objective
Allow users to select which Numista collection to add coins to.

### Sub-Tasks

- [ ] **3.3.1** Fetch user's collections
  - [ ] Call `GET /users/{user_id}/collections`
  - [ ] Parse and cache collection list
  - [ ] Handle empty collections list

- [ ] **3.3.2** Add collection selector UI
  - [ ] Dropdown in "Add to Numista" modal
  - [ ] Show collection names
  - [ ] Default to first collection or saved preference
  - [ ] "Refresh Collections" button

- [ ] **3.3.3** Store collection preference
  - [ ] Save last-used collection in settings
  - [ ] Auto-select on next add

- [ ] **3.3.4** Handle edge cases
  - [ ] User has no collections → error message with link to Numista
  - [ ] API failure → allow proceed with default collection

### Files to Modify
- `src/modules/numista-api.js` - Add `getUserCollections()` method
- `src/renderer/index.html` - Add collection dropdown
- `src/renderer/app.js` - Add collection selection logic
- `src/main/index.js` - Add get-collections IPC handler

### Verification Checklist
- [ ] Collections fetched and displayed
- [ ] Selection persists across sessions
- [ ] Empty collection list handled gracefully
- [ ] Default collection works

---

## 3.4 - Add Coin UI & Flow ⏳

**Priority:** HIGH
**Dependencies:** 3.1, 3.2, 3.3
**Blocks:** 3.5, 3.6, 3.7

### Objective
Implement the main user interface and flow for adding coins to Numista.

### Sub-Tasks

- [ ] **3.4.1** Add "Add to Numista" button
  - [ ] Show in coin detail view
  - [ ] Show in field comparison screen (after merge)
  - [ ] Disable if no Numista ID in metadata
  - [ ] Disable if not authenticated

- [ ] **3.4.2** Create "Add to Numista" modal
  - [ ] Coin preview (title, year, images)
  - [ ] Collection selector dropdown
  - [ ] Grade override dropdown
  - [ ] Price field (editable)
  - [ ] Currency dropdown
  - [ ] Quantity field
  - [ ] Storage location field
  - [ ] Acquisition date/place fields
  - [ ] "For Swap" checkbox
  - [ ] Private notes textarea
  - [ ] "Preview JSON" button
  - [ ] "Add" and "Cancel" buttons

- [ ] **3.4.3** Implement add flow
  - [ ] Validate authentication (token valid)
  - [ ] Map OpenNumismat data to Numista format
  - [ ] Show preview modal
  - [ ] User confirms → Call API
  - [ ] Update metadata with sync status
  - [ ] Show success message
  - [ ] Update UI (show sync icon)

- [ ] **3.4.4** Handle duplicate detection
  - [ ] Check metadata for existing sync
  - [ ] Warn user if already synced
  - [ ] Offer options: Skip / Add Anyway / Update

- [ ] **3.4.5** Handle errors
  - [ ] API errors → show clear message
  - [ ] Network errors → offer retry
  - [ ] Validation errors → highlight fields
  - [ ] Quota exceeded → inform user

### Files to Modify
- `src/renderer/index.html` - Add modal HTML
- `src/renderer/app.js` - Add modal logic and flow
- `src/renderer/styles/main.css` - Add modal styling
- `src/main/index.js` - Add add-coin-to-numista IPC handler
- `src/main/preload.js` - Add addCoinToNumista API method

### UI Flow
```
1. User clicks coin in list
2. Coin details display
3. User clicks "Add to Numista" button
4. Modal opens with prefilled data
5. User reviews/edits data
6. User clicks "Add to Numista"
7. Loading indicator appears
8. Success: "Coin added to Numista!"
9. Metadata updated, sync icon shows in coin list
```

### Verification Checklist
- [ ] Button shows only for eligible coins
- [ ] Modal displays all fields correctly
- [ ] Data prefilled from OpenNumismat
- [ ] Successful add updates metadata
- [ ] Duplicate warning works
- [ ] Error messages are clear and actionable

---

## 3.5 - Sync Status Display ⏳

**Priority:** MEDIUM
**Dependencies:** 3.4

### Objective
Show visual indicators of Numista sync status throughout the UI.

### Sub-Tasks

- [ ] **3.5.1** Add sync status icon to coin list
  - [ ] 📤 = Synced to Numista
  - [ ] ⭕ = Not synced
  - [ ] ⚠️ = Sync failed
  - [ ] Show timestamp on hover

- [ ] **3.5.2** Add sync status to coin details panel
  - [ ] Show last sync date
  - [ ] Show Numista collection name
  - [ ] Show collected item ID
  - [ ] "View on Numista" deep link

- [ ] **3.5.3** Add filter by sync status
  - [ ] Synced / Not Synced / Sync Failed
  - [ ] Show counts per status

- [ ] **3.5.4** Add sort by sync date
  - [ ] Most recently synced
  - [ ] Least recently synced
  - [ ] Never synced

### Files to Modify
- `src/renderer/app.js` - Add sync icon rendering
- `src/renderer/index.html` - Add filter option
- `src/renderer/styles/main.css` - Add icon styling

### Verification Checklist
- [ ] Icons display correctly for each status
- [ ] Hover shows sync details
- [ ] Filter by sync status works
- [ ] Sort by sync date works
- [ ] "View on Numista" link opens correct URL

---

# PENDING TASKS - Enhancements (Optional)

## 3.6 - Batch Add Feature ⏳

**Priority:** LOW - Nice to have
**Dependencies:** 3.4

### Objective
Allow users to add multiple coins to Numista at once with rate limiting.

### Sub-Tasks

- [ ] **3.6.1** Add batch selection UI
  - [ ] Checkboxes for coin selection
  - [ ] "Select All" / "Select None" buttons
  - [ ] Show count: "5 coins selected"
  - [ ] "Add Selected to Numista" button

- [ ] **3.6.2** Implement batch processing
  - [ ] Validate all selected coins (have Numista ID)
  - [ ] Show summary: "5 ready, 2 errors"
  - [ ] Process sequentially (respect API rate limit)
  - [ ] Show progress bar
  - [ ] Update metadata for each success
  - [ ] Collect errors for failed coins

- [ ] **3.6.3** Show batch results
  - [ ] Success/failure summary
  - [ ] Detailed error list
  - [ ] "Retry Failed" button

- [ ] **3.6.4** Rate limiting
  - [ ] Respect API quota (1 call per second)
  - [ ] Allow cancel mid-batch

### Files to Modify
- `src/renderer/index.html` - Add batch UI
- `src/renderer/app.js` - Add batch logic
- `src/main/index.js` - Add batch-add handler with rate limiting

---

## 3.7 - Update Existing Coin Feature ⏳

**Priority:** LOW - Future enhancement
**Dependencies:** 3.4

### Objective
Allow users to update coins that have already been synced to Numista.

### Sub-Tasks

- [ ] **3.7.1** Implement "Update on Numista" feature
  - [ ] Only available if already synced
  - [ ] Fetch current data from Numista
  - [ ] Compare OpenNumismat vs Numista data
  - [ ] Show differences
  - [ ] Allow user to select which changes to push
  - [ ] Call `PATCH /users/{user_id}/collected_items/{item_id}`
  - [ ] Update metadata timestamp

- [ ] **3.7.2** Handle edge cases
  - [ ] Coin deleted from Numista → mark as NOT_SYNCED
  - [ ] Data conflicts → user decides
  - [ ] Numista has newer data → warn user

### Files to Modify
- `src/modules/numista-api.js` - Add `updateCollectedItem()` method
- `src/renderer/app.js` - Add update flow

---

## 3.8 - About Page & Licensing System ✅ COMPLETE

**Priority:** MEDIUM
**Dependencies:** None (can be done independently)
**Blocks:** 3.9 (Fast Pricing Update)
**Completed:** February 4, 2026

### Objective
Implement About window with version info, update checking, and licensing system using Polar as merchant of record.

### Sub-Tasks

#### 3.8.1 - About Window
- [X] Create separate About window (not modal)
- [X] Display app name, version (from package.json), author
- [X] Add GitHub repository link
- [X] Add "View EULA" link
- [ ] Add "Check for Updates" button (DEFERRED)
  - [ ] Call GitHub Releases API
  - [ ] Show current vs latest version
  - [ ] Show download link if update available

#### 3.8.2 - Licensing Infrastructure
- [X] Add supporter status to settings schema
- [X] Implement license key validation (Polar API - Customer Portal endpoint)
- [X] Add IPC handlers for supporter status
  - [X] `get-supporter-status`
  - [X] `update-supporter-status`
  - [X] `validate-license-key`
  - [X] `get-lifetime-stats`
  - [X] `increment-lifetime-enrichments`
  - [X] `clear-license`

#### 3.8.3 - License Prompt System
- [X] Create license prompt modal in main window
- [X] Show prompt at thresholds:
  - [X] Initial: 20 coins enriched
  - [X] Recurring: Every 20 coins (40, 60, 80...)
- [X] Display time saved calculation (2 min/coin)
- [X] Options: "Get License", "Enter Key", "Maybe Later"

#### 3.8.4 - Premium Feature Gating
- [X] Create PREMIUM_FEATURES configuration
- [X] Implement `requirePremiumFeature(featureId)` gate function
- [X] Add premium badge styling (gold gradient)
- [X] Show premium prompt on gated features when unlicensed

### Files Modified
- `src/main/index.js` - IPC handlers, Polar config
- `src/main/preload.js` - Expose API methods
- `src/renderer/app.js` - License logic, About dialog, prompt modal, premium gating
- `package.json` - Added @polar-sh/sdk dependency

### Configuration

| Setting | Value |
|---------|-------|
| Payment Platform | Polar |
| Organization ID | 52798f3d-8060-45c9-b5e7-067bfa63c350 |
| Product ID | 50fd6539-84c3-4ca7-9a1e-9f73033077dd |
| Initial Prompt | 20 coins enriched |
| Recurring Prompt | Every 20 coins |
| Time Saved Estimate | 2 minutes per coin |

### Verification Checklist
- [X] About dialog opens from Help menu
- [X] Version displays correctly from package.json
- [ ] Update check calls GitHub API (DEFERRED)
- [X] License prompt appears at thresholds
- [X] Premium feature gating infrastructure ready
- [X] License validation works with Polar API

---

## 3.9 - Fast Pricing Update 💎 PREMIUM ✅ COMPLETE

**Priority:** MEDIUM
**Dependencies:** 3.8 (Licensing System)
**License Required:** YES - This is a premium feature
**Completed:** February 5, 2026

### Objective
Enable users to refresh pricing data for coins that have already been matched to a Numista type - without re-searching or re-matching. Uses only 1 API call per coin (vs 2-4 for full enrichment). This feature is gated behind the licensing system.

### Implementation Summary

Implemented "Fast Pricing Mode" - a batch update system with checkbox selection:
- **Mode Entry:** Click "Fast Pricing Update" button (premium-gated) to enter mode
- **Eligibility:** Only coins with both numistaId AND issueId can be selected
- **Selection Options:** Select All Eligible, Select Displayed, Clear, individual checkboxes
- **Progress Display:** Footer status bar (non-modal) so users can scroll during batch
- **Real-time Feedback:** Coin rows show checkmark/X as they're processed
- **Resume Support:** Successful coins deselected, failed coins remain selected for retry
- **UI Locking:** Prevents other actions during batch to avoid API conflicts
- **Rate Limiting:** 1 API call per second (Numista API limit)
- **Backup Strategy:** Single pre-batch backup (not per-coin)

### Sub-Tasks

#### 3.9.1 - Fast Pricing Button
- [X] Add "Fast Pricing Update" button to Collection Overview toolbar (existed from 3.8)
- [X] Show with PREMIUM badge when user is unlicensed
- [X] Gate behind `requirePremiumFeature('fast-pricing')` check
- [X] Button toggles fast pricing mode on/off

#### 3.9.2 - Fast Pricing Mode UI
- [X] Toolbar with selection controls (Select All, Select Displayed, Clear, Update, Cancel, Exit)
- [X] Checkbox cells appear next to eligible coins
- [X] Ineligible coins show dash with tooltip explaining why
- [X] Selected/eligible counts displayed in toolbar

#### 3.9.3 - Batch Fast Pricing Update
- [X] Confirmation dialog with coin count and estimated time
- [X] Single backup before batch starts
- [X] Process with rate limiting (1 call/second)
- [X] Progress in footer status bar (non-modal)
- [X] Real-time visual feedback on coin rows
- [X] Cancel button stops after current coin
- [X] Completion modal with results summary

#### 3.9.4 - Outdated Prices Filter
- [X] Already exists via Pricing Freshness filter (current/recent/aging/outdated/never)

### Files Modified
- `src/renderer/index.html` - Fast pricing toolbar, completion modal
- `src/renderer/app.js` - Fast pricing mode state, functions, event handlers
- `src/renderer/styles/main.css` - Toolbar, checkbox, status indicator styles
- `src/main/index.js` - `create-backup-before-batch`, `fast-pricing-update` IPC handlers
- `src/main/preload.js` - Bridge methods for fast pricing APIs

### Verification Checklist
- [X] Button shows lock icon when unlicensed
- [X] Clicking gated feature shows license prompt
- [X] Batch pricing respects rate limits (1 call/sec)
- [X] Metadata timestamps updated correctly
- [X] Outdated prices filter available (Pricing Freshness dropdown)

---

## 3.12 - Auto-Propagate (Batch Type Data Propagation) 💎 PREMIUM ✅ COMPLETE

**Priority:** MEDIUM
**Dependencies:** 3.8 (Licensing System)
**License Required:** YES for applying to other coins (detection is free)
**Completed:** February 6, 2026

### Objective
After enriching a coin, automatically detect other coins in the collection that share the same Numista type. Offer to propagate type-level data to all matching coins at once, saving API calls and user time.

### Implementation Summary

Implemented "Auto-Propagate" feature - automatic detection with batch propagation:
- **Trigger:** After merging, system detects coins with matching numistaId or catalog numbers
- **Categorization:** Coins grouped into True Duplicates (same type+year+mintmark) and Same Type/Different Issue
- **Detection:** FREE for all users (demonstrates value)
- **Propagation:** Requires Supporter Edition license
- **Progress Bar:** Visual progress during batch operation with "X/Y (Z%)" format
- **Skip Tracking:** Detailed reasons shown for coins that couldn't receive issue/pricing data
- **Toggle Setting:** Can be disabled in Data Settings via "Enable Auto-Propagate" checkbox

### Key Features
- **Catalog Matching:** Strict matching - ALL populated catalog slots must match
- **Numista ID Match:** Gold standard - 100% definitive match
- **Type Data Cache:** Silent reuse of previously fetched type data (saves API calls)
- **Empty Mintmark Setting:** User preference for how empty mintmarks are interpreted
- **Previously Enriched:** Optional checkbox to include/overwrite previously enriched coins

### Files Modified
- `src/renderer/app.js` - `findMatchingCoins()`, `categorizeMatchingCoins()`, `applyBatchTypePropagation()`, progress modal
- `src/main/index.js` - `propagate-type-data` IPC handler, `typeDataCache`
- `src/main/preload.js` - Bridge method `propagateTypeData()`
- `src/modules/settings-manager.js` - `emptyMintmarkInterpretation`, `enableAutoPropagate` settings
- `src/renderer/index.html` - Data Settings UI (radio buttons, checkbox)
- `docs/user-manual.html` - Feature documentation

### Verification Checklist
- [X] Detection searches ALL coins in collection
- [X] Numista ID match is gold standard
- [X] Catalog matching is strict (all slots must match)
- [X] True duplicates vs same-type correctly categorized
- [X] Premium gating works correctly
- [X] Progress bar shows during batch operation
- [X] Results modal shows detailed summary
- [X] Toggle setting disables feature when unchecked
- [X] User manual updated with feature documentation

---

# DEFERRED TASKS - Future Phases

## 3.10 - Multi-Source Data Fetching 🔮

**When:** Phase 4 or later

Extend the system to pull data from multiple sources (PCGS, NGC, Colnect, etc.) with an abstraction layer, source configuration, and conflict resolution.

**Complexity:** Major undertaking. Defer until Numista integration is rock-solid.

---

## 3.11 - OpenNumismat Plugin Integration 🔮

**When:** After app is stable and packaged

Support launching NumiSync Wizard as an external tool from OpenNumismat with database path passed as command-line argument.

---

# REFERENCE DOCUMENTATION

## Appendix A: Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| OAuth Flow | Client Credentials | Simple, works for single-user desktop app |
| Sync Direction | One-way: OpenNumismat → Numista | Prevents sync conflicts, clear source of truth |
| Sync Strategy | Manual, selective | User controls what gets added |
| User ID Storage | In settings file | Required for API calls |
| Token Storage | Encrypted (safeStorage) | Security best practice |
| Token Refresh | On-demand | Request new token when expired |
| Collection Selection | User chooses target | Flexibility for multi-collection users |
| Duplicate Detection | Check by metadata | Prevent duplicates |
| Sync Status Storage | Metadata in note field | Consistent with Phase 2 |

---

## Appendix B: Grade Mapping

**Numista Grades:** `g`, `vg`, `f`, `vf`, `xf`, `au`, `unc`

**Mapping Logic:**
```javascript
const gradeMap = {
  'g': 'g', 'good': 'g',
  'vg': 'vg', 'very good': 'vg',
  'f': 'f', 'fine': 'f',
  'vf': 'vf', 'very fine': 'vf',
  'xf': 'xf', 'ef': 'xf', 'extremely fine': 'xf', 'extra fine': 'xf',
  'au': 'au', 'about uncirculated': 'au',
  'unc': 'unc', 'uncirculated': 'unc', 'bu': 'unc', 'ms': 'unc'
};
```

- Show preview of mapped grade before adding
- Allow user to override mapping
- Warn if grade couldn't be mapped

---

## Appendix C: Price Selection

**OpenNumismat has 4 price fields:** `price_unc`, `price_xf`, `price_vf`, `price_f`

**Selection Strategy:**
1. If grade specified, use matching price field
2. AU uses UNC price, VG/G use F price
3. If no match, use first available price

---

## Appendix D: Metadata Extension

Add `numistaSync` section to coin metadata:

```json
{
  "numistaSync": {
    "status": "SYNCED",
    "timestamp": "2026-02-01T14:30:00Z",
    "collectedItemId": 987654,
    "collection": "Main Collection",
    "collectionId": 5
  }
}
```

**Status Values:**
- `NOT_SYNCED` - Never added to Numista
- `SYNCED` - Successfully added
- `SYNC_FAILED` - Add attempt failed
- `DUPLICATE` - Already exists in Numista

---

## Appendix E: API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /oauth_token` | Get OAuth access token |
| `GET /users/{id}/collections` | List user's collections |
| `GET /users/{id}/collected_items` | List collected items |
| `POST /users/{id}/collected_items` | Add item to collection |
| `PATCH /users/{id}/collected_items/{item_id}` | Update item |

---

## Appendix F: OAuth Flow

```
1. User enters Numista API Key in settings
2. App requests token: GET /oauth_token
   - grant_type: client_credentials
   - scope: edit_collection
   - Headers: Numista-API-Key: {key}
3. Numista returns access_token (expires in 1 hour)
4. App stores encrypted token
5. Before each write API call, check token expiry
6. If expired, request new token automatically
```

---

## Appendix G: Data Field Mapping

| Numista Field | OpenNumismat Field | Transform |
|---------------|-------------------|-----------|
| `type` | numista_id (from metadata) | Required |
| `issue` | issue_id (from metadata) | Optional |
| `quantity` | quantity | Default 1 |
| `grade` | grade | See Appendix B |
| `for_swap` | N/A | User checkbox |
| `private_comment` | note | Strip metadata |
| `price.value` | price_unc/xf/vf/f | See Appendix C |
| `price.currency` | N/A | From settings |
| `storage_location` | location | Direct |
| `acquisition_place` | saleplace | Direct |
| `acquisition_date` | saledate | Format YYYY-MM-DD |
| `serial_number` | serial | Direct |
| `weight` | weight | Grams |
| `size` | diameter | mm |

---

## Appendix H: Settings Schema Extension

```json
{
  "apiConfiguration": {
    "apiKey": "...",
    "userId": 12345
  },
  "oauthData": {
    "tokenEncrypted": "...",
    "tokenExpiry": 1738512000000
  },
  "numistaSync": {
    "enabled": true,
    "defaultCollectionId": 5,
    "defaultCollectionName": "Main Collection"
  }
}
```

---

## Appendix I: Security Requirements

1. **Token Storage:** Use Electron safeStorage API for encryption
2. **API Key Protection:** Never log API key or tokens
3. **HTTPS Only:** All API calls over HTTPS
4. **Memory Cleanup:** Clear sensitive data after use

---

**Document Status:** Ready for Implementation
**Next Action:** Begin Task 3.1 - OAuth 2.0 Integration
**Prerequisites:** Phase 2 complete (metadata system required)
