#!/usr/bin/env node
/**
 * Extract user-facing changelog entries for a GitHub release.
 *
 * Usage:  node scripts/extract-release-notes.js [version]
 * Reads:  docs/CHANGELOG.md
 * Output: Markdown for GitHub release description (stdout)
 *
 * Finds the ## v{version} section in CHANGELOG.md, filters out rows
 * with Type=Internal, and formats Features and Bug Fixes as bullet lists.
 * Used by .github/workflows/build.yml in the create-release job.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const version      = process.argv[2] || require('../package.json').version;
const changelogPath = path.join(__dirname, '..', 'docs', 'CHANGELOG.md');

if (!fs.existsSync(changelogPath)) {
  process.stdout.write('CHANGELOG.md not found — no release notes generated.\n');
  process.exit(0);
}

const lines = fs.readFileSync(changelogPath, 'utf8').split('\n');

// Find the ## v{version} section (with or without the *(unreleased)* suffix)
const headerPatterns = [
  `## v${version}`,
  `## v${version} *(unreleased)*`,
];
const startIdx = lines.findIndex(l => headerPatterns.includes(l.trim()));

if (startIdx === -1) {
  process.stdout.write(`No changelog section found for v${version} — no release notes generated.\n`);
  process.exit(0);
}

// Find end of this section (next ## heading or end of file)
let endIdx = lines.length;
for (let i = startIdx + 1; i < lines.length; i++) {
  if (lines[i].startsWith('## ')) { endIdx = i; break; }
}

const sectionLines = lines.slice(startIdx + 1, endIdx);

// Parse table rows — columns: Date | Type | Files | Summary
const features = [];
const fixes    = [];

for (const line of sectionLines) {
  if (!line.startsWith('| '))                      continue;
  if (line.startsWith('| Date') || line.startsWith('|---')) continue;

  const cols = line.split('|').map(s => s.trim()).filter(s => s !== '');
  if (cols.length < 4) continue;

  const type    = cols[1].toLowerCase();
  const summary = cols.slice(3).join('|').trim();

  if (type === 'internal') continue;

  // Extract **Title** and first sentence of description for concise bullets.
  // Summary format expected: **Title** — description...
  const titleMatch = summary.match(/^\*\*(.+?)\*\*\s*[-—]\s*([\s\S]+)/);
  let entry;

  if (titleMatch) {
    const title    = titleMatch[1];
    let   desc     = titleMatch[2].replace(/\n/g, ' ').trim();
    // Truncate at first sentence break within 200 chars
    const breakIdx = desc.search(/\.\s/);
    if (breakIdx > 0 && breakIdx < 200) {
      desc = desc.slice(0, breakIdx + 1);
    } else if (desc.length > 200) {
      desc = desc.slice(0, 197) + '...';
    }
    entry = `- **${title}** — ${desc}`;
  } else {
    entry = `- ${summary.length > 200 ? summary.slice(0, 197) + '...' : summary}`;
  }

  if      (type === 'feature') features.push(entry);
  else if (type === 'fix')     fixes.push(entry);
}

if (features.length === 0 && fixes.length === 0) {
  process.stdout.write(`No user-facing changes documented for v${version}.\n`);
  process.exit(0);
}

const sections = [];
if (features.length > 0) sections.push('### New Features\n\n' + features.join('\n'));
if (fixes.length    > 0) sections.push('### Bug Fixes\n\n'    + fixes.join('\n'));

process.stdout.write(sections.join('\n\n') + '\n');
