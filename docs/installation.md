---
layout: default
title: Installation Guide
---

# Installation Guide

NumiSync Wizard is available for **Windows**, **macOS**, and **Linux**. Choose your platform below for installation instructions.

---

## System Requirements

### All Platforms
- **OpenNumismat** installed ([opennumismat.github.io](https://opennumismat.github.io/))
- **Numista API Key** (free from [numista.com](https://www.numista.com/))
- **RAM:** 4 GB minimum, 8 GB recommended
- **Storage:** 200 MB + cache space

### Windows
- **OS:** Windows 10 (64-bit) or Windows 11
- **Processor:** Intel Core i3 or equivalent

### macOS
- **OS:** macOS 10.13 High Sierra or later
- **Architecture:** Intel (x64) and Apple Silicon (M1/M2/M3 arm64)

### Linux
- **OS:** Ubuntu 20.04+, Debian 10+, Fedora 32+, or compatible
- **Architecture:** x64
- **Display Server:** X11 or Wayland

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

## macOS Installation

**⚠️ Important:** NumiSync Wizard is **not signed** with an Apple Developer certificate. macOS will block it by default. Follow these steps to install:

### Step 1: Download NumiSync Wizard

1. Visit the [Releases page](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. Download the latest DMG:
   - **Universal DMG:** `NumiSync-Wizard-1.0.0-universal.dmg` (works on both Intel and Apple Silicon)
   - **Intel-specific:** `NumiSync-Wizard-1.0.0-x64.dmg`
   - **Apple Silicon:** `NumiSync-Wizard-1.0.0-arm64.dmg`

**Most users should download the Universal DMG.**

### Step 2: Install the App

1. **Open the DMG** by double-clicking it
2. **Drag NumiSync Wizard** to your Applications folder
3. **Eject the DMG** (right-click → Eject)

### Step 3: Bypass Gatekeeper (Required)

Since the app is unsigned, macOS will block it. Use **Method 1** (easiest):

#### Method 1: Right-Click Open (Recommended)

1. **Go to Applications** folder in Finder
2. **Right-click** (or Control-click) on NumiSync Wizard
3. Select **"Open"** from the menu
4. Click **"Open"** in the security dialog
5. The app will launch - **all future launches work normally** (just double-click)

#### Method 2: System Preferences Override

1. Try to open the app normally (it will be blocked)
2. Go to **System Preferences** → **Security & Privacy** → **General**
3. Click **"Open Anyway"** next to the blocked app message
4. Click **"Open"** in the confirmation dialog

#### Method 3: Terminal Override (Advanced)

```bash
cd /Applications
xattr -d com.apple.quarantine "NumiSync Wizard.app"
```

**For detailed troubleshooting, see the [macOS Installation Guide](/macos-install).**

### Step 4: First Launch

On first launch, NumiSync Wizard will:
- Create a cache directory in `~/Library/Application Support/numisync-wizard-cache`
- Load with no collection open

---

## Linux Installation

NumiSync Wizard is available in three formats for Linux. Choose based on your distribution:

### Option 1: AppImage (Universal - Recommended)

**Best for:** All distributions

1. Download `NumiSync-Wizard-1.0.0.AppImage` from [Releases](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. Make it executable:
   ```bash
   chmod +x NumiSync-Wizard-1.0.0.AppImage
   ```
3. Run it:
   ```bash
   ./NumiSync-Wizard-1.0.0.AppImage
   ```

**Optional:** Integrate with your desktop environment using [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher)

### Option 2: Debian/Ubuntu (.deb)

**Best for:** Debian, Ubuntu, Linux Mint, Pop!_OS

```bash
# Download the .deb file
wget https://github.com/inguy24/numismat-enrichment/releases/latest/download/NumiSync-Wizard-1.0.0-amd64.deb

# Install
sudo dpkg -i NumiSync-Wizard-1.0.0-amd64.deb

# Install dependencies if needed
sudo apt-get install -f
```

Launch from applications menu or run:
```bash
numisync-wizard
```

### Option 3: Fedora/RHEL (.rpm)

**Best for:** Fedora, RHEL, CentOS, Rocky Linux

```bash
# Download the .rpm file
wget https://github.com/inguy24/numismat-enrichment/releases/latest/download/NumiSync-Wizard-1.0.0.x86_64.rpm

# Install
sudo rpm -i NumiSync-Wizard-1.0.0.x86_64.rpm

# Or with dnf (recommended)
sudo dnf install NumiSync-Wizard-1.0.0.x86_64.rpm
```

Launch from applications menu or run:
```bash
numisync-wizard
```

### First Launch (Linux)

On first launch, NumiSync Wizard will:
- Create a cache directory in `~/.config/numisync-wizard-cache`
- Load with no collection open

---

## Initial Configuration

**Note:** These steps are the same for all platforms (Windows, macOS, Linux)

### 1. Add Your Numista API Key

1. Click **Settings** (gear icon) or press `Ctrl+,`
2. Navigate to the **API Settings** tab
3. Enter your Numista API key
4. Click **Save**

**How to get an API key:**
1. Go to [numista.com](https://www.numista.com/) and create a free account
2. Log in → Profile → API Access
3. Request an API key (instant approval for personal use)
4. Copy the key and paste it into NumiSync Wizard

### 2. Open Your Collection

1. Click **File → Open Collection** (keyboard shortcut varies by platform)
   - **Windows/Linux:** `Ctrl+O`
   - **macOS:** `Cmd+O`
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

### Windows Issues

**Installer Won't Run:**
- SmartScreen warning: Click "More info" → "Run anyway"
- Antivirus blocking: Add exception for installer
- Corrupted download: Re-download and verify file size

**Application Won't Launch:**
- Check Event Viewer: Windows Logs → Application
- Missing dependencies: Install [Visual C++ Redistributable](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist)
- Antivirus interference: Add exception for `NumiSync Wizard.exe`

### macOS Issues

**"NumiSync Wizard is damaged and can't be opened":**
- Delete the DMG and re-download
- Verify file size matches releases page
- Try Method 1 (Right-click → Open)

**"No option to Open in security dialog":**
- You double-clicked instead of right-clicking
- Use Method 1 or Method 2 from installation steps above

**App crashes immediately:**
- Check Console app for crash logs
- Report issue with macOS version and crash log

**See [macOS Installation Guide](/macos-install) for detailed troubleshooting.**

### Linux Issues

**AppImage won't run:**
- Ensure it's executable: `chmod +x *.AppImage`
- Install FUSE: `sudo apt-get install fuse` (Ubuntu/Debian)
- Try running from terminal to see error messages

**.deb installation fails:**
- Install dependencies: `sudo apt-get install -f`
- Check system requirements (Ubuntu 20.04+)

**.rpm installation fails:**
- Install dependencies: `sudo dnf install <package-name>`
- Check system requirements (Fedora 32+)

**Missing libraries:**
```bash
# Ubuntu/Debian
sudo apt-get install libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils

# Fedora/RHEL
sudo dnf install gtk3 libnotify nss libXScrnSaver libXtst xdg-utils
```

### All Platforms

**Can't Open Collection:**
- Verify `.db` file exists and isn't corrupted
- Ensure you have read/write permissions
- Close OpenNumismat if it has the collection open
- Try File → Recent Collections

**API Key Not Working:**
- Copy-paste carefully (no extra spaces)
- Check rate limits (120 requests/minute)
- Verify Numista account is active
- Test key on Numista API documentation page

**Cache Directory Issues:**
- **Windows:** `%LOCALAPPDATA%\numisync-wizard-cache`
- **macOS:** `~/Library/Application Support/numisync-wizard-cache`
- **Linux:** `~/.config/numisync-wizard-cache`
- Check write permissions
- Clear cache if corrupted

---

## Uninstallation

### Windows

1. Go to **Settings → Apps → Apps & features**
2. Search for "NumiSync Wizard"
3. Click **Uninstall**
4. Follow the uninstaller prompts

**Manual cleanup (optional):**
- Delete cache: `%LOCALAPPDATA%\numisync-wizard-cache`
- Delete settings: `%APPDATA%\numisync-wizard`

### macOS

1. Quit the application
2. Delete `NumiSync Wizard.app` from Applications folder
3. **Optional cleanup:**
   ```bash
   rm -rf ~/Library/Application\ Support/numisync-wizard-cache
   rm -rf ~/Library/Preferences/com.numisync.wizard.plist
   ```

### Linux

**AppImage:** Simply delete the `.AppImage` file

**Debian/Ubuntu (.deb):**
```bash
sudo apt-get remove numisync-wizard
```

**Fedora/RHEL (.rpm):**
```bash
sudo rpm -e numisync-wizard
# Or with dnf
sudo dnf remove numisync-wizard
```

**Manual cleanup (all Linux):**
```bash
rm -rf ~/.config/numisync-wizard-cache
rm -rf ~/.config/numisync-wizard
```

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
