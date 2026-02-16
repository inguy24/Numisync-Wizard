const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload Script
 *
 * Exposes IPC methods to the renderer process via contextBridge.
 * This is the secure bridge between the main process and renderer.
 */

/**
 * Denomination alias and plural lookup maps.
 * Loaded from main process via synchronous IPC at startup.
 * Source of truth: src/data/denomination-aliases.json
 */
const { aliasMap: DENOMINATION_ALIASES, pluralMap: DENOMINATION_PLURALS, allCanonicalsMap: ALL_CANONICALS } = ipcRenderer.sendSync('get-denomination-aliases');

/**
 * Normalize a denomination unit string to its canonical form.
 * @param {string|null} raw - Raw unit string (e.g., "Kopeks", "pfenning", "Cents")
 * @returns {string} Canonical form, or cleaned input if not in alias map
 */
function normalizeUnit(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const unit = raw.normalize('NFC').toLowerCase().trim().replace(/[.]/g, '');
  if (unit === '') return '';
  if (DENOMINATION_ALIASES[unit]) return DENOMINATION_ALIASES[unit];
  // Strip diacritics (ö→o, é→e, ř→r, etc.) and retry alias lookup
  const stripped = unit.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (stripped !== unit && DENOMINATION_ALIASES[stripped]) return DENOMINATION_ALIASES[stripped];
  if (unit.endsWith('s') && unit.length > 2) {
    const singular = unit.slice(0, -1);
    if (DENOMINATION_ALIASES[singular]) return DENOMINATION_ALIASES[singular];
    const strippedSingular = singular.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (strippedSingular !== singular && DENOMINATION_ALIASES[strippedSingular]) return DENOMINATION_ALIASES[strippedSingular];
  }
  // Return accent-stripped form for fallback dice comparison
  return stripped;
}

/**
 * Check if two denomination unit strings refer to the same denomination.
 * @param {string|null} unitA - First unit string
 * @param {string|null} unitB - Second unit string
 * @returns {boolean} True if both normalize to the same canonical form
 */
function denominationUnitsMatch(unitA, unitB) {
  const a = normalizeUnit(unitA);
  const b = normalizeUnit(unitB);
  if (!a || !b) return false;
  return a === b;
}

/**
 * Get the correct singular or plural form of a denomination for Numista search.
 * @param {string} canonical - Canonical (singular) denomination form
 * @param {number} numericValue - The numeric value (1 = singular, otherwise plural)
 * @returns {string} The correct form for the given value
 */
function getSearchForm(canonical, numericValue) {
  if (!canonical) return canonical;
  if (numericValue === 1) return canonical;
  return DENOMINATION_PLURALS[canonical] || canonical;
}

/**
 * Get all alternate search forms for a denomination unit.
 * When a denomination appears in multiple canonical entries (cross-referenced),
 * returns the plural forms of ALL those canonicals for search retries.
 * @param {string} unit - Raw denomination unit string
 * @param {number} numericValue - Numeric value (for singular/plural selection)
 * @returns {string[]} All search forms (empty if no alternates)
 */
function getAlternateSearchForms(unit, numericValue) {
  if (!unit) return [];
  const key = unit.toLowerCase().trim().replace(/[.]/g, '');
  const canonicals = ALL_CANONICALS[key];
  if (!canonicals || canonicals.length <= 1) return [];
  return canonicals.map(c => getSearchForm(c, numericValue));
}

/**
 * Calculate Dice's coefficient string similarity
 * Defined directly in preload to avoid importing heavy modules (axios, etc.)
 * into the renderer preload context.
 * @param {string} a - First string to compare
 * @param {string} b - Second string to compare
 * @returns {number} Similarity score from 0.0 to 1.0
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

/**
 * API methods exposed to renderer process via contextBridge
 * Each method invokes an IPC handler in the main process
 * @type {Object}
 */
const apiMethods = {
  // File operations
  selectCollectionFile: () => ipcRenderer.invoke('select-collection-file'),
  loadCollection: (filePath) => ipcRenderer.invoke('load-collection', filePath),
  getCoins: (options) => ipcRenderer.invoke('get-coins', options),
  getCoinDetails: (coinId) => ipcRenderer.invoke('get-coin-details', coinId),
  
  // Numista search
  searchNumista: (searchParams) => ipcRenderer.invoke('search-numista', searchParams),
  manualSearchNumista: (data) => ipcRenderer.invoke('manual-search-numista', data),
  getNumistaType: (typeId) => ipcRenderer.invoke('get-numista-type', typeId),
  fetchCoinData: (data) => ipcRenderer.invoke('fetch-coin-data', data),
  fetchPricingForIssue: (data) => ipcRenderer.invoke('fetch-pricing-for-issue', data),
  fetchIssueData: (data) => ipcRenderer.invoke('fetch-issue-data', data),
  
  // Field mapping and merge
  compareFields: (data) => ipcRenderer.invoke('compare-fields', data),
  mergeData: (data) => ipcRenderer.invoke('merge-data', data),
  
  // Progress tracking
  updateCoinStatus: (data) => ipcRenderer.invoke('update-coin-status', data),
  getProgressStats: () => ipcRenderer.invoke('get-progress-stats'),
  
  // Settings (Phase 1 - app-wide, for backward compatibility)
  getAppSettings: () => ipcRenderer.invoke('get-app-settings'),
  saveAppSettings: (settings) => ipcRenderer.invoke('save-app-settings', settings),
  
  // Phase 2 - Settings Manager (collection-specific)
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveFetchSettings: (settings) => ipcRenderer.invoke('save-fetch-settings', settings),
  saveCurrency: (currency) => ipcRenderer.invoke('save-currency', currency),
  getCurrency: () => ipcRenderer.invoke('get-currency'),
  saveUiPreference: (key, value) => ipcRenderer.invoke('save-ui-preference', key, value),

  // Phase 2 - Settings reset
  resetSettings: () => ipcRenderer.invoke('reset-settings'),

  // Phase 2 - Statistics and API tracking
  getStatistics: () => ipcRenderer.invoke('get-statistics'),
  incrementApiCalls: (count) => ipcRenderer.invoke('increment-api-calls', count),

  // Phase 2 - Image handling
  getCoinImages: (coinId) => ipcRenderer.invoke('get-coin-images', coinId),
  downloadAndStoreImages: (data) => ipcRenderer.invoke('download-and-store-images', data),

  // Matching & normalization
  resolveIssuer: (countryName) => ipcRenderer.invoke('resolve-issuer', countryName),

  // Field Mappings
  getFieldMappings: () => ipcRenderer.invoke('get-field-mappings'),
  saveFieldMappings: (mappings) => ipcRenderer.invoke('save-field-mappings', mappings),
  getAvailableSources: () => ipcRenderer.invoke('get-available-sources'),
  exportFieldMappings: () => ipcRenderer.invoke('export-field-mappings'),
  importFieldMappings: () => ipcRenderer.invoke('import-field-mappings'),
  resetFieldMappings: () => ipcRenderer.invoke('reset-field-mappings'),

  // Utility
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  openManual: () => ipcRenderer.invoke('open-manual'),

  // Default Collection (auto-load on startup)
  getDefaultCollection: () => ipcRenderer.invoke('get-default-collection'),
  setDefaultCollection: (path) => ipcRenderer.invoke('set-default-collection', path),
  browseDefaultCollection: () => ipcRenderer.invoke('browse-default-collection'),

  // Recent Collections
  getRecentCollections: () => ipcRenderer.invoke('get-recent-collections'),
  clearRecentCollections: () => ipcRenderer.invoke('clear-recent-collections'),

  // Menu State
  updateMenuState: (state) => ipcRenderer.invoke('menu:update-state', state),

  // Licensing & Supporter Status
  getSupporterStatus: () => ipcRenderer.invoke('get-supporter-status'),
  validateLicenseKey: (key) => ipcRenderer.invoke('validate-license-key', key),
  validateLicense: () => ipcRenderer.invoke('validate-license'),
  deactivateLicense: () => ipcRenderer.invoke('deactivate-license'),
  updateSupporterStatus: (updates) => ipcRenderer.invoke('update-supporter-status', updates),
  incrementLifetimeEnrichments: (count) => ipcRenderer.invoke('increment-lifetime-enrichments', count),
  getLifetimeStats: () => ipcRenderer.invoke('get-lifetime-stats'),
  clearLicense: () => ipcRenderer.invoke('clear-license'),
  checkFeatureAccess: (featureName) => ipcRenderer.invoke('check-feature-access', featureName),

  // Fast Pricing Update (Premium Feature)
  createBackupBeforeBatch: () => ipcRenderer.invoke('create-backup-before-batch'),
  fastPricingUpdate: (data) => ipcRenderer.invoke('fast-pricing-update', data),

  // Batch Type Data Propagation (Premium Feature - Task 3.12)
  propagateTypeData: (data) => ipcRenderer.invoke('propagate-type-data', data),

  // Installer EULA marker check
  checkInstallerEulaMarker: () => ipcRenderer.invoke('check-installer-eula-marker'),

  // Auto-update
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

  // API Cache & Monthly Usage
  getMonthlyUsage: () => ipcRenderer.invoke('get-monthly-usage'),
  setMonthlyUsage: (limit) => ipcRenderer.invoke('set-monthly-usage', limit),
  setMonthlyUsageTotal: (total) => ipcRenderer.invoke('set-monthly-usage-total', total),
  clearApiCache: () => ipcRenderer.invoke('clear-api-cache'),

  // Cache Location Settings
  cacheSettings: {
    get: () => ipcRenderer.invoke('get-cache-settings'),
    set: (settings) => ipcRenderer.invoke('set-cache-settings', settings),
    browseDirectory: () => ipcRenderer.invoke('browse-cache-directory'),
    validatePath: (path) => ipcRenderer.invoke('validate-cache-path', path),
    migrate: (newLocation, newCustomPath, useExisting = false) => ipcRenderer.invoke('migrate-cache', newLocation, newCustomPath, useExisting)
  },

  // Logging
  exportLogFile: () => ipcRenderer.invoke('export-log-file'),

  // Store update events
  onStoreUpdateAvailable: (callback) => ipcRenderer.on('store-update-available', (event, info) => callback(info)),
  onShowWhatsNew: (callback) => ipcRenderer.on('show-whats-new', (event, info) => callback(info))
};

// Expose as both 'electronAPI' (for backward compatibility) and 'api' (for new code)
contextBridge.exposeInMainWorld('electronAPI', apiMethods);
contextBridge.exposeInMainWorld('api', apiMethods);

// Expose diceCoefficient as a standalone utility for renderer-side confidence scoring
contextBridge.exposeInMainWorld('stringSimilarity', {
  diceCoefficient,
  normalizeUnit,
  getSearchForm,
  getAlternateSearchForms,
  unitsMatch: denominationUnitsMatch
});

/**
 * Menu event listeners for renderer process
 * Allows main process to send menu action events to renderer
 */
contextBridge.exposeInMainWorld('menuEvents', {
  /**
   * Register a callback for menu actions from main process
   * @param {function} callback - Function to call with (action, data) parameters
   */
  onMenuAction: (callback) => {
    ipcRenderer.on('menu:load-collection', () => callback('load-collection'));
    ipcRenderer.on('menu:load-recent', (_, path) => callback('load-recent', path));
    ipcRenderer.on('menu:close-collection', () => callback('close-collection'));
    ipcRenderer.on('menu:select-all-fields', () => callback('select-all-fields'));
    ipcRenderer.on('menu:select-none', () => callback('select-none'));
    ipcRenderer.on('menu:select-empty', () => callback('select-empty'));
    ipcRenderer.on('menu:select-different', () => callback('select-different'));
    ipcRenderer.on('menu:filter-status', (_, val) => callback('filter-status', val));
    ipcRenderer.on('menu:filter-freshness', (_, val) => callback('filter-freshness', val));
    ipcRenderer.on('menu:sort-by', (_, val) => callback('sort-by', val));
    ipcRenderer.on('menu:reset-filters', () => callback('reset-filters'));
    ipcRenderer.on('menu:refresh-list', () => callback('refresh-list'));
    ipcRenderer.on('menu:open-app-settings', () => callback('open-app-settings'));
    ipcRenderer.on('menu:open-data-settings', () => callback('open-data-settings'));
    ipcRenderer.on('menu:open-field-mappings', () => callback('open-field-mappings'));
    ipcRenderer.on('menu:export-mappings', () => callback('export-mappings'));
    ipcRenderer.on('menu:import-mappings', () => callback('import-mappings'));
    ipcRenderer.on('menu:reset-mappings', () => callback('reset-mappings'));
    ipcRenderer.on('menu:reset-all', () => callback('reset-all'));
    ipcRenderer.on('menu:set-default', () => callback('set-default'));
    ipcRenderer.on('menu:clear-default', () => callback('clear-default'));
    ipcRenderer.on('menu:clear-recent', () => callback('clear-recent'));
    ipcRenderer.on('menu:about', () => callback('about'));
    ipcRenderer.on('menu:view-eula', () => callback('view-eula'));
    ipcRenderer.on('menu:purchase-license', () => callback('purchase-license'));
    ipcRenderer.on('menu:report-issue', () => callback('report-issue'));
    // Fast Pricing Mode menu actions
    ipcRenderer.on('menu:enter-fast-pricing-mode', () => callback('enter-fast-pricing-mode'));
    ipcRenderer.on('menu:exit-fast-pricing-mode', () => callback('exit-fast-pricing-mode'));
    ipcRenderer.on('menu:fp-select-all', () => callback('fp-select-all'));
    ipcRenderer.on('menu:fp-select-displayed', () => callback('fp-select-displayed'));
    ipcRenderer.on('menu:fp-clear', () => callback('fp-clear'));
    ipcRenderer.on('menu:fp-start-update', () => callback('fp-start-update'));
    ipcRenderer.on('menu:set-view-mode', (_, mode) => callback('set-view-mode', mode));
  }
});
