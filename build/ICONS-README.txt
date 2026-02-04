BUILD RESOURCES DIRECTORY
=========================

This directory should contain the following files before building:

SOURCE FILE:
------------
logo_no_text.svg  - Official NumiSync Wizard logo (vector source)
                    Convert this to the formats below before building

REQUIRED:
---------
icon.ico    - Windows application icon (256x256 recommended, multi-size ICO)
              Used for: app icon, installer, file associations

OPTIONAL:
---------
icon.png    - PNG version of icon (512x512 recommended)
              Used for: Linux builds, development mode window icon
icon.icns   - macOS icon bundle
              Used for: macOS builds

CREATING ICON FILES FROM logo_no_text.svg
-----------------------------------------

Step 1: Convert SVG to PNG
- Use Inkscape: inkscape logo_no_text.svg -w 512 -h 512 -o icon.png
- Or online: https://svgtopng.com/

Step 2: Convert PNG to ICO

Option 1: Online Converters
- Upload icon.png (512x512) to:
  - https://convertico.com/
  - https://icoconvert.com/
  - https://image.online-convert.com/convert-to-ico

Option 2: Using ImageMagick (command line)
  magick convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico

Option 3: GIMP
1. Open icon.png
2. Image > Scale Image to 256x256
3. File > Export As > icon.ico
4. Select sizes: 256, 128, 64, 48, 32, 16

LICENSE FILE
------------
Create LICENSE.txt in the project root for NSIS installer.
If not needed, remove the "license" line from electron-builder.yml.
