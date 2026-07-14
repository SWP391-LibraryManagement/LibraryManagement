const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

test('rewrites direct browser routes to the SPA entry point', () => {
  const configPath = path.resolve(__dirname, '../../frontend/public/staticwebapp.config.json');
  assert.ok(fs.existsSync(configPath), 'Static Web Apps routing config must exist.');

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  assert.equal(config.navigationFallback?.rewrite, '/index.html');
});
