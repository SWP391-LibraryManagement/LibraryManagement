import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import * as authUx from '../src/utils/authUx.js';

const {
  RESEND_COOLDOWN_SECONDS,
  getLoginErrorMessage,
  getPasswordRequirements,
  getAccountSetupErrorMessage,
  maskEmail,
  normalizeOtp,
  validateLoginFields,
  validatePasswordSetupFields,
  validateRegistrationFields,
} = authUx;

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

test('login validation rejects blank and overlength fields without enforcing password complexity', () => {
  assert.equal(typeof validateLoginFields, 'function');
  assert.deepEqual(
    validateLoginFields({ email: '   ', password: '' }),
    {
      email: 'Vui lòng nhập email hoặc tên đăng nhập.',
      password: 'Vui lòng nhập mật khẩu.',
    },
  );
  assert.deepEqual(
    validateLoginFields({ email: 'a'.repeat(256), password: 'p'.repeat(256) }),
    {
      email: 'Email hoặc tên đăng nhập không được vượt quá 255 ký tự.',
      password: 'Mật khẩu không được vượt quá 255 ký tự.',
    },
  );
  assert.deepEqual(
    validateLoginFields({ email: 'member-name', password: 'legacy-password' }),
    {},
  );
});

test('login error mapping keeps enumeration safe and gives locked accounts recovery guidance', () => {
  assert.equal(typeof getLoginErrorMessage, 'function');
  assert.equal(
    getLoginErrorMessage({ response: { data: { error: { code: 'INVALID_CREDENTIALS' } } } }),
    'Email hoặc tên đăng nhập hoặc mật khẩu không đúng.',
  );
  assert.equal(
    getLoginErrorMessage({ response: { data: { error: { code: 'ACCOUNT_LOCKED' } } } }),
    'Tài khoản đã bị khóa do đăng nhập sai quá nhiều lần. Vui lòng đặt lại mật khẩu hoặc thử lại sau 30 phút.',
  );
  assert.equal(
    getLoginErrorMessage({ response: { data: { error: { code: 'VALIDATION_ERROR' } } } }),
    'Thông tin đăng nhập không hợp lệ. Vui lòng kiểm tra lại.',
  );
  assert.equal(
    getLoginErrorMessage({ response: { data: { error: { code: 'HTTPS_REQUIRED' } } } }),
    'Kết nối không an toàn. Vui lòng tải lại trang bằng HTTPS.',
  );
});

test('login error mapping uses environment-neutral network and server fallbacks', () => {
  assert.equal(typeof getLoginErrorMessage, 'function');
  assert.equal(
    getLoginErrorMessage({}),
    'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.',
  );
  assert.equal(
    getLoginErrorMessage({ response: { data: { error: { code: 'SOMETHING_INTERNAL' } } } }),
    'Đăng nhập thất bại. Vui lòng thử lại.',
  );
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

test('login routes admins to user management and other roles through home', async () => {
  const source = await readFile(new URL('../src/page/LoginPage.jsx', import.meta.url), 'utf8');
  const form = await readFile(new URL('../src/component/login/LoginForm.jsx', import.meta.url), 'utf8');
  const card = await readFile(new URL('../src/component/login/AuthCard.jsx', import.meta.url), 'utf8');

  assert.match(source, /getPostLoginPath\(result\.roles\)/);
  assert.match(source, /includes\('ADMIN'\) \? '\/admin\/users' : '\/home'/);
  assert.doesNotMatch(source, /navigate\('\/librarian\/fines'\)/);
  assert.doesNotMatch(source, /navigate\('\/borrowing\/history'\)/);
  assert.match(source, /navigate\('\/homepage'\)/);
  assert.match(card, /Trở về Homepage/);
  assert.match(card, /className="login-home-button"/);
  assert.match(form, /autoComplete: 'email'/);
  assert.match(form, /autoComplete: 'current-password'/);
  assert.match(form, /aria-label=\{showPassword \? 'Ẩn mật khẩu' : 'Hiện mật khẩu'\}/);
});

test('password recovery masks email and exposes accessible OTP resend states', async () => {
  const source = await readFile(new URL('../src/component/forgotpassword/ForgotPasswordForm.jsx', import.meta.url), 'utf8');
  const input = await readFile(new URL('../src/component/forgotpassword/FormInput.jsx', import.meta.url), 'utf8');

  assert.match(source, /maskEmail/);
  assert.match(source, /RESEND_COOLDOWN_SECONDS/);
  assert.match(source, /autoComplete: 'one-time-code'/);
  assert.match(source, /inputMode: 'numeric'/);
  assert.match(source, /Gửi lại mã/);
  assert.match(source, /Quay lại đăng nhập/);
  assert.doesNotMatch(source, /window\.location\.href/);
  assert.match(input, /inputRef=\{inputRef\}/);
  assert.match(input, /htmlInput: inputProps/);
  assert.match(input, /disabled=\{disabled\}/);
});

test('account setup validates both password fields and maps invalid links safely', () => {
  assert.deepEqual(
    validatePasswordSetupFields({
      newPassword: 'weak',
      confirmPassword: 'different',
    }),
    {
      newPassword: 'Mật khẩu chưa đáp ứng đủ yêu cầu.',
      confirmPassword: 'Xác nhận mật khẩu không khớp.',
    },
  );
  assert.deepEqual(
    validatePasswordSetupFields({
      newPassword: 'SetupPassword1!',
      confirmPassword: 'SetupPassword1!',
    }),
    {},
  );

  const invalidLinkError = new Error('Invalid or expired reset token.', {
    cause: {
      response: {
        data: { error: { code: 'INVALID_RESET_TOKEN' } },
      },
    },
  });
  assert.equal(
    getAccountSetupErrorMessage(invalidLinkError),
    'Liên kết thiết lập mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng liên hệ quản trị viên để được gửi lại.',
  );
});

test('password recovery enters token-query setup mode without email or OTP submission', async () => {
  const formSource = await readFile(
    new URL('../src/component/forgotpassword/ForgotPasswordForm.jsx', import.meta.url),
    'utf8',
  );
  const apiSource = await readFile(new URL('../src/api/authApi.js', import.meta.url), 'utf8');

  assert.match(formSource, /useSearchParams/);
  assert.match(formSource, /searchParams\.get\('token'\)/);
  assert.match(formSource, /isSetupMode/);
  assert.match(formSource, /!isSetupMode && step === STEP_EMAIL/);
  assert.match(
    formSource,
    /\{!isSetupMode && \(\s*<FormInput[\s\S]*?label="Mã OTP 6 chữ số"/,
  );
  assert.match(
    formSource,
    /\{!isSetupMode && \(\s*<div className="recovery-resend-row">/,
  );
  assert.match(formSource, /resetPasswordWithToken\(\{ token: setupToken, newPassword \}\)/);
  assert.match(formSource, /Thiết lập mật khẩu/);
  assert.match(formSource, /Hoàn tất thiết lập/);
  assert.match(formSource, /getAccountSetupErrorMessage/);
  assert.doesNotMatch(formSource, /localStorage|sessionStorage|console\./);
  assert.doesNotMatch(formSource, /value=\{setupToken\}|\{setupToken\}/);

  assert.match(apiSource, /export async function resetPasswordWithToken/);
  assert.match(apiSource, /api\.post\('\/auth\/reset-password', \{ token, newPassword \}\)/);
  assert.doesNotMatch(apiSource, /console\./);
});
