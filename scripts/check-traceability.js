#!/usr/bin/env node
/*
 * Traceability checker — Hybrid SDD+ADD
 *
 * Maps Functional Requirement IDs (FR-FExx-yyy) declared in each feature
 * SPEC.md to `@spec` tags found in the source code, and reports coverage.
 *
 * Why: the playbook (ch. 5.5.4 & 7.3) requires implementation code to trace
 * back to spec requirements so the Traceability Matrix is verifiable, not
 * just aspirational. This is the automated half of the Consistency Gate.
 *
 * Usage:
 *   node scripts/check-traceability.js            # report only (exit 0)
 *   node scripts/check-traceability.js --enforce  # fail (exit 1) if an
 *                                                 # implemented feature is
 *                                                 # below the threshold
 *   node scripts/check-traceability.js --enforce --min=70
 *
 * A feature is considered "implemented" when its TASKS.md status is
 * READY FOR REVIEW / IN PROGRESS / COMPLETE. NOT STARTED features are
 * reported but never enforced.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SPECS_DIR = path.join(ROOT, '.sdd', 'specs');
const CODE_DIRS = [
  path.join(ROOT, 'backend', 'src'),
  path.join(ROOT, 'frontend', 'src'),
];

const ID_RE = /\b(?:FR|BR|AC)-FE\d{2}-\d{3}\b/g;
const FR_RE = /\bFR-FE\d{2}-\d{3}\b/g;
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git', 'coverage']);

const args = process.argv.slice(2);
const enforce = args.includes('--enforce');
const minArg = args.find((a) => a.startsWith('--min='));
const MIN = minArg ? Number(minArg.split('=')[1]) : 70;

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), acc);
    } else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      acc.push(path.join(dir, entry.name));
    }
  }
  return acc;
}

// 1. Collect every spec ID that appears on a line containing `@spec`.
const taggedIds = new Set();
for (const dir of CODE_DIRS) {
  for (const file of walk(dir)) {
    const text = fs.readFileSync(file, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      if (!line.includes('@spec')) continue;
      const matches = line.match(ID_RE);
      if (matches) matches.forEach((id) => taggedIds.add(id));
    }
  }
}

// 2. Per feature: read FR ids from SPEC.md and TASKS.md status.
function taskStatus(featDir) {
  const tasksPath = path.join(featDir, 'TASKS.md');
  if (!fs.existsSync(tasksPath)) return 'UNKNOWN';
  const m = fs.readFileSync(tasksPath, 'utf8').match(/Status[:\s#]*([A-Za-z ]+)/i);
  return m ? m[1].trim().toUpperCase() : 'UNKNOWN';
}

const features = fs
  .readdirSync(SPECS_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory() && e.name.startsWith('feat-'))
  .map((e) => e.name)
  .sort();

const rows = [];
let failed = false;

for (const feat of features) {
  const featDir = path.join(SPECS_DIR, feat);
  const specPath = path.join(featDir, 'SPEC.md');
  if (!fs.existsSync(specPath)) continue;

  const frs = [...new Set(fs.readFileSync(specPath, 'utf8').match(FR_RE) || [])];
  if (frs.length === 0) continue;

  const covered = frs.filter((id) => taggedIds.has(id));
  const pct = Math.round((covered.length / frs.length) * 100);
  const status = taskStatus(featDir);
  const active = /READY FOR REVIEW|IN PROGRESS|COMPLETE/.test(status);
  const missing = frs.filter((id) => !taggedIds.has(id));

  rows.push({ feat, total: frs.length, covered: covered.length, pct, status, active, missing });
  if (enforce && active && pct < MIN) failed = true;
}

// 3. Print report.
const pad = (s, n) => String(s).padEnd(n);
console.log('\nTraceability coverage (FR ids tagged with @spec in source)\n');
console.log(pad('Feature', 32) + pad('FR', 5) + pad('Tagged', 8) + pad('Coverage', 10) + 'TASKS status');
console.log('-'.repeat(78));
for (const r of rows) {
  const mark = !r.active ? '·' : r.pct >= MIN ? '✓' : '✗';
  console.log(
    pad(`${mark} ${r.feat}`, 32) +
      pad(r.total, 5) +
      pad(r.covered, 8) +
      pad(`${r.pct}%`, 10) +
      r.status
  );
}
console.log('-'.repeat(78));

const activeRows = rows.filter((r) => r.active);
const below = activeRows.filter((r) => r.pct < MIN);
console.log(
  `\nImplemented features: ${activeRows.length} | below ${MIN}%: ${below.length} | not started: ${
    rows.length - activeRows.length
  }`
);
if (below.length) {
  console.log('\nImplemented features missing tags:');
  for (const r of below) {
    console.log(`  ${r.feat} (${r.pct}%): ${r.missing.join(', ')}`);
  }
}
console.log(
  enforce
    ? `\nMode: ENFORCE (min ${MIN}%). ${failed ? 'FAIL' : 'PASS'}`
    : '\nMode: report-only (pass --enforce to gate CI).'
);

process.exit(enforce && failed ? 1 : 0);
