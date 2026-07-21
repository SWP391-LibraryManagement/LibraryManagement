# CHANGELOG.md - FE07 Borrowing Management

## 2026-07-22 - Correct rejected request status in member history

- Exposed the owning borrow-request status in canonical detail history rows.
- Displayed rejected requests as `Đã từ chối` while preserving persisted detail status `REQUESTED` and existing history filters.

## 2026-07-21 - Tier daily borrowing by membership status

- Added a 5-copy daily limit for FE04-approved members and a 3-copy daily limit for other active `MEMBER` accounts.
- Enforced the tier during member request creation and Librarian/Admin approval while preserving the five-active-copy ceiling.
- Kept FE04 non-blocking: membership approval increases the daily allowance instead of being required to borrow.

## 2026-07-21 - Use role-based member eligibility

- Replaced the FE04 approval prerequisite with active-account plus `MEMBER` role authorization.
- Kept librarian/admin approval of each borrow request as the FE07 circulation control.
- Removed book ratings from the member borrow-request candidate response and confirmation UI.
- Stabilized the member borrowing-history card layout across toolbar, table, and pagination regions.

## 2026-07-20 - Vietnamese UI localization and typography

- Localized frontend-generated labels, states, accessibility names, and safe error feedback for this feature.
- Preserved API contracts, raw enum values, permissions, business rules, and user-owned catalog/profile data.
- Applied the shared `Be Vietnam Pro` body and `Noto Serif` heading typography contract with Unicode-capable fallbacks.

## 2026-07-19 - Phase 2 Exit Closeout

- feat-borrowing-management is accepted within the complete Phase 2 FE01-FE12 reconciliation recorded by PR #40/#41; validation and residual boundaries are consolidated in `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`.
- Deferred and future-scope limitations remain explicit and are not widened by this closeout.

## 2026-07-19 - V0.5.1 Reconciliation And History Contract

- Reconciled canonical eligibility, active-parent guards, member-scoped approval serialization, required approval/borrow metadata, Ho Chi Minh business dates, future/pre-borrow return rejection, and mandatory rejection reasons.
- Changed member history from request-envelope/client pagination to canonical detail rows with detail-status filtering, derived `OVERDUE`, member scope, inclusive dates, stable database ordering, and server pagination.
- Passed focused FE07 backend 66/66, frontend 18/18, traceability 28/28, and the aggregate disposable SQL Server gate 61/61 with cleanup.
- Final whole-repository regression, diff review, and human integration acceptance remain open.

## 2026-07-18 - Member Workspace Layout Polish

- Clarified the member borrow-selection hierarchy and responsive two-column layout without changing FE07 mutation APIs.
- Consolidated borrowing history filters, table, and pagination into one responsive operational card.

## 2026-07-18 - Admin Circulation Alignment

- Made the admin circulation table read-only and routed approve/return work to canonical FE07 screens.
- Removed unsafe admin-only direct inserts and updates of borrowing details.
- Derived `OVERDUE` from `BORROWED` plus due date, and added refresh/loading feedback and canonical database export.
- Removed demo circulation transactions from the baseline SQL seed.
- Added a coherent canonical circulation seed with one active loan and one completed return so the admin read model can be verified without frontend fallback data.

## 2026-07-17 - Phase 1 Baseline Approved

- Nhật approved the normalized FE07 borrowing, return, renewal, history, and reservation-priority contract as the Phase 1 baseline; reconciliation implementation remains pending.

## 2026-07-17 - Return And Reservation Priority Contract

- Made normal return atomic with FE08 reservation-claim revalidation and the shared lock order.
- Clarified that an `AVAILABLE` returned copy remains unavailable to ordinary borrowing while an `ACTIVE` reservation queue claim exists.

## 2026-07-17 - Borrowing History Contract - v0.5.1

- Changed `SPEC.md` to `READY FOR REVIEW` while preserving the v0.5.0 reconciliation decisions.
- Defined the shared member/staff history query contract, including status/date filters, page/limit defaults and bounds, inclusive date semantics, validation-before-query, and stable ordering.
- Added traceability for BR-FE07-028, FR-FE07-028, AC-FE07-022, and the focused implementation task; no code was changed.

## 2026-07-16 - Reconciliation Planning Human Review Approval

- Nhat approved the FE07 v0.5.0 reconciliation plan and FE07-T031 through FE07-T038.
- Marked the reconciliation `PLAN.md` and `TASKS.md` as `APPROVED`; the new implementation tasks and validation gates remain unchecked.

## 2026-07-16 - V0.5.0 Reconciliation Planning

- Changed `PLAN.md` and `TASKS.md` to `READY FOR REVIEW - v0.5.0 RECONCILIATION` after SPEC approval.
- Preserved all historical checked tasks and B7 evidence, then added FE07-T031 through FE07-T038 for canonical eligibility, parent-book guards, member-scoped limit locking, approval metadata, Ho Chi Minh business dates, future-return rejection, mandatory rejection reasons, frontend errors, and focused verification.
- Added exact file paths, RED/GREEN gates, dependency order, SQL concurrency expectations, and supplemental v0.5.0 traceability without claiming the historical implementation already satisfies the revised contract.

## 2026-07-16 - Human Review Approval

- Nhat confirmed human review of revision v0.5.0.
- Marked `SPEC.md` and `CONTEXT.md` as `APPROVED` and completed the revision review gate.

## 2026-07-15 - Eligibility, Limit, and Date Contract (v0.5.0)

- Required canonical `Members.Status = APPROVED` and parent `Books.Status = ACTIVE` at create/approval.
- Defined the five-copy formula at create/approval and a member-scoped approval lock that prevents concurrent limit overflow.
- Required `CreatedBy`, `ApprovedAt`, `ApprovedBy`, and per-detail `BorrowDate`; due date is `BorrowDate + 14 calendar days`.
- Standardized borrow/return/overdue business dates on `Asia/Ho_Chi_Minh` and rejected future return dates.
- Made rejection reason mandatory in audit metadata and added traceability for every new BR/FR/AC.
- Aligned approval locking with FE06 using `member-scoped lock -> BookCopies -> BorrowRequests/BorrowDetails -> Reservations`; active-count and reservation-aware checks run only after relevant rows are locked.
- Updated `CONTEXT.md` from the superseded Phase 1 draft assumptions to the v0.5.0 review/reconciliation decisions.

## 2026-07-15 - Reservation-Aware Borrowing Contract (v0.4.0)

- Approved FE07 as the owner of borrow request creation and approval for both ordinary copies and requester-owned notified holds.
- Added reservation-priority rules that block ordinary create/approve actions while an `ACTIVE` queue entry exists.
- Added atomic approval fulfillment for matching `NOTIFIED` reservations, including reservation audit and rollback requirements.
- Added FE07-T029 and FE07-T030 with traceability to the new BR/FR/AC identifiers.
- Preserved the five-copy limit, 14-day duration, one renewal, all-or-nothing policy, manual FE08 queue processing, existing endpoints, and existing schema.

## 2026-07-14 - B7 Integration and Review Closeout

- Pushed implementation commit `3a7b0ad1165607b8912c6c0be5f3ef2025c11b55` on `feat/fe07-validation` and opened PR #19 against `main`.
- GitHub Actions passed on the PR, then PR #19 merged as `aeed0dfecb764e6cbe63d7074727f318700e59ea`.
- GitHub Actions CI run `29308540692` passed for the merge commit on `main`.
- Recorded the integration evidence in `.sdd/reviews/fe07-b7-integration-review-closeout-2026-07-14.md` and marked FE07 complete through B7.

## 2026-07-14 - B6 L4 Browser Acceptance and Validation Closeout

- Added member/staff route guards for every FE07 screen and removed fabricated API fallback rows and simulated mutation success from history, approval, return, and member-detail workflows.
- Namespaced shared FE07 dialog styles as `lib-modal*`, kept wide tables inside `.lib-table-wrap`, and removed page-level overflow at desktop and mobile widths.
- Kept overdue loans in the active list without duplicating them in returned history, and retained the temporary create-request catalog only as the documented FE01/FE06 dependency boundary.
- Independent-review remediation restored the specified unknown-member `404`, mapped a lost reject race to `409`, removed client UTC return dates and invented approval notes/eligibility evidence, separated pending requests from active loans, and added modal focus management.
- Verified guest/member/staff access, request approval, renewal, normal return, truthful network failure states, modal visibility, and responsive layout against the real FE07 backend.
- Final automated gate passed: frontend 37/37, lint, production build, backend 273/273, live SQL 14/14 with cleanup, FE07 traceability 22/22, and `git diff --check`. No commit, push, or merge was performed.
- Nhat confirmed the required human review on 2026-07-14; B6 is complete and awaiting the integration decision.

## 2026-07-13 - B6 L3 Constitution Hardening

- Kept post-commit readback errors outside mutation rollback handling for create, approval, and return transactions.
- Revalidated active account, approved membership, unpaid positive fine, and overdue active loan under approval transaction locks; mapped each repository outcome to an existing safe API error.
- Moved reject and renew audit writes into their repository transactions so an audit failure rolls back the state change.
- Restricted FE07 date filters and return input to real `YYYY-MM-DD` calendar dates.
- Added in-memory route regressions and real SQL evidence for transaction eligibility outcomes and audit rollback. B6 remains in progress.

## 2026-07-13 - B6 L2.3 Contract, Model, and Traceability Alignment

- Reviewer follow-up: fixed derived `OVERDUE` filtering in FE07/FE12 SQL and in-memory test parity; added direct history isolation, independent selected-member filter, four-blocker renewal, real SQL rollback, and runtime FineCandidate contract evidence.
- Reviewer follow-up: removed the unapproved selected-member history `404` contract response and remapped FR-FE07-022 to the real SQL transaction tests.
- Added `COMPLETED` to persisted request model metadata; made requested-detail due dates nullable; removed persisted detail `OVERDUE` from model and SQL status constraints while retaining derived FE09/FE12 reporting semantics.
- Documented the approved FE07 OpenAPI request validation, filters, success payloads, and safe error responses without changing runtime response shapes.
- Added direct staff selected-member history/filter acceptance coverage and mapped AC-FE07-001 through AC-FE07-014 plus direct FR-FE07-022 rollback tests in traceability.
- Clarified return request defaults, audit metadata, and that `CANCELLED` has no approved endpoint/actor/trigger/payload in the current scope.

## 2026-07-12 - Localized Borrowing API Errors

- Added actionable Vietnamese messages for FE07 role, eligibility, borrowing-limit, copy, fine, overdue, and renewal-conflict errors.
- Scoped borrowing-specific messages to `borrowingApi` and preserved generic handling for FE06, FE08, FE10, and FE12 API calls.
- Extracted API error formatting into testable frontend helpers while preserving authentication, validation, network, and backend fallbacks.
- Added focused Node tests for `NFR-FE07-UX-001` error-message behavior and wired frontend tests into CI.
- Updated `PLAN.md` to reflect the implemented FE07 frontend screens and error-state scope.

## 2026-06-25 - All-or-nothing borrow policy (v0.3.2, TD-007)

- Resolved TD-007: Phase 1 borrow-request handling is **all-or-nothing**. Aligned the spec to the
  current code instead of changing core circulation logic (team decision 2026-06-25).
- Updated FR-FE07-003, FR-FE07-017, FR-FE07-018 and AF-FE07-002 to state that any duplicate /
  non-existent / unavailable copy rejects the whole request/approval (no partial request).
- Added BR-FE07-022 documenting the all-or-nothing policy and deferring per-item rejection to a later phase.

## 2026-06-25 - Clarified OVERDUE as a derived state (v0.3.1)

- Documented that `OVERDUE` is a derived state in Phase 1: the system does not persist
  `BorrowDetails.Status = 'OVERDUE'`; it is computed from a `BORROWED` detail with `dueDate < today`
  and consumed by FE09. A persisted OVERDUE status + scheduled job is deferred to a later phase.
- This aligns the spec with the current implementation (Validation Gate finding); no behavior change.

## 2026-06-02

- Replaced old Borrow Book draft with FE07 Borrowing Management draft.
- Expanded scope to include borrow request, approval/rejection, return processing, renewal, and borrowing history.
- Added stable requirement IDs for business rules, functional requirements, acceptance criteria, edge cases, and open questions.

## 2026-06-10

- Updated API contract policy to allow approval in `SPEC.md` unless the team reintroduces a shared API contract document.
- Resolved FE07 borrow limit and default loan duration using shared Phase 1 decisions: 5 active borrowed copies and 14 calendar days.
- Resolved remaining FE07 open questions: 1 renewal, unpaid fines block borrowing/renewal, members create own requests, pending details use `REQUESTED`, requests auto-complete when all details are terminal, and FE09 owns fine creation.
- Approved FE07 `SPEC.md` for Phase 2 planning after flow review, API approval, FE08/FE09 dependency check, and acceptance-criteria testability review.

## 2026-06-10 - Backend Slice Ready For Review

- Added the FE07 backend plan and task checklist for Nhat's borrowing scope.
- Added borrow request, approval, rejection, return, renewal, history, audit, and notification handoff logic.
- Aligned the SQL script with approved borrow request/detail statuses.
- Added backend tests for borrowing rules, return/fine-review data, renewal, and role guards.

## 2026-06-20 - Frontend UI Implemented and Accessibility Validated

- Implemented member borrow request, borrowing history, librarian borrow request approval/rejection, return processing, and member borrowing details screens.
- Wired all frontend screens to backend APIs using axios and React hooks.
- Added table captions, column header scopes, accessible labels for date inputs, selects, pagination buttons, and icon controls.
- Added keyboard support for selectable table rows (Enter/Space).
- Added loading, empty, and error states on all reviewed screens.
- Validated: `npm.cmd --prefix frontend run lint`, `npm.cmd --prefix frontend run build`, `npm.cmd --prefix backend test`.
- Merged via PR #7 into `feat/fe07-fe08-fe10-fe12-ui-polish`.

## 2026-06-25 - Raised Unwanted (Error-Handling) Requirement Coverage

- Bumped version to 0.2.0 (MINOR); status unchanged (APPROVED).
- Added new sub-section "7.1 Unwanted Behaviour Requirements" with 9 EARS unwanted requirements (FR-FE07-014 to FR-FE07-022) covering borrow-limit overrun, ineligible/inactive member, unpaid fine/overdue blocking, invalid/duplicate/empty request items, copy unavailable at approval, concurrent approval race, disallowed renewal, invalid state/date transitions, and transaction rollback.
- Each new FR is written as `IF`/`WHERE [condition], the system shall ...` and traces to existing EC-*, BR-*, and AF-* sources (no new logic invented).
- Unwanted FR share raised from ~15% (2/13) to ~50% (11/22), meeting the ≥30% target.
- Extended Traceability Matrix (Section 16) with rows for FR-FE07-014 to FR-FE07-022 (Test Case = TBD).

## 2026-06-25 - Added Formal State Model (State Diagrams) for Both Lifecycles

- Bumped version to 0.3.0 (MINOR); status unchanged (APPROVED).
- Added new sub-section "10.3 State Model & Transition Rules" at the end of Section 10 Data Requirements, modeling FE07's two lifecycles separately.
- (A) BorrowRequest lifecycle: states PENDING, APPROVED, REJECTED, COMPLETED, CANCELLED — with Mermaid `stateDiagram-v2`, state descriptions, valid transitions (From/To/Trigger/Condition/FR-BR), forbidden transitions, and invariants INV-FE07-A1..A6.
- (B) BorrowDetail lifecycle: states REQUESTED, BORROWED, RETURNED, LOST, DAMAGED, OVERDUE — with Mermaid `stateDiagram-v2`, descriptions, valid transitions, forbidden transitions, and invariants INV-FE07-B1..B8.
- All state values reuse the enums declared in Section 10.2 (no new status invented). Transitions trace to existing MF-*, FR-*, BR-*, AF-*, and EC-* sources.
- Documented enum-declared states without an explicit flow (request `CANCELLED`, detail `OVERDUE`) as modeled per the declared enum with their dependency on FE09 / Phase 2 confirmation noted.
## 2026-07-18 - Librarian Borrow Request Review Polish

- Corrected Vietnamese labels and improved the request list/detail layout for the librarian review screen.
- Added canonical request-status filtering and a visible last-updated indicator.
- Made manual refresh provide loading/success/error feedback and reload canonical API state after approval or rejection.
- Exposed the member profile, canonical member ID, phone, barcode, author, location, and every requested copy from the existing database relationships.
- Sorted librarian request IDs in ascending order, added eight-row pagination, and refined the summary/filter toolbar.
- Replaced the heading font fallback that rendered some Vietnamese combining marks incorrectly.
- Added accent-insensitive search across request code, member identity, book, author, and barcode; search results now feed the same pagination used by the canonical status filter.
- Added an explicit Search submit action with Enter-key support and separated draft input from the applied query so results update only after user confirmation.
- Rebuilt the librarian return workspace with canonical approved-loan loading, explicit refresh/search feedback, complete member/copy fields, pagination, and canonical reload after return mutations.
## 2026-07-18 - Librarian row actions made explicit

- Added status-aware row actions to borrow requests: pending requests expose approve/reject, while terminal requests expose detail viewing.
- Added an explicit return-processing action to each active loan row while retaining the condition review and confirmation panel.
- Kept all mutations connected to the existing FE07 API and canonical server reload flow.

## 2026-07-18 - Member borrowing details workspace

- Replaced the ambiguous manual user-ID lookup with an API-backed member directory that automatically loads the first available member.
- Added accent-insensitive member and transaction search, canonical status filtering, eight-row pagination, summary counters, and responsive profile/table layouts.
- Displayed canonical member, contact, book, copy, barcode, location, loan, due, return, and status fields from the existing FE07 database relationships.
- Kept the screen restricted to Librarian/Admin and connected it to the shared borrow-request and member-borrowing endpoints without demo fallback data.
