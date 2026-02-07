const axios = require('axios');
const { mintmarksMatch } = require('./mintmark-normalizer');

/**
 * Numista API Client
 *
 * Handles all communication with the Numista API v3.
 * Implements rate limiting, caching, and error handling.
 *
 * API Documentation: https://en.numista.com/api/doc/index.php
 * Base URL: https://api.numista.com/v3/
 */

// Common country name aliases to Numista issuer codes
const ISSUER_ALIASES = {
  'usa': 'united-states',
  'us': 'united-states',
  'u.s.': 'united-states',
  'u.s.a.': 'united-states',
  'united states': 'united-states',
  'united states of america': 'united-states',
  'uk': 'united-kingdom',
  'u.k.': 'united-kingdom',
  'great britain': 'united-kingdom',
  'england': 'united-kingdom',
  'ussr': 'ussr',
  'soviet union': 'ussr',
  'west germany': 'germany-federal-republic',
  'east germany': 'germany-democratic-republic',
  'south korea': 'korea-south',
  'north korea': 'korea-north',
};

/**
 * Dice's coefficient string similarity (0.0 to 1.0).
 * Compares bigrams (pairs of consecutive characters) between two strings.
 *
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} - Similarity score between 0 and 1
 */
function diceCoefficient(a, b) {
  a = a.toLowerCase().trim();
  b = b.toLowerCase().trim();

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

/**
 * Numista API client class for communicating with Numista v3 API.
 * Implements rate limiting, caching, and comprehensive error handling.
 */
class NumistaAPI {
  /**
   * Creates a new NumistaAPI instance
   * @param {string|null} apiKey - Numista API key (can be set later via setApiKey)
   */
  constructor(apiKey = null) {
    this.baseURL = 'https://api.numista.com/v3';
    this.apiKey = apiKey;
    this.cache = new Map();  // Simple in-memory cache
    this.issuerCodeCache = new Map();  // country name -> issuer code cache
    this.lastRequestTime = 0;
    this.minRequestDelay = 2000;  // 2 seconds between requests (respectful rate limiting)
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
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const result = await this.request(`/types/${typeId}`, { lang });
    this.cache.set(cacheKey, result);
    
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

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const result = await this.request(`/types/${typeId}/issues`, { lang });
    console.log('getTypeIssues response for type', typeId, ':', JSON.stringify(result, null, 2));
    this.cache.set(cacheKey, result);

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
    console.log('\n=== SMART ISSUE MATCHING ===');
    console.log('User coin data:', { year: coin.year, mintmark: coin.mintmark, type: coin.type });

    const emptyMintmarkInterpretation = options.emptyMintmarkInterpretation || 'no_mint_mark';

    // API returns array directly, not wrapped in object
    const issues = Array.isArray(issuesResponse) ? issuesResponse : (issuesResponse?.issues || []);
    console.log(`Total issues available: ${issues.length}`);

    if (issues.length === 0) {
      console.log('Result: NO_ISSUES (empty array)');
      return { type: 'NO_ISSUES' };
    }

    // Parse user's year
    const userYear = coin.year ? parseInt(coin.year) : null;

    // STEP 1: Filter by year (required)
    if (!userYear) {
      console.log('Result: USER_PICK (no year in user coin - cannot auto-match)');
      return { type: 'USER_PICK', options: issues };
    }

    const yearMatchedIssues = issues.filter(i => i.year == userYear);
    let candidates = [...yearMatchedIssues];
    console.log(`After year filter (${userYear}): ${candidates.length} matches`);

    if (candidates.length === 0) {
      console.log('Result: USER_PICK (no issues match year - showing all for user to pick)');
      return { type: 'USER_PICK', options: issues };
    }

    if (candidates.length === 1) {
      console.log('Result: AUTO_MATCHED (only one issue for this year)');
      return { type: 'AUTO_MATCHED', issue: candidates[0] };
    }

    // STEP 2: Multiple matches for year - check which fields differentiate them
    console.log('\nMultiple issues for year - analyzing differentiating fields...');

    // Check if mint_letter varies (include null/empty as a distinct value)
    const mintLetterValues = candidates.map(c => c.mint_letter || null);
    const uniqueMints = new Set(mintLetterValues);
    const hasMintVariation = uniqueMints.size > 1;
    console.log(`Mint variation: ${hasMintVariation} (unique values: ${Array.from(uniqueMints).join(', ') || 'none'})`);

    // Check if comment varies (Proof vs regular)
    const comments = new Set(candidates.map(c => c.comment).filter(c => c));
    const hasCommentVariation = candidates.some(c => c.comment) && candidates.some(c => !c.comment);
    console.log(`Comment variation: ${hasCommentVariation} (values: ${Array.from(comments).join(', ') || 'none'})`);

    // Task 3.12.8: Check if privy marks or signatures vary (OpenNumismat can't store these)
    const hasPrivyMarks = candidates.some(c => c.marks && c.marks.length > 0);
    const hasSignatures = candidates.some(c => c.signatures && c.signatures.length > 0);
    const hasUnmappableVariation = hasPrivyMarks || hasSignatures;
    if (hasUnmappableVariation) {
      console.log(`Unmappable variation detected: privy marks=${hasPrivyMarks}, signatures=${hasSignatures}`);
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
          console.log('Empty mintmark interpreted as "unknown" - prompting user to pick');
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
      console.log(`Applied mintmark filter (${userMintmark || 'none/blank'}): ${beforeCount} -> ${candidates.length}`);

      if (candidates.length === 1) {
        console.log('Result: AUTO_MATCHED (after mintmark filter)');
        return { type: 'AUTO_MATCHED', issue: candidates[0], privyMarksDetected: hasPrivyMarks, signaturesDetected: hasSignatures };
      }

      if (candidates.length === 0) {
        // User's mintmark didn't match any issues - show all year matches for user to pick
        console.log('Mintmark filter yielded no matches - showing all year-matched issues');
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
        console.log(`Applied type filter (blank/regular): ${beforeCount} -> ${candidates.length}`);
      } else if (userType.toLowerCase() === 'proof') {
        // User has type="Proof" → match issues with comment containing "Proof"
        candidates = candidates.filter(i => i.comment && i.comment.toLowerCase().includes('proof'));
        console.log(`Applied type filter (Proof): ${beforeCount} -> ${candidates.length}`);
      } else {
        // User has other type value → try to match comment
        candidates = candidates.filter(i => i.comment && i.comment.toLowerCase().includes(userType.toLowerCase()));
        console.log(`Applied type filter (${userType}): ${beforeCount} -> ${candidates.length}`);
      }

      if (candidates.length === 1) {
        console.log('Result: AUTO_MATCHED (after type/comment filter)');
        return { type: 'AUTO_MATCHED', issue: candidates[0], privyMarksDetected: hasPrivyMarks, signaturesDetected: hasSignatures };
      }

      if (candidates.length === 0) {
        // User's type didn't match any issues - show all year matches for user to pick
        console.log('Type filter yielded no matches - showing all year-matched issues');
        return { type: 'USER_PICK', options: yearMatchedIssues, privyMarksDetected: hasPrivyMarks, signaturesDetected: hasSignatures };
      }
    }

    // STEP 4: Final result - could not narrow down to 1, show ALL year-matched issues
    // This ensures user sees full options even if filters partially matched
    if (candidates.length === 1) {
      console.log('Result: AUTO_MATCHED (after all filters)');
      return { type: 'AUTO_MATCHED', issue: candidates[0], privyMarksDetected: hasPrivyMarks, signaturesDetected: hasSignatures };
    }

    console.log(`Result: USER_PICK (showing all ${yearMatchedIssues.length} year-matched issues for user selection)`);
    console.log('=== END MATCHING ===\n');
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
      console.log('Fetching basic data for type:', typeId);
      result.basicData = await this.getType(typeId);
    }

    // Fetch issue data if requested OR if pricing is requested (pricing requires issue data)
    if (fetchSettings.issueData || fetchSettings.pricingData) {
      console.log('Fetching issues for type:', typeId);
      const issuesResponse = await this.getTypeIssues(typeId);

      // Try to auto-match issue (pass settings for empty mintmark interpretation)
      const matchOptions = {
        emptyMintmarkInterpretation: fetchSettings.emptyMintmarkInterpretation || 'no_mint_mark'
      };
      const matchResult = this.matchIssue(coin, issuesResponse, matchOptions);
      result.issueMatchResult = matchResult;
      console.log('Issue match result:', matchResult.type);

      if (matchResult.type === 'AUTO_MATCHED') {
        result.matchedIssue = matchResult.issue;

        // Set issue data if explicitly requested
        if (fetchSettings.issueData) {
          result.issueData = matchResult.issue;
        }

        // Fetch pricing if we have a matched issue and pricing is requested
        if (fetchSettings.pricingData && matchResult.issue.id) {
          console.log('Fetching pricing for issue:', matchResult.issue.id);
          try {
            result.pricingData = await this.getIssuePricing(typeId, matchResult.issue.id, currency);
          } catch (e) {
            console.log('Pricing fetch failed:', e.message);
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
   * Build search query parameters from OpenNumismat coin data
   * @param {Object} coin - OpenNumismat coin object
   * @param {string} [coin.title] - Coin title/name
   * @param {number|string} [coin.year] - Year of issue
   * @param {string} [coin.value] - Denomination value
   * @param {string} [coin.country] - Country/issuer name
   * @returns {Object} Search parameters suitable for searchTypes()
   */
  buildSearchQuery(coin) {
    const params = {};

    if (coin.title && coin.title.trim()) {
      params.q = coin.title.trim();
    }

    if (coin.year) {
      const year = parseInt(coin.year);
      if (!isNaN(year)) {
        params.min_year = year;
        params.max_year = year;
      }
    }

    if (coin.value) {
      params.q = params.q ? `${params.q} ${coin.value}` : coin.value;
    }

    if (coin.country) {
      params.q = params.q ? `${params.q} ${coin.country}` : coin.country;
    }

    return params;
  }

  /**
   * Calculate confidence score (0-100) indicating how well a Numista type matches the user's coin
   * @param {Object} coin - OpenNumismat coin object
   * @param {Object} numistaType - Numista type data from search results
   * @returns {number} Confidence score from 0 to 100
   */
  calculateMatchConfidence(coin, numistaType) {
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
      const titleMatch = numistaType.title.match(/^([\d.]+\s*[a-zA-Z]+)/i);
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
        const unitsMatch = coinUnit && matchUnit && (
          matchUnit.includes(coinUnit) || coinUnit.includes(matchUnit) ||
          diceCoefficient(coinUnit, matchUnit) > 0.7
        );

        if (coinValue === matchValue && unitsMatch) {
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

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const result = await this.request('/issuers', { lang: 'en' });
    const issuers = result.issuers || [];
    this.cache.set(cacheKey, issuers);

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
      const exactMatch = issuers.find(i => i.name.toLowerCase() === normalized);
      if (exactMatch) {
        this.issuerCodeCache.set(normalized, exactMatch.code);
        return exactMatch.code;
      }

      // Fuzzy match — find the issuer with the highest Dice similarity
      let bestScore = 0;
      let bestCode = null;
      for (const issuer of issuers) {
        const score = diceCoefficient(normalized, issuer.name.toLowerCase());
        if (score > bestScore) {
          bestScore = score;
          bestCode = issuer.code;
        }
      }

      // Only accept matches above a reasonable threshold
      if (bestScore >= 0.6) {
        console.log(`Resolved issuer: "${countryName}" -> "${bestCode}" (score: ${bestScore.toFixed(2)})`);
        this.issuerCodeCache.set(normalized, bestCode);
        return bestCode;
      }

      // No good match found
      console.log(`Could not resolve issuer for: "${countryName}" (best score: ${bestScore.toFixed(2)})`);
      this.issuerCodeCache.set(normalized, null);
      return null;
    } catch (error) {
      console.warn('Failed to resolve issuer code:', error.message);
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
