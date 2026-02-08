/**
 * Auto-update module for NumiSync Wizard
 * Uses electron-updater with GitHub Releases
 */

const { autoUpdater } = require('electron-updater');
const { app, dialog } = require('electron');
const log = require('./logger');

// Configure logging
autoUpdater.logger = log;

// Disable auto-download to give user control
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

/** @type {BrowserWindow|null} */
let mainWindow = null;

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
 */
function checkForUpdatesManually() {
  if (!app.isPackaged) {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Development Mode',
      message: 'Auto-updates are not available in development mode.',
      buttons: ['OK']
    });
    return;
  }

  autoUpdater.checkForUpdates().then(result => {
    if (!result || !result.updateInfo) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'No Updates',
        message: 'You are running the latest version.',
        buttons: ['OK']
      });
    }
  }).catch(err => {
    dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Update Check Failed',
      message: `Could not check for updates: ${err.message}`,
      buttons: ['OK']
    });
  });
}

module.exports = { initAutoUpdater, checkForUpdatesManually };
