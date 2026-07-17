# FE01 Test Plan - Public / Browse

Version: 0.3.0
Status: APPROVED - BASELINE 2026-07-17; IMPLEMENTATION FOLLOW-UP PENDING
Last Updated: 2026-07-17

Source Spec: `.sdd/specs/feat-public-browse/SPEC.md`
Feature IDs: `BR-FE01-*`, `FR-FE01-*`, `AC-FE01-*`
Authoritative AC↔test mapping: `SPEC.md` §16 Traceability Matrix (this file is the strategy, not the case list).

---

## 1. Test Scope

Public browse/search/detail behavior for guests and authenticated users viewing public catalog information.

## 2. Unit Test Targets

- Search q and positive-ID filter validation.
- Public visibility rule: users see only active/public catalog data.
- Empty search/default pagination and no-result handling.
- Stable `Title ASC, BookId ASC` ordering and page/limit bounds.
- Null optional metadata and `AVAILABLE`/`UNAVAILABLE` projection.

## 3. API / Integration Test Targets

- `GET /api/books` with canonical q/ID filters and pagination.
- `GET /api/books/{bookId}` with public-safe active detail.
- Invalid book ID, invalid filters, invalid page/limit, and overlong q.
- Missing book and inactive/deactivated book hidden from public response.
- Null optional metadata preserved in list/detail responses.
- Current FE06 copy state reflected without exposing exact counts or writing copies.
- No authentication required for public browse endpoints and mutation routes remain protected.

## 4. E2E / Manual Acceptance Flow

- Guest opens the home/catalog view.
- Guest searches with empty, valid, invalid, and no-result criteria.
- Guest opens an active book detail and sees safe availability.
- Guest opens a missing or inactive detail and sees a safe not-found state.
- Guest sees `Không khả dụng` and safe null/no-cover fallbacks.

## 5. Current Evidence

- Public browse behavior is partly served by `backend/src/routes/bookRoutes.js` and `frontend/src/page/HomePage.jsx`.
- The approved implementation decomposition is recorded in `PLAN.md` and `TASKS.md`.

## 6. Gaps

- Dedicated FE01 backend/frontend test files are planned but not started.
- FE01 implementation/test completion must not be claimed until FE01-T001 through FE01-T008 have evidence.

## 7. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/publicBrowseRoutes.test.js tests/publicBrowseRepository.test.js
node --test frontend/test/publicBrowseFrontend.test.js
npm.cmd run trace:enforce
git diff --check
```
