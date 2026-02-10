# Plan: Denomination Alias Plural/Singular Support + Missing Currencies

## Context
When searching Numista, the API is strict about plural vs singular denomination forms. "1 centavos" returns no results but "1 centavo" does. OpenNumismat stores units as a fixed string regardless of quantity, so we often send the wrong form. Manual search also sends raw user input with no normalization at all. Additionally, the alias file is missing many UN-recognized currencies and fractional units.

**Current architecture:**
- `src/data/denomination-aliases.json` stores `canonical: [variant, variant, ...]` arrays
- `src/modules/denomination-normalizer.js` loads aliases, builds `variant -> canonical` map, exports `normalizeUnit()` and `unitsMatch()`
- `src/main/index.js` line 663: IPC handler `get-denomination-aliases` sends alias map to renderer
- `src/main/preload.js` lines 15-45: receives alias map, implements local `normalizeUnit()` and `denominationUnitsMatch()`, exposes via `window.stringSimilarity`
- `src/renderer/app.js` line 2846: `normalizeUnitForSearch(unit)` normalizes spelling but uses a flawed "wasPlural" heuristic (just checks if input ends in 's' and re-adds it)
- `src/renderer/app.js` lines 2865-2908: `buildCoreQuery()` and `buildMinimalQuery()` use `normalizeUnitForSearch()` for auto search
- `src/renderer/app.js` line 4574: manual search sends user's raw query with zero normalization
- `src/main/index.js` line 918: `manual-search-numista` handler passes query directly to Numista API

**The problem:**
1. `normalizeUnitForSearch` bases plurality on the *input spelling* (ends in 's'?), not the *numeric value*
2. Simply appending 's' doesn't work for non-English plurals (sol->soles, leu->lei, lira->lire)
3. Words like "fils", "lats", "centas" end in 's' but are singular
4. Manual search has no normalization at all
5. Many UN-recognized denominations are missing from the alias file

## Changes Overview

### 0. Research alternate spellings for new currencies and fractional units

Before writing any code, research alternate spellings/transliterations for each new denomination being added. Many of these have multiple romanizations (e.g., hryvnia/hryvnya/gryvnia/grivna, tugrik/togrog/tugrug). Use web searches to find:
- Common English transliterations and variant spellings used on Numista and in numismatic catalogs
- Abbreviations commonly seen on coins
- Historical vs modern spelling differences

This research informs what goes into the aliases arrays in step 1.

### 1. Restructure `src/data/denomination-aliases.json`

Change from flat array format to object format with explicit plural:

**Before:**
```json
"centavo": ["centavo", "cvo", "cvos"]
```

**After:**
```json
"centavo": { "aliases": ["centavo", "cvo", "cvos", "centavos"], "plural": "centavos" }
```

- `aliases` array: ALL known variants including the plural form (for lookup)
- `plural` string: the correct plural form for Numista search queries
- Canonical key remains the singular form
- Entries where singular == plural (e.g., "sen", "baht") will have `"plural": "sen"` etc.
- Add all missing currencies and fractional units from UN_currencies.csv with researched spelling variants

### 2. Update `src/modules/denomination-normalizer.js`

**`loadAliases()` changes:**
- Parse new object structure: `{ aliases: [...], plural: "..." }`
- Build two maps:
  - `ALIAS_MAP`: `variant (lowercase) -> canonical` (same purpose as today)
  - `PLURAL_MAP`: `canonical -> plural form` (new)
- Backward-compatible: if value is an array (old format), treat as aliases-only with plural = canonical + 's' fallback

**New function: `getSearchForm(canonical, numericValue)`**
- If `numericValue === 1`, return canonical (singular)
- If `numericValue !== 1`, return `PLURAL_MAP[canonical]` or canonical if no plural defined
- Export this function

**Existing `normalizeUnit()` and `unitsMatch()`:** No changes needed - they still map variants to canonical singular form for confidence scoring.

### 3. Update `src/main/index.js`

**`get-denomination-aliases` IPC handler (line 663):**
- Send both `ALIAS_MAP` and `PLURAL_MAP` to the renderer (currently only sends ALIAS_MAP)

### 4. Update `src/main/preload.js`

- Receive both maps from main process
- Add `getSearchForm(canonical, numericValue)` function mirroring the normalizer
- Expose `getSearchForm` via `window.stringSimilarity`

### 5. Update `src/renderer/app.js`

**`normalizeUnitForSearch(unit, value)` (line 2846):**
- Accept numeric `value` parameter
- Normalize unit to canonical form
- Call `window.stringSimilarity.getSearchForm(canonical, value)` to get correct singular/plural
- Remove the old "wasPlural / re-add 's'" hack

**`buildCoreQuery(coin)` (line 2865):**
- Pass `coin.value` to `normalizeUnitForSearch(coin.unit, coin.value)`

**`buildMinimalQuery(coin)` (line 2890):**
- No numeric value here (unit only). Use singular canonical form (safest for broad search).

**`searchForMatches()` around line 3050:**
- Pass numeric value where available

**New function: `normalizeDenominationInQuery(queryText)`**
- Parse query for `(\d+\.?\d*)\s+(\w+)` patterns
- For each match, check if the word is a known denomination alias
- Replace with correct singular/plural form based on the numeric value
- Return corrected query text

**Manual search handler (line 4574):**
- Before sending query to main process, run `normalizeDenominationInQuery(searchTerm)` on the user's input
- If the query was modified, show the corrected query to the user (e.g., status bar or inline text: "Searched for: Philippines 1 centavo 1944") so the normalization is transparent

### 6. Add Missing Denominations to Alias File

From UN_currencies.csv, the following are **missing entirely** and need to be added with aliases and plurals researched:

**Main currency units missing:**
- lek (plural: leke/leku), qintar (plural: qindarka)
- dram (plural: dram), luma (plural: luma)
- manat (plural: manat), qapik (plural: qapik)
- taka (plural: taka), poisha (plural: poisha)
- ngultrum (plural: ngultrum), chetrum (plural: chetrum)
- convertible mark -> already have "mark", add fening (plural: feninga)
- riel (plural: riels)
- gourde (plural: gourdes)
- kip (plural: kip), att (plural: att)
- lempira (plural: lempiras)
- quetzal (plural: quetzales)
- cordoba (plural: cordobas)
- rufiyaa (plural: rufiyaa), laari (plural: laari)
- metical (plural: meticais)
- nakfa (plural: nakfa)
- somoni (plural: somoni), diram (plural: diram)
- tugrik (plural: tugriks), mongo (plural: mongo)
- hryvnia (plural: hryven/hryvni; aliases: hryvnya, gryvnia, grivna)
- sum/som (Uzbek) (plural: sum), tiyin (plural: tiyin)
- ouguiya - already exists, add khoums (plural: khoums)
- ariary - exists, add iraimbilanja (plural: iraimbilanja)
- tala (plural: tala), sene - already exists
- pa'anga (plural: pa'anga), seniti - already exists
- balboa (plural: balboas), centesimo (plural: centesimos)
- guarani - exists, add plural "guaranies"
- colon - exists, but add "colones" as alias+plural
- sentimo (Philippines fractional, plural: sentimos)
- piaster (alias of piastre, plural: piasters)
- grosz - exists, add "grosze", "groszy" already there
- pesewa - exists
- tetri (plural: tetri)
- lari (plural: lari)
- tenge (Kazakh, plural: tenge), tiyin (plural: tiyin)
- som (Kyrgyz, plural: som), tyiyn (plural: tyiyn)

**Plurals missing for existing entries:**
- "cent" -> add "cents"
- "centime" -> add "centimes"
- "centavo" -> add "centavos"
- "centimo" -> add "centimos"
- "centesimo" -> add "centesimos"
- "franc" -> add "francs"
- "dollar" -> add "dollars"
- "pound" -> add "pounds"
- "shilling" -> add "shillings"
- "dinar" -> add "dinars"
- "rial" -> add "rials", "riyals"
- "dirham" -> add "dirhams"
- "rupee" -> add "rupees"
- "rupiah" -> add "rupiahs"
- "peso" -> add "pesos"
- "real" -> plural is "reais" (already in aliases)
- "euro" -> "euros" already in aliases
- "lira" -> "lire" already in aliases
- "krone" -> "kroner"/"kronor" already there
- "fils" -> "fils" (same singular/plural)
- "kopeck" -> add "kopecks"
- "ruble" -> add "rubles", "roubles"
- "pfennig" -> add "pfennige" (already there), "pfennigs"
- "zloty" -> add "zlotys"
- "lev" -> "leva" already there
- "drachma" -> "drachmae" already there
- "baht" -> add "bahts" (though Thai doesn't pluralize, Numista may)
- "won" -> add "won" (same singular/plural)
- "yen" -> add "yen" (same)
- "yuan" -> add "yuan" (same)
- "rand" -> add "rand" (same)
- "kwacha" -> add "kwacha" (same)
- "birr" -> add "birr" (same)
- "cedi" -> "cedis" already there
- "naira" -> add "naira" (same)
- "leone" -> add "leones"

## Files to Modify

1. `src/data/denomination-aliases.json` - Restructure + add missing denominations
2. `src/modules/denomination-normalizer.js` - Parse new structure, add getSearchForm()
3. `src/main/index.js` - Update IPC handler to send both maps
4. `src/main/preload.js` - Receive both maps, add getSearchForm()
5. `src/renderer/app.js` - Update normalizeUnitForSearch(), add manual search normalization

## Verification

1. Start the app and load a collection
2. Test automatic search with a coin that has value=1 and a plural unit (e.g., "1 Centavos") - should search as "1 centavo"
3. Test automatic search with value>1 and singular unit (e.g., "50 Centavo") - should search as "50 centavos"
4. Test manual search: type "Philippines 1 centavos 1944" - should normalize to "Philippines 1 centavo 1944" before sending
5. Test manual search with value > 1: "50 centavo" -> "50 centavos"
6. Test that confidence scoring still works (unitsMatch should be unchanged)
7. Test denomination that doesn't pluralize with 's' (e.g., "1 lire" -> "1 lira", "2 lira" -> "2 lire")
