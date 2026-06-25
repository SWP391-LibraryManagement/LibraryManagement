# CHANGELOG.md - FE08 Reservation Management

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
- Updated `16. Traceability Matrix`: added rows for every new FR (mapping source EC/BR/AF/Q and Test Case, `TBD` where no test exists yet) and backfilled previously missing FR-FE08-001/002/003/006/007/009/010 rows.

## 2026-06-20 - Frontend UI Implemented and Accessibility Validated

- Implemented member my reservations, librarian reservation management, and librarian reservation queue processing screens.
- Wired all frontend screens to backend APIs using axios and React hooks.
- Added table captions, column header scopes, accessible labels for search inputs, selects, pagination buttons, and icon controls.
- Added loading, empty, and error states on all reviewed screens.
- Validated: `npm.cmd --prefix frontend run lint`, `npm.cmd --prefix frontend run build`, `npm.cmd --prefix backend test`.
- Merged via PR #7 into `feat/fe07-fe08-fe10-fe12-ui-polish`.
