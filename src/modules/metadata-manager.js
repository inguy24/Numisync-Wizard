/**
 * Metadata Manager
 * 
 * Manages storage and retrieval of enrichment metadata in OpenNumismat's note field.
 * Metadata is stored as JSON inside HTML comments, preserving user notes.
 * 
 * Storage Format:
 * - User notes (preserved exactly)
 * - HTML comment block with JSON metadata
 * 
 * Example:
 * ```
 * This is a rare coin from my grandfather.
 * <!-- NUMISMAT_ENRICHMENT_DATA
 * {
 *   "version": "2.0",
 *   "basicData": {...},
 *   "issueData": {...},
 *   "pricingData": {...}
 * }
 * -->
 * ```
 */

const log = require('../main/logger').scope('Metadata');

const METADATA_START_TAG = '<!-- NUMISMAT_ENRICHMENT_DATA';
const METADATA_END_TAG = '-->';

/**
 * Read enrichment metadata from a note field
 * 
 * @param {string|null} noteField - The note field content from OpenNumismat
 * @returns {Object} - { userNotes: string, metadata: Object }
 */
function readEnrichmentMetadata(noteField) {
  // Default return structure
  const result = {
    userNotes: '',
    metadata: getDefaultMetadata()
  };

  // Handle null/undefined/empty
  if (!noteField || noteField.trim() === '') {
    return result;
  }

  try {
    // Find the metadata block
    const startIndex = noteField.indexOf(METADATA_START_TAG);
    
    if (startIndex === -1) {
      // No metadata found - entire note is user notes
      result.userNotes = noteField.trim();
      return result;
    }

    // Extract user notes (everything before metadata block)
    result.userNotes = noteField.substring(0, startIndex).trim();

    // Find the end of the metadata block
    const endIndex = noteField.indexOf(METADATA_END_TAG, startIndex);
    
    if (endIndex === -1) {
      // Malformed metadata block - treat as user notes
      log.warn('Malformed metadata block detected - missing end tag');
      result.userNotes = noteField.trim();
      return result;
    }

    // Extract the JSON content (between tags)
    const jsonStart = startIndex + METADATA_START_TAG.length;
    const jsonContent = noteField.substring(jsonStart, endIndex).trim();

    // Parse the JSON
    if (jsonContent) {
      try {
        const parsed = JSON.parse(jsonContent);
        
        // Validate the structure
        if (isValidMetadata(parsed)) {
          result.metadata = parsed;
        } else {
          log.warn('Invalid metadata structure - using defaults');
          // Keep default metadata but preserve user notes
        }
      } catch (parseError) {
        log.error('Failed to parse metadata JSON:', parseError.message);
        // Keep default metadata but preserve user notes
      }
    }

  } catch (error) {
    log.error('Error reading enrichment metadata:', error);
    // On any error, preserve as much as possible
    result.userNotes = noteField ? noteField.trim() : '';
  }

  return result;
}

/**
 * Write enrichment metadata to a note field
 * 
 * @param {string} userNotes - User's notes (will be preserved)
 * @param {Object} metadata - Enrichment metadata to store
 * @returns {string} - Combined note field content
 */
function writeEnrichmentMetadata(userNotes, metadata) {
  try {
    // Ensure metadata has the correct structure
    const validMetadata = ensureValidMetadata(metadata);

    // Format the JSON with proper indentation for readability
    const jsonContent = JSON.stringify(validMetadata, null, 2);

    // Build the combined note field
    let noteContent = '';

    // Add user notes if present
    if (userNotes && userNotes.trim() !== '') {
      noteContent = userNotes.trim() + '\n\n';
    }

    // Add metadata block
    noteContent += `${METADATA_START_TAG}\n${jsonContent}\n${METADATA_END_TAG}`;

    return noteContent;

  } catch (error) {
    log.error('Error writing enrichment metadata:', error);
    // On error, preserve user notes only
    return userNotes || '';
  }
}

/**
 * Update specific metadata section
 * 
 * @param {string|null} noteField - Current note field content
 * @param {string} section - Section to update ('basicData', 'issueData', 'pricingData')
 * @param {Object} sectionData - New data for the section
 * @returns {string} - Updated note field content
 */
function updateMetadataSection(noteField, section, sectionData) {
  const { userNotes, metadata } = readEnrichmentMetadata(noteField);
  
  // Update the specific section
  // Only add timestamp if not already provided
  metadata[section] = {
    ...metadata[section],
    ...sectionData
  };
  
  // Add timestamp only if not provided
  if (!sectionData.timestamp) {
    metadata[section].timestamp = new Date().toISOString();
  }

  return writeEnrichmentMetadata(userNotes, metadata);
}

/**
 * Get default metadata structure
 * 
 * @returns {Object} - Default metadata structure
 */
function getDefaultMetadata() {
  return {
    version: '2.0',
    basicData: {
      status: 'NOT_QUERIED',
      timestamp: null,
      numistaId: null,
      numistaIdField: null,
      fieldsMerged: []
    },
    issueData: {
      status: 'NOT_QUERIED',
      timestamp: null,
      issueId: null,
      matchMethod: null,
      fieldsMerged: []
    },
    pricingData: {
      status: 'NOT_QUERIED',
      timestamp: null,
      issueId: null,
      currency: null,
      fieldsMerged: [],
      lastPrices: {}
    }
  };
}

/**
 * Validate metadata structure
 * 
 * @param {Object} metadata - Metadata to validate
 * @returns {boolean} - True if valid
 */
function isValidMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return false;
  }

  // Check version
  if (!metadata.version) {
    return false;
  }

  // Check required sections exist
  const requiredSections = ['basicData', 'issueData', 'pricingData'];
  for (const section of requiredSections) {
    if (!metadata[section] || typeof metadata[section] !== 'object') {
      return false;
    }
    
    // Each section must have a status
    if (!metadata[section].status) {
      return false;
    }
  }

  return true;
}

/**
 * Ensure metadata has valid structure, filling in missing parts
 * 
 * @param {Object} metadata - Metadata to validate/fix
 * @returns {Object} - Valid metadata
 */
function ensureValidMetadata(metadata) {
  const defaults = getDefaultMetadata();

  if (!metadata || typeof metadata !== 'object') {
    return defaults;
  }

  // Start with defaults and merge in provided data
  const result = {
    version: metadata.version || defaults.version,
    basicData: { ...defaults.basicData, ...(metadata.basicData || {}) },
    issueData: { ...defaults.issueData, ...(metadata.issueData || {}) },
    pricingData: { ...defaults.pricingData, ...(metadata.pricingData || {}) }
  };

  return result;
}

/**
 * Get the status of a specific data section
 * 
 * @param {string|null} noteField - Note field content
 * @param {string} section - Section name ('basicData', 'issueData', 'pricingData')
 * @returns {string} - Status value
 */
function getSectionStatus(noteField, section) {
  const { metadata } = readEnrichmentMetadata(noteField);
  return metadata[section]?.status || 'NOT_QUERIED';
}

/**
 * Get freshness of pricing data
 * 
 * @param {string|null} noteField - Note field content
 * @returns {Object} - { status: string, age: number|null, timestamp: string|null }
 */
function getPricingFreshness(noteField) {
  const { metadata } = readEnrichmentMetadata(noteField);
  const pricingData = metadata.pricingData;

  if (!pricingData.timestamp) {
    return {
      status: 'NEVER_UPDATED',
      age: null,
      timestamp: null
    };
  }

  const timestamp = new Date(pricingData.timestamp);
  const now = new Date();
  const ageInMonths = (now - timestamp) / (1000 * 60 * 60 * 24 * 30.44); // Average month length

  let status;
  if (ageInMonths < 3) {
    status = 'CURRENT'; // < 3 months
  } else if (ageInMonths < 12) {
    status = 'RECENT'; // 3-12 months
  } else if (ageInMonths < 24) {
    status = 'AGING'; // 1-2 years
  } else {
    status = 'OUTDATED'; // > 2 years
  }

  return {
    status,
    age: ageInMonths,
    timestamp: pricingData.timestamp
  };
}

/**
 * Check if coin is fully enriched based on user's selected data types
 * 
 * @param {string|null} noteField - Note field content
 * @param {Object} fetchSettings - { basicData: bool, issueData: bool, pricingData: bool }
 * @returns {boolean} - True if all requested data is merged
 */
function isFullyEnriched(noteField, fetchSettings) {
  const { metadata } = readEnrichmentMetadata(noteField);

  if (fetchSettings.basicData && metadata.basicData.status !== 'MERGED') {
    return false;
  }

  if (fetchSettings.issueData && metadata.issueData.status !== 'MERGED') {
    return false;
  }

  if (fetchSettings.pricingData && metadata.pricingData.status !== 'MERGED') {
    return false;
  }

  return true;
}

/**
 * Get overall enrichment status for a coin
 * 
 * @param {string|null} noteField - Note field content
 * @param {Object} fetchSettings - { basicData: bool, issueData: bool, pricingData: bool }
 * @returns {string} - 'COMPLETE', 'PARTIAL', 'PENDING', 'ERROR'
 */
function getOverallStatus(noteField, fetchSettings) {
  const { metadata } = readEnrichmentMetadata(noteField);

  let requested = 0;
  let merged = 0;
  let hasError = false;

  if (fetchSettings.basicData) {
    requested++;
    if (metadata.basicData.status === 'MERGED') merged++;
    if (metadata.basicData.status === 'ERROR') hasError = true;
  }

  if (fetchSettings.issueData) {
    requested++;
    if (metadata.issueData.status === 'MERGED') merged++;
    if (metadata.issueData.status === 'ERROR') hasError = true;
  }

  if (fetchSettings.pricingData) {
    requested++;
    if (metadata.pricingData.status === 'MERGED') merged++;
    if (metadata.pricingData.status === 'ERROR') hasError = true;
  }

  if (hasError) {
    return 'ERROR';
  }

  if (merged === requested) {
    return 'COMPLETE';
  }

  if (merged > 0) {
    return 'PARTIAL';
  }

  return 'PENDING';
}

/**
 * Export all functions
 */
module.exports = {
  readEnrichmentMetadata,
  writeEnrichmentMetadata,
  updateMetadataSection,
  getDefaultMetadata,
  isValidMetadata,
  ensureValidMetadata,
  getSectionStatus,
  getPricingFreshness,
  isFullyEnriched,
  getOverallStatus,
  
  // Export constants for testing
  METADATA_START_TAG,
  METADATA_END_TAG
};
