# FE01 Test Plan - Public / Browse

Version: 0.2.0
Status: DRAFT - not started (planned targets)
Last Updated: 2026-06-25

Source Spec: `.sdd/specs/feat-public-browse/SPEC.md`
Feature IDs: `BR-FE01-*`, `FR-FE01-*`, `AC-FE01-*`
Authoritative AC↔test mapping: `SPEC.md` §16 Traceability Matrix (this file is the strategy, not the case list).

---

## 1. Test Scope

Public browse/search/detail behavior for guests and authenticated users viewing public catalog information.

## 2. Unit Test Targets

- Search/filter/sort/pagination rules if implemented outside the controller.
- Public visibility rule: users only see approved/active public catalog data.
- Empty result handling.
- Invalid query, long keyword, unknown category, and boundary page size.

## 3. API / Integration Test Targets

- `GET /books` happy path with book list.
- `GET /books/categories` returns categories.
- `GET /books/:bookId` happy path.
- Invalid `bookId`.
- Not found book.
- Inactive/deactivated book hidden from public response.
- Invalid filters.
- No authentication required for public browse endpoints.

## 4. E2E / Manual Acceptance Flow

- Guest opens home/catalog.
- Guest searches books.
- Guest filters by category.
- Guest opens book detail.
- Empty search result shows a clear message.

## 5. Current Evidence

- Public browse behavior is partly served by `backend/src/routes/bookRoutes.js`.

## 6. Gaps

- No dedicated `backend/tests/bookRoutes.test.js` was found in the current test inventory.
- FE01 `PLAN.md` and `TASKS.md` are `NOT STARTED`; implementation/test completion must not be claimed until plan/tasks are approved and tested.

## 7. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
```
