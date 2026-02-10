const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { mintmarksMatch } = require('./mintmark-normalizer');
const { unitsMatch: denominationUnitsMatch } = require('./denomination-normalizer');
const log = require('../main/logger').scope('NumistaAPI');

/**
 * Numista API Client
 *
 * Handles all communication with the Numista API v3.
 * Implements rate limiting, caching, and error handling.
 *
 * API Documentation: https://en.numista.com/api/doc/index.php
 * Base URL: https://api.numista.com/v3/
 */

// Load country name aliases from JSON data file
const ISSUER_DATA = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', 'data', 'issuer-aliases.json'), 'utf8'
));
const ISSUER_ALIASES = {};
for (const [key, value] of Object.entries(ISSUER_DATA)) {
  if (key.startsWith('_')) continue;
  for (const alias of value.aliases) {
    ISSUER_ALIASES[alias.toLowerCase()] = value.code;
  }
}

/**
 * Dice's coefficient string similarity (0.0 to 1.0).
 * Compares bigrams (pairs of consecutive characters) between two strings.
 *
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} - Similarity score between 0 and 1
 */
function diceCoefficient(a, b) {
  a = a.normalize('NFC').toLowerCase().trim();
  b = b.normalize('NFC').toLowerCase().trim();

  if (a === b) return 1.0;
  if (a.length < 2 || b.length < 2) return 0.0;

  const bigramsA = new Map();
  for (let i = 0; i < a.length - 1; i++) {
    const bigram = a.substring(i, i + 2);
    bigramsA.set(bigram, (bigramsA.get(bigram) || 0) + 1);
  }

  let intersectionSize = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const bigram = b.substring(i, i + 2);
    const count = bigramsA.get(bigram) || 0;
    if (count > 0) {
      bigramsA.set(bigram, count - 1);
      intersectionSize++;
    }
  }

  return (2.0 * intersectionSize) / ((a.length - 1) + (b.length - 1));
}

// Default persistent cache TTLs (overridden by user settings)
const DEFAULT_CACHE_TTL = {
  ISSUERS: 90 * 24 * 60 * 60 * 1000,      // 90 days
  TYPE_DATA: 30 * 24 * 60 * 60 * 1000,     // 30 days
  ISSUES_DATA: 30 * 24 * 60 * 60 * 1000    // 30 days
};

// Map API endpoint paths to usage tracking names
const ENDPOINT_USAGE_MAP = {
  '/types': 'searchTypes',
  '/issuers': 'getIssuers'
};

// Derive endpoint name from path for usage tracking
function getEndpointName(endpoint) {
  // Exact match first
  if (ENDPOINT_USAGE_MAP[endpoint]) return ENDPOINT_USAGE_MAP[endpoint];
  // Pattern matching for parameterized endpoints
  if (/^\/types\/\d+\/issues\/\d+\/prices/.test(endpoint)) return 'getPrices';
  if (/^\/types\/\d+\/issues/.test(endpoint)) return 'getIssues';
  if (/^\/types\/\d+/.test(endpoint)) return 'getType';
  return 'other';
}

/**
 * Numista API client class for communicating with Numista v3 API.
 * Implements rate limiting, caching, and comprehensive error handling.
 */
class NumistaAPI {
  /**
   * Creates a new NumistaAPI instance
   * @param {string|null} apiKey - Numista API key (can be set later via setApiKey)
   * @param {Object|null} persistentCache - ApiCache instance for disk-based caching
   * @param {Object} [cacheTTLs] - User-configured cache TTLs in days (0 = no caching)
   * @param {number} [cacheTTLs.issuers] - Issuers cache TTL in days
   * @param {number} [cacheTTLs.types] - Type data cache TTL in days
   * @param {number} [cacheTTLs.issues] - Issues data cache TTL in days
   */
  constructor(apiKey = null, persistentCache = null, cacheTTLs = {}) {
    this.baseURL = 'https://api.numista.com/v3';
    this.apiKey = apiKey;
    this.cache = new Map();  // Simple in-memory cache
    this.issuerCodeCache = new Map();  // country name -> issuer code cache
    this.lastRequestTime = 0;
    this.minRequestDelay = 2000;  // 2 seconds between requests (respectful rate limiting)
    this.persistentCache = persistentCache;
    this.apiCallCount = 0;  // Tracks real HTTP calls made (not cache hits)

    // Convert user TTLs from days to milliseconds (0 = no caching)
    const DAY_MS = 24 * 60 * 60 * 1000;
    this.cacheTTLs = {
      issuers: cacheTTLs.issuers != null ? cacheTTLs.issuers * DAY_MS : DEFAULT_CACHE_TTL.ISSUERS,
      types: cacheTTLs.types != null ? cacheTTLs.types * DAY_MS : DEFAULT_CACHE_TTL.TYPE_DATA,
      issues: cacheTTLs.issues != null ? cacheTTLs.issues * DAY_MS : DEFAULT_CACHE_TTL.ISSUES_DATA
    };
  }

  /**
   * Set the API key for authentication
   * @param {string} apiKey - Numista API key
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Enforce rate limiting by waiting if necessary between requests
   * @async
   * @returns {Promise<void>}
   */
  async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestDelay) {
      const waitTime = this.minRequestDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Make a request to the Numista API
   * 
   * @param {string} endpoint - API endpoint (without base URL)
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - API response data
   */
  async request(endpoint, params = {}) {
    // Check if API key is set
    if (!this.apiKey) {
      throw new Error('Numista API key not configured. Please set your API key in settings.');
    }

    // Enforce rate limiting
    await this.enforceRateLimit();

    try {
      const response = await axios.get(`${this.baseURL}${endpoint}`, {
        params,
        headers: {
          'Numista-API-Key': this.apiKey,
          'User-Agent': 'OpenNumismat-Enrichment-Tool/1.0'
        },
        timeout: 30000  // 30 second timeout
      });

      // Track usage — only reached when a real HTTP call was made (not a cache hit)
      this.apiCallCount++;
      if (this.persistentCache) {
        const endpointName = getEndpointName(endpoint);
        this.persistentCache.incrementUsage(endpointName);
      }

      return response.data;
    } catch (error) {
      if (error.response) {
        // API returned an error response
        const status = error.response.status;
        const message = error.response.data?.message || error.message;
        
        if (status === 401) {
          throw new Error('Invalid API key. Please check your Numista API key in settings.');
        } else if (status === 429) {
          throw new Error('Rate limit exceeded. Please wait before making more requests.');
        } else if (status === 404) {
          throw new Error('Numista resource not found.');
        } else {
          throw new Error(`Numista API error (${status}): ${message}`);
        }
      } else if (error.request) {
        // Request was made but no response received
        throw new Error('No response from Numista API. Please check your internet connection.');
      } else {
        // Something else went wrong
        throw new Error(`Numista API error: ${error.message}`);
      }
    }
  }

  /**
   * Search for coin types by various criteria
   * @async
   * @param {Object} searchParams - Search parameters
   * @param {string} [searchParams.q] - Search query string
   * @param {string} [searchParams.issuer] - Issuer code (e.g., 'united-states')
   * @param {number} [searchParams.min_year] - Minimum year filter
   * @param {number} [searchParams.max_year] - Maximum year filter
   * @param {string} [searchParams.category] - Category filter ('coin', 'banknote', 'exonumia')
   * @returns {Promise<Object>} Search results with types array and pagination info
   */
  async searchTypes(searchParams) {
    const cacheKey = `search:${JSON.stringify(searchParams)}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const params = {
      lang: 'en',
      page: 1,
      count: 50,
      ...searchParams
    };

    const result = await this.request('/types', params);
    this.cache.set(cacheKey, result);
    
    return result;
  }

  /**
   * Get detailed information about a specific coin type
   * @async
   * @param {number} typeId - Numista type ID
   * @param {string} [lang='en'] - Language code for localized content
   * @returns {Promise<Object>} Full type data including composition, rulers, references, etc.
   */
  async getType(typeId, lang = 'en') {
    const cacheKey = `type:${typeId}:${lang}`;

    // 1. Check in-memory cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // 2. Check persistent cache
    if (this.persistentCache && this.cacheTTLs.types > 0) {
      const cached = this.persistentCache.get(cacheKey);
      if (cached) {
        this.cache.set(cacheKey, cached);
        return cached;
      }
    }

    // 3. Fetch from API
    const result = await this.request(`/types/${typeId}`, { lang });
    this.cache.set(cacheKey, result);

    if (this.persistentCache && this.cacheTTLs.types > 0) {
      this.persistentCache.set(cacheKey, result, this.cacheTTLs.types);
    }

    return result;
  }

  /**
   * Get all issues (variants by year/mint) for a specific type
   * @async
   * @param {number} typeId - Numista type ID
   * @param {string} [lang='en'] - Language code
   * @returns {Promise<Array>} Array of issue objects (year, mint_letter, mintage, etc.)
   */
  async getTypeIssues(typeId, lang = 'en') {
    const cacheKey = `issues:${typeId}:${lang}`;

    // 1. Check in-memory cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // 2. Check persistent cache
    if (this.persistentCache && this.cacheTTLs.issues > 0) {
      const cached = this.persistentCache.get(cacheKey);
      if (cached) {
        this.cache.set(cacheKey, cached);
        return cached;
      }
    }

    // 3. Fetch from API
    const result = await this.request(`/types/${typeId}/issues`, { lang });
    log.debug('getTypeIssues response for type', typeId, ':', JSON.stringify(result, null, 2));
    this.cache.set(cacheKey, result);

    if (this.persistentCache && this.cacheTTLs.issues > 0) {
      this.persistentCache.set(cacheKey, result, this.cacheTTLs.issues);
    }

    return result;
  }

  /**
   * Get pricing data for a specific issue
   * @async
   * @param {number} typeId - Numista type ID
   * @param {number} issueId - Issue ID within the type
   * @param {string} [currency='USD'] - Currency code for prices
   * @returns {Promise<Object>} Pricing data with grades and values
   */
  async getIssuePricing(typeId, issueId, currency = 'USD') {
    const cacheKey = `pricing:${typeId}:${issueId}:${currency}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const result = await this.request(`/types/${typeId}/issues/${issueId}/prices`, { currency });
    this.cache.set(cacheKey, result);
    
    return result;
  }

  /**
   * Smart issue matching - adapts to available differentiating fields
   *
   * @param {Object} coin - User's coin data from OpenNumismat
   * @param {Object} issuesResponse - Response from getTypeIssues
   * @param {Object} [options] - Optional matching options
   * @param {string} [options.emptyMintmarkInterpretation='no_mint_mark'] - How to interpret empty mintmark: 'no_mint_mark' or 'unknown'
   * @returns {Object} - { type: 'AUTO_MATCHED'|'USER_PICK'|'NO_MATCH'|'NO_ISSUES', issue?, options?, privyMarksDetected? }
   */
  matchIssue(coin, issuesResponse, options = {}) {
    log.debug('\n=== SMART ISSUE MATCHING ===');
    log.debug('User coin data:', { year: coin.year, mintmark: coin.mintmark, type: coin.type });

    const emptyMintmarkInterpretation = options.emptyMintmarkInterpretation || 'no_mint_mark';

    // API returns array directly, not wrapped in object
    const issues = Array.isArray(issuesResponse) ? issuesResponse : (issuesResponse?.issues || []);
    log.debug(`Total issues available: ${issues.length}`);

    if (issues.length === 0) {
      log.debug('Result: NO_ISSUES (empty array)');
      return { type: 'NO_ISSUES' };
    }

    // Parse user's year
    const userYear = coin.year ? parseInt(coin.year) : null;

    // STEP 1: Filter by year (required)
    if (!userYear) {
      log.debug('Result: USER_PICK (no year in user coin - cannot auto-match)');
      return { type: 'USER_PICK', options: issues };
    }

    const yearMatchedIssues = issues.filter(i => i.year == userYear || i.gregorian_year == userYear);
    let candidates = [...yearMatchedIssues];
    log.debug(`After year filter (${userYear}): ${candidates.length} matches`);

    if (candidates.length === 0) {
      log.debug('Result: USER_PICK (no issues match year - showing all for user to pick)');
      return { type: 'USER_PICK', options: issues };
    }

    if (candidates.length === 1) {
      log.debug('Result: AUTO_MATCHED (only one issue for this year)');
      return { type: 'AUTO_MATCHED', issue: candidates[0] };
    }

    // STEP 2: Multiple matches for year - check which fields differentiate them
    log.debug('\nMultiple issues for year - analyzing differentiating fields...');

    // Check if mint_letter varies (include null/empty as a distinct value)
    const mintLetterValues = candidates.map(c => c.mint_letter || null);
    const uniqueMints = new Set(mintLetterValues);
    const hasMintVariation = uniqueMints.size > 1;
    log.debug(`Mint variation: ${hasMintVariation} (unique values: ${Array.from(uniqueMints).join(', ') || 'none'})`);

    // Check if comment varies (Proof vs regular)
    const comments = new Set(candidates.map(c => c.comment).filter(c => c));
    const hasCommentVariation = candidates.some(c => c.comment) && candidates.some(c => !c.comment);
    log.debug(`Comment variation: ${hasCommentVariation} (values: ${Array.from(comments).join(', ') || 'none'})`);

    // Task 3.12.8: Check if privy marks or signatures vary (OpenNumismat can't store these)
    const hasPrivyMarks = candidates.some(c => c.marks && c.marks.length > 0);
    const hasSignatures = candidates.some(c => c.signatures && c.signatures.length > 0);
    const hasUnmappableVariation = hasPrivyMarks || hasSignatures;
    if (hasUnmappableVariation) {
      log.debug(`Unmappable variation detected: privy marks=${hasPrivyMarks}, signatures=${hasSignatures}`);
    }

    // STEP 3: Apply filters based on user's data and field variations
    // These filters are ONLY for AUTO_MATCHING - USER_PICK always shows all year-matched issues

    // Filter by mintmark if it varies
    if (hasMintVariation) {
      const userMintmark = coin.mintmark ? coin.mintmark.trim() : null;
      const beforeCount = candidates.length;
      if (userMintmark) {
        // User has a mintmark - match issues using normalized comparison
        candidates = candidates.filter(i => i.mint_letter && mintmarksMatch(userMintmark, i.mint_letter));
      } else {
        // User has no mintmark - behavior depends on emptyMintmarkInterpretation setting
        if (emptyMintmarkInterpretation === 'unknown') {
          // Task 3.12.7: Treat empty as unknown - let user pick instead of auto-matching
          log.debug('Empty mintmark interpreted as "unknown" - prompting user to pick');
          return {
            type: 'USER_PICK',
            options: yearMatchedIssues,
            privyMarksDetected: hasPrivyMarks,
            signaturesDetected: hasSignatures
          };
        }
        // Default: no_mint_mark - match issues with no mint letter (regular/Philadelphia)
        candidates = candidates.filter(i => !i.mint_letter || i.mint_letter.trim() === '');
      }
      log.debug(`Applied mintmark filter (${userMintmark || 'none/blank'}): ${beforeCount} -> ${candidates.length}`);

      if (candidates.length === 1) {
        log.debug('Result: AUTO_MATCHED (after mintmark filter)');
        return { type: 'AUTO_MATCHED', issue: candidates[0], privyMarksDetected: hasPrivyMarks, signaturesDetected: hasSignatures };
      }

      if (candidates.length === 0) {
        // User's mintmark didn't match any issues - show all year matches for user to pick
        log.debug('Mintmark filter yielded no matches - showing all year-matched issues');
        return { type: 'USER_PICK', options: yearMatchedIssues, privyMarksDetected: hasPrivyMarks, signaturesDetected: hasSignatures };
      }
    }

    // Filter by type/comment if it varies AND user has type field
    if (hasCommentVariation) {
      const userType = coin.type?.trim() || null;
      const beforeCount = candidates.length;

      if (!userType || userType === '') {
        // User has blank/undefined type → match issues with NO comment (regular circulation)
        candidates = candidates.filter(i => !i.comment || i.comment.trim() === '');
        log.debug(`Applied type filter (blank/regular): ${beforeCount} -> ${candidates.length}`);
      } else if (userType.toLowerCase() === 'proof') {
        // User has type="Proof" → match issues with comment containing "Proof"
        candidates = candidates.filter(i => i.comment && i.comment.toLowerCase().includes('proof'));
        log.debug(`Applied type filter (Proof): ${beforeCount} -> ${candidates.length}`);
      } else {
        // User has other type value → try to match comment
        candidates = candidates.filter(i => i.comment && i.comment.toLowerCase().includes(userType.toLowerCase()));
        log.debug(`Applied type filter (${userType}): ${beforeCount} -> ${candidates.length}`);
      }

      if (candidates.length === 1) {
        log.debug('Result: AUTO_MATCHED (after type/comment filter)');
        return { type: 'AUTO_MATCHED', issue: candidates[0], privyMarksDetected: hasPrivyMarks, signaturesDetected: hasSignatures };
      }

      if (candidates.length === 0) {
        // User's type didn't match any issues - show all year matches for user to pick
        log.debug('Type filter yielded no matches - showing all year-matched issues');
        return { type: 'USER_PICK', options: yearMatchedIssues, privyMarksDetected: hasPrivyMarks, signaturesDetected: hasSignatures };
      }
    }

    // STEP 4: Final result - could not narrow down to 1, show ALL year-matched issues
    // This ensures user sees full options even if filters partially matched
    if (candidates.length === 1) {
      log.debug('Result: AUTO_MATCHED (after all filters)');
      return { type: 'AUTO_MATCHED', issue: candidates[0], privyMarksDetected: hasPrivyMarks, signaturesDetected: hasSignatures };
    }

    log.debug(`Result: USER_PICK (showing all ${yearMatchedIssues.length} year-matched issues for user selection)`);
    log.debug('=== END MATCHING ===\n');
    return { type: 'USER_PICK', options: yearMatchedIssues, privyMarksDetected: hasPrivyMarks, signaturesDetected: hasSignatures };
  }

  /**
   * Fetch all coin data based on settings
   * 
   * @param {number} typeId - Numista type ID
   * @param {Object} coin - User's coin data
   * @param {Object} fetchSettings - { basicData, issueData, pricingData }
   * @param {string} currency - Currency for pricing (default USD)
   * @returns {Object} - { basicData, issueData, pricingData, matchedIssue }
   */
  async fetchCoinData(typeId, coin, fetchSettings, currency = 'USD') {
    const result = {
      basicData: null,
      issueData: null,
      pricingData: null,
      matchedIssue: null,
      issueMatchResult: null
    };

    // Fetch basic data if requested
    if (fetchSettings.basicData) {
      log.debug('Fetching basic data for type:', typeId);
      result.basicData = await this.getType(typeId);
    }

    // Fetch issue data if requested OR if pricing is requested (pricing requires issue data)
    if (fetchSettings.issueData || fetchSettings.pricingData) {
      log.debug('Fetching issues for type:', typeId);
      const issuesResponse = await this.getTypeIssues(typeId);

      // Try to auto-match issue (pass settings for empty mintmark interpretation)
      const matchOptions = {
        emptyMintmarkInterpretation: fetchSettings.emptyMintmarkInterpretation || 'no_mint_mark'
      };
      const matchResult = this.matchIssue(coin, issuesResponse, matchOptions);
      result.issueMatchResult = matchResult;
      log.debug('Issue match result:', matchResult.type);

      if (matchResult.type === 'AUTO_MATCHED') {
        result.matchedIssue = matchResult.issue;

        // Set issue data if explicitly requested
        if (fetchSettings.issueData) {
          result.issueData = matchResult.issue;
        }

        // Fetch pricing if we have a matched issue and pricing is requested
        if (fetchSettings.pricingData && matchResult.issue.id) {
          log.debug('Fetching pricing for issue:', matchResult.issue.id);
          try {
            result.pricingData = await this.getIssuePricing(typeId, matchResult.issue.id, currency);
          } catch (e) {
            log.debug('Pricing fetch failed:', e.message);
            result.pricingData = null;
          }
        }
      } else if (matchResult.type === 'USER_PICK') {
        // Store options for UI to present
        result.issueOptions = matchResult.options;
        // Note: UI will need to let user pick, then call a separate method to fetch pricing for selected issue
      }
    }

    return result;
  }

  /**
   * Calculate confidence score (0-100) indicating how well a Numista type matches the user's coin
   * @param {Object} coin - OpenNumismat coin object
   * @param {Object} numistaType - Numista type data from search results
   * @returns {number} Confidence score from 0 to 100
   */
  calculateMatchConfidence(coin, numistaType) {
    // Numista ID match is a perfect match (100%) - coin was previously enriched with this exact type
    const coinNumistaId = coin.metadata?.basicData?.numistaId;
    if (coinNumistaId && numistaType.id && coinNumistaId === numistaType.id) {
      return 100;
    }

    let score = 0;

    // Title match (30 points) - uses Dice coefficient for fuzzy comparison
    if (coin.title && numistaType.title) {
      const similarity = diceCoefficient(coin.title, numistaType.title);
      score += Math.round(similarity * 30);
    }

    // Year match (25 points) or penalty (-15 points)
    if (coin.year && numistaType.min_year) {
      const coinYear = parseInt(coin.year);
      const maxYear = numistaType.max_year || numistaType.min_year;
      if (!isNaN(coinYear)) {
        if (coinYear >= numistaType.min_year && coinYear <= maxYear) {
          score += 25; // Year in range
        } else {
          // Year outside range - penalty (can't be this coin type)
          score -= 15;
        }
      }
    }

    // Country match (20 points)
    if (coin.country && numistaType.issuer && numistaType.issuer.name) {
      const coinCountry = coin.country.toLowerCase().trim();
      const numistaCountry = numistaType.issuer.name.toLowerCase().trim();

      if (coinCountry === numistaCountry || numistaCountry.includes(coinCountry)) {
        score += 20;
      }
    }

    // Value/denomination match (25 points) - compare numeric values first, then units
    // OpenNumismat stores value=1, unit="Cents" while Numista uses value.text="1 Cent"
    const coinValue = coin.value ? parseFloat(coin.value) : null;
    const coinUnit = coin.unit?.toLowerCase().trim();

    // Try value.text first, fallback to extracting from title
    let matchDenomination = numistaType.value?.text?.toLowerCase().trim();
    if (!matchDenomination && numistaType.title) {
      // Extract denomination from start of title up to first separator (dash, paren, comma)
      // Captures multi-word units: "2 Euro Cents - Beatrix" -> "2 Euro Cents"
      const titleMatch = numistaType.title.match(/^([\d.]+\s*[^-–(,]+)/i);
      if (titleMatch) {
        matchDenomination = titleMatch[1].toLowerCase().trim();
      }
    }

    if (coinValue && matchDenomination) {
      // Extract numeric value from denomination text (e.g., "5 Cents" -> 5)
      const matchValueMatch = matchDenomination.match(/^([\d.]+)/);
      const matchValue = matchValueMatch ? parseFloat(matchValueMatch[1]) : null;
      // Extract unit from denomination text (e.g., "5 Cents" -> "cents")
      const matchUnit = matchDenomination.replace(/^[\d.]+\s*/, '').trim();

      if (matchValue !== null) {
        // Check if units match (e.g., "cents" vs "cent" should match, "cent" vs "dime" should not)
        const unitsAreMatch = coinUnit && matchUnit && (
          denominationUnitsMatch(coinUnit, matchUnit) ||
          diceCoefficient(coinUnit, matchUnit) > 0.7
        );

        if (coinValue === matchValue && unitsAreMatch) {
          // Both numeric value AND unit match - full points
          score += 25;
        } else if (coinValue === matchValue && (!coinUnit || !matchUnit)) {
          // Numeric matches but can't compare units - partial points
          score += 15;
        } else {
          // Either numeric value differs OR units differ (e.g., "1 Cent" vs "1 Dime")
          // This is a denomination mismatch - penalty
          score -= 20;
        }
      }
    } else if (coinUnit && matchDenomination) {
      // No numeric value from user's coin, but we have a unit to compare
      // This handles cases like unit="Euro" where value is empty in OpenNumismat
      const matchUnit = matchDenomination.replace(/^[\d.]+\s*/, '').trim();
      if (matchUnit) {
        const unitsAreMatch = (
          denominationUnitsMatch(coinUnit, matchUnit) ||
          diceCoefficient(coinUnit, matchUnit) > 0.7
        );
        if (unitsAreMatch) {
          score += 15; // Unit matches but can't verify numeric value
        } else {
          score -= 10; // Unit mismatch
        }
      }
    }

    // Category scoring (10 points max / -10 penalty)
    // Standard circulation coins are most likely what users have
    const category = numistaType.object_type?.name?.toLowerCase() || numistaType.category?.toLowerCase() || '';
    if (category.includes('standard circulation') || category.includes('circulating')) {
      score += 10; // Boost for standard circulation
    } else if (category.includes('pattern') || category.includes('proof') ||
               category.includes('non-circulating') || category.includes('specimen')) {
      score -= 10; // Penalty for rare/collector categories
    }
    // Commemorative coins get no adjustment (neutral)

    return Math.max(0, Math.min(score, 100));
  }

  /**
   * Get the full list of issuers from Numista API.
   * Cached permanently for the session (issuers don't change).
   *
   * @returns {Promise<Array>} - Array of issuer objects { code, name, ... }
   */
  async getIssuers() {
    const cacheKey = 'issuers:all';

    // 1. Check in-memory cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // 2. Check persistent cache
    if (this.persistentCache && this.cacheTTLs.issuers > 0) {
      const cached = this.persistentCache.get(cacheKey);
      if (cached) {
        this.cache.set(cacheKey, cached); // Promote to in-memory
        return cached;
      }
    }

    // 3. Fetch from API
    const result = await this.request('/issuers', { lang: 'en' });
    const issuers = result.issuers || [];
    this.cache.set(cacheKey, issuers);

    // Write to persistent cache
    if (this.persistentCache && this.cacheTTLs.issuers > 0) {
      this.persistentCache.set(cacheKey, issuers, this.cacheTTLs.issuers);
    }

    return issuers;
  }

  /**
   * Resolve a country name (from OpenNumismat) to a Numista issuer code.
   * Uses alias map first, then fuzzy matches against the full issuer list.
   * Results are cached per country name for the session.
   *
   * @param {string} countryName - Country name from OpenNumismat coin data
   * @returns {Promise<string|null>} - Numista issuer code or null if no match
   */
  async resolveIssuerCode(countryName) {
    if (!countryName || typeof countryName !== 'string') return null;

    const normalized = countryName.trim().toLowerCase();
    if (!normalized) return null;

    // Check resolved cache first
    if (this.issuerCodeCache.has(normalized)) {
      return this.issuerCodeCache.get(normalized);
    }

    // Check alias map
    if (ISSUER_ALIASES[normalized]) {
      const code = ISSUER_ALIASES[normalized];
      this.issuerCodeCache.set(normalized, code);
      return code;
    }

    // Fetch issuers list and find best match
    try {
      const issuers = await this.getIssuers();

      // Exact name match (case-insensitive)
      // Numista issuers have a parent/child hierarchy (level 1 = section/group,
      // level 2+ = specific country). Multiple issuers can share the same name
      // (e.g., "United Kingdom" exists as a section AND a specific country).
      // Always prefer the most specific (highest level) match to avoid searching
      // across an entire group of territories.
      const exactMatches = issuers.filter(i => i.name.toLowerCase() === normalized);
      if (exactMatches.length > 0) {
        // Pick the most specific match (highest level number)
        const bestExact = exactMatches.reduce((best, curr) =>
          (curr.level || 1) > (best.level || 1) ? curr : best
        );
        log.info(`Resolved issuer: "${countryName}" -> "${bestExact.code}" (exact match, level ${bestExact.level || 1})`);
        this.issuerCodeCache.set(normalized, bestExact.code);
        return bestExact.code;
      }

      // Fuzzy match — find the issuer with the highest Dice similarity
      // Prefer more specific (higher level) issuers when scores are close
      let bestScore = 0;
      let bestCode = null;
      let bestLevel = 0;
      for (const issuer of issuers) {
        const score = diceCoefficient(normalized, issuer.name.toLowerCase());
        const level = issuer.level || 1;
        if (score > bestScore || (score === bestScore && level > bestLevel)) {
          bestScore = score;
          bestCode = issuer.code;
          bestLevel = level;
        }
      }

      // Only accept matches above a reasonable threshold
      if (bestScore >= 0.6) {
        log.info(`Resolved issuer: "${countryName}" -> "${bestCode}" (score: ${bestScore.toFixed(2)})`);
        this.issuerCodeCache.set(normalized, bestCode);
        return bestCode;
      }

      // No good match found
      log.warn(`Could not resolve issuer for: "${countryName}" (best score: ${bestScore.toFixed(2)})`);
      this.issuerCodeCache.set(normalized, null);
      return null;
    } catch (error) {
      log.warn('Failed to resolve issuer code:', error.message);
      return null;
    }
  }

  /**
   * Clear all cached data (types, issues, pricing, issuer codes)
   */
  clearCache() {
    this.cache.clear();
    this.issuerCodeCache.clear();
  }
}

// Export diceCoefficient for use in renderer via preload
NumistaAPI.diceCoefficient = diceCoefficient;

module.exports = NumistaAPI;
