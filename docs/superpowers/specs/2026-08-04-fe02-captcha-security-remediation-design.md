# FE02 CAPTCHA Security Remediation Design

Date: 2026-08-04

Status: APPROVED IN PRINCIPLE - PENDING WRITTEN DESIGN REVIEW

Owner: Dat

## 1. Decision

Use a bounded, process-local, one-time CAPTCHA challenge store for the current
single-instance Azure App Service F1 deployment. The public token is an opaque,
cryptographically random identifier. The answer and its digest never leave the
server in the token or response metadata.

Render the 4-6 approved Latin letters as randomized SVG vector/bitmap glyphs.
The SVG must not contain a `<text>` element, the answer as a string, or an
attribute that exposes the answer. This preserves the approved image CAPTCHA
contract while removing the current machine-readable plaintext path.

This is a Full-depth SDD remediation because it changes an authentication
control. CAPTCHA storage, verification, test seams, failure behavior, and
traceability are Core. The reusable frontend field and submit-state wiring are
Shell changes constrained by the Core contract.

## 2. Problem Statement

PR #111 currently has four H3 blockers:

1. The returned SVG contains the answer in a `<text>` node, and the E2E helper
   decodes that node directly.
2. The signed client token contains an unsalted answer hash with a small search
   space, enabling offline recovery, and a solved token can be replayed for its
   full five-minute lifetime.
3. Route enforcement is disabled whenever `NODE_ENV=test`, creating a
   fail-open deployment mode and preventing route tests from exercising the
   production gate.
4. CAPTCHA load failure does not disable login/register submission, and the new
   requirement IDs are missing or duplicated in FE02 traceability.

## 3. Goals

- Keep the approved 4-6 Latin-letter CAPTCHA on registration and login.
- Ensure the public token reveals no answer or answer-derived verifier.
- Make every challenge valid for at most one verification attempt.
- Enforce CAPTCHA on production routes independently of `NODE_ENV`.
- Keep failed CAPTCHA attempts ahead of auth service dispatch and auth state
  mutation.
- Disable form submission while no valid challenge is loaded.
- Add deterministic test seams without adding a production bypass or debug
  endpoint.
- Restore complete, unique FE02 rule-to-test traceability.

## 4. Non-goals

- No SQL migration or new persistent entity.
- No external CAPTCHA provider or new runtime dependency.
- No change to OTP, password, login lockout, refresh-token, or role behavior.
- No claim that a custom image CAPTCHA defeats advanced OCR indefinitely.
- No multi-instance challenge sharing in the current F1 deployment.

## 5. Backend Design

### 5.1 CAPTCHA service

Introduce a `createCaptchaService` factory with injectable clock, randomness,
renderer, capacity, and optional test observer. The production app creates one
service instance and passes the same instance to the CAPTCHA controller and
validation middleware.

The service owns a private `Map` keyed by a 32-byte random base64url token. Each
record contains only:

- a SHA-256 digest of the normalized server-side answer;
- an absolute expiry timestamp;
- insertion order supplied by the `Map` for bounded eviction/cleanup.

The token has no decodable payload and uses no JWT signing secret. Therefore a
client cannot recover an answer verifier from the token, and CAPTCHA key-domain
reuse with access tokens is removed.

### 5.2 Challenge issuance

`createChallenge()` shall:

1. Remove expired records.
2. Fail safely with `CAPTCHA_UNAVAILABLE` if the bounded store remains at its
   configured capacity after cleanup.
3. Generate 4-6 letters from the approved ambiguity-reduced alphabet.
4. Generate an opaque random token and store the answer digest plus five-minute
   expiry.
5. Return `{ image, captchaToken, expiresIn: 300 }`.

The store is capped at 5,000 active challenges so unauthenticated issuance
cannot grow process memory without a bound. Capacity exhaustion returns a safe
temporary error rather than evicting a valid user's challenge.

### 5.3 Image rendering

The renderer uses a small server-owned glyph map and emits SVG shapes with
per-challenge visual variation such as position offsets, stroke variation, and
noise lines. The response shall not contain:

- `<text>` nodes;
- the answer in XML comments, IDs, labels, titles, descriptions, or data
  attributes;
- an answer hash or deterministic answer identifier.

The existing public response type remains an SVG data URI, so no API field or
frontend image contract changes.

### 5.4 Verification and consumption

`verifyChallenge(token, answer)` shall validate token/answer types and the
approved 4-6-letter format, locate the record, and delete the record before
comparing the answer. The challenge is therefore consumed by either a correct
or incorrect verification attempt.

Verification succeeds only when the record is unexpired and the normalized
answer digest matches using a timing-safe comparison. Missing, malformed,
expired, incorrect, or replayed challenges return the existing
`400 CAPTCHA_INVALID` response and never dispatch registration/login services.

### 5.5 Fail-closed route wiring

Remove all `NODE_ENV`-derived CAPTCHA bypass behavior. `createApp()` accepts an
explicit `captchaService` dependency, defaulting to the production service.
Tests that are not about CAPTCHA may inject an explicit fake service; production
startup never selects a bypass from environment naming.

## 6. Frontend Design

`CaptchaField` continues to own loading, answer input, refresh, and its local
load error. It reports an empty token to the parent before loading and whenever
loading fails.

Login and registration submit controls shall be disabled while the CAPTCHA
token is empty, in addition to their existing busy/locked conditions. Existing
form field values remain unchanged during CAPTCHA reloads. `CAPTCHA_INVALID`
continues to display Vietnamese feedback and increments the refresh key.

The retry button remains enabled when challenge loading fails unless the parent
form is otherwise busy or locked.

## 7. Test Design

Follow RED-GREEN for each blocker.

Backend tests shall prove:

- the response token is opaque and the SVG contains no `<text>` or plaintext
  answer;
- valid case-insensitive answers pass once;
- wrong answers, expiry, tampering/unknown tokens, and replay are rejected;
- both correct and incorrect attempts consume the challenge;
- the bounded store fails safely at capacity and recovers after expiry cleanup;
- actual `/api/auth/login` and `/api/auth/register` routes reject missing or
  invalid CAPTCHA before the service even when `NODE_ENV=test`;
- a valid challenge permits the existing auth flow.

Frontend tests shall prove:

- login and registration submit controls depend on CAPTCHA availability;
- load failure leaves the token empty, presents Vietnamese retry feedback, and
  does not clear other form fields;
- `CAPTCHA_INVALID` refresh behavior remains wired.

Browser E2E shall use an instrumented CAPTCHA service created only inside
`tests/e2e/support/systemTestServer.js`. The test-only control server may expose
the most recently issued answer under its existing `/__e2e__/` namespace. The
production Express app and production CAPTCHA response shall expose no test
answer or bypass.

## 8. Specification and Traceability Changes

- Amend `BR-FE02-029` and `FR-FE02-028..030` to state opaque one-time tokens,
  server-side bounded storage, and non-text image rendering.
- Rename the new CAPTCHA load edge case from the duplicate `EC-FE02-018` to
  `EC-FE02-019`.
- Add `AC-FE02-027` to the authoritative acceptance traceability table.
- Add the CAPTCHA unwanted path to the FR traceability table.
- Update summary counts to 29 BRs, 30 FRs, and 27 ACs.
- Reopen the CAPTCHA task and add a remediation task mapped to the H3 blockers.
- Update `PLAN.md`, `TEST_PLAN.md`, `CHANGELOG.md`, contract, data model,
  research, and quickstart so none claim H3 completion before the new review.

## 9. Deployment and Operational Boundary

The current staging architecture uses one Azure App Service F1 process. A
restart invalidates outstanding CAPTCHA challenges; this is safe because the
frontend can request a new challenge and no authentication state has changed.

Before scaling the backend to multiple application instances, CAPTCHA storage
must move to a shared TTL store or an approved external CAPTCHA provider.
Multi-instance support is explicitly outside this remediation.

## 10. Validation and Integration

Required evidence before merge:

1. Focused RED-GREEN evidence for CAPTCHA service, route enforcement, replay,
   expiry, capacity, and frontend disabled-state behavior.
2. Full backend tests and coverage gate.
3. Frontend lint, tests, dependency audit, and production build.
4. System integration, browser E2E, deployment utility, secret scan, and
   traceability enforcement.
5. Exact-head `foundation-checks` success.
6. H2 review of the complete remediation diff, followed by independent H3
   Standards and Spec reviews on the exact pushed head.
7. Exact-head guarded merge and successful post-merge `main` CI.

## 11. Approval Boundary

Approval of this design authorizes only the files and behavior described here.
Any SQL persistence, external provider, public debug response, production test
bypass, or change to non-CAPTCHA authentication behavior requires a new design
decision.
