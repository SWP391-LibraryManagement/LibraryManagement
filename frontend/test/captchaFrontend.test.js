import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// @spec FR-FE02-030, AC-FE02-027, EC-FE02-019

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

test('auth submission stays disabled until a CAPTCHA challenge is available', async () => {
  const [login, register, captcha] = await Promise.all([
    readFile(new URL('../src/component/login/LoginForm.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/component/register/AuthCard.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/component/auth/CaptchaField.jsx', import.meta.url), 'utf8'),
  ]);

  assert.match(login, /<CaptchaField\s+disabled=\{isSubmitting \|\| isLocked\}/);
  assert.match(
    login,
    /className="login-button"[\s\S]*?disabled=\{isSubmitting \|\| isLocked \|\| !captcha\.captchaToken\}/
  );
  assert.match(register, /disabled=\{isBusy \|\| \(!verificationStep && !captcha\.captchaToken\)\}/);
  assert.match(captcha, /onChange\?\.\(\{ captchaToken: '', captchaAnswer: '' \}\)/);
  assert.match(captcha, /Không tải được CAPTCHA\. Vui lòng thử lại\./);
  assert.match(captcha, /type="button"/);
});
