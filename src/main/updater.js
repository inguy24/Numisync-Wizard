/**
 * Auto-update module for NumiSync Wizard
 * Uses electron-updater with GitHub Releases
 */

const { autoUpdater } = require('electron-updater');
const { app, dialog, ipcMain } = require('electron');
const log = require('./logger');

// Configure logging
autoUpdater.logger = log;

// Disable auto-download to give user control
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

/** @type {BrowserWindow|null} */
let mainWindow = null;

/**
 * Detect if app is running from Microsoft Store
 * @returns {boolean} True if running as MSIX package
 */
function isRunningFromStore() {
  // MSIX packages run from a specific AppX folder structure
  const appPath = app.getAppPath();
  return appPath.includes('\\WindowsApps\\') ||
         appPath.includes('\\AppData\\Local\\Packages\\');
}

/**
 * Compare semantic versions
 * @param {string} v1 - First version
 * @param {string} v2 - Second version
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
 * Fetch release notes for a specific version tag from GitHub
 * @param {string} version - Version string without 'v' prefix (e.g. '1.1.5')
 * @returns {Promise<string>} Release notes markdown, or fallback string
 */
async function fetchVersionReleaseNotes(version) {
  try {
    const https = require('https');
    const options = {
      hostname: 'api.github.com',
      path: `/repos/inguy24/Numisync-Wizard/releases/tags/v${version}`,
      method: 'GET',
      headers: {
        'User-Agent': 'NumiSync-Wizard',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    return new Promise((resolve) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const release = JSON.parse(data);
            resolve(release.body || 'See GitHub for release notes.');
          } catch {
            resolve('See GitHub for release notes.');
          }
        });
      });
      req.on('error', () => resolve('See GitHub for release notes.'));
      req.end();
    });
  } catch {
    return 'See GitHub for release notes.';
  }
}

/**
 * Check GitHub API for latest version (for Store packages)
 * @returns {Promise<Object>} Update info
 */
async function checkGitHubVersion() {
  try {
    const https = require('https');

    const options = {
      hostname: 'api.github.com',
      path: '/repos/inguy24/Numisync-Wizard/releases/latest',
      method: 'GET',
      headers: {
        'User-Agent': 'NumiSync-Wizard',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const latest = JSON.parse(data);
            const latestVersion = latest.tag_name.replace('v', '');
            const currentVersion = app.getVersion();

            // Compare versions
            if (compareVersions(latestVersion, currentVersion) > 0) {
              resolve({
                updateAvailable: true,
                version: latestVersion,
                releaseNotes: latest.body || 'No release notes available.',
                publishedAt: latest.published_at
              });
            } else {
              resolve({ updateAvailable: false });
            }
          } catch (error) {
            log.error('Failed to parse GitHub API response:', error);
            resolve({ updateAvailable: false, error: error.message });
          }
        });
      });

      req.on('error', (error) => {
        log.error('Failed to check GitHub version:', error);
        resolve({ updateAvailable: false, error: error.message });
      });

      req.end();
    });
  } catch (error) {
    log.error('Failed to check GitHub version:', error);
    return { updateAvailable: false, error: error.message };
  }
}

/**
 * Check if app was recently updated and show changelog
 * @async
 */
async function checkIfRecentlyUpdated() {
  try {
    const settings = require('./settings');
    const appSettings = await settings.getAppSettings();
    const lastKnownVersion = appSettings.lastKnownVersion || '0.0.0';
    const currentVersion = app.getVersion();

    if (lastKnownVersion !== currentVersion && lastKnownVersion !== '0.0.0') {
      // App was updated! Fetch release notes for the current version specifically
      const releaseNotes = await fetchVersionReleaseNotes(currentVersion);

      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('show-whats-new', {
          version: currentVersion,
          previousVersion: lastKnownVersion,
          releaseNotes
        });
      }

      // Update stored version
      await settings.updateAppSettings({ lastKnownVersion: currentVersion });
    } else if (lastKnownVersion === '0.0.0') {
      // First launch - just store version
      await settings.updateAppSettings({ lastKnownVersion: currentVersion });
    }
  } catch (error) {
    log.error('Failed to check if recently updated:', error);
  }
}

/**
 * Initialize the auto-updater
 * @param {BrowserWindow} window - The main application window
 */
function initAutoUpdater(window) {
  mainWindow = window;

  // Only run in packaged builds
  if (!app.isPackaged) {
    log.info('Auto-updater disabled in development mode');
    return;
  }

  // If running from Microsoft Store, use GitHub version check instead
  if (isRunningFromStore()) {
    log.info('Running from Microsoft Store - updates handled by Store');

    // Check if app was recently updated (show "What's New")
    setTimeout(() => {
      checkIfRecentlyUpdated().catch(err => {
        log.error('Failed to check if recently updated:', err);
      });
    }, 2000); // 2 second delay

    return;
  }

  // Check if app was recently updated (show "What's New" on first launch after update)
  setTimeout(() => {
    checkIfRecentlyUpdated().catch(err => {
      log.error('Failed to check if recently updated:', err);
    });
  }, 2000);

  // Check for updates after a delay (don't slow down startup)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(err => {
      log.error('Auto-update check failed:', err);
    });
  }, 10000); // 10 second delay

  // Update available
  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `Version ${info.version} is available. Would you like to download it?`,
      detail: 'The update will be downloaded in the background.',
      buttons: ['Download', 'Later'],
      defaultId: 0
    }).then(result => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
        if (mainWindow && mainWindow.webContents) {
          mainWindow.webContents.send('update:download-started');
        }
      }
    });
  });

  // Update not available
  autoUpdater.on('update-not-available', () => {
    log.info('No updates available');
  });

  // Download progress
  autoUpdater.on('download-progress', (progress) => {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('update:progress', {
        percent: progress.percent,
        bytesPerSecond: progress.bytesPerSecond,
        transferred: progress.transferred,
        total: progress.total
      });
    }
  });

  // Update downloaded
  autoUpdater.on('update-downloaded', (info) => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: `Version ${info.version} has been downloaded.`,
      detail: 'The update will be installed when you restart the application.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0
    }).then(result => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall(false, true);
      }
    });
  });

  // Error handling
  autoUpdater.on('error', (err) => {
    log.error('Update error:', err);
  });
}

/**
 * Manually check for updates (triggered from menu)
 * @async
 */
async function checkForUpdatesManually() {
  if (!app.isPackaged) {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Development Mode',
      message: 'Auto-updates are not available in development mode.',
      buttons: ['OK']
    });
    return;
  }

  // If running from Microsoft Store, check GitHub version
  if (isRunningFromStore()) {
    const updateInfo = await checkGitHubVersion();

    if (updateInfo.updateAvailable) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Available',
        message: `Version ${updateInfo.version} is available.`,
        detail: 'Updates install automatically through the Microsoft Store. The update will be applied next time you restart the app.',
        buttons: ['OK']
      });
    } else {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'No Updates Available',
        message: 'You are running the latest version.',
        detail: `Current version: ${app.getVersion()}`,
        buttons: ['OK']
      });
    }
    return;
  }

  // For NSIS version, use electron-updater
  // Register a one-time listener so the "no updates" dialog only shows for manual checks
  const onNotAvailable = () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'No Updates Available',
      message: 'You are running the latest version.',
      detail: `Current version: ${app.getVersion()}`,
      buttons: ['OK']
    });
  };

  autoUpdater.once('update-not-available', onNotAvailable);

  autoUpdater.checkForUpdates().catch(err => {
    autoUpdater.removeListener('update-not-available', onNotAvailable);
    dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Update Check Failed',
      message: `Could not check for updates: ${err.message}`,
      buttons: ['OK']
    });
  });
}

// IPC handler for update info requests
ipcMain.handle('get-update-info', async () => {
  if (isRunningFromStore()) {
    return await checkGitHubVersion();
  }
  // For NSIS version, return electron-updater status
  return { updateAvailable: false, source: 'electron-updater' };
});

module.exports = { initAutoUpdater, checkForUpdatesManually };
