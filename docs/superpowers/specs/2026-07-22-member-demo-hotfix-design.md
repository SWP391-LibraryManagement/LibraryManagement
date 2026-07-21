# Member Demo Hotfix Design

## Status

APPROVED IN CHAT by Nhat on 2026-07-22 with the exact phrase `duyệt demo hotfix`. Written-design review was approved by the follow-up instruction `tiếp tục đi`; implementation planning and RED-GREEN work may proceed.

## Batch Contract

- Batch ID: `DEMO-HOTFIX-USER-2026-07-22`
- Goal: make the highest-value Member demo path truthful and reliable within a two-hour timebox.
- Delivery form: local, uncommitted RED-GREEN implementation after this design is reviewed; no product-code commit, push, merge, schema change, or deployment is authorized by this document.
- Core ownership: the backend remains authoritative for authorization, validation, business rules, pagination, and stored state; the frontend renders and invokes existing approved contracts.

## In Scope

### 1. Member dashboard summary

- Consume the canonical FE07 member-history envelope (`borrowings`, `pagination`) instead of the staff-only `borrowRequests` key.
- Show non-zero active and completed counts for canonical rows returned by the existing endpoint.
- Keep the change inside the dashboard view model/page and add a regression test using the real member response shape.

### 2. Reservation terminal-state handling

- Preserve the raw FE08 status in the reservation view model.
- Treat only `ACTIVE` and `NOTIFIED` as open/cancellable.
- Treat `FULFILLED`, `CANCELLED`, and `EXPIRED` as terminal for duplicate checks and action rendering.
- A fulfilled reservation must neither show a cancel action nor block a later reservation for the same copy.

### 3. Read-only Member fine page

- Add `fineApi.listMine(params)` backed by the existing `GET /api/fines/me` endpoint.
- Add a guarded Member route and navigation item for `/fines/mine`.
- Render a read-only, server-paginated table containing book, reason, overdue days, amount, status, and related borrowing identifier.
- Do not expose collection, mark-paid, waive, cancel, or calculation actions to Members.

### 4. Guest navigation

- Route every visible guest `Đăng ký` action to `/register` and every `Đăng nhập` action to `/login`.
- Remove no-op footer account actions.
- Preserve the current visual structure and responsive layout.

### 5. Empty public search

- Submitting a blank/whitespace search must call the canonical default public list instead of rejecting the user.
- Clear stale search errors/results and render the returned default catalog.
- Do not add a new category endpoint or client-owned full-catalog pagination in this timebox.

### 6. Truthful membership copy

- Remove visible claims for paid tiers, unlimited borrowing, e-books/audio books, private events, reading lists, or new-book alerts.
- State only the approved entitlement: active `MEMBER` accounts may request up to 3 copies per business day; FE04-approved membership raises that daily tier to 5, subject to the five-active-copy limit and other FE07 blockers.
- Remove dormant paid-plan modal code when it has no reachable approved workflow.

## Explicitly Out Of Scope

- Multi-copy selection redesign for FE07 borrow requests.
- Full public-catalog or own-reservation pagination redesign.
- Member portal refactoring, global state management, or API-client consolidation.
- Database/schema migrations, new backend endpoints, or permission changes.
- FE11 Admin Membership Review files currently modified in the working tree.
- Deployment, release tagging, pushing, PR creation, or merging.

## Components And Data Flow

1. `RoleDashboardPage` calls the existing FE07/FE08 adapters; `dashboardViewModel` consumes the member envelope and derives display counts.
2. `MyReservationsPage` maps each server status to display text while retaining `rawStatus` for action eligibility.
3. `MyFinesPage` calls `fineApi.listMine({ status?, page, limit })`, renders only the returned page, and uses server pagination metadata.
4. `HomePage` keeps FE01 read-only, sends empty search as the default list request, and routes guest account actions to existing auth pages.
5. Membership promotional copy is static presentation derived from FE04/FE07 approved limits; it performs no business mutation.

## Error Handling

- Existing authorized-request token refresh and feature-specific safe error mapping remain in use.
- Member fines show loading, empty, error, and retry states without fabricating data.
- Reservation mutations reload canonical server state after success or conflict.
- Empty public search clears stale failure state before applying default results.

## Test Strategy

Use strict RED-GREEN cycles:

1. Extend `frontend/test/appShellFrontend.test.js` with the real `{ borrowings, pagination }` dashboard envelope and watch the old key fail.
2. Extend `frontend/test/reservationFrontend.test.js` for fulfilled re-reservation and cancellable-state rendering and watch current logic fail.
3. Add focused Member-fine frontend tests covering adapter URL, guarded route/navigation, pagination, read-only rendering, and absence of staff mutations.
4. Extend FE01/auth shell tests for blank search, `/register`, `/login`, and removal of unsupported membership claims.
5. Run focused tests after each minimal fix, then run full frontend tests, lint, production build, relevant backend route tests, traceability if required by changed source tags, and `git diff --check`.

## Success Criteria

- The six scoped demo issues have regression tests that failed before implementation and pass afterward.
- The Member demo path can navigate through home, dashboard, reservations, own fines, and authentication entry points without false actions or false business claims.
- Full frontend tests, lint, and production build pass.
- Relevant FE07/FE08/FE09 backend tests pass without backend production changes.
- No FE11 working-tree file is staged or modified by this batch.
