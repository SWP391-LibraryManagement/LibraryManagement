# FE01 Test Plan - Public / Browse

Version: 0.3.8
Status: COMPLETE - BASELINE EVIDENCE RECORDED; LOCAL HOMEPAGE POLISH VALIDATED
Last Updated: 2026-07-27

Source Spec: `.sdd/specs/feat-public-browse/SPEC.md`
Feature IDs: `BR-FE01-*`, `FR-FE01-*`, `AC-FE01-*`
Authoritative AC↔test mapping: `SPEC.md` §16 Traceability Matrix (this file is the strategy, not the case list).

---

## 1. Test Scope

Public browse/search/detail behavior for guests and authenticated users viewing public catalog information.

## 2. Unit Test Targets

- Search q and positive-ID filter validation.
- Public q matches title/author only; searching by ISBN does not return a match.
- Guest/Member list, detail, and HomePage never expose ISBN.
- Public visibility rule: users see only active/public catalog data.
- Empty search/default pagination and no-result handling.
- Stable `Title ASC, BookId ASC` ordering and page/limit bounds.
- Null optional metadata and `AVAILABLE`/`UNAVAILABLE` projection.
- FE11 Admin/Librarian accounts use staff book actions and never enter Member-only borrow/reservation routes.
- Guest/Member HomePage presentations omit availability badges; Guest sees a generic login continuation, while Member sees explicit FE07 borrow or FE08 reservation actions.
- Librarian/Admin HomePage presentations retain the approved high-level status.
- Navigation group labels and destinations match Guest, Member, Librarian, and Admin audiences.
- Every Homepage destination is registered by `App.jsx`; protected routes retain their owning guards.
- Footer contacts, policy dialogs, responsive sections, and reduced-motion behavior remain usable.
- The four membership benefit cards use an equal-width, row-aligned 2x2 desktop grid and a non-staggered single column on mobile.

## 3. API / Integration Test Targets

- `GET /api/books` with canonical q/ID filters and pagination.
- `GET /api/books/{bookId}` with public-safe active detail.
- Guest/Member responses omit ISBN while an authorized Librarian/Admin detail retains the FE05 ISBN field.
- Invalid book ID, invalid filters, invalid page/limit, and overlong q.
- Missing book and inactive/deactivated book hidden from public response.
- Null optional metadata preserved in list/detail responses.
- Current FE06 copy state reflected without exposing exact counts or writing copies.
- No authentication required for public browse endpoints and mutation routes remain protected.

## 4. E2E / Manual Acceptance Flow

- Guest opens the home/catalog view.
- Guest searches with empty, valid, invalid, and no-result criteria.
- Guest opens an active book detail and sees public-safe metadata without ISBN or an availability label.
- Guest opens a missing or inactive detail and sees a safe not-found state.
- Guest and Member see safe null/no-cover fallbacks without an availability badge; Member actions still identify the correct owning workflow.
- Member selects an available book and reaches `/borrowing/new?bookId=...`; an unavailable book reaches `/reservations/mine?bookId=...`.
- Librarian/Admin see the approved `Còn sách` or `Không khả dụng` high-level state.
- Guest opens `/home`; authenticated actors open the public library at `/homepage`.
- No actor sees the removed `Khám phá sách`, audience service, `Về thư viện`, or `Hỗ trợ` header groups on desktop or mobile; branding, account actions, and role continuation controls remain usable.
- Footer phone, email, and address remain readable; Privacy, Terms, and Cookie dialogs open and dismiss correctly.

## 5. Current Evidence

- Dedicated FE01 backend route/repository tests pass 9/9.
- FE01 public browse frontend tests pass 14/14.
- Combined focused frontend tests pass 39/39 across public browse, App Shell, and HomePage book actions.
- The public availability SQL suite passes in the aggregate 61/61 disposable SQL Server run.
- FE01 traceability covers the simplified header contract; frontend lint, production build, and `git diff --check` pass.

## 6. Gaps

- Historical FE05/FE06 ownership confirmation remains recorded as an open baseline governance item.
- Human visual, navigation, and role-visibility acceptance of the current local Homepage polish remains required before release.

## 7. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/publicBrowseRoutes.test.js tests/publicBrowseRepository.test.js
node --test frontend/test/publicBrowseFrontend.test.js frontend/test/appShellFrontend.test.js frontend/test/homeBookActions.test.js
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
git diff --check
```
