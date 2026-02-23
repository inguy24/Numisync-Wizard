# CRITICAL OPERATING PROCEDURES

## QUICK CONTEXT (Read this first — replaces README for AI)
- **App:** NumiSync Wizard — Electron desktop app enriching OpenNumismat coin DB from Numista API
- **Stack:** Electron + vanilla JS (main: index.js, renderer: app.js + index.html), sql.js (SQLite), @polar-sh/sdk (licensing)
- **Version:** 1.0.0 — in Microsoft Store review as of Feb 2026
- **Main process:** src/main/index.js (3420 LOC, ~65 IPC handlers) + preload.js + logger.js + updater.js
- **Renderer:** src/renderer/app.js (7756 LOC) + index.html (1186 LOC) — emoji-free, standard Edit/Write safe. Emoji strings isolated to ui-strings.js (emoji-restricted)
- **Modules:** src/modules/ (12 files) — see docs/reference/IPC-HANDLERS-QUICK-REF.md before reading source
- **Data files:** src/data/ — denomination-aliases.json, issuer-denomination-overrides.json, issuer-aliases.json
- **Settings:** Single file — numisync-wizard/settings.json in userData (see SETTINGS-CONSOLIDATION.md)
- **Log file:** `C:\Users\shane.SHANEBURKHARDT\AppData\Roaming\numisync-wizard\logs\main.log` — read this FIRST when debugging errors
- **License:** Polar SDK — activate() on first entry, validate() for periodic checks (see Lesson 24)
- **Database:** OpenNumismat .db file — see DATABASE-SCHEMA section in PROJECT-REFERENCE.md
- **Changelog:** docs/CHANGELOG.md — read for recent changes before touching any module
- **DO NOT** read PROJECT-REFERENCE.md unless the task involves architecture or IPC changes

## 0. GITHUB OPERATIONS

**CRITICAL: NEVER use WebFetch on GitHub URLs** - Automated web scraping triggers GitHub security and forces password resets.

**ALWAYS use GitHub CLI (`gh`) instead:**
- Check workflow status: `gh run list --workflow=build.yml`
- View failed logs: `gh run view <run-id> --log-failed`
- List releases: `gh release list`
- View release assets: `gh release view <tag> --json assets`
- Delete release assets: `gh release delete-asset <tag> <filename>`

**GitHub CLI location:** `"C:\Program Files\GitHub CLI\gh.exe"` (use full path if not in PATH)

## 1. DOCUMENTATION HIERARCHY

**NEVER assume project state — verify against documentation first.**
**After completing any fix or feature, update `docs/CHANGELOG.md`** — prepend a new row to the `## v{current-version} *(unreleased)*` section using the 4-column format: `| {date} | {Type} | {files} | **{Title}** — {description} |`. Valid types: `Feature` (new functionality), `Fix` (bug fix), `Internal` (docs, CI, tooling, AI-context). Only `Feature` and `Fix` rows are published in GitHub release notes; `Internal` rows are excluded automatically. **GitHub Pages files (`docs/*.md`, `docs/_layouts/`, `docs/_config.yml`) are always `Internal` — they are marketing/documentation, not app source code.**
**After architecture/IPC changes, update `docs/reference/PROJECT-REFERENCE.md`.**
**Archive completed work plans** to `docs/archive/` with `-COMPLETE` suffix (e.g., `PHASE2-WORK-PLAN-COMPLETE.md`).

### Reference Doc Maintenance (Keep These in Sync)

| When you… | Also update… |
|-----------|-------------|
| Add or remove an IPC handler in index.js | `docs/reference/IPC-HANDLERS-QUICK-REF.md` — add/remove the row in the correct domain section |
| Change a module's exported functions | `@fileoverview` block at top of that module file |
| Add a new module to src/modules/ | Create `@fileoverview` block; add row to QUICK CONTEXT module count above |
| Add new emoji UI strings | `src/renderer/ui-strings.js` only (Python binary ops) — reference via `UI_STRINGS.*` in app.js |
| Change OpenNumismat DB schema | DATABASE-SCHEMA section in `docs/reference/PROJECT-REFERENCE.md` |
| Add a new lesson learned | CLAUDE.md §5 under the correct `###` category |

**Note:** The MCP server (`mcp/server.js`) reads CLAUDE.md §5, CHANGELOG.md, IPC-HANDLERS-QUICK-REF.md, swagger.yaml, and denomination-aliases.json at query time — keeping those files accurate keeps the MCP tools accurate automatically.

### Task-Based Reading Guide

| Task Type | Read These |
|-----------|-----------|
| Bug fix in UI | CHANGELOG.md recent entries, then targeted source |
| New IPC handler | docs/reference/IPC-HANDLERS-QUICK-REF.md |
| Database query | DATABASE-SCHEMA section in PROJECT-REFERENCE.md |
| API/search change | swagger.yaml + Lessons (API & Search category) |
| Build/release | docs/guides/BUILD-GUIDE.md or INSTALLER-DISTRIBUTION-PLAN.md |
| Settings change | docs/reference/SETTINGS-CONSOLIDATION.md + Lesson 25 |
| Licensing | docs/guides/POLAR-*.md + Lesson 24 |
| Emoji/UI strings | src/renderer/ui-strings.js only — Python binary ops required (see §3) |

## 2. CODING & REPOSITORY STANDARDS
- **LOCATION:** All source files reside in `/src` and its sub-directories
- **NO SNIPPETS:** Never provide code snippets. Implement changes directly into relevant files
- **INTEGRATE:** All HTML goes in index.html, all renderer JS in app.js, all main process code in index.js — exception: `src/renderer/ui-strings.js` is the one deliberate standalone renderer file (emoji string constants only)
- **NEVER** create standalone UI component files - integrate into existing files (only `ui-strings.js` is exempt — do not create additional standalone renderer files)
- **API SOURCE:** Use @docs/reference/swagger.yaml for all Numista API documentation
- **FILE PLACEMENT:** See @docs/reference/FILE-ORGANIZATION.md for rules on where files belong

## 3. EMOJI & ENCODING INTEGRITY
- **STRICT ADHERENCE:** Follow @docs/reference/EMOJI-ENCODING-GUIDANCE.md for full procedure details
- **EMOJI-RESTRICTED FILE:** src/renderer/ui-strings.js — use Python binary ops or bash sed to edit
- **NEVER** use Write/Edit tools on ui-strings.js — it contains all emoji string constants
- **app.js and index.html are now emoji-free** — standard Edit/Write tools are safe

## 4. TOKEN & LOOP SAFETY
- **TOKEN SAFETY:** If a solution fails twice, STOP. Report the failure and ask for clarification
- **NO LOOPS:** Do not repeatedly attempt the same fix
- **PROFESSIONAL TONE:** Maintain professional demeanor regardless of user style

## 5. LESSONS LEARNED (Critical Bugs Avoided)

### API & Search (Numista)

1. **API returns array directly** - Numista `/types/{id}/issues` returns an array, not `{issues: []}`. Always check actual response format.

15. **Numista API uses non-Gregorian year fields** - Issues from `/types/{id}/issues` return both `year` (era-specific, e.g., Meiji 14) and `gregorian_year` (e.g., 1881). OpenNumismat stores Gregorian years, so any year-based filtering must check BOTH `year` and `gregorian_year` to handle Japanese (Meiji/Taisho/Showa), Islamic (Hijri), Thai Buddhist, and other non-Gregorian dating systems.

16. **Numista issuer codes don't follow one format** - Some use hyphens (`united-states`, `korea-south`), others use underscores (`boheme_moravie`). Never guess the code format — let the fuzzy matcher resolve it from `getIssuers()` and log the result, then add the verified code to `issuer-aliases.json`.

17. **Numista search API doesn't cross-match denomination languages** - Searching `issuer=boheme_moravie&q=heller` returns 0 results even though the coins exist as "Haléřů" (Czech). The website search handles this, but the API does not. Use cross-referenced denomination entries (same denomination listed under two canonical forms) so `getAlternateSearchForms()` can retry with each language variant.

18. **Use Unicode-aware regex for Numista text fields** - Numista returns denomination names in native languages (e.g., "Haléřů" not "Hellers"). Regexes using `[A-Za-z]` silently fail on accented/non-Latin characters. Always use `\p{L}` with the `u` flag (e.g., `/[\p{L}]+$/u`) to match any Unicode letter.

19. **Keep automatic and manual search in parity** - Both `searchForMatches()` (automatic/inline) and the manual search handler must use the same query-building logic, normalization, and filters (issuer, category). When adding a capability to one search path, always apply it to the other unless explicitly discussed otherwise. Divergence causes silent differences in result quality.

20. **Numista issuers have a parent/child hierarchy — always match most specific** - The `/issuers` endpoint returns issuers with `level` (1-5) and `parent` fields. Section-level issuers (lower level) group territories under a country (e.g., "United Kingdom" section includes Falkland Islands, Gibraltar). The specific country issuer has a higher level number. When resolving issuer codes, always prefer the most specific (highest level) match. Using a section-level code causes the search API to return coins from all grouped territories, polluting results with irrelevant coins and pushing the correct coin out of view.

31. **Issuer name collisions require parent-aware tie-breaking** - Two Numista issuers can share the identical name (e.g. both called "East Africa") but exist in completely different parent hierarchies (one standalone, one under "Islamic states"). The old tie-break of "higher level wins" was designed for parent/child pairs within the same hierarchy (e.g. "United Kingdom" section vs. "United Kingdom" country) but silently picks the wrong issuer when the collision crosses hierarchies. Fix: when Dice scores tie, score the parent name against the query — prefer the issuer whose parent is most relevant; prefer parentless issuers over those with a zero-scoring parent. Level number remains the final tiebreaker within the same context. Also add explicit alias entries to `issuer-aliases.json` for known historical issuers whose name doesn't exactly match their Numista entry (e.g. "East Africa Protectorate" → `afrique_de_l_est`, verified 2026-02-21).

32. **Automatic search strategy: issuer + country-in-q is contradictory; no-issuer fallback is the correct last resort** — `searchForMatches()` uses three strategies in sequence. S1: full structured query with `issuer` + `q="value unit"` + `date` — handles the vast majority of coins. S2: same but with alternate denomination forms from `getAlternateSearchForms()` — handles language variant denominations (e.g., Czech "haléřů" vs English "heller"). S3: no-issuer fallback — `issuer` is dropped entirely and the country name is moved into `q` (e.g., `q="South Africa 1 shilling"`) while `date` and `category` are kept — handles historical issuer mismatches where a modern country label (e.g., "South Africa" → `afrique_du_sud`) doesn't cover pre-Union sub-issuers. **Year (`date`) must always be a separate param, never in `q`** — Numista type titles don't contain years; putting year in `q` returns 0 results. **Do not add a strategy that combines issuer + country-in-q** — the issuer param already scopes to the country, so requiring the country name to also appear in the coin's title is contradictory and strictly more restrictive than S1 (always returns a subset of S1's results, usually the same 0). See PROJECT-REFERENCE.md "Automatic Search Strategy" section for full table and rationale.

30. **Never hardcode external API identifiers without live verification — treat guessed values as destructive** - `issuer-aliases.json` was created with Numista issuer codes guessed by naming convention (e.g., "korea-south", "germany-federal-republic"). These codes did not exist in the Numista API at all, causing silent 400 errors on every Korean and German coin search. Two others ("united-states", "united-kingdom") existed but were section-level codes that polluted results with unrelated territories. The file caused more harm than good because half its values were fabricated. Rule: any file that stores external system identifiers (API codes, IDs, keys) must be populated exclusively from live API responses — never by pattern-guessing. When adding a new entry, call the relevant endpoint, inspect the actual response, and record the verified value. Document the verification source (endpoint + date) in a comment. Verified codes as of 2026-02-19: `united-states`→`etats-unis`, `united-kingdom`→`royaume-uni`, `west-germany`→`allemagne`, `east-germany`→`ddr`, `south-korea`→`coree_du_sud`, `north-korea`→`coree_du_nord`.

### Database & Data Persistence

2. **Always persist status to database** - In-memory cache updates alone don't survive restarts. Write to note field.

3. **Read back metadata after write** - `ensureValidMetadata` fills required fields; read back to get complete structure.

5. **OpenNumismat image column mapping** - `obverseimg`/`reverseimg` reference `photos` table, NOT `images` table. `coins.image` references `images` table (composite thumbnails).

7. **Null values ARE data in set comparisons** - When checking if field "varies", null/empty must count as distinct value.

13. **Parse stored data before use** - Data stored in fields (e.g., JSON in note field) must be explicitly parsed and attached to objects. `get-coins` must parse metadata so `coin.metadata` is available for matching. Fallback defaults must match actual defaults defined elsewhere.

### IPC & Architecture

6. **Dead code can silently break features** - Method calls guarded by `if (obj)` still throw if method doesn't exist on obj.

8. **Match IPC return value format** - Always check how existing code handles returns before writing new consumers. IPC responses often wrap data.

11. **Infrastructure without integration is invisible** - Having all pieces doesn't matter if they're never connected. Trace complete flow.

12. **Windows file locks need PowerShell** - Node.js `fs.openSync` uses shared access. Use `[System.IO.File]::Open()` with `FileShare.None` for exclusive lock test.

14. **Propagate user choices through multi-step flows** - When a user makes selections (e.g., checkboxes), those choices must be passed through the entire chain of function calls. Don't hardcode defaults in downstream handlers - accept the selection state from upstream.

22. **Pass the source object through multi-stage data flows** - When a function determines behavior based on a reference object (e.g., the enriched coin for skip reasons), that object must be explicitly passed through each stage of the flow. Don't assume a related object (e.g., `duplicates[0].coin`) is equivalent — it may be empty or refer to a different entity entirely.

### UI & Rendering

4. **Check ALL icon rendering functions** - Different data types use different functions (getDataTypeIcon vs getPricingIcon).

10. **Always update UI after async data loads** - Don't rely on initialization-time updates; refresh after data actually loads.

### Settings & Configuration

9. **Two settings systems exist** - Phase 1 app settings (`getAppSettings`) vs Phase 2 collection settings (`getSettings`) are different channels.

29. **Cache path must be included in shared config AND applied on import** - The monthly API usage count lives in `api-cache.json`, whose path is controlled by `cache.location` + `cache.customPath` in `settings.json`. Three things must stay in sync: (1) `writeSharedConfig()` in `save-app-settings` must include `cachePath` in the payload so `numisync-shared-config.json` records where the cache lives; (2) `import-from-folder` must set `cache.location = 'custom'` + `cache.customPath` in the importing machine's `settings.json`; (3) `apply-shared-config` must do the same. All three must also reset `apiCache = null` so `getApiCache()` re-initializes with the shared path. **Path normalization:** `customPath` must always be the parent folder (e.g., `\\server\share\coins`), never the `.NumiSync` subfolder — `getApiCache()` appends `.NumiSync` internally. Any code writing `customPath` must strip a trailing `.NumiSync` segment (`path.basename(p) === '.NumiSync' ? path.dirname(p) : p`) since users may select the subfolder directly in a browse dialog.

25. **Never create parallel settings files — always consolidate** - Creating a new settings file (e.g., `app-settings.json`) when adding features causes redundancy, sync issues, and confusion about which file controls which settings. Always extend the existing settings file with new fields. When adding cache configuration or other new features, add the fields to `settings.json` with backwards-compatible defaults. If dual files already exist, immediately consolidate by: (1) updating read/write functions to use one file, (2) reversing migration to merge the new file into the old, (3) documenting the single source of truth. See `docs/reference/SETTINGS-CONSOLIDATION.md` for full consolidation pattern.

### Licensing (Polar SDK)

24. **Activate and Validate are separate license operations** - Polar SDK has two distinct endpoints: `activate()` registers a new device (counts toward device limit, creates activation record, does NOT increment validations counter) and `validate()` checks existing license validity (increments validations counter, updates lastValidatedAt timestamp shown in dashboard). When user first enters license key, call `activate()` to register device, then immediately call `validate()` to increment validation counter. Periodic re-validation (every 7 days) should only call `validate()`, not `activate()`. Calling only `activate()` on first entry causes Polar dashboard to show "Validations: 0, Validated At: Never Validated" even though license works.

### Build & CI/CD

23. **Logger folder path must match package.json name, not productName** - `logger.js` runs before `app.ready()`, so it manually constructs the userData path. It must use package.json `"name"` field (e.g., `"numisync-wizard"`), NOT electron-builder `productName` (e.g., `"NumiSync Wizard"`). In dev mode, Electron uses package.json name for userData folder. Mismatch causes logger to fail loading settings, silently falling back to default 'info' level and filtering out all `log.debug()` statements. Check this when debug logging doesn't work despite settings showing debug enabled.

26. **electron-builder auto-publish requires explicit permissions** - When building with tags, electron-builder auto-detects the tag and tries to publish to GitHub releases. This fails with "403 Forbidden: Resource not accessible by integration" if the build job doesn't have `contents: write` permission. Fix: Add `--publish never` to all build commands in GitHub Actions, then use a separate `create-release` job with proper permissions to handle publishing. This keeps builds clean and release creation centralized.

27. **Linux .deb/.rpm packages require author email in package.json** - electron-builder's FpmTarget (for .deb and .rpm) requires `author.email` in package.json for the package maintainer field. Using just `"author": "Name"` fails with "Please specify author 'email' in the application package.json". Use object form: `"author": { "name": "Name", "email": "email@domain.com" }`. AppImage builds don't require this, so errors only appear when building .deb/.rpm.

### Data Normalization

21. **Any code mapping grade names to price fields must match field-mapper.js** - The canonical mapping is `price1=UNC, price2=XF, price3=VF, price4=F` (defined in `field-mapper.js:121-126`). Any other code that writes pricing data (e.g., fast pricing, batch updates) MUST use this same mapping. A reversal silently corrupts data — Uncirculated prices appear in the Fair field and vice versa.

28. **Denomination plural forms are language- and country-specific** - The same canonical denomination (e.g., "centesimo") has different plural forms depending on the issuing country: Italian "centesimi" vs Spanish "centésimos". The default plural in `denomination-aliases.json` is the majority case; country-specific exceptions are stored in `src/data/issuer-denomination-overrides.json` keyed by the resolved Numista issuer code. When a new denomination search failure is reported, check whether it is an issuer-specific plural mismatch and add the override entry rather than modifying the alias defaults. The two files serve different purposes: `denomination-aliases.json` = spelling normalization (what are all the variant spellings?); `issuer-denomination-overrides.json` = search form selection by country (what exact singular/plural form does Numista use for this denomination in a given country?). The override is applied in `normalizeUnitForSearch(unit, value, issuerCode)` — issuer must be resolved BEFORE building the denomination query in `buildSearchParams()`.

## 6. JSDOC DOCUMENTATION STANDARDS

**When to Add JSDoc:**
- All public/exported functions
- All class methods
- All IPC handlers
- When modifying a function's signature

**Required Tags:**
- `@param {type} name - description` for each parameter
- `@returns {type} description` for non-void returns
- `@throws {Error} description` if function can throw
- `@async` for async functions

**Format:**
```javascript
/**
 * Brief description of what the function does
 * @param {string} param1 - Description of param1
 * @param {Object} options - Configuration options
 * @param {boolean} options.flag - Description of flag
 * @returns {Promise<Object>} Description of return value
 * @throws {Error} When validation fails
 */
```

**DO NOT:**
- Document obvious getters/setters
- Add JSDoc to private helper functions (use // comments instead)
- Duplicate information already clear from code
