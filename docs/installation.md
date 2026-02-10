---
layout: default
title: Installation Guide
---

# Installation Guide

## System Requirements

### Windows
- **Operating System:** Windows 10 (64-bit) or Windows 11
- **Processor:** Intel Core i3 or equivalent
- **Memory:** 4 GB RAM minimum, 8 GB recommended
- **Storage:** 200 MB available space (plus space for image cache)
- **Other:** OpenNumismat installed

### Prerequisites
1. **OpenNumismat** - Download from [opennumismat.github.io](https://opennumismat.github.io/)
2. **Numista API Key** (free) - Register at [numista.com](https://www.numista.com/) and request an API key from your profile settings

---

## Windows Installation

### Step 1: Download NumiSync Wizard

1. Visit the [Releases page](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. Download the latest installer:
   - **64-bit systems:** `NumiSync-Wizard-Setup-1.0.0-x64.exe`
   - **32-bit systems:** `NumiSync-Wizard-Setup-1.0.0-ia32.exe`

**Not sure which version?** Most modern Windows systems are 64-bit. To check:
- Right-click **This PC** → **Properties**
- Look for "System type" (e.g., "64-bit operating system")

### Step 2: Run the Installer

1. **Double-click** the downloaded installer
2. Windows may show a SmartScreen warning (unsigned installer)
   - Click **"More info"** → **"Run anyway"**
3. Accept the End User License Agreement (EULA)
4. Choose installation directory (default: `C:\Program Files\NumiSync Wizard`)
5. Click **Install**
6. Wait for installation to complete
7. Click **Finish** to launch NumiSync Wizard

### Step 3: First Launch

On first launch, NumiSync Wizard will:
- Create a cache directory in `%LOCALAPPDATA%\numisync-wizard-cache`
- Load with no collection open

---

## Initial Configuration

### 1. Add Your Numista API Key

1. Click **Settings** (gear icon) or press `Ctrl+,`
2. Navigate to the **API Settings** tab
3. Enter your Numista API key
4. Click **Save**

**Don't have an API key yet?**
1. Go to [numista.com](https://www.numista.com/) and create a free account
2. Log in → Profile → API Access
3. Request an API key (instant approval for personal use)
4. Copy the key and paste it into NumiSync Wizard

### 2. Open Your Collection

1. Click **File → Open Collection** or press `Ctrl+O`
2. Navigate to your OpenNumismat `.db` file
3. Select the file and click **Open**
4. Your coins will load in the main window

### 3. Configure Data Settings (Optional)

1. Go to **Settings → Data Settings**
2. Choose which data to sync:
   - **Basic** - Type-level catalog data (mintage, composition, ruler, designer)
   - **Issue** - Issue-specific data (year, mint mark, type variants)
   - **Pricing** - Current market pricing (UNC, XF, VF, F grades)
3. Configure field mappings if needed (Advanced users only)

---

## Verify Installation

### Test Basic Functionality

1. Select a few coins in your collection
2. Click **Search & Enrich** button
3. NumiSync should search Numista and find matches
4. Review the matches in the field comparison UI
5. Accept a match to verify data updates work

If you see matches and can update coin data, installation is successful!

---

## Troubleshooting

### Installer Won't Run
- **SmartScreen warning:** Click "More info" → "Run anyway"
- **Antivirus blocking:** Add an exception for the installer
- **Corrupted download:** Re-download the installer and verify file size

### Application Won't Launch
- **Check Event Viewer:** Windows Logs → Application → Look for errors
- **Missing dependencies:** Install [Visual C++ Redistributable](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist)
- **Antivirus interference:** Add exception for `NumiSync Wizard.exe`

### Can't Open Collection
- **Verify file path:** Make sure the `.db` file exists and isn't corrupted
- **File permissions:** Ensure you have read/write access
- **File in use:** Close OpenNumismat if it has the collection open
- **Try File → Recent Collections:** If you've opened it before

### API Key Not Working
- **Verify key:** Copy-paste carefully (no extra spaces)
- **Check API limits:** Numista has rate limits (120 requests/minute)
- **Account status:** Ensure your Numista account is active
- **Test API key:** Try it on Numista's API documentation page

### Cache Directory Issues
- **Default location:** `%LOCALAPPDATA%\numisync-wizard-cache`
- **Custom location:** Settings → General → Cache Directory
- **Permissions:** Ensure you have write access to the cache directory
- **Clear cache:** Delete cache directory contents if corrupted

---

## Uninstallation

### Windows

1. Go to **Settings → Apps → Apps & features**
2. Search for "NumiSync Wizard"
3. Click **Uninstall**
4. Follow the uninstaller prompts

**Manual cleanup (optional):**
- Delete cache directory: `%LOCALAPPDATA%\numisync-wizard-cache`
- Delete settings: `%APPDATA%\numisync-wizard`

---

## Upgrading to a New Version

NumiSync Wizard will check for updates on launch (if enabled in Settings).

### Automatic Update (When Available)
1. Click **"Update Available"** notification
2. Download will start automatically
3. Install will proceed when download completes
4. Application will restart with new version

### Manual Update
1. Download the latest installer from [Releases](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. Run the installer
3. It will automatically detect and upgrade the existing installation
4. Your settings and cache are preserved

---

## Next Steps

- **[Quick Start Guide](/quickstart)** - Get started in 5 minutes
- **[User Manual](https://github.com/inguy24/numismat-enrichment/blob/main/docs/reference/USER-MANUAL.md)** - Comprehensive feature documentation
- **[Support a Supporter License](#)** - Unlock Fast Pricing Mode and Auto-Propagate

---

## Need Help?

- **Issues:** [Report on GitHub](https://github.com/inguy24/numismat-enrichment/issues)
- **Discussions:** [Ask the community](https://github.com/inguy24/numismat-enrichment/discussions)
- **Documentation:** [Full docs](https://github.com/inguy24/numismat-enrichment/tree/main/docs)

<div style="text-align: center; margin: 2em 0;">
  <a href="/" style="display: inline-block; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px;">← Back to Home</a>
  <a href="/quickstart" style="display: inline-block; padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 6px;">Next: Quick Start →</a>
</div>
