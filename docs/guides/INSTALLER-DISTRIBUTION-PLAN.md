# NumiSync Wizard - Cross-Platform Installer & Distribution Plan

**Created:** February 6, 2026
**Status:** Phase 1 Complete, Phases 2-7 Pending

## Overview

Transform NumiSync Wizard from Windows-only to full cross-platform distribution with **fully automated CI/CD via GitHub Actions**, EULA in installer, auto-updates, and FREE code signing via SignPath Foundation.

---

## CRITICAL: Automated Build Requirement

> **All release builds MUST go through GitHub Actions.**
>
> SignPath Foundation requires that binaries are built on GitHub-hosted runners (not locally).
> This means you cannot build an installer on your local machine and upload it for signing.
> The entire release process is automated through GitHub Actions.

### Development vs Release Builds

| Build Type | Where It Happens | Signed? | Purpose |
|------------|------------------|---------|---------|
| Development | Local machine | No | Testing, debugging |
| Release | GitHub Actions | Yes (Windows) | Distribution to users |

**You can still run `npm run build:win` locally** for testing purposes - it will create an unsigned installer that works fine for development. But any installer you distribute to users must be built through the automated GitHub Actions pipeline.

---

## Key Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Windows installer | NSIS (.exe) | Already configured, better electron-builder support, smaller size |
| Windows code signing | SignPath Foundation (FREE) | No cost, trusted publisher, requires GitHub Actions |
| macOS distribution | Unsigned + manual install docs | Apple Developer costs $99/yr - not worth it for hobby project |
| Linux distribution | AppImage + deb + rpm | Covers all major distros |
| EULA location | Installer (not app) | Better UX, industry standard |
| CI/CD | GitHub Actions (REQUIRED) | Required by SignPath, free for public repos |

---

## Platform Targets

- **Windows:** NSIS installer (x64, ia32) - built on GitHub Actions, signed via SignPath
- **macOS:** Unsigned DMG - built on GitHub Actions
- **Linux:** AppImage + deb + rpm - built on GitHub Actions

---

## Phase 1: Foundation (EULA, Version Scripts, Auto-Update)

### Files to Create

| File | Purpose |
|------|---------|
| `EULA.txt` | Plain text EULA (root of project) |
| `build/eula/eula-windows.rtf` | RTF format for NSIS license screen |
| `build/installer.nsh` | NSIS custom script to create EULA acceptance marker |
| `scripts/validate-version.js` | Pre-build version validation |
| `scripts/post-version.js` | Post-version changelog reminder |
| `src/main/updater.js` | Auto-update module using electron-updater |

### Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Add version scripts, add electron-updater dependency |
| `electron-builder.yml` | EULA integration, NSIS include reference |
| `src/renderer/app.js` | Check for installer EULA marker before showing in-app EULA |
| `src/main/index.js` | Integrate auto-updater, add "Check for Updates" menu item |
| `src/main/preload.js` | Expose update events to renderer |

### EULA Flow

```
Installer runs --> User accepts EULA in installer wizard -->
Installer creates marker file (eula-installer-accepted.marker) -->
App launch checks for marker --> If exists, skip in-app EULA
```

### EULA Extraction Details

The current EULA is embedded in `src/renderer/app.js` as `EULA_CONTENT` constant (lines 62-220+). Extract this to:

1. **EULA.txt** - Plain text version for reference and Linux packages
2. **build/eula/eula-windows.rtf** - RTF formatted version for NSIS installer

The EULA version tracking (`EULA_VERSION = '2.0'`) should remain in app.js to handle:
- Portable installs (no marker) - show in-app EULA
- EULA version changes - re-prompt based on stored version
- Marker deleted - fallback to in-app EULA

### App.js Modification for Installer Marker

Add check in `checkEulaOnStartup()` to look for installer marker file:

```javascript
async function checkEulaOnStartup() {
  // First check for installer-created marker
  const installerMarkerExists = await window.electronAPI.checkInstallerEulaMarker();
  if (installerMarkerExists) {
    // EULA was accepted during installation
    return;
  }

  // Fall back to existing in-app EULA check
  const accepted = await isEulaAccepted();
  if (!accepted) {
    showEulaModal(true);
  }
}
```

---

## Phase 2: Windows Code Signing (SignPath Foundation - FREE)

### What is SignPath Foundation?

- FREE code signing for open source projects
- Certificate issued to "SignPath Foundation" (they appear as publisher)
- Keys stored securely on their HSM
- Integrates directly with GitHub Actions
- No personal ID verification - they verify your code comes from your public repo

### CRITICAL: Build Requirements

> **IMPORTANT:** You can still run `npm run build:win` locally for testing!
> The restriction only applies to **signed releases** that you distribute to users.
> Local builds work fine for development - they just won't be signed.

**For signed releases distributed to users**, SignPath Foundation requires:

1. **All builds MUST happen on GitHub-hosted runners** - SignPath verifies artifacts were actually built by GitHub Actions
2. **Origin metadata comes from GitHub** - Cannot be forged because GitHub provides it, not your build script
3. **Artifacts must be uploaded as GitHub artifacts first** - SignPath downloads from GitHub, signs, and returns
4. **SignPath GitHub App must be installed** on your repository
5. **All team members must use MFA** for GitHub and SignPath access

### How the Signing Flow Works

```
1. Developer pushes tag (v1.0.0)
         |
         v
2. GitHub Actions triggers on tag
         |
         v
3. Build job runs on `windows-latest` (GitHub-hosted runner)
         |
         v
4. electron-builder creates unsigned .exe
         |
         v
5. Upload unsigned artifact to GitHub Artifacts
         |
         v
6. SignPath Action submits signing request with artifact ID
         |
         v
7. SignPath verifies:
   - Build actually happened on GitHub-hosted runner
   - Code matches the public repository
   - Branch/tag matches signing policy
         |
         v
8. Developer approves signing in SignPath dashboard
         |
         v
9. SignPath signs the artifact
         |
         v
10. Signed artifact returned to GitHub Actions
         |
         v
11. Create GitHub Release with signed .exe
```

### Requirements to Qualify

- OSI-approved open source license (MIT - already have this)
- Public GitHub repository (github.com/inguy24/numismat-enrichment)
- Active maintenance with releases
- No proprietary components
- **All builds via GitHub Actions** (no local builds for releases)

### SignPath Application Process

1. **Apply:** Go to [signpath.org](https://signpath.org) and click Apply
2. **Provide:** GitHub repo URL, project description, your role
3. **Wait:** Approval typically takes a few days
4. **Install:** SignPath GitHub App on your repository
5. **Configure:** Set up signing policies (test-signing, release-signing)
6. **Sign:** Each release requires manual approval in SignPath dashboard

### GitHub README Updates Required

Add this section to README.md (REQUIRED by SignPath):

```markdown
## Code Signing Policy

This application is digitally signed for your security.

**Free code signing provided by [SignPath.io](https://signpath.io)**
**Certificate by [SignPath Foundation](https://signpath.org)**

### Project Roles

| Role | Member |
|------|--------|
| Approver | Shane Burkhardt (@inguy24) |
| Committer | Shane Burkhardt (@inguy24) |

### Privacy

This application does not transmit personal information without user consent.
See our [Privacy Policy](#privacy) for details.
```

### GitHub Actions Integration

SignPath provides a GitHub Action that:

1. Builds your app in GitHub Actions
2. Submits artifacts to SignPath for signing
3. You approve the signing request in SignPath dashboard
4. Signed artifacts are returned for release

### GitHub Repository Configuration for SignPath

**Secrets (Settings > Secrets and variables > Actions > Secrets):**

| Secret | Purpose |
|--------|---------|
| `SIGNPATH_API_TOKEN` | API token from SignPath dashboard (keep secret!) |

**Variables (Settings > Secrets and variables > Actions > Variables):**

| Variable | Purpose | Example Value |
|----------|---------|---------------|
| `SIGNPATH_ORGANIZATION_ID` | Your SignPath org ID | `abc123-def456-...` |

**Hardcoded in workflow (not sensitive):**

| Value | Purpose |
|-------|---------|
| `project-slug` | Project name in SignPath | `numisync-wizard` |
| `signing-policy-slug` | Policy name | `release-signing` |

**GitHub App Required:**

You must install the SignPath GitHub App on your repository:
1. Go to SignPath dashboard after approval
2. Navigate to your project settings
3. Click "Install GitHub App"
4. Grant access to `inguy24/numismat-enrichment` repository

---

## Phase 3: GitHub Actions CI/CD

### Workflow Structure

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate version
        run: |
          TAG_VERSION=${GITHUB_REF#refs/tags/v}
          PKG_VERSION=$(node -p "require('./package.json').version")
          if [ "$TAG_VERSION" != "$PKG_VERSION" ]; then
            echo "ERROR: Tag version ($TAG_VERSION) doesn't match package.json ($PKG_VERSION)"
            exit 1
          fi

  build-windows:
    needs: validate
    runs-on: windows-latest  # REQUIRED: Must use GitHub-hosted runner
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Required for SignPath origin verification

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Build Windows (Unsigned)
        run: npm run build:win

      # Upload unsigned artifact (SignPath requires this)
      - name: Upload unsigned artifact
        id: upload-unsigned
        uses: actions/upload-artifact@v4
        with:
          name: windows-unsigned
          path: dist/*.exe
          if-no-files-found: error

      # Submit to SignPath for signing
      - name: Sign with SignPath
        uses: signpath/github-action-submit-signing-request@v2
        with:
          api-token: '${{ secrets.SIGNPATH_API_TOKEN }}'
          organization-id: '${{ vars.SIGNPATH_ORGANIZATION_ID }}'
          project-slug: 'numisync-wizard'
          signing-policy-slug: 'release-signing'
          github-artifact-id: '${{ steps.upload-unsigned.outputs.artifact-id }}'
          wait-for-completion: true
          output-artifact-directory: 'windows-signed'

      # Upload signed artifact for release
      - name: Upload signed artifact
        uses: actions/upload-artifact@v4
        with:
          name: windows-installer
          path: windows-signed/*.exe
          if-no-files-found: error

  build-linux:
    needs: validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - name: Build Linux
        run: npm run build:linux
      - uses: actions/upload-artifact@v4
        with:
          name: linux-packages
          path: |
            dist/*.AppImage
            dist/*.deb
            dist/*.rpm

  build-macos:
    needs: validate
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - name: Build macOS
        run: npm run build:mac
      - uses: actions/upload-artifact@v4
        with:
          name: macos-dmg
          path: dist/*.dmg

  create-release:
    needs: [build-windows, build-linux, build-macos]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
      - name: Create Draft Release
        uses: softprops/action-gh-release@v1
        with:
          draft: true
          generate_release_notes: true
          files: |
            windows-installer/*
            linux-packages/*
            macos-dmg/*
```

### Version Validation

- CI compares git tag version to package.json version
- Build fails if mismatch (prevents accidental version drift)

### Workflow Files to Create

| File | Purpose |
|------|---------|
| `.github/workflows/build.yml` | Main build workflow (triggers on version tags) |
| `.github/workflows/pr-check.yml` | PR validation (optional - lint, test) |

---

## Phase 4: Linux Support

### Files to Create

Create multi-resolution PNG icons from existing `build/icon.png`:

| File | Size |
|------|------|
| `build/icons/16x16.png` | 16x16 pixels |
| `build/icons/32x32.png` | 32x32 pixels |
| `build/icons/48x48.png` | 48x48 pixels |
| `build/icons/64x64.png` | 64x64 pixels |
| `build/icons/128x128.png` | 128x128 pixels |
| `build/icons/256x256.png` | 256x256 pixels |
| `build/icons/512x512.png` | 512x512 pixels |

### Icon Generation Command

Using ImageMagick:

```bash
cd build
mkdir -p icons
for size in 16 32 48 64 128 256 512; do
  convert icon.png -resize ${size}x${size} icons/${size}x${size}.png
done
```

### electron-builder.yml Linux Config

```yaml
linux:
  target:
    - target: AppImage
      arch: [x64]
    - target: deb
      arch: [x64]
    - target: rpm
      arch: [x64]
  icon: build/icons
  category: Utility
  synopsis: Enrich your OpenNumismat collection with Numista data
  description: >
    NumiSync Wizard helps coin collectors enrich their OpenNumismat
    database with pricing and catalog information from Numista.

deb:
  depends:
    - libgtk-3-0
    - libnotify4
    - libnss3
    - libxss1
    - libxtst6
    - xdg-utils
    - libatspi2.0-0
    - libuuid1
    - libsecret-1-0

rpm:
  depends:
    - gtk3
    - libnotify
    - nss
    - libXScrnSaver
    - libXtst
    - xdg-utils
    - at-spi2-core
    - libuuid
```

---

## Phase 5: macOS Support (Unsigned)

### Why No Signing?

- Apple Developer Program costs $99/year
- Not worth it for a hobby project with $10 donations
- Users can still install with a few extra steps

### macOS Icon Creation

Create `build/icon.icns` from existing icon.png. On macOS:

```bash
mkdir icon.iconset
sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset -o icon.icns
rm -rf icon.iconset
```

Alternative: Use online converter like cloudconvert.com

### macOS Installation Instructions

Add to README.md and create `docs/macos-install.md`:

```markdown
## macOS Installation

Since this app is not signed with an Apple Developer certificate,
macOS will block it by default. To install:

### Method 1: Right-Click Open (Recommended)

1. Download the .dmg file
2. Open the .dmg and drag NumiSync Wizard to Applications
3. **Right-click** (or Control-click) the app and select "Open"
4. Click "Open" in the security dialog
5. The app will now run normally

### Method 2: System Preferences

1. Try to open the app normally (it will be blocked)
2. Go to System Preferences -> Security & Privacy -> General
3. Click "Open Anyway" next to the NumiSync Wizard message
4. Click "Open" in the confirmation dialog

This only needs to be done once. After the first launch,
the app will open normally.
```

### electron-builder.yml macOS Config

```yaml
mac:
  target:
    - target: dmg
      arch: [x64, arm64]
  icon: build/icon.icns
  category: public.app-category.utilities
  # No signing - users install manually

dmg:
  contents:
    - x: 130
      y: 220
    - x: 410
      y: 220
      type: link
      path: /Applications
```

---

## Configuration Updates

### package.json Updates

Add/modify these sections:

```json
{
  "scripts": {
    "start": "electron .",
    "dev": "electron . --inspect",
    "build": "electron-builder build --win",
    "build:win": "electron-builder build --win",
    "build:mac": "electron-builder build --mac",
    "build:linux": "electron-builder build --linux",
    "build:all": "electron-builder build --win --mac --linux",
    "build:dir": "electron-builder build --win --dir",
    "build:portable": "electron-builder build --win portable",
    "pack": "electron-builder --dir",
    "dist": "electron-builder",
    "version:patch": "npm version patch",
    "version:minor": "npm version minor",
    "version:major": "npm version major",
    "preversion": "node scripts/validate-version.js",
    "postversion": "node scripts/post-version.js",
    "postinstall": "electron-builder install-app-deps",
    "test": "echo 'Tests not yet configured'"
  },
  "dependencies": {
    "@polar-sh/sdk": "^0.42.5",
    "axios": "^1.13.4",
    "electron": "^28.3.3",
    "electron-updater": "^6.1.7",
    "sql.js": "^1.10.3"
  },
  "devDependencies": {
    "electron-builder": "^24.9.1"
  }
}
```

### electron-builder.yml Full Config

Replace existing config with:

```yaml
# Electron Builder Configuration
# NumiSync Wizard - Cross-Platform Build

appId: com.numisync.wizard
productName: NumiSync Wizard
copyright: Copyright 2026 Shane Burkhardt

directories:
  output: dist
  buildResources: build

files:
  - src/**/*
  - package.json
  - node_modules/**/*
  - "!node_modules/*/{CHANGELOG.md,README.md,readme.md,test,__tests__,tests,*.md}"
  - "!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}"
  - "!**/._*"
  - "!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}"

extraResources:
  - from: swagger.yaml
    to: swagger.yaml
  - from: EULA.txt
    to: EULA.txt

# ============================================
# WINDOWS CONFIGURATION
# ============================================
win:
  target:
    - target: nsis
      arch: [x64, ia32]
  icon: build/icon.ico
  fileAssociations:
    - ext: db
      name: OpenNumismat Collection
      description: OpenNumismat coin collection database
      icon: build/icon.ico

nsis:
  oneClick: false
  perMachine: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: NumiSync Wizard
  uninstallDisplayName: NumiSync Wizard
  license: build/eula/eula-windows.rtf
  include: build/installer.nsh
  installerIcon: build/icon.ico
  uninstallerIcon: build/icon.ico
  installerHeaderIcon: build/icon.ico
  deleteAppDataOnUninstall: false

# ============================================
# MACOS CONFIGURATION (Unsigned)
# ============================================
mac:
  target:
    - target: dmg
      arch: [x64, arm64]
  icon: build/icon.icns
  category: public.app-category.utilities

dmg:
  contents:
    - x: 130
      y: 220
    - x: 410
      y: 220
      type: link
      path: /Applications

# ============================================
# LINUX CONFIGURATION
# ============================================
linux:
  target:
    - target: AppImage
      arch: [x64]
    - target: deb
      arch: [x64]
    - target: rpm
      arch: [x64]
  icon: build/icons
  category: Utility
  synopsis: Enrich your OpenNumismat collection with Numista data
  description: >
    NumiSync Wizard helps coin collectors enrich their OpenNumismat
    database with pricing and catalog information from Numista.

deb:
  depends:
    - libgtk-3-0
    - libnotify4
    - libnss3
    - libxss1
    - libxtst6
    - xdg-utils
    - libatspi2.0-0
    - libuuid1
    - libsecret-1-0

rpm:
  depends:
    - gtk3
    - libnotify
    - nss
    - libXScrnSaver
    - libXtst
    - xdg-utils
    - at-spi2-core
    - libuuid

appImage:
  license: EULA.txt

# ============================================
# AUTO-UPDATE CONFIGURATION
# ============================================
publish:
  - provider: github
    owner: inguy24
    repo: numismat-enrichment
    releaseType: release

# ============================================
# PACKAGING OPTIONS
# ============================================
asar: true
asarUnpack:
  - "**/*.node"
```

---

## Version Scripts

### scripts/validate-version.js

```javascript
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
```

### scripts/post-version.js

```javascript
/**
 * Post-version script
 * Runs after npm version to remind about changelog and next steps
 */

const packageJson = require('../package.json');

console.log('\n========================================');
console.log(`Version bumped to: ${packageJson.version}`);
console.log('========================================\n');

console.log('Next steps:');
console.log('1. Update docs/CHANGELOG.md with release notes');
console.log('2. Review all changes: git diff HEAD~1');
console.log('3. Push with tags: git push && git push --tags');
console.log('4. Wait for GitHub Actions to build');
console.log('5. Approve signing in SignPath dashboard (Windows)');
console.log('6. Review and publish the draft release on GitHub\n');
```

---

## Auto-Update Module

### src/main/updater.js

```javascript
/**
 * Auto-update module for NumiSync Wizard
 * Uses electron-updater with GitHub Releases
 */

const { autoUpdater } = require('electron-updater');
const { app, dialog, ipcMain } = require('electron');

// Configure logging
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

// Disable auto-download to give user control
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow = null;

/**
 * Initialize the auto-updater
 * @param {BrowserWindow} window - The main application window
 */
function initAutoUpdater(window) {
  mainWindow = window;

  // Check for updates after a delay (don't slow down startup)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(err => {
      console.error('Auto-update check failed:', err);
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
        mainWindow.webContents.send('update:download-started');
      }
    });
  });

  // Update not available
  autoUpdater.on('update-not-available', () => {
    console.log('No updates available');
  });

  // Download progress
  autoUpdater.on('download-progress', (progress) => {
    mainWindow.webContents.send('update:progress', {
      percent: progress.percent,
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total
    });
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
    console.error('Update error:', err);
  });
}

/**
 * Manually check for updates (triggered from menu)
 */
function checkForUpdatesManually() {
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

// IPC handler for manual update check
ipcMain.handle('check-for-updates', async () => {
  checkForUpdatesManually();
});

module.exports = { initAutoUpdater, checkForUpdatesManually };
```

---

## NSIS Installer Script

### build/installer.nsh

```nsis
; Custom NSIS script for NumiSync Wizard
; Creates EULA acceptance marker after installation

!macro customInstall
  ; Create EULA acceptance marker file
  FileOpen $0 "$INSTDIR\eula-installer-accepted.marker" w
  FileWrite $0 "EULA accepted during installation$\r$\n"
  FileWrite $0 "Version: ${VERSION}$\r$\n"
  FileWrite $0 "Date: ${__DATE__} ${__TIME__}$\r$\n"
  FileClose $0
!macroend

!macro customUnInstall
  ; Remove EULA marker on uninstall
  Delete "$INSTDIR\eula-installer-accepted.marker"
!macroend
```

---

## Release Workflow

### Step-by-Step Release Process

```bash
# 1. Update CHANGELOG.md with new version notes

# 2. Bump version (creates git tag automatically)
npm version patch   # 1.0.0 -> 1.0.1 (bug fixes)
npm version minor   # 1.0.0 -> 1.1.0 (new features)
npm version major   # 1.0.0 -> 2.0.0 (breaking changes)

# 3. Push with tags (triggers GitHub Actions)
git push && git push --tags
```

### What Happens Automatically

4. **GitHub Actions builds all platforms:**
   - Windows: Builds unsigned .exe, uploads to GitHub Artifacts
   - Linux: Builds AppImage, deb, rpm
   - macOS: Builds unsigned DMG

5. **SignPath signing request submitted** (Windows only):
   - GitHub Action submits the unsigned .exe to SignPath
   - Workflow pauses and waits for approval (timeout: ~10 minutes by default)

### Manual Step Required

6. **Approve signing in SignPath dashboard:**
   - You'll receive email notification from SignPath
   - Go to [app.signpath.io](https://app.signpath.io)
   - Review the signing request (shows commit, branch, artifact hash)
   - Click "Approve" to sign

7. **Workflow resumes:**
   - SignPath returns signed .exe to GitHub Actions
   - Workflow creates draft GitHub Release with all artifacts

8. **Publish the release:**
   - Review the draft release on GitHub
   - Edit release notes if needed
   - Click "Publish release"

### Important Notes

- The GitHub Actions workflow will **wait** for SignPath approval
- If you don't approve within the timeout, the workflow fails (you can re-run)
- Linux and macOS builds complete independently (don't need SignPath)
- You can approve signing from your phone via the SignPath dashboard

---

## GitHub Repository Updates Checklist

### README.md Additions

- [ ] Add "Code Signing Policy" section (required by SignPath)
- [ ] Add "Installation" section with platform-specific instructions
- [ ] Add "macOS Installation" instructions for unsigned app
- [ ] Credit SignPath Foundation

### New Files to Create

- [ ] `.github/workflows/build.yml`
- [ ] `.github/workflows/pr-check.yml` (optional)
- [x] `EULA.txt`
- [x] `build/eula/eula-windows.rtf`
- [x] `build/installer.nsh`
- [ ] `build/icon.icns`
- [ ] `build/icons/16x16.png`
- [ ] `build/icons/32x32.png`
- [ ] `build/icons/48x48.png`
- [ ] `build/icons/64x64.png`
- [ ] `build/icons/128x128.png`
- [ ] `build/icons/256x256.png`
- [ ] `build/icons/512x512.png`
- [x] `scripts/validate-version.js`
- [x] `scripts/post-version.js`
- [x] `src/main/updater.js`
- [ ] `docs/macos-install.md`

### Files to Modify

- [ ] `README.md` (add Code Signing Policy, installation instructions)
- [x] `package.json` (scripts, electron-updater dependency)
- [x] `electron-builder.yml` (EULA/NSIS integration; full cross-platform config pending)
- [x] `src/renderer/app.js` (installer EULA marker check)
- [x] `src/main/index.js` (auto-updater integration, menu item)
- [x] `src/main/preload.js` (expose update events)

### GitHub Settings

- [ ] Add SignPath secrets to repository secrets
- [ ] Enable GitHub Actions for the repository

---

## Verification Checklist

### After Implementation

- [ ] Apply to SignPath Foundation and get approved
- [ ] Add Code Signing Policy to README
- [ ] Windows NSIS build creates installer with EULA screen
- [ ] EULA acceptance creates marker file in install directory
- [ ] App detects installer marker and skips in-app EULA
- [ ] Portable/dev mode shows in-app EULA (no marker)
- [ ] Version validation fails if tag != package.json
- [ ] Auto-updater detects new versions on GitHub Releases
- [ ] GitHub Actions workflow builds all platforms
- [ ] SignPath signs Windows installer successfully
- [ ] Linux AppImage runs on Ubuntu
- [ ] macOS DMG installs with right-click workaround

---

## Implementation Order

> **Note:** GitHub Actions CI/CD is not optional - it's required by SignPath Foundation.
> All release builds must go through the automated pipeline.

### Recommended Sequence

1. **Phase 1** - Foundation (EULA extraction, version scripts, auto-update module) **COMPLETE**
2. **Phase 2** - Apply to SignPath Foundation (do this early - approval takes a few days)
3. **Phase 3** - GitHub Actions CI/CD workflow (REQUIRED - builds all platforms)
4. **Phase 4** - Linux icons and electron-builder config
5. **Phase 5** - macOS config + installation docs
6. **Phase 6** - Update README with Code Signing Policy, Installation instructions
7. **Phase 7** - Test full release workflow end-to-end

### First Release Checklist

Before your first automated release:
- [ ] SignPath Foundation application approved
- [ ] SignPath GitHub App installed on repository
- [ ] GitHub secrets configured (SIGNPATH_API_TOKEN)
- [ ] GitHub variables configured (SIGNPATH_ORGANIZATION_ID)
- [ ] Code Signing Policy added to README
- [ ] GitHub Actions workflow tested with a test tag
- [ ] MFA enabled on GitHub account (required by SignPath)

---

## Cost Summary

| Item | Cost |
|------|------|
| Windows code signing | FREE (SignPath Foundation) |
| macOS code signing | SKIPPED ($99/yr saved) |
| Linux distribution | FREE |
| GitHub Actions | FREE (public repo) |
| **Total** | **$0/year** |

---

## References

- [SignPath Foundation](https://signpath.org/) - Free code signing for OSS
- [SignPath Terms](https://signpath.org/terms.html) - Requirements for OSS projects
- [electron-builder docs](https://www.electron.build/) - Build configuration
- [electron-updater docs](https://www.electron.build/auto-update) - Auto-update
- [GitHub Actions](https://docs.github.com/en/actions) - CI/CD workflows
