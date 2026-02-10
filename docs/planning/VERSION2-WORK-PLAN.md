# Version 2 Work Plan - Numismat Enrichment Tool

**Project:** NumiSync Wizard for OpenNumismat
**Phase:** Version 2 - Remaining Features & Enhancements
**Created:** February 9, 2026
**Status:** Active

---

## Executive Summary

Version 2 consolidates all incomplete tasks from Phase 3 (Numista Collection Sync) and deferred features from Phase 2. This plan focuses on completing the core Numista sync functionality and selective enhancements based on user demand.

---

## Task Status Dashboard

| ID | Task | Status | Priority | Dependencies |
|----|------|--------|----------|--------------|
| **CORE NUMISTA SYNC** |
| 2.1 | OAuth 2.0 Integration | ⏳ Pending | CRITICAL | None |
| 2.2 | Data Mapper (Reverse Direction) | ⏳ Pending | HIGH | 2.1 |
| 2.3 | Collection Selection UI | ⏳ Pending | MEDIUM | 2.1 |
| 2.4 | Add Coin UI & Flow | ⏳ Pending | HIGH | 2.1, 2.2, 2.3 |
| 2.5 | Sync Status Display | ⏳ Pending | MEDIUM | 2.4 |
| **OPTIONAL ENHANCEMENTS** |
| 2.6 | Batch Add Feature | ⏳ Pending | LOW | 2.4 |
| 2.7 | Update Existing Coin | ⏳ Pending | LOW | 2.4 |
| 2.8 | Auto-Update Check | ⏳ Pending | LOW | None |
| **FUTURE CONSIDERATION** |
| 2.9 | Multi-Source Data Fetching | 🔮 Future | — | User demand |
| 2.10 | OpenNumismat Plugin Integration | 🔮 Future | — | After stable release |

**Legend:** ✅ Complete | 🔄 In Progress | ⏳ Pending | 🔮 Future/Deferred

**Critical Path:** 2.1 → 2.2 → 2.4 (OAuth → Data Mapper → Add Coin UI)

---

## Task Dependency Graph

```
2.1 OAuth 2.0 ⏳
  ├──→ 2.2 Data Mapper ⏳
  │      └──→ 2.4 Add Coin UI ⏳
  │             ├──→ 2.5 Sync Status ⏳
  │             ├──→ 2.6 Batch Add ⏳
  │             └──→ 2.7 Update Coin ⏳
  └──→ 2.3 Collection Selection ⏳
         └──→ 2.4 Add Coin UI ⏳

2.8 Auto-Update Check ⏳
      (independent)
```

---

# PENDING TASKS - Core Implementation

## 2.1 - OAuth 2.0 Integration ⏳

**Priority:** CRITICAL - Required for all Numista sync features
**Dependencies:** None
**Blocks:** 2.2, 2.3, 2.4
**Migrated From:** Phase 3 Task 3.1

### Objective
Implement OAuth 2.0 Client Credentials flow to authenticate users with the Numista API for write operations.

### Sub-Tasks

- [ ] **2.1.1** Create `src/modules/numista-oauth.js`
  - [ ] `requestAccessToken(apiKey)` - Get token from Numista
  - [ ] `ensureValidToken()` - Check/refresh token before API calls
  - [ ] `storeToken(token, expiry)` - Persist encrypted token
  - [ ] `getStoredToken()` - Retrieve and decrypt token
  - [ ] Handle token expiration automatically
  - [ ] Handle API errors (invalid key, network failure)

- [ ] **2.1.2** Implement secure token storage
  - [ ] Research encryption options (electron-store, safeStorage)
  - [ ] Encrypt token before saving
  - [ ] Decrypt token on load
  - [ ] Never log tokens or API keys

- [ ] **2.1.3** Add User ID detection
  - [ ] Try auto-detection via API `/me` endpoint
  - [ ] Fall back to user input if unavailable
  - [ ] Store in settings file

- [ ] **2.1.4** Update settings UI
  - [ ] Add "Numista User ID" field
  - [ ] Add "Test Connection" button
  - [ ] Show token status (valid/expired/missing)
  - [ ] Show last successful authentication timestamp

- [ ] **2.1.5** Add error handling
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

## 2.2 - Data Mapper (Reverse Direction) ⏳

**Priority:** HIGH
**Dependencies:** 2.1
**Blocks:** 2.4
**Migrated From:** Phase 3 Task 3.2

### Objective
Map OpenNumismat coin data to Numista API format for uploading coins.

### Sub-Tasks

- [ ] **2.2.1** Create `src/modules/numista-uploader.js`
  - [ ] `mapCoinToNumista(coin, options)` - Main mapping function
  - [ ] Grade mapping logic (see Appendix B)
  - [ ] Price selection logic (see Appendix C)
  - [ ] Date formatting (YYYY-MM-DD)
  - [ ] Strip metadata from notes (preserve user notes only)
  - [ ] Handle missing/null fields gracefully

- [ ] **2.2.2** Implement validation
  - [ ] Require Numista Type ID (from metadata)
  - [ ] Warn if no grade can be mapped
  - [ ] Warn if no price available
  - [ ] Validate date format
  - [ ] Validate numeric fields (weight, size)

- [ ] **2.2.3** Create preview functionality
  - [ ] Show what data will be sent to Numista
  - [ ] Highlight fields that will be omitted
  - [ ] Show grade mapping result
  - [ ] Show selected price

- [ ] **2.2.4** Handle special cases
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

## 2.3 - Collection Selection UI ⏳

**Priority:** MEDIUM
**Dependencies:** 2.1
**Blocks:** 2.4
**Migrated From:** Phase 3 Task 3.3

### Objective
Allow users to select which Numista collection to add coins to.

### Sub-Tasks

- [ ] **2.3.1** Fetch user's collections
  - [ ] Call `GET /users/{user_id}/collections`
  - [ ] Parse and cache collection list
  - [ ] Handle empty collections list

- [ ] **2.3.2** Add collection selector UI
  - [ ] Dropdown in "Add to Numista" modal
  - [ ] Show collection names
  - [ ] Default to first collection or saved preference
  - [ ] "Refresh Collections" button

- [ ] **2.3.3** Store collection preference
  - [ ] Save last-used collection in settings
  - [ ] Auto-select on next add

- [ ] **2.3.4** Handle edge cases
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

## 2.4 - Add Coin UI & Flow ⏳

**Priority:** HIGH
**Dependencies:** 2.1, 2.2, 2.3
**Blocks:** 2.5, 2.6, 2.7
**Migrated From:** Phase 3 Task 3.4

### Objective
Implement the main user interface and flow for adding coins to Numista.

### Sub-Tasks

- [ ] **2.4.1** Add "Add to Numista" button
  - [ ] Show in coin detail view
  - [ ] Show in field comparison screen (after merge)
  - [ ] Disable if no Numista ID in metadata
  - [ ] Disable if not authenticated

- [ ] **2.4.2** Create "Add to Numista" modal
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

- [ ] **2.4.3** Implement add flow
  - [ ] Validate authentication (token valid)
  - [ ] Map OpenNumismat data to Numista format
  - [ ] Show preview modal
  - [ ] User confirms → Call API
  - [ ] Update metadata with sync status
  - [ ] Show success message
  - [ ] Update UI (show sync icon)

- [ ] **2.4.4** Handle duplicate detection
  - [ ] Check metadata for existing sync
  - [ ] Warn user if already synced
  - [ ] Offer options: Skip / Add Anyway / Update

- [ ] **2.4.5** Handle errors
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

## 2.5 - Sync Status Display ⏳

**Priority:** MEDIUM
**Dependencies:** 2.4
**Migrated From:** Phase 3 Task 3.5

### Objective
Show visual indicators of Numista sync status throughout the UI.

### Sub-Tasks

- [ ] **2.5.1** Add sync status icon to coin list
  - [ ] 📤 = Synced to Numista
  - [ ] ⭕ = Not synced
  - [ ] ⚠️ = Sync failed
  - [ ] Show timestamp on hover

- [ ] **2.5.2** Add sync status to coin details panel
  - [ ] Show last sync date
  - [ ] Show Numista collection name
  - [ ] Show collected item ID
  - [ ] "View on Numista" deep link

- [ ] **2.5.3** Add filter by sync status
  - [ ] Synced / Not Synced / Sync Failed
  - [ ] Show counts per status

- [ ] **2.5.4** Add sort by sync date
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

# PENDING TASKS - Optional Enhancements

## 2.6 - Batch Add Feature ⏳

**Priority:** LOW - Nice to have
**Dependencies:** 2.4
**Migrated From:** Phase 3 Task 3.6

### Objective
Allow users to add multiple coins to Numista at once with rate limiting.

### Sub-Tasks

- [ ] **2.6.1** Add batch selection UI
  - [ ] Checkboxes for coin selection
  - [ ] "Select All" / "Select None" buttons
  - [ ] Show count: "5 coins selected"
  - [ ] "Add Selected to Numista" button

- [ ] **2.6.2** Implement batch processing
  - [ ] Validate all selected coins (have Numista ID)
  - [ ] Show summary: "5 ready, 2 errors"
  - [ ] Process sequentially (respect API rate limit)
  - [ ] Show progress bar
  - [ ] Update metadata for each success
  - [ ] Collect errors for failed coins

- [ ] **2.6.3** Show batch results
  - [ ] Success/failure summary
  - [ ] Detailed error list
  - [ ] "Retry Failed" button

- [ ] **2.6.4** Rate limiting
  - [ ] Respect API quota (1 call per second)
  - [ ] Allow cancel mid-batch

### Files to Modify
- `src/renderer/index.html` - Add batch UI
- `src/renderer/app.js` - Add batch logic
- `src/main/index.js` - Add batch-add handler with rate limiting

---

## 2.7 - Update Existing Coin Feature ⏳

**Priority:** LOW - Future enhancement
**Dependencies:** 2.4
**Migrated From:** Phase 3 Task 3.7

### Objective
Allow users to update coins that have already been synced to Numista.

### Sub-Tasks

- [ ] **2.7.1** Implement "Update on Numista" feature
  - [ ] Only available if already synced
  - [ ] Fetch current data from Numista
  - [ ] Compare OpenNumismat vs Numista data
  - [ ] Show differences
  - [ ] Allow user to select which changes to push
  - [ ] Call `PATCH /users/{user_id}/collected_items/{item_id}`
  - [ ] Update metadata timestamp

- [ ] **2.7.2** Handle edge cases
  - [ ] Coin deleted from Numista → mark as NOT_SYNCED
  - [ ] Data conflicts → user decides
  - [ ] Numista has newer data → warn user

### Files to Modify
- `src/modules/numista-api.js` - Add `updateCollectedItem()` method
- `src/renderer/app.js` - Add update flow

---

## 2.8 - Auto-Update Check ⏳

**Priority:** LOW
**Dependencies:** None
**Migrated From:** Phase 3 Task 3.8.3 (deferred sub-task)

### Objective
Implement automatic update checking against GitHub releases.

### Sub-Tasks

- [ ] **2.8.1** Add "Check for Updates" button to About window
  - [ ] Call GitHub Releases API
  - [ ] Compare current version (from package.json) vs latest release
  - [ ] Show update available message with version number
  - [ ] Provide download link if update available

- [ ] **2.8.2** Optional: Auto-check on startup
  - [ ] Setting to enable/disable auto-check
  - [ ] Non-intrusive notification of updates
  - [ ] Don't check more than once per day

### Files to Modify
- `src/main/index.js` - Add update check handler
- `src/renderer/app.js` - Add update check UI logic
- `src/modules/settings-manager.js` - Add auto-check setting

### API Endpoint
```
GET https://api.github.com/repos/{owner}/{repo}/releases/latest
```

---

# DEFERRED TASKS - Future Consideration

## 2.9 - Multi-Source Data Fetching 🔮

**When:** If users request it
**Migrated From:** Phase 3 Task 3.10, Phase 2 Task 2.7

### Objective
Extend the system to pull data from multiple sources (PCGS, NGC, Colnect, etc.) with an abstraction layer, source configuration, and conflict resolution.

**Complexity:** Major undertaking. Defer until user demand is established.

**Potential Sources:**
- PCGS (Professional Coin Grading Service)
- NGC (Numismatic Guaranty Corporation)
- Colnect
- UCOIN
- CoinArchives

**Architecture Requirements:**
- DataSourceInterface abstract class
- Per-source implementations
- Unified field mapping
- Source priority/fallback logic
- Conflict resolution UI

---

## 2.10 - OpenNumismat Plugin Integration 🔮

**When:** After app is stable and widely adopted
**Migrated From:** Phase 3 Task 3.11, Phase 2 Task 2.8

### Objective
Support launching NumiSync Wizard as an external tool from OpenNumismat with database path passed as command-line argument.

**Implementation:**
- Parse `--database="path"` command-line argument
- Auto-load database on startup if arg present
- Create XML configuration snippet for users
- Document integration steps

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
| Sync Status Storage | Metadata in note field | Consistent with existing metadata system |

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

**CRITICAL:** Must use field-mapper.js canonical mapping:
- `price1` = UNC
- `price2` = XF
- `price3` = VF
- `price4` = F

(See CLAUDE.md Lesson #21)

---

## Appendix D: Metadata Extension

Add `numistaSync` section to coin metadata:

```json
{
  "numistaSync": {
    "status": "SYNCED",
    "timestamp": "2026-02-09T14:30:00Z",
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

## Migration Notes

This work plan consolidates:
- **Phase 3 Tasks 3.1-3.7:** Core Numista sync features (incomplete)
- **Phase 3 Task 3.8.3:** Auto-update check (deferred sub-task)
- **Phase 3 Tasks 3.10-3.11:** Multi-source and plugin integration (deferred to future)
- **Phase 2 Tasks 2.7-2.8:** Same deferred features from Phase 2 plan

All other Phase 3 tasks (3.0, 3.8, 3.9, 3.12) are complete and not migrated.

---

**Document Status:** Active - Ready for Implementation
**Next Action:** Begin Task 2.1 - OAuth 2.0 Integration
**Prerequisites:** Version 1 complete (all Phase 1-3 completed tasks)
