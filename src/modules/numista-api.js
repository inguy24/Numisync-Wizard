const axios = require('axios');

/**
 * Numista API Client
 * 
 * Handles all communication with the Numista API v3.
 * Implements rate limiting, caching, and error handling.
 * 
 * API Documentation: https://en.numista.com/api/doc/index.php
 * Base URL: https://api.numista.com/v3/
 */
class NumistaAPI {
  constructor(apiKey = null) {
    this.baseURL = 'https://api.numista.com/v3';
    this.apiKey = apiKey;
    this.cache = new Map();  // Simple in-memory cache
    this.lastRequestTime = 0;
    this.minRequestDelay = 2000;  // 2 seconds between requests (respectful rate limiting)
  }

  /**
   * Set the API key
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Rate limiting - ensure minimum delay between requests
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
   * Get all issues for a specific type
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
   * Get pricing for a specific issue
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
   * @returns {Object} - { type: 'AUTO_MATCHED'|'USER_PICK'|'NO_MATCH'|'NO_ISSUES', issue?, options? }
   */
  matchIssue(coin, issuesResponse) {
    console.log('\n=== SMART ISSUE MATCHING ===');
    console.log('User coin data:', { year: coin.year, mintmark: coin.mintmark, type: coin.type });

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

    let candidates = issues.filter(i => i.year == userYear);
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

    // Check if mint_letter varies
    const mintLetters = new Set(candidates.map(c => c.mint_letter).filter(m => m));
    const hasMintVariation = mintLetters.size > 1;
    console.log(`Mint variation: ${hasMintVariation} (unique values: ${Array.from(mintLetters).join(', ') || 'none'})`);

    // Check if comment varies (Proof vs regular)
    const comments = new Set(candidates.map(c => c.comment).filter(c => c));
    const hasCommentVariation = candidates.some(c => c.comment) && candidates.some(c => !c.comment);
    console.log(`Comment variation: ${hasCommentVariation} (values: ${Array.from(comments).join(', ') || 'none'})`);

    // STEP 3: Apply filters based on user's data and field variations

    // Filter by mintmark if it varies AND user has mintmark
    if (hasMintVariation && coin.mintmark) {
      const userMintmark = coin.mintmark.trim();
      const beforeCount = candidates.length;
      candidates = candidates.filter(i => i.mint_letter === userMintmark);
      console.log(`Applied mintmark filter (${userMintmark}): ${beforeCount} -> ${candidates.length}`);

      if (candidates.length === 1) {
        console.log('Result: AUTO_MATCHED (after mintmark filter)');
        return { type: 'AUTO_MATCHED', issue: candidates[0] };
      }

      if (candidates.length === 0) {
        // User's mintmark didn't match - reset to year matches and let user pick
        candidates = issues.filter(i => i.year == userYear);
        console.log('Mintmark filter yielded no matches - reset to year matches');
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
        return { type: 'AUTO_MATCHED', issue: candidates[0] };
      }

      if (candidates.length === 0) {
        // User's type didn't match - reset to year matches and let user pick
        candidates = issues.filter(i => i.year == userYear);
        console.log('Type filter yielded no matches - reset to year matches');
      }
    }

    // STEP 4: Final result
    if (candidates.length === 1) {
      console.log('Result: AUTO_MATCHED (after all filters)');
      return { type: 'AUTO_MATCHED', issue: candidates[0] };
    }

    console.log(`Result: USER_PICK (${candidates.length} candidates remain after filtering)`);
    console.log('=== END MATCHING ===\n');
    return { type: 'USER_PICK', options: candidates };
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

      // Try to auto-match issue
      const matchResult = this.matchIssue(coin, issuesResponse);
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
   * Build a search query from OpenNumismat coin data
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
   * Calculate confidence score for match quality
   */
  calculateMatchConfidence(coin, numistaType) {
    let score = 0;

    // Title match (30 points)
    if (coin.title && numistaType.title) {
      const coinTitle = coin.title.toLowerCase().trim();
      const numistaTitle = numistaType.title.toLowerCase().trim();
      
      if (coinTitle === numistaTitle) {
        score += 30;
      } else if (numistaTitle.includes(coinTitle) || coinTitle.includes(numistaTitle)) {
        score += 21;
      }
    }

    // Year match (25 points)
    if (coin.year && numistaType.min_year && numistaType.max_year) {
      const coinYear = parseInt(coin.year);
      if (!isNaN(coinYear) && coinYear >= numistaType.min_year && coinYear <= numistaType.max_year) {
        score += 25;
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

    // Value match (15 points)
    if (coin.value && numistaType.value && numistaType.value.numeric_value) {
      const coinValue = parseFloat(coin.value);
      if (!isNaN(coinValue) && coinValue === numistaType.value.numeric_value) {
        score += 15;
      }
    }

    // Catalog number match (10 points)
    if (coin.catalognum1 && numistaType.references) {
      const hasCatalogMatch = numistaType.references.some(ref => 
        ref.number && coin.catalognum1.includes(ref.number)
      );
      if (hasCatalogMatch) {
        score += 10;
      }
    }

    return Math.min(score, 100);
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = NumistaAPI;
