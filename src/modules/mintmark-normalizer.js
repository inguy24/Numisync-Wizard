/**
 * Mintmark Normalizer
 *
 * Normalizes mintmark strings for consistent comparison between
 * OpenNumismat user data and Numista API issue data.
 *
 * Handles variations like: "D" vs "(D)" vs "Denver" vs "d"
 */

// US Mint city names to mintmark letters
const US_MINT_MAP = {
  'philadelphia': 'P',
  'denver': 'D',
  'san francisco': 'S',
  'west point': 'W',
  'new orleans': 'O',
  'charlotte': 'C',
  'carson city': 'CC',
  'dahlonega': 'D',
  'manila': 'M',
};

// Common world mint names to mintmark codes
const WORLD_MINT_MAP = {
  'mexico city': 'MO',
  'kremnica': 'MK',
  'paris': 'A',
  'berlin': 'A',
  'hamburg': 'J',
  'munich': 'D',
  'stuttgart': 'F',
  'karlsruhe': 'G',
  'vienna': 'W',
  'brussels': 'B',
  'ottawa': 'C',
  'melbourne': 'M',
  'sydney': 'S',
  'perth': 'P',
  'bombay': 'B',
  'mumbai': 'B',
  'calcutta': 'C',
  'kolkata': 'C',
  'pretoria': 'SA',
  'london': '',
  'tower mint': '',
  'royal mint': '',
  'utrecht': '',
  'rome': 'R',
  'birmingham': 'H',
};

/**
 * Normalize a raw mintmark string to a standard form for comparison.
 *
 * Steps:
 * 1. Trim whitespace
 * 2. Check city name maps (case-insensitive)
 * 3. Strip parentheses, brackets, periods
 * 4. Uppercase the result
 *
 * @param {string|null} raw - Raw mintmark string
 * @returns {string} - Normalized mintmark (empty string if null/blank)
 */
function normalizeMintmark(raw) {
  if (!raw || typeof raw !== 'string') return '';

  let mark = raw.trim();
  if (mark === '') return '';

  // Check city name maps first (before stripping characters)
  const lowerMark = mark.toLowerCase();
  if (US_MINT_MAP[lowerMark] !== undefined) {
    return US_MINT_MAP[lowerMark];
  }
  if (WORLD_MINT_MAP[lowerMark] !== undefined) {
    return WORLD_MINT_MAP[lowerMark];
  }

  // Strip parentheses, brackets, periods, and surrounding whitespace
  mark = mark.replace(/[()[\].]/g, '').trim();

  // Uppercase for consistent comparison
  return mark.toUpperCase();
}

/**
 * Compare two mintmark values after normalization.
 * Returns true if they match.
 *
 * Handles null/empty on both sides: two empty mintmarks are considered a match.
 *
 * @param {string|null} userMintmark - Mintmark from OpenNumismat coin data
 * @param {string|null} apiMintLetter - mint_letter from Numista API issue data
 * @returns {boolean} - True if the mintmarks match after normalization
 */
function mintmarksMatch(userMintmark, apiMintLetter) {
  const normalizedUser = normalizeMintmark(userMintmark);
  const normalizedApi = normalizeMintmark(apiMintLetter);

  return normalizedUser === normalizedApi;
}

module.exports = {
  normalizeMintmark,
  mintmarksMatch,
  US_MINT_MAP,
  WORLD_MINT_MAP
};
