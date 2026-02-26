# Plan: Multi-Language GitHub Pages Website

## Context
The numisync.com marketing site is English-only. The target audience — coin collectors — is global, with major communities in France (Numista is French-origin), Germany, Russia (OpenNumismat is Russian-origin), and Spain/Latin America. Adding language support to the site (not the app) would meaningfully widen reach without any app changes.

Current site: Jekyll Cayman theme, native GitHub Pages build (no GitHub Actions), 6 user-facing pages, ~6,700 English words total.

Key files:
- `docs/_layouts/default.html` — master layout template (137 lines, inline CSS + nav)
- `docs/index.md` — homepage
- `docs/download.md`, `docs/installation.md`, `docs/quickstart.md`, `docs/license.md` — other user-facing pages
- `docs/_config.yml` — Jekyll config (theme: jekyll-theme-cayman, plugins: jekyll-seo-tag, jekyll-sitemap)

---

## Language Recommendations

**All 11 languages included (everything except Arabic):**

| Code | Language | Rationale |
|------|----------|-----------|
| `en` | English | Default — already done |
| `fr` | French | Numista itself is French; France/Belgium are the core Numista communities |
| `de` | German | Germany, Austria, Switzerland — enormous coin collecting markets |
| `es` | Spanish | Spain + all of Latin America; large and growing collector base |
| `ru` | Russian | OpenNumismat is Russian-origin; strong Eastern European collector community |
| `ja` | Japanese | Japan is a major numismatic market; sophisticated collector community |
| `zh-CN` | Chinese Simplified | Mainland China — large and rapidly growing collector market |
| `zh-TW` | Chinese Traditional | Taiwan and Hong Kong collector communities |
| `it` | Italian | Italy has a strong numismatic tradition; major European collector community |
| `pt` | Portuguese | Brazil (largest market) + Portugal; `pt-BR` auto-detection preferred |
| `nl` | Dutch | Netherlands and Belgium; active numismatic culture |

**Technical note on CJK (Chinese/Japanese/Korean):** These are all left-to-right horizontal scripts — no layout or CSS changes required vs. European languages. System CJK fonts are built into every modern OS/browser. Implementation is identical to French or German.

**Arabic — explicitly excluded:** Arabic is right-to-left (RTL), which requires mirroring the entire page layout (nav, buttons, text alignment). The Cayman theme has no RTL support — this would require significant CSS work beyond the scope of this plan.

---

## Technical Approach: Static Subdirectory Structure

Since the site uses **native GitHub Pages Jekyll** (no GitHub Actions), plugins like `jekyll-polyglot` are off-limits (not on GitHub Pages allowlist). The cleanest compatible approach is static language subdirectories + client-side JS for auto-detection and switching.

### Directory Structure
```
docs/
├── index.md              ← English (canonical)
├── download.md
├── installation.md
├── quickstart.md
├── license.md
├── privacy.md            ← English only (legal text)
├── fr/
│   ├── index.md          ← French homepage
│   ├── download.md
│   ├── installation.md
│   ├── quickstart.md
│   └── license.md
├── de/
│   └── (same 5 files)
├── es/
│   └── (same 5 files)
├── ru/
│   └── (same 5 files)
├── ja/
│   └── (same 5 files)
├── zh-CN/
│   └── (same 5 files)
├── zh-TW/
│   └── (same 5 files)
├── it/
│   └── (same 5 files)
├── pt/
│   └── (same 5 files)
└── nl/
    └── (same 5 files)
```

Jekyll processes subdirectories automatically — no config changes needed for the subdirs themselves.

### Language Switcher in Header
Add a dropdown to the nav in `docs/_layouts/default.html`:
- Shows current language (e.g., "English ▾")
- Dropdown lists the other available languages
- On selection, JS maps the current page path to its equivalent in the selected language and navigates there
- Selection saved to `localStorage` under key `numisync_lang`

### Auto-Detection (First Visit)
JS snippet in `default.html` — runs only if no `numisync_lang` in localStorage:
```js
const pref = localStorage.getItem('numisync_lang');
if (!pref) {
  const raw = (navigator.language || '').toLowerCase();
  // Map browser locale to our supported language codes
  const localeMap = {
    'zh-tw': 'zh-TW', 'zh-hk': 'zh-TW', 'zh-mo': 'zh-TW',
    'zh-cn': 'zh-CN', 'zh-sg': 'zh-CN', 'zh': 'zh-CN',
    'pt-br': 'pt', 'pt': 'pt'
  };
  const supported = ['fr', 'de', 'es', 'ru', 'ja', 'it', 'nl'];
  const lang = localeMap[raw] || localeMap[raw.slice(0, 2)] ||
    (supported.includes(raw.slice(0, 2)) ? raw.slice(0, 2) : null);
  if (lang && !window.location.pathname.startsWith('/' + lang)) {
    const newPath = '/' + lang + (window.location.pathname === '/' ? '/' : window.location.pathname);
    window.location.replace(newPath);
  }
}
```
Note: `zh-TW` and `zh-CN` need special handling since their directory names contain a hyphen — Jekyll processes them correctly as subdirectories.
English users (and any unrecognized language) stay on root URLs — no redirect.

### hreflang Tags for SEO
Each page includes its alternate-language equivalents in `<head>`. Implemented via front matter + Jekyll template logic in `default.html`:

Front matter on each page:
```yaml
lang: fr
page_id: download   # canonical page identifier
```

In `default.html <head>`:
```html
<link rel="alternate" hreflang="en"    href="{{ site.url }}/{{ page.page_id }}/" />
<link rel="alternate" hreflang="fr"    href="{{ site.url }}/fr/{{ page.page_id }}/" />
<link rel="alternate" hreflang="de"    href="{{ site.url }}/de/{{ page.page_id }}/" />
<link rel="alternate" hreflang="es"    href="{{ site.url }}/es/{{ page.page_id }}/" />
<link rel="alternate" hreflang="ru"    href="{{ site.url }}/ru/{{ page.page_id }}/" />
<link rel="alternate" hreflang="ja"    href="{{ site.url }}/ja/{{ page.page_id }}/" />
<link rel="alternate" hreflang="zh-CN" href="{{ site.url }}/zh-CN/{{ page.page_id }}/" />
<link rel="alternate" hreflang="zh-TW" href="{{ site.url }}/zh-TW/{{ page.page_id }}/" />
<link rel="alternate" hreflang="it"    href="{{ site.url }}/it/{{ page.page_id }}/" />
<link rel="alternate" hreflang="pt"    href="{{ site.url }}/pt/{{ page.page_id }}/" />
<link rel="alternate" hreflang="nl"    href="{{ site.url }}/nl/{{ page.page_id }}/" />
<link rel="alternate" hreflang="x-default" href="{{ site.url }}/{{ page.page_id }}/" />
```

---

## Pages to Translate

| Page | Translate? | Notes |
|------|-----------|-------|
| `index.md` | Yes | Highest priority — hero, features, screenshots |
| `download.md` | Yes | Platform names stay in English; UI labels translate |
| `installation.md` | Yes | Step-by-step — high value for non-English users |
| `quickstart.md` | Yes | Workflow guide |
| `license.md` | Yes | Feature table + FAQ |
| `privacy.md` | No | Legal text — keep English only; note "Privacy Policy (English)" |
| `macos-install.md` | No | Niche page; English fine |

**Total per language:** ~5,900 words (5 pages)
**Total new content (10 languages):** ~59,000 words — all AI-generated as first drafts

---

## Translation Strategy

1. **AI-generate first drafts** using Claude — all 10 languages × 5 pages can be batched efficiently
2. **Terminology rules (apply to every language):**
   - Product names stay in English: "NumiSync Wizard", "OpenNumismat", "Numista"
   - App UI terms stay in English (menu names, button labels) — the app itself is English-only
   - "enrichment" / "enrich" can be translated naturally in each language
   - Platform names stay in English: "Windows", "macOS", "Linux", "Microsoft Store"
   - Grade abbreviations (F, VF, XF, UNC) stay as-is
3. **Preserve all markdown structure exactly** — headings, bullet points, HTML tags (buttons, modals, screenshots), frontmatter keys (only values translate)
4. **Frontmatter to add to each translated page:**
   ```yaml
   lang: fr          # language code for this page
   page_id: index    # canonical page name — must match English page filename (without .md)
   ```
5. **Do not translate `privacy.md`** — link to the English page from translated nav with a note: "(English)"

---

## Implementation Steps

### Step 1: Update `docs/_layouts/default.html`
- Add language switcher dropdown component (CSS + HTML in existing inline styles)
- Add auto-detection JS snippet (runs on DOMContentLoaded)
- Add `hreflang` link tags in `<head>` section (uses `page.page_id` and `page.lang` front matter)

### Step 2: Add `page_id` and `lang` front matter to English pages
Update each existing `.md` file to add:
```yaml
lang: en
page_id: index   # or: download, installation, quickstart, license
```

### Step 3: Create translated `.md` files
For each language code (`fr`, `de`, `es`, `ru`, `ja`, `zh-CN`, `zh-TW`, `it`, `pt`, `nl`), create 5 translated pages each with appropriate front matter (`lang` + `page_id`). Translate all visible text; preserve all markdown structure, HTML tags, image paths, and URLs verbatim.

### Step 4: Update `_config.yml` — add translated dirs to `exclude` list only if needed
Jekyll auto-processes language subdirectories. No changes required unless build performance is a concern.

### Step 5: Verify Jekyll builds cleanly
- Confirm all 10 subdirectory sets render correctly on GitHub Pages after pushing
- Check the language switcher correctly maps `/installation/` ↔ `/fr/installation/` ↔ `/ja/installation/` etc.
- Test browser auto-detection with DevTools: Application → Language → add `fr-FR`, reload root → should redirect to `/fr/`
- Test `zh-TW` locale → should redirect to `/zh-TW/` (not `/zh-CN/`)
- Verify `localStorage` preference survives page navigation and is honored on return visits

---

## Files to Modify

- `docs/_layouts/default.html` — language switcher UI, auto-detect JS, hreflang tags
- `docs/index.md` — add `lang: en`, `page_id: index` to front matter
- `docs/download.md` — add front matter
- `docs/installation.md` — add front matter
- `docs/quickstart.md` — add front matter
- `docs/license.md` — add front matter

## Files to Create (50 new files)

5 pages × 10 language directories:
- `docs/fr/` — French (5 files)
- `docs/de/` — German (5 files)
- `docs/es/` — Spanish (5 files)
- `docs/ru/` — Russian (5 files)
- `docs/ja/` — Japanese (5 files)
- `docs/zh-CN/` — Chinese Simplified (5 files)
- `docs/zh-TW/` — Chinese Traditional (5 files)
- `docs/it/` — Italian (5 files)
- `docs/pt/` — Portuguese (5 files)
- `docs/nl/` — Dutch (5 files)

Each directory contains: `index.md`, `download.md`, `installation.md`, `quickstart.md`, `license.md`

---

## Verification

1. Push to main → GitHub Pages builds without errors (check repo Actions tab)
2. Navigate to `numisync.com/fr/` — French homepage renders
3. Language switcher dropdown appears on all pages
4. Set browser locale to `fr-FR` in DevTools, visit root → auto-redirects to `/fr/`
5. Select English from dropdown → returns to root, saves to localStorage
6. View page source → hreflang tags present in `<head>`
7. Test sitemap.xml includes all language pages

---

## Complexity Assessment

**Overall: Medium** — straightforward static file addition with a small JS component. No exotic tooling, no plugins, no CI changes required. The bulk of the work is the translation content itself (which AI can generate quickly for initial drafts). The technical implementation is a few hours; translation review is the main time investment.

**Changelog type:** `Internal` (GitHub Pages/marketing — not app source code)

---

## Phase 2 (Manual): Microsoft Store Listing Translations

The Microsoft Store supports localized app listings — title, description, short description, release notes, and screenshots can all be provided per language. This is done manually through the Partner Center dashboard (not automatable via CI).

**What to translate:**
- **App name/title** — "NumiSync Wizard" (likely keep in English as it's a brand name)
- **Short description** (~100 chars) — shown in search results
- **Description** (~10,000 char max) — the full Store listing body
- **Release notes** — per-version "What's New" text
- **Screenshots** — captions overlay; may want localized caption text

**Supported languages:** Microsoft Store supports 100+ locales. Priority order matches the website plan (fr, de, es, ru, ja, zh-CN, zh-TW, it, pt, nl).

**Process (manual per-language in Partner Center):**
1. Go to Partner Center → Apps → NumiSync Wizard → Submissions
2. For each language: add a new language listing, paste translated content
3. AI can generate draft translations for all fields; human review required before submission
4. Screenshots don't need retaking — captions are text overlays editable per locale

**Notes:**
- Store listings are reviewed by Microsoft on each submission update — changes take 1-3 days to go live
- Release notes must be updated per language on each new version — build this into the release checklist
- The app itself remains English-only; only the Store discovery/marketing text is localized
- Add "Update Store listing translations" as a line item to the release process in `docs/guides/BUILD-GUIDE.md` once Phase 2 is ready
