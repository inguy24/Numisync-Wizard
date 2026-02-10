# File Organization Guide

**Purpose:** Single source of truth for where files belong in the NumiSync Wizard project.
**Audience:** Developers, AI assistants, contributors
**Status:** Living document - update when adding new file types or discovering new compliance requirements

---

## Compliance Requirements (MANDATORY)

### SignPath Foundation Code Signing
**Files MUST remain in root directory:**
- `LICENSE.txt` - OSI-approved license (SignPath verifies this)
- `README.md` - Must contain Code Signing Policy section
- `EULA.txt` - Bundled as extraResource for NSIS installer
- `electron-builder.yml` - Build configuration
- `package.json` - Project manifest

**Rationale:** SignPath Foundation requires these files in standard locations for automated verification of open-source projects.

### Electron Builder / NSIS Installer
**Files referenced in build process:**
- `build/icon.ico` - Windows application icon
- `build/icon.png` - Linux/development icon
- `build/eula/eula-windows.rtf` - NSIS installer EULA screen
- `build/installer.nsh` - NSIS custom installation script
- `EULA.txt` - Bundled as extraResource (accessible at runtime)

**Do NOT bundle:**
- `swagger.yaml` - Developer reference only, not needed at runtime
- Documentation files - Not needed in distributed app

---

## Directory Structure Rules

### Root Directory
**Only these file types belong in root:**
1. **Configuration files:** `package.json`, `package-lock.json`, `electron-builder.yml`, `.gitignore`, `.editorconfig`
2. **Legal/compliance files:** `LICENSE.txt`, `EULA.txt`, `README.md`
3. **AI assistant instructions:** `CLAUDE.md`

**Never in root:**
- Source code (goes in `src/`)
- Documentation (goes in `docs/`)
- Build artifacts (goes in `dist/`, ignored by git)
- User data (goes in `examples/` if tracked, or ignored)
- Logo/icon files (goes in `build/` or `src/renderer/images/`)

### src/ - Application Source Code
```
src/
├── main/           # Electron main process
├── renderer/       # UI code (HTML, CSS, JS)
├── resources/      # Runtime bundled resources (user-manual.html)
├── data/           # Runtime data files (JSON configs, aliases)
└── modules/        # Business logic modules
```

**Rules:**
- ALL executable code goes in `src/`
- Runtime resources (loaded by app) go in `src/resources/`
- Data files loaded at runtime go in `src/data/`
- NO documentation files in `src/` (they go in `docs/`)

### build/ - Build Resources
```
build/
├── icon.ico        # Windows icon
├── icon.png        # Linux/dev icon
├── icon.icns       # macOS icon (if created)
├── icons/          # Multi-resolution PNGs for Linux
├── eula/           # Installer-specific EULA formats
└── installer.nsh   # NSIS custom script
```

**Rules:**
- Build-time resources only (icons, installer scripts)
- Files used by electron-builder during packaging
- NOT for source code or application resources

### docs/ - Documentation & GitHub Pages
```
docs/
├── index.html              # GitHub Pages homepage
├── _config.yml             # Jekyll configuration
├── reference/              # Architecture & API docs
│   ├── FILE-ORGANIZATION.md    # THIS FILE
│   ├── PROJECT-REFERENCE.md
│   ├── swagger.yaml
│   └── EMOJI-ENCODING-GUIDANCE.md
├── guides/                 # How-to guides
│   ├── BUILD-GUIDE.md
│   └── INSTALLER-DISTRIBUTION-PLAN.md
├── planning/               # Current work plans
├── assets/                 # Design files + website assets
├── archive/                # Completed work plans
└── CHANGELOG.md            # Version history
```

**Rules:**
- Project documentation ONLY (not bundled with app)
- Root-level files for GitHub Pages website
- Subdirectories for organized documentation by purpose
- Design source files (.ai) go in `assets/`
- Completed work plans move to `archive/` with `-COMPLETE` suffix

### examples/ - Sample Data
```
examples/
├── mycollection.db         # Sample collection
└── test.db                 # Test database
```

**Rules:**
- Example/test databases tracked in git for multi-machine sync
- User working databases should NOT be in project directory
- .gitignore excludes root-level `*.db` but allows `examples/*.db`

### scripts/ - Build & Version Scripts
```
scripts/
├── validate-version.js     # Pre-version validation
└── post-version.js         # Post-version reminders
```

**Rules:**
- npm lifecycle scripts only
- Run during `npm version` or build process
- NOT for application logic (that goes in `src/modules/`)

---

## File Type Decision Tree

### "Where should I put this file?"

**Is it source code that runs in the app?**
→ `src/main/`, `src/renderer/`, or `src/modules/`

**Is it a runtime resource loaded by the app?**
→ `src/resources/` (e.g., user-manual.html)

**Is it a data file the app reads at runtime?**
→ `src/data/` (e.g., denomination-aliases.json)

**Is it an icon or build resource?**
→ `build/` (e.g., icon.ico, installer.nsh)

**Is it documentation for developers?**
→ `docs/reference/` (architecture, API specs)

**Is it a how-to guide?**
→ `docs/guides/` (BUILD-GUIDE.md, installation instructions)

**Is it a work plan or roadmap?**
→ `docs/planning/` (active) or `docs/archive/` (completed)

**Is it a design source file?**
→ `docs/assets/` (logo.ai files)

**Is it required for compliance?**
→ Root directory (LICENSE.txt, README.md, EULA.txt)

**Is it configuration for tools?**
→ Root directory (package.json, electron-builder.yml, .gitignore)

**Is it example/test data?**
→ `examples/` (sample databases)

---

## Common Mistakes to Avoid

### ❌ Don't Do This
- Putting documentation in `src/` → Goes in `docs/`
- Putting source code in root → Goes in `src/`
- Putting runtime resources in `docs/` → Goes in `src/resources/`
- Creating new top-level directories → Use existing structure
- Putting logo files in root → Goes in `build/` or `src/renderer/images/`
- Bundling developer docs (swagger.yaml) → Only bundle runtime resources

### ✅ Do This Instead
- Documentation → `docs/reference/`, `docs/guides/`, or `docs/planning/`
- Runtime resources → `src/resources/`
- Build resources → `build/`
- Example data → `examples/`
- Keep root directory minimal and focused on compliance/config

---

## .gitignore Patterns

**Tracked:**
- All source code in `src/`
- All documentation in `docs/`
- Example databases in `examples/`
- Build resources in `build/`

**Ignored:**
- `node_modules/` - Dependencies
- `dist/` - Build artifacts
- `*.log` - Log files
- `/*.db` - Root-level databases (user data)
- `/*_settings.json` - Root-level settings files
- `/*_enrichment_progress.json` - Root-level progress files
- `.claude/` - AI assistant data

**Pattern:** `!examples/*.db` explicitly allows tracking example databases

---

## When to Update This Document

Update this guide when:
1. Adding new compliance requirements (e.g., new code signing rules)
2. Creating new directory types
3. Discovering new categories of files
4. Changing build/packaging requirements
5. After major reorganizations

**References:**
- CLAUDE.md - References this file for file placement rules
- PROJECT-REFERENCE.md - References this file for project structure
