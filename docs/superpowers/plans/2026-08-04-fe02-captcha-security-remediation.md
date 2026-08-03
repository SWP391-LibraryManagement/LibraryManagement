# FE02 CAPTCHA Security Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the replayable, machine-readable CAPTCHA in PR #111 with an opaque, bounded, one-time server challenge and close every H3 security, UI, test, and traceability blocker.

**Architecture:** A single injected CAPTCHA service owns a private, capped in-memory challenge map for the current single-instance Azure App Service F1 deployment. It returns a random opaque token plus an SVG built from randomized path segments rather than text, consumes every challenge on its first verification attempt, and is always enforced by production route wiring. Explicit test services preserve unrelated test setup, while the browser harness obtains answers only through its existing test-only control server.

**Tech Stack:** Node.js 22, Express 5, built-in `crypto`, React 19, Material UI 9, Jest 30, Node test runner, Playwright 1.61, GitHub Actions `foundation-checks`.

## Global Constraints

- Follow `.agents/AGENTS.md`, `.agents/CLAUDE.md`, `.sdd/constitution.md`, and `.sdd/constraints/safety.md`.
- FE02 authentication is Core and uses Full-depth SDD; code must remain traceable to `BR-FE02-029`, `FR-FE02-028..030`, `AC-FE02-027`, and corrected `EC-FE02-019`.
- Keep the approved 4-6 ambiguity-reduced Latin-letter challenge and five-minute TTL.
- Add no runtime dependency, SQL entity, migration, external provider, public debug response, or `NODE_ENV` bypass.
- The public token must contain no answer, answer hash, or decodable answer verifier.
- A challenge is consumed by its first correct or incorrect verification attempt.
- The process-local store is capped at 5,000 active records and fails closed at capacity.
- A backend restart may invalidate outstanding challenges; the frontend must recover by loading a new one.
- Do not change OTP, password, lockout, refresh-token, role, or non-CAPTCHA authentication behavior.
- Keep all implementation changes uncommitted until the complete diff and L1-L4 evidence receive H2 review, per the repository Fast-Track gate.
- Work only in `D:\SWP391\library-management-system\.worktrees\pr-111-ci-fix`; do not touch the dirty primary checkout.

---

## File Map

- Create `backend/src/services/captchaService.js`: issue, store, consume, expire, and cap opaque challenges.
- Create `backend/src/utils/captchaRenderer.js`: render answer glyphs as randomized SVG paths without answer text.
- Delete `backend/src/utils/captchaUtils.js`: remove the signed client-payload implementation.
- Modify `backend/src/utils/safeErrors.js`: add a safe `503` helper for capacity exhaustion.
- Modify `backend/src/app.js`: construct/inject one CAPTCHA service into auth routes.
- Modify `backend/src/routes/authRoutes.js`: pass the shared service to controller and middleware.
- Modify `backend/src/controllers/authController.js`: issue challenges through the injected service.
- Modify `backend/src/middleware/captchaMiddleware.js`: enforce the injected verifier without environment bypass.
- Replace `backend/tests/captchaUtils.test.js` with `backend/tests/captchaService.test.js`: service and renderer regression coverage.
- Create `backend/tests/captchaRoutes.test.js`: exact route fail-closed and one-time behavior.
- Create `backend/tests/helpers/captchaTestService.js`: explicit accepting service for tests unrelated to CAPTCHA.
- Modify auth-flow test setup files listed in Task 2 to inject the explicit test service.
- Modify `backend/tests/helpers/systemIntegrationHarness.js`: accept a CAPTCHA service option and default to the explicit test service.
- Modify `tests/e2e/support/systemTestServer.js`: use an instrumented real service and expose only a test-control answer endpoint.
- Modify `tests/e2e/support/solveCaptcha.js`: obtain the current answer from the test-control endpoint instead of decoding the image.
- Modify `frontend/src/component/login/LoginForm.jsx`: disable login submit until a challenge token exists.
- Modify `frontend/src/component/register/AuthCard.jsx`: disable registration submit until a challenge token exists without blocking OTP verification.
- Modify `frontend/test/captchaFrontend.test.js`: assert fail-safe submit and refresh wiring.
- Modify FE02 `SPEC.md`, `PLAN.md`, `TASKS.md`, `TEST_PLAN.md`, `CHANGELOG.md`, `contracts/captcha.md`, `data-model.md`, `research.md`, and `quickstart.md`: reconcile the approved security design and traceability.
- Modify `docs/superpowers/specs/2026-08-04-fe02-captcha-security-remediation-design.md`: mark written design approved and later record implementation evidence without claiming H3 early.

---

### Task 1: Implement the opaque one-time CAPTCHA service and non-text renderer

**Files:**
- Create: `backend/tests/captchaService.test.js`
- Create: `backend/src/services/captchaService.js`
- Create: `backend/src/utils/captchaRenderer.js`
- Modify: `backend/src/utils/safeErrors.js`
- Delete after GREEN: `backend/tests/captchaUtils.test.js`
- Delete after GREEN: `backend/src/utils/captchaUtils.js`

**Interfaces:**
- Produces: `createCaptchaService(options?) -> { createChallenge(), verifyChallenge(token, answer) }`.
- Produces: `defaultCaptchaService`, shared by the production app.
- Produces: `renderCaptchaSvgDataUri(answer, options?) -> string`.
- `createChallenge()` returns `{ image, captchaToken, expiresIn }`.
- `verifyChallenge()` returns a boolean and always consumes an existing challenge before comparison.

- [x] **Step 1: Write failing service and renderer tests**

Create `backend/tests/captchaService.test.js` with concrete tests for opacity, rendering, one-time use, expiry, incorrect-attempt consumption, and bounded capacity:

```js
process.env.JWT_SECRET = process.env.JWT_SECRET || 'captcha-service-test-jwt-secret';

const {
  createCaptchaService,
} = require('../src/services/captchaService');
const {
  renderCaptchaSvgDataUri,
} = require('../src/utils/captchaRenderer');

function decodeSvg(image) {
  return Buffer.from(image.split(',')[1], 'base64').toString('utf8');
}

function deterministicOptions(overrides = {}) {
  let now = 1_800_000_000_000;
  const values = [0, 0, 1, 2, 3]; // length 4, then A B C D
  let tokenByte = 1;
  let issued = null;
  return {
    options: {
      clock: () => now,
      randomInt: () => values.shift() ?? 0,
      randomBytes: (size) => Buffer.alloc(size, tokenByte++),
      renderImage: () => 'data:image/svg+xml;base64,PHN2Zy8+',
      onChallengeIssued: (challenge) => { issued = challenge; },
      ...overrides,
    },
    advance(milliseconds) { now += milliseconds; },
    issued() { return issued; },
  };
}

test('issues an opaque token and accepts the normalized answer only once', () => {
  const harness = deterministicOptions();
  const service = createCaptchaService(harness.options);
  const challenge = service.createChallenge();

  expect(challenge).toMatchObject({ expiresIn: 300 });
  expect(challenge.captchaToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(challenge.captchaToken).not.toContain('ABCD');
  expect(service.verifyChallenge(`${challenge.captchaToken}x`, 'ABCD')).toBe(false);
  expect(service.verifyChallenge(challenge.captchaToken, ' abcd ')).toBe(true);
  expect(service.verifyChallenge(challenge.captchaToken, 'ABCD')).toBe(false);
});

test('consumes a challenge after an incorrect answer', () => {
  const harness = deterministicOptions();
  const service = createCaptchaService(harness.options);
  const challenge = service.createChallenge();

  expect(service.verifyChallenge(challenge.captchaToken, 'WRONG')).toBe(false);
  expect(service.verifyChallenge(challenge.captchaToken, harness.issued().answer)).toBe(false);
});

test('rejects expired challenges and frees bounded capacity during cleanup', () => {
  const harness = deterministicOptions({ maxActiveChallenges: 1 });
  const service = createCaptchaService(harness.options);
  const expired = service.createChallenge();
  harness.advance(300_001);

  expect(service.verifyChallenge(expired.captchaToken, harness.issued().answer)).toBe(false);
  expect(() => service.createChallenge()).not.toThrow();
});

test('fails closed when the active challenge capacity is exhausted', () => {
  const harness = deterministicOptions({ maxActiveChallenges: 1 });
  const service = createCaptchaService(harness.options);
  service.createChallenge();

  expect(() => service.createChallenge()).toThrow(expect.objectContaining({
    statusCode: 503,
    code: 'CAPTCHA_UNAVAILABLE',
  }));
});

test('renders SVG paths without answer text or text nodes', () => {
  const image = renderCaptchaSvgDataUri('ABCD', { randomInt: () => 0 });
  const svg = decodeSvg(image);

  expect(svg).toContain('<path');
  expect(svg).not.toMatch(/<text\b/i);
  expect(svg).not.toContain('ABCD');
  expect(svg).not.toMatch(/answer|captcha-answer/i);
});
```

- [x] **Step 2: Run the focused test to verify RED**

Run:

```powershell
cd backend
npm.cmd test -- --runTestsByPath tests/captchaService.test.js
```

Expected: FAIL because `services/captchaService.js` and `utils/captchaRenderer.js` do not exist.

- [x] **Step 3: Add the safe capacity error**

Add to `backend/src/utils/safeErrors.js`:

```js
function serviceUnavailable(code, message, details) {
  return new AppException(503, code, message, details);
}
```

Export `serviceUnavailable` beside the existing helpers.

- [x] **Step 4: Implement the path renderer**

Create `backend/src/utils/captchaRenderer.js` with a complete 14-segment alphabet for the approved letters:

```js
const crypto = require('crypto');

const SEGMENTS = {
  a: [4, 4, 22, 4], b: [24, 6, 24, 22], c: [24, 26, 24, 42],
  d: [4, 44, 22, 44], e: [2, 26, 2, 42], f: [2, 6, 2, 22],
  g1: [4, 24, 13, 24], g2: [13, 24, 22, 24],
  h: [4, 6, 13, 22], i: [22, 6, 13, 22],
  j: [4, 42, 13, 26], k: [22, 42, 13, 26],
  l: [13, 6, 13, 22], m: [13, 26, 13, 42],
};

const GLYPHS = {
  A: ['a', 'b', 'c', 'e', 'f', 'g1', 'g2'],
  B: ['a', 'b', 'c', 'd', 'e', 'f', 'g1', 'g2'],
  C: ['a', 'd', 'e', 'f'], D: ['a', 'b', 'c', 'd', 'e', 'f'],
  E: ['a', 'd', 'e', 'f', 'g1', 'g2'],
  F: ['a', 'e', 'f', 'g1', 'g2'],
  G: ['a', 'c', 'd', 'e', 'f', 'g2'],
  H: ['b', 'c', 'e', 'f', 'g1', 'g2'], J: ['b', 'c', 'd', 'e'],
  K: ['e', 'f', 'g1', 'h', 'k', 'm'], L: ['d', 'e', 'f'],
  M: ['b', 'c', 'e', 'f', 'h', 'i', 'k'],
  N: ['b', 'c', 'e', 'f', 'h', 'k'],
  P: ['a', 'b', 'e', 'f', 'g1', 'g2'],
  Q: ['a', 'b', 'c', 'd', 'e', 'f', 'k'],
  R: ['a', 'b', 'e', 'f', 'g1', 'g2', 'k'],
  S: ['a', 'c', 'd', 'f', 'g1', 'g2'], T: ['a', 'l', 'm'],
  U: ['b', 'c', 'd', 'e', 'f'], V: ['e', 'f', 'j', 'k'],
  W: ['b', 'c', 'd', 'e', 'f', 'j', 'k'],
  X: ['h', 'i', 'j', 'k'], Y: ['h', 'i', 'm'],
  Z: ['a', 'd', 'i', 'j'],
};

function renderCaptchaSvgDataUri(answer, { randomInt = crypto.randomInt } = {}) {
  const glyphs = [...answer].map((letter, index) => {
    const rotation = randomInt(9) - 4;
    const offsetY = randomInt(5) - 2;
    const paths = GLYPHS[letter].map((segmentName) => {
      const [x1, y1, x2, y2] = SEGMENTS[segmentName];
      return `<path d="M${x1} ${y1} L${x2} ${y2}"/>`;
    }).join('');
    return `<g transform="translate(${8 + index * 34} ${3 + offsetY}) rotate(${rotation} 13 24)">${paths}</g>`;
  }).join('');
  const noise = Array.from({ length: 7 }, () => {
    const x1 = randomInt(180);
    const y1 = randomInt(54);
    const x2 = randomInt(180);
    const y2 = randomInt(54);
    return `<path class="noise" d="M${x1} ${y1} L${x2} ${y2}"/>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="54" viewBox="0 0 180 54"><rect width="180" height="54" fill="#f4eadb"/><g fill="none" stroke="#6d4c41" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">${glyphs}</g><g fill="none" stroke="#b58b68" stroke-width="1" opacity="0.55">${noise}</g></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

module.exports = { renderCaptchaSvgDataUri };
```

The final code must keep `GLYPHS` values as arrays so multi-character segment
names (`g1`, `g2`) remain unambiguous, and it must contain no answer-bearing
metadata.

- [x] **Step 5: Implement the bounded one-time service**

Create `backend/src/services/captchaService.js`:

```js
const crypto = require('crypto');
const errors = require('../utils/safeErrors');
const { renderCaptchaSvgDataUri } = require('../utils/captchaRenderer');

const CAPTCHA_TTL_SECONDS = 5 * 60;
const CAPTCHA_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DEFAULT_MAX_ACTIVE_CHALLENGES = 5000;

function answerDigest(answer) {
  return crypto.createHash('sha256').update(answer).digest();
}

function createCaptchaService({
  clock = Date.now,
  randomInt = crypto.randomInt,
  randomBytes = crypto.randomBytes,
  renderImage = renderCaptchaSvgDataUri,
  maxActiveChallenges = DEFAULT_MAX_ACTIVE_CHALLENGES,
  onChallengeIssued,
} = {}) {
  const challenges = new Map();

  function removeExpired(now) {
    for (const [token, record] of challenges) {
      if (record.expiresAt <= now) challenges.delete(token);
    }
  }

  function createChallenge() {
    const now = clock();
    removeExpired(now);
    if (challenges.size >= maxActiveChallenges) {
      throw errors.serviceUnavailable(
        'CAPTCHA_UNAVAILABLE',
        'Captcha is temporarily unavailable.'
      );
    }
    const answer = Array.from(
      { length: randomInt(3) + 4 },
      () => CAPTCHA_ALPHABET[randomInt(CAPTCHA_ALPHABET.length)]
    ).join('');
    let captchaToken;
    do {
      captchaToken = randomBytes(32).toString('base64url');
    } while (challenges.has(captchaToken));
    const expiresAt = now + CAPTCHA_TTL_SECONDS * 1000;
    challenges.set(captchaToken, { answerDigest: answerDigest(answer), expiresAt });
    onChallengeIssued?.({ captchaToken, answer, expiresAt });
    return {
      image: renderImage(answer, { randomInt }),
      captchaToken,
      expiresIn: CAPTCHA_TTL_SECONDS,
    };
  }

  function verifyChallenge(captchaToken, captchaAnswer) {
    if (
      typeof captchaToken !== 'string'
      || typeof captchaAnswer !== 'string'
      || !/^[A-Z]{4,6}$/i.test(captchaAnswer.trim())
    ) return false;
    const record = challenges.get(captchaToken);
    if (!record) return false;
    challenges.delete(captchaToken);
    if (record.expiresAt <= clock()) return false;
    return crypto.timingSafeEqual(
      answerDigest(captchaAnswer.trim().toUpperCase()),
      record.answerDigest
    );
  }

  return { createChallenge, verifyChallenge };
}

const defaultCaptchaService = createCaptchaService();

module.exports = { createCaptchaService, defaultCaptchaService };
```

- [x] **Step 6: Run the focused test to verify GREEN**

Run:

```powershell
cd backend
npm.cmd test -- --runTestsByPath tests/captchaService.test.js
```

Expected: PASS with five tests and no warning/error output.

- [x] **Step 7: Identify the obsolete signed-payload references**

Keep `backend/src/utils/captchaUtils.js` and `backend/tests/captchaUtils.test.js`
until the Task 2 route tests have demonstrated the real `NODE_ENV=test` bypass.
Run:

```powershell
rg -n "captchaUtils|createCaptcha\(|verifyCaptcha\(" src tests
```

Expected: route/controller and the obsolete test still reference the old module.
Delete both old files during Task 2 Step 5, when controller/middleware wiring is
switched to the injected service, so the Task 2 RED failure proves behavior
rather than a broken import.

- [x] **Step 8: Preserve the uncommitted checkpoint for H2**

Run:

```powershell
git diff --check
git status --short
```

Expected: only Task 1 files are changed; do not commit yet because repository H2 must review the complete implementation diff.

---

### Task 2: Wire CAPTCHA fail-closed through real auth routes

**Files:**
- Create: `backend/tests/captchaRoutes.test.js`
- Create: `backend/tests/helpers/captchaTestService.js`
- Modify: `backend/src/app.js`
- Modify: `backend/src/routes/authRoutes.js`
- Modify: `backend/src/controllers/authController.js`
- Modify: `backend/src/middleware/captchaMiddleware.js`
- Modify: `backend/tests/authRoutes.test.js`
- Modify: `backend/tests/bookRoutes.test.js`
- Modify: `backend/tests/borrowingRoutes.test.js`
- Modify: `backend/tests/httpsEnforcement.test.js`
- Modify: `backend/tests/integration.test.js`
- Modify: `backend/tests/inventoryRoutes.test.js`
- Modify: `backend/tests/membershipRoutes.test.js`
- Modify: `backend/tests/notificationRoutes.test.js`
- Modify: `backend/tests/reportRoutes.test.js`
- Modify: `backend/tests/reservationRoutes.test.js`
- Modify: `backend/tests/helpers/systemIntegrationHarness.js`

**Interfaces:**
- Consumes: `captchaService.createChallenge()` and `captchaService.verifyChallenge(token, answer)` from Task 1.
- Produces: `createApp({ captchaService })` explicit dependency seam.
- Produces: `createAcceptingCaptchaService()` only under `backend/tests/helpers/`.

- [x] **Step 1: Write failing route tests**

Create `backend/tests/captchaRoutes.test.js`:

```js
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'captcha-route-test-secret';

const request = require('supertest');
const { createApp } = require('../src/app');
const { createCaptchaService } = require('../src/services/captchaService');

function authService() {
  return {
    register: jest.fn(async () => ({ ok: true })),
    login: jest.fn(async () => ({ ok: true })),
  };
}

test.each([
  ['/api/auth/register', 'register'],
  ['/api/auth/login', 'login'],
])('%s rejects missing CAPTCHA before auth dispatch even in NODE_ENV=test', async (path, method) => {
  const service = authService();
  const app = createApp({ authService: service });
  const response = await request(app).post(path).send({
    email: 'member@example.test',
    password: 'Password1!',
    confirmPassword: 'Password1!',
    fullName: 'Member',
  });
  expect(response.status).toBe(400);
  expect(response.body.error.code).toBe('CAPTCHA_INVALID');
  expect(service[method]).not.toHaveBeenCalled();
});

test('a valid login CAPTCHA dispatches once and replay is rejected', async () => {
  let issued;
  const captchaService = createCaptchaService({
    randomInt: () => 0,
    randomBytes: () => Buffer.alloc(32, 7),
    onChallengeIssued: (value) => { issued = value; },
  });
  const service = authService();
  const app = createApp({ authService: service, captchaService });
  const challenge = await request(app).get('/api/auth/captcha');
  const payload = {
    email: 'member@example.test',
    password: 'Password1!',
    captchaToken: challenge.body.captchaToken,
    captchaAnswer: issued.answer,
  };

  expect((await request(app).post('/api/auth/login').send(payload)).status).toBe(200);
  expect((await request(app).post('/api/auth/login').send(payload)).body.error.code)
    .toBe('CAPTCHA_INVALID');
  expect(service.login).toHaveBeenCalledTimes(1);
});
```

- [x] **Step 2: Run route tests to verify RED**

Run:

```powershell
cd backend
npm.cmd test -- --runTestsByPath tests/captchaRoutes.test.js
```

Expected: FAIL because `createApp` does not accept/share `captchaService` and the middleware still bypasses under `NODE_ENV=test`.

- [x] **Step 3: Add the explicit non-CAPTCHA test service**

Create `backend/tests/helpers/captchaTestService.js`:

```js
function createAcceptingCaptchaService() {
  return {
    createChallenge() {
      return {
        image: 'data:image/svg+xml;base64,PHN2Zy8+',
        captchaToken: 'test-captcha-token',
        expiresIn: 300,
      };
    },
    verifyChallenge() {
      return true;
    },
  };
}

module.exports = { createAcceptingCaptchaService };
```

This helper must never be imported by `backend/src/`.

- [x] **Step 4: Replace environment bypass with injected verification**

Change `backend/src/middleware/captchaMiddleware.js` to:

```js
const errors = require('../utils/safeErrors');

function createCaptchaValidator(captchaService) {
  return (req, _res, next) => {
    // @spec FR-FE02-029, FR-FE02-030
    if (captchaService.verifyChallenge(
      req.body?.captchaToken,
      req.body?.captchaAnswer
    )) return next();
    return next(errors.badRequest(
      'CAPTCHA_INVALID',
      'Captcha is invalid or expired.'
    ));
  };
}

module.exports = { createCaptchaValidator };
```

No branch may read `NODE_ENV` or accept a `required` flag.

- [x] **Step 5: Share one service across app, routes, controller, and middleware**

Update signatures and calls exactly as follows:

```js
// backend/src/app.js
const { defaultCaptchaService } = require('./services/captchaService');

function createApp({
  authService = defaultAuthService,
  captchaService = defaultCaptchaService,
  borrowingService = defaultBorrowingService,
  notificationService = defaultNotificationService,
  reportService = defaultReportService,
  reservationService = defaultReservationService,
  profileService = defaultProfileService,
  fineManagementService = defaultFineManagementService,
  inventoryService = defaultInventoryService,
  membershipService,
  userManagementService,
  adminService,
  schemaReadinessService = defaultSchemaReadinessService,
} = {}) {
  app.use('/api/auth', createAuthRoutes({ authService, captchaService }));
}
```

```js
// backend/src/routes/authRoutes.js
function createAuthRoutes({ authService, captchaService }) {
  const router = express.Router();
  const controller = createAuthController({ authService, captchaService });
  const authenticate = createAuthenticate(authService);
  const captchaValidator = createCaptchaValidator(captchaService);

  router.get('/captcha', controller.captcha);
  router.post('/register', captchaValidator, registerValidators, controller.register);
  router.post('/verify-email', verifyEmailValidators, controller.verifyEmail);
  router.post('/resend-verification', resendVerificationValidators, controller.resendVerification);
  router.post('/login', captchaValidator, loginValidators, controller.login);
  router.post('/refresh-token', refreshTokenValidators, controller.refreshToken);
  router.post('/logout', logoutValidators, controller.logout);
  router.post('/change-password', authenticate, changePasswordValidators, controller.changePassword);
  router.post('/change-password/request-otp', authenticate, requestChangePasswordOtpValidators, controller.requestChangePasswordOtp);
  router.post('/change-password/confirm', authenticate, confirmChangePasswordValidators, controller.confirmChangePassword);
  router.post('/forgot-password', forgotPasswordValidators, controller.forgotPassword);
  router.post('/reset-password', resetPasswordValidators, controller.resetPassword);
  router.get('/me', authenticate, controller.me);

  return router;
}
```

```diff
 // backend/src/controllers/authController.js
-const { createCaptcha } = require('../utils/captchaUtils');
+const { defaultCaptchaService } = require('../services/captchaService');
-function createAuthController(authService = defaultAuthService) {
+function createAuthController({
+  authService = defaultAuthService,
+  captchaService = defaultCaptchaService,
+} = {}) {
   return {
     captcha: async (_req, res, next) => {
       try {
         // @spec FR-FE02-028
-        return res.status(200).json(createCaptcha());
+        return res.status(200).json(captchaService.createChallenge());
       } catch (error) {
         return next(error);
       }
     },
```

Keep the existing `register`, `verifyEmail`, `login`, token, password, and `me`
handler properties byte-for-byte after this exact edit.

- [x] **Step 6: Inject the explicit test service into unrelated auth-flow suites**

In every test setup file listed in this task, import:

```js
const {
  createAcceptingCaptchaService,
} = require('./helpers/captchaTestService');
```

Use `./captchaTestService` from files already inside `backend/tests/helpers/`. Add
`captchaService: createAcceptingCaptchaService()` to the nearest shared
`createApp(...)` factory rather than every individual test. Do not add CAPTCHA
payload fields to hundreds of unrelated auth assertions.

For `backend/tests/helpers/systemIntegrationHarness.js`, change the factory to:

```js
function makeSystemIntegrationApp({
  borrowingNotificationError = null,
  captchaService = createAcceptingCaptchaService(),
} = {}) {
  const services = {
    authService,
    captchaService,
    borrowingService,
    reservationService,
    fineManagementService,
    notificationService,
    reportService,
    profileService,
    adminService,
    userManagementService,
    membershipService,
  };
  return { app: createApp(services), services, dependencies };
}
```

Extend `createVerifiedActor` in the same helper with an optional explicit test
payload so the E2E control server can seed actors without weakening the UI
challenge path:

```diff
 async function createVerifiedActor({
   setup,
   email,
   password = 'Password1!',
   role = 'MEMBER',
   approveMember = true,
   completeProfile = false,
+  captcha = {},
 }) {
   const registered = await request(setup.app).post('/api/auth/register').send({
     email,
     password,
     confirmPassword: password,
     fullName: email.split('@')[0],
+    ...captcha,
   });
@@
-  const login = await request(setup.app).post('/api/auth/login').send({ email, password });
+  const login = await request(setup.app).post('/api/auth/login').send({
+    email,
+    password,
+    ...captcha,
+  });
```

- [x] **Step 7: Run focused and affected backend tests to verify GREEN**

Run:

```powershell
cd backend
npm.cmd test -- --runTestsByPath tests/captchaService.test.js tests/captchaRoutes.test.js tests/authRoutes.test.js tests/httpsEnforcement.test.js tests/systemIntegration.test.js
```

Expected: all listed suites PASS; the dedicated route suite proves no `NODE_ENV=test` bypass.

- [x] **Step 8: Verify no production test bypass remains**

Run:

```powershell
rg -n "NODE_ENV.*captcha|captcha.*NODE_ENV|required.*captcha|createAcceptingCaptchaService" src tests
```

Expected: no environment-derived CAPTCHA bypass in `src`; `createAcceptingCaptchaService` appears only under `backend/tests/`.

- [x] **Step 9: Preserve the uncommitted checkpoint for H2**

Run `git diff --check` and `git status --short`. Do not commit.

---

### Task 3: Replace the browser plaintext decoder with an isolated E2E test seam

**Files:**
- Modify: `tests/e2e/support/systemTestServer.js`
- Modify: `tests/e2e/support/solveCaptcha.js`

**Interfaces:**
- Consumes: real `createCaptchaService({ onChallengeIssued })` from Task 1.
- Consumes: `makeSystemIntegrationApp({ captchaService })` from Task 2.
- Produces: test-only `GET /__e2e__/captcha-answer` response `{ answer }`.

- [x] **Step 1: Write the failing E2E helper expectation**

Change `tests/e2e/support/solveCaptcha.js` first so it no longer decodes SVG:

```js
const E2E_BACKEND_URL = `http://127.0.0.1:${Number(process.env.E2E_BACKEND_PORT || 3100)}`;

async function solveCaptcha(page) {
  await page.getByRole('img', {
    name: 'CAPTCHA gồm 4 đến 6 chữ cái',
  }).waitFor({ state: 'visible' });
  const response = await page.request.get(`${E2E_BACKEND_URL}/__e2e__/captcha-answer`);
  if (!response.ok()) throw new Error('Could not read the E2E CAPTCHA answer.');
  const { answer } = await response.json();
  if (!/^[A-Z]{4,6}$/.test(answer || '')) {
    throw new Error('E2E CAPTCHA answer was unavailable.');
  }
  await page.getByRole('textbox', {
    name: 'Nhập mã CAPTCHA',
    exact: true,
  }).fill(answer);
}

module.exports = { solveCaptcha };
```

- [x] **Step 2: Run one browser flow to verify RED**

Run:

```powershell
npx.cmd playwright test tests/e2e/system-golden-path.spec.js --project=chromium
```

Expected: FAIL because `/__e2e__/captcha-answer` does not exist.

- [x] **Step 3: Instrument only the E2E server**

In `tests/e2e/support/systemTestServer.js`, import `createCaptchaService` and
replace direct `makeSystemIntegrationApp()` calls with:

```js
const {
  createCaptchaService,
} = require('../../../backend/src/services/captchaService');

const E2E_SEED_CAPTCHA = {
  captchaToken: '__e2e_seed_captcha__',
  captchaAnswer: 'SEED',
};
let latestCaptchaAnswer = null;

function makeE2eSetup() {
  latestCaptchaAnswer = null;
  const realCaptchaService = createCaptchaService({
    onChallengeIssued({ answer }) {
      latestCaptchaAnswer = answer;
    },
  });
  const captchaService = {
    createChallenge: realCaptchaService.createChallenge,
    verifyChallenge(token, answer) {
      if (
        token === E2E_SEED_CAPTCHA.captchaToken
        && answer === E2E_SEED_CAPTCHA.captchaAnswer
      ) return true;
      return realCaptchaService.verifyChallenge(token, answer);
    },
  };
  return makeSystemIntegrationApp({ captchaService });
}

let setup = makeE2eSetup();
```

Use `setup = makeE2eSetup()` inside `/__e2e__/setup`. Add this control branch
inside `handleControl`:

```js
if (req.method === 'GET' && pathname === '/__e2e__/captcha-answer') {
  if (!latestCaptchaAnswer) {
    sendJson(res, 404, { error: 'No CAPTCHA answer has been issued.' });
    return;
  }
  sendJson(res, 200, { answer: latestCaptchaAnswer });
  return;
}
```

Pass `captcha: E2E_SEED_CAPTCHA` to each `createVerifiedActor(...)` call inside
the `/__e2e__/setup` control branch. This seed credential exists only in the
test server and is never accepted by the production default service.

Do not add this endpoint to `backend/src/app.js`, OpenAPI, or production routes.

- [x] **Step 4: Re-run the browser flow to verify GREEN**

Run:

```powershell
npx.cmd playwright test tests/e2e/system-golden-path.spec.js --project=chromium
```

Expected: PASS; the helper contains no SVG decode or answer extraction.

- [x] **Step 5: Prove the production response contains no test answer**

Run:

```powershell
rg -n "captcha-answer|latestCaptchaAnswer|onChallengeIssued" backend/src tests/e2e
```

Expected: test-answer symbols exist only under `tests/e2e`; `onChallengeIssued`
exists in the injectable service but no production caller supplies it.

- [x] **Step 6: Preserve the uncommitted checkpoint for H2**

Run `git diff --check` and keep the diff uncommitted.

---

### Task 4: Disable auth submission while CAPTCHA is unavailable

**Files:**
- Modify: `frontend/test/captchaFrontend.test.js`
- Modify: `frontend/src/component/login/LoginForm.jsx`
- Modify: `frontend/src/component/register/AuthCard.jsx`

**Interfaces:**
- Consumes: existing child-to-parent CAPTCHA state `{ captchaToken, captchaAnswer }`.
- Produces: fail-safe submit disabled state without clearing existing form fields.

- [x] **Step 1: Add failing frontend contract assertions**

Extend `frontend/test/captchaFrontend.test.js`:

```js
test('auth submission stays disabled until a CAPTCHA challenge is available', async () => {
  const [login, register, captcha] = await Promise.all([
    readFile(new URL('../src/component/login/LoginForm.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/component/register/AuthCard.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/component/auth/CaptchaField.jsx', import.meta.url), 'utf8'),
  ]);

  assert.match(login, /disabled=\{isSubmitting \|\| isLocked \|\| !captcha\.captchaToken\}/);
  assert.match(register, /disabled=\{isBusy \|\| \(!verificationStep && !captcha\.captchaToken\)\}/);
  assert.match(captcha, /onChange\?\.\(\{ captchaToken: '', captchaAnswer: '' \}\)/);
  assert.match(captcha, /Không tải được CAPTCHA\. Vui lòng thử lại\./);
  assert.match(captcha, /type="button"/);
});
```

- [x] **Step 2: Run frontend tests to verify RED**

Run:

```powershell
cd frontend
node --test --test-name-pattern="auth submission stays disabled" test/captchaFrontend.test.js
```

Expected: FAIL because both submit buttons ignore `captcha.captchaToken`.

- [x] **Step 3: Implement the minimal disabled-state wiring**

Change the login submit button in `LoginForm.jsx` to:

```jsx
disabled={isSubmitting || isLocked || !captcha.captchaToken}
```

Change the shared register/verify submit button in `AuthCard.jsx` to:

```jsx
disabled={isBusy || (!verificationStep && !captcha.captchaToken)}
```

Do not clear `email`, `password`, registration fields, or OTP state when the
CAPTCHA token is reset.

- [x] **Step 4: Run frontend tests and lint to verify GREEN**

Run:

```powershell
cd frontend
npm.cmd test
npm.cmd run lint
```

Expected: all frontend tests PASS and ESLint exits 0.

- [x] **Step 5: Preserve the uncommitted checkpoint for H2**

Run `git diff --check` and keep the diff uncommitted.

---

### Task 5: Reconcile FE02 specification, task state, and traceability

**Files:**
- Modify: `.sdd/specs/feat-auth/SPEC.md`
- Modify: `.sdd/specs/feat-auth/PLAN.md`
- Modify: `.sdd/specs/feat-auth/TASKS.md`
- Modify: `.sdd/specs/feat-auth/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-auth/CHANGELOG.md`
- Modify: `.sdd/specs/feat-auth/contracts/captcha.md`
- Modify: `.sdd/specs/feat-auth/data-model.md`
- Modify: `.sdd/specs/feat-auth/research.md`
- Modify: `.sdd/specs/feat-auth/quickstart.md`
- Modify: `docs/superpowers/specs/2026-08-04-fe02-captcha-security-remediation-design.md`

**Interfaces:**
- Consumes: verified behavior and test paths from Tasks 1-4.
- Produces: unique stable IDs and complete rule-to-code-to-test traceability.

- [x] **Step 1: Run traceability before documentation changes**

Run:

```powershell
npm.cmd run trace:enforce
```

Expected: it may pass because the current checker does not detect the omitted
CAPTCHA rows; preserve this result as evidence that the H3 manual finding is a
real coverage gap rather than a current CI failure.

- [x] **Step 2: Correct the authoritative CAPTCHA contract**

Replace the top CAPTCHA block in `SPEC.md` with these exact Vietnamese obligations:

```markdown
- BR-FE02-029: Trước khi tạo tài khoản hoặc xác thực thông tin đăng nhập, Khách phải giải CAPTCHA gồm 4-6 chữ cái Latin do máy chủ phát hành. Máy chủ phải giữ bộ xác minh đáp án, thời hạn và trạng thái đã sử dụng; token công khai phải là giá trị ngẫu nhiên opaque và chỉ hợp lệ cho một lần xác minh.
- FR-FE02-028: `GET /api/auth/captcha` phải trả về ảnh SVG không chứa text hoặc metadata làm lộ đáp án, cùng `captchaToken` ngẫu nhiên opaque hết hạn sau 5 phút. Bộ nhớ challenge trong tiến trình phải giới hạn tối đa 5.000 bản ghi cho kiến trúc một instance đã phê duyệt.
- FR-FE02-029: `POST /api/auth/register` và `POST /api/auth/login` phải yêu cầu và tiêu thụ `captchaToken` cùng `captchaAnswer` trước khi dispatch service, so sánh đáp án sau trim và không phân biệt hoa thường.
- FR-FE02-030: CAPTCHA thiếu, hết hạn, không tồn tại, đã dùng, bị replay hoặc sai phải trả `400 CAPTCHA_INVALID`; khi kho challenge đầy, hệ thống phải fail-closed và không dispatch service xác thực.
- AC-FE02-027: Challenge đúng và còn hạn chỉ cho phép luồng đăng ký/đăng nhập hiện có tiếp tục đúng một lần. Challenge sai hoặc replay không được tạo người dùng, OTP, phiên, bản ghi login failure hoặc audit xác thực.
- EC-FE02-019: Khi API CAPTCHA không tải được, nút gửi đăng nhập/đăng ký bị vô hiệu hóa, dữ liệu biểu mẫu hiện có được giữ nguyên và người dùng có thể yêu cầu challenge mới.
```

Keep the final document in Vietnamese to match the existing source of truth.

- [x] **Step 3: Repair the traceability tables and counts**

Add an `AC-FE02-027` row after `AC-FE02-026` mapping:

```markdown
| AC-FE02-027 | Opaque one-time CAPTCHA permits one valid login/register dispatch; invalid, expired, replayed, or unavailable challenges fail before auth state changes | FR-FE02-028, FR-FE02-029, FR-FE02-030 | BR-FE02-029 | `backend/tests/captchaService.test.js`; `backend/tests/captchaRoutes.test.js`; `frontend/test/captchaFrontend.test.js`; browser E2E | COMPLETE - pending H2/H3 integration evidence |
```

Add `FR-FE02-030` to the unwanted-behavior table, sourced from
`EC-FE02-019`, and update the coverage summary exactly to:

```markdown
- **Total AC**: 27 (AC-FE02-001 through AC-FE02-027) - all mapped.
- **Total FR**: 30 (FR-FE02-001 through FR-FE02-030) - all mapped.
- **Unwanted-behavior EARS FRs**: 10 (`FR-FE02-015` through `FR-FE02-021`, `FR-FE02-023`, `FR-FE02-025`, `FR-FE02-030`) = 33.3% of total FRs.
- **Total BR**: 29 (BR-FE02-001 through BR-FE02-029) - all mapped directly or through AC/NFR traceability.
```

Remove every claim that CAPTCHA H3 has already passed. Preserve historical H3
statements that refer to older FE02 baselines and clearly distinguish them from
PR #111.

- [x] **Step 4: Reopen and close the remediation task accurately**

Add `FE02-T070 - Remediate CAPTCHA H3 security and traceability blockers` to
`TASKS.md`, mapped to the four blockers and the files/tests in this plan. Mark
it complete only after Tasks 1-4 pass focused checks. Set the current PR state
to `IMPLEMENTED - PENDING H2/H3`, not `COMPLETE` or `H3 APPROVED`.

Update the remaining FE02 documents so they consistently state:

- opaque random token;
- bounded server-side process-local state;
- one verification attempt;
- non-text SVG path rendering;
- explicit test dependency injection;
- no database/runtime dependency;
- single-instance boundary and restart behavior.

- [x] **Step 5: Run documentation gates**

Run:

```powershell
npm.cmd run trace:enforce
git diff --check
rg -n "EC-FE02-018.*CAPTCHA|answerHash|JWT_SECRET.*CAPTCHA|H3.*CAPTCHA.*APPROVED" .sdd/specs/feat-auth docs/superpowers/specs/2026-08-04-fe02-captcha-security-remediation-design.md
```

Expected: traceability exits 0; no duplicate CAPTCHA `EC-FE02-018`, client
`answerHash`, JWT secret reuse, or premature CAPTCHA H3 approval remains.

- [x] **Step 6: Preserve the complete uncommitted diff for H2**

Run:

```powershell
git status --short
git diff --stat origin/capcha
git diff --check
```

Expected: the design commit is the only commit ahead of `origin/capcha`; all
implementation/spec remediation remains uncommitted for H2 review.

---

### Task 6: Run full validation, obtain H2, publish, rerun H3, and merge

**Files:**
- Review all files changed by Tasks 1-5.
- No new production scope is allowed in this task.

**Interfaces:**
- Consumes: complete uncommitted remediation diff and focused RED-GREEN evidence.
- Produces: one H2-authorized implementation commit, exact-head CI evidence, H3 decision, guarded merge, and post-merge CI evidence.

- [x] **Step 1: Run the complete local validation gate**

Run from the repository root, stopping on the first deterministic failure:

```powershell
npm.cmd run test:secrets
npm.cmd audit --audit-level=high
npm.cmd --prefix backend audit --audit-level=high
npm.cmd --prefix frontend run audit:high
npm.cmd --prefix backend test
npm.cmd run test:system
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run build
npm.cmd run test:e2e
npm.cmd run test:deployment
npm.cmd run trace:enforce
node -e "require('./backend/src/app')"
git diff --check
```

Expected: every command exits 0. Record exact test counts and any browser test
count from fresh output. A deterministic failure gets at most three total fix
attempts; a suspected E2E flake may be rerun once with evidence.

- [x] **Step 2: Perform H2 review on the complete uncommitted diff**

Review against:

- the approved design document;
- `BR-FE02-029`, `FR-FE02-028..030`, `AC-FE02-027`, `EC-FE02-019`;
- repository Standards and safety constraints;
- L1 automated evidence, L2 spec mapping, L3 safety, and L4 browser acceptance.

Present the exact diff/evidence to the human reviewer. Do not commit until H2 is
explicitly approved.

- [ ] **Step 3: Commit the H2-approved exact diff**

After H2 approval only:

```powershell
git add -- .sdd/specs/feat-auth backend frontend tests/e2e docs/superpowers/specs/2026-08-04-fe02-captcha-security-remediation-design.md docs/superpowers/plans/2026-08-04-fe02-captcha-security-remediation.md
git diff --cached --check
git commit -m "fix: harden FE02 CAPTCHA verification"
```

Expected: one implementation/remediation commit; no unrelated primary-worktree files.

- [ ] **Step 4: Push the current branch to the PR head**

Because the local branch tracks `origin/capcha`, push with an exact non-force update:

```powershell
git push origin HEAD:capcha
```

Expected: push succeeds without force; capture the new exact head SHA.

- [ ] **Step 5: Wait for exact-head required CI**

Run:

```powershell
gh pr checks 111 --repo SWP391-LibraryManagement/LibraryManagement --watch
```

Expected: `foundation-checks` succeeds on the pushed head. If `main` advances
and the PR becomes behind, use the GitHub update-branch API with
`expected_head_sha`, then repeat exact-head CI.

- [ ] **Step 6: Perform H3 two-axis integration review**

Run independent Standards and Spec reviews against the exact current
`origin/main...origin/capcha` diff. Confirm:

- no plaintext answer or answer verifier is client-visible;
- one-time consumption and expiry are tested;
- no environment-based production bypass exists;
- browser test answers exist only under `/__e2e__/` test infrastructure;
- submit controls fail safely;
- traceability IDs are unique and complete;
- all required CI and review conversations are clear.

Any blocker stops merge and returns to the relevant task.

- [ ] **Step 7: Merge with exact-head protection**

After green exact-head CI and no H3 blockers:

```powershell
$exactHead = gh pr view 111 --repo SWP391-LibraryManagement/LibraryManagement --json headRefOid --jq '.headRefOid'
gh pr merge 111 --repo SWP391-LibraryManagement/LibraryManagement --merge --match-head-commit $exactHead
```

Expected: PR #111 becomes `MERGED`; capture the merge commit SHA.

- [ ] **Step 8: Verify exact post-merge main CI**

Find and watch the CI run whose `headSha` is the merge commit:

```powershell
$mergeSha = gh pr view 111 --repo SWP391-LibraryManagement/LibraryManagement --json mergeCommit --jq '.mergeCommit.oid'
$runs = gh run list --repo SWP391-LibraryManagement/LibraryManagement --branch main --workflow CI --limit 10 --json databaseId,headSha,status,conclusion,url | ConvertFrom-Json
$runId = ($runs | Where-Object headSha -eq $mergeSha | Select-Object -First 1).databaseId
gh run watch $runId --repo SWP391-LibraryManagement/LibraryManagement --exit-status
```

Expected: post-merge `foundation-checks` succeeds for the exact merge SHA.

---

## Completion Evidence Checklist

- [x] Design approved and linked.
- [x] Plan approved and execution mode selected.
- [x] Focused tests observed RED before production changes.
- [x] Focused tests observed GREEN after each minimal change.
- [x] Public token is opaque; SVG contains no answer text/verifier.
- [x] Correct and incorrect attempts both consume challenges.
- [x] Capacity and restart/expiry behavior are documented.
- [x] Login/register routes fail closed in `NODE_ENV=test` unless an explicit test service is injected.
- [x] Production code imports no accepting test service or E2E answer endpoint.
- [x] Login/register submit is disabled while no challenge token exists.
- [x] `EC-FE02-019` is unique; `AC-FE02-027` and summary counts are complete.
- [x] Full L1 automated gate passes with fresh counts.
- [x] H2 explicitly approves the complete uncommitted diff before commit.
- [ ] Exact-head CI passes after push/update-branch.
- [ ] H3 Standards and Spec reviews have no blockers.
- [ ] Exact-head guarded merge succeeds.
- [ ] Exact post-merge main CI succeeds.
