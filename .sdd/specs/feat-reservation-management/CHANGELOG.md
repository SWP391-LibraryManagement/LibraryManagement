# CHANGELOG.md - FE08 Reservation Management

## 2026-07-19 - Open Reservation Limit Corrected

- Counted both `ACTIVE` and `NOTIFIED` rows for the maximum-three-open-reservations rule.
- Treated an existing `NOTIFIED` row as a duplicate for the same member and physical copy.
- Added route, SQL-source, and live SQL regression coverage while preserving the existing conflict codes.

## 2026-07-19 - V0.4.4 Member-Safe Candidate Contract Approved

- Approved protected member-only `GET /api/reservations/candidates` as the source of physical `CopyId` targets.
- Locked the safe projection to `copyId`, `bookId`, title, nullable author, `BORROWED`/`RESERVED` status, and active queue count.
- Preserved FE01 public redaction, FE06 staff inventory access, and `POST /api/reservations { copyId }` mutation semantics.
- Added server-owned `q`/page/limit behavior, deterministic ordering, implementation tasks FE08-T035 through FE08-T039, and SQL/browser validation gates.
- User approved Option A and the written design on 2026-07-19; implementation and focused/full automated validation are now complete, while human H3 integration remains open.

## 2026-07-19 - V0.4.4 Candidate Catalog Validated

- Added the member-only SQL-backed candidate catalog and migrated the member page off `DEMO_RESERVABLE`.
- Validated the redacted six-field projection, eligible statuses, server search/pagination, real `copyId` mutation, and canonical refresh through backend, frontend, SQL, and browser gates.
- Aggregate disposable SQL validation passes `9/9` suites and `69/69` tests after two migration passes; cleanup leaves no disposable database or login.
- Closed `TD-028` for agent-side validation; final H3, merge, and post-merge `main` CI remain human gates.

## 2026-07-19 - Reservation Candidate Drift Recorded

- The final product-drift scan confirmed that reservation mutations and lifecycle state are server-authoritative, but `MyReservationsPage` still displays hardcoded `DEMO_RESERVABLE` copy candidates.
- Registered `TD-028` for an approved member-safe FE01/FE06/FE08 copy-selection contract; reconciliation did not invent a new endpoint or expose staff-only copy metadata.

## 2026-07-19 - V0.4.3 Reservation Reconciliation

- Locked canonical pagination, `copyId` queue processing, stable ordering, deterministic empty/ineligible/notification-failure outcomes, and immutable terminal timestamps.
- Reconciled FE07 priority and held-owner fulfillment with the shared copy/reservation lock order and transaction rollback boundary.
- Kept member/staff pages on canonical server lifecycle state with refresh-after-mutation behavior and no local fulfillment/deletion simulation.
- Passed focused backend/shared tests 77/77, frontend 9/9, traceability 28/28, diff hygiene, and disposable SQL reservation-boundary evidence; final human integration remains open.

## 2026-07-18 - Truthful Member Reservation State

- Removed member-side demo reservation substitution, simulated create success, and local-only cancellation success when FE08 APIs fail.
- Kept the member list synchronized with canonical `/api/reservations/me` state and improved the responsive catalog/list card hierarchy.

## 2026-07-17 - Phase 1 Baseline Approved

- Nhật approved the normalized FE08 queue, fulfillment, cancellation, terminal timestamp, and FE07 handoff contract as the Phase 1 baseline; implementation follow-up remains pending.
- Closed the documentation review gates in `PLAN.md` and `TASKS.md`; normalization implementation tasks remain not started.

## 2026-07-17 - Return Handoff Priority Contract

- Clarified that an `ACTIVE` queue claim remains enforced when FE07 returns the copy to stored `AVAILABLE`.
- Preserved manual FE08 queue ownership and deterministic queue-order display requirements.

## 2026-07-17 - Open Reservation And Queue Contract Hardening

- Counted `ACTIVE` and `NOTIFIED` as open reservations for the limit and duplicate rule.
- Made `queuePosition` derived and retained only one canonical Phase 1 queue-processing endpoint.
- Aligned the reservation caller with FE10's `RESERVATION_AVAILABLE -> RESERVATION_READY` contract.

## 2026-07-17 - Terminal Timestamp History - v0.4.3

- Preserved `NotifiedAt` and `ExpiresAt` as immutable history after `NOTIFIED -> FULFILLED`, `EXPIRED`, or `CANCELLED`.
- Defined those fields as null only for reservations that never reached `NOTIFIED` and restricted `CancelledAt` to `CANCELLED` rows.
- Updated state invariants, traceability, test targets, and FE08-T030 reconciliation scope; no implementation file changed.

## 2026-07-17 - Deterministic Contract Normalization (v0.4.2)

- Closed the remaining policy alternatives: ineligible reservations are skipped for the current run and remain `ACTIVE`; an empty queue returns no selection and leaves state unchanged; FE10 failure keeps the committed hold and writes a failure audit.
- Standardized `CopyId`-only queue processing, pagination defaults/bounds, stable ordering, and `QueuePosition`/notification timestamp semantics.
- Added FE08-T028 through FE08-T033 as unchecked normalization tasks; historical B7 implementation evidence remains separate from this review.
- Updated `TEST_PLAN.md` with contract-level queue, fulfillment, pagination, failure, and concurrency targets; replaced the last `TBD` traceability entry with FE08-T11.
- Removed remaining non-contractual date-range/notification wording and made the physical-copy target explicit in the lifecycle and review gate.
- Locked queue ordering to `ReservedAt ASC, ReservationId ASC` and invalid cancellation to `409 RESERVATION_NOT_ACTIVE` with unchanged state.
- Added the missing AC-FE08-001 through AC-FE08-010 traceability rows and kept normalized pagination evidence explicitly pending.
- Added explicit test-plan mappings for all FE08 security, transaction, performance, logging, and usability NFR IDs.

## 2026-07-15 - Canonical Membership Dependency (v0.4.1)

- Replaced optional `MembershipApplications` eligibility reads with canonical `Members.Status = APPROVED` plus active user status from FE04.
- No reservation lifecycle, queue, API, or implementation behavior changed.

## 2026-07-15 - FE07 Fulfillment Handoff Contract (v0.4.0)

- Confirmed physical `CopyId` as the required Phase 1 reservation target and removed the remaining book-level ambiguity.
- Defined FE07 approval for the same notified member and copy as the only `NOTIFIED -> FULFILLED` trigger.
- Defined `ACTIVE` queue priority as a blocker for ordinary FE07 create/approve actions and allowed owner cancellation from `ACTIVE` or `NOTIFIED`.
- Added FE08-T025 for shared lock-order alignment and concurrency evidence.
- Preserved manual queue processing and added no endpoint, table, column, automatic expiration job, or FE10 delivery change.

## 2026-07-13 - Frontend Correctness Aligned With Approved Lifecycle (v0.3.1)

- Mapped `NOTIFIED` to ready for pickup and `FULFILLED` to completed in the shared frontend view model.
- Added reservation-specific Vietnamese API errors without changing FE07 or generic API behavior.
- Connected the librarian UI to the existing `POST /api/reservations/expire-holds` endpoint and reloads canonical server state after success.
- Removed local-only fulfillment and deletion controls that did not persist backend state.
- Added focused frontend tests and refreshed FE08 plan/task traceability.
- Formalized the existing `POST /api/reservations/expire-holds` contract in `SPEC.md`, updating the SPEC version to `0.3.1` and its date to 2026-07-13.
- No backend implementation, database schema, FE07 fulfillment, FE10 delivery, or pagination changes.

## 2026-06-25 - Reservation State Model Added (v0.3.0)

- Bumped `SPEC.md` version `0.2.0` -> `0.3.0`; `Last Updated` 2026-06-25; Status unchanged (APPROVED).
- Added subsection `10.3 State Model & Transition Rules (Reservation)` at the end of section 10, formalizing the lifecycle of `Reservations.status` per the Formal Spec standard (Spec-Driven Development).
- State set taken directly from the declared enum in 10.2: `ACTIVE`, `NOTIFIED`, `FULFILLED`, `CANCELLED`, `EXPIRED`. No new states invented.
- Content: (a) Mermaid `stateDiagram-v2` with start/end nodes; (b) state description table; (c) Valid Transitions table with trigger/guard and FR/BR/AF/Q traces; (d) Invalid Transitions table (terminal states are final; no `ACTIVE`->`FULFILLED` skip; no `NOTIFIED`->`ACTIVE`; no double selection; cancelled/expired excluded from queue); (e) 7 invariants (INV-FE08-001..007).
- Traced to FR-FE08-001..024, BR-FE08-003/005/006/008/009/010/011/012/013/014, AF-FE08-003/004, EC-FE08-007/010, Q-FE08-001/004, MF-FE08-001/002/004/005, AC-FE08-004/007, and NFR-FE08-TXN-001/002 + LOG-001.
- No logic changed: the state model only consolidates transitions already implied by existing flows, rules, and resolved questions.

## 2026-06-02

- Created initial FE08 Reservation Management draft spec.
- Added context, open questions, proposed API contract, business rules, acceptance criteria, and traceability matrix.

## 2026-06-10

- Updated API contract policy to allow approval in `SPEC.md` unless the team reintroduces a shared API contract document.
- Resolved FE08/FE07 renewal dependency: active reservation or held copy for another member blocks FE07 loan renewal.

## 2026-06-10 - Phase 1 Review Decisions Approved

- Approved open-question decisions from `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.
- Updated `SPEC.md` decision status from draft/proposed/open to approved where applicable.
- Preserved Phase 1 scope controls and deferred future-work items explicitly.

## 2026-06-10 - Backend Slice Ready For Review

- Added the FE08 backend plan and task checklist for Nhat's reservation scope.
- Added member reservation APIs, staff queue processing, audit logging, and FE10 notification request handoff.
- Added backend tests for reservation rules, cancellation ownership, queue order, notifications, and role guards.

## 2026-06-25 - EARS Unwanted Coverage Raised (v0.2.0)

- Bumped `SPEC.md` version `0.1.0` -> `0.2.0`; updated `Last Updated` to 2026-06-25; Status unchanged (APPROVED).
- Added section `7.1 Unwanted Behaviour Requirements` with 14 new EARS Unwanted functional requirements (FR-FE08-011 .. FR-FE08-024).
- No new logic introduced: every new FR promotes an existing error/abnormal branch from Edge Cases (EC-*), Business Rules (BR-*), Alternative Flows (AF-*), or approved decisions (Q-*), each carrying a source trace.
- Covered branches: member not found, inactive account, membership not approved, book/copy not found, reservation limit reached, cancel-not-owner, repeat cancellation, member ineligible at queue time, reservation expiry, empty eligible queue, notification service failure/retry, concurrent queue selection, held-copy borrow block, FE07 renewal block.
- Raised Unwanted FR ratio from ~30% (3/10) to ~68% (15/22), exceeding the 30% target.
- Updated `16. Traceability Matrix`: added rows for every new FR (mapping source EC/BR/AF/Q and provisional test references) and backfilled previously missing FR-FE08-001/002/003/006/007/009/010 rows.

## 2026-06-20 - Frontend UI Implemented and Accessibility Validated

- Implemented member my reservations, librarian reservation management, and librarian reservation queue processing screens.
- Wired all frontend screens to backend APIs using axios and React hooks.
- Added table captions, column header scopes, accessible labels for search inputs, selects, pagination buttons, and icon controls.
- Added loading, empty, and error states on all reviewed screens.
- Validated: `npm.cmd --prefix frontend run lint`, `npm.cmd --prefix frontend run build`, `npm.cmd --prefix backend test`.
- Merged via PR #7 into `feat/fe07-fe08-fe10-fe12-ui-polish`.
## 2026-07-18 - Librarian reservation operations aligned with canonical API data

- Rebuilt the librarian reservation screen with valid Vietnamese copy, clearer list/queue layouts, explicit search, book/status filters, and eight-row pagination.
- Removed the staff demo-data fallback and the persistent successful-refresh notice; loading, empty, and API-error states now represent canonical server state only.
- Reloaded reservations after queue processing and hold expiration so UI state remains synchronized with FE07/FE08/FE10 transitions.
- Enriched reservation list fields with member full name, email, author, barcode, copy status, and location from the existing database relations.
- Kept manual queue processing in stable reservation-time order and retained the Phase 1 manual expired-hold workflow.
- Verified focused FE08 backend tests, frontend lint, frontend reservation tests, and production build.
- Added a visible row action for opening the selected book queue; the hold/notify action is enabled only after the target copy becomes `AVAILABLE`.
