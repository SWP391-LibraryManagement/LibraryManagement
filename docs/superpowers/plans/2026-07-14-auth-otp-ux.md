# Authentication and OTP UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a clear, recoverable authentication experience for registration, six-digit OTP verification, login, forgot-password, and password reset without changing backend authorization or persistence rules.

**Architecture:** Keep FE02 security and API decisions in the approved feature spec. Add pure frontend UX helpers for email masking, password guidance, field validation, OTP normalization, and the approved 60-second resend cooldown. Existing page components own request state, while presentational auth cards render progress, inline errors, pending states, and accessible focus behavior.

**Tech Stack:** React 19, React Router 7, MUI components already installed, existing FE02 REST endpoints, CSS in `frontend/src/styles/login.css` and `frontend/src/styles/forgot-password.css`, Node test runner.

## Global Constraints

- FE02 `SPEC.md` and `docs/api/api-contract.md` remain the source of truth for authentication behavior.
- Six-digit email OTP is the primary interactive verification/reset flow; legacy token-link payloads remain accepted for compatibility and account setup.
- The client resend cooldown is 60 seconds after a successful resend request.
- No backend authorization, database schema, password policy, token expiry, or account-state rule changes.
- Preserve all non-secret form values after validation or recoverable API errors.
- Clear password fields only after successful account creation or password reset.
- Never log or render passwords, OTPs, access tokens, refresh tokens, SMTP values, raw API errors, or stack traces.
- Keep forgot-password responses generic so the UI does not reveal whether an account exists.
- Use TDD for behavior changes and commit after each independently reviewable task.

---

## File Structure

- Modify `.sdd/specs/feat-auth/SPEC.md`: align approved FE02 flows and acceptance criteria with OTP plus legacy token compatibility.
- Modify `.sdd/specs/feat-auth/PLAN.md`: record OTP storage/expiry and the approved frontend UX slice.
- Modify `.sdd/specs/feat-auth/TASKS.md`: add the frontend UX hardening tasks.
- Modify `.sdd/specs/feat-auth/CHANGELOG.md`: record contract alignment and UX scope.
- Modify `docs/api/api-contract.md`: document OTP request alternatives and required registration confirmation.
- Create `frontend/src/utils/authUx.js`: pure auth presentation validation and masking helpers.
- Create `frontend/test/authUxFrontend.test.js`: pure and source-level auth UX contracts.
- Modify `frontend/src/api/authApi.js`: remove credential-bearing console logging and preserve safe API feedback.
- Modify `frontend/src/page/RegisterPage.jsx`: registration, OTP, resend, and cooldown state.
- Modify `frontend/src/component/register/AuthCard.jsx`: two-step progress, inline fields, OTP focus, resend states, and completion.
- Modify `frontend/src/component/register/FormInput.jsx`: accessible input configuration support.
- Modify `frontend/src/component/register/PasswordInput.jsx`: accessible password visibility and field error support.
- Modify `frontend/src/component/register/RegisterFormHeader.jsx`: step-aware Vietnamese heading and guidance.
- Modify `frontend/src/page/LoginPage.jsx`: route successful users through role-aware `/home`.
- Modify `frontend/src/component/login/LoginForm.jsx`: consistent labels, safe feedback, and accessible visibility control.
- Modify `frontend/src/component/forgotpassword/ForgotPasswordForm.jsx`: OTP recovery, masked destination, cooldown, password guidance, and completion.
- Modify `frontend/src/styles/login.css`: registration/login step, field, OTP, and responsive styles.
- Modify `frontend/src/styles/forgot-password.css`: recovery state, cooldown, and mobile styles.

---

### Task 1: Align FE02 OTP Contracts

**Files:**
- Modify: `.sdd/specs/feat-auth/SPEC.md`
- Modify: `.sdd/specs/feat-auth/PLAN.md`
- Modify: `.sdd/specs/feat-auth/TASKS.md`
- Modify: `.sdd/specs/feat-auth/CHANGELOG.md`
- Modify: `docs/api/api-contract.md`

**Interfaces:**
- Produces: approved request alternatives `{ email, otp }` or `{ token }`, six-digit OTP rules, 60-second client cooldown, and traceable UX tasks.
- Consumes: current backend compatibility behavior in `authService.verifyEmail` and `authService.resetPassword`.

- [ ] **Step 1: Update the FE02 main flows and requirements**

Record that registration sends a six-digit OTP with 24-hour expiry, reset sends a six-digit OTP with 15-minute expiry, successful validation consumes the OTP, and token payloads remain accepted for legacy links/account setup.

- [ ] **Step 2: Update the API request examples**

Use these primary payloads:

```json
{ "email": "user@example.test", "otp": "123456" }
```

```json
{ "email": "user@example.test", "otp": "123456", "newPassword": "NewPassword1!" }
```

Also document `{ "token": "legacy-token" }` and `{ "token": "setup-token", "newPassword": "NewPassword1!" }` as compatibility alternatives.

- [ ] **Step 3: Verify documentation consistency**

Run:

```powershell
rg -n "six-digit|6 chữ số|60-second|60 giây|legacy token|email.*otp" .sdd/specs/feat-auth docs/api/api-contract.md
git diff --check
```

Expected: OTP and cooldown decisions are present; diff check exits `0`.

- [ ] **Step 4: Commit contract alignment**

```powershell
git add .sdd/specs/feat-auth docs/api/api-contract.md docs/superpowers/plans/2026-07-14-auth-otp-ux.md
git commit -m "docs: align FE02 with OTP authentication UX"
```

---

### Task 2: Auth UX Pure Contracts and Safe API Errors

**Files:**
- Create: `frontend/src/utils/authUx.js`
- Create: `frontend/test/authUxFrontend.test.js`
- Modify: `frontend/src/api/authApi.js`

**Interfaces:**
- Produces: `RESEND_COOLDOWN_SECONDS`, `maskEmail`, `getPasswordRequirements`, `validateRegistrationFields`, and `normalizeOtp`.
- Consumes: FE02 password policy of 8+ characters with uppercase, lowercase, number, and special character.

- [ ] **Step 1: Write failing utility tests**

```js
import assert from 'node:assert/strict';
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
    validateRegistrationFields({ fullName: '', username: 'ab', email: 'bad', password: 'weak', confirmPassword: 'other' }),
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
```

- [ ] **Step 2: Run tests to verify RED**

```powershell
cd frontend
node --test test/authUxFrontend.test.js
```

Expected: FAIL because `src/utils/authUx.js` does not exist.

- [ ] **Step 3: Implement the pure helpers**

Implement only the exported interfaces above. `normalizeOtp` strips non-digits and limits output to six characters. `validateRegistrationFields` returns an object containing only invalid fields.

- [ ] **Step 4: Add the safe API source contract**

Append a test that reads `src/api/authApi.js` and asserts it does not contain `console.error`, `debugOtp`, `debugVerificationToken`, or `debugResetToken`.

- [ ] **Step 5: Remove credential-bearing console logging**

Delete `console.error('Login API error:', error)` from `loginAccount`; preserve the existing safe Vietnamese `Error` message behavior.

- [ ] **Step 6: Run tests and lint**

```powershell
cd frontend
node --test test/authUxFrontend.test.js
npm run lint
```

Expected: all auth UX tests pass and lint exits `0`.

- [ ] **Step 7: Commit pure contracts**

```powershell
git add frontend/src/utils/authUx.js frontend/src/api/authApi.js frontend/test/authUxFrontend.test.js
git commit -m "test: define authentication UX contracts"
```

---

### Task 3: Registration Details and OTP Verification

**Files:**
- Modify: `frontend/src/page/RegisterPage.jsx`
- Modify: `frontend/src/component/register/AuthCard.jsx`
- Modify: `frontend/src/component/register/FormInput.jsx`
- Modify: `frontend/src/component/register/PasswordInput.jsx`
- Modify: `frontend/src/component/register/RegisterFormHeader.jsx`
- Modify: `frontend/src/styles/login.css`
- Test: `frontend/test/authUxFrontend.test.js`

**Interfaces:**
- Consumes: all helpers from `authUx.js` and existing `registerAccount`, `verifyEmail`, `resendVerification` API calls.
- Produces: two-step registration UI, numeric six-digit OTP input, 60-second resend cooldown, focus handoff, and safe form preservation.

- [ ] **Step 1: Add failing source contracts**

Assert the registration sources contain:

```js
assert.match(card, /1\. Thông tin tài khoản/);
assert.match(card, /2\. Xác thực email/);
assert.match(card, /inputMode: 'numeric'/);
assert.match(card, /autoComplete: 'one-time-code'/);
assert.match(page, /RESEND_COOLDOWN_SECONDS/);
assert.match(page, /setResendCooldown/);
assert.match(card, /Gửi lại mã/);
```

- [ ] **Step 2: Run tests to verify RED**

```powershell
cd frontend
node --test test/authUxFrontend.test.js
```

Expected: registration source contracts fail.

- [ ] **Step 3: Add reusable input support**

`FormInput` accepts `inputRef`, `inputProps`, `autoFocus`, and `disabled`, passing them through MUI `slotProps.htmlInput` and `inputRef`. `PasswordInput` gives its visibility button a Vietnamese accessible label and uses current MUI slot APIs.

- [ ] **Step 4: Implement step-aware registration**

Use `validateRegistrationFields` before calling the API. Show inline helper text for each invalid field, render the password requirement checklist before submit, and keep full name/username/email values after validation or API failure.

- [ ] **Step 5: Implement OTP focus and resend cooldown**

The OTP input accepts only six digits, uses `inputMode="numeric"`, `autoComplete="one-time-code"`, and receives focus when step 2 opens. Disable resend while pending and for 60 seconds after success; show `Gửi lại mã sau Ns` during cooldown.

- [ ] **Step 6: Run tests and lint**

```powershell
cd frontend
node --test test/authUxFrontend.test.js test/loginFrontend.test.js
npm run lint
```

Expected: tests and lint pass.

- [ ] **Step 7: Commit registration UX**

```powershell
git add frontend/src/page/RegisterPage.jsx frontend/src/component/register frontend/src/styles/login.css frontend/test/authUxFrontend.test.js
git commit -m "feat: improve registration and OTP verification UX"
```

---

### Task 4: Login and Recovery Consistency

**Files:**
- Modify: `frontend/src/page/LoginPage.jsx`
- Modify: `frontend/src/component/login/AuthCard.jsx`
- Modify: `frontend/src/component/login/LoginForm.jsx`
- Modify: `frontend/src/component/forgotpassword/ForgotPasswordForm.jsx`
- Modify: `frontend/src/styles/forgot-password.css`
- Test: `frontend/test/authUxFrontend.test.js`

**Interfaces:**
- Consumes: `maskEmail`, `getPasswordRequirements`, `normalizeOtp`, and existing login/forgot/reset API functions.
- Produces: role-aware `/home` redirect, generic login feedback, masked recovery destination, OTP focus, recovery resend cooldown, and one clear completion action.

- [ ] **Step 1: Add failing source contracts**

Assert:

```js
assert.match(loginPage, /navigate\('\/home'\)/);
assert.doesNotMatch(loginPage, /navigate\('\/admin\/users'\)/);
assert.match(recovery, /maskEmail/);
assert.match(recovery, /autoComplete.*one-time-code/);
assert.match(recovery, /RESEND_COOLDOWN_SECONDS/);
assert.match(recovery, /Quay lại đăng nhập/);
```

- [ ] **Step 2: Run tests to verify RED**

```powershell
cd frontend
node --test test/authUxFrontend.test.js
```

Expected: login/recovery contracts fail.

- [ ] **Step 3: Route login success through `/home`**

Store auth data exactly as today, then use one `navigate('/home')` call so `HomeRoutePage` selects the correct dashboard.

- [ ] **Step 4: Harden recovery UX**

Keep the generic forgot-password success response, mask the destination email, focus the six-digit OTP input, show password requirements before reset, preserve email after recoverable errors, and apply the approved 60-second resend cooldown using `forgotPassword(email)`.

- [ ] **Step 5: Run tests and lint**

```powershell
cd frontend
node --test test/authUxFrontend.test.js test/loginFrontend.test.js
npm run lint
```

Expected: tests and lint pass.

- [ ] **Step 6: Commit login/recovery UX**

```powershell
git add frontend/src/page/LoginPage.jsx frontend/src/component/login frontend/src/component/forgotpassword frontend/src/styles/forgot-password.css frontend/test/authUxFrontend.test.js
git commit -m "feat: align login and recovery UX"
```

---

### Task 5: Authentication UX Validation Gate

**Files:**
- Modify only if validation reveals a defect in files listed by Tasks 2-4.

**Interfaces:**
- Consumes: completed auth UX slice.
- Produces: automated, spec, responsive, security, and human-review evidence.

- [ ] **Step 1: Run automated checks**

```powershell
cd frontend
node --test test/authUxFrontend.test.js test/loginFrontend.test.js test/appShellFrontend.test.js
npm run lint
npm run build
```

Expected: all commands exit `0`.

- [ ] **Step 2: Run security/source checks**

```powershell
rg -n "console\.error|debugOtp|debugVerificationToken|debugResetToken" src/api/authApi.js src/page src/component
rg -n "one-time-code|60|maskedEmail|Mật khẩu" src/page/RegisterPage.jsx src/component/register src/component/forgotpassword
```

Expected: no credential-bearing logging/debug-token references; OTP and guidance contracts are present.

- [ ] **Step 3: Run responsive acceptance**

At `1440x900`, `1024x900`, `768x900`, and `390x844`, verify login, registration details, registration OTP, forgot-password email, recovery OTP, and completion states. No field, label, primary action, or feedback surface may overlap or become unreachable.

- [ ] **Step 4: Inspect final diff**

```powershell
git status --short
git diff --check
git diff --stat origin/main...HEAD
```

Expected: only FE02 contract documents, auth UX plan, auth frontend files, and tests changed.

- [ ] **Step 5: Commit validation-only fixes if required**

```powershell
git add frontend .sdd/specs/feat-auth docs/api/api-contract.md
git commit -m "fix: close authentication UX validation gaps"
```

Skip this commit when no correction is required.

---

## Human Review Gate

Review against:

- `UX-FE-002`, `UX-FE-003`, `UX-FE-004`, `UX-FE-005`.
- `NFR-UX-001`, `NFR-UX-002`, `NFR-UX-003`.
- `AC-UX-001`, `AC-UX-002`, `AC-UX-003`, `AC-UX-007`, `AC-UX-008`.
- `FR-FE02-001` to `FR-FE02-005`, `FR-FE02-011`, `FR-FE02-012`, `FR-FE02-015` to `FR-FE02-019`.

Do not begin operational-page UX cleanup until Authentication/OTP passes automated checks and human review.
