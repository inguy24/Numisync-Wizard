const axios = require('axios');

/**
 * Image Handler Module
 *
 * Handles image operations for the OpenNumismat enrichment tool:
 * - Converting BLOBs to base64 for display
 * - Downloading images from URLs
 * - Converting images to BLOBs for storage
 * - Generating placeholder images
 */
class ImageHandler {
  constructor() {
    // Placeholder images for obverse/reverse/edge (SVG data URIs)
    this.placeholders = {
      obverse: this._generatePlaceholder('OBV', '#6c757d'),
      reverse: this._generatePlaceholder('REV', '#6c757d'),
      edge: this._generatePlaceholder('EDGE', '#6c757d')
    };
  }

  /**
   * Generate a placeholder image as SVG data URI
   * @param {string} text - Text to display on placeholder
   * @param {string} color - Background color
   * @returns {string} - Data URI for the SVG
   */
  _generatePlaceholder(text, color) {
    const svg = `
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="${color}"/>
        <text x="50" y="50" font-family="Arial" font-size="16" fill="white" text-anchor="middle" dominant-baseline="middle">
          ${text}
        </text>
      </svg>
    `.trim();

    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  /**
   * Convert BLOB data to base64 data URI for display in HTML
   * @param {Buffer|Uint8Array} blob - Image data as buffer
   * @param {string} mimeType - MIME type (default: image/jpeg)
   * @returns {string} - Data URI string
   */
  blobToDataUri(blob, mimeType = 'image/jpeg') {
    if (!blob || blob.length === 0) {
      return null;
    }

    try {
      // Convert to Buffer if it's Uint8Array
      const buffer = Buffer.isBuffer(blob) ? blob : Buffer.from(blob);
      const base64 = buffer.toString('base64');
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error('Error converting BLOB to data URI:', error);
      return null;
    }
  }

  /**
   * Download image from URL and return as Buffer
   * @param {string} url - Image URL
   * @param {number} timeout - Request timeout in ms (default: 30000)
   * @returns {Promise<Buffer>} - Image data as buffer
   */
  async downloadImage(url, timeout = 30000) {
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid image URL');
    }

    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout,
        headers: {
          'User-Agent': 'OpenNumismat-Enrichment-Tool/1.0'
        }
      });

      return Buffer.from(response.data);
    } catch (error) {
      if (error.response) {
        throw new Error(`Failed to download image (HTTP ${error.response.status}): ${url}`);
      } else if (error.request) {
        throw new Error(`Network error downloading image: ${url}`);
      } else {
        throw new Error(`Error downloading image: ${error.message}`);
      }
    }
  }

  /**
   * Get MIME type from URL or Buffer
   * @param {string|Buffer} input - URL or image buffer
   * @returns {string} - MIME type
   */
  getMimeType(input) {
    if (typeof input === 'string') {
      // Detect from URL extension
      const ext = input.toLowerCase().split('.').pop().split('?')[0];
      const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'bmp': 'image/bmp',
        'svg': 'image/svg+xml'
      };
      return mimeTypes[ext] || 'image/jpeg';
    } else if (Buffer.isBuffer(input)) {
      // Detect from buffer magic bytes
      if (input.length < 4) return 'image/jpeg';

      // PNG: 89 50 4E 47
      if (input[0] === 0x89 && input[1] === 0x50 && input[2] === 0x4E && input[3] === 0x47) {
        return 'image/png';
      }

      // JPEG: FF D8 FF
      if (input[0] === 0xFF && input[1] === 0xD8 && input[2] === 0xFF) {
        return 'image/jpeg';
      }

      // GIF: 47 49 46
      if (input[0] === 0x47 && input[1] === 0x49 && input[2] === 0x46) {
        return 'image/gif';
      }

      // WebP: 52 49 46 46 ... 57 45 42 50
      if (input[0] === 0x52 && input[1] === 0x49 && input[2] === 0x46 && input[3] === 0x46) {
        if (input.length >= 12 && input[8] === 0x57 && input[9] === 0x45 && input[10] === 0x42 && input[11] === 0x50) {
          return 'image/webp';
        }
      }

      return 'image/jpeg'; // Default fallback
    }

    return 'image/jpeg';
  }

  /**
   * Get placeholder image data URI
   * @param {string} type - 'obverse', 'reverse', or 'edge'
   * @returns {string} - Data URI for placeholder
   */
  getPlaceholder(type) {
    return this.placeholders[type] || this.placeholders.obverse;
  }

  /**
   * Extract image URLs from Numista API type response
   * @param {Object} numistaType - Type object from Numista API
   * @returns {Object} - { obverse: url, reverse: url, edge: url }
   */
  extractImageUrls(numistaType) {
    const urls = {
      obverse: null,
      reverse: null,
      edge: null
    };

    if (!numistaType || !numistaType.obverse_thumbnail && !numistaType.reverse_thumbnail) {
      return urls;
    }

    // Numista provides thumbnail and full-size images
    // Use full-size images for better quality
    if (numistaType.obverse_thumbnail) {
      // Convert thumbnail URL to full-size URL
      // Thumbnail: https://en.numista.com/catalogue/photos/...150x150.jpg
      // Full-size: https://en.numista.com/catalogue/photos/...400x400.jpg (or remove size)
      urls.obverse = numistaType.obverse_thumbnail.replace('150x150', '400x400');
    }

    if (numistaType.reverse_thumbnail) {
      urls.reverse = numistaType.reverse_thumbnail.replace('150x150', '400x400');
    }

    if (numistaType.edge_thumbnail) {
      urls.edge = numistaType.edge_thumbnail.replace('150x150', '400x400');
    }

    return urls;
  }

  /**
   * Validate that buffer contains valid image data
   * @param {Buffer} buffer - Image data
   * @returns {boolean} - True if valid image
   */
  isValidImage(buffer) {
    if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 4) {
      return false;
    }

    // Check for common image format magic bytes
    const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    const isJPEG = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    const isGIF = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;
    const isWebP = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
                    buffer.length >= 12 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;

    return isPNG || isJPEG || isGIF || isWebP;
  }

  /**
   * Prepare image for display (handles both BLOBs and URLs)
   * @param {Buffer|string|null} image - Image data (buffer, URL, or null)
   * @param {string} type - Image type ('obverse', 'reverse', 'edge')
   * @returns {string} - Data URI or URL for display
   */
  prepareForDisplay(image, type = 'obverse') {
    // Null or undefined
    if (!image) {
      return this.getPlaceholder(type);
    }

    // Already a data URI or URL
    if (typeof image === 'string') {
      if (image.startsWith('data:') || image.startsWith('http://') || image.startsWith('https://')) {
        return image;
      }
      // Invalid string
      return this.getPlaceholder(type);
    }

    // Buffer/BLOB - convert to data URI
    if (Buffer.isBuffer(image) || image instanceof Uint8Array) {
      if (this.isValidImage(image)) {
        const mimeType = this.getMimeType(image);
        return this.blobToDataUri(image, mimeType);
      }
      return this.getPlaceholder(type);
    }

    // Unknown type
    return this.getPlaceholder(type);
  }
}

module.exports = ImageHandler;
