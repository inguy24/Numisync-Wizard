# Plan: Task 2.3 - User-Configurable Field Mapping

## Summary

Add a "Field Mappings" tab to the existing Data Settings modal. Users can enable/disable fields, and change which Numista source field maps to each OpenNumismat field via a dropdown. Fix the critical gap where saved settings are never loaded into FieldMapper. Priority is removed from the UI (stays as-is from defaults).

---

## Architecture: NUMISTA_SOURCES Registry

The key architectural change is introducing a **Numista Sources registry** in `default-field-mapping.js`. This decouples *source definitions* (Numista path + transform) from *target assignments* (which OpenNumismat field they map to).

### Why?
- Transforms are tied to the *Numista data shape* (e.g. `ruler` returns an array that needs joining), not the OpenNumismat target
- When a user remaps a field, the transform follows the source automatically
- FieldMapper itself doesn't change - it still receives `numistaPath` + `transform` per field

### NUMISTA_SOURCES structure:
```js
const NUMISTA_SOURCES = {
  'title':                   { path: 'title', displayName: 'Title', transform: null, group: 'Basic' },
  'category':                { path: 'category', displayName: 'Category', transform: null, group: 'Basic' },
  'series':                  { path: 'series', displayName: 'Series', transform: null, group: 'Basic' },
  'type':                    { path: 'type', displayName: 'Type', transform: null, group: 'Basic' },
  'shape':                   { path: 'shape', displayName: 'Shape', transform: null, group: 'Basic' },
  'comments':                { path: 'comments', displayName: 'Comments', transform: null, group: 'Basic' },
  'numista_id':              { path: 'id', displayName: 'Numista ID', transform: toStringTransform, group: 'Basic' },
  'issuer_name':             { path: 'issuer.name', displayName: 'Issuer Name', transform: null, group: 'Issuer' },
  'issuer_code':             { path: 'issuer.code', displayName: 'Issuer Code', transform: null, group: 'Issuer' },
  'ruler_names':             { path: 'ruler', displayName: 'Ruler Name(s)', transform: <join ruler names>, group: 'Ruler' },
  'ruler_period':            { path: 'ruler', displayName: 'Ruler Period/Group', transform: <extract group.name>, group: 'Ruler' },
  'value_full':              { path: 'value.text', displayName: 'Value (full text)', transform: null, group: 'Value' },
  'value_number':            { path: 'value.text', displayName: 'Value (number only)', transform: <extract number>, group: 'Value' },
  'value_unit':              { path: 'value.text', displayName: 'Value (unit only)', transform: <extract unit>, group: 'Value' },
  'value_numeric':           { path: 'value.numeric_value', displayName: 'Numeric Value', transform: null, group: 'Value' },
  'currency_name':           { path: 'value.currency.name', displayName: 'Currency Name', transform: null, group: 'Value' },
  'composition_text':        { path: 'composition.text', displayName: 'Composition', transform: null, group: 'Physical' },
  'technique_text':          { path: 'technique.text', displayName: 'Technique', transform: null, group: 'Physical' },
  'weight':                  { path: 'weight', displayName: 'Weight (g)', transform: null, group: 'Physical' },
  'size':                    { path: 'size', displayName: 'Diameter (mm)', transform: null, group: 'Physical' },
  'thickness':               { path: 'thickness', displayName: 'Thickness (mm)', transform: null, group: 'Physical' },
  'orientation':             { path: 'orientation', displayName: 'Die Axis', transform: <coin/medal mapping>, group: 'Physical' },
  'obverse_description':     { path: 'obverse.description', displayName: 'Obverse Description', transform: null, group: 'Obverse' },
  'obverse_lettering':       { path: 'obverse.lettering', displayName: 'Obverse Lettering', transform: null, group: 'Obverse' },
  'obverse_lettering_trans': { path: 'obverse.lettering_translation', displayName: 'Obverse Lettering Translation', transform: null, group: 'Obverse' },
  'obverse_designers':       { path: 'obverse.designers', displayName: 'Obverse Designer(s)', transform: <join array>, group: 'Obverse' },
  'obverse_engravers':       { path: 'obverse.engravers', displayName: 'Obverse Engraver(s)', transform: <join array>, group: 'Obverse' },
  'obverse_picture':         { path: 'obverse.picture', displayName: 'Obverse Image', transform: null, group: 'Obverse' },
  'reverse_description':     { path: 'reverse.description', displayName: 'Reverse Description', transform: null, group: 'Reverse' },
  'reverse_lettering':       { path: 'reverse.lettering', displayName: 'Reverse Lettering', transform: null, group: 'Reverse' },
  'reverse_lettering_trans': { path: 'reverse.lettering_translation', displayName: 'Reverse Lettering Translation', transform: null, group: 'Reverse' },
  'reverse_designers':       { path: 'reverse.designers', displayName: 'Reverse Designer(s)', transform: <join array>, group: 'Reverse' },
  'reverse_engravers':       { path: 'reverse.engravers', displayName: 'Reverse Engraver(s)', transform: <join array>, group: 'Reverse' },
  'reverse_picture':         { path: 'reverse.picture', displayName: 'Reverse Image', transform: null, group: 'Reverse' },
  'edge_description':        { path: 'edge.description', displayName: 'Edge Description', transform: null, group: 'Edge' },
  'edge_lettering':          { path: 'edge.lettering', displayName: 'Edge Lettering', transform: null, group: 'Edge' },
  'edge_picture':            { path: 'edge.picture', displayName: 'Edge Image', transform: null, group: 'Edge' },
  'mint_name':               { path: 'mints', displayName: 'Mint Name', transform: <extract first mint>, group: 'Mint' },
  'issue_mintage':           { path: 'issue.mintage', displayName: 'Mintage', transform: null, group: 'Issue', requiresIssueData: true },
  'issue_mint_letter':       { path: 'issue.mint_letter', displayName: 'Mint Letter', transform: null, group: 'Issue', requiresIssueData: true },
  'pricing_unc':             { path: 'pricing.unc', displayName: 'Price - UNC', transform: null, group: 'Pricing', requiresPricingData: true },
  'pricing_au':              { path: 'pricing.au', displayName: 'Price - AU', transform: null, group: 'Pricing', requiresPricingData: true },
  'pricing_xf':              { path: 'pricing.xf', displayName: 'Price - XF', transform: null, group: 'Pricing', requiresPricingData: true },
  'pricing_vf':              { path: 'pricing.vf', displayName: 'Price - VF', transform: null, group: 'Pricing', requiresPricingData: true },
  'pricing_f':               { path: 'pricing.f', displayName: 'Price - F', transform: null, group: 'Pricing', requiresPricingData: true },
  'pricing_vg':              { path: 'pricing.vg', displayName: 'Price - VG', transform: null, group: 'Pricing', requiresPricingData: true },
  'pricing_g':               { path: 'pricing.g', displayName: 'Price - G', transform: null, group: 'Pricing', requiresPricingData: true },
  'catalog_references':      { path: 'references', displayName: 'Catalog References', transform: null, group: 'Catalog', isCatalog: true },
  'none':                    { path: null, displayName: '(Not Mapped)', transform: null, group: 'System' }
};
```

Each field in `DEFAULT_FIELD_MAPPING` gets a new `defaultSourceKey` property pointing to its default source. Settings stores the user's chosen `sourceKey` per field.

---

## Step 1: Update `default-field-mapping.js`

- Add `NUMISTA_SOURCES` registry (as above, ~45 entries)
- Move existing transform functions to be shared between `DEFAULT_FIELD_MAPPING` and `NUMISTA_SOURCES` (same functions, referenced by both)
- Add `defaultSourceKey` to each `DEFAULT_FIELD_MAPPING` entry (e.g., `title.defaultSourceKey = 'title'`, `country.defaultSourceKey = 'issuer_name'`)
- Add a `getSerializableSources()` helper that returns NUMISTA_SOURCES without transform functions (for sending to renderer)
- Export `NUMISTA_SOURCES` and `getSerializableSources`

---

## Step 2: Update `settings-manager.js`

### 2a. Update `buildDefaultFieldMappings()`:
```js
// Settings per field now stores:
{
  enabled: true/false,
  sourceKey: 'issuer_name',     // NEW: which Numista source
  catalogCode: 'KM' | null,    // for catalog fields only
  description: 'Human readable'
}
```

### 2b. Add `buildFieldMapperConfig()` method:
- Reads user's `fieldMappings` from settings
- For each field, looks up user's `sourceKey` in `NUMISTA_SOURCES`
- Builds a full mapping object with `numistaPath` and `transform` from the source + `enabled` from settings
- Falls back to default sourceKey if user's sourceKey is missing
- Returns object compatible with `FieldMapper` constructor

---

## Step 3: Wire FieldMapper to Settings (Fix the GAP)

### `src/main/index.js` (lines 534, 584):
Change both `new FieldMapper()` calls to:
```js
const customMapping = settingsManager ? settingsManager.buildFieldMapperConfig() : null;
const mapper = new FieldMapper(customMapping);
```

No changes needed to `field-mapper.js` itself - it already accepts custom mappings.

---

## Step 4: Add IPC Handlers + Preload Bridge

### `src/main/index.js` - 6 new IPC handlers:
- `get-field-mappings` - Returns settings fieldMappings + serializable NUMISTA_SOURCES list (for dropdowns)
- `save-field-mappings` - Validates and saves updated mappings
- `get-available-sources` - Returns `getSerializableSources()` for the dropdown options
- `export-field-mappings` - Save dialog + write JSON
- `import-field-mappings` - Open dialog + read/validate/save JSON
- `reset-field-mappings` - Reset to defaults from `buildDefaultFieldMappings()`

### `src/main/preload.js` - 6 bridge methods:
- `getFieldMappings`, `saveFieldMappings`, `getAvailableSources`
- `exportFieldMappings`, `importFieldMappings`, `resetFieldMappings`

---

## Step 5: Add Tabbed UI to Data Settings Modal

### 5a. `src/renderer/index.html` - Modify Data Settings Modal:

Add a tab bar at the top of `#dataSettingsModal .modal-body`:
```
[Fetch Settings] [Field Mappings]
```

- Wrap existing fetch settings content in `<div id="fetchSettingsTab" class="tab-panel active">`
- Add new `<div id="fieldMappingsTab" class="tab-panel">` containing:
  - Help text explaining the feature
  - Filter toolbar: category dropdown, enabled/disabled filter, bulk enable/disable buttons
  - Scrollable table with columns:
    - **Enabled** (toggle switch)
    - **OpenNumismat Field** (field name)
    - **Numista Source** (dropdown of NUMISTA_SOURCES grouped by optgroup)
    - **Catalog Code** (dropdown, only visible for catalognum1-4 fields)
    - **Description** (text)
  - The table body is populated dynamically by JS

- Change modal to use `.modal-wide` class when Field Mappings tab is active
- Footer buttons: Export, Import, Reset to Defaults, Save, Cancel (shared across tabs; Save saves both tabs)

### 5b. `src/renderer/styles/main.css` - New styles:

- `.modal-wide` - wider modal (max-width: 1000px)
- Tab bar styles: `.tab-bar`, `.tab-btn`, `.tab-btn.active`
- `.tab-panel` / `.tab-panel.active` show/hide
- `.field-mapping-table` - scrollable table container with sticky header
- Table header/row styles
- Toggle switch styles (CSS-only switch)
- Category filter toolbar
- Source dropdown styling with optgroups

### 5c. `src/renderer/app.js` - Extend `DataSettingsUI` class:

Add field mapping methods to the existing `DataSettingsUI` class (NOT a new class):
- `initFieldMappingTab()` - Sets up tab switching, event listeners
- `loadFieldMappings()` - Fetches mappings + available sources via IPC
- `renderFieldMappingTable()` - Builds table HTML with toggles and dropdowns
- `applyFieldFilters()` - Filters visible rows
- `bulkToggle(action)` - Enable/disable all visible fields
- `toggleField(name, enabled)` / `changeSource(name, sourceKey)` / `changeCatalogCode(name, code)` - Update in-memory state
- `saveFieldMappings()` - Save via IPC (called from shared Save button)
- `exportFieldMappings()` / `importFieldMappings()` / `resetFieldMappings()` - IPC calls

Tab switching logic:
- `switchTab(tabName)` - Shows/hides tab panels, toggles `.active` class on tab buttons
- When switching to Field Mappings tab, load data if not already loaded
- When switching to Fetch Settings tab, restore normal modal width

The shared Save button saves BOTH fetch settings and field mappings.

---

## Step 6: Validation & Safety

1. **Source dropdown validation**: Only show sources from NUMISTA_SOURCES registry (no freeform input)
2. **Catalog code validation**: Only for catalognum1-4 fields; validate against known codes
3. **Duplicate catalog code warning**: If same code assigned to multiple catalognum fields, show warning (not blocking)
4. **Import validation**: Check JSON structure, reject unknown fields/sources, enforce types
5. **Smart coercion in FieldMapper**: If a remapped source returns an array, auto-join with " / ". If it returns an object, try `.toString()` or `JSON.stringify()`. Prevents crashes from mismatched types.
6. **Image fields**: Show in table but with a note that image download is handled separately

---

## Files Modified (6 files)

| File | Changes |
|------|---------|
| `src/modules/default-field-mapping.js` | Add `NUMISTA_SOURCES` registry (~45 entries), add `defaultSourceKey` to each field, add `getSerializableSources()`, export new items |
| `src/modules/settings-manager.js` | Update `buildDefaultFieldMappings()` to include `sourceKey`+`catalogCode`, add `buildFieldMapperConfig()` method |
| `src/main/index.js` | Fix GAP (2 lines), add 6 IPC handlers |
| `src/main/preload.js` | Add 6 bridge methods |
| `src/renderer/index.html` | Add tab bar to Data Settings modal, add Field Mappings tab panel (EMOJI FILE) |
| `src/renderer/app.js` | Extend `DataSettingsUI` with tab switching + field mapping methods (EMOJI FILE) |
| `src/renderer/styles/main.css` | Tab styles, wide modal, field mapping table, toggle switches |

**7 files total** (main.css added)

---

## Verification

1. Load collection > Data Settings > verify "Fetch Settings" tab shows current content unchanged
2. Switch to "Field Mappings" tab > verify all 34 fields shown with correct defaults
3. Change `country` source from "Issuer Name" to "Issuer Code" > Save > compare a coin > verify issuer code (e.g. "canada") appears instead of "Canada"
4. Disable `title` field > Save > compare a coin > verify title not in comparison
5. Change `catalognum1` catalog code from KM to Schon > Save > compare > verify Schon number
6. Export mappings > edit JSON > import > verify changes applied
7. Reset to Defaults > verify all fields back to original sourceKeys
8. Close and reopen app > verify settings persisted
9. Verify filters (enabled/disabled, category) work
10. Verify bulk enable/disable works
11. Verify shared Save button saves both fetch settings and field mappings
