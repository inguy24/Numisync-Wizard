# Polar.sh Environment Switching & License UX Improvements

**Created:** February 10, 2026
**Status:** ✅ All Tasks Complete

---

## Context

Three objectives:

1. **Environment Switching Guide** - Document sandbox vs production configuration for easy switching
2. **License Validation Debugging** - Investigate why Polar dashboard shows "Never Validated"
3. **License Entry UX Fix** - Add license key entry to App Settings (currently only in Help menu)

---

## Task 1: Create Environment Switching Guide ✅ COMPLETE

**Status:** Implemented February 10, 2026
**File:** [docs/guides/POLAR-ENVIRONMENT-SWITCHING.md](../guides/POLAR-ENVIRONMENT-SWITCHING.md)

### Sandbox Configuration
- Organization ID: `5e78bbbd-3677-4b3f-91d4-00c44c370d31` (verified correct)
- Product ID: `4f7d17ca-274c-41f2-b57c-cb7393776131`
- Server: `'sandbox'`
- Checkout URL: `https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_GU5TpVHT8Fj1XvA7NqBOpEtnoHPY9kSnlrloe240tb1/redirect`

### Production Configuration
- Organization ID: `52798f3d-8060-45c9-b5e7-067bfa63c350`
- Product ID V1: `50fd6539-84c3-4ca7-9a1e-9f73033077dd`
- Server: `'production'`
- Checkout URL: `https://polar.sh/checkout?productId=50fd6539-84c3-4ca7-9a1e-9f73033077dd`

### Files to Update When Switching
1. [src/main/index.js:2408](src/main/index.js#L2408) - `POLAR_CONFIG` constant
2. [src/renderer/app.js](src/renderer/app.js) - 6 checkout URLs (lines 470, 677, 799, 922, 6140, 6145)

---

## Task 2: Debug Validation Issue ✅ COMPLETE

**Status:** Implemented February 10, 2026

**Problem:** Polar sandbox shows "Validations: 0, Validated At: Never Validated"

**Root Causes Found:**

1. **Logger Reading Wrong Folder** - [logger.js:20](src/main/logger.js#L20) hardcoded folder name as `'NumiSync Wizard'` (from electron-builder productName) but actual userData folder is `'numisync-wizard'` (from package.json name in dev mode). Logger failed to load `logLevel: "debug"` from settings.json, defaulting to 'info' and filtering out all `log.debug()` statements.

2. **No Validation After Activation** - [index.js:2576-2642](src/main/index.js#L2576-L2642) `validate-license-key` handler called `activate()` to register device but never called `validate()` to increment Polar's validation counter. Periodic validation (every 7 days) was correctly implemented but never triggered within first week due to validatedAt timestamp being set during activation.

**Solutions Implemented:**

1. **Fixed Logger Path** - Changed [logger.js:21](src/main/logger.js#L21) from `'NumiSync Wizard'` to `'numisync-wizard'` to match package.json name. Added comment explaining this must match package.json not productName. Debug logging now works correctly.

2. **Added Post-Activation Validation** - Added immediate `validate()` call in [index.js:2638-2648](src/main/index.js#L2638-L2648) after successful activation with non-fatal error handling. This increments Polar's validation counter on first license entry.

**Verification:**
- Debug logs now appear in log file when logLevel is set to "debug"
- License activation now increments Polar validation counter
- Polar dashboard shows correct validation count and timestamp

---

## Task 3: Fix License Entry UX ✅ COMPLETE

**Status:** Implemented February 10, 2026

**Problem (Resolved):**
- License purchase was ONLY in Help → Purchase License menu
- No way to enter an already-purchased license key in App Settings
- User had to discover About dialog to activate a license
- Illogical UX - users expected license management in App Settings

**Solution Implemented: License Entry in App Settings**

### Implementation

**File:** [src/renderer/index.html:616-633](src/renderer/index.html#L616-L633)

**Current structure:**
```html
<div class="setting-group" id="licenseManagementGroup" style="display: none;">
  <h3>License Management</h3>
  <div id="licenseInfoDisplay"><!-- Shows active license --></div>
  <div id="licenseActions">
    <button id="revalidateLicenseBtn">Validate License</button>
    <button id="deactivateLicenseBtn">Deactivate License</button>
  </div>
</div>
```

**Add above existing buttons:**
```html
<div class="setting-group" id="licenseManagementGroup">
  <h3>License Management</h3>

  <!-- LICENSE ENTRY SECTION (NEW) -->
  <div id="licenseEntrySection" style="display: none;">
    <p>Enter your supporter license key:</p>
    <input type="password" id="settingsLicenseKeyInput" placeholder="V1-XXXX-XXXX-XXXX-XXXX"
           style="width: 300px; padding: 8px; margin-bottom: 10px;">
    <button id="settingsActivateLicenseBtn" class="btn-primary">Activate License</button>
    <div id="settingsLicenseMessage" style="margin-top: 10px;"></div>
    <p style="margin-top: 15px;">
      <a href="#" id="settingsPurchaseLicenseLink">Don't have a license? Purchase one</a>
    </p>
  </div>

  <!-- ACTIVE LICENSE DISPLAY (EXISTING) -->
  <div id="licenseInfoDisplay"><!-- Shows active license --></div>

  <!-- LICENSE ACTIONS (EXISTING) -->
  <div id="licenseActions">
    <button id="revalidateLicenseBtn">Validate License</button>
    <button id="deactivateLicenseBtn">Deactivate License</button>
  </div>
</div>
```

**File:** [src/renderer/app.js:5405-5467](src/renderer/app.js#L5405-L5467)

**Update `loadLicenseManagementDisplay()` to show entry section if no license:**
```javascript
async function loadLicenseManagementDisplay() {
  const result = await window.electronAPI.getSupporterStatus();

  const licenseEntrySection = document.getElementById('licenseEntrySection');
  const licenseInfoDisplay = document.getElementById('licenseInfoDisplay');
  const licenseActions = document.getElementById('licenseActions');

  if (!result.success || !result.isSupporter) {
    // NO LICENSE - Show entry form
    licenseEntrySection.style.display = 'block';
    licenseInfoDisplay.style.display = 'none';
    licenseActions.style.display = 'none';
  } else {
    // HAS LICENSE - Show info and actions
    licenseEntrySection.style.display = 'none';
    licenseInfoDisplay.style.display = 'block';
    licenseActions.style.display = 'flex';

    // Existing license display code...
  }
}
```

**Add event handlers after existing license management handlers:**
```javascript
// Settings license activation
document.getElementById('settingsActivateLicenseBtn')?.addEventListener('click', async () => {
  const input = document.getElementById('settingsLicenseKeyInput');
  const messageDiv = document.getElementById('settingsLicenseMessage');
  const button = document.getElementById('settingsActivateLicenseBtn');

  const licenseKey = input.value.trim();
  if (!licenseKey) {
    messageDiv.textContent = 'Please enter a license key';
    messageDiv.style.color = 'red';
    return;
  }

  button.disabled = true;
  button.textContent = 'Activating...';
  messageDiv.textContent = '';

  const result = await window.electronAPI.validateLicenseKey(licenseKey);

  if (result.success && result.valid) {
    messageDiv.textContent = 'License activated successfully!';
    messageDiv.style.color = 'green';
    input.value = '';

    // Reload license display and version badge
    setTimeout(() => {
      loadLicenseManagementDisplay();
      updateVersionBadge();
    }, 1500);
  } else {
    messageDiv.textContent = result.message || 'Invalid license key';
    messageDiv.style.color = 'red';
  }

  button.disabled = false;
  button.textContent = 'Activate License';
});

// Purchase link in settings
document.getElementById('settingsPurchaseLicenseLink')?.addEventListener('click', async (e) => {
  e.preventDefault();
  const result = await window.electronAPI.getSupporterStatus();
  const checkoutUrl = result.polarConfig?.checkoutUrl || 'https://polar.sh';
  window.electronAPI.openExternal(checkoutUrl);
});
```

**Always show License Management group (remove `display: none`):**

Currently the group is only shown if user has a license. Change to always visible:
```javascript
// In loadSettingsScreen() - remove this line:
// document.getElementById('licenseManagementGroup').style.display = isSupporter ? 'block' : 'none';

// Always show it:
document.getElementById('licenseManagementGroup').style.display = 'block';
```

### Implementation Notes (February 10, 2026)

**Actual Implementation:**
- Modified [src/renderer/index.html:616-655](src/renderer/index.html#L616-L655) - Replaced entire license management section with dual-state HTML
- Modified [src/renderer/app.js:5405-5485](src/renderer/app.js#L5405-L5485) - Replaced `loadLicenseManagementDisplay()` function
- Added [src/renderer/app.js:6022-6112](src/renderer/app.js#L6022-L6112) - Three event handlers (activate, Enter key, purchase link)
- Updated [docs/CHANGELOG.md](docs/CHANGELOG.md) - Added changelog entry

**Key Differences from Original Plan:**
- Used `licenseEntryForm` instead of `licenseEntrySection` as element ID for consistency
- Added comprehensive error handling and loading states
- Implemented 1.5-second delay before UI refresh on successful activation
- Added Enter key support for better UX
- Added help text and proper styling matching app design
- Created separate `licenseActionsHelp` paragraph with ID for show/hide control

**Verification:**
All verification items completed. The license entry form is now fully functional and accessible in App Settings.

---

## Task 4: License Versioning

**Status:** ✅ Complete
**License Prefix:** `TNSKV1-` (configured in Polar dashboard)

The license key prefix "TNSKV1-" has been set in the Polar dashboard for version 1 licenses. This prefix appears at the beginning of all issued license keys (e.g., "TNSKV1-C3209C21-7CC4-42B7-93B7-19E7EA98AD84").

---

## Implementation Summary

### Files Created (Task 1 - Complete)
| File | Purpose | Status |
|------|---------|--------|
| [docs/guides/POLAR-ENVIRONMENT-SWITCHING.md](../guides/POLAR-ENVIRONMENT-SWITCHING.md) | Sandbox vs production reference guide | ✅ Complete |

### Files Modified (Task 3 - Complete)
| File | Changes | Lines | Status |
|------|---------|-------|--------|
| [src/renderer/index.html](src/renderer/index.html) | Added license entry form to settings | 616-655 | ✅ Complete |
| [src/renderer/app.js](src/renderer/app.js) | Updated show/hide logic in `loadLicenseManagementDisplay()` | 5405-5485 | ✅ Complete |
| [src/renderer/app.js](src/renderer/app.js) | Added entry form event handlers | 6022-6112 | ✅ Complete |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Added Task 3 completion entry | 8 | ✅ Complete |

### Files Modified (Task 2 - Complete)
| File | Changes | Lines | Status |
|------|---------|-------|--------|
| [src/main/logger.js](src/main/logger.js) | Fixed folder path to match package.json name | 21 | ✅ Complete |
| [src/main/index.js](src/main/index.js) | Added post-activation validate() call | 2638-2648 | ✅ Complete |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Added Task 2 completion entry | 8 | ✅ Complete |

### Reference Files (Task 1 - Complete)
| File | Changes | Lines | Status |
|------|---------|-------|--------|
| [src/main/index.js](src/main/index.js) | Update POLAR_CONFIG when switching environments | 2408 | ✅ Documented |
| [src/renderer/app.js](src/renderer/app.js) | Update checkout URLs when switching environments | 470, 677, 799, 922, 6140, 6145 | ✅ Documented |

### Conditional Updates (Production Switch)
| File | Changes | Lines |
|------|---------|-------|
| [src/renderer/app.js](src/renderer/app.js) | Update 6 checkout URLs | 470, 677, 799, 922, 6140, 6145 |

---

## Verification

### After Task 1 (Environment Guide) ✅ COMPLETE
- [x] Guide documents sandbox and production configs
- [x] Step-by-step switching instructions included
- [x] File paths and line numbers documented
- [x] Verification checklist included
- [x] Troubleshooting section added

### After Task 2 (Validation Debug) ✅ COMPLETE
- [x] Debug logs retrieved from `numisync-wizard.log`
- [x] Root cause identified (logger path + missing validate call)
- [x] Fix applied (logger.js + index.js)
- [x] Validation tracking verified in Polar dashboard

### After Task 3 (License UX) ✅ COMPLETE
- [x] License entry form visible in App Settings when no license
- [x] Activate button validates and activates license
- [x] Purchase link opens correct Polar checkout URL
- [x] UI switches to license info display after activation
- [x] Version badge updates after activation
- [x] Enter key triggers activation
- [x] Loading states and error messages display correctly
- [x] Form clears and refreshes after successful activation

### Before Production Switch
- [ ] Test environment switching in both directions
- [ ] Purchase production test license
- [ ] Verify validation tracking works in production
- [ ] Update all 6 checkout URLs to production

---

## Critical Files Reference

**Configuration:**
- [src/main/index.js:2407-2412](src/main/index.js#L2407-L2412) - POLAR_CONFIG
- [src/main/logger.js:16-38](src/main/logger.js#L16-L38) - Log level config

**License Handlers:**
- [src/main/index.js:2576-2684](src/main/index.js#L2576-L2684) - activate
- [src/main/index.js:2834-2905](src/main/index.js#L2834-L2905) - validate
- [src/main/index.js:2911-2975](src/main/index.js#L2911-L2975) - deactivate

**UI:**
- [src/renderer/index.html:616-633](src/renderer/index.html#L616-L633) - License settings
- [src/renderer/app.js:5405-5467](src/renderer/app.js#L5405-L5467) - License display
- [src/renderer/app.js:5955-5998](src/renderer/app.js#L5955-L5998) - Deactivation

---

## Implementation Status

### ✅ All Tasks Completed

- **Task 1: Environment Switching Guide** (February 10, 2026)
  - Created comprehensive switching guide at `docs/guides/POLAR-ENVIRONMENT-SWITCHING.md`
  - Documented sandbox and production configurations
  - Included step-by-step switching instructions
  - Added verification checklist and troubleshooting section

- **Task 2: Debug Validation Issue** (February 10, 2026)
  - Fixed logger reading from wrong folder path
  - Added post-activation validation call
  - Debug logging now works correctly
  - Polar validation tracking now works on first activation
  - CHANGELOG updated

- **Task 3: License Entry UX** (February 10, 2026)
  - License entry form now visible in App Settings
  - Dual-state component (entry form vs license info)
  - All event handlers implemented
  - CHANGELOG updated

- **Task 4: License Versioning** (Already Complete)
  - License prefix `TNSKV1-` configured in Polar dashboard
  - Versioning system in place for future product versions

### 🚀 Ready for Production

All implementation tasks complete. When ready to switch to production:
1. Follow instructions in [POLAR-ENVIRONMENT-SWITCHING.md](../guides/POLAR-ENVIRONMENT-SWITCHING.md)
2. Update POLAR_CONFIG in [src/main/index.js](src/main/index.js)
3. Update 6 checkout URLs in [src/renderer/app.js](src/renderer/app.js)
4. Test validation tracking in production environment
