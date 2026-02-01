# Phase 3 Work Plan - OpenNumismat Enrichment Tool

**Project:** OpenNumismat-Numista Data Enrichment Tool
**Phase:** Phase 3 - Numista Collection Management
**Date Created:** February 1, 2026
**Status:** Planning - Ready for Implementation

---

## Executive Summary

Phase 3 adds bi-directional sync capability, allowing users to add coins from their OpenNumismat collection to their Numista online collection. This enables:

- **Add coins to Numista** - Push OpenNumismat coins to cloud collection
- **OAuth 2.0 authentication** - Secure user authorization
- **Comprehensive data mapping** - All available OpenNumismat fields map to Numista
- **Selective sync** - Choose which coins to add (not forced sync)
- **Collection management** - Select target Numista collection
- **Grade mapping** - Convert OpenNumismat grades to Numista standard grades
- **Sync status tracking** - Know which coins have been added

**Key Benefits:**
- Backup collection data to cloud
- Access collection from mobile/web via Numista
- Share collection with other collectors
- Leverage Numista's swap marketplace
- Unified collection management

---

## Architecture Decisions Summary

| Decision Point | Choice | Rationale |
|----------------|--------|-----------|
| **OAuth Flow** | Client Credentials | Simple, works for single-user desktop app |
| **Direction** | One-way: OpenNumismat → Numista | Prevents sync conflicts, clear source of truth |
| **Sync Strategy** | Manual, selective | User controls what gets added |
| **User ID Storage** | In settings file | Required for API calls |
| **Token Storage** | Secure storage (encrypted) | Security best practice |
| **Token Refresh** | On-demand | Request new token when needed |
| **Collection Selection** | User chooses target collection | Flexibility for multi-collection users |
| **Duplicate Detection** | Check by Numista ID before adding | Prevent duplicates |
| **Sync Status Storage** | Metadata in note field | Consistent with Phase 2 |
| **Data Mapping** | Comprehensive field mapping | Utilize all available data |

---

## OAuth 2.0 Implementation Strategy

### Flow Type: Client Credentials (Simple)

**Why Client Credentials:**
- Each user provides their own Numista API key
- API key is also the `client_secret`
- No browser redirects needed
- No authorization prompts
- Works perfectly for desktop app

### Authentication Flow

```
User Opens Settings
  ↓
User enters:
  - Numista API Key
  - Numista User ID (optional - can auto-detect)
  ↓
App requests OAuth token:
  GET /oauth_token
  - grant_type: client_credentials
  - scope: edit_collection
  - Headers: Numista-API-Key: {user's key}
  ↓
Numista returns:
  - access_token: "abc123..."
  - token_type: "Bearer"
  - expires_in: 3600
  ↓
App stores token securely (encrypted)
  ↓
User adds coin to Numista:
  POST /users/{user_id}/collected_items
  - Headers:
    - Numista-API-Key: {user's key}
    - Authorization: Bearer {access_token}
  - Body: coin data
  ↓
Success: Coin added to Numista collection
```

### Token Management

**Storage:**
- Encrypt token using electron-store or similar
- Store in settings file (encrypted section)
- Never log token to console or files

**Expiration Handling:**
```javascript
async function ensureValidToken() {
  const token = getStoredToken();
  const expiry = getTokenExpiry();

  if (!token || Date.now() >= expiry) {
    // Token missing or expired
    const newToken = await requestNewToken();
    storeToken(newToken, Date.now() + 3600000); // 1 hour
    return newToken;
  }

  return token;
}
```

**Refresh Strategy:**
- Check expiry before each API call
- Request new token if expired/missing
- No refresh token needed (client credentials generates new token each time)

---

## Prerequisites

### What Users Need

1. **Numista Account** (free or paid)
   - Create at https://en.numista.com/

2. **Numista API Key**
   - Request from Numista (usually provided with account)
   - Contact: developer support or settings page

3. **Numista User ID**
   - Option A: User provides it (found in profile URL)
   - Option B: App auto-detects via `/me` endpoint (if available)
   - Format: Integer (e.g., 12345)

4. **API Quota Awareness**
   - Free tier: Limited calls per day
   - Paid tier: Higher quota
   - Each coin add = 1 API call

### What Developers Need

**From Numista:**
- API documentation (already have: swagger.yaml)
- Client ID (may not be needed for client credentials)
- Confirmation that client credentials flow works

**Libraries:**
- `axios` (already installed)
- `electron-store` (for secure settings storage) - or similar
- No OAuth library needed (simple GET request)

---

## Data Mapping: OpenNumismat → Numista

### Numista API Fields (POST /users/{user_id}/collected_items)

**Required:**
- `type` (integer) - Numista Type ID

**Optional - Directly Mapped:**
| Numista Field | OpenNumismat Field | Transform |
|---------------|-------------------|-----------|
| `issue` | issue_id (from metadata) | Direct |
| `quantity` | quantity | Default 1 if empty |
| `grade` | grade | See grade mapping below |
| `for_swap` | N/A | User checkbox in UI |
| `private_comment` | note (user notes only) | Strip metadata |
| `price` → `value` | price (selected grade) | From price_unc/xf/vf/f |
| `price` → `currency` | N/A | From settings (USD/EUR/etc) |
| `storage_location` | location | Direct |
| `acquisition_place` | saleplace | Direct |
| `acquisition_date` | saledate | Format YYYY-MM-DD |
| `serial_number` | serial | Direct |
| `weight` | weight | Direct (grams) |
| `size` | diameter | Direct (mm) |

**Optional - Not Available in OpenNumismat:**
| Numista Field | OpenNumismat Equivalent | Strategy |
|---------------|------------------------|----------|
| `axis` | N/A | Omit (not in OpenNumismat) |
| `grading_details` | N/A | Omit (advanced grading) |
| `internal_id` | id (OpenNumismat ID) | Could use for reference |
| `collection` | N/A | User selects in UI |
| `public_comment` | N/A | Omit or user inputs |

### Grade Mapping

**Numista Grades:** `g`, `vg`, `f`, `vf`, `xf`, `au`, `unc`

**OpenNumismat Grades:** Flexible text field (varies by user)

**Mapping Strategy:**
```javascript
function mapGradeToNumista(openNumismatGrade) {
  if (!openNumismatGrade) return null;

  const grade = openNumismatGrade.toLowerCase().trim();

  // Direct matches
  const directMap = {
    'g': 'g', 'good': 'g',
    'vg': 'vg', 'very good': 'vg',
    'f': 'f', 'fine': 'f',
    'vf': 'vf', 'very fine': 'vf',
    'xf': 'xf', 'ef': 'xf', 'extremely fine': 'xf', 'extra fine': 'xf',
    'au': 'au', 'about uncirculated': 'au',
    'unc': 'unc', 'uncirculated': 'unc', 'bu': 'unc', 'ms': 'unc'
  };

  if (directMap[grade]) return directMap[grade];

  // Partial matches
  if (grade.includes('unc') || grade.includes('bu') || grade.includes('ms')) return 'unc';
  if (grade.includes('au')) return 'au';
  if (grade.includes('xf') || grade.includes('ef') || grade.includes('extremely')) return 'xf';
  if (grade.includes('vf') || grade.includes('very fine')) return 'vf';
  if (grade.includes('fine')) return 'f';
  if (grade.includes('vg') || grade.includes('very good')) return 'vg';
  if (grade.includes('good')) return 'g';

  // Default: omit grade if can't map
  return null;
}
```

**UI Enhancement:**
- Show preview of mapped grade before adding
- Allow user to override mapping
- Warn if grade couldn't be mapped

### Price Selection Strategy

**Problem:** OpenNumismat has 4 prices (unc, xf, vf, f), user may have filled some/all

**Strategy:**
```javascript
function selectPriceForNumista(coin, selectedGrade) {
  // If user specified grade, use matching price
  if (selectedGrade) {
    const priceMap = {
      'unc': coin.price_unc,
      'au': coin.price_unc,  // AU closest to UNC
      'xf': coin.price_xf,
      'vf': coin.price_vf,
      'f': coin.price_f,
      'vg': coin.price_f,    // VG closest to F
      'g': coin.price_f      // G closest to F
    };

    if (priceMap[selectedGrade]) {
      return priceMap[selectedGrade];
    }
  }

  // No grade or no matching price, use first available
  return coin.price_unc || coin.price_xf || coin.price_vf || coin.price_f || null;
}
```

---

## Sync Status Tracking

### Metadata Extension

Add `numistaSync` section to existing metadata structure:

```json
{
  "version": "2.0",
  "basicData": { ... },
  "issueData": { ... },
  "pricingData": { ... },
  "numistaSync": {
    "status": "SYNCED",
    "timestamp": "2026-02-01T14:30:00Z",
    "collectedItemId": 987654,
    "collection": "Main Collection",
    "collectionId": 5,
    "lastSyncedData": {
      "grade": "xf",
      "quantity": 1,
      "price": 25.50,
      "currency": "USD"
    }
  }
}
```

### Status Values

| Status | Meaning |
|--------|---------|
| `NOT_SYNCED` | Coin never added to Numista |
| `SYNCED` | Successfully added to Numista |
| `SYNC_FAILED` | Add attempt failed (API error) |
| `DUPLICATE` | Already exists in Numista collection |

### Duplicate Detection

**Before adding, check:**
1. Does metadata contain `numistaSync.status === 'SYNCED'`?
2. If yes, warn user: "This coin was already added to Numista on {date}"
3. Offer options: "Skip", "Add Anyway (will create duplicate)", "Update Existing"

**API Check:**
- Could query `/users/{user_id}/collected_items` to verify
- Performance concern: would require 1 API call per coin
- Better: Trust local metadata, offer manual verification

---

## Implementation Tasks

### 3.1 - OAuth 2.0 Integration ⭐ CRITICAL FOUNDATION

**Priority:** CRITICAL - Required for all other features
**Estimated Time:** 2 days

**Tasks:**
- [ ] Create `src/modules/numista-oauth.js`
  - [ ] Implement `requestAccessToken(apiKey)`
  - [ ] Implement `ensureValidToken()`
  - [ ] Implement `storeToken(token, expiry)`
  - [ ] Implement `getStoredToken()`
  - [ ] Handle token expiration
  - [ ] Handle API errors (invalid key, network failure)
- [ ] Implement secure token storage
  - [ ] Research encryption options (electron-store, safeStorage)
  - [ ] Encrypt token before saving
  - [ ] Decrypt token on load
- [ ] Add User ID detection
  - [ ] Try auto-detection via API (if available)
  - [ ] Fall back to user input
  - [ ] Store in settings file
- [ ] Update settings UI
  - [ ] Add "Numista User ID" field
  - [ ] Add "Test Connection" button
  - [ ] Show token status (valid/expired/missing)
  - [ ] Show last successful authentication
- [ ] Add error handling
  - [ ] Invalid API key → clear error message
  - [ ] Network failure → retry logic
  - [ ] Token expired → auto-refresh
  - [ ] Quota exceeded → warn user

**Files to Create:**
- `src/modules/numista-oauth.js` (NEW)

**Files to Modify:**
- `src/modules/settings-manager.js` (ADD userId, tokenData fields)
- `src/renderer/index.html` (ADD User ID field, Test button)
- `src/renderer/app.js` (ADD OAuth UI handlers)
- `src/main/index.js` (ADD OAuth IPC handlers)
- `src/main/preload.js` (ADD OAuth API methods)

**Deliverable:** Working OAuth 2.0 authentication

**Testing:**
- [ ] Request token with valid API key
- [ ] Request token with invalid API key (error handling)
- [ ] Token storage and retrieval
- [ ] Token expiration and refresh
- [ ] Network failure during auth

---

### 3.2 - Data Mapper (Reverse Direction) ⭐ CORE FEATURE

**Priority:** HIGH - Needed for adding coins
**Estimated Time:** 2 days

**Tasks:**
- [ ] Create `src/modules/numista-uploader.js`
  - [ ] Implement `mapCoinToNumista(coin, options)`
  - [ ] Implement grade mapping logic
  - [ ] Implement price selection logic
  - [ ] Implement date formatting (YYYY-MM-DD)
  - [ ] Strip metadata from notes
  - [ ] Handle missing/null fields
- [ ] Implement validation
  - [ ] Require Numista Type ID (from metadata)
  - [ ] Warn if no grade can be mapped
  - [ ] Warn if no price available
  - [ ] Validate date format
  - [ ] Validate numeric fields (weight, size)
- [ ] Create preview functionality
  - [ ] Show what data will be sent to Numista
  - [ ] Highlight fields that will be omitted
  - [ ] Show grade mapping result
  - [ ] Show selected price
- [ ] Handle special cases
  - [ ] Multiple quantities → warn user
  - [ ] Missing Numista ID → error (can't add without it)
  - [ ] Issue ID present → include in request
  - [ ] Issue ID missing → omit (type-level add)

**Files to Create:**
- `src/modules/numista-uploader.js` (NEW)

**Files to Modify:**
- `src/modules/field-mapper.js` (REFERENCE for reverse mapping)

**Deliverable:** Robust OpenNumismat → Numista data mapping

**Testing:**
- [ ] Map coin with all fields populated
- [ ] Map coin with minimal data
- [ ] Grade mapping (all variations)
- [ ] Price selection logic
- [ ] Note field stripping (preserve user notes, remove metadata)
- [ ] Edge cases (nulls, empty strings, invalid formats)

---

### 3.3 - Collection Selection UI ⭐ USER CONTROL

**Priority:** MEDIUM - Nice to have, defaults to main collection
**Estimated Time:** 1 day

**Tasks:**
- [ ] Fetch user's collections
  - [ ] Call `GET /users/{user_id}/collections`
  - [ ] Parse collection list
  - [ ] Store in cache
- [ ] Add collection selector UI
  - [ ] Dropdown in "Add to Numista" modal
  - [ ] Show collection name
  - [ ] Default to first collection (or saved preference)
  - [ ] "Refresh Collections" button
- [ ] Store collection preference
  - [ ] Save last-used collection in settings
  - [ ] Auto-select on next add
- [ ] Handle edge cases
  - [ ] User has no collections → error message, link to Numista
  - [ ] API failure → allow proceed without selection (default collection)

**Files to Modify:**
- `src/modules/numista-api.js` (ADD getUserCollections method)
- `src/renderer/index.html` (ADD collection dropdown)
- `src/renderer/app.js` (ADD collection selection logic)
- `src/main/index.js` (ADD get-collections IPC handler)

**Deliverable:** User can select target Numista collection

**UI Mock:**
```
┌──────────────────────────────────────────────────────────┐
│ Add to Numista Collection                                │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ Coin: 1943 Lincoln Cent                                  │
│                                                           │
│ Target Collection:                                        │
│ [Main Collection ▼        ]  [Refresh]                   │
│   ├─ Main Collection (default)                           │
│   ├─ US Coins                                            │
│   ├─ World War II Collection                             │
│   └─ For Swap                                            │
│                                                           │
│ Grade: XF (mapped from "Extremely Fine")                 │
│ Price: $2.50 USD (from price_xf field)                   │
│ Quantity: 1                                               │
│                                                           │
│ ☐ Available for swap                                     │
│                                                           │
│ [Preview Data]  [Add to Numista]  [Cancel]              │
└──────────────────────────────────────────────────────────┘
```

---

### 3.4 - Add Coin UI & Flow ⭐ USER INTERFACE

**Priority:** HIGH - Main user-facing feature
**Estimated Time:** 2 days

**Tasks:**
- [ ] Add "Add to Numista" button
  - [ ] Show in coin detail view
  - [ ] Show in field comparison screen (after merge)
  - [ ] Disable if no Numista ID in metadata
  - [ ] Disable if not authenticated
- [ ] Create "Add to Numista" modal
  - [ ] Show coin preview (title, year, images)
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
- [ ] Implement add flow
  - [ ] Validate authentication (token valid)
  - [ ] Map OpenNumismat data to Numista format
  - [ ] Show preview modal
  - [ ] User confirms
  - [ ] Call API to add coin
  - [ ] Update metadata with sync status
  - [ ] Show success message
  - [ ] Update UI (show sync icon)
- [ ] Handle duplicate detection
  - [ ] Check metadata for existing sync
  - [ ] Warn user if already synced
  - [ ] Offer options: Skip / Add Anyway / Update
- [ ] Handle errors
  - [ ] API errors → show clear message
  - [ ] Network errors → offer retry
  - [ ] Validation errors → highlight fields
  - [ ] Quota exceeded → inform user

**Files to Modify:**
- `src/renderer/index.html` (ADD "Add to Numista" modal)
- `src/renderer/app.js` (ADD modal logic, add flow)
- `src/renderer/styles/main.css` (ADD modal styling)
- `src/main/index.js` (ADD add-coin-to-numista IPC handler)
- `src/main/preload.js` (ADD addCoinToNumista API method)

**Deliverable:** Complete UI for adding coins to Numista

**UI Flow:**
```
1. User clicks coin in list
2. Coin details display
3. User clicks "Add to Numista 📤" button
4. Modal opens with prefilled data
5. User reviews/edits data
6. User clicks "Preview JSON" (optional)
7. User clicks "Add to Numista"
8. Loading indicator appears
9. Success: "✅ Coin added to Numista!"
10. Metadata updated, sync icon shows in coin list
```

---

### 3.5 - Sync Status Display ⭐ UX ENHANCEMENT

**Priority:** MEDIUM - Helpful for tracking
**Estimated Time:** 1 day

**Tasks:**
- [ ] Add sync status icon to coin list
  - [ ] 📤 = Synced to Numista
  - [ ] ⭕ = Not synced
  - [ ] ⚠️ = Sync failed
  - [ ] Show timestamp on hover
- [ ] Add sync status to coin details
  - [ ] Show last sync date
  - [ ] Show Numista collection name
  - [ ] Show collected item ID
  - [ ] Show "View on Numista" link (deep link)
- [ ] Add filter by sync status
  - [ ] Synced
  - [ ] Not Synced
  - [ ] Sync Failed
  - [ ] Show counts
- [ ] Add sort by sync date
  - [ ] Most recently synced
  - [ ] Least recently synced
  - [ ] Never synced

**Files to Modify:**
- `src/renderer/app.js` (ADD sync icon rendering)
- `src/renderer/index.html` (ADD filter option)
- `src/renderer/styles/main.css` (ADD icon styling)

**Deliverable:** Visual sync status indicators

**UI Examples:**
```
Coin List:
┌────────────────────────────────────────────────────────┐
│ [img] 1943 Lincoln Cent                       📤       │
│       United States • Steel                            │
│       Basic: ✅  Issue: ✅  Pricing: 🟢                 │
│       Synced to Numista: Feb 1, 2026                   │
└────────────────────────────────────────────────────────┘

Coin Details:
┌────────────────────────────────────────────────────────┐
│ Numista Sync Status                                    │
├────────────────────────────────────────────────────────┤
│ ✅ Synced to Numista                                   │
│ Collection: Main Collection                            │
│ Synced: Feb 1, 2026 at 2:30 PM                        │
│ Collected Item ID: 987654                              │
│                                                         │
│ [View on Numista] [Update Sync Data]                  │
└────────────────────────────────────────────────────────┘
```

---

### 3.6 - Batch Add Feature ⭐ EFFICIENCY

**Priority:** LOW - Nice to have
**Estimated Time:** 2 days

**Tasks:**
- [ ] Add "Batch Add to Numista" feature
  - [ ] Select multiple coins (checkboxes)
  - [ ] Show count: "5 coins selected"
  - [ ] "Add Selected to Numista" button
- [ ] Implement batch processing
  - [ ] Validate all selected coins (have Numista ID)
  - [ ] Show summary: "5 ready, 2 errors"
  - [ ] Process sequentially (respect API rate limit)
  - [ ] Show progress bar
  - [ ] Update metadata for each success
  - [ ] Collect errors for failed coins
- [ ] Show batch results
  - [ ] "✅ 5 coins added successfully"
  - [ ] "⚠️ 2 coins failed: ..."
  - [ ] Detailed error list
  - [ ] "Retry Failed" button
- [ ] Rate limiting
  - [ ] Respect API quota (e.g., 1 call per second)
  - [ ] Show estimated time
  - [ ] Allow cancel mid-batch

**Files to Modify:**
- `src/renderer/index.html` (ADD batch UI)
- `src/renderer/app.js` (ADD batch logic)
- `src/main/index.js` (ADD batch-add handler with rate limiting)

**Deliverable:** Efficient multi-coin sync

**UI Mock:**
```
┌──────────────────────────────────────────────────────────┐
│ Batch Add to Numista                                     │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ 15 coins selected                                        │
│ 13 ready to add (have Numista ID)                       │
│ 2 cannot be added (missing Numista ID)                  │
│                                                           │
│ Target Collection: [Main Collection ▼]                  │
│ Grade Handling: [Use existing grades]                   │
│                                                           │
│ Progress: [████████░░] 8/13                             │
│ Estimated time: 5 seconds remaining                     │
│                                                           │
│ ✅ 1943 Lincoln Cent - Added                            │
│ ✅ 1944 Mercury Dime - Added                            │
│ ⚠️ 1945 Wheat Penny - Failed (API error)                │
│ ...                                                      │
│                                                           │
│ [Pause]  [Cancel]                                       │
└──────────────────────────────────────────────────────────┘
```

---

### 3.7 - Update Existing Coin Feature ⭐ ADVANCED

**Priority:** LOW - Future enhancement
**Estimated Time:** 2 days

**Tasks:**
- [ ] Implement "Update on Numista" feature
  - [ ] Only available if already synced
  - [ ] Fetch current data from Numista (verify exists)
  - [ ] Compare OpenNumismat vs Numista data
  - [ ] Show differences
  - [ ] Allow user to select which changes to push
  - [ ] Call `PATCH /users/{user_id}/collected_items/{item_id}`
  - [ ] Update metadata timestamp
- [ ] Handle edge cases
  - [ ] Coin deleted from Numista → mark as NOT_SYNCED
  - [ ] Data conflicts → user decides
  - [ ] Numista has newer data → warn user

**Files to Modify:**
- `src/modules/numista-api.js` (ADD updateCollectedItem method)
- `src/renderer/app.js` (ADD update flow)

**Deliverable:** Ability to update existing Numista coins

**Note:** This is Phase 3 stretch goal, can be deferred to Phase 4

---

## Implementation Timeline

### Week 1: OAuth Foundation
**Days 1-2:**
- [ ] 3.1 - OAuth 2.0 Integration
- [ ] Test authentication thoroughly
- [ ] Secure token storage

**Day 3:**
- [ ] 3.2 - Data Mapper (reverse direction)
- [ ] Test all mapping scenarios

**Days 4-5:**
- [ ] 3.3 - Collection Selection UI
- [ ] User testing of OAuth + Collections

**Deliverable:** Working authentication and data mapping

---

### Week 2: Core Add Functionality
**Days 1-2:**
- [ ] 3.4 - Add Coin UI & Flow
- [ ] Test single coin add

**Day 3:**
- [ ] 3.5 - Sync Status Display
- [ ] UI polish

**Days 4-5:**
- [ ] Bug fixes and refinement
- [ ] User testing
- [ ] Documentation

**Deliverable:** Complete single-coin add feature

---

### Week 3: Advanced Features (Optional)
**Days 1-3:**
- [ ] 3.6 - Batch Add Feature
- [ ] Rate limiting and progress tracking

**Days 4-5:**
- [ ] 3.7 - Update Existing Coin (stretch goal)
- [ ] Final testing and polish

**Deliverable:** Complete Phase 3 feature set

---

## Dependencies

### Task Dependencies
```
3.1 (OAuth 2.0)
  ├─> 3.2 (Data Mapper)
  │    ├─> 3.4 (Add Coin UI)
  │    │    ├─> 3.5 (Sync Status)
  │    │    └─> 3.6 (Batch Add)
  │    └─> 3.7 (Update Coin)
  └─> 3.3 (Collection Selection) ─> 3.4 (Add Coin UI)
```

**Critical Path:** 3.1 → 3.2 → 3.4

**Parallel Work:**
- 3.3 can be done in parallel with 3.2
- 3.5 can be done in parallel with final testing

---

## Data Flow Architecture

### Add Coin to Numista Flow

```
1. User clicks "Add to Numista" on coin
   ↓
2. Check Authentication
   - Token valid? → Continue
   - Token expired? → Request new token
   - No token? → Show setup instructions
   ↓
3. Check Prerequisites
   - Has Numista ID? → Continue
   - No Numista ID? → Error: "Enrich from Numista first"
   ↓
4. Load User's Collections (cached or fetch)
   ↓
5. Check Duplicate
   - Metadata has sync status? → Warn user
   - No sync status? → Continue
   ↓
6. Map OpenNumismat Data to Numista Format
   - Extract all fields
   - Map grade (with preview)
   - Select price (based on grade)
   - Format date
   - Strip metadata from notes
   ↓
7. Show Preview Modal
   - Prefilled data
   - Collection selector
   - Editable fields
   - "Preview JSON" option
   ↓
8. User Confirms → Call API
   POST /users/{user_id}/collected_items
   Headers:
     - Numista-API-Key: {apiKey}
     - Authorization: Bearer {accessToken}
   Body: {mapped coin data}
   ↓
9. Handle Response
   Success (201):
     - Extract collected_item.id
     - Update metadata (numistaSync section)
     - Write metadata to database
     - Show success message
     - Update UI (sync icon)

   Error (400/401/500):
     - Parse error message
     - Show user-friendly error
     - Offer retry
     - Log for debugging
   ↓
10. Update Progress Tracker
    - Increment sync count
    - Update statistics
```

---

## API Endpoints Used

### Authentication
- `GET /oauth_token` - Get OAuth access token

### Collection Management
- `GET /users/{user_id}/collections` - List user's collections
- `GET /users/{user_id}/collected_items` - List collected items (for duplicate check)
- `POST /users/{user_id}/collected_items` - Add item to collection
- `PATCH /users/{user_id}/collected_items/{item_id}` - Update item (Phase 3.7)
- `DELETE /users/{user_id}/collected_items/{item_id}` - Delete item (future)

### User Info (Optional)
- `GET /me` - Get authenticated user info (if available, for auto-detecting user ID)

---

## Testing Strategy

### Unit Testing
- [ ] OAuth token request (valid/invalid key)
- [ ] Token storage and retrieval
- [ ] Token expiration detection
- [ ] Grade mapping (all variations)
- [ ] Price selection logic
- [ ] Data mapping (all fields)
- [ ] Metadata stripping (preserve user notes)
- [ ] Duplicate detection

### Integration Testing
- [ ] OAuth flow end-to-end
- [ ] Add coin (all required fields)
- [ ] Add coin (minimal fields)
- [ ] Add coin with issue ID
- [ ] Add coin without issue ID
- [ ] Collection selection
- [ ] Duplicate warning
- [ ] Error handling (API errors)
- [ ] Metadata update after sync

### User Acceptance Testing
- [ ] Setup OAuth credentials
- [ ] Add single coin
- [ ] Add coin with custom grade
- [ ] Add coin with price
- [ ] Add to different collection
- [ ] Batch add (if implemented)
- [ ] View sync status
- [ ] Filter by sync status
- [ ] Handle API errors gracefully
- [ ] Token expiration and refresh

### Performance Testing
- [ ] Batch add 100 coins (with rate limiting)
- [ ] Token refresh under load
- [ ] Large collection selection dropdown

### Security Testing
- [ ] Token storage encryption
- [ ] Token not logged/exposed
- [ ] API key not logged/exposed
- [ ] Secure settings file permissions

---

## Success Criteria

### Phase 3 Complete When:
- [ ] ✅ OAuth 2.0 authentication working
- [ ] ✅ Token storage secure (encrypted)
- [ ] ✅ User can add single coin to Numista
- [ ] ✅ Grade mapping works correctly
- [ ] ✅ Price selection works correctly
- [ ] ✅ Collection selection works
- [ ] ✅ Duplicate detection working
- [ ] ✅ Sync status displayed in UI
- [ ] ✅ Metadata updated after sync
- [ ] ✅ Filter by sync status works
- [ ] ✅ Error handling comprehensive
- [ ] ✅ User documentation complete

### Stretch Goals (Optional):
- [ ] Batch add feature
- [ ] Update existing coin feature
- [ ] Auto-sync on merge

### Quality Metrics:
- [ ] No tokens logged or exposed
- [ ] No API key leaks
- [ ] Graceful handling of all API errors
- [ ] No data loss on sync failures
- [ ] User notes preserved after sync
- [ ] Token refresh works automatically
- [ ] Batch operations respect rate limits

---

## Risk Assessment

### High Risk
- **Security: Token/API key exposure** - Could compromise user's Numista account
  - Mitigation: Encrypt storage, never log tokens, security audit

- **Data loss: Metadata corruption** - Sync status could corrupt user notes
  - Mitigation: Use existing metadata manager, extensive testing

- **API quota exhaustion** - Batch operations could hit rate limits
  - Mitigation: Implement rate limiting, show quota warnings

### Medium Risk
- **Duplicate coins in Numista** - User adds same coin twice
  - Mitigation: Check metadata, warn user, API duplicate detection

- **Grade mapping failures** - Non-standard grades can't map
  - Mitigation: Show preview, allow manual override, omit if can't map

- **OAuth token expiration mid-batch** - Token expires during batch add
  - Mitigation: Check expiry before each call, auto-refresh

### Low Risk
- **Collection selection errors** - User has no collections
  - Mitigation: Clear error message, link to Numista

- **Network failures** - API unreachable
  - Mitigation: Retry logic, offline detection, error messages

---

## Security Considerations

### Token Storage
**Requirement:** Access tokens must be stored securely

**Options:**
1. **electron-store with encryption**
   ```javascript
   const Store = require('electron-store');
   const store = new Store({
     encryptionKey: 'user-specific-key'
   });
   ```

2. **Electron safeStorage API** (Electron 13+)
   ```javascript
   const { safeStorage } = require('electron');
   const encrypted = safeStorage.encryptString(token);
   ```

3. **node-keytar** (OS keychain)
   ```javascript
   const keytar = require('keytar');
   await keytar.setPassword('numismat-app', 'oauth-token', token);
   ```

**Recommendation:** Use Electron safeStorage (simplest, built-in)

### API Key Protection
- Never log API key
- Never include in error messages
- Store in encrypted settings
- Clear from memory after use

### HTTPS Only
- All API calls over HTTPS
- Validate SSL certificates
- No mixed content

---

## User Documentation Requirements

### Setup Guide
- [ ] How to get Numista API key
- [ ] How to find Numista User ID
- [ ] How to configure OAuth
- [ ] How to test connection

### User Manual
- [ ] How to add single coin
- [ ] How to select collection
- [ ] How to handle grade mapping
- [ ] How to batch add coins
- [ ] How to view sync status
- [ ] How to filter by sync status

### Troubleshooting
- [ ] "Invalid API key" error
- [ ] "Token expired" error
- [ ] "Quota exceeded" error
- [ ] "Network error" solutions
- [ ] "Duplicate coin" warning

---

## Future Enhancements (Phase 4)

Potential features for Phase 4:
- [ ] **Two-way sync** - Download from Numista to OpenNumismat
- [ ] **Conflict resolution** - Handle data conflicts intelligently
- [ ] **Auto-sync** - Automatically sync after enrichment
- [ ] **Sync history** - Track all sync operations
- [ ] **Bulk update** - Update multiple coins at once
- [ ] **Delete from Numista** - Remove coins from online collection
- [ ] **Swap marketplace integration** - Mark for swap, browse swap offers
- [ ] **Image upload** - Upload OpenNumismat images to Numista
- [ ] **Wishlist sync** - Sync wishlist items
- [ ] **Collection statistics** - Compare local vs cloud stats

---

## Notes & Decisions Log

**2026-02-01:**
- Decided on Client Credentials OAuth flow (simplest for desktop app)
- Chose one-way sync (OpenNumismat → Numista) to avoid conflicts
- Manual, selective sync (user controls what gets added)
- Metadata extension for sync status tracking
- Comprehensive grade mapping with user override
- Price selection based on grade
- Secure token storage using Electron safeStorage

**Architecture Decision: One-Way Sync Rationale**
- OpenNumismat is source of truth (local, controlled by user)
- Numista is backup/cloud/sharing platform
- Two-way sync creates conflicts (which data is newer?)
- User can manage Numista collection on website if needed
- Simplifies implementation significantly
- Can add two-way sync in Phase 4 if demand exists

---

**Document Status:** PLANNING COMPLETE - Ready for Implementation
**Next Action:** Begin Task 3.1 - OAuth 2.0 Integration
**Dependencies:** Phase 2 must be complete (metadata system required)

---

## Appendix A: Example API Request

### Add Coin to Numista (Complete Example)

**Request:**
```http
POST https://api.numista.com/v3/users/12345/collected_items
Headers:
  Numista-API-Key: i883i335qeAa8fFHKXbWfkoIyZ1wuWJmvulRgwuA
  Authorization: Bearer abc123xyz789...
  Content-Type: application/json

Body:
{
  "type": 11331,
  "issue": 63444,
  "quantity": 1,
  "grade": "xf",
  "for_swap": false,
  "private_comment": "Beautiful example from grandfather's collection",
  "price": {
    "value": 2.50,
    "currency": "USD"
  },
  "storage_location": "Safe - Drawer 2",
  "acquisition_place": "Local coin shop",
  "acquisition_date": "2024-12-15",
  "weight": 2.70,
  "size": 19.0
}
```

**Response (Success):**
```json
{
  "id": 987654,
  "type": 11331,
  "issue": 63444,
  "quantity": 1,
  "grade": "xf",
  "for_swap": false,
  "private_comment": "Beautiful example from grandfather's collection",
  "price": {
    "value": 2.50,
    "currency": "USD"
  },
  "storage_location": "Safe - Drawer 2",
  "acquisition_place": "Local coin shop",
  "acquisition_date": "2024-12-15",
  "weight": 2.70,
  "size": 19.0,
  "collection": {
    "id": 5,
    "name": "Main Collection"
  }
}
```

**Response (Error):**
```json
{
  "error": {
    "code": "INVALID_VALUE",
    "message": "Invalid value for parameter 'grade'",
    "parameter": "grade"
  }
}
```

---

## Appendix B: Settings File Extension

### Extended Settings Structure

```json
{
  "version": "2.0",
  "collectionPath": "C:\\Users\\User\\Documents\\my-collection.db",

  "apiConfiguration": {
    "apiKey": "i883i335qeAa8fFHKXbWfkoIyZ1wuWJmvulRgwuA",
    "userId": 12345,
    "rateLimit": 2000
  },

  "oauthData": {
    "tokenEncrypted": "...",
    "tokenExpiry": 1738512000000,
    "lastAuthentication": "2026-02-01T14:30:00Z"
  },

  "numistaSync": {
    "enabled": true,
    "defaultCollectionId": 5,
    "defaultCollectionName": "Main Collection",
    "autoSyncOnMerge": false,
    "gradeMapping": {
      "Extremely Fine": "xf",
      "Very Fine": "vf",
      "Custom Grade 1": "unc"
    }
  },

  "fetchSettings": {
    "basicData": true,
    "issueData": true,
    "pricingData": true
  },

  "fieldMappings": { ... },
  "uiPreferences": { ... }
}
```

---

**End of Phase 3 Work Plan**
