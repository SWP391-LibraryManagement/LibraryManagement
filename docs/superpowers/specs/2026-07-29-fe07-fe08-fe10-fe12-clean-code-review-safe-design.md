# FE07-FE08-FE10-FE12 Clean-Code Review-Safe Design

## Status

Draft for written review. The scope was approved conversationally as
“clean-code review-safe”: improve readability and reviewability without
changing observable business behavior.

## Goal

Make the FE07, FE08, FE10, and FE12 implementation easier to explain in a
code review while preserving the current API contracts, SQL schema, role
boundaries, UI routes, notification semantics, Azure configuration, and
connected FE07 → FE08 → FE10 → FE12 flow.

The baseline is `origin/main@7dc563a95ff178239a90e47fe1899e21c24a49ef`.
Before this design, the clean worktree passed 1,127 backend tests and 271
frontend tests. Frontend lint passed with one existing warning at
`ReservationsLibrarianPage.jsx:135` for the `loadReservations` effect.

## Non-goals

- No new business rule, endpoint, response field, database table, migration,
  or Azure setting.
- No UI redesign, copy change, route change, or mobile-scope expansion.
- No changes to FE09 ownership of fines, FE08 ownership of reservations, or
  FE10 post-commit notification delivery.
- No broad refactor of unrelated features or shared application shell code.
- No change to the current local demo data or dependency installation.

## Selected approach

Use small, behavior-preserving extractions of pure code and one hook-lifecycle
cleanup:

1. Move repeated role and positive-ID boundary helpers used by the four target
   services into one small backend utility. The utility keeps the existing
   normalization and error values exactly.
2. Move FE07 repository row/date projections into a pure projection utility.
   SQL queries, transaction boundaries, and repository method names remain in
   `borrowingRepository.js`.
3. Move FE10 payload sanitization, template validation, and queue-policy
   functions into a pure notification-policy utility. The service continues to
   own orchestration, persistence, provider delivery, and audit writes.
4. Move FE12 report pagination/resultset/count projection helpers into a pure
   report-projection utility. SQL query construction remains in
   `reportRepository.js`.
5. Stabilize FE08 `loadReservations` with a stable callback and a ref for the
   latest selected queue copy so the initial effect has an honest dependency
   list without reloading the entire reservation catalog on every queue
   selection.

The recommendation is this bounded extraction approach because each new
utility has one responsibility and can be tested without SQL Server or a
browser. A full repository/service split would create a larger diff and make
business-rule review harder; changing only the lint warning would leave the
other three features inconsistent.

## Component boundaries

### Backend access boundary

Create `backend/src/utils/featureAccess.js` with the existing
`normalizeRole`, `hasAnyRole`, and `toPositiveInteger` behavior. Import it from
the FE07 borrowing service, FE08 reservation service, FE10 notification
service, and FE12 report service. The utility does not know feature-specific
roles; callers continue to provide the same allowed-role lists.

### FE07 projection boundary

Create `backend/src/utils/borrowingProjection.js` for the existing pure row
mapping and date-only projection functions currently local to
`borrowingRepository.js`. Keep all SQL, locks, transaction rollback/commit
behavior, outcomes, and exported repository methods unchanged.

### FE08 lifecycle boundary

Update `frontend/src/page/reservation/ReservationsLibrarianPage.jsx` to use a
stable `loadReservations` callback. A ref mirrors the latest `queueCopyId` for
the callback; the existing `resolveReservationQueueHandoff` helper remains the
single handoff decision point. Loading, stale-handoff notice, pagination,
manual reload, and queue selection behavior remain unchanged.

### FE10 policy boundary

Create `backend/src/utils/notificationPolicy.js` for pure payload-key
normalization, sensitive-value detection/redaction, source/type validation,
template-variable extraction, stored-template validation, and safe template
rendering. `notificationService.js` keeps the same public service factory and
continues to export `sanitizePayload` for compatibility.

### FE12 projection boundary

Create `backend/src/utils/reportProjection.js` for date/status normalization,
pagination, report-envelope construction, SQL resultset selection, count-map
construction, and exclusive-next-day calculation. `reportRepository.js` keeps
the same query text, parameters, result envelope, and exported methods.

## Error and state handling

The refactor must preserve:

- Existing `ROLE_REQUIRED`, `INVALID_ID`, and feature-specific error codes.
- Existing transaction and audit ordering.
- Existing Asia/Ho_Chi_Minh business-date calculations.
- Existing notification post-commit behavior and safe redaction.
- Existing stale FE08 handoff behavior: a stale handoff resolves to no queue
  selection and never falls back to a different copy.
- Existing FE12 page, limit, total-row, and status semantics.

No catch block, retry policy, SQL lock, API payload, or state transition may be
rewritten as part of this design.

## Verification contract

Add focused pure-unit tests for the new backend utilities and extend the
existing FE08 source/behavior contract to assert the stable callback/effect
boundary. Then run:

- Focused FE07, FE08, FE10, and FE12 backend/frontend tests.
- Full backend Jest suite and full frontend test suite.
- Frontend lint and production build.
- `npm run test:secrets`, deployment tests, and `npm run trace:enforce`.
- `git diff --check`.

The implementation is review-safe only if the full suites remain green, lint
has no warning introduced by this batch, and no API/schema/Azure file changes
appear in the diff.

## Acceptance criteria

1. Each extracted utility has one responsibility and no feature-specific
   persistence or UI side effects.
2. FE07 → FE08 → FE10 → FE12 behavior tests remain green with unchanged
   request/response contracts.
3. The FE08 hook warning is gone without adding an unnecessary reload loop.
4. The diff is limited to the listed FE07/FE08/FE10/FE12 source/test files and
   this design/plan evidence.
5. The code path can be explained as:
   `UI → API → Controller → Service/policy → Repository/projection → SQL Server`.
6. The final branch is reviewed locally before H2; commit/push/PR/merge remain
   separate approval gates.
