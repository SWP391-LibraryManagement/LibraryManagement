# Phase 2 FE10 OTP Integration Closeout Design

Status: APPROVED BY USER - 2026-07-19

Date: 2026-07-19

Scope: `FE10-S01` through `FE10-S05`, ADR-004, and the FE02 verification/password-reset delivery boundary

## 1. Decision

Use Hybrid SDD+ADD at Full depth for the Core authentication-notification boundary and Light depth for evidence-only documentation changes.

The slice will verify the implementation currently on `origin/main`, add test-first coverage for any missing invariant, make only the smallest production correction proven necessary by a failing test, and close the outstanding FE10-S05 human/integration gate through a dedicated PR and exact post-merge `main` CI run.

## 2. Rationale

OTP generation, source ownership, idempotency, and secret handling are Core because a mistake can weaken authentication, expose credentials, duplicate delivery, or break FE02/FE10 contracts. Test fixtures, validation records, and closeout status changes are Shell because they are reversible and do not change runtime behavior.

The current focused baseline passes 157/157 tests across `notificationRoutes`, `authRoutes`, and `integration`. Passing tests are evidence of existing behavior, not proof that every ADR-004 invariant is covered, so this slice starts with a requirement-to-test audit rather than assuming completion.

## 3. Alternatives Considered

### A. Bound requester with evidence-first gap remediation - selected

Keep the existing in-process FE10 requester bound to `FE02`. Audit every invariant, write a failing test for uncovered or non-conforming behavior, and patch only proven gaps.

This follows ADR-004, preserves the current architecture, and avoids unnecessary product churn.

### B. Retain direct FE02 email delivery beside FE10 - rejected

Dual delivery risks duplicate messages, inconsistent template keys, and secret leakage outside the FE10 boundary.

### C. Introduce a new internal notification HTTP gateway - rejected

A service credential, new API contract, and additional authorization surface are unnecessary for the current single-process Express application and are outside the approved specification.

## 4. Core Contract

1. FE02 exclusively generates, hashes, stores, and validates verification and password-reset OTPs.
2. FE10 exclusively renders and sends `ACCOUNT_VERIFICATION` and `PASSWORD_RESET` messages through the configured provider adapter.
3. Only `createSourceNotificationRequester('FE02')` may submit those two sensitive types.
4. HTTP callers cannot submit sensitive authentication types or override `sourceFeature`.
5. Requests use canonical type/template pairs and exact idempotency keys derived from the persisted `AuthToken` ID.
6. Raw OTPs and rendered sensitive title/body exist in memory only. They must not appear in notification records, attempts, audit metadata, logs, HTTP responses, or safe payloads.
7. Provider success records `SENT`; provider failure records `FAILED` with a generic safe reason. Both outcomes preserve the FE02 source transaction and return the minimal notification DTO.
8. FE02 must not write notification persistence directly or call a separate email delivery path for verification/reset.

## 5. Components And Ownership

| Component | Responsibility | Expected files |
| --- | --- | --- |
| FE02 authentication service | Generate and persist OTP credentials, invoke the FE02-bound requester, preserve auth flow on delivery outcome | `backend/src/services/authService.js` |
| FE10 notification service | Validate ownership, canonical pairs, source metadata, idempotency, in-memory rendering, provider delivery, and redacted persistence | `backend/src/services/notificationService.js` |
| HTTP validation boundary | Reject sensitive public/manual requests before service execution | `backend/src/validators/notificationValidators.js`, `backend/src/routes/notificationRoutes.js` |
| Provider adapter | Deliver injected/configured email without taking ownership of OTP generation or persistence | `backend/src/services/emailService.js` and existing provider tests |
| Automated evidence | Prove source ownership, no duplicate delivery, status behavior, and negative leakage cases | `backend/tests/notificationRoutes.test.js`, `backend/tests/authRoutes.test.js`, `backend/tests/integration.test.js` |
| SDD evidence | Record exact requirement mapping, commands, results, residual limits, H2/H3, merge, and main CI | FE10 `PLAN.md`, `TASKS.md`, `CHANGELOG.md`, and a focused review packet |

No file outside this map may change unless a failing test demonstrates a direct dependency and the scope is reviewed before editing.

## 6. Data Flow

### Verification and password-reset request

1. FE02 validates the source request and creates a six-digit OTP.
2. FE02 persists only the OTP hash and receives the positive integer `AuthToken` ID.
3. FE02 calls its construction-bound FE10 requester with recipient email, canonical type/template, raw OTP, expiry minutes, `AuthToken` source metadata, and the derived idempotency key.
4. FE10 validates ownership and contract fields before rendering.
5. FE10 renders in memory and calls the provider adapter synchronously.
6. FE10 persists only the safe notification summary, delivery status, and safe attempt metadata.
7. FE10 returns `{ notificationId, status }`; FE02 completes its source operation without performing another delivery.

### Idempotent replay

The same source token and idempotency key return the existing notification summary without sending a second email or creating a second notification record.

## 7. Error Handling

- Invalid source ownership, type/template mismatch, source ID, expiry, or idempotency key fails before rendering and provider invocation.
- Sensitive HTTP submission returns a safe client error without revealing internal ownership rules or provider details.
- Provider failure persists `FAILED` and a generic safe attempt reason; no stack, provider response, OTP, or rendered content is exposed.
- FE02 user/token mutation behavior is not rolled back merely because delivery fails; the caller observes the returned status and may issue a new source event when the approved flow permits it.
- Deterministic test or implementation failures receive at most three attempts before the documented Escape Hatch is used.

## 8. Out Of Scope

- `CHANGE_PASSWORD_OTP` behavior.
- FE11 `ACCOUNT_SETUP` delivery.
- FE04 membership-result delivery.
- FE09 caller integration.
- Notification inbox, retry UI, SMS, push, or template editor.
- Real provider credentials or production SMTP acceptance.
- New tables, indexes, dependencies, login roles, or internal HTTP service credentials.

## 9. Validation And Acceptance

### L1 Automated

- Focused FE10/FE02/integration tests.
- Full backend suite and configured coverage threshold.
- Traceability enforcement.
- OpenAPI/backend import checks where affected.
- Sensitive-term leakage scan across changed source, tests, fixtures, and generated evidence.
- `git diff --check` and exact changed-file scope review.

### L2 Specification compliance

Map ADR-004, FE10-S01 through FE10-S05, and the relevant FE02/FE10 BR/FR/AC IDs to concrete tests and implementation lines. A clean test run without this mapping is insufficient.

### L3 Constitution and safety

Confirm server-side ownership enforcement, no secret persistence/logging, no role/schema/dependency expansion, safe errors, parameterized existing repositories, and preserved stack/architecture.

### L4 Acceptance

Demonstrate verification and password-reset delivery using the injected provider, including success, safe failure, idempotent replay, and absence of duplicate/direct delivery. Record human acceptance against the final PR head and passing CI.

## 10. Definition Of Done

The slice is complete only when:

1. Every Core contract item has direct code/test evidence.
2. Any discovered gap was corrected through observed RED-GREEN testing.
3. Focused and full required checks pass.
4. FE10-S05 and related status/evidence are reconciled without broadening other feature claims.
5. The final diff passes H2 and required PR checks.
6. Human H3 approves the exact final PR head.
7. The PR is merged and the exact post-merge `main` CI run succeeds.
8. The acceptance/evidence record contains the PR number, head SHA, merge SHA, CI run IDs, validation layers, and residual out-of-scope items.

## 11. Assumptions

- The user-provided Phase 2 objective authorizes this approved FE10/FE02 slice as the first bounded delivery unit.
- Existing product behavior is retained when it already satisfies the approved contract; this slice does not manufacture a production diff merely to appear active.
- Real SMTP delivery remains outside the acceptance claim; deterministic injected-provider evidence is authoritative for this slice.
- On 2026-07-19, the user approved this design and granted standing approval to execute the plan, validation, PR, merge, post-merge monitoring, and exact evidence-only closeout without pausing for additional approval prompts.
