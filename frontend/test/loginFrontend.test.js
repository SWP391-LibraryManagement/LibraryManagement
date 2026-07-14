import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const loginFormPath = path.join(here, '..', 'src', 'component', 'login', 'LoginForm.jsx');

test('login fields use the current MUI slot API without forwarding InputProps to the DOM', () => {
  const source = fs.readFileSync(loginFormPath, 'utf8');

  assert.doesNotMatch(source, /\bInputProps\s*=/);
  assert.match(source, /slotProps\s*=\s*\{\{/);
});
