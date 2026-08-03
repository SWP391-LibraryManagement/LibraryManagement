# FE02 CAPTCHA Staging Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every 4-6-letter CAPTCHA render fully, recover safely from transient browser load failures, and prevent stale GitHub Actions runs from overwriting the newest staging deployment.

**Architecture:** Keep the existing CAPTCHA API and 180x54 SVG contract. Tighten spacing only when six glyphs require it, isolate bounded retry logic in a small frontend utility, gate every Azure deployment against the current remote `main` SHA, and extend the staging smoke contract to verify the public CAPTCHA response without solving or exposing it.

**Tech Stack:** Node.js 22, Express 5, React 19, Jest 30, Node test runner, GitHub Actions, Azure App Service, Azure Static Web Apps.

## Global Constraints

- Follow `.agents/AGENTS.md`, `.agents/CLAUDE.md`, `.sdd/constitution.md`, and `.sdd/constraints/safety.md`.
- Map behavior changes to `FR-FE02-028`, `FR-FE02-030`, `AC-FE02-027`, `EC-FE02-019`, and new task `FE02-T071`.
- Keep the public response `{ image, captchaToken, expiresIn: 300 }`, 4-6 Latin letters, opaque 32-byte base64url token, one-time verification, and process-local storage unchanged.
- Keep the SVG at `180x54`; add no dependency, database change, external provider, production debug route, or answer-bearing metadata.
- Retry initial browser loading once only; do not create an unbounded retry loop.
- A stale workflow must perform no Azure deployment write.
- Keep implementation changes uncommitted until the complete diff and local evidence receive H2 approval.
- Work only in `D:\SWP391\library-management-system\.worktrees\captcha-staging-reliability`.

---

## File Map

- Modify `backend/tests/captchaService.test.js`: prove six glyphs remain inside the SVG viewport at both rotation extremes.
- Modify `backend/src/utils/captchaRenderer.js`: calculate a safe glyph step from answer length.
- Create `frontend/src/utils/captchaRecovery.js`: perform a bounded CAPTCHA request retry.
- Create `frontend/test/captchaRecovery.test.js`: test retry success and bounded failure using real utility behavior.
- Modify `frontend/src/component/auth/CaptchaField.jsx`: preserve a usable challenge until replacement succeeds and use one initial retry.
- Modify `frontend/test/captchaFrontend.test.js`: assert recovery wiring and no pre-request challenge clearing.
- Modify `tests/deployment/stagingWorkflowPolicy.test.js`: require SHA freshness guards and deployment-step conditions.
- Modify `.github/workflows/deploy-staging.yml`: skip stale preflight/backend/frontend work before Azure writes.
- Modify `tests/deployment/smokeStaging.test.js`: add healthy, missing, and unsafe CAPTCHA route fixtures.
- Modify `scripts/smoke-staging.js`: validate the deployed public CAPTCHA response.
- Modify FE02 `SPEC.md`, `PLAN.md`, `TASKS.md`, `TEST_PLAN.md`, and `CHANGELOG.md`: record retry/preservation behavior and `FE02-T071`.

---

### Task 1: Keep Six CAPTCHA Glyphs Inside the Existing Viewport

**Files:**
- Modify: `backend/tests/captchaService.test.js`
- Modify: `backend/src/utils/captchaRenderer.js`

**Interfaces:**
- Consumes: `renderCaptchaSvgDataUri(answer, { randomInt })`.
- Produces: the same SVG data URI contract with safe horizontal placement for answer lengths 4-6.

- [ ] **Step 1: Add the failing renderer-bound test**

Add helpers that parse each glyph group's translate/rotate transform, apply the transform to every path endpoint, include half the 3.2px stroke width, and assert the visible bounds remain within `0..180`.

```js
function renderedGlyphXBounds(svg) {
  const points = [];
  const groups = svg.matchAll(
    /<g transform="translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+) 13 24\)">([\s\S]*?)<\/g>/g
  );

  for (const [, translateX, , rotation, paths] of groups) {
    const radians = Number(rotation) * Math.PI / 180;
    for (const path of paths.matchAll(/M([\d.]+) ([\d.]+) L([\d.]+) ([\d.]+)/g)) {
      for (const [x, y] of [[path[1], path[2]], [path[3], path[4]]]) {
        const dx = Number(x) - 13;
        const dy = Number(y) - 24;
        points.push(Number(translateX) + 13 + dx * Math.cos(radians) - dy * Math.sin(radians));
      }
    }
  }

  return { min: Math.min(...points) - 1.6, max: Math.max(...points) + 1.6 };
}

test.each([0, 8])('keeps six glyphs inside the 180px viewport at random value %i', (value) => {
  const svg = decodeSvg(renderCaptchaSvgDataUri('ABCDEF', { randomInt: () => value }));
  const bounds = renderedGlyphXBounds(svg);
  expect(bounds.min).toBeGreaterThanOrEqual(0);
  expect(bounds.max).toBeLessThanOrEqual(180);
});
```

- [ ] **Step 2: Run RED**

Run:

```powershell
npm --prefix backend test -- --runTestsByPath tests/captchaService.test.js
```

Expected: the six-glyph bounds test fails because the final group starts at x=178.

- [ ] **Step 3: Implement safe dynamic spacing**

Add renderer constants and calculate the step once:

```js
const VIEWBOX_WIDTH = 180;
const GLYPH_START_X = 8;
const DEFAULT_GLYPH_STEP = 34;
const MAX_GLYPH_TRANSLATE_X = 152;

function glyphStep(answerLength) {
  if (answerLength <= 1) return 0;
  return Math.min(
    DEFAULT_GLYPH_STEP,
    (MAX_GLYPH_TRANSLATE_X - GLYPH_START_X) / (answerLength - 1)
  );
}
```

Use `GLYPH_START_X + index * step` in the group transform and reuse `VIEWBOX_WIDTH` for noise and SVG dimensions.

- [ ] **Step 4: Run GREEN**

Run the focused test again. Expected: all CAPTCHA service/renderer tests pass.

---

### Task 2: Add Bounded Frontend Recovery Without Discarding a Usable Challenge

**Files:**
- Create: `frontend/src/utils/captchaRecovery.js`
- Create: `frontend/test/captchaRecovery.test.js`
- Modify: `frontend/src/component/auth/CaptchaField.jsx`
- Modify: `frontend/test/captchaFrontend.test.js`

**Interfaces:**
- Produces: `loadCaptchaWithRetry(load, options?) -> Promise<challenge>`.
- `options.attempts` defaults to 2; `options.retryDelayMs` defaults to 250; `options.wait` is injectable for tests.
- `CaptchaField` retries only initial/invalidated loading; manual replacement makes one request and keeps a usable challenge on failure.

- [ ] **Step 1: Write failing utility tests**

```js
test('retries one failed CAPTCHA load and returns the next challenge', async () => {
  let calls = 0;
  const challenge = { captchaToken: 'token', image: 'data:image/svg+xml;base64,PHN2Zy8+' };
  const result = await loadCaptchaWithRetry(async () => {
    calls += 1;
    if (calls === 1) throw new TypeError('temporary failure');
    return challenge;
  }, { retryDelayMs: 0, wait: async () => {} });
  assert.equal(result, challenge);
  assert.equal(calls, 2);
});

test('stops after the configured CAPTCHA attempts', async () => {
  let calls = 0;
  await assert.rejects(
    loadCaptchaWithRetry(async () => {
      calls += 1;
      throw new Error('unavailable');
    }, { attempts: 2, retryDelayMs: 0, wait: async () => {} }),
    /unavailable/
  );
  assert.equal(calls, 2);
});
```

- [ ] **Step 2: Run RED**

Run `node --test test/captchaRecovery.test.js` from `frontend`. Expected: module-not-found failure.

- [ ] **Step 3: Implement the retry utility**

```js
export async function loadCaptchaWithRetry(
  load,
  {
    attempts = 2,
    retryDelayMs = 250,
    wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds)),
  } = {}
) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await load();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await wait(retryDelayMs);
    }
  }
  throw lastError;
}
```

- [ ] **Step 4: Add failing component-wiring assertions**

Require `CaptchaField` to import `loadCaptchaWithRetry`, remove unconditional pre-request `setChallenge(null)`, invoke two attempts for initial/invalidated loads, retain the existing challenge on manual replacement failure, and clear parent CAPTCHA state only when no usable fallback exists.

- [ ] **Step 5: Implement minimal component recovery**

Use `loadCaptcha({ retry = false, discardCurrent = false })`. Compute `hasFallback = Boolean(challenge) && !discardCurrent`; clear immediately only for a parent-rejected challenge; call the retry utility with `attempts: retry ? 2 : 1`; clear answer/parent state after a successful replacement; and preserve the fallback in `catch`.

The effect calls:

```js
void loadCaptcha({ retry: true, discardCurrent: refreshKey > 0 });
```

The manual button continues to call `loadCaptcha` with one attempt.

- [ ] **Step 6: Run GREEN**

Run:

```powershell
node --test test/captchaRecovery.test.js test/captchaFrontend.test.js
npm run lint
```

Expected: new utility behavior, component source contract, and lint all pass.

---

### Task 3: Prevent Stale Workflow Runs From Writing to Staging

**Files:**
- Modify: `tests/deployment/stagingWorkflowPolicy.test.js`
- Modify: `.github/workflows/deploy-staging.yml`

**Interfaces:**
- Produces: `should_deploy` preflight output and `deployed` backend/frontend job outputs.
- Uses only checkout credentials and `git ls-remote origin refs/heads/main`; no new secret.

- [ ] **Step 1: Add the failing workflow policy test**

Assert that:

- `cancel-in-progress` remains `false`;
- preflight, backend, and frontend each contain `Verify deployment head is current main`;
- each guard compares `git rev-parse HEAD` with `git ls-remote origin refs/heads/main`;
- backend/frontend Azure write steps require `steps.deployment-head.outputs.should_deploy == 'true'`;
- smoke runs only when both deployment job outputs are `true`.

- [ ] **Step 2: Run RED**

Run `node --test tests/deployment/stagingWorkflowPolicy.test.js`. Expected: stale-head guard assertions fail.

- [ ] **Step 3: Add the preflight freshness output**

Add `outputs.should_deploy` and this PowerShell step after checkout:

```yaml
      - name: Verify deployment head is current main
        id: deployment-head
        shell: pwsh
        run: |
          $checkedOutHead = (git rev-parse HEAD).Trim()
          $currentMain = ((git ls-remote origin refs/heads/main) -split "`t")[0].Trim()
          $shouldDeploy = "$checkedOutHead" -eq "$currentMain"
          "should_deploy=$($shouldDeploy.ToString().ToLowerInvariant())" >> $env:GITHUB_OUTPUT
          if (-not $shouldDeploy) {
            Write-Output "Skipping stale staging run for $checkedOutHead; current main is $currentMain."
          }
```

Condition all FE10 proof steps on `steps.deployment-head.outputs.should_deploy == 'true'`.

- [ ] **Step 4: Recheck immediately before backend and frontend writes**

Add the same guard as the first identified step in each deployment job, expose job output `deployed`, and condition setup/package/install/deploy steps on the guard output. Gate `deploy-frontend` on successful backend deployment output and gate `smoke-test` on both outputs.

- [ ] **Step 5: Run GREEN**

Run the workflow policy test and full deployment test suite. Expected: all deployment policy tests pass.

---

### Task 4: Make Staging Smoke Prove the CAPTCHA Route and Safe Public Shape

**Files:**
- Modify: `tests/deployment/smokeStaging.test.js`
- Modify: `scripts/smoke-staging.js`

**Interfaces:**
- Adds `captcha` to the smoke result checks after `health`.
- Does not solve CAPTCHA or decode an answer.

- [ ] **Step 1: Add failing smoke fixtures and assertions**

Extend `startFixture` with `captchaStatus = 200` and `captchaPayload`. Serve `/api/auth/captcha` and add tests that:

- the healthy result contains `captcha`;
- HTTP 404 is rejected;
- an invalid image/token/expiry or any key matching `/answer|digest|hash/i` is rejected.

- [ ] **Step 2: Run RED**

Run `node --test tests/deployment/smokeStaging.test.js`. Expected: the healthy fixture does not yet produce a `captcha` check and unsafe responses are accepted.

- [ ] **Step 3: Implement the smoke check**

After health, request `${api}/api/auth/captcha`, parse JSON safely, and require:

```js
captchaResponse.status === 200
typeof captcha.image === 'string'
captcha.image.startsWith('data:image/svg+xml;base64,')
/^[A-Za-z0-9_-]{43}$/.test(captcha.captchaToken)
captcha.expiresIn === 300
!Object.keys(captcha).some((key) => /answer|digest|hash/i.test(key))
```

Throw `CAPTCHA route check failed with HTTP ...` on failure and push `captcha` on success.

- [ ] **Step 4: Run GREEN**

Run smoke tests and the full deployment suite. Expected: all pass.

---

### Task 5: Reconcile FE02 Specification and Task State

**Files:**
- Modify: `.sdd/specs/feat-auth/SPEC.md`
- Modify: `.sdd/specs/feat-auth/PLAN.md`
- Modify: `.sdd/specs/feat-auth/TASKS.md`
- Modify: `.sdd/specs/feat-auth/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-auth/CHANGELOG.md`
- Modify: `docs/superpowers/specs/2026-08-04-fe02-captcha-staging-reliability-design.md`

**Interfaces:**
- Produces: `FE02-T071` and observable behavior aligned with implementation/tests.

- [ ] **Step 1: Update the approved behavior contract**

Amend `FR-FE02-028` to require all 4-6 glyphs visible inside the SVG viewport. Amend `FR-FE02-030` and `EC-FE02-019` to require one bounded initial retry, preserve a usable challenge during manual replacement failure, and keep submit disabled when no valid challenge exists.

- [ ] **Step 2: Add `FE02-T071`**

Record renderer bounds, bounded frontend recovery, stale-deployment guards, CAPTCHA smoke verification, exact files, and focused evidence. Keep the implementation diff uncommitted and set the remediation state to pending H2.

- [ ] **Step 3: Update plan, test plan, changelog, and design correction**

Document the three proven root causes, the static serialized concurrency plus SHA guard decision, and the focused RED-GREEN commands. Do not claim staging success before the exact merged deployment is live.

- [ ] **Step 4: Run documentation gates**

Run:

```powershell
npm run trace:enforce
git diff --check
rg -n "FE02-T071|bounded|current main|/api/auth/captcha" .sdd/specs/feat-auth docs/superpowers/specs/2026-08-04-fe02-captcha-staging-reliability-design.md
```

Expected: traceability and diff checks pass; all remediation claims are present and consistent.

---

### Task 6: Validate the Complete Diff and Stop at H2

**Files:**
- Review every file changed by Tasks 1-5.
- Do not add scope in this task.

**Interfaces:**
- Produces: complete uncommitted implementation diff and fresh L1-L4 evidence for human H2 review.

- [ ] **Step 1: Run focused validation**

```powershell
npm --prefix backend test -- --runTestsByPath tests/captchaService.test.js tests/captchaRoutes.test.js
node --test frontend/test/captchaRecovery.test.js frontend/test/captchaFrontend.test.js
npm run test:deployment
npm run trace:enforce
```

- [ ] **Step 2: Run the complete local gate**

```powershell
npm run test:secrets
npm audit --audit-level=high
npm --prefix backend audit --audit-level=high
npm --prefix frontend run audit:high
npm --prefix backend test
npm run test:system
npm --prefix backend run test:coverage:ci
npm --prefix frontend run lint
npm --prefix frontend test
npm --prefix frontend run build
npm run test:e2e
npm run test:deployment
npm run trace:enforce
node -e "require('./backend/src/app')"
git diff --check
```

Expected: all repository-required gates pass. Record any known audit behavior accurately; do not run an automatic dependency fixer.

- [ ] **Step 3: Perform security and diff review**

Confirm no CAPTCHA answer/verifier is exposed, no retry loop is unbounded, no stale deployment can reach Azure write steps, no secret was added, and smoke verification only checks the public response shape.

- [ ] **Step 4: Present H2 evidence**

Show exact changed files, test counts, security findings, `git diff --check`, and the complete uncommitted diff summary. Wait for explicit H2 approval before staging or committing implementation files.

---

### Task 7: Publish, Review, Merge, and Verify Staging After H2

**Files:**
- No additional behavior changes unless a review finding requires returning to an earlier task.

- [ ] **Step 1: Commit the H2-approved implementation**

Stage only scoped files, verify the staged diff, and commit with:

```powershell
git commit -m "fix: stabilize CAPTCHA rendering and staging deployment"
```

- [ ] **Step 2: Push and create a ready PR**

Push `codex/fix-captcha-staging-reliability`, create a PR to `main`, and capture the exact head SHA.

- [ ] **Step 3: Wait for exact-head CI and perform H3**

Require green `foundation-checks`, a mergeable head, and no Standards or Spec blockers. Do not merge on stale CI evidence.

- [ ] **Step 4: Merge with exact-head protection**

Use GitHub's matching-head merge protection and record the merge SHA.

- [ ] **Step 5: Verify post-merge CI and staging**

Watch exact post-merge CI and the corresponding staging run. Confirm the deployed run used the merge SHA, then verify:

```text
GET /health -> 200
GET /api/auth/captcha -> 200 with safe public shape
```

Request multiple challenges and inspect only image bounds/response structure; never extract or report answers.

---

## Completion Evidence Checklist

- [x] Six-letter glyph bounds fail before and pass after the renderer change.
- [x] Initial CAPTCHA loading retries once and stops.
- [x] Manual replacement failure preserves a usable challenge.
- [x] Parent-rejected challenges are discarded before replacement.
- [x] Stale workflow runs skip all Azure writes.
- [x] Staging smoke fails when CAPTCHA is missing or unsafe.
- [x] FE02 specification and `FE02-T071` match implementation.
- [x] Full local gates pass with fresh evidence.
- [x] H2 approves the complete implementation diff before commit.
- [ ] Exact-head CI and H3 pass before merge.
- [ ] Exact post-merge staging serves the CAPTCHA route reliably.
- [x] H3 blockers are reproduced and remediated with RED-GREEN.
- [x] H2 re-approves the uncommitted H3 remediation diff.
- [x] H3 round 2 public-shape blocker is reproduced and remediated with RED-GREEN.
- [x] H2 re-approves the uncommitted H3 round 2 diff.
