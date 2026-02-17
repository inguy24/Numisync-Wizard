/**
 * NumiSync Wizard MCP Server
 *
 * Provides on-demand access to project knowledge without reading large source files.
 * Registered in c:\numismat-enrichment\.claude\settings.json as "numisync" MCP server.
 *
 * Tools:
 *   get_ipc_handlers(filter?)       — IPC handler table from IPC-HANDLERS-QUICK-REF.md
 *   get_module_api(module_name)     — @fileoverview JSDoc block from src/modules/
 *   search_lessons(keyword)         — Full-text search across CLAUDE.md §5 lessons
 *   get_recent_changelog(n?)        — Last N entries from docs/CHANGELOG.md
 *   get_database_schema(table?)     — OpenNumismat schema from PROJECT-REFERENCE.md
 *   get_denomination_aliases(unit)  — Aliases and plural forms from denomination-aliases.json
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Absolute path to the numismat-enrichment project root (parent of mcp/)
const PROJECT_ROOT = path.join(__dirname, "..");

/**
 * Read a project file by path relative to PROJECT_ROOT.
 * @param {string} relPath - Path relative to numismat-enrichment/
 * @returns {string} File contents as UTF-8 string
 * @throws {Error} If file does not exist
 */
function readProjectFile(relPath) {
  const absPath = path.join(PROJECT_ROOT, relPath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`File not found: ${relPath}`);
  }
  return fs.readFileSync(absPath, "utf-8");
}

// ---------------------------------------------------------------------------
// MCP Server setup
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "numisync",
  version: "1.0.0",
});

// ---------------------------------------------------------------------------
// Tool 1: get_ipc_handlers
// ---------------------------------------------------------------------------

server.tool(
  "get_ipc_handlers",
  "Search IPC handlers by channel name or module. Returns rows from IPC-HANDLERS-QUICK-REF.md " +
    "without reading the 3,420-line index.js. Omit filter to return the full reference.",
  {
    filter: z
      .string()
      .optional()
      .describe(
        "Optional keyword to filter by channel name or module (case-insensitive). " +
          "Examples: 'search', 'cache', 'license', 'opennumismat-db.js'"
      ),
  },
  async ({ filter }) => {
    const content = readProjectFile("docs/reference/IPC-HANDLERS-QUICK-REF.md");

    if (!filter) {
      return { content: [{ type: "text", text: content }] };
    }

    const kw = filter.toLowerCase();
    // Split into domain sections at each ## heading
    const sections = content.split(/(?=^## )/m);
    const matchingSections = [];

    for (const section of sections) {
      const lines = section.split("\n");
      // Table data rows start with "| `" (channel names are backtick-quoted)
      const matchingRows = lines.filter(
        (l) => l.startsWith("| `") && l.toLowerCase().includes(kw)
      );
      if (matchingRows.length > 0) {
        const heading = lines[0]; // ## Domain heading
        const tableHeader = lines.find((l) => l.startsWith("| Channel"));
        const separator = lines.find(
          (l) => l.startsWith("|---") || l.startsWith("| ---")
        );
        matchingSections.push(
          [heading, tableHeader, separator, ...matchingRows]
            .filter(Boolean)
            .join("\n")
        );
      }
    }

    const output =
      matchingSections.length > 0
        ? matchingSections.join("\n\n")
        : `No IPC handlers found matching "${filter}".`;

    return { content: [{ type: "text", text: output }] };
  }
);

// ---------------------------------------------------------------------------
// Tool 2: get_module_api
// ---------------------------------------------------------------------------

server.tool(
  "get_module_api",
  "Returns the @fileoverview JSDoc block from a src/modules/ file, showing exported functions, " +
    "dependencies, storage paths, and callers. Avoids reading the full module source.",
  {
    module_name: z
      .string()
      .describe(
        "Module filename. Extension optional. Examples: 'numista-api.js', 'api-cache', 'field-mapper'"
      ),
  },
  async ({ module_name }) => {
    const name = module_name.endsWith(".js") ? module_name : `${module_name}.js`;
    const modulesDir = path.join(PROJECT_ROOT, "src", "modules");
    const modulePath = path.join(modulesDir, name);

    if (!fs.existsSync(modulePath)) {
      const available = fs
        .readdirSync(modulesDir)
        .filter((f) => f.endsWith(".js"))
        .join(", ");
      return {
        content: [
          {
            type: "text",
            text: `Module "${name}" not found. Available modules: ${available}`,
          },
        ],
      };
    }

    const source = fs.readFileSync(modulePath, "utf-8");
    // Extract the first /** ... */ block (the @fileoverview JSDoc)
    const match = source.match(/\/\*\*[\s\S]*?\*\//);
    if (!match) {
      return {
        content: [
          {
            type: "text",
            text: `Module "${name}" has no JSDoc block at the top. Read the file directly.`,
          },
        ],
      };
    }

    return { content: [{ type: "text", text: match[0] }] };
  }
);

// ---------------------------------------------------------------------------
// Tool 3: search_lessons
// ---------------------------------------------------------------------------

server.tool(
  "search_lessons",
  "Full-text search across all lessons in CLAUDE.md §5 (Lessons Learned). " +
    "Returns matching lesson entries grouped by category. " +
    "Avoids scanning all 28 lessons when only a subset is relevant.",
  {
    keyword: z
      .string()
      .describe(
        "Search term to find relevant lessons (case-insensitive). " +
          "Examples: 'denomination', 'emoji', 'license', 'image', 'ipc'"
      ),
  },
  async ({ keyword }) => {
    const content = readProjectFile("CLAUDE.md");
    const kw = keyword.toLowerCase();

    // Extract §5 (between "## 5. LESSONS LEARNED" and "## 6.")
    const section5Match = content.match(
      /## 5\. LESSONS LEARNED[\s\S]*?(?=\n## 6\.)/
    );
    if (!section5Match) {
      return {
        content: [
          {
            type: "text",
            text: "Could not parse §5 Lessons Learned section from CLAUDE.md.",
          },
        ],
      };
    }

    const section5 = section5Match[0];
    const lines = section5.split("\n");
    const results = [];
    let currentSubsection = "";

    for (const line of lines) {
      if (line.startsWith("### ")) {
        // Track current category heading
        currentSubsection = line;
      } else if (/^\d+\.\s+\*\*/.test(line) && line.toLowerCase().includes(kw)) {
        // Emit the category heading once before the first match in this category
        if (
          results.length === 0 ||
          results[results.length - 1] !== currentSubsection
        ) {
          if (currentSubsection) results.push(currentSubsection);
        }
        results.push(line);
      }
    }

    const output =
      results.length > 0
        ? results.join("\n\n")
        : `No lessons found matching "${keyword}". ` +
          `Try broader terms like 'api', 'database', 'settings', 'build', 'image', 'ipc'.`;

    return { content: [{ type: "text", text: output }] };
  }
);

// ---------------------------------------------------------------------------
// Tool 4: get_recent_changelog
// ---------------------------------------------------------------------------

server.tool(
  "get_recent_changelog",
  "Returns the last N changelog entries from docs/CHANGELOG.md. " +
    "Each entry includes date, files changed, and summary. " +
    "Avoids loading the full changelog for routine recent-changes context.",
  {
    n: z
      .number()
      .int()
      .min(1)
      .max(20)
      .optional()
      .describe("Number of recent entries to return. Default: 5. Max: 20."),
  },
  async ({ n = 5 }) => {
    const content = readProjectFile("docs/CHANGELOG.md");
    const limit = n ?? 5;

    // Entries are table rows: lines starting with "| " that are not the
    // header row (| Date |) or separator row (|---) or section title
    const lines = content.split("\n");
    const tableRows = lines.filter(
      (l) =>
        l.startsWith("| ") &&
        !l.startsWith("| Date") &&
        !l.startsWith("|---") &&
        !l.startsWith("| Fix History") &&
        l.trim() !== "|"
    );

    const recent = tableRows.slice(0, limit);
    if (recent.length === 0) {
      return {
        content: [{ type: "text", text: "No changelog entries found." }],
      };
    }

    const header =
      "| Date | Files | Summary |\n|------|-------|---------|";
    const output = `${header}\n${recent.join("\n")}`;
    return { content: [{ type: "text", text: output }] };
  }
);

// ---------------------------------------------------------------------------
// Tool 5: get_database_schema
// ---------------------------------------------------------------------------

server.tool(
  "get_database_schema",
  "Returns the OpenNumismat database schema from PROJECT-REFERENCE.md. " +
    "Documents coins (109 columns), photos, images, and 10 supporting tables. " +
    "Avoids reading source code to determine column names and FK relationships.",
  {
    table: z
      .string()
      .optional()
      .describe(
        "Optional table name to filter results. " +
          "Examples: 'coins', 'photos', 'images', 'tags'. " +
          "Omit to return the full schema section."
      ),
  },
  async ({ table }) => {
    const content = readProjectFile("docs/reference/PROJECT-REFERENCE.md");

    // Find the DATABASE-SCHEMA section (ends at next ## or end of file)
    const schemaMatch = content.match(
      /## OpenNumismat Database Schema[\s\S]*?(?=\n## (?!#)|\n?$)/
    );
    if (!schemaMatch) {
      return {
        content: [
          {
            type: "text",
            text: "DATABASE-SCHEMA section not found in PROJECT-REFERENCE.md. " +
              "It may have been removed or renamed.",
          },
        ],
      };
    }

    const schema = schemaMatch[0];

    if (!table) {
      return { content: [{ type: "text", text: schema }] };
    }

    // Find the specific table subsection (### heading)
    const tableRegex = new RegExp(
      `### [^\n]*${table.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^\n]*[\\s\\S]*?(?=\\n### |\\n## |$)`,
      "i"
    );
    const tableMatch = schema.match(tableRegex);

    if (!tableMatch) {
      // List available subsections
      const subsections = [...schema.matchAll(/^### (.+)$/gm)].map(
        (m) => m[1]
      );
      const available =
        subsections.length > 0
          ? subsections.join(", ")
          : "(no ### subsections found)";
      return {
        content: [
          {
            type: "text",
            text:
              `Table "${table}" not found in schema. ` +
              `Available subsections: ${available}\n\n` +
              `Full schema:\n\n${schema}`,
          },
        ],
      };
    }

    return { content: [{ type: "text", text: tableMatch[0] }] };
  }
);

// ---------------------------------------------------------------------------
// Tool 6: get_denomination_aliases
// ---------------------------------------------------------------------------

server.tool(
  "get_denomination_aliases",
  "Looks up a denomination in denomination-aliases.json. " +
    "Returns the canonical form, all known spelling aliases, and the default plural form " +
    "used in Numista search queries. Also check issuer-denomination-overrides.json for " +
    "country-specific plural/singular exceptions (e.g. Italian centesimi vs Spanish centésimos).",
  {
    unit: z
      .string()
      .describe(
        "Denomination to look up — any spelling variant works. " +
          "Examples: 'kopeck', 'kopeks', 'pfennig', 'centavo', 'haléřů', 'öre'"
      ),
  },
  async ({ unit }) => {
    const raw = readProjectFile("src/data/denomination-aliases.json");
    const aliasMap = JSON.parse(raw);
    const kw = unit.toLowerCase().trim();

    const results = [];
    for (const [canonical, entry] of Object.entries(aliasMap)) {
      // Skip comment/section keys (start with _)
      if (canonical.startsWith("_")) continue;
      // Skip non-object values (section labels)
      if (typeof entry !== "object" || !Array.isArray(entry.aliases)) continue;

      const canonicalLower = canonical.toLowerCase();
      const matchesCanonical = canonicalLower === kw;
      const matchesAlias = entry.aliases.some((a) => a.toLowerCase() === kw);

      if (matchesCanonical || matchesAlias) {
        results.push({ canonical, plural: entry.plural, aliases: entry.aliases });
      }
    }

    if (results.length === 0) {
      return {
        content: [
          {
            type: "text",
            text:
              `No denomination found matching "${unit}". ` +
              `Try a variant spelling or check src/data/denomination-aliases.json directly. ` +
              `Also check src/data/issuer-denomination-overrides.json for country-specific forms.`,
          },
        ],
      };
    }

    const output = results
      .map(
        (r) =>
          `**Canonical:** ${r.canonical}\n` +
          `**Default plural (Numista search):** ${r.plural}\n` +
          `**All aliases:** ${r.aliases.join(", ")}`
      )
      .join("\n\n---\n\n");

    return { content: [{ type: "text", text: output }] };
  }
);

// ---------------------------------------------------------------------------
// Start server on stdio
// ---------------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);
