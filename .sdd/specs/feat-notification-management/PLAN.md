# PLAN.md - FE10 Notification Management

Status: COMPLETE

Owner: Nhat

Updated: 2026-07-13

Approval: G1-G7 approved by Nhat on 2026-07-13

Workflow State: B5 implementation and B6 validation complete

---

## B3 Approval And B4 Task Decomposition Authorization

Nhat approved the binding recommendations G1-G7 on 2026-07-13. That approval first authorized B4 task decomposition. The B4 documentation was reviewed, B5 then proceeded on `feat/fe10-hardening`, and FE10-H01 through FE10-H08 were completed. FE10-H09 passed the B6 validation and independent-review gate.

**Goal:** deliver the smallest current-SPEC-compliant FE10 backend hardening pass: send sensitive authentication messages synchronously without persisting their rendered content, keep non-sensitive notifications queued, return only approved API summaries, align template/schema/idempotency contracts, provide an approved internal source boundary, and define manual retry for queued notifications. No frontend, real SMTP, template editor, retry UI, or unrelated refactor is included.

**Evidence baseline:** the current service sanitizes `templateData` before validation/rendering, so `resetLink` becomes `[REDACTED]`; controller responses expose full notification objects/arrays despite the SPEC's minimal responses; the SQL `PASSWORD_RESET` seed lacks `{{resetLink}}`; FE02, FE07, and FE08 directly call `notificationRepository.createNotification()` while the FE10 request service accepts only `LIBRARIAN`/`ADMIN`; the SPEC permits integer/string `sourceEntityId` but code/schema are integer-only; no retry operation exists; and the all-status unique idempotency index conflicts with active-only duplicate lookup. Live FE02 additionally queues `EMAIL_VERIFY` while SQL seeds `ACCOUNT_VERIFICATION`, and it sends OTP directly although approved FE02/FE10 specifications describe token-link delivery.

## 1. CORE Versus SHELL Classification

| Classification | Element | Rationale and approved-for-review approach |
| --- | --- | --- |
| CORE | Sensitive authentication delivery boundary | The current FE10 SPEC review checklist forbids storing sensitive links. For `ACCOUNT_VERIFICATION` and `PASSWORD_RESET`, render from raw `templateData` and send synchronously through the mock provider inside FE10. Canonical SQL and test-fixture templates contain `{{verificationLink}}` and `{{resetLink}}`, respectively. Persist only a redacted notification summary/`safePayload`, status, and delivery attempt; never persist, log, audit, or return either raw link or rendered sensitive title/body. On provider failure, record only a safe failure summary. Live FE02 OTP delivery remains deferred to its owner; this contract follows the approved link specifications. |
| CORE | Non-sensitive queued delivery | Reservation, due-date, overdue, fine, and general notifications remain queued. Render and persist their queued title/body at request creation, then deliver through `process-pending`, which selects only non-sensitive `PENDING` records. Traverse `templateData` objects and arrays recursively; normalize each key by lowercasing and removing underscores, hyphens, and whitespace; reject a queued request when any normalized key contains `token`, `otp`, `password`, `verificationlink`, or `resetlink`. This catches `OTP`, `reset_token`, `verification-link`, and nested object/array values before a non-sensitive type can smuggle a secret into persisted `Body`. Apply that same normalized recursive traversal when redacting `safePayload`. |
| CORE | Type/template contract | Server-side code, not a caller-provided flag, enforces these pairs: `ACCOUNT_VERIFICATION -> ACCOUNT_VERIFICATION`; `PASSWORD_RESET -> PASSWORD_RESET`; `RESERVATION_AVAILABLE -> RESERVATION_READY`; `DUE_DATE_REMINDER -> DUE_DATE_REMINDER`; `OVERDUE_NOTICE -> OVERDUE_NOTICE`; `FINE_NOTICE -> FINE_NOTICE`; `GENERAL_SYSTEM -> MEMBERSHIP_RESULT`. Reject every mismatch. `DUE_OR_FINE_NOTICE` is not canonical unless separately approved. |
| CORE | Public API response contract | Create/process currently expose full records, including content and safe payload. Validation/template errors retain normal safe 4xx responses. Sensitive provider success persists `SENT` notification/attempt and returns `201 { notificationId, status: "SENT" }`; sensitive provider failure persists `FAILED` notification/attempt with a safe reason and still returns `201 { notificationId, status: "FAILED" }`, because the request was accepted and source flow must not roll back. Non-sensitive creation returns the same minimal DTO with its persisted status. Any idempotent replay returns `200 { notificationId, status }` for the existing status; process returns `200 { processed, failed }`. No full object or array is returned. |
| CORE | Internal actor and source boundary | System/Scheduler is approved as internal, not a login role, while current routes/service only accept login roles and callers bypass FE10. Recommended contract: `createSourceNotificationRequester(sourceFeature)` creates an in-process requester for fixed allowlisted sources `FE02`, `FE07`, `FE08`, `FE09`, and `SYSTEM`; the feature is bound at construction rather than trusted from input. The requester uses the same server-side type/template and sensitive-payload checks as HTTP. Source audit entries use `userId: null` plus source metadata and safe errors; source callers catch errors so source business flow does not roll back. HTTP routes remain `LIBRARIAN`/`ADMIN`. |
| CORE | Retry and idempotency state model | Q-FE10-005 promises manual retry but no transition exists, and the database index is all-status while lookup is active-only. Recommended policy: one record per idempotency key across all statuses; lookup covers all statuses; retain the current all-status unique index; retry reuses the same non-sensitive queued record/key/history. |
| CORE | Source-reference type and template keys | The data contract says integer/string but every source PK and FE10 execution layer is `INT`; live FE02 uses `EMAIL_VERIFY` while canonical SQL/spec keys include `ACCOUNT_VERIFICATION` and `PASSWORD_RESET`. Recommended Phase 1 decision is integer-only, with a FE10 SPEC correction. Define `ACCOUNT_VERIFICATION` and `PASSWORD_RESET` as canonical keys; do not add an undocumented `EMAIL_VERIFY` alias. |
| SHELL | HTTP/controller/validator plumbing | These implement the approved response and retry contract but do not decide authorization or business rules. Keep routes thin. |
| SHELL | In-memory repository and tests | Fixtures and assertions must mirror sensitive synchronous delivery, non-sensitive queueing, idempotency, and retry semantics; they are evidence for CORE behavior. |
| SHELL | OpenAPI description | It documents the approved route/response contract during B5 after the SPEC revision; it does not make a product decision. |

## 2. Concrete Decisions Approved For B4

| Gate | Proven drift | Binding recommendation for approval | Alternative and consequence |
| --- | --- | --- | --- |
| G1: sensitive delivery architecture | Sanitization runs before rendering; the FE10 review checklist forbids storing sensitive links; processing normally needs persisted queued content. | Split by server-enforced type/template pair. SQL/test fixtures require `ACCOUNT_VERIFICATION` to contain `{{verificationLink}}` and `PASSWORD_RESET` to contain `{{resetLink}}`; synchronously render/send them and store only redacted summary/`safePayload`, delivery status, and attempt. Do not persist rendered sensitive title/body or raw values. Queue only canonical non-sensitive pairs; recursively traverse objects/arrays, normalize keys by lowercasing and removing `_`, `-`, and whitespace, and reject if a normalized key contains `token`, `otp`, `password`, `verificationlink`, or `resetlink`. Use the same normalized recursive rule to redact `safePayload`. | Plaintext queued sensitive body requires a SPEC revision plus an explicit database access-control standard and named owner. Encrypted short-lived payload is rejected as over-engineered for Phase 1. |
| G2: minimal responses | Controllers return service results containing full notifications/arrays. | Keep validation/template errors as normal safe 4xx responses. Sensitive provider success persists `SENT` plus an attempt and returns `201 { notificationId, status: "SENT" }`; sensitive provider failure persists `FAILED` plus a safe attempt reason and returns `201 { notificationId, status: "FAILED" }`. Non-sensitive creation returns its minimal persisted status. An idempotent replay returns `200 { notificationId, status }` for any existing status; process returns `200 { processed, failed }`; never return full objects/arrays. | Retaining full objects contradicts the current SPEC and leaves content exposure. |
| G3: internal requester | Routes/service require `LIBRARIAN`/`ADMIN`; FE02/FE07/FE08 bypass the service through the repository. | Add `createSourceNotificationRequester(sourceFeature)` with allowlist `FE02`/`FE07`/`FE08`/`FE09`/`SYSTEM`, construction-bound source metadata, `userId: null` source audits, safe errors, and caller-side non-blocking catch. It must apply the same type/template map, normalized recursive object/array sensitive-key rejection, `safePayload` redaction, and delivery split as HTTP. HTTP routes remain role-protected. FE07/FE08 migration is authorized after the requester task is reviewed; FE09 is allowlisted with implementation deferred. | Authenticated internal HTTP is viable but needs a configured service credential and more boundary/test work. Retaining direct repository writes duplicates policy and is not recommended. Do not invent a `SYSTEM` login role. |
| G4: source entity ID | SPEC allows integer/string; validator/repository/model/SQL are `INT`, and current source primary keys are integers. | Phase 1 is integer-only; revise FE10 SPEC data requirements from integer/string to integer. | String support requires a coordinated schema migration and validator/model/repository updates. Do not silently widen/narrow the contract. |
| G5: manual retry | No retry route/service/repository behavior exists; `FAILED` is never reselected by pending processing. | Add protected `POST /api/notifications/{id}/retry` for `LIBRARIAN`/`ADMIN`. It permits only a `FAILED` non-sensitive queued notification to transition to `PENDING`, retaining the same record, idempotency key, and attempt history; return `200 { notificationId, status }` and `409` otherwise. Retry of `ACCOUNT_VERIFICATION` or `PASSWORD_RESET` returns the standard safe `409` error body with code `REISSUE_REQUIRED` and a generic message instructing creation of a new source event; include no secret or provider detail. | An operator workflow without an endpoint is possible only if its actor, mechanism, transition, audit, and response contract are added to SPEC. No retry is executable until one option is approved. |
| G6: terminal-state idempotency | SQL unique index applies to all statuses; service lookup checks only active statuses, so a terminal record can block a new insert unexpectedly. | One record per key across all statuses: change lookup semantics to all statuses, keep the existing all-status unique index, and make non-sensitive retry reuse the record. | A filtered active-only unique index permits a new record after a terminal state, but requires schema/index change and weakens source-event uniqueness. Do not alter lookup alone. |
| G7: FE02 dependency and template-key alignment | Approved FE02/FE10 specs are token-link based, but live FE02 sends OTP directly and queues `EMAIL_VERIFY`; SQL seeds `ACCOUNT_VERIFICATION`. | FE10 hardening follows the approved link/template contract with canonical `ACCOUNT_VERIFICATION`/`PASSWORD_RESET` keys, but does not modify FE02 in default FE10 scope. FE02 owner separately reconciles OTP versus link and template key before FE02 facade migration, preventing duplicate email ownership. | Do not introduce an undocumented `EMAIL_VERIFY` alias. Without FE02 reconciliation, leave FE02 facade migration deferred and do not claim FE02 link delivery is integrated. |

## 3. Recommended Approach And Alternatives

### Recommended: smallest coherent, current-SPEC-compliant FE10 hardening

1. G1-G7 are approved. B5 begins with the feature owner updating FE10 `SPEC.md`/`CHANGELOG.md` for the selected observable contracts; FE02 owner resolves the separate FE02 dependency before any FE02 migration.
2. Enforce the canonical type/template map before delivery. Require `{{verificationLink}}` in `ACCOUNT_VERIFICATION` and `{{resetLink}}` in `PASSWORD_RESET` SQL/test fixtures. For sensitive auth types, validate raw template data, render, and synchronously send through the mock provider. On provider success persist `SENT` plus attempt and return `201` minimal DTO; on provider failure persist `FAILED` plus safe reason and still return `201` minimal DTO. Sensitive rendered content and raw values do not cross persistence, logging, audit, or HTTP boundaries.
3. For non-sensitive types, recursively traverse objects/arrays in `templateData`, normalize keys by lowercasing and removing `_`, `-`, and whitespace, and reject any normalized key containing `token`, `otp`, `password`, `verificationlink`, or `resetlink`; apply the same rule while redacting `safePayload`. Then validate, render, and persist queued content; `process-pending` selects only non-sensitive `PENDING` records. Add minimal controller DTOs, the construction-bound source requester, canonical template-key checks, integer-only source reference validation, and all-status idempotency lookup.
4. Add protected retry only for failed non-sensitive queued notifications; return safe `409 REISSUE_REQUIRED` for either sensitive auth type. Migrate FE07 and FE08 only after the source requester is implemented and reviewed. FE09's due/fine event is approved in FE10 SPEC but has no current caller/integration, so its implementation is deferred; FE02 remains its owner's deferred dependency.
5. Keep the mock provider, Express/SQL Server layering, and no-frontend posture.

### Alternative A: plaintext queued sensitive body

Queue sensitive auth content and persist its rendered body for later processing. This restores one delivery mode but violates the current FE10 review-checklist rule. It requires a SPEC revision, an explicit database access-control standard, and a named operational owner before implementation.

### Alternative B: encrypted short-lived queued payload

Encrypt a short-lived payload and decrypt at processing time. This reduces plaintext database exposure but introduces key lifecycle, rotation, failure recovery, and operational complexity beyond the Phase 1 scope. It is rejected for this pass.

### Alternative C: authenticated internal HTTP requester

Use an internal service credential to call the protected request endpoint. This is valid for future service separation but requires approved secret/configuration handling and broader middleware/test changes. The recommended in-process factory is smaller for the current monolith.

## 4. Bounded Agent Structure

At B5, one implementation agent has exclusive write scope over each approved FE10 hardening task; one independent reviewer verifies each task diff and its test evidence. Do not run parallel edits across the shared FE10 service, repository, route, or notification-test files because sensitive delivery, queueing, retries, idempotency, and source integration share one contract. The only conservative parallel opportunity is the disjoint FE07 and FE08 caller migrations after their common requester dependency is complete.

## 5. Exact Expected Files

### B4 planning record and B5 prerequisite files

- `.sdd/specs/feat-notification-management/SPEC.md` - first B5 task revises the approved observable contract for G1-G7 before implementation starts.
- `.sdd/specs/feat-notification-management/CHANGELOG.md` - first B5 task records the approved contract revision.
- `.sdd/specs/feat-notification-management/TASKS.md` - B4 appends the pending FE10 hardening tasks while preserving all completed initial-slice tasks as historical evidence.

### Default FE10 implementation files

- `backend/src/services/notificationService.js` - server-side type/template map, sensitive synchronous versus non-sensitive queued delivery, normalized recursive object/array sensitive-key rejection for queued data, matching normalized recursive `safePayload` redaction, redacted persistence boundary, source requester factory, all-status idempotency, retry transition, and safe audit behavior.
- `backend/src/controllers/notificationController.js` - exact minimal create/replay/process/retry DTOs.
- `backend/src/routes/notificationRoutes.js` - protected retry route while preserving protected request/process routes.
- `backend/src/validators/notificationValidators.js` - integer source ID and boundary validation; service-level code owns canonical type/template and recursive queue-sensitive-data validation.
- `backend/src/repositories/notificationRepository.js` - sensitive `SENT`/`FAILED` summary-and-attempt persistence without rendered content, non-sensitive queued persistence and filtered pending selection, all-status lookup, failed-to-pending update, and attempt history preservation.
- `backend/src/models/Notification.js` - status and integer source-ID metadata aligned with approved schema semantics; no expiry metadata is introduced.
- `database/Librarymanagement.sql` - canonical seed templates containing `{{verificationLink}}` in `ACCOUNT_VERIFICATION` and `{{resetLink}}` in `PASSWORD_RESET` for synchronous provider-only rendering; retry/idempotency schema alignment; no `EMAIL_VERIFY` or `DUE_OR_FINE_NOTICE` canonical alias and no expiry storage.
- `backend/tests/helpers/inMemoryNotificationRepositories.js` - sensitive/non-sensitive template fixtures containing both approved link variables, filtered pending selection, all-status idempotency, and non-sensitive retry behavior matching the repository.
- `backend/tests/notificationRoutes.test.js` - canonical type/template mismatch rejection, normalized recursive object/array sensitive-key queue rejection and `safePayload` redaction, provider-only rendering tests for both links with no persistence/API/audit/log leakage, synchronous sensitive success/failure minimal responses, non-sensitive queueing, replay behavior for all statuses, retry/status conflicts, and idempotency tests.
- `backend/tests/integration.test.js` - update the existing full-notification response assertion to G2 minimal DTO expectations, regardless of whether FE07/FE08 migrations occur.
- `backend/src/docs/openapi.yaml` - approved request validation, synchronous sensitive `SENT`/`FAILED` 201 responses, non-sensitive process response, replay, and retry error contract.

### Approved integrations and deferred dependencies

- `backend/src/services/borrowingService.js` and `backend/src/services/reservationService.js` - in-scope migrations from direct repository creation to the approved source requester after the requester task is reviewed. Their affected tests are `backend/tests/borrowingRoutes.test.js` and `backend/tests/reservationRoutes.test.js`; `backend/tests/integration.test.js` is already in default FE10 scope for G2.
- FE09 integration is deferred: its due/fine event is approved in FE10 SPEC, but no current caller/integration exists. No FE09 service file change is planned in this slice; a future FE09-owned implementation must identify the actual event and integration point first.
- `backend/src/services/authService.js` - not in the default FE10 implementation scope. It is a deferred FE02-owned migration after the FE02 owner reconciles OTP versus token-link and `EMAIL_VERIFY` versus canonical keys in `.sdd/specs/feat-auth/SPEC.md`; update `backend/tests/authRoutes.test.js` only in that FE02-owned work.

No frontend files, provider credentials, real SMTP code, new dependencies, retry UI, expiry metadata, database migration framework, or unrelated refactor are expected.

## 6. Ordered B5 Implementation Slices

`TASKS.md` owns the atomic B4 decomposition. The sequence below is the B5 execution order: each implementation slice begins with focused failing evidence, receives the smallest approved change, reruns the focused test, then runs the affected suite.

1. **Approved-contract characterization.** After G1-G7 and required SPEC revisions, add failing assertions for every canonical type/template pair and mismatch rejection; normalized recursive object/array queued-data rejection for `OTP`, `reset_token`, `verification-link`, and nested values; matching `safePayload` redaction; provider-only rendering for both link templates with no persistence/API/audit/log output; synchronous sensitive success/failure; non-sensitive queueing/filtered processing; minimal create/replay/process DTOs; integer source IDs; all-status idempotency; and sensitive/non-sensitive retry outcomes.
2. **Delivery split and response containment.** Implement server-side type classification and the canonical map. Sensitive auth requests render `{{verificationLink}}` or `{{resetLink}}` and invoke the mock provider synchronously: success persists `SENT`/attempt and failure persists `FAILED`/safe attempt, while both return `201` DTOs. Non-sensitive requests first pass normalized recursive object/array sensitive-key inspection and matching `safePayload` redaction, then render into the queue; `process-pending` selects only them. Verify both sensitive links never reach persistence, API, audit, or logs.
3. **Schema/template/idempotency alignment.** Apply canonical template seed alignment, integer-only contract revision, all-status duplicate behavior, and non-sensitive pending filtering across SQL, repository, model, and in-memory helper. Do not add `EMAIL_VERIFY` or treat `DUE_OR_FINE_NOTICE` as canonical without approval.
4. **Source requester and FE07/FE08 migration.** Implement and review the construction-bound allowlisted requester, then migrate only FE07/FE08. Confirm safe caller catches preserve source flow and that source audit records have null user ID plus bound source metadata. Do not migrate FE02; defer FE09 implementation despite its approved event.
5. **Manual retry.** Add the authorized `FAILED -> PENDING` behavior only for non-sensitive queued notifications. Test `200` summary, `409` for other statuses, preserved record/key/history, audit, and the standard safe `409 REISSUE_REQUIRED` body for either failed sensitive auth type.
6. **Integration verification.** Run targeted FE10 and affected FE07/FE08 tests, backend suite, traceability check if available, `git diff --check`, placeholder scan, contradiction scan, and final diff scope review.

## 7. Integration Risks, Assumptions, And Out Of Scope

### Integration risks

- Sensitive auth delivery now depends on immediate mock-provider availability. A provider failure cannot be retried by FE10 because no secret is persisted; the source feature must issue a new event/key.
- FE02 currently owns direct OTP email while its approved specs describe token links. Migrating FE02 before the owner resolves this would risk duplicate reset/verification messages and wrong template keys.
- Changing minimal HTTP responses can break undocumented consumers/tests that read full notification fields; the approved SPEC becomes the contract of record.
- The type/template map and normalized recursive object/array sensitive-key check must be enforced server-side, including from the source requester, not trusted from caller input; otherwise a mismatched or queued non-sensitive request could persist secret content. The same traversal must redact `safePayload`, including keys such as `OTP`, `reset_token`, and `verification-link`.
- A sensitive provider failure returns `201 FAILED` rather than a delivery-error 5xx because FE10 accepted and recorded the request without rolling back the source flow; consumers must use the returned status, not HTTP status alone, to observe delivery state.
- Schema/index changes require database-owner review for deployed instances, not just fresh initializer runs.

### Approved implementation constraints

- The FE10 review checklist's sensitive-link prohibition governs the implementation; synchronous mock-provider delivery is acceptable for the two sensitive auth types.
- The listed type/template pairs are the approved server-side contract; `ACCOUNT_VERIFICATION` and `PASSWORD_RESET` fixtures use `{{verificationLink}}` and `{{resetLink}}`; `DUE_OR_FINE_NOTICE` is not canonical unless separately approved.
- FE02 owner, not FE10 work, owns the live OTP/link and `EMAIL_VERIFY`/canonical-key reconciliation; FE10's provider-only link-template contract follows the approved FE02/FE10 specifications.
- The mock provider remains sufficient for Phase 1 and no real provider credentials are introduced.
- FE07/FE08 source events are approved for requester migration; FE09's approved event has no current caller/integration and remains deferred.

### Out of scope

- Plaintext or encrypted queued sensitive content, frontend inbox/retry/admin screens, template editor, in-app read state, SMS, push, marketing, real SMTP/provider credentials, token generation or validation, FE02 OTP/link reconciliation, fine calculation, reservation queue decisions, borrowing-state changes, and a new FE09 notification implementation.

## 8. Approved Human Review Checklist

- [x] G1 accepts the server-enforced canonical type/template map; `{{verificationLink}}` and `{{resetLink}}` fixtures; synchronous sensitive auth delivery with no sensitive rendered persistence; and queued delivery only for non-sensitive types after normalized recursive object/array key inspection and matching `safePayload` redaction.
- [x] G2 accepts safe 4xx validation/template errors, `201 SENT` and `201 FAILED` sensitive delivery summaries, any-status `200` replay summary, and no objects or arrays.
- [x] G3 accepts the bound-source factory, fixed allowlist, null-user audit metadata, the same mapping/normalized recursive queue protections and `safePayload` redaction as HTTP, and FE07/FE08-only scoped migration.
- [x] G4 accepts integer-only Phase 1 and a FE10 SPEC correction.
- [x] G5 accepts the protected non-sensitive retry route, state transition, status conflicts, and standard safe `REISSUE_REQUIRED` response for either sensitive auth type.
- [x] G6 accepts one record per idempotency key across all statuses and non-sensitive retry reuse.
- [x] G7 accepts canonical `ACCOUNT_VERIFICATION`/`PASSWORD_RESET`, no `EMAIL_VERIFY` alias, and FE02-owner deferral.
- [x] FE09's approved event is correctly marked implementation-deferred because no current caller/integration exists, with no FE09 service file change planned in this slice.
- [x] The historical completed `TASKS.md` entries remain intact, with a new pending hardening section only after B3 approval.
- [x] The no-frontend, mock-provider-only, smallest-coherent-hardening scope is acceptable.

## B4 Complete; B5 Implemented; B6 Complete

This section originally stopped work after B4 until the documentation was reviewed and deliberately moved to an implementation branch. That gate was satisfied; FE10-H01 through FE10-H08 were implemented and independently reviewed on `feat/fe10-hardening`, and FE10-H09 passed final validation and whole-branch review.
