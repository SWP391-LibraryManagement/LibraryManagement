# TASKS.md - FE10 Notification Management

Status: COMPLETE

Owner: Nhat

Updated: 2026-07-13

---

## 1. Backend Tasks

- [x] FE10-T01 Add notification request and process-pending routes.
- [x] FE10-T02 Add server-side validators for type, channel, recipient, template key, source reference, idempotency, and process limit.
- [x] FE10-T03 Add notification service request validation.
- [x] FE10-T04 Add template lookup and variable rendering.
- [x] FE10-T05 Add sensitive token/link/password payload redaction.
- [x] FE10-T06 Add idempotency handling for duplicate active notifications.
- [x] FE10-T07 Add mock-provider pending processing.
- [x] FE10-T08 Record successful and failed delivery attempts.
- [x] FE10-T09 Protect notification APIs from public/member callers.
- [x] FE10-T10 Align SQL script with FE10 fields, statuses, idempotency index, and required templates.

## 2. Test Tasks

- [x] FE10-T11 Add in-memory notification repository helper.
- [x] FE10-T12 Test account verification request creation.
- [x] FE10-T13 Test duplicate idempotency key handling.
- [x] FE10-T14 Test missing template variable failure.
- [x] FE10-T15 Test password reset payload redaction.
- [x] FE10-T16 Test process-pending success and safe failure attempt logging.
- [x] FE10-T17 Test protected API access.

## 3. Validation

- [x] `npm test` in `backend`.

## 4. Traceability

| Spec ID | Covered by |
| --- | --- |
| AC-FE10-001 | FE10-T03, FE10-T04, FE10-T12 |
| AC-FE10-002 | FE10-T03, FE10-T05, FE10-T15 |
| AC-FE10-003 | FE10-T03, FE10-T04, FE10-T14 |
| AC-FE10-004 | FE10-T03, FE10-T07, FE10-T16 |
| AC-FE10-005 | FE10-T03, FE10-T07, FE10-T16 |
| AC-FE10-006 | FE10-T02, FE10-T04, FE10-T14 |
| AC-FE10-007 | FE10-T05, FE10-T15 |
| AC-FE10-008 | FE10-T06, FE10-T13 |
| AC-FE10-009 | FE10-T07, FE10-T08, FE10-T16 |

## 5. Still Outside This Slice

- Real SMTP/provider integration.
- In-app notification screens.
- Retry management UI.

## 6. FE10 Hardening Tasks - B4 Decomposition

B4 status: COMPLETE. B5 implementation status: COMPLETE. B6 validation status: COMPLETE.

The completed FE10-T01 to FE10-T17 tasks above remain historical evidence for the initial backend slice. The hardening tasks below implement the approved G1-G7 contract as ordered vertical slices. Every implementation task owns its focused tests in the same slice.

### FE10-H01 Revise The Approved FE10 Contract

- [x] Status: COMPLETE (`105e51c`)
- Estimate: 2-3h
- Dependencies: G1-G7 approval recorded in `PLAN.md`; no code task may start first.
- Maps to: G1-G7; BR-FE10-001 to BR-FE10-013; FR-FE10-001 to FR-FE10-009; AC-FE10-001 to AC-FE10-009; Q-FE10-005 to Q-FE10-007; NFR-FE10-SEC-001, NFR-FE10-SEC-004, NFR-FE10-REL-001 to NFR-FE10-REL-003.
- Exact files: `.sdd/specs/feat-notification-management/SPEC.md`, `.sdd/specs/feat-notification-management/CHANGELOG.md`.
- Definition of Done: `SPEC.md` records the canonical type/template map, sensitive synchronous versus non-sensitive queued delivery, recursive normalized sensitive-key rule, minimal DTOs, integer-only `sourceEntityId`, bound requester, protected manual retry, all-status idempotency, FE02 deferral, and FE09 implementation deferral; traceability and review checklist are updated; `CHANGELOG.md` records the approved revision dated 2026-07-13; no implementation file changes.
- Verification: contradiction scan against G1-G7 and existing BR/FR/AC/API/NFR sections; confirm every later hardening task maps to the revised stable IDs.

### FE10-H02 Enforce Canonical Templates And Queued-Payload Safety

- [x] Status: COMPLETE (`3e0cae1`, `5686992`)
- Estimate: 3-4h
- Dependencies: FE10-H01.
- Maps to: G1, G4, G7; BR-FE10-002, BR-FE10-004, BR-FE10-007, BR-FE10-010; FR-FE10-005, FR-FE10-009; AC-FE10-006, AC-FE10-007; EC-FE10-004, EC-FE10-006, EC-FE10-007; NFR-FE10-SEC-001, NFR-FE10-SEC-004.
- Exact files: `backend/src/services/notificationService.js`, `database/Librarymanagement.sql`, `backend/tests/helpers/inMemoryNotificationRepositories.js`, `backend/tests/notificationRoutes.test.js`.
- Definition of Done: server code enforces all approved type/template pairs and rejects mismatches; SQL and test fixtures use `{{verificationLink}}` and `{{resetLink}}`; queued non-sensitive `templateData` recursively traverses objects/arrays, normalizes key case and separators, rejects `token`/`otp`/`password`/`verificationlink`/`resetlink`, and applies the same traversal to `safePayload`; integer source references are characterized for the later boundary task; no `EMAIL_VERIFY` or `DUE_OR_FINE_NOTICE` alias is added.
- Verification: focused route tests cover every canonical pair, mismatch rejection, nested arrays/objects, `OTP`, `reset_token`, and `verification-link`; run `npm test -- notificationRoutes.test.js` in `backend`.

### FE10-H03 Deliver Sensitive Auth Notifications Synchronously

- [x] Status: COMPLETE (`6e58c9e` through `5ce05c8`)
- Estimate: 3-4h
- Dependencies: FE10-H02.
- Maps to: G1, G2; BR-FE10-003, BR-FE10-004, BR-FE10-008 to BR-FE10-010, BR-FE10-012, BR-FE10-013; FR-FE10-001, FR-FE10-002, FR-FE10-006, FR-FE10-007; AC-FE10-001, AC-FE10-002, AC-FE10-007, AC-FE10-009; NFR-FE10-REL-001, NFR-FE10-REL-002, NFR-FE10-LOG-001, NFR-FE10-LOG-002.
- Exact files: `backend/src/services/notificationService.js`, `backend/src/repositories/notificationRepository.js`, `backend/src/models/Notification.js`, `backend/tests/helpers/inMemoryNotificationRepositories.js`, `backend/tests/notificationRoutes.test.js`.
- Definition of Done: `ACCOUNT_VERIFICATION` and `PASSWORD_RESET` render from raw request data only in memory and send through the mock provider synchronously; success persists `SENT` plus an attempt, failure persists `FAILED` plus a safe reason; persisted notification, attempt, audit, logs, and HTTP data contain no raw link/token or rendered sensitive title/body; non-sensitive records remain queued and `process-pending` excludes sensitive types.
- Verification: focused tests prove both sensitive success/failure paths, provider-only link rendering, redacted persistence, safe attempts, no API/audit/log leakage, and unchanged non-sensitive queue processing; run the focused FE10 test file.

### FE10-H04 Contain HTTP Responses And Align The Contract Surface

- [x] Status: COMPLETE (`498dc67`, `549c6af`)
- Estimate: 2-3h
- Dependencies: FE10-H03.
- Maps to: G2, G4, G5; BR-FE10-002, BR-FE10-004, BR-FE10-011; FR-FE10-005 to FR-FE10-007; AC-FE10-006, AC-FE10-009; NFR-FE10-SEC-001, NFR-FE10-SEC-002, NFR-FE10-UX-002.
- Exact files: `backend/src/controllers/notificationController.js`, `backend/src/validators/notificationValidators.js`, `backend/tests/notificationRoutes.test.js`, `backend/tests/integration.test.js`, `backend/src/docs/openapi.yaml`.
- Definition of Done: create returns `201 { notificationId, status }`; any idempotent replay returns `200` with the same shape; process returns `200 { processed, failed }`; no full notification object, array, content, or `safePayload` crosses HTTP; `sourceEntityId` accepts integers only; OpenAPI and integration assertions document the approved create/replay/process response and safe validation error shapes. Retry documentation remains owned by FE10-H08 with its route implementation.
- Verification: focused route and integration tests cover exact status codes/body keys and reject string source IDs; OpenAPI contains no obsolete full-record response schema.

### FE10-H05 Add The Bound Internal Source Requester

- [x] Status: COMPLETE (`2ac8533`, `b877188`)
- Estimate: 3-4h
- Dependencies: FE10-H04.
- Maps to: G3; BR-FE10-001, BR-FE10-002, BR-FE10-004, BR-FE10-005, BR-FE10-011 to BR-FE10-013; FR-FE10-003 to FR-FE10-005; AC-FE10-003, AC-FE10-004, AC-FE10-006, AC-FE10-009; NFR-FE10-SEC-001, NFR-FE10-SEC-006, NFR-FE10-REL-002.
- Exact files: `backend/src/services/notificationService.js`, `backend/tests/notificationRoutes.test.js`.
- Definition of Done: `createSourceNotificationRequester(sourceFeature)` binds one allowlisted source from `FE02`, `FE07`, `FE08`, `FE09`, `SYSTEM`; callers cannot override it in payload; internal requests pass through the same type/template, sensitive-delivery, recursive queued-payload, redaction, idempotency, and validation rules as HTTP; source audits use `userId: null` plus safe source metadata; HTTP routes stay Librarian/Admin protected.
- Verification: unit/route-level service tests cover allowlist rejection, source override prevention, shared policy enforcement, null-user audit metadata, and safe errors; FE02 and FE09 callers remain untouched.

### FE10-H06 Migrate FE07 Borrowing Notifications

- [x] Status: COMPLETE (`c8da11b`)
- Estimate: 2-3h
- Dependencies: FE10-H05.
- Maps to: G3; BR-FE10-001, BR-FE10-005, BR-FE10-012; FR-FE10-004; AC-FE10-004; NFR-FE10-REL-002.
- Exact files: `backend/src/services/borrowingService.js`, `backend/tests/borrowingRoutes.test.js`.
- Definition of Done: FE07 stops writing notifications through `notificationRepository.createNotification()` and uses a requester bound to `FE07`; approved due/overdue source metadata and canonical keys are preserved; notification failure is caught safely and never rolls back borrowing/return state; tests and implementation change together.
- Verification: focused borrowing tests prove requester usage, source binding, canonical request shape, and non-blocking failure behavior; run `npm test -- borrowingRoutes.test.js` in `backend`.

### FE10-H07 Migrate FE08 Reservation Notifications

- [x] Status: COMPLETE (`83b645a`)
- Estimate: 2-3h
- Dependencies: FE10-H05.
- Maps to: G3; BR-FE10-001, BR-FE10-005, BR-FE10-012; FR-FE10-003; AC-FE10-003; NFR-FE10-REL-002.
- Exact files: `backend/src/services/reservationService.js`, `backend/tests/reservationRoutes.test.js`.
- Definition of Done: FE08 stops writing notifications through `notificationRepository.createNotification()` and uses a requester bound to `FE08`; reservation-ready source metadata and canonical keys are preserved; notification failure remains non-blocking and does not undo the hold; tests and implementation change together.
- Verification: focused reservation tests prove requester usage, source binding, canonical request shape, and preserved hold on notification failure; run `npm test -- reservationRoutes.test.js` in `backend`.

### FE10-H08 Enforce All-Status Idempotency And Manual Retry

- [x] Status: COMPLETE (`5c0c0dd`, `cad91ba`, `7c88223`)
- Estimate: 3-4h
- Dependencies: FE10-H04, FE10-H05; may start only after FE10-H06 and FE10-H07 integration diffs are stable because shared FE10 tests and service files are reused.
- Maps to: G5, G6; BR-FE10-006, BR-FE10-008, BR-FE10-011, BR-FE10-013; FR-FE10-007, FR-FE10-008; AC-FE10-008, AC-FE10-009; EC-FE10-008, EC-FE10-009, EC-FE10-011; Q-FE10-005; NFR-FE10-REL-001 to NFR-FE10-REL-003.
- Exact files: `backend/src/services/notificationService.js`, `backend/src/repositories/notificationRepository.js`, `backend/src/models/Notification.js`, `backend/src/controllers/notificationController.js`, `backend/src/routes/notificationRoutes.js`, `backend/src/validators/notificationValidators.js`, `backend/tests/helpers/inMemoryNotificationRepositories.js`, `backend/tests/notificationRoutes.test.js`, `backend/tests/integration.test.js`, `backend/src/docs/openapi.yaml`.
- Definition of Done: idempotency lookup replays one record across every status and preserves the all-status unique key; protected `POST /api/notifications/{id}/retry` permits only failed non-sensitive queued notifications to reuse the same record/key/attempt history and return `200 { notificationId, status }`; invalid status returns safe `409`; sensitive auth retry returns safe `409 REISSUE_REQUIRED` with no provider or secret detail; OpenAPI and integration assertions document the implemented retry route and exact `200`/`409` bodies.
- Verification: focused and integration tests cover replay for `PENDING`, `SENT`, `FAILED`, retry transition/history preservation, unauthorized access, status conflicts, both sensitive reissue cases, and documented response parity; run the focused FE10 and integration test files.

### FE10-H09 Pass The B6 Validation Gate

- [x] Status: COMPLETE
- Estimate: 2-4h
- Dependencies: FE10-H01 to FE10-H08 complete and independently reviewed.
- Maps to: G1-G7 and all revised FE10 BR/FR/AC/API/NFR traceability rows.
- Exact files: `.sdd/specs/feat-notification-management/TASKS.md`, `.sdd/specs/feat-notification-management/CHANGELOG.md`; no planned implementation files.
- Definition of Done: targeted FE10, FE07, and FE08 tests pass; the full backend suite passes; SPEC-to-task-to-test traceability is complete; no secret/link/token is exposed by fixtures, logs, persistence assertions, or responses; diff contains no frontend, FE02 implementation, FE09 implementation, real provider, dependency, expiry, or unrelated refactor changes; an independent review reports no blocking findings.
- Verification: run targeted tests, `npm test` in `backend`, `git diff --check`, placeholder scan, contradiction scan, secret scan, and final changed-file scope review; record exact commands and outcomes before marking complete.

Validation evidence recorded on 2026-07-13:

- `npm.cmd test -- notificationRoutes.test.js borrowingRoutes.test.js reservationRoutes.test.js integration.test.js` in `backend`: PASS, 4 suites and 136 tests after the H09 review fix.
- `npm.cmd test` in `backend`: PASS, 15 suites and 212 tests after the H09 review fix.
- `node scripts/check-traceability.js --enforce`: PASS; FE10 covers 9/9 functional requirements (100%), and no implemented feature is below the 70% gate.
- The first independent scan found unsafe HTTP source metadata and provider-supplied failure text. Commit `a04b64b` added test-first validation and fixed generic failure persistence; its RED run had 6 expected failures, then the focused FE10 suite passed 96/96 tests.
- `git diff --check a613604..HEAD`: PASS after the review fix.
- Placeholder scan command: `git diff -U0 a613604..HEAD -- backend/src backend/tests database | Select-String -Pattern '^\+.*\b(TODO|FIXME|TBD|XXX)\b' -CaseSensitive`; PASS with 0 unresolved implementation markers.
- Contradiction scan commands: `rg -n -i "B5 (implementation )?(remains )?not started|stay .*NOT STARTED.* until approval" .sdd/specs/feat-notification-management/PLAN.md .sdd/specs/feat-notification-management/CONTEXT.md` and `rg -n "DUE_OR_FINE_NOTICE|EMAIL_VERIFY|findActiveByIdempotencyKey" .sdd/specs/feat-notification-management/SPEC.md .sdd/specs/feat-notification-management/PLAN.md .sdd/specs/feat-notification-management/CONTEXT.md backend/src backend/tests database/Librarymanagement.sql`; PASS with 0 stale B5 matches and 0 obsolete active-only lookup matches. All `DUE_OR_FINE_NOTICE` matches are explicit non-canonical statements; `EMAIL_VERIFY` remains only in explicit rejection/deferred FE02 or defensive legacy-sensitive handling.
- Leakage scan commands inspected added backend lines for sensitive log/response patterns and real credential signatures; PASS with 0 sensitive log additions, 0 sensitive response additions, and 0 real-secret signature matches. Synthetic provider/test sentinels appear only in provider-memory input and negative assertions.
- Changed-file scope command: `git diff --name-only a613604..HEAD`; PASS with 0 forbidden scope matches: no frontend, FE02 implementation, FE09 implementation, real provider, dependency, expiry, or unrelated refactor file.
- Focused review of commit `a04b64b`: `Spec compliance: APPROVED`; `Code quality: APPROVED`.
- Final whole-branch review of `a613604..eb82b1d`: APPROVED with no findings; reviewer independently reran the full backend suite (15 suites, 212 tests), traceability enforcement, and `git diff --check`.

## 7. Hardening Traceability And Parallel Work

| Approved gate | Hardening tasks |
| --- | --- |
| G1 | FE10-H01, FE10-H02, FE10-H03, FE10-H09 |
| G2 | FE10-H01, FE10-H03, FE10-H04, FE10-H09 |
| G3 | FE10-H01, FE10-H05, FE10-H06, FE10-H07, FE10-H09 |
| G4 | FE10-H01, FE10-H02, FE10-H04, FE10-H09 |
| G5 | FE10-H01, FE10-H04, FE10-H08, FE10-H09 |
| G6 | FE10-H01, FE10-H08, FE10-H09 |
| G7 | FE10-H01, FE10-H02, FE10-H09 |

Conservative parallel opportunity: after FE10-H05 is complete and reviewed, FE10-H06 and FE10-H07 may run in parallel because they own disjoint source-service and test files. All other tasks remain ordered because they share FE10 contracts, service/repository code, route tests, or validation evidence.

FE02 implementation and FE09 caller integration are explicitly out of this hardening task set. FE02 remains owner-deferred until its OTP/link and `EMAIL_VERIFY`/canonical-key drift is resolved; FE09 has no current caller/integration to migrate.
