/**
 * @fileoverview default-field-mapping.js — Canonical field mapping: OpenNumismat columns → Numista API paths.
 *
 * Exports:
 *   DEFAULT_FIELD_MAPPING — per-field config: numistaPath, transform, priority, enabled, category, displayOrder
 *   NUMISTA_SOURCES — registry of 40+ Numista data sources (path, displayName, group, transform)
 *   getCatalogNumber(references, catalogCode) — extracts catalog number from references array
 *   getNestedValue(obj, path) — dot-notation path traversal (e.g., 'obverse.description')
 *   getCatalogDisplayName(code) — 'KM' → 'Krause', etc.
 *   formatCatalogForDisplay(catalogCode, number) — 'KM', '13' → 'Krause# 13'
 *   getSerializableSources() — IPC-safe NUMISTA_SOURCES (transform functions stripped)
 * Note: price1=UNC, price2=XF, price3=VF, price4=F (Lesson 21 — canonical mapping, defined here at lines 121-126)
 * Uses: (no external module dependencies — pure data and transform functions)
 * Called by: field-mapper.js, settings-manager.js, src/main/index.js (get-available-sources, get-field-mappings)
 */

/**
 * Field Mapping Entry Structure:
 * {
 *   numistaPath: 'path.to.numista.field',  // Dot notation for nested fields
 *   transform: function(value, fullData) { ... },  // Optional transformation function
 *   priority: 'HIGH' | 'MEDIUM' | 'LOW',   // Import priority
 *   enabled: true | false,                  // Default enabled state
 *   description: 'Human readable description',
 *   requiresIssueData: boolean,             // Requires separate issue API call
 *   defaultSourceKey: string                // Key into NUMISTA_SOURCES for default source
 * }
 */

// ============================================================================
// Shared Transform Functions
// Used by both NUMISTA_SOURCES and DEFAULT_FIELD_MAPPING
// ============================================================================

function transformRulerNames(value) {
  if (!value || !Array.isArray(value) || value.length === 0) return null;
  return value.map(r => r.name).join(' / ');
}

function transformRulerPeriod(value) {
  if (!value || !Array.isArray(value) || value.length === 0) return null;
  const groups = value.map(r => r.group?.name).filter(Boolean);
  if (groups.length === 0) return null;
  return [...new Set(groups)].join(' / ');
}

function transformValueNumber(value) {
  if (!value) return null;
  const match = value.match(/^[\d\/\.]+/);
  return match ? match[0] : value;
}

function transformValueUnit(value) {
  if (!value) return null;
  const trimmed = typeof value === 'string' ? value.trim() : value;
  const match = trimmed.match(/[\p{L}]+$/u);
  return match ? match[0] : null;
}

function transformMintName(value) {
  if (!value || !Array.isArray(value) || value.length === 0) return null;
  return value[0].name || null;
}

function transformOrientation(value) {
  if (!value) return null;
  const mapping = {
    'coin': '6',
    'medal': '12',
    'variable': null
  };
  return mapping[value] || null;
}

function transformDesigners(value) {
  if (!value || !Array.isArray(value) || value.length === 0) return null;
  return value.join(' / ');
}

function transformEngravers(value) {
  if (!value || !Array.isArray(value) || value.length === 0) return null;
  return value.join(' / ');
}

function transformToString(value) {
  return value ? String(value) : null;
}

// ============================================================================
// NUMISTA_SOURCES Registry
// Decouples source definitions (Numista path + transform) from target assignments
// ============================================================================

const NUMISTA_SOURCES = {
  'title':                   { path: 'title', displayName: 'Title', transform: null, group: 'Basic' },
  'category':                { path: 'category', displayName: 'Category', transform: null, group: 'Basic' },
  'series':                  { path: 'series', displayName: 'Series', transform: null, group: 'Basic' },
  'type':                    { path: 'type', displayName: 'Type', transform: null, group: 'Basic' },
  'shape':                   { path: 'shape', displayName: 'Shape', transform: null, group: 'Basic' },
  'comments':                { path: 'comments', displayName: 'Comments', transform: null, group: 'Basic' },
  'numista_id':              { path: 'id', displayName: 'Numista ID', transform: transformToString, group: 'Basic' },
  'issuer_name':             { path: 'issuer.name', displayName: 'Issuer Name', transform: null, group: 'Issuer' },
  'issuer_code':             { path: 'issuer.code', displayName: 'Issuer Code', transform: null, group: 'Issuer' },
  'ruler_names':             { path: 'ruler', displayName: 'Ruler Name(s)', transform: transformRulerNames, group: 'Ruler' },
  'ruler_period':            { path: 'ruler', displayName: 'Ruler Period/Group', transform: transformRulerPeriod, group: 'Ruler' },
  'value_full':              { path: 'value.text', displayName: 'Value (full text)', transform: null, group: 'Value' },
  'value_number':            { path: 'value.text', displayName: 'Value (number only)', transform: transformValueNumber, group: 'Value' },
  'value_unit':              { path: 'value.text', displayName: 'Value (unit only)', transform: transformValueUnit, group: 'Value' },
  'value_numeric':           { path: 'value.numeric_value', displayName: 'Numeric Value', transform: null, group: 'Value' },
  'currency_name':           { path: 'value.currency.name', displayName: 'Currency Name', transform: null, group: 'Value' },
  'composition_text':        { path: 'composition.text', displayName: 'Composition', transform: null, group: 'Physical' },
  'technique_text':          { path: 'technique.text', displayName: 'Technique', transform: null, group: 'Physical' },
  'weight':                  { path: 'weight', displayName: 'Weight (g)', transform: null, group: 'Physical' },
  'size':                    { path: 'size', displayName: 'Diameter (mm)', transform: null, group: 'Physical' },
  'thickness':               { path: 'thickness', displayName: 'Thickness (mm)', transform: null, group: 'Physical' },
  'orientation':             { path: 'orientation', displayName: 'Die Axis', transform: transformOrientation, group: 'Physical' },
  'obverse_description':     { path: 'obverse.description', displayName: 'Obverse Description', transform: null, group: 'Obverse' },
  'obverse_lettering':       { path: 'obverse.lettering', displayName: 'Obverse Lettering', transform: null, group: 'Obverse' },
  'obverse_lettering_trans': { path: 'obverse.lettering_translation', displayName: 'Obverse Lettering Translation', transform: null, group: 'Obverse' },
  'obverse_designers':       { path: 'obverse.designers', displayName: 'Obverse Designer(s)', transform: transformDesigners, group: 'Obverse' },
  'obverse_engravers':       { path: 'obverse.engravers', displayName: 'Obverse Engraver(s)', transform: transformEngravers, group: 'Obverse' },
  'obverse_picture':         { path: 'obverse.picture', displayName: 'Obverse Image', transform: null, group: 'Obverse' },
  'reverse_description':     { path: 'reverse.description', displayName: 'Reverse Description', transform: null, group: 'Reverse' },
  'reverse_lettering':       { path: 'reverse.lettering', displayName: 'Reverse Lettering', transform: null, group: 'Reverse' },
  'reverse_lettering_trans': { path: 'reverse.lettering_translation', displayName: 'Reverse Lettering Translation', transform: null, group: 'Reverse' },
  'reverse_designers':       { path: 'reverse.designers', displayName: 'Reverse Designer(s)', transform: transformDesigners, group: 'Reverse' },
  'reverse_engravers':       { path: 'reverse.engravers', displayName: 'Reverse Engraver(s)', transform: transformEngravers, group: 'Reverse' },
  'reverse_picture':         { path: 'reverse.picture', displayName: 'Reverse Image', transform: null, group: 'Reverse' },
  'edge_description':        { path: 'edge.description', displayName: 'Edge Description', transform: null, group: 'Edge' },
  'edge_lettering':          { path: 'edge.lettering', displayName: 'Edge Lettering', transform: null, group: 'Edge' },
  'edge_picture':            { path: 'edge.picture', displayName: 'Edge Image', transform: null, group: 'Edge' },
  'mint_name':               { path: 'mints', displayName: 'Mint Name', transform: transformMintName, group: 'Mint' },
  'issue_mintage':           { path: 'issue.mintage', displayName: 'Mintage', transform: null, group: 'Issue', requiresIssueData: true },
  'issue_mint_letter':       { path: 'issue.mint_letter', displayName: 'Mint Letter', transform: null, group: 'Issue', requiresIssueData: true },
  'pricing_unc':             { path: 'pricing.unc', displayName: 'Price - UNC', transform: null, group: 'Pricing', requiresPricingData: true },
  'pricing_au':              { path: 'pricing.au', displayName: 'Price - AU', transform: null, group: 'Pricing', requiresPricingData: true },
  'pricing_xf':              { path: 'pricing.xf', displayName: 'Price - XF', transform: null, group: 'Pricing', requiresPricingData: true },
  'pricing_vf':              { path: 'pricing.vf', displayName: 'Price - VF', transform: null, group: 'Pricing', requiresPricingData: true },
  'pricing_f':               { path: 'pricing.f', displayName: 'Price - F', transform: null, group: 'Pricing', requiresPricingData: true },
  'pricing_vg':              { path: 'pricing.vg', displayName: 'Price - VG', transform: null, group: 'Pricing', requiresPricingData: true },
  'pricing_g':               { path: 'pricing.g', displayName: 'Price - G', transform: null, group: 'Pricing', requiresPricingData: true },
  'catalog_references':      { path: 'references', displayName: 'Catalog References', transform: null, group: 'Catalog', isCatalog: true },
  'none':                    { path: null, displayName: '(Not Mapped)', transform: null, group: 'System' }
};

/**
 * Get serializable version of NUMISTA_SOURCES (without transform functions)
 * for sending to the renderer process via IPC
 */
function getSerializableSources() {
  const serializable = {};
  for (const [key, source] of Object.entries(NUMISTA_SOURCES)) {
    serializable[key] = {
      path: source.path,
      displayName: source.displayName,
      group: source.group,
      hasTransform: !!source.transform,
      requiresIssueData: source.requiresIssueData || false,
      requiresPricingData: source.requiresPricingData || false,
      isCatalog: source.isCatalog || false
    };
  }
  return serializable;
}

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
    description: 'Coin title/name',
    defaultSourceKey: 'title',
    category: 'main',
    displayOrder: 1
  },

  category: {
    numistaPath: 'category',
    transform: null,
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: false,
    description: 'Category (coin, banknote, exonumia)',
    defaultSourceKey: 'category',
    category: 'main',
    displayOrder: 2
  },

  series: {
    numistaPath: 'series',
    transform: null,
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: false,
    description: 'Series name',
    defaultSourceKey: 'series',
    category: 'main',
    displayOrder: 3
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
    description: 'Issuing country/entity name',
    defaultSourceKey: 'issuer_name',
    category: 'main',
    displayOrder: 4
  },

  period: {
    numistaPath: 'ruler',
    transform: transformRulerPeriod,
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: false,
    description: 'Historical period (e.g., "Vichy (1940-1944)")',
    defaultSourceKey: 'ruler_period',
    category: 'main',
    displayOrder: 5
  },

  type: {
    numistaPath: 'type',
    transform: null,
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: false,
    description: 'Coin type (e.g., "Standard circulation coin", "Commemorative")',
    defaultSourceKey: 'type',
    category: 'main',
    displayOrder: 6
  },

  ruler: {
    numistaPath: 'ruler',
    transform: transformRulerNames,
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: false,
    description: 'Monarch/leader name (from array)',
    defaultSourceKey: 'ruler_names',
    category: 'main',
    displayOrder: 7
  },

  mint: {
    numistaPath: 'mints',
    transform: transformMintName,
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: false,
    description: 'Mint name (resolved from mint letter when available)',
    defaultSourceKey: 'mint_name',
    category: 'main',
    displayOrder: 8
  },
  
  // ============================================================================
  // VALUE/DENOMINATION FIELDS (HIGH PRIORITY)
  // ============================================================================

  value: {
    numistaPath: 'value.text',
    transform: transformValueNumber,
    priority: 'HIGH',
    enabled: true,
    requiresIssueData: false,
    description: 'Face value (numeric part only, e.g., "1" from "1 Penny")',
    defaultSourceKey: 'value_number',
    category: 'main',
    displayOrder: 9
  },

  unit: {
    numistaPath: 'value.text',
    transform: transformValueUnit,
    priority: 'HIGH',
    enabled: true,
    requiresIssueData: false,
    description: 'Currency unit (extracted from value text)',
    defaultSourceKey: 'value_unit',
    category: 'main',
    displayOrder: 10
  },
  
  // ============================================================================
  // PHYSICAL SPECIFICATIONS (HIGH PRIORITY)
  // ============================================================================

  material: {
    numistaPath: 'composition.text',
    transform: null,
    priority: 'HIGH',
    enabled: true,
    requiresIssueData: false,
    description: 'Material/composition (full text)',
    defaultSourceKey: 'composition_text',
    category: 'main',
    displayOrder: 11
  },

  weight: {
    numistaPath: 'weight',
    transform: null,
    priority: 'HIGH',
    enabled: true,
    requiresIssueData: false,
    description: 'Weight in grams',
    defaultSourceKey: 'weight',
    category: 'main',
    displayOrder: 12
  },

  diameter: {
    numistaPath: 'size',
    transform: null,
    priority: 'HIGH',
    enabled: true,
    requiresIssueData: false,
    description: 'Diameter in millimeters',
    defaultSourceKey: 'size',
    category: 'main',
    displayOrder: 13
  },

  thickness: {
    numistaPath: 'thickness',
    transform: null,
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: false,
    description: 'Thickness in millimeters',
    defaultSourceKey: 'thickness',
    category: 'main',
    displayOrder: 14
  },

  shape: {
    numistaPath: 'shape',
    transform: null,
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: false,
    description: 'Coin shape (Round, Square, etc.)',
    defaultSourceKey: 'shape',
    category: 'main',
    displayOrder: 15
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
    description: 'Edge type/description',
    defaultSourceKey: 'edge_description',
    category: 'main',
    displayOrder: 16
  },

  edgelabel: {
    numistaPath: 'edge.lettering',
    transform: null,
    priority: 'LOW',
    enabled: true,
    requiresIssueData: false,
    description: 'Edge lettering/inscription',
    defaultSourceKey: 'edge_lettering',
    category: 'main',
    displayOrder: 17
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
    description: 'Obverse design description',
    defaultSourceKey: 'obverse_description',
    category: 'main',
    displayOrder: 18
  },

  obversedesigner: {
    numistaPath: 'obverse.designers',
    transform: transformDesigners,
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: false,
    description: 'Obverse designer name(s)',
    defaultSourceKey: 'obverse_designers',
    category: 'main',
    displayOrder: 19
  },

  obverseengraver: {
    numistaPath: 'obverse.engravers',
    transform: transformEngravers,
    priority: 'LOW',
    enabled: true,
    requiresIssueData: false,
    description: 'Obverse engraver name(s)',
    defaultSourceKey: 'obverse_engravers',
    category: 'main',
    displayOrder: 20
  },

  obversevar: {
    numistaPath: 'obverse.description',
    transform: null,
    priority: 'LOW',
    enabled: false,
    requiresIssueData: false,
    description: 'Obverse description (variant field)',
    defaultSourceKey: 'obverse_description',
    category: 'main',
    displayOrder: 21
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
    description: 'Reverse design description',
    defaultSourceKey: 'reverse_description',
    category: 'main',
    displayOrder: 22
  },

  reversedesigner: {
    numistaPath: 'reverse.designers',
    transform: transformDesigners,
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: false,
    description: 'Reverse designer name(s)',
    defaultSourceKey: 'reverse_designers',
    category: 'main',
    displayOrder: 23
  },

  reverseengraver: {
    numistaPath: 'reverse.engravers',
    transform: transformEngravers,
    priority: 'LOW',
    enabled: true,
    requiresIssueData: false,
    description: 'Reverse engraver name(s)',
    defaultSourceKey: 'reverse_engravers',
    category: 'main',
    displayOrder: 24
  },

  reversevar: {
    numistaPath: 'reverse.description',
    transform: null,
    priority: 'LOW',
    enabled: false,
    requiresIssueData: false,
    description: 'Reverse description (variant field)',
    defaultSourceKey: 'reverse_description',
    category: 'main',
    displayOrder: 25
  },
  
  // ============================================================================
  // IMAGE FIELDS (HIGH PRIORITY)
  // Note: Images require downloading from URLs and converting to BLOBs
  // ============================================================================

  obverseimg: {
    numistaPath: 'obverse.picture',
    transform: null,
    priority: 'HIGH',
    enabled: true,
    requiresIssueData: false,
    description: 'Obverse image URL (requires download)',
    defaultSourceKey: 'obverse_picture',
    category: 'main',
    displayOrder: 26
  },

  reverseimg: {
    numistaPath: 'reverse.picture',
    transform: null,
    priority: 'HIGH',
    enabled: true,
    requiresIssueData: false,
    description: 'Reverse image URL (requires download)',
    defaultSourceKey: 'reverse_picture',
    category: 'main',
    displayOrder: 27
  },

  edgeimg: {
    numistaPath: 'edge.picture',
    transform: null,
    priority: 'LOW',
    enabled: true,
    requiresIssueData: false,
    description: 'Edge image URL (requires download)',
    defaultSourceKey: 'edge_picture',
    category: 'main',
    displayOrder: 28
  },
  
  // ============================================================================
  // MINTAGE (MEDIUM PRIORITY) - Issue Data
  // ============================================================================

  mintage: {
    numistaPath: 'issue.mintage',
    transform: null,
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: true,
    description: 'Total mintage (from issue data, requires year match)',
    defaultSourceKey: 'issue_mintage',
    category: 'issue',
    displayOrder: 1
  },

  mintmark: {
    numistaPath: 'issue.mint_letter',
    transform: null,
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: true,
    description: 'Mint mark (from issue data, requires year match)',
    defaultSourceKey: 'issue_mint_letter',
    category: 'issue',
    displayOrder: 2
  },
  
  // ============================================================================
  // PRICING DATA (MEDIUM PRIORITY)
  // Requires both issue data AND pricing data from separate API calls
  // ============================================================================

  price1: {
    numistaPath: 'pricing.unc',
    transform: null,
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: true,
    requiresPricingData: true,
    description: 'Price 1 - Uncirculated (UNC) grade',
    defaultSourceKey: 'pricing_unc',
    category: 'pricing',
    displayOrder: 1
  },

  price2: {
    numistaPath: 'pricing.xf',
    transform: null,
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: true,
    requiresPricingData: true,
    description: 'Price 2 - Extremely Fine (XF/EF) grade',
    defaultSourceKey: 'pricing_xf',
    category: 'pricing',
    displayOrder: 2
  },

  price3: {
    numistaPath: 'pricing.vf',
    transform: null,
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: true,
    requiresPricingData: true,
    description: 'Price 3 - Very Fine (VF) grade',
    defaultSourceKey: 'pricing_vf',
    category: 'pricing',
    displayOrder: 3
  },

  price4: {
    numistaPath: 'pricing.f',
    transform: null,
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: true,
    requiresPricingData: true,
    description: 'Price 4 - Fine (F) grade',
    defaultSourceKey: 'pricing_f',
    category: 'pricing',
    displayOrder: 4
  },
  
  // ============================================================================
  // ORIENTATION (LOW PRIORITY)
  // ============================================================================

  axis: {
    numistaPath: 'orientation',
    transform: transformOrientation,
    priority: 'LOW',
    enabled: false,
    requiresIssueData: false,
    description: 'Die axis orientation (coin=6, medal=12)',
    defaultSourceKey: 'orientation',
    category: 'main',
    displayOrder: 29
  },
  
  // ============================================================================
  // CATALOG NUMBERS (HIGH PRIORITY - SPECIAL HANDLING)
  // NOTE: User needs to configure which catalog goes to which field
  // ============================================================================

  catalognum1: {
    numistaPath: 'references',
    transform: null,
    priority: 'HIGH',
    enabled: true,
    requiresIssueData: false,
    catalogCode: 'KM',
    description: 'Primary catalog number (KM by default)',
    defaultSourceKey: 'catalog_references',
    category: 'main',
    displayOrder: 30
  },

  catalognum2: {
    numistaPath: 'references',
    transform: null,
    priority: 'MEDIUM',
    enabled: true,
    requiresIssueData: false,
    catalogCode: 'Schön',
    description: 'Secondary catalog number (Schön by default)',
    defaultSourceKey: 'catalog_references',
    category: 'main',
    displayOrder: 31
  },

  catalognum3: {
    numistaPath: 'references',
    transform: null,
    priority: 'LOW',
    enabled: true,
    requiresIssueData: false,
    catalogCode: 'Y',
    description: 'Tertiary catalog number (Y by default)',
    defaultSourceKey: 'catalog_references',
    category: 'main',
    displayOrder: 32
  },

  catalognum4: {
    numistaPath: 'id',
    transform: transformToString,
    priority: 'LOW',
    enabled: true,
    requiresIssueData: false,
    catalogCode: 'Numista',
    description: 'Numista catalog number (Numista ID)',
    defaultSourceKey: 'numista_id',
    category: 'main',
    displayOrder: 33
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
  NUMISTA_SOURCES,
  getCatalogNumber,
  getNestedValue,
  getCatalogDisplayName,
  formatCatalogForDisplay,
  getSerializableSources
};
