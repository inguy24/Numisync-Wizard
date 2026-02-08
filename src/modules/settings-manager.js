const fs = require('fs');
const path = require('path');
const { DEFAULT_FIELD_MAPPING, NUMISTA_SOURCES } = require('./default-field-mapping');
const log = require('../main/logger').scope('Settings');

/**
 * Settings Manager - Phase 2
 * 
 * Manages user settings that are portable with the collection.
 * Settings are stored in a JSON file next to the database:
 *   {database-name}_settings.json
 * 
 * Settings include:
 * - API configuration (key, rate limit)
 * - Fetch settings (which data types to fetch)
 * - Field mappings (custom mappings)
 * - UI preferences (view, sort, filter defaults)
 */
class SettingsManager {
  /**
   * Creates a new SettingsManager for a collection
   * @param {string} collectionPath - Path to the .db collection file
   */
  constructor(collectionPath) {
    this.collectionPath = collectionPath;
    this.settingsFilePath = this.getSettingsFilePath(collectionPath);
    this.settings = this.loadSettings();
  }

  /**
   * Get the path for the settings JSON file (next to the .db file)
   * @param {string} collectionPath - Path to the collection .db file
   * @returns {string} Path to the settings JSON file
   */
  getSettingsFilePath(collectionPath) {
    const dir = path.dirname(collectionPath);
    const basename = path.basename(collectionPath, '.db');
    return path.join(dir, `${basename}_settings.json`);
  }

  /**
   * Get default settings structure with all options initialized
   * @returns {Object} Default settings object
   */
  getDefaultSettings() {
    return {
      version: '1.0',
      collectionPath: this.collectionPath,
      
      apiConfiguration: {
        apiKey: '',
        rateLimit: 2000 // ms between requests
      },
      
      fetchSettings: {
        basicData: true,      // Optional - can be independently fetched
        issueData: false,     // Optional - can be independently fetched
        pricingData: false,   // Optional - can be independently fetched
        searchCategory: 'all', // 'all', 'default', 'coin', 'banknote', 'exonumia'
        emptyMintmarkInterpretation: 'no_mint_mark', // 'no_mint_mark' or 'unknown'
        enableAutoPropagate: true // Auto-detect and offer to propagate type data to matching coins
      },
      
      // Pricing currency preference
      currency: 'USD',
      
      fieldMappings: this.buildDefaultFieldMappings(),
      
      uiPreferences: {
        defaultView: 'list',
        defaultSort: 'title',
        defaultFilter: 'all',
        showThumbnails: true,
        autoBackup: true,
        maxBackups: 5,        // 0 = unlimited (no pruning), positive int = keep that many
        imageHandling: 'url', // 'url' or 'blob'
        stickyInfoBar: false, // Pin info bar to top when scrolling
        lastViewState: null   // Saved page/scroll/filter/sort state for session restore
      }
    };
  }

  /**
   * Build serializable field mappings from default-field-mapping.js
   * Stores enabled/disabled state, sourceKey, and catalogCode per field
   * @returns {Object} Field mappings keyed by field name
   */
  buildDefaultFieldMappings() {
    const mappings = {};
    for (const [fieldName, config] of Object.entries(DEFAULT_FIELD_MAPPING)) {
      mappings[fieldName] = {
        enabled: config.enabled !== false,
        sourceKey: config.defaultSourceKey || null,
        catalogCode: config.catalogCode || null,
        description: config.description || fieldName
      };
    }
    return mappings;
  }

  /**
   * Build a full FieldMapper-compatible config from user settings.
   * Looks up each field's sourceKey in NUMISTA_SOURCES to get the
   * numistaPath and transform, combined with enabled from settings.
   * @returns {Object} Config object compatible with FieldMapper constructor
   */
  buildFieldMapperConfig() {
    const userMappings = this.settings.fieldMappings || {};
    const config = {};

    for (const [fieldName, defaultConfig] of Object.entries(DEFAULT_FIELD_MAPPING)) {
      const userConfig = userMappings[fieldName] || {};

      // Determine which source key to use (user override or default)
      const sourceKey = userConfig.sourceKey || defaultConfig.defaultSourceKey || null;
      const source = sourceKey ? NUMISTA_SOURCES[sourceKey] : null;

      // Build the mapping entry
      config[fieldName] = {
        numistaPath: source ? source.path : defaultConfig.numistaPath,
        transform: source ? source.transform : defaultConfig.transform,
        priority: defaultConfig.priority,
        enabled: userConfig.enabled !== undefined ? userConfig.enabled : (defaultConfig.enabled !== false),
        requiresIssueData: source ? (source.requiresIssueData || false) : (defaultConfig.requiresIssueData || false),
        requiresPricingData: source ? (source.requiresPricingData || false) : (defaultConfig.requiresPricingData || false),
        description: userConfig.description || defaultConfig.description,
        catalogCode: userConfig.catalogCode || defaultConfig.catalogCode || null,
        defaultSourceKey: defaultConfig.defaultSourceKey
      };
    }

    return config;
  }

  /**
   * Load settings from file or create defaults if file doesn't exist
   * @returns {Object} Loaded settings merged with defaults
   */
  loadSettings() {
    try {
      if (fs.existsSync(this.settingsFilePath)) {
        const data = fs.readFileSync(this.settingsFilePath, 'utf8');
        const loaded = JSON.parse(data);
        
        // Merge with defaults to ensure all fields exist
        return this.mergeWithDefaults(loaded);
      }
    } catch (error) {
      log.error('Error loading settings file:', error);
    }

    // Return defaults
    return this.getDefaultSettings();
  }

  /**
   * Merge loaded settings with defaults to ensure all fields exist
   * @param {Object} loaded - Settings loaded from file
   * @returns {Object} Complete settings object with all fields
   */
  mergeWithDefaults(loaded) {
    const defaults = this.getDefaultSettings();
    
    return {
      version: loaded.version || defaults.version,
      collectionPath: this.collectionPath,

      apiConfiguration: {
        ...defaults.apiConfiguration,
        ...(loaded.apiConfiguration || {})
      },

      fetchSettings: {
        ...defaults.fetchSettings,
        ...(loaded.fetchSettings || {})
      },

      currency: loaded.currency || defaults.currency,

      fieldMappings: this.mergeFieldMappings(defaults.fieldMappings, loaded.fieldMappings || {}),

      uiPreferences: {
        ...defaults.uiPreferences,
        ...(loaded.uiPreferences || {})
      }
    };
  }

  /**
   * Deep-merge per-field mappings so that new default properties
   * (like sourceKey) backfill into older saved settings.
   * @param {Object} defaults - Default field mappings
   * @param {Object} loaded - User's saved field mappings
   * @returns {Object} Merged field mappings
   */
  mergeFieldMappings(defaults, loaded) {
    const merged = {};
    for (const [fieldName, defaultConfig] of Object.entries(defaults)) {
      const loadedConfig = loaded[fieldName];
      if (!loadedConfig) {
        merged[fieldName] = { ...defaultConfig };
      } else {
        merged[fieldName] = {
          ...defaultConfig,
          ...loadedConfig,
          // Backfill sourceKey from default if loaded value is null/undefined
          sourceKey: loadedConfig.sourceKey || defaultConfig.sourceKey
        };
      }
    }
    // Preserve any extra fields in loaded that aren't in defaults
    for (const [fieldName, config] of Object.entries(loaded)) {
      if (!merged[fieldName]) {
        merged[fieldName] = { ...config };
      }
    }
    return merged;
  }

  /**
   * Save current settings to the JSON file
   * @returns {boolean} True if save succeeded, false on error
   */
  saveSettings() {
    try {
      const data = JSON.stringify(this.settings, null, 2);
      fs.writeFileSync(this.settingsFilePath, data, 'utf8');
      return true;
    } catch (error) {
      log.error('Error saving settings file:', error);
      return false;
    }
  }

  /**
   * Get a copy of all settings
   * @returns {Object} Copy of all settings
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Get the stored API key
   * @returns {string} API key or empty string
   */
  getApiKey() {
    return this.settings.apiConfiguration.apiKey;
  }

  /**
   * Set and save the API key
   * @param {string} apiKey - Numista API key
   */
  setApiKey(apiKey) {
    this.settings.apiConfiguration.apiKey = apiKey;
    this.saveSettings();
  }

  /**
   * Get the rate limit (ms between requests)
   * @returns {number} Rate limit in milliseconds
   */
  getRateLimit() {
    return this.settings.apiConfiguration.rateLimit;
  }

  /**
   * Set and save the rate limit
   * @param {number} rateLimit - Rate limit in milliseconds
   */
  setRateLimit(rateLimit) {
    this.settings.apiConfiguration.rateLimit = rateLimit;
    this.saveSettings();
  }

  /**
   * Get a copy of fetch settings
   * @returns {Object} Fetch settings with basicData, issueData, pricingData, searchCategory
   */
  getFetchSettings() {
    return { ...this.settings.fetchSettings };
  }

  /**
   * Set and save fetch settings
   * @param {Object} fetchSettings - Fetch settings to update
   * @param {boolean} [fetchSettings.basicData] - Whether to fetch basic type data
   * @param {boolean} [fetchSettings.issueData] - Whether to fetch issue data
   * @param {boolean} [fetchSettings.pricingData] - Whether to fetch pricing data
   * @param {string} [fetchSettings.searchCategory] - Search category filter
   */
  setFetchSettings(fetchSettings) {
    this.settings.fetchSettings = {
      basicData: fetchSettings.basicData !== undefined ? fetchSettings.basicData : this.settings.fetchSettings.basicData,
      issueData: fetchSettings.issueData !== undefined ? fetchSettings.issueData : this.settings.fetchSettings.issueData,
      pricingData: fetchSettings.pricingData !== undefined ? fetchSettings.pricingData : this.settings.fetchSettings.pricingData,
      searchCategory: fetchSettings.searchCategory !== undefined ? fetchSettings.searchCategory : this.settings.fetchSettings.searchCategory,
      emptyMintmarkInterpretation: fetchSettings.emptyMintmarkInterpretation !== undefined ? fetchSettings.emptyMintmarkInterpretation : this.settings.fetchSettings.emptyMintmarkInterpretation,
      enableAutoPropagate: fetchSettings.enableAutoPropagate !== undefined ? fetchSettings.enableAutoPropagate : this.settings.fetchSettings.enableAutoPropagate
    };
    this.saveSettings();
  }

  /**
   * Get the pricing currency code
   * @returns {string} Currency code (e.g., 'USD', 'EUR')
   */
  getCurrency() {
    return this.settings.currency || 'USD';
  }

  /**
   * Set and save the pricing currency
   * @param {string} currency - Currency code
   */
  setCurrency(currency) {
    this.settings.currency = currency;
    this.saveSettings();
  }

  /**
   * Calculate estimated API calls per coin based on current fetch settings
   * @returns {number} Number of API calls required per coin
   */
  getCallsPerCoin() {
    let calls = 0;

    if (this.settings.fetchSettings.basicData) {
      calls += 2; // Basic data requires 2 calls (search + type details)
    }

    if (this.settings.fetchSettings.issueData) {
      calls += 1; // Issues endpoint
    }

    if (this.settings.fetchSettings.pricingData) {
      calls += 1; // Pricing endpoint
    }

    return calls;
  }

  /**
   * Get a copy of field mappings
   * @returns {Object} Field mappings keyed by field name
   */
  getFieldMappings() {
    return { ...this.settings.fieldMappings };
  }

  /**
   * Set and save field mappings
   * @param {Object} fieldMappings - Field mappings keyed by field name
   */
  setFieldMappings(fieldMappings) {
    this.settings.fieldMappings = { ...fieldMappings };
    this.saveSettings();
  }

  /**
   * Get a copy of UI preferences
   * @returns {Object} UI preferences object
   */
  getUiPreferences() {
    return { ...this.settings.uiPreferences };
  }

  /**
   * Set and save UI preferences (merges with existing)
   * @param {Object} uiPreferences - UI preferences to update
   */
  setUiPreferences(uiPreferences) {
    this.settings.uiPreferences = {
      ...this.settings.uiPreferences,
      ...uiPreferences
    };
    this.saveSettings();
  }

  /**
   * Get auto-backup setting
   * @returns {boolean} True if auto-backup is enabled
   */
  getAutoBackup() {
    return this.settings.uiPreferences.autoBackup;
  }

  /**
   * Set and save auto-backup setting
   * @param {boolean} enabled - Whether to enable auto-backup
   */
  setAutoBackup(enabled) {
    this.settings.uiPreferences.autoBackup = enabled;
    this.saveSettings();
  }

  /**
   * Get maximum backups to keep
   * @returns {number} Max backups (0 = unlimited, positive = limit)
   */
  getMaxBackups() {
    const val = this.settings.uiPreferences.maxBackups;
    return (val !== undefined && val !== null) ? val : 5;
  }

  /**
   * Set and save maximum backups to keep
   * @param {number} count - Max backups (0 = unlimited)
   */
  setMaxBackups(count) {
    this.settings.uiPreferences.maxBackups = Math.max(0, Math.floor(count));
    this.saveSettings();
  }

  /**
   * Get image handling mode
   * @returns {string} 'url' or 'blob'
   */
  getImageHandling() {
    return this.settings.uiPreferences.imageHandling;
  }

  /**
   * Set and save image handling mode
   * @param {string} mode - 'url' or 'blob'
   */
  setImageHandling(mode) {
    if (mode === 'url' || mode === 'blob') {
      this.settings.uiPreferences.imageHandling = mode;
      this.saveSettings();
    }
  }

  /**
   * Reset all settings to defaults (preserves API key)
   */
  resetToDefaults() {
    const apiKey = this.settings.apiConfiguration.apiKey; // Preserve API key
    this.settings = this.getDefaultSettings();
    this.settings.apiConfiguration.apiKey = apiKey; // Restore API key
    this.saveSettings();
  }

  /**
   * Export settings as formatted JSON string
   * @returns {string} JSON representation of all settings
   */
  exportSettings() {
    return JSON.stringify(this.settings, null, 2);
  }

  /**
   * Import settings from JSON string
   * @param {string} jsonString - JSON string to parse and import
   * @returns {boolean} True if import succeeded, false on error
   */
  importSettings(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      this.settings = this.mergeWithDefaults(imported);
      this.saveSettings();
      return true;
    } catch (error) {
      log.error('Error importing settings:', error);
      return false;
    }
  }
}

module.exports = SettingsManager;
