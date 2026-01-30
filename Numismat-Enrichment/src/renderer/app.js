/**
 * Numismat Enrichment Tool - Main Application
 * Handles all UI interactions and coordinates with backend
 */

// =============================================================================
// Application State
// =============================================================================

const AppState = {
  currentScreen: 'welcome',
  collectionPath: null,
  collection: null,
  coins: [],
  currentCoin: null,
  currentMatches: [],
  selectedMatch: null,
  fieldComparison: null,
  selectedFields: {},
  settings: null,
  progressStats: null
};

// =============================================================================
// Screen Navigation
// =============================================================================

function showScreen(screenName) {
  // Hide all screens
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });

  // Show requested screen
  const screen = document.getElementById(`${screenName}Screen`);
  if (screen) {
    screen.classList.add('active');
    AppState.currentScreen = screenName;
  }
}

// =============================================================================
// Status & Progress Display
// =============================================================================

function showStatus(message, type = 'info') {
  const statusEl = document.getElementById('statusMessage');
  statusEl.textContent = message;
  statusEl.className = `status-message status-${type}`;
}

function showProgress(visible, percent = 0) {
  const progressBar = document.getElementById('progressBar');
  const progressFill = document.getElementById('progressFill');
  
  if (visible) {
    progressBar.style.display = 'block';
    progressFill.style.width = `${percent}%`;
  } else {
    progressBar.style.display = 'none';
  }
}

function showModal(title, body, showCancel = false) {
  return new Promise((resolve) => {
    const modal = document.getElementById('modal');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = body;
    
    const cancelBtn = document.getElementById('modalCancel');
    cancelBtn.style.display = showCancel ? 'block' : 'none';
    
    modal.style.display = 'flex';

    const okHandler = () => {
      modal.style.display = 'none';
      resolve(true);
      cleanup();
    };

    const cancelHandler = () => {
      modal.style.display = 'none';
      resolve(false);
      cleanup();
    };

    const cleanup = () => {
      document.getElementById('modalOk').removeEventListener('click', okHandler);
      document.getElementById('modalCancel').removeEventListener('click', cancelHandler);
      document.getElementById('modalClose').removeEventListener('click', cancelHandler);
    };

    document.getElementById('modalOk').addEventListener('click', okHandler);
    document.getElementById('modalCancel').addEventListener('click', cancelHandler);
    document.getElementById('modalClose').addEventListener('click', cancelHandler);
  });
}

// =============================================================================
// Collection Loading
// =============================================================================

document.getElementById('loadCollectionBtn').addEventListener('click', async () => {
  try {
    showStatus('Selecting collection file...');
    
    const filePath = await window.electronAPI.selectCollectionFile();
    
    if (!filePath) {
      showStatus('No file selected');
      return;
    }

    showProgress(true, 30);
    showStatus('Loading collection...');

    const result = await window.electronAPI.loadCollection(filePath);

    if (!result.success) {
      throw new Error(result.error);
    }

    AppState.collectionPath = result.filePath;
    AppState.collection = result.summary;
    AppState.progressStats = result.progress.statistics;

    showProgress(true, 100);
    showStatus(`Loaded collection: ${result.filePath}`);

    // Update UI with collection info
    await loadCollectionScreen();

    setTimeout(() => {
      showProgress(false);
      showScreen('collection');
    }, 500);

  } catch (error) {
    showProgress(false);
    showStatus(`Error loading collection: ${error.message}`, 'error');
    showModal('Error', `Failed to load collection:<br>${error.message}`);
  }
});

async function loadCollectionScreen() {
  // Update title
  const filename = AppState.collectionPath.split(/[\\/]/).pop();
  document.getElementById('collectionTitle').textContent = filename;

  // Update statistics
  updateProgressStats();

  // Load coins
  await loadCoins();
}

function updateProgressStats() {
  const stats = AppState.progressStats || {
    total: 0,
    complete: 0,
    partial: 0,
    pending: 0,
    skipped: 0,
    error: 0
  };

  // processed = complete + partial + skipped + error (anything that's been touched)
  const processed = (stats.complete || 0) + (stats.partial || 0) + (stats.skipped || 0) + (stats.error || 0);
  // merged = complete (all requested data types successfully merged)
  const merged = stats.complete || 0;
  const remaining = (stats.total || 0) - processed;

  document.getElementById('statTotal').textContent = stats.total || 0;
  document.getElementById('statProcessed').textContent = processed;
  document.getElementById('statMerged').textContent = merged;
  document.getElementById('statRemaining').textContent = remaining;
}

async function loadCoins() {
  try {
    showStatus('Loading coins...');
    
    const result = await window.electronAPI.getCoins({ limit: 100, offset: 0 });

    if (!result.success) {
      throw new Error(result.error);
    }

    AppState.coins = result.coins;
    renderCoinList();
    
    const total = AppState.progressStats?.total || 0;
    showStatus(`Showing ${result.coins.length} of ${total} coins`);
  } catch (error) {
    showStatus(`Error loading coins: ${error.message}`, 'error');
  }
}

function renderCoinList() {
  const coinList = document.getElementById('coinList');
  coinList.innerHTML = '';

  if (AppState.coins.length === 0) {
    coinList.innerHTML = '<div class="text-center">No coins in collection</div>';
    return;
  }

  AppState.coins.forEach(coin => {
    const coinItem = document.createElement('div');
    coinItem.className = 'coin-item';
    
    // Add status class for styling
    const status = coin.status || 'PENDING';
    if (status === 'MERGED') {
      coinItem.classList.add('coin-merged');
    } else if (status === 'SKIPPED') {
      coinItem.classList.add('coin-skipped');
    } else if (status === 'ERROR') {
      coinItem.classList.add('coin-error');
    }
    
    coinItem.dataset.coinId = coin.id;

    const info = document.createElement('div');
    info.className = 'coin-info';

    const title = document.createElement('div');
    title.className = 'coin-title';
    title.textContent = coin.title || '(Untitled)';

    const details = document.createElement('div');
    details.className = 'coin-details';
    const detailParts = [];
    if (coin.country) detailParts.push(coin.country);
    if (coin.year) detailParts.push(coin.year);
    details.textContent = detailParts.join(' | ');

    info.appendChild(title);
    info.appendChild(details);

    // Three-icon data type display (Basic, Issue, Pricing)
    const dataTypeIcons = document.createElement('div');
    dataTypeIcons.className = 'coin-data-icons';
    dataTypeIcons.innerHTML = getDataTypeIcons(coin);

    coinItem.appendChild(info);
    coinItem.appendChild(dataTypeIcons);

    coinItem.addEventListener('click', () => handleCoinClick(coin));

    coinList.appendChild(coinItem);
  });
}

function getStatusIcon(status) {
  const icons = {
    'MERGED': 'ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦',
    'SKIPPED': 'â­ï¸',
    'ERROR': 'âŒ',
    'MATCHED': 'ðŸ”Ãƒâ€šÃ‚Â',
    'SEARCHED': 'ðŸ”Ž',
    'PENDING': 'â³'
  };
  return icons[status] || 'âºï¸';
}

function getStatusText(status) {
  const labels = {
    'MERGED': 'Done',
    'SKIPPED': 'Skipped',
    'ERROR': 'Error',
    'MATCHED': 'Matched',
    'SEARCHED': 'Searched',
    'PENDING': 'Pending'
  };
  return labels[status] || 'Pending';
}

/**
 * Get three data type icons for a coin
 * Returns HTML with icons for basicData, issueData, and pricingData
 * 
 * @param {Object} coin - Coin object with statusInfo
 * @returns {string} - HTML string with three icons
 */
function getDataTypeIcons(coin) {
  const statusInfo = coin.statusInfo;
  
  // Default icons if no statusInfo
  if (!statusInfo) {
    return '<span class="data-icons">' +
      '<span class="data-icon" title="Basic: Pending">⏳</span>' +
      '<span class="data-icon" title="Issue: Pending">⏳</span>' +
      '<span class="data-icon" title="Pricing: Pending">⏳</span>' +
    '</span>';
  }
  
  // Get icon for each data type
  const basicIcon = getDataTypeIcon(statusInfo.basicData, 'Basic');
  const issueIcon = getDataTypeIcon(statusInfo.issueData, 'Issue');
  const pricingIcon = getPricingIcon(statusInfo.pricingData);
  
  return '<span class="data-icons">' + basicIcon + issueIcon + pricingIcon + '</span>';
}

/**
 * Get icon for a single data type status
 * 
 * @param {Object} dataStatus - Status object with .status field
 * @param {string} label - Label for tooltip
 * @returns {string} - HTML span with icon
 */
function getDataTypeIcon(dataStatus, label) {
  const status = dataStatus?.status || 'NOT_QUERIED';
  
  const iconMap = {
    'MERGED': { icon: '✅', title: label + ': Merged' },
    'NOT_QUERIED': { icon: '⚪', title: label + ': Not requested' },
    'PENDING': { icon: '⏳', title: label + ': Pending' },
    'ERROR': { icon: '❌', title: label + ': Error' },
    'NO_MATCH': { icon: '❓', title: label + ': No match found' },
    'NO_DATA': { icon: '📭', title: label + ': No data available' },
    'SKIPPED': { icon: '⭐', title: label + ': Skipped' }
  };
  
  const iconInfo = iconMap[status] || { icon: '⚪', title: label + ': Unknown' };
  return '<span class="data-icon" title="' + iconInfo.title + '">' + iconInfo.icon + '</span>';
}

/**
 * Get icon for pricing with freshness color
 * 
 * @param {Object} pricingStatus - Pricing status object with .status and .timestamp
 * @returns {string} - HTML span with colored icon
 */
function getPricingIcon(pricingStatus) {
  const status = pricingStatus?.status || 'NOT_QUERIED';
  
  // If not merged, use standard icons
  if (status !== 'MERGED') {
    const iconMap = {
      'NOT_QUERIED': { icon: '⚪', title: 'Pricing: Not requested' },
      'PENDING': { icon: '⏳', title: 'Pricing: Pending' },
      'ERROR': { icon: '❌', title: 'Pricing: Error' },
      'NO_DATA': { icon: '📭', title: 'Pricing: No data available' }
    };
    const iconInfo = iconMap[status] || { icon: '⚪', title: 'Pricing: Unknown' };
    return '<span class="data-icon" title="' + iconInfo.title + '">' + iconInfo.icon + '</span>';
  }
  
  // For merged pricing, show freshness-colored icon
  const timestamp = pricingStatus?.timestamp;
  const freshness = calculatePricingFreshness(timestamp);
  
  return '<span class="data-icon pricing-' + freshness.status.toLowerCase() + '" title="Pricing: ' + freshness.text + '">' + 
    freshness.icon + '</span>';
}

/**
 * Calculate pricing freshness from timestamp
 * Mirrors freshness-calculator.js logic for frontend use
 * 
 * @param {string|null} timestamp - ISO timestamp
 * @returns {Object} - { status, icon, text }
 */
function calculatePricingFreshness(timestamp) {
  if (!timestamp) {
    return { status: 'NEVER', icon: '⚪', text: 'Never updated' };
  }
  
  try {
    const pricingDate = new Date(timestamp);
    const now = new Date();
    const ageMs = now - pricingDate;
    const ageMonths = ageMs / (1000 * 60 * 60 * 24 * 30.44);
    const ageYears = ageMonths / 12;
    
    if (ageMonths < 3) {
      return { status: 'CURRENT', icon: '🟢', text: 'Current (< 3 months)' };
    }
    if (ageYears < 1) {
      return { status: 'RECENT', icon: '🟡', text: 'Recent (' + Math.round(ageMonths) + ' months)' };
    }
    if (ageYears < 2) {
      return { status: 'AGING', icon: '🟠', text: 'Aging (' + ageYears.toFixed(1) + ' years)' };
    }
    return { status: 'OUTDATED', icon: '🔴', text: 'Outdated (' + Math.round(ageYears) + ' years)' };
  } catch (e) {
    return { status: 'NEVER', icon: '⚪', text: 'Unknown' };
  }
}


async function handleCoinClick(coin) {
  AppState.currentCoin = coin;
  
  showStatus(`Searching for ${coin.title || 'coin'}...`);
  showScreen('match');
  
  // Show current coin info
  renderCurrentCoinInfo();
  
  // Perform search
  await searchForMatches();
}

function renderCurrentCoinInfo() {
  const info = document.getElementById('currentCoinInfo');
  
  const coin = AppState.currentCoin;
  
  info.innerHTML = `
    <div><strong>${coin.title || '(Untitled)'}</strong></div>
    <div>${coin.country || ''} ${coin.year || ''} ${coin.value || ''} ${coin.unit || ''}</div>
  `;
}

// =============================================================================
// Numista Search
// =============================================================================

async function searchForMatches() {
  try {
    showStatus('Searching Numista...');
    document.getElementById('searchStatus').textContent = 'Searching...';
    
    // Build search parameters from current coin
    const searchParams = buildSearchParams(AppState.currentCoin);
    
    const result = await window.electronAPI.searchNumista(searchParams);

    if (!result.success) {
      throw new Error(result.error);
    }

    AppState.currentMatches = result.results.types || [];
    
    if (AppState.currentMatches.length === 0) {
      document.getElementById('searchStatus').textContent = 'No matches found';
      showStatus('No matches found');
      
      // Update progress to no_matches
      await window.electronAPI.updateCoinStatus({
        coinId: AppState.currentCoin.id,
        status: 'no_matches',
        metadata: {}
      });
      
    } else {
      document.getElementById('searchStatus').textContent = 
        `Found ${AppState.currentMatches.length} potential matches`;
      showStatus(`Found ${AppState.currentMatches.length} matches`);
    }

    renderMatches();
    
  } catch (error) {
    showStatus(`Error searching: ${error.message}`, 'error');
    document.getElementById('searchStatus').textContent = 
      `Error: ${error.message}`;
  }
}

function buildSearchParams(coin) {
  const params = {};
  
  // Build search query from coin data
  const searchTerms = [];
  if (coin.title) searchTerms.push(coin.title);
  if (coin.series) searchTerms.push(coin.series);
  
  if (searchTerms.length > 0) {
    params.q = searchTerms.join(' ');
  }

  if (coin.year && !isNaN(coin.year)) {
    params.year = parseInt(coin.year);
  }

  params.count = 20;
  params.page = 1;

  return params;
}

function renderMatches() {
  const matchResults = document.getElementById('matchResults');
  matchResults.innerHTML = '';

  if (AppState.currentMatches.length === 0) {
    matchResults.innerHTML = `
      <div class="text-center">
        <p>No matches found. Try searching again with different parameters.</p>
      </div>
    `;
    return;
  }

  AppState.currentMatches.forEach((match, index) => {
    const matchCard = document.createElement('div');
    matchCard.className = 'match-card';
    matchCard.dataset.matchIndex = index;

    // Thumbnail
    const thumbnail = document.createElement('img');
    thumbnail.className = 'match-thumbnail';
    thumbnail.src = match.obverse?.thumbnail || '';
    thumbnail.alt = 'Coin image';
    
    // Info
    const info = document.createElement('div');
    info.className = 'match-info';

    const title = document.createElement('div');
    title.className = 'match-title';
    title.textContent = match.title || 'Untitled';

    const details = document.createElement('div');
    details.className = 'match-details';
    details.innerHTML = `
      <div><strong>Issuer:</strong> ${match.issuer?.name || 'N/A'}</div>
      <div><strong>Year:</strong> ${match.min_year || 'N/A'}${match.max_year && match.max_year !== match.min_year ? '-' + match.max_year : ''}</div>
      <div><strong>Value:</strong> ${match.value?.text || 'N/A'}</div>
      <div><strong>Numista ID:</strong> ${match.id || 'N/A'}</div>
    `;

    const confidence = document.createElement('div');
    confidence.className = 'match-confidence';
    const confidenceScore = calculateConfidence(AppState.currentCoin, match);
    const confidenceClass = confidenceScore >= 70 ? 'high' : confidenceScore >= 40 ? 'medium' : 'low';
    confidence.innerHTML = `
      <span class="confidence-badge confidence-${confidenceClass}">
        ${confidenceScore}% match
      </span>
    `;

    info.appendChild(title);
    info.appendChild(details);
    info.appendChild(confidence);

    matchCard.appendChild(thumbnail);
    matchCard.appendChild(info);

    matchCard.addEventListener('click', () => handleMatchSelection(index));

    matchResults.appendChild(matchCard);
  });
}

function calculateConfidence(coin, match) {
  let score = 0;

  // Title similarity
  if (coin.title && match.title) {
    if (coin.title.toLowerCase() === match.title.toLowerCase()) {
      score += 40;
    } else if (coin.title.toLowerCase().includes(match.title.toLowerCase()) ||
               match.title.toLowerCase().includes(coin.title.toLowerCase())) {
      score += 20;
    }
  }

  // Year match
  if (coin.year && match.min_year) {
    const coinYear = parseInt(coin.year);
    if (coinYear >= match.min_year && coinYear <= (match.max_year || match.min_year)) {
      score += 30;
    }
  }

  // Country match
  if (coin.country && match.issuer?.name) {
    if (coin.country.toLowerCase().includes(match.issuer.name.toLowerCase()) ||
        match.issuer.name.toLowerCase().includes(coin.country.toLowerCase())) {
      score += 20;
    }
  }

  // Value match
  if (coin.value && match.value?.numeric_value) {
    if (parseFloat(coin.value) === match.value.numeric_value) {
      score += 10;
    }
  }

  return Math.min(100, score);
}

async function handleMatchSelection(matchIndex) {
  // Remove previous selection
  document.querySelectorAll('.match-card').forEach(card => {
    card.classList.remove('selected');
  });

  // Select this match
  const selectedCard = document.querySelector(`[data-match-index="${matchIndex}"]`);
  selectedCard.classList.add('selected');

  AppState.selectedMatch = AppState.currentMatches[matchIndex];

  showStatus('Fetching detailed information...');

  try {
    // Fetch all data (basic, issue, pricing) based on settings
    const result = await window.electronAPI.fetchCoinData({
      typeId: AppState.selectedMatch.id,
      coin: AppState.currentCoin
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    // Store the fetched data
    AppState.selectedMatch = result.basicData;
    AppState.issueData = result.issueData;
    AppState.pricingData = result.pricingData;
    AppState.issueMatchResult = result.issueMatchResult;
    
    console.log('Fetched data - basic:', !!result.basicData, 'issue:', !!result.issueData, 'pricing:', !!result.pricingData);

    // Update progress
    await window.electronAPI.updateCoinStatus({
      coinId: AppState.currentCoin.id,
      status: 'matched',
      metadata: {
        numistaId: AppState.selectedMatch.id
      }
    });

    showStatus('Match selected. Click to continue to field comparison.');

    // Auto-proceed to comparison after 1 second
    setTimeout(async () => {
      await showFieldComparison();
    }, 1000);

  } catch (error) {
    showStatus(`Error fetching details: ${error.message}`, 'error');
  }
}

// =============================================================================
// Field Comparison
// =============================================================================

async function showFieldComparison() {
  showScreen('comparison');
  showStatus('Comparing fields...');

  try {
    const result = await window.electronAPI.compareFields({
      coin: AppState.currentCoin,
      numistaData: AppState.selectedMatch,
      issueData: AppState.issueData,
      pricingData: AppState.pricingData
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    // Transform backend array format to frontend object format
    const comparisonObj = {};
    result.comparison.fields.forEach(fieldData => {
      // Use formatted display if available (for catalog numbers), otherwise use raw value
      const numistaDisplay = fieldData.numistaValueDisplay || fieldData.numistaValue || '(empty)';
      
      comparisonObj[fieldData.field] = {
        current: {
          value: fieldData.onValue,
          display: fieldData.onValue || '(empty)'
        },
        numista: {
          value: fieldData.numistaValue,  // Raw value for database
          display: numistaDisplay  // Formatted for display (e.g., "Krause# 13")
        },
        isDifferent: fieldData.isDifferent,
        hasCurrentValue: fieldData.onValue !== null && fieldData.onValue !== undefined && fieldData.onValue !== '',
        hasNumistaValue: fieldData.numistaValue !== null && fieldData.numistaValue !== undefined && fieldData.numistaValue !== '',
        priority: fieldData.priority,
        description: fieldData.description
      };
    });

    AppState.fieldComparison = comparisonObj;
    
    // Create default selection
    AppState.selectedFields = createDefaultSelection(AppState.fieldComparison);

    renderFieldComparison();
    showStatus('Review and select fields to import');

  } catch (error) {
    showStatus(`Error comparing fields: ${error.message}`, 'error');
    console.error('Comparison error:', error);
  }
}

function createDefaultSelection(comparison) {
  const selection = {};

  console.log('Creating default selection:');
  for (const [fieldName, data] of Object.entries(comparison)) {
    // Auto-select if current field is empty and Numista has data
    const autoSelect = !data.hasCurrentValue && data.hasNumistaValue;
    selection[fieldName] = autoSelect;
    
    if (autoSelect) {
      console.log(`  ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ Auto-selecting '${fieldName}' (current empty, numista has value)`);
    } else {
      console.log(`  - Not selecting '${fieldName}' (hasCurrentValue=${data.hasCurrentValue}, hasNumistaValue=${data.hasNumistaValue})`);
    }
  }

  return selection;
}

function renderFieldComparison() {
  const container = document.getElementById('fieldComparison');
  container.innerHTML = '';

  for (const [fieldName, data] of Object.entries(AppState.fieldComparison)) {
    const row = document.createElement('div');
    row.className = 'field-row';
    if (data.isDifferent) {
      row.classList.add('different');
    }

    // Checkbox
    const checkboxCell = document.createElement('div');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'field-checkbox';
    checkbox.checked = AppState.selectedFields[fieldName] || false;
    checkbox.addEventListener('change', (e) => {
      AppState.selectedFields[fieldName] = e.target.checked;
      console.log(`Checkbox '${fieldName}' changed to: ${e.target.checked}`);
      
      // Count how many are now selected
      const selectedCount = Object.values(AppState.selectedFields).filter(v => v === true).length;
      console.log(`Total selected fields: ${selectedCount}`);
    });
    checkboxCell.appendChild(checkbox);

    // Field name
    const nameCell = document.createElement('div');
    const nameDiv = document.createElement('div');
    nameDiv.className = 'field-name';
    nameDiv.textContent = fieldName;
    const descDiv = document.createElement('div');
    descDiv.className = 'field-description';
    descDiv.textContent = data.description;
    nameCell.appendChild(nameDiv);
    nameCell.appendChild(descDiv);

    // Current value
    const currentCell = document.createElement('div');
    const currentLabel = document.createElement('div');
    currentLabel.style.fontWeight = '600';
    currentLabel.style.fontSize = '0.75rem';
    currentLabel.style.marginBottom = '0.25rem';
    currentLabel.textContent = 'Current';
    const currentValue = document.createElement('div');
    currentValue.className = data.hasCurrentValue ? 'field-value' : 'field-value empty';
    currentValue.textContent = data.current.display;
    currentCell.appendChild(currentLabel);
    currentCell.appendChild(currentValue);

    // Numista value
    const numistaCell = document.createElement('div');
    const numistaLabel = document.createElement('div');
    numistaLabel.style.fontWeight = '600';
    numistaLabel.style.fontSize = '0.75rem';
    numistaLabel.style.marginBottom = '0.25rem';
    numistaLabel.textContent = 'Numista';
    const numistaValue = document.createElement('div');
    numistaValue.className = data.hasNumistaValue ? 'field-value' : 'field-value empty';
    numistaValue.textContent = data.numista.display;
    numistaCell.appendChild(numistaLabel);
    numistaCell.appendChild(numistaValue);

    row.appendChild(checkboxCell);
    row.appendChild(nameCell);
    row.appendChild(currentCell);
    row.appendChild(numistaCell);

    container.appendChild(row);
  }
}

// =============================================================================
// Field Selection Controls
// =============================================================================

document.getElementById('selectAllFieldsBtn').addEventListener('click', () => {
  for (const field in AppState.selectedFields) {
    AppState.selectedFields[field] = true;
  }
  renderFieldComparison();
});

document.getElementById('selectNoneFieldsBtn').addEventListener('click', () => {
  for (const field in AppState.selectedFields) {
    AppState.selectedFields[field] = false;
  }
  renderFieldComparison();
});

document.getElementById('selectEmptyFieldsBtn').addEventListener('click', () => {
  for (const [fieldName, data] of Object.entries(AppState.fieldComparison)) {
    AppState.selectedFields[fieldName] = !data.hasCurrentValue && data.hasNumistaValue;
  }
  renderFieldComparison();
});

document.getElementById('selectDifferentFieldsBtn').addEventListener('click', () => {
  for (const [fieldName, data] of Object.entries(AppState.fieldComparison)) {
    AppState.selectedFields[fieldName] = data.isDifferent;
  }
  renderFieldComparison();
});

// =============================================================================
// Apply Changes
// =============================================================================

document.getElementById('applyChangesBtn').addEventListener('click', async () => {
  const confirmed = await showModal(
    'Confirm Changes',
    'Are you sure you want to apply these changes to the coin?<br>A backup will be created automatically.',
    true
  );

  if (!confirmed) {
    return;
  }

  try {
    showStatus('Applying changes...');
    showProgress(true, 50);

    console.log('=== Frontend Apply Changes ===');
    console.log('coinId:', AppState.currentCoin.id);
    console.log('selectedFields:', AppState.selectedFields);
    console.log('Number of selected fields:', Object.keys(AppState.selectedFields).filter(k => AppState.selectedFields[k]).length);
    console.log('numistaData.id:', AppState.selectedMatch?.id);

    const result = await window.electronAPI.mergeData({
      coinId: AppState.currentCoin.id,
      selectedFields: AppState.selectedFields,
      numistaData: AppState.selectedMatch,
      issueData: AppState.issueData,
      pricingData: AppState.pricingData
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    showProgress(true, 100);
    showStatus('Changes applied successfully!');

    await showModal('Success', `Coin updated successfully!<br>Backup saved to: ${result.backupPath}`);

    // Refresh progress stats
    const statsResult = await window.electronAPI.getProgressStats();
    if (statsResult.success) {
      AppState.progressStats = statsResult.stats;
      updateProgressStats();
    }

    // Go back to collection
    setTimeout(() => {
      showProgress(false);
      loadCoins();
      showScreen('collection');
    }, 500);

  } catch (error) {
    showProgress(false);
    showStatus(`Error applying changes: ${error.message}`, 'error');
    showModal('Error', `Failed to apply changes:<br>${error.message}`);
  }
});

// =============================================================================
// Navigation Buttons
// =============================================================================

document.getElementById('closeCollectionBtn').addEventListener('click', () => {
  AppState.collectionPath = null;
  AppState.collection = null;
  AppState.coins = [];
  showScreen('welcome');
  showStatus('');
});

document.getElementById('backToListBtn').addEventListener('click', () => {
  showScreen('collection');
});

document.getElementById('backToMatchesBtn').addEventListener('click', () => {
  showScreen('match');
});

document.getElementById('skipCoinBtn').addEventListener('click', async () => {
  await window.electronAPI.updateCoinStatus({
    coinId: AppState.currentCoin.id,
    status: 'skipped',
    metadata: {}
  });
  
  showScreen('collection');
  loadCoins();
});

document.getElementById('cancelMergeBtn').addEventListener('click', () => {
  showScreen('match');
});

// =============================================================================
// Manual Search
// =============================================================================

document.getElementById('manualSearchBtn').addEventListener('click', () => {
  const panel = document.getElementById('manualSearchPanel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  
  if (panel.style.display === 'block') {
    document.getElementById('manualSearchInput').focus();
  }
});

document.getElementById('cancelManualSearchBtn').addEventListener('click', () => {
  document.getElementById('manualSearchPanel').style.display = 'none';
  document.getElementById('manualSearchInput').value = '';
});

document.getElementById('performManualSearchBtn').addEventListener('click', async () => {
  const searchTerm = document.getElementById('manualSearchInput').value.trim();
  
  if (!searchTerm) {
    showStatus('Please enter a search term', 'error');
    return;
  }
  
  try {
    showStatus('Searching Numista with custom term...');
    document.getElementById('searchStatus').textContent = `Searching for "${searchTerm}"...`;
    
    const result = await window.electronAPI.manualSearchNumista({
      query: searchTerm,
      coinId: AppState.currentCoin.id
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    AppState.currentMatches = result.results.types || [];
    
    // Hide manual search panel
    document.getElementById('manualSearchPanel').style.display = 'none';
    
    if (AppState.currentMatches.length === 0) {
      document.getElementById('searchStatus').textContent = 
        `No matches found for "${searchTerm}"`;
      showStatus('No matches found - try different search terms');
    } else {
      document.getElementById('searchStatus').textContent = 
        `Found ${AppState.currentMatches.length} matches for "${searchTerm}"`;
      showStatus(`Found ${AppState.currentMatches.length} matches`);
    }

    renderMatches();
    
  } catch (error) {
    showStatus(`Error searching: ${error.message}`, 'error');
    document.getElementById('searchStatus').textContent = 
      `Error: ${error.message}`;
  }
});

// Allow Enter key in manual search input
document.getElementById('manualSearchInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('performManualSearchBtn').click();
  }
});

// =============================================================================
// Settings
// =============================================================================

document.getElementById('settingsBtn').addEventListener('click', async () => {
  const result = await window.electronAPI.getAppSettings();
  if (result.success) {
    AppState.settings = result.settings;
    loadSettingsScreen();
    showScreen('settings');
  }
});

function loadSettingsScreen() {
  if (!AppState.settings) return;

  document.getElementById('apiKeyInput').value = AppState.settings.apiKey || '';
  document.getElementById('requestDelayInput').value = AppState.settings.searchDelay || 2000;
  document.getElementById('autoBackupCheckbox').checked = AppState.settings.autoBackup !== false;
}

document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
  const settings = {
    apiKey: document.getElementById('apiKeyInput').value,
    searchDelay: parseInt(document.getElementById('requestDelayInput').value),
    imageHandling: document.querySelector('input[name="imageHandling"]:checked').value,
    autoBackup: document.getElementById('autoBackupCheckbox').checked,
    fieldMapping: AppState.settings?.fieldMapping
  };

  const result = await window.electronAPI.saveAppSettings(settings);
  
  if (result.success) {
    showModal('Success', 'Settings saved successfully!');
    AppState.settings = settings;
  } else {
    showModal('Error', 'Failed to save settings');
  }
});

document.getElementById('closeSettingsBtn').addEventListener('click', () => {
  showScreen(AppState.collectionPath ? 'collection' : 'welcome');
});

// =============================================================================
// Initialization
// =============================================================================

showScreen('welcome');
showStatus('Ready');
/**
 * Data Settings UI Handler
 * 
 * Manages the data settings modal and UI interactions.
 * Works with settings-manager.js to persist settings.
 */

// This would be integrated into app.js in the renderer process

class DataSettingsUI {
  constructor() {
    this.modal = null;
    this.currentSettings = null;
    this.sessionCallCount = 0;
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for data settings UI
   */
  setupEventListeners() {
    // Open data settings modal
    const dataSettingsBtn = document.getElementById('dataSettingsBtn');
    if (dataSettingsBtn) {
      dataSettingsBtn.addEventListener('click', () => this.openModal());
    }

    // Close buttons
    const closeBtn = document.getElementById('dataSettingsCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    const cancelBtn = document.getElementById('cancelDataSettingsBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeModal());
    }

    // Save button
    const saveBtn = document.getElementById('saveDataSettingsBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveSettings());
    }

    // Checkboxes - update display when changed
    const issueCheckbox = document.getElementById('fetchIssueData');
    const pricingCheckbox = document.getElementById('fetchPricingData');
    
    if (issueCheckbox) {
      issueCheckbox.addEventListener('change', () => this.updateCostDisplay());
    }
    
    if (pricingCheckbox) {
      pricingCheckbox.addEventListener('change', () => this.updateCostDisplay());
    }
  }

  /**
   * Open the data settings modal
   */
  async openModal() {
    this.modal = document.getElementById('dataSettingsModal');
    if (!this.modal) return;

    try {
      // Load current settings from main process
      const settings = await window.api.getSettings();
      this.currentSettings = settings;
      
      // Load currency
      const currency = await window.api.getCurrency();
      
      // Load session call count
      const stats = await window.api.getStatistics();
      this.sessionCallCount = stats.sessionCallCount || 0;
      
      // Update UI with current settings
      this.populateSettings(settings.fetchSettings, currency);
      this.updateCostDisplay();
      
      // Show modal
      this.modal.style.display = 'flex';
      
    } catch (error) {
      console.error('Error opening data settings modal:', error);
      this.showError('Failed to load settings');
    }
  }

  /**
   * Close the modal
   */
  closeModal() {
    if (this.modal) {
      this.modal.style.display = 'none';
    }
  }

  /**
   * Populate settings in the UI
   */
  populateSettings(fetchSettings, currency) {
    // Basic data is always checked and disabled
    const basicCheckbox = document.getElementById('fetchBasicData');
    if (basicCheckbox) {
      basicCheckbox.checked = true;
    }

    // Issue data
    const issueCheckbox = document.getElementById('fetchIssueData');
    if (issueCheckbox) {
      issueCheckbox.checked = fetchSettings.issueData || false;
    }

    // Pricing data
    const pricingCheckbox = document.getElementById('fetchPricingData');
    if (pricingCheckbox) {
      pricingCheckbox.checked = fetchSettings.pricingData || false;
    }
    
    // Currency selection
    const currencySelect = document.getElementById('pricingCurrency');
    if (currencySelect) {
      currencySelect.value = currency || 'USD';
    }
  }

  /**
   * Update the cost display based on current selections
   */
  updateCostDisplay() {
    const issueCheckbox = document.getElementById('fetchIssueData');
    const pricingCheckbox = document.getElementById('fetchPricingData');
    
    let callsPerCoin = 2; // Basic data always
    
    if (issueCheckbox && issueCheckbox.checked) {
      callsPerCoin += 1;
    }
    
    if (pricingCheckbox && pricingCheckbox.checked) {
      callsPerCoin += 1;
    }
    
    // Update displays
    const callsDisplay = document.getElementById('callsPerCoinDisplay');
    if (callsDisplay) {
      callsDisplay.textContent = `${callsPerCoin} call${callsPerCoin !== 1 ? 's' : ''} per coin`;
    }
    
    const sessionDisplay = document.getElementById('sessionCallsDisplay');
    if (sessionDisplay) {
      sessionDisplay.textContent = `${this.sessionCallCount} call${this.sessionCallCount !== 1 ? 's' : ''} used`;
    }
  }

  /**
   * Save settings
   */
  async saveSettings() {
    try {
      const issueCheckbox = document.getElementById('fetchIssueData');
      const pricingCheckbox = document.getElementById('fetchPricingData');
      const currencySelect = document.getElementById('pricingCurrency');
      
      const newSettings = {
        basicData: true, // Always true
        issueData: issueCheckbox ? issueCheckbox.checked : false,
        pricingData: pricingCheckbox ? pricingCheckbox.checked : false
      };
      
      // Save fetch settings to main process
      await window.api.saveFetchSettings(newSettings);
      
      // Save currency separately
      if (currencySelect) {
        await window.api.saveCurrency(currencySelect.value);
      }
      
      // Update status bar
      this.updateStatusBarDisplay(newSettings);
      
      // Close modal
      this.closeModal();
      
      // Show success message
      this.showSuccess('Data settings saved successfully');
      
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showError('Failed to save settings');
    }
  }

  /**
   * Update status bar to show current fetch settings
   */
  updateStatusBarDisplay(settings) {
    const statusText = document.getElementById('fetchSettingsText');
    if (!statusText) return;
    
    const parts = ['Basic'];
    let callCount = 2;
    
    if (settings.issueData) {
      parts.push('Issue');
      callCount += 1;
    }
    
    if (settings.pricingData) {
      parts.push('Pricing');
      callCount += 1;
    }
    
    statusText.textContent = `Fetch: ${parts.join(' + ')} (${callCount} calls)`;
  }

  /**
   * Update session call count display
   */
  updateSessionCallDisplay(count) {
    this.sessionCallCount = count;
    
    const sessionText = document.getElementById('sessionCallsText');
    if (sessionText) {
      sessionText.textContent = `Session: ${count} calls`;
    }
    
    // Also update in modal if open
    const sessionDisplay = document.getElementById('sessionCallsDisplay');
    if (sessionDisplay) {
      sessionDisplay.textContent = `${count} call${count !== 1 ? 's' : ''} used`;
    }
  }

  /**
   * Get current fetch settings from UI
   */
  getCurrentSettings() {
    const issueCheckbox = document.getElementById('fetchIssueData');
    const pricingCheckbox = document.getElementById('fetchPricingData');
    
    return {
      basicData: true,
      issueData: issueCheckbox ? issueCheckbox.checked : false,
      pricingData: pricingCheckbox ? pricingCheckbox.checked : false
    };
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    const statusMessage = document.getElementById('statusMessage');
    if (statusMessage) {
      statusMessage.textContent = `ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ ${message}`;
      statusMessage.style.color = '#27ae60';
      
      setTimeout(() => {
        statusMessage.textContent = '';
      }, 3000);
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    const statusMessage = document.getElementById('statusMessage');
    if (statusMessage) {
      statusMessage.textContent = `ÃƒÂ¢Ã‚ÂÃ…â€™ ${message}`;
      statusMessage.style.color = '#e74c3c';
      
      setTimeout(() => {
        statusMessage.textContent = '';
      }, 5000);
    }
  }
}

// Initialize on DOM load
let dataSettingsUI;

document.addEventListener('DOMContentLoaded', () => {
  dataSettingsUI = new DataSettingsUI();
  
  // Load initial settings and update status bar
  window.api.getSettings().then(settings => {
    if (dataSettingsUI) {
      dataSettingsUI.updateStatusBarDisplay(settings.fetchSettings);
    }
  }).catch(error => {
    console.error('Error loading initial settings:', error);
  });
  
  // Load session call count
  window.api.getStatistics().then(stats => {
    if (dataSettingsUI) {
      dataSettingsUI.updateSessionCallDisplay(stats.sessionCallCount || 0);
    }
  }).catch(error => {
    console.error('Error loading statistics:', error);
  });
});

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataSettingsUI;
}
