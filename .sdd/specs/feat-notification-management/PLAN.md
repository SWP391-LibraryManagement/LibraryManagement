# PLAN.md - FE10 Notification Management

Status: V0.5.0 AZURE STAGING VERIFIED - H3 REMEDIATION IN PROGRESS

Owner: Nhat

Updated: 2026-07-28

Approval: G1-G7 approved 2026-07-13; G8-G10/ADR-004 and G11/ADR-005 approved 2026-07-15; G12 FE04 boundary approved by Nhat on 2026-07-17

Workflow State: The approved Phase 2/G1-G12 and v0.4.5 delivery baseline
remains complete. The user approved the v0.5.0 personal notification inbox
design and consolidated written SPEC on 2026-07-27. The user approved the new
implementation plan and FE10-I01..I08 task decomposition as H1 on 2026-07-28.
Governance PR #70 reached `main` as `25c09ec`. FE10-I01 through FE10-I08,
the cross-platform migration-hash remediation, and the bounded H3 round-one
remediation are H2-approved and published as PR #75 runtime head `3f9f23a`, rebased
cleanly on the user-approved `main@a240705` baseline. Exact-head CI
`30313721511` and Azure staging deployment `30313949983` passed. Public
HTTPS/CORS, protected-route, Azure SQL schema/index, and cleanup checks also
passed. The round-one ADR, lifecycle-documentation, page-state, and popover
stacking findings are implemented; repeated H3, explicit H3 approval, merge,
and post-merge CI/deployment remain open.
An H2-reviewed evidence-only closeout commit may sit above the deployed runtime
head; the resulting latest PR head must pass exact-head gates before H3.

---

> Sections 1-8 preserve the completed G1-G7 hardening history. Section 9 supersedes historical verification-link, mock-only provider, and FE02-migration-deferral statements. Section 10 records completed FE11 setup work, and Section 11 is the current FE04 membership-result boundary follow-up.

## Historical G1-G7 Plan (Superseded Where Sections 9-11 Differ)

Nhat approved the binding recommendations G1-G7 on 2026-07-13. That approval first authorized B4 task decomposition. The B4 documentation was reviewed, B5 then proceeded on `feat/fe10-hardening`, and FE10-H01 through FE10-H08 were completed. FE10-H09 passed the B6 validation and independent-review gate. Commit `9185a9a91f41e444e0c4e6bd8c0605a281272ee9` was then merged into `main`, and GitHub Actions CI run `29236572558` passed for the same commit. The B7 evidence is recorded in `.sdd/reviews/fe10-b7-integration-review-closeout-2026-07-13.md`.

**Historical G1-G7 goal:** deliver the smallest then-approved FE10 backend hardening pass. Sections 9-11 are authoritative for OTP, account setup, and membership-result ownership.

**Historical evidence baseline (2026-07-13):** retained only to explain G1-G7 implementation history. It is not the current OTP contract; Section 9 and `SPEC.md` v0.4.1 supersede link-template and FE02-deferral statements.

## 1. CORE Versus SHELL Classification

| Classification | Element | Rationale and approved-for-review approach |
| --- | --- | --- |
| CORE | Sensitive authentication delivery boundary | The current FE10 SPEC forbids persisting sensitive OTP content. For `ACCOUNT_VERIFICATION` and `PASSWORD_RESET`, validate raw `templateData`, render and send synchronously through the configured provider adapter inside FE10, and persist only a redacted notification summary/`safePayload`, status, and delivery attempt. Canonical templates require `{{otp}}` and `{{expiresInMinutes}}`. Never persist, log, audit, or return the raw OTP or rendered sensitive title/body. On provider failure, record only a safe failure summary. FE02 remains the sole owner of OTP generation and validation. |
| CORE | Non-sensitive queued delivery | Reservation, due-date, overdue, fine, and general notifications remain queued. Render and persist their queued title/body at request creation, then deliver through `process-pending`, which selects only non-sensitive `PENDING` records. Traverse `templateData` objects and arrays recursively; normalize each key by lowercasing and removing underscores, hyphens, and whitespace; reject a queued request when any normalized key contains `token`, `otp`, `password`, `verificationlink`, or `resetlink`. This catches `OTP`, `reset_token`, `verification-link`, and nested object/array values before a non-sensitive type can smuggle a secret into persisted `Body`. Apply that same normalized recursive traversal when redacting `safePayload`. |
| CORE | Type/template contract | Server-side code, not a caller-provided flag, enforces these pairs: `ACCOUNT_VERIFICATION -> ACCOUNT_VERIFICATION`; `PASSWORD_RESET -> PASSWORD_RESET`; `RESERVATION_AVAILABLE -> RESERVATION_READY`; `DUE_DATE_REMINDER -> DUE_DATE_REMINDER`; `OVERDUE_NOTICE -> OVERDUE_NOTICE`; `FINE_NOTICE -> FINE_NOTICE`; `GENERAL_SYSTEM -> MEMBERSHIP_RESULT`. Reject every mismatch. `DUE_OR_FINE_NOTICE` is not canonical unless separately approved. |
| CORE | Public API response contract | Create/process currently expose full records, including content and safe payload. Validation/template errors retain normal safe 4xx responses. Sensitive provider success persists `SENT` notification/attempt and returns `201 { notificationId, status: "SENT" }`; sensitive provider failure persists `FAILED` notification/attempt with a safe reason and still returns `201 { notificationId, status: "FAILED" }`, because the request was accepted and source flow must not roll back. Non-sensitive creation returns the same minimal DTO with its persisted status. Any idempotent replay returns `200 { notificationId, status }` for the existing status; process returns `200 { processed, failed }`. No full object or array is returned. |
| CORE | Internal actor and source boundary | `createSourceNotificationRequester(sourceFeature)` binds one source from `FE02`, `FE07`, `FE08`, `FE09`, `FE11`, or `SYSTEM`; the source is construction-bound rather than trusted from input. Source/type ownership is enforced before rendering or persistence. HTTP routes remain `LIBRARIAN`/`ADMIN` for non-sensitive types. |
| CORE | Retry and idempotency state model | Q-FE10-005 promises manual retry but no transition exists, and the database index is all-status while lookup is active-only. Recommended policy: one record per idempotency key across all statuses; lookup covers all statuses; retain the current all-status unique index; retry reuses the same non-sensitive queued record/key/history. |
| CORE | Source-reference type and template keys | The data contract says integer/string but every source PK and FE10 execution layer is `INT`; live FE02 uses `EMAIL_VERIFY` while canonical SQL/spec keys include `ACCOUNT_VERIFICATION` and `PASSWORD_RESET`. Recommended Phase 1 decision is integer-only, with a FE10 SPEC correction. Define `ACCOUNT_VERIFICATION` and `PASSWORD_RESET` as canonical keys; do not add an undocumented `EMAIL_VERIFY` alias. |
| SHELL | HTTP/controller/validator plumbing | These implement the approved response and retry contract but do not decide authorization or business rules. Keep routes thin. |
| SHELL | In-memory repository and tests | Fixtures and assertions must mirror sensitive synchronous delivery, non-sensitive queueing, idempotency, and retry semantics; they are evidence for CORE behavior. |
| SHELL | OpenAPI description | It documents the approved route/response contract during B5 after the SPEC revision; it does not make a product decision. |

## 2. Concrete Decisions Approved For B4

| Gate | Proven drift | Binding recommendation for approval | Alternative and consequence |
| --- | --- | --- | --- |
| G1: sensitive delivery architecture | Sanitization runs before rendering; the FE10 review checklist forbids storing sensitive OTP content; processing normally needs persisted queued content. | Split by server-enforced type/template pair. SQL/test fixtures require `ACCOUNT_VERIFICATION` and `PASSWORD_RESET` to contain `{{otp}}` and `{{expiresInMinutes}}`; synchronously render/send them and store only redacted summary/`safePayload`, delivery status, and attempt. Do not persist rendered sensitive title/body or raw OTP values. Queue only canonical non-sensitive pairs; recursively traverse objects/arrays, normalize keys by lowercasing and removing `_`, `-`, and whitespace, and reject if a normalized key contains `token`, `otp`, `password`, `verificationlink`, or `resetlink`. Use the same normalized recursive rule to redact `safePayload`. | Plaintext queued sensitive body requires a SPEC revision plus an explicit database access-control standard and named owner. Encrypted short-lived payload is rejected as over-engineered for Phase 1. |
| G2: minimal responses | Controllers return service results containing full notifications/arrays. | Keep validation/template errors as normal safe 4xx responses. Sensitive provider success persists `SENT` plus an attempt and returns `201 { notificationId, status: "SENT" }`; sensitive provider failure persists `FAILED` plus a safe attempt reason and returns `201 { notificationId, status: "FAILED" }`. Non-sensitive creation returns its minimal persisted status. An idempotent replay returns `200 { notificationId, status }` for any existing status; process returns `200 { processed, failed }`; never return full objects/arrays. | Retaining full objects contradicts the current SPEC and leaves content exposure. |
| G3: internal requester | Routes/service require `LIBRARIAN`/`ADMIN`; source features need a trusted in-process boundary. | Use `createSourceNotificationRequester(sourceFeature)` with allowlist `FE02`/`FE07`/`FE08`/`FE09`/`FE11`/`SYSTEM`, construction-bound metadata, source/type ownership, `userId: null` source audits, safe errors, and caller-side non-blocking catch. | Authenticated internal HTTP would require service credentials and more boundary work. Do not invent a `SYSTEM` login role. |
| G4: source entity ID | SPEC allows integer/string; validator/repository/model/SQL are `INT`, and current source primary keys are integers. | Phase 1 is integer-only; revise FE10 SPEC data requirements from integer/string to integer. | String support requires a coordinated schema migration and validator/model/repository updates. Do not silently widen/narrow the contract. |
| G5: manual retry | No retry route/service/repository behavior exists; `FAILED` is never reselected by pending processing. | Add protected `POST /api/notifications/{id}/retry` for `LIBRARIAN`/`ADMIN`. It permits only a `FAILED` non-sensitive queued notification to transition to `PENDING`, retaining the same record, idempotency key, and attempt history; return `200 { notificationId, status }` and `409` otherwise. Retry of `ACCOUNT_VERIFICATION` or `PASSWORD_RESET` returns the standard safe `409` error body with code `REISSUE_REQUIRED` and a generic message instructing creation of a new source event; include no secret or provider detail. | An operator workflow without an endpoint is possible only if its actor, mechanism, transition, audit, and response contract are added to SPEC. No retry is executable until one option is approved. |
| G6: terminal-state idempotency | SQL unique index applies to all statuses; service lookup checks only active statuses, so a terminal record can block a new insert unexpectedly. | One record per key across all statuses: change lookup semantics to all statuses, keep the existing all-status unique index, and make non-sensitive retry reuse the record. | A filtered active-only unique index permits a new record after a terminal state, but requires schema/index change and weakens source-event uniqueness. Do not alter lookup alone. |
| G7: FE02 dependency and template-key alignment | The approved FE02/FE10 specs are OTP-based. Historical FE02 code sent OTP directly and used the legacy `EMAIL_VERIFY` key, while the canonical FE10 contract uses `ACCOUNT_VERIFICATION` and `PASSWORD_RESET`. | FE10 owns the delivery boundary and FE02 owns OTP generation/validation. The FE02 follow-up routes verification/reset through the FE02-bound requester with canonical template keys, without duplicate direct delivery. | Do not introduce an undocumented `EMAIL_VERIFY` notification alias. The former FE02 deferral is superseded by FE10-S04/FE02-T031 through B7. |

## 3. Recommended Approach And Alternatives

### Recommended: smallest coherent, current-SPEC-compliant FE10 hardening

1. G1-G7 are approved. B5 begins with the feature owner updating FE10 `SPEC.md`/`CHANGELOG.md` for the selected observable contracts; FE02 owner resolves the separate FE02 dependency before any FE02 migration.
2. Enforce the canonical type/template map before delivery. Require `{{otp}}` and `{{expiresInMinutes}}` in `ACCOUNT_VERIFICATION` and `PASSWORD_RESET` SQL/test fixtures. For sensitive auth types, validate raw template data, render, and synchronously send through the configured provider adapter. On provider success persist `SENT` plus attempt and return `201` minimal DTO; on provider failure persist `FAILED` plus safe reason and still return `201` minimal DTO. Sensitive rendered content and raw values do not cross persistence, logging, audit, or HTTP boundaries.
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
- `database/Librarymanagement.sql` - canonical seed templates containing `{{otp}}` and `{{expiresInMinutes}}` in `ACCOUNT_VERIFICATION` and `PASSWORD_RESET` for synchronous provider-only rendering; retry/idempotency schema alignment; no `EMAIL_VERIFY` or `DUE_OR_FINE_NOTICE` canonical alias and no expiry storage.
- `backend/tests/helpers/inMemoryNotificationRepositories.js` - sensitive/non-sensitive template fixtures containing the approved OTP variables, filtered pending selection, all-status idempotency, and non-sensitive retry behavior matching the repository.
- `backend/tests/notificationRoutes.test.js` - canonical type/template mismatch rejection, normalized recursive object/array sensitive-key queue rejection and `safePayload` redaction, provider-only rendering tests for both links with no persistence/API/audit/log leakage, synchronous sensitive success/failure minimal responses, non-sensitive queueing, replay behavior for all statuses, retry/status conflicts, and idempotency tests.
- `backend/tests/integration.test.js` - update the existing full-notification response assertion to G2 minimal DTO expectations, regardless of whether FE07/FE08 migrations occur.
- `backend/src/docs/openapi.yaml` - approved request validation, synchronous sensitive `SENT`/`FAILED` 201 responses, non-sensitive process response, replay, and retry error contract.

### Approved integrations and deferred dependencies

- `backend/src/services/borrowingService.js` and `backend/src/services/reservationService.js` - in-scope migrations from direct repository creation to the approved source requester after the requester task is reviewed. Their affected tests are `backend/tests/borrowingRoutes.test.js` and `backend/tests/reservationRoutes.test.js`; `backend/tests/integration.test.js` is already in default FE10 scope for G2.
- FE09 integration is deferred: its due/fine event is approved in FE10 SPEC, but no current caller/integration exists. No FE09 service file change is planned in this slice; a future FE09-owned implementation must identify the actual event and integration point first.
- `backend/src/services/authService.js` - not in the default FE10 implementation scope. It is a deferred FE02-owned migration after the FE02 owner routes OTP delivery through the FE02-bound requester and replaces the legacy `EMAIL_VERIFY` key with the canonical keys in `.sdd/specs/feat-auth/SPEC.md`; update `backend/tests/authRoutes.test.js` only in that FE02-owned work.

No frontend files, provider credentials, real SMTP code, new dependencies, retry UI, expiry metadata, database migration framework, or unrelated refactor are expected.

## 6. Ordered B5 Implementation Slices

`TASKS.md` owns the atomic B4 decomposition. The sequence below is the B5 execution order: each implementation slice begins with focused failing evidence, receives the smallest approved change, reruns the focused test, then runs the affected suite.

1. **Approved-contract characterization.** After G1-G7 and required SPEC revisions, add failing assertions for every canonical type/template pair and mismatch rejection; normalized recursive object/array queued-data rejection for `OTP`, `reset_token`, `verification-link`, and nested values; matching `safePayload` redaction; provider-only rendering for OTP templates with no persistence/API/audit/log output; synchronous sensitive success/failure; non-sensitive queueing/filtered processing; minimal create/replay/process DTOs; integer source IDs; all-status idempotency; and sensitive/non-sensitive retry outcomes.
2. **Delivery split and response containment.** Implement server-side type classification and the canonical map. Sensitive auth requests render `{{otp}}` and `{{expiresInMinutes}}` in memory and invoke the configured provider adapter synchronously: success persists `SENT`/attempt and failure persists `FAILED`/safe attempt, while both return `201` DTOs. Non-sensitive requests first pass normalized recursive object/array sensitive-key inspection and matching `safePayload` redaction, then render into the queue; `process-pending` selects only them. Verify raw OTP and rendered sensitive content never reach persistence, API, audit, or logs.
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

- The FE10 review checklist's sensitive-content prohibition governs the implementation; synchronous provider-adapter delivery is required for the two sensitive auth types.
- The listed type/template pairs are the approved server-side contract; `ACCOUNT_VERIFICATION` and `PASSWORD_RESET` fixtures use `{{otp}}` and `{{expiresInMinutes}}`; `DUE_OR_FINE_NOTICE` is not canonical unless separately approved.
- FE02 owns OTP generation/validation and the FE02-bound requester migration; FE10 owns provider-only OTP delivery and canonical-key enforcement.
- The mock provider remains sufficient for Phase 1 and no real provider credentials are introduced.
- FE07/FE08 source events are approved for requester migration; FE09's approved event has no current caller/integration and remains deferred.

### Out of scope

- Plaintext or encrypted queued sensitive content, frontend inbox/retry/admin screens, template editor, in-app read state, SMS, push, marketing, real SMTP/provider credentials, token generation or validation, FE02 OTP/link reconciliation, fine calculation, reservation queue decisions, borrowing-state changes, and a new FE09 notification implementation.

## 8. Approved Human Review Checklist

- [x] G1 accepts the server-enforced canonical type/template map; `{{otp}}` and `{{expiresInMinutes}}` fixtures; synchronous sensitive auth delivery with no sensitive rendered persistence; and queued delivery only for non-sensitive types after normalized recursive object/array key inspection and matching `safePayload` redaction.
- [x] G2 accepts safe 4xx validation/template errors, `201 SENT` and `201 FAILED` sensitive delivery summaries, any-status `200` replay summary, and no objects or arrays.
- [x] G3 accepts the bound-source factory, fixed allowlist, null-user audit metadata, the same mapping/normalized recursive queue protections and `safePayload` redaction as HTTP, and FE07/FE08-only scoped migration.
- [x] G4 accepts integer-only Phase 1 and a FE10 SPEC correction.
- [x] G5 accepts the protected non-sensitive retry route, state transition, status conflicts, and standard safe `REISSUE_REQUIRED` response for either sensitive auth type.
- [x] G6 accepts one record per idempotency key across all statuses and non-sensitive retry reuse.
- [x] G7 accepts canonical `ACCOUNT_VERIFICATION`/`PASSWORD_RESET`, no `EMAIL_VERIFY` alias, and FE02-owner deferral.
- [x] FE09's approved event is correctly marked implementation-deferred because no current caller/integration exists, with no FE09 service file change planned in this slice.
- [x] The historical completed `TASKS.md` entries remain intact, with a new pending hardening section only after B3 approval.
- [x] The no-frontend, mock-provider-only, smallest-coherent-hardening scope is acceptable.

## B4 Complete; B5 Implemented; B6 And B7 Complete

This section originally stopped work after B4 until the documentation was reviewed and deliberately moved to an implementation branch. That gate was satisfied; FE10-H01 through FE10-H08 were implemented and independently reviewed on `feat/fe10-hardening`, and FE10-H09 passed final validation and whole-branch review. Nhat then approved integration, commit `9185a9a` reached `main`, and same-commit CI passed in run `29236572558`.

## 9. G8-G10 OTP Security Boundary Follow-up

### 9.1 Goal And Scope

Implement ADR-004 as the smallest coherent cross-feature correction:

- FE02 owns verification/reset OTP credentials.
- FE10 owns rendering, configured-provider delivery, status, attempts, and safe source metadata.
- Only the requester bound to `FE02` may submit `ACCOUNT_VERIFICATION` or `PASSWORD_RESET`.
- Only the requester bound to `FE11` may submit `ACCOUNT_SETUP` with `setupLink`, `expiresInHours`, and `AuthToken` source metadata.
- HTTP cannot submit sensitive authentication types or caller-controlled `sourceFeature`.
- Verification/reset direct notification writes and direct email sends are removed from FE02.
- `CHANGE_PASSWORD_OTP`, legacy token acceptance, FE09 integration, frontend changes, and unrelated refactors remain out of scope.

### 9.2 Approved Contract

| Gate | Approved decision |
| --- | --- |
| G8 | Replace `verificationLink`/`resetLink` with required `otp` and `expiresInMinutes`. FE10 uses raw OTP only in provider memory and persists no OTP or rendered sensitive content. |
| G9 | Staff HTTP and non-FE02 requesters are denied FE02 verification/reset; ADR-005 also denies non-FE11 account-setup requesters. HTTP cannot provide `sourceFeature`. |
| G11 | FE11-bound `ACCOUNT_SETUP` sends synchronously, stores no setup credential/content, and uses token-ID source/idempotency semantics. |

## FE11 Account Setup Follow-up

1. Add `FE11` to the construction-bound requester allowlist without weakening FE02 ownership.
2. Add canonical `ACCOUNT_SETUP -> ACCOUNT_SETUP` with required `setupLink` and `expiresInHours`.
3. Reject staff HTTP and every non-FE11 requester for `ACCOUNT_SETUP`.
4. Send synchronously through the configured provider and persist only safe `AuthToken` metadata, status, generic failure summary, and attempt.
5. Require FE11 resend to create a new token ID and `FE11:ACCOUNT_SETUP:<tokenId>` key; manual retry remains `REISSUE_REQUIRED`.
| G10 | FE02 uses `AuthTokens.TokenId` for source reference and idempotency, makes one FE10 request per OTP token, preserves source state on failure, and creates a new event on resend. |

### 9.3 Expected Files

- `.sdd/rfcs/ADR-004-auth-otp-notification-boundary.md`
- `.agents/CLAUDE.md`
- `.sdd/specs/feat-notification-management/{CONTEXT,SPEC,PLAN,TASKS,CHANGELOG}.md`
- `.sdd/specs/feat-auth/{CONTEXT,SPEC,PLAN,TASKS,CHANGELOG}.md`
- `backend/src/services/notificationService.js`
- `backend/src/services/authService.js`
- `backend/src/services/emailService.js`
- `backend/src/repositories/authTokenRepository.js`
- `backend/src/validators/notificationValidators.js`
- `backend/src/controllers/notificationController.js`
- `backend/src/docs/openapi.yaml`
- `database/Librarymanagement.sql`
- `backend/tests/notificationRoutes.test.js`
- `backend/tests/authRoutes.test.js`
- `backend/tests/helpers/inMemoryNotificationRepositories.js`
- `backend/tests/helpers/inMemoryAuthRepositories.js`
- `backend/tests/integration.test.js`

No frontend file, database table/index migration, new dependency, retry UI, inbox UI, FE09 caller, or `CHANGE_PASSWORD_OTP` migration is planned.

### 9.4 Ordered TDD Slices

1. Add RED FE10 tests for HTTP/non-FE02 sensitive rejection, HTTP source override rejection, and FE02-bound OTP acceptance.
2. Implement source/type ownership and OTP template validation, then wire the configured provider adapter while preserving provider injection in tests.
3. Prove OTP provider-memory-only delivery and safe source metadata/idempotency persistence.
4. Add RED FE02 tests for one requester call, token-ID payload/idempotency, absence of direct verification/reset notification/email calls, and absence of HTTP debug-token fields.
5. Migrate FE02 verification/reset only, capture test OTPs through injected dependencies, and retain legacy token acceptance plus direct `CHANGE_PASSWORD_OTP` delivery.
6. Lock non-blocking `FAILED`/exception behavior and new-token resend semantics.
7. Run focused FE10/FE02 tests, affected integration tests, traceability, leakage/contradiction scans, and `git diff --check`; then stop for human review.

## 11. FE04 Membership Result Boundary Follow-up

1. Treat `FE04` as a construction-bound internal source without changing the protected HTTP actor contract.
2. Permit only the FE04-bound requester to submit `GENERAL_SYSTEM -> MEMBERSHIP_RESULT` with application source metadata and the approved idempotency key.
3. Keep membership approval/rejection committed when FE10 returns `FAILED` or throws a safe requester error.
4. Add focused contract and integration tests before claiming FE04-T006 or FE10-S09 complete.

## 12. Durable Delivery Claim Remediation

The user approved the `PROCESSING` design on 2026-07-23. The remediation keeps
the provider call outside database transactions while making the delivery
ownership durable before that call.

1. Require every in-process source request to include a non-blank
   `sourceEntityType`, a positive integer `sourceEntityId`, and an idempotency
   key.
2. Persist sensitive requests directly as `PROCESSING`; atomically claim queued
   non-sensitive requests with `PENDING -> PROCESSING` and commit before
   provider I/O.
3. Open a new short transaction for `PROCESSING -> SENT` or
   `PROCESSING -> FAILED` and the matching attempt row.
4. Leave a row `PROCESSING` if terminal persistence fails after provider I/O.
   Exclude that row from automatic processing and return
   `409 DELIVERY_STATE_UNCERTAIN` for manual retry.
5. Synchronize the model, canonical SQL, OpenAPI, ADR, and idempotent migration;
   then run focused/full tests and two disposable migration executions before
   H2 review.

## 13. V0.4.4 Fail-Closed Stored Template Validation

The detailed executable plan is
`docs/superpowers/plans/2026-07-27-fe07-fe10-fe12-business-rule-alignment.md`.

1. Add table-driven RED tests for raw HTML tags, inline event-handler
   attributes, and `javascript:` URLs in stored template subject/body fields.
2. Require safe `400 UNSAFE_TEMPLATE_DEFINITION` before recipient rendering,
   notification/attempt persistence, or provider I/O.
3. Keep `sanitizeString()` and `sanitizePayload()` for runtime values; do not
   weaken recursive secret-key detection, redaction, ownership, idempotency,
   minimal DTO, or durable `PROCESSING` rules.
4. Run the unsafe-definition regressions together with the existing runtime
   template-data sanitization regression and the full FE10 route suite.
5. Keep implementation changes uncommitted until the cross-feature L1-L4
   evidence passes and Nhat grants H2.

## 14. V0.4.5 Staging Email Delivery Remediation

Approved design:
`docs/superpowers/specs/2026-07-27-staging-email-delivery-remediation-design.md`.

1. Add and verify an idempotent migration for the canonical active
   `ACCOUNT_SETUP` template; do not rebuild or delete the existing database.
2. Capture the sensitive provider result and persist only
   `providerMessageId` through the existing guarded `markSent` transaction.
3. Extract the existing queued-delivery loop behind a common private core.
   Preserve the staff-authorized wrapper and add a construction-bound SYSTEM
   wrapper with null-user aggregate audit metadata.
4. Add an opt-in worker with an immediate startup pass, 60-second default
   interval, batch size 20, overlap guard, safe error code, and stop behavior.
5. Wire the worker to the backend HTTP lifecycle without changing the direct
   Express app export or starting timers on module import.
6. Keep generated implementation uncommitted until focused/full validation,
   secret scans, staging-safe checks, and H2 review pass.

## 15. V0.5.0 Personal Notification Inbox

Detailed executable plan:
`docs/superpowers/plans/2026-07-27-fe10-personal-notification-inbox.md`.

### 15.1 Goal And Architecture

Expose one own-record-only inbox for authenticated `MEMBER`, `LIBRARIAN`, and
`ADMIN` accounts by adding nullable `Notifications.ReadAt`. Reuse each existing
eligible non-sensitive notification row for both email processing and inbox
display; do not create another channel, table, duplicate event, staff-wide log,
delete operation, or archive state.

The implementation sequence is additive and backend-first:

1. add and verify the repeatable Azure SQL-compatible migration and canonical
   model/schema;
2. add SQL-filtered own-user repository operations and a fixed server-side
   safe projection/action map;
3. add authenticated list, count, mark-one, and mark-all APIs;
4. add the shared frontend client/context, unread polling, bell preview, and
   `/notifications` page;
5. prove FE04/FE07/FE08 fan-in, three-role browser behavior, migration
   repeatability, documentation fan-out, and Azure staging rollout.

### 15.2 Ordered TDD Slices

| Slice | Outcome | Primary acceptance |
| --- | --- | --- |
| FE10-I01 | `ReadAt` migration, backfill, index, canonical schema/model | AC-FE10-011 to AC-FE10-014 |
| FE10-I02 | SQL-owned list/count/read operations and safe action projection | AC-FE10-011 to AC-FE10-015 |
| FE10-I03 | Authenticated API, validation, IDOR-safe `404`, OpenAPI | AC-FE10-011 to AC-FE10-015 |
| FE10-I04 | Frontend API client and shared inbox context | AC-FE10-012, AC-FE10-013, AC-FE10-016 |
| FE10-I05 | Shell bell, `99+` badge, five-unread preview, safe navigation | AC-FE10-015, AC-FE10-016 |
| FE10-I06 | `/notifications` filters, pagination, read state, mark-all | AC-FE10-011, AC-FE10-014, AC-FE10-016 |
| FE10-I07 | FE04/FE07/FE08 fan-in plus MEMBER/LIBRARIAN/ADMIN E2E | AC-FE10-011 to AC-FE10-016 |
| FE10-I08 | Full gates, docs, migration proof, backend-first Azure staging | AC-FE10-011 to AC-FE10-016 |

### 15.3 Review And Release Gates

- Plan approval opens implementation only; each slice still follows RED,
  GREEN, focused verification, review, and a bounded commit.
- The migration must pass twice against a disposable SQL Server database before
  H2 and before staging use.
- Backend API and migration deploy before frontend. The old frontend remains
  compatible throughout that checkpoint.
- H2 reviews the complete local candidate. H3 rechecks specification,
  ownership, sensitive exclusion, migration safety, and staging evidence before
  merge.

### 15.4 Current Candidate State

- PR #75 head `28c4f80` contains the H2-approved FE10-I01..I08 candidate and
  cross-platform migration-hash addendum.
- Exact-head CI `30306805399` and Azure staging deployment `30307855616`
  passed. Azure SQL retained one nullable `ReadAt` column and one supporting
  index, protected aggregates were unchanged, and temporary probes/firewall
  rules were removed.
- Three-role API/browser checks passed own-record isolation, sensitive
  exclusion, read replay, filters, navigation, HTTPS, and CORS.
- H3 round one failed on bounded ADR/documentation and UI-state/stacking
  findings. The remediation is local and must receive a new H2 fingerprint,
  exact-head CI/Azure redeployment, and repeated H3 before merge. Post-merge
  main CI and automatic staging remain unclaimed.

### 15.5 H1 Deployment Addendum

The user approved this addendum on 2026-07-28 after upstream `main@41282b4`
introduced CI-gated automatic staging deployment:

- preserve automatic deployment after successful exact-commit `main` CI and
  preserve `workflow_dispatch` for an operator rerun;
- require both paths to match the checked-out migration SHA-256 with the
  non-secret GitHub `staging` Environment variable
  `FE10_INBOX_MIGRATION_SHA256`;
- additionally require `fe10_inbox_migration_confirmed=true` for manual runs;
- keep preflight -> backend -> frontend -> smoke ordering;
- apply/verify the migration, remove temporary firewall access, store the
  migration hash, and manually verify the exact PR head before H3/merge;
- after merge, monitor exact post-merge CI and the resulting automatic staging
  run for the same migration proof.

The user then approved the H1 Core-drift addendum for `main@5a3c84b` on
2026-07-28. Reconciliation must preserve the upstream packaged
`add_change_password_otp_token_type.sql` startup migration, its readiness
documentation/tests, and the Vietnamese account-verification seed while
retaining the FE10 preflight and ordered deployment. Complete post-drift gates
and a new fingerprint/H2 are mandatory before publication.

After that rebase, upstream advanced again by three commits through
`main@db97f17`. The user approved a second H1 Core-drift addendum on
2026-07-28. Reconciliation preserves the upstream Vietnamese default
reservation-cancellation reason and responsive return/reservation tab styles,
plus every other upstream FE07/FE08/FE10/FE12 round-two correction, while
retaining the FE10 inbox client and scoped notification styles. Complete
post-drift gates and a new fingerprint/H2 remain mandatory before publication.

Upstream later advanced through `main@12faead` by deleting retired files only
under `document/`. The user approved a third H1 drift addendum on 2026-07-28.
There is no path or Core-contract overlap with the FE10 H3 remediation, and the
rebase completed without conflict. Complete gates and a new H2 fingerprint
remain mandatory; after publication, the exact head must replace current
`main` on Azure staging and be verified there before repeated H3.

The complete local matrix then passed: backend 69/69 suites and 1116/1116
tests; frontend 259/259 plus lint/build; deployment 20/20; system 10/10;
traceability state 3/3 and FE10 14/16 (88%); Chromium 11/11; audits, Azure
schema preparation, diff hygiene, and focused contradiction scans.

Before the approved round-3 H2 could be used, the mandatory pre-stage fetch
advanced upstream to `main@a240705`. The user approved a fourth H1 drift
addendum on 2026-07-28. Reconciliation preserves the upstream deletion of the
FE11 Admin user-edit API/UI/test surface while retaining FE10. Main CI
`30311801599` and Azure deployment `30311973740` passed, the branch rebased
without conflict, and complete gates plus a new fingerprint/H2 are mandatory.

Fresh validation on that exact base passed backend 69/69 suites and 1084/1084
tests, frontend 259/259 plus lint/build, deployment 20/20, system 10/10,
traceability state 3/3, FE10 traceability 14/16 (88%), Chromium 11/11, audits,
Azure schema preparation, and diff hygiene. The new fingerprint/H2 remains.
