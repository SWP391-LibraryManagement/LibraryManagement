# FE07 Test Plan - Borrowing Management

Version: 0.2.6
Status: COMPLETE - PHASE 2 EXIT EVIDENCE RECORDED
Last Updated: 2026-07-22

Source Spec: `.sdd/specs/feat-borrowing-management/SPEC.md`
Feature IDs: `BR-FE07-*`, `FR-FE07-*`, `AC-FE07-*`
Authoritative AC↔test mapping: `SPEC.md` §16 Traceability Matrix (this file is the strategy, not the case list).

---

## 1. Test Scope

Borrow request creation, approval/rejection, member borrowing history, return flow, renewal flow, and core circulation business rules.

History-contract follow-up: validate `status?`, `fromDate?`, `toDate?`, `page?`, `limit?`, `page=1`, `limit=20`, maximum 100, inclusive business dates, pre-query rejection, member scope, and stable `BorrowDate DESC`/`BorrowDetailId DESC` ordering for both member and staff endpoints.

## 2. Unit / Service Test Targets

- Borrow eligibility: approved membership, active account, no blocking overdue/fine state.
- Borrow limit: maximum 5 active borrowed copies.
- Copy availability check (at create and re-check at approval).
- Due date calculation: default 14 calendar days.
- Approve/reject/return/renew state transitions; renewal boundary and conflict cases.
- Staff decision UX: complete canonical request/member/all-copy context without a redundant aggregate availability banner, continuous controlled rejection input, accessible help, and responsive dialog layout.
- Return UX: no redundant affirmative banner for an on-time `NORMAL` return; exceptional overdue/damaged/lost fine-review warnings remain visible.
- Return due state: canonical borrow/due/renewal fields, `Asia/Ho_Chi_Minh` boundary behavior, and explicit upcoming/due-today/overdue labels.

## 3. API / Integration Test Targets

- `POST /api/borrow-requests`: happy, duplicate/unavailable copy, over limit, inactive/unapproved member.
- `GET /api/borrow-requests/me`: own history only.
- `GET /api/borrow-requests`: staff list, unauthorized member forbidden.
- `GET /api/members/:memberId/borrowings`: staff selected-member history, derived overdue/status/date filters, and unknown member IDs returning `404 MEMBER_NOT_FOUND`.
- `PATCH /api/borrow-requests/:requestId/approve`: happy, unavailable copy, concurrent double-borrow, forbidden.
- `PATCH /api/borrow-requests/:requestId/reject`: happy, invalid state.
- `PATCH /api/borrow-details/:borrowDetailId/return`: happy, invalid state/date, already returned.
- `PATCH /api/borrow-details/:borrowDetailId/renew`: happy, overdue, renewal limit, reservation conflict.

## 4. E2E / Manual Acceptance Flow

- Member requests borrow → librarian approves → member sees history → librarian records return.
- Overdue/renewal behavior verified with deterministic dates.

## 5. Current Evidence

- Focused FE07 route/repository/contract/model gate: 66/66 tests pass, including canonical member/staff history filters, server pagination, inclusive dates, stable ordering, derived `OVERDUE`, and owner scope.
- `backend/tests/models.test.js` (4 tests; persisted FE07 status and nullable-due-date metadata).
- `backend/tests/borrowingContract.test.js` (4 tests; FE07 OpenAPI inputs, filters, runtime FineCandidate fields, response payloads, and safe errors).
- `backend/tests/reportRepository.test.js` (9 tests; includes derived `OVERDUE` SQL filtering).
- `backend/tests/sql/borrowingConcurrency.sqltest.js` passes in the aggregate 61/61 disposable SQL Server run and covers member-scoped serialization, reservation priority/fulfillment, eligibility outcomes, and audit-failure rollback.
- `backend/tests/integration.test.js`.
- `frontend/test/borrowingFrontend.test.js`: 24/24 focused tests pass, including the canonical detail envelope, server-owned history status/pagination contract, Librarian/Admin decision context, stable rejection-input focus, business-time due-state, and renewal metadata contracts.
- Full frontend regression passes 201/201; focused Admin Request Management and role/app-shell integration pass 25/25.
- FE07 backend route/repository/contract verification passes 66/66, preserving the canonical `LIBRARIAN`/`ADMIN` guards and mutation contracts.
- Frontend lint/build, FE07 traceability 31/31, and `git diff --check` pass for the v0.7.3 correction.
- Browser acceptance against the real backend: guest/member/staff access, approval, renewal, normal return, network failure, modal visibility, and desktop/mobile overflow checks.
- System golden path asserts the explicit `Quá hạn 14 ngày` return-due label before processing the overdue return and FE09 fine handoff.
- Full Chromium E2E regression passes 4/4, including the FE08 reservation flow, FE09 fine management, FE11 admin request management, and the system golden path.
- Traceability: FR `@spec` coverage **100%** (`npm run trace:enforce`).

## 6. Gaps

- TD-007 resolved: Phase 1 borrow policy is all-or-nothing (spec aligned to code, BR-FE07-022). TD-008 (model `allowedValues` sync) resolved.
- FR-FE07-022 rollback evidence is real SQL transaction coverage; the in-memory route rollback tests remain supplemental only.
- The temporary create-request catalog remains until FE01/FE06 expose the production browsing/copy-selection integration required by FE07.
- Historical browser validation and human review cover the earlier baseline. Final v0.5.1 repository regression and human integration acceptance remain required.

## 7. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run test:e2e
npm.cmd run trace:enforce
```

## 8. B7 Integration Evidence

- Implementation commit `3a7b0ad1165607b8912c6c0be5f3ef2025c11b55` is contained in `main` through PR #19 and merge commit `aeed0dfecb764e6cbe63d7074727f318700e59ea`.
- GitHub Actions CI run `29308540692` passed on the merge commit.
- The successful CI job covered traceability enforcement, backend tests, frontend lint/tests/build, and the backend health import check.
- Detailed evidence is recorded in `.sdd/reviews/fe07-b7-integration-review-closeout-2026-07-14.md`.
