const fs = require('fs');
const path = require('path');
const { DEFAULT_FIELD_MAPPING } = require('./default-field-mapping');

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
  constructor(collectionPath) {
    this.collectionPath = collectionPath;
    this.settingsFilePath = this.getSettingsFilePath(collectionPath);
    this.settings = this.loadSettings();
  }

  /**
   * Get the path for the settings file
   */
  getSettingsFilePath(collectionPath) {
    const dir = path.dirname(collectionPath);
    const basename = path.basename(collectionPath, '.db');
    return path.join(dir, `${basename}_settings.json`);
  }

  /**
   * Get default settings structure
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
        pricingData: false    // Optional - can be independently fetched
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
        imageHandling: 'url' // 'url' or 'blob'
      }
    };
  }

  /**
   * Build serializable field mappings from default-field-mapping.js
   * Only stores enabled/disabled state per field (transforms are not serializable)
   */
  buildDefaultFieldMappings() {
    const mappings = {};
    for (const [fieldName, config] of Object.entries(DEFAULT_FIELD_MAPPING)) {
      mappings[fieldName] = {
        enabled: config.enabled !== false,
        priority: config.priority || 'MEDIUM',
        description: config.description || fieldName
      };
    }
    return mappings;
  }

  /**
   * Load settings from file or create defaults
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
      console.error('Error loading settings file:', error);
    }

    // Return defaults
    return this.getDefaultSettings();
  }

  /**
   * Merge loaded settings with defaults to ensure completeness
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

      fieldMappings: {
        ...defaults.fieldMappings,
        ...(loaded.fieldMappings || {})
      },

      uiPreferences: {
        ...defaults.uiPreferences,
        ...(loaded.uiPreferences || {})
      }
    };
  }

  /**
   * Save settings to file
   */
  saveSettings() {
    try {
      const data = JSON.stringify(this.settings, null, 2);
      fs.writeFileSync(this.settingsFilePath, data, 'utf8');
      return true;
    } catch (error) {
      console.error('Error saving settings file:', error);
      return false;
    }
  }

  /**
   * Get all settings
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Get API key
   */
  getApiKey() {
    return this.settings.apiConfiguration.apiKey;
  }

  /**
   * Set API key
   */
  setApiKey(apiKey) {
    this.settings.apiConfiguration.apiKey = apiKey;
    this.saveSettings();
  }

  /**
   * Get rate limit
   */
  getRateLimit() {
    return this.settings.apiConfiguration.rateLimit;
  }

  /**
   * Set rate limit
   */
  setRateLimit(rateLimit) {
    this.settings.apiConfiguration.rateLimit = rateLimit;
    this.saveSettings();
  }

  /**
   * Get fetch settings
   */
  getFetchSettings() {
    return { ...this.settings.fetchSettings };
  }

  /**
   * Set fetch settings
   */
  setFetchSettings(fetchSettings) {
    this.settings.fetchSettings = {
      basicData: fetchSettings.basicData !== undefined ? fetchSettings.basicData : this.settings.fetchSettings.basicData,
      issueData: fetchSettings.issueData !== undefined ? fetchSettings.issueData : this.settings.fetchSettings.issueData,
      pricingData: fetchSettings.pricingData !== undefined ? fetchSettings.pricingData : this.settings.fetchSettings.pricingData
    };
    this.saveSettings();
  }

  /**
   * Get pricing currency
   */
  getCurrency() {
    return this.settings.currency || 'USD';
  }

  /**
   * Set pricing currency
   */
  setCurrency(currency) {
    this.settings.currency = currency;
    this.saveSettings();
  }

  /**
   * Calculate API calls per coin based on fetch settings
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
   * Get field mappings
   */
  getFieldMappings() {
    return { ...this.settings.fieldMappings };
  }

  /**
   * Set field mappings
   */
  setFieldMappings(fieldMappings) {
    this.settings.fieldMappings = { ...fieldMappings };
    this.saveSettings();
  }

  /**
   * Get UI preferences
   */
  getUiPreferences() {
    return { ...this.settings.uiPreferences };
  }

  /**
   * Set UI preferences
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
   */
  getAutoBackup() {
    return this.settings.uiPreferences.autoBackup;
  }

  /**
   * Set auto-backup setting
   */
  setAutoBackup(enabled) {
    this.settings.uiPreferences.autoBackup = enabled;
    this.saveSettings();
  }

  /**
   * Get image handling mode
   */
  getImageHandling() {
    return this.settings.uiPreferences.imageHandling;
  }

  /**
   * Set image handling mode
   */
  setImageHandling(mode) {
    if (mode === 'url' || mode === 'blob') {
      this.settings.uiPreferences.imageHandling = mode;
      this.saveSettings();
    }
  }

  /**
   * Reset to defaults
   */
  resetToDefaults() {
    const apiKey = this.settings.apiConfiguration.apiKey; // Preserve API key
    this.settings = this.getDefaultSettings();
    this.settings.apiConfiguration.apiKey = apiKey; // Restore API key
    this.saveSettings();
  }

  /**
   * Export settings for debugging
   */
  exportSettings() {
    return JSON.stringify(this.settings, null, 2);
  }

  /**
   * Import settings from JSON
   */
  importSettings(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      this.settings = this.mergeWithDefaults(imported);
      this.saveSettings();
      return true;
    } catch (error) {
      console.error('Error importing settings:', error);
      return false;
    }
  }
}

module.exports = SettingsManager;
