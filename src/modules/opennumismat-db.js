/**
 * @fileoverview opennumismat-db.js — SQLite database access layer for OpenNumismat .db files.
 *
 * Exports: OpenNumismatDB class (use static open() factory, not constructor)
 *   open(filePath) — async factory; opens, validates, and wraps a .db file
 *   getCoins(options?) — paginated coin list with sort/filter options
 *   getCoinById(id) — single coin lookup by primary key
 *   updateCoin(coinId, data) — write coin fields; blocks protected FK columns
 *   getTableSchema() — returns PRAGMA table_info for coins table
 *   createBackup() — copies .db to {dir}/.NumiSync/backups/ with timestamp
 *   pruneOldBackups(maxCount) — removes oldest backups beyond configured limit
 *   searchCoins(params) — text search across title/country/series/catalognum1
 *   getCoinImages(coinId) — returns { obverse, reverse, edge } Buffers from photos table
 *   storeImagesForCoin(coinId, imageBuffers) — inserts into photos table, updates FK columns
 *   close() — releases sql.js database instance
 * Storage: User-provided .db file (read + write); backups in {dir}/.NumiSync/backups/
 * Note: obverseimg/reverseimg/edgeimg reference photos table, NOT images table (Lesson 5)
 * Uses: sql.js (pure-JS SQLite — no native binary), logger.js
 * Called by: src/main/index.js (all collection + image IPC handlers)
 */
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const log = require('../main/logger').scope('Database');

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
  /**
   * Creates a new OpenNumismatDB instance (use static open() method instead)
   * @param {Object} db - sql.js database instance
   * @param {string} filePath - Path to the .db file
   */
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
   * @throws {Error} If database is missing the coins table
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
   * @private
   * @param {string} sql - SQL query string
   * @param {Array} params - Query parameters
   * @returns {Array<Object>} Array of row objects
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
   * @private
   * @param {string} sql - SQL query string
   * @param {Array} params - Query parameters
   * @returns {Object|null} First row object or null if no results
   */
  _queryOne(sql, params = []) {
    const results = this._queryAll(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Execute a query that modifies data (INSERT/UPDATE/DELETE)
   * @private
   * @param {string} sql - SQL query string
   * @param {Array} params - Query parameters
   * @returns {Object} Result object with changes count
   * @throws {Error} If query execution fails
   */
  _run(sql, params = []) {
    try {
      log.debug('Running SQL:', sql);
      log.debug('With params:', params);
      
      // sql.js requires prepared statements for parameterized queries
      const stmt = this.db.prepare(sql);
      stmt.bind(params);
      const result = stmt.step();
      stmt.free();
      
      log.debug('Statement executed, result:', result);
      
      // Save to file immediately
      this._saveToFile();
      
      log.debug('Database file saved successfully');
      return { changes: 1 };  // Assume 1 row changed if no error
    } catch (error) {
      log.error('Error in _run:', error);
      throw error;
    }
  }

  /**
   * Save database to file (called automatically after _run)
   * @private
   * @throws {Error} If file write fails
   */
  _saveToFile() {
    try {
      log.debug('Exporting database...');
      const data = this.db.export();
      log.debug('Database exported, size:', data.length, 'bytes');
      
      const buffer = Buffer.from(data);
      log.debug('Writing to file:', this.filePath);
      
      fs.writeFileSync(this.filePath, buffer);
      log.debug('File written successfully');
      
      // Verify file was written
      const stats = fs.statSync(this.filePath);
      log.debug('File size on disk:', stats.size, 'bytes');
    } catch (error) {
      log.error('Error saving database file:', error);
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
   * @returns {Object} Summary with totalCoins, byCountry, byPeriod arrays
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
   * Get a single coin by its database ID
   * @param {number} id - The coin's primary key ID
   * @returns {Object|null} Coin object or null if not found
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
        log.warn('Blocked attempt to update protected field: %s', field);
        return false;
      }
      return true;
    });
    if (fields.length === 0) {
      log.debug('No fields to update');
      return false;
    }

    log.debug(`Updating coin ${coinId} with ${fields.length} fields:`, fields);

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => data[field]);
    values.push(coinId);

    const query = `UPDATE coins SET ${setClause} WHERE id = ?`;
    
    const result = this._run(query, values);
    
    // Verify the update by reading back the coin
    const updatedCoin = this.getCoinById(coinId);
    log.debug('Coin after update:', updatedCoin);
    
    // Check if at least one field was updated correctly
    let verified = false;
    for (const field of fields) {
      if (updatedCoin[field] === data[field]) {
        verified = true;
        log.debug('[OK] Field %s verified: %s', field, data[field]);
      } else {
        log.warn('[MISMATCH] Field %s mismatch. Expected: %s, Got: %s', field, data[field], updatedCoin[field]);
      }
    }
    
    return verified;
  }

  /**
   * Get schema information for all columns in the coins table
   * @returns {Array<Object>} Array of column info objects (name, type, notNull, defaultValue, primaryKey)
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
    // Create readable timestamp (YYYY-MM-DD_HHMMSS)
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];  // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');  // HHMMSS
    const timestamp = `${dateStr}_${timeStr}`;

    // Use .NumiSync/backups/ directory
    const dir = path.dirname(this.filePath);
    const numiSyncDir = path.join(dir, '.NumiSync');
    const backupDir = path.join(numiSyncDir, 'backups');

    // Create directories if they don't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupPath = path.join(
      backupDir,
      `${path.basename(this.filePath, '.db')}_${timestamp}.db`
    );

    // Copy the database file
    fs.copyFileSync(this.filePath, backupPath);

    return backupPath;
  }

  /**
   * Remove old backups that exceed the maximum count.
   * Handles both old and new backup locations/formats during migration.
   *
   * @param {number} maxCount - Maximum backups to keep. 0 = unlimited (no pruning).
   * @returns {string[]} - Paths of deleted backup files
   */
  pruneOldBackups(maxCount) {
    if (maxCount <= 0) return []; // 0 = unlimited

    const dir = path.dirname(this.filePath);
    const dbBasename = path.basename(this.filePath, '.db');
    const deleted = [];

    // Collect backups from both old and new locations
    const allBackups = [];

    // Old location: {dir}/backups/
    const oldBackupDir = path.join(dir, 'backups');
    if (fs.existsSync(oldBackupDir)) {
      const oldPattern = `${dbBasename}_backup_`;
      const oldBackups = fs.readdirSync(oldBackupDir)
        .filter(f => f.startsWith(oldPattern) && f.endsWith('.db'))
        .map(f => ({ path: path.join(oldBackupDir, f), name: f }));
      allBackups.push(...oldBackups);
    }

    // New location: {dir}/.NumiSync/backups/
    const newBackupDir = path.join(dir, '.NumiSync', 'backups');
    if (fs.existsSync(newBackupDir)) {
      const newPattern = `${dbBasename}_`;
      const newBackups = fs.readdirSync(newBackupDir)
        .filter(f => f.startsWith(newPattern) && f.endsWith('.db'))
        .map(f => ({ path: path.join(newBackupDir, f), name: f }));
      allBackups.push(...newBackups);
    }

    // Sort all backups by name (timestamp in name = chronological)
    allBackups.sort((a, b) => a.name.localeCompare(b.name));

    if (allBackups.length <= maxCount) return [];

    // Delete oldest files (beginning of sorted list)
    const toDelete = allBackups.slice(0, allBackups.length - maxCount);
    for (const backup of toDelete) {
      try {
        fs.unlinkSync(backup.path);
        deleted.push(backup.path);
        log.info('Pruned old backup: %s', backup.name);
      } catch (err) {
        log.warn('Failed to delete backup %s: %s', backup.name, err.message);
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
      log.error(`Error reading image ${imageId}:`, error);
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
      log.error(`Error reading photo ${photoId}:`, error);
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

    // obverseimg/reverseimg/edgeimg reference the photos table
    const obverse = this.getPhotoData(coin.obverseimg);
    const reverse = this.getPhotoData(coin.reverseimg);
    const edge = this.getPhotoData(coin.edgeimg);

    return {
      obverse,
      reverse,
      edge,
      obverseId: coin.obverseimg,
      reverseId: coin.reverseimg,
      edgeId: coin.edgeimg
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
   * Insert image BLOB into images table (for composite thumbnails)
   * Note: For obverse/reverse/edge images, use insertPhoto() instead.
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

      log.debug(`Image inserted with ID: ${imageId}`);
      return imageId;
    } catch (error) {
      log.error('Error inserting image:', error);
      throw error;
    }
  }

  /**
   * Insert photo BLOB into photos table (for obverse/reverse/edge images)
   * OpenNumismat uses the photos table for coin face images, referenced by
   * obverseimg, reverseimg, edgeimg columns in the coins table.
   *
   * @param {Buffer} photoData - Photo data as buffer
   * @returns {number} The ID of the inserted photo
   */
  insertPhoto(photoData) {
    if (!photoData || !Buffer.isBuffer(photoData)) {
      throw new Error('Invalid photo data');
    }

    try {
      // Convert Buffer to Uint8Array for sql.js
      const uint8Array = new Uint8Array(photoData);

      // Insert the photo (photos table has id and image columns)
      const stmt = this.db.prepare('INSERT INTO photos (image) VALUES (?)');
      stmt.bind([uint8Array]);
      stmt.step();
      stmt.free();

      // Get the last inserted ID
      const result = this.db.exec('SELECT last_insert_rowid() as id');
      const photoId = result[0].values[0][0];

      // Save to file
      this._saveToFile();

      log.debug(`Photo inserted with ID: ${photoId}`);
      return photoId;
    } catch (error) {
      log.error('Error inserting photo:', error);
      throw error;
    }
  }

  /**
   * Update coin image references (using photo IDs from photos table)
   * The obverseimg/reverseimg/edgeimg columns reference the photos table.
   *
   * @param {number} coinId
   * @param {Object} images - Object with obverse, reverse, and/or edge properties (photo IDs)
   */
  updateCoinImages(coinId, images) {
    log.debug(`updateCoinImages called for coin ${coinId}:`, images);
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

    log.debug('Updates to apply:', updates);

    const fields = Object.keys(updates);
    if (fields.length === 0) {
      log.debug('No image updates to apply');
      return;
    }

    // Direct SQL update - bypasses PROTECTED_FIELDS since we're setting valid photo IDs
    // (PROTECTED_FIELDS blocks URL strings from merge operations, but photo IDs are valid)
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field]);
    values.push(coinId);

    const query = `UPDATE coins SET ${setClause} WHERE id = ?`;
    log.debug('Running image update SQL:', query);
    log.debug('With values:', values);

    this._run(query, values);
    log.debug(`Coin ${coinId} image columns updated successfully`);
  }

  /**
   * Download and store images for a coin
   * Uses photos table for obverse/reverse/edge images (not images table).
   *
   * @param {number} coinId - The coin ID
   * @param {Object} imageBuffers - Object with obverse, reverse, and/or edge Buffers
   * @returns {Object} Object with the photo IDs that were created
   */
  async storeImagesForCoin(coinId, imageBuffers) {
    log.debug('=== storeImagesForCoin DEBUG ===');
    log.debug('Coin ID:', coinId);
    log.debug('Image buffers received:', {
      obverse: imageBuffers.obverse ? `Buffer(${imageBuffers.obverse.length})` : 'none',
      reverse: imageBuffers.reverse ? `Buffer(${imageBuffers.reverse.length})` : 'none',
      edge: imageBuffers.edge ? `Buffer(${imageBuffers.edge.length})` : 'none'
    });

    const photoIds = {};

    try {
      // Use insertPhoto (photos table) for coin face images
      // The coins table columns obverseimg/reverseimg/edgeimg reference photos table
      if (imageBuffers.obverse && Buffer.isBuffer(imageBuffers.obverse)) {
        log.debug(`Storing obverse photo for coin ${coinId} (${imageBuffers.obverse.length} bytes)`);
        photoIds.obverse = this.insertPhoto(imageBuffers.obverse);
        log.debug(`Obverse photo stored with ID: ${photoIds.obverse}`);
      }

      if (imageBuffers.reverse && Buffer.isBuffer(imageBuffers.reverse)) {
        log.debug(`Storing reverse photo for coin ${coinId} (${imageBuffers.reverse.length} bytes)`);
        photoIds.reverse = this.insertPhoto(imageBuffers.reverse);
        log.debug(`Reverse photo stored with ID: ${photoIds.reverse}`);
      }

      if (imageBuffers.edge && Buffer.isBuffer(imageBuffers.edge)) {
        log.debug(`Storing edge photo for coin ${coinId} (${imageBuffers.edge.length} bytes)`);
        photoIds.edge = this.insertPhoto(imageBuffers.edge);
        log.debug(`Edge photo stored with ID: ${photoIds.edge}`);
      } else {
        log.debug('No edge buffer to store - edge image will not be saved');
      }

      log.debug('Photo IDs to update coin with:', photoIds);

      // Update the coin record with the new photo IDs
      if (Object.keys(photoIds).length > 0) {
        this.updateCoinImages(coinId, photoIds);
      }

      log.debug('=== END storeImagesForCoin ===');
      return photoIds;
    } catch (error) {
      log.error('Error storing images for coin:', error);
      throw error;
    }
  }

  /**
   * Close the database connection and release resources
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

module.exports = OpenNumismatDB;
