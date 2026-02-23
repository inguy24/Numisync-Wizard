# Plan: Move US Denomination Cent Values to denomination-aliases.json

## Context

The current implementation has `US_DENOM_CENT_VALUES` hardcoded as a JavaScript constant in two places (`app.js` and `numista-api.js`). This constant encodes that 1 dime = 10 cents, 1 nickel = 5 cents, etc. — numeric equivalences used during confidence scoring to match coins stored as "10 Cents" against Numista's "1 Dime".

This is inconsistent with the project's data-driven architecture: spelling variants, plural forms, and issuer-specific overrides are all in JSON data files. The cent-value relationship belongs there too, so it can be extended without touching JS code.

**Secondary issue found during exploration:** `preload.js` has its own copy of `normalizeUnit()` that is missing the ASCII fraction prefix conversion added to `denomination-normalizer.js` (the `asciiToUnicode` block). This means `window.stringSimilarity.unitsMatch("1/2 franc", "franc")` won't work correctly from the renderer. This plan fixes that divergence at the same time since we're already touching the preload data pipeline.

## Critical Files

| File | Change |
|------|--------|
| `src/data/denomination-aliases.json` | Add `cent_value` field to dime, nickel, quarter, half dollar entries |
| `src/modules/denomination-normalizer.js` | Build + export `DENOMINATION_CENT_VALUES` in `loadAliases()` |
| `src/main/index.js` (line 948) | Include `centValueMap` in `get-denomination-aliases` IPC return |
| `src/main/preload.js` | Receive `centValueMap`, expose as `window.stringSimilarity.centValues`; fix `normalizeUnit()` ASCII fraction gap |
| `src/renderer/app.js` | Remove `US_DENOM_CENT_VALUES` constant; replace with `window.stringSimilarity.centValues` |
| `src/modules/numista-api.js` | Remove `US_DENOM_CENT_VALUES` constant; import `DENOMINATION_CENT_VALUES` from denomination-normalizer |
| `docs/CHANGELOG.md` | Add entry |

## Implementation Steps

### Step 1 — `src/data/denomination-aliases.json`: Add `cent_value`

Add `cent_value` to the 4 US colloquial denomination entries:

```json
"dime": {
  "aliases": ["dime", "dimes"],
  "plural": "dimes",
  "cent_value": 10
},
"nickel": {
  "aliases": ["nickel", "nickels"],
  "plural": "nickels",
  "cent_value": 5
},
"quarter": {
  "aliases": ["quarter", "quarters", "quarter dollar", "quarter dollars"],
  "plural": "quarters",
  "cent_value": 25
},
"half dollar": {
  "aliases": ["half dollar", "half dollars", "half-dollar", "half-dollars"],
  "plural": "half dollars",
  "cent_value": 50
}
```

---

### Step 2 — `src/modules/denomination-normalizer.js`: Build and export `DENOMINATION_CENT_VALUES`

In `loadAliases()`, add a `centValueMap` (canonical → cent_value). In the object-format branch of the existing loop:

```javascript
const centValueMap = {};
// inside the for loop, object-format branch:
if (typeof value.cent_value === 'number') {
  centValueMap[canonical] = value.cent_value;
}
```

Return `centValueMap` from `loadAliases()` and destructure at top level:

```javascript
const { aliasMap: DENOMINATION_ALIASES, pluralMap: DENOMINATION_PLURALS,
        allCanonicalsMap: ALL_CANONICALS, centValueMap: DENOMINATION_CENT_VALUES } = loadAliases();
```

Add `DENOMINATION_CENT_VALUES` to `module.exports`.

---

### Step 3 — `src/main/index.js` (line 948): Include `centValueMap` in IPC response

Update the import (line 29) and the `get-denomination-aliases` handler:

```javascript
const { DENOMINATION_ALIASES, DENOMINATION_PLURALS, ALL_CANONICALS,
        DENOMINATION_CENT_VALUES, ISSUER_DENOMINATION_OVERRIDES } = require('../modules/denomination-normalizer');

ipcMain.on('get-denomination-aliases', (event) => {
  event.returnValue = {
    aliasMap: DENOMINATION_ALIASES,
    pluralMap: DENOMINATION_PLURALS,
    allCanonicalsMap: ALL_CANONICALS,
    centValueMap: DENOMINATION_CENT_VALUES,
    issuerOverrides: ISSUER_DENOMINATION_OVERRIDES
  };
});
```

---

### Step 4 — `src/main/preload.js`: Receive `centValueMap` + fix `normalizeUnit()` divergence

**4a** — Update IPC destructure to include `centValueMap`:
```javascript
const { aliasMap: DENOMINATION_ALIASES, pluralMap: DENOMINATION_PLURALS,
        allCanonicalsMap: ALL_CANONICALS, centValueMap: DENOMINATION_CENT_VALUES,
        issuerOverrides: ISSUER_DENOMINATION_OVERRIDES } = ipcRenderer.sendSync('get-denomination-aliases');
```

**4b** — Replace preload's `normalizeUnit()` with the full version matching `denomination-normalizer.js` (adds ASCII fraction conversion + base denomination fallback — currently missing from preload):

```javascript
function normalizeUnit(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let unit = raw.normalize('NFC').toLowerCase().trim().replace(/[.]/g, '');
  if (unit === '') return '';
  const asciiToUnicode = { '1/2': '½', '1/4': '¼', '3/4': '¾', '1/3': '⅓', '2/3': '⅔',
    '1/5': '⅕', '2/5': '⅖', '3/5': '⅗', '4/5': '⅘', '1/8': '⅛', '3/8': '⅜',
    '5/8': '⅝', '7/8': '⅞' };
  unit = unit.replace(/^(\d+\/\d+)\s+/, (_, frac) =>
    (asciiToUnicode[frac] ? asciiToUnicode[frac] + ' ' : _));
  if (DENOMINATION_ALIASES[unit]) return DENOMINATION_ALIASES[unit];
  const baseDenom = unit.replace(/^[½¼¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]\s+/, '');
  if (baseDenom !== unit && DENOMINATION_ALIASES[baseDenom]) return DENOMINATION_ALIASES[baseDenom];
  const stripped = unit.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (stripped !== unit && DENOMINATION_ALIASES[stripped]) return DENOMINATION_ALIASES[stripped];
  if (unit.endsWith('s') && unit.length > 2) {
    const singular = unit.slice(0, -1);
    if (DENOMINATION_ALIASES[singular]) return DENOMINATION_ALIASES[singular];
    const strippedSingular = singular.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (strippedSingular !== singular && DENOMINATION_ALIASES[strippedSingular]) return DENOMINATION_ALIASES[strippedSingular];
  }
  return stripped;
}
```

**4c** — Add `centValues` to `contextBridge.exposeInMainWorld('stringSimilarity', { ... })`:
```javascript
centValues: DENOMINATION_CENT_VALUES,
```

---

### Step 5 — `src/renderer/app.js`: Remove hardcoded constant, use `window.stringSimilarity.centValues`

Remove the `US_DENOM_CENT_VALUES` constant block entirely.

In `calculateConfidence()`, replace the two `US_DENOM_CENT_VALUES` references:
```javascript
const centValues = window.stringSimilarity.centValues;
const matchUnitCentVal = matchUnit ? centValues[matchUnit.toLowerCase()] : null;
const coinUnitCentVal = coinUnit ? centValues[coinUnit.toLowerCase()] : null;
```

---

### Step 6 — `src/modules/numista-api.js`: Remove hardcoded constant, import from normalizer

Remove the `US_DENOM_CENT_VALUES` constant block.

Update the existing require at the top:
```javascript
const { unitsMatch: denominationUnitsMatch, DENOMINATION_CENT_VALUES } = require('./denomination-normalizer');
```

In `calculateMatchConfidence()`, replace the two `US_DENOM_CENT_VALUES` references:
```javascript
const matchUnitCentVal = matchUnit ? DENOMINATION_CENT_VALUES[matchUnit.toLowerCase()] : null;
const coinUnitCentVal = coinUnit ? DENOMINATION_CENT_VALUES[coinUnit.toLowerCase()] : null;
```

---

### Step 7 — `docs/CHANGELOG.md`

Add to v1.1.1 unreleased section:

```
| Feb 19 | Internal | src/data/denomination-aliases.json, src/modules/denomination-normalizer.js, src/main/index.js, src/main/preload.js, src/renderer/app.js, src/modules/numista-api.js | **Move US denomination cent values from hardcoded JS to data file** — US_DENOM_CENT_VALUES (dime=10, nickel=5, quarter=25, half dollar=50) was hardcoded in two JS files. Moved to denomination-aliases.json as cent_value fields; denomination-normalizer.js builds and exports DENOMINATION_CENT_VALUES; IPC pipeline updated to pass centValueMap to renderer; preload.js updated to expose window.stringSimilarity.centValues. Also fixed normalizeUnit() in preload.js to include ASCII fraction conversion that was missing relative to the backend module. |
```

---

## Verification

1. Restart the app — no startup errors.
2. DevTools console: `window.stringSimilarity.centValues` → `{ dime: 10, nickel: 5, quarter: 25, 'half dollar': 50 }`
3. Search "United States 10 Cents 1862" — "1 Dime Seated Liberty Dime" still ranks first.
4. `window.stringSimilarity.normalizeUnit("1/2 franc")` → `"franc"` (confirms preload ASCII fraction fix).
5. Spot-check a non-US coin (French franc) is unaffected.
