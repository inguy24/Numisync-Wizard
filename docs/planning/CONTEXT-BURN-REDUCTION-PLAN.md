# Plan: Reduce AI Context Burn in NumiSync Wizard

**Created:** 2026-02-17
**Status:** COMPLETE — All 8 fixes done (2026-02-17)
**Scope:** Documentation improvements, emoji isolation, and MCP server to reduce per-session context consumption

---

## Implementation Context

### Key File Paths (All Relative to `numismat-enrichment/`)

| File | LOC | Role |
|------|-----|------|
| `CLAUDE.md` | 174 | AI operating procedures — Fixes 1 & 4 complete |
| `src/main/index.js` | 3,420 | Main process + all ~50 IPC handlers — target for Fix 7 |
| `src/renderer/app.js` | 7,756 | All UI logic — emoji-restricted, target for Fix 8 |
| `src/renderer/index.html` | 1,186 | UI markup — emoji-restricted |
| `src/modules/` | 18 files | Business logic modules — target for Fix 3 |
| `docs/reference/PROJECT-REFERENCE.md` | 583 | Architecture reference — target for Fix 5 |
| `docs/reference/` | — | Target location for new IPC-HANDLERS-QUICK-REF.md (Fix 2) |

### Current CLAUDE.md Structure (updated after Fixes 1 & 4)
- **QUICK CONTEXT** — 13-bullet orientation block (added by Fix 1)
- §0: GitHub Operations (WebFetch warning, gh CLI commands)
- §1: Documentation Hierarchy — task-based reading guide table (updated by Fix 1)
- §2: Coding & Repository Standards
- §3: Emoji & Encoding Integrity (constraint applies to app.js and index.html — updated by Fix 8)
- §4: Token & Loop Safety
- §5: Lessons Learned — 28 lessons in 8 categories with ### subheadings (updated by Fix 4)
- §6: JSDoc Standards

### Emoji Constraint — Current State
`CLAUDE.md §3` states: **NEVER use Write/Edit tools on sections containing emojis — use Python binary operations or bash sed.**
Affected files: `src/renderer/app.js`, `src/renderer/index.html`
After Fix 8, this constraint should only apply to `src/renderer/ui-strings.js`.

### Existing Modules in `src/modules/` (for Fix 3 @fileoverview JSDoc)
1. `opennumismat-db.js` — SQLite database access, image storage, backups (769 LOC)
2. `numista-api.js` — Numista API wrapper + persistent caching + rate limits (790 LOC)
3. `field-mapper.js` — Field mapping execution, data transformation (355 LOC)
4. `default-field-mapping.js` — Field definitions, 45+ sources, data transform logic (796 LOC)
5. `metadata-manager.js` — note field JSON parsing/writing (394 LOC)
6. `settings-manager.js` — Settings file I/O with migration logic (491 LOC)
7. `api-cache.js` — Persistent disk cache with atomic locking (295 LOC)
8. `cache-lock.js` — Atomic file-based locking via Node.js (223 LOC)
9. `progress-tracker.js` — Enrichment progress persistence & statistics (676 LOC)
10. `denomination-normalizer.js` — Unit aliases + plural form lookup (160 LOC)
11. `mintmark-normalizer.js` — Mint utilities (172 LOC)
12. `freshness-calculator.js` — Pricing age calculation (325 LOC)
13. `image-handler.js` — Image operations (250 LOC)
14. *(plus 5 additional utility modules — verify exact names before implementing Fix 3)*

### MCP Registration Location (Fix 6)
MCP servers for Claude Code are registered in `.claude/settings.json` or `settings.local.json` at the **repo root** (`c:\numismat-enrichment\.claude\`), not inside the project subfolder. Alternatively, a project-level `.mcp.json` in the project root is also supported. Verify the correct format for your Claude Code version before implementing.

---

## Root Causes Identified

### 1. CLAUDE.md §1 Forces Full-Document Reads on Every Feature Task
- `docs/reference/PROJECT-REFERENCE.md` is **29 KB / 583 lines** — required reading for any feature work
- No "quick context" header in CLAUDE.md; Claude must read README or other docs to understand the project
- No task-scoped reading guidance (every task reads the same 5 documents)

### 2. No IPC Handler Quick-Reference
- `src/main/index.js` is **3,420 lines** with ~50 IPC handlers intermixed with lifecycle code
- Any task touching main↔renderer communication requires reading large portions of index.js
- PROJECT-REFERENCE.md mentions IPC handlers but doesn't list their signatures

### 3. Module Internals Are Undocumented
- 18 modules in `src/modules/` — no exported function index exists
- Tasks touching caching, field mapping, database, or progress tracking require reading hundreds of lines of source
- No `@fileoverview` JSDoc blocks — Claude can't get a module summary without reading the file

### 4. The 28 Lessons Are a Linear Scan
- CLAUDE.md §5 has 28 lessons with no tags or categories
- Claude must scan all 28 on every task to find relevant ones (e.g., a build task shouldn't need to scan API lessons)

### 5. Monolithic Source Files
- `src/renderer/app.js`: **7,756 lines** — all UI logic in one file (emoji-restricted)
- `src/main/index.js`: **3,420 lines** — all IPC handlers in one file
- Any targeted edit requires reading large surrounding context

### 6. Emoji Constraint Adds Overhead
- Two critical files (`app.js`, `index.html`) cannot use standard Edit/Write tools
- Every edit requires Python binary operations or bash sed — adds explanation overhead and longer tool chains

### 7. No Database Schema Reference
- OpenNumismat DB schema (coins table, photos table, images table, column names) is not documented
- Lesson #5 ("obverseimg/reverseimg reference photos table, NOT images table") hints at how painful this is to re-learn
- Forces source code reading or trial/error

---

## Recommended Fixes (Ordered by ROI)

### Fix 1: Add "AI Quick Context" Header to CLAUDE.md (30 min, highest ROI)

Add a 20-30 line section at the **very top** of CLAUDE.md (before §0) that gives Claude instant project orientation without reading any other file:

```markdown
## QUICK CONTEXT (Read this first — replaces README for AI)
- **App:** NumiSync Wizard — Electron desktop app enriching OpenNumismat coin DB from Numista API
- **Stack:** Electron + vanilla JS (main: index.js, renderer: app.js + index.html), sql.js (SQLite), @polar-sh/sdk (licensing)
- **Version:** 1.0.0 — in Microsoft Store review as of Feb 2026
- **Main process:** src/main/index.js (3420 LOC, ~50 IPC handlers) + preload.js + logger.js + updater.js
- **Renderer:** src/renderer/app.js (7756 LOC) + index.html (1186 LOC) — emoji strings isolated to ui-strings.js
- **Modules:** src/modules/ (18 files) — see docs/reference/IPC-HANDLERS-QUICK-REF.md before reading source
- **Data files:** src/data/ — denomination-aliases.json, issuer-denomination-overrides.json, issuer-aliases.json
- **Settings:** Single file — numisync-wizard/settings.json in userData (see SETTINGS-CONSOLIDATION.md)
- **License:** Polar SDK — activate() on first entry, validate() for periodic checks (see Lesson 24)
- **Database:** OpenNumismat .db file — see DATABASE-SCHEMA section in PROJECT-REFERENCE.md
- **Changelog:** docs/CHANGELOG.md — read for recent changes before touching any module
- **DO NOT** read PROJECT-REFERENCE.md unless the task involves architecture or IPC changes
```

Also replace the current flat §1 with a **task-based reading guide**:

| Task Type | Read These |
|-----------|-----------|
| Bug fix in UI | CHANGELOG.md recent entries, then targeted source |
| New IPC handler | docs/reference/IPC-HANDLERS-QUICK-REF.md |
| Database query | DATABASE-SCHEMA section in PROJECT-REFERENCE.md |
| API/search change | swagger.yaml + Lessons (API & Search category) |
| Build/release | docs/guides/BUILD-GUIDE.md or INSTALLER-DISTRIBUTION-PLAN.md |
| Settings change | docs/reference/SETTINGS-CONSOLIDATION.md + Lesson 25 |
| Licensing | docs/guides/POLAR-*.md + Lesson 24 |
| Emoji/UI strings | src/renderer/ui-strings.js only — use Python binary ops |

**Files to modify:** `CLAUDE.md`

---

### Fix 2: Create IPC-HANDLERS-QUICK-REF.md (1-2 hours, high ROI)

Create `docs/reference/IPC-HANDLERS-QUICK-REF.md` by scanning `src/main/index.js` for all `ipcMain.handle(` calls. List each handler with:
- Channel name
- Parameters accepted (one line)
- Return value shape (one line)
- Which module in `src/modules/` it delegates to

Example format:
```markdown
| Channel | Params | Returns | Delegates To |
|---------|--------|---------|-------------|
| get-coins | { dbPath } | { coins: Coin[] } | opennumismat-db.js |
| search-numista | { query, issuer, category } | { results: Match[] } | numista-api.js |
| apply-enrichment | { coinId, data, fieldMap } | { success, updated } | field-mapper.js |
```

This eliminates the need to read index.js to understand the IPC API surface.

**Files to create:** `docs/reference/IPC-HANDLERS-QUICK-REF.md`
**Files to modify:** `CLAUDE.md` §1 task table (add reference to new file)

---

### Fix 3: Add @fileoverview JSDoc to All Modules (1 hour, medium ROI)

Add a `@fileoverview` comment block to the top of each of the 18 files in `src/modules/`. Format:

```javascript
/**
 * @fileoverview api-cache.js — Persistent disk-based cache for Numista API responses.
 *
 * Exports: getCached(key), setCached(key, data), clearCache(), getCacheStats()
 * Storage: userData/numisync-wizard/api-cache.json
 * Uses: cache-lock.js for atomic write operations
 * Called by: numista-api.js for all API responses
 */
```

Each `@fileoverview` block should include:
- One-line purpose description
- `Exports:` list of public functions with brief descriptions
- `Storage:` path if the module reads/writes files
- `Uses:` other modules it depends on
- `Called by:` which other modules/files invoke this one

This lets Claude understand a module's purpose and public API from a 5-line read instead of reading the whole file. None of these files contain emojis — standard Edit tool is safe.

**Files to modify:** All 18 files in `src/modules/`

---

### Fix 4: Categorize the 28 Lessons in CLAUDE.md (30 min, medium ROI)

Replace the flat numbered list in CLAUDE.md §5 with grouped categories using `###` subheadings. Lessons retain their original text but are reorganized:

```markdown
## 5. LESSONS LEARNED (Critical Bugs Avoided)

### API & Search (Numista)
[Lessons 1, 15, 16, 17, 18, 19, 20]

### Database & Data Persistence
[Lessons 2, 3, 5, 7, 13]

### IPC & Architecture
[Lessons 6, 8, 11, 14, 22]

### UI & Rendering
[Lessons 4, 10]

### Settings & Configuration
[Lessons 9, 25]

### Licensing (Polar SDK)
[Lesson 24]

### Build & CI/CD
[Lessons 26, 27]

### Data Normalization
[Lessons 21, 28]
```

Do not rewrite lesson text — only add category headings and reorder lessons under them.

**Files to modify:** `CLAUDE.md` §5
**Note:** CLAUDE.md does not contain emojis — standard Edit tool is safe.

---

### Fix 5: Add DATABASE-SCHEMA Section to PROJECT-REFERENCE.md (1 hour, high ROI)

Introspect the actual schema from `examples/mycollection.db` or `examples/test.db` using sql.js or sqlite3 CLI, then document it. Add a new section to `docs/reference/PROJECT-REFERENCE.md`:

```markdown
## OpenNumismat Database Schema

### coins table (primary coin records)
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| name | TEXT | Coin title/description |
| year | INTEGER | Gregorian year |
| mintmark | TEXT | |
| grade | TEXT | Condition grade string |
| image | BLOB | Composite thumbnail — references images table |
| obverseimg | INTEGER FK | → photos.id (NOT images table — see Lesson 5) |
| reverseimg | INTEGER FK | → photos.id (NOT images table — see Lesson 5) |
| note | TEXT | JSON metadata embedded here — parsed by metadata-manager.js |
| price1 | REAL | UNC price (see field-mapper.js:121-126) |
| price2 | REAL | XF price |
| price3 | REAL | VF price |
| price4 | REAL | F (Fair) price |
| ... | | (list remaining columns from actual schema) |

### photos table (high-resolution images)
- Stores full obverse/reverse image BLOBs
- Referenced by coins.obverseimg and coins.reverseimg

### images table (composite thumbnails)
- Stores composite thumbnail BLOBs
- Referenced by coins.image only
```

Use `PRAGMA table_info(coins)` against an example .db file to get the complete and accurate column list.

**Files to modify:** `docs/reference/PROJECT-REFERENCE.md`

---

### Fix 6: Create a Project MCP Server (4-8 hours, highest long-term ROI) — DONE 2026-02-17

A local MCP server lets Claude query the project's knowledge base on demand instead of reading entire files.

**MCP tools to implement:**

| Tool | Description | Replaces |
|------|-------------|---------|
| `get_ipc_handlers(filter?)` | List/search handlers by name or module | Reading index.js |
| `get_module_api(module_name)` | Exported functions + signatures for a module | Reading module source |
| `search_lessons(keyword)` | Full-text search across 28 lessons by topic | Scanning CLAUDE.md §5 |
| `get_recent_changelog(n?)` | Last N changelog entries | Reading CHANGELOG.md |
| `get_database_schema(table?)` | OpenNumismat table columns + types | Reading source + docs |
| `get_denomination_aliases(unit)` | Aliases and plural forms for a denomination | Reading JSON data files |

**Implementation approach:**
- Create `mcp/server.js` — Node.js MCP server using `@modelcontextprotocol/sdk`
- Data sources: parse `ipcMain.handle()` calls from index.js at startup; parse CLAUDE.md §5 lessons; parse CHANGELOG.md; load denomination-aliases.json; hardcode DB schema (or query live from examples/test.db)
- Registration: `c:\numismat-enrichment\.mcp.json` (`.claude/settings.json` schema rejects top-level `mcpServers`):
  ```json
  {
    "mcpServers": {
      "numisync": {
        "command": "node",
        "args": ["numismat-enrichment/mcp/server.js"]
      }
    }
  }
  ```
- Server auto-approved via `"enabledMcpjsonServers": ["numisync"]` in `.claude/settings.json`

**Files created:** `numismat-enrichment/mcp/server.js`, `numismat-enrichment/mcp/package.json`, `c:\numismat-enrichment\.mcp.json`
**Files modified:** `c:\numismat-enrichment\.claude\settings.json` (added `enabledMcpjsonServers`)

---

### Fix 7: Add #region Comments to index.js (30 min, low effort)

For `src/main/index.js`, add `// #region` / `// #endregion` block comments grouping IPC handlers by domain. This enables targeted reads of a specific domain without loading all 3,420 lines.

Suggested regions (verify against actual handler names in the file):
```javascript
// #region App Lifecycle & Window Management
// #region Database Operations
// #region Search & Enrichment
// #region Settings
// #region Licensing (Polar SDK)
// #region Image Handling
// #region Auto-Update
// #region Progress Tracking
```

`index.js` contains no emojis — standard Edit tool is safe.

**Files to modify:** `src/main/index.js`

---

### Fix 8: Emoji Isolation — Extract UI Strings to `ui-strings.js` (2-3 hours, outsized ROI)

The emoji encoding constraint is a compounding tax applied to the two largest files on every edit. The fix is to isolate all emoji-containing strings into one small dedicated file.

**Step 1:** Scan `app.js` and `index.html` for all emoji characters. Common patterns to search for:
- Unicode emoji ranges in string literals
- Status icons (✅, ❌, ⏭️, ⚠️, 🔍, 🪙, etc.)
- Use: `grep -P "[\x{1F300}-\x{1FFFF}]|[\x{2600}-\x{27BF}]" src/renderer/app.js`

**Step 2:** Create `src/renderer/ui-strings.js` as a plain object (no ES modules — renderer uses vanilla JS with script tags):

```javascript
// src/renderer/ui-strings.js
// EMOJI-RESTRICTED FILE: Use Python binary ops or bash sed to edit this file.
// All other renderer files are emoji-free after this extraction.
const UI_STRINGS = {
  STATUS_ENRICHED: '✅ Enriched',
  STATUS_SKIPPED: '⏭️ Skipped',
  STATUS_ERROR: '❌ Error',
  STATUS_PENDING: '⏳ Pending',
  ICON_COIN: '🪙',
  ICON_SEARCH: '🔍',
  // ... all other emoji strings found in scan
};
```

**Step 3:** In `app.js`, replace every inline emoji string with a `UI_STRINGS.*` reference. Use Python binary mode for the replacements since app.js currently contains emojis. After replacement, `app.js` itself becomes emoji-free.

**Step 4:** Add `ui-strings.js` as the first `<script>` tag in `index.html` (before `app.js`):
```html
<script src="ui-strings.js"></script>
<script src="app.js"></script>
```

**Step 5:** For `index.html` static display text (button labels, headings with emojis):
- Option A (preferred): add a `DOMContentLoaded` initializer in `app.js` that sets `textContent` from `UI_STRINGS`
- Option B: leave static display text in `index.html` as-is (it rarely changes), only extract dynamic JS usage

**Step 6:** Update `CLAUDE.md §3` to reflect the new scope:
```markdown
## 3. EMOJI & ENCODING INTEGRITY
- **STRICT ADHERENCE:** Follow @EMOJI-ENCODING-GUIDANCE.md for all emoji handling
- **EMOJI-RESTRICTED FILE:** src/renderer/ui-strings.js — use Python binary ops or bash sed
- **NEVER** use Write/Edit tools on ui-strings.js — it contains all emoji string constants
- **app.js and index.html are now emoji-free** — standard Edit/Write tools are safe
```

**Result:** Only `ui-strings.js` (~150 lines, rarely modified) retains the emoji restriction. `app.js` and `index.html` become fully editable with standard tools.

**Files to create:** `src/renderer/ui-strings.js`
**Files to modify:** `src/renderer/app.js` (replace inline emojis with UI_STRINGS refs), `src/renderer/index.html` (add script tag; optionally replace static emoji text), `CLAUDE.md §3`

---

## Implementation Priority

| Priority | Fix | Effort | Impact | Status |
|----------|-----|--------|--------|--------|
| 1 | Fix 1: CLAUDE.md Quick Context + task reading guide | 30 min | Immediate, every session | **DONE 2026-02-17** |
| 2 | Fix 4: Categorize 28 lessons | 30 min | Immediate, every session | **DONE 2026-02-17** |
| 3 | Fix 8: Emoji isolation → ui-strings.js | 2-3 hrs | Every edit to app.js | **DONE 2026-02-17** |
| 4 | Fix 7: #region comments in index.js | 30 min | Every main-process task | **DONE 2026-02-17** |
| 5 | Fix 2: IPC-HANDLERS-QUICK-REF.md | 2 hrs | Every IPC task | **DONE 2026-02-17** |
| 6 | Fix 5: DATABASE-SCHEMA in PROJECT-REFERENCE.md | 1 hr | Every DB task | **DONE 2026-02-17** |
| 7 | Fix 3: @fileoverview JSDoc on modules | 1 hr | Every module task | **DONE 2026-02-17** |
| 8 | Fix 6: MCP Server | 4-8 hrs | Ongoing, compound ROI | **DONE 2026-02-17** |

**All 8 fixes are complete (2026-02-17).** The context burn reduction plan is fully implemented.

---

## Future Phase: Code Splitting

Once emoji isolation is complete (Fix 8 is a prerequisite), both monolithic files become candidates for proper splitting. This is a separate phase — more structural risk, should be done deliberately in a dedicated session.

### `src/main/index.js` → Domain-split IPC modules (Low risk, no bundler needed)

Standard Node.js `require()` pattern:

| New File | IPC Handler Domain |
|----------|-------------------|
| `src/main/ipc-database.js` | get-coins, open-database, close-database, backup-database |
| `src/main/ipc-search.js` | search-numista, apply-enrichment, batch-enrich |
| `src/main/ipc-settings.js` | get-settings, save-settings, get-app-settings, save-app-settings |
| `src/main/ipc-licensing.js` | activate-license, validate-license, deactivate-license |
| `src/main/ipc-images.js` | get-coin-image, save-image, export-image |
| `src/main/index.js` | App lifecycle only (~200 lines), requires all above |

Result: Each file ~400-600 lines, targeted reads instead of navigating 3,420 lines.

### `src/renderer/app.js` → Feature-split UI modules (Medium risk, requires bundler)

After emoji isolation, `app.js` can be split into logical UI feature files. Requires adding `esbuild` to compile modules into a renderer bundle (common in Electron apps, minimal build complexity):

| New File | UI Feature Area |
|----------|----------------|
| `src/renderer/ui-search.js` | Search panel logic, result display |
| `src/renderer/ui-settings.js` | Settings screens, field mapping UI |
| `src/renderer/ui-merge.js` | Merge/apply enrichment flows |
| `src/renderer/ui-progress.js` | Progress tracking, batch status display |
| `src/renderer/ui-licensing.js` | License activation/validation UI |
| `src/renderer/app.js` | Entry point, wires modules together (~500 lines) |

Result: Each file ~800-1,200 lines. Claude reads only the relevant feature module per task.

**Prerequisite:** Fix 8 (emoji isolation) must be complete before beginning code splitting.

---

## Verification

**After fixes 1, 4 (documentation only) — COMPLETE 2026-02-17:**
- Start a new Claude session with a typical task
- Claude should orient itself from CLAUDE.md alone in under 5 reads
- Claude should NOT need to load README or PROJECT-REFERENCE.md for routine bug fixes

**After Fix 8 (emoji isolation):**
- Ask Claude to edit a UI feature in app.js
- It should use the standard Edit tool directly — no Python binary workarounds
- Verify `ui-strings.js` loads before `app.js` in the browser and `UI_STRINGS` is accessible

**After fixes 2, 5 (reference docs):**
- Ask Claude "what IPC handler handles database backup?" — it should answer from IPC-HANDLERS-QUICK-REF.md without reading index.js
- Ask Claude about the OpenNumismat image columns — it should cite the DATABASE-SCHEMA section without reading source

**After Fix 6 (MCP):**
- Claude should be able to call `get_ipc_handlers("search")` and get results without reading index.js
- Claude should be able to call `search_lessons("denomination")` and get lessons 17, 18, 28 without scanning all 28

**After Future Phase (code splitting):**
- Any renderer task reads 1 of 5 feature files (~1,000 lines) instead of 7,756 lines
- Any main-process task reads 1 of 5 IPC domain files (~500 lines) instead of 3,420 lines
