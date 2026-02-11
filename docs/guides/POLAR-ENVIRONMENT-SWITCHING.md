# Polar.sh Environment Switching Guide

**Last Updated:** February 10, 2026
**Purpose:** Reference guide for switching between Polar sandbox and production environments

---

## Overview

This guide documents the exact configuration changes needed to switch NumiSync Wizard between Polar.sh sandbox and production environments.

**⚠️ IMPORTANT:** Always test in sandbox first before switching to production. License activation cannot be easily reversed.

---

## Environment Configurations

### Sandbox Environment

**Organization ID:** `5e78bbbd-3677-4b3f-91d4-00c44c370d31` (verified correct)
**Product ID:** `4f7d17ca-274c-41f2-b57c-cb7393776131`
**Server:** `'sandbox'`
**License Prefix:** `TNSKV1-`
**Checkout URL:** `https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_GU5TpVHT8Fj1XvA7NqBOpEtnoHPY9kSnlrloe240tb1/redirect`

### Production Environment

**Organization ID:** `52798f3d-8060-45c9-b5e7-067bfa63c350`
**Product ID:** `50fd6539-84c3-4ca7-9a1e-9f73033077dd`
**License Prefix:** `TNSKV1-`
**Server:** `'production'`
**Checkout URL:** `https://buy.polar.sh/polar_cl_4hKjIXXM8bsjk9MivMFIvtXbg7zWswAzEAVJK2TVZZ0`

---

## Files to Update When Switching

### 1. Main Process Configuration

**File:** [src/main/index.js](../src/main/index.js)
**Location:** Line ~2408
**Element:** `POLAR_CONFIG` constant

#### Sandbox Configuration:
```javascript
const POLAR_CONFIG = {
  organizationId: '5e78bbbd-3677-4b3f-91d4-00c44c370d31',
  productId: '4f7d17ca-274c-41f2-b57c-cb7393776131',
  server: 'sandbox'
};
```

#### Production Configuration:
```javascript
const POLAR_CONFIG = {
  organizationId: '52798f3d-8060-45c9-b5e7-067bfa63c350',
  productId: '50fd6539-84c3-4ca7-9a1e-9f73033077dd',
  server: 'production'
};
```

### 2. Renderer Process Checkout URLs

**File:** [src/renderer/app.js](../src/renderer/app.js)
**Locations:** Lines 470, 677, 799, 922, 6140, 6145 (6 total occurrences)

#### Sandbox URL:
```javascript
const checkoutUrl = 'https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_GU5TpVHT8Fj1XvA7NqBOpEtnoHPY9kSnlrloe240tb1/redirect';
```

#### Production URL:
```javascript
const checkoutUrl = 'https://buy.polar.sh/polar_cl_4hKjIXXM8bsjk9MivMFIvtXbg7zWswAzEAVJK2TVZZ0';
```

---

## Step-by-Step Switching Instructions

### Switching to Production

1. **Backup Current Configuration**
   ```bash
   git status
   git diff src/main/index.js src/renderer/app.js
   ```

2. **Update Main Process Config**
   - Open [src/main/index.js](../src/main/index.js)
   - Navigate to line ~2408 (`POLAR_CONFIG`)
   - Replace sandbox values with production values:
     - `organizationId`: `52798f3d-8060-45c9-b5e7-067bfa63c350`
     - `productId`: `50fd6539-84c3-4ca7-9a1e-9f73033077dd`
     - `server`: `'production'`

3. **Update Renderer Checkout URLs**
   - Open [src/renderer/app.js](../src/renderer/app.js)
   - Find all 7 occurrences of sandbox checkout URL
   - Replace with production URL:
     ```
     https://buy.polar.sh/polar_cl_4hKjIXXM8bsjk9MivMFIvtXbg7zWswAzEAVJK2TVZZ0
     ```
   - **Lines to update:** 470, 677, 799, 922, 6105, 6249, 6254

4. **Verify Changes**
   ```bash
   grep -n "buy.polar.sh" src/renderer/app.js
   grep -n "POLAR_CONFIG" src/main/index.js
   ```
   - Should see 7 production URLs in app.js
   - Should see production org/product IDs in index.js

5. **Test Locally**
   - Run `npm start`
   - Check Help → About dialog shows correct environment
   - Verify purchase link opens correct Polar checkout page
   - **DO NOT activate license yet**

6. **Build and Deploy**
   ```bash
   npm run build
   ```

7. **Test License Flow**
   - Purchase a test license from production Polar
   - Activate license in built app
   - Verify license shows in App Settings
   - Check Polar dashboard shows activation and validation

### Switching to Sandbox

1. **Update Main Process Config**
   - Open [src/main/index.js](../src/main/index.js)
   - Navigate to line ~2408 (`POLAR_CONFIG`)
   - Replace production values with sandbox values:
     - `organizationId`: `5e78bbbd-3677-4b3f-91d4-00c44c370d31`
     - `productId`: `4f7d17ca-274c-41f2-b57c-cb7393776131`
     - `server`: `'sandbox'`

2. **Update Renderer Checkout URLs**
   - Open [src/renderer/app.js](../src/renderer/app.js)
   - Replace all 7 production URLs with sandbox URL:
     ```
     https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_GU5TpVHT8Fj1XvA7NqBOpEtnoHPY9kSnlrloe240tb1/redirect
     ```

3. **Clear User Data (Optional)**
   - Windows: `%APPDATA%\numisync-wizard\`
   - Delete `settings.json` to clear existing license
   - This forces fresh activation for testing

4. **Test Sandbox License**
   - Run app and activate sandbox license
   - Verify in Polar sandbox dashboard

---

## Verification Checklist

### Before Production Switch
- [ ] All sandbox features tested and working
- [ ] License activation works correctly in sandbox
- [ ] License validation increments counter in Polar dashboard
- [ ] License deactivation works correctly
- [ ] All checkout links tested

### After Production Switch
- [ ] POLAR_CONFIG updated to production values
- [ ] All 7 checkout URLs updated to production
- [ ] App builds without errors
- [ ] Purchase link opens correct production checkout page
- [ ] Test license purchased and activated successfully
- [ ] Polar production dashboard shows activation
- [ ] Polar production dashboard shows validation count
- [ ] Version badge shows "Supporter Edition" after activation

---

## Troubleshooting

### License Not Activating
- Check `server` value matches environment (sandbox vs production)
- Verify organization ID and product ID are correct
- Check logs at `%APPDATA%\numisync-wizard\numisync-wizard.log`

### Validation Not Incrementing
- Ensure post-activation validation call exists in [index.js:2638-2648](../src/main/index.js#L2638-L2648)
- Check debug logs for validation errors
- Verify `logLevel: "debug"` in settings.json

### Checkout Link Not Working
- Verify all 7 URLs in app.js match environment
- Test URL in browser before deploying
- Verify checkout link is correct in Polar dashboard

---

## Related Documentation

- [POLAR-ENVIRONMENT-AND-LICENSE-UX-COMPLETE.md](../archive/POLAR-ENVIRONMENT-AND-LICENSE-UX-COMPLETE.md) - Implementation plan (archived)
- [CLAUDE.md](../../CLAUDE.md) - Lesson 24: Activate vs Validate operations
- [Polar.sh Documentation](https://docs.polar.sh/) - Official Polar SDK docs

---

## Notes

- **License Prefix:** Both environments use `TNSKV1-` prefix (configured in Polar dashboard)
- **Device Limit:** Production licenses have device limit - test deactivation flow
- **Validation Frequency:** App validates every 7 days automatically
- **Offline Grace Period:** 30-day offline grace period before requiring revalidation
