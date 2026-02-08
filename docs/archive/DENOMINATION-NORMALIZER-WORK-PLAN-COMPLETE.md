# Denomination Normalizer Work Plan

**Project:** NumiSync Wizard for OpenNumismat
**Feature:** Denomination Alias Normalizer
**Created:** February 7, 2026

---

## Quick Summary

Denomination matching fails for coins with transliteration or spelling variants. For example, "50 kopeks" (OpenNumismat) vs "50 Kopeck" (Numista API) produces a dice coefficient of only 0.6, below the 0.7 threshold. This causes a -20 point penalty instead of +25 points — a 45-point swing that prevents correct matches.

Solution: A denomination normalizer module (following the `mintmark-normalizer.js` pattern) backed by an external JSON alias file that can be updated without touching code.

---

## Task Status Dashboard

| ID | Task | Status | Priority | Dependencies |
|----|------|--------|----------|--------------|
| D.1 | Create `src/data/denomination-aliases.json` | ✅ Complete | HIGH | None |
| D.2 | Create `src/modules/denomination-normalizer.js` | ✅ Complete | HIGH | D.1 |
| D.3 | Integrate normalizer into `numista-api.js` (main process) | ✅ Complete | HIGH | D.2 |
| D.4 | Expose normalizer in `preload.js` | ✅ Complete | HIGH | D.2 |
| D.5 | Integrate normalizer into `app.js` (renderer process) | ✅ Complete | HIGH | D.4 |
| D.6 | Verification & testing | ✅ Complete | HIGH | D.3, D.5 |

**Legend:** ✅ Complete | 🔄 In Progress | ⏳ Pending

---

## Root Cause Analysis

### Current Matching Logic

Both `numista-api.js:576-578` (main process) and `app.js:3154-3157` (renderer) use identical unit comparison:

```javascript
const unitsMatch = coinUnit && matchUnit && (
  matchUnit.includes(coinUnit) || coinUnit.includes(matchUnit) ||
  diceCoefficient(coinUnit, matchUnit) > 0.7
);
```

### Why "kopeks" vs "kopeck" Fails

**Dice coefficient calculation:**
- Bigrams of "kopeks": `ko`, `op`, `pe`, `ek`, `ks` → 5 bigrams
- Bigrams of "kopeck": `ko`, `op`, `pe`, `ec`, `ck` → 5 bigrams
- Common bigrams: `ko`, `op`, `pe` → 3 matches
- Dice = 2 × 3 / (5 + 5) = **0.6** — below the 0.7 threshold

**Substring checks also fail:**
- "kopeck".includes("kopeks") → false
- "kopeks".includes("kopeck") → false

Result: The match scores -20 (mismatch penalty) instead of +25 (match bonus), a **45-point swing**.

### Other Affected Denominations

| User Input | Numista Value | Dice Score | Result |
|------------|---------------|------------|--------|
| kopeks | Kopeck | 0.60 | ❌ FAIL |
| kopek | Kopeck | 0.67 | ❌ FAIL |
| pfenning | Pfennig | 0.77 | ✅ Pass (barely) |
| rouble | Ruble | 0.50 | ❌ FAIL |
| pence | Penny | 0.40 | ❌ FAIL |
| groszy | Grosz | 0.50 | ❌ FAIL |
| drachmae | Drachma | 0.67 | ❌ FAIL |
| lire | Lira | 0.67 | ❌ FAIL |

### Existing Patterns to Follow

The project already solves this exact class of problem for other data:
- **Country aliases:** `ISSUER_ALIASES` map at `numista-api.js:14-32`
- **Mintmark aliases:** `mintmark-normalizer.js` with `US_MINT_MAP` and `WORLD_MINT_MAP`

The denomination normalizer follows the same pattern but stores data externally in JSON.

---

## D.1 — Create `src/data/denomination-aliases.json`

### Design

- JSON object where each key is a **canonical denomination name** and each value is an **array of known variants**
- `_section_*` keys serve as human-readable group headers (skipped by the normalizer)
- To add a new alias: append a string to the relevant array
- To add a new denomination family: add a new key with its variants array
- No code changes needed when updating aliases

### File Contents

```json
{
  "_comment": "Denomination alias families. Key = canonical form, Value = array of known variants. Edit this file to add new aliases without changing code. Keys starting with _ are ignored by the normalizer.",

  "_section_01": "=== RUSSIAN / SOVIET / CIS ===",
  "kopeck": ["kopeck", "kopek", "copeck", "kopeek", "kopeyka", "kopiejka", "kopiika", "kopiyka", "kopiyok", "kapiejka", "kop"],
  "ruble": ["ruble", "rouble", "rubl", "rubel", "rub"],

  "_section_02": "=== GERMANIC ===",
  "pfennig": ["pfennig", "pfenning", "pfennige", "pfennigen", "pf", "reichspfennig", "rentenpfennig"],
  "heller": ["heller", "haller", "halier", "haleru", "halere", "halierov", "hal"],
  "groschen": ["groschen", "gr"],
  "kreuzer": ["kreuzer", "kreutzer", "krajczar", "krajcar"],
  "thaler": ["thaler", "taler", "taller", "daler", "tolar", "riksdaler", "rigsdaler"],
  "mark": ["mark", "deutsche mark", "reichsmark", "rentenmark", "dm"],
  "markka": ["markka", "markkaa"],

  "_section_03": "=== SCANDINAVIAN ===",
  "krone": ["krone", "krona", "kroon", "koruna", "korona", "kronor", "kroner", "kronur"],
  "ore": ["ore", "oere", "aurar", "eyrir"],
  "penni": ["penni", "pennia"],
  "skilling": ["skilling", "skillinge"],

  "_section_04": "=== BRITISH / COMMONWEALTH ===",
  "penny": ["penny", "pence", "pennies"],
  "halfpenny": ["halfpenny", "halfpence"],
  "farthing": ["farthing"],
  "shilling": ["shilling", "schilling", "shilingi", "sh", "shs"],
  "crown": ["crown"],
  "florin": ["florin"],
  "guinea": ["guinea"],
  "sovereign": ["sovereign"],
  "groat": ["groat"],

  "_section_05": "=== CENT FAMILY (used worldwide) ===",
  "cent": ["cent", "ct", "cts"],
  "centime": ["centime"],
  "centavo": ["centavo", "cvo", "cvos"],
  "centesimo": ["centesimo", "centesimi"],
  "centimo": ["centimo"],
  "centas": ["centas", "centai"],
  "santims": ["santims"],
  "senti": ["senti"],
  "sent": ["sent"],

  "_section_06": "=== FRANC FAMILY ===",
  "franc": ["franc", "franken", "frank", "franchi", "fr"],
  "rappen": ["rappen", "rp"],

  "_section_07": "=== IBERIAN / LATIN AMERICAN ===",
  "real": ["real", "reis", "reais", "reales"],
  "peso": ["peso"],
  "peseta": ["peseta", "pta", "ptas"],
  "escudo": ["escudo"],
  "sol": ["sol", "soles"],
  "bolivar": ["bolivar", "bolivares"],
  "boliviano": ["boliviano", "bolivianos"],
  "guarani": ["guarani", "guaranies"],
  "colon": ["colon", "colones"],
  "cruzeiro": ["cruzeiro", "cruzeiros"],

  "_section_08": "=== DOLLAR / POUND / LIRA ===",
  "dollar": ["dollar", "dolar", "tala"],
  "pound": ["pound"],
  "lira": ["lira", "lire", "lirae", "lirasi", "lirot"],

  "_section_09": "=== EASTERN EUROPEAN ===",
  "grosz": ["grosz", "grosze", "groszy"],
  "zloty": ["zloty", "zlote", "zlotych", "zl"],
  "lev": ["lev", "leva"],
  "stotinka": ["stotinka", "stotinki"],
  "dinar": ["dinar", "dinara", "dinari", "din"],
  "denar": ["denar", "denari", "deni"],
  "para": ["para", "pare"],
  "kuna": ["kuna", "kune"],
  "lipa": ["lipa", "lipe"],
  "leu": ["leu", "lei"],
  "ban": ["ban", "bani"],
  "forint": ["forint", "ft"],
  "filler": ["filler"],
  "litas": ["litas", "litai"],
  "lats": ["lats", "lati"],

  "_section_10": "=== GREEK ===",
  "drachma": ["drachma", "drachmae", "drachmai", "drx"],
  "lepton": ["lepton", "lepta"],
  "obol": ["obol", "obolos", "obols"],

  "_section_11": "=== TURKISH / OTTOMAN ===",
  "kurus": ["kurus", "kurush"],
  "piastre": ["piastre", "qirsh", "girsh", "ghirsh", "guerche"],
  "akce": ["akce", "akche", "asper"],

  "_section_12": "=== MIDDLE EAST ===",
  "fils": ["fils", "fulus", "fil"],
  "rial": ["rial", "riyal"],
  "dirham": ["dirham", "dirhem", "dh", "dhs"],
  "agora": ["agora", "agorot"],
  "shekel": ["shekel", "sheqel", "sheqalim"],
  "pruta": ["pruta", "prutot", "prutah"],
  "halala": ["halala"],
  "baiza": ["baiza", "baisa"],

  "_section_13": "=== SOUTH ASIA ===",
  "rupee": ["rupee", "rupie", "rs", "re"],
  "paisa": ["paisa", "paise", "pice", "np"],
  "anna": ["anna"],
  "pie": ["pie"],
  "rupiah": ["rupiah"],
  "mohur": ["mohur"],

  "_section_14": "=== EAST ASIA ===",
  "yen": ["yen", "en"],
  "sen": ["sen", "sene"],
  "rin": ["rin"],
  "yuan": ["yuan"],
  "jiao": ["jiao", "chiao"],
  "fen": ["fen"],
  "won": ["won"],
  "jeon": ["jeon", "chon"],
  "dong": ["dong"],
  "hao": ["hao"],
  "xu": ["xu"],

  "_section_15": "=== SOUTHEAST ASIA / OCEANIA ===",
  "baht": ["baht", "bat"],
  "satang": ["satang", "stang"],
  "ringgit": ["ringgit", "rm"],
  "kyat": ["kyat", "chat"],
  "pya": ["pya"],
  "kina": ["kina"],
  "toea": ["toea"],
  "vatu": ["vatu"],
  "paanga": ["paanga"],
  "seniti": ["seniti"],

  "_section_16": "=== AFRICA ===",
  "rand": ["rand"],
  "cedi": ["cedi", "cedis"],
  "pesewa": ["pesewa", "pesewas"],
  "naira": ["naira"],
  "kobo": ["kobo"],
  "kwacha": ["kwacha"],
  "tambala": ["tambala"],
  "ngwee": ["ngwee"],
  "dalasi": ["dalasi"],
  "butut": ["butut", "bututs"],
  "birr": ["birr"],
  "santim": ["santim", "santeem"],
  "kwanza": ["kwanza"],
  "ariary": ["ariary"],
  "leone": ["leone"],
  "lilangeni": ["lilangeni", "emalangeni"],
  "loti": ["loti", "maloti"],
  "pula": ["pula"],
  "thebe": ["thebe"],
  "ouguiya": ["ouguiya"],
  "millime": ["millime"]
}
```

---

## D.2 — Create `src/modules/denomination-normalizer.js`

### Design

Follows `src/modules/mintmark-normalizer.js` pattern:
- Loads JSON at require-time
- Inverts the family→variants structure into a flat variant→canonical lookup map
- Provides `normalizeUnit(raw)` and `unitsMatch(unitA, unitB)` functions
- Falls back to returning cleaned input when no alias found (allows dice coefficient fallback)

### Module Code

```javascript
/**
 * Denomination Normalizer
 *
 * Normalizes denomination unit strings for consistent comparison between
 * OpenNumismat user data and Numista API data.
 *
 * Alias data is stored externally in src/data/denomination-aliases.json
 * so it can be updated without modifying code.
 */

const path = require('path');
const fs = require('fs');

/**
 * Load denomination aliases from JSON and build a flat variant -> canonical lookup map.
 * @returns {Object} Map of lowercase variant string to canonical denomination name
 */
function loadAliases() {
  const aliasPath = path.join(__dirname, '..', 'data', 'denomination-aliases.json');
  const raw = JSON.parse(fs.readFileSync(aliasPath, 'utf8'));
  const map = {};
  for (const [canonical, variants] of Object.entries(raw)) {
    if (canonical.startsWith('_')) continue; // skip _comment, _section_* etc.
    for (const variant of variants) {
      map[variant.toLowerCase()] = canonical;
    }
  }
  return map;
}

const DENOMINATION_ALIASES = loadAliases();

/**
 * Normalize a denomination unit string to its canonical form.
 * @param {string|null} raw - Raw unit string (e.g., "Kopeks", "pfenning", "Cents")
 * @returns {string} Canonical form, or cleaned input if not in alias map
 */
function normalizeUnit(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const unit = raw.toLowerCase().trim().replace(/[.]/g, '');
  if (unit === '') return '';

  // Direct alias lookup
  if (DENOMINATION_ALIASES[unit]) return DENOMINATION_ALIASES[unit];

  // Strip trailing 's' for simple plurals and retry
  if (unit.endsWith('s') && unit.length > 2) {
    const singular = unit.slice(0, -1);
    if (DENOMINATION_ALIASES[singular]) return DENOMINATION_ALIASES[singular];
  }

  // Return cleaned input for fallback dice comparison
  return unit;
}

/**
 * Check if two denomination unit strings refer to the same denomination.
 * @param {string|null} unitA - First unit string
 * @param {string|null} unitB - Second unit string
 * @returns {boolean} True if both normalize to the same canonical form
 */
function unitsMatch(unitA, unitB) {
  const a = normalizeUnit(unitA);
  const b = normalizeUnit(unitB);
  if (!a || !b) return false;
  return a === b;
}

module.exports = { normalizeUnit, unitsMatch, DENOMINATION_ALIASES };
```

---

## D.3 — Integrate into `src/modules/numista-api.js`

### File: `src/modules/numista-api.js`

**Add import (line 2):**
```javascript
const { unitsMatch: denominationUnitsMatch } = require('./denomination-normalizer');
```

**Replace lines 576-578** (the `unitsMatch` local variable):

Before:
```javascript
const unitsMatch = coinUnit && matchUnit && (
  matchUnit.includes(coinUnit) || coinUnit.includes(matchUnit) ||
  diceCoefficient(coinUnit, matchUnit) > 0.7
);
```

After:
```javascript
const unitsAreMatch = coinUnit && matchUnit && (
  denominationUnitsMatch(coinUnit, matchUnit) ||
  diceCoefficient(coinUnit, matchUnit) > 0.7
);
```

**Update reference on line 581:** `unitsMatch` → `unitsAreMatch`

Note: Local variable renamed to `unitsAreMatch` to avoid shadowing the imported function name.

---

## D.4 — Expose in `src/main/preload.js`

### File: `src/main/preload.js`

**Add import (near top, before contextBridge calls):**
```javascript
const { normalizeUnit, unitsMatch: denominationUnitsMatch } = require('../modules/denomination-normalizer');
```

**Update line 145** (the stringSimilarity exposure):

Before:
```javascript
contextBridge.exposeInMainWorld('stringSimilarity', { diceCoefficient });
```

After:
```javascript
contextBridge.exposeInMainWorld('stringSimilarity', {
  diceCoefficient,
  normalizeUnit,
  unitsMatch: denominationUnitsMatch
});
```

---

## D.5 — Integrate into `src/renderer/app.js`

### File: `src/renderer/app.js`

**Replace lines 3154-3157:**

Before:
```javascript
const unitsMatch = coinUnit && matchUnit && (
  matchUnit.includes(coinUnit) || coinUnit.includes(matchUnit) ||
  window.stringSimilarity.diceCoefficient(coinUnit, matchUnit) > 0.7
);
```

After:
```javascript
const unitsMatch = coinUnit && matchUnit && (
  window.stringSimilarity.unitsMatch(coinUnit, matchUnit) ||
  window.stringSimilarity.diceCoefficient(coinUnit, matchUnit) > 0.7
);
```

---

## D.6 — Verification Checklist

- [ ] App launches without errors (JSON loads successfully)
- [ ] Match coin with "kopeks" unit against Numista "Kopeck" — should score +25 instead of -20
- [ ] Test "pfenning" vs "pfennig" — should match
- [ ] Test "rouble" vs "ruble" — should match
- [ ] Test "pence" vs "penny" — should match
- [ ] Test "groszy" vs "grosz" — should match
- [ ] Verify standard matches still work (cent/cents, dollar/dollars via dice fallback)
- [ ] Test edge cases: empty unit, null unit, unknown denomination (falls through to dice)
- [ ] Edit `denomination-aliases.json` to add a test alias, restart app, confirm it takes effect
- [ ] Auto-propagate and fast pricing features still work correctly

---

## Reference: Key File Locations

| File | Purpose | Lines of Interest |
|------|---------|-------------------|
| `src/modules/numista-api.js` | Main process matching | 576-578 (unit comparison), 581 (unitsMatch reference) |
| `src/renderer/app.js` | Renderer process matching | 3154-3157 (unit comparison) |
| `src/main/preload.js` | Bridge to renderer | 145 (stringSimilarity exposure) |
| `src/modules/mintmark-normalizer.js` | Pattern to follow | Entire file (64-101 especially) |
| `src/modules/numista-api.js` | ISSUER_ALIASES pattern | 14-32 |

---

## Reference: Numista Denomination Conventions

- Numista uses **English spellings** per Oxford/Wiktionary as canonical form
- The `value.text` field contains full denomination text (e.g., "5 Cents", "1 Kopeck", "50 Pfennig")
- The `value.currency.id` and `value.currency.name` are also available but not currently used for matching
- Numista uses **"Kopeck"** (double-k), Krause uses **"Kopek"** (single-k)
- OpenNumismat users may type any variant into the `unit` field

---

**Document Status:** COMPLETE
**Completed:** February 7, 2026

### Implementation Notes

- **D.4 deviation:** Electron 28 sandbox prevents preload from using `require('fs')` / `require('path')`. Instead of importing `denomination-normalizer.js`, the alias map and functions were inlined directly in `preload.js` (same pattern as `diceCoefficient`). The `denomination-normalizer.js` module is used by the main process (`numista-api.js`) which has full Node.js access.
- **Search query normalization (added beyond original plan):** `normalizeUnitForSearch()` helper added to `app.js` to normalize spelling in search queries while preserving plurality. Numista's search API is sensitive to singular vs plural (e.g., "kopeck" returns 0 results but "kopecks" finds matches). The helper re-appends 's' to the canonical form when the original input was plural.
- **Three search builders updated:** `buildSearchParams()`, `buildCoreQuery()`, `buildMinimalQuery()` all use `normalizeUnitForSearch()` for API queries.
