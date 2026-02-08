const fs = require('fs');
const path = require('path');
const log = require('../main/logger').scope('ApiCache');

/**
 * Persistent API Cache with Monthly Usage Tracking
 *
 * Caches Numista API responses to disk to reduce API calls across sessions.
 * Tracks monthly usage per endpoint for quota management.
 *
 * Cache file location: app.getPath('userData')/numista_api_cache.json
 * This is app-wide (not per-collection) since issuers/types/issues are
 * global Numista catalog data.
 *
 * Disk format:
 * {
 *   "version": "1.0",
 *   "entries": { "key": { "data": ..., "cachedAt": timestamp, "ttl": ms } },
 *   "monthlyUsage": { "2026-02": { "searchTypes": 0, ... } },
 *   "monthlyLimit": 2000
 * }
 */
class ApiCache {
  /**
   * Creates a new ApiCache instance
   * @param {string} cacheFilePath - Absolute path to the cache JSON file
   */
  constructor(cacheFilePath) {
    this.cacheFilePath = cacheFilePath;
    this.data = this._load();
    this._prune();
  }

  /**
   * Load cache data from disk, returning empty structure if missing or corrupt
   * @returns {Object} Cache data structure
   */
  _load() {
    try {
      if (fs.existsSync(this.cacheFilePath)) {
        const raw = fs.readFileSync(this.cacheFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version === '1.0') {
          // Ensure all required top-level keys exist
          parsed.entries = parsed.entries || {};
          parsed.monthlyUsage = parsed.monthlyUsage || {};
          parsed.monthlyLimit = parsed.monthlyLimit || 2000;
          return parsed;
        }
      }
    } catch (error) {
      log.warn('ApiCache: Failed to load cache file, starting fresh:', error.message);
    }
    return this._emptyStructure();
  }

  /**
   * Returns an empty cache data structure
   * @returns {Object} Empty cache structure
   */
  _emptyStructure() {
    return {
      version: '1.0',
      entries: {},
      monthlyUsage: {},
      monthlyLimit: 2000
    };
  }

  /**
   * Save cache data to disk
   */
  _save() {
    try {
      const dir = path.dirname(this.cacheFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.cacheFilePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (error) {
      log.error('ApiCache: Failed to save cache file:', error.message);
    }
  }

  /**
   * Get the current month key (e.g., "2026-02")
   * @returns {string} Month key in YYYY-MM format
   */
  _monthKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Get a cached entry if it exists and has not expired
   * @param {string} key - Cache key
   * @returns {*} Cached data or null if not found/expired
   */
  get(key) {
    const entry = this.data.entries[key];
    if (!entry) return null;

    const age = Date.now() - entry.cachedAt;
    if (age > entry.ttl) {
      delete this.data.entries[key];
      return null;
    }

    return entry.data;
  }

  /**
   * Store data in the cache with a TTL
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  set(key, data, ttl) {
    if (ttl <= 0) return; // TTL of 0 means "no caching"

    this.data.entries[key] = {
      data,
      cachedAt: Date.now(),
      ttl
    };
    this._save();
  }

  /**
   * Check if a non-expired cache entry exists
   * @param {string} key - Cache key
   * @returns {boolean} True if valid entry exists
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Remove expired entries from the cache
   */
  _prune() {
    const now = Date.now();
    let pruned = false;

    for (const [key, entry] of Object.entries(this.data.entries)) {
      if (now - entry.cachedAt > entry.ttl) {
        delete this.data.entries[key];
        pruned = true;
      }
    }

    // Also prune old monthly usage (keep current + previous month only)
    const currentMonth = this._monthKey();
    const prevDate = new Date();
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    for (const month of Object.keys(this.data.monthlyUsage)) {
      if (month !== currentMonth && month !== prevMonth) {
        delete this.data.monthlyUsage[month];
        pruned = true;
      }
    }

    if (pruned) {
      this._save();
    }
  }

  /**
   * Clear all cached entries (preserves monthly usage and settings)
   */
  clear() {
    this.data.entries = {};
    this._save();
  }

  /**
   * Get cache statistics
   * @returns {Object} Stats including entry count
   */
  getStats() {
    return {
      entryCount: Object.keys(this.data.entries).length,
      monthlyUsage: this.getMonthlyUsage()
    };
  }

  // =========================================================================
  // Monthly Usage Tracking
  // =========================================================================

  /**
   * Increment usage count for an endpoint in the current month
   * @param {string} endpoint - Endpoint name (searchTypes, getType, getIssues, getPrices, getIssuers)
   */
  incrementUsage(endpoint) {
    const month = this._monthKey();
    if (!this.data.monthlyUsage[month]) {
      this.data.monthlyUsage[month] = {};
    }
    this.data.monthlyUsage[month][endpoint] = (this.data.monthlyUsage[month][endpoint] || 0) + 1;
    this._save();
  }

  /**
   * Get current month's usage totals
   * @returns {Object} Usage data with per-endpoint counts and total
   */
  getMonthlyUsage() {
    const month = this._monthKey();
    const usage = this.data.monthlyUsage[month] || {};
    const total = Object.values(usage).reduce((sum, count) => sum + count, 0);
    return { ...usage, total };
  }

  /**
   * Get the monthly API call limit
   * @returns {number} Monthly limit (default 2000)
   */
  getMonthlyLimit() {
    return this.data.monthlyLimit || 2000;
  }

  /**
   * Set the monthly API call limit
   * @param {number} limit - New monthly limit
   */
  setMonthlyLimit(limit) {
    this.data.monthlyLimit = Math.max(100, Math.floor(limit));
    this._save();
  }

  /**
   * Set the total monthly usage to a specific value.
   * Distributes across existing endpoint proportions, or sets as a flat 'manual' entry.
   * @param {number} total - New total usage count
   */
  setMonthlyUsageTotal(total) {
    const month = this._monthKey();
    const currentUsage = this.data.monthlyUsage[month] || {};
    const currentTotal = Object.values(currentUsage).reduce((sum, count) => sum + count, 0);

    if (currentTotal === 0 || Object.keys(currentUsage).length === 0) {
      // No existing breakdown — set as flat total
      this.data.monthlyUsage[month] = { manual: Math.max(0, Math.floor(total)) };
    } else {
      // Distribute proportionally across existing endpoints
      const ratio = total / currentTotal;
      const adjusted = {};
      for (const [endpoint, count] of Object.entries(currentUsage)) {
        adjusted[endpoint] = Math.max(0, Math.round(count * ratio));
      }
      this.data.monthlyUsage[month] = adjusted;
    }
    this._save();
  }
}

module.exports = ApiCache;
