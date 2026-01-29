/**
 * Freshness Calculator
 * 
 * Calculates how fresh/current pricing data is based on timestamps.
 * Used to show visual indicators throughout the UI.
 * 
 * Thresholds:
 * - 🟢 Current: < 3 months
 * - 🟡 Recent: 3 months - 1 year
 * - 🟠 Aging: 1-2 years
 * - 🔴 Outdated: > 2 years
 * - ⚪ Never: No pricing data
 */

/**
 * Get pricing freshness information
 * 
 * @param {string|null} timestamp - ISO timestamp of last pricing update
 * @returns {Object} - { status, icon, text, color, ageMonths, ageText }
 */
function getPricingFreshness(timestamp) {
  // Handle no timestamp
  if (!timestamp) {
    return {
      status: 'NEVER_UPDATED',
      icon: '⚪',
      text: 'Never Updated',
      color: '#95a5a6',
      ageMonths: null,
      ageText: 'No pricing data'
    };
  }

  try {
    const pricingDate = new Date(timestamp);
    const now = new Date();
    
    // Calculate age in months
    const ageMs = now - pricingDate;
    const ageMonths = ageMs / (1000 * 60 * 60 * 24 * 30.44); // Average month length
    const ageYears = ageMonths / 12;

    // Determine freshness level
    if (ageMonths < 3) {
      return {
        status: 'CURRENT',
        icon: '🟢',
        text: 'Current',
        color: '#27ae60',
        ageMonths,
        ageText: formatAge(ageMonths, ageYears)
      };
    }
    
    if (ageYears < 1) {
      return {
        status: 'RECENT',
        icon: '🟡',
        text: 'Recent',
        color: '#f39c12',
        ageMonths,
        ageText: formatAge(ageMonths, ageYears)
      };
    }
    
    if (ageYears < 2) {
      return {
        status: 'AGING',
        icon: '🟠',
        text: 'Aging',
        color: '#e67e22',
        ageMonths,
        ageText: formatAge(ageMonths, ageYears)
      };
    }
    
    return {
      status: 'OUTDATED',
      icon: '🔴',
      text: 'Outdated',
      color: '#e74c3c',
      ageMonths,
      ageText: formatAge(ageMonths, ageYears)
    };
    
  } catch (error) {
    console.error('Error calculating pricing freshness:', error);
    return {
      status: 'NEVER_UPDATED',
      icon: '⚪',
      text: 'Unknown',
      color: '#95a5a6',
      ageMonths: null,
      ageText: 'Invalid timestamp'
    };
  }
}

/**
 * Format age in human-readable text
 * 
 * @param {number} ageMonths - Age in months
 * @param {number} ageYears - Age in years
 * @returns {string} - Formatted text like "2 months ago" or "1.5 years ago"
 */
function formatAge(ageMonths, ageYears) {
  if (ageMonths < 1) {
    const days = Math.round(ageMonths * 30.44);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
  
  if (ageMonths < 3) {
    const months = Math.round(ageMonths);
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  }
  
  if (ageYears < 1) {
    const months = Math.round(ageMonths);
    return `${months} months ago`;
  }
  
  if (ageYears < 2) {
    const years = ageYears.toFixed(1);
    return `${years} year${years !== '1.0' ? 's' : ''} ago`;
  }
  
  const years = Math.round(ageYears);
  return `${years} years ago`;
}

/**
 * Get short freshness label for compact display
 * 
 * @param {string|null} timestamp - ISO timestamp
 * @returns {string} - Short label like "Current" or "2yr old"
 */
function getShortFreshnessLabel(timestamp) {
  const freshness = getPricingFreshness(timestamp);
  
  if (freshness.status === 'NEVER_UPDATED') {
    return 'Never';
  }
  
  if (freshness.status === 'CURRENT') {
    return 'Current';
  }
  
  const ageMonths = freshness.ageMonths;
  const ageYears = ageMonths / 12;
  
  if (ageYears < 1) {
    return `${Math.round(ageMonths)}mo`;
  }
  
  return `${ageYears.toFixed(1)}yr`;
}

/**
 * Get freshness badge HTML for display
 * 
 * @param {string|null} timestamp - ISO timestamp
 * @param {boolean} includeText - Include text label (default true)
 * @returns {string} - HTML string for badge
 */
function getFreshnessBadgeHTML(timestamp, includeText = true) {
  const freshness = getPricingFreshness(timestamp);
  
  const badge = `
    <span class="freshness-badge freshness-${freshness.status.toLowerCase()}" 
          style="color: ${freshness.color};" 
          title="${freshness.ageText}">
      ${freshness.icon}${includeText ? ' ' + freshness.text : ''}
    </span>
  `;
  
  return badge.trim();
}

/**
 * Get CSS class for freshness level
 * 
 * @param {string|null} timestamp - ISO timestamp
 * @returns {string} - CSS class name
 */
function getFreshnessClass(timestamp) {
  const freshness = getPricingFreshness(timestamp);
  return `freshness-${freshness.status.toLowerCase()}`;
}

/**
 * Check if pricing needs updating (>1 year old)
 * 
 * @param {string|null} timestamp - ISO timestamp
 * @returns {boolean} - True if pricing is aging or outdated
 */
function needsPricingUpdate(timestamp) {
  const freshness = getPricingFreshness(timestamp);
  return freshness.status === 'AGING' || 
         freshness.status === 'OUTDATED' || 
         freshness.status === 'NEVER_UPDATED';
}

/**
 * Get warning message for outdated pricing
 * 
 * @param {string|null} timestamp - ISO timestamp
 * @returns {string|null} - Warning message or null if not needed
 */
function getPricingWarning(timestamp) {
  const freshness = getPricingFreshness(timestamp);
  
  if (freshness.status === 'OUTDATED') {
    return `⚠️ Pricing data is outdated (${freshness.ageText}). Consider updating.`;
  }
  
  if (freshness.status === 'AGING') {
    return `⚠️ Pricing data is aging (${freshness.ageText}). May want to update soon.`;
  }
  
  if (freshness.status === 'NEVER_UPDATED') {
    return 'ℹ️ No pricing data available yet.';
  }
  
  return null;
}

/**
 * Sort coins by pricing freshness
 * Used for sorting coin lists by how recent the pricing is
 * 
 * @param {Array} coins - Array of coin objects with pricingData.timestamp
 * @param {string} order - 'asc' (oldest first) or 'desc' (newest first)
 * @returns {Array} - Sorted array
 */
function sortByFreshness(coins, order = 'desc') {
  return coins.sort((a, b) => {
    const timestampA = a.pricingData?.timestamp;
    const timestampB = b.pricingData?.timestamp;
    
    // Handle null timestamps (push to end)
    if (!timestampA && !timestampB) return 0;
    if (!timestampA) return 1;
    if (!timestampB) return -1;
    
    const dateA = new Date(timestampA);
    const dateB = new Date(timestampB);
    
    if (order === 'asc') {
      return dateA - dateB; // Oldest first
    } else {
      return dateB - dateA; // Newest first
    }
  });
}

/**
 * Get breakdown of coins by freshness
 * 
 * @param {Array} coins - Array of coin objects with pricingData.timestamp
 * @returns {Object} - { current, recent, aging, outdated, never }
 */
function getFreshnessBreakdown(coins) {
  const breakdown = {
    current: 0,
    recent: 0,
    aging: 0,
    outdated: 0,
    never: 0
  };
  
  for (const coin of coins) {
    const timestamp = coin.pricingData?.timestamp;
    const freshness = getPricingFreshness(timestamp);
    const key = freshness.status.toLowerCase().replace('_', '');
    
    if (breakdown[key] !== undefined) {
      breakdown[key]++;
    } else if (freshness.status === 'NEVER_UPDATED') {
      breakdown.never++;
    }
  }
  
  return breakdown;
}

/**
 * Format last updated timestamp for display
 * 
 * @param {string|null} timestamp - ISO timestamp
 * @returns {string} - Formatted date or "Never"
 */
function formatLastUpdated(timestamp) {
  if (!timestamp) {
    return 'Never';
  }
  
  try {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid date';
  }
}

/**
 * Export all functions
 */
module.exports = {
  getPricingFreshness,
  getShortFreshnessLabel,
  getFreshnessBadgeHTML,
  getFreshnessClass,
  needsPricingUpdate,
  getPricingWarning,
  sortByFreshness,
  getFreshnessBreakdown,
  formatLastUpdated,
  formatAge
};
