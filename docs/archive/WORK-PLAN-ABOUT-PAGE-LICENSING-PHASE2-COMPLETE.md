# Task 2.6: About Page and Licensing Implementation Plan

**Status:** READY FOR IMPLEMENTATION
**Created:** February 3, 2026
**Updated:** February 3, 2026 - Finalized all decisions

## Summary
Implement a **separate About window** with version info, author credit, GitHub link, update notifications, and a licensing/supporter system using **Polar** as the merchant of record.

---

## Configuration (FINALIZED)

| Setting | Value |
|---------|-------|
| GitHub Repo | `inguy24/numismat-enrichment` |
| Payment Platform | **Polar** |
| Author Name | Shane Burkhardt |
| Initial Prompt | After **20 coins** enriched |
| Recurring Prompt | Every **50 coins** after initial (20, 70, 120, 170...) |
| Time Saved Estimate | 2 minutes per coin |
| About Window Trigger | Help menu **AND** Settings link |
| Premium Feature UX | Show with "Premium" badge (not hidden) |

---

## Why Polar?

- Cheapest MoR fees (4% + $0.40 vs 5% + $0.50)
- Lowest payout threshold ($10-15) - ideal for low-volume "coffee fund" revenue
- "Pay What You Want" pricing - set minimum, let users pay more
- Built-in license keys with activation limits, device tracking
- Public validation API safe for desktop apps (no secrets needed)
- Customer self-service portal for managing activations

---

## Architecture Changes

### New: Separate About Window

The About page will be a **separate Electron BrowserWindow** (not a modal), containing:

1. **App Info**
   - App name: "Numismat Enrichment Tool"
   - Version (dynamic from package.json)
   - Author: "By Shane Burkhardt"

2. **Links**
   - GitHub repository (for issues, updates, source code)
   - View EULA link
   - Purchase/Get License link (Polar checkout)

3. **Update Section**
   - "Check for Updates" button
   - Status text showing current/latest version
   - Download link when update available

4. **License Section**
   - Supporter badge (shown when licensed)
   - "Get License" button (when unlicensed)
   - "Enter License Key" field + Validate button
   - Lifetime stats: "X coins enriched, Y hours saved"

5. **Attribution**
   - Numista credit (existing text)

### New: Premium Feature Flag System

Standard pattern for marking features as premium:

```javascript
// Configuration object for all premium features
const PREMIUM_FEATURES = {
  'batch-pricing': {
    name: 'Batch Pricing Updates',
    description: 'Update pricing for multiple coins at once'
  },
  'advanced-export': {
    name: 'Advanced Export',
    description: 'Export to additional formats with custom templates'
  }
  // Future features added here
};

// Gate function used throughout codebase
async function requireLicense(featureId) {
  const status = await window.electronAPI.getSupporterStatus();
  if (status.isSupporter) return true;

  const feature = PREMIUM_FEATURES[featureId];
  showPremiumFeaturePrompt(feature);
  return false;
}

// Usage in feature code
async function handleBatchPricing() {
  if (!await requireLicense('batch-pricing')) return;
  // ... proceed with feature
}
```

**Premium Badge UI**: Features show normally but with a small "Premium" badge. Clicking triggers the license prompt modal.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/main/index.js` | Add About window creation, 8 new IPC handlers, Help menu |
| `src/main/preload.js` | Expose 8 new API methods |
| `src/renderer/index.html` | Update Settings About link, add license prompt modal |
| `src/renderer/app.js` | Add license logic, premium feature config, prompt handlers |
| `src/renderer/styles/main.css` | Styling for premium badges, license prompt modal |
| **NEW** `src/renderer/about.html` | Separate About window HTML |
| **NEW** `src/renderer/about.js` | About window JavaScript |
| **NEW** `src/renderer/styles/about.css` | About window styles |

---

## Implementation Steps

### Step 1: About Window (Main Process)

In `index.js`, add:

```javascript
let aboutWindow = null;

function createAboutWindow() {
  if (aboutWindow) {
    aboutWindow.focus();
    return;
  }

  aboutWindow = new BrowserWindow({
    width: 500,
    height: 600,
    parent: mainWindow,
    modal: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  aboutWindow.loadFile(path.join(__dirname, '../renderer/about.html'));
  aboutWindow.setMenu(null);

  aboutWindow.on('closed', () => {
    aboutWindow = null;
  });
}

// IPC handler
ipcMain.handle('open-about-window', () => createAboutWindow());
```

### Step 2: Application Menu with Help

Add native menu bar with Help > About:

```javascript
const { Menu } = require('electron');

const menuTemplate = [
  {
    label: 'Help',
    submenu: [
      {
        label: 'About',
        click: () => createAboutWindow()
      },
      {
        label: 'View on GitHub',
        click: () => shell.openExternal('https://github.com/inguy24/numismat-enrichment')
      }
    ]
  }
];

// In createWindow() or app.whenReady():
Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
```

### Step 3: IPC Handlers

Add to `index.js`:

1. **`get-app-version`** - Returns version from package.json
2. **`check-for-updates`** - GitHub Releases API check
3. **`get-supporter-status`** - Returns supporter object from settings
4. **`set-supporter-status`** - Updates supporter object
5. **`validate-license-key`** - Calls Polar validation API (Phase B: implement actual validation)
6. **`get-lifetime-stats`** - Returns lifetime enrichment count
7. **`increment-lifetime-enrichments`** - Increments count after merge
8. **`open-about-window`** - Opens the About window

### Step 4: Settings Schema

Add to `settings.json`:

```javascript
{
  supporter: {
    isSupporter: false,
    licenseKey: null,
    supportedAt: null,
    neverAskAgain: false
  },
  updateCheck: {
    enabled: true,
    lastChecked: null,
    dismissedVersion: null
  },
  lifetimeStats: {
    totalCoinsEnriched: 0
  }
}
```

### Step 5: About Window HTML (`about.html`)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>About Numismat Enrichment</title>
  <link rel="stylesheet" href="styles/about.css">
</head>
<body>
  <div class="about-container">
    <div class="app-header">
      <img src="assets/icon.png" class="app-icon" alt="App Icon">
      <h1>Numismat Enrichment Tool</h1>
      <p class="version">Version <span id="appVersion">1.0.0</span></p>
      <p class="author">By Shane Burkhardt</p>
    </div>

    <div class="links-section">
      <a href="#" id="githubLink">GitHub Repository</a>
      <a href="#" id="eulaLink">View EULA</a>
    </div>

    <div class="update-section">
      <button id="checkUpdatesBtn">Check for Updates</button>
      <p id="updateStatus"></p>
    </div>

    <div class="license-section">
      <div id="supporterBadge" class="supporter-badge" style="display:none;">
        Licensed
      </div>
      <div id="unlicensedSection">
        <button id="getLicenseBtn" class="btn-primary">Get a License</button>
        <div class="license-input">
          <input type="text" id="licenseKeyInput" placeholder="Enter license key">
          <button id="validateKeyBtn">Validate</button>
        </div>
      </div>
      <div class="stats">
        <p><span id="coinsEnriched">0</span> coins enriched</p>
        <p><span id="timeSaved">0</span> saved</p>
      </div>
    </div>

    <div class="attribution">
      <p>Coin data provided by <a href="#" id="numistaLink">Numista</a></p>
    </div>
  </div>
  <script src="about.js"></script>
</body>
</html>
```

### Step 6: License Prompt Modal (in main `index.html`)

Add modal for soft prompts when threshold reached:

```html
<div id="licensePromptModal" class="modal" style="display: none;">
  <div class="modal-content">
    <div class="modal-header">
      <h3>You're Making Great Progress!</h3>
    </div>
    <div class="modal-body">
      <div class="license-stats">
        <div class="big-number" id="promptCoinsCount">20</div>
        <div class="stat-label">coins enriched</div>
        <div class="time-saved" id="promptTimeSaved">40 minutes saved</div>
      </div>
      <p>Based on ~2 minutes of manual research per coin</p>
      <p><strong>License holders unlock:</strong></p>
      <ul>
        <li>No more prompts</li>
        <li>Premium features like batch pricing</li>
        <li>Support continued development</li>
      </ul>
    </div>
    <div class="modal-footer">
      <button id="promptGetLicenseBtn" class="btn btn-primary">Get a License</button>
      <button id="promptEnterKeyBtn" class="btn btn-secondary">I Have a Key</button>
      <div class="prompt-footer-links">
        <a href="#" id="promptMaybeLater">Maybe Later</a> |
        <a href="#" id="promptNeverAsk">Don't Ask Again</a>
      </div>
    </div>
  </div>
</div>
```

### Step 7: Premium Feature Config & Gate (in `app.js`)

```javascript
const LICENSE_CONFIG = {
  INITIAL_PROMPT_THRESHOLD: 20,
  RECURRING_PROMPT_INTERVAL: 50,
  TIME_SAVED_MINUTES_PER_COIN: 2,
  PURCHASE_URL: 'https://polar.sh/inguy24/numismat-enrichment',  // Update with actual Polar URL
  GITHUB_REPO: 'inguy24/numismat-enrichment'
};

const PREMIUM_FEATURES = {
  'batch-pricing': {
    name: 'Batch Pricing Updates',
    description: 'Update pricing for multiple coins at once'
  }
  // Add future premium features here
};

async function requireLicense(featureId) {
  const status = await window.electronAPI.getSupporterStatus();
  if (status.isSupporter) return true;

  const feature = PREMIUM_FEATURES[featureId];
  if (feature) {
    await showModal('Premium Feature',
      `<p><strong>${feature.name}</strong> is available to license holders.</p>
       <p>${feature.description}</p>`
    );
  }

  const stats = await window.electronAPI.getLifetimeStats();
  showLicensePromptModal(stats.totalCoinsEnriched);
  return false;
}
```

### Step 8: License Prompt Logic

```javascript
async function checkLicensePrompt(mergedCount = 1) {
  const status = await window.electronAPI.getSupporterStatus();
  if (status.isSupporter || status.neverAskAgain) return;

  await window.electronAPI.incrementLifetimeEnrichments(mergedCount);
  const stats = await window.electronAPI.getLifetimeStats();
  const count = stats.totalCoinsEnriched;

  // Initial prompt at 20, then every 50 (70, 120, 170...)
  const shouldPrompt =
    count === 20 ||
    (count > 20 && (count - 20) % 50 === 0);

  if (shouldPrompt) {
    showLicensePromptModal(count);
  }
}
```

### Step 9: Update Settings About Link

Change the existing About section in Settings to just a link:

```html
<div class="setting-group">
  <h3>About & Legal</h3>
  <p><a href="#" id="openAboutWindowLink">Open About Window</a></p>
  <p><a href="#" id="viewEulaLink">View End User License Agreement</a></p>
</div>
```

### Step 10: Premium Badge CSS

```css
.premium-badge {
  display: inline-block;
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: #333;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 3px;
  margin-left: 8px;
  text-transform: uppercase;
}

.premium-feature-locked {
  opacity: 0.7;
  cursor: pointer;
}
```

---

## Prompt Logic Summary

```
After each successful merge:
  1. Check if licensed (isSupporter === true) -> Skip
  2. Check if opted out (neverAskAgain === true) -> Skip
  3. Increment lifetime count
  4. If count === 20 -> Show prompt
  5. If count > 20 && (count - 20) % 50 === 0 -> Show prompt
```

---

## Verification Plan

1. **About Window**: Help > About opens separate window with all info
2. **Settings Link**: "Open About Window" link in Settings also opens it
3. **Version Display**: Version matches package.json
4. **Author Display**: Shows "By Shane Burkhardt"
5. **GitHub Link**: Opens browser to repo
6. **Update Check**: Calls GitHub API, shows result
7. **Get License Button**: Opens Polar checkout URL
8. **License Key Field**: Validates via Polar API (placeholder for Phase B)
9. **Initial Prompt at 20**: Merge 20 coins, verify modal appears
10. **Recurring Prompt at 70**: Continue to 70 coins, verify modal
11. **Don't Ask Again**: Click option, verify no more prompts
12. **Licensed Badge**: Set isSupporter=true, verify badge and no prompts
13. **Premium Badge**: Features show badge when unlicensed, gated on click

---

## Phase B (Future - License Key Backend)

After Phase A UI is complete:

1. Create Polar account and product
2. Configure "Pay What You Want" pricing (minimum ~$5-10)
3. Enable license key generation with activation limits
4. Update `validate-license-key` to call Polar's public API
5. Update `LICENSE_CONFIG.PURCHASE_URL` with actual checkout URL
6. Test full flow: purchase -> email with key -> enter in app -> validated

---

## Research Links

### Platform Documentation
- [Polar Pricing](https://polar.sh/resources/pricing)
- [Polar License Keys](https://polar.sh/docs/features/benefits/license-keys)
- [Polar Payouts](https://polar.sh/docs/features/finance/payouts)
