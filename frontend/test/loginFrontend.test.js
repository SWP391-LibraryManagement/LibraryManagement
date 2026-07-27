import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const loginFormPath = path.join(here, '..', 'src', 'component', 'login', 'LoginForm.jsx');
const loginPagePath = path.join(here, '..', 'src', 'page', 'LoginPage.jsx');
const authApiPath = path.join(here, '..', 'src', 'api', 'authApi.js');

test('login fields use the current MUI slot API without forwarding InputProps to the DOM', () => {
  const source = fs.readFileSync(loginFormPath, 'utf8');

  assert.doesNotMatch(source, /\bInputProps\s*=/);
  assert.match(source, /slotProps\s*=\s*\{\{/);
});

test('login form validates fields inline and prevents pending or locked submissions', () => {
  const source = fs.readFileSync(loginFormPath, 'utf8');

  assert.match(source, /<form[^>]*\bnoValidate\b/);
  assert.match(source, /validateLoginFields/);
  assert.match(source, /setFieldErrors/);
  assert.match(source, /error=\{Boolean\(fieldErrors\.email\)\}/);
  assert.match(source, /helperText=\{fieldErrors\.email\}/);
  assert.match(source, /error=\{Boolean\(fieldErrors\.password\)\}/);
  assert.match(source, /helperText=\{fieldErrors\.password\}/);
  assert.equal(source.match(/maxLength:\s*256/g)?.length, 2);
  assert.match(source, /if \(isSubmitting \|\| isLocked\) return;/);
  assert.match(source, /disabled=\{isSubmitting \|\| isLocked\}/);
  assert.match(source, /onInputChange/);
});

test('login page clears stale feedback and API maps stable login error codes', () => {
  const pageSource = fs.readFileSync(loginPagePath, 'utf8');
  const apiSource = fs.readFileSync(authApiPath, 'utf8');

  assert.match(pageSource, /if \(!lockDurationMs\) setFeedback\(null\)/);
  assert.match(apiSource, /getLoginErrorMessage/);
  assert.match(apiSource, /new Error\(getLoginErrorMessage\(error\)/);
});

test('login page disables login for the server-provided account lock duration', () => {
  const source = fs.readFileSync(loginPagePath, 'utf8');

  assert.match(source, /loginError\?\.code === 'ACCOUNT_LOCKED'/);
  assert.match(source, /loginError\?\.details\?\.retryAfterSeconds/);
  assert.match(source, /setLockDurationMs\(retryAfterSeconds \* 1000\)/);
  assert.match(source, /isLocked=\{lockDurationMs > 0\}/);
});
