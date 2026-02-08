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
