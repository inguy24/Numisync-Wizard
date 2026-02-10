---
layout: default
title: Quick Start Guide
---

# Quick Start Guide

Get up and running with NumiSync Wizard in 5 minutes. This guide walks you through the basic workflow of enriching your coin collection.

---

## Prerequisites

Before starting, make sure you have:

- ✅ **NumiSync Wizard installed** ([Installation Guide](/installation))
- ✅ **OpenNumismat collection** (.db file with some coins)
- ✅ **Numista API key** (free from [numista.com](https://www.numista.com/))

---

## Step 1: Launch and Configure

### Open NumiSync Wizard

1. Launch NumiSync Wizard from your Start Menu or Desktop
2. First launch will create a cache directory automatically

### Add Your API Key

1. Click **Settings** (gear icon) or press `Ctrl+,`
2. Go to **API Settings** tab
3. Paste your Numista API key
4. Click **Save**

**Don't have an API key?** Get one free at [numista.com](https://www.numista.com/) → Profile → API Access

---

## Step 2: Open Your Collection

1. Click **File → Open Collection** (or press `Ctrl+O`)
2. Navigate to your OpenNumismat `.db` file
3. Click **Open**
4. Your coins will load in the main window

**Tip:** NumiSync remembers recent collections. Use **File → Recent Collections** for quick access.

---

## Step 3: Search for Matches

### Select Coins to Enrich

You can enrich coins one at a time or in batches:

- **Single coin:** Click on a coin row to select it
- **Multiple coins:** Hold `Ctrl` and click multiple rows
- **Range:** Click first coin, hold `Shift`, click last coin
- **All coins:** Press `Ctrl+A`

### Start Search

1. Click the **Search & Enrich** button (or press `F2`)
2. NumiSync will search Numista for each selected coin
3. Progress indicator shows current status

**What happens:**
- Searches using denomination, country, year, mint mark
- Handles variations (e.g., "Cent" vs "Cents", "USA" vs "United States")
- Supports non-Gregorian calendars (Meiji years, Hijri years, etc.)
- Uses cached results when available (faster!)

---

## Step 4: Review Matches

### Understanding Match Results

After searching, each coin shows one of three statuses:

- **✓ Match Found** - Numista catalog entry found
- **? Multiple Matches** - Several possibilities (manual selection needed)
- **✗ No Match** - No catalog entry found (try manual search)

### View Field Comparison

1. Click on a coin with a match
2. The **Field Comparison Panel** shows:
   - **Left column:** Your existing data
   - **Right column:** Numista catalog data
   - **Differences highlighted** in color
3. Review what will change

---

## Step 5: Accept or Refine Matches

### Accept All Changes

If the match looks good:
1. Click **Accept Match** button (or press `Enter`)
2. All Numista data updates your coin immediately
3. Coin marked as enriched

### Cherry-Pick Fields

To update only specific fields:
1. In the Field Comparison Panel, **uncheck** fields you don't want to update
2. Click **Accept Match**
3. Only checked fields will be updated

### Choose a Different Issue

Many coins have multiple issues (years, mint marks, types):

1. Click **Choose Issue** button
2. **Issue Picker Dialog** shows all variants
3. Select the correct issue for your coin
4. Field comparison updates with that issue's data
5. Click **Accept Match**

### Manual Search

If no match found automatically:
1. Click **Manual Search** button (or press `Ctrl+F`)
2. Modify search parameters (denomination, year, country)
3. Click **Search**
4. Browse results and select the correct entry
5. Click **Accept Match**

---

## Step 6: Download Images (Optional)

### Automatic Image Download

If **Data Settings → Images** is enabled:
- Images download automatically when you accept a match
- Obverse, reverse, and edge images (if available)
- Stored in OpenNumismat's image directory

### Manual Image Download

1. Select an enriched coin
2. Click **Download Images** button
3. Choose which images to download (obverse, reverse, edge)
4. Click **Download**

**Tip:** Use **Image Comparison** to preview before accepting

---

## Common Workflows

### Workflow 1: Enrich a New Collection

1. Open collection with many unenriched coins
2. Select all coins (`Ctrl+A`)
3. Click **Search & Enrich** (or press `F2`)
4. Review matches one by one
5. Accept matches as you go
6. Use manual search for coins with no match

**Time savings:** 2-3 minutes per coin → 10-15 seconds per coin

### Workflow 2: Update Pricing Only

1. Go to **Settings → Data Settings**
2. Uncheck **Basic** and **Issue** (leave **Pricing** checked)
3. Select coins to update
4. Click **Search & Enrich**
5. Accept matches (only pricing updates)

**Pro Tip:** Get a [Supporter License](#) to use **Fast Pricing Mode** - updates all matched coins instantly!

### Workflow 3: Fix Incorrect Matches

1. Select a coin with incorrect data
2. Click **Manual Search**
3. Find the correct catalog entry
4. Accept the match
5. Old data is overwritten

**Tip:** Use **Field Comparison** to verify before accepting

---

## Tips for Best Results

### Search Tips

✅ **DO:**
- Start with coins that have complete information (year, country, denomination)
- Use standard denomination abbreviations ("1 Cent" not "1c")
- Let NumiSync normalize denominations automatically

❌ **DON'T:**
- Search coins with missing critical fields (country, denomination)
- Manually edit search queries unless necessary
- Assume first match is correct - always verify!

### Data Quality

✅ **DO:**
- Review Field Comparison before accepting
- Use Issue Picker when multiple variants exist
- Verify images match your physical coin

❌ **DON'T:**
- Blindly accept all matches
- Overwrite good data with incomplete catalog data
- Forget to back up your collection first!

### Performance

✅ **DO:**
- Enable caching (Settings → General → Cache)
- Work in batches of 10-20 coins
- Use Fast Pricing Mode for large updates (Supporter License)

❌ **DON'T:**
- Search 1000+ coins at once (respects rate limits, but slow)
- Disable caching (wastes API calls)
- Search the same coin repeatedly (use cache)

---

## Keyboard Shortcuts

- `Ctrl+O` - Open collection
- `F2` - Search & Enrich selected coins
- `Ctrl+F` - Manual search
- `Enter` - Accept match
- `Escape` - Cancel/Close dialog
- `Ctrl+A` - Select all coins
- `Ctrl+,` - Open settings
- `F1` - Open help

---

## What's Next?

### Explore Premium Features

Get a **[Supporter License ($10)](#)** to unlock:
- **Fast Pricing Mode** - Batch update pricing for all matched coins
- **Auto-Propagate** - Apply type data to matching coins automatically
- **No nag prompts!**

### Advanced Features

- **Field Mapping** - Customize how Numista data maps to your fields
- **Batch Operations** - Process hundreds of coins efficiently
- **Multi-Machine Support** - Share cache across devices
- **Custom Cache Location** - Store cache on network drive

### Learn More

- **[User Manual](https://github.com/inguy24/numismat-enrichment/blob/main/docs/reference/USER-MANUAL.md)** - Complete feature documentation
- **[FAQ](#)** - Common questions answered
- **[Video Tutorials](#)** - Coming soon!

---

## Need Help?

### Common Issues

**Q: Why didn't my coin match?**
- A: Country or denomination might need normalization. Try manual search with variations.

**Q: Why are some fields not updating?**
- A: Check **Data Settings** - some data categories might be disabled.

**Q: Can I undo an accepted match?**
- A: Not automatically. Restore from a backup or manually revert the data.

**Q: How do I update pricing without changing other fields?**
- A: Settings → Data Settings → Uncheck Basic and Issue, leave Pricing checked.

**Q: What happens if I search a coin twice?**
- A: NumiSync uses cached results (instant) unless you click "Refresh from API".

### Get Support

- **Issues:** [Report on GitHub](https://github.com/inguy24/numismat-enrichment/issues)
- **Discussions:** [Ask the community](https://github.com/inguy24/numismat-enrichment/discussions)
- **Documentation:** [Full docs](https://github.com/inguy24/numismat-enrichment/tree/main/docs)

---

<div style="text-align: center; margin: 2em 0;">
  <a href="/installation" style="display: inline-block; padding: 10px 20px; background: #6c757d; color: white; text-decoration: none; border-radius: 6px;">← Installation Guide</a>
  <a href="/" style="display: inline-block; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px;">Back to Home</a>
</div>
