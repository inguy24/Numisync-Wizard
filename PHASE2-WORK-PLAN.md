# Phase 2 Work Plan - OpenNumismat Enrichment Tool

**Project:** OpenNumismat-Numista Data Enrichment Tool  
**Phase:** Phase 2 - Enhanced Features & User Experience  
**Date Created:** January 22, 2026  
**Status:** Planning Complete - Ready for Implementation

---

## Executive Summary

Phase 2 focuses on adding advanced features that make the tool more efficient, user-friendly, and reliable:
- **Granular status tracking** - Track basic data, issue data, and pricing separately
- **User-controlled data fetching** - Choose which data types to fetch (API quota management)
- **Image support** - Display and download coin images
- **Pricing freshness tracking** - Know when pricing was last updated
- **Persistent metadata storage** - Survives app reinstall and device changes
- **Enhanced filtering/sorting** - Filter by data type and freshness

---

## Architecture Decisions Summary

**IMPORTANT:** All three data types (Basic, Issue, Pricing) can be fetched INDEPENDENTLY. Basic data is NOT required.

| Decision Point | Choice | Rationale |
|----------------|--------|-----------|
| **Data Settings UI** | Settings button on main screen | Always visible, gives user control |
| **Data Independence** | All three data types optional | User can fetch only what they need (e.g., just pricing updates) |
| **Quota Tracking** | Session tracking only (honest) | Cannot accurately track API quota across sessions |
| **Issue Matching** | Auto-match year+mintmark, fallback to user picker | Smart automation + user control when needed |
| **Overall Coin Status** | Complete = user got what they requested | Flexible per-session goals |
| **Pricing Freshness Thresholds** | <3mo Current, <1yr Recent, <2yr Aging, >2yr Outdated | Based on Numista's update frequency |
| **Metadata Storage** | HTML comments in OpenNumismat `note` field | Survives reinstall, travels with database |
| **Storage Strategy** | Three-tier: Database/Settings/Cache | Balance permanence & performance |
| **Numista ID Storage** | Both catalog field AND metadata | Reliability + fast access |

---

## Storage Architecture

### Three-Tier Storage System

```
1. OpenNumismat Database (note field) - PERMANENT
   â””â”€ Per-coin enrichment metadata (status, timestamps, IDs, prices)
   â””â”€ Survives: App reinstall, device changes, database copies

2. Settings File (next to .db file) - PORTABLE
   â””â”€ Filename: {database-name}_settings.json
   â””â”€ API key, fetch settings, field mappings, UI preferences
   â””â”€ Survives: App reinstall (if database folder copied)

3. Session Cache (next to .db file) - TEMPORARY
   â””â”€ Filename: {database-name}_enrichment_progress.json
   â””â”€ Search cache, status lookup cache, session stats
   â””â”€ Rebuilt from database on each startup
```

### File Structure Example
```
C:\Users\User\Documents\My Coins\
â”œâ”€â”€ my-collection.db                           â† Database (metadata in notes)
â”œâ”€â”€ my-collection_settings.json                â† User preferences (SURVIVES)
â”œâ”€â”€ my-collection_enrichment_progress.json     â† Session cache (REBUILD)
â””â”€â”€ my-collection.db.backup.20260122-103000    â† Auto-backup
```

---

## Metadata Storage Format

### In OpenNumismat `note` Field (HTML Comments)

```
User's original notes go here. They can write whatever they want.
This is a beautiful example from my grandfather's collection.

<!-- NUMISMAT_ENRICHMENT_DATA
{
  "version": "1.0",
  "basicData": {
    "status": "MERGED",
    "timestamp": "2026-01-22T10:30:00Z",
    "numistaId": 420,
    "numistaIdField": "catalognum4",
    "fieldsMerged": ["title", "country", "weight", "diameter"]
  },
  "issueData": {
    "status": "MERGED",
    "timestamp": "2026-01-22T10:31:00Z",
    "issueId": 51757,
    "matchMethod": "AUTO_YEAR_AND_MINT",
    "fieldsMerged": ["mintmark", "mintage"]
  },
  "pricingData": {
    "status": "MERGED",
    "timestamp": "2025-07-15T14:20:00Z",
    "issueId": 51757,
    "currency": "USD",
    "fieldsMerged": ["price_unc", "price_xf", "price_vf", "price_fine"],
    "lastPrices": {
      "unc": 2.50,
      "xf": 1.50,
      "vf": 1.00,
      "fine": 0.75
    }
  }
}
END_NUMISMAT_ENRICHMENT_DATA -->
```

### Status Values

| Status | Meaning |
|--------|---------|
| `PENDING` | User selected this data type but hasn't processed yet |
| `MERGED` | Successfully fetched and merged |
| `NOT_QUERIED` | User didn't select this data type |
| `ERROR` | API call failed |
| `SKIPPED` | User chose to skip this coin |
| `NO_MATCH` | For issue data - couldn't match by year/mintmark |
| `NO_DATA` | API returned no data (e.g., no pricing available) |

---

## Pricing Freshness Thresholds

```javascript
function getPricingFreshness(timestamp) {
  if (!timestamp) return { icon: 'âšª', text: 'Never Updated' };
  
  const months = (Date.now() - new Date(timestamp)) / (1000 * 60 * 60 * 24 * 30);
  const years = months / 12;
  
  if (months < 3)  return { icon: 'ðŸŸ¢', text: 'Current' };
  if (years < 1)   return { icon: 'ðŸŸ¡', text: 'Recent' };
  if (years < 2)   return { icon: 'ðŸŸ ', text: 'Aging' };
  return { icon: 'ðŸ”´', text: 'Outdated' };
}
```

**Thresholds:**
- ðŸŸ¢ **Current:** < 3 months
- ðŸŸ¡ **Recent:** 3 months - 1 year  
- ðŸŸ  **Aging:** 1-2 years
- ðŸ”´ **Outdated:** > 2 years
- âšª **Never:** No pricing data

---

## Issue Matching Strategy

When fetching issue data (mintmark/mintage), use this logic:

```javascript
async function matchIssue(issues, userCoin) {
  const userYear = userCoin.year;
  const userMintmark = userCoin.mintmark;
  
  // Strategy 1: Try to match BOTH year AND mintmark
  if (userYear && userMintmark) {
    const exactMatch = issues.find(i => 
      i.year == userYear && 
      i.mint_letter == userMintmark
    );
    if (exactMatch) {
      return { type: 'AUTO_MATCHED', issue: exactMatch };
    }
  }
  
  // Strategy 2: Try year only
  if (userYear) {
    const yearMatches = issues.filter(i => i.year == userYear);
    
    if (yearMatches.length === 1) {
      // Only one match by year, use it
      return { type: 'AUTO_MATCHED', issue: yearMatches[0] };
    }
    
    if (yearMatches.length > 1) {
      // Multiple matches, ask user to pick
      return { type: 'USER_PICK', options: yearMatches };
    }
  }
  
  // Strategy 3: No year match, show all issues and let user pick
  return { type: 'USER_PICK', options: issues };
}
```

**User Picker UI:**
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Multiple Issues Found for 1943 Lincoln Cent         â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Your coin year: 1943                                 â”‚
â”‚ Your mintmark: (empty)                               â”‚
â”‚                                                       â”‚
â”‚ Select which issue matches your coin:                â”‚
â”‚                                                       â”‚
â”‚ â—‹ 1943-P (Philadelphia)                              â”‚
â”‚   Mintmark: P  â€¢  Mintage: 684,628,670              â”‚
â”‚                                                       â”‚
â”‚ â—‹ 1943-D (Denver)                                    â”‚
â”‚   Mintmark: D  â€¢  Mintage: 217,660,000              â”‚
â”‚                                                       â”‚
â”‚ â—‹ 1943-S (San Francisco)                            â”‚
â”‚   Mintmark: S  â€¢  Mintage: 191,550,000              â”‚
â”‚                                                       â”‚
â”‚ â—‹ Skip - I can't determine the correct mint         â”‚
â”‚                                                       â”‚
â”‚ [Apply Selection]  [Cancel]                          â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## Implementation Tasks

### 2.1 - Metadata Storage System â­ CRITICAL FOUNDATION

**Priority:** CRITICAL - Everything else depends on this  
**Estimated Time:** 2 days

**Tasks:**
- [ ] Create `src/modules/metadata-manager.js`
- [ ] Implement `readEnrichmentMetadata(noteField)`
  - [ ] Parse HTML comments (`<!-- NUMISMAT_ENRICHMENT_DATA ... -->`)
  - [ ] Extract user notes separately
  - [ ] Parse JSON metadata
  - [ ] Handle missing/malformed metadata gracefully
  - [ ] Return default structure if no metadata found
- [ ] Implement `writeEnrichmentMetadata(userNotes, metadata)`
  - [ ] Preserve existing user notes
  - [ ] Remove old metadata block
  - [ ] Append new metadata block
  - [ ] Format JSON with proper indentation
- [ ] Test with real notes to ensure no data loss
  - [ ] Test with no metadata (first time)
  - [ ] Test with existing metadata (update)
  - [ ] Test with malformed metadata (graceful failure)
  - [ ] Test with special characters in user notes

**Files to Create/Modify:**
- `src/modules/metadata-manager.js` (NEW)

**Deliverable:** Robust, tested metadata read/write system

**Testing Checklist:**
- [ ] User notes preserved exactly
- [ ] Metadata updates correctly
- [ ] Handles missing metadata
- [ ] Handles corrupted JSON
- [ ] No data loss on any operation

---

### 2.2 - Granular Status Tracking â­ CORE FEATURE

**Priority:** HIGH - Needed for all other features  
**Estimated Time:** 2 days

**Tasks:**
- [ ] Update `src/modules/progress-tracker.js`
  - [ ] Define status enum (PENDING, MERGED, NOT_QUERIED, ERROR, etc.)
  - [ ] Implement three-tier status structure (basicData/issueData/pricingData)
  - [ ] Track timestamps per data type
  - [ ] Track field-level merges (which fields were updated)
  - [ ] Store Numista ID in metadata (duplicate from catalognum)
  - [ ] Store Issue ID in metadata
  - [ ] Store previous prices for comparison
- [ ] Update statistics calculation
  - [ ] Calculate totals per data type
  - [ ] Calculate freshness statistics
  - [ ] Handle NOT_QUERIED vs PENDING distinction
- [ ] Update progress file format
  - [ ] Rebuild from database on startup
  - [ ] Keep as session cache only

**Files to Create/Modify:**
- `src/modules/progress-tracker.js` (MODIFY)
- `src/modules/metadata-manager.js` (INTEGRATE)

**Deliverable:** Complete per-coin, per-data-type tracking

**Data Structure:**
```javascript
{
  "id": 42,
  "basicData": {
    "status": "MERGED",
    "timestamp": "2026-01-22T10:30:00Z",
    "numistaId": 420,
    "numistaIdField": "catalognum4",
    "fieldsMerged": ["title", "country", "weight"]
  },
  "issueData": {
    "status": "MERGED",
    "timestamp": "2026-01-22T10:31:00Z",
    "issueId": 51757,
    "matchMethod": "AUTO_YEAR_AND_MINT",
    "fieldsMerged": ["mintmark", "mintage"]
  },
  "pricingData": {
    "status": "MERGED",
    "timestamp": "2025-07-15T14:20:00Z",
    "issueId": 51757,
    "currency": "USD",
    "fieldsMerged": ["price_unc", "price_xf", "price_vf", "price_fine"],
    "lastPrices": { "unc": 2.50, "xf": 1.50, "vf": 1.00, "fine": 0.75 }
  }
}
```

---

### 2.3 - Data Settings UI â­ USER CONTROL

**Priority:** HIGH - Users need to configure before enriching  
**Estimated Time:** 2 days

**Tasks:**
- [ ] Create settings modal component
  - [ ] Three checkboxes: Basic Data, Issue Data, Pricing Data
  - [ ] Show API call cost per coin (2/3/4)
  - [ ] Show session call counter
  - [ ] Explanation of what each data type includes
- [ ] Add âš™ï¸ Data Settings button to main screen
- [ ] Show current settings in status bar
  - [ ] "Fetch: Basic + Pricing (3 calls)"
  - [ ] "Session: 45 calls used"
- [ ] Implement settings persistence
  - [ ] Save to `{database}_settings.json` (next to DB file)
  - [ ] Load on startup
  - [ ] Fallback to defaults if missing
- [ ] Update renderer UI
  - [ ] Add settings button
  - [ ] Add status bar display
  - [ ] Add modal dialog

**Files to Create/Modify:**
- `src/renderer/index.html` (ADD settings modal)
- `src/renderer/app.js` (ADD settings handlers)
- `src/renderer/styles.css` (ADD settings styling)
- `src/main/index.js` (ADD settings IPC handlers)
- `src/modules/settings-manager.js` (NEW)

**UI Mock:**
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Data Fetch Settings                                     â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                          â”‚
â"‚ Select which data to fetch for each coin:               â"‚
â"‚ All three data types can be fetched independently.      â"‚
â"‚                                                          â"‚
â"‚ â˜' Basic Data                                            â"‚
â”‚   â€¢ Title, country, denomination, year                  â”‚
â”‚   â€¢ Composition, weight, diameter, shape                â”‚
â”‚   â€¢ Descriptions, images, catalog numbers               â”‚
â”‚   Cost: 2 API calls per coin                           â”‚
â”‚                                                          â”‚
â”‚ â˜ Issue Data (mintmark & mintage)                      â”‚
â”‚   â€¢ Mintmark (mint letter)                              â”‚
â”‚   â€¢ Mintage (number minted)                             â”‚
â”‚   Cost: +1 API call per coin                           â”‚
â”‚                                                          â”‚
â”‚ â˜ Pricing Data (market values)                         â”‚
â”‚   â€¢ Uncirculated, XF, VF, Fine prices                   â”‚
â”‚   Cost: +1 API call per coin                           â”‚
â”‚                                                          â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Current Selection: 2 calls per coin                     â”‚
â”‚ Session Usage: 45 calls used                           â”‚
â”‚                                                          â”‚
â”‚ [ Apply Settings ]  [ Cancel ]                          â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Deliverable:** User can configure data fetching

---

### 2.4 - Conditional API Calls â­ EFFICIENCY

**Priority:** HIGH - Respect user's data selection  
**Estimated Time:** 2 days

**Tasks:**
- [ ] Modify `src/modules/numista-api.js`
  - [ ] Accept fetch settings parameter
  - [ ] Conditionally call `/types/{id}/issues` endpoint
  - [ ] Conditionally call `/types/{id}/issues/{issue_id}/prices` endpoint
  - [ ] Return structured response indicating what was fetched
- [ ] Implement issue matching logic
  - [ ] Auto-match by year + mintmark (if available)
  - [ ] Auto-match by year only (if single match)
  - [ ] Return USER_PICK if multiple matches
- [ ] Create issue picker UI component
  - [ ] Show issue options in modal
  - [ ] Display mintmark, mintage for each
  - [ ] Include "Skip" option
- [ ] Update field comparison screen
  - [ ] Gray out unavailable fields (not fetched)
  - [ ] Show "Fetch Issue Data" button if not fetched
  - [ ] Show "Fetch Pricing Data" button if not fetched
- [ ] Handle edge cases
  - [ ] NO_MATCH (year doesn't match any issue)
  - [ ] NO_DATA (API returns empty)
  - [ ] ERROR (API failure)

**Files to Create/Modify:**
- `src/modules/numista-api.js` (MODIFY)
- `src/renderer/app.js` (ADD issue picker)
- `src/renderer/index.html` (ADD issue picker modal)
- `src/main/index.js` (ADD issue picker IPC handlers)

**Deliverable:** Smart, conditional API calls based on user settings

**API Call Flow:**
```
User selects: Basic + Pricing

Coin Search:
1. searchTypes (1 call) âœ…
2. getType (1 call) âœ…
3. getIssues âŒ SKIP - not selected
4. getPricing (1 call) âœ…

Total: 3 calls
```

---

### 2.5 - Freshness Indicators â­ UX ENHANCEMENT

**Priority:** MEDIUM - Helpful but not critical  
**Estimated Time:** 1 day

**Tasks:**
- [ ] Create `src/utils/freshness-calculator.js`
  - [ ] Implement `getPricingFreshness(timestamp)`
  - [ ] Return icon, text, color based on thresholds
- [ ] Update coin list display
  - [ ] Show freshness badge for pricing
  - [ ] Show "Last updated: X months ago"
  - [ ] Color-code by freshness
- [ ] Add freshness to detail view
  - [ ] Show all three data types with timestamps
  - [ ] Warn if pricing is outdated (>2 years)
  - [ ] Offer "Update Pricing Now" button
- [ ] Add filter by freshness
  - [ ] Current, Recent, Aging, Outdated, Never
  - [ ] Show count for each category

**Files to Create/Modify:**
- `src/utils/freshness-calculator.js` (NEW)
- `src/renderer/app.js` (ADD freshness display)
- `src/renderer/styles.css` (ADD freshness colors)

**Deliverable:** Visual pricing freshness indicators throughout UI

**UI Examples:**
```
Coin List:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ [img][img]  1943 Lincoln Cent                      â”‚
â”‚  obv  rev   United States â€¢ Steel                  â”‚
â”‚             Basic: âœ…  Issue: âœ…  Pricing: ðŸŸ       â”‚
â”‚             Last pricing: Jan 2024 (1.8 years ago) â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

Detail View:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Data Status                                        â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Basic Data:   âœ… Updated Jan 22, 2026             â”‚
â”‚ Issue Data:   âœ… Updated Jan 22, 2026             â”‚
â”‚ Pricing Data: ðŸŸ  Updated Jul 15, 2024             â”‚
â”‚               (1.5 years ago - Aging)              â”‚
â”‚                                                     â”‚
â”‚ âš ï¸ Pricing data is aging (>1 year old)            â”‚
â”‚ [Update Pricing Now] (1 API call)                 â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

### 2.6 - Filter & Sort Enhancements â­ UX IMPROVEMENT

**Priority:** MEDIUM - Improves usability  
**Estimated Time:** 1 day

**Tasks:**
- [ ] Debug existing filter/sort (currently broken from Phase 1)
- [ ] Add data type filters
  - [ ] Complete (all selected data merged)
  - [ ] Missing Basic Data
  - [ ] Missing Issue Data
  - [ ] Missing Pricing Data
  - [ ] Partial (some data merged)
- [ ] Add freshness filters
  - [ ] Current (<3 months)
  - [ ] Recent (3mo-1yr)
  - [ ] Aging (1-2yr)
  - [ ] Outdated (>2yr)
  - [ ] Never Updated
- [ ] Add sort options
  - [ ] By last update date (newest/oldest)
  - [ ] By pricing freshness
  - [ ] By status
- [ ] Show counts for each filter option

**Files to Create/Modify:**
- `src/renderer/app.js` (FIX and ENHANCE filters)
- `src/renderer/index.html` (UPDATE filter UI)

**Deliverable:** Working, comprehensive filter/sort system

**UI Example:**
```
Show:
[All Coins â–¼]
â”œâ”€ All Coins (250)
â”œâ”€ Complete Enrichment (180)
â”œâ”€ Partial Enrichment (25)
â”‚
â”œâ”€ Data Type:
â”‚   â”œâ”€ Missing Basic Data (15)
â”‚   â”œâ”€ Missing Issue Data (45)
â”‚   â””â”€ Missing Pricing (30)
â”‚
â””â”€ Pricing Freshness:
    â”œâ”€ ðŸŸ¢ Current (<3mo) (45)
    â”œâ”€ ðŸŸ¡ Recent (3mo-1yr) (85)
    â”œâ”€ ðŸŸ  Aging (1-2yr) (60)
    â”œâ”€ ðŸ”´ Outdated (>2yr) (30)
    â””â”€ âšª Never (30)

Sort:
[Title â–¼]
â”œâ”€ Title (A-Z)
â”œâ”€ Year (oldest first)
â”œâ”€ Country
â”œâ”€ Status
â”œâ”€ Last Updated (newest first)
â””â”€ Pricing Freshness
```

---

### 2.7 - "Fetch More Data" Feature â­ FLEXIBILITY

**Priority:** MEDIUM - Nice to have  
**Estimated Time:** 1 day

**Tasks:**
- [x] Add buttons to comparison screen
  - [x] "Fetch Issue Data" button (if not already fetched)
  - [x] "Fetch Pricing Data" button (if not already fetched)
  - [x] Show API call cost warning
- [x] Implement individual fetch logic
  - [x] Fetch for single coin only
  - [x] Update metadata after fetch
  - [x] Refresh comparison display
- [x] Handle already-fetched state
  - [x] Hide button if data already exists
  - [x] Show "Last fetched: X days ago" for pricing
  - [x] Offer "Refresh Pricing" if outdated
- [x] Update session call counter

**Files to Create/Modify:**
- `src/renderer/app.js` (ADD fetch buttons)
- `src/renderer/index.html` (ADD button UI)
- `src/main/index.js` (ADD individual fetch handlers)

**Deliverable:** Per-coin additional data fetching

**UI Example:**
```
Field Comparison Screen:

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Additional Data Available                          â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ âš ï¸ Issue data not fetched for this coin           â”‚
â”‚                                                     â”‚
â”‚ Fetch mintmark & mintage from Numista?            â”‚
â”‚ Cost: 1 API call                                   â”‚
â”‚                                                     â”‚
â”‚ [Fetch Issue Data]  [Skip]                        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

### 2.8 - Images â­ VISUAL ENHANCEMENT

**Priority:** HIGH - User emphasized importance  
**Estimated Time:** 3 days

**Tasks:**
- [x] Implement OpenNumismat image reading
  - [x] Read from `images` table (foreign key relationship)
  - [x] Convert BLOB â†’ base64 for display
  - [x] Handle missing images gracefully
- [x] Display in coin list
  - [x] Show obverse/reverse thumbnails (40x40px)
  - [x] Lazy load for performance
  - [x] Placeholder for missing images
- [x] Display Numista images in search results
  - [x] Show thumbnail from Numista API
  - [x] Load from URL
  - [x] Show larger preview on hover
- [x] Build side-by-side comparison view
  - [x] Show user's images (from OpenNumismat)
  - [x] Show Numista images
  - [x] Allow zoom/full-size view
- [x] Implement image download
  - [x] Download from Numista URL
  - [x] Convert to BLOB
  - [x] Insert into `images` table
  - [x] Get image ID
  - [x] Store ID in coin record (obverseimg, reverseimg, edgeimg)
- [x] Handle edge images
  - [x] Download if available
  - [x] Display in comparison
- [x] Error handling
  - [x] Network failures
  - [x] Invalid image formats
  - [x] Missing images

**Files to Create/Modify:**
- `src/modules/image-handler.js` (NEW)
- `src/modules/opennumismat-db.js` (ADD image reading)
- `src/renderer/app.js` (ADD image display)
- `src/renderer/index.html` (ADD image containers)
- `src/renderer/styles.css` (ADD image styling)

**Deliverable:** Full image support end-to-end

**UI Examples:**
```
Coin List:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ [OBV] [REV]  1943 Lincoln Cent                 â”‚
â”‚  img   img   United States â€¢ Steel             â”‚
â”‚              Basic: âœ…  Pricing: ðŸŸ             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

Search Results:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Match #1 (95% confidence)                        â”‚
â”‚ [OBV] [REV]  Lincoln Cent - Wheat Reverse       â”‚
â”‚  img   img   1943 â€¢ Steel â€¢ KM# 132a            â”‚
â”‚              19mm â€¢ 2.70g                        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

Side-by-Side Comparison:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   Your Coin      â”‚  Numista Match   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  [Your Obverse]  â”‚ [Numista Obverse]â”‚
â”‚   (from BLOB)    â”‚   (from URL)     â”‚
â”‚                  â”‚                  â”‚
â”‚  [Your Reverse]  â”‚ [Numista Reverse]â”‚
â”‚   (from BLOB)    â”‚   (from URL)     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Technical Notes:**
- OpenNumismat stores images as INTEGER foreign keys, not BLOBs directly in coins table
- Must query `images` table separately
- Image fields: `obverseimg`, `reverseimg`, `edgeimg` contain image IDs

---

### 2.9 - Settings File Management â­ PERSISTENCE

**Priority:** MEDIUM - Supports portability  
**Estimated Time:** 1 day

**Tasks:**
- [ ] Create `src/modules/settings-manager.js`
  - [ ] Implement `loadSettings(dbPath)`
  - [ ] Implement `saveSettings(dbPath, settings)`
  - [ ] Generate filename: `{dbname}_settings.json`
  - [ ] Store next to database file
- [ ] Define settings structure
  - [ ] API configuration (apiKey, rateLimit)
  - [ ] Fetch settings (basicData, issueData, pricingData)
  - [ ] Field mappings (user customizations)
  - [ ] UI preferences (view, sort, filter defaults)
- [ ] Implement defaults
  - [ ] Fall back to `default-field-mapping.js`
  - [ ] Prompt for API key if missing
- [ ] Handle multiple collections
  - [ ] Each database has its own settings file
  - [ ] Switch settings when switching databases
- [ ] Settings UI
  - [ ] Allow editing in settings modal
  - [ ] Save on change
  - [ ] Reset to defaults option

**Files to Create/Modify:**
- `src/modules/settings-manager.js` (NEW)
- `src/main/index.js` (INTEGRATE settings loading)

**Deliverable:** Portable user preferences per collection

**Settings File Structure:**
```json
{
  "version": "1.0",
  "collectionPath": "C:\\Users\\User\\Documents\\my-collection.db",
  
  "apiConfiguration": {
    "apiKey": "i883i335qeAa8fFHKXbWfkoIyZ1wuWJmvulRgwuA",
    "rateLimit": 2000
  },
  
  "fetchSettings": {
    "basicData": true,
    "issueData": false,
    "pricingData": true
  },
  
  "fieldMappings": {
    "catalognum1": { "catalogCode": "KM", "enabled": true },
    "catalognum2": { "catalogCode": "SchÃ¶n", "enabled": true },
    "period": { "numistaPath": "ruler[0].group.name", "enabled": true }
  },
  
  "uiPreferences": {
    "defaultView": "list",
    "defaultSort": "title",
    "defaultFilter": "all",
    "showThumbnails": true
  }
}
```

---

## Implementation Timeline

### Week 1: Foundation
**Days 1-2:**
- [ ] 2.1 - Metadata Storage System
- [ ] Test thoroughly with real data

**Days 3-4:**
- [ ] 2.2 - Granular Status Tracking
- [ ] Integration testing

**Day 5:**
- [ ] 2.9 - Settings File Management
- [ ] Testing and bug fixes

**Deliverable:** Solid foundation for all other features

---

### Week 2: User Control & API Efficiency
**Days 1-2:**
- [ ] 2.3 - Data Settings UI
- [ ] User testing and refinement

**Days 3-4:**
- [ ] 2.4 - Conditional API Calls
- [ ] Issue matching and picker UI

**Day 5:**
- [ ] 2.5 - Freshness Indicators
- [ ] UI polish

**Deliverable:** User can control data fetching, API calls are optimized

---

### Week 3: Images & Polish
**Days 1-3:**
- [ ] 2.8 - Images (complex feature)
  - Day 1: Reading and display
  - Day 2: Download and storage
  - Day 3: Side-by-side comparison

**Day 4:**
- [ ] 2.6 - Filter & Sort Enhancements
- [ ] Fix existing bugs

**Day 5:**
- [ ] 2.7 - Fetch More Data Feature
- [ ] Final testing and bug fixes

**Deliverable:** Complete Phase 2 feature set

---

## Dependencies

### Task Dependencies
```
2.1 (Metadata Storage)
  â””â”€> 2.2 (Status Tracking)
       â”œâ”€> 2.3 (Data Settings UI)
       â”‚    â””â”€> 2.4 (Conditional API Calls)
       â”‚         â””â”€> 2.7 (Fetch More Data)
       â””â”€> 2.5 (Freshness Indicators)
            â””â”€> 2.6 (Filter & Sort)

2.9 (Settings File) â”€> 2.3 (Data Settings UI)

2.8 (Images) â”€> Independent (can be done in parallel)
```

**Critical Path:** 2.1 â†’ 2.2 â†’ 2.3 â†’ 2.4

---

## Testing Strategy

### Unit Testing
- [ ] Metadata parsing (malformed JSON, missing fields)
- [ ] Freshness calculation (edge cases, null dates)
- [ ] Issue matching logic (all scenarios)
- [ ] Settings persistence (read/write)

### Integration Testing
- [ ] Metadata storage â†’ Status tracking
- [ ] Settings â†’ Conditional API calls
- [ ] Image download â†’ Database insertion
- [ ] Filter/sort with new status structure

### User Acceptance Testing
- [ ] Load collection with existing progress
- [ ] Change data settings mid-session
- [ ] Process coins with different data selections
- [ ] Verify freshness indicators
- [ ] Test filter/sort options
- [ ] Verify images display correctly
- [ ] Test app reinstall scenario (data survives)
- [ ] Test database copy to new device (settings survive)

### Performance Testing
- [ ] Large collections (1000+ coins)
- [ ] Metadata parsing speed
- [ ] Image loading performance
- [ ] Filter/sort responsiveness

---

## Success Criteria

### Phase 2 Complete When:
- [ ] âœ… Metadata storage working reliably (no data loss)
- [ ] âœ… Three-tier status tracking implemented
- [ ] âœ… User can select which data to fetch
- [ ] âœ… API calls conditional based on settings
- [ ] âœ… Issue matching working (auto + manual)
- [ ] âœ… Pricing freshness indicators visible
- [ ] âœ… Filters work for all data types and freshness
- [ ] âœ… Images display in coin list
- [ ] âœ… Images display in search results
- [ ] âœ… Images download and store correctly
- [ ] âœ… Side-by-side image comparison works
- [ ] âœ… Settings persist next to database
- [ ] âœ… App reinstall preserves all data
- [ ] âœ… Database copy to new device works

### Quality Metrics:
- [ ] No metadata parsing errors in testing
- [ ] No user notes lost or corrupted
- [ ] Filter/sort works for collections of 1000+ coins
- [ ] Image loading < 500ms per image
- [ ] Settings load/save < 100ms
- [ ] All features work after app reinstall
- [ ] All features work after database copy

---

## Risk Assessment

### High Risk
- **Metadata storage in note field** - Could corrupt user notes
  - Mitigation: Extensive testing, backup before write, graceful failure
  
- **Image download failures** - Network issues, invalid URLs
  - Mitigation: Retry logic, graceful degradation, continue without images

### Medium Risk
- **Issue matching complexity** - Multiple mints, no year match
  - Mitigation: Clear UI for user to pick, skip option

- **Settings file conflicts** - Database moved between devices
  - Mitigation: Validate settings on load, reset to defaults if corrupted

### Low Risk
- **Freshness calculation edge cases** - Null dates, future dates
  - Mitigation: Defensive programming, default to "Never Updated"

---

## Completed Enhancements

### Coin List Pagination âœ…

**Status:** COMPLETED
**Date Completed:** January 31, 2026

**Feature Overview:**
Added pagination controls to navigate through large coin collections efficiently. The coin list now displays 100 coins per page with intuitive navigation controls.

**Implementation Details:**
- **Pagination State:** Added to AppState with currentPage, pageSize (100), and totalPages tracking
- **UI Controls:** Navigation buttons with standard icons:
  - ⏮️ First Page - jump to first page
  - ◀️ Previous - go back one page
  - Page indicator - shows "Page X of Y"
  - ▶️ Next - advance one page
  - ⏭️ Last Page - jump to last page
- **Smart Button States:** Navigation buttons automatically disable when at boundaries (first/last page)
- **Status Display:** Shows current range (e.g., "Showing 101-200 of 500 coins")

**Files Modified:**
- `src/renderer/app.js` - Added pagination state, loadCoins update, updatePaginationControls function, event handlers
- `src/renderer/index.html` - Added pagination controls UI between filters and coin list
- `src/renderer/styles/main.css` - Added pagination button and info styling

**User Experience:**
- Improved performance for large collections
- Clear visual feedback on current page position
- Responsive button states prevent navigation errors
- Seamless integration with existing filter/sort controls

**Technical Notes:**
- Page size: 100 coins per page
- Offset calculation: `(currentPage - 1) * pageSize`
- Total pages: `Math.ceil(totalCoins / pageSize)`
- Backend already supported limit/offset parameters

---

## Post-Phase 2 Features (Future)

### Task 2.8 - Image Support ✅

**Status:** COMPLETED
**Date Completed:** January 31, 2026

**Feature Overview:**
Added comprehensive image support for coins, including display of user's coin images from OpenNumismat database, Numista images in search results, side-by-side comparison, and image download/storage functionality. Images enhance visual coin identification and comparison throughout the workflow.

**Implementation Details:**

**1. Image Handler Module (image-handler.js)**
- Converts BLOBs to base64 data URIs for HTML display
- Downloads images from Numista URLs (no API calls - direct HTTP)
- Detects MIME types (JPEG, PNG, GIF, WebP) from buffers
- Validates image data integrity
- Generates SVG placeholders for missing images

**2. Database Integration (opennumismat-db.js)**
- `getImageData(imageId)` - Reads BLOB from images table by ID
- `getCoinImages(coinId)` - Retrieves all images for a coin
- `insertImage(imageData, title)` - Stores image BLOB in database
- `storeImagesForCoin(coinId, imageBuffers)` - Batch inserts obverse/reverse/edge images
- Properly handles foreign key relationships (obverseimg, reverseimg, edgeimg fields)

**3. IPC Communication**
- `get-coin-images` - Fetches coin images from database as data URIs
- `download-and-store-images` - Downloads from Numista and stores in database
- Added to preload.js and main/index.js

**4. UI Features**

**a) Coin List Thumbnails**
- 40x40px obverse/reverse thumbnails for each coin
- Lazy loading for performance (loads after list renders)
- SVG placeholders for coins without images
- Smooth rendering with no layout shift

**b) Match Screen - User's Coin Images**
- Displays user's coin images (60x60px) at top of match screen
- Positioned next to coin details for easy reference
- 3x zoom on hover for detailed inspection
- Loads asynchronously without blocking UI

**c) Search Results Images**
- Shows Numista obverse/reverse images (80x80px) for each match
- Stacked vertical layout
- 2.5x zoom on hover for better viewing
- Images come free with search API response (no extra calls)

**d) Side-by-Side Comparison View**
- Displays user's images vs Numista images (150x150px each)
- Two columns: "Your Coin" | "Numista Match"
- Hover to zoom for detailed comparison
- "Download Images to Collection" button
- Auto-refreshes after successful download

**5. Image Download Process**
- Downloads at 400x400 resolution from Numista
- Converts thumbnail URLs (150x150) to higher quality (400x400)
- Stores as BLOBs in OpenNumismat images table
- Updates coin record with new image IDs
- Handles network errors gracefully

**Files Created:**
- `src/modules/image-handler.js` - New module for all image operations

**Files Modified:**
- `src/modules/opennumismat-db.js` - Added 5 image-related methods
- `src/main/index.js` - Added 2 IPC handlers for images
- `src/main/preload.js` - Added 2 IPC method definitions
- `src/renderer/app.js` - Updated renderCoinList, renderMatches, renderCurrentCoinInfo, added renderImageComparison, handleImageDownload
- `src/renderer/styles/main.css` - Added styles for thumbnails, hover effects, comparison layout

**User Experience:**
- Visual coin identification improves matching accuracy
- Hover zoom allows detailed inspection without opening images
- Side-by-side comparison makes verification easy
- One-click download preserves images in collection
- Works offline after images are downloaded

**Technical Notes:**
- Images use zero API quota (direct HTTP downloads, not API endpoints)
- Image URLs included free in Numista type data response
- Lazy loading prevents performance impact on large collections
- Hover zoom uses CSS transforms (smooth, no layout reflow)
- High z-index ensures zoomed images appear above other content
- OpenNumismat stores images as foreign key IDs, not direct BLOBs

**Performance:**
- Lazy loading: Images load after coin list renders
- Batch loading: All visible coins load concurrently
- Caching: Browser caches data URIs
- No database queries for placeholders

---

Features to consider for Phase 3:
- [ ] Batch operations (process multiple coins at once)
- [ ] Fast Pricing Update mode (1 API call per coin)
- [ ] Undo functionality
- [ ] Export reports (pricing changes, enrichment summary)
- [ ] Custom field mapping UI
- [ ] Price change history charts
- [ ] Automatic pricing alerts (notify when prices change)

---

## Notes & Decisions Log

**2026-01-22:**
- Decided on three-tier storage strategy
- Chose HTML comments for metadata (Option C)
- Set pricing freshness thresholds (3mo, 1yr, 2yr)
- Agreed to duplicate Numista ID in metadata for reliability
- Issue matching: auto-match year+mintmark, fallback to user picker

---

**Document Status:** IN PROGRESS - Task 2.4 COMPLETE, Task 2.7 COMPLETE, Task 2.8 COMPLETE, Task 2.9 COMPLETE
**Next Action:** All Phase 2 tasks complete

---

## Recent Development Sessions

### Session: January 31, 2026 Evening - Data Independence & Smart Issue Matching

**Status:** COMPLETED
**Tasks Affected:** 2.4 (Conditional API Calls), 2.8 (Images)

**Issues Fixed:**

1. **Data Independence Problem** - All three data types (Basic, Issue, Pricing) now truly independent
   - Root cause: basicData was hardcoded as required in settings-manager.js
   - Fixed: Removed all enforcement of basicData=true throughout codebase
   - Files modified: settings-manager.js, numista-api.js, index.html, app.js

2. **Smart Issue Matching Implementation** - Adaptive algorithm for year+mintmark vs year+type matching
   - Problem: Static matching only checked year+mintmark, failed for coins differentiated by type (Proof vs regular)
   - Solution: Analyzes which fields vary (mint_letter, comment) and applies filters based on user's data
   - Algorithm:
     - Filter by year first (required)
     - Analyze which fields differentiate issues (mint_letter, comment)
     - Apply mintmark filter if it varies AND user has mintmark
     - Apply type/comment filter if it varies (blank type = regular, "Proof" = proof issues)
     - Return AUTO_MATCHED if single result, USER_PICK if multiple remain
   - Files modified: numista-api.js (lines 168-284)

3. **Image Display Fixes**
   - Problem 1: Thumbnails not showing in comparison view
     - Cause: Thumbnail URLs from search results overwritten by detailed type data
     - Fix: Preserve thumbnail URLs before merging with detailed data
   - Problem 2: Database error "table images has no column named title"
     - Cause: insertImage trying to insert non-existent title column
     - Fix: Changed INSERT to only include image column
   - Problem 3: Download button styling inconsistent
     - Fix: Changed to btn-primary class, moved below images, made full-width
   - Files modified: app.js, opennumismat-db.js

**Task 2.4 Status Update:**
- ✅ Modified numista-api.js to accept fetch settings
- ✅ Conditionally call endpoints based on settings (basicData now truly optional)
- ✅ Implemented smart issue matching logic (adaptive to available fields)
- ✅ Handle edge cases (NO_MATCH, NO_DATA, ERROR, USER_PICK)
- ✅ **COMPLETE:** Issue Picker UI component fully implemented (see session below)
- ✅ Updated field comparison screen to respect fetch settings

**Task 2.4 is now 100% COMPLETE** ✅

**Task 2.8 Status:** COMPLETED (see section above)

**Files Modified:**
- `src/modules/settings-manager.js` - Made basicData truly optional
- `src/modules/numista-api.js` - Smart issue matching, conditional fetching
- `src/modules/opennumismat-db.js` - Fixed image insertion
- `src/renderer/index.html` - Updated Basic Data UI
- `src/renderer/app.js` - Thumbnail preservation, button styling

**Next Steps:**
- ✅ Issue Picker UI modal implemented (Task 2.4 complete)
- Begin Task 2.7 - Fetch More Data, or Task 2.1 - Metadata Storage System

---

### Session: January 31, 2026 Late Evening - Issue Picker UI Implementation

**Status:** COMPLETED
**Tasks Affected:** 2.4 (Conditional API Calls) - Final Component

**Implementation Summary:**

Completed the final missing piece of Task 2.4: the Issue Picker UI modal that allows users to manually select the correct issue when smart matching finds multiple candidates.

**Components Implemented:**

1. **Issue Picker Modal HTML** (`src/renderer/index.html`)
   - Clean modal layout with coin information display
   - Dynamic list container for issue options
   - User's coin data displayed (year, mintmark, type)
   - "Apply Selection" and "Skip Issue Data" action buttons

2. **Issue Picker Styling** (`src/renderer/styles/main.css`)
   - 112 lines of CSS for modal, cards, badges
   - Hover and selection state styling
   - Green badge for exact matches (year + mintmark)
   - Orange badge for partial matches (year OR type)
   - Responsive card layout with detail grid

3. **Issue Picker Logic** (`src/renderer/app.js`)
   - `showIssuePicker(issueOptions, coin)` function
   - Match quality analysis (exact vs partial)
   - Interactive selection with radio buttons
   - Returns Promise with user action (selected/skip/cancel)
   - Displays mintage to help identify rare variants

4. **Integration into Match Flow** (`src/renderer/app.js` - handleMatchSelection)
   - Detects USER_PICK scenarios after fetchCoinData
   - Shows picker modal when multiple issues found
   - Fetches pricing for selected issue (if enabled)
   - Handles skip/cancel gracefully

5. **Pricing Fetch Handler** (`src/main/index.js`, `src/main/preload.js`)
   - New IPC handler: `fetch-pricing-for-issue`
   - Calls `api.getIssuePricing(typeId, issueId, currency)`
   - Increments API call counter
   - Returns pricing data for selected issue

**User Experience:**

When multiple issues match (e.g., 1943 Lincoln Cent from P/D/S mints):
1. Modal displays all candidates with detailed information
2. Exact matches highlighted with green "EXACT MATCH" badge
3. User selects the correct issue via radio button
4. System fetches pricing for that specific issue (if enabled)
5. Proceeds to field comparison with mint-specific data

**Files Modified:**
- `src/renderer/index.html` - Issue Picker modal
- `src/renderer/styles/main.css` - Styling (112 lines added)
- `src/renderer/app.js` - showIssuePicker() + integration
- `src/main/index.js` - fetch-pricing-for-issue handler
- `src/main/preload.js` - fetchPricingForIssue API method

**Task 2.4 Final Status:**
- ✅ Conditional API calls
- ✅ Smart issue matching (adaptive)
- ✅ Issue Picker UI (complete)
- ✅ Edge case handling
- ✅ Pricing fetch for selected issue

**Phase 2 Task 2.4 - Conditional API Calls: 100% COMPLETE** ✅

---

**Document Status:** IN PROGRESS - Task 2.4 COMPLETE, Task 2.7 COMPLETE, Task 2.8 COMPLETE, Task 2.9 COMPLETE
**Next Action:** All Phase 2 tasks complete
