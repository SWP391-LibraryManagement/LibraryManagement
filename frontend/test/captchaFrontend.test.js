import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('login and register share CAPTCHA and submit its token and answer', async () => {
  const [login, register, api, captcha] = await Promise.all([
    readFile(new URL('../src/component/login/LoginForm.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/component/register/AuthCard.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/api/authApi.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/component/auth/CaptchaField.jsx', import.meta.url), 'utf8'),
  ]);
  assert.match(login, /CaptchaField/);
  assert.match(register, /CaptchaField/);
  assert.match(api, /get\('\/auth\/captcha'\)/);
  assert.match(api, /captchaToken, captchaAnswer/);
  assert.match(captcha, /alt="CAPTCHA gồm 4 đến 6 chữ cái"/);
});
