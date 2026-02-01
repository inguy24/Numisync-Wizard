const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Import our modules
const OpenNumismatDB = require('../modules/opennumismat-db');
const NumistaAPI = require('../modules/numista-api');
const FieldMapper = require('../modules/field-mapper');
const ProgressTracker = require('../modules/progress-tracker');
const SettingsManager = require('../modules/settings-manager');
const metadataManager = require('../modules/metadata-manager');

let mainWindow;
let db = null;
let progressTracker = null;
let settingsManager = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, '../../build/icon.png')
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Open DevTools in development mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (db) {
      db.close();
      db = null;
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// ============================================================================
// IPC HANDLERS - File Operations
// ============================================================================

ipcMain.handle('select-collection-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'OpenNumismat Collections', extensions: ['db'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (result.canceled) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle('load-collection', async (event, filePath) => {
  try {
    // Close existing database if open
    if (db) {
      db.close();
    }

    // Open the collection database (async now)
    db = await OpenNumismatDB.open(filePath);
    
    // Get collection summary FIRST
    const summary = db.getCollectionSummary();
    console.log('Collection summary:', summary);
    
    // Initialize settings manager for this collection
    settingsManager = new SettingsManager(filePath);
    console.log('Settings loaded:', settingsManager.getFetchSettings());
    
    // Initialize progress tracker for this collection
    progressTracker = new ProgressTracker(filePath);
    
    // Initialize with total count from collection
    progressTracker.initializeCollection(summary.totalCoins);
    
    // Rebuild progress from database metadata
    await progressTracker.rebuildFromDatabase(db, settingsManager.getFetchSettings());
    
    // Get progress stats
    const progress = progressTracker.getProgress();
    console.log('Progress stats:', progress.statistics);
    
    return {
      success: true,
      filePath,
      summary,
      progress,
      settings: settingsManager.getSettings()
    };
  } catch (error) {
    console.error('Error loading collection:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('get-coins', async (event, options = {}) => {
  try {
    if (!db) {
      throw new Error('No collection loaded');
    }

    const coins = db.getCoins(options);
    
    // Add status from progress tracker to each coin
    if (progressTracker) {
      coins.forEach(coin => {
        const statusInfo = progressTracker.getCoinStatus(coin.id);
        coin.status = statusInfo ? statusInfo.status : 'PENDING';
        coin.statusInfo = statusInfo;
      });
    } else {
      // No progress tracker, mark all as pending
      coins.forEach(coin => {
        coin.status = 'PENDING';
        coin.statusInfo = null;
      });
    }
    
    return { success: true, coins };
  } catch (error) {
    console.error('Error getting coins:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-coin-details', async (event, coinId) => {
  try {
    if (!db) {
      throw new Error('No collection loaded');
    }

    const coin = db.getCoinById(coinId);
    return { success: true, coin };
  } catch (error) {
    console.error('Error getting coin details:', error);
    return { success: false, error: error.message };
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Load API key from settings
 */
function getApiKey() {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      return settings.apiKey || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error loading API key:', error);
    return null;
  }
}

// ============================================================================
// IPC HANDLERS - Numista Search
// ============================================================================

ipcMain.handle('search-numista', async (event, searchParams) => {
  try {
    console.log('=== BACKEND SEARCH ===');
    console.log('Received search params:', searchParams);

    const apiKey = getApiKey();
    const api = new NumistaAPI(apiKey);
    const results = await api.searchTypes(searchParams);

    console.log('Search results count:', results.count);
    console.log('Number of types returned:', results.types?.length || 0);

    return { success: true, results };
  } catch (error) {
    console.error('Error searching Numista:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('manual-search-numista', async (event, { query, coinId }) => {
  try {
    console.log('Manual search requested:', query, 'for coin:', coinId);
    
    const apiKey = getApiKey();
    const api = new NumistaAPI(apiKey);
    
    // Use the query directly as provided by user
    const searchParams = { q: query };
    
    const results = await api.searchTypes(searchParams);
    
    console.log('Manual search found:', results.count, 'results');
    
    // Note: Search tracking removed - status updates happen on merge
    
    return { success: true, results };
  } catch (error) {
    console.error('Error in manual search:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-numista-type', async (event, typeId) => {
  try {
    const apiKey = getApiKey();
    const api = new NumistaAPI(apiKey);
    const typeData = await api.getType(typeId);
    
    return { success: true, typeData };
  } catch (error) {
    console.error('Error getting Numista type:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fetch-coin-data', async (event, { typeId, coin }) => {
  try {
    console.log('=== fetch-coin-data called ===');
    console.log('typeId:', typeId);
    console.log('coin year:', coin?.year, 'mintmark:', coin?.mintmark);
    
    const apiKey = getApiKey();
    const api = new NumistaAPI(apiKey);
    
    // Get fetch settings
    const fetchSettings = settingsManager ? settingsManager.getFetchSettings() : { basicData: true, issueData: false, pricingData: false };
    console.log('Fetch settings:', fetchSettings);
    
    // Get currency from settings (defaults to USD)
    const currency = settingsManager ? settingsManager.getCurrency() : 'USD';
    console.log('Currency:', currency);
    
    // Fetch all requested data
    const result = await api.fetchCoinData(typeId, coin, fetchSettings, currency);
    console.log('Fetch result - basicData:', !!result.basicData, 'issueData:', !!result.issueData, 'pricingData:', !!result.pricingData);
    console.log('Issue match result:', result.issueMatchResult?.type);
    
    return { success: true, ...result };
  } catch (error) {
    console.error('Error fetching coin data:', error);
    return { success: false, error: error.message };
  }
});

// ============================================================================
// IPC HANDLERS - Field Mapping & Merge
// ============================================================================

ipcMain.handle('compare-fields', async (event, { coin, numistaData, issueData, pricingData }) => {
  try {
    const mapper = new FieldMapper();
    const comparison = mapper.compareFields(coin, numistaData, issueData, pricingData);
    
    return { success: true, comparison };
  } catch (error) {
    console.error('Error comparing fields:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('merge-data', async (event, { coinId, selectedFields, numistaData, issueData, pricingData }) => {
  try {
    if (!db) {
      throw new Error('No collection loaded');
    }

    console.log('=== IPC merge-data received ===');
    console.log('coinId:', coinId);
    console.log('selectedFields type:', typeof selectedFields);
    console.log('selectedFields:', JSON.stringify(selectedFields, null, 2));
    console.log('selectedFields keys:', Object.keys(selectedFields));
    console.log('selectedFields values:', Object.values(selectedFields));
    console.log('issueData:', issueData ? 'provided' : 'null');
    console.log('pricingData:', pricingData ? 'provided' : 'null');
    
    // Count true values
    const trueCount = Object.values(selectedFields).filter(v => v === true).length;
    console.log('Number of TRUE values:', trueCount);
    
    console.log('numistaData.id:', numistaData?.id);
    console.log('numistaData.title:', numistaData?.title);

    // Create backup before merging
    const backupPath = db.createBackup();
    console.log('Backup created:', backupPath);
    
    // Perform the merge (pass issueData and pricingData)
    const mapper = new FieldMapper();
    const updatedData = mapper.mergeFields(selectedFields, numistaData, issueData, pricingData);
    console.log('Data to update:', updatedData);
    
    // Get current coin to preserve existing note
    const currentCoin = db.getCoinById(coinId);
    const currentNote = currentCoin?.note || '';
    
    // Build metadata for tracking
    const timestamp = new Date().toISOString();
    const fieldsMerged = Object.keys(selectedFields).filter(k => selectedFields[k] === true);
    
    // Read existing metadata (if any) and update it
    const { userNotes, metadata: existingMetadata } = metadataManager.readEnrichmentMetadata(currentNote);
    
    // Update metadata for all data types
    const newMetadata = {
      ...existingMetadata,
      basicData: {
        status: 'MERGED',
        timestamp: timestamp,
        numistaId: numistaData?.id,
        fieldsMerged: fieldsMerged.filter(f => !f.match(/^(mintage|mintmark|price[1-4])$/))
      },
      issueData: issueData ? {
        status: 'MERGED',
        timestamp: timestamp,
        issueId: issueData?.id,
        fieldsMerged: fieldsMerged.filter(f => f.match(/^(mintage|mintmark)$/))
      } : (existingMetadata?.issueData || { status: 'NOT_QUERIED' }),
      pricingData: pricingData ? {
        status: 'MERGED',
        timestamp: timestamp,
        issueId: issueData?.id,
        currency: settingsManager ? settingsManager.getCurrency() : 'USD',
        fieldsMerged: fieldsMerged.filter(f => f.match(/^price[1-4]$/))
      } : (existingMetadata?.pricingData || { status: 'NOT_QUERIED' })
    };
    
    // Write metadata to note field
    const updatedNote = metadataManager.writeEnrichmentMetadata(userNotes, newMetadata);
    updatedData.note = updatedNote;
    console.log('Metadata written to note field');
    
    // Update database (now includes note with metadata)
    const updateResult = db.updateCoin(coinId, updatedData);
    console.log('Update result:', updateResult);
    
    // Update progress cache immediately
    if (progressTracker && settingsManager) {
      const fetchSettings = settingsManager.getFetchSettings();
      progressTracker.updateCoinInCache(coinId, newMetadata, fetchSettings);
      console.log('Progress cache updated');
    }
    
    return { 
      success: true, 
      backupPath,
      updatedFields: Object.keys(updatedData).length,
      message: `Coin updated successfully (${Object.keys(updatedData).length} fields)`
    };
  } catch (error) {
    console.error('Error merging data:', error);
    return { success: false, error: error.message };
  }
});

// ============================================================================
// IPC HANDLERS - Progress Tracking
// ============================================================================

ipcMain.handle('update-coin-status', async (event, { coinId, status, metadata }) => {
  try {
    if (!progressTracker) {
      throw new Error('Progress tracker not initialized');
    }

    // Convert simple status to Phase 2 metadata format
    const timestamp = new Date().toISOString();
    const phase2Metadata = {
      basicData: { status: 'NOT_QUERIED' },
      issueData: { status: 'NOT_QUERIED' },
      pricingData: { status: 'NOT_QUERIED' }
    };
    
    // Map simple statuses to Phase 2 structure
    if (status === 'skipped' || status === 'SKIPPED') {
      phase2Metadata.basicData = { status: 'SKIPPED', timestamp };
      phase2Metadata.issueData = { status: 'SKIPPED', timestamp };
      phase2Metadata.pricingData = { status: 'SKIPPED', timestamp };
    } else if (status === 'no_matches' || status === 'NO_MATCHES') {
      phase2Metadata.basicData = { status: 'NO_MATCH', timestamp };
    } else if (status === 'matched' || status === 'MATCHED') {
      // Just tracking that a match was found - not merged yet
      phase2Metadata.basicData = { status: 'PENDING', timestamp, numistaId: metadata?.numistaId };
    } else if (status === 'error' || status === 'ERROR') {
      phase2Metadata.basicData = { status: 'ERROR', timestamp, error: metadata?.error };
    }
    
    // Get current fetch settings
    const fetchSettings = settingsManager ? settingsManager.getFetchSettings() : { basicData: true, issueData: false, pricingData: false };
    
    progressTracker.updateCoinInCache(coinId, phase2Metadata, fetchSettings);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating coin status:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-progress-stats', async () => {
  try {
    if (!progressTracker) {
      throw new Error('Progress tracker not initialized');
    }

    const stats = progressTracker.getStatistics();
    
    return { success: true, stats };
  } catch (error) {
    console.error('Error getting progress stats:', error);
    return { success: false, error: error.message };
  }
});

// ============================================================================
// IPC HANDLERS - Legacy App Settings (Phase 1)
// ============================================================================

ipcMain.handle('get-app-settings', async () => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      return { success: true, settings };
    } else {
      // Return default settings WITHOUT the field mapping (it has functions)
      return { 
        success: true, 
        settings: {
          apiKey: '',
          searchDelay: 2000,
          imageHandling: 'url',
          autoBackup: true
        }
      };
    }
  } catch (error) {
    console.error('Error getting app settings:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-app-settings', async (event, settings) => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    
    return { success: true };
  } catch (error) {
    console.error('Error saving app settings:', error);
    return { success: false, error: error.message };
  }
});

// ============================================================================
// IPC HANDLERS - Phase 2 Settings and Statistics
// ============================================================================

ipcMain.handle('get-settings', async () => {
  try {
    if (!settingsManager) {
      throw new Error('No collection loaded');
    }
    return settingsManager.getSettings();
  } catch (error) {
    console.error('Error getting settings:', error);
    throw error;
  }
});

ipcMain.handle('save-fetch-settings', async (event, fetchSettings) => {
  try {
    if (!settingsManager) {
      throw new Error('No collection loaded');
    }
    
    settingsManager.setFetchSettings(fetchSettings);
    
    // Rebuild progress with new settings
    if (progressTracker && db) {
      await progressTracker.rebuildFromDatabase(db, fetchSettings);
    }
    
    return true;
  } catch (error) {
    console.error('Error saving fetch settings:', error);
    throw error;
  }
});

ipcMain.handle('save-currency', async (event, currency) => {
  try {
    if (!settingsManager) {
      throw new Error('No collection loaded');
    }
    
    settingsManager.setCurrency(currency);
    console.log('Currency saved:', currency);
    
    return true;
  } catch (error) {
    console.error('Error saving currency:', error);
    throw error;
  }
});

ipcMain.handle('get-currency', async () => {
  try {
    if (!settingsManager) {
      return 'USD';
    }
    
    return settingsManager.getCurrency();
  } catch (error) {
    console.error('Error getting currency:', error);
    return 'USD';
  }
});

ipcMain.handle('get-statistics', async () => {
  try {
    if (!progressTracker) {
      throw new Error('No collection loaded');
    }
    return progressTracker.getStatistics();
  } catch (error) {
    console.error('Error getting statistics:', error);
    throw error;
  }
});

ipcMain.handle('increment-api-calls', async (event, count = 1) => {
  try {
    if (!progressTracker) {
      throw new Error('No collection loaded');
    }
    progressTracker.incrementSessionCalls(count);
    return progressTracker.getSessionCallCount();
  } catch (error) {
    console.error('Error incrementing API calls:', error);
    throw error;
  }
});

console.log('Numismat Enrichment Tool - Main process started');
