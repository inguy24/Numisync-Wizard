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
const { app, BrowserWindow, ipcMain, dialog, shell, Menu, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
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
const { initAutoUpdater, checkForUpdatesManually } = require('./updater');
const { DENOMINATION_ALIASES, DENOMINATION_PLURALS, ALL_CANONICALS, ISSUER_DENOMINATION_OVERRIDES, SUBUNIT_MAP } = require('../modules/denomination-normalizer');
const ApiCache = require('../modules/api-cache');
const { CacheLock } = require('../modules/cache-lock');
const log = require('./logger');

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
 * Cache for Numista type data - enables silent reuse of type data across coins
 * Key: typeId (number), Value: { data: numistaTypeResponse, cachedAt: timestamp }
 * Cleared when loading a new collection to ensure fresh data
 * @type {Map<number, {data: Object, cachedAt: number}>}
 */
const typeDataCache = new Map();

/**
 * Persistent API cache — lazy-initialized because app.getPath() requires app.whenReady()
 * @type {ApiCache|null}
 */
let apiCache = null;

/**
 * Get or create the persistent API cache singleton with configurable location
 * @returns {ApiCache} The persistent API cache instance
 */
function getApiCache() {
  if (!apiCache) {
    const appSettings = loadAppSettings();

    let cachePath;
    if (appSettings.cache?.location === 'custom' && appSettings.cache?.customPath) {
      cachePath = path.join(appSettings.cache.customPath, '.NumiSync', 'api-cache.json');
      log.info('Using custom cache location:', cachePath);
    } else {
      cachePath = path.join(app.getPath('userData'), 'api-cache.json');
    }

    try {
      apiCache = new ApiCache(cachePath, {
        lockTimeout: appSettings.cache?.lockTimeout || 30000
      });
    } catch (error) {
      log.error('Failed to initialize cache at custom location:', error.message);
      log.info('Falling back to default cache location');

      // Fallback to default
      cachePath = path.join(app.getPath('userData'), 'api-cache.json');
      apiCache = new ApiCache(cachePath);

      // Update settings to reflect fallback
      appSettings.cache.location = 'default';
      appSettings.cache.customPath = null;
      saveAppSettings(appSettings);
    }
  }
  return apiCache;
}

/**
 * Load app-wide settings from disk
 * IMPORTANT: Now reads from settings.json (consolidation - app-settings.json removed)
 * @returns {Object} App settings with defaults for cache-related fields
 */
function loadAppSettings() {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

      // Ensure cache structure exists with defaults
      if (!settings.cache) {
        settings.cache = {
          location: 'default',
          customPath: null,
          lockTimeout: 30000
        };
      }

      // Ensure cacheTtl structure exists (merge old flat fields if present)
      if (!settings.cacheTtl) {
        settings.cacheTtl = {
          issuers: settings.cacheTtlIssuers || 90,
          types: settings.cacheTtlTypes || 30,
          issues: settings.cacheTtlIssues || 30
        };
      }

      return settings;
    }
  } catch (error) {
    log.warn('Failed to load app settings:', error.message);
  }

  // Return defaults for new installation
  return {
    version: '3.0',
    cache: {
      location: 'default',
      customPath: null,
      lockTimeout: 30000
    },
    cacheTtl: {
      issuers: 90,
      types: 30,
      issues: 30
    },
    windowBounds: null,
    recentCollections: [],
    logLevel: 'info',
    supporter: {},
    eulaAccepted: false,
    eulaVersion: null,
    eulaAcceptedAt: null
  };
}

/**
 * Save app-wide settings to disk
 * IMPORTANT: Now writes to settings.json (consolidation - app-settings.json removed)
 * Merges with existing settings to preserve fields not in the update
 * @param {Object} settings - Settings object to save (partial updates supported)
 */
function saveAppSettings(settings) {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');

    // Load existing settings to merge with
    let existingSettings = {};
    if (fs.existsSync(settingsPath)) {
      existingSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }

    // Merge: new settings override existing
    const mergedSettings = { ...existingSettings, ...settings };

    // If cacheTtl is being updated, also update flat fields for backwards compatibility
    if (settings.cacheTtl) {
      mergedSettings.cacheTtlIssuers = settings.cacheTtl.issuers;
      mergedSettings.cacheTtlTypes = settings.cacheTtl.types;
      mergedSettings.cacheTtlIssues = settings.cacheTtl.issues;
    }

    fs.writeFileSync(settingsPath, JSON.stringify(mergedSettings, null, 2));
  } catch (error) {
    log.error('Failed to save app settings:', error.message);
  }
}

/**
 * Migrate app settings - consolidate app-settings.json back into settings.json
 * Called once on startup to handle backwards compatibility
 * SETTINGS CONSOLIDATION (Feb 2026): app-settings.json created redundancy
 */
function migrateAppSettings() {
  const userDataPath = app.getPath('userData');
  const settingsPath = path.join(userDataPath, 'settings.json');
  const appSettingsPath = path.join(userDataPath, 'app-settings.json');

  // Migrate app-settings.json → settings.json (consolidation)
  if (fs.existsSync(appSettingsPath)) {
    try {
      const appSettingsData = JSON.parse(fs.readFileSync(appSettingsPath, 'utf8'));
      let settingsData = {};

      if (fs.existsSync(settingsPath)) {
        settingsData = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      }

      // Merge app-settings.json into settings.json
      // Priority: settings.json wins for shared fields (it's more up-to-date)
      const merged = {
        ...settingsData,
        // Add cache config from app-settings.json if not in settings.json
        cache: settingsData.cache || appSettingsData.cache,
        // Merge cacheTtl structure (prefer settings.json flat fields if present)
        cacheTtl: {
          issuers: settingsData.cacheTtlIssuers || appSettingsData.cacheTtl?.issuers || 90,
          types: settingsData.cacheTtlTypes || appSettingsData.cacheTtl?.types || 30,
          issues: settingsData.cacheTtlIssues || appSettingsData.cacheTtl?.issues || 30
        },
        // Keep flat fields for backwards compatibility
        cacheTtlIssuers: settingsData.cacheTtlIssuers || appSettingsData.cacheTtl?.issuers || 90,
        cacheTtlTypes: settingsData.cacheTtlTypes || appSettingsData.cacheTtl?.types || 30,
        cacheTtlIssues: settingsData.cacheTtlIssues || appSettingsData.cacheTtl?.issues || 30,
        // Version tracking
        version: '3.0'
      };

      fs.writeFileSync(settingsPath, JSON.stringify(merged, null, 2));
      log.info('Consolidated app-settings.json into settings.json');

      // Rename app-settings.json to .bak for safety
      fs.renameSync(appSettingsPath, appSettingsPath + '.bak');
      log.info('Archived app-settings.json as app-settings.json.bak');
    } catch (error) {
      log.error('Failed to migrate app settings:', error.message);
    }
  }

  // Normalize customPath: strip trailing .NumiSync if present.
  // getApiCache() now appends .NumiSync transparently, so customPath should be the parent directory.
  if (fs.existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      if (settings.cache?.location === 'custom' && settings.cache?.customPath &&
          path.basename(settings.cache.customPath) === '.NumiSync') {
        const normalized = path.dirname(settings.cache.customPath);
        settings.cache.customPath = normalized;
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
        log.info('Normalized cache customPath: stripped .NumiSync suffix, now:', normalized);
      }
    } catch (error) {
      log.warn('Failed to normalize cache customPath:', error.message);
    }
  }

  // Rename cache file (legacy migration - should already be done)
  const oldCachePath = path.join(userDataPath, 'numista_api_cache.json');
  const newCachePath = path.join(userDataPath, 'api-cache.json');

  if (fs.existsSync(oldCachePath) && !fs.existsSync(newCachePath)) {
    try {
      fs.renameSync(oldCachePath, newCachePath);
      log.info('Renamed cache file to new name');
    } catch (error) {
      log.warn('Failed to rename cache file:', error.message);
    }
  }
}

/**
 * Read cache TTL settings from app settings and return as days object for NumistaAPI constructor
 * @returns {Object} TTLs in days: { issuers, types, issues }
 */
function getCacheTTLs() {
  const settings = loadAppSettings();
  return settings.cacheTtl || { issuers: 90, types: 30, issues: 30 };
}

// Menu state - tracks whether items should be enabled/disabled
let menuState = {
  collectionLoaded: false,
  fieldComparisonActive: false,
  recentCollections: [],
  isSupporter: false,
  fastPricingMode: false,
  fastPricingSelectedCount: 0,
  fastPricingEligibleCount: 0,
  viewMode: 'list' // 'list' or 'grid'
};

// #region App Lifecycle & Window Management
// ============================================================================
// Window State Persistence
// ============================================================================

/** @type {{x: number, y: number, width: number, height: number}|null} */
let lastNormalBounds = null;

/**
 * Load saved window state from app settings
 * @returns {{x: number, y: number, width: number, height: number, isMaximized: boolean}|null}
 */
function loadWindowState() {
  const settings = loadAppSettings();
  return settings.windowBounds || null;
}

/**
 * Save current window state to app settings
 * @param {BrowserWindow} win - The window to save state for
 */
function saveWindowState(win) {
  const isMaximized = win.isMaximized();
  // Use the last normal bounds if maximized, otherwise use current bounds
  const bounds = isMaximized && lastNormalBounds ? lastNormalBounds : win.getBounds();

  const settings = loadAppSettings();
  settings.windowBounds = {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    isMaximized
  };

  saveAppSettings(settings);
}

/**
 * Check if a window position would be visible on any connected display
 * @param {number} x - Window x position
 * @param {number} y - Window y position
 * @param {number} width - Window width
 * @param {number} height - Window height
 * @returns {boolean} True if at least part of the window is on a visible display
 */
function isPositionOnScreen(x, y, width, height) {
  const displays = screen.getAllDisplays();
  // Check if any portion of the window overlaps with any display
  return displays.some(display => {
    const { x: dx, y: dy, width: dw, height: dh } = display.bounds;
    return x < dx + dw && x + width > dx && y < dy + dh && y + height > dy;
  });
}

/**
 * Create the main application window
 * @returns {void}
 */
function createWindow() {
  const savedState = loadWindowState();

  const windowOptions = {
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, '../../build/icon.png')
  };

  if (savedState && isPositionOnScreen(savedState.x, savedState.y, savedState.width, savedState.height)) {
    windowOptions.x = savedState.x;
    windowOptions.y = savedState.y;
    windowOptions.width = savedState.width;
    windowOptions.height = savedState.height;
  }

  mainWindow = new BrowserWindow(windowOptions);

  // Track normal (non-maximized) bounds for save-on-close
  lastNormalBounds = mainWindow.getBounds();
  mainWindow.on('resize', () => {
    if (!mainWindow.isMaximized()) {
      lastNormalBounds = mainWindow.getBounds();
    }
  });
  mainWindow.on('move', () => {
    if (!mainWindow.isMaximized()) {
      lastNormalBounds = mainWindow.getBounds();
    }
  });

  // Restore maximized state after window is ready
  if (savedState && savedState.isMaximized) {
    mainWindow.maximize();
  }

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Intercept all target="_blank" link clicks — route to system default browser.
  // Without this, Electron opens a new BrowserWindow inside the app for every
  // external link, which is both a security risk and a bad UX.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Open DevTools in development mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Save window state before closing
  mainWindow.on('close', () => {
    saveWindowState(mainWindow);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (db) {
      db.close();
      db = null;
    }
  });
}

/** @type {BrowserWindow|null} */
let manualWindow = null;

/**
 * Open the User Manual in a dedicated window
 * @returns {void}
 */
function openUserManual() {
  // If window already exists, focus it
  if (manualWindow && !manualWindow.isDestroyed()) {
    manualWindow.focus();
    return;
  }

  // Position on same screen as main window
  const windowOptions = {
    width: 900,
    height: 700,
    title: 'User Manual - NumiSync Wizard',
    icon: path.join(__dirname, '../../build/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  };

  // Center relative to main window if it exists
  if (mainWindow && !mainWindow.isDestroyed()) {
    const mainBounds = mainWindow.getBounds();
    windowOptions.x = Math.round(mainBounds.x + (mainBounds.width - windowOptions.width) / 2);
    windowOptions.y = Math.round(mainBounds.y + (mainBounds.height - windowOptions.height) / 2);
  }

  manualWindow = new BrowserWindow(windowOptions);
  manualWindow.loadFile(path.join(__dirname, '../resources/user-manual.html'));
  manualWindow.setMenuBarVisibility(false);

  // Route all target="_blank" clicks in the user manual to the system browser
  manualWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  manualWindow.on('closed', () => {
    manualWindow = null;
  });
}

// ============================================================================
// Application Menu
// ============================================================================

/**
 * Send a menu action to the renderer process
 * @param {string} channel - IPC channel name
 * @param {*} data - Optional data to send
 */
function sendMenuAction(channel, data = null) {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send(channel, data);
  }
}

/**
 * Build the application menu template
 * @returns {Array} Menu template array
 */
function buildMenuTemplate() {
  const isMac = process.platform === 'darwin';

  // Build Recent Collections submenu
  const recentSubmenu = [];
  if (menuState.recentCollections.length === 0) {
    recentSubmenu.push({ label: '(No Recent Collections)', enabled: false });
  } else {
    menuState.recentCollections.forEach((filePath, index) => {
      const filename = filePath.split(/[\\/]/).pop();
      recentSubmenu.push({
        label: `${index + 1}. ${filename}`,
        click: () => sendMenuAction('menu:load-recent', filePath)
      });
    });
    recentSubmenu.push({ type: 'separator' });
    recentSubmenu.push({
      label: 'Clear Recent Collections',
      click: () => sendMenuAction('menu:clear-recent')
    });
  }

  const template = [
    // macOS App menu
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { label: 'About NumiSync Wizard', click: () => sendMenuAction('menu:about') },
        { type: 'separator' },
        { label: 'Preferences...', accelerator: 'CmdOrCtrl+,', click: () => sendMenuAction('menu:open-app-settings') },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),

    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'Load Collection...',
          accelerator: 'CmdOrCtrl+O',
          click: () => sendMenuAction('menu:load-collection')
        },
        {
          label: 'Recent Collections',
          id: 'recent-collections',
          submenu: recentSubmenu
        },
        { type: 'separator' },
        {
          label: 'Close Collection',
          accelerator: 'CmdOrCtrl+W',
          id: 'close-collection',
          enabled: menuState.collectionLoaded,
          click: () => sendMenuAction('menu:close-collection')
        },
        { type: 'separator' },
        {
          label: 'Set as Default Collection',
          id: 'set-default',
          enabled: menuState.collectionLoaded,
          click: () => sendMenuAction('menu:set-default')
        },
        {
          label: 'Clear Default Collection',
          id: 'clear-default',
          click: () => sendMenuAction('menu:clear-default')
        },
        ...(isMac ? [] : [
          { type: 'separator' },
          { label: 'Exit', accelerator: 'Alt+F4', role: 'quit' }
        ])
      ]
    },

    // Edit menu
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Select All Fields',
          accelerator: 'CmdOrCtrl+A',
          id: 'select-all-fields',
          enabled: menuState.fieldComparisonActive,
          click: () => sendMenuAction('menu:select-all-fields')
        },
        {
          label: 'Select None',
          accelerator: 'CmdOrCtrl+Shift+A',
          id: 'select-none',
          enabled: menuState.fieldComparisonActive,
          click: () => sendMenuAction('menu:select-none')
        },
        { type: 'separator' },
        {
          label: 'Select Empty Fields Only',
          id: 'select-empty',
          enabled: menuState.fieldComparisonActive,
          click: () => sendMenuAction('menu:select-empty')
        },
        {
          label: 'Select Different Fields Only',
          id: 'select-different',
          enabled: menuState.fieldComparisonActive,
          click: () => sendMenuAction('menu:select-different')
        },
        { type: 'separator' },
        {
          label: 'Select All Eligible for Pricing',
          id: 'fp-select-all',
          enabled: menuState.fastPricingMode,
          click: () => sendMenuAction('menu:fp-select-all')
        },
        {
          label: 'Select Displayed for Pricing',
          id: 'fp-select-displayed',
          enabled: menuState.fastPricingMode,
          click: () => sendMenuAction('menu:fp-select-displayed')
        },
        {
          label: 'Clear Pricing Selection',
          id: 'fp-clear',
          enabled: menuState.fastPricingMode,
          click: () => sendMenuAction('menu:fp-clear')
        },
        { type: 'separator' },
        {
          label: `Start Pricing Update (${menuState.fastPricingSelectedCount})...`,
          id: 'fp-start-update',
          enabled: menuState.fastPricingMode && menuState.fastPricingSelectedCount > 0,
          click: () => sendMenuAction('menu:fp-start-update')
        }
      ]
    },

    // View menu
    {
      label: 'View',
      submenu: [
        {
          label: 'View Mode',
          id: 'view-mode',
          enabled: menuState.collectionLoaded,
          submenu: [
            { label: 'List View', type: 'radio', checked: menuState.viewMode === 'list', click: () => sendMenuAction('menu:set-view-mode', 'list') },
            { label: 'Grid View', type: 'radio', checked: menuState.viewMode === 'grid', click: () => sendMenuAction('menu:set-view-mode', 'grid') }
          ]
        },
        { type: 'separator' },
        {
          label: 'Filter by Status',
          id: 'filter-status',
          enabled: menuState.collectionLoaded,
          submenu: [
            { label: 'All', type: 'radio', checked: true, click: () => sendMenuAction('menu:filter-status', 'all') },
            { label: 'Unprocessed', type: 'radio', click: () => sendMenuAction('menu:filter-status', 'unprocessed') },
            { label: 'Complete', type: 'radio', click: () => sendMenuAction('menu:filter-status', 'complete') },
            { label: 'Partial', type: 'radio', click: () => sendMenuAction('menu:filter-status', 'partial') },
            { label: 'Skipped', type: 'radio', click: () => sendMenuAction('menu:filter-status', 'skipped') }
          ]
        },
        {
          label: 'Filter by Freshness',
          id: 'filter-freshness',
          enabled: menuState.collectionLoaded,
          submenu: [
            { label: 'All', type: 'radio', checked: true, click: () => sendMenuAction('menu:filter-freshness', 'all') },
            { label: 'Current', type: 'radio', click: () => sendMenuAction('menu:filter-freshness', 'current') },
            { label: 'Recent', type: 'radio', click: () => sendMenuAction('menu:filter-freshness', 'recent') },
            { label: 'Aging', type: 'radio', click: () => sendMenuAction('menu:filter-freshness', 'aging') },
            { label: 'Outdated', type: 'radio', click: () => sendMenuAction('menu:filter-freshness', 'outdated') },
            { label: 'Never', type: 'radio', click: () => sendMenuAction('menu:filter-freshness', 'never') }
          ]
        },
        {
          label: 'Sort By',
          id: 'sort-by',
          enabled: menuState.collectionLoaded,
          submenu: [
            { label: 'Title', type: 'radio', checked: true, click: () => sendMenuAction('menu:sort-by', 'title') },
            { label: 'Year', type: 'radio', click: () => sendMenuAction('menu:sort-by', 'year') },
            { label: 'Country', type: 'radio', click: () => sendMenuAction('menu:sort-by', 'country') },
            { label: 'Last Updated', type: 'radio', click: () => sendMenuAction('menu:sort-by', 'last_update') },
            { label: 'Pricing Freshness', type: 'radio', click: () => sendMenuAction('menu:sort-by', 'pricing_freshness') },
            { label: 'Status', type: 'radio', click: () => sendMenuAction('menu:sort-by', 'status') }
          ]
        },
        { type: 'separator' },
        {
          label: 'Reset Filters',
          id: 'reset-filters',
          enabled: menuState.collectionLoaded,
          click: () => sendMenuAction('menu:reset-filters')
        },
        { type: 'separator' },
        {
          label: 'Refresh List',
          accelerator: isMac ? 'CmdOrCtrl+R' : 'F5',
          id: 'refresh-list',
          enabled: menuState.collectionLoaded,
          click: () => sendMenuAction('menu:refresh-list')
        },
        { type: 'separator' },
        {
          label: 'Enter Fast Pricing Mode',
          id: 'enter-fast-pricing',
          enabled: menuState.collectionLoaded && !menuState.fastPricingMode,
          visible: !menuState.fastPricingMode,
          click: () => sendMenuAction('menu:enter-fast-pricing-mode')
        },
        {
          label: 'Exit Fast Pricing Mode',
          id: 'exit-fast-pricing',
          enabled: menuState.collectionLoaded && menuState.fastPricingMode,
          visible: menuState.fastPricingMode,
          click: () => sendMenuAction('menu:exit-fast-pricing-mode')
        }
      ]
    },

    // Settings menu (Windows/Linux only)
    ...(isMac ? [] : [{
      label: 'Settings',
      submenu: [
        {
          label: 'App Settings...',
          accelerator: 'CmdOrCtrl+,',
          id: 'app-settings',
          click: () => sendMenuAction('menu:open-app-settings')
        },
        { type: 'separator' },
        {
          label: 'Data Settings...',
          id: 'data-settings',
          enabled: menuState.collectionLoaded,
          click: () => sendMenuAction('menu:open-data-settings')
        },
        {
          label: 'Field Mappings...',
          id: 'field-mappings',
          enabled: menuState.collectionLoaded,
          click: () => sendMenuAction('menu:open-field-mappings')
        },
        { type: 'separator' },
        { label: 'Export Field Mappings...', id: 'export-mappings', enabled: menuState.collectionLoaded, click: () => sendMenuAction('menu:export-mappings') },
        { label: 'Import Field Mappings...', id: 'import-mappings', enabled: menuState.collectionLoaded, click: () => sendMenuAction('menu:import-mappings') },
        { type: 'separator' },
        { label: 'Reset Field Mappings', id: 'reset-mappings', enabled: menuState.collectionLoaded, click: () => sendMenuAction('menu:reset-mappings') },
        { label: 'Reset All Settings', id: 'reset-all', enabled: menuState.collectionLoaded, click: () => sendMenuAction('menu:reset-all') }
      ]
    }]),

    // Window menu (macOS only)
    ...(isMac ? [{
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
    }] : []),

    // Help menu
    {
      label: 'Help',
      submenu: [
        {
          label: 'User Manual',
          accelerator: 'F1',
          click: () => openUserManual()
        },
        { type: 'separator' },
        ...(isMac ? [] : [
          { label: 'About NumiSync Wizard', click: () => sendMenuAction('menu:about') },
          { type: 'separator' }
        ]),
        {
          label: 'Numista Website',
          click: () => shell.openExternal('https://en.numista.com')
        },
        {
          label: 'Get Numista API Key',
          click: () => shell.openExternal('https://en.numista.com/api/')
        },
        { type: 'separator' },
        ...(!menuState.isSupporter ? [
          {
            label: 'Purchase License Key',
            click: () => sendMenuAction('menu:purchase-license')
          },
          { type: 'separator' }
        ] : []),
        {
          label: 'View License Agreement',
          click: () => sendMenuAction('menu:view-eula')
        },
        { type: 'separator' },
        {
          label: 'Report an Issue...',
          click: () => sendMenuAction('menu:report-issue')
        },
        { type: 'separator' },
        {
          label: 'Check for Updates...',
          click: () => checkForUpdatesManually()
        }
      ]
    }
  ];

  return template;
}

/**
 * Build and set the application menu
 */
function rebuildMenu() {
  const template = buildMenuTemplate();
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Load recent collections from app settings
 * @returns {Promise<Array<string>>} Array of file paths
 */
async function loadRecentCollections() {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      return settings.recentCollections || [];
    }
    return [];
  } catch (error) {
    log.error('Error loading recent collections:', error);
    return [];
  }
}

/**
 * Save recent collections to app settings
 * @param {Array<string>} collections - Array of file paths
 */
async function saveRecentCollections(collections) {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    let settings = {};
    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
    settings.recentCollections = collections;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
  } catch (error) {
    log.error('Error saving recent collections:', error);
  }
}

/**
 * Add a collection to the recent collections list
 * @param {string} collectionPath - Path to collection file
 */
async function addToRecentCollections(collectionPath) {
  let recent = await loadRecentCollections();

  // Remove if already exists (to move to front)
  recent = recent.filter(p => p !== collectionPath);

  // Add to front
  recent.unshift(collectionPath);

  // Limit to 10
  if (recent.length > 10) {
    recent = recent.slice(0, 10);
  }

  await saveRecentCollections(recent);
  menuState.recentCollections = recent;
  rebuildMenu();
}

app.whenReady().then(async () => {
  // Migrate app settings from old format (must happen before any other initialization)
  migrateAppSettings();

  createWindow();

  // Load recent collections and build menu
  menuState.recentCollections = await loadRecentCollections();
  rebuildMenu();

  // Initialize auto-updater (only in packaged builds)
  initAutoUpdater(mainWindow);
});

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

// #endregion App Lifecycle & Window Management

// #region Database Operations
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
      log.warn('PowerShell lock check failed (non-fatal):', error.message);
      // Fall through — if PowerShell fails, don't block the user
    }
  }

  return { inUse: false, reason: null };
}

// ============================================================================
// IPC HANDLERS - Synchronous (preload startup)
// ============================================================================

ipcMain.on('get-denomination-aliases', (event) => {
  event.returnValue = { aliasMap: DENOMINATION_ALIASES, pluralMap: DENOMINATION_PLURALS, allCanonicalsMap: ALL_CANONICALS, issuerOverrides: ISSUER_DENOMINATION_OVERRIDES, subunitMap: SUBUNIT_MAP };
});

// Flat issuer alias map for renderer-side confidence scoring (used by preload.js).
// Built once at startup from issuer-aliases.json; returned synchronously so preload
// can expose it via window.stringSimilarity.issuerAliases without requiring fs/path.
const _issuerAliasRaw = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', 'data', 'issuer-aliases.json'), 'utf8'
));
const ISSUER_ALIASES_FLAT = {};
for (const [key, value] of Object.entries(_issuerAliasRaw)) {
  if (key.startsWith('_')) continue;
  for (const alias of value.aliases) {
    ISSUER_ALIASES_FLAT[alias.toLowerCase()] = value.code;
  }
}
ipcMain.on('get-issuer-aliases', (event) => {
  event.returnValue = ISSUER_ALIASES_FLAT;
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

    // Clear type data cache when loading a new collection (Task 3.12.4)
    typeDataCache.clear();
    log.info('[Silent Reuse] Type data cache cleared for new collection');

    // Open the collection database (async now)
    db = await OpenNumismatDB.open(filePath);
    
    // Get collection summary FIRST
    const summary = db.getCollectionSummary();
    log.info('Collection summary:', summary);

    // Initialize settings manager for this collection
    settingsManager = new SettingsManager(filePath);
    log.info('Settings loaded:', settingsManager.getFetchSettings());

    // Auto-migrate API key from Phase 1 app settings if collection has none
    if (!settingsManager.getApiKey()) {
      try {
        const phase1Path = path.join(app.getPath('userData'), 'settings.json');
        if (fs.existsSync(phase1Path)) {
          const phase1Settings = JSON.parse(fs.readFileSync(phase1Path, 'utf8'));
          if (phase1Settings.apiKey) {
            settingsManager.setApiKey(phase1Settings.apiKey);
            log.info('API key migrated from Phase 1 app settings to collection settings');
          }
        }
      } catch (migrationError) {
        log.error('API key migration failed (non-fatal):', migrationError.message);
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
    log.info('Progress stats:', progress.statistics);

    // Add to recent collections and update menu state
    await addToRecentCollections(filePath);
    menuState.collectionLoaded = true;
    rebuildMenu();

    return {
      success: true,
      filePath,
      summary,
      progress,
      settings: settingsManager.getSettings()
    };
  } catch (error) {
    log.error('Error loading collection:', error);
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

    // Parse metadata from note field for each coin (needed for auto-propagate matching)
    for (const coin of coins) {
      const { metadata } = metadataManager.readEnrichmentMetadata(coin.note);
      coin.metadata = metadata;
    }

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
    log.error('Error getting coins:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-coin-details', async (event, coinId) => {
  try {
    if (!db) {
      throw new Error('No collection loaded');
    }

    const coin = db.getCoinById(coinId);
    // Parse metadata from note field so coin.metadata is available (matches get-coins behavior)
    if (coin) {
      const { metadata } = metadataManager.readEnrichmentMetadata(coin.note);
      coin.metadata = metadata;
    }
    return { success: true, coin };
  } catch (error) {
    log.error('Error getting coin details:', error);
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
    log.error('Error loading API key:', error);
    return null;
  }
}

// #endregion Database Operations

// #region Search & Enrichment
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
      issuerApi = new NumistaAPI(apiKey, getApiCache(), getCacheTTLs());
    } else {
      issuerApi.setApiKey(apiKey);
    }
    const code = await issuerApi.resolveIssuerCode(countryName);
    return { success: true, code };
  } catch (error) {
    log.warn('Issuer resolution failed:', error.message);
    return { success: true, code: null };
  }
});

// ============================================================================
// IPC HANDLERS - Numista Search
// ============================================================================

ipcMain.handle('search-numista', async (event, searchParams) => {
  try {
    log.debug('=== BACKEND SEARCH ===');
    log.debug('Received search params:', searchParams);

    const apiKey = getApiKey();
    const api = new NumistaAPI(apiKey, getApiCache(), getCacheTTLs());
    const results = await api.searchTypes(searchParams);

    log.info('Search results count:', results.count);
    log.debug('Number of types returned:', results.types?.length || 0);

    // Increment session counter - 1 API call for search
    if (progressTracker) {
      progressTracker.incrementSessionCalls(1);
    }

    return { success: true, results };
  } catch (error) {
    log.error('Error searching Numista:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('manual-search-numista', async (event, { query, coinId, category, issuer, date, page }) => {
  try {
    const apiKey = getApiKey();
    const api = new NumistaAPI(apiKey, getApiCache(), getCacheTTLs());

    // Build search params: q=denomination, issuer=resolved code, date=year (separate param —
    // year in q returns 0 results since Numista type titles don't contain years).
    const searchParams = { q: query };
    if (category) searchParams.category = category;
    if (issuer) searchParams.issuer = issuer;
    if (date) searchParams.date = date;
    if (page && page > 1) searchParams.page = page;

    log.info('Manual search:', JSON.stringify({ coinId, params: searchParams }));

    const results = await api.searchTypes(searchParams);

    log.info('Manual search found:', results.count, 'results for q=' + query);

    // Note: Search tracking removed - status updates happen on merge

    // Increment session counter - 1 API call for search
    if (progressTracker) {
      progressTracker.incrementSessionCalls(1);
    }

    return { success: true, results };
  } catch (error) {
    log.error('Error in manual search:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-numista-type', async (event, typeId) => {
  try {
    const apiKey = getApiKey();
    const api = new NumistaAPI(apiKey, getApiCache(), getCacheTTLs());
    const typeData = await api.getType(typeId);
    
    return { success: true, typeData };
  } catch (error) {
    log.error('Error getting Numista type:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fetch-coin-data', async (event, { typeId, coin }) => {
  try {
    log.debug('=== fetch-coin-data called ===');
    log.debug('typeId:', typeId);
    log.debug('coin year:', coin?.year, 'mintmark:', coin?.mintmark);

    const apiKey = getApiKey();
    const api = new NumistaAPI(apiKey, getApiCache(), getCacheTTLs());

    // Get fetch settings
    const fetchSettings = settingsManager ? settingsManager.getFetchSettings() : { basicData: true, issueData: false, pricingData: false };
    log.debug('Fetch settings:', fetchSettings);

    // Get currency from settings (defaults to USD)
    const currency = settingsManager ? settingsManager.getCurrency() : 'USD';
    log.debug('Currency:', currency);

    // Task 3.12.4: Silent Type Data Reuse - check cache before API call
    let cachedBasicData = null;
    let usedCache = false;
    if (fetchSettings.basicData && typeDataCache.has(typeId)) {
      const cached = typeDataCache.get(typeId);
      cachedBasicData = cached.data;
      usedCache = true;
      log.debug(`[Silent Reuse] Type data for ${typeId} found in cache (cached at ${new Date(cached.cachedAt).toISOString()}), skipping API call`);
    }

    // If we have cached basicData, modify settings to skip fetching it
    const effectiveFetchSettings = usedCache
      ? { ...fetchSettings, basicData: false }
      : fetchSettings;

    // Fetch requested data (may skip basicData if cached)
    const result = await api.fetchCoinData(typeId, coin, effectiveFetchSettings, currency);

    // Merge cached basicData if used
    if (usedCache) {
      result.basicData = cachedBasicData;
    } else if (fetchSettings.basicData && result.basicData) {
      // Cache the freshly fetched type data for future reuse
      typeDataCache.set(typeId, {
        data: result.basicData,
        cachedAt: Date.now()
      });
      log.debug(`[Silent Reuse] Type data for ${typeId} cached for future reuse`);
    }

    log.debug('Fetch result - basicData:', !!result.basicData, 'issueData:', !!result.issueData, 'pricingData:', !!result.pricingData);
    log.debug('Issue match result:', result.issueMatchResult?.type);

    // Increment session counter based on actual API calls made (from apiCallCount)
    if (progressTracker) {
      const callCount = api.apiCallCount;

      if (callCount > 0) {
        progressTracker.incrementSessionCalls(callCount);
        log.info(`Session counter incremented by ${callCount} (total now: ${progressTracker.getSessionCallCount()})`);
      } else {
        log.debug('[Cache] No API calls made - all data from cache');
      }
    }

    return { success: true, ...result };
  } catch (error) {
    log.error('Error fetching coin data:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fetch-pricing-for-issue', async (event, { typeId, issueId }) => {
  try {
    log.debug('=== fetch-pricing-for-issue called ===');
    log.debug('typeId:', typeId, 'issueId:', issueId);

    const apiKey = getApiKey();
    const api = new NumistaAPI(apiKey, getApiCache(), getCacheTTLs());

    // Get currency from settings (defaults to USD)
    const currency = settingsManager ? settingsManager.getCurrency() : 'USD';
    log.debug('Currency:', currency);

    // Fetch pricing for this specific issue
    const pricingData = await api.getIssuePricing(typeId, issueId, currency);
    log.debug('Pricing fetched:', !!pricingData);

    // Increment session counter - 1 API call for pricing
    if (progressTracker) {
      progressTracker.incrementSessionCalls(1);
      log.info(`Session counter incremented by 1 (total now: ${progressTracker.getSessionCallCount()})`);
    }

    return { success: true, pricingData };
  } catch (error) {
    log.error('Error fetching pricing for issue:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fetch-issue-data', async (event, { typeId, coin }) => {
  try {
    log.debug('=== fetch-issue-data called ===');
    log.debug('typeId:', typeId);

    const apiKey = getApiKey();
    const api = new NumistaAPI(apiKey, getApiCache(), getCacheTTLs());

    // Fetch issues for this type (may be served from persistent cache)
    const issuesResponse = await api.getTypeIssues(typeId);

    // Increment session counter based on actual API calls made
    if (progressTracker && api.apiCallCount > 0) {
      progressTracker.incrementSessionCalls(api.apiCallCount);
      log.info(`Session counter incremented by ${api.apiCallCount} (total now: ${progressTracker.getSessionCallCount()})`);
    }

    // Try to auto-match (local logic, no API call)
    // Get emptyMintmarkInterpretation from settings (Task 3.12.7/3.12.8)
    const fetchSettings = settingsManager ? settingsManager.getFetchSettings() : {};
    const matchOptions = {
      emptyMintmarkInterpretation: fetchSettings.emptyMintmarkInterpretation || 'no_mint_mark'
    };
    const matchResult = api.matchIssue(coin, issuesResponse, matchOptions);
    log.debug('Issue match result type:', matchResult.type);

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
    log.error('Error fetching issue data:', error);
    return { success: false, error: error.message };
  }
});

// #endregion Search & Enrichment

// #region Field Mapping & Merge
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
    log.error('Error comparing fields:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('merge-data', async (event, { coinId, selectedFields, numistaData, issueData, pricingData }) => {
  try {
    if (!db) {
      throw new Error('No collection loaded');
    }

    log.debug('=== IPC merge-data received ===');
    log.debug('coinId:', coinId);
    log.debug('selectedFields type:', typeof selectedFields);
    log.debug('selectedFields:', JSON.stringify(selectedFields, null, 2));
    log.debug('selectedFields keys:', Object.keys(selectedFields));
    log.debug('selectedFields values:', Object.values(selectedFields));
    log.debug('issueData:', issueData ? 'provided' : 'null');
    log.debug('pricingData:', pricingData ? 'provided' : 'null');
    
    // Count true values
    const trueCount = Object.values(selectedFields).filter(v => v === true).length;
    log.debug('Number of TRUE values:', trueCount);
    
    log.debug('numistaData.id:', numistaData?.id);
    log.debug('numistaData.title:', numistaData?.title);

    // Create backup before merging (if enabled in settings)
    let backupPath = null;
    const autoBackup = settingsManager ? settingsManager.getAutoBackup() : true;
    if (autoBackup) {
      backupPath = db.createBackup();
      log.info('Backup created:', backupPath);

      // Prune old backups beyond the configured limit
      const maxBackups = settingsManager ? settingsManager.getMaxBackups() : 5;
      const pruned = db.pruneOldBackups(maxBackups);
      if (pruned.length > 0) {
        log.info(`Pruned ${pruned.length} old backup(s)`);
      }
    } else {
      log.info('Auto-backup disabled, skipping backup creation');
    }
    
    // Perform the merge (pass issueData, pricingData, and coin mintmark for mint resolution)
    const customMapping = settingsManager ? settingsManager.buildFieldMapperConfig() : null;
    const mapper = new FieldMapper(customMapping);
    const mergeCoin = db.getCoinById(coinId);
    const updatedData = mapper.mergeFields(selectedFields, numistaData, issueData, pricingData, { mintmark: mergeCoin?.mintmark });
    log.debug('Data to update:', updatedData);

    // Handle image fields specially - download and store in photos table
    const imageFields = ['obverseimg', 'reverseimg', 'edgeimg'];
    const selectedImageFields = imageFields.filter(f => selectedFields[f] === true);

    if (selectedImageFields.length > 0) {
      log.debug('=== AUTO-DOWNLOADING IMAGES ===');
      log.debug('Selected image fields:', selectedImageFields);

      // Build image URLs from numistaData
      const imageUrls = {};
      if (selectedFields.obverseimg && numistaData.obverse?.picture) {
        imageUrls.obverse = numistaData.obverse.picture;
      }
      if (selectedFields.reverseimg && numistaData.reverse?.picture) {
        imageUrls.reverse = numistaData.reverse.picture;
      }
      if (selectedFields.edgeimg && numistaData.edge?.picture) {
        imageUrls.edge = numistaData.edge.picture;
      }

      log.debug('Image URLs to download:', imageUrls);

      // Download images
      const imageBuffers = {};
      for (const [type, url] of Object.entries(imageUrls)) {
        if (url) {
          try {
            log.debug(`Downloading ${type} image: ${url}`);
            imageBuffers[type] = await imageHandler.downloadImage(url);
            log.debug(`${type} downloaded: ${imageBuffers[type]?.length || 0} bytes`);
          } catch (error) {
            log.error(`Failed to download ${type} image:`, error.message);
          }
        }
      }

      // Store images in photos table and update coin
      if (Object.keys(imageBuffers).length > 0) {
        const photoIds = await db.storeImagesForCoin(coinId, imageBuffers);
        log.debug('Images stored with photo IDs:', photoIds);
      }

      // Remove image URLs from updatedData - they've been handled via photos table
      for (const field of imageFields) {
        delete updatedData[field];
      }
      log.debug('=== END AUTO-DOWNLOADING IMAGES ===');
    }
    
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
    log.info('Metadata written to note field');
    
    // Update database (now includes note with metadata)
    const updateResult = db.updateCoin(coinId, updatedData);
    log.info('Update result:', updateResult);
    
    // Update progress cache immediately
    if (progressTracker && settingsManager) {
      const fetchSettings = settingsManager.getFetchSettings();
      progressTracker.updateCoinInCache(coinId, newMetadata, fetchSettings);
      log.info('Progress cache updated');
    }
    
    return { 
      success: true, 
      backupPath,
      updatedFields: Object.keys(updatedData).length,
      message: `Coin updated successfully (${Object.keys(updatedData).length} fields)`
    };
  } catch (error) {
    log.error('Error merging data:', error);
    return { success: false, error: error.message };
  }
});

// #endregion Field Mapping & Merge

// #region Progress Tracking
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
        log.info(`Skipped metadata written to database for coin ${coinId}`);

        // Read back the complete metadata from the note we just wrote
        const { metadata: completeMetadata } = metadataManager.readEnrichmentMetadata(updatedNote);
        phase2Metadata = completeMetadata;
      }
    } else if (status === 'no_matches' || status === 'NO_MATCHES') {
      phase2Metadata.basicData = { status: 'NO_MATCH', timestamp };
    } else if (status === 'matched' || status === 'MATCHED') {
      // Read existing metadata from the database so that already-MERGED sections are not
      // regressed. A match being found means we know which Numista type to use, but it does
      // not undo data that was previously applied. Only move basicData to PENDING if basic
      // data retrieval is enabled in settings and basicData is not already MERGED.
      const matchedCoin = db.getCoinById(coinId);
      if (matchedCoin) {
        const { metadata: existingMetadata } = metadataManager.readEnrichmentMetadata(matchedCoin.note || '');
        if (existingMetadata) {
          phase2Metadata = { ...existingMetadata };
        }
      }
      const matchFetchSettings = settingsManager ? settingsManager.getFetchSettings() : { basicData: true };
      if (matchFetchSettings.basicData && phase2Metadata.basicData?.status !== 'MERGED') {
        phase2Metadata.basicData = { status: 'PENDING', timestamp, numistaId: metadata?.numistaId };
      }
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
    log.error('Error updating coin status:', error);
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
    log.error('Error getting progress stats:', error);
    return { success: false, error: error.message };
  }
});

// #endregion Progress Tracking

// #region Settings
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
          maxBackups: 5,
          defaultCollectionPath: '', // Path to auto-load on startup (empty = prompt user)
          // Supporter/licensing status
          supporter: {
            isSupporter: false,
            licenseKey: null,
            validatedAt: null,
            customerId: null
          },
          // Lifetime statistics for license prompts
          lifetimeStats: {
            totalCoinsEnriched: 0
          }
        }
      };
    }
  } catch (error) {
    log.error('Error getting app settings:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-app-settings', async (event, settings) => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');

    // IMPORTANT: Merge with existing settings to preserve fields not in the form
    // (e.g., eulaAccepted, defaultCollectionPath)
    let existingSettings = {};
    if (fs.existsSync(settingsPath)) {
      existingSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }

    // Merge: new settings override existing, but preserve fields not in new settings
    const mergedSettings = { ...existingSettings, ...settings };

    fs.writeFileSync(settingsPath, JSON.stringify(mergedSettings, null, 2), 'utf8');

    // Sync API key to collection-specific settings if a collection is loaded
    if (settingsManager && settings.apiKey) {
      settingsManager.setApiKey(settings.apiKey);
      log.info('API key synced to collection settings');
    }
    // Propagate new key to the cache so usage tracking switches to the new key immediately
    if (settings.apiKey) {
      getApiCache().setActiveKey(settings.apiKey);
    }

    // Sync rate limit to collection settings if a collection is loaded
    if (settingsManager && settings.searchDelay) {
      settingsManager.setRateLimit(settings.searchDelay);
      log.info('Rate limit synced to collection settings');
    }

    // Sync backup settings to collection settings
    if (settingsManager) {
      if (settings.autoBackup !== undefined) {
        settingsManager.setAutoBackup(settings.autoBackup);
      }
      if (settings.maxBackups !== undefined) {
        settingsManager.setMaxBackups(settings.maxBackups);
      }
      log.info('Backup settings synced to collection settings');
    }

    // Sync log level to logger
    if (settings.logLevel) {
      const { setLogLevel } = require('./logger');
      setLogLevel(settings.logLevel);
      log.info('Log level changed to:', settings.logLevel);
    }

    // Write shared config to shared folder if supporter with custom cache
    const updatedSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    if (updatedSettings.cache?.location === 'custom' && updatedSettings.cache?.customPath && updatedSettings.supporter?.isSupporter) {
      await getApiCache().writeSharedConfig({
        apiKey: updatedSettings.apiKey || '',
        monthlyApiLimit: updatedSettings.monthlyApiLimit || 2000,
        searchDelay: updatedSettings.searchDelay || 2000,
        cacheTtl: updatedSettings.cacheTtl || { issuers: 90, types: 30, issues: 30 },
        licenseKey: updatedSettings.supporter?.licenseKey || '',
        defaultCollectionPath: updatedSettings.defaultCollectionPath || '',
        // Store parent folder only — getApiCache() appends .NumiSync internally
        cachePath: path.basename(updatedSettings.cache.customPath) === '.NumiSync'
          ? path.dirname(updatedSettings.cache.customPath)
          : updatedSettings.cache.customPath
      });
    }

    return { success: true };
  } catch (error) {
    log.error('Error saving app settings:', error);
    return { success: false, error: error.message };
  }
});

// Cache Location Settings
ipcMain.handle('get-cache-settings', async () => {
  const appSettings = loadAppSettings();
  return {
    location: appSettings.cache?.location || 'default',
    customPath: appSettings.cache?.customPath || null,
    lockTimeout: appSettings.cache?.lockTimeout || 30000,
    defaultPath: path.join(app.getPath('userData'), 'api-cache.json')
  };
});

ipcMain.handle('set-cache-settings', async (event, settings) => {
  const appSettings = loadAppSettings();
  appSettings.cache = {
    location: settings.location,
    customPath: settings.customPath,
    lockTimeout: settings.lockTimeout
  };
  saveAppSettings(appSettings);
  // Reset the singleton so the next getApiCache() call re-initializes with the new path.
  // Without this, a running app that changes cache location keeps reading from the old path.
  apiCache = null;
  return { success: true };
});

/**
 * Read the shared config file from the custom cache directory (if present).
 * @returns {{ found: boolean, config?: Object, exportedAt?: string }}
 */
ipcMain.handle('get-shared-config', async () => {
  try {
    const shared = getApiCache().readSharedConfig();
    if (!shared) return { found: false };
    return { found: true, config: shared.config, exportedAt: shared.exportedAt };
  } catch (error) {
    log.error('Error reading shared config:', error);
    return { found: false };
  }
});

/**
 * Apply settings from the shared config file to the local settings.json.
 * Merges: apiKey, monthlyApiLimit, searchDelay, cacheTtl, licenseKey (as pendingLicenseKey).
 * Does NOT auto-activate license. Stores lastSharedConfigImport timestamp.
 * @returns {{ success: boolean, settings?: Object }}
 */
ipcMain.handle('apply-shared-config', async () => {
  try {
    const shared = getApiCache().readSharedConfig();
    if (!shared || !shared.config) return { success: false, error: 'No shared config found' };

    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    let settings = {};
    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }

    const { apiKey, monthlyApiLimit, searchDelay, cacheTtl, licenseKey, defaultCollectionPath, cachePath } = shared.config;
    if (apiKey !== undefined) settings.apiKey = apiKey;
    if (monthlyApiLimit !== undefined) settings.monthlyApiLimit = monthlyApiLimit;
    if (searchDelay !== undefined) settings.searchDelay = searchDelay;
    if (cacheTtl !== undefined) {
      settings.cacheTtl = cacheTtl;
      // Also update flat fields for backwards compatibility
      if (cacheTtl.issuers !== undefined) settings.cacheTtlIssuers = cacheTtl.issuers;
      if (cacheTtl.types !== undefined) settings.cacheTtlTypes = cacheTtl.types;
      if (cacheTtl.issues !== undefined) settings.cacheTtlIssues = cacheTtl.issues;
    }
    if (licenseKey !== undefined) {
      settings.supporter = settings.supporter || {};
      settings.supporter.pendingLicenseKey = licenseKey; // Pre-fill only — not activated
    }
    // Only apply defaultCollectionPath if the file is actually reachable from this machine
    if (defaultCollectionPath && fs.existsSync(defaultCollectionPath)) {
      settings.defaultCollectionPath = defaultCollectionPath;
      settings.recentCollections = settings.recentCollections || [];
      if (!settings.recentCollections.includes(defaultCollectionPath)) {
        settings.recentCollections.unshift(defaultCollectionPath);
      }
    }
    // Point cache at the shared folder so this machine reads the same api-cache.json.
    // Normalize: customPath must be the parent folder — strip .NumiSync if present.
    if (cachePath) {
      const normalizedCachePath = path.basename(cachePath) === '.NumiSync'
        ? path.dirname(cachePath)
        : cachePath;
      settings.cache = {
        location: 'custom',
        customPath: normalizedCachePath,
        lockTimeout: settings.cache?.lockTimeout || 30000
      };
      apiCache = null; // Reset singleton to re-initialize with shared path
    }
    settings.lastSharedConfigImport = new Date().toISOString();

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    log.info('Shared config applied to local settings');
    return { success: true, settings };
  } catch (error) {
    log.error('Error applying shared config:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Bootstrap import: read shared config from a user-selected folder, activate the license,
 * and on success apply all portable settings to local settings.json.
 * Aborts entirely if license activation fails — no partial writes.
 * Looks for numisync-shared-config.json in folderPath/.NumiSync/ first, then folderPath/ as fallback.
 * @param {string} folderPath - Absolute path to the parent folder selected by the user
 * @returns {{ success: boolean, error?: string, settings?: Object }}
 */
ipcMain.handle('import-from-folder', async (event, folderPath) => {
  try {
    if (!folderPath || typeof folderPath !== 'string') {
      return { success: false, error: 'No folder path provided.' };
    }

    // Look for shared config in .NumiSync subfolder first, then parent folder as fallback
    let configPath = path.join(folderPath, '.NumiSync', 'numisync-shared-config.json');
    if (!fs.existsSync(configPath)) {
      configPath = path.join(folderPath, 'numisync-shared-config.json');
      if (!fs.existsSync(configPath)) {
        return { success: false, error: 'No shared settings file found in this folder. Make sure you selected the correct folder and that the primary machine has saved its settings at least once.' };
      }
    }

    let shared;
    try {
      shared = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {
      return { success: false, error: 'Shared settings file could not be read. It may be corrupted.' };
    }

    if (!shared?.config?.licenseKey) {
      return { success: false, error: 'Shared settings file does not contain a license key.' };
    }

    const licenseKey = shared.config.licenseKey.trim();

    // Attempt license activation — abort entirely if this fails (no partial writes)
    const { Polar } = require('@polar-sh/sdk');
    const polar = new Polar({ server: POLAR_CONFIG.server });
    const deviceLabel = getDeviceFingerprint();

    let activationResult;
    try {
      activationResult = await polar.customerPortal.licenseKeys.activate({
        key: licenseKey,
        organizationId: POLAR_CONFIG.organizationId,
        label: deviceLabel
      });
    } catch (activationError) {
      log.error('import-from-folder: License activation error:', activationError);
      if (activationError.statusCode === 404) {
        return { success: false, error: 'The license key in the shared config was not found. It may have been revoked.' };
      }
      if (activationError.statusCode === 422) {
        return { success: false, error: 'The license key in the shared config is invalid.' };
      }
      if (activationError.statusCode === 403 || (activationError.message && activationError.message.includes('activation'))) {
        return { success: false, error: 'This license has reached its device limit (5 devices). Deactivate an unused device at polar.sh and try again.' };
      }
      return { success: false, error: 'Could not activate license. Please check your internet connection and try again.' };
    }

    const licenseStatus = activationResult?.licenseKey?.status;
    if (!activationResult || licenseStatus !== 'granted') {
      return { success: false, error: 'License activation was not successful (status: ' + (licenseStatus || 'unknown') + ').' };
    }

    // Post-activation validate to increment Polar's validation counter (non-fatal)
    try {
      await polar.customerPortal.licenseKeys.validate({
        key: licenseKey,
        organizationId: POLAR_CONFIG.organizationId,
        activationId: activationResult.id
      });
    } catch (validateError) {
      log.warn('import-from-folder: Post-activation validation failed (non-fatal):', validateError.message);
    }

    // Activation succeeded — write all settings atomically
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    let settings = fs.existsSync(settingsPath)
      ? JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
      : {};

    const { apiKey, monthlyApiLimit, searchDelay, cacheTtl, defaultCollectionPath } = shared.config;
    if (apiKey !== undefined) settings.apiKey = apiKey;
    if (monthlyApiLimit !== undefined) settings.monthlyApiLimit = monthlyApiLimit;
    if (searchDelay !== undefined) settings.searchDelay = searchDelay;
    if (cacheTtl !== undefined) {
      settings.cacheTtl = cacheTtl;
      if (cacheTtl.issuers !== undefined) settings.cacheTtlIssuers = cacheTtl.issuers;
      if (cacheTtl.types !== undefined) settings.cacheTtlTypes = cacheTtl.types;
      if (cacheTtl.issues !== undefined) settings.cacheTtlIssues = cacheTtl.issues;
    }
    // Only apply defaultCollectionPath if the file is actually reachable from this machine
    if (defaultCollectionPath && fs.existsSync(defaultCollectionPath)) {
      settings.defaultCollectionPath = defaultCollectionPath;
      settings.recentCollections = settings.recentCollections || [];
      if (!settings.recentCollections.includes(defaultCollectionPath)) {
        settings.recentCollections.unshift(defaultCollectionPath);
      }
    }
    settings.supporter = {
      isSupporter: true,
      licenseKey: licenseKey,
      activationId: activationResult.id || null,
      licenseKeyId: activationResult.licenseKeyId || null,
      deviceLabel: deviceLabel,
      validatedAt: new Date().toISOString(),
      customerId: activationResult.licenseKey?.customerId || null,
      offlineSkipUsed: false
    };
    // Point cache at the shared folder so this machine reads the same api-cache.json
    // (monthly usage, cached responses) as the primary machine.  Without this the
    // second machine falls back to default userData path and starts at zero usage.
    // Normalize: customPath must be the parent folder — strip .NumiSync if the user
    // selected it directly (the fallback config lookup finds the file in folderPath/).
    const cacheParent = path.basename(folderPath) === '.NumiSync'
      ? path.dirname(folderPath)
      : folderPath;
    settings.cache = {
      location: 'custom',
      customPath: cacheParent,
      lockTimeout: settings.cache?.lockTimeout || 30000
    };
    settings.lastSharedConfigImport = new Date().toISOString();

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');

    // Reset the apiCache singleton so the next getApiCache() call re-initializes
    // with the shared path — otherwise it keeps reading from the old default location.
    apiCache = null;

    log.info('import-from-folder: Bootstrap import succeeded from', configPath, '— cache path set to', folderPath);
    return { success: true, settings };
  } catch (error) {
    log.error('import-from-folder: Unexpected error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('browse-cache-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Cache Location'
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('validate-cache-path', async (event, customPath) => {
  try {
    // Check if path exists
    if (!fs.existsSync(customPath)) {
      return { valid: false, reason: 'Path does not exist' };
    }

    // Check if it's a directory
    const stats = fs.statSync(customPath);
    if (!stats.isDirectory()) {
      return { valid: false, reason: 'Path must be a directory' };
    }

    // Test write permission
    const testFile = path.join(customPath, '.write-test-' + Date.now());
    try {
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
    } catch (err) {
      return { valid: false, reason: 'No write permission in this directory' };
    }

    // Check for existing cache collision in the .NumiSync subfolder (where cache always lives)
    const cachePath = path.join(customPath, '.NumiSync', 'api-cache.json');
    const lockStatus = await CacheLock.checkCacheLockStatus(cachePath);
    const cacheMetadata = CacheLock.getCacheMetadata(cachePath);

    return {
      valid: true,
      collision: {
        cacheExists: lockStatus.cacheExists,
        lockStatus: lockStatus.status, // 'none', 'unlocked', 'stale', 'locked'
        lockAge: lockStatus.lockAge,
        cacheMetadata: cacheMetadata,
        lockOwner: lockStatus.lockOwner || null
      }
    };
  } catch (error) {
    return {
      valid: false,
      reason: error.code === 'EACCES' ? 'Permission denied' :
              error.code === 'ENOENT' ? 'Path does not exist' :
              'Unknown error: ' + error.message
    };
  }
});

ipcMain.handle('migrate-cache', async (event, newLocation, newCustomPath, useExisting = false) => {
  try {
    const appSettings = loadAppSettings();
    const oldLocation = appSettings.cache?.location || 'default';
    const oldCustomPath = appSettings.cache?.customPath;

    // Determine old and new cache paths
    let oldCachePath, newCachePath;

    if (oldLocation === 'custom' && oldCustomPath) {
      oldCachePath = path.join(oldCustomPath, '.NumiSync', 'api-cache.json');
    } else {
      oldCachePath = path.join(app.getPath('userData'), 'api-cache.json');
    }

    if (newLocation === 'custom' && newCustomPath) {
      newCachePath = path.join(newCustomPath, '.NumiSync', 'api-cache.json');
    } else {
      newCachePath = path.join(app.getPath('userData'), 'api-cache.json');
    }

    // If paths are the same, no migration needed
    if (oldCachePath === newCachePath) {
      return { success: true, migrated: false };
    }

    // If useExisting is true, don't copy old cache
    if (useExisting) {
      log.info(`Using existing cache at new location: ${newCachePath}`);
      return { success: true, migrated: false, usedExisting: true };
    }

    // Copy cache files if they exist
    let migrated = false;
    if (fs.existsSync(oldCachePath)) {
      const destDir = path.dirname(newCachePath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      // Check if destination already has a cache (shouldn't happen if collision detection worked)
      if (fs.existsSync(newCachePath)) {
        log.warn(`Overwriting existing cache at ${newCachePath}`);
      }

      fs.copyFileSync(oldCachePath, newCachePath);
      migrated = true;
      log.info(`Cache migrated from ${oldCachePath} to ${newCachePath}`);
    }

    // Copy lock file if it exists
    const oldLockPath = oldCachePath.replace(/\.json$/, '.lock');
    const newLockPath = newCachePath.replace(/\.json$/, '.lock');
    if (fs.existsSync(oldLockPath)) {
      fs.copyFileSync(oldLockPath, newLockPath);
    }

    return { success: true, migrated };
  } catch (error) {
    log.error('Cache migration failed:', error);
    return { success: false, error: error.message };
  }
});

// ============================================================================
// IPC HANDLERS - Default Collection Path
// ============================================================================

/**
 * Get the default collection path (for auto-loading on startup)
 * @returns {Promise<{success: boolean, path: string|null}>}
 */
ipcMain.handle('get-default-collection', async () => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');

    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      const defaultPath = settings.defaultCollectionPath || '';

      // Verify the file still exists (skip check for empty path)
      if (defaultPath) {
        try {
          // Use fs.accessSync for better network path support
          fs.accessSync(defaultPath, fs.constants.R_OK);
        } catch (accessError) {
          log.warn('Default collection path not accessible:', defaultPath);
          return { success: true, path: null, warning: 'File not accessible: ' + accessError.message };
        }
      }

      return { success: true, path: defaultPath || null };
    }

    return { success: true, path: null };
  } catch (error) {
    log.error('Error getting default collection:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Set the default collection path
 * @param {Event} event
 * @param {string} collectionPath - Path to the .db file (empty string to clear)
 * @returns {Promise<{success: boolean}>}
 */
ipcMain.handle('set-default-collection', async (event, collectionPath) => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');

    // Load existing settings or create new
    let settings = {};
    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }

    // Update the default collection path
    settings.defaultCollectionPath = collectionPath || '';

    // Save settings
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    log.info('Default collection path set to:', collectionPath || '(none)');

    return { success: true };
  } catch (error) {
    log.error('Error setting default collection:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Browse for a collection file to set as default
 * Opens file picker and returns selected path (does not load it)
 * @returns {Promise<{success: boolean, path: string|null}>}
 */
ipcMain.handle('browse-default-collection', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Default Collection',
      properties: ['openFile'],
      filters: [
        { name: 'OpenNumismat Collections', extensions: ['db'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled) {
      return { success: true, path: null };
    }

    return { success: true, path: result.filePaths[0] };
  } catch (error) {
    log.error('Error browsing for default collection:', error);
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
    log.error('Error getting settings:', error);
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
    log.error('Error saving fetch settings:', error);
    throw error;
  }
});

ipcMain.handle('save-currency', async (event, currency) => {
  try {
    if (!settingsManager) {
      throw new Error('No collection loaded');
    }
    
    settingsManager.setCurrency(currency);
    log.info('Currency saved:', currency);
    
    return true;
  } catch (error) {
    log.error('Error saving currency:', error);
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
    log.error('Error getting currency:', error);
    return 'USD';
  }
});

ipcMain.handle('save-ui-preference', async (event, key, value) => {
  try {
    if (!settingsManager) {
      throw new Error('No collection loaded');
    }

    settingsManager.setUiPreferences({ [key]: value });
    return true;
  } catch (error) {
    log.error('Error saving UI preference:', error);
    throw error;
  }
});

ipcMain.handle('reset-settings', async () => {
  try {
    if (!settingsManager) {
      throw new Error('No collection loaded');
    }

    settingsManager.resetToDefaults();
    log.info('Settings reset to defaults');

    // Rebuild progress with reset settings
    if (progressTracker && db) {
      const fetchSettings = settingsManager.getFetchSettings();
      await progressTracker.rebuildFromDatabase(db, fetchSettings);
    }

    return { success: true, settings: settingsManager.getSettings() };
  } catch (error) {
    log.error('Error resetting settings:', error);
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
    log.error('Error getting statistics:', error);
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
    log.error('Error incrementing API calls:', error);
    throw error;
  }
});

// #endregion Settings

// #region Image Handling
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
    log.error('Error getting coin images:', error);
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

    log.debug('=== DOWNLOAD-AND-STORE-IMAGES DEBUG ===');
    log.debug(`Coin ID: ${coinId}`);
    log.debug('Image URLs received:', JSON.stringify(imageUrls, null, 2));

    const imageBuffers = {};

    // Download each image
    if (imageUrls.obverse) {
      try {
        log.debug(`Downloading obverse: ${imageUrls.obverse}`);
        imageBuffers.obverse = await imageHandler.downloadImage(imageUrls.obverse);
        log.debug(`Obverse downloaded: ${imageBuffers.obverse?.length || 0} bytes`);
      } catch (error) {
        log.error('Failed to download obverse image:', error.message);
      }
    } else {
      log.debug('No obverse URL provided');
    }

    if (imageUrls.reverse) {
      try {
        log.debug(`Downloading reverse: ${imageUrls.reverse}`);
        imageBuffers.reverse = await imageHandler.downloadImage(imageUrls.reverse);
        log.debug(`Reverse downloaded: ${imageBuffers.reverse?.length || 0} bytes`);
      } catch (error) {
        log.error('Failed to download reverse image:', error.message);
      }
    } else {
      log.debug('No reverse URL provided');
    }

    if (imageUrls.edge) {
      try {
        log.debug(`Downloading edge: ${imageUrls.edge}`);
        imageBuffers.edge = await imageHandler.downloadImage(imageUrls.edge);
        log.debug(`Edge downloaded: ${imageBuffers.edge?.length || 0} bytes`);
      } catch (error) {
        log.error('Failed to download edge image:', error.message);
      }
    } else {
      log.debug('No edge URL provided');
    }

    log.debug('Image buffers ready:', {
      obverse: imageBuffers.obverse ? `${imageBuffers.obverse.length} bytes` : 'none',
      reverse: imageBuffers.reverse ? `${imageBuffers.reverse.length} bytes` : 'none',
      edge: imageBuffers.edge ? `${imageBuffers.edge.length} bytes` : 'none'
    });

    // Store images in database
    const photoIds = await db.storeImagesForCoin(coinId, imageBuffers);

    log.debug(`Photos stored for coin ${coinId}:`, photoIds);
    log.debug('=== END DOWNLOAD-AND-STORE-IMAGES ===');

    return {
      success: true,
      imageIds: photoIds
    };
  } catch (error) {
    log.error('Error downloading and storing images:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// #endregion Image Handling

// #region Utility
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
    log.error('Error opening external URL:', error);
    return { success: false, error: error.message };
  }
});

// Check for installer-created EULA acceptance marker
ipcMain.handle('check-installer-eula-marker', async () => {
  try {
    const installDir = app.isPackaged
      ? path.dirname(path.dirname(app.getAppPath()))
      : path.dirname(app.getAppPath());
    const markerPath = path.join(installDir, 'eula-installer-accepted.marker');
    return fs.existsSync(markerPath);
  } catch (error) {
    log.error('Error checking installer EULA marker:', error);
    return false;
  }
});

// Manual check for updates
ipcMain.handle('check-for-updates', async () => {
  checkForUpdatesManually();
});

// Get app version from package.json
ipcMain.handle('get-app-version', async () => {
  return app.getVersion();
});

// Open user manual window
ipcMain.handle('open-manual', async () => {
  openUserManual();
  return { success: true };
});

// #endregion Utility

// #region Field Mapping Configuration
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
    log.error('Error getting field mappings:', error);
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
    log.error('Error saving field mappings:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-available-sources', async () => {
  try {
    return { success: true, sources: getSerializableSources() };
  } catch (error) {
    log.error('Error getting available sources:', error);
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
    log.error('Error exporting field mappings:', error);
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
    log.error('Error importing field mappings:', error);
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
    log.error('Error resetting field mappings:', error);
    return { success: false, error: error.message };
  }
});

// #endregion Field Mapping Configuration

// #region Menu & Recent Collections
// ============================================================================
// IPC HANDLERS - Menu State & Recent Collections
// ============================================================================

/**
 * Update menu state from renderer process
 * Used to enable/disable menu items based on app state
 */
ipcMain.handle('menu:update-state', async (event, state) => {
  try {
    menuState = { ...menuState, ...state };
    rebuildMenu();
    return { success: true };
  } catch (error) {
    log.error('Error updating menu state:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Get recent collections list
 */
ipcMain.handle('get-recent-collections', async () => {
  try {
    const collections = await loadRecentCollections();
    return { success: true, collections };
  } catch (error) {
    log.error('Error getting recent collections:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Clear recent collections list
 */
ipcMain.handle('clear-recent-collections', async () => {
  try {
    await saveRecentCollections([]);
    menuState.recentCollections = [];
    rebuildMenu();
    return { success: true };
  } catch (error) {
    log.error('Error clearing recent collections:', error);
    return { success: false, error: error.message };
  }
});

// #endregion Menu & Recent Collections

// #region Licensing (Polar SDK)
// ============================================================================
// IPC HANDLERS - Licensing & Supporter Status
// ============================================================================

// Polar configuration - PRODUCTION MODE
// To switch to sandbox, see docs/guides/POLAR-ENVIRONMENT-SWITCHING.md
const POLAR_CONFIG = {
  organizationId: '52798f3d-8060-45c9-b5e7-067bfa63c350',
  productId: '50fd6539-84c3-4ca7-9a1e-9f73033077dd',
  checkoutUrl: 'https://buy.polar.sh/polar_cl_4hKjIXXM8bsjk9MivMFIvtXbg7zWswAzEAVJK2TVZZ0',
  server: 'production'  // 'sandbox' or 'production'
};

/**
 * Generate a consistent device fingerprint for license activation.
 * Uses hostname, platform, arch, and MAC address to create a unique but stable identifier.
 * This ensures the same machine always gets the same device ID, preventing duplicate activations.
 * @returns {string} Device label in format "NumiSync-{platform}-{hash}"
 */
function getDeviceFingerprint() {
  try {
    // Gather stable machine identifiers
    const hostname = os.hostname();
    const platform = os.platform();
    const arch = os.arch();

    // Get first non-internal MAC address for additional uniqueness
    let macAddress = '';
    const networkInterfaces = os.networkInterfaces();
    for (const [name, interfaces] of Object.entries(networkInterfaces)) {
      for (const iface of interfaces) {
        if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
          macAddress = iface.mac;
          break;
        }
      }
      if (macAddress) break;
    }

    // Create a hash of the combined identifiers
    const fingerprint = `${hostname}-${platform}-${arch}-${macAddress}`;
    const hash = crypto.createHash('sha256').update(fingerprint).digest('hex').substring(0, 12);

    // Return a readable label with the hash
    return `NumiSync-${platform}-${hash}`;
  } catch (error) {
    log.error('Error generating device fingerprint:', error);
    // Fallback to hostname-based label if fingerprinting fails
    return `NumiSync-${os.platform()}-${os.hostname().substring(0, 12)}`;
  }
}

// ============================================================================
// License Versioning - Feature Gating by License Version
// ============================================================================

/**
 * Feature entitlements by version
 * Maps feature names to minimum required license version
 */
const FEATURE_VERSIONS = {
  // V1 Features (launched with v1.0.0)
  'fastPricing': '1.0.0',
  'batchEnrichment': '1.0.0',
  'advancedSearch': '1.0.0',
  'multiMachineSync': '1.0.0',

  // V2 Features (planned for v2.0.0)
  'numismaticSync': '2.0.0',
  'aiPricing': '2.0.0',
  'cloudBackup': '2.0.0',

  // V3 Features (future)
  'marketplaceIntegration': '3.0.0'
};

/**
 * Extract version from license key prefix
 * @param {string} licenseKey - The full license key (e.g., "V1-XXXX-XXXX-XXXX")
 * @returns {string|null} Version string (e.g., "1.0.0") or null if invalid
 */
function getLicenseVersion(licenseKey) {
  if (!licenseKey || typeof licenseKey !== 'string') {
    return null;
  }

  const prefix = licenseKey.split('-')[0].toUpperCase();

  const versionMap = {
    'V1': '1.0.0',
    'V2': '2.0.0',
    'V3': '3.0.0'
  };

  return versionMap[prefix] || null;
}

/**
 * Compare semantic versions
 * @param {string} v1 - First version (e.g., "1.0.0")
 * @param {string} v2 - Second version (e.g., "2.0.0")
 * @returns {number} -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }
  return 0;
}

/**
 * Check if a feature is unlocked by the user's license
 * @param {string} licenseKey - The user's license key
 * @param {string} featureName - Feature to check (from FEATURE_VERSIONS)
 * @returns {boolean} True if feature is unlocked
 */
function isFeatureUnlocked(licenseKey, featureName) {
  const licenseVersion = getLicenseVersion(licenseKey);

  if (!licenseVersion) {
    return false; // Invalid license
  }

  const requiredVersion = FEATURE_VERSIONS[featureName];

  if (!requiredVersion) {
    return false; // Unknown feature
  }

  // Compare semantic versions
  return compareVersions(licenseVersion, requiredVersion) >= 0;
}

/**
 * Get supporter status from app settings
 * @returns {Promise<{success: boolean, supporter: Object, lifetimeStats: Object}>}
 */
ipcMain.handle('get-supporter-status', async () => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    let settings = {};

    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }

    return {
      success: true,
      supporter: settings.supporter || {
        isSupporter: false,
        licenseKey: null,
        validatedAt: null,
        customerId: null
      },
      lifetimeStats: settings.lifetimeStats || {
        totalCoinsEnriched: 0
      },
      polarConfig: {
        checkoutUrl: POLAR_CONFIG.checkoutUrl
      }
    };
  } catch (error) {
    log.error('Error getting supporter status:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Validate a license key with Polar API
 * @param {string} licenseKey - The license key to validate
 * @returns {Promise<{success: boolean, valid: boolean, message: string}>}
 */
ipcMain.handle('validate-license-key', async (event, licenseKey) => {
  try {
    if (!licenseKey || typeof licenseKey !== 'string' || licenseKey.trim() === '') {
      return { success: false, valid: false, message: 'Please enter a license key' };
    }

    // DEBUG: Log configuration
    log.debug('[LICENSE DEBUG] POLAR_CONFIG:', JSON.stringify(POLAR_CONFIG, null, 2));
    log.debug('[LICENSE DEBUG] License key (first 8 chars):', licenseKey.trim().substring(0, 8) + '...');

    const { Polar } = require('@polar-sh/sdk');
    const polar = new Polar({ server: POLAR_CONFIG.server });

    // Generate consistent device label for identification on Polar's website
    // Uses machine fingerprint to ensure same device always gets same label
    const deviceLabel = getDeviceFingerprint();

    log.debug('[LICENSE DEBUG] Calling activate with:', {
      key: licenseKey.trim().substring(0, 8) + '...',
      organizationId: POLAR_CONFIG.organizationId,
      label: deviceLabel
    });

    // Use activate instead of validate to register this device against the activation limit
    const result = await polar.customerPortal.licenseKeys.activate({
      key: licenseKey.trim(),
      organizationId: POLAR_CONFIG.organizationId,
      label: deviceLabel
    });

    // DEBUG: Log the full result
    log.debug('[LICENSE DEBUG] API Response:', JSON.stringify(result, null, 2));

    // The activate endpoint returns an activation object with licenseKey nested inside
    // Status is at result.licenseKey.status, not result.status
    const licenseStatus = result?.licenseKey?.status;
    log.debug('[LICENSE DEBUG] License status:', licenseStatus);

    // Check if the license is valid and active
    if (result && licenseStatus === 'granted') {
      // Save the validated license to settings
      const settingsPath = path.join(app.getPath('userData'), 'settings.json');
      let settings = {};

      if (fs.existsSync(settingsPath)) {
        settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      }

      settings.supporter = {
        isSupporter: true,
        licenseKey: licenseKey.trim(),
        activationId: result.id || null,  // Activation ID is at result.id
        licenseKeyId: result.licenseKeyId || null,
        deviceLabel: deviceLabel,
        validatedAt: new Date().toISOString(),
        customerId: result.licenseKey?.customerId || null,
        offlineSkipUsed: false
      };

      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');

      // Immediately validate the license to increment Polar's validation counter
      // This ensures the dashboard shows "Validated" even on first activation
      try {
        log.debug('[LICENSE DEBUG] Calling validate immediately after activation');
        const validateResult = await polar.customerPortal.licenseKeys.validate({
          key: licenseKey.trim(),
          organizationId: POLAR_CONFIG.organizationId,
          activationId: result.id
        });
        log.debug('[LICENSE DEBUG] Post-activation validate response:', JSON.stringify(validateResult, null, 2));
      } catch (validateError) {
        // Non-fatal - activation succeeded, validation can happen later
        log.warn('[LICENSE DEBUG] Post-activation validation failed (non-fatal):', validateError.message);
      }

      return {
        success: true,
        valid: true,
        message: 'License activated successfully! Thank you for your support.',
        supporter: settings.supporter
      };
    } else if (result && licenseStatus === 'revoked') {
      log.debug('[LICENSE DEBUG] License revoked');
      return { success: true, valid: false, message: 'This license has been revoked' };
    } else if (result && licenseStatus === 'disabled') {
      log.debug('[LICENSE DEBUG] License disabled');
      return { success: true, valid: false, message: 'This license has been disabled' };
    } else {
      log.debug('[LICENSE DEBUG] Unexpected license status:', licenseStatus, 'Full result:', result);
      return { success: true, valid: false, message: 'Invalid license key' };
    }
  } catch (error) {
    log.error('[LICENSE DEBUG] Error validating license key:', error);
    log.error('[LICENSE DEBUG] Error details:', {
      message: error.message,
      statusCode: error.statusCode,
      body: error.body,
      rawResponse: error.rawResponse
    });

    // Handle specific Polar API errors
    if (error.statusCode === 404) {
      return { success: true, valid: false, message: 'License key not found' };
    }
    if (error.statusCode === 422) {
      return { success: true, valid: false, message: 'Invalid license key format' };
    }
    // Handle activation limit exceeded (403 Forbidden)
    if (error.statusCode === 403 || (error.message && error.message.includes('activation'))) {
      return {
        success: true,
        valid: false,
        message: 'Activation limit reached (5 devices). Please deactivate an existing device at polar.sh to continue.'
      };
    }

    return {
      success: false,
      valid: false,
      message: 'Unable to validate license. Please check your internet connection.'
    };
  }
});

/**
 * Update supporter status settings (e.g., offlineSkipUsed)
 * @param {Object} updates - Fields to update in supporter status
 * @returns {Promise<{success: boolean}>}
 */
ipcMain.handle('update-supporter-status', async (event, updates) => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    let settings = {};

    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }

    settings.supporter = {
      ...(settings.supporter || {}),
      ...updates
    };

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');

    return { success: true, supporter: settings.supporter };
  } catch (error) {
    log.error('Error updating supporter status:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Increment lifetime enrichment count and check if prompt should show
 * @param {number} count - Number of coins enriched to add
 * @returns {Promise<{success: boolean, totalCoinsEnriched: number, shouldPrompt: boolean}>}
 */
ipcMain.handle('increment-lifetime-enrichments', async (event, count = 1) => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    let settings = {};

    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }

    // Initialize if needed
    if (!settings.lifetimeStats) {
      settings.lifetimeStats = { totalCoinsEnriched: 0 };
    }
    if (!settings.supporter) {
      settings.supporter = { isSupporter: false };
    }

    const oldTotal = settings.lifetimeStats.totalCoinsEnriched || 0;
    const newTotal = oldTotal + count;
    settings.lifetimeStats.totalCoinsEnriched = newTotal;

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');

    // Determine if we should show a prompt
    // Initial prompt at 20 coins, then every 20 coins (40, 60, 80, ...)
    let shouldPrompt = false;

    if (!settings.supporter.isSupporter) {
      // Check if we crossed a threshold
      const INITIAL_THRESHOLD = 20;
      const RECURRING_INTERVAL = 20;

      // Crossed initial threshold?
      if (oldTotal < INITIAL_THRESHOLD && newTotal >= INITIAL_THRESHOLD) {
        shouldPrompt = true;
      }
      // Crossed a recurring threshold?
      else if (newTotal >= INITIAL_THRESHOLD) {
        const oldRecurring = Math.floor((oldTotal - INITIAL_THRESHOLD) / RECURRING_INTERVAL);
        const newRecurring = Math.floor((newTotal - INITIAL_THRESHOLD) / RECURRING_INTERVAL);
        if (newRecurring > oldRecurring) {
          shouldPrompt = true;
        }
      }
    }

    return {
      success: true,
      totalCoinsEnriched: newTotal,
      shouldPrompt,
      isSupporter: settings.supporter.isSupporter
    };
  } catch (error) {
    log.error('Error incrementing lifetime enrichments:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Get lifetime statistics
 * @returns {Promise<{success: boolean, lifetimeStats: Object}>}
 */
ipcMain.handle('get-lifetime-stats', async () => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    let settings = {};

    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }

    return {
      success: true,
      lifetimeStats: settings.lifetimeStats || { totalCoinsEnriched: 0 }
    };
  } catch (error) {
    log.error('Error getting lifetime stats:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Clear license (for testing or if user wants to remove license)
 * @returns {Promise<{success: boolean}>}
 */
ipcMain.handle('clear-license', async () => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    let settings = {};

    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }

    settings.supporter = {
      isSupporter: false,
      licenseKey: null,
      validatedAt: null,
      customerId: null
    };

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');

    return { success: true };
  } catch (error) {
    log.error('Error clearing license:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Validate an existing license key without creating a new activation
 * Used for periodic re-validation to check if license is still active
 * @returns {Promise<{success: boolean, valid: boolean, status: string, message: string}>}
 */
ipcMain.handle('validate-license', async () => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    let settings = {};

    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }

    const supporter = settings.supporter;
    if (!supporter?.licenseKey || !supporter?.isSupporter) {
      return { success: true, valid: false, message: 'No active license' };
    }

    const { Polar } = require('@polar-sh/sdk');
    const polar = new Polar({ server: POLAR_CONFIG.server });

    const result = await polar.customerPortal.licenseKeys.validate({
      key: supporter.licenseKey,
      organizationId: POLAR_CONFIG.organizationId,
      activationId: supporter.activationId || undefined
    });

    // DEBUG: Log the validate response
    log.debug('[LICENSE DEBUG] Validate response:', JSON.stringify(result, null, 2));

    // Status may be at result.status or result.licenseKey.status depending on endpoint
    const licenseStatus = result?.status || result?.licenseKey?.status;
    log.debug('[LICENSE DEBUG] Validate license status:', licenseStatus);

    if (result && licenseStatus === 'granted') {
      // Update last validation timestamp and reset offline skip
      settings.supporter.validatedAt = new Date().toISOString();
      settings.supporter.offlineSkipUsed = false;
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');

      return {
        success: true,
        valid: true,
        status: licenseStatus,
        message: 'License is valid'
      };
    } else {
      // License was revoked or disabled - clear local license data
      settings.supporter = {
        isSupporter: false,
        licenseKey: null,
        activationId: null,
        licenseKeyId: null,
        deviceLabel: null,
        validatedAt: null,
        customerId: null,
        offlineSkipUsed: false
      };
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');

      return {
        success: true,
        valid: false,
        status: licenseStatus || 'unknown',
        message: `License has been ${licenseStatus || 'invalidated'}`
      };
    }
  } catch (error) {
    log.error('Error validating license:', error);
    return {
      success: false,
      valid: false,
      message: 'Unable to validate license. Please check your internet connection.'
    };
  }
});

/**
 * Deactivate the current license activation (frees up a device slot)
 * @returns {Promise<{success: boolean, message: string}>}
 */
ipcMain.handle('deactivate-license', async () => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    let settings = {};

    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }

    const supporter = settings.supporter;
    if (!supporter?.licenseKey || !supporter?.activationId) {
      return { success: false, message: 'No active license or activation ID to deactivate' };
    }

    const { Polar } = require('@polar-sh/sdk');
    const polar = new Polar({ server: POLAR_CONFIG.server });

    await polar.customerPortal.licenseKeys.deactivate({
      key: supporter.licenseKey,
      organizationId: POLAR_CONFIG.organizationId,
      activationId: supporter.activationId
    });

    // Clear local license data
    settings.supporter = {
      isSupporter: false,
      licenseKey: null,
      activationId: null,
      deviceLabel: null,
      validatedAt: null,
      customerId: null,
      offlineSkipUsed: false
    };
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');

    return {
      success: true,
      message: 'License deactivated successfully. This device slot is now free.'
    };
  } catch (error) {
    log.error('Error deactivating license:', error);

    if (error.statusCode === 404) {
      // Activation not found - clear local data anyway
      const settingsPath = path.join(app.getPath('userData'), 'settings.json');
      let settings = {};
      if (fs.existsSync(settingsPath)) {
        settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      }
      settings.supporter = {
        isSupporter: false,
        licenseKey: null,
        activationId: null,
        deviceLabel: null,
        validatedAt: null,
        customerId: null,
        offlineSkipUsed: false
      };
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
      return { success: true, message: 'License cleared (activation not found on server)' };
    }

    return {
      success: false,
      message: 'Failed to deactivate license: ' + error.message
    };
  }
});

/**
 * Check if a feature is accessible based on the user's license version
 * @param {string} featureName - The feature to check (e.g., 'fastPricing', 'numismaticSync')
 * @returns {Promise<{unlocked: boolean, reason?: string, licenseVersion?: string, requiredVersion?: string, upgradeRequired?: boolean}>}
 */
ipcMain.handle('check-feature-access', async (event, featureName) => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    let settings = {};

    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }

    const supporter = settings.supporter;

    // No license at all - require purchase
    if (!supporter?.isSupporter || !supporter?.licenseKey) {
      return {
        unlocked: false,
        reason: 'no_license',
        upgradeRequired: true
      };
    }

    // Check if feature is unlocked by license version
    const licenseKey = supporter.licenseKey;
    const unlocked = isFeatureUnlocked(licenseKey, featureName);

    if (!unlocked) {
      const licenseVersion = getLicenseVersion(licenseKey);
      const requiredVersion = FEATURE_VERSIONS[featureName];

      return {
        unlocked: false,
        reason: 'version_mismatch',
        licenseVersion: licenseVersion,
        requiredVersion: requiredVersion,
        upgradeRequired: true
      };
    }

    // Feature is unlocked
    return {
      unlocked: true,
      licenseVersion: getLicenseVersion(licenseKey)
    };
  } catch (error) {
    log.error('Error checking feature access:', error);
    return {
      unlocked: false,
      reason: 'error',
      upgradeRequired: false
    };
  }
});

// #endregion Licensing (Polar SDK)

// #region Batch Operations
// =============================================================================
// Fast Pricing Update Handlers
// =============================================================================

// ============================================================================
// IPC HANDLERS - API Cache & Monthly Usage
// ============================================================================

/**
 * Get current monthly API usage and limit
 * @returns {Promise<{success: boolean, usage: Object, limit: number}>}
 */
ipcMain.handle('get-monthly-usage', async () => {
  try {
    const cache = getApiCache();
    // Ensure the active key is set so the UI always shows the count for the current key,
    // even if no API calls have been made this session.
    const apiKey = getApiKey();
    if (apiKey) cache.setActiveKey(apiKey);
    return { success: true, usage: cache.getMonthlyUsage(), limit: cache.getMonthlyLimit() };
  } catch (error) {
    log.error('Error getting monthly usage:', error);
    return { success: false, error: error.message, usage: { total: 0 }, limit: 2000 };
  }
});

/**
 * Set the monthly API call limit
 * @param {number} limit - New monthly limit
 * @returns {Promise<{success: boolean}>}
 */
ipcMain.handle('set-monthly-usage', async (event, limit) => {
  try {
    const cache = getApiCache();
    cache.setMonthlyLimit(limit);
    return { success: true };
  } catch (error) {
    log.error('Error setting monthly limit:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Manually set the total monthly usage (for user correction against Numista dashboard)
 * @param {number} total - New total usage count
 * @returns {Promise<{success: boolean}>}
 */
ipcMain.handle('set-monthly-usage-total', async (event, total) => {
  try {
    const cache = getApiCache();
    const apiKey = getApiKey();
    if (apiKey) cache.setActiveKey(apiKey);
    cache.setMonthlyUsageTotal(total);
    return { success: true };
  } catch (error) {
    log.error('Error setting monthly usage total:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Clear all persistent API cache entries (preserves monthly usage)
 * @returns {Promise<{success: boolean}>}
 */
ipcMain.handle('clear-api-cache', async () => {
  try {
    const cache = getApiCache();
    cache.clear();
    return { success: true };
  } catch (error) {
    log.error('Error clearing API cache:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Export the current log file to a user-chosen location
 * @returns {Promise<{success: boolean, filePath?: string}>}
 */
ipcMain.handle('export-log-file', async () => {
  try {
    const logPath = log.transports.file.getFile().path;
    const date = new Date().toISOString().slice(0, 10);
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: `numisync-wizard-log-${date}.log`,
      filters: [{ name: 'Log Files', extensions: ['log', 'txt'] }]
    });
    if (!result.canceled && result.filePath) {
      fs.copyFileSync(logPath, result.filePath);
      return { success: true, filePath: result.filePath };
    }
    return { success: false };
  } catch (error) {
    log.error('Error exporting log file:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Create a single backup before batch operations
 * This avoids creating multiple backups during batch processing
 * @returns {Promise<{success: boolean, skipped?: boolean, backupPath?: string, error?: string}>}
 */
ipcMain.handle('create-backup-before-batch', async () => {
  try {
    if (!db) throw new Error('No collection loaded');

    const autoBackup = settingsManager ? settingsManager.getAutoBackup() : true;
    if (!autoBackup) {
      return { success: true, skipped: true, message: 'Auto-backup disabled' };
    }

    const backupPath = db.createBackup();
    log.info('Pre-batch backup created:', backupPath);

    const maxBackups = settingsManager ? settingsManager.getMaxBackups() : 5;
    db.pruneOldBackups(maxBackups);

    return { success: true, backupPath };
  } catch (error) {
    log.error('Pre-batch backup error:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Fast pricing update for a single coin (no backup - uses pre-batch backup)
 * @param {Object} params - { coinId, numistaId, issueId }
 * @returns {Promise<{success: boolean, pricesUpdated?: number, noPricing?: boolean, error?: string}>}
 */
ipcMain.handle('fast-pricing-update', async (event, { coinId, numistaId, issueId }) => {
  try {
    if (!db) throw new Error('No collection loaded');

    const apiKey = getApiKey();
    if (!apiKey) throw new Error('API key not configured');

    const api = new NumistaAPI(apiKey, getApiCache(), getCacheTTLs());
    const currency = settingsManager?.getCurrency() || 'USD';

    // Fetch pricing
    const pricingData = await api.getIssuePricing(numistaId, issueId, currency);

    if (progressTracker) progressTracker.incrementSessionCalls(1);

    if (!pricingData?.prices?.length) {
      return { success: true, noPricing: true };
    }

    // Map all 4 price columns using field mapping config (respects user settings)
    // Grades not returned by Numista are written as null, clearing any stale values
    const grades = {};
    pricingData.prices.forEach(p => { grades[p.grade.toLowerCase()] = p.price; });

    const fieldConfig = settingsManager ? settingsManager.buildFieldMapperConfig() : null;
    const priceFields = {};
    for (const field of ['price1', 'price2', 'price3', 'price4']) {
      const cfg = fieldConfig?.[field];
      const gradeKey = cfg?.numistaPath?.split('.').pop()
        || { price1: 'f', price2: 'vf', price3: 'xf', price4: 'unc' }[field];
      priceFields[field] = grades[gradeKey] !== undefined ? grades[gradeKey] : null;
    }

    // Update metadata
    const coin = db.getCoinById(coinId);
    const { userNotes, metadata } = metadataManager.readEnrichmentMetadata(coin?.note || '');

    metadata.pricingData = {
      status: 'MERGED',
      timestamp: new Date().toISOString(),
      issueId,
      currency,
      fieldsMerged: Object.keys(priceFields).filter(k => priceFields[k] !== null),
      lastPrices: grades
    };

    const updatedNote = metadataManager.writeEnrichmentMetadata(userNotes, metadata);

    db.updateCoin(coinId, { ...priceFields, note: updatedNote });

    if (progressTracker && settingsManager) {
      progressTracker.updateCoinInCache(coinId, metadata, settingsManager.getFetchSettings());
    }

    return { success: true, pricesUpdated: Object.keys(priceFields).length };
  } catch (error) {
    log.error('fast-pricing-update error:', error);
    return { success: false, error: error.message };
  }
});

/**
 * IPC Handler: Propagate type data to a coin from batch operation (Task 3.12)
 * Applies type-level data to matching coins, and issue/pricing to true duplicates
 * @param {Object} params - { coinId, numistaData, issueData, pricingData, isDuplicate, sourceNumistaId, issueSkipReason, selectedFields }
 * @returns {Promise<{success: boolean, error?: string}>}
 */
ipcMain.handle('propagate-type-data', async (event, { coinId, numistaData, issueData, pricingData, isDuplicate, sourceNumistaId, issueSkipReason, selectedFields }) => {
  try {
    if (!db) throw new Error('No collection loaded');

    log.info(`[Batch Type] Propagating to coin ${coinId}, isDuplicate: ${isDuplicate}`);

    // Get current coin
    const currentCoin = db.getCoinById(coinId);
    if (!currentCoin) {
      throw new Error(`Coin ${coinId} not found`);
    }

    // Build the type data to apply using the field mapper
    const customMapping = settingsManager ? settingsManager.buildFieldMapperConfig() : null;
    const mapper = new FieldMapper(customMapping);

    // Use the selectedFields from the original merge - only propagate fields the user chose
    // Fall back to empty object if not provided (shouldn't happen with correct flow)
    const userSelection = selectedFields || {};

    // Type-level fields that can be propagated - only include if user selected them
    const typeLevelFields = [
      'title', 'category', 'series', 'country', 'ruler', 'period', 'value', 'unit',
      'material', 'weight', 'diameter', 'thickness', 'shape', 'edge', 'edgelabel',
      'obversedesign', 'obversedesigner', 'obverseengraver', 'obverseimg',
      'reversedesign', 'reversedesigner', 'reverseengraver', 'reverseimg',
      'edgeimg', 'mint', 'catalognum1', 'catalognum2', 'catalognum3', 'catalognum4'
    ];

    const typeFields = {};
    for (const field of typeLevelFields) {
      if (userSelection[field] === true) {
        typeFields[field] = true;
      }
    }

    // For true duplicates, also include issue/pricing fields if user selected them AND data is available
    if (isDuplicate) {
      if (issueData && userSelection.mintage === true) {
        typeFields.mintage = true;
        // Don't overwrite mintmark - it's used for matching, user's data is correct
      }
      if (pricingData) {
        if (userSelection.price1 === true) typeFields.price1 = true;
        if (userSelection.price2 === true) typeFields.price2 = true;
        if (userSelection.price3 === true) typeFields.price3 = true;
        if (userSelection.price4 === true) typeFields.price4 = true;
      }
    }

    // Skip if no fields to propagate (user didn't select any applicable fields)
    if (Object.keys(typeFields).length === 0) {
      log.debug(`[Batch Type] Skipping coin ${coinId} - no selected fields to propagate`);
      return { success: true, skipped: true };
    }

    // Merge fields using the existing mapper (pass coinData for mint resolution fallback)
    const updatedData = mapper.mergeFields(typeFields, numistaData, issueData, pricingData, { mintmark: currentCoin?.mintmark });

    // Read existing metadata and update it
    const currentNote = currentCoin.note || '';
    const { userNotes, metadata: existingMetadata } = metadataManager.readEnrichmentMetadata(currentNote);

    const timestamp = new Date().toISOString();
    const fieldsMerged = Object.keys(typeFields).filter(k => typeFields[k] === true);

    // Build new metadata
    const newMetadata = {
      ...existingMetadata,
      basicData: {
        status: 'MERGED',
        timestamp,
        numistaId: numistaData?.id,
        typePropagatedFrom: sourceNumistaId,
        propagatedAt: timestamp,
        fieldsMerged: fieldsMerged.filter(f => !f.match(/^(mintage|mintmark|price[1-4])$/))
      }
    };

    // Update issue data metadata if true duplicate with issue data
    if (isDuplicate && issueData) {
      newMetadata.issueData = {
        status: 'MERGED',
        timestamp,
        issueId: issueData?.id,
        typePropagatedFrom: sourceNumistaId,
        fieldsMerged: fieldsMerged.filter(f => f.match(/^(mintage|mintmark)$/))
      };
    }

    // Update pricing data metadata if true duplicate with pricing data
    if (isDuplicate && pricingData) {
      newMetadata.pricingData = {
        status: 'MERGED',
        timestamp,
        issueId: issueData?.id,
        currency: settingsManager ? settingsManager.getCurrency() : 'USD',
        typePropagatedFrom: sourceNumistaId,
        fieldsMerged: fieldsMerged.filter(f => f.match(/^price[1-4]$/))
      };
    }

    // Add batch processed tracking (Task 3.12.9: include skip reasons)
    newMetadata.batchProcessed = {
      typeDataApplied: true,
      issueDataApplied: isDuplicate && !!issueData,
      pricingDataApplied: isDuplicate && !!pricingData,
      issueDataSkipped: !isDuplicate || !issueData,
      pricingDataSkipped: !isDuplicate || !pricingData,
      skipReason: issueSkipReason || null,
      processedAt: timestamp
    };

    // Write metadata to note field
    const updatedNote = metadataManager.writeEnrichmentMetadata(userNotes, newMetadata);
    updatedData.note = updatedNote;

    // Update database
    db.updateCoin(coinId, updatedData);

    // Update progress cache
    if (progressTracker && settingsManager) {
      const fetchSettings = settingsManager.getFetchSettings();
      progressTracker.updateCoinInCache(coinId, newMetadata, fetchSettings);
    }

    log.info(`[Batch Type] Successfully propagated to coin ${coinId}`);
    return { success: true };
  } catch (error) {
    log.error('[Batch Type] propagate-type-data error:', error);
    return { success: false, error: error.message };
  }
});

// #endregion Batch Operations

log.info('NumiSync Wizard - Main process started');
