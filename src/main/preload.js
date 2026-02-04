const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload Script
 *
 * Exposes IPC methods to the renderer process via contextBridge.
 * This is the secure bridge between the main process and renderer.
 */

/**
 * Calculate Dice's coefficient string similarity
 * Defined directly in preload to avoid importing heavy modules (axios, etc.)
 * into the renderer preload context.
 * @param {string} a - First string to compare
 * @param {string} b - Second string to compare
 * @returns {number} Similarity score from 0.0 to 1.0
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
  updateMenuState: (state) => ipcRenderer.invoke('menu:update-state', state)
};

// Expose as both 'electronAPI' (for backward compatibility) and 'api' (for new code)
contextBridge.exposeInMainWorld('electronAPI', apiMethods);
contextBridge.exposeInMainWorld('api', apiMethods);

// Expose diceCoefficient as a standalone utility for renderer-side confidence scoring
contextBridge.exposeInMainWorld('stringSimilarity', { diceCoefficient });

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
  }
});
