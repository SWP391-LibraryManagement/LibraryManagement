# FE05 Test Plan - Book Management

Version: 0.1.0
Status: DRAFT - prototype reconciliation required
Last Updated: 2026-06-22

Source Spec: `.sdd/specs/feat-book-management/SPEC.md`
Feature IDs: `BR-FE05-*`, `FR-FE05-*`, `AC-FE05-*`

---

## 1. Test Scope

Book catalog management for authorized staff, including create, update, metadata, management listing, and deactivation.

## 2. Unit Test Targets

- Required field validation.
- ISBN/identifier uniqueness rule.
- Category/author/publisher metadata validation.
- Deactivate rule versus hard delete.
- Search/filter/sort rules for management view.

## 3. API / Integration Test Targets

- `GET /books/metadata`: authorized manager happy path.
- `GET /books/management`: manager list with filters.
- `POST /books`: create happy path.
- `POST /books`: missing fields, duplicate ISBN/identifier, invalid metadata.
- `PUT /books/:bookId`: update happy path, not found, invalid fields.
- `PATCH /books/:bookId/deactivate`: happy path, not found, conflict.
- Role check: non-manager cannot create/update/deactivate.

## 4. E2E / Manual Acceptance Flow

- Librarian/admin creates a book.
- Librarian/admin edits a book.
- Librarian/admin deactivates a book.
- Public browse reflects active catalog data only.

## 5. Current Evidence

- Book routes exist in `backend/src/routes/bookRoutes.js`.

## 6. Gaps

- No dedicated `backend/tests/bookRoutes.test.js` is currently listed.
- FE05 `PLAN.md` and `TASKS.md` are `NOT STARTED`.
- Prototype code must be reconciled with spec before claiming spec-driven completion.

## 7. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
node scripts/check-traceability.js
```
