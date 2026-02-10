const fs = require('fs');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

/**
 * File-based lock manager for API cache to prevent corruption in multi-machine scenarios
 *
 * Uses atomic file creation with exclusive access to implement a lock mechanism.
 * Supports stale lock detection and automatic cleanup.
 */
class CacheLock {
  /**
   * @param {string} cachePath - Path to the cache file to protect
   * @param {number} timeout - Maximum time to wait for lock acquisition in milliseconds (default: 30000)
   */
  constructor(cachePath, timeout = 30000) {
    this.cachePath = cachePath;
    this.lockPath = cachePath.replace(/\.json$/, '.lock');
    this.timeout = timeout;
    this.ownerId = uuidv4();
    this.isOwner = false;
  }

  /**
   * Attempt to acquire the lock, with retry logic and timeout
   * @async
   * @returns {Promise<void>}
   * @throws {Error} If lock cannot be acquired within timeout period
   */
  async acquire() {
    const startTime = Date.now();

    while (Date.now() - startTime < this.timeout) {
      // Check for stale lock first
      if (this.isStale()) {
        try {
          fs.unlinkSync(this.lockPath);
        } catch (err) {
          // Ignore - another process may have already cleaned it up
        }
      }

      // Try to create lock file atomically
      try {
        const lockData = {
          ownerId: this.ownerId,
          hostname: os.hostname(),
          pid: process.pid,
          acquiredAt: Date.now()
        };

        // Use 'wx' flag for atomic exclusive creation
        const fd = fs.openSync(this.lockPath, 'wx');
        fs.writeSync(fd, JSON.stringify(lockData, null, 2));
        fs.closeSync(fd);

        this.isOwner = true;
        return;
      } catch (err) {
        if (err.code !== 'EEXIST') {
          throw new Error(`Failed to create lock file: ${err.message}`);
        }
        // Lock exists, wait and retry
        await this.sleep(100);
      }
    }

    throw new Error(`Cache lock timeout after ${this.timeout}ms - another process may be using the cache`);
  }

  /**
   * Release the lock if owned by this instance
   * @async
   * @returns {Promise<void>}
   */
  async release() {
    if (!this.isOwner) {
      return;
    }

    try {
      // Verify we still own the lock before deleting
      if (fs.existsSync(this.lockPath)) {
        const lockData = JSON.parse(fs.readFileSync(this.lockPath, 'utf8'));
        if (lockData.ownerId === this.ownerId) {
          fs.unlinkSync(this.lockPath);
        }
      }
    } catch (err) {
      // Log but don't throw - releasing a lock should be best-effort
      console.warn('Failed to release cache lock:', err.message);
    } finally {
      this.isOwner = false;
    }
  }

  /**
   * Check if the current lock file is stale (older than 5 minutes)
   * @returns {boolean} True if lock exists and is stale
   */
  isStale() {
    try {
      if (!fs.existsSync(this.lockPath)) {
        return false;
      }

      const lockData = JSON.parse(fs.readFileSync(this.lockPath, 'utf8'));
      const age = Date.now() - lockData.acquiredAt;
      const STALE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

      return age > STALE_THRESHOLD;
    } catch (err) {
      // If we can't read the lock file, consider it stale
      return true;
    }
  }

  /**
   * Helper function to sleep for a specified duration
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check cache lock status at a given location
   * @param {string} cachePath - Path to api-cache.json
   * @returns {Promise<Object>} Lock status information
   */
  static async checkCacheLockStatus(cachePath) {
    const lockPath = cachePath.replace(/\.json$/, '.lock');

    try {
      // Check if cache file exists
      const cacheExists = fs.existsSync(cachePath);
      const lockExists = fs.existsSync(lockPath);

      if (!cacheExists && !lockExists) {
        return { status: 'none', cacheExists: false, lockExists: false };
      }

      if (!lockExists) {
        return { status: 'unlocked', cacheExists, lockExists: false };
      }

      // Lock file exists - check if stale
      const lockData = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
      const age = Date.now() - lockData.acquiredAt;
      const STALE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

      if (age > STALE_THRESHOLD) {
        return {
          status: 'stale',
          cacheExists,
          lockExists: true,
          lockAge: age,
          lockOwner: {
            hostname: lockData.hostname,
            pid: lockData.pid,
            acquiredAt: new Date(lockData.acquiredAt)
          }
        };
      }

      // Active lock
      return {
        status: 'locked',
        cacheExists,
        lockExists: true,
        lockAge: age,
        lockOwner: {
          hostname: lockData.hostname,
          pid: lockData.pid,
          acquiredAt: new Date(lockData.acquiredAt)
        }
      };
    } catch (error) {
      // Lock file corrupt or unreadable - treat as stale
      return {
        status: 'stale',
        cacheExists: fs.existsSync(cachePath),
        lockExists: true,
        error: error.message
      };
    }
  }

  /**
   * Get cache file metadata
   * @param {string} cachePath - Path to api-cache.json
   * @returns {Object|null} Cache metadata or null if doesn't exist
   */
  static getCacheMetadata(cachePath) {
    if (!fs.existsSync(cachePath)) {
      return null;
    }

    try {
      const stats = fs.statSync(cachePath);
      const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

      return {
        exists: true,
        size: stats.size,
        lastModified: stats.mtime,
        entryCount: Object.keys(data.entries || {}).length,
        version: data.version,
        valid: data.version === '1.0'
      };
    } catch (error) {
      return {
        exists: true,
        valid: false,
        error: error.message
      };
    }
  }
}

module.exports = { CacheLock };
