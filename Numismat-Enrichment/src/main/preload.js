const { contextBridge, ipcRenderer } = require('electron');

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
  
  // Phase 2 - Statistics and API tracking
  getStatistics: () => ipcRenderer.invoke('get-statistics'),
  incrementApiCalls: (count) => ipcRenderer.invoke('increment-api-calls', count)
};

// Expose as both 'electronAPI' (for backward compatibility) and 'api' (for new code)
contextBridge.exposeInMainWorld('electronAPI', apiMethods);
contextBridge.exposeInMainWorld('api', apiMethods);
