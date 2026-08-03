/* global process */

import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ALLOWED_ADVISORY = 'https://github.com/advisories/GHSA-qwww-vcr4-c8h2';
const ALLOWED_PACKAGES = new Set(['react-router', 'react-router-dom']);
const ALLOWED_VERSION = '7.18.2';
const BLOCKED_RSC_APIS = [
  'createBrowserRouter',
  'RouterProvider',
  'HydratedRouter',
  'RSCStaticRouter',
  'RSCHydratedRouter',
  'unstable_RSC',
];

function collectSourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(path);
    return /\.[cm]?[jt]sx?$/.test(entry.name) ? [path] : [];
  });
}

function assertDeclarativeRouterOnly() {
  const source = collectSourceFiles(fileURLToPath(new URL('../src', import.meta.url)))
    .map((path) => readFileSync(path, 'utf8'))
    .join('\n');

  if (!source.includes('BrowserRouter')) {
    throw new Error('React Router audit exception requires Declarative Mode with BrowserRouter.');
  }

  const detectedApi = BLOCKED_RSC_APIS.find((api) => source.includes(api));
  if (detectedApi) {
    throw new Error(`React Router audit exception is invalid because ${detectedApi} is in use.`);
  }
}

function assertPinnedPatchedBaseline() {
  const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
  for (const packageName of ALLOWED_PACKAGES) {
    const installed = lock.packages?.[`node_modules/${packageName}`]?.version;
    if (installed !== ALLOWED_VERSION) {
      throw new Error(
        `React Router audit exception requires ${packageName}@${ALLOWED_VERSION}; found ${installed || 'missing'}.`
      );
    }
  }
}

function advisoryUrls(vulnerability, vulnerabilities, visited = new Set()) {
  if (!vulnerability || visited.has(vulnerability.name)) return [];
  visited.add(vulnerability.name);

  return vulnerability.via.flatMap((entry) => {
    if (typeof entry === 'string') {
      return advisoryUrls(vulnerabilities[entry], vulnerabilities, visited);
    }
    return entry.url ? [entry.url] : [];
  });
}

function main() {
  const isWindows = process.platform === 'win32';
  const command = isWindows ? (process.env.ComSpec || 'cmd.exe') : 'npm';
  const args = isWindows
    ? ['/d', '/s', '/c', 'npm.cmd audit --audit-level=high --json']
    : ['audit', '--audit-level=high', '--json'];
  const result = spawnSync(command, args, {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8',
    shell: false,
  });

  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    process.stderr.write(
      result.stderr
      || result.stdout
      || result.error?.message
      || 'npm audit did not return JSON.\n'
    );
    process.exit(1);
  }

  const vulnerabilities = report.vulnerabilities || {};
  const blocking = Object.values(vulnerabilities).filter(
    ({ severity }) => severity === 'high' || severity === 'critical'
  );

  if (blocking.length === 0) {
    console.log('npm audit: no high or critical vulnerabilities.');
    return;
  }

  assertPinnedPatchedBaseline();
  assertDeclarativeRouterOnly();

  for (const vulnerability of blocking) {
    const urls = advisoryUrls(vulnerability, vulnerabilities);
    if (
      !ALLOWED_PACKAGES.has(vulnerability.name)
      || urls.length === 0
      || urls.some((url) => url !== ALLOWED_ADVISORY)
    ) {
      process.stderr.write(JSON.stringify(report, null, 2));
      process.exit(1);
    }
  }

  console.log(
    'Accepted GHSA-qwww-vcr4-c8h2 for react-router@7.18.2: '
    + 'the advisory affects unstable RSC APIs, while this frontend uses Declarative Mode only.'
  );
}

main();
