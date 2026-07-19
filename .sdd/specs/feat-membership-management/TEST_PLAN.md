# FE04 Test Plan - Membership Management

Version: 0.2.1
Status: COMPLETE - PHASE 2 EXIT EVIDENCE RECORDED
Last Updated: 2026-07-19

Source Spec: `.sdd/specs/feat-membership-management/SPEC.md`
Feature IDs: `BR-FE04-*`, `FR-FE04-*`, `AC-FE04-*`
Authoritative AC↔test mapping: `SPEC.md` §16 Traceability Matrix (this file is the strategy, not the case list).

---

## 1. Test Scope

Membership application, approval/rejection, membership status, and integration with borrowing/reservation eligibility.

## 2. Unit Test Targets

- Membership application eligibility.
- Status transition rules: `PENDING`, `APPROVED`, `REJECTED`, and canonical member `INACTIVE`.
- Duplicate active/pending application prevention.
- Effect of membership status on borrowing/reservation eligibility.

## 3. API / Integration Test Targets

- Member applies for membership happy path.
- Duplicate application rejected.
- Librarian/admin approves application.
- Librarian/admin rejects application.
- Unauthorized users cannot approve/reject.
- Member can view own membership status.
- Invalid status transition returns safe error.

## 4. E2E / Manual Acceptance Flow

- Registered user applies for membership.
- Staff approves the request.
- Approved member can proceed to borrow/reserve flow.
- Rejected/not-approved member is blocked from member-only flows where required by spec.

## 5. Current Evidence

- `backend/tests/membershipRoutes.test.js`: 18/18 pass for active applicant access, canonical
  response/privacy, apply/re-apply, staff list, validation, atomic rollback, concurrency, audit, and
  FE10 delivery behavior.
- `backend/tests/sql/membershipConcurrency.sqltest.js`: 10/10 static and mutable SQL cases pass on the disposable SQL Server runtime.
- `frontend/test/membershipFrontend.test.js`: 5/5 pass for canonical server truth, empty-body apply,
  truthful errors, server-side search, mutation refresh, and rejection bounds.
- Full backend: 38 suites / 619 tests pass. Coverage: 92.51% statements, 82.46% branches, 97.10%
  functions, 92.44% lines.
- Full frontend: 122/122 tests pass; ESLint and Vite production build pass.
- Backend import health, FE04 traceability 12/12, and `git diff --check` pass.

## 6. Gaps

- Disposable SQL Server evidence is complete: the FE04 migration ran twice, all six mutable cases passed, and database/login cleanup is recorded in `.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`.
- Fan FE04 into the same post-FE11 schema baseline as FE10/FE02 and rerun cross-feature tests.
- Capture browser acceptance for registered applicant, Librarian/Admin review, failure state, and
  rejected re-application.
- Dat/FE07/FE08 owners and the final human reviewer must confirm eligibility and system fit.

## 7. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:sql:fe04
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
git diff --check
```
