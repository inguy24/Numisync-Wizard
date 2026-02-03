# FINAL OpenNumismat â†” Numista Field Mapping
## Based on Actual API Specification (Swagger v3.29.0)

**Date:** 2026-01-31 (Updated - Issues endpoint format)  
**API Version:** v3.29.0  
**OpenNumismat Database:** 110 fields analyzed  
**Status:** IMPLEMENTED

---

## CRITICAL CORRECTIONS TO USER'S MAPPING

### âŒ INCORRECT MAPPING:
**catalognum1-4 â†’ Numista `id`**

The user mapped all catalog number fields to `id`, but:
- Numista `id` = Internal Numista ID (e.g., 420, 18059)
- This is NOT a catalog number!

### Ã¢Å“â€¦ CORRECT MAPPING:
**catalognum1-4 â†’ Numista `references` array**

Catalog numbers are in the `references` array:
```json
"references": [
  {
    "catalogue": {
      "id": 3,
      "code": "KM"
    },
    "number": "2"
  },
  {
    "catalogue": {
      "id": 24,
      "code": "SchÃ¶n"
    },
    "number": "2"
  }
]
```

**Implementation:**
- Parse `references` array
- Extract catalog code (KM, SchÃ¶n, Y, etc.)
- Let user map specific catalog types to their fields
- User has renamed catalognum1 to "Krause" â†’ map KM codes there

---

## SECTION 1: NUMISTA API STRUCTURE (CONFIRMED)

### 1.1 Type (Coin) Schema - GET /types/{type_id}

**Root Level Fields:**
```json
{
  "id": 420,                          // Numista internal ID
  "url": "https://en.numista.com/...",
  "title": "5 Cents - Victoria",
  "category": "coin",                 // or "banknote", "exonumia"
  "issuer": { ... },
  "min_year": 1858,                   // First year produced
  "max_year": 1901,                   // Last year produced
  "type": "Standard circulation coin",
  "value": { ... },
  "ruler": [ ... ],
  "demonetization": { ... },
  "shape": "Round",
  "composition": { ... },
  "technique": { ... },
  "weight": 1.167,                    // grams
  "size": 15.494,                     // mm (diameter)
  "size2": null,                      // mm (2nd dimension for non-round)
  "thickness": 0.7,                   // mm
  "orientation": "coin",              // "coin", "medal", "variable"
  "obverse": { ... },
  "reverse": { ... },
  "edge": { ... },
  "watermark": { ... },               // for banknotes
  "mints": [ ... ],
  "printers": [ ... ],                // for banknotes
  "series": "Series name",
  "commemorated_topic": "...",
  "comments": "HTML comments",
  "related_types": [ ... ],
  "tags": [ "Crown", "Wreath" ],
  "references": [ ... ]               // â† CATALOG NUMBERS HERE!
}
```

### 1.2 Value Object
```json
"value": {
  "text": "5 Cents",
  "numeric_value": 0.05,
  "numerator": null,                  // for fractions
  "denominator": null,
  "currency": {
    "id": 44,
    "name": "Canadian dollar",
    "full_name": "Canadian dollar (1858-date)"
  }
}
```

### 1.3 Issuer Object
```json
"issuer": {
  "code": "canada",
  "name": "Canada"
}
```

### 1.4 Ruler Array
```json
"ruler": [
  {
    "id": 1774,
    "name": "Victoria",
    "wikidata_id": "Q9439",
    "nomisma_id": "queen_victoria",
    "group": {
      "id": 123,
      "name": "House of Hanover"
    }
  }
]
```

### 1.5 Composition Object
```json
"composition": {
  "text": "Silver (.925) (.925 silver .075 copper)"
}
```

### 1.6 Coin Side Object (obverse/reverse/edge)
```json
"obverse": {
  "engravers": [ "Leonard Charles Wyon" ],        // âœ… ARRAY of names
  "designers": [ "Designer Name" ],               // âœ… ARRAY of names
  "description": "Head of Queen Victoria...",
  "lettering": "VICTORIA DEI GRATIA REGINA.\r\nCANADA",
  "lettering_scripts": [
    { "name": "Latin" }
  ],
  "unabridged_legend": "VICTORIA DEI GRATIA REGINA",
  "lettering_translation": "Victoria Queen by the grace of God",
  "picture": "https://en.numista.com/.../1009-original.jpg",     // âœ… FULL SIZE
  "thumbnail": "https://en.numista.com/.../1009-180.jpg",        // âœ… THUMBNAIL
  "picture_copyright": "Heritage Auctions",
  "picture_copyright_url": "http://www.ha.com",
  "picture_license_name": "...",
  "picture_license_url": "..."
}
```

**CRITICAL:** 
- `engravers` and `designers` are **ARRAYS**, not strings!
- Edge also uses this same `coin_side` schema
- Edge CAN have `picture` and `thumbnail` fields! âœ…

### 1.7 Mints Array
```json
"mints": [
  {
    "id": 17,
    "name": "Royal Mint (Tower Hill)"
  },
  {
    "id": 18,
    "name": "Heaton and Sons / The Mint Birmingham Limited"
  }
]
```

### 1.8 References Array (CATALOG NUMBERS) âš ï¸ CRITICAL
```json
"references": [
  {
    "catalogue": {
      "id": 3,
      "code": "KM"             // â† Catalog system code
    },
    "number": "2"              // â† Catalog number
  },
  {
    "catalogue": {
      "id": 24,
      "code": "SchÃ¶n"
    },
    "number": "2"
  }
]
```

**Common Catalog Codes:**
- `KM` = Krause (Standard Catalog of World Coins)
- `SchÃ¶n` = SchÃ¶n catalog
- `Y` = Yeoman
- Many others...

### 1.9 Issue Schema (For Specific Years/Variants)

**Important:** Issues provide specific year and mintmark data!

```json
"issue": {
  "id": 63444,
  "is_dated": true,                   // â† Does coin show a date?
  "year": 1887,                       // â† Year AS WRITTEN on coin
  "gregorian_year": 1887,             // â† Gregorian calendar year
  "min_year": null,                   // â† For undated coins
  "max_year": null,                   // â† For undated coins
  "mint_letter": "A",                 // â† MINT MARK! âœ…
  "marks": [ ... ],                   // Privy marks, mint master marks
  "signatures": [ ... ],              // For banknotes
  "mintage": 5000000,                 // Specific issue mintage
  "references": [ ... ],              // Issue-specific catalogs
  "comment": "..."
}
```

**KEY INSIGHT:** 
- Type has `min_year`/`max_year` (range for whole type)
- Issue has `year` (specific year for this variant)
- User's coin year should match `issue.year`, not `type.min_year`!

### 1.10 GET /types/{type_id}/issues Endpoint Response Format

**CRITICAL API DISCOVERY (2026-01-31):**

The `/types/{type_id}/issues` endpoint returns an **ARRAY DIRECTLY**, not wrapped in an object!

**Correct Response Format:**
```javascript
// API returns THIS:
[
  {
    "id": 27148,
    "is_dated": true,
    "year": 1938,
    "gregorian_year": 1938,
    "mintage": 2864000,
    "comment": "Circulation"
  },
  {
    "id": 27156,
    "is_dated": true,
    "year": 1943,
    "gregorian_year": 1943,
    "mint_letter": "S",
    "mintage": 4000000,
    "comment": "Circulation"
  }
]
```

**NOT wrapped in an object:**
```javascript
// It does NOT return this:
{
  "issues": [ ... ]  // ❌ WRONG - common mistake!
}
```

**Implementation Impact:**
```javascript
// WRONG (before fix):
const issues = issuesResponse.issues || [];  // undefined!

// CORRECT (after fix):
const issues = Array.isArray(issuesResponse) ? issuesResponse : [];
```

**Bug Fixed:** 2026-01-31 - Code was incorrectly expecting `issuesResponse.issues`, causing all issue and pricing data to fail with NO_ISSUES error.

---

## SECTION 2: DEFAULT FIELD MAPPING (CORRECTED)

### 2.1 HIGH PRIORITY - Enable by Default âœ…

| OpenNumismat Field | Numista Field | Transformation | Notes |
|-------------------|---------------|----------------|-------|
| **title** | `title` | None | Direct match |
| **category** | `category` | None | "coin", "banknote", "exonumia" |
| **country** | `issuer.name` | None | May need normalization |
| **region** | âŒ None | - | No direct equivalent |
| **period** | `type` | Map | "Standard circulation coin" â†’ period? |
| **ruler** | `ruler[0].name` | Extract first | Array, take first ruler |
| **mint** | `mints[0].name` | Extract first | Array, take first mint |
| **value** | `value.numeric_value` | Number | Numeric face value |
| **unit** | Extract from `value.text` | Parse | e.g., "5 Cents" â†’ "Cents" |
| **material** | `composition.text` | **Parse/simplify** | âš ï¸ Verbose, needs parsing |
| **weight** | `weight` | None | Already in grams |
| **diameter** | `size` | None | Already in mm |
| **thickness** | `thickness` | None | Already in mm |
| **shape** | `shape` | None | Direct match |
| **edge** | `edge.description` | None | Edge type/description |
| **edgelabel** | `edge.lettering` | None | Edge lettering |
| **obversedesign** | `obverse.description` | None | âœ… User corrected |
| **reversedesign** | `reverse.description` | None | âœ… User corrected |
| **mintage** | `mintage` (type) OR `issue.mintage` | Prefer issue | Issue is more specific |
| **series** | `series` | None | Direct match |

### 2.2 CATALOG NUMBERS - Special Handling Required âš ï¸

**User Scenario:**
- User has renamed `catalognum1` to "Krause"
- User wants KM numbers in "Krause" field
- User wants SchÃ¶n numbers in `catalognum2`

**Implementation:**
```javascript
// Parse references array
const references = numistaData.references;

// Group by catalog code
const catalogNumbers = {
  KM: null,
  SchÃ¶n: null,
  Y: null,
  // ... others
};

references.forEach(ref => {
  const code = ref.catalogue.code;
  const number = ref.number;
  catalogNumbers[code] = number;
});

// User maps in preferences:
// "Krause" (renamed catalognum1) â† catalogNumbers.KM
// catalognum2 â† catalogNumbers.SchÃ¶n
// catalognum3 â† catalogNumbers.Y
```

**Preferences Configuration:**
```json
{
  "catalogMappings": {
    "Krause": "KM",           // OpenNumismat field â†’ Numista catalog code
    "catalognum2": "SchÃ¶n",
    "catalognum3": "Y",
    "catalognum4": null
  }
}
```

### 2.3 ENGRAVER FIELDS - Array Handling âš ï¸

| OpenNumismat Field | Numista Field | Transformation | Notes |
|-------------------|---------------|----------------|-------|
| **obverseengraver** | `obverse.engravers[0]` | Join array | Take first or join with "/" |
| **reverseengraver** | `reverse.engravers[0]` | Join array | Take first or join with "/" |
| **obversedesigner** | `obverse.designers[0]` | Join array | Take first or join with "/" |
| **reversedesigner** | `reverse.designers[0]` | Join array | Take first or join with "/" |

**Example:**
```javascript
// Numista: "engravers": ["John Doe", "Jane Smith"]
// Options:
// 1. Take first: "John Doe"
// 2. Join all: "John Doe / Jane Smith"
```

### 2.4 IMAGE FIELDS - Download & Insert âš ï¸

**Remember:** OpenNumismat stores images as INTEGER foreign keys!

| OpenNumismat Field | Numista Field | Process |
|-------------------|---------------|---------|
| **obverseimg** | `obverse.picture` | Download â†’ Insert â†’ Store ID |
| **reverseimg** | `reverse.picture` | Download â†’ Insert â†’ Store ID |
| **edgeimg** | `edge.picture` | Download â†’ Insert â†’ Store ID âœ… |

**Implementation:**
```javascript
async function storeImage(db, imageUrl) {
  // 1. Download image
  const imageData = await downloadImage(imageUrl);
  
  // 2. Insert into images table
  const stmt = db.prepare('INSERT INTO images (image) VALUES (?)');
  const result = stmt.run(imageData);
  
  // 3. Return the new image ID
  return result.lastInsertRowid;
}

// Then store the ID in the coin record
const obverseImgId = await storeImage(db, numistaData.obverse.picture);
updateCoin(coinId, { obverseimg: obverseImgId });
```

**Image Options:**
- `picture` = Full size image
- `thumbnail` = Smaller thumbnail (180px)

**Recommendation:** Download `picture` (full size) for better quality

### 2.5 YEAR FIELD - User Preference âš ï¸

**User said:** "I am assuming the user would never want to override their year"

**Implementation:**
```javascript
// NEVER map year by default
// Only show in comparison UI as informational
// Default to "Keep Mine"

const yearMapping = {
  enabled: false,  // â† Disabled by default
  numistaPath: 'issue.year',  // OR 'min_year'
  userPreference: 'never_override'
};
```

**Comparison UI:**
```
Year:  [Keep Mine: 1943]  [Numista: 1887]  (â„¹ï¸ Year override disabled)
```

### 2.6 MINTMARK - From Issue Data âš ï¸

**User said:** "numista has this on the webpage so there must be a variable for it"

**Found:** `issue.mint_letter`

| OpenNumismat Field | Numista Field | Notes |
|-------------------|---------------|-------|
| **mintmark** | `issue.mint_letter` | âœ… Confirmed exists! |

**Important:** 
- Mintmark is in **ISSUE** data, not type data
- May need to fetch issues separately: `GET /types/{id}/issues`
- Or provided with collection item data

### 2.7 COMPOSITION/MATERIAL - Parsing Strategy

**Numista provides:**
```json
"composition": {
  "text": "Silver (.925) (.925 silver .075 copper)"
}
```

**OpenNumismat has THREE fields:**
- `material` - Primary material
- `material2` - Secondary material
- `composition` - Full composition description

**Mapping Options:**

**Option A: Simple (Recommended for MVP)**
```javascript
material = composition.text  // Store verbatim in material
material2 = null             // Leave empty
composition = composition.text  // Also store in composition field
```

**Option B: Parse (Future Enhancement)**
```javascript
// Parse "Silver (.925) (.925 silver .075 copper)"
material = "Silver"
material2 = "Copper"
composition = ".925 silver .075 copper"
```

### 2.8 MEDIUM PRIORITY - Conditional Mapping

| OpenNumismat Field | Numista Field | Notes |
|-------------------|---------------|-------|
| **type** (ON field) | `type` (Numista field) | "Standard circulation coin" |
| **obvrev** | âŒ None | No equivalent |
| **quality** | âŒ None | No equivalent |
| **rarity** | âŒ None | No equivalent in type data |
| **fineness** | âŒ None | Embedded in composition text |
| **variety** | âŒ None | Issue-level data? |
| **obversevar** | âŒ None | No direct field |
| **reversevar** | âŒ None | No direct field |
| **edgevar** | âŒ None | No direct field |
| **axis** | `orientation` | Map values: "coin"â†’6, "medal"â†’12 |

### 2.9 NEVER MAP - No Numista Equivalent ðŸš«

**OpenNumismat-only fields:**
- All collection management fields (status, grade, storage, etc.)
- All transaction fields (pay/sale dates, prices, places)
- System fields (id, createdat, updatedat)
- Paper money fields (signature, signaturetype)
- Location fields (address, latitude, longitude)
- Measured values (real_weight, real_diameter)
- User data (note, url, rating, tags)
- Photos 1-6 (additional photos beyond obverse/reverse/edge)

---

## SECTION 3: CORRECTED USER MAPPING

### User's Excel Mapping (with corrections):

| OpenNumismat | Numista | Status | Notes |
|--------------|---------|--------|-------|
| title | title | âœ… CORRECT | Direct match |
| category | type.category | âŒ INCORRECT | Should be just `category` |
| variety | âŒ None | âš ï¸ | No direct mapping |
| region | issuer.region | âš ï¸ VERIFY | May not exist in API |
| country | issuer.name | âœ… CORRECT | Direct match |
| period | period | âš ï¸ | May be `type` field instead |
| ruler | ruler | âš ï¸ | Is an ARRAY, need `ruler[0].name` |
| mint | âŒ | âš ï¸ | Should be `mints[0].name` |
| value | value | âš ï¸ | Should be `value.numeric_value` |
| unit | unit | âš ï¸ | No direct field, parse from `value.text` |
| denomination | âŒ None | âš ï¸ | Combine value + unit |
| year | âŒ None | âœ… CORRECT | User doesn't want override |
| material | composition | âš ï¸ | Should be `composition.text` |
| weight | weight | âœ… CORRECT | Direct match |
| diameter | diameter | âš ï¸ | Should be `size` |
| thickness | thickness | âœ… CORRECT | Direct match |
| shape | shape | âœ… CORRECT | Direct match |
| edge | edge | âš ï¸ | Should be `edge.description` |
| edgelabel | lettering | âš ï¸ | Should be `edge.lettering` |
| obverseimg | images.obverse | âš ï¸ | Should be `obverse.picture` |
| obversevar | obverse_description | âŒ INCORRECT | Should be `obverse.description` |
| obversedesign | âŒ None | âš ï¸ | Should map to `obverse.description` |
| obversedesigner | obversedesigner | âš ï¸ | Should be `obverse.designers[0]` |
| reverseimg | images.reverse | âš ï¸ | Should be `reverse.picture` |
| reversevar | reverse_description | âŒ INCORRECT | Should be `reverse.description` |
| reversedesign | âŒ None | âš ï¸ | Should map to `reverse.description` |
| reversedesigner | reversedesigner | âš ï¸ | Should be `reverse.designers[0]` |
| series | âŒ None | âš ï¸ | Should be `series` |
| catalognum1-4 | id | âŒ **CRITICALLY WRONG** | Should be `references` array! |
| mintage | mintage | âœ… CORRECT | Direct match (or `issue.mintage`) |
| minted | mint.name | âš ï¸ | Should be `mints[0].name` |
| mintmark | âŒ | âš ï¸ | Should be `issue.mint_letter` âœ… |

---

## SECTION 4: IMPLEMENTATION RECOMMENDATIONS

### 4.1 Field Mapping Configuration File

```javascript
const NUMISTA_FIELD_MAPPING = {
  // Direct matches
  title: {
    path: 'title',
    type: 'string',
    priority: 'HIGH',
    enabled: true
  },
  
  category: {
    path: 'category',
    type: 'string',
    priority: 'HIGH',
    enabled: true
  },
  
  // Nested object access
  country: {
    path: 'issuer.name',
    type: 'string',
    priority: 'HIGH',
    enabled: true
  },
  
  // Array access with index
  ruler: {
    path: 'ruler[0].name',
    type: 'string',
    priority: 'MEDIUM',
    enabled: true,
    transform: 'joinArray'  // Or take first
  },
  
  // Complex object path
  value: {
    path: 'value.numeric_value',
    type: 'number',
    priority: 'HIGH',
    enabled: true
  },
  
  // Parsed fields
  unit: {
    path: 'value.text',
    type: 'string',
    priority: 'HIGH',
    enabled: true,
    transform: 'extractUnit'  // Parse "5 Cents" â†’ "Cents"
  },
  
  // Image fields (special handling)
  obverseimg: {
    path: 'obverse.picture',
    type: 'image_url',
    priority: 'HIGH',
    enabled: true,
    transform: 'downloadAndInsert'
  },
  
  // Catalog numbers (very special handling)
  catalognum1: {
    path: 'references',
    type: 'catalog_array',
    priority: 'HIGH',
    enabled: true,
    transform: 'parseCatalogNumbers',
    userMapping: 'KM'  // User preference: map KM to this field
  },
  
  // Year - disabled by user preference
  year: {
    path: 'issue.year',  // or min_year
    type: 'integer',
    priority: 'MEDIUM',
    enabled: false,  // â† User never wants override
    userPreference: 'never_override'
  },
  
  // Mintmark - from issue
  mintmark: {
    path: 'issue.mint_letter',
    type: 'string',
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: true  // â† Flag to fetch issue separately
  }
};
```

### 4.2 Transformation Functions

```javascript
const transformations = {
  // Join array elements
  joinArray: (value) => {
    if (Array.isArray(value)) {
      return value.join(' / ');
    }
    return value;
  },
  
  // Extract unit from value text
  extractUnit: (valueText) => {
    // "5 Cents" â†’ "Cents"
    const parts = valueText.split(' ');
    return parts.slice(1).join(' ');
  },
  
  // Parse catalog numbers
  parseCatalogNumbers: (references, userCatalogCode) => {
    const ref = references.find(r => r.catalogue.code === userCatalogCode);
    return ref ? ref.number : null;
  },
  
  // Download image and insert to database
  downloadAndInsert: async (imageUrl, db) => {
    const imageData = await downloadImage(imageUrl);
    const stmt = db.prepare('INSERT INTO images (image) VALUES (?)');
    const result = stmt.run(imageData);
    return result.lastInsertRowid;
  },
  
  // Parse composition (future enhancement)
  parseComposition: (compositionText) => {
    // Extract primary material
    // "Silver (.925)" â†’ "Silver"
    const match = compositionText.match(/^([A-Za-z]+)/);
    return match ? match[1] : compositionText;
  }
};
```

### 4.3 API Call Strategy

**For most fields:** Call `GET /types/{type_id}`

**For mintmark and issue-specific data:**
```javascript
// Option 1: Call GET /types/{type_id}/issues to get all issues
// Option 2: If user's coin has a specific year, find matching issue
// Option 3: Take first issue if only one exists

async function fetchTypeWithIssues(typeId) {
  const type = await fetch(`/types/${typeId}`);
  const issues = await fetch(`/types/${typeId}/issues`);
  
  return {
    ...type,
    issues: issues  // Add issues to type data
  };
}

// Then match user's year to correct issue
function findMatchingIssue(issues, userYear) {
  return issues.find(issue => 
    issue.year === userYear || 
    (issue.min_year <= userYear && issue.max_year >= userYear)
  );
}
```

---

## SECTION 5: IMPLEMENTATION STATUS

1. ✅ **API Structure Documented** - Complete
2. ✅ **Field Paths Verified** - Complete
3. ✅ **Default Mapping Config Created** - DEFAULT_FIELD_MAPPING in default-field-mapping.js (39 fields)
4. ✅ **Transformation Functions Built** - 9 shared transforms + inline transforms in NUMISTA_SOURCES
5. ✅ **Catalog Number Parser Implemented** - getCatalogNumber() helper with user-configurable catalog codes
6. ✅ **Tested with Real API Calls** - Full end-to-end testing complete

### NUMISTA_SOURCES Registry (Added February 2, 2026)

A centralized registry of 49 Numista data sources was added to default-field-mapping.js. This decouples source definitions from target field assignments, enabling users to change which Numista source maps to each OpenNumismat field via the Data Settings UI.

**Source Groups:** Basic (3), Issuer (2), Ruler (2), Value (3), Physical (6), Obverse (6), Reverse (6), Edge (4), Issue (3), Pricing (4), Catalog (5), Other (3), System (1)

Each source has: path, displayName, transform, group, and optional requiresIssueData/requiresPricingData flags.

**User-Configurable Field Mapping:**
Each field in DEFAULT_FIELD_MAPPING has a defaultSourceKey pointing to its default source in NUMISTA_SOURCES. Users can change the source for any field via the Field Mappings tab in Data Settings. Changes are persisted in the collection settings JSON file and loaded via settingsManager.buildFieldMapperConfig() when creating a FieldMapper instance.

### Test API Call Needed:

**Endpoint:** `GET https://api.numista.com/v3/types/18059`  
(1943 Lincoln Steel Cent)

**Headers:**
```
Numista-API-Key: i883i335qeAa8fFHKXbWfkoIyZ1wuWJmvulRgwuA
```

**This will verify:**
- Exact JSON structure matches specification
- All field paths are correct
- Image URLs are accessible
- References array format

---

## SUMMARY OF CRITICAL FINDINGS

### âœ… CONFIRMED:
1. **Engraver fields exist** - `obverse.engravers` and `reverse.engravers` (arrays)
2. **Designer fields exist** - `obverse.designers` and `reverse.designers` (arrays)
3. **Edge images exist** - `edge.picture` and `edge.thumbnail` âœ…
4. **Mintmark exists** - `issue.mint_letter` âœ…
5. **Catalog numbers** - In `references` array, NOT `id` field âš ï¸

### âŒ CORRECTED:
1. **catalognum1-4 â†’ references** (NOT id)
2. **obversevar/reversevar â†’ description** (NOT separate variety field)
3. **diameter â†’ size** (NOT diameter)
4. **Images â†’ obverse.picture** (NOT images.obverse)

### âš ï¸ REQUIRES SPECIAL HANDLING:
1. **Catalog numbers** - Parse array, map by code
2. **Engravers/Designers** - Arrays, need to join or take first
3. **Images** - Download and insert to images table
4. **Year** - User preference: never override
5. **Mintmark** - Requires issue data
6. **Composition** - Verbose text, may need parsing
7. **Unit** - Must parse from value.text

---

**Document Status:** COMPLETE - Implementation done  
**Last Updated:** 2026-02-02  
**Next Action:** Field mapping system is fully implemented and user-configurable
