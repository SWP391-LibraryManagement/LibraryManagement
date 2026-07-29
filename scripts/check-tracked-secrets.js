const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const SYNTHETIC_ALLOW_MARKER = /secret-scan:\s*allow-synthetic/i;
const PATTERNS = [
  {
    name: 'AWS access key',
    expression: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/
  },
  {
    name: 'private key',
    expression: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/
  },
  {
    name: 'Azure publish profile secret',
    expression: /<publishProfile\b[^>]*\buserPWD=(?:"[^"]+"|'[^']+')/i
  },
  {
    name: 'database URL password',
    expression: /\b(?:mssql|mysql|postgres(?:ql)?|mongodb(?:\+srv)?):\/\/[^\s/:]+:[^\s@/]+@/i
  },
  {
    name: 'connection string password',
    expression: /\b(?:Server|Data\s*Source|Host|Database|Initial\s*Catalog)\s*=[^;\r\n]+;[^\r\n]*(?:Password|Pwd)\s*=\s*[^;\s]+/i
  },
  {
    name: 'JWT secret assignment',
    expression: /\bJWT_(?:SECRET|KEY|TOKEN)\s*[:=]\s*['"]?(?:[A-Fa-f0-9]{32,}|[A-Za-z0-9+/]{32,}={0,2})\b/
  }
];

function listTrackedFiles(root) {
  const result = spawnSync('git', ['ls-files', '-z'], {
    cwd: root,
    encoding: 'buffer'
  });

  if (result.status !== 0) {
    throw new Error('Unable to list tracked files for the secret scan.');
  }

  return result.stdout
    .toString('utf8')
    .split('\0')
    .filter(Boolean);
}

function isBinary(buffer) {
  return buffer.includes(0);
}

function removeMarkedSyntheticLines(text) {
  return text
    .split('\n')
    .filter((line) => !SYNTHETIC_ALLOW_MARKER.test(line))
    .join('\n');
}

function scanTrackedFiles(root = process.cwd()) {
  const findings = [];

  for (const relativePath of listTrackedFiles(root)) {
    const normalizedPath = relativePath.replace(/\\/g, '/');
    const filePath = path.resolve(root, relativePath);
    if (!filePath.startsWith(`${path.resolve(root)}${path.sep}`)) {
      continue;
    }
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const buffer = fs.readFileSync(filePath);
    if (isBinary(buffer)) {
      continue;
    }

    const text = removeMarkedSyntheticLines(
      buffer.toString('utf8').replace(/\r\n?/g, '\n')
    );

    for (const pattern of PATTERNS) {
      if (pattern.expression.test(text)) {
        findings.push({ path: normalizedPath, pattern: pattern.name });
      }
    }
  }

  return findings;
}

function main() {
  const findings = scanTrackedFiles();
  if (findings.length === 0) {
    return;
  }

  console.error('Tracked secret scan failed.');
  for (const finding of findings) {
    console.error(`${finding.path}: ${finding.pattern}`);
  }
  process.exitCode = 1;
}

if (require.main === module) {
  main();
}

module.exports = { scanTrackedFiles };
