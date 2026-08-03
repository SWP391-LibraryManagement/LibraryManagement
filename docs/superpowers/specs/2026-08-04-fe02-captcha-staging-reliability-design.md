# FE02 CAPTCHA Staging Reliability Design

Date: 2026-08-04

Status: APPROVED BY USER 2026-08-04

Owner: Dat

## 1. Decision

Fix the CAPTCHA reliability regression as one bounded FE02 remediation across
rendering, frontend recovery, and staging deployment safety. Keep the existing
public API, 4-6-letter challenge, 180x54 SVG, opaque one-time token, five-minute
TTL, and process-local single-instance storage.

The remediation shall:

- fit every 4-6-letter glyph sequence inside the existing SVG viewport;
- keep the current usable challenge visible until a replacement loads;
- retry an initial transient load failure once, then preserve the existing
  Vietnamese error and manual `Doi ma` recovery action;
- prevent an older queued workflow run from deploying after a newer `main`
  commit;
- make staging smoke verification fail when `/api/auth/captcha` is unavailable
  or returns an invalid public response shape.

## 2. Evidence and Root Causes

### 2.1 Six-letter image clipping

`captchaService` issues 4-6 letters, but `captchaRenderer` currently places each
glyph at `8 + index * 34` inside a fixed 180px viewport. For six letters, the
last glyph starts at x=178 before its 24px path width, rotation, and stroke are
applied. The final glyph therefore extends beyond the viewBox and is clipped.

### 2.2 CAPTCHA disappears after a load failure

`CaptchaField` clears the current challenge and parent token before requesting
the replacement. If `GET /api/auth/captcha` fails, no image remains and no
automatic retry occurs. The user must discover and click `Doi ma` manually.

### 2.3 Older staging deployment overwrote the CAPTCHA release

Staging run `30855663766` deployed merge SHA `1f0905f` successfully. An older
queued run, `30847497053` for SHA `908f067`, then deployed backend and frontend
after it and became the active App Service deployment. The live CAPTCHA route
therefore returned `404` even though the newer run and its smoke job were green.

The workflow-level concurrency configuration did not guarantee newest-commit
deployment order. The smoke script checked health, readiness, catalog, CORS,
and authentication protection, but not the new CAPTCHA route.

## 3. Scope

### In scope

- CAPTCHA SVG horizontal layout and renderer regression coverage.
- Bounded frontend load retry and preservation of the current challenge.
- Stale deployment prevention in `.github/workflows/deploy-staging.yml`.
- CAPTCHA response validation in `scripts/smoke-staging.js` and deployment
  tests.
- FE02 task/changelog traceability for this remediation.
- Redeployment and live staging verification after merge.

### Out of scope

- Changing the CAPTCHA alphabet, token format, TTL, capacity, or storage model.
- Adding a database migration, external CAPTCHA provider, or runtime dependency.
- Exposing CAPTCHA answers, hashes, debug metadata, or production test routes.
- Refactoring unrelated authentication, CI, or deployment behavior.
- Automatically fixing unrelated dependency audit findings.

## 4. Component Design

### 4.1 Renderer

Retain the 180x54 SVG contract. Calculate horizontal glyph spacing from the
answer length with a safe maximum final translation that leaves room for the
glyph path, rotation, stroke, and line caps. Four- and five-letter challenges
may retain wider spacing; six-letter challenges use tighter spacing.

Renderer tests shall decode the SVG, exercise six letters at both rotation
extremes, transform path endpoints, include stroke allowance, and prove every
visible x-coordinate remains within the declared viewBox.

### 4.2 Frontend recovery

`CaptchaField` shall distinguish initial loading from replacement loading:

1. On initial mount, request a challenge. If the first request fails, retry
   once after a short bounded delay.
2. Do not clear a currently usable challenge before requesting a replacement.
3. Replace the challenge and clear its answer only after a successful response.
4. If replacement fails, retain the current image/token, show the Vietnamese
   error, and keep the manual refresh button available.
5. If initial loading fails twice, keep the parent token empty so login and
   registration remain disabled as required by `EC-FE02-019`.

No unbounded retry loop or background request storm is allowed.

### 4.3 Stale deployment guard

The deployment workflow shall resolve the current remote `main` SHA immediately
before deployment and compare it with the checked-out event SHA. A stale run
shall complete without executing backend or frontend deployment steps. Keep the
staging concurrency group serialized without unconditional cancellation because
GitHub may start an older queued event after a newer event; start order alone is
not a safe proxy for commit freshness.

The guard must apply to both backend and frontend deployment jobs so a `main`
advance between jobs cannot publish a mixed version. Manual dispatch remains
valid only when its checked-out SHA is still current `main`.

### 4.4 Staging smoke contract

The smoke script shall call `GET /api/auth/captcha` and require:

- HTTP 200;
- an SVG data URI in `image`;
- an opaque base64url `captchaToken` of the approved public shape;
- `expiresIn: 300`;
- no public answer or answer-derived field.

The smoke check must not solve or submit the CAPTCHA. Its purpose is to prove
that the deployed route and public contract exist.

## 5. Error Handling and Safety

- Renderer failures remain server errors and must not expose the answer.
- Frontend retries only transient request failure and never submits without a
  valid token.
- A stale deployment is skipped before any Azure write.
- Smoke failure blocks staging success rather than accepting health-only proof.
- No test may add a production endpoint or log containing a CAPTCHA answer.

## 6. Test Strategy

Follow RED-GREEN for each root cause:

1. Add a renderer test that fails because six glyphs overflow the viewBox.
2. Add frontend recovery tests that fail because the challenge is cleared and
   no bounded retry exists.
3. Add workflow policy tests that fail because stale runs are not guarded.
4. Add smoke tests that fail because CAPTCHA availability is not checked.
5. Implement the smallest production changes that make each focused test pass.
6. Run focused backend, frontend, deployment, traceability, lint, build, and
   full project gates before publication.

After merge, verify the exact `main` deployment and confirm live staging returns
HTTP 200 from `/api/auth/captcha` with the safe response shape. Generate several
challenges to confirm 4-, 5-, and 6-letter images render fully without reading
or exposing their answers.

## 7. Alternatives Considered

### Redeploy the latest commit only

This restores the route temporarily but leaves image clipping, frontend
disappearance, and the stale-run race unchanged. Rejected as incomplete.

### Increase the image width

This is mechanically simple but changes the established frontend dimensions
and can create mobile layout drift. Rejected in favor of safe dynamic spacing
inside the existing viewport.

### Retry indefinitely in the browser

This can create request storms during a backend outage and consume bounded
challenge capacity. Rejected in favor of one automatic retry plus manual
recovery.

## 8. Approval Boundary

Approval authorizes only the scoped renderer, frontend recovery, workflow,
smoke-test, test, and FE02 traceability changes described here. Any CAPTCHA
storage redesign, provider integration, API shape change, production debug
surface, or unrelated dependency remediation requires separate approval.
