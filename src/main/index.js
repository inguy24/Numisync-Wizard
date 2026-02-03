/**
 * Main Process Entry Point
 *
 * Electron main process that handles:
 * - Window creation and management
 * - IPC communication with renderer
 * - Database operations via OpenNumismatDB
 * - Numista API calls via NumistaAPI
 * - Settings management via SettingsManager
 * - Progress tracking via ProgressTracker
 */
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Import our modules
const OpenNumismatDB = require('../modules/opennumismat-db');
const NumistaAPI = require('../modules/numista-api');
const FieldMapper = require('../modules/field-mapper');
const { getSerializableSources, DEFAULT_FIELD_MAPPING } = require('../modules/default-field-mapping');
const ProgressTracker = require('../modules/progress-tracker');
const SettingsManager = require('../modules/settings-manager');
const metadataManager = require('../modules/metadata-manager');
const ImageHandler = require('../modules/image-handler');

/** @type {BrowserWindow|null} */
let mainWindow;
/** @type {OpenNumismatDB|null} */
let db = null;
/** @type {ProgressTracker|null} */
let progressTracker = null;
/** @type {SettingsManager|null} */
let settingsManager = null;
const imageHandler = new ImageHandler();

/**
 * Create the main application window
 * @returns {void}
 */
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
// Database Safety - Lock Detection
// ============================================================================

/**
 * Check if a database file is currently in use by another application.
 * Uses multiple detection methods:
 * 1. WAL/SHM file presence (SQLite Write-Ahead Log files)
 * 2. SQLite journal file presence
 * 3. Exclusive file access test (Windows file locking via PowerShell)
 * @param {string} filePath - Path to the database file
 * @returns {{inUse: boolean, reason: string|null}} Lock status and reason
 */
function checkDatabaseInUse(filePath) {
  // Check 1: SQLite WAL/SHM files (created by native SQLite apps in WAL mode)
  const walPath = filePath + '-wal';
  const shmPath = filePath + '-shm';
  if (fs.existsSync(walPath) || fs.existsSync(shmPath)) {
    return {
      inUse: true,
      reason: 'SQLite WAL/SHM lock files detected — the database appears to be open in OpenNumismat or another SQLite application.'
    };
  }

  // Check 2: SQLite journal file (created by native SQLite in rollback journal mode)
  const journalPath = filePath + '-journal';
  if (fs.existsSync(journalPath)) {
    return {
      inUse: true,
      reason: 'SQLite journal file detected — the database appears to be open in another application.'
    };
  }

  // Check 3: Windows exclusive file lock test via PowerShell
  // Node.js fs.openSync uses shared access on Windows, so it won't detect SQLite's locks.
  // PowerShell's [System.IO.File]::Open with FileShare.None requests exclusive access,
  // which fails if ANY other process has the file open.
  if (process.platform === 'win32') {
    try {
      const escapedPath = filePath.replace(/'/g, "''");
      const psCommand = `powershell -NoProfile -NonInteractive -Command "try { $f = [System.IO.File]::Open('${escapedPath}', 'Open', 'ReadWrite', 'None'); $f.Close(); Write-Output 'unlocked' } catch { Write-Output 'locked' }"`;
      const result = execSync(psCommand, { encoding: 'utf8', timeout: 5000 }).trim();
      if (result === 'locked') {
        return {
          inUse: true,
          reason: 'The database file is locked by another process (exclusive access denied).'
        };
      }
    } catch (error) {
      console.warn('PowerShell lock check failed (non-fatal):', error.message);
      // Fall through — if PowerShell fails, don't block the user
    }
  }

  return { inUse: false, reason: null };
}

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
    // Database safety check — detect if file is in use by another application
    let lockCheck = checkDatabaseInUse(filePath);
    while (lockCheck.inUse) {
      const response = await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: 'Database In Use',
        message: 'The collection file appears to be open in OpenNumismat or another application.',
        detail: 'Opening the database while it is in use can cause corruption.\n\nPlease close OpenNumismat and click "Check Again".\n\nDetails: ' + lockCheck.reason,
        buttons: ['Check Again', 'Cancel'],
        defaultId: 0,
        cancelId: 1,
        noLink: true
      });

      if (response.response === 1) {
        // User cancelled
        return { success: false, error: 'cancelled' };
      }

      // User clicked "Check Again" — re-run the check
      lockCheck = checkDatabaseInUse(filePath);
    }

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

    // Auto-migrate API key from Phase 1 app settings if collection has none
    if (!settingsManager.getApiKey()) {
      try {
        const phase1Path = path.join(app.getPath('userData'), 'settings.json');
        if (fs.existsSync(phase1Path)) {
          const phase1Settings = JSON.parse(fs.readFileSync(phase1Path, 'utf8'));
          if (phase1Settings.apiKey) {
            settingsManager.setApiKey(phase1Settings.apiKey);
            console.log('API key migrated from Phase 1 app settings to collection settings');
          }
        }
      } catch (migrationError) {
        console.error('API key migration failed (non-fatal):', migrationError.message);
      }
    }
    
    // Initialize progress tracker for this collection
    progressTracker = new ProgressTracker(filePath);

    // Initialize with total count from collection
    progressTracker.initializeCollection(summary.totalCoins);

    // Rebuild progress from database metadata
    await progressTracker.rebuildFromDatabase(db, settingsManager.getFetchSettings());

    // Reset session call counter to 0 (counter tracks API calls per session)
    progressTracker.resetSessionCallCount();

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
 * Load API key - checks collection settings first, falls back to Phase 1 app settings
 * @returns {string|null} API key or null if not configured
 */
function getApiKey() {
  // Phase 2: Check collection-specific settings first
  if (settingsManager) {
    const key = settingsManager.getApiKey();
    if (key) return key;
  }

  // Phase 1 fallback: Read from app-wide settings
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
// IPC HANDLERS - Issuer Resolution (persistent instance for caching)
// ============================================================================

// Persistent API instance for issuer resolution — caches /issuers list and
// resolved country->code mappings across multiple calls
let issuerApi = null;

ipcMain.handle('resolve-issuer', async (event, countryName) => {
  try {
    const apiKey = getApiKey();
    if (!issuerApi) {
      issuerApi = new NumistaAPI(apiKey);
    } else {
      issuerApi.setApiKey(apiKey);
    }
    const code = await issuerApi.resolveIssuerCode(countryName);
    return { success: true, code };
  } catch (error) {
    console.warn('Issuer resolution failed:', error.message);
    return { success: true, code: null };
  }
});

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

    // Increment session counter - 1 API call for search
    if (progressTracker) {
      progressTracker.incrementSessionCalls(1);
    }

    return { success: true, results };
  } catch (error) {
    console.error('Error searching Numista:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('manual-search-numista', async (event, { query, coinId, category }) => {
  try {
    console.log('Manual search requested:', query, 'for coin:', coinId, 'category:', category);

    const apiKey = getApiKey();
    const api = new NumistaAPI(apiKey);

    // Use the query directly as provided by user
    const searchParams = { q: query };
    if (category) {
      searchParams.category = category;
    }

    const results = await api.searchTypes(searchParams);

    console.log('Manual search found:', results.count, 'results');

    // Note: Search tracking removed - status updates happen on merge

    // Increment session counter - 1 API call for search
    if (progressTracker) {
      progressTracker.incrementSessionCalls(1);
    }

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

    // Increment session counter based on actual API calls made
    if (progressTracker) {
      let callCount = 0;

      // Count API calls based on what was fetched:
      // - getType() was called if basicData exists
      if (result.basicData) {
        callCount += 1;
      }

      // - getTypeIssues() was called if issueData OR pricingData was requested
      if (fetchSettings.issueData || fetchSettings.pricingData) {
        callCount += 1;
      }

      // - getIssuePricing() was called if pricingData exists
      if (result.pricingData) {
        callCount += 1;
      }

      if (callCount > 0) {
        progressTracker.incrementSessionCalls(callCount);
        console.log(`Session counter incremented by ${callCount} (total now: ${progressTracker.getSessionCallCount()})`);
      }
    }

    return { success: true, ...result };
  } catch (error) {
    console.error('Error fetching coin data:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fetch-pricing-for-issue', async (event, { typeId, issueId }) => {
  try {
    console.log('=== fetch-pricing-for-issue called ===');
    console.log('typeId:', typeId, 'issueId:', issueId);

    const apiKey = getApiKey();
    const api = new NumistaAPI(apiKey);

    // Get currency from settings (defaults to USD)
    const currency = settingsManager ? settingsManager.getCurrency() : 'USD';
    console.log('Currency:', currency);

    // Fetch pricing for this specific issue
    const pricingData = await api.getIssuePricing(typeId, issueId, currency);
    console.log('Pricing fetched:', !!pricingData);

    // Increment session counter - 1 API call for pricing
    if (progressTracker) {
      progressTracker.incrementSessionCalls(1);
      console.log(`Session counter incremented by 1 (total now: ${progressTracker.getSessionCallCount()})`);
    }

    return { success: true, pricingData };
  } catch (error) {
    console.error('Error fetching pricing for issue:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fetch-issue-data', async (event, { typeId, coin }) => {
  try {
    console.log('=== fetch-issue-data called ===');
    console.log('typeId:', typeId);

    const apiKey = getApiKey();
    const api = new NumistaAPI(apiKey);

    // Fetch issues for this type (1 API call)
    const issuesResponse = await api.getTypeIssues(typeId);

    // Increment session counter - 1 API call for issues
    if (progressTracker) {
      progressTracker.incrementSessionCalls(1);
      console.log(`Session counter incremented by 1 (total now: ${progressTracker.getSessionCallCount()})`);
    }

    // Try to auto-match (local logic, no API call)
    const matchResult = api.matchIssue(coin, issuesResponse);
    console.log('Issue match result type:', matchResult.type);

    if (matchResult.type === 'AUTO_MATCHED') {
      return {
        success: true,
        issueData: matchResult.issue,
        issueMatchResult: matchResult
      };
    } else if (matchResult.type === 'USER_PICK') {
      return {
        success: true,
        issueData: null,
        issueMatchResult: matchResult,
        issueOptions: matchResult.options
      };
    } else {
      // NO_MATCH or NO_ISSUES
      return {
        success: true,
        issueData: null,
        issueMatchResult: matchResult
      };
    }
  } catch (error) {
    console.error('Error fetching issue data:', error);
    return { success: false, error: error.message };
  }
});

// ============================================================================
// IPC HANDLERS - Field Mapping & Merge
// ============================================================================

ipcMain.handle('compare-fields', async (event, { coin, numistaData, issueData, pricingData }) => {
  try {
    const customMapping = settingsManager ? settingsManager.buildFieldMapperConfig() : null;
    const mapper = new FieldMapper(customMapping);
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

    // Create backup before merging (if enabled in settings)
    let backupPath = null;
    const autoBackup = settingsManager ? settingsManager.getAutoBackup() : true;
    if (autoBackup) {
      backupPath = db.createBackup();
      console.log('Backup created:', backupPath);

      // Prune old backups beyond the configured limit
      const maxBackups = settingsManager ? settingsManager.getMaxBackups() : 5;
      const pruned = db.pruneOldBackups(maxBackups);
      if (pruned.length > 0) {
        console.log(`Pruned ${pruned.length} old backup(s)`);
      }
    } else {
      console.log('Auto-backup disabled, skipping backup creation');
    }
    
    // Perform the merge (pass issueData and pricingData)
    const customMapping = settingsManager ? settingsManager.buildFieldMapperConfig() : null;
    const mapper = new FieldMapper(customMapping);
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

    if (!db) {
      throw new Error('Database not initialized');
    }

    // Convert simple status to Phase 2 metadata format
    const timestamp = new Date().toISOString();
    let phase2Metadata = {
      basicData: { status: 'NOT_QUERIED' },
      issueData: { status: 'NOT_QUERIED' },
      pricingData: { status: 'NOT_QUERIED' }
    };

    // Map simple statuses to Phase 2 structure
    if (status === 'skipped' || status === 'SKIPPED') {
      phase2Metadata.basicData = { status: 'SKIPPED', timestamp };
      phase2Metadata.issueData = { status: 'SKIPPED', timestamp };
      phase2Metadata.pricingData = { status: 'SKIPPED', timestamp };

      // Write metadata to database for skipped status
      const coin = db.getCoinById(coinId);
      if (coin) {
        const { userNotes } = metadataManager.readEnrichmentMetadata(coin.note || '');
        const updatedNote = metadataManager.writeEnrichmentMetadata(userNotes, phase2Metadata);
        db.updateCoin(coinId, { note: updatedNote });
        console.log(`Skipped metadata written to database for coin ${coinId}`);

        // Read back the complete metadata from the note we just wrote
        const { metadata: completeMetadata } = metadataManager.readEnrichmentMetadata(updatedNote);
        phase2Metadata = completeMetadata;
      }
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

    // Update progress tracker's current fetch settings
    progressTracker.currentFetchSettings = fetchSettings;

    // Update progress cache
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
          autoBackup: true,
          maxBackups: 5
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

    // Sync API key to collection-specific settings if a collection is loaded
    if (settingsManager && settings.apiKey) {
      settingsManager.setApiKey(settings.apiKey);
      console.log('API key synced to collection settings');
    }

    // Sync rate limit to collection settings if a collection is loaded
    if (settingsManager && settings.searchDelay) {
      settingsManager.setRateLimit(settings.searchDelay);
      console.log('Rate limit synced to collection settings');
    }

    // Sync backup settings to collection settings
    if (settingsManager) {
      if (settings.autoBackup !== undefined) {
        settingsManager.setAutoBackup(settings.autoBackup);
      }
      if (settings.maxBackups !== undefined) {
        settingsManager.setMaxBackups(settings.maxBackups);
      }
      console.log('Backup settings synced to collection settings');
    }

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

ipcMain.handle('reset-settings', async () => {
  try {
    if (!settingsManager) {
      throw new Error('No collection loaded');
    }

    settingsManager.resetToDefaults();
    console.log('Settings reset to defaults');

    // Rebuild progress with reset settings
    if (progressTracker && db) {
      const fetchSettings = settingsManager.getFetchSettings();
      await progressTracker.rebuildFromDatabase(db, fetchSettings);
    }

    return { success: true, settings: settingsManager.getSettings() };
  } catch (error) {
    console.error('Error resetting settings:', error);
    return { success: false, error: error.message };
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

// ============================================================================
// IPC HANDLERS - Image Operations
// ============================================================================

ipcMain.handle('get-coin-images', async (event, coinId) => {
  try {
    if (!db) {
      throw new Error('No collection loaded');
    }

    const images = db.getCoinImages(coinId);

    if (!images) {
      return {
        success: false,
        error: 'Coin not found'
      };
    }

    // Convert BLOBs to data URIs for display
    const result = {
      success: true,
      images: {
        obverse: null,
        reverse: null,
        edge: null
      }
    };

    if (images.obverse) {
      const mimeType = imageHandler.getMimeType(images.obverse);
      result.images.obverse = imageHandler.blobToDataUri(images.obverse, mimeType);
    }

    if (images.reverse) {
      const mimeType = imageHandler.getMimeType(images.reverse);
      result.images.reverse = imageHandler.blobToDataUri(images.reverse, mimeType);
    }

    if (images.edge) {
      const mimeType = imageHandler.getMimeType(images.edge);
      result.images.edge = imageHandler.blobToDataUri(images.edge, mimeType);
    }

    return result;
  } catch (error) {
    console.error('Error getting coin images:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('download-and-store-images', async (event, { coinId, imageUrls }) => {
  try {
    if (!db) {
      throw new Error('No collection loaded');
    }

    console.log(`Downloading images for coin ${coinId}:`, imageUrls);

    const imageBuffers = {};

    // Download each image
    if (imageUrls.obverse) {
      try {
        console.log(`Downloading obverse: ${imageUrls.obverse}`);
        imageBuffers.obverse = await imageHandler.downloadImage(imageUrls.obverse);
      } catch (error) {
        console.error('Failed to download obverse image:', error.message);
      }
    }

    if (imageUrls.reverse) {
      try {
        console.log(`Downloading reverse: ${imageUrls.reverse}`);
        imageBuffers.reverse = await imageHandler.downloadImage(imageUrls.reverse);
      } catch (error) {
        console.error('Failed to download reverse image:', error.message);
      }
    }

    if (imageUrls.edge) {
      try {
        console.log(`Downloading edge: ${imageUrls.edge}`);
        imageBuffers.edge = await imageHandler.downloadImage(imageUrls.edge);
      } catch (error) {
        console.error('Failed to download edge image:', error.message);
      }
    }

    // Store images in database
    const imageIds = await db.storeImagesForCoin(coinId, imageBuffers);

    console.log(`Images stored for coin ${coinId}:`, imageIds);

    return {
      success: true,
      imageIds
    };
  } catch (error) {
    console.error('Error downloading and storing images:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Open external URLs in default browser
ipcMain.handle('open-external', async (event, url) => {
  try {
    // Only allow http/https URLs for safety
    if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
      await shell.openExternal(url);
      return { success: true };
    }
    return { success: false, error: 'Invalid URL protocol' };
  } catch (error) {
    console.error('Error opening external URL:', error);
    return { success: false, error: error.message };
  }
});

// ============================================================================
// Field Mapping IPC Handlers
// ============================================================================

ipcMain.handle('get-field-mappings', async () => {
  try {
    if (!settingsManager) {
      return { success: false, error: 'No collection loaded' };
    }
    const fieldMappings = settingsManager.getFieldMappings();
    const sources = getSerializableSources();
    return { success: true, fieldMappings, sources };
  } catch (error) {
    console.error('Error getting field mappings:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-field-mappings', async (event, fieldMappings) => {
  try {
    if (!settingsManager) {
      return { success: false, error: 'No collection loaded' };
    }
    // Validate: only allow known field names and known source keys
    const validFields = Object.keys(DEFAULT_FIELD_MAPPING);
    const validSources = Object.keys(getSerializableSources());
    const validated = {};

    for (const [fieldName, config] of Object.entries(fieldMappings)) {
      if (!validFields.includes(fieldName)) continue;
      validated[fieldName] = {
        enabled: config.enabled === true || config.enabled === false ? config.enabled : true,
        sourceKey: validSources.includes(config.sourceKey) ? config.sourceKey : (DEFAULT_FIELD_MAPPING[fieldName].defaultSourceKey || null),
        catalogCode: config.catalogCode || null,
        description: config.description || DEFAULT_FIELD_MAPPING[fieldName].description || fieldName
      };
    }

    settingsManager.setFieldMappings(validated);
    return { success: true };
  } catch (error) {
    console.error('Error saving field mappings:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-available-sources', async () => {
  try {
    return { success: true, sources: getSerializableSources() };
  } catch (error) {
    console.error('Error getting available sources:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-field-mappings', async () => {
  try {
    if (!settingsManager) {
      return { success: false, error: 'No collection loaded' };
    }
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Field Mappings',
      defaultPath: 'field-mappings.json',
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });
    if (result.canceled) {
      return { success: false, error: 'Canceled' };
    }
    const mappings = settingsManager.getFieldMappings();
    fs.writeFileSync(result.filePath, JSON.stringify(mappings, null, 2), 'utf8');
    return { success: true, filePath: result.filePath };
  } catch (error) {
    console.error('Error exporting field mappings:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('import-field-mappings', async () => {
  try {
    if (!settingsManager) {
      return { success: false, error: 'No collection loaded' };
    }
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Field Mappings',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    });
    if (result.canceled || !result.filePaths.length) {
      return { success: false, error: 'Canceled' };
    }
    const data = fs.readFileSync(result.filePaths[0], 'utf8');
    const imported = JSON.parse(data);

    // Validate structure
    const validFields = Object.keys(DEFAULT_FIELD_MAPPING);
    const validSources = Object.keys(getSerializableSources());
    const validated = {};

    for (const [fieldName, config] of Object.entries(imported)) {
      if (!validFields.includes(fieldName)) continue;
      if (typeof config !== 'object' || config === null) continue;
      validated[fieldName] = {
        enabled: typeof config.enabled === 'boolean' ? config.enabled : true,
        sourceKey: validSources.includes(config.sourceKey) ? config.sourceKey : (DEFAULT_FIELD_MAPPING[fieldName].defaultSourceKey || null),
        catalogCode: typeof config.catalogCode === 'string' ? config.catalogCode : null,
        description: typeof config.description === 'string' ? config.description : (DEFAULT_FIELD_MAPPING[fieldName].description || fieldName)
      };
    }

    settingsManager.setFieldMappings(validated);
    return { success: true, fieldMappings: validated };
  } catch (error) {
    console.error('Error importing field mappings:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('reset-field-mappings', async () => {
  try {
    if (!settingsManager) {
      return { success: false, error: 'No collection loaded' };
    }
    const defaults = settingsManager.buildDefaultFieldMappings();
    settingsManager.setFieldMappings(defaults);
    return { success: true, fieldMappings: defaults };
  } catch (error) {
    console.error('Error resetting field mappings:', error);
    return { success: false, error: error.message };
  }
});

console.log('Numismat Enrichment Tool - Main process started');
