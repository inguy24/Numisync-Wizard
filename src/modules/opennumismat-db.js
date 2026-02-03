const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

// Fields that must never be overwritten by merge operations.
// These are primary keys or foreign keys referencing other tables.
const PROTECTED_FIELDS = new Set([
  'id',           // Primary key
  'obverseimg',   // FK -> photos table
  'reverseimg',   // FK -> photos table
  'edgeimg',      // FK -> photos table
  'image',        // FK -> images table (composite thumbnail)
]);

/**
 * OpenNumismat Database Handler (sql.js version)
 * 
 * Handles reading and writing to OpenNumismat SQLite database files.
 * OpenNumismat stores collections in a single SQLite .db file with
 * tables for coins, images, and other related data.
 * 
 * Uses sql.js (pure JavaScript SQLite) instead of better-sqlite3
 * to avoid native compilation issues.
 * 
 * USAGE: Use OpenNumismatDB.open(filePath) instead of new OpenNumismatDB(filePath)
 */
class OpenNumismatDB {
  constructor(db, filePath) {
    this.db = db;
    this.filePath = filePath;
  }

  /**
   * Open a database file (async factory method)
   * Use this instead of constructor!
   * 
   * @param {string} filePath - Path to the .db file
   * @returns {Promise<OpenNumismatDB>}
   */
  static async open(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Database file not found: ${filePath}`);
    }

    // Load the database file
    const filebuffer = fs.readFileSync(filePath);
    
    // Initialize sql.js (async)
    const SQL = await initSqlJs();
    
    // Create database instance
    const db = new SQL.Database(filebuffer);
    
    // Create our wrapper
    const instance = new OpenNumismatDB(db, filePath);
    
    // Verify it's a valid OpenNumismat database
    instance.verifyDatabase();
    
    return instance;
  }

  /**
   * Verify that this is a valid OpenNumismat database
   */
  verifyDatabase() {
    try {
      // Check if the main coins table exists
      const result = this.db.exec(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='coins'"
      );

      if (!result || result.length === 0 || result[0].values.length === 0) {
        throw new Error('Not a valid OpenNumismat database: missing coins table');
      }
    } catch (error) {
      throw new Error(`Invalid OpenNumismat database: ${error.message}`);
    }
  }

  /**
   * Execute a query and return all results as objects
   */
  _queryAll(sql, params = []) {
    const result = this.db.exec(sql, params);
    
    if (!result || result.length === 0) {
      return [];
    }

    const columns = result[0].columns;
    const values = result[0].values;

    return values.map(row => {
      const obj = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
  }

  /**
   * Execute a query and return first result as object
   */
  _queryOne(sql, params = []) {
    const results = this._queryAll(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Execute a query that modifies data
   */
  _run(sql, params = []) {
    try {
      console.log('Running SQL:', sql);
      console.log('With params:', params);
      
      // sql.js requires prepared statements for parameterized queries
      const stmt = this.db.prepare(sql);
      stmt.bind(params);
      const result = stmt.step();
      stmt.free();
      
      console.log('Statement executed, result:', result);
      
      // Save to file immediately
      this._saveToFile();
      
      console.log('Database file saved successfully');
      return { changes: 1 };  // Assume 1 row changed if no error
    } catch (error) {
      console.error('Error in _run:', error);
      throw error;
    }
  }

  /**
   * Save database to file
   */
  _saveToFile() {
    try {
      console.log('Exporting database...');
      const data = this.db.export();
      console.log('Database exported, size:', data.length, 'bytes');
      
      const buffer = Buffer.from(data);
      console.log('Writing to file:', this.filePath);
      
      fs.writeFileSync(this.filePath, buffer);
      console.log('File written successfully');
      
      // Verify file was written
      const stats = fs.statSync(this.filePath);
      console.log('File size on disk:', stats.size, 'bytes');
    } catch (error) {
      console.error('Error saving database file:', error);
      throw error;
    }
  }

  /**
   * Public query method for external use (async for compatibility)
   * Returns all rows matching the query
   * 
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters (optional)
   * @returns {Promise<Array>} Array of result objects
   */
  async all(sql, params = []) {
    return this._queryAll(sql, params);
  }

  /**
   * Public query method for external use (async for compatibility)
   * Returns first row matching the query
   * 
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters (optional)
   * @returns {Promise<Object|null>} First result object or null
   */
  async get(sql, params = []) {
    return this._queryOne(sql, params);
  }

  /**
   * Public run method for external use (async for compatibility)
   * Executes a query without returning results
   * 
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters (optional)
   * @returns {Promise<Object>} Result with changes count
   */
  async run(sql, params = []) {
    return this._run(sql, params);
  }

  /**
   * Get collection summary statistics
   */
  getCollectionSummary() {
    // Get count directly from raw query result
    const countQuery = this.db.exec('SELECT COUNT(*) FROM coins');
    const totalCoins = (countQuery && countQuery[0] && countQuery[0].values && countQuery[0].values[0]) 
      ? countQuery[0].values[0][0] 
      : 0;
    
    const byCountry = this._queryAll(`
      SELECT country, COUNT(*) as count 
      FROM coins 
      WHERE country IS NOT NULL AND country != ''
      GROUP BY country 
      ORDER BY count DESC 
      LIMIT 10
    `);

    const byPeriod = this._queryAll(`
      SELECT period, COUNT(*) as count 
      FROM coins 
      WHERE period IS NOT NULL AND period != ''
      GROUP BY period 
      ORDER BY count DESC 
      LIMIT 10
    `);

    return {
      totalCoins,
      byCountry,
      byPeriod
    };
  }

  /**
   * Get coins with optional filtering and pagination
   * 
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of coins to return
   * @param {number} options.offset - Number of coins to skip
   * @param {string} options.status - Filter by processing status (from progress tracker)
   * @param {string} options.sortBy - Field to sort by
   * @param {string} options.sortOrder - 'ASC' or 'DESC'
   * @returns {Array} Array of coin objects
   */
  getCoins(options = {}) {
    const {
      limit = 100,
      offset = 0,
      status = null,
      sortBy = 'title',
      sortOrder = 'ASC'
    } = options;

    const query = `
      SELECT * FROM coins 
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    return this._queryAll(query, [limit, offset]);
  }

  /**
   * Get a single coin by ID
   */
  getCoinById(id) {
    return this._queryOne('SELECT * FROM coins WHERE id = ?', [id]);
  }

  /**
   * Update a coin's data
   * 
   * @param {number} coinId - The coin's ID
   * @param {Object} data - Object containing field names and values to update
   */
  updateCoin(coinId, data) {
    // Filter out protected fields (primary key, foreign keys)
    const fields = Object.keys(data).filter(field => {
      if (PROTECTED_FIELDS.has(field)) {
        console.warn(`Blocked attempt to update protected field: ${field}`);
        return false;
      }
      return true;
    });
    if (fields.length === 0) {
      console.log('No fields to update');
      return false;
    }

    console.log(`Updating coin ${coinId} with ${fields.length} fields:`, fields);

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => data[field]);
    values.push(coinId);

    const query = `UPDATE coins SET ${setClause} WHERE id = ?`;
    
    const result = this._run(query, values);
    
    // Verify the update by reading back the coin
    const updatedCoin = this.getCoinById(coinId);
    console.log('Coin after update:', updatedCoin);
    
    // Check if at least one field was updated correctly
    let verified = false;
    for (const field of fields) {
      if (updatedCoin[field] === data[field]) {
        verified = true;
        console.log(`✔ Field '${field}' verified: ${data[field]}`);
      } else {
        console.warn(`✗ Field '${field}' mismatch. Expected: ${data[field]}, Got: ${updatedCoin[field]}`);
      }
    }
    
    return verified;
  }

  /**
   * Get all available fields in the coins table
   */
  getTableSchema() {
    const schema = this._queryAll('PRAGMA table_info(coins)');
    return schema.map(col => ({
      name: col.name,
      type: col.type,
      notNull: col.notnull === 1,
      defaultValue: col.dflt_value,
      primaryKey: col.pk === 1
    }));
  }

  /**
   * Create a backup of the database
   * 
   * @returns {string} Path to the backup file
   */
  createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(path.dirname(this.filePath), 'backups');
    
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupPath = path.join(
      backupDir,
      `${path.basename(this.filePath, '.db')}_backup_${timestamp}.db`
    );

    // Copy the database file
    fs.copyFileSync(this.filePath, backupPath);

    return backupPath;
  }

  /**
   * Remove old backups that exceed the maximum count.
   *
   * @param {number} maxCount - Maximum backups to keep. 0 = unlimited (no pruning).
   * @returns {string[]} - Paths of deleted backup files
   */
  pruneOldBackups(maxCount) {
    if (maxCount <= 0) return []; // 0 = unlimited

    const backupDir = path.join(path.dirname(this.filePath), 'backups');
    if (!fs.existsSync(backupDir)) return [];

    const dbBasename = path.basename(this.filePath, '.db');
    const pattern = `${dbBasename}_backup_`;

    // List matching backup files and sort alphabetically (timestamp in name = chronological)
    const backups = fs.readdirSync(backupDir)
      .filter(f => f.startsWith(pattern) && f.endsWith('.db'))
      .sort();

    if (backups.length <= maxCount) return [];

    // Delete oldest files (beginning of sorted list)
    const toDelete = backups.slice(0, backups.length - maxCount);
    const deleted = [];
    for (const filename of toDelete) {
      const fullPath = path.join(backupDir, filename);
      try {
        fs.unlinkSync(fullPath);
        deleted.push(fullPath);
        console.log(`Pruned old backup: ${filename}`);
      } catch (err) {
        console.warn(`Failed to delete backup ${filename}:`, err.message);
      }
    }
    return deleted;
  }

  /**
   * Search for coins in the collection
   * 
   * @param {Object} searchParams
   * @param {string} searchParams.query - Text to search for
   * @param {Array} searchParams.fields - Fields to search in
   * @returns {Array} Matching coins
   */
  searchCoins(searchParams) {
    const { query, fields = ['title', 'country', 'series', 'catalognum1'] } = searchParams;
    
    if (!query || query.trim() === '') {
      return [];
    }

    const searchTerm = `%${query.trim()}%`;
    const whereConditions = fields.map(field => `${field} LIKE ?`).join(' OR ');
    const params = fields.map(() => searchTerm);

    const sql = `
      SELECT * FROM coins 
      WHERE ${whereConditions}
      ORDER BY title ASC
      LIMIT 100
    `;

    return this._queryAll(sql, params);
  }

  /**
   * Get image BLOB data from the images table by image ID
   *
   * @param {number} imageId - The image ID from the images table
   * @returns {Buffer|null} Image data as buffer, or null if not found
   */
  getImageData(imageId) {
    if (!imageId) {
      return null;
    }

    try {
      const result = this._queryOne('SELECT image FROM images WHERE id = ?', [imageId]);

      if (!result || !result.image) {
        return null;
      }

      // sql.js returns BLOB data as Uint8Array
      return Buffer.from(result.image);
    } catch (error) {
      console.error(`Error reading image ${imageId}:`, error);
      return null;
    }
  }

  /**
   * Get photo BLOB data from the photos table by photo ID
   * OpenNumismat stores user photos (from camera/scanner) in the photos table,
   * referenced by photo1-photo6 columns in the coins table.
   *
   * @param {number} photoId - The photo ID from the photos table
   * @returns {Buffer|null} Photo data as buffer, or null if not found
   */
  getPhotoData(photoId) {
    if (!photoId) {
      return null;
    }

    try {
      const result = this._queryOne('SELECT image FROM photos WHERE id = ?', [photoId]);

      if (!result || !result.image) {
        return null;
      }

      // sql.js returns BLOB data as Uint8Array
      return Buffer.from(result.image);
    } catch (error) {
      console.error(`Error reading photo ${photoId}:`, error);
      return null;
    }
  }

  /**
   * Get image data for a coin (returns actual BLOB data, not just IDs)
   *
   * OpenNumismat image storage:
   *   - coins.obverseimg / coins.reverseimg → photos table (separate obverse/reverse)
   *   - coins.image → images table (composite angel-wing thumbnail)
   *
   * @param {number} coinId
   * @returns {Object} Object with obverse, reverse, and edge image data (BLOBs)
   */
  getCoinImages(coinId) {
    const coin = this.getCoinById(coinId);

    if (!coin) {
      return null;
    }

    // obverseimg/reverseimg reference the photos table (separate obverse/reverse images)
    const obverse = this.getPhotoData(coin.obverseimg);
    const reverse = this.getPhotoData(coin.reverseimg);

    return {
      obverse,
      reverse,
      edge: null,
      obverseId: coin.obverseimg,
      reverseId: coin.reverseimg,
      edgeId: null
    };
  }

  /**
   * Get coin image IDs (without loading BLOB data)
   *
   * @param {number} coinId
   * @returns {Object} Object with image IDs
   */
  getCoinImageIds(coinId) {
    const coin = this.getCoinById(coinId);

    if (!coin) {
      return null;
    }

    return {
      obverse: coin.obverseimg,
      reverse: coin.reverseimg,
      edge: null
    };
  }

  /**
   * Insert image BLOB into images table
   *
   * @param {Buffer} imageData - Image data as buffer
   * @param {string} title - Optional title for the image
   * @returns {number} The ID of the inserted image
   */
  insertImage(imageData, title = '') {
    if (!imageData || !Buffer.isBuffer(imageData)) {
      throw new Error('Invalid image data');
    }

    try {
      // Convert Buffer to Uint8Array for sql.js
      const uint8Array = new Uint8Array(imageData);

      // Insert the image (images table only has id and image columns)
      const stmt = this.db.prepare('INSERT INTO images (image) VALUES (?)');
      stmt.bind([uint8Array]);
      stmt.step();
      stmt.free();

      // Get the last inserted ID
      const result = this.db.exec('SELECT last_insert_rowid() as id');
      const imageId = result[0].values[0][0];

      // Save to file
      this._saveToFile();

      console.log(`Image inserted with ID: ${imageId}`);
      return imageId;
    } catch (error) {
      console.error('Error inserting image:', error);
      throw error;
    }
  }

  /**
   * Update coin images (using image IDs)
   *
   * @param {number} coinId
   * @param {Object} images - Object with obverse, reverse, and/or edge properties (image IDs)
   */
  updateCoinImages(coinId, images) {
    const updates = {};

    if (images.obverse !== undefined) {
      updates.obverseimg = images.obverse;
    }
    if (images.reverse !== undefined) {
      updates.reverseimg = images.reverse;
    }
    if (images.edge !== undefined) {
      updates.edgeimg = images.edge;
    }

    if (Object.keys(updates).length > 0) {
      this.updateCoin(coinId, updates);
    }
  }

  /**
   * Download and store images for a coin
   *
   * @param {number} coinId - The coin ID
   * @param {Object} imageBuffers - Object with obverse, reverse, and/or edge Buffers
   * @returns {Object} Object with the image IDs that were created
   */
  async storeImagesForCoin(coinId, imageBuffers) {
    const imageIds = {};

    try {
      if (imageBuffers.obverse && Buffer.isBuffer(imageBuffers.obverse)) {
        console.log(`Storing obverse image for coin ${coinId}`);
        imageIds.obverse = this.insertImage(imageBuffers.obverse, `Coin ${coinId} - Obverse`);
      }

      if (imageBuffers.reverse && Buffer.isBuffer(imageBuffers.reverse)) {
        console.log(`Storing reverse image for coin ${coinId}`);
        imageIds.reverse = this.insertImage(imageBuffers.reverse, `Coin ${coinId} - Reverse`);
      }

      if (imageBuffers.edge && Buffer.isBuffer(imageBuffers.edge)) {
        console.log(`Storing edge image for coin ${coinId}`);
        imageIds.edge = this.insertImage(imageBuffers.edge, `Coin ${coinId} - Edge`);
      }

      // Update the coin record with the new image IDs
      if (Object.keys(imageIds).length > 0) {
        this.updateCoinImages(coinId, imageIds);
      }

      return imageIds;
    } catch (error) {
      console.error('Error storing images for coin:', error);
      throw error;
    }
  }

  /**
   * Close the database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

module.exports = OpenNumismatDB;
