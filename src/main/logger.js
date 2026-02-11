/**
 * Centralized Logger Module
 *
 * Configures electron-log v5 for the entire application.
 * All other files import this singleton via require('./logger') or require('../main/logger').
 *
 * Log file location: %APPDATA%/numisync-wizard/logs/numisync-wizard.log
 */
const log = require('electron-log');
const path = require('path');
const fs = require('fs');

// ---------------------------------------------------------------------------
// Read log level from settings.json (synchronous — runs before app is ready)
// ---------------------------------------------------------------------------
let initialLogLevel = 'info';
try {
  // app.getPath('userData') may not be available yet, so build the path manually
  // IMPORTANT: Must match package.json "name" field, NOT electron-builder productName
  const userDataPath = process.env.APPDATA
    ? path.join(process.env.APPDATA, 'numisync-wizard')
    : path.join(require('os').homedir(), '.config', 'numisync-wizard');
  const settingsPath = path.join(userDataPath, 'settings.json');
  if (fs.existsSync(settingsPath)) {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    if (settings.logLevel) {
      initialLogLevel = settings.logLevel;
    }
  }
} catch (_) {
  // Fall back to 'info' if settings can't be read yet
}

// ---------------------------------------------------------------------------
// Configure transports
// ---------------------------------------------------------------------------

// File transport
log.transports.file.level = initialLogLevel;
log.transports.file.maxSize = 5 * 1024 * 1024; // 5 MB
log.transports.file.fileName = 'numisync-wizard.log';
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}';

// Console transport — verbose in dev, disabled in production
const isDev = !require('electron').app.isPackaged;
log.transports.console.level = isDev ? 'debug' : false;

// Capture renderer console.* calls automatically via IPC
log.initialize({ spyRendererConsole: true });

// ---------------------------------------------------------------------------
// Runtime log-level setter (called when user changes setting)
// ---------------------------------------------------------------------------

/**
 * Change the file transport log level at runtime
 * @param {string} level - New log level ('error', 'warn', 'info', 'debug')
 */
function setLogLevel(level) {
  log.transports.file.level = level;
}

module.exports = log;
module.exports.setLogLevel = setLogLevel;
