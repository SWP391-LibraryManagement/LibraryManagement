# FE04 Test Plan - Membership Management

Version: 0.2.0
Status: DRAFT - not started (planned targets)
Last Updated: 2026-06-25

Source Spec: `.sdd/specs/feat-membership-management/SPEC.md`
Feature IDs: `BR-FE04-*`, `FR-FE04-*`, `AC-FE04-*`
Authoritative AC↔test mapping: `SPEC.md` §16 Traceability Matrix (this file is the strategy, not the case list).

---

## 1. Test Scope

Membership application, approval/rejection, membership status, and integration with borrowing/reservation eligibility.

## 2. Unit Test Targets

- Membership application eligibility.
- Status transition rules: pending, approved, rejected, suspended/expired if present in spec.
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

- No dedicated membership route/test file was found in the current backend route inventory.

## 6. Gaps

- FE04 `PLAN.md` and `TASKS.md` are `NOT STARTED`.
- Routes/controllers/tests need to be planned or confirmed before claiming implementation.

## 7. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
```
