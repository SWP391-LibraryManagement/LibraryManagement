# FE04 Test Plan - Membership Management

Version: 0.2.1
Status: COMPLETE - CORE PHASE 2 SCOPE; ADMIN EXTENSION PENDING
Last Updated: 2026-07-25

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
- Current focused backend: 30/30 tests pass for FE04 routes and system wiring.
- Current full frontend: 219/219 tests pass; ESLint and Vite production build pass.
- Current FE04 traceability: 14/14 FR; `git diff --check` passes.

## 6. Gaps

- Disposable SQL Server evidence is complete: the FE04 migration ran twice, all six mutable cases passed, and database/login cleanup is recorded in `.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`.
- Fan FE04 into the same post-FE11 schema baseline as FE10/FE02 and rerun cross-feature tests.
- `tests/e2e/fe04-admin-membership-review.spec.js` covers registered applicant setup, Admin
  rejection, member re-application, approval, and responsive overflow checks; the configured
  Windows Playwright webServer teardown still times out before a clean process exit.
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

## 8. Admin Console Membership Review Integration Targets

Local source/automated state (2026-07-24): implemented and covered by the full frontend 219/219 pass plus focused FE04 backend 30/30. The responsive authenticated browser has assertion coverage but its Windows process exit, Azure Staging, and human gates below remain open.

- Exact eight-entry Admin navigation with Membership Review after All Users and without Permissions.
- Canonical FE04 list params `q`, `status`, `page`, `limit=10`; no `/api/admin/membership` alias.
- Pending-only review actions, 1..500 rejection reason, authoritative reload after success/conflict, and safe FE10 `FAILED` warning.
- Admin table above 1440px and cards at/below 1440px; no document overflow at 1440/1366/1280/390.
- Real authenticated Admin rejection, rejected-member re-application, and approval in `tests/e2e/fe04-admin-membership-review.spec.js` plus existing `/membership` and FE11 regression coverage.
- Human Azure Staging review remains distinct from automated screenshots.
