import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  RESEND_COOLDOWN_SECONDS,
  getPasswordRequirements,
  maskEmail,
  normalizeOtp,
  validateRegistrationFields,
} from '../src/utils/authUx.js';

test('auth UX masks email without exposing the full local part', () => {
  assert.equal(maskEmail('nhat@example.com'), 'n***t@example.com');
  assert.equal(maskEmail('a@example.com'), 'a***@example.com');
});

test('auth UX enforces the approved password guidance', () => {
  assert.deepEqual(getPasswordRequirements('Password1!'), {
    minLength: true,
    uppercase: true,
    lowercase: true,
    number: true,
    special: true,
  });
});

test('registration validation maps errors to fields and keeps a 60 second cooldown', () => {
  assert.equal(RESEND_COOLDOWN_SECONDS, 60);
  assert.deepEqual(
    validateRegistrationFields({
      fullName: '',
      username: 'ab',
      email: 'bad',
      password: 'weak',
      confirmPassword: 'other',
    }),
    {
      fullName: 'Vui lòng nhập họ và tên.',
      username: 'Tên đăng nhập phải có từ 3 đến 50 ký tự.',
      email: 'Vui lòng nhập địa chỉ email hợp lệ.',
      password: 'Mật khẩu chưa đáp ứng đủ yêu cầu.',
      confirmPassword: 'Xác nhận mật khẩu không khớp.',
    },
  );
  assert.equal(normalizeOtp('12a 34-56'), '123456');
});

test('auth API does not log or reference debug credentials', async () => {
  const source = await readFile(new URL('../src/api/authApi.js', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /console\.error/);
  assert.doesNotMatch(source, /debugOtp|debugVerificationToken|debugResetToken/);
});

test('registration exposes two-step OTP progress and resend cooldown', async () => {
  const page = await readFile(new URL('../src/page/RegisterPage.jsx', import.meta.url), 'utf8');
  const card = await readFile(new URL('../src/component/register/AuthCard.jsx', import.meta.url), 'utf8');

  assert.match(card, /1\. Thông tin tài khoản/);
  assert.match(card, /2\. Xác thực email/);
  assert.match(card, /inputMode: 'numeric'/);
  assert.match(card, /autoComplete: 'one-time-code'/);
  assert.match(card, /Gửi lại mã/);
  assert.match(page, /RESEND_COOLDOWN_SECONDS/);
  assert.match(page, /setResendCooldown/);
  assert.match(page, /isResending/);
});

test('registration fields use current MUI slots and accessible password controls', async () => {
  const input = await readFile(new URL('../src/component/register/FormInput.jsx', import.meta.url), 'utf8');
  const password = await readFile(new URL('../src/component/register/PasswordInput.jsx', import.meta.url), 'utf8');

  assert.doesNotMatch(input, /\bInputProps\s*=/);
  assert.doesNotMatch(password, /\bInputProps\s*=/);
  assert.match(input, /slotProps/);
  assert.match(password, /aria-label=\{showPassword \? 'Ẩn mật khẩu' : 'Hiện mật khẩu'\}/);
});
