const fs = require('fs');
const path = require('path');
const metadataManager = require('./metadata-manager');

/**
 * Progress Tracker - Phase 2
 * 
 * Tracks enrichment status per coin with three-tier data tracking:
 * - basicData (title, country, weight, etc.)
 * - issueData (mintmark, mintage)
 * - pricingData (market values)
 * 
 * Progress is rebuilt from database metadata on startup (session cache only).
 * Actual data persistence is in the database note field via metadata-manager.
 * 
 * Status values:
 * - PENDING: User selected this data type but hasn't processed yet
 * - MERGED: Successfully fetched and merged
 * - NOT_QUERIED: User didn't select this data type
 * - ERROR: API call failed
 * - SKIPPED: User chose to skip this coin
 * - NO_MATCH: For issue data - couldn't match by year/mintmark
 * - NO_DATA: API returned no data (e.g., no pricing available)
 */
class ProgressTracker {
  constructor(collectionPath) {
    this.collectionPath = collectionPath;
    this.progressFilePath = this.getProgressFilePath(collectionPath);
    this.progress = this.loadProgress();
    
    // Default fetch settings (will be updated by rebuildFromDatabase)
    this.currentFetchSettings = {
      basicData: true,
      issueData: false,
      pricingData: false
    };
  }

  /**
   * Get the path for the progress file
   */
  getProgressFilePath(collectionPath) {
    const dir = path.dirname(collectionPath);
    const basename = path.basename(collectionPath, '.db');
    return path.join(dir, `${basename}_enrichment_progress.json`);
  }

  /**
   * Load progress from file or create new
   */
  loadProgress() {
    try {
      if (fs.existsSync(this.progressFilePath)) {
        const data = fs.readFileSync(this.progressFilePath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading progress file:', error);
    }

    // Return default structure
    return {
      version: '2.0',
      collectionPath: this.collectionPath,
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      sessionCallCount: 0, // Track API calls this session
      coins: {},  // coinId -> status info
      statistics: {
        total: 0,
        // Overall status
        complete: 0,      // All requested data types merged
        partial: 0,       // Some data types merged
        pending: 0,       // No data types merged yet
        skipped: 0,       // User skipped
        error: 0,         // Has errors
        // Per data type
        basicData: {
          merged: 0,
          pending: 0,
          notQueried: 0,
          error: 0,
          noData: 0
        },
        issueData: {
          merged: 0,
          pending: 0,
          notQueried: 0,
          error: 0,
          noMatch: 0,
          noData: 0
        },
        pricingData: {
          merged: 0,
          pending: 0,
          notQueried: 0,
          error: 0,
          noData: 0,
          // Freshness breakdown
          current: 0,   // < 3 months
          recent: 0,    // 3-12 months
          aging: 0,     // 1-2 years
          outdated: 0,  // > 2 years
          never: 0      // No timestamp
        }
      }
    };
  }

  /**
   * Rebuild progress from database metadata
   * Call this on startup to sync progress with actual database state
   * 
   * @param {Object} dbConnection - OpenNumismat database connection
   * @param {Object} fetchSettings - { basicData: bool, issueData: bool, pricingData: bool }
   */
  async rebuildFromDatabase(dbConnection, fetchSettings) {
    console.log('Rebuilding progress from database metadata...');
    
    // Store fetch settings for later use
    this.currentFetchSettings = fetchSettings;
    
    try {
      // Query all coins from database
      const query = `SELECT id, title, note FROM coins ORDER BY id`;
      const coins = await dbConnection.all(query);
      
      // Reset statistics
      this.progress.statistics.total = coins.length;
      this.resetStatistics();
      
      // Process each coin
      for (const coin of coins) {
        const { metadata } = metadataManager.readEnrichmentMetadata(coin.note);
        
        // Store coin data in progress cache
        this.progress.coins[coin.id] = {
          id: coin.id,
          title: coin.title || 'Untitled',
          basicData: { ...metadata.basicData },
          issueData: { ...metadata.issueData },
          pricingData: { ...metadata.pricingData }
        };
        
        // Update statistics based on metadata
        this.updateStatisticsForCoin(coin.id, metadata, fetchSettings);
      }
      
      this.saveProgress();
      console.log(`Progress rebuilt: ${coins.length} coins processed`);
      
    } catch (error) {
      console.error('Error rebuilding progress from database:', error);
      throw error;
    }
  }

  /**
   * Reset all statistics to zero
   */
  resetStatistics() {
    this.progress.statistics = {
      total: this.progress.statistics.total,
      complete: 0,
      partial: 0,
      pending: 0,
      skipped: 0,
      error: 0,
      basicData: {
        merged: 0,
        pending: 0,
        notQueried: 0,
        skipped: 0,
        error: 0,
        noData: 0
      },
      issueData: {
        merged: 0,
        pending: 0,
        notQueried: 0,
        skipped: 0,
        error: 0,
        noMatch: 0,
        noData: 0
      },
      pricingData: {
        merged: 0,
        pending: 0,
        notQueried: 0,
        skipped: 0,
        error: 0,
        noData: 0,
        current: 0,
        recent: 0,
        aging: 0,
        outdated: 0,
        never: 0
      }
    };
  }

  /**
   * Update statistics for a single coin based on its metadata
   * 
   * @param {number} coinId - Coin ID
   * @param {Object} metadata - Coin's enrichment metadata
   * @param {Object} fetchSettings - { basicData: bool, issueData: bool, pricingData: bool }
   */
  updateStatisticsForCoin(coinId, metadata, fetchSettings) {
    const stats = this.progress.statistics;
    
    // Count per data type
    ['basicData', 'issueData', 'pricingData'].forEach(dataType => {
      const status = metadata[dataType]?.status || 'NOT_QUERIED';
      const statKey = this.getStatKeyForStatus(status);
      
      if (stats[dataType][statKey] !== undefined) {
        stats[dataType][statKey]++;
      }
    });
    
    // Pricing freshness breakdown
    if (metadata.pricingData?.status === 'MERGED' && metadata.pricingData.timestamp) {
      const freshness = metadataManager.getPricingFreshness(
        metadataManager.writeEnrichmentMetadata('', metadata)
      );
      const freshnessKey = freshness.status.toLowerCase();
      if (stats.pricingData[freshnessKey] !== undefined) {
        stats.pricingData[freshnessKey]++;
      }
    } else if (metadata.pricingData?.status === 'MERGED') {
      stats.pricingData.never++;
    }
    
    // Overall status
    const overallStatus = this.calculateOverallStatus(metadata, fetchSettings);
    const overallKey = overallStatus.toLowerCase();
    if (stats[overallKey] !== undefined) {
      stats[overallKey]++;
    }
  }

  /**
   * Calculate overall status for a coin
   * 
   * @param {Object} metadata - Coin's enrichment metadata
   * @param {Object} fetchSettings - { basicData: bool, issueData: bool, pricingData: bool }
   * @returns {string} - 'COMPLETE', 'PARTIAL', 'PENDING', 'SKIPPED', 'ERROR'
   */
  calculateOverallStatus(metadata, fetchSettings) {
    let requested = 0;
    let merged = 0;
    let hasError = false;
    let hasSkipped = false;

    ['basicData', 'issueData', 'pricingData'].forEach(dataType => {
      if (fetchSettings[dataType]) {
        requested++;
        const status = metadata[dataType]?.status || 'NOT_QUERIED';
        
        if (status === 'MERGED') {
          merged++;
        } else if (status === 'ERROR') {
          hasError = true;
        } else if (status === 'SKIPPED') {
          hasSkipped = true;
        }
      }
    });

    if (hasSkipped) {
      return 'SKIPPED';
    }

    if (hasError) {
      return 'ERROR';
    }

    if (merged === requested && requested > 0) {
      return 'COMPLETE';
    }

    if (merged > 0) {
      return 'PARTIAL';
    }

    return 'PENDING';
  }

  /**
   * Convert status to statistics key
   */
  getStatKeyForStatus(status) {
    const mapping = {
      'MERGED': 'merged',
      'PENDING': 'pending',
      'NOT_QUERIED': 'notQueried',
      'ERROR': 'error',
      'SKIPPED': 'skipped',
      'NO_MATCH': 'noMatch',
      'NO_DATA': 'noData'
    };
    return mapping[status] || 'pending';
  }

  /**
   * Save progress to file
   */
  saveProgress() {
    try {
      this.progress.lastUpdated = new Date().toISOString();
      const data = JSON.stringify(this.progress, null, 2);
      fs.writeFileSync(this.progressFilePath, data, 'utf8');
    } catch (error) {
      console.error('Error saving progress file:', error);
      throw error;
    }
  }

  /**
   * Update coin data in progress cache
   * This is called after metadata is written to database
   * 
   * @param {number} coinId - Coin ID
   * @param {Object} metadata - New metadata
   * @param {Object} fetchSettings - Current fetch settings
   */
  updateCoinInCache(coinId, metadata, fetchSettings) {
    // Update cache
    if (!this.progress.coins[coinId]) {
      this.progress.coins[coinId] = { id: coinId };
    }
    
    this.progress.coins[coinId].basicData = { ...metadata.basicData };
    this.progress.coins[coinId].issueData = { ...metadata.issueData };
    this.progress.coins[coinId].pricingData = { ...metadata.pricingData };
    this.progress.coins[coinId].updatedAt = new Date().toISOString();
    
    // Recalculate all statistics (simple approach - could be optimized)
    this.resetStatistics();
    for (const [id, coinData] of Object.entries(this.progress.coins)) {
      const coinMetadata = {
        version: '2.0',
        basicData: coinData.basicData,
        issueData: coinData.issueData,
        pricingData: coinData.pricingData
      };
      this.updateStatisticsForCoin(parseInt(id), coinMetadata, fetchSettings);
    }
    
    this.saveProgress();
  }

  /**
   * Increment session API call counter
   * 
   * @param {number} count - Number of calls to add (default 1)
   */
  incrementSessionCalls(count = 1) {
    this.progress.sessionCallCount += count;
    this.saveProgress();
  }

  /**
   * Get session API call count
   * 
   * @returns {number} - Number of API calls this session
   */
  getSessionCallCount() {
    return this.progress.sessionCallCount || 0;
  }

  /**
   * Reset session API call counter
   */
  resetSessionCallCount() {
    this.progress.sessionCallCount = 0;
    this.saveProgress();
  }

  /**
   * Get the status of a specific data type for a coin
   * 
   * @param {number} coinId
   * @param {string} dataType - 'basicData', 'issueData', or 'pricingData'
   * @returns {Object|null} - Status info or null if not tracked
   */
  getCoinDataStatus(coinId, dataType) {
    const coin = this.progress.coins[coinId];
    if (!coin) return null;
    return coin[dataType] || null;
  }

  /**
   * Get full coin data from cache
   * 
   * @param {number} coinId
   * @returns {Object|null} - Coin data or null if not tracked
   */
  getCoinData(coinId) {
    return this.progress.coins[coinId] || null;
  }

  /**
   * Get overall status for a coin (for backward compatibility)
   * Returns status information for display in coin list
   * 
   * @param {number} coinId - Coin ID
   * @returns {Object|null} Status info object with overall status
   */
  getCoinStatus(coinId) {
    const coinData = this.progress.coins[coinId];
    if (!coinData) {
      return null;
    }

    // Get current fetch settings to calculate overall status
    const fetchSettings = this.currentFetchSettings || {
      basicData: true,
      issueData: false,
      pricingData: false
    };

    const metadata = {
      version: '2.0',
      basicData: coinData.basicData,
      issueData: coinData.issueData,
      pricingData: coinData.pricingData
    };

    const overallStatus = this.calculateOverallStatus(metadata, fetchSettings);

    return {
      status: overallStatus,
      basicData: coinData.basicData,
      issueData: coinData.issueData,
      pricingData: coinData.pricingData,
      title: coinData.title
    };
  }

  /**
   * Get all coins matching a filter
   * 
   * @param {Object} filters - Filter criteria
   * @param {string} filters.overallStatus - 'complete', 'partial', 'pending', 'skipped', 'error'
   * @param {string} filters.basicDataStatus - Status of basic data
   * @param {string} filters.issueDataStatus - Status of issue data
   * @param {string} filters.pricingDataStatus - Status of pricing data
   * @param {string} filters.pricingFreshness - 'current', 'recent', 'aging', 'outdated', 'never'
   * @returns {Array} - Array of coin data objects
   */
  getCoinsMatchingFilter(filters, fetchSettings) {
    const results = [];
    
    for (const [coinId, coinData] of Object.entries(this.progress.coins)) {
      const metadata = {
        version: '2.0',
        basicData: coinData.basicData,
        issueData: coinData.issueData,
        pricingData: coinData.pricingData
      };
      
      // Check overall status
      if (filters.overallStatus) {
        const overallStatus = this.calculateOverallStatus(metadata, fetchSettings);
        if (overallStatus.toLowerCase() !== filters.overallStatus.toLowerCase()) {
          continue;
        }
      }
      
      // Check specific data type statuses
      if (filters.basicDataStatus && 
          coinData.basicData?.status !== filters.basicDataStatus) {
        continue;
      }
      
      if (filters.issueDataStatus && 
          coinData.issueData?.status !== filters.issueDataStatus) {
        continue;
      }
      
      if (filters.pricingDataStatus && 
          coinData.pricingData?.status !== filters.pricingDataStatus) {
        continue;
      }
      
      // Check pricing freshness
      if (filters.pricingFreshness) {
        const freshness = metadataManager.getPricingFreshness(
          metadataManager.writeEnrichmentMetadata('', metadata)
        );
        if (freshness.status.toLowerCase() !== filters.pricingFreshness.toLowerCase()) {
          continue;
        }
      }
      
      results.push({
        coinId: parseInt(coinId),
        ...coinData
      });
    }
    
    return results;
  }

  /**
   * Get progress statistics
   * 
   * @returns {Object} - Statistics object with completion percentage
   */
  getStatistics() {
    return {
      ...this.progress.statistics,
      completionPercentage: this.calculateCompletionPercentage(),
      sessionCallCount: this.getSessionCallCount()
    };
  }

  /**
   * Calculate completion percentage based on complete coins
   */
  calculateCompletionPercentage() {
    const total = this.progress.statistics.total;
    if (total === 0) return 0;

    const completed = this.progress.statistics.complete + this.progress.statistics.skipped;
    return Math.round((completed / total) * 100);
  }

  /**
   * Initialize progress for a collection
   * 
   * @param {number} totalCoins - Total number of coins in collection
   */
  initializeCollection(totalCoins) {
    this.progress.statistics.total = totalCoins;
    this.saveProgress();
  }

  /**
   * Reset progress (clear cache, force rebuild on next load)
   */
  resetProgress() {
    this.progress.coins = {};
    this.resetStatistics();
    this.progress.sessionCallCount = 0;
    this.saveProgress();
  }

  /**
   * Get the full progress object (for debugging/display)
   */
  getProgress() {
    return this.progress;
  }

  /**
   * Export progress to a readable format
   * 
   * @returns {string} - Formatted progress report
   */
  exportProgressReport() {
    const stats = this.getStatistics();
    const report = [];

    report.push('='.repeat(70));
    report.push('NUMISMAT ENRICHMENT PROGRESS REPORT - Phase 2');
    report.push('='.repeat(70));
    report.push('');
    report.push(`Collection: ${path.basename(this.collectionPath)}`);
    report.push(`Started: ${new Date(this.progress.startedAt).toLocaleString()}`);
    report.push(`Last Updated: ${new Date(this.progress.lastUpdated).toLocaleString()}`);
    report.push(`Session API Calls: ${stats.sessionCallCount}`);
    report.push('');
    
    report.push('OVERALL STATUS:');
    report.push(`  Total Coins: ${stats.total}`);
    report.push(`  Complete: ${stats.complete} (${this.percentage(stats.complete, stats.total)})`);
    report.push(`  Partial: ${stats.partial} (${this.percentage(stats.partial, stats.total)})`);
    report.push(`  Pending: ${stats.pending} (${this.percentage(stats.pending, stats.total)})`);
    report.push(`  Skipped: ${stats.skipped} (${this.percentage(stats.skipped, stats.total)})`);
    report.push(`  Errors: ${stats.error} (${this.percentage(stats.error, stats.total)})`);
    report.push('');
    
    report.push('BASIC DATA:');
    report.push(`  Merged: ${stats.basicData.merged}`);
    report.push(`  Pending: ${stats.basicData.pending}`);
    report.push(`  Not Queried: ${stats.basicData.notQueried}`);
    report.push(`  Errors: ${stats.basicData.error}`);
    report.push('');
    
    report.push('ISSUE DATA:');
    report.push(`  Merged: ${stats.issueData.merged}`);
    report.push(`  Pending: ${stats.issueData.pending}`);
    report.push(`  Not Queried: ${stats.issueData.notQueried}`);
    report.push(`  No Match: ${stats.issueData.noMatch}`);
    report.push(`  Errors: ${stats.issueData.error}`);
    report.push('');
    
    report.push('PRICING DATA:');
    report.push(`  Merged: ${stats.pricingData.merged}`);
    report.push(`  Pending: ${stats.pricingData.pending}`);
    report.push(`  Not Queried: ${stats.pricingData.notQueried}`);
    report.push(`  Errors: ${stats.pricingData.error}`);
    report.push('');
    
    report.push('PRICING FRESHNESS:');
    report.push(`  🟢 Current (<3mo): ${stats.pricingData.current}`);
    report.push(`  🟡 Recent (3-12mo): ${stats.pricingData.recent}`);
    report.push(`  🟠 Aging (1-2yr): ${stats.pricingData.aging}`);
    report.push(`  🔴 Outdated (>2yr): ${stats.pricingData.outdated}`);
    report.push(`  ⚪ Never Updated: ${stats.pricingData.never}`);
    report.push('');
    
    report.push(`Overall Completion: ${stats.completionPercentage}%`);
    report.push('='.repeat(70));

    return report.join('\n');
  }

  /**
   * Helper to calculate percentage
   */
  percentage(value, total) {
    if (total === 0) return '0%';
    return `${Math.round((value / total) * 100)}%`;
  }
}

module.exports = ProgressTracker;
