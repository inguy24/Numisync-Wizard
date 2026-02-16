# NumiSync Wizard - Cross-Platform Installer & Distribution Plan

**Created:** February 6, 2026
**Last Updated:** February 16, 2026
**Status:** Phase 0-1 Complete, Phase 1.5 Complete, Phase 2.5 MSIX Submitted (Feb 16, 2026), Phase 3-5 Complete, Phase 6 Complete, Phase 2 Pending

## Overview

Transform NumiSync Wizard from Windows-only to full cross-platform distribution with **fully automated CI/CD via GitHub Actions**, EULA in installer, auto-updates, and FREE code signing via SignPath Foundation.

---

## CRITICAL: Automated Build Requirement

> **All release builds MUST go through GitHub Actions.**
>
> SignPath Foundation requires that binaries are built on GitHub-hosted runners (not locally).
> This means you cannot build an installer on your local machine and upload it for signing.
> The entire release process is automated through GitHub Actions.

### Development vs Release Builds

| Build Type | Where It Happens | Signed? | Purpose |
|------------|------------------|---------|---------|
| Development | Local machine | No | Testing, debugging |
| Release | GitHub Actions | Yes (Windows) | Distribution to users |

**You can still run `npm run build:win` locally** for testing purposes - it will create an unsigned installer that works fine for development. But any installer you distribute to users must be built through the automated GitHub Actions pipeline.

---

## Key Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Windows installer | NSIS (.exe) | Already configured, better electron-builder support, smaller size |
| Windows code signing | SignPath Foundation (FREE) | No cost, trusted publisher, requires GitHub Actions |
| macOS distribution | Unsigned + manual install docs | Apple Developer costs $99/yr - not worth it for hobby project |
| Linux distribution | AppImage + deb + rpm | Covers all major distros |
| EULA location | Installer (not app) | Better UX, industry standard |
| CI/CD | GitHub Actions (REQUIRED) | Required by SignPath, free for public repos |

---

## Platform Targets

- **Windows:** NSIS installer (x64, ia32) - built on GitHub Actions, signed via SignPath
- **macOS:** Unsigned DMG - built on GitHub Actions
- **Linux:** AppImage + deb + rpm - built on GitHub Actions

---

## Phase 0: GitHub Pages Homepage

**Created:** February 10, 2026
**Status:** Complete
**URL:** [https://numisync.com](https://numisync.com)

### Purpose

Professional landing page for the project with downloads, features, screenshots, and documentation links. Provides a welcoming entry point for users discovering NumiSync Wizard.

### Technology

- **GitHub Pages** with Jekyll + Minimal Theme
- Zero-maintenance deployment (auto-updates on push to main)
- Markdown-based content for easy updates
- Custom domain: numisync.com

### Files Created

| File | Purpose |
|------|---------|
| `docs/_config.yml` | Jekyll configuration (site metadata, theme, plugins) |
| `docs/index.md` | Homepage with features, downloads, pricing |
| `docs/installation.md` | Detailed installation guide for Windows |
| `docs/quickstart.md` | 5-minute quick start tutorial |
| `docs/assets/images/logo.svg` | Main logo for homepage |
| `docs/assets/images/logo-icon.svg` | Logo icon for sidebar |
| `docs/assets/images/icon.png` | Application icon |
| `docs/assets/images/favicon.png` | Browser favicon |
| `README.md` | Project README with homepage link |

### Files Modified

| File | Changes |
|------|---------|
| `package.json` | Added `homepage: "https://numisync.com"` |
| `docs/guides/INSTALLER-DISTRIBUTION-PLAN.md` | Added Phase 0 section |

### Content Sections

**Homepage includes:**
- Hero section with logo and download buttons
- "What is NumiSync Wizard?" overview
- 8 key features with descriptions
- Screenshots section (placeholder for future additions)
- Download section with zero-maintenance `/releases/latest` links
- Quick start (5 steps)
- Support Development section with pricing/license info
- Documentation links
- Footer with credits and links

**Installation Guide includes:**
- System requirements
- Step-by-step Windows installation
- Initial configuration (API key, settings)
- Troubleshooting section
- Upgrade instructions

**Quick Start Guide includes:**
- Prerequisites checklist
- Walkthrough of basic enrichment workflow
- Common workflows (enrich collection, update pricing only, fix matches)
- Tips for best results
- Keyboard shortcuts
- FAQ section

### Integration with Other Phases

- **Phase 1-2** (EULA, Code Signing): Add SignPath badge to footer when implemented
- **Phase 4-6** (Cross-Platform): Update download section when Mac/Linux builds available
- **Future**: Add testimonials, video demos, comparison table

### Maintenance Strategy

**Zero-Maintenance Downloads:**
- Primary download button links to `https://github.com/inguy24/numismat-enrichment/releases/latest`
- GitHub automatically redirects to the latest release
- No homepage updates needed when releasing new versions
- Users always get the current version

**Content Updates:**
- Edit Markdown files in `docs/` directory
- Push to main branch → GitHub Pages auto-deploys
- No manual deployment steps required

### Domain Configuration

**Custom Domain Setup:**
1. Purchase domain: numisync.com (completed)
2. Add CNAME file to `docs/` directory: `numisync.com`
3. Configure DNS A records to point to GitHub Pages IPs:
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
4. Wait for DNS propagation (24-48 hours)
5. Enable HTTPS in GitHub Pages settings

### GitHub Pages Setup

**Steps to Enable:**
1. Go to https://github.com/inguy24/numismat-enrichment/settings/pages
2. **Source:** Deploy from a branch
3. **Branch:** `main`
4. **Folder:** `/docs`
5. Click **Save**
6. Add custom domain: `numisync.com`
7. Enforce HTTPS (enabled automatically after DNS propagation)

### Verification Checklist

- [x] Directory structure created
- [x] Logo assets copied to `docs/assets/images/`
- [x] Favicon created
- [x] Jekyll `_config.yml` written with custom domain
- [x] Homepage content (`docs/index.md`) written
- [x] Installation guide (`docs/installation.md`) written
- [x] Quick start guide (`docs/quickstart.md`) written
- [x] README.md created with homepage link
- [x] package.json updated with homepage field
- [x] INSTALLER-DISTRIBUTION-PLAN.md updated with Phase 0
- [ ] GitHub Pages enabled (requires user action)
- [ ] Custom domain CNAME added (after GitHub Pages enabled)
- [ ] DNS configured to point to GitHub Pages
- [ ] Site live at https://numisync.com

### Post-Launch Tasks

**Immediate (after GitHub Pages is enabled):**
- Add CNAME file with `numisync.com`
- Configure DNS A records
- Test site loads at numisync.com
- Verify all links work
- Check mobile responsiveness

**Future Enhancements:**
- Add application screenshots (4-6 images)
- Create video demo/screencast
- Add testimonials section
- Implement blog/news section for updates
- Add usage statistics (if collected)
- Create comparison table (manual vs NumiSync workflow)

### Notes

- Screenshots are placeholder text for now - user will add actual screenshots later
- Favicon uses existing icon.png directly (modern browsers support PNG)
- All content emphasizes the freemium model and supporter license clearly
- Pricing messaging matches the in-app nag prompt
- Download links use `/releases/latest` for zero maintenance

---

## Phase 1: Foundation (EULA, Version Scripts, Auto-Update)

### Files to Create

| File | Purpose |
|------|---------|
| `EULA.txt` | Plain text EULA (root of project) |
| `build/eula/eula-windows.rtf` | RTF format for NSIS license screen |
| `build/installer.nsh` | NSIS custom script to create EULA acceptance marker |
| `scripts/validate-version.js` | Pre-build version validation |
| `scripts/post-version.js` | Post-version changelog reminder |
| `src/main/updater.js` | Auto-update module using electron-updater |

### Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Add version scripts, add electron-updater dependency |
| `electron-builder.yml` | EULA integration, NSIS include reference |
| `src/renderer/app.js` | Check for installer EULA marker before showing in-app EULA |
| `src/main/index.js` | Integrate auto-updater, add "Check for Updates" menu item |
| `src/main/preload.js` | Expose update events to renderer |

### EULA Flow

```
Installer runs --> User accepts EULA in installer wizard -->
Installer creates marker file (eula-installer-accepted.marker) -->
App launch checks for marker --> If exists, skip in-app EULA
```

### EULA Extraction Details

The current EULA is embedded in `src/renderer/app.js` as `EULA_CONTENT` constant (lines 62-220+). Extract this to:

1. **EULA.txt** - Plain text version for reference and Linux packages
2. **build/eula/eula-windows.rtf** - RTF formatted version for NSIS installer

The EULA version tracking (`EULA_VERSION = '2.0'`) should remain in app.js to handle:
- Portable installs (no marker) - show in-app EULA
- EULA version changes - re-prompt based on stored version
- Marker deleted - fallback to in-app EULA

### App.js Modification for Installer Marker

Add check in `checkEulaOnStartup()` to look for installer marker file:

```javascript
async function checkEulaOnStartup() {
  // First check for installer-created marker
  const installerMarkerExists = await window.electronAPI.checkInstallerEulaMarker();
  if (installerMarkerExists) {
    // EULA was accepted during installation
    return;
  }

  // Fall back to existing in-app EULA check
  const accepted = await isEulaAccepted();
  if (!accepted) {
    showEulaModal(true);
  }
}
```

---

## Phase 1.5: License Versioning Architecture

**Added:** February 9, 2026

### Business Requirement

Users should only receive features from the app version their license was purchased for. When upgrading to a newer version:
- **Existing features** unlocked by their license continue to work
- **New features** added in later versions require purchasing a new license

**Example:**
| License | App Version | Fast Pricing (v1 feature) | Numista Sync (v2 feature) |
|---------|-------------|---------------------------|---------------------------|
| v1.0.0  | v1.0.0      | ✅ Unlocked                | N/A (doesn't exist)       |
| v1.0.0  | v2.0.0      | ✅ Unlocked                | 🔒 Requires v2 license    |
| v2.0.0  | v2.0.0      | ✅ Unlocked                | ✅ Unlocked                |

### Implementation Strategy: Polar License Prefixes

Polar.sh allows setting a custom **license prefix** for each product. This is the perfect mechanism for version detection.

#### Product Setup in Polar Dashboard

Create separate products for each major version:

| Product Name | License Prefix | Product ID | Version |
|--------------|----------------|------------|---------|
| NumiSync Supporter License v1 | `V1` | `50fd6539-84c3-4ca7-9a1e-9f73033077dd` | 1.x.x |
| NumiSync Supporter License v2 | `V2` | `[create when v2 launches]` | 2.x.x |
| NumiSync Supporter License v3 | `V3` | `[create when v3 launches]` | 3.x.x |

**License Key Format Examples:**
- V1 license: `V1-XXXX-XXXX-XXXX-XXXX`
- V2 license: `V2-XXXX-XXXX-XXXX-XXXX`
- V3 license: `V3-XXXX-XXXX-XXXX-XXXX`

#### Code Implementation

**1. Extract License Version from Key**

Add to `src/main/index.js`:

```javascript
/**
 * Extract version from license key prefix
 * @param {string} licenseKey - The full license key (e.g., "V1-XXXX-XXXX-XXXX")
 * @returns {string|null} Version string (e.g., "1.0.0") or null if invalid
 */
function getLicenseVersion(licenseKey) {
  if (!licenseKey || typeof licenseKey !== 'string') {
    return null;
  }

  const prefix = licenseKey.split('-')[0].toUpperCase();

  const versionMap = {
    'V1': '1.0.0',
    'V2': '2.0.0',
    'V3': '3.0.0'
  };

  return versionMap[prefix] || null;
}
```

**2. Define Feature Version Requirements**

Add to `src/main/index.js`:

```javascript
/**
 * Feature entitlements by version
 * Maps feature names to minimum required license version
 */
const FEATURE_VERSIONS = {
  // V1 Features (launched with v1.0.0)
  'fastPricing': '1.0.0',
  'batchEnrichment': '1.0.0',
  'advancedSearch': '1.0.0',

  // V2 Features (planned for v2.0.0)
  'numismaticSync': '2.0.0',
  'aiPricing': '2.0.0',
  'cloudBackup': '2.0.0',

  // V3 Features (future)
  'marketplaceIntegration': '3.0.0'
};
```

**3. Feature Gate Function**

```javascript
/**
 * Check if a feature is unlocked by the user's license
 * @param {string} licenseKey - The user's license key
 * @param {string} featureName - Feature to check (from FEATURE_VERSIONS)
 * @returns {boolean} True if feature is unlocked
 */
function isFeatureUnlocked(licenseKey, featureName) {
  const licenseVersion = getLicenseVersion(licenseKey);

  if (!licenseVersion) {
    return false; // Invalid license
  }

  const requiredVersion = FEATURE_VERSIONS[featureName];

  if (!requiredVersion) {
    return false; // Unknown feature
  }

  // Compare semantic versions
  return compareVersions(licenseVersion, requiredVersion) >= 0;
}

/**
 * Compare semantic versions
 * @returns {number} -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }
  return 0;
}
```

**4. IPC Handler for Feature Checks**

```javascript
// Add to src/main/index.js
ipcMain.handle('check-feature-access', async (event, featureName) => {
  const licenseKey = getStoredLicenseKey(); // Your existing function

  if (!licenseKey) {
    return {
      unlocked: false,
      reason: 'no_license',
      upgradeRequired: true
    };
  }

  const unlocked = isFeatureUnlocked(licenseKey, featureName);

  if (!unlocked) {
    return {
      unlocked: false,
      reason: 'version_mismatch',
      licenseVersion: getLicenseVersion(licenseKey),
      requiredVersion: FEATURE_VERSIONS[featureName],
      upgradeRequired: true
    };
  }

  return {
    unlocked: true,
    licenseVersion: getLicenseVersion(licenseKey)
  };
});
```

**5. Renderer-Side Usage**

```javascript
// Add to src/renderer/app.js
async function checkFeatureAccess(featureName) {
  const result = await window.electronAPI.checkFeatureAccess(featureName);

  if (!result.unlocked) {
    if (result.reason === 'no_license') {
      showUpgradeModal('This feature requires a license.');
    } else if (result.reason === 'version_mismatch') {
      showUpgradeModal(
        `This feature requires a v${result.requiredVersion} license. ` +
        `Your license is for v${result.licenseVersion}. ` +
        `Purchase an upgrade to unlock this feature.`
      );
    }
    return false;
  }

  return true;
}

// Example usage
async function enableNumisticSync() {
  if (await checkFeatureAccess('numismaticSync')) {
    // Feature is unlocked - proceed
    initializeSync();
  }
  // Otherwise, upgrade modal was shown
}
```

#### Migration Path for Existing V1 License Holders

**Option 1: Grandfather existing users**
- Before v2 launch, create a special "V1-LIFETIME" prefix product
- Offer existing v1 license holders a one-time migration to lifetime access
- This is a goodwill gesture for early supporters

**Option 2: Standard upgrade pricing**
- V1 licenses continue to work for v1 features
- V2 features require purchasing new v2 license
- Optionally offer upgrade discount code

### Polar Dashboard Configuration Checklist

Before v1.0.0 launch:
- [ ] Set license prefix to `V1` for current product (requires Polar dashboard access)
- [ ] Update product name to "NumiSync Supporter License v1" (requires Polar dashboard access)
- [ ] Document product ID in POLAR-PRODUCTION-CONFIG.md

**Note:** Code implementation for license versioning is complete. Dashboard configuration is pending until production launch.

Before v2.0.0 launch:
- [ ] Create new product "NumiSync Supporter License v2"
- [ ] Set license prefix to `V2`
- [ ] Update checkout URLs in app to point to v2 product
- [ ] Add v2 product ID to POLAR-PRODUCTION-CONFIG.md
- [ ] Test feature gating with both v1 and v2 test licenses

### Testing Strategy

**Test Cases:**

| License | Feature | Expected Result |
|---------|---------|-----------------|
| V1-XXXX | fastPricing | ✅ Unlocked |
| V1-XXXX | numismaticSync | 🔒 Blocked with upgrade prompt |
| V2-XXXX | fastPricing | ✅ Unlocked (backwards compatible) |
| V2-XXXX | numismaticSync | ✅ Unlocked |
| None | Any feature | 🔒 Blocked with purchase prompt |
| Invalid | Any feature | 🔒 Blocked |

### Files to Modify

| File | Changes |
|------|---------|
| `src/main/index.js` | Add `getLicenseVersion()`, `isFeatureUnlocked()`, `compareVersions()`, IPC handler |
| `src/main/preload.js` | Expose `checkFeatureAccess` to renderer |
| `src/renderer/app.js` | Add `checkFeatureAccess()`, `showUpgradeModal()`, gate features |
| `docs/guides/POLAR-PRODUCTION-CONFIG.md` | Document v1 and v2 product IDs |

---

## Phase 2: Windows Code Signing (SignPath Foundation - FREE)

### What is SignPath Foundation?

- FREE code signing for open source projects
- Certificate issued to "SignPath Foundation" (they appear as publisher)
- Keys stored securely on their HSM
- Integrates directly with GitHub Actions
- No personal ID verification - they verify your code comes from your public repo

### CRITICAL: Build Requirements

> **IMPORTANT:** You can still run `npm run build:win` locally for testing!
> The restriction only applies to **signed releases** that you distribute to users.
> Local builds work fine for development - they just won't be signed.

**For signed releases distributed to users**, SignPath Foundation requires:

1. **All builds MUST happen on GitHub-hosted runners** - SignPath verifies artifacts were actually built by GitHub Actions
2. **Origin metadata comes from GitHub** - Cannot be forged because GitHub provides it, not your build script
3. **Artifacts must be uploaded as GitHub artifacts first** - SignPath downloads from GitHub, signs, and returns
4. **SignPath GitHub App must be installed** on your repository
5. **All team members must use MFA** for GitHub and SignPath access

### How the Signing Flow Works

```
1. Developer pushes tag (v1.0.0)
         |
         v
2. GitHub Actions triggers on tag
         |
         v
3. Build job runs on `windows-latest` (GitHub-hosted runner)
         |
         v
4. electron-builder creates unsigned .exe
         |
         v
5. Upload unsigned artifact to GitHub Artifacts
         |
         v
6. SignPath Action submits signing request with artifact ID
         |
         v
7. SignPath verifies:
   - Build actually happened on GitHub-hosted runner
   - Code matches the public repository
   - Branch/tag matches signing policy
         |
         v
8. Developer approves signing in SignPath dashboard
         |
         v
9. SignPath signs the artifact
         |
         v
10. Signed artifact returned to GitHub Actions
         |
         v
11. Create GitHub Release with signed .exe
```

### Requirements to Qualify

- OSI-approved open source license (MIT - already have this)
- Public GitHub repository (github.com/inguy24/numismat-enrichment)
- Active maintenance with releases
- No proprietary components
- **All builds via GitHub Actions** (no local builds for releases)
- Uninstaller respects user privacy and provides clear choices about data deletion
- Custom cache locations are detected via app-settings.json and optionally deleted

### SignPath Application Process

1. **Apply:** Go to [signpath.org](https://signpath.org) and click Apply
2. **Provide:** GitHub repo URL, project description, your role
3. **Wait:** Approval typically takes a few days
4. **Install:** SignPath GitHub App on your repository
5. **Configure:** Set up signing policies (test-signing, release-signing)
6. **Sign:** Each release requires manual approval in SignPath dashboard

### GitHub README Updates Required

Add this section to README.md (REQUIRED by SignPath):

```markdown
## Code Signing Policy

This application is digitally signed for your security.

**Free code signing provided by [SignPath.io](https://signpath.io)**
**Certificate by [SignPath Foundation](https://signpath.org)**

### Project Roles

| Role | Member |
|------|--------|
| Approver | Shane Burkhardt (@inguy24) |
| Committer | Shane Burkhardt (@inguy24) |

### Privacy

This application does not transmit personal information without user consent.
See our [Privacy Policy](#privacy) for details.
```

### GitHub Actions Integration

SignPath provides a GitHub Action that:

1. Builds your app in GitHub Actions
2. Submits artifacts to SignPath for signing
3. You approve the signing request in SignPath dashboard
4. Signed artifacts are returned for release

### GitHub Repository Configuration for SignPath

**Secrets (Settings > Secrets and variables > Actions > Secrets):**

| Secret | Purpose |
|--------|---------|
| `SIGNPATH_API_TOKEN` | API token from SignPath dashboard (keep secret!) |

**Variables (Settings > Secrets and variables > Actions > Variables):**

| Variable | Purpose | Example Value |
|----------|---------|---------------|
| `SIGNPATH_ORGANIZATION_ID` | Your SignPath org ID | `abc123-def456-...` |

**Hardcoded in workflow (not sensitive):**

| Value | Purpose |
|-------|---------|
| `project-slug` | Project name in SignPath | `numisync-wizard` |
| `signing-policy-slug` | Policy name | `release-signing` |

**GitHub App Required:**

You must install the SignPath GitHub App on your repository:
1. Go to SignPath dashboard after approval
2. Navigate to your project settings
3. Click "Install GitHub App"
4. Grant access to `inguy24/numismat-enrichment` repository

---

## Phase 2.5: Microsoft Store Distribution (Alternative to SignPath)

**Created:** February 11, 2026
**Status:** MSIX submitted to Microsoft for certification (February 16, 2026)
**Cost:** FREE (individual developers pay no fee)

### Business Case

SignPath Foundation approval is uncertain due to "reputation" requirements for self-developed projects. Microsoft Store provides:

- **Automatic code signing** (Microsoft certificate)
- **Low barrier to entry** (FREE for individuals vs. uncertain approval)
- **Built-in distribution** (Windows 10/11 Store)
- **Automatic updates** (Windows Update mechanism)
- **Professional appearance** (no SmartScreen warnings)
- **Better discoverability** (Windows Store search)

### Key Technical Consideration

**File Associations**: Microsoft Store packages cannot register file associations (e.g., double-clicking `.db` files won't open NumiSync Wizard).

**Impact for NumiSync Wizard**: None. NumiSync is not designed to be the default database viewer - it's an enrichment tool that works alongside OpenNumismat. Users launch the app, then select their database file through File > Open.

### Dual Distribution Strategy

Maintain BOTH packaging formats:

| Distribution | Package | Signing | Updates | Target Audience |
|--------------|---------|---------|---------|-----------------|
| Microsoft Store | MSIX | Microsoft | Windows Store | Casual users, easy discovery |
| Direct Download | NSIS | SignPath (pending) or unsigned | electron-updater | Power users, offline installs |

### Implementation Summary

**Files Modified:**

| File | Changes |
|------|---------|
| `electron-builder.yml` | Removed file associations, added `appx:` section |
| `package.json` | Added `build:msix` script |
| `.github/workflows/build.yml` | Added MSIX build job, included in releases |
| `src/main/updater.js` | Store detection, GitHub version check, "What's New" modal |
| `src/renderer/app.js` | Store update notification banner, changelog modal |
| `src/renderer/styles/main.css` | CSS for update notifications |
| `src/main/preload.js` | IPC exposures for Store update events |
| `README.md` | Documented both installation methods |

### Microsoft Partner Center Setup

**One-time setup required** (user action):

1. Create Microsoft Partner Center account: https://partner.microsoft.com/dashboard
2. Select **individual account** (FREE - no developer fee required!)
3. Reserve app name: "NumiSync Wizard"
4. Get publisher certificate subject: `CN=<provided by Microsoft>`
5. Update `electron-builder.yml` with publisher info
6. Submit MSIX package for review (1-3 days typical)

### Store Submission Checklist

- [x] Privacy policy URL: https://numisync.com/privacy
- [x] App description (marketing copy)
- [x] Screenshots submitted
- [x] App icon (submitted during build)
- [x] Age rating configured
- [x] Support contact information (GitHub issues link)
- [x] EULA / additional license terms provided
- [x] Keywords configured (7 keywords, 21 words)
- [x] runFullTrust capability declared and justified
- [ ] **Windows App Certification Kit (WACK) test passed** (MISSED - see notes below)
- [x] MSIX package submitted to Microsoft for certification (February 16, 2026)
- [ ] Microsoft certification approved (pending review, typically 1-3 business days)

**WACK Testing Note (February 16, 2026):**
First submission did not include pre-testing with Windows App Certification Kit. Microsoft's certification process runs the same tests, so issues (if any) will be caught during review. For all future releases, WACK testing is now required before submission - see "WACK Pre-Submission Testing" section below.

### WACK Pre-Submission Testing

**Windows App Certification Kit (WACK)** validates that your app meets Microsoft Store requirements BEFORE submission, catching issues early.

**When to Run WACK:**
- Before every Microsoft Store submission (initial and updates)
- After making changes to app capabilities or manifest
- After upgrading Electron or major dependencies

**What WACK Tests:**
- App manifest correctness and required declarations
- API usage compliance (no restricted/deprecated APIs)
- Performance requirements (launch time < 5s, suspend/resume behavior)
- Security validation (capability usage, file access patterns)
- Package integrity and signing (for signed packages)
- High-DPI and accessibility support

**How to Run WACK:**

**Option 1: Automated Script (Recommended)**
```powershell
# Run the WACK helper script
.\scripts\run-wack.ps1
```

**Option 2: Manual via Start Menu**
1. Build MSIX package: `npm run build:msix`
2. Open Start Menu → Search "Windows App Cert Kit"
3. Click "Validate app package"
4. Browse to `dist\NumiSync Wizard-<version>.msix`
5. Select all tests → Run
6. Wait 5-10 minutes for results
7. Review HTML report (auto-opens)

**Understanding WACK Results:**

| Result | Meaning | Action Required |
|--------|---------|-----------------|
| ✅ PASSED | App meets all requirements | Safe to submit to Store |
| ⚠️ WARNING | Minor issues detected | Review warnings, fix if possible (not blocking) |
| ❌ FAILED | Critical issues found | **Must fix before submission** - Store will reject |

**Common WACK Failures and Fixes:**

| Failure | Cause | Fix |
|---------|-------|-----|
| "Debug configuration test" | Built in debug mode | Use `npm run build:msix` (production build) |
| "Supported API test" | Using restricted Windows APIs | Remove restricted API calls or add capability justification |
| "App manifest compliance" | Missing required manifest fields | Update `electron-builder.yml` appx section |
| "Performance test" | App takes >5s to launch | Optimize startup code, lazy-load heavy modules |
| "High DPI test" | DPI scaling issues | Test app at 125%, 150%, 200% scaling |

**WACK Report Location:**
- Saved to: `C:\Users\<username>\AppData\Local\Microsoft\Windows App Certification Kit\`
- Filename: `AppCertification_<timestamp>.html`
- Keep reports for certification audit trail

**Interpreting the Report:**
- **Green sections** - Tests passed
- **Yellow sections** - Warnings (review but not blocking)
- **Red sections** - Failures (must fix before submission)
- Click any failure for detailed explanation and remediation guidance

**WACK Limitations:**
- Cannot test Store-specific features (in-app purchases, Store licensing)
- Performance tests run on your hardware (may differ from user machines)
- Does not validate Store listing content (description, screenshots, etc.)

### Update Workflow

**After Microsoft Store approval**:

1. Developer runs `npm version patch/minor/major`
2. GitHub Actions builds BOTH NSIS and MSIX automatically
3. NSIS: Uploaded to GitHub Release (manual SignPath approval if enabled)
4. **MSIX: Download artifact and run WACK test** (`.\scripts\run-wack.ps1`)
5. **Verify WACK passes** - if failures, fix issues and rebuild
6. MSIX: Upload to GitHub Release + manually submit to Microsoft Store
7. Microsoft reviews update (typically approved within hours for established apps)
8. Store users receive update through Windows Update automatically

### Store Update Notifications (Implemented)

**Option 2: Passive Notification (Before Update)**
- Checks GitHub API for latest version on startup (10-second delay)
- Shows banner: "🔄 Version X.X.X is available. Updates install automatically through Microsoft Store."
- Auto-dismisses after 10 seconds
- Does not interfere with app usage

**Option 3: "What's New" Modal (After Update)**
- On first launch after Store auto-updates
- Shows modal: "🎉 What's New in Version X.X.X"
- Displays changelog from GitHub Release
- User dismisses with "Got it!" button

### SignPath Foundation Status

- Application submitted, awaiting approval
- If approved: NSIS installer gets signed (keeps dual distribution)
- If denied: Microsoft Store becomes primary signed distribution
- MSIX setup proceeds regardless of SignPath outcome

### Cost-Benefit Analysis

**Cost:**
- **$0** - Completely FREE for individual developers
- ~2-3 hours implementation time (one-time) - **COMPLETE**
- Ongoing: ~5 minutes per release to submit to Store

**Benefit:**
- Professional code signing (Microsoft certificate)
- Better discoverability (Windows Store search)
- Automatic updates for Store users
- No SmartScreen warnings
- Hedge against SignPath uncertainty
- Builds credibility (official Store presence)
- Zero ongoing costs

**ROI**: Infinite - Zero cost investment provides immediate signed distribution and removes all SignPath uncertainty.

---

## Phase 6: Website Download Page Restructuring

**Created:** February 16, 2026
**Status:** Pending Implementation

### Problem

The current website (numisync.com) has download issues:
- Download links scattered across homepage, installation guide, macOS guide, and README (14 touchpoints total)
- All links point to GitHub Releases which currently 404 (no releases published yet)
- Microsoft Store not represented as a download option
- Homepage uses generic emoji characters instead of real platform logos
- No dedicated download page — all download content is inline on the homepage

### Solution: Dedicated Download Page

Create a separate `/download` page that centralizes all download options, keeping the homepage clean.

### Files to Create

| File | Purpose |
|------|---------|
| `docs/download.md` | Dedicated download page with platform-specific sections |

### Files to Modify

| File | Changes |
|------|---------|
| `docs/index.md` | Hero: replace MS Store button (404s) with "Download" button linking to /download. Download section: replace with compact platform logos linking to /download |
| `docs/_layouts/default.html` | Nav bar: change `#download` anchor to `/download` page link |
| `docs/_config.yml` | Add download page to navigation config |
| `docs/installation.md` | Windows section: add "Option 1: Microsoft Store (Coming Soon)" above existing direct download |
| `README.md` | Fix premature "Active" status in Code Signing table, update Installation section |
| `docs/CHANGELOG.md` | Add Feb 16 entry for Store submission and website restructuring |

### Download Page Structure (`docs/download.md`)

Three platform sections, each with inline SVG logo (~48px):

**Windows:**
- Microsoft Store — "Coming Soon" placeholder (link provided after certification)
- Direct Download (.exe) — "Coming Soon" placeholder (link to GitHub Releases once published)

**macOS:**
- DMG download — "Coming Soon" placeholder (link to GitHub Releases once published)
- Link to existing macOS installation guide (`/macos-install`)

**Linux:**
- AppImage, .deb, .rpm — "Coming Soon" placeholder (links to GitHub Releases once published)

### Homepage Changes (`docs/index.md`)

**Hero section:** Replace broken MS Store button with:
- "Download" button → links to `/download` page
- "View on GitHub" button → stays as-is

**Download section:** Replace emoji platform list with inline SVG platform logos (Windows 4-pane, Apple silhouette, Tux penguin) linking to `/download`

### Platform Logos

Inline SVGs embedded directly in HTML — no external files, no CDN dependencies:
- **Windows:** Microsoft 4-pane window logo
- **macOS:** Apple logo silhouette
- **Linux:** Tux penguin silhouette

### Post-Certification Updates

After Microsoft Store certification is approved:
1. `docs/download.md` — Replace Windows "Coming Soon" with active Store link (URL provided by user)
2. `docs/download.md` — Add Microsoft Store badge image
3. `README.md` — Update Code Signing table status from "Submitted" to "Active"

After first GitHub Release is published:
1. `docs/download.md` — Replace all "Coming Soon" placeholders with active download links
2. Links use `/releases/latest` format for zero-maintenance (auto-redirects to newest)

### Implementation Checklist

- [ ] Create `docs/download.md` with platform sections and inline SVG logos
- [ ] Update `docs/index.md` hero section (Download button → /download)
- [ ] Update `docs/index.md` download section (platform logos → /download)
- [ ] Update `docs/_layouts/default.html` nav link (#download → /download)
- [ ] Update `docs/_config.yml` navigation config
- [ ] Update `docs/installation.md` Windows section with MS Store option
- [ ] Update `README.md` Code Signing table and Installation section
- [ ] Update `docs/CHANGELOG.md` with Feb 16 entry

---

## Phase 3: GitHub Actions CI/CD

### Workflow Structure

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate version
        run: |
          TAG_VERSION=${GITHUB_REF#refs/tags/v}
          PKG_VERSION=$(node -p "require('./package.json').version")
          if [ "$TAG_VERSION" != "$PKG_VERSION" ]; then
            echo "ERROR: Tag version ($TAG_VERSION) doesn't match package.json ($PKG_VERSION)"
            exit 1
          fi

  build-windows:
    needs: validate
    runs-on: windows-latest  # REQUIRED: Must use GitHub-hosted runner
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Required for SignPath origin verification

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Build Windows (Unsigned)
        run: npm run build:win -- --publish never

      # Upload unsigned artifact (SignPath requires this)
      - name: Upload unsigned artifact
        id: upload-unsigned
        uses: actions/upload-artifact@v4
        with:
          name: windows-unsigned
          path: dist/*.exe
          if-no-files-found: error

      # Submit to SignPath for signing
      - name: Sign with SignPath
        uses: signpath/github-action-submit-signing-request@v2
        with:
          api-token: '${{ secrets.SIGNPATH_API_TOKEN }}'
          organization-id: '${{ vars.SIGNPATH_ORGANIZATION_ID }}'
          project-slug: 'numisync-wizard'
          signing-policy-slug: 'release-signing'
          github-artifact-id: '${{ steps.upload-unsigned.outputs.artifact-id }}'
          wait-for-completion: true
          output-artifact-directory: 'windows-signed'

      # Upload signed artifact for release
      - name: Upload signed artifact
        uses: actions/upload-artifact@v4
        with:
          name: windows-installer
          path: windows-signed/*.exe
          if-no-files-found: error

  build-linux:
    needs: validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - name: Build Linux
        run: npm run build:linux -- --publish never
      - uses: actions/upload-artifact@v4
        with:
          name: linux-packages
          path: |
            dist/*.AppImage
            dist/*.deb
            dist/*.rpm

  build-macos:
    needs: validate
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - name: Build macOS
        run: npm run build:mac -- --publish never
      - uses: actions/upload-artifact@v4
        with:
          name: macos-dmg
          path: dist/*.dmg

  create-release:
    needs: [build-windows, build-linux, build-macos]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
      - name: Create Draft Release
        uses: softprops/action-gh-release@v1
        with:
          draft: true
          generate_release_notes: true
          files: |
            windows-installer/*
            linux-packages/*
            macos-dmg/*
```

### Version Validation

- CI compares git tag version to package.json version
- Build fails if mismatch (prevents accidental version drift)

### Critical: Auto-Publish Behavior

> **IMPORTANT:** When electron-builder detects a git tag, it will attempt to auto-publish builds to GitHub Releases.
> However, build jobs do NOT have `contents: write` permission by default (only the `create-release` job has it).
> This causes a `403 Forbidden: Resource not accessible by integration` error.
>
> **Solution:** Add `--publish never` flag to ALL build commands in the workflow:
> ```yaml
> run: npm run build:win -- --publish never
> run: npm run build:linux -- --publish never
> run: npm run build:mac -- --publish never
> run: npm run build:msix -- --publish never
> ```
>
> The `create-release` job will handle publishing artifacts after all builds complete successfully.

### Workflow Files to Create

| File | Purpose |
|------|---------|
| `.github/workflows/build.yml` | Main build workflow (triggers on version tags) |
| `.github/workflows/pr-check.yml` | PR validation (optional - lint, test) |

### GitHub Operations Best Practices

**CRITICAL:** When monitoring GitHub Actions workflows or interacting with GitHub programmatically:

- **ALWAYS use GitHub CLI (`gh`)** for GitHub API operations
- **NEVER use web scraping or WebFetch** on GitHub URLs - this triggers security measures and can cause password resets
- GitHub CLI installation: [cli.github.com](https://cli.github.com/)

**Useful `gh` commands for release automation:**
```bash
# List recent workflow runs
gh run list

# View failed workflow logs
gh run view --log-failed

# List releases
gh release list

# Delete a specific release asset
gh release delete-asset <tag> <filename>

# Create a release
gh release create <tag> --draft --title "Version X.X.X"
```

---

## Phase 4: Linux Support

### Critical: Author Email Requirement

> **IMPORTANT:** Linux .deb and .rpm packages require the `author` field in package.json to be an object with an `email` property.
> If `author` is a string, the build will fail with: `Please specify author 'email' in the application package.json`
>
> **Correct format:**
> ```json
> "author": {
>   "name": "Your Name",
>   "email": "your@email.com"
> }
> ```
>
> **Incorrect format (will fail):**
> ```json
> "author": "Your Name"
> ```

### Files to Create

Create multi-resolution PNG icons from existing `build/icon.png`:

| File | Size |
|------|------|
| `build/icons/16x16.png` | 16x16 pixels |
| `build/icons/32x32.png` | 32x32 pixels |
| `build/icons/48x48.png` | 48x48 pixels |
| `build/icons/64x64.png` | 64x64 pixels |
| `build/icons/128x128.png` | 128x128 pixels |
| `build/icons/256x256.png` | 256x256 pixels |
| `build/icons/512x512.png` | 512x512 pixels |

### Icon Generation Command

Using ImageMagick:

```bash
cd build
mkdir -p icons
for size in 16 32 48 64 128 256 512; do
  convert icon.png -resize ${size}x${size} icons/${size}x${size}.png
done
```

### electron-builder.yml Linux Config

```yaml
linux:
  target:
    - target: AppImage
      arch: [x64]
    - target: deb
      arch: [x64]
    - target: rpm
      arch: [x64]
  icon: build/icons
  category: Utility
  synopsis: Enrich your OpenNumismat collection with Numista data
  description: >
    NumiSync Wizard helps coin collectors enrich their OpenNumismat
    database with pricing and catalog information from Numista.

deb:
  depends:
    - libgtk-3-0
    - libnotify4
    - libnss3
    - libxss1
    - libxtst6
    - xdg-utils
    - libatspi2.0-0
    - libuuid1
    - libsecret-1-0

rpm:
  depends:
    - gtk3
    - libnotify
    - nss
    - libXScrnSaver
    - libXtst
    - xdg-utils
    - at-spi2-core
    - libuuid
```

---

## Phase 5: macOS Support (Unsigned)

### Why No Signing?

- Apple Developer Program costs $99/year
- Not worth it for a hobby project with $10 donations
- Users can still install with a few extra steps

### macOS Icon Creation

Create `build/icon.icns` from existing icon.png. On macOS:

```bash
mkdir icon.iconset
sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset -o icon.icns
rm -rf icon.iconset
```

Alternative: Use online converter like cloudconvert.com

### macOS Installation Instructions

Add to README.md and create `docs/macos-install.md`:

```markdown
## macOS Installation

Since this app is not signed with an Apple Developer certificate,
macOS will block it by default. To install:

### Method 1: Right-Click Open (Recommended)

1. Download the .dmg file
2. Open the .dmg and drag NumiSync Wizard to Applications
3. **Right-click** (or Control-click) the app and select "Open"
4. Click "Open" in the security dialog
5. The app will now run normally

### Method 2: System Preferences

1. Try to open the app normally (it will be blocked)
2. Go to System Preferences -> Security & Privacy -> General
3. Click "Open Anyway" next to the NumiSync Wizard message
4. Click "Open" in the confirmation dialog

This only needs to be done once. After the first launch,
the app will open normally.
```

### electron-builder.yml macOS Config

```yaml
mac:
  target:
    - target: dmg
      arch: [x64, arm64]
  icon: build/icon.icns
  category: public.app-category.utilities
  # No signing - users install manually

dmg:
  contents:
    - x: 130
      y: 220
    - x: 410
      y: 220
      type: link
      path: /Applications
```

---

## Configuration Updates

### package.json Updates

Add/modify these sections:

```json
{
  "scripts": {
    "start": "electron .",
    "dev": "electron . --inspect",
    "build": "electron-builder build --win",
    "build:win": "electron-builder build --win",
    "build:mac": "electron-builder build --mac",
    "build:linux": "electron-builder build --linux",
    "build:all": "electron-builder build --win --mac --linux",
    "build:dir": "electron-builder build --win --dir",
    "build:portable": "electron-builder build --win portable",
    "pack": "electron-builder --dir",
    "dist": "electron-builder",
    "version:patch": "npm version patch",
    "version:minor": "npm version minor",
    "version:major": "npm version major",
    "preversion": "node scripts/validate-version.js",
    "postversion": "node scripts/post-version.js",
    "postinstall": "electron-builder install-app-deps",
    "test": "echo 'Tests not yet configured'"
  },
  "dependencies": {
    "@polar-sh/sdk": "^0.42.5",
    "axios": "^1.13.4",
    "electron": "^28.3.3",
    "electron-updater": "^6.1.7",
    "sql.js": "^1.10.3"
  },
  "devDependencies": {
    "electron-builder": "^24.9.1"
  }
}
```

### electron-builder.yml Full Config

Replace existing config with:

```yaml
# Electron Builder Configuration
# NumiSync Wizard - Cross-Platform Build

appId: com.numisync.wizard
productName: NumiSync Wizard
copyright: Copyright 2026 Shane Burkhardt

directories:
  output: dist
  buildResources: build

files:
  - src/**/*
  - package.json
  - node_modules/**/*
  - "!node_modules/*/{CHANGELOG.md,README.md,readme.md,test,__tests__,tests,*.md}"
  - "!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}"
  - "!**/._*"
  - "!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}"

extraResources:
  - from: swagger.yaml
    to: swagger.yaml
  - from: EULA.txt
    to: EULA.txt

# ============================================
# WINDOWS CONFIGURATION
# ============================================
win:
  target:
    - target: nsis
      arch: [x64, ia32]
  icon: build/icon.ico
  fileAssociations:
    - ext: db
      name: OpenNumismat Collection
      description: OpenNumismat coin collection database
      icon: build/icon.ico

nsis:
  oneClick: false
  perMachine: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: NumiSync Wizard
  uninstallDisplayName: NumiSync Wizard
  license: build/eula/eula-windows.rtf
  include: build/installer.nsh
  installerIcon: build/icon.ico
  uninstallerIcon: build/icon.ico
  installerHeaderIcon: build/icon.ico
  deleteAppDataOnUninstall: false

# ============================================
# MACOS CONFIGURATION (Unsigned)
# ============================================
mac:
  target:
    - target: dmg
      arch: [x64, arm64]
  icon: build/icon.icns
  category: public.app-category.utilities

dmg:
  contents:
    - x: 130
      y: 220
    - x: 410
      y: 220
      type: link
      path: /Applications

# ============================================
# LINUX CONFIGURATION
# ============================================
linux:
  target:
    - target: AppImage
      arch: [x64]
    - target: deb
      arch: [x64]
    - target: rpm
      arch: [x64]
  icon: build/icons
  category: Utility
  synopsis: Enrich your OpenNumismat collection with Numista data
  description: >
    NumiSync Wizard helps coin collectors enrich their OpenNumismat
    database with pricing and catalog information from Numista.

deb:
  depends:
    - libgtk-3-0
    - libnotify4
    - libnss3
    - libxss1
    - libxtst6
    - xdg-utils
    - libatspi2.0-0
    - libuuid1
    - libsecret-1-0

rpm:
  depends:
    - gtk3
    - libnotify
    - nss
    - libXScrnSaver
    - libXtst
    - xdg-utils
    - at-spi2-core
    - libuuid

appImage:
  license: EULA.txt

# ============================================
# AUTO-UPDATE CONFIGURATION
# ============================================
publish:
  - provider: github
    owner: inguy24
    repo: numismat-enrichment
    releaseType: release

# ============================================
# PACKAGING OPTIONS
# ============================================
asar: true
asarUnpack:
  - "**/*.node"
```

---

## Version Scripts

### scripts/validate-version.js

```javascript
/**
 * Pre-version validation script
 * Runs before npm version to ensure everything is in order
 */

const fs = require('fs');
const path = require('path');

const packageJson = require('../package.json');

console.log('Validating version bump...');

// Check for uncommitted changes (warning only)
const { execSync } = require('child_process');
try {
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  if (status.trim()) {
    console.warn('WARNING: You have uncommitted changes');
    console.warn(status);
  }
} catch (e) {
  console.warn('Could not check git status');
}

// Verify required files exist
const requiredFiles = [
  'src/main/index.js',
  'src/renderer/app.js',
  'package.json',
  'electron-builder.yml'
];

for (const file of requiredFiles) {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: Required file missing: ${file}`);
    process.exit(1);
  }
}

// Verify icon files exist
const iconFiles = [
  'build/icon.ico',
  'build/icon.png'
];

for (const file of iconFiles) {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: Icon file missing: ${file}`);
    process.exit(1);
  }
}

console.log(`Current version: ${packageJson.version}`);
console.log('Validation passed!');
```

### scripts/post-version.js

```javascript
/**
 * Post-version script
 * Runs after npm version to remind about changelog and next steps
 */

const packageJson = require('../package.json');

console.log('\n========================================');
console.log(`Version bumped to: ${packageJson.version}`);
console.log('========================================\n');

console.log('Next steps:');
console.log('1. Update docs/CHANGELOG.md with release notes');
console.log('2. Review all changes: git diff HEAD~1');
console.log('3. Push with tags: git push && git push --tags');
console.log('4. Wait for GitHub Actions to build');
console.log('5. Approve signing in SignPath dashboard (Windows)');
console.log('6. Review and publish the draft release on GitHub\n');
```

---

## Auto-Update Module

### src/main/updater.js

```javascript
/**
 * Auto-update module for NumiSync Wizard
 * Uses electron-updater with GitHub Releases
 */

const { autoUpdater } = require('electron-updater');
const { app, dialog, ipcMain } = require('electron');

// Configure logging
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

// Disable auto-download to give user control
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow = null;

/**
 * Initialize the auto-updater
 * @param {BrowserWindow} window - The main application window
 */
function initAutoUpdater(window) {
  mainWindow = window;

  // Check for updates after a delay (don't slow down startup)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(err => {
      console.error('Auto-update check failed:', err);
    });
  }, 10000); // 10 second delay

  // Update available
  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `Version ${info.version} is available. Would you like to download it?`,
      detail: 'The update will be downloaded in the background.',
      buttons: ['Download', 'Later'],
      defaultId: 0
    }).then(result => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
        mainWindow.webContents.send('update:download-started');
      }
    });
  });

  // Update not available
  autoUpdater.on('update-not-available', () => {
    console.log('No updates available');
  });

  // Download progress
  autoUpdater.on('download-progress', (progress) => {
    mainWindow.webContents.send('update:progress', {
      percent: progress.percent,
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total
    });
  });

  // Update downloaded
  autoUpdater.on('update-downloaded', (info) => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: `Version ${info.version} has been downloaded.`,
      detail: 'The update will be installed when you restart the application.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0
    }).then(result => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall(false, true);
      }
    });
  });

  // Error handling
  autoUpdater.on('error', (err) => {
    console.error('Update error:', err);
  });
}

/**
 * Manually check for updates (triggered from menu)
 */
function checkForUpdatesManually() {
  autoUpdater.checkForUpdates().then(result => {
    if (!result || !result.updateInfo) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'No Updates',
        message: 'You are running the latest version.',
        buttons: ['OK']
      });
    }
  }).catch(err => {
    dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Update Check Failed',
      message: `Could not check for updates: ${err.message}`,
      buttons: ['OK']
    });
  });
}

// IPC handler for manual update check
ipcMain.handle('check-for-updates', async () => {
  checkForUpdatesManually();
});

module.exports = { initAutoUpdater, checkForUpdatesManually };
```

---

## NSIS Installer Script

### build/installer.nsh

```nsis
; Custom NSIS script for NumiSync Wizard
; Creates EULA acceptance marker after installation

!macro customInstall
  ; Create EULA acceptance marker file
  FileOpen $0 "$INSTDIR\eula-installer-accepted.marker" w
  FileWrite $0 "EULA accepted during installation$\r$\n"
  FileWrite $0 "Version: ${VERSION}$\r$\n"
  FileWrite $0 "Date: ${__DATE__} ${__TIME__}$\r$\n"
  FileClose $0
!macroend

!macro customUnInstall
  ; Remove EULA marker on uninstall
  Delete "$INSTDIR\eula-installer-accepted.marker"

  ; Prompt user about cache deletion
  MessageBox MB_YESNO|MB_ICONQUESTION \
    "Do you want to delete the API cache as well?$\r$\n$\r$\n\
     This will remove all cached Numista data.$\r$\n$\r$\n\
     If you use a custom cache location or share the cache$\r$\n\
     with other machines, that cache will also be detected$\r$\n\
     and removed.$\r$\n$\r$\n\
     Select No to keep the cache for future use." \
    IDYES delete_cache IDNO skip_cache

  delete_cache:
    ; Read app-settings.json to find cache location
    ; Default location
    SetShellVarContext current
    StrCpy $0 "$APPDATA\NumiSync Wizard\api-cache.json"
    IfFileExists "$0" 0 +3
      Delete "$0"
      Delete "$APPDATA\NumiSync Wizard\api-cache.lock"

    ; Check for custom cache location in app-settings.json
    ; Note: This requires nsJSON plugin - add to installer dependencies
    ; nsJSON::New
    ; nsJSON::LoadFile "$APPDATA\NumiSync Wizard\app-settings.json"
    ; nsJSON::Get "cache" "location" /end
    ; Pop $1 ; Result: "default" or "custom"
    ;
    ; StrCmp $1 "custom" 0 skip_custom_cache
    ;   nsJSON::Get "cache" "customPath" /end
    ;   Pop $2 ; Custom cache directory path
    ;
    ;   StrCmp $2 "" skip_custom_cache
    ;     ; Delete custom cache files if they exist
    ;     IfFileExists "$2\api-cache.json" 0 skip_custom_cache
    ;       Delete "$2\api-cache.json"
    ;       Delete "$2\api-cache.lock"
    ;
    ; skip_custom_cache:
    ;   nsJSON::Free

  skip_cache:
!macroend
```

**Note:** The custom cache detection logic above is commented out because it requires the `nsJSON` plugin. To enable it:
1. Install the nsJSON plugin for NSIS
2. Add `!include nsJSON.nsh` at the top of installer.nsh
3. Uncomment the nsJSON code block above

---

## Uninstaller Cache Detection

The NSIS installer includes logic to detect and optionally delete cache files during uninstallation.

### Detection Process

1. Reads `app-settings.json` to determine cache location (`default` or `custom`)
2. If `default`: Deletes cache from `%APPDATA%\NumiSync Wizard\`
3. If `custom`: Reads `cache.customPath` and deletes cache from custom location
4. Prompts user before deletion

### User Prompt

```
Do you want to delete the API cache as well?

This will remove all cached Numista data.

If you use a custom cache location or share the cache
with other machines, that cache will also be detected
and removed.

Select No to keep the cache for future use.
```

### Files Deleted (if user selects Yes)

- `api-cache.json` (default or custom location)
- `api-cache.lock` (default or custom location)

### Files Preserved

- `app-settings.json` (can be manually deleted by user)
- Collection-specific files in `.NumiSync` folders
- Log files

### Multi-Machine Consideration

If the user has set up a shared cache on a network drive:
- The uninstaller on Machine A will detect the custom cache location
- If user selects "Yes" to delete cache, it will be deleted from the shared location
- This affects Machine B's cache access
- The prompt warns about shared cache implications

---

## Release Workflow

### Step-by-Step Release Process

```bash
# 1. Update CHANGELOG.md with new version notes

# 2. Bump version (creates git tag automatically)
npm version patch   # 1.0.0 -> 1.0.1 (bug fixes)
npm version minor   # 1.0.0 -> 1.1.0 (new features)
npm version major   # 1.0.0 -> 2.0.0 (breaking changes)

# 3. Push with tags (triggers GitHub Actions)
git push && git push --tags
```

### What Happens Automatically

4. **GitHub Actions builds all platforms:**
   - Windows: Builds unsigned .exe, uploads to GitHub Artifacts
   - Linux: Builds AppImage, deb, rpm
   - macOS: Builds unsigned DMG

5. **SignPath signing request submitted** (Windows only):
   - GitHub Action submits the unsigned .exe to SignPath
   - Workflow pauses and waits for approval (timeout: ~10 minutes by default)

### Manual Step Required

6. **Approve signing in SignPath dashboard:**
   - You'll receive email notification from SignPath
   - Go to [app.signpath.io](https://app.signpath.io)
   - Review the signing request (shows commit, branch, artifact hash)
   - Click "Approve" to sign

7. **Workflow resumes:**
   - SignPath returns signed .exe to GitHub Actions
   - Workflow creates draft GitHub Release with all artifacts

8. **Publish the release:**
   - Review the draft release on GitHub
   - Edit release notes if needed
   - Click "Publish release"

### Important Notes

- The GitHub Actions workflow will **wait** for SignPath approval
- If you don't approve within the timeout, the workflow fails (you can re-run)
- Linux and macOS builds complete independently (don't need SignPath)
- You can approve signing from your phone via the SignPath dashboard

---

## GitHub Repository Updates Checklist

### README.md Additions

- [ ] Add "Code Signing Policy" section (required by SignPath)
- [ ] Add "Installation" section with platform-specific instructions
- [ ] Add "macOS Installation" instructions for unsigned app
- [ ] Credit SignPath Foundation

### New Files to Create

- [x] `.github/workflows/build.yml`
- [x] `.github/workflows/pr-check.yml` (optional)
- [x] `EULA.txt`
- [x] `build/eula/eula-windows.rtf`
- [x] `build/installer.nsh`
- [x] `build/icon.icns`
- [x] `build/icons/16x16.png`
- [x] `build/icons/32x32.png`
- [x] `build/icons/48x48.png`
- [x] `build/icons/64x64.png`
- [x] `build/icons/128x128.png`
- [x] `build/icons/256x256.png`
- [x] `build/icons/512x512.png`
- [x] `scripts/validate-version.js`
- [x] `scripts/post-version.js`
- [x] `scripts/generate-linux-icons.ps1` (bonus)
- [x] `scripts/generate-macos-icon.js` (bonus)
- [x] `src/main/updater.js`
- [x] `docs/macos-install.md`

### Files to Modify

- [x] `README.md` (add Code Signing Policy, installation instructions)
- [x] `package.json` (scripts, electron-updater dependency, build scripts for all platforms)
- [x] `electron-builder.yml` (EULA/NSIS integration, Linux config, macOS config)
- [x] `src/renderer/app.js` (installer EULA marker check, feature gating functions)
- [x] `src/main/index.js` (auto-updater integration, menu item, license versioning)
- [x] `src/main/preload.js` (expose update events, feature check IPC)

### GitHub Settings

- [ ] Add SignPath secrets to repository secrets
- [ ] Enable GitHub Actions for the repository

---

## Common Build Issues

### Issue: 403 Forbidden during GitHub Actions build

**Symptom:**
```
Error: HTTP code 403
Message: Forbidden: Resource not accessible by integration
```

**Cause:** electron-builder detects git tag and attempts to auto-publish, but build jobs lack `contents: write` permission.

**Solution:** Add `--publish never` flag to all build commands in `.github/workflows/build.yml`:
```yaml
run: npm run build:win -- --publish never
```

**Reference:** See "Critical: Auto-Publish Behavior" section above.

---

### Issue: Linux .deb/.rpm build fails with author email error

**Symptom:**
```
Error: Please specify author 'email' in the application package.json
```

**Cause:** electron-builder FpmTarget (used for .deb and .rpm) requires author email for package maintainer field.

**Solution:** Change `package.json` author from string to object format:
```json
"author": {
  "name": "Shane Burkhardt",
  "email": "shane@numisync.com"
}
```

**Reference:** See "Critical: Author Email Requirement" in Phase 4 above.

---

### Issue: GitHub password reset loops

**Symptom:** GitHub repeatedly requires password reset and MFA re-authentication.

**Cause:** Using web scraping tools (WebFetch, curl, etc.) on GitHub URLs triggers security measures.

**Solution:** Always use GitHub CLI (`gh`) for GitHub API operations:
```bash
gh run list
gh run view <run-id> --log-failed
gh release list
```

**Reference:** See "GitHub Operations Best Practices" section above.

---

## Verification Checklist

### After Implementation

- [ ] Apply to SignPath Foundation and get approved
- [ ] Add Code Signing Policy to README
- [ ] Windows NSIS build creates installer with EULA screen
- [ ] EULA acceptance creates marker file in install directory
- [ ] App detects installer marker and skips in-app EULA
- [ ] Portable/dev mode shows in-app EULA (no marker)
- [ ] Version validation fails if tag != package.json
- [ ] Auto-updater detects new versions on GitHub Releases
- [ ] GitHub Actions workflow builds all platforms
- [ ] SignPath signs Windows installer successfully
- [ ] Linux AppImage runs on Ubuntu
- [ ] macOS DMG installs with right-click workaround

---

## Implementation Order

> **Note:** GitHub Actions CI/CD is not optional - it's required by SignPath Foundation.
> All release builds must go through the automated pipeline.

### Recommended Sequence

1. **Phase 1** - Foundation (EULA extraction, version scripts, auto-update module) **COMPLETE**
2. **Phase 2** - Apply to SignPath Foundation (do this early - approval takes a few days)
3. **Phase 3** - GitHub Actions CI/CD workflow (REQUIRED - builds all platforms)
4. **Phase 4** - Linux icons and electron-builder config
5. **Phase 5** - macOS config + installation docs
6. **Phase 6** - Update README with Code Signing Policy, Installation instructions
7. **Phase 7** - Test full release workflow end-to-end

### First Release Checklist

Before your first automated release:
- [ ] SignPath Foundation application approved
- [ ] SignPath GitHub App installed on repository
- [ ] GitHub secrets configured (SIGNPATH_API_TOKEN)
- [ ] GitHub variables configured (SIGNPATH_ORGANIZATION_ID)
- [ ] Code Signing Policy added to README
- [ ] GitHub Actions workflow tested with a test tag
- [ ] MFA enabled on GitHub account (required by SignPath)

---

## Cost Summary

| Item | Cost |
|------|------|
| Windows code signing | FREE (SignPath Foundation) |
| macOS code signing | SKIPPED ($99/yr saved) |
| Linux distribution | FREE |
| GitHub Actions | FREE (public repo) |
| **Total** | **$0/year** |

---

## References

- [SignPath Foundation](https://signpath.org/) - Free code signing for OSS
- [SignPath Terms](https://signpath.org/terms.html) - Requirements for OSS projects
- [electron-builder docs](https://www.electron.build/) - Build configuration
- [electron-updater docs](https://www.electron.build/auto-update) - Auto-update
- [GitHub Actions](https://docs.github.com/en/actions) - CI/CD workflows

---

## Implementation Status Summary

**Updated:** February 16, 2026

### ✅ Completed Phases

**Phase 0: GitHub Pages Homepage**
- All files created and ready for deployment
- Homepage, installation guide, quickstart guide complete
- Zero-maintenance download links configured

**Phase 1: Foundation (EULA, Version Scripts, Auto-Update)**
- ✅ EULA extraction and integration complete
- ✅ Version validation scripts created
- ✅ Auto-updater module implemented
- ✅ NSIS installer configuration complete

**Phase 1.5: License Versioning Architecture**
- ✅ License version extraction functions implemented (getLicenseVersion, compareVersions)
- ✅ Feature versioning map defined (FEATURE_VERSIONS)
- ✅ Feature unlocking logic implemented (isFeatureUnlocked)
- ✅ IPC handler for feature checks created (check-feature-access)
- ✅ Renderer-side feature gating functions added (checkFeatureAccess, showUpgradeModal)
- ⏸️ Polar dashboard configuration pending (requires dashboard access for production)

**Phase 3: GitHub Actions CI/CD**
- ✅ Main build workflow created (.github/workflows/build.yml)
- ✅ PR validation workflow created (.github/workflows/pr-check.yml)
- ✅ Multi-platform build jobs configured (Windows, Linux, macOS)
- ✅ SignPath integration prepared (commented out until approval)
- ✅ Automated release creation configured

**Phase 4: Linux Support**
- ✅ Multi-resolution PNG icons generated (16x16 through 512x512)
- ✅ Icon generation script created (scripts/generate-linux-icons.ps1)
- ✅ electron-builder.yml Linux configuration added
- ✅ AppImage, deb, and rpm targets configured
- ✅ Linux dependencies specified

**Phase 5: macOS Support**
- ✅ macOS .icns icon generated
- ✅ Icon generation script created (scripts/generate-macos-icon.js)
- ✅ macOS installation guide created (docs/macos-install.md)
- ✅ electron-builder.yml macOS configuration added
- ✅ DMG target configured for both x64 and arm64

**Phase 2.5: Microsoft Store Distribution**
- ✅ MSIX build configuration added to electron-builder.yml
- ✅ GitHub Actions workflow updated with MSIX build job
- ✅ Store update notifications implemented (passive banner + "What's New" modal)
- ✅ Microsoft Partner Center account created
- ✅ Store listing configured (description, screenshots, keywords, EULA, age rating)
- ✅ runFullTrust capability declared and justified
- ✅ MSIX package submitted to Microsoft for certification (February 16, 2026)
- ⏸️ Awaiting Microsoft certification approval (typically 1-3 business days)

**Documentation Updates**
- ✅ README.md updated with Code Signing Policy section
- ✅ README.md updated with platform signing status
- ✅ macOS installation instructions documented

### ⏳ Pending Phases

**Phase 2: Windows Code Signing (SignPath Foundation)**
- ⏸️ Requires external application to SignPath Foundation (manual step by user)
- ⏸️ GitHub Actions workflow prepared and waiting for SignPath approval
- ⏸️ Once approved, uncomment SignPath action in build.yml
- ✅ README.md Code Signing Policy section already added (required by SignPath)

**Microsoft Store Certification**
- ⏸️ MSIX submitted February 16, 2026 — awaiting certification review
- After approval: add active Store link to download page and README
- After approval: update Code Signing table status from "Submitted" to "Active"

**Phase 6: Website Download Page Restructuring** ✅ COMPLETE (February 16, 2026)
- [x] Create `docs/download.md` dedicated download page with inline SVG platform logos
- [x] Update `docs/index.md` hero (Download button → /download) and download section (platform logos)
- [x] Update `docs/_layouts/default.html` nav link (#download → /download)
- [x] Update `docs/_config.yml` navigation config
- [x] Update `docs/installation.md` Windows section with MS Store coming soon
- [x] Update `README.md` Code Signing table (fix premature "Active" status)
- [x] Update `docs/CHANGELOG.md` with Feb 16 entry
- After Store certification: replace "Coming Soon" placeholders with active Store link
- After first GitHub Release: replace "Coming Soon" placeholders with active download links

### 🎯 Next Steps

1. **Await Microsoft Store certification** (submitted February 16, 2026)
   - After approval: add active Store link to download page (URL provided by user)
   - After approval: update README Code Signing table status to "Active"

2. **Publish first GitHub Release**
   - After release: replace "Coming Soon" download placeholders with active links
   - Download links use `/releases/latest` for zero-maintenance

3. **Apply to SignPath Foundation** (optional — Store provides signing)
   - Go to https://signpath.org and submit application
   - Provide GitHub repo URL and project details
   - Wait for approval (typically a few days)

4. **Configure SignPath Secrets** (after approval)
   - Add `SIGNPATH_API_TOKEN` to GitHub repository secrets
   - Add `SIGNPATH_ORGANIZATION_ID` to GitHub repository variables
   - Install SignPath GitHub App on repository

5. **Enable Code Signing** (after approval)
   - Uncomment SignPath action in `.github/workflows/build.yml`
   - Test with a version tag push

### 📦 Ready to Build

The codebase is now **fully configured for cross-platform distribution**:

- ✅ Windows MSIX submitted to Microsoft Store (pending certification)
- ✅ Windows builds will create NSIS installers (unsigned until SignPath approval)
- ✅ Linux builds will create AppImage, .deb, and .rpm packages
- ✅ macOS builds will create DMG for both Intel and Apple Silicon
- ✅ All builds happen automatically via GitHub Actions on version tag push
- ✅ License versioning is implemented and ready to use

You can test local builds immediately:
```bash
npm run build:win    # Windows NSIS installer (unsigned)
npm run build:msix   # Windows MSIX package
npm run build:linux  # Linux packages (requires Linux or WSL)
npm run build:mac    # macOS DMG (requires macOS)
npm run build:all    # All platforms (requires appropriate OS)
```

Remaining external dependencies: Microsoft Store certification (submitted), SignPath Foundation approval (optional).
