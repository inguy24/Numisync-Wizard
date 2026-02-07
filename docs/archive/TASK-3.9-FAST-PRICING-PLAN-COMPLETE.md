# Task 3.9 - Fast Pricing Update Implementation Plan

**Task:** 3.9 - Fast Pricing Update (PREMIUM Feature)
**Priority:** MEDIUM
**Dependencies:** 3.8 (Licensing System - COMPLETE)
**Created:** February 5, 2026

---

## Overview

Implement a premium feature that enables batch pricing updates for coins already matched to Numista types. Users enter "Fast Pricing Mode" where checkboxes appear next to eligible coins, allowing multi-selection and batch processing with rate limiting.

**Key benefit:** Uses only 1 API call per coin (vs 2-4 for full enrichment) since the Numista Type ID and Issue ID are already known from previous enrichment.

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Eligibility | numistaId AND issueId required | Pricing API requires issue ID |
| Mode Entry | Click "Fast Pricing Update" button | Clear user intent, premium gate check |
| Selection Scope | All eligible vs displayed | Users can use filters to narrow, then select displayed |
| Rate Limiting | 1 API call per second | Respect Numista API limits |
| Ineligible Display | Dash with tooltip | Clear visual distinction, explains why |
| Progress Display | Footer status bar (non-modal) | User can scroll/view during batch |
| UI During Batch | Locked (no API actions) | Prevents conflicts, but scroll/view allowed |
| Database Writes | Individual per coin | Simpler, preserves progress on cancel |
| Backup Strategy | Single backup before batch | Avoids multiple backups during batch |

---

## Existing Infrastructure

### Premium Feature Gating (from Task 3.8)

- **PREMIUM_FEATURES config:** `app.js:594-599`
- **requirePremiumFeature():** `app.js:621-705` - Gate function that shows license prompt
- **Fast Pricing button:** `index.html:68-70` - Already exists with lock icon
- **Button state management:** `updateVersionBadge()` in `app.js:3553-3596`

### Metadata Structure (coins eligible for fast pricing)

Coins need BOTH:
- `metadata.basicData.numistaId` - Numista Type ID
- `metadata.basicData.status === 'MERGED'` - Basic data merged
- `metadata.issueData.issueId` - Issue ID (required for pricing lookup)

Metadata location: JSON in HTML comments in OpenNumismat `note` field

### Existing Footer Status Bar

```
index.html lines 441-463:
+---------------------------------------------------------------+
| footer-left          | footer-center      | footer-right      |
| [statusMessage]      | [pagination]       | [fetch settings]  |
+---------------------------------------------------------------+
| [progressBar - full width, hidden by default]                 |
+---------------------------------------------------------------+
```

### Pricing API

- **Endpoint:** `/types/${typeId}/issues/${issueId}/prices`
- **Method:** `getIssuePricing(typeId, issueId, currency)` in `numista-api.js:244-255`
- **Response:** `{ currency: "USD", prices: [{ grade: "f", price: 50 }, ...] }`

### Database & Backup

- **updateCoin():** `opennumismat-db.js:299-339` - Individual SQL UPDATE
- **createBackup():** `opennumismat-db.js:361-378` - Creates timestamped backup
- **Backup triggered:** At IPC handler level, NOT inside updateCoin()

---

## 1. State Management Changes

**File:** [app.js](src/renderer/app.js) (around line 35, after `filterSort`)

Add to `AppState`:
```javascript
// Fast Pricing Mode
fastPricingMode: false,
fastPricingSelected: new Set(),  // coin IDs
fastPricingProgress: {
  running: false,
  total: 0,
  completed: 0,
  succeeded: 0,
  failed: 0,
  cancelled: false,
  uiLocked: false,
  errors: []  // [{coinId, title, error}]
}
```

---

## 2. UI Changes

### 2.1 HTML - Fast Pricing Toolbar

**File:** [index.html](src/renderer/index.html) (after line 180, before coin list)

Insert selection toolbar (hidden by default):
```html
<div id="fastPricingToolbar" class="fast-pricing-toolbar" style="display: none;">
  <div class="fast-pricing-info">
    <span class="fast-pricing-mode-indicator">Fast Pricing Mode</span>
    <span><span id="fpSelectedCount">0</span> selected</span>
    <span class="text-muted">(<span id="fpEligibleCount">0</span> eligible)</span>
  </div>
  <div class="fast-pricing-actions">
    <button id="fpSelectAllEligible" class="btn btn-small">Select All Eligible</button>
    <button id="fpSelectDisplayed" class="btn btn-small">Select Displayed</button>
    <button id="fpSelectNone" class="btn btn-small">Clear</button>
    <button id="fpStartUpdate" class="btn btn-primary btn-small" disabled>
      Update (<span id="fpUpdateCount">0</span>)
    </button>
    <button id="fpCancelUpdate" class="btn btn-danger btn-small" style="display: none;">
      Cancel
    </button>
    <button id="fpExitMode" class="btn btn-secondary btn-small">Exit</button>
  </div>
</div>
```

### 2.2 Progress Display - Footer Status Bar (Non-Modal)

**Use existing footer elements** (index.html lines 441-463):
- `#statusMessage` - Shows: "Updating pricing: 5/20 - Success: 12 Failed: 3"
- `#progressBar` / `#progressFill` - Visual progress bar

### 2.3 Completion Modal

**File:** [index.html](src/renderer/index.html) (after other modals, ~line 480)

```html
<div id="fpCompleteModal" class="modal" style="display: none;">
  <div class="modal-content">
    <div class="modal-header"><h3>Update Complete</h3></div>
    <div class="modal-body">
      <!-- Content populated dynamically by showFpCompleteModal() -->
    </div>
    <div class="modal-footer">
      <button id="fpCompleteOk" class="btn btn-primary">OK</button>
    </div>
  </div>
</div>
```

### 2.4 UI Locking During Batch

**While batch is running, disable these interactions:**
- Coin row clicks (would navigate away)
- Fast Pricing button
- Selection buttons (Select All, Clear, etc.)
- Close Collection button
- Data Settings button
- Filter changes (could cause re-render issues)

**User CAN still:**
- Scroll through coin list
- View real-time status indicators on coin rows
- Use pagination to see other pages
- Click Cancel button in toolbar

### 2.5 CSS Styles

**File:** [main.css](src/renderer/styles/main.css) (at end of file)

```css
/* Fast Pricing Mode */
.fast-pricing-toolbar {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.fast-pricing-mode-indicator {
  font-weight: 600;
  color: var(--primary-color);
  background: rgba(37, 99, 235, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.fast-pricing-info { display: flex; align-items: center; gap: 1rem; }
.fast-pricing-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }

.fast-pricing-checkbox-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  flex-shrink: 0;
}

.fast-pricing-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.fast-pricing-ineligible {
  color: var(--text-secondary);
  cursor: help;
}

.coin-item.fp-ineligible {
  opacity: 0.5;
  background: #f9f9f9;
}

/* Real-time status indicators during batch */
.coin-item.fp-updated {
  background: rgba(34, 197, 94, 0.1);  /* Light green */
  border-left: 3px solid var(--success-color);
}

.coin-item.fp-failed {
  background: rgba(239, 68, 68, 0.1);  /* Light red */
  border-left: 3px solid var(--danger-color);
}

.fp-status-indicator {
  font-size: 1.1em;
  margin-left: 0.5rem;
}

/* UI locking during batch */
.coin-list.fp-batch-running .coin-item {
  pointer-events: none;  /* Disable clicks */
  cursor: default;
}

.coin-list.fp-batch-running .coin-item .fast-pricing-checkbox {
  pointer-events: auto;  /* But keep checkboxes visible (read-only) */
}
```

---

## 3. JavaScript Logic

### 3.1 Eligibility Check

**File:** [app.js](src/renderer/app.js) (new function, ~line 1500)

```javascript
function checkFastPricingEligibility(coin) {
  const status = coin.statusInfo;

  if (!status) {
    return { eligible: false, reason: 'No enrichment data' };
  }

  if (!status.basicData || status.basicData.status !== 'MERGED' || !status.basicData.numistaId) {
    return { eligible: false, reason: 'Needs Numista match first' };
  }

  if (!status.issueData || !status.issueData.issueId) {
    return { eligible: false, reason: 'Needs issue selection', needsIssue: true };
  }

  return {
    eligible: true,
    numistaId: status.basicData.numistaId,
    issueId: status.issueData.issueId
  };
}
```

### 3.2 Enter/Exit Mode

**File:** [app.js](src/renderer/app.js) (new functions)

```javascript
function enterFastPricingMode() {
  AppState.fastPricingMode = true;
  AppState.fastPricingSelected.clear();
  resetFastPricingProgress();

  document.getElementById('fastPricingToolbar').style.display = 'flex';
  document.getElementById('fastPricingBtn').classList.add('btn-active');

  renderCoinList();  // Re-render with checkboxes
  updateFastPricingCounts();
  showStatus('Select coins to update pricing', 'info');
}

function exitFastPricingMode() {
  AppState.fastPricingMode = false;
  AppState.fastPricingSelected.clear();

  document.getElementById('fastPricingToolbar').style.display = 'none';
  document.getElementById('fastPricingBtn').classList.remove('btn-active');

  renderCoinList();
  showStatus('');
}

function resetFastPricingProgress() {
  AppState.fastPricingProgress = {
    running: false,
    total: 0,
    completed: 0,
    succeeded: 0,
    failed: 0,
    cancelled: false,
    uiLocked: false,
    errors: []
  };
}
```

### 3.3 Modify renderCoinList

**File:** [app.js:1351](src/renderer/app.js#L1351) (inside forEach loop, before coinImages)

Insert checkbox cell when in fast pricing mode:
```javascript
if (AppState.fastPricingMode) {
  const checkCell = document.createElement('div');
  checkCell.className = 'fast-pricing-checkbox-cell';

  const elig = checkFastPricingEligibility(coin);
  if (elig.eligible) {
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'fast-pricing-checkbox';
    cb.checked = AppState.fastPricingSelected.has(coin.id);
    cb.addEventListener('change', (e) => {
      e.target.checked ? AppState.fastPricingSelected.add(coin.id)
                       : AppState.fastPricingSelected.delete(coin.id);
      updateFastPricingCounts();
    });
    cb.addEventListener('click', (e) => e.stopPropagation());
    checkCell.appendChild(cb);
  } else {
    const dash = document.createElement('span');
    dash.className = 'fast-pricing-ineligible';
    dash.textContent = '-';
    dash.title = elig.reason;
    checkCell.appendChild(dash);
    coinItem.classList.add('fp-ineligible');
  }
  coinItem.insertBefore(checkCell, coinItem.firstChild);
}
```

### 3.4 Selection & Count Updates

```javascript
function updateFastPricingCounts() {
  const eligibleCount = AppState.allCoins.filter(c => checkFastPricingEligibility(c).eligible).length;
  const selectedCount = AppState.fastPricingSelected.size;

  document.getElementById('fpSelectedCount').textContent = selectedCount;
  document.getElementById('fpEligibleCount').textContent = eligibleCount;
  document.getElementById('fpUpdateCount').textContent = selectedCount;
  document.getElementById('fpStartUpdate').disabled = selectedCount === 0;
}

// Toolbar button handlers
document.getElementById('fpSelectAllEligible').addEventListener('click', () => {
  AppState.allCoins.forEach(c => {
    if (checkFastPricingEligibility(c).eligible) AppState.fastPricingSelected.add(c.id);
  });
  renderCoinList();
  updateFastPricingCounts();
});

document.getElementById('fpSelectDisplayed').addEventListener('click', () => {
  AppState.coins.forEach(c => {
    if (checkFastPricingEligibility(c).eligible) AppState.fastPricingSelected.add(c.id);
  });
  renderCoinList();
  updateFastPricingCounts();
});

document.getElementById('fpSelectNone').addEventListener('click', () => {
  AppState.fastPricingSelected.clear();
  renderCoinList();
  updateFastPricingCounts();
});

document.getElementById('fpExitMode').addEventListener('click', exitFastPricingMode);
```

### 3.5 Confirmation Dialog Before Batch

**Important**: Before starting the batch, show a confirmation dialog with:
- Number of coins to update
- Estimated time (coins x 1 second + overhead)
- Backup notice

```javascript
async function confirmFastPricingUpdate(coinCount) {
  const estimatedSeconds = coinCount + Math.ceil(coinCount * 0.1); // 1s per coin + 10% overhead
  const estimatedTime = formatDuration(estimatedSeconds);

  const confirmed = await showModal(
    'Confirm Pricing Update',
    `<p>Ready to update pricing for <strong>${coinCount} coins</strong>.</p>
     <p><strong>Estimated time:</strong> ${estimatedTime}</p>
     <p><strong>Rate:</strong> 1 API call per second (Numista limit)</p>
     <p>A backup will be created before starting.</p>
     <p style="margin-top: 1rem;">Continue?</p>`,
    true  // showCancel = true
  );

  return confirmed;
}

function formatDuration(seconds) {
  if (seconds < 60) return `~${seconds} seconds`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `~${mins}m ${secs}s` : `~${mins} minutes`;
}
```

### 3.6 Batch Processing with Real-Time Feedback

**Key UX improvements:**
- Deselect coin immediately on success (so interrupted batch can resume)
- Update coin row visually in real-time (green = success, red = failed)
- Show success indicator (checkmark) replacing checkbox
- On cancellation/completion, remaining selected coins are ready for retry

```javascript
async function startFastPricingUpdate() {
  const coins = Array.from(AppState.fastPricingSelected)
    .map(id => AppState.allCoins.find(c => c.id === id))
    .filter(c => c && checkFastPricingEligibility(c).eligible);

  if (coins.length === 0) return;

  // Show confirmation dialog with estimated time
  const confirmed = await confirmFastPricingUpdate(coins.length);
  if (!confirmed) return;

  // Create ONE backup before batch starts
  showStatus('Creating backup...', 'info');
  const backupResult = await window.electronAPI.createBackupBeforeBatch();
  if (!backupResult.success && !backupResult.skipped) {
    const proceed = await showModal(
      'Backup Failed',
      `<p>Could not create backup: ${backupResult.error}</p>
       <p>Continue anyway without backup?</p>`,
      true
    );
    if (!proceed) return;
  }

  resetFastPricingProgress();
  AppState.fastPricingProgress.running = true;
  AppState.fastPricingProgress.total = coins.length;

  // Lock UI and show progress in footer status bar
  lockUIForBatch(true);
  showProgress(true, 0);

  for (let i = 0; i < coins.length; i++) {
    if (AppState.fastPricingProgress.cancelled) break;

    const coin = coins[i];

    // Update footer status bar (not modal)
    const percent = Math.round(((i + 1) / coins.length) * 100);
    const statusText = `Updating pricing: ${i + 1}/${coins.length} - Success: ${AppState.fastPricingProgress.succeeded} Failed: ${AppState.fastPricingProgress.failed}`;
    showStatus(statusText);
    showProgress(true, percent);

    let success = false;
    try {
      const elig = checkFastPricingEligibility(coin);
      const result = await window.electronAPI.fastPricingUpdate({
        coinId: coin.id,
        numistaId: elig.numistaId,
        issueId: elig.issueId
      });

      if (result.success) {
        success = true;
        AppState.fastPricingProgress.succeeded++;
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      AppState.fastPricingProgress.failed++;
      AppState.fastPricingProgress.errors.push({
        coinId: coin.id, title: coin.title, error: err.message
      });
    }

    AppState.fastPricingProgress.completed++;

    // Update coin row in real-time
    updateCoinRowStatus(coin.id, success);

    // If successful, deselect so it won't be re-processed on resume
    if (success) {
      AppState.fastPricingSelected.delete(coin.id);
    }

    updateFastPricingCounts();

    // Rate limit: 1 second between calls
    if (i < coins.length - 1 && !AppState.fastPricingProgress.cancelled) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  AppState.fastPricingProgress.running = false;
  lockUIForBatch(false);
  showProgress(false);

  // Show appropriate completion message
  showFpCompleteModal(AppState.fastPricingProgress.cancelled);

  // Refresh coin list to get updated pricing data
  await loadCoins();
  renderCoinList();
}

/**
 * Update a single coin row with success/failure indicator
 * Called in real-time during batch processing
 */
function updateCoinRowStatus(coinId, success) {
  const coinRow = document.querySelector(`.coin-item[data-coin-id="${coinId}"]`);
  if (!coinRow) return;

  // Remove checkbox cell, add status indicator
  const checkCell = coinRow.querySelector('.fast-pricing-checkbox-cell');
  if (checkCell) {
    checkCell.innerHTML = success
      ? '<span class="fp-status-indicator" title="Updated">&#x2705;</span>'
      : '<span class="fp-status-indicator" title="Failed">&#x274C;</span>';
  }

  // Add visual styling to row
  coinRow.classList.remove('fp-updated', 'fp-failed');
  coinRow.classList.add(success ? 'fp-updated' : 'fp-failed');
}

/**
 * Show completion modal with results
 * @param {boolean} wasCancelled - True if user cancelled the batch
 */
function showFpCompleteModal(wasCancelled = false) {
  const progress = AppState.fastPricingProgress;
  const remaining = AppState.fastPricingSelected.size;

  const title = wasCancelled ? 'Update Cancelled' : 'Update Complete';

  let body = `
    <p><strong>Processed:</strong> ${progress.completed} of ${progress.total}</p>
    <p class="text-success"><strong>Succeeded:</strong> ${progress.succeeded}</p>
    <p class="text-danger"><strong>Failed:</strong> ${progress.failed}</p>
  `;

  if (wasCancelled && remaining > 0) {
    body += `<p style="margin-top: 1rem;"><strong>${remaining} coins</strong> still selected - click "Update" to continue.</p>`;
  }

  if (progress.errors.length > 0) {
    body += `<div class="error-list" style="margin-top: 1rem;">
      <h4>Errors:</h4>
      <ul>${progress.errors.map(e => `<li><strong>${e.title}</strong>: ${e.error}</li>`).join('')}</ul>
    </div>`;
  }

  document.getElementById('fpCompleteModal').querySelector('.modal-header h3').textContent = title;
  document.getElementById('fpCompleteModal').querySelector('.modal-body').innerHTML = body;
  document.getElementById('fpCompleteModal').style.display = 'flex';
}
```

### 3.7 UI Locking Functions

```javascript
/**
 * Lock/unlock UI during batch processing
 * User can scroll and view but cannot trigger other actions
 */
function lockUIForBatch(locked) {
  // Store lock state
  AppState.fastPricingProgress.uiLocked = locked;

  // Toggle button states
  const buttons = [
    'fastPricingBtn',
    'fpSelectAllEligible',
    'fpSelectDisplayed',
    'fpSelectNone',
    'fpStartUpdate',
    'fpExitMode',
    'closeCollectionBtn',
    'dataSettingsBtn'
  ];

  buttons.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.disabled = locked;
  });

  // Show/hide cancel button
  const cancelBtn = document.getElementById('fpCancelUpdate');
  if (cancelBtn) {
    cancelBtn.style.display = locked ? 'inline-block' : 'none';
  }

  // Disable filter dropdowns
  ['statusFilter', 'freshnessFilter', 'sortBy'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = locked;
  });

  // Add/remove class to coin list to disable clicks
  const coinList = document.getElementById('coinList');
  if (coinList) {
    coinList.classList.toggle('fp-batch-running', locked);
  }
}

// Cancel button handler
document.getElementById('fpCancelUpdate').addEventListener('click', () => {
  AppState.fastPricingProgress.cancelled = true;
  showStatus('Cancelling after current coin...', 'warning');
});
```

### 3.8 Update fastPricingBtn Handler

**File:** [app.js:2939](src/renderer/app.js#L2939) (existing handler)

Replace the existing handler:
```javascript
document.getElementById('fastPricingBtn').addEventListener('click', async () => {
  const canUse = await requirePremiumFeature('fast-pricing');
  if (!canUse) return;

  if (AppState.fastPricingMode) {
    exitFastPricingMode();
  } else {
    enterFastPricingMode();
  }
});
```

---

## 4. Backend Changes

### 4.1 Backup Handler for Batch Operations

**File:** [index.js](src/main/index.js) (new IPC handler)

```javascript
/**
 * Create a single backup before batch operations
 * This avoids creating multiple backups during batch processing
 */
ipcMain.handle('create-backup-before-batch', async () => {
  try {
    if (!db) throw new Error('No collection loaded');

    const autoBackup = settingsManager ? settingsManager.getAutoBackup() : true;
    if (!autoBackup) {
      return { success: true, skipped: true, message: 'Auto-backup disabled' };
    }

    const backupPath = db.createBackup();
    console.log('Pre-batch backup created:', backupPath);

    // Prune old backups
    const maxBackups = settingsManager ? settingsManager.getMaxBackups() : 5;
    db.pruneOldBackups(maxBackups);

    return { success: true, backupPath };
  } catch (error) {
    console.error('Pre-batch backup error:', error);
    return { success: false, error: error.message };
  }
});
```

### 4.2 Fast Pricing Update Handler (NO backup - uses pre-batch backup)

**File:** [index.js](src/main/index.js) (after other IPC handlers)

```javascript
ipcMain.handle('fast-pricing-update', async (event, { coinId, numistaId, issueId }) => {
  try {
    if (!db) throw new Error('No collection loaded');

    const apiKey = getApiKey();
    if (!apiKey) throw new Error('API key not configured');

    const api = new NumistaAPI(apiKey);
    const currency = settingsManager?.getCurrency() || 'USD';

    // Fetch pricing
    const pricingData = await api.getIssuePricing(numistaId, issueId, currency);

    if (progressTracker) progressTracker.incrementSessionCalls(1);

    if (!pricingData?.prices?.length) {
      return { success: true, noPricing: true };
    }

    // Map to price fields
    const grades = {};
    pricingData.prices.forEach(p => grades[p.grade.toLowerCase()] = p.price);

    const priceFields = {};
    if (grades.f !== undefined) priceFields.price1 = grades.f;
    if (grades.vf !== undefined) priceFields.price2 = grades.vf;
    if (grades.xf !== undefined) priceFields.price3 = grades.xf;
    if (grades.unc !== undefined) priceFields.price4 = grades.unc;

    // Update metadata
    const coin = db.getCoinById(coinId);
    const { userNotes, metadata } = metadataManager.readEnrichmentMetadata(coin?.note || '');

    metadata.pricingData = {
      status: 'MERGED',
      timestamp: new Date().toISOString(),
      issueId,
      currency,
      fieldsMerged: Object.keys(priceFields),
      lastPrices: grades
    };

    const updatedNote = metadataManager.writeEnrichmentMetadata(userNotes, metadata);

    db.updateCoin(coinId, { ...priceFields, note: updatedNote });

    if (progressTracker && settingsManager) {
      progressTracker.updateCoinInCache(coinId, metadata, settingsManager.getFetchSettings());
    }

    return { success: true, pricesUpdated: Object.keys(priceFields).length };
  } catch (error) {
    console.error('fast-pricing-update error:', error);
    return { success: false, error: error.message };
  }
});
```

### 4.3 Preload Bridge

**File:** [preload.js](src/main/preload.js) (in apiMethods object)

```javascript
createBackupBeforeBatch: () => ipcRenderer.invoke('create-backup-before-batch'),
fastPricingUpdate: (data) => ipcRenderer.invoke('fast-pricing-update', data),
```

---

## 5. Files Summary

| File | Changes |
|------|---------|
| [src/renderer/app.js](src/renderer/app.js) | AppState, eligibility check, mode enter/exit, renderCoinList checkbox, selection handlers, batch processing, UI locking |
| [src/renderer/index.html](src/renderer/index.html) | Toolbar HTML, completion modal |
| [src/renderer/styles/main.css](src/renderer/styles/main.css) | Toolbar, checkbox, ineligible, status indicator, UI locking styles |
| [src/main/index.js](src/main/index.js) | `create-backup-before-batch` and `fast-pricing-update` IPC handlers |
| [src/main/preload.js](src/main/preload.js) | `createBackupBeforeBatch` and `fastPricingUpdate` API methods |

---

## 6. Verification Checklist

### Premium Gate
- [ ] Free users see locked button with lock icon
- [ ] Clicking shows license prompt modal
- [ ] Supporters can enter fast pricing mode

### Mode Entry/Exit
- [ ] Toolbar appears when entering mode
- [ ] Checkboxes appear next to eligible coins only
- [ ] Ineligible coins show dash with tooltip explaining why
- [ ] Toolbar hides on exit
- [ ] Checkboxes removed on exit

### Selection
- [ ] Individual checkbox works
- [ ] "Select All Eligible" selects across entire collection
- [ ] "Select Displayed" respects current filter/page
- [ ] "Clear" clears all
- [ ] Counts update correctly

### Confirmation & Backup
- [ ] Confirmation dialog shows coin count and estimated time
- [ ] Time estimate is reasonable (coins x 1 second)
- [ ] Single backup created before batch starts
- [ ] Backup failure prompts "continue anyway?" option
- [ ] No additional backups created during batch

### Batch Processing & Real-Time Feedback
- [ ] **Footer status bar** shows: "Updating pricing: 5/20 - Success: 12 Failed: 3"
- [ ] **Footer progress bar** updates with percentage
- [ ] 1-second delay between API calls observed
- [ ] **Coin row shows checkmark on success**
- [ ] **Coin row shows X on failure**
- [ ] **Successful coins are deselected immediately**
- [ ] **Failed coins remain selected for retry**
- [ ] **User can scroll coin list during batch**
- [ ] **User can paginate during batch**
- [ ] Cancel button appears in toolbar during batch
- [ ] Cancel button stops processing after current coin
- [ ] Completion modal shows "Update Complete" or "Update Cancelled"
- [ ] Cancelled modal shows remaining selected count
- [ ] Error details listed in completion modal

### UI Locking During Batch
- [ ] Coin clicks disabled (cannot navigate to match screen)
- [ ] Selection buttons disabled
- [ ] Exit Mode button disabled
- [ ] Fast Pricing button disabled
- [ ] Data Settings button disabled
- [ ] Close Collection button disabled
- [ ] Filter dropdowns disabled
- [ ] All re-enabled when batch completes/cancels

### Data Persistence
- [ ] Price fields updated in database
- [ ] Metadata pricingData section updated
- [ ] Pricing freshness shows as "current" after update
- [ ] Coin list refreshes to show updated icons

### Error Handling
- [ ] Network errors don't crash batch
- [ ] Errors listed in completion modal
- [ ] Successful updates persist despite later failures
