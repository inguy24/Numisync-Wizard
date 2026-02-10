---
layout: default
title: NumiSync Wizard - Enrich your OpenNumismat collection
---

<div style="text-align: center; margin: 2em 0 1em 0;">
  <img src="/assets/images/logo.svg" alt="NumiSync Wizard for OpenNumismat" style="max-width: 500px; width: 100%;" />
</div>

<div style="text-align: center; margin: 2em 0;">
  <a href="https://github.com/inguy24/numismat-enrichment/releases/latest" style="display: inline-block; padding: 12px 24px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0.5em;">Download for Windows</a>
  <a href="https://github.com/inguy24/numismat-enrichment" style="display: inline-block; padding: 12px 24px; background: #24292e; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0.5em;">View on GitHub</a>
</div>

<div style="text-align: center; margin: 1em 0 2em 0;">
  <a href="https://github.com/inguy24/numismat-enrichment"><img src="https://img.shields.io/github/stars/inguy24/numismat-enrichment?style=social" alt="GitHub stars"></a>
</div>

---

## About

NumiSync Wizard connects your OpenNumismat coin collection database to the comprehensive Numista catalog, automatically matching your coins and enriching them with:

- Detailed catalog information (mintage, composition, ruler, designer)
- Current market pricing across 4 grade levels (UNC, XF, VF, F)
- Multiple issue variants per type (year, mint mark, type)
- High-resolution images (obverse, reverse, and edge)
- Smart matching with fuzzy search and manual override

Perfect for numismatists who want to spend less time on data entry and more time enjoying their collection.

---

## Features

### Intelligent Coin Matching
Fuzzy search with denomination normalization, issuer resolution, and non-Gregorian year support (Meiji, Hijri, Thai Buddhist calendars).

### Granular Data Control
Choose exactly what data to sync: Basic catalog info, Issue variants, or Pricing data. Update only the fields you want.

### Visual Field Comparison
Side-by-side comparison of existing vs. new data. Cherry-pick individual fields to update or accept all changes at once.

### Premium Fast Pricing Mode
Batch-update pricing for all matched coins in seconds. No more clicking through coins one by one. *(Requires Supporter License)*

### Auto-Propagate Type Data
Automatically apply type-level data (mintage, composition, ruler, designer) to all matching coins in your collection. *(Requires Supporter License)*

### Multi-Machine Support
Configurable cache location with file locking prevents conflicts when multiple users access the same database.

### Smart Caching
Persistent API cache reduces redundant requests and respects Numista rate limits. Works offline with cached data.

### Advanced Field Mapping
Customize how 45+ data sources from Numista map to OpenNumismat fields. Full control over your data.

---

## Screenshots

*Coming soon! Screenshots will showcase the main window, field comparison UI, issue picker, fast pricing mode, and settings panel.*

---

## Download

### NumiSync Wizard v1.0.0

<div style="text-align: center; margin: 2em 0;">
  <a href="https://github.com/inguy24/numismat-enrichment/releases/latest" style="display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 1.1em;">Download for Windows (x64/x86)</a>
</div>

<div style="text-align: center; margin: 1em 0;">
  <a href="https://github.com/inguy24/numismat-enrichment/releases">View All Releases on GitHub</a>
</div>

**Coming Soon:**
- macOS (Intel/Apple Silicon)
- Linux (AppImage, deb, rpm)

---

## Quick Start

Get up and running in 5 easy steps:

1. **Install NumiSync Wizard** and launch the application
2. **Open your OpenNumismat collection** (.db file)
3. **Settings → Add your Numista API key** (free from [numista.com](https://www.numista.com/))
4. **Select coins → Click "Search & Enrich"** to find matches
5. **Review matches → Accept changes → Done!**

For detailed instructions, see the [Installation Guide](/installation) and [Quick Start Guide](/quickstart).

---

## Support Development

### Hi Fellow Collector!

I built NumiSync Wizard to save myself countless hours cataloging my coin collection in OpenNumismat. I know you hear pleas like this all the time, but I hope you'll consider supporting this extremely niche software. For the price of a couple cups of coffee (outrageous these days, I know!), you can become a supporter.

### NumiSync Wizard is FREE for core features:

- Intelligent coin matching and search
- Visual field comparison and selective updates
- Issue variant selection
- Image download and comparison
- Smart caching and multi-machine support
- Advanced field mapping

### A Supporter License ($10) gets you:

- **Fast Pricing Mode** - Batch update pricing across your collection
- **Auto-Propagate** - Apply type data to matching coins automatically
- **No more nag prompts!**
- **Discounts on future premium features**
- The warm fuzzy feeling of supporting independent software

<div style="text-align: center; margin: 2em 0;">
  <a href="https://github.com/inguy24/numismat-enrichment#license" style="display: inline-block; padding: 12px 24px; background: #6f42c1; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Become a Supporter - $10</a>
</div>

Your support helps cover development costs and keeps NumiSync improving for our community of collectors.

**Buy once, use forever** • Unlocks current premium features permanently
**5-device activation limit** • No subscriptions • Open Source (MIT License)

<div style="text-align: center; margin: 1em 0;">
  <a href="https://github.com/inguy24/numismat-enrichment">View source on GitHub</a>
</div>

**Sincerely,**
Shane (your fellow collector)

---

## Documentation

- **User Manual** - Built into the app (press F1)
- [Installation Guide](/installation)
- [Quick Start Guide](/quickstart)
- [Full Documentation](https://github.com/inguy24/numismat-enrichment/tree/main/docs)
- [Changelog](https://github.com/inguy24/numismat-enrichment/blob/main/docs/CHANGELOG.md)
- [Build Guide](https://github.com/inguy24/numismat-enrichment/blob/main/docs/guides/BUILD-GUIDE.md) (for developers)

---

## Required Software

### OpenNumismat
**[Download OpenNumismat](https://opennumismat.github.io/)** - Free, open-source coin collection management software for Windows, macOS, and Linux. OpenNumismat provides a powerful database for cataloging your coins, and NumiSync Wizard enhances it by automatically populating catalog data and pricing.

### Numista
**[Visit Numista.com](https://www.numista.com/)** - The world's largest online numismatic catalog with detailed information on coins from around the world. NumiSync Wizard uses the Numista API to fetch catalog data, pricing, and images. You'll need a free Numista account to get an API key.
