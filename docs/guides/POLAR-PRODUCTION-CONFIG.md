# Polar Production Configuration

**Purpose:** This file stores the production Polar.sh configuration for NumiSync Wizard.
When switching from sandbox to production, restore these values.

---

## License Versioning Strategy

**Added:** February 9, 2026

NumiSync Wizard uses **Polar license prefixes** to manage version-based feature entitlements.

### How It Works

Each major version has its own product in Polar with a unique prefix:

| Version | Product Name | Prefix | Status |
|---------|--------------|--------|--------|
| v1.x.x  | NumiSync Supporter License v1 | `V1` | Current |
| v2.x.x  | NumiSync Supporter License v2 | `V2` | Future |
| v3.x.x  | NumiSync Supporter License v3 | `V3` | Future |

**License Key Examples:**
- V1: `V1-ABCD-EFGH-IJKL-MNOP`
- V2: `V2-QRST-UVWX-YZAB-CDEF`

### Feature Gating Logic

The app extracts the version from the license key prefix and checks feature entitlements:

```javascript
// V1 license holder upgrades to v2 app
License: V1-XXXX-XXXX-XXXX
App Version: 2.0.0

Fast Pricing (v1 feature): ✅ Works
Numista Sync (v2 feature): 🔒 Requires v2 license
```

See [INSTALLER-DISTRIBUTION-PLAN.md Phase 1.5](./INSTALLER-DISTRIBUTION-PLAN.md#phase-15-license-versioning-architecture) for full implementation details.

### Polar Dashboard Setup

#### V1 Product (Current)
- **Name:** NumiSync Supporter License v1
- **Prefix:** `V1`
- **Product ID:** `50fd6539-84c3-4ca7-9a1e-9f73033077dd`
- **Status:** Active

#### V2 Product (Create Before v2.0.0 Launch)
- **Name:** NumiSync Supporter License v2
- **Prefix:** `V2`
- **Product ID:** `[TO BE CREATED]`
- **Activation Limit:** 3 devices
- **Checkout URL:** `https://polar.sh/checkout?productId=[V2_PRODUCT_ID]`

### Migration Workflow

When creating v2 product in Polar:

1. **Create New Product:**
   - Go to https://polar.sh/dashboard/[org-slug]/products
   - Click "New Product"
   - Name: "NumiSync Supporter License v2"
   - Type: License Key
   - Activation Limit: 3
   - **License Prefix:** `V2` (CRITICAL - this enables version detection)

2. **Update App Configuration:**
   ```javascript
   // src/main/index.js - Add v2 product
   const POLAR_PRODUCTS = {
     v1: {
       productId: '50fd6539-84c3-4ca7-9a1e-9f73033077dd',
       checkoutUrl: 'https://polar.sh/checkout?productId=50fd6539-84c3-4ca7-9a1e-9f73033077dd'
     },
     v2: {
       productId: '[NEW_V2_PRODUCT_ID]',
       checkoutUrl: 'https://polar.sh/checkout?productId=[NEW_V2_PRODUCT_ID]'
     }
   };

   // Update version map
   const VERSION_MAP = {
     'V1': '1.0.0',
     'V2': '2.0.0'
   };
   ```

3. **Update Checkout Links:**
   - New users purchasing v2: Point to v2 checkout URL
   - Upgrade modal for v1 users: Point to v2 checkout URL with message

4. **Document Product ID:**
   - Add v2 product ID to this file under "V2 Product"
   - Update `FEATURE_VERSIONS` in `src/main/index.js`

---

## Production Configuration

### POLAR_CONFIG (src/main/index.js)

```javascript
const POLAR_CONFIG = {
  organizationId: '52798f3d-8060-45c9-b5e7-067bfa63c350',
  productId: '50fd6539-84c3-4ca7-9a1e-9f73033077dd',
  checkoutUrl: 'https://polar.sh/checkout?productId=50fd6539-84c3-4ca7-9a1e-9f73033077dd',
  server: 'production'  // or omit entirely for production (default)
};
```

### Polar SDK Instantiation

For production, use the default server (no `server` parameter needed):

```javascript
const { Polar } = require('@polar-sh/sdk');
const polar = new Polar();  // defaults to production
```

### Checkout URLs (src/renderer/app.js)

Production checkout URL appears in these locations (lines 344, 488, 606):
```
https://polar.sh/checkout?productId=50fd6539-84c3-4ca7-9a1e-9f73033077dd
```

### Dashboard URLs

Production Polar dashboard links (lines 3419, 3431 in app.js):
- `https://polar.sh` - Main site for license management references

---

## Switching to Production

1. Update `POLAR_CONFIG` in `src/main/index.js`:
   - Set `organizationId` to `'52798f3d-8060-45c9-b5e7-067bfa63c350'`
   - Set `productId` to `'50fd6539-84c3-4ca7-9a1e-9f73033077dd'`
   - Set `checkoutUrl` to `'https://polar.sh/checkout?productId=50fd6539-84c3-4ca7-9a1e-9f73033077dd'`
   - Set `server` to `'production'` or remove the property

2. Update Polar SDK calls to use production (or remove server param):
   ```javascript
   const polar = new Polar({ server: 'production' });
   // or simply:
   const polar = new Polar();
   ```

3. Update fallback checkout URLs in `app.js`:
   - Search for `sandbox.polar.sh/checkout` and replace with `polar.sh/checkout`
   - Search for `sandbox.polar.sh` (dashboard links) and replace with `polar.sh`

---

## Sandbox Setup Instructions

To test with the Polar sandbox environment:

### 1. Create Sandbox Account

1. Go to https://sandbox.polar.sh/start
2. Create a new user account (separate from production)
3. Create a sandbox organization

### 2. Create Test Product

1. Go to https://sandbox.polar.sh/dashboard/your-org-slug/products
2. Create a product matching your production product:
   - Name: "NumiSync Supporter License"
   - Type: License Key
   - Set activation limit (e.g., 3 devices)

### 3. Update Config with Sandbox IDs

Update `POLAR_CONFIG` in `src/main/index.js`:
```javascript
const POLAR_CONFIG = {
  organizationId: 'YOUR_SANDBOX_ORG_ID',     // From sandbox org settings
  productId: 'YOUR_SANDBOX_PRODUCT_ID',       // From sandbox product page
  checkoutUrl: 'https://sandbox.polar.sh/checkout?productId=YOUR_SANDBOX_PRODUCT_ID',
  server: 'sandbox'
};
```

### 4. Test Purchases

Use Stripe test card numbers:
- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- Any future expiry date, any 3-digit CVC

### 5. Get Test License Key

After sandbox purchase, retrieve your test license key from:
- https://sandbox.polar.sh/purchases (customer view)
- Or from sandbox dashboard (merchant view)

---

## API Differences

| Aspect | Production | Sandbox |
|--------|------------|---------|
| API Base | api.polar.sh | sandbox-api.polar.sh |
| Dashboard | polar.sh | sandbox.polar.sh |
| Checkout | polar.sh/checkout | sandbox.polar.sh/checkout |
| Access Tokens | From production org | From sandbox org |
| Payments | Real charges | Stripe test cards |
| License Keys | Real licenses | Test licenses |

---

## Implementation Notes

### API Response Structure

The Polar SDK `activate()` endpoint returns an **activation object**, not a license key directly:

```javascript
{
  id: "activation-uuid",           // Activation ID (store this!)
  licenseKeyId: "license-uuid",
  label: "NumiSync-win32-abc123",
  licenseKey: {
    id: "license-uuid",
    status: "granted",             // Status is HERE, not at top level
    customerId: "customer-uuid",
    // ... other fields
  }
}
```

**Important:** Check `result.licenseKey.status`, NOT `result.status`.

### Device Fingerprinting

Device labels must be **consistent** across activations to prevent duplicate slot usage.

The `getDeviceFingerprint()` function generates a stable identifier:
```javascript
// Uses: hostname + platform + arch + MAC address
// Returns: "NumiSync-win32-a1b2c3d4e5f6"
```

This ensures:
- Same machine = same device label
- Re-activating updates existing activation instead of creating new slot
- User can't accidentally use all slots by retrying

---

## Current State

**Active Mode:** SANDBOX

Current sandbox configuration:
- Organization ID: `5e78bbbd-3677-4b3f-91d4-00c44c370d31`
- Product ID: `4f7d17ca-274c-41f2-b57c-cb7393776131`
- Checkout: Polar checkout link redirect

Files modified for sandbox:
- `src/main/index.js` - POLAR_CONFIG with sandbox server, device fingerprinting
- `src/renderer/app.js` - Checkout and dashboard URLs

---

## Setting Up Sandbox for License Versioning Testing

To test license versioning in sandbox:

1. **Create V1 Sandbox Product:**
   - Name: "NumiSync v1 Test"
   - License Prefix: `V1`
   - Note the product ID

2. **Create V2 Sandbox Product:**
   - Name: "NumiSync v2 Test"
   - License Prefix: `V2`
   - Note the product ID

3. **Make Test Purchases:**
   - Purchase v1 product → Get `V1-XXXX-XXXX-XXXX` key
   - Purchase v2 product → Get `V2-XXXX-XXXX-XXXX` key

4. **Test Feature Gating:**
   - Activate v1 key → Verify only v1 features work
   - Activate v2 key → Verify all features work
   - Try accessing v2 features with v1 key → Verify upgrade prompt

---

**Last Updated:** February 9, 2026
