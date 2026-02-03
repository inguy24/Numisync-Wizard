const { contextBridge, ipcRenderer } = require('electron');

/**
 * Dice's coefficient string similarity (0.0 to 1.0).
 * Defined directly in preload to avoid importing heavy modules (axios, etc.)
 * into the renderer preload context.
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

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
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

  // Utility
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
};

// Expose as both 'electronAPI' (for backward compatibility) and 'api' (for new code)
contextBridge.exposeInMainWorld('electronAPI', apiMethods);
contextBridge.exposeInMainWorld('api', apiMethods);

// Expose diceCoefficient as a standalone utility for renderer-side confidence scoring
contextBridge.exposeInMainWorld('stringSimilarity', { diceCoefficient });
