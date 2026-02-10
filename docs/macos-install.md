# macOS Installation Guide

Since NumiSync Wizard is not signed with an Apple Developer certificate, macOS will block it by default with Gatekeeper. This guide explains how to safely install and run the application.

---

## Why is this necessary?

Apple requires all applications to be signed with a paid Apple Developer certificate ($99/year). Since NumiSync Wizard is a free/freemium hobby project, we've chosen not to pay for this certificate. The application is safe to use - you just need to explicitly tell macOS to allow it.

---

## Installation Methods

### Method 1: Right-Click Open (Recommended)

This is the simplest and safest method:

1. **Download** the latest `.dmg` file from [GitHub Releases](https://github.com/inguy24/numismat-enrichment/releases/latest)

2. **Open the DMG** by double-clicking it

3. **Drag NumiSync Wizard** to your Applications folder

4. **Go to Applications** folder in Finder

5. **Right-click** (or Control-click) on NumiSync Wizard and select **"Open"**

6. Click **"Open"** in the security dialog that appears

   > **Note:** This dialog is different from the one that appears when you double-click. The right-click method shows an "Open" button that regular double-clicking does not.

7. The app will now launch and **all future launches work normally** (just double-click)

---

### Method 2: System Preferences Override

If you've already tried to open the app and it was blocked:

1. Try to **open the app normally** (it will be blocked by Gatekeeper)

2. Go to **System Preferences** → **Security & Privacy** → **General** tab

3. You'll see a message about NumiSync Wizard being blocked

4. Click **"Open Anyway"** next to the message

5. Click **"Open"** in the confirmation dialog

6. The app will now run normally on all future launches

---

### Method 3: Terminal Override (Advanced)

For advanced users comfortable with the command line:

```bash
# Navigate to Applications folder
cd /Applications

# Remove the quarantine attribute
xattr -d com.apple.quarantine "NumiSync Wizard.app"
```

After running this command, you can launch the app normally.

---

## Troubleshooting

### "NumiSync Wizard is damaged and can't be opened"

This can happen if the download was corrupted or interrupted:

1. Delete the downloaded .dmg file
2. Download it again from [GitHub Releases](https://github.com/inguy24/numismat-enrichment/releases/latest)
3. Verify the file size matches what's shown on the releases page
4. Try opening again using Method 1

### "No option to Open in the security dialog"

If you only see "Move to Trash" and "Cancel":

1. You double-clicked instead of right-clicking - use Method 1 (right-click → Open)
2. Or use Method 2 (System Preferences override)

### App opens but crashes immediately

This is likely unrelated to code signing. Please:

1. Check the Console app for crash logs
2. Report the issue at [GitHub Issues](https://github.com/inguy24/numismat-enrichment/issues)
3. Include your macOS version and the crash log

---

## System Requirements

- **macOS:** 10.13 High Sierra or later
- **Architecture:** Intel (x64) and Apple Silicon (M1/M2/M3 arm64)
- **RAM:** 4 GB minimum, 8 GB recommended
- **Storage:** 200 MB + cache space

---

## Verification

NumiSync Wizard is **not signed**, so macOS will not show a verified developer. However, you can verify the authenticity by:

1. **Download only from official sources:**
   - GitHub Releases: https://github.com/inguy24/numismat-enrichment/releases
   - Official website: https://numisync.com

2. **Check the SHA256 hash** (shown on the releases page)

3. **Review the source code** (this is an open-source project under MIT license)

---

## Privacy & Security

NumiSync Wizard:

- ✅ Does **NOT** collect analytics or telemetry
- ✅ Does **NOT** transmit your collection data anywhere
- ✅ Only communicates with Numista API (when you use search features)
- ✅ Stores all data locally on your machine
- ✅ Is **open-source** - you can review the code at any time

---

## Uninstallation

To remove NumiSync Wizard:

1. Quit the application
2. Delete it from Applications folder
3. Optionally delete cache and settings:
   ```bash
   rm -rf ~/Library/Application\ Support/NumiSync\ Wizard
   rm -rf ~/Library/Preferences/com.numisync.wizard.plist
   ```

---

## Future Plans

We may add macOS code signing in the future if:

- The project receives sufficient funding through supporter licenses
- We can justify the $99/year Apple Developer Program cost
- There is enough demand from macOS users

For now, the manual installation process is the only option.

---

## Questions?

- **Issues:** [Report bugs or ask questions](https://github.com/inguy24/numismat-enrichment/issues)
- **Discussions:** [Community forum](https://github.com/inguy24/numismat-enrichment/discussions)
- **Website:** [https://numisync.com](https://numisync.com)
