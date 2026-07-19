# FE03 Test Plan - User Profile

Version: 0.2.3
Status: FE03-T016 AUTOMATED, LIVE SQL, AND AGENT BROWSER PASS; HUMAN ACCEPTANCE PENDING
Last Updated: 2026-07-19

Source Spec: `.sdd/specs/feat-user-profile/SPEC.md`
Feature IDs: `BR-FE03-*`, `FR-FE03-*`, `AC-FE03-*`
Authoritative AC↔test mapping: `SPEC.md` §16 Traceability Matrix (this file is the strategy, not the case list).

---

## 1. Test Scope

Authenticated user profile viewing, allowed profile updates, and avatar upload behavior.

## 2. Unit Test Targets

- Editable field validation.
- Phone/email/display field normalization if implemented.
- Avatar file validation: allowed type, size, missing file, storage path safety.
- Rule that profile update cannot change role, membership status, password, or protected account fields.

## 3. API / Integration Test Targets

- `GET /profile/me`: authenticated happy path, unauthenticated error.
- `PUT /profile/me`: happy path with approved fields.
- `PUT /profile/me`: rejects forbidden fields.
- `PUT /profile/me`: invalid phone/name, empty body, protected/unknown field, and direct `avatarUrl` rejection.
- Missing profile: exactly one blank profile row is auto-created and returned through the normal DTO.
- Successful profile/avatar database update: safe audit entry is mandatory and excludes raw personal values and file/path secrets.
- `POST /profile/me/avatar`: happy path.
- `POST /profile/me/avatar`: missing file, invalid type, oversize, unauthenticated.

## 4. E2E / Manual Acceptance Flow

- User opens profile.
- User edits allowed fields and sees saved state.
- User uploads avatar successfully.
- Avatar error states are visible and understandable.
- Unauthenticated user is redirected or blocked.

## 5. Current Evidence

- `backend/tests/profileRoutes.test.js`
- `backend/tests/profileService.test.js`
- `backend/tests/profileRepository.test.js`
- `backend/tests/avatarStorage.test.js`
- `backend/tests/securityRegression.test.js`
- `frontend/test/profileFrontend.test.js`
- `.sdd/reviews/fe03-deterministic-profile-validation-2026-07-19.md`
- Source traceability: FR-FE03 `10/10` tagged after reconciliation.
- Fresh reconciliation focused gate: backend 5 suites / 48 tests; frontend 3/3.
- Exact-diff isolated Playwright CLI acceptance on port `4185`: valid upload, invalid type,
  oversized file, exact PUT allowlist, and 0 console errors/warnings passed. Evidence screenshot:
  `output/playwright/fe03-exact-profile-updated.png`.

## 6. Gaps

- Human UI acceptance for profile/avatar must be recorded before claiming done; agent browser evidence is already present.
- `backend/tests/sql/profileConcurrency.sqltest.js` passes 6/6 on disposable SQL Server, proving one-row first-view serialization plus profile/avatar audit rollback. Aggregate SQL evidence and cleanup are recorded in `.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`.

## 7. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
```
