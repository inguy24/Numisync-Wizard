# GitHub Pages Homepage - Work Plan

**Created:** February 10, 2026
**Status:** Approved - Ready for Implementation
**Estimated Effort:** 3-4 hours
**Priority:** High (needed before public v1.0.0 launch)

---

## Context & Purpose

NumiSync Wizard v1.0.0 is feature-complete with substantial functionality (Premium features like Fast Pricing Mode, Auto-Propagate, License Management, etc.). The project has comprehensive documentation but lacks a **public-facing homepage** to attract users and explain the project professionally.

A GitHub Pages site will serve as the primary landing page for:
- Users discovering the project through search engines
- GitHub exploration and recommendations
- Direct links from social media or forums
- Professional presentation of the project

**Technology Choice:** Jekyll + Minimal Theme
- Clean, professional look with sidebar navigation
- Zero-maintenance deployment (auto-deploys on push to main)
- Markdown-based content (easy to update)

---

## Assets Available

### Existing Assets (Ready to Use)
- [src/renderer/images/logo_with_text.svg](../../src/renderer/images/logo_with_text.svg) - Hero logo
- [src/renderer/images/logo_no_text.svg](../../src/renderer/images/logo_no_text.svg) - Favicon source
- [build/icon.png](../../build/icon.png) - App icon (512x512)
- Comprehensive documentation in [docs/](../README.md)
- Project metadata in [package.json](../../package.json)

### New Assets Needed
1. **Application Screenshots** (4-6 high-quality PNG)
   - Main window with coin list and data comparison
   - Field comparison UI (side-by-side view)
   - Issue Picker dialog
   - Fast Pricing Mode progress indicator
   - Settings panel with Data Settings tab
   - Grid view mode (optional)

2. **Favicon** (PNG format)
   - Convert `logo_no_text.svg` to 16x16, 32x32, 64x64 PNG
   - Tool: ImageMagick, Inkscape, or online converter

---

## Content Structure

### 1. Hero Section
```
[Logo with Text - large, centered]

NumiSync Wizard for OpenNumismat

Automatically enrich your coin collection with detailed catalog data,
pricing information, and images from Numista.

[Download for Windows v1.0.0]  [View on GitHub]
[⭐ Star on GitHub badge]
```

### 2. What is NumiSync Wizard?
```
NumiSync Wizard connects your OpenNumismat coin collection database to the
comprehensive Numista catalog, automatically matching your coins and enriching
them with:

- Detailed catalog information (mintage, composition, ruler, designer)
- Current market pricing across 4 grade levels (UNC, XF, VF, F)
- Multiple issue variants per type (year, mint mark, type)
- High-resolution obverse, reverse, and edge images
- Smart matching with fuzzy search and manual override

Perfect for numismatists who want to spend less time on data entry and more
time enjoying their collection.
```

### 3. Key Features (8 Features with Icons)
- **Intelligent Coin Matching** - Fuzzy search with denomination normalization, issuer resolution, non-Gregorian year support
- **Granular Data Control** - Choose exactly what data to sync (Basic/Issue/Pricing)
- **Visual Field Comparison** - Side-by-side comparison, cherry-pick fields to update
- **Premium Fast Pricing Mode** - Batch-update pricing for all matched coins (Requires License)
- **Auto-Propagate Type Data** - Automatically apply type-level data to matching coins (Requires License)
- **Multi-Machine Support** - Configurable cache location, file locking prevents collisions
- **Smart Caching** - Persistent API cache reduces requests, respects rate limits
- **Advanced Field Mapping** - Customize how 45+ data sources map to OpenNumismat fields

### 4. Screenshots Section
Show 4-6 screenshots with captions demonstrating key features

### 5. Installation/Download
```
🚀 Get Started

Download NumiSync Wizard v1.0.0

[Download for Windows (x64/x86)] → Links to /releases/latest

⬇️ [View All Releases on GitHub]

Coming Soon:
• macOS (Intel/Apple Silicon)
• Linux (AppImage, deb, rpm)
```

**Download Strategy:** Use zero-maintenance links pointing to `/releases/latest` - no manual updates needed on new releases.

### 6. Quick Start (5 Steps)
1. Install NumiSync Wizard and launch
2. Open your OpenNumismat collection (.db file)
3. Settings → Add your Numista API key (free from numista.com)
4. Select coins → Click "Search & Enrich"
5. Review matches → Accept changes → Done!

### 7. Pricing/License Section (Prominent)

**Key messaging from in-app nag prompt:**
```
💝 Support Development

Hi Fellow Collector!

I built NumiSync Wizard to save myself countless hours cataloging my coin collection
in OpenNumismat. I know you hear pleas like this all the time, but I hope you'll
consider supporting this extremely niche software. For the price of a couple cups
of coffee (outrageous these days, I know!), you can become a supporter.

NumiSync Wizard is FREE for core features:
✅ Intelligent coin matching and search
✅ Visual field comparison and selective updates
✅ Issue variant selection
✅ Image download and comparison
✅ Smart caching and multi-machine support
✅ Advanced field mapping

A Supporter License ($10) gets you:
⭐ Fast Pricing Mode - Batch update pricing across your collection
⭐ Auto-Propagate - Apply type data to matching coins automatically
⭐ No more nag prompts!
⭐ Discounts on future premium features
⭐ The warm fuzzy feeling of supporting independent software

[Become a Supporter - $10]

Your support helps cover development costs and keeps NumiSync improving for our
community of collectors.

✨ Buy once, use forever • Unlocks current premium features permanently
✨ 5-device activation limit • No subscriptions • Open Source (MIT License)

View source on GitHub

Sincerely,
Shane (your fellow collector)
```

**License Clarity:** The "Discounts on future premium features" bullet subtly signals that new features in future versions may require upgrade, without making it sound complicated or slimy.

### 8. Documentation Links
- User Manual (built-in, press F1)
- Installation Guide
- Build Guide (for developers)
- API Reference (Numista integration)
- Changelog

### 9. Footer
```
Created by Shane Burkhardt (@inguy24)
MIT License • Version 1.0.0

[GitHub] [Report an Issue] [Discussions] [Numista.com]

Powered by Numista API • OpenNumismat Integration
```

---

## Implementation Steps

### Step 1: Take Screenshots
**Time: 30 minutes**

1. Launch NumiSync Wizard v1.0.0
2. Load a collection with enriched coins
3. Capture screenshots (use Windows Snipping Tool or ShareX):
   - **Main window** - Coin list with enriched data visible
   - **Field comparison** - Show side-by-side existing vs. new data
   - **Issue Picker** - Dialog with multiple issue variants
   - **Fast Pricing Mode** - Progress bar showing batch update
   - **Settings panel** - Data Settings tab showing granular controls
   - **Grid view** (optional) - Alternative view mode
4. Save as PNG in high resolution (at least 1920px wide)
5. Use descriptive filenames: `main-window.png`, `field-comparison.png`, etc.

### Step 2: Create Directory Structure
**Time: 5 minutes**

```bash
cd c:\numismat-enrichment\numismat-enrichment

# Create directory structure (if doesn't exist)
mkdir -p docs/assets/images/screenshots
mkdir -p docs/assets/css

# Note: docs/ may already exist with reference/, guides/, etc.
```

### Step 3: Copy Logo Assets
**Time: 5 minutes**

```bash
# Copy logo from src to docs
cp src/renderer/images/logo_with_text.svg docs/assets/images/logo.svg
cp src/renderer/images/logo_no_text.svg docs/assets/images/logo-icon.svg
cp build/icon.png docs/assets/images/icon.png
```

### Step 4: Create Favicon
**Time: 10 minutes**

Convert `logo_no_text.svg` to PNG favicons:

**Using ImageMagick:**
```bash
convert -background none src/renderer/images/logo_no_text.svg -resize 64x64 docs/assets/images/favicon-64.png
convert -background none src/renderer/images/logo_no_text.svg -resize 32x32 docs/assets/images/favicon-32.png
convert -background none src/renderer/images/logo_no_text.svg -resize 16x16 docs/assets/images/favicon-16.png
```

**Alternative:** Use online converter like [CloudConvert](https://cloudconvert.com/svg-to-png)

### Step 5: Write Homepage Content
**Time: 1.5 hours**

Create `docs/index.md` with all content sections outlined above. Use Markdown with front matter for Jekyll:

```markdown
---
layout: default
title: NumiSync Wizard - Enrich your OpenNumismat collection
---

# NumiSync Wizard
## for OpenNumismat

[Continue with content...]
```

**Reference:** See full content structure in sections 1-9 above.

### Step 6: Create Jekyll Configuration
**Time: 10 minutes**

Create `docs/_config.yml`:

```yaml
title: NumiSync Wizard
description: Enrich your OpenNumismat collection with data from Numista
author: Shane Burkhardt
baseurl: "/numismat-enrichment"
url: "https://inguy24.github.io"
theme: jekyll-theme-minimal

# Navigation links
navigation:
  - title: Home
    url: /
  - title: Installation
    url: /installation
  - title: Quick Start
    url: /quickstart
  - title: Documentation
    url: https://github.com/inguy24/numismat-enrichment/tree/main/docs
  - title: GitHub
    url: https://github.com/inguy24/numismat-enrichment

# Plugins
plugins:
  - jekyll-seo-tag
  - jekyll-sitemap

# SEO
twitter:
  card: summary
  username: inguy24

social:
  name: Shane Burkhardt
  links:
    - https://github.com/inguy24

# Exclude from processing
exclude:
  - reference/
  - guides/
  - planning/
  - archive/
  - CHANGELOG.md
```

### Step 7: Create Supporting Pages
**Time: 30 minutes**

**A. Create `docs/installation.md`**
```markdown
---
layout: default
title: Installation Guide
---

# Installation Guide

## Windows

1. Download the latest installer (.exe) from [GitHub Releases](...)
2. Run the installer
3. Accept the EULA
4. Choose installation directory
5. Launch NumiSync Wizard

[Continue with detailed steps, screenshots, troubleshooting...]
```

**B. Create `docs/quickstart.md`**
```markdown
---
layout: default
title: Quick Start Guide
---

# Quick Start Guide

Get up and running with NumiSync Wizard in 5 minutes.

## Prerequisites
- Windows 10/11
- OpenNumismat installed
- Numista API key (free)

[Continue with detailed walkthrough...]
```

### Step 8: Enable GitHub Pages
**Time: 5 minutes**

1. Go to https://github.com/inguy24/numismat-enrichment/settings/pages
2. **Source:** Deploy from a branch
3. **Branch:** `main`
4. **Folder:** `/docs`
5. Click **Save**
6. Wait 1-2 minutes for first deployment
7. Visit: https://inguy24.github.io/numismat-enrichment/

### Step 9: Test and Refine
**Time: 30 minutes**

Test checklist:
- [ ] Site loads at https://inguy24.github.io/numismat-enrichment/
- [ ] All images load correctly
- [ ] Logo displays in header
- [ ] Screenshots display with captions
- [ ] Download button links to `/releases/latest`
- [ ] "View All Releases" links to GitHub Releases page
- [ ] All internal links work (installation.md, quickstart.md)
- [ ] All external links work (GitHub repo, Issues, Numista)
- [ ] Favicon appears in browser tab
- [ ] Mobile responsive (test on phone/tablet)
- [ ] Desktop layout looks professional

**Refinements:**
- Adjust image sizes if too large/small
- Fix broken links
- Improve spacing/formatting
- Add custom CSS if needed in `docs/assets/css/custom.css`

### Step 10: Update INSTALLER-DISTRIBUTION-PLAN.md
**Time: 15 minutes**

Add **Phase 0: GitHub Pages Homepage** to [docs/guides/INSTALLER-DISTRIBUTION-PLAN.md](../guides/INSTALLER-DISTRIBUTION-PLAN.md):

```markdown
## Phase 0: GitHub Pages Homepage

**Created:** February 10, 2026
**Status:** Complete
**URL:** https://inguy24.github.io/numismat-enrichment/

### Purpose
Professional landing page for the project with downloads, features, screenshots, and documentation links.

### Technology
- GitHub Pages with Jekyll + Minimal Theme
- Zero-maintenance deployment (auto-updates on push)
- Markdown-based content

### Files Created
- `docs/index.md` - Homepage
- `docs/_config.yml` - Jekyll config
- `docs/installation.md` - Installation guide
- `docs/quickstart.md` - Quick start tutorial
- `docs/assets/images/` - Logo, screenshots, favicon

### Integration with Other Phases
- **Phase 1** (EULA, Auto-Update): Link to homepage in About dialog
- **Phase 2-3** (Code Signing, CI/CD): Add SignPath badge to footer
- **Phase 4-6** (Cross-Platform): Update download section when Mac/Linux builds available

### Maintenance
Download links point to `/releases/latest` - no manual updates needed.
```

Update phase numbering: Current Phase 1 becomes Phase 1, etc.

### Step 11: Update Other Project Files
**Time: 15 minutes**

**A. Update README.md**
Add prominent link at top:
```markdown
# NumiSync Wizard

🌐 **[Visit the Homepage](https://inguy24.github.io/numismat-enrichment/)**

Enrich your OpenNumismat collection with data from Numista.

[Continue with existing README...]
```

**B. Update package.json**
Add homepage field:
```json
{
  "name": "numisync-wizard",
  "version": "1.0.0",
  "homepage": "https://inguy24.github.io/numismat-enrichment/",
  ...
}
```

**C. Update About Dialog (Optional)**
In [src/main/index.js](../../src/main/index.js), update the About dialog to include homepage URL:
```javascript
dialog.showMessageBox(mainWindow, {
  type: 'info',
  title: 'About NumiSync Wizard',
  message: 'NumiSync Wizard v' + app.getVersion(),
  detail: 'Enrich your OpenNumismat collection with Numista data\n\n' +
          '🌐 Homepage: https://inguy24.github.io/numismat-enrichment/\n' +
          'GitHub: https://github.com/inguy24/numismat-enrichment\n\n' +
          'Created by Shane Burkhardt\n' +
          'Licensed under MIT'
});
```

---

## Homepage Maintenance Strategy

### Recommended: Zero-Maintenance Links ✅

**Primary download button links to:** `https://github.com/inguy24/numismat-enrichment/releases/latest`

**Benefits:**
- GitHub automatically redirects to the latest release
- No homepage updates needed when releasing new versions
- Users always get the current version
- No risk of forgetting to update the homepage

### Alternative: Direct Download Links (Not Recommended)

If you prefer direct links to specific `.exe` files, you'll need to update `docs/index.md` on every release:

**Option A: Automated (add to `.github/workflows/build.yml`):**
```yaml
- name: Update Homepage Version
  if: github.event_name == 'push' && startsWith(github.ref, 'refs/tags/v')
  run: |
    VERSION=${GITHUB_REF#refs/tags/v}
    sed -i "s/v[0-9]\+\.[0-9]\+\.[0-9]\+/v$VERSION/g" docs/index.md
    git config user.name "github-actions[bot]"
    git config user.email "github-actions[bot]@users.noreply.github.com"
    git add docs/index.md
    git commit -m "Update homepage to v$VERSION [skip ci]"
    git push
```

**Option B: Manual Checklist:**
Add to release workflow in Phase 3:
- [ ] Update version number in `docs/index.md`
- [ ] Update download links to new release assets
- [ ] Commit and push homepage changes

**Recommendation:** Use zero-maintenance approach to avoid forgetting updates.

---

## Verification Checklist

After completing all steps:

- [ ] **GitHub Pages Live:** https://inguy24.github.io/numismat-enrichment/ is accessible
- [ ] **Images Load:** Logo, screenshots, favicon all display correctly
- [ ] **Links Work:** All internal and external links are functional
- [ ] **Download Button:** Points to `/releases/latest` and works
- [ ] **Mobile Responsive:** Site looks good on phone, tablet, desktop
- [ ] **SEO Present:** Meta tags for title, description, og:image
- [ ] **README Updated:** Links to new homepage
- [ ] **package.json Updated:** Homepage field added
- [ ] **INSTALLER-DISTRIBUTION-PLAN Updated:** Phase 0 section added
- [ ] **No 404 Errors:** Check browser console for missing resources

---

## Post-Launch Iterations

Future improvements (not required for initial launch):

1. **Add Testimonials** - When users provide feedback
2. **Create Video Demo** - Screencast showing key features
3. **Comparison Table** - NumiSync vs manual data entry workflow
4. **Usage Statistics** - If you collect anonymous usage stats
5. **Blog/News Section** - For major updates or announcements
6. **Custom Domain** - When purchased, add CNAME file

---

## Integration with Other Work

### Depends On
- None (can be done independently)

### Blocks
- Public v1.0.0 launch announcement
- Marketing/social media posts (need link to share)

### Related Work
- **Phase 1** (EULA, Auto-Update): Update About dialog to link to homepage
- **Phase 2-3** (Code Signing, CI/CD): Add "Signed by SignPath Foundation" badge to footer
- **Phase 4-6** (Cross-Platform): Update download section when Mac/Linux builds are available

---

## Timeline

**Immediate Next Steps:**
1. Take screenshots (30 min)
2. Set up directory structure (5 min)
3. Write homepage content (1.5 hours)
4. Enable GitHub Pages (5 min)

**Total Estimated Time:** 3-4 hours

**Deadline:** Before public v1.0.0 launch announcement

---

## Notes & Decisions

### License Versioning Messaging
- Use "Buy once, use forever" - simple and positive
- Include "Discounts on future premium features" bullet
- This subtly signals that new features might not be included in current license
- Detailed versioning explanation belongs in EULA, not homepage
- Keep homepage messaging clean and welcoming

### Download Button Strategy
- Use `/releases/latest` link for zero maintenance
- Avoid direct file links that require updates on every release
- If direct links are needed later, add automation to release workflow

### Theme Choice
- Jekyll Minimal theme: Clean, professional, sidebar navigation
- Markdown-based for easy updates
- No build process required
- Auto-deploys on push to main branch

### Custom Domain
- Will add later when purchased
- Requires adding `CNAME` file to `docs/` directory
- Update `_config.yml` with new URL
- Configure DNS to point to GitHub Pages

---

## Support & References

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Jekyll Documentation](https://jekyllrb.com/docs/)
- [Jekyll Minimal Theme](https://github.com/pages-themes/minimal)
- [Markdown Guide](https://www.markdownguide.org/)
- Project files: [src/renderer/images/](../../src/renderer/images/) (logos)
