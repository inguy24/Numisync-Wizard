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
  allCoins: [], // Unfiltered coins for frontend filtering
  currentCoin: null,
  currentMatches: [],
  selectedMatch: null,
  fieldComparison: null,
  selectedFields: {},
  settings: null,
  progressStats: null,
  pagination: {
    currentPage: 1,
    pageSize: 100,
    totalPages: 1
  },
  filterSort: {
    statusFilter: 'all', // all, unprocessed, merged, skipped, complete, partial, missing_basic, missing_issue, missing_pricing
    freshnessFilter: 'all', // all, current, recent, aging, outdated, never
    sortBy: 'title', // title, year, country, last_update, pricing_freshness, status
    sortOrder: 'ASC' // ASC, DESC
  }
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

/**
 * Apply frontend filters and sorting to coins array
 * @param {Array} coins - Array of coins with statusInfo
 * @returns {Array} - Filtered and sorted coins
 */
function applyFilters(coins) {
  let filtered = [...coins];

  // Apply status filter
  const statusFilter = AppState.filterSort.statusFilter;
  if (statusFilter !== 'all') {
    filtered = filtered.filter(coin => {
      const statusInfo = coin.statusInfo;
      if (!statusInfo) {
        return statusFilter === 'unprocessed';
      }

      switch (statusFilter) {
        case 'unprocessed':
          // No data has been merged yet
          return (!statusInfo.basicData || statusInfo.basicData.status !== 'MERGED') &&
                 (!statusInfo.issueData || statusInfo.issueData.status !== 'MERGED') &&
                 (!statusInfo.pricingData || statusInfo.pricingData.status !== 'MERGED');

        case 'merged':
          // At least basic data has been merged
          return statusInfo.basicData?.status === 'MERGED';

        case 'skipped':
          // Overall coin status is skipped
          return coin.status === 'SKIPPED';

        case 'complete':
          // All requested data types are merged
          return statusInfo.basicData?.status === 'MERGED' &&
                 (statusInfo.issueData?.status === 'MERGED' || statusInfo.issueData?.status === 'NOT_QUERIED') &&
                 (statusInfo.pricingData?.status === 'MERGED' || statusInfo.pricingData?.status === 'NOT_QUERIED');

        case 'partial':
          // Some but not all data is merged
          const basicMerged = statusInfo.basicData?.status === 'MERGED';
          const issueMerged = statusInfo.issueData?.status === 'MERGED';
          const pricingMerged = statusInfo.pricingData?.status === 'MERGED';
          const issueQueried = statusInfo.issueData?.status !== 'NOT_QUERIED';
          const pricingQueried = statusInfo.pricingData?.status !== 'NOT_QUERIED';

          return basicMerged && (
            (issueQueried && !issueMerged) ||
            (pricingQueried && !pricingMerged)
          );

        case 'missing_basic':
          return !statusInfo.basicData || statusInfo.basicData.status !== 'MERGED';

        case 'missing_issue':
          return statusInfo.issueData &&
                 statusInfo.issueData.status !== 'NOT_QUERIED' &&
                 statusInfo.issueData.status !== 'MERGED';

        case 'missing_pricing':
          return statusInfo.pricingData &&
                 statusInfo.pricingData.status !== 'NOT_QUERIED' &&
                 statusInfo.pricingData.status !== 'MERGED';

        default:
          return true;
      }
    });
  }

  // Apply freshness filter (for pricing data)
  const freshnessFilter = AppState.filterSort.freshnessFilter;
  if (freshnessFilter !== 'all') {
    filtered = filtered.filter(coin => {
      const pricingStatus = coin.statusInfo?.pricingData;
      if (!pricingStatus || pricingStatus.status !== 'MERGED') {
        return freshnessFilter === 'never';
      }

      const freshness = calculatePricingFreshness(pricingStatus.timestamp);
      return freshness.status.toLowerCase() === freshnessFilter.toLowerCase();
    });
  }

  // Apply frontend sorting for Phase 2 sort options
  const sortBy = AppState.filterSort.sortBy;
  if (sortBy === 'last_update' || sortBy === 'pricing_freshness' || sortBy === 'status') {
    filtered.sort((a, b) => {
      let aValue, bValue;

      if (sortBy === 'last_update') {
        // Sort by most recent update timestamp across all data types
        aValue = getMostRecentTimestamp(a.statusInfo);
        bValue = getMostRecentTimestamp(b.statusInfo);

        // Most recent first (descending)
        return bValue - aValue;
      }

      if (sortBy === 'pricing_freshness') {
        // Sort by pricing freshness (current > recent > aging > outdated > never)
        aValue = getPricingFreshnessScore(a.statusInfo?.pricingData?.timestamp);
        bValue = getPricingFreshnessScore(b.statusInfo?.pricingData?.timestamp);

        // Best freshness first (descending)
        return bValue - aValue;
      }

      if (sortBy === 'status') {
        // Sort by completion status (complete > partial > unprocessed)
        aValue = getCompletionScore(a.statusInfo);
        bValue = getCompletionScore(b.statusInfo);

        // Most complete first (descending)
        return bValue - aValue;
      }

      return 0;
    });
  }
  // Note: Database-level sorting (title, year, country) is already applied

  return filtered;
}

/**
 * Get the most recent timestamp from a coin's status info
 */
function getMostRecentTimestamp(statusInfo) {
  if (!statusInfo) return 0;

  const timestamps = [];
  if (statusInfo.basicData?.timestamp) timestamps.push(new Date(statusInfo.basicData.timestamp));
  if (statusInfo.issueData?.timestamp) timestamps.push(new Date(statusInfo.issueData.timestamp));
  if (statusInfo.pricingData?.timestamp) timestamps.push(new Date(statusInfo.pricingData.timestamp));

  if (timestamps.length === 0) return 0;
  return Math.max(...timestamps);
}

/**
 * Get pricing freshness score for sorting (higher = fresher)
 */
function getPricingFreshnessScore(timestamp) {
  if (!timestamp) return 0; // Never = lowest

  const freshness = calculatePricingFreshness(timestamp);
  const scoreMap = {
    'CURRENT': 4,
    'RECENT': 3,
    'AGING': 2,
    'OUTDATED': 1,
    'NEVER': 0
  };

  return scoreMap[freshness.status] || 0;
}

/**
 * Get completion score for sorting (higher = more complete)
 */
function getCompletionScore(statusInfo) {
  if (!statusInfo) return 0;

  let score = 0;
  if (statusInfo.basicData?.status === 'MERGED') score += 3;
  if (statusInfo.issueData?.status === 'MERGED') score += 2;
  if (statusInfo.pricingData?.status === 'MERGED') score += 1;

  return score;
}

async function loadCoins() {
  try {
    showStatus('Loading coins...');

    const total = AppState.progressStats?.total || 0;

    // Load ALL coins (or at least a large batch) to enable frontend filtering
    // For very large collections, we may need to adjust this approach

    // Only use backend sorting for database fields (title, year, country)
    const dbSortFields = ['title', 'year', 'country'];
    const sortBy = dbSortFields.includes(AppState.filterSort.sortBy)
      ? AppState.filterSort.sortBy
      : 'title'; // Default to title for Phase 2 sorts

    const result = await window.electronAPI.getCoins({
      limit: 10000, // Load up to 10k coins for filtering
      offset: 0,
      sortBy: sortBy,
      sortOrder: AppState.filterSort.sortOrder
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    // Store all coins
    AppState.allCoins = result.coins;

    // Apply frontend filters
    const filteredCoins = applyFilters(AppState.allCoins);

    // Calculate pagination based on filtered results
    const filteredTotal = filteredCoins.length;
    AppState.pagination.totalPages = Math.ceil(filteredTotal / AppState.pagination.pageSize) || 1;

    // Ensure current page is valid
    if (AppState.pagination.currentPage > AppState.pagination.totalPages) {
      AppState.pagination.currentPage = AppState.pagination.totalPages || 1;
    }

    // Apply pagination to filtered results
    const offset = (AppState.pagination.currentPage - 1) * AppState.pagination.pageSize;
    AppState.coins = filteredCoins.slice(offset, offset + AppState.pagination.pageSize);

    renderCoinList();
    updatePaginationControls();
    updateFilterSummary();

    const startIndex = offset + 1;
    const endIndex = Math.min(offset + AppState.coins.length, filteredTotal);
    showStatus(`Showing ${startIndex}-${endIndex} of ${filteredTotal} coins` +
               (filteredTotal < total ? ` (filtered from ${total})` : ''));
  } catch (error) {
    showStatus(`Error loading coins: ${error.message}`, 'error');
  }
}

function updatePaginationControls() {
  const { currentPage, totalPages } = AppState.pagination;

  // Update page info text
  document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;

  // Update button states
  document.getElementById('firstPageBtn').disabled = currentPage === 1;
  document.getElementById('prevPageBtn').disabled = currentPage === 1;
  document.getElementById('nextPageBtn').disabled = currentPage === totalPages;
  document.getElementById('lastPageBtn').disabled = currentPage === totalPages;
}

/**
 * Calculate filter counts for all filter categories
 * @param {Array} allCoins - All coins (unfiltered)
 * @returns {Object} - Filter counts by category
 */
function calculateFilterCounts(allCoins) {
  const counts = {
    status: {
      all: allCoins.length,
      unprocessed: 0,
      merged: 0,
      skipped: 0,
      complete: 0,
      partial: 0,
      missing_basic: 0,
      missing_issue: 0,
      missing_pricing: 0
    },
    freshness: {
      all: allCoins.length,
      current: 0,
      recent: 0,
      aging: 0,
      outdated: 0,
      never: 0
    }
  };

  allCoins.forEach(coin => {
    const statusInfo = coin.statusInfo;

    // Count status categories
    if (!statusInfo || (!statusInfo.basicData || statusInfo.basicData.status !== 'MERGED')) {
      counts.status.unprocessed++;
    }

    if (statusInfo?.basicData?.status === 'MERGED') {
      counts.status.merged++;
    }

    if (coin.status === 'SKIPPED') {
      counts.status.skipped++;
    }

    // Complete: all requested data types are merged
    if (statusInfo?.basicData?.status === 'MERGED' &&
        (statusInfo.issueData?.status === 'MERGED' || statusInfo.issueData?.status === 'NOT_QUERIED') &&
        (statusInfo.pricingData?.status === 'MERGED' || statusInfo.pricingData?.status === 'NOT_QUERIED')) {
      counts.status.complete++;
    }

    // Partial: basic merged but some queried data missing
    if (statusInfo?.basicData?.status === 'MERGED') {
      const issueMerged = statusInfo.issueData?.status === 'MERGED';
      const pricingMerged = statusInfo.pricingData?.status === 'MERGED';
      const issueQueried = statusInfo.issueData?.status !== 'NOT_QUERIED';
      const pricingQueried = statusInfo.pricingData?.status !== 'NOT_QUERIED';

      if ((issueQueried && !issueMerged) || (pricingQueried && !pricingMerged)) {
        counts.status.partial++;
      }
    }

    // Missing data categories
    if (!statusInfo || !statusInfo.basicData || statusInfo.basicData.status !== 'MERGED') {
      counts.status.missing_basic++;
    }

    if (statusInfo?.issueData &&
        statusInfo.issueData.status !== 'NOT_QUERIED' &&
        statusInfo.issueData.status !== 'MERGED') {
      counts.status.missing_issue++;
    }

    if (statusInfo?.pricingData &&
        statusInfo.pricingData.status !== 'NOT_QUERIED' &&
        statusInfo.pricingData.status !== 'MERGED') {
      counts.status.missing_pricing++;
    }

    // Count freshness categories
    const pricingStatus = statusInfo?.pricingData;
    if (!pricingStatus || pricingStatus.status !== 'MERGED') {
      counts.freshness.never++;
    } else {
      const freshness = calculatePricingFreshness(pricingStatus.timestamp);
      const freshnessKey = freshness.status.toLowerCase();
      if (counts.freshness[freshnessKey] !== undefined) {
        counts.freshness[freshnessKey]++;
      }
    }
  });

  return counts;
}

/**
 * Update the filter summary display with counts
 */
function updateFilterSummary() {
  if (!AppState.allCoins || AppState.allCoins.length === 0) {
    document.getElementById('filterSummary').style.display = 'none';
    return;
  }

  const counts = calculateFilterCounts(AppState.allCoins);
  const summaryEl = document.getElementById('filterSummary');

  const html = `
    <div class="filter-summary-section">
      <strong>Status:</strong>
      <span class="filter-count">Complete: ${counts.status.complete}</span>
      <span class="filter-count">Partial: ${counts.status.partial}</span>
      <span class="filter-count">Unprocessed: ${counts.status.unprocessed}</span>
      <span class="filter-count">Skipped: ${counts.status.skipped}</span>
    </div>
    <div class="filter-summary-section">
      <strong>Pricing:</strong>
      <span class="filter-count">Current: ${counts.freshness.current}</span>
      <span class="filter-count">Recent: ${counts.freshness.recent}</span>
      <span class="filter-count">Aging: ${counts.freshness.aging}</span>
      <span class="filter-count">Outdated: ${counts.freshness.outdated}</span>
      <span class="filter-count">Never: ${counts.freshness.never}</span>
    </div>
  `;

  summaryEl.innerHTML = html;
  summaryEl.style.display = 'flex';
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

    // Add image thumbnails
    const coinImages = document.createElement('div');
    coinImages.className = 'coin-images';

    const obverseImg = document.createElement('img');
    obverseImg.className = 'coin-thumbnail';
    obverseImg.alt = 'OBV';
    obverseImg.title = 'Obverse';
    obverseImg.dataset.side = 'obverse';
    obverseImg.dataset.coinId = coin.id;

    const reverseImg = document.createElement('img');
    reverseImg.className = 'coin-thumbnail';
    reverseImg.alt = 'REV';
    reverseImg.title = 'Reverse';
    reverseImg.dataset.side = 'reverse';
    reverseImg.dataset.coinId = coin.id;

    // Set placeholder initially
    obverseImg.src = getImagePlaceholder('obverse');
    reverseImg.src = getImagePlaceholder('reverse');

    coinImages.appendChild(obverseImg);
    coinImages.appendChild(reverseImg);

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

    coinItem.appendChild(coinImages);
    coinItem.appendChild(info);
    coinItem.appendChild(dataTypeIcons);

    coinItem.addEventListener('click', () => handleCoinClick(coin));

    coinList.appendChild(coinItem);
  });

  // Load images for visible coins (lazy loading)
  loadCoinImages();
}

/**
 * Generate SVG placeholder image for coins
 * @param {string} type - 'obverse' or 'reverse'
 * @returns {string} - Data URI for SVG placeholder
 */
function getImagePlaceholder(type) {
  const text = type === 'obverse' ? 'OBV' : 'REV';
  const color = '#6c757d';
  const svg = `
    <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" fill="${color}"/>
      <text x="20" y="20" font-family="Arial" font-size="10" fill="white" text-anchor="middle" dominant-baseline="middle">
        ${text}
      </text>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Load images for all coins currently displayed in the list
 */
async function loadCoinImages() {
  const thumbnails = document.querySelectorAll('.coin-thumbnail');

  for (const img of thumbnails) {
    const coinId = parseInt(img.dataset.coinId);
    const side = img.dataset.side;

    // Skip if already loaded
    if (img.dataset.loaded === 'true') {
      continue;
    }

    try {
      const result = await window.electronAPI.getCoinImages(coinId);

      if (result.success && result.images) {
        if (side === 'obverse' && result.images.obverse) {
          img.src = result.images.obverse;
          img.dataset.loaded = 'true';
        } else if (side === 'reverse' && result.images.reverse) {
          img.src = result.images.reverse;
          img.dataset.loaded = 'true';
        }
        // If no image data, keep the placeholder
      }
    } catch (error) {
      console.error(`Error loading image for coin ${coinId}:`, error);
      // Keep placeholder on error
    }
  }
}

function getStatusIcon(status) {
  const icons = {
    'MERGED': '✅',
    'SKIPPED': '🚫',
    'ERROR': '❌',
    'MATCHED': '🔍',
    'SEARCHED': '🔎',
    'PENDING': '⏳'
  };
  return icons[status] || '⏺️';
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
    'SKIPPED': { icon: '🚫', title: label + ': Skipped' }
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
      'NO_DATA': { icon: '📭', title: 'Pricing: No data available' },
      'SKIPPED': { icon: '🚫', title: 'Pricing: Skipped' }
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

async function renderCurrentCoinInfo() {
  const info = document.getElementById('currentCoinInfo');
  const coin = AppState.currentCoin;

  // Create container with images and text
  const container = document.createElement('div');
  container.className = 'current-coin-container';

  // User's coin images
  const imagesDiv = document.createElement('div');
  imagesDiv.className = 'current-coin-images';

  try {
    const result = await window.electronAPI.getCoinImages(coin.id);
    if (result.success && result.images) {
      // Obverse image
      const obverseImg = document.createElement('img');
      obverseImg.className = 'current-coin-image';
      obverseImg.src = result.images.obverse || getImagePlaceholder('obverse');
      obverseImg.alt = 'Your obverse';
      obverseImg.title = 'Your obverse - hover to enlarge';

      // Reverse image
      const reverseImg = document.createElement('img');
      reverseImg.className = 'current-coin-image';
      reverseImg.src = result.images.reverse || getImagePlaceholder('reverse');
      reverseImg.alt = 'Your reverse';
      reverseImg.title = 'Your reverse - hover to enlarge';

      imagesDiv.appendChild(obverseImg);
      imagesDiv.appendChild(reverseImg);
    } else {
      // Show placeholders if no images
      imagesDiv.innerHTML = `
        <img class="current-coin-image" src="${getImagePlaceholder('obverse')}" alt="No obverse" title="No image available">
        <img class="current-coin-image" src="${getImagePlaceholder('reverse')}" alt="No reverse" title="No image available">
      `;
    }
  } catch (error) {
    console.error('Error loading current coin images:', error);
    imagesDiv.innerHTML = `
      <img class="current-coin-image" src="${getImagePlaceholder('obverse')}" alt="Error" title="Error loading image">
      <img class="current-coin-image" src="${getImagePlaceholder('reverse')}" alt="Error" title="Error loading image">
    `;
  }

  // Coin details text
  const textDiv = document.createElement('div');
  textDiv.className = 'current-coin-text';
  textDiv.innerHTML = `
    <div><strong>${coin.title || '(Untitled)'}</strong></div>
    <div>${coin.country || ''} ${coin.year || ''} ${coin.value || ''} ${coin.unit || ''}</div>
  `;

  container.appendChild(imagesDiv);
  container.appendChild(textDiv);

  info.innerHTML = '';
  info.appendChild(container);
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
    console.log('=== AUTOMATIC SEARCH ===');
    console.log('Current coin:', AppState.currentCoin);
    console.log('Search params:', searchParams);

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
  let query = '';

  if (coin.title && coin.title.trim()) {
    query = coin.title.trim();
  }

  // Add year to query if it exists and isn't already in the title
  if (coin.year && !isNaN(coin.year)) {
    const year = coin.year.toString();
    // Check if year is already in the title
    if (!query.includes(year)) {
      query = query ? `${query} ${year}` : year;
    }
  }

  if (query) {
    params.q = query.trim();
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

    // Thumbnails (obverse and reverse)
    const thumbnailsContainer = document.createElement('div');
    thumbnailsContainer.className = 'match-thumbnails';

    const obverseImg = document.createElement('img');
    obverseImg.className = 'match-thumbnail';
    obverseImg.src = match.obverse_thumbnail || getImagePlaceholder('obverse');
    obverseImg.alt = 'Obverse';
    obverseImg.title = 'Obverse';

    const reverseImg = document.createElement('img');
    reverseImg.className = 'match-thumbnail';
    reverseImg.src = match.reverse_thumbnail || getImagePlaceholder('reverse');
    reverseImg.alt = 'Reverse';
    reverseImg.title = 'Reverse';

    thumbnailsContainer.appendChild(obverseImg);
    thumbnailsContainer.appendChild(reverseImg);

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

    matchCard.appendChild(thumbnailsContainer);
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

  const searchResult = AppState.currentMatches[matchIndex];
  AppState.selectedMatch = searchResult;

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

    // Preserve thumbnail URLs from search result when merging with detailed data
    if (result.basicData) {
      result.basicData.obverse_thumbnail = searchResult.obverse_thumbnail;
      result.basicData.reverse_thumbnail = searchResult.reverse_thumbnail;
      result.basicData.edge_thumbnail = searchResult.edge_thumbnail;
      AppState.selectedMatch = result.basicData;
    } else {
      // If no basic data was fetched, keep the search result
      AppState.selectedMatch = searchResult;
    }

    // Store the fetched data
    AppState.issueData = result.issueData;
    AppState.pricingData = result.pricingData;
    AppState.issueMatchResult = result.issueMatchResult;

    console.log('Fetched data - basic:', !!result.basicData, 'issue:', !!result.issueData, 'pricing:', !!result.pricingData);
    console.log('Issue match result:', result.issueMatchResult?.type);

    // Check if user needs to pick an issue
    if (result.issueMatchResult?.type === 'USER_PICK' && result.issueOptions && result.issueOptions.length > 0) {
      console.log('USER_PICK scenario - showing issue picker with', result.issueOptions.length, 'options');
      showStatus('Multiple issues found. Please select the correct one...');

      // Show issue picker modal
      const pickerResult = await showIssuePicker(result.issueOptions, AppState.currentCoin);
      console.log('Issue picker result:', pickerResult);

      if (pickerResult.action === 'selected' && pickerResult.issue) {
        console.log('User selected issue:', pickerResult.issue);

        // Store the selected issue as issueData
        AppState.issueData = pickerResult.issue;

        // Fetch pricing for the selected issue if pricing was requested
        const settings = await window.api.getSettings();
        if (settings.fetchSettings.pricingData) {
          showStatus('Fetching pricing for selected issue...');
          try {
            const pricingResult = await window.electronAPI.fetchPricingForIssue({
              typeId: AppState.selectedMatch.id,
              issueId: pickerResult.issue.id
            });

            if (pricingResult.success) {
              AppState.pricingData = pricingResult.pricingData;
              console.log('Pricing fetched for selected issue:', !!AppState.pricingData);
            } else {
              console.error('Failed to fetch pricing:', pricingResult.error);
              AppState.pricingData = null;
            }
          } catch (error) {
            console.error('Error fetching pricing for selected issue:', error);
            AppState.pricingData = null;
          }
        }
      } else if (pickerResult.action === 'skip') {
        console.log('User chose to skip issue selection');
        AppState.issueData = null;
        AppState.pricingData = null;
      } else {
        // User cancelled - don't proceed
        console.log('User cancelled issue selection');
        showStatus('Issue selection cancelled.', 'info');
        return;
      }
    }

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
      console.log(`  ✅ Auto-selecting '${fieldName}' (current empty, numista has value)`);
    } else {
      console.log(`  - Not selecting '${fieldName}' (hasCurrentValue=${data.hasCurrentValue}, hasNumistaValue=${data.hasNumistaValue})`);
    }
  }

  return selection;
}

/**
 * Render side-by-side image comparison
 * @param {HTMLElement} container - Container element to append to
 */
async function renderImageComparison(container) {
  const imageSection = document.createElement('div');
  imageSection.className = 'image-comparison-section';

  const heading = document.createElement('h3');
  heading.textContent = 'Image Comparison';
  heading.style.marginBottom = '1rem';
  imageSection.appendChild(heading);

  const imageRow = document.createElement('div');
  imageRow.className = 'image-comparison-row';

  // User's images column
  const userColumn = document.createElement('div');
  userColumn.className = 'image-comparison-column';

  const userHeading = document.createElement('div');
  userHeading.className = 'image-comparison-heading';
  userHeading.textContent = 'Your Coin';
  userColumn.appendChild(userHeading);

  const userImages = document.createElement('div');
  userImages.className = 'image-comparison-images';

  // Load user's images from database
  try {
    const result = await window.electronAPI.getCoinImages(AppState.currentCoin.id);
    if (result.success && result.images) {
      const userObverse = document.createElement('img');
      userObverse.className = 'comparison-image';
      userObverse.src = result.images.obverse || getImagePlaceholder('obverse');
      userObverse.alt = 'Your obverse';
      userObverse.title = 'Your obverse';

      const userReverse = document.createElement('img');
      userReverse.className = 'comparison-image';
      userReverse.src = result.images.reverse || getImagePlaceholder('reverse');
      userReverse.alt = 'Your reverse';
      userReverse.title = 'Your reverse';

      userImages.appendChild(userObverse);
      userImages.appendChild(userReverse);
    } else {
      userImages.innerHTML = '<p style="color: #666;">No images available</p>';
    }
  } catch (error) {
    console.error('Error loading user images:', error);
    userImages.innerHTML = '<p style="color: #999;">Error loading images</p>';
  }

  userColumn.appendChild(userImages);

  // Numista images column
  const numistaColumn = document.createElement('div');
  numistaColumn.className = 'image-comparison-column';

  const numistaHeading = document.createElement('div');
  numistaHeading.className = 'image-comparison-heading';
  numistaHeading.textContent = 'Numista Match';
  numistaColumn.appendChild(numistaHeading);

  const numistaImages = document.createElement('div');
  numistaImages.className = 'image-comparison-images';

  // Get Numista images from selected match
  if (AppState.selectedMatch) {
    const numistaObverse = document.createElement('img');
    numistaObverse.className = 'comparison-image';
    numistaObverse.src = AppState.selectedMatch.obverse_thumbnail || getImagePlaceholder('obverse');
    numistaObverse.alt = 'Numista obverse';
    numistaObverse.title = 'Numista obverse';

    const numistaReverse = document.createElement('img');
    numistaReverse.className = 'comparison-image';
    numistaReverse.src = AppState.selectedMatch.reverse_thumbnail || getImagePlaceholder('reverse');
    numistaReverse.alt = 'Numista reverse';
    numistaReverse.title = 'Numista reverse';

    numistaImages.appendChild(numistaObverse);
    numistaImages.appendChild(numistaReverse);
  } else {
    numistaImages.innerHTML = '<p style="color: #666;">No match selected</p>';
  }

  numistaColumn.appendChild(numistaImages);

  // Add download button below images
  if (AppState.selectedMatch) {
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn btn-primary';
    downloadBtn.style.marginTop = '1rem';
    downloadBtn.style.width = '100%';
    downloadBtn.textContent = 'Download Images to Collection';
    downloadBtn.addEventListener('click', async () => {
      await handleImageDownload();
    });
    numistaColumn.appendChild(downloadBtn);
  }

  imageRow.appendChild(userColumn);
  imageRow.appendChild(numistaColumn);
  imageSection.appendChild(imageRow);

  container.appendChild(imageSection);
}

/**
 * Handle downloading images from Numista and storing in database
 */
async function handleImageDownload() {
  if (!AppState.selectedMatch || !AppState.currentCoin) {
    showStatus('No match or coin selected', 'error');
    return;
  }

  try {
    showStatus('Downloading images from Numista...');

    // Extract image URLs from the selected match
    const imageUrls = {
      obverse: AppState.selectedMatch.obverse_thumbnail?.replace('150x150', '400x400'),
      reverse: AppState.selectedMatch.reverse_thumbnail?.replace('150x150', '400x400'),
      edge: AppState.selectedMatch.edge_thumbnail?.replace('150x150', '400x400')
    };

    // Call backend to download and store
    const result = await window.electronAPI.downloadAndStoreImages({
      coinId: AppState.currentCoin.id,
      imageUrls
    });

    if (result.success) {
      showStatus('Images downloaded successfully!', 'success');
      // Refresh the image comparison display
      renderFieldComparison();
    } else {
      showStatus(`Error downloading images: ${result.error}`, 'error');
    }
  } catch (error) {
    console.error('Error downloading images:', error);
    showStatus(`Error downloading images: ${error.message}`, 'error');
  }
}

function renderFieldComparison() {
  const container = document.getElementById('fieldComparison');
  container.innerHTML = '';

  // Add image comparison section at the top
  renderImageComparison(container);

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
// Issue Picker Modal
// =============================================================================

/**
 * Show the Issue Picker modal when multiple issues are found
 * @param {Array} issueOptions - Array of issue objects from Numista
 * @param {Object} coin - User's coin data
 */
async function showIssuePicker(issueOptions, coin) {
  const modal = document.getElementById('issuePickerModal');
  const coinNameSpan = document.getElementById('issuePickerCoinName');
  const userYearSpan = document.getElementById('issuePickerUserYear');
  const userMintmarkSpan = document.getElementById('issuePickerUserMintmark');
  const userTypeSpan = document.getElementById('issuePickerUserType');
  const optionsList = document.getElementById('issueOptionsList');
  const applyBtn = document.getElementById('applyIssueSelectionBtn');
  const skipBtn = document.getElementById('skipIssueSelectionBtn');
  const closeBtn = document.getElementById('issuePickerCloseBtn');

  if (!modal) {
    console.error('Issue Picker modal not found');
    return null;
  }

  // Set coin name and user's coin info
  coinNameSpan.textContent = coin.title || 'this coin';
  userYearSpan.textContent = coin.year || '(not specified)';
  userMintmarkSpan.textContent = coin.mintmark || '(not specified)';
  userTypeSpan.textContent = coin.type || '(regular/circulation)';

  // Clear previous options
  optionsList.innerHTML = '';

  // Store selected issue
  let selectedIssue = null;

  // Render issue options
  issueOptions.forEach((issue, index) => {
    const optionDiv = document.createElement('div');
    optionDiv.className = 'issue-option';
    optionDiv.dataset.issueIndex = index;

    // Determine if this issue matches user's coin data
    const matchesYear = issue.year == coin.year;
    const matchesMintmark = coin.mintmark && issue.mint_letter &&
                           issue.mint_letter.toLowerCase() === coin.mintmark.toLowerCase();
    const matchesType = !coin.type || coin.type === '' ?
                       (!issue.comment || issue.comment === '') :
                       (issue.comment && issue.comment.toLowerCase().includes(coin.type.toLowerCase()));

    const isFullMatch = matchesYear && matchesMintmark;
    const isPartialMatch = matchesYear && (matchesMintmark || matchesType);

    optionDiv.innerHTML = `
      <div class="issue-option-header">
        <input type="radio" name="issueSelection" class="issue-option-radio" value="${index}">
        <div class="issue-option-title">
          ${issue.year || '?'} ${issue.mint_letter ? `- ${issue.mint_letter}` : ''}
          ${issue.comment ? `(${issue.comment})` : ''}
          ${isFullMatch ? '<span class="issue-option-match-badge">EXACT MATCH</span>' : ''}
          ${isPartialMatch && !isFullMatch ? '<span class="issue-option-partial-badge">PARTIAL MATCH</span>' : ''}
        </div>
      </div>
      <div class="issue-option-details">
        <span class="issue-detail-label">Year:</span>
        <span class="issue-detail-value">${issue.year || '<span class="empty">(none)</span>'}</span>

        <span class="issue-detail-label">Mintmark:</span>
        <span class="issue-detail-value ${!issue.mint_letter ? 'empty' : ''}">
          ${issue.mint_letter || '(none)'}
        </span>

        <span class="issue-detail-label">Mintage:</span>
        <span class="issue-detail-value ${!issue.mintage ? 'empty' : ''}">
          ${issue.mintage ? issue.mintage.toLocaleString() : '(unknown)'}
        </span>

        ${issue.comment ? `
          <span class="issue-detail-label">Type:</span>
          <span class="issue-detail-value">${issue.comment}</span>
        ` : ''}
      </div>
    `;

    // Add click handler to select this option
    optionDiv.addEventListener('click', (e) => {
      // Clear all selections
      document.querySelectorAll('.issue-option').forEach(opt => {
        opt.classList.remove('selected');
      });
      document.querySelectorAll('.issue-option-radio').forEach(radio => {
        radio.checked = false;
      });

      // Select this option
      optionDiv.classList.add('selected');
      const radio = optionDiv.querySelector('.issue-option-radio');
      radio.checked = true;
      selectedIssue = issue;
      applyBtn.disabled = false;
    });

    // Also handle radio button clicks
    const radio = optionDiv.querySelector('.issue-option-radio');
    radio.addEventListener('change', () => {
      if (radio.checked) {
        selectedIssue = issue;
        applyBtn.disabled = false;
      }
    });

    optionsList.appendChild(optionDiv);
  });

  // Show modal
  modal.style.display = 'flex';

  // Return a promise that resolves when user makes a selection
  return new Promise((resolve) => {
    const cleanup = () => {
      modal.style.display = 'none';
      applyBtn.removeEventListener('click', handleApply);
      skipBtn.removeEventListener('click', handleSkip);
      closeBtn.removeEventListener('click', handleClose);
    };

    const handleApply = () => {
      cleanup();
      resolve({ action: 'selected', issue: selectedIssue });
    };

    const handleSkip = () => {
      cleanup();
      resolve({ action: 'skip', issue: null });
    };

    const handleClose = () => {
      cleanup();
      resolve({ action: 'cancel', issue: null });
    };

    applyBtn.addEventListener('click', handleApply);
    skipBtn.addEventListener('click', handleSkip);
    closeBtn.addEventListener('click', handleClose);
  });
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
// Filter & Sort
// =============================================================================

document.getElementById('statusFilter').addEventListener('change', (e) => {
  AppState.filterSort.statusFilter = e.target.value;
  AppState.pagination.currentPage = 1; // Reset to first page
  loadCoins();
});

document.getElementById('freshnessFilter').addEventListener('change', (e) => {
  AppState.filterSort.freshnessFilter = e.target.value;
  AppState.pagination.currentPage = 1; // Reset to first page
  loadCoins();
});

document.getElementById('sortBy').addEventListener('change', (e) => {
  AppState.filterSort.sortBy = e.target.value;
  AppState.pagination.currentPage = 1; // Reset to first page
  loadCoins();
});

document.getElementById('resetFiltersBtn').addEventListener('click', () => {
  // Reset all filters to default values
  AppState.filterSort.statusFilter = 'all';
  AppState.filterSort.freshnessFilter = 'all';
  AppState.filterSort.sortBy = 'title';
  AppState.filterSort.sortOrder = 'ASC';
  AppState.pagination.currentPage = 1;

  // Update the UI dropdowns to reflect the reset
  document.getElementById('statusFilter').value = 'all';
  document.getElementById('freshnessFilter').value = 'all';
  document.getElementById('sortBy').value = 'title';

  // Reload coins with reset filters
  loadCoins();
});

// =============================================================================
// Pagination
// =============================================================================

document.getElementById('firstPageBtn').addEventListener('click', () => {
  AppState.pagination.currentPage = 1;
  loadCoins();
});

document.getElementById('prevPageBtn').addEventListener('click', () => {
  if (AppState.pagination.currentPage > 1) {
    AppState.pagination.currentPage--;
    loadCoins();
  }
});

document.getElementById('nextPageBtn').addEventListener('click', () => {
  if (AppState.pagination.currentPage < AppState.pagination.totalPages) {
    AppState.pagination.currentPage++;
    loadCoins();
  }
});

document.getElementById('lastPageBtn').addEventListener('click', () => {
  AppState.pagination.currentPage = AppState.pagination.totalPages;
  loadCoins();
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
    // Basic data checkbox
    const basicCheckbox = document.getElementById('fetchBasicData');
    if (basicCheckbox) {
      basicCheckbox.checked = fetchSettings.basicData !== undefined ? fetchSettings.basicData : true;
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
      const basicCheckbox = document.getElementById('fetchBasicData');
      const issueCheckbox = document.getElementById('fetchIssueData');
      const pricingCheckbox = document.getElementById('fetchPricingData');
      const currencySelect = document.getElementById('pricingCurrency');

      const newSettings = {
        basicData: basicCheckbox ? basicCheckbox.checked : true,
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
    const basicCheckbox = document.getElementById('fetchBasicData');
    const issueCheckbox = document.getElementById('fetchIssueData');
    const pricingCheckbox = document.getElementById('fetchPricingData');

    return {
      basicData: basicCheckbox ? basicCheckbox.checked : true,
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
      statusMessage.textContent = `✅ ${message}`;
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
      statusMessage.textContent = `⚠️ ${message}`;
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
