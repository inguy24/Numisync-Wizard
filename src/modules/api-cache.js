/**
 * @fileoverview api-cache.js — Persistent disk cache for Numista API responses with monthly usage tracking.
 *
 * Cache is app-wide (not per-collection) since issuers/types/issues are global Numista catalog data.
 *
 * Exports: ApiCache class
 *   get(key) — returns cached data or null if missing/expired
 *   set(key, data, ttl) — stores data with TTL in milliseconds; prunes expired entries on first write
 *   has(key) — returns true if a non-expired entry exists
 *   clear() — removes all cache entries (preserves monthly usage and limit)
 *   getStats() — returns { entryCount, monthlyUsage }
 *   setActiveKey(apiKey) — sets the active API key identifier for per-key usage tracking
 *   incrementUsage(endpoint) — atomic disk-read-increment-write to prevent multi-machine count clobbering
 *   getMonthlyUsage() — re-reads disk before returning, so UI shows combined total across all machines
 *   getMonthlyLimit() / setMonthlyLimit(n) — monthly API call quota
 *   setMonthlyUsageTotal(total) — adjusts total usage proportionally across endpoints
 *   getSharedConfigPath() — returns path to numisync-shared-config.json, or null if using default path
 *   readSharedConfig() — reads shared config from cache directory
 *   writeSharedConfig(config) — writes portable settings to shared config file (supporter + custom path only)
 * Storage: configurable path (default: userData/numisync-wizard/api-cache.json); lock file alongside it
 * Uses: cache-lock.js (atomic write operations), logger.js
 * Called by: numista-api.js (all persistent caching), src/main/index.js (get-cache-settings, clear-api-cache, get-monthly-usage, set-monthly-usage, get-shared-config, apply-shared-config)
 *
 * Monthly usage disk format (per-key, as of v1.1 migration):
 * {
 *   "monthlyUsage": {
 *     "2026-02": {
 *       "keys": {
 *         "abc12345": { "searchTypes": 5, "getType": 10, "getIssues": 3, "getPrices": 2 }
 *       }
 *     }
 *   }
 * }
 * Old flat format (no "keys" wrapper) is automatically migrated to the current active key on first write.
 */
const fs = require('fs');
const path = require('path');
const log = require('../main/logger').scope('ApiCache');
const { CacheLock } = require('./cache-lock');

/**
 * Persistent API Cache with Monthly Usage Tracking
 *
 * Caches Numista API responses to disk to reduce API calls across sessions.
 * Tracks monthly usage per endpoint for quota management.
 *
 * Cache file location: Configurable (default: app.getPath('userData')/api-cache.json)
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
   * @param {Object} options - Configuration options
   * @param {number} options.lockTimeout - Lock acquisition timeout in milliseconds (default: 30000)
   */
  constructor(cacheFilePath, options = {}) {
    this.cacheFilePath = cacheFilePath;
    this.lock = new CacheLock(cacheFilePath, options.lockTimeout || 30000);
    this.data = this._load();
    this.pruned = false; // Track if pruning has occurred this session
    this.activeKeyId = 'default'; // Set via setActiveKey() when an API key is configured
    // Track whether this is a custom (shared) path vs. the default userData location
    try {
      const defaultPath = path.join(require('electron').app.getPath('userData'), 'api-cache.json');
      this._isCustomPath = (cacheFilePath !== defaultPath);
    } catch (_) {
      this._isCustomPath = options.isCustomPath || false;
    }
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
   * Save cache data to disk with file locking.
   * Re-reads monthlyUsage and monthlyLimit from disk before writing to prevent
   * clobbering counts or settings written by other machines between the last
   * incrementUsage() call and this write. Only the entries portion uses in-memory state.
   * @async
   * @throws {Error} If lock cannot be acquired or write fails
   */
  async _save() {
    await this.lock.acquire();
    try {
      const dir = path.dirname(this.cacheFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // Re-read monthly data from disk to prevent clobbering counts/settings
      // written by other machines since our last incrementUsage() call.
      if (fs.existsSync(this.cacheFilePath)) {
        try {
          const diskData = JSON.parse(fs.readFileSync(this.cacheFilePath, 'utf8'));
          if (diskData.monthlyUsage) this.data.monthlyUsage = diskData.monthlyUsage;
          if (diskData.monthlyLimit !== undefined) this.data.monthlyLimit = diskData.monthlyLimit;
        } catch (_) { /* fall through — use in-memory state if disk read fails */ }
      }
      fs.writeFileSync(this.cacheFilePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (error) {
      log.error('ApiCache: Failed to save cache file:', error.message);
      throw error;
    } finally {
      await this.lock.release();
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
   * @async
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds
   * @throws {Error} If lock cannot be acquired
   */
  async set(key, data, ttl) {
    if (ttl <= 0) return; // TTL of 0 means "no caching"

    // Prune on first write operation
    if (!this.pruned) {
      await this._prune();
      this.pruned = true;
    }

    this.data.entries[key] = {
      data,
      cachedAt: Date.now(),
      ttl
    };
    await this._save();
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
   * @async
   */
  async _prune() {
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
      await this._save();
    }
  }

  /**
   * Clear all cached entries (preserves monthly usage and settings)
   * @async
   * @throws {Error} If lock cannot be acquired
   */
  async clear() {
    this.data.entries = {};
    await this._save();
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
   * Set the active API key identifier used for per-key usage tracking.
   * Uses the first 8 characters of the key as a short identifier.
   * @param {string} apiKey - Numista API key
   */
  setActiveKey(apiKey) {
    this.activeKeyId = apiKey ? apiKey.substring(0, 8).toLowerCase() : 'default';
  }

  /**
   * Migrate old flat monthly usage format to the per-key format.
   * Must be called INSIDE an already-held lock, and only after re-reading disk data.
   * Detects old format (monthlyUsage[month] has endpoint counts directly, no "keys" wrapper)
   * and moves those counts under keys[this.activeKeyId].
   * @param {string} month - Month key, e.g. "2026-02"
   * @returns {boolean} True if migration was performed and data needs to be written to disk
   */
  _migrateMonthIfNeeded(month) {
    const monthData = this.data.monthlyUsage[month];
    if (!monthData) return false;
    // Already in new format
    if (monthData.keys) return false;
    // Old flat format detected — migrate to new format under the active key
    log.info(`ApiCache: Migrating flat usage data for ${month} to key-scoped format (key: ${this.activeKeyId})`);
    this.data.monthlyUsage[month] = { keys: { [this.activeKeyId]: { ...monthData } } };
    return true;
  }

  /**
   * Increment usage count for an endpoint in the current month
   * @async
   * @param {string} endpoint - Endpoint name (searchTypes, getType, getIssues, getPrices, getIssuers)
   * @throws {Error} If lock cannot be acquired
   */
  async incrementUsage(endpoint) {
    if (!this.pruned) {
      await this._prune();
      this.pruned = true;
    }
    // Atomic: lock → re-read monthlyUsage from disk → increment → write → unlock
    // Cannot call _save() here (it also acquires the lock — deadlock). Write directly.
    await this.lock.acquire();
    try {
      // Re-read monthly usage from disk to prevent clobbering concurrent machine writes
      if (fs.existsSync(this.cacheFilePath)) {
        try {
          const diskData = JSON.parse(fs.readFileSync(this.cacheFilePath, 'utf8'));
          if (diskData.monthlyUsage) this.data.monthlyUsage = diskData.monthlyUsage;
        } catch (_) { /* fall through — use in-memory state if disk read fails */ }
      }
      const month = this._monthKey();
      // Migrate old flat format if present (single-key users preserve their existing counts)
      this._migrateMonthIfNeeded(month);
      if (!this.data.monthlyUsage[month]) this.data.monthlyUsage[month] = { keys: {} };
      if (!this.data.monthlyUsage[month].keys) this.data.monthlyUsage[month].keys = {};
      const keyBucket = this.data.monthlyUsage[month].keys;
      if (!keyBucket[this.activeKeyId]) keyBucket[this.activeKeyId] = {};
      keyBucket[this.activeKeyId][endpoint] = (keyBucket[this.activeKeyId][endpoint] || 0) + 1;
      const dir = path.dirname(this.cacheFilePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.cacheFilePath, JSON.stringify(this.data, null, 2), 'utf8');
    } finally {
      await this.lock.release();
    }
  }

  /**
   * Get current month's usage totals
   * @returns {Object} Usage data with per-endpoint counts and total
   */
  getMonthlyUsage() {
    // Re-read from disk so the UI shows the combined total across all machines
    if (fs.existsSync(this.cacheFilePath)) {
      try {
        const diskData = JSON.parse(fs.readFileSync(this.cacheFilePath, 'utf8'));
        if (diskData.monthlyUsage) this.data.monthlyUsage = diskData.monthlyUsage;
      } catch (_) { /* fall through */ }
    }
    const month = this._monthKey();
    const monthData = this.data.monthlyUsage[month];
    // Support both new per-key format and old flat format (pre-migration read)
    let usage;
    if (monthData && monthData.keys) {
      usage = monthData.keys[this.activeKeyId] || {};
    } else {
      usage = monthData || {};
    }
    const total = Object.values(usage).reduce((sum, count) => sum + count, 0);
    return { ...usage, total };
  }

  /**
   * Returns the path for the shared config file alongside the cache, or null if using default path.
   * @returns {string|null}
   */
  getSharedConfigPath() {
    if (!this._isCustomPath) return null;
    return path.join(path.dirname(this.cacheFilePath), 'numisync-shared-config.json');
  }

  /**
   * Reads the shared config file from the cache directory.
   * @returns {{version: string, exportedAt: string, config: Object}|null}
   */
  readSharedConfig() {
    const configPath = this.getSharedConfigPath();
    if (!configPath) return null;
    try {
      if (!fs.existsSync(configPath)) return null;
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {
      log.warn('ApiCache: Failed to read shared config:', e.message);
      return null;
    }
  }

  /**
   * Writes the shared config file to the cache directory.
   * @param {Object} config - Portable settings to share across machines
   * @async
   */
  async writeSharedConfig(config) {
    const configPath = this.getSharedConfigPath();
    if (!configPath) return;
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      config
    };
    await this.lock.acquire();
    try {
      fs.writeFileSync(configPath, JSON.stringify(payload, null, 2), 'utf8');
      log.info('ApiCache: Shared config written to', configPath);
    } catch (e) {
      log.error('ApiCache: Failed to write shared config:', e.message);
    } finally {
      await this.lock.release();
    }
  }

  /**
   * Get the monthly API call limit
   * @returns {number} Monthly limit (default 2000)
   */
  getMonthlyLimit() {
    return this.data.monthlyLimit || 2000;
  }

  /**
   * Set the monthly API call limit.
   * Uses atomic lock-read-write (like incrementUsage) so the new limit is written
   * without clobbering monthlyUsage counts from other machines.
   * @async
   * @param {number} limit - New monthly limit
   * @throws {Error} If lock cannot be acquired
   */
  async setMonthlyLimit(limit) {
    await this.lock.acquire();
    try {
      // Re-read monthlyUsage from disk to not clobber concurrent machine counts
      if (fs.existsSync(this.cacheFilePath)) {
        try {
          const diskData = JSON.parse(fs.readFileSync(this.cacheFilePath, 'utf8'));
          if (diskData.monthlyUsage) this.data.monthlyUsage = diskData.monthlyUsage;
        } catch (_) { /* fall through */ }
      }
      this.data.monthlyLimit = Math.max(100, Math.floor(limit));
      const dir = path.dirname(this.cacheFilePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.cacheFilePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (error) {
      log.error('ApiCache: Failed to save cache file:', error.message);
      throw error;
    } finally {
      await this.lock.release();
    }
  }

  /**
   * Set the total monthly usage to a specific value.
   * Distributes across existing endpoint proportions, or sets as a flat 'manual' entry.
   * Uses atomic lock-read-write so the new value is written without clobbering
   * monthlyLimit or any counts added by other machines since the last read.
   * @async
   * @param {number} total - New total usage count
   * @throws {Error} If lock cannot be acquired
   */
  async setMonthlyUsageTotal(total) {
    await this.lock.acquire();
    try {
      // Re-read from disk for the most accurate current breakdown and to preserve monthlyLimit
      if (fs.existsSync(this.cacheFilePath)) {
        try {
          const diskData = JSON.parse(fs.readFileSync(this.cacheFilePath, 'utf8'));
          if (diskData.monthlyUsage) this.data.monthlyUsage = diskData.monthlyUsage;
          if (diskData.monthlyLimit !== undefined) this.data.monthlyLimit = diskData.monthlyLimit;
        } catch (_) { /* fall through */ }
      }
      const month = this._monthKey();
      // Migrate old flat format if present before modifying
      this._migrateMonthIfNeeded(month);
      if (!this.data.monthlyUsage[month]) this.data.monthlyUsage[month] = { keys: {} };
      if (!this.data.monthlyUsage[month].keys) this.data.monthlyUsage[month].keys = {};
      const keyBucket = this.data.monthlyUsage[month].keys;
      const currentUsage = keyBucket[this.activeKeyId] || {};
      const currentTotal = Object.values(currentUsage).reduce((sum, count) => sum + count, 0);

      if (currentTotal === 0 || Object.keys(currentUsage).length === 0) {
        // No existing breakdown — set as flat total under the active key
        keyBucket[this.activeKeyId] = { manual: Math.max(0, Math.floor(total)) };
      } else {
        // Distribute proportionally across existing endpoints for the active key
        const ratio = total / currentTotal;
        const adjusted = {};
        for (const [endpoint, count] of Object.entries(currentUsage)) {
          adjusted[endpoint] = Math.max(0, Math.round(count * ratio));
        }
        keyBucket[this.activeKeyId] = adjusted;
      }
      const dir = path.dirname(this.cacheFilePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.cacheFilePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (error) {
      log.error('ApiCache: Failed to save cache file:', error.message);
      throw error;
    } finally {
      await this.lock.release();
    }
  }
}

module.exports = ApiCache;
