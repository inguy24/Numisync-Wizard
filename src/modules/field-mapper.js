const { DEFAULT_FIELD_MAPPING, getCatalogNumber, getNestedValue, formatCatalogForDisplay } = require('./default-field-mapping');

/**
 * Field Mapper
 * 
 * Handles mapping between Numista API responses and OpenNumismat database fields.
 * Supports custom user field mappings and transformations.
 */
class FieldMapper {
  /**
   * Creates a new FieldMapper instance
   * @param {Object|null} customMapping - Custom field mapping configuration (uses DEFAULT_FIELD_MAPPING if null)
   */
  constructor(customMapping = null) {
    // Use custom mapping if provided, otherwise use default
    this.fieldMapping = customMapping || DEFAULT_FIELD_MAPPING;
  }

  /**
   * Map Numista data to OpenNumismat fields
   * 
   * @param {Object} numistaData - Full Numista type data from API
   * @param {Object} issueData - Optional issue data for year-specific fields
   * @param {Object} userSettings - Optional user preferences for mapping
   * @returns {Object} - Mapped data ready for OpenNumismat
   */
  mapToOpenNumismat(numistaData, issueData = null, pricingData = null, userSettings = {}) {
    console.log('=== mapToOpenNumismat called ===');
    console.log('numistaData keys:', Object.keys(numistaData || {}));
    console.log('issueData:', issueData ? 'provided' : 'null');
    console.log('pricingData:', pricingData ? 'provided' : 'null');
    
    const mapped = {};
    let processedCount = 0;
    let skippedDisabled = 0;
    let skippedRequiresIssue = 0;
    let skippedRequiresPricing = 0;
    let skippedNoValue = 0;
    let addedCount = 0;

    for (const [onField, config] of Object.entries(this.fieldMapping)) {
      processedCount++;
      
      // Skip if disabled
      if (!config.enabled) {
        skippedDisabled++;
        continue;
      }

      // Skip if requires issue data but none provided
      if (config.requiresIssueData && !issueData) {
        skippedRequiresIssue++;
        console.log(`  Skipping '${onField}' - requires issue data`);
        continue;
      }
      
      // Skip if requires pricing data but none provided
      if (config.requiresPricingData && !pricingData) {
        skippedRequiresPricing++;
        console.log(`  Skipping '${onField}' - requires pricing data`);
        continue;
      }

      try {
        let value = null;

        // Handle special fields
        if (onField.startsWith('catalognum')) {
          // Special handling for catalog numbers
          const catalogCode = config.catalogCode || userSettings.catalogMappings?.[onField];
          console.log(`  Processing catalognum '${onField}' with code '${catalogCode}'`);
          
          if (catalogCode === 'Numista' && onField === 'catalognum4') {
            // Special case: Numista ID (direct from numistaData.id)
            value = numistaData.id ? String(numistaData.id) : null;
            console.log(`    -> Numista ID: ${value}`);
          } else if (catalogCode && numistaData.references) {
            // Standard catalog reference lookup
            value = getCatalogNumber(numistaData.references, catalogCode);
            console.log(`    -> Found in references: ${value}`);
          }
        } else if (onField.match(/img$/)) {
          // Image fields - just store the URL (or download later)
          value = getNestedValue(numistaData, config.numistaPath);
          console.log(`  Image field '${onField}': ${value ? 'has URL' : 'no URL'}`);
        } else if (onField === 'mintage' && issueData) {
          // Get mintage from issue data
          value = issueData.mintage;
        } else if (onField === 'mintmark' && issueData) {
          // Get mint mark from issue data
          value = issueData.mint_letter;
        } else if (onField.match(/^price[1-4]$/) && pricingData) {
          // Get pricing from pricing data
          // Map price1=UNC, price2=XF, price3=VF, price4=F
          const priceMap = {
            'price1': 'unc',  // Uncirculated
            'price2': 'xf',   // Extremely Fine
            'price3': 'vf',   // Very Fine
            'price4': 'f'     // Fine
          };
          const gradeKey = priceMap[onField];
          if (gradeKey && pricingData.prices) {
            const priceObj = pricingData.prices.find(p => p.grade === gradeKey);
            value = priceObj?.price || null;
            console.log(`  Pricing field '${onField}' (${gradeKey}): ${value}`);
          }
        } else {
          // Standard field mapping
          const path = config.numistaPath;
          value = getNestedValue(numistaData, path);
          
          if (processedCount <= 10 || value !== null) {  // Log first 10 or any with values
            console.log(`  Field '${onField}' from '${path}': ${value === null ? 'null' : (typeof value === 'object' ? JSON.stringify(value).substring(0, 50) : value)}`);
          }
        }

        // Apply transformation if defined
        if (value !== null && config.transform && typeof config.transform === 'function') {
          const originalValue = value;
          value = config.transform(value, numistaData);
          console.log(`    Transformed '${onField}': ${JSON.stringify(originalValue).substring(0, 30)} -> ${value}`);
        }

        // Only add if we have a value
        if (value !== null && value !== undefined && value !== '') {
          mapped[onField] = value;
          addedCount++;
          console.log(`    ✔ Added '${onField}' = '${value}'`);
        } else {
          skippedNoValue++;
        }
      } catch (error) {
        console.error(`Error mapping field ${onField}:`, error);
        // Continue with other fields
      }
    }

    console.log(`=== Mapping complete ===`);
    console.log(`  Processed: ${processedCount} fields`);
    console.log(`  Skipped (disabled): ${skippedDisabled}`);
    console.log(`  Skipped (requires issue): ${skippedRequiresIssue}`);
    console.log(`  Skipped (requires pricing): ${skippedRequiresPricing}`);
    console.log(`  Skipped (no value): ${skippedNoValue}`);
    console.log(`  Added to mapped: ${addedCount}`);
    console.log(`  Final mapped keys:`, Object.keys(mapped));

    return mapped;
  }

  /**
   * Compare OpenNumismat coin with Numista data to find differences
   * @param {Object} coin - OpenNumismat coin data from database
   * @param {Object} numistaData - Numista type data from API
   * @param {Object|null} issueData - Optional issue data for year-specific fields
   * @param {Object|null} pricingData - Optional pricing data for price fields
   * @returns {Object} Comparison result with fields array and hasChanges flag
   */
  compareFields(coin, numistaData, issueData = null, pricingData = null) {
    const comparison = {
      fields: [],
      hasChanges: false
    };

    // Map Numista data to OpenNumismat format (pass issueData and pricingData)
    const mapped = this.mapToOpenNumismat(numistaData, issueData, pricingData);

    // Compare each mapped field
    for (const [field, config] of Object.entries(this.fieldMapping)) {
      if (!config.enabled) {
        continue;
      }

      const onValue = coin[field];
      const numistaValue = mapped[field];

      // Skip if no Numista value
      if (numistaValue === undefined || numistaValue === null) {
        continue;
      }

      const isDifferent = this.valuesAreDifferent(onValue, numistaValue);

      // Format display for catalog numbers (show "Krause# 13" but store "13")
      let numistaValueDisplay = numistaValue;
      if (field.startsWith('catalognum') && config.catalogCode) {
        numistaValueDisplay = formatCatalogForDisplay(config.catalogCode, numistaValue);
      }

      comparison.fields.push({
        field,
        onValue,
        numistaValue,  // Raw value for database (just the number)
        numistaValueDisplay,  // Formatted for UI display
        isDifferent,
        priority: config.priority,
        description: config.description,
        catalogCode: config.catalogCode || null  // Include catalog code for reference
      });

      if (isDifferent) {
        comparison.hasChanges = true;
      }
    }

    // Sort by priority and whether different
    comparison.fields.sort((a, b) => {
      // Different fields first
      if (a.isDifferent !== b.isDifferent) {
        return a.isDifferent ? -1 : 1;
      }
      // Then by priority
      const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return comparison;
  }

  /**
   * Check if two values are different (handles type coercion and null/empty)
   * @param {*} val1 - First value (from OpenNumismat)
   * @param {*} val2 - Second value (from Numista)
   * @returns {boolean} True if values are meaningfully different
   */
  valuesAreDifferent(val1, val2) {
    // Both null/empty - not different
    if (this.isEmpty(val1) && this.isEmpty(val2)) {
      return false;
    }

    // One null/empty, other not - different
    if (this.isEmpty(val1) || this.isEmpty(val2)) {
      return true;
    }

    // Convert to strings for comparison (handles numbers vs strings)
    const str1 = String(val1).trim().toLowerCase();
    const str2 = String(val2).trim().toLowerCase();

    return str1 !== str2;
  }

  /**
   * Check if a value is empty, null, or undefined
   * @param {*} value - Value to check
   * @returns {boolean} True if value is null, undefined, or empty string
   */
  isEmpty(value) {
    return value === null || value === undefined || value === '';
  }

  /**
   * Merge selected fields into coin data
   * 
   * @param {Object} selectedFields - Object mapping field names to selected source
   *                                  { fieldName: 'numista' | 'keep' }
   * @param {Object} numistaData - Numista type data
   * @returns {Object} - Data to update in database
   */
  mergeFields(selectedFields, numistaData, issueData = null, pricingData = null) {
    console.log('=== mergeFields called ===');
    console.log('selectedFields:', JSON.stringify(selectedFields, null, 2));
    console.log('numistaData.id:', numistaData?.id);
    console.log('numistaData.title:', numistaData?.title);
    console.log('issueData:', issueData ? 'provided' : 'null');
    console.log('pricingData:', pricingData ? 'provided' : 'null');
    
    const updates = {};

    // Map Numista data (pass issueData and pricingData)
    const mapped = this.mapToOpenNumismat(numistaData, issueData, pricingData);
    console.log('Mapped data:', JSON.stringify(mapped, null, 2));

    for (const [field, value] of Object.entries(selectedFields)) {
      console.log(`Checking field '${field}': selected=${value}, hasMappedValue=${mapped[field] !== undefined}`);
      
      // Handle both boolean (true/false) and string ("numista"/"keep") formats
      const shouldUpdate = value === true || value === 'numista';
      
      if (shouldUpdate && mapped[field] !== undefined) {
        updates[field] = mapped[field];
        console.log(`  ✔ Adding '${field}' = '${mapped[field]}'`);
      } else {
        console.log(`  ✗ Skipping '${field}' (shouldUpdate=${shouldUpdate}, hasValue=${mapped[field] !== undefined})`);
      }
    }

    console.log('Final updates object:', JSON.stringify(updates, null, 2));
    console.log('=== mergeFields done ===');
    
    return updates;
  }

  /**
   * Update the field mapping configuration
   * @param {Object} newMapping - New field mapping configuration object
   */
  setFieldMapping(newMapping) {
    this.fieldMapping = newMapping;
  }

  /**
   * Get the current field mapping configuration
   * @returns {Object} Current field mapping configuration
   */
  getFieldMapping() {
    return this.fieldMapping;
  }

  /**
   * Get list of field names that are currently enabled
   * @returns {string[]} Array of enabled field names
   */
  getEnabledFields() {
    return Object.entries(this.fieldMapping)
      .filter(([, config]) => config.enabled)
      .map(([field]) => field);
  }
}

module.exports = FieldMapper;
