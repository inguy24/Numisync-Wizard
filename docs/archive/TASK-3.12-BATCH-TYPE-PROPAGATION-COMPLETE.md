# Task 3.12 - Batch Type Data Propagation

**Status:** ✅ COMPLETE
**Priority:** MEDIUM
**Dependencies:** 3.8 (Licensing System - Complete)
**License Required:** YES for applying to other coins (detection is free)
**Created:** February 5, 2026
**Completed:** February 6, 2026

### Implementation Progress

| Sub-Task | Status | Notes |
|----------|--------|-------|
| 3.12.1 Similar Coins Detection | ✅ Complete | `findMatchingCoins()` in app.js |
| 3.12.2 Post-Merge Detection Prompt | ✅ Complete | Modal with coin lists |
| 3.12.3 Type Data Propagation | ✅ Complete | Premium-gated, IPC handler |
| 3.12.4 Silent Type Data Reuse | ✅ Complete | `typeDataCache` in index.js, cleared on collection load |
| 3.12.5 Catalog Number Normalization | ✅ Complete | `normalizeCatalogNumber()` |
| 3.12.6 Field Mapping Awareness | ✅ Complete | `getCatalogSlotMapping()` |
| 3.12.7 Empty Mintmark Setting | ✅ Complete | Radio buttons in Data Settings, saves to fetchSettings |
| 3.12.8 Issue/Pricing Matching | ✅ Complete | Privy marks/signatures detection, respects empty mintmark setting |
| 3.12.9 Skipped Coins Handling | ✅ Complete | Detailed skip tracking with reasons in results modal |
| 3.12.10 User Manual Update | ✅ Complete | Documented in user-manual.html |
| 3.12.11 Auto-Propagate Toggle | ✅ Complete | Checkbox in Data Settings to enable/disable feature |

---

## Executive Summary

When a user enriches a coin, detect other coins in the collection that share the same Numista type (via numistaId or matching catalog numbers). Offer to propagate TYPE-LEVEL data to all matching coins, saving API calls and user time. This is a premium feature - detection is free (demonstrates value), but applying data requires a license.

Additionally, for TRUE DUPLICATES (same type + year + mintmark), issue and pricing data can also be propagated automatically.

---

## Problem Statement

User has multiple coins sharing the same Numista type ID (e.g., 35 Lincoln cents). When enriching one coin, the **type-level data** (title, material, weight, diameter, designs, etc.) is identical for all coins of that type. Currently, users must enrich each coin individually, wasting API calls on redundant type lookups.

**Example:** User has 35 Lincoln Wheat Cents (1909-1958). All share:
- Same title, material, weight, diameter
- Same design descriptions
- Same Krause catalog number (KM# 132)

But each has unique:
- Year, mintmark
- Mintage figures
- Pricing data

---

## Data Structure Context

| Data Level | Source API | Example Fields | Shared Across Type? |
|------------|-----------|----------------|---------------------|
| **Type-level** | `/types/{id}` | title, material, weight, diameter, shape, edge, designs, catalog numbers, images | YES |
| **Issue-level** | `/types/{id}/issues` | mintage, mintmark | NO - varies by year/mint |
| **Pricing** | `/types/{id}/issues/{issueId}/prices` | price1-4 (F/VF/XF/UNC grades) | NO - varies by issue |

**Key Insight:** Type-level data is fetched once from Numista but is identical for ALL coins of that type. Propagating this data saves API calls and ensures consistency.

---

## Feature Requirements

### User Decisions (from planning session)

1. **Detection:** Match by catalog number across ALL 4 catalog slots, plus numistaId in metadata
2. **Certainty:** Must be 100% match - no "may be", only definitive matches
3. **Conflicts:** Show comparison for each coin - let user choose per field
4. **Trigger:** Post-merge prompt when matching coins detected
5. **Premium Model:** Free detection, premium action
   - Show matching coins list for FREE (demonstrates value to convert users)
   - Applying type data to ANY coins requires license
6. **API Optimization:** Silent reuse - if type data already fetched for another coin, reuse automatically without prompting
7. **Search Scope:** Search ALL coins in collection (`AppState.allCoins`), not just the visible 100 (pagination)

---

## Catalog Number Matching Strategy

### The Challenge

OpenNumismat has 4 catalog slots (`catalognum1`, `catalognum2`, `catalognum3`, `catalognum4`). The field mapping configuration (in settings) determines which Numista catalog goes to which slot.

**Example field mapping:**
```javascript
catalognum1 → Krause#
catalognum2 → Numista#
catalognum3 → Schön#
catalognum4 → (user configured)
```

### Where to Find Field Mapping

The field mapping is stored in settings and can be retrieved via:
- `src/modules/settings-manager.js` - `getFieldMappings()` method
- `src/modules/default-field-mapping.js` - Default mapping configuration

Each catalog slot has a `catalogCode` property that indicates which Numista catalog it maps to (e.g., "Krause", "Numista", "Schön").

### Matching Logic (Priority Order)

**Step 1: Check Numista ID (Gold Standard)**
- If target coin has `metadata.basicData.numistaId` that matches the enriched coin's numistaId
- This is **100% definitive** - the coin IS the same type
- No further catalog checks needed - return as match immediately

**Step 2: Catalog Number Matching (Strict - All Must Match)**
- Only checked if Numista ID doesn't match (coin not yet enriched)
- Get enriched coin's catalog references from Numista data (array of `{ catalog, number }`)
- For each **non-empty** catalog slot in the target coin:
  - Determine which catalog it maps to (from field mapping settings)
  - Normalize the value: strip prefix ("Krause# ", "KM# ", etc.), keep full number
  - Compare against enriched coin's matching catalog reference
- **Match requires:** ALL populated catalog slots must match
- **If ANY slot conflicts:** NOT a match (we can't know which catalog number is wrong)

### Matching Examples

| Target Coin Catalogs | Numista Data | Result | Reason |
|---------------------|--------------|--------|--------|
| numistaId: 12345 | numistaId: 12345 | ✅ MATCH | Numista ID is gold standard |
| Krause# 132, Numista# 5678, Schön# 45 | Krause# 132, Numista# 5678, Schön# 45 | ✅ MATCH | All 3 populated slots match |
| Krause# 132 (only one filled) | Krause# 132, Numista# 5678, Schön# 45 | ✅ MATCH | All populated slots match (just 1) |
| Krause# 132, Numista# 5678, Schön# 45 | Krause# 132, Numista# 5678, Schön# 99 | ❌ NO MATCH | Schön conflict - can't trust any |
| Krause# 132, Numista# 9999 | Krause# 132, Numista# 5678 | ❌ NO MATCH | Numista conflict |
| (all empty) | Krause# 132, Numista# 5678 | ❌ NO MATCH | No data to compare |

**Rationale:** If one catalog matches but another doesn't, we can't determine which is incorrect - the matching one could be a coincidence, or the non-matching one could be a typo. Playing it safe by requiring ALL populated slots to match.

### Alphanumeric Number Preservation

Catalog numbers can be alphanumeric - preserve the FULL number after stripping prefix:

| Raw Value in DB | Prefix to Strip | Preserved Number |
|-----------------|-----------------|------------------|
| `Krause# 322.1b` | `Krause# ` | `322.1b` |
| `KM# A123` | `KM# ` | `A123` |
| `KM-45a` | `KM-` | `45a` |
| `322.1b` | (none) | `322.1b` |

**Known Prefixes to Strip:**
- `Krause# `, `Krause#`, `Krause `
- `KM# `, `KM#`, `KM-`, `KM `
- `Schön# `, `Schön#`, `Schön `
- `Numista# `, `Numista#`, `N# `

**Important:** Only strip prefixes, preserve everything after (including letters like "b" in "322.1b").

---

## Two-Tier Matching: Duplicates vs Same-Type

### The Distinction

When we find coins matching by type (numistaId or catalog numbers), we must further categorize them:

| Category | Definition | What Can Be Applied |
|----------|------------|---------------------|
| **True Duplicates** | Same type + same year + same mintmark | ALL data (type + issue + pricing) - auto-apply |
| **Same Type, Different Issue** | Same type, but different year OR mintmark | Type data only (issue/pricing requires exact match) |

### Example: User Enriches 1923-D Lincoln Cent

After enrichment, system finds 34 matching coins:
```
Found 34 coins of the same type (Lincoln Cent - Wheat Ears):

TRUE DUPLICATES (3 coins) - Can auto-apply ALL data:
  • 1923-D Lincoln Cent (AU condition)
  • 1923-D Lincoln Cent (VF condition)
  • 1923-D Lincoln Cent (G condition)

SAME TYPE, DIFFERENT ISSUES (31 coins) - Type data only:
  • 1923 Lincoln Cent (Philadelphia)
  • 1923-S Lincoln Cent
  • 1924-D Lincoln Cent
  • 1925 Lincoln Cent
  • ... and 27 more
```

### Why This Matters

- **True duplicates**: The enriched coin's issue data (mintage for 1923-D, pricing for 1923-D) applies directly
- **Different issues**: The mintage and pricing are DIFFERENT - 1923-P has different mintage than 1923-D

### Issue Matching Complexity

Numista issues aren't always distinguished by just year + mintmark. The API returns these issue-level fields:

| Numista Issue Field | OpenNumismat Field | Can We Match? |
|---------------------|-------------------|---------------|
| `year` | `year` | ✅ Yes |
| `mint_letter` | `mintmark` | ✅ Yes (with normalization) |
| `comment` | `type` | ✅ Yes ("Proof" vs regular circulation) |
| `marks` (privy marks array) | ❌ No equivalent | ❌ Must skip |
| `signatures` (mint master) | ❌ No equivalent | ❌ Must skip |

**Example:** A French coin might have 3 issues for 1923:
- 1923 with cornucopia privy mark (in `marks` array)
- 1923 with torch privy mark
- 1923 with wing privy mark

Since OpenNumismat has no field for privy marks, we CANNOT distinguish these → must skip.

### Smart Issue Matching Algorithm

Before attempting batch issue matching, analyze what differentiates the issues:

```javascript
// Step 1: Get all issues for this type
const issues = await api.getIssues(typeId);

// Step 2: Check what fields actually vary
const yearVaries = new Set(issues.map(i => i.year)).size > 1;
const mintVaries = new Set(issues.map(i => i.mint_letter)).size > 1;
const commentVaries = issues.some(i => i.comment) && issues.some(i => !i.comment);
const marksVary = issues.some(i => i.marks?.length > 0);

// Step 3: Determine if we can match
if (marksVary) {
  // Issues differ by privy marks - no OpenNumismat field to compare
  // → Cannot batch match issue data, must skip
}
```

**Matching Rule:**
- If issues only differ by year/mintmark/type (comment) → We can batch match
- If issues differ by marks/signatures → Must skip (no way to verify match)

**Fields we CAN use for issue matching:**
- `year` ↔ `year`
- `mint_letter` ↔ `mintmark` (normalized comparison)
- `comment` ↔ `type` (Proof indicator)

### Skipped Coins Handling

When coins cannot be matched for issue/pricing (but CAN receive type data):

1. **Track skipped coins** with reason for skipping
2. **Show in results summary:**
   ```
   Batch Update Results:
   ├── 3 coins updated (full data - true duplicates)
   ├── 28 coins updated (type data only)
   └── 3 coins SKIPPED for issue/pricing:
       • 1923-D Lincoln (issue has privy marks - can't verify)
       • 1924-P Lincoln (multiple issues match - ambiguous)
   ```
3. **User can enrich skipped coins individually** through normal flow
4. **Store skip status in metadata** for visibility:
   ```json
   {
     "batchProcessed": {
       "typeDataApplied": true,
       "issueDataSkipped": true,
       "skipReason": "Issue distinguished by privy marks - no OpenNumismat field"
     }
   }
   ```

### Settings Dependency

This issue/pricing propagation only matters if user has these enabled in data settings:
- If `issueData: false` in settings → don't propagate mintage/mintmark anyway
- If `pricingData: false` in settings → don't propagate pricing anyway
- If only type data enabled → all matching coins get same treatment (type-only)

### Empty Mintmark Setting (New)

Add to Data Settings a preference for how empty mintmark is interpreted during matching:

```
Empty Mintmark Interpretation:
○ "No mint mark" - matches other empty mintmarks (e.g., Philadelphia pre-1980)
○ "Unknown" - skip coins with empty mintmark for issue matching
```

**Default:** "No mint mark" (matches empty to empty)

**Applies to BOTH flows:**
- Single coin enrichment: affects issue matching in `numista-api.js`
- Batch operations: affects duplicate detection

**UI Reminder:** In the batch update prompt, show current setting:
```
┌─────────────────────────────────────────────────────────────┐
│  Found 34 coins of the same type                            │
│  (Lincoln Cent - Wheat Ears, Krause# 132)                   │
│                                                             │
│  TRUE DUPLICATES (3 coins):                                 │
│    • 1923-D Lincoln Cent (AU)                               │
│    • 1923-D Lincoln Cent (VF)                               │
│    ...                                                      │
│                                                             │
│  ℹ️ Empty mintmark = "No mint mark" [Change in Settings]    │
│                                                             │
│  [Apply to This Coin Only]  [Apply to All 💎]               │
└─────────────────────────────────────────────────────────────┘
```

This informs users of the current setting without requiring extra confirmation.

---

## Workflow Examples

### Scenario A: User Enriches First Coin of a Type

1. User selects and enriches "1923-P Lincoln Cent"
2. User completes field comparison and clicks "Merge Selected Fields"
3. System saves numistaId and catalog numbers to coin's metadata
4. **Post-merge:** System calls `findMatchingCoins()` searching `AppState.allCoins`:
   - **First:** Same numistaId in metadata (gold standard - 100% match)
   - **Then:** Catalog number matching (strict - ALL populated slots must match)
5. For each candidate coin:
   - If numistaId matches → immediate match
   - If no numistaId, check catalog slots:
     - Coin has Krause# 132 only → matches (all populated = 1 slot matches)
     - Coin has Krause# 132, Schön# 45 → only matches if BOTH match Numista data
     - Coin has Krause# 132, Schön# 99 (wrong) → NOT a match (conflict)
6. Finds 34 other Lincoln cents that pass strict matching
7. Shows prompt with list of all 34 coins by title
8. User chooses:
   - **[Apply to This Coin Only]** - Free, just saves current coin
   - **[Apply to All 34 💎]** - Premium, triggers license check

### Scenario B: User Enriches Second Coin of Same Type (Silent Reuse)

1. User selects "1924-D Lincoln Cent" for enrichment
2. User enters/confirms Numista type ID
3. **Before API call:** System checks if any coin in `AppState.allCoins` has same numistaId
4. Finds "1923-P Lincoln Cent" already has this numistaId in metadata
5. **Silently reuses** type data from 1923-P - no prompt, no user awareness needed
6. System still fetches issue-specific data (1924-D mintage, pricing) - that's unique
7. User sees field comparison as normal, unaware that type API call was skipped

**Rationale:** If 100% certain it's the same type, be respectful of Numista's API quota and reuse cached data automatically. Users don't need to understand API mechanics.

---

## Implementation Sub-Tasks

### 3.12.1 - Similar Coins Detection (FREE)

**Location:** `src/renderer/app.js`

Create function:
```javascript
/**
 * Find coins in collection that match the enriched coin's type
 * @param {Object} enrichedCoin - The coin that was just enriched
 * @param {Object} numistaData - The Numista type data that was fetched
 * @returns {Array<{coin: Object, matchReason: string}>} Matching coins with reason
 */
function findMatchingCoins(enrichedCoin, numistaData) {
  // 1. Get numistaId from enriched coin's metadata
  // 2. Get catalog references from numistaData.references
  // 3. Search AppState.allCoins (ALL coins, not just visible)
  // 4. For each coin (excluding enrichedCoin):
  //    a. Check if metadata.basicData.numistaId matches (gold standard)
  //    b. Check if ALL non-empty catalognum1-4 match (strict)
  // 5. Return array of matches with match reason
}
```

**Key points:**
- Search `AppState.allCoins` (all loaded coins), NOT just `AppState.displayedCoins` (paginated view)
- Exclude the coin being enriched from results
- **Priority 1:** numistaId match = 100% definitive, no catalog check needed
- **Priority 2:** Catalog matching - ALL populated slots must match
- Return match reason for display (e.g., "Krause# 132")

### 3.12.2 - Post-Merge Detection Prompt (FREE detection, PREMIUM action)

**Location:** `src/renderer/app.js` - after merge completes
**Location:** `src/renderer/index.html` - modal HTML

After successful merge in the existing flow, add:

```javascript
// After merge completes successfully...
const matchingCoins = findMatchingCoins(currentCoin, numistaData);
if (matchingCoins.length > 0) {
  showTypeDataPrompt(currentCoin, matchingCoins, numistaData);
}
```

**Modal Design:**
```
┌─────────────────────────────────────────────────────────┐
│  Found 34 coins of the same type                        │
│  (Lincoln Cent - Wheat Ears, Krause# 132)               │
│                                                         │
│  TRUE DUPLICATES (3 coins):                             │
│  ┌─────────────────────────────────────────────────┐    │
│  │ • 1923-D Lincoln Cent (AU)                      │    │
│  │ • 1923-D Lincoln Cent (VF)                      │    │
│  │ • 1923-D Lincoln Cent (G)                       │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  SAME TYPE, DIFFERENT ISSUES (31 coins):                │
│  ┌─────────────────────────────────────────────────┐    │
│  │ • 1924-D Lincoln Cent                           │    │
│  │ • 1925 Lincoln Cent                             │    │
│  │ • 1925-S Lincoln Cent                           │    │
│  │ ... (scrollable)                                │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ℹ️ Empty mintmark = "No mint mark" [Settings]          │
│                                                         │
│  [Apply to This Coin Only]  [Apply to All 34 💎]        │
└─────────────────────────────────────────────────────────┘
```

**Button behavior:**
- "Apply to This Coin Only" - Dismisses modal, merge already complete (free)
- "Apply to All 34 💎" - Calls `requirePremiumFeature('batch-type-propagation')`, if licensed proceeds to propagation flow

### 3.12.3 - Type Data Propagation (PREMIUM)

**Location:** `src/renderer/app.js`

Add to PREMIUM_FEATURES config:
```javascript
const PREMIUM_FEATURES = {
  'fast-pricing': { ... },
  'batch-type-propagation': {
    name: 'Batch Type Data Propagation',
    description: 'Apply type data to all matching coins at once'
  }
};
```

**Propagation flow:**
1. User clicks "Apply to All" and passes license check
2. For each matching coin, show comparison modal (existing UI pattern)
3. User selects which fields to apply (checkboxes)
4. Apply ONLY type-level fields:
   - title, category, country, ruler, period
   - value, unit, material, weight, diameter, thickness, shape
   - edge, edgelabel, obversedesign, reversedesign
   - catalognum1-4, images
5. Update each coin's metadata:
   ```json
   {
     "basicData": {
       "status": "MERGED",
       "numistaId": 12345,
       "typePropagatedFrom": 67890,
       "propagatedAt": "2026-02-05T14:30:00Z"
     }
   }
   ```
6. Preserve user notes on each target coin

**Fields NOT to propagate (issue-specific):**
- mintage, mintmark
- price1, price2, price3, price4
- year (user's existing data)

### 3.12.4 - Silent Type Data Reuse (FREE - automatic)

**Location:** `src/renderer/app.js` - in the fetch flow, before API call
**Location:** `src/main/index.js` - `fetch-coin-data` IPC handler

Before calling `api.getType(typeId)`:
1. Search `AppState.allCoins` for any coin with `metadata.basicData.numistaId === typeId`
2. If found, retrieve that coin's type data (stored in the enriched fields)
3. Skip the type API call, use cached data
4. Continue with issue/pricing API calls as normal (those are unique per coin)

**No user notification** - this happens silently to be respectful of Numista's API.

**Console logging for debugging:**
```javascript
console.log(`[Silent Reuse] Type data for ${typeId} found in coin #${existingCoin.id}, skipping API call`);
```

### 3.12.5 - Catalog Number Normalization

**Location:** `src/renderer/app.js` (utility function)

```javascript
/**
 * Normalize a catalog number by stripping known prefixes
 * Preserves full alphanumeric number (e.g., "322.1b" stays "322.1b")
 * @param {string} rawValue - The raw catalog value from the database
 * @returns {string} Normalized catalog number
 */
function normalizeCatalogNumber(rawValue) {
  if (!rawValue || typeof rawValue !== 'string') return '';

  // Known prefixes to strip (case insensitive)
  const prefixes = [
    /^krause#?\s*/i,
    /^km[#\-\s]?\s*/i,
    /^schön#?\s*/i,
    /^numista#?\s*/i,
    /^n#\s*/i
  ];

  let normalized = rawValue.trim();
  for (const prefix of prefixes) {
    normalized = normalized.replace(prefix, '');
  }

  return normalized.trim();
}
```

**Test cases:**
- `"Krause# 322.1b"` → `"322.1b"`
- `"KM# A123"` → `"A123"`
- `"KM-45a"` → `"45a"`
- `"322.1b"` → `"322.1b"`
- `"km 123"` → `"123"`

### 3.12.6 - Field Mapping Awareness

**Location:** `src/renderer/app.js`

Need to know which Numista catalog is mapped to which OpenNumismat slot:

```javascript
/**
 * Get the catalog type assigned to each catalognum slot
 * @returns {Object} Mapping of slot to catalog type
 */
function getCatalogSlotMapping() {
  const fieldMappings = AppState.fieldMappings || getDefaultFieldMappings();

  return {
    catalognum1: fieldMappings.catalognum1?.catalogCode || 'Krause',
    catalognum2: fieldMappings.catalognum2?.catalogCode || 'Numista',
    catalognum3: fieldMappings.catalognum3?.catalogCode || null,
    catalognum4: fieldMappings.catalognum4?.catalogCode || null
  };
}
```

When comparing, ensure Krause numbers compare to Krause, Numista to Numista, etc.

### 3.12.7 - Empty Mintmark Setting

**Location:** `src/modules/settings-manager.js`, `src/renderer/app.js`

- Add new setting to Data Settings: `emptyMintmarkInterpretation`
  - Options: `"no_mint_mark"` | `"unknown"`
  - Default: `"no_mint_mark"` (matches empty to empty)
- **Apply to BOTH flows** (consistency):
  - Single coin enrichment: affects issue matching in `numista-api.js`
  - Batch operations: affects duplicate detection
- In batch prompt modal, show current setting with link to change
- When matching issues (either flow):
  - If setting is `"no_mint_mark"`: empty matches other empty
  - If setting is `"unknown"`: treat as ambiguous, prompt user to select issue
- Update settings UI in data settings section
- Save/load setting via settings-manager
- Update `smartIssueMatching()` in numista-api.js to respect this setting

### 3.12.8 - Issue/Pricing Matching for Duplicates (PREMIUM)

**Location:** `src/renderer/app.js`

- After type matching, further categorize coins:
  - **True Duplicates**: Same type + year + mintmark + type(comment) → auto-apply ALL data
  - **Same Type, Different Issue**: Different year/mintmark → type data only
- Check if issues vary by `marks` or `signatures` (privy marks, etc.)
  - If yes → cannot batch match issue data (no OpenNumismat field to compare)
  - Must skip issue/pricing for those coins
- For matchable duplicates:
  - Compare: `year` ↔ `year`, `mint_letter` ↔ `mintmark`, `comment` ↔ `type`
  - All must match exactly for issue/pricing propagation
  - Apply `emptyMintmarkInterpretation` setting when comparing mintmarks
- Respect data settings:
  - Only propagate issue data if `issueData: true` in settings
  - Only propagate pricing if `pricingData: true` in settings

### 3.12.9 - Skipped Coins Handling

**Location:** `src/renderer/app.js`

- Track coins that couldn't be matched for issue/pricing with reason
- Show results summary after batch operation:
  ```
  Batch Update Results:
  ├── 3 coins updated (full data - true duplicates)
  ├── 28 coins updated (type data only)
  └── 3 coins SKIPPED for issue/pricing:
      • 1923-D Lincoln (issue has privy marks - can't verify)
      • 1924-P Lincoln (multiple issues match - ambiguous)
  ```
- Store skip status in metadata for visibility:
  ```json
  {
    "batchProcessed": {
      "typeDataApplied": true,
      "issueDataSkipped": true,
      "skipReason": "Issue distinguished by privy marks - no OpenNumismat field"
    }
  }
  ```
- User can still enrich skipped coins individually through normal flow

### 3.12.10 - User Manual Update

**Location:** `docs/user-manual.html`

- Update after all implementation complete
- Document Auto-Propagate feature
- Explain duplicate vs same-type distinction
- Document premium gating and what's free vs paid
- Add troubleshooting for skipped coins

### 3.12.11 - Auto-Propagate Toggle

**Location:** `src/modules/settings-manager.js`, `src/renderer/app.js`, `src/renderer/index.html`

Add a toggle in Data Settings to enable/disable the Auto-Propagate feature. This allows users who don't want the post-merge detection prompt to turn it off.

**Implementation:**
- Add `enableAutoPropagate: true` to `fetchSettings` defaults in settings-manager.js
- Add checkbox in Data Settings modal (index.html)
- Update `populateSettings()` and `saveSettings()` in app.js
- Check `AppState.fetchSettings?.enableAutoPropagate` before showing prompt
- Update `PREMIUM_FEATURES` name to "Auto-Propagate" for consistency

**User-Facing Name:** "Auto-Propagate" - used consistently in:
- Setting ID: `enableAutoPropagate`
- UI label: "Auto-Propagate"
- PREMIUM_FEATURES: `name: 'Auto-Propagate'`

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/renderer/app.js` | `findMatchingCoins()`, `normalizeCatalogNumber()`, `getCatalogSlotMapping()`, `categorizeMatchingCoins()`, post-merge detection prompt, propagation logic, comparison modal handlers, silent reuse check, issue matching, skipped coins tracking, add to PREMIUM_FEATURES, Auto-Propagate toggle handling |
| `src/modules/numista-api.js` | Update `smartIssueMatching()` to respect `emptyMintmarkInterpretation` setting |
| `src/renderer/index.html` | Detection prompt modal HTML with coin list (grouped by duplicate/same-type/skipped), comparison modal, results summary modal, Auto-Propagate checkbox |
| `src/renderer/styles/main.css` | Modal styling, scrollable coin list, premium badge on button, skipped coins styling |
| `src/main/index.js` | IPC handler `propagate-type-data` for batch database updates, `propagate-issue-data` for duplicates |
| `src/main/preload.js` | Bridge methods `propagateTypeData()`, `propagateIssueData()` |
| `src/modules/settings-manager.js` | Add `emptyMintmarkInterpretation` setting, add `enableAutoPropagate` setting |
| `docs/PHASE3-WORK-PLAN.md` | Add Task 3.12 to the task list |
| `docs/user-manual.html` | Document Auto-Propagate feature, premium gating, skipped coins |

---

## Metadata Extension

When type data is propagated from another coin, track the source:

```json
{
  "version": "2.0",
  "basicData": {
    "status": "MERGED",
    "timestamp": "2026-02-05T14:30:00Z",
    "numistaId": 12345,
    "typePropagatedFrom": 67890,
    "propagatedAt": "2026-02-05T14:35:00Z",
    "fieldsMerged": ["title", "material", "weight", ...]
  },
  "batchProcessed": {
    "typeDataApplied": true,
    "issueDataSkipped": false,
    "skipReason": null
  },
  "issueData": { ... },
  "pricingData": { ... }
}
```

**New fields:**
- `typePropagatedFrom`: The coin ID that was the source of propagated type data
- `propagatedAt`: Timestamp when propagation occurred
- `batchProcessed`: Object tracking batch operation status and skip reasons

---

## Verification Checklist

### Type Matching
- [ ] Detection searches ALL coins (`AppState.allCoins`), not just visible 100
- [ ] **Numista ID match is gold standard** - immediate 100% match, no catalog check needed
- [ ] **Catalog matching is strict** - ALL populated slots must match, not just one
- [ ] **Catalog conflicts reject match** - if 1 matches but another doesn't, NOT a match
- [ ] Catalog matching respects field mapping (Krause to Krause, etc.)
- [ ] Catalog normalization preserves alphanumeric values ("322.1b", "A123")

### Issue/Pricing Matching (Duplicates)
- [ ] True duplicates identified (same type + year + mintmark + type/comment)
- [ ] Issue data only applied to true duplicates (not different issues)
- [ ] Detects when issues vary by `marks`/`signatures` → skips those coins
- [ ] Respects data settings (issueData/pricingData toggles)
- [ ] Skipped coins tracked with reason and shown in results
- [ ] Empty mintmark setting applies to BOTH batch AND single coin enrichment
- [ ] Single coin: empty mintmark + "unknown" setting → prompts user to pick issue

### UI/UX
- [ ] Prompt shows definitive "same type" language (not "may be")
- [ ] Prompt lists coins grouped: duplicates / same-type / skipped
- [ ] Prompt lists all matching coins by title (scrollable if many)
- [ ] "Apply to All" shows premium badge (💎)
- [ ] "Apply to All" triggers `requirePremiumFeature()` check
- [ ] "Apply to This Coin Only" works without license
- [ ] Results summary shows what was updated and what was skipped
- [ ] Empty mintmark setting displayed in prompt with link to settings

### Auto-Propagate Toggle (3.12.11)
- [ ] Checkbox appears in Data Settings modal with correct styling
- [ ] Default is enabled (checked)
- [ ] Setting persists after save and reload
- [ ] With setting ON: Auto-Propagate prompt appears after merge
- [ ] With setting OFF: prompt does NOT appear, merge completes silently
- [ ] PREMIUM_FEATURES uses name "Auto-Propagate" consistently

### Data Integrity
- [ ] Silent type reuse works when same numistaId already in another coin's metadata
- [ ] Silent reuse logs to console for debugging
- [ ] Comparison modal shows field-by-field differences for each target coin
- [ ] Only type-level fields propagated to same-type coins
- [ ] Issue/pricing only propagated to true duplicates
- [ ] Metadata tracks propagation source coin ID and timestamp
- [ ] User notes preserved on all target coins
- [ ] Skipped coins have metadata explaining skip reason
- [ ] IPC handler correctly updates database for batch propagation

### Documentation
- [ ] User manual updated with Auto-Propagate feature
- [ ] Premium vs free features documented
- [ ] Skipped coins troubleshooting documented
- [ ] Auto-Propagate toggle documented (how to enable/disable)

---

## What Gets Applied

### To ALL Matching Coins (Same Type)

**Type-Level Fields:**
- title, category, country, ruler, period
- value, unit, material
- weight, diameter, thickness, shape
- edge, edgelabel
- obversedesign, reversedesign
- catalognum1-4
- Images (obverseimg, reverseimg, edgeimg)

### To TRUE DUPLICATES Only (Same Type + Year + Mintmark)

**Issue-Level Fields** (if issueData enabled in settings):
- mintage

**Pricing Fields** (if pricingData enabled in settings):
- price1, price2, price3, price4

### NEVER Applied (Preserved Per-Coin)

- year (user's existing data)
- mintmark (user's existing data - used for matching, not overwritten)
- User's existing notes
- Any field the user unchecks in comparison modal

### SKIPPED Coins (Can't Match Issue)

When issue matching fails (e.g., privy marks vary):
- Type data IS applied
- Issue/pricing data is SKIPPED
- Metadata records skip reason
- User can enrich individually later

---

## Related Code References

**Existing patterns to follow:**
- Fast Pricing Mode: `src/renderer/app.js` lines 1413-1770 (batch selection, premium gating)
- Premium feature check: `requirePremiumFeature()` in app.js lines 677-761
- Field mapping: `src/modules/default-field-mapping.js` lines 161-610
- Metadata manager: `src/modules/metadata-manager.js`
- Merge flow: `src/main/index.js` `merge-data` IPC handler lines 1032-1138
- Issue matching: `src/modules/numista-api.js` `smartIssueMatching()`

**AppState structure:**
- `AppState.allCoins` - Array of ALL coins loaded from collection
- `AppState.displayedCoins` - Array of coins on current page (max 100)
- `AppState.fieldMappings` - Current field mapping configuration
