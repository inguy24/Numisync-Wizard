/**
 * Pre-version validation script
 * Runs before npm version to ensure everything is in order
 */

const fs = require('fs');
const path = require('path');

const packageJson = require('../package.json');

console.log('Validating version bump...');

// Check for uncommitted changes (warning only)
const { execSync } = require('child_process');
try {
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  if (status.trim()) {
    console.warn('WARNING: You have uncommitted changes');
    console.warn(status);
  }
} catch (e) {
  console.warn('Could not check git status');
}

// Verify required files exist
const requiredFiles = [
  'src/main/index.js',
  'src/renderer/app.js',
  'package.json',
  'electron-builder.yml'
];

for (const file of requiredFiles) {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: Required file missing: ${file}`);
    process.exit(1);
  }
}

// Verify icon files exist
const iconFiles = [
  'build/icon.ico',
  'build/icon.png'
];

for (const file of iconFiles) {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: Icon file missing: ${file}`);
    process.exit(1);
  }
}

console.log(`Current version: ${packageJson.version}`);
console.log('Validation passed!');
