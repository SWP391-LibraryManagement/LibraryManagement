# FE08 Frontend Correctness Design

Status: APPROVED

Owner: Nhat

Date: 2026-07-12

## 1. Goal

Bring the existing FE08 reservation frontend into alignment with the approved reservation lifecycle and backend contract. This change corrects misleading UI behavior without adding new reservation capabilities or backend contracts.

## 2. Scope

Included:

- Map every FE08 reservation state to the intended UI state, including `NOTIFIED` as `Ready to pick up` and terminal states as non-active states.
- Provide Vietnamese reservation-specific API errors without changing error behavior for borrowing, reports, inventory, or other feature APIs.
- Expose the existing staff hold-expiration endpoint through `reservationApi`.
- Let librarians trigger hold expiration, see the expired and promoted counts, and reload the reservation list from the server.
- Remove controls that claim to fulfill or delete a reservation while only mutating local React state.
- Update FE08 planning, traceability, and changelog documentation to reflect the implemented frontend slice.

Excluded:

- FE07 borrowing or fulfillment behavior.
- Server-side reservation pagination.
- New backend endpoints, status values, database changes, or automatic scheduled expiration.
- FE10 notification delivery changes.
- Broad UI redesign or unrelated refactoring.

## 3. Design

### 3.1 Reservation Status Mapping

`statusToUi()` remains the shared status conversion boundary. It will explicitly map the FE08 state set:

| Backend state | UI state |
| --- | --- |
| `ACTIVE` | `Waiting` |
| `NOTIFIED` | `Ready to pick up` |
| `FULFILLED` | `Completed` |
| `CANCELLED` | `Cancelled` |
| `EXPIRED` | `Expired` |

The existing legacy handling of `ACTIVE` with `notifiedAt` remains compatible, but the canonical `NOTIFIED` state no longer falls through to `Unknown`. The librarian queue will include only `Waiting` rows because only backend `ACTIVE` reservations are selectable. `Ready to pick up` remains visible in the all-reservations list as the UI state for `NOTIFIED`, but cannot receive queue actions.

### 3.2 Reservation Error Isolation

A dedicated `getReservationErrorMessage(error, fallbackMessage)` resolver will live beside the existing feature error resolvers. It will translate known FE08 backend error codes and use the supplied Vietnamese fallback for unknown or unavailable responses.

Only `reservationApi` will call `authorizedRequest()` through a reservation-specific wrapper. Other API modules keep their current error resolver, preventing FE08 wording from leaking into FE07 or shared requests. Authentication refresh and token-clearing behavior remain unchanged.

### 3.3 Hold Expiration Flow

`reservationApi.expireHolds()` will call:

```text
POST /api/reservations/expire-holds
```

The librarian page will expose one explicit staff command for this existing backend operation. On success it will:

1. Read `expiredCount` and the length of `promoted` from the response.
2. Show a Vietnamese success message with both counts.
3. Reload reservations from the backend instead of predicting state changes locally.

On failure it will show the reservation-specific error and keep the current rows unchanged. The command will be disabled while a request or list reload is in progress to avoid duplicate submissions.

### 3.4 Unsupported Actions

The `Đã giao` and `Xóa` controls will be removed from the librarian queue. Their current handlers only remove rows from local state and therefore falsely imply a successful server-side transition.

FE08 will not invent fulfillment or deletion endpoints. A reservation becomes `FULFILLED` through the approved FE07 borrowing flow, which is outside this change.

### 3.5 Data Flow

```text
Librarian action
  -> reservationApi.expireHolds()
  -> existing POST /api/reservations/expire-holds
  -> backend expires overdue NOTIFIED holds and promotes eligible reservations
  -> frontend reports counts
  -> GET /api/reservations reloads canonical server state
  -> mapReservation()/statusToUi() renders the updated lifecycle states
```

No optimistic mutation is used for hold expiration, fulfillment, or deletion. The backend response and reload remain the source of truth.

## 4. Testing Strategy

Tests will be written before implementation where practical.

- Add focused frontend unit coverage proving `NOTIFIED` maps to `Ready to pick up` and FE08 terminal states map consistently.
- Add API error tests proving known reservation codes receive Vietnamese messages and unrelated API requests retain their existing resolver behavior.
- Add focused page/API coverage for the `expire-holds` request and response counts if supported by the existing frontend test structure.
- Keep existing backend reservation route and integration tests as regression coverage for expiration and promotion behavior.

Verification commands will cover:

- Frontend tests.
- Frontend lint.
- Frontend production build.
- Backend tests.
- FE08 traceability/document consistency checks.

## 5. Documentation Updates

- Revise `.sdd/specs/feat-reservation-management/PLAN.md` so it no longer claims the feature is backend-only or excludes the already implemented frontend.
- Add the correctness tasks and current validation evidence to `.sdd/specs/feat-reservation-management/TASKS.md` without erasing historical completed work.
- Record the FE08 frontend correctness change in `.sdd/specs/feat-reservation-management/CHANGELOG.md`.

`SPEC.md` does not require a behavior change because the approved state lifecycle and hold-expiration requirements already describe the target behavior.

## 6. Acceptance Criteria

- A backend reservation with status `NOTIFIED` renders as ready for pickup, never `Unknown`.
- Only `Waiting` reservations appear in the active librarian queue; `Ready to pick up` remains visible in the all-reservations list but is excluded from queue actions.
- Librarians can invoke the existing hold-expiration endpoint and receive clear expired/promoted counts.
- The page reloads canonical server state after a successful expiration run.
- No visible control claims to fulfill or delete a reservation without a backend operation.
- Reservation errors are localized in Vietnamese and remain isolated to `reservationApi`.
- No FE07 fulfillment, pagination, schema, or backend contract expansion is introduced.
- Relevant frontend and backend verification passes.
