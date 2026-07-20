import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const sourceUrl = (path) => new URL(path, import.meta.url);

test('verification recovery has a standalone route and page after registration state is lost', async () => {
  const appSource = await readFile(sourceUrl('../src/App.jsx'), 'utf8');
  const registerSource = await readFile(sourceUrl('../src/page/RegisterPage.jsx'), 'utf8');
  const verifyPagePath = sourceUrl('../src/page/VerifyEmailPage.jsx');

  await access(verifyPagePath);
  assert.match(appSource, /path="\/verify-email"/);
  assert.match(registerSource, /EMAIL_ALREADY_REGISTERED/);
  assert.match(registerSource, /navigate\('\/verify-email'/);
});

test('standalone verification page supports OTP verification and resend cooldown', async () => {
  const source = await readFile(sourceUrl('../src/page/VerifyEmailPage.jsx'), 'utf8');

  assert.match(source, /verifyEmail/);
  assert.match(source, /resendVerification/);
  assert.match(source, /RESEND_COOLDOWN_SECONDS/);
  assert.match(source, /one-time-code/);
  assert.match(source, /Gửi lại mã/);
  assert.match(source, /navigate\('\/login'/);
});

test('password recovery gives inactive users a path to account verification', async () => {
  const source = await readFile(sourceUrl('../src/component/forgotpassword/ForgotPasswordForm.jsx'), 'utf8');

  assert.match(source, /navigate\('\/verify-email'/);
  assert.match(source, /Xác thực email/);
});
