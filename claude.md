# CRITICAL OPERATING PROCEDURES

## 1. DOCUMENTATION HIERARCHY
- **Read `docs/PROJECT-REFERENCE.md`** for architecture, IPC handlers, data flow when implementing features
- **Read `docs/PHASE3-WORK-PLAN.md`** for current work items and priorities
- **Update `docs/CHANGELOG.md`** after completing fixes or features
- **Update `docs/PROJECT-REFERENCE.md`** if task completion changes project status, phase progress, or architecture
- **Archive completed work plans** to `docs/archive/` with `-COMPLETE` suffix (e.g., `PHASE2-WORK-PLAN-COMPLETE.md`)
- **NEVER** assume project state; verify against documentation first

## 2. CODING & REPOSITORY STANDARDS
- **LOCATION:** All source files reside in `/src` and its sub-directories
- **NO SNIPPETS:** Never provide code snippets. Implement changes directly into relevant files
- **INTEGRATE:** All HTML goes in index.html, all renderer JS in app.js, all main process code in index.js
- **NEVER** create standalone UI component files - integrate into existing files
- **API SOURCE:** Use @swagger.yaml for all Numista API documentation

## 3. EMOJI & ENCODING INTEGRITY
- **STRICT ADHERENCE:** Follow @EMOJI-ENCODING-GUIDANCE.md for all emoji handling
- **VERIFICATION:** After writing any file with emojis, run `file -i <filename>` to verify encoding
- **NEVER** use Write/Edit tools on sections containing emojis - use Python binary operations or bash sed
- **Files with emojis:** index.html, app.js

## 4. TOKEN & LOOP SAFETY
- **TOKEN SAFETY:** If a solution fails twice, STOP. Report the failure and ask for clarification
- **NO LOOPS:** Do not repeatedly attempt the same fix
- **PROFESSIONAL TONE:** Maintain professional demeanor regardless of user style

## 5. LESSONS LEARNED (Critical Bugs Avoided)

1. **API returns array directly** - Numista `/types/{id}/issues` returns an array, not `{issues: []}`. Always check actual response format.

2. **Always persist status to database** - In-memory cache updates alone don't survive restarts. Write to note field.

3. **Read back metadata after write** - `ensureValidMetadata` fills required fields; read back to get complete structure.

4. **Check ALL icon rendering functions** - Different data types use different functions (getDataTypeIcon vs getPricingIcon).

5. **OpenNumismat image column mapping** - `obverseimg`/`reverseimg` reference `photos` table, NOT `images` table. `coins.image` references `images` table (composite thumbnails).

6. **Dead code can silently break features** - Method calls guarded by `if (obj)` still throw if method doesn't exist on obj.

7. **Null values ARE data in set comparisons** - When checking if field "varies", null/empty must count as distinct value.

8. **Match IPC return value format** - Always check how existing code handles returns before writing new consumers. IPC responses often wrap data.

9. **Two settings systems exist** - Phase 1 app settings (`getAppSettings`) vs Phase 2 collection settings (`getSettings`) are different channels.

10. **Always update UI after async data loads** - Don't rely on initialization-time updates; refresh after data actually loads.

11. **Infrastructure without integration is invisible** - Having all pieces doesn't matter if they're never connected. Trace complete flow.

12. **Windows file locks need PowerShell** - Node.js `fs.openSync` uses shared access. Use `[System.IO.File]::Open()` with `FileShare.None` for exclusive lock test.

13. **Parse stored data before use** - Data stored in fields (e.g., JSON in note field) must be explicitly parsed and attached to objects. `get-coins` must parse metadata so `coin.metadata` is available for matching. Fallback defaults must match actual defaults defined elsewhere.

14. **Propagate user choices through multi-step flows** - When a user makes selections (e.g., checkboxes), those choices must be passed through the entire chain of function calls. Don't hardcode defaults in downstream handlers - accept the selection state from upstream.

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
