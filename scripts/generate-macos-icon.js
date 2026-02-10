/**
 * Generate macOS .icns icon from PNG
 * Uses png2icons package to convert build/icon.png to build/icon.icns
 */

const fs = require('fs');
const path = require('path');
const png2icons = require('png2icons');

const SOURCE_ICON = path.join(__dirname, '..', 'build', 'icon.png');
const OUTPUT_ICON = path.join(__dirname, '..', 'build', 'icon.icns');

console.log('Generating macOS .icns icon...');

// Check if source icon exists
if (!fs.existsSync(SOURCE_ICON)) {
  console.error(`ERROR: Source icon not found: ${SOURCE_ICON}`);
  process.exit(1);
}

// Read the source PNG
const input = fs.readFileSync(SOURCE_ICON);

try {
  // Generate .icns file
  const output = png2icons.createICNS(input, png2icons.BILINEAR, 0);

  // Write to output file
  fs.writeFileSync(OUTPUT_ICON, output);

  console.log(`✅ Successfully generated macOS icon: ${OUTPUT_ICON}`);
  console.log(`   File size: ${(output.length / 1024).toFixed(2)} KB`);
} catch (error) {
  console.error('ERROR: Failed to generate .icns file');
  console.error(error.message);
  process.exit(1);
}
