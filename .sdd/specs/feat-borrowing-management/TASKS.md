# TASKS.md - FE07 Borrowing Management

Status: COMPLETE

Owner: Nhat

Updated: 2026-07-14

Workflow State: B5 implementation, B6 validation, and B7 integration complete

---

## 1. Backend Tasks

- [x] FE07-T01 Add borrowing routes from the approved API contract.
- [x] FE07-T02 Add validators for request IDs, detail IDs, copy IDs, statuses, dates, reject reason, return condition, and notes.
- [x] FE07-T03 Add borrowing service rules for member eligibility, borrow limit, unpaid fine, overdue loan, copy availability, and duplicate request items.
- [x] FE07-T04 Add SQL repository methods for borrow request creation, listing, approval, rejection, return, and renewal.
- [x] FE07-T05 Add member endpoints for create request and own history.
- [x] FE07-T06 Add staff endpoints for list requests and member borrowing info.
- [x] FE07-T07 Add approval flow that marks details `BORROWED`, sets due dates, and marks copies `BORROWED`.
- [x] FE07-T08 Add rejection flow for pending requests.
- [x] FE07-T09 Add return flow for normal, damaged, and lost returns.
- [x] FE07-T10 Add renewal flow with one-renewal limit and FE08 reservation conflict check.
- [x] FE07-T11 Expose fine-review data without creating FE09 fine rows.
- [x] FE07-T12 Write audit logs for create, approve, reject, return, and renew.
- [x] FE07-T13 Align SQL script with approved FE07 statuses.

## 2. Test Tasks

- [x] FE07-T14 Add in-memory borrowing repository helper.
- [x] FE07-T15 Test create request, duplicate copy rejection, and unavailable copy rejection.
- [x] FE07-T16 Test approval and member-only history.
- [x] FE07-T17 Test return processing, completed request update, and fine candidate output.
- [x] FE07-T18 Test renewal success, renewal limit, and reservation conflict.
- [x] FE07-T19 Test authentication and role guards.

## 3. Frontend Tasks

- [x] FE07-T20 Implement member borrow request creation screen.
- [x] FE07-T21 Implement member borrowing history screen.
- [x] FE07-T22 Implement librarian borrow request approval/rejection screen.
- [x] FE07-T23 Implement librarian return processing screen.
- [x] FE07-T24 Implement librarian member borrowing details screen.
- [x] FE07-T25 Wire frontend screens to backend APIs.
- [x] FE07-T26 Add accessibility: table captions, header scopes, form labels, keyboard support.
- [x] FE07-T27 Add loading, empty, and error states on all screens.

## 4. Validation

- [x] `npm test` in `backend`.
- [x] `npm.cmd --prefix frontend run lint` passed.
- [x] `npm.cmd --prefix frontend run build` passed.
- [x] Browser verification: tables, captions, labels, and keyboard navigation verified.
- [x] B6 L2.3 aligned persisted FE07 statuses, SQL metadata, and the OpenAPI contract with the approved runtime/spec.
- [x] B6 L2.3 added focused model/OpenAPI tests and direct staff member-borrowings filter coverage.
- [x] B6 L3 hardened post-commit readback handling, transaction-time approval eligibility, reject/renew audit atomicity, and strict calendar-date validation.
- [x] B6 L3 added in-memory regressions and live SQL evidence for approval eligibility and reject/renew audit rollback.
- [x] B6 L4 removed fabricated FE07 browser state, added complete route guards, fixed modal/responsive behavior, and validated the real member/staff workflow.
- [x] B6 independent-review remediation: unknown-member `404`, reject-race `409`, server-owned return date, truthful approval/return UI, pending-loan partitioning, modal focus, and mobile pagination.
- [x] B6 final automated gate: frontend 37/37, lint/build, backend 273/273, live SQL 14/14 with cleanup, FE07 traceability 22/22, and `git diff --check`.
- [x] Human review by Nhat confirmed on 2026-07-14 before commit, push, or merge.

## 4. Traceability

| Spec ID | Covered by |
| --- | --- |
| BR-FE07-004 | FE07-T03, FE07-T15 |
| BR-FE07-005 | FE07-T03, FE07-T07 |
| BR-FE07-007 | FE07-T03, FE07-T15 |
| BR-FE07-009 | FE07-T07, FE07-T16 |
| BR-FE07-011 | FE07-T09, FE07-T17 |
| BR-FE07-014 | FE07-T11, FE07-T17 |
| BR-FE07-015 | FE07-T10, FE07-T18 |
| BR-FE07-018 | FE07-T10, FE07-T18 |
| BR-FE07-019 | FE07-T04, FE07-T15 |
| BR-FE07-020 | FE07-T09, FE07-T17 |
| BR-FE07-021 | FE07-T11, FE07-T17 |
| FR-FE07-010 | FE07-T05, FE07-T16 |
| FR-FE07-011 | FE07-T06 |
| FR-FE07-013 | FE07-T09, FE07-T17 |
| AC-FE07-001 through AC-FE07-014 | SPEC.md Section 16 direct acceptance-test mappings |
| FR-FE07-022 | borrowingConcurrency.sqltest.js > SQL create/approval/return/reject/renew audit-failure rollback tests |

## 5. Still Outside This Slice

- FE09 fine creation.
- FE10 delivery worker.

## 6. B7 Integration And Review Closeout

- [x] Nhat confirmed the human review gate before integration.
- [x] Implementation commit `3a7b0ad1165607b8912c6c0be5f3ef2025c11b55` was pushed on `feat/fe07-validation`.
- [x] PR #19 merged into `main` as `aeed0dfecb764e6cbe63d7074727f318700e59ea`.
- [x] GitHub Actions CI run `29308540692` passed for the merge commit and covered traceability, backend tests, frontend lint/tests/build, and backend health import.
- [x] Detailed evidence is recorded in `.sdd/reviews/fe07-b7-integration-review-closeout-2026-07-14.md`.
