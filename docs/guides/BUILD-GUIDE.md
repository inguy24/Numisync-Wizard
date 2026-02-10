# Build Guide: Creating the Windows Installer

This guide walks through building NumiSync Wizard into a distributable Windows installer.

---

## Prerequisites

Before building, ensure you have:

- [ ] Node.js 18+ installed
- [ ] npm 9+ installed
- [ ] All dependencies installed (`npm install`)
- [ ] Application runs correctly (`npm start`)

---

## Step 1: Create Application Icon

The installer requires a Windows icon file.

### Option A: Online Converter (Easiest)
1. Create or obtain a source image (PNG, 512x512 or larger recommended)
2. Go to https://convertico.com/ or https://icoconvert.com/
3. Upload your image
4. Select sizes: 256, 128, 64, 48, 32, 16
5. Download the .ico file
6. Save as `build/icon.ico`

### Option B: Using ImageMagick
```bash
magick convert source.png -define icon:auto-resize=256,128,64,48,32,16 build/icon.ico
```

### Option C: Using GIMP
1. Open source image in GIMP
2. Image → Scale Image to 256x256
3. File → Export As → icon.ico
4. In export dialog, select all size options

### Icon Design Tips
- Simple, recognizable shape (coin, collection theme)
- Works well at 16x16 (taskbar size)
- High contrast for visibility

---

## Step 2: Update Version Number

Before each release, update the version in `package.json`:

```json
{
  "version": "1.0.0"  // Change to new version
}
```

Version format: `MAJOR.MINOR.PATCH`
- MAJOR: Breaking changes
- MINOR: New features
- PATCH: Bug fixes

---

## Step 3: Review electron-builder.yml Configuration

Open `electron-builder.yml` and verify/update these settings:

### Application Identity
```yaml
appId: com.numisync.wizard              # Unique app identifier
productName: NumiSync Wizard            # Display name
copyright: Copyright 2026 Shane Burkhardt
```

### GitHub Repository (for auto-updates)
```yaml
publish:
  - provider: github
    owner: inguy24              # Your GitHub username
    repo: numismat-enrichment   # Repository name
    releaseType: release        # or 'draft' for testing
```

### Installer Options
```yaml
nsis:
  oneClick: false                        # false = show install wizard
  perMachine: false                      # false = install for current user only
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: NumiSync Wizard
  deleteAppDataOnUninstall: false        # Keep user data on uninstall
```

### File Associations (Optional)
```yaml
win:
  fileAssociations:
    - ext: db
      name: OpenNumismat Collection
      description: OpenNumismat coin collection database
      icon: build/icon.ico
```

To disable file associations, remove or comment out the `fileAssociations` section.

---

## Step 4: Verify License File

Check that `LICENSE.txt` in the project root is up to date. This displays during installation.

To skip the license screen, remove this line from `electron-builder.yml`:
```yaml
nsis:
  license: LICENSE.txt  # Remove this line
```

---

## Step 5: Run the Build

### Standard Build (Recommended)
```bash
npm run build
```
Creates: `dist/NumiSync Wizard Setup X.X.X.exe`

### Test Build (Unpacked)
```bash
npm run build:dir
```
Creates: `dist/win-unpacked/` folder with executable (faster, for testing)

### Portable Build
```bash
npm run build:portable
```
Creates: `dist/NumiSync Wizard X.X.X.exe` (single portable exe)

---

## Step 6: Test the Installer

### On Your Development Machine
1. Navigate to `dist/` folder
2. Run the installer `.exe`
3. Complete installation wizard
4. Launch from Start Menu or Desktop
5. Verify application works correctly
6. Test with a sample .db file

### On a Clean Windows VM (Recommended)
1. Copy installer to VM
2. Install and run
3. Verify no missing dependencies
4. Test all features

### Test Checklist
- [ ] Installer runs without errors
- [ ] Application launches after install
- [ ] Start Menu shortcut works
- [ ] Desktop shortcut works (if enabled)
- [ ] .db file association works (double-click opens app)
- [ ] Application functions correctly
- [ ] Uninstaller removes application cleanly

---

## Step 7: Code Signing (Optional but Recommended)

Code signing prevents "Unknown Publisher" warnings and SmartScreen blocks.

### Obtain a Certificate
1. Purchase from DigiCert, Sectigo, or Comodo (~$200-400/year)
2. Or use a free one from SignPath.io (for open source)

### Configure Signing
Add to `electron-builder.yml`:
```yaml
win:
  signingHashAlgorithms:
    - sha256
  sign: "./sign.js"  # Custom signing script
  # Or use environment variables:
  # certificateFile: path/to/cert.pfx
  # certificatePassword: ${CSC_KEY_PASSWORD}
```

### Environment Variables for CI/CD
```bash
CSC_LINK=path/to/certificate.pfx
CSC_KEY_PASSWORD=your-password
```

---

## Step 8: Publish Release (Optional)

### Manual GitHub Release
1. Go to GitHub repository → Releases → Draft new release
2. Tag: `v1.0.0` (match package.json version)
3. Title: `v1.0.0 - Release Name`
4. Upload the installer from `dist/`
5. Write release notes
6. Publish

### Automated Publishing
```bash
# Requires GITHUB_TOKEN environment variable
npm run dist -- --publish always
```

---

## Troubleshooting

### "Icon not found" Error
- Ensure `build/icon.ico` exists
- Verify it's a valid ICO file with multiple sizes

### "Cannot find module" Error
```bash
npm install
npm run postinstall
```

### Build Fails on Native Modules
```bash
npm run postinstall
# Or manually:
npx electron-builder install-app-deps
```

### Installer Shows "Unknown Publisher"
- Application is not code-signed
- Either sign the app or users must click "More info" → "Run anyway"

### Large Installer Size
Check what's being included:
```bash
npm run build:dir
```
Review `dist/win-unpacked/` contents. Consider adding to `files` exclude patterns in `electron-builder.yml`.

### Auto-Update Not Working
1. Verify `publish` configuration in `electron-builder.yml`
2. Ensure GitHub releases are public
3. Check that version in new release is higher than installed

---

## Quick Reference

| Command | Output | Use Case |
|---------|--------|----------|
| `npm run build` | NSIS installer (.exe) | Distribution |
| `npm run build:dir` | Unpacked folder | Quick testing |
| `npm run build:portable` | Portable .exe | No-install option |
| `npm run dist` | Full distribution | With auto-publish |

---

## Checklist Before Release

- [ ] Version updated in package.json
- [ ] Icon file exists at build/icon.ico
- [ ] LICENSE.txt is current
- [ ] All features tested
- [ ] CHANGELOG.md updated
- [ ] Build completes without errors
- [ ] Installer tested on clean system
- [ ] GitHub release created (if publishing)

---

## Files Reference

| File | Purpose |
|------|---------|
| `electron-builder.yml` | Build configuration |
| `package.json` | Version, scripts, dependencies |
| `build/icon.ico` | Application icon |
| `LICENSE.txt` | License shown in installer |
| `dist/` | Build output directory |
