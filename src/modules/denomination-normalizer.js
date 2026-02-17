/**
 * @fileoverview denomination-normalizer.js — Denomination unit normalization and search form resolution.
 *
 * Exports:
 *   normalizeUnit(raw) — canonical form lookup via alias map + diacritic stripping + simple plural strip
 *   unitsMatch(unitA, unitB) — true if both normalize to the same canonical form
 *   getSearchForm(canonical, numericValue) — singular (1) or plural form for Numista search queries
 *   getAlternateSearchForms(unit, numericValue) — all plural forms when alias spans multiple canonicals
 *   DENOMINATION_ALIASES — flat map: raw variant → canonical form
 *   DENOMINATION_PLURALS — canonical → plural form (from denomination-aliases.json)
 *   ALL_CANONICALS — raw variant → array of all canonical forms it belongs to
 *   ISSUER_DENOMINATION_OVERRIDES — canonical → issuer code → { singular, plural } (country exceptions)
 * Storage: reads src/data/denomination-aliases.json and src/data/issuer-denomination-overrides.json at load
 * Note: Lesson 17 — Numista API does not cross-match denomination languages; use getAlternateSearchForms()
 * Note: Lesson 28 — issuer-specific plural overrides stored in issuer-denomination-overrides.json
 * Called by: numista-api.js (denomination matching and search), src/main/index.js (search-numista)
 */

const path = require('path');
const fs = require('fs');

/**
 * Load denomination aliases from JSON and build lookup maps.
 * Supports new object format: { aliases: [...], plural: "..." }
 * and legacy array format: ["variant1", "variant2", ...]
 *
 * When an alias appears in multiple canonical entries (e.g., "heller" appears in
 * both "heller" and "haléř" entries), the aliasMap maps to the last-processed
 * canonical (for matching), while allCanonicalsMap tracks ALL canonicals per alias
 * (for generating alternate search forms).
 *
 * @returns {{ aliasMap: Object, pluralMap: Object, allCanonicalsMap: Object }}
 */
function loadAliases() {
  const aliasPath = path.join(__dirname, '..', 'data', 'denomination-aliases.json');
  const raw = JSON.parse(fs.readFileSync(aliasPath, 'utf8'));
  const aliasMap = {};
  const pluralMap = {};
  const allCanonicalsMap = {}; // alias -> Set of all canonicals it belongs to
  for (const [canonical, value] of Object.entries(raw)) {
    if (canonical.startsWith('_')) continue; // skip _comment, _section_* etc.
    if (Array.isArray(value)) {
      // Legacy array format
      for (const variant of value) {
        const key = variant.toLowerCase();
        aliasMap[key] = canonical;
        if (!allCanonicalsMap[key]) allCanonicalsMap[key] = new Set();
        allCanonicalsMap[key].add(canonical);
      }
    } else if (value && typeof value === 'object') {
      // New object format with aliases and plural
      if (Array.isArray(value.aliases)) {
        for (const variant of value.aliases) {
          const key = variant.toLowerCase();
          aliasMap[key] = canonical;
          if (!allCanonicalsMap[key]) allCanonicalsMap[key] = new Set();
          allCanonicalsMap[key].add(canonical);
        }
      }
      if (value.plural) {
        pluralMap[canonical] = value.plural;
      }
    }
  }
  // Convert Sets to arrays for serialization (IPC transfer to renderer)
  const allCanonicalsMapArr = {};
  for (const [key, canonicals] of Object.entries(allCanonicalsMap)) {
    allCanonicalsMapArr[key] = Array.from(canonicals);
  }
  return { aliasMap, pluralMap, allCanonicalsMap: allCanonicalsMapArr };
}

const { aliasMap: DENOMINATION_ALIASES, pluralMap: DENOMINATION_PLURALS, allCanonicalsMap: ALL_CANONICALS } = loadAliases();

/**
 * Issuer-specific denomination form overrides.
 * Maps canonical denomination -> Numista issuer code -> { singular, plural } override forms.
 * When a resolved issuer code matches an entry, its form takes priority over the
 * default plural from DENOMINATION_PLURALS (denomination-aliases.json).
 * Only exception cases are listed — issuers not present fall through to the default.
 * Data source: src/data/issuer-denomination-overrides.json
 * @type {Object.<string, Object.<string, {singular: string, plural: string}>>}
 */
const ISSUER_DENOMINATION_OVERRIDES = (() => {
  const overridesPath = path.join(__dirname, '..', 'data', 'issuer-denomination-overrides.json');
  const raw = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));
  const result = {};
  for (const [canonical, value] of Object.entries(raw)) {
    if (canonical.startsWith('_')) continue;
    if (value && typeof value === 'object') result[canonical] = value;
  }
  return result;
})();

/**
 * Normalize a denomination unit string to its canonical form.
 * @param {string|null} raw - Raw unit string (e.g., "Kopeks", "pfenning", "Cents")
 * @returns {string} Canonical form, or cleaned input if not in alias map
 */
function normalizeUnit(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const unit = raw.normalize('NFC').toLowerCase().trim().replace(/[.]/g, '');
  if (unit === '') return '';

  // Direct alias lookup
  if (DENOMINATION_ALIASES[unit]) return DENOMINATION_ALIASES[unit];

  // Strip diacritics (ö→o, é→e, ř→r, etc.) and retry alias lookup
  const stripped = unit.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (stripped !== unit && DENOMINATION_ALIASES[stripped]) return DENOMINATION_ALIASES[stripped];

  // Strip trailing 's' for simple plurals and retry
  if (unit.endsWith('s') && unit.length > 2) {
    const singular = unit.slice(0, -1);
    if (DENOMINATION_ALIASES[singular]) return DENOMINATION_ALIASES[singular];
    const strippedSingular = singular.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (strippedSingular !== singular && DENOMINATION_ALIASES[strippedSingular]) return DENOMINATION_ALIASES[strippedSingular];
  }

  // Return accent-stripped form for fallback dice comparison
  return stripped;
}

/**
 * Get the correct singular or plural form of a denomination for Numista search.
 * @param {string} canonical - Canonical (singular) denomination form
 * @param {number} numericValue - The numeric value (1 = singular, otherwise plural)
 * @returns {string} The correct form for the given value
 */
function getSearchForm(canonical, numericValue) {
  if (!canonical) return canonical;
  if (numericValue === 1) return canonical;
  // Return explicit plural if available, otherwise return canonical as-is
  return DENOMINATION_PLURALS[canonical] || canonical;
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

/**
 * Get all alternate search forms for a denomination unit.
 * When a denomination alias appears in multiple canonical entries (e.g., "heller"
 * is both its own canonical and an alias of "haléř"), this returns the plural
 * forms of ALL those canonicals — enabling the search to try each variant.
 * @param {string} unit - Raw denomination unit string
 * @param {number} numericValue - Numeric value (for singular/plural selection)
 * @returns {string[]} All search forms (may be empty if no alternates exist)
 */
function getAlternateSearchForms(unit, numericValue) {
  if (!unit) return [];
  const key = unit.toLowerCase().trim().replace(/[.]/g, '');
  const canonicals = ALL_CANONICALS[key];
  if (!canonicals || canonicals.length <= 1) return [];
  // Return the search form for each canonical
  return canonicals.map(c => getSearchForm(c, numericValue));
}

module.exports = { normalizeUnit, unitsMatch, getSearchForm, getAlternateSearchForms, DENOMINATION_ALIASES, DENOMINATION_PLURALS, ALL_CANONICALS, ISSUER_DENOMINATION_OVERRIDES };
