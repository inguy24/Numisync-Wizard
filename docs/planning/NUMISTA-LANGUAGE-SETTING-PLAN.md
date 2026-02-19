# Implementation Plan: Numista Content Language Setting (Minor Release)

**Created:** 2026-02-18
**Status:** APPROVED — READY FOR IMPLEMENTATION

## Context
Numista's API supports `lang=en|es|fr` on all catalog endpoints, but the app hardcodes `lang=en`
everywhere. This minor release exposes the language as a user preference in the Data Settings
modal, alongside the existing pricing currency dropdown.

UI language translation (app chrome) is deferred — it will be evaluated based on user demand
and will happen after the CODE-SPLIT-PLAN refactor is complete, not before.

**Future expansion awareness:** Colnect (45+ languages) and ANS MANTIS (English-only) are both
planned for a future major release. The settings schema must be structured now so that adding
per-source language settings later requires no migration.

**Code-split awareness:** The IPC handlers added here live in `src/main/index.js` for now.
When CODE-SPLIT-PLAN executes, they will move to `src/main/ipc/settings.js` along with the
existing `save-currency` / `get-currency` handlers they mirror. No special handling needed —
just note this in CHANGELOG so it's expected.

---

## Settings Schema Design (Forward-Compatible)

Use a **nested object** rather than a flat field, so each future data source gets its own key
with zero migration cost:

```json
"dataSourceLanguages": {
  "numista": "en"
}
```

When Colnect is added later: `"colnect": "en"` is appended to the same object.
When ANS is added: `"ans": "en"` (English-only, but the slot exists for consistency).

This is the only architectural decision that must be made correctly now. Everything else
(IPC names, UI placement) can be refactored cheaply during the code split.

---

## Files to Modify (in order)

### 1. `src/modules/settings-manager.js`

- In `getDefaultSettings()`, add alongside `currency: 'USD'` (line ~120):
  ```javascript
  dataSourceLanguages: { numista: 'en' },
  ```
- Add two methods after `setCurrency()` (line ~362):
  ```javascript
  /**
   * Get the Numista API content language code
   * @returns {string} Language code ('en', 'es', 'fr')
   */
  getNumistaLanguage() {
    return this.settings.dataSourceLanguages?.numista || 'en';
  }

  /**
   * Set and save the Numista API content language
   * @param {string} language - Language code ('en', 'es', 'fr')
   */
  setNumistaLanguage(language) {
    if (!this.settings.dataSourceLanguages) {
      this.settings.dataSourceLanguages = {};
    }
    this.settings.dataSourceLanguages.numista = language;
    this.saveSettings();
  }
  ```
- Update `@fileoverview` line 9 to add:
  `getNumistaLanguage() / setNumistaLanguage(code) — Numista API content language ('en', 'es', 'fr')`
- Update `Called by:` line to include `save-numista-language`

### 2. `src/main/index.js`

Two new IPC handlers, added immediately after the `get-currency` handler (line ~2122).
Follow the identical error-handling pattern:

```javascript
ipcMain.handle('save-numista-language', async (event, language) => {
  try {
    if (!settingsManager) throw new Error('No collection loaded');
    settingsManager.setNumistaLanguage(language);
    log.info('Numista language saved:', language);
    return true;
  } catch (error) {
    log.error('Error saving Numista language:', error);
    throw error;
  }
});

ipcMain.handle('get-numista-language', async () => {
  try {
    if (!settingsManager) return 'en';
    return settingsManager.getNumistaLanguage();
  } catch (error) {
    log.error('Error getting Numista language:', error);
    return 'en';
  }
});
```

Also find every `new NumistaAPI(apiKey, getApiCache(), getCacheTTLs())` call
(confirmed at lines ~1318 and ~3339, check for others) and add the language as 4th arg:

```javascript
const lang = settingsManager ? settingsManager.getNumistaLanguage() : 'en';
const api = new NumistaAPI(apiKey, getApiCache(), getCacheTTLs(), lang);
```

### 3. `src/main/preload.js`

Add two lines after `getCurrency` (line ~152):
```javascript
saveNumistaLanguage: (language) => ipcRenderer.invoke('save-numista-language', language),
getNumistaLanguage: () => ipcRenderer.invoke('get-numista-language'),
```

### 4. `src/modules/numista-api.js`

Store language on the instance so all methods use it automatically:

- Update constructor signature to accept `lang = 'en'` as 4th parameter, store as `this.lang`
- In `searchTypes()`: change hardcoded `lang: 'en'` → `lang: this.lang`
- In `getType(typeId, lang = 'en')`: change default → `lang = this.lang` (or use `this.lang` directly)
- In `getTypeIssues(typeId, lang = 'en')`: same change
- Prices endpoint does NOT use lang (currency-based only) — leave untouched

Cache keys already include lang (e.g., `type:${typeId}:${lang}`), so multilingual caching
works automatically with no additional changes.

### 5. `src/renderer/index.html`

Add a language selector card after the Search Category card (~line 886), before the
closing tag of `.data-settings-options`. Use the exact same HTML structure as the
currency card (lines ~838–862) — same `.data-setting-card` class, same
`.currency-select-wrapper` + `.currency-select` classes for consistent styling:

```html
<div class="data-setting-card">
  <div class="data-setting-header">
    <strong>Numista Content Language</strong>
  </div>
  <div class="data-setting-details">
    <p class="data-description">
      Select the language for coin data returned from Numista (names, descriptions, comments):
    </p>
    <div class="currency-select-wrapper">
      <select id="numistaLanguage" class="currency-select">
        <option value="en">English</option>
        <option value="es">Español (Spanish)</option>
        <option value="fr">Français (French)</option>
      </select>
    </div>
  </div>
</div>
```

### 6. `src/renderer/app.js`

Mirror the currency load/save pattern exactly.

**Load** (around line ~6523 where `getCurrency()` is called):
```javascript
const numistaLanguage = await window.api.getNumistaLanguage();
```

**Populate select** (after the currency select block, lines ~6578–6581):
```javascript
const languageSelect = document.getElementById('numistaLanguage');
if (languageSelect) {
  languageSelect.value = numistaLanguage || 'en';
}
```

**Save** (in the save function around line ~6647 where `pricingCurrency` is read):
```javascript
const languageSelect = document.getElementById('numistaLanguage');
if (languageSelect) {
  await window.api.saveNumistaLanguage(languageSelect.value);
}
```

---

## Documentation Updates

- **`docs/CHANGELOG.md`**: Prepend a `Feature` row to the unreleased section:
  `| {date} | Feature | index.html, app.js, index.js, preload.js, settings-manager.js, numista-api.js | **Numista content language setting** — Added en/es/fr language selector to Data Settings; all Numista API calls now use the user's preferred language for returned coin data |`

- **`docs/reference/IPC-HANDLERS-QUICK-REF.md`**: Add two rows for `save-numista-language`
  and `get-numista-language` in the Settings domain section

- **`docs/planning/CODE-SPLIT-PLAN.md`**: In the `src/main/ipc/settings.js` row of the
  Domain File Map table, add `save-numista-language`, `get-numista-language` to the
  IPC Channels column so they're tracked for the upcoming split

---

## Verification

1. Open Data Settings → Fetch Settings tab → language dropdown appears below Search Category
2. Change to Español → Save → close and reopen modal → Español is still selected (persistence)
3. Run enrichment on any coin → confirm Numista returns descriptions in Spanish
4. Change back to English → next enrichment returns English descriptions
5. Open a collection whose `settings.json` has no `dataSourceLanguages` field → app defaults
   to English gracefully (backwards compatibility via `?.numista || 'en'` fallback)
