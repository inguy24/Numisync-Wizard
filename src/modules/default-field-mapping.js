/**
 * Default Field Mapping Configuration
 * OpenNumismat-Numista Data Enrichment Tool
 * 
 * Maps OpenNumismat database fields to Numista API response fields.
 * Users can customize these mappings in their preferences.
 * 
 * Based on final analysis of Numista API v3.29.0 Swagger specification
 * and OpenNumismat SQLite schema (110 fields analyzed)
 * 
 * Last Updated: 2026-01-21
 */

/**
 * Field Mapping Entry Structure:
 * {
 *   numistaPath: 'path.to.numista.field',  // Dot notation for nested fields
 *   transform: function(value, fullData) { ... },  // Optional transformation function
 *   priority: 'HIGH' | 'MEDIUM' | 'LOW',   // Import priority
 *   enabled: true | false,                  // Default enabled state
 *   description: 'Human readable description',
 *   requiresIssueData: boolean              // Requires separate issue API call
 * }
 */

const DEFAULT_FIELD_MAPPING = {
  
  // ============================================================================
  // IDENTIFICATION FIELDS (HIGH PRIORITY)
  // ============================================================================
  
  title: {
    numistaPath: 'title',
    transform: null,
    priority: 'HIGH',
    enabled: true,
    requiresIssueData: false,
    description: 'Coin title/name'
  },
  
  category: {
    numistaPath: 'category',
    transform: null,
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: false,
    description: 'Category (coin, banknote, exonumia)'
  },
  
  series: {
    numistaPath: 'series',
    transform: null,
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: false,
    description: 'Series name'
  },
  
  // ============================================================================
  // GEOGRAPHIC/POLITICAL FIELDS (HIGH PRIORITY)
  // ============================================================================
  
  country: {
    numistaPath: 'issuer.name',
    transform: null,
    priority: 'HIGH',
    enabled: true,
    requiresIssueData: false,
    description: 'Issuing country/entity name'
  },
  
  period: {
    numistaPath: 'ruler',
    transform: (value) => {
      // Period comes from ruler[0].group.name
      // Example: "Vichy (1940-1944)", "Victorian Era", "House of Hanover"
      if (!value || !Array.isArray(value) || value.length === 0) return null;
      if (!value[0].group || !value[0].group.name) return null;
      return value[0].group.name;
    },
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: false,
    description: 'Historical period (e.g., "Vichy (1940-1944)")'
  },
  
  type: {
    numistaPath: 'type',
    transform: null,
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: false,
    description: 'Coin type (e.g., "Standard circulation coin", "Commemorative")'
  },
  
  ruler: {
    numistaPath: 'ruler',
    transform: (value) => {
      if (!value || !Array.isArray(value) || value.length === 0) return null;
      // Return first ruler's name, or join multiple rulers with "/"
      return value.map(r => r.name).join(' / ');
    },
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: false,
    description: 'Monarch/leader name (from array)'
  },
  
  mint: {
    numistaPath: 'mints',
    transform: (value) => {
      if (!value || !Array.isArray(value) || value.length === 0) return null;
      // Return first mint's name
      return value[0].name || null;
    },
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: false,
    description: 'Mint name (from array)'
  },
  
  // ============================================================================
  // VALUE/DENOMINATION FIELDS (HIGH PRIORITY)
  // ============================================================================
  
  value: {
    numistaPath: 'value.text',
    transform: (value) => {
      if (!value) return null;
      // Extract just the number from text like "1 Penny" -> "1"
      // Handle various formats: "1 Penny", "5 Cents", "1/2 Dollar", etc.
      const match = value.match(/^[\d\/\.]+/);
      return match ? match[0] : value;
    },
    priority: 'HIGH',
    enabled: true,
    requiresIssueData: false,
    description: 'Face value (numeric part only, e.g., "1" from "1 Penny")'
  },
  
  unit: {
    numistaPath: 'value.text',
    transform: (value) => {
      if (!value) return null;
      // Extract unit from text like "5 Cents" -> "Cents"
      const match = value.match(/[A-Za-z]+$/);
      return match ? match[0] : null;
    },
    priority: 'HIGH',
    enabled: true,
    requiresIssueData: false,
    description: 'Currency unit (extracted from value text)'
  },
  
  // ============================================================================
  // PHYSICAL SPECIFICATIONS (HIGH PRIORITY)
  // ============================================================================
  
  material: {
    numistaPath: 'composition.text',
    transform: null,  // Simple version: store full text
    priority: 'HIGH',
    enabled: true,
    requiresIssueData: false,
    description: 'Material/composition (full text)'
  },
  
  weight: {
    numistaPath: 'weight',
    transform: null,
    priority: 'HIGH',
    enabled: true,
    requiresIssueData: false,
    description: 'Weight in grams'
  },
  
  diameter: {
    numistaPath: 'size',  // NOTE: Numista uses "size", not "diameter"
    transform: null,
    priority: 'HIGH',
    enabled: true,
    requiresIssueData: false,
    description: 'Diameter in millimeters'
  },
  
  thickness: {
    numistaPath: 'thickness',
    transform: null,
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: false,
    description: 'Thickness in millimeters'
  },
  
  shape: {
    numistaPath: 'shape',
    transform: null,
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: false,
    description: 'Coin shape (Round, Square, etc.)'
  },
  
  // ============================================================================
  // EDGE FIELDS (MEDIUM PRIORITY)
  // ============================================================================
  
  edge: {
    numistaPath: 'edge.description',
    transform: null,
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: false,
    description: 'Edge type/description'
  },
  
  edgelabel: {
    numistaPath: 'edge.lettering',
    transform: null,
    priority: 'LOW',
    enabled: true,
    requiresIssueData: false,
    description: 'Edge lettering/inscription'
  },
  
  // ============================================================================
  // OBVERSE FIELDS (HIGH PRIORITY)
  // ============================================================================
  
  obversedesign: {
    numistaPath: 'obverse.description',
    transform: null,
    priority: 'HIGH',
    enabled: true,
    requiresIssueData: false,
    description: 'Obverse design description'
  },
  
  obversedesigner: {
    numistaPath: 'obverse.designers',
    transform: (value) => {
      if (!value || !Array.isArray(value) || value.length === 0) return null;
      // Join multiple designers with "/"
      return value.join(' / ');
    },
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: false,
    description: 'Obverse designer name(s)'
  },
  
  obverseengraver: {
    numistaPath: 'obverse.engravers',
    transform: (value) => {
      if (!value || !Array.isArray(value) || value.length === 0) return null;
      // Join multiple engravers with "/"
      return value.join(' / ');
    },
    priority: 'LOW',
    enabled: true,
    requiresIssueData: false,
    description: 'Obverse engraver name(s)'
  },
  
  obversevar: {
    numistaPath: 'obverse.description',
    transform: null,
    priority: 'LOW',
    enabled: false,  // Same as obversedesign, user may not want duplicate
    requiresIssueData: false,
    description: 'Obverse description (variant field)'
  },
  
  // ============================================================================
  // REVERSE FIELDS (HIGH PRIORITY)
  // ============================================================================
  
  reversedesign: {
    numistaPath: 'reverse.description',
    transform: null,
    priority: 'HIGH',
    enabled: true,
    requiresIssueData: false,
    description: 'Reverse design description'
  },
  
  reversedesigner: {
    numistaPath: 'reverse.designers',
    transform: (value) => {
      if (!value || !Array.isArray(value) || value.length === 0) return null;
      // Join multiple designers with "/"
      return value.join(' / ');
    },
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: false,
    description: 'Reverse designer name(s)'
  },
  
  reverseengraver: {
    numistaPath: 'reverse.engravers',
    transform: (value) => {
      if (!value || !Array.isArray(value) || value.length === 0) return null;
      // Join multiple engravers with "/"
      return value.join(' / ');
    },
    priority: 'LOW',
    enabled: true,
    requiresIssueData: false,
    description: 'Reverse engraver name(s)'
  },
  
  reversevar: {
    numistaPath: 'reverse.description',
    transform: null,
    priority: 'LOW',
    enabled: false,  // Same as reversedesign, user may not want duplicate
    requiresIssueData: false,
    description: 'Reverse description (variant field)'
  },
  
  // ============================================================================
  // IMAGE FIELDS (HIGH PRIORITY)
  // Note: Images require downloading from URLs and converting to BLOBs
  // ============================================================================
  
  obverseimg: {
    numistaPath: 'obverse.picture',
    transform: null,  // Transform will be handled by image downloader module
    priority: 'HIGH',
    enabled: true,
    requiresIssueData: false,
    description: 'Obverse image URL (requires download)'
  },
  
  reverseimg: {
    numistaPath: 'reverse.picture',
    transform: null,
    priority: 'HIGH',
    enabled: true,
    requiresIssueData: false,
    description: 'Reverse image URL (requires download)'
  },
  
  edgeimg: {
    numistaPath: 'edge.picture',
    transform: null,
    priority: 'LOW',
    enabled: true,
    requiresIssueData: false,
    description: 'Edge image URL (requires download)'
  },
  
  // ============================================================================
  // MINTAGE (MEDIUM PRIORITY)
  // ============================================================================
  
  mintage: {
    numistaPath: 'issue.mintage',  // Prefer issue-specific mintage
    transform: null,
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: true,  // Requires separate API call for issues
    description: 'Total mintage (from issue data, requires year match)'
  },
  
  mintmark: {
    numistaPath: 'issue.mint_letter',  // Mint mark from issue data
    transform: null,
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: true,  // Requires separate API call for issues
    description: 'Mint mark (from issue data, requires year match)'
  },
  
  // ============================================================================
  // PRICING DATA (MEDIUM PRIORITY)
  // Requires both issue data AND pricing data from separate API calls
  // ============================================================================
  
  price1: {
    numistaPath: 'pricing.unc',  // Uncirculated grade -> price1
    transform: null,
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: true,  // Needs specific issue
    requiresPricingData: true,  // Requires getIssuePricing API call
    description: 'Price 1 - Uncirculated (UNC) grade'
  },
  
  price2: {
    numistaPath: 'pricing.xf',  // Extremely Fine grade -> price2
    transform: null,
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: true,
    requiresPricingData: true,
    description: 'Price 2 - Extremely Fine (XF/EF) grade'
  },
  
  price3: {
    numistaPath: 'pricing.vf',  // Very Fine grade -> price3
    transform: null,
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: true,
    requiresPricingData: true,
    description: 'Price 3 - Very Fine (VF) grade'
  },
  
  price4: {
    numistaPath: 'pricing.f',  // Fine grade -> price4
    transform: null,
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: true,
    requiresPricingData: true,
    description: 'Price 4 - Fine (F) grade'
  },
  
  // ============================================================================
  // ORIENTATION (LOW PRIORITY)
  // ============================================================================
  
  axis: {
    numistaPath: 'orientation',
    transform: (value) => {
      // Map Numista values to OpenNumismat values
      if (!value) return null;
      const mapping = {
        'coin': '6',      // 6 o'clock (↑↓)
        'medal': '12',    // 12 o'clock (↑↑)
        'variable': null  // Can't map variable
      };
      return mapping[value] || null;
    },
    priority: 'LOW',
    enabled: false,
    requiresIssueData: false,
    description: 'Die axis orientation (coin=6, medal=12)'
  },
  
  // ============================================================================
  // CATALOG NUMBERS (HIGH PRIORITY - SPECIAL HANDLING)
  // NOTE: User needs to configure which catalog goes to which field
  // ============================================================================
  
  catalognum1: {
    numistaPath: 'references',
    transform: null,  // Special handling - see getCatalogNumber() helper
    priority: 'HIGH',
    enabled: true,
    requiresIssueData: false,
    catalogCode: 'KM',  // Default: Krause-Mishler
    description: 'Primary catalog number (KM by default)'
  },
  
  catalognum2: {
    numistaPath: 'references',
    transform: null,
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: false,
    catalogCode: 'Schön',  // Default: Schön
    description: 'Secondary catalog number (Schön by default)'
  },
  
  catalognum3: {
    numistaPath: 'references',
    transform: null,
    priority: 'LOW',
    enabled: true,
    requiresIssueData: false,
    catalogCode: 'Y',  // Default: Yeoman
    description: 'Tertiary catalog number (Y by default)'
  },
  
  catalognum4: {
    numistaPath: 'id',  // Numista's own ID number
    transform: (value) => value ? String(value) : null,  // Convert to string
    priority: 'LOW',
    enabled: true,  // Changed: enabled by default for Numista ID
    requiresIssueData: false,
    catalogCode: 'Numista',  // Default: Numista catalog
    description: 'Numista catalog number (Numista ID)'
  },
  
  // ============================================================================
  // FIELDS NOT MAPPED - No Numista equivalent
  // ============================================================================
  
  // These OpenNumismat fields have no equivalent in Numista:
  // - year: User preference - never override (handled separately)
  // - variety: No direct Numista equivalent
  // - region: May not exist in Numista API
  // - obvrev: No equivalent
  // - quality: No equivalent (user's collection data)
  // - rarity: No equivalent in type data
  // - fineness: Embedded in composition.text
  // - mintmark: Requires issue data (issue.mint_letter)
  // - material2: No direct equivalent (could parse composition)
  // - composition: Numista uses composition.text (mapped to material)
  // - All collection management fields (status, grade, storage, etc.)
  // - All transaction fields (prices, dates, places)
  // - User data fields (note, url, rating, tags)
  
};

/**
 * Helper function to extract catalog number from references array
 * 
 * @param {Array} references - Numista references array
 * @param {string} catalogCode - Catalog code to search for (e.g., 'KM', 'Schön')
 * @returns {string|null} - Catalog number or null if not found
 */
function getCatalogNumber(references, catalogCode) {
  if (!references || !Array.isArray(references)) {
    return null;
  }
  
  const ref = references.find(r => 
    r.catalogue && r.catalogue.code === catalogCode
  );
  
  return ref ? ref.number : null;
}

/**
 * Get value from nested path (e.g., 'obverse.description')
 * 
 * @param {Object} obj - Object to traverse
 * @param {string} path - Dot-separated path
 * @returns {*} - Value at path or null
 */
function getNestedValue(obj, path) {
  if (!obj || !path) return null;
  
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value === null || value === undefined) {
      return null;
    }
    value = value[key];
  }
  
  return value !== undefined ? value : null;
}

/**
 * Map catalog codes to full names for user-friendly display
 * Used when showing catalog numbers in the UI
 * 
 * @param {string} code - Catalog code (e.g., 'KM', 'Schön')
 * @returns {string} - Full name (e.g., 'Krause', 'Schön')
 */
function getCatalogDisplayName(code) {
  const nameMap = {
    'KM': 'Krause',
    'Schön': 'Schön',
    'Sch': 'Schön',
    'Y': 'Yeoman',
    'Numista': 'Numista',
    'N': 'Numista'
  };
  
  return nameMap[code] || code;  // Return code itself if not in map
}

/**
 * Format catalog number for display in UI
 * Shows both catalog name and number
 * 
 * @param {string} catalogCode - Catalog code (e.g., 'KM')
 * @param {string} number - Catalog number (e.g., '13')
 * @returns {string} - Formatted display (e.g., 'Krause# 13')
 */
function formatCatalogForDisplay(catalogCode, number) {
  if (!number) return null;
  const displayName = getCatalogDisplayName(catalogCode);
  return `${displayName}# ${number}`;
}

module.exports = {
  DEFAULT_FIELD_MAPPING,
  getCatalogNumber,
  getNestedValue,
  getCatalogDisplayName,
  formatCatalogForDisplay
};
