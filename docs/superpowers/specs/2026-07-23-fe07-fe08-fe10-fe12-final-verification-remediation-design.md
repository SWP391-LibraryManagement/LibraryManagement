# FE07/FE08/FE10/FE12 Final Verification Remediation Design

**Status:** APPROVED BY USER

**Approved:** 2026-07-23

**Scope:** Correct the final business-rule and failure-mode findings found after
the first remediation batch for FE07, FE08, FE10, and FE12.

## 1. Goals

- Use the `Asia/Ho_Chi_Minh` business date for FE07 return fine candidates and
  renewal prechecks.
- Keep FE08 lifecycle state and its required audit record in the same SQL
  transaction.
- Require complete source references for every FE10 in-process request.
- Prevent FE10 from automatically delivering the same message twice after an
  uncertain provider/SQL partial failure.
- Keep FE12 and FE07 in-memory test repositories semantically identical to
  production repositories.
- Remove the remaining FE07/FE08 specification contradictions and repair FE12
  traceability totals.

## 2. FE10 Delivery State Decision

The user approved a durable `PROCESSING` state.

### 2.1 Lifecycle

```text
Non-sensitive:
PENDING -> PROCESSING -> SENT
                      -> FAILED

Sensitive:
new -> PROCESSING -> SENT
                  -> FAILED
```

- Claiming changes `PENDING` to `PROCESSING` and commits before provider I/O.
- A guarded terminal transition writes `SENT`/`FAILED` and its
  `NotificationAttempts` row in one transaction.
- Two workers cannot claim the same `PENDING` row.
- If the provider may have accepted delivery but the terminal SQL transition
  fails, the record remains `PROCESSING`.
- `PROCESSING` is intentionally not auto-reclaimed or auto-retried because the
  provider outcome is uncertain. This favors no automatic duplicate delivery
  over silent at-least-once redelivery.
- An idempotent replay returns the same `PROCESSING` summary and never sends
  again.
- Manual retry accepts only non-sensitive `FAILED`; `PROCESSING` returns a safe
  `409 DELIVERY_STATE_UNCERTAIN`.
- Sensitive reissue still requires a new source event and idempotency key.

### 2.2 Persistence

- Add `PROCESSING` to the canonical notification status constraint, model, and
  FE10 specification.
- Add an idempotent SQL Server migration that replaces only the known
  notification status check constraint after validating existing values.
- No provider response, credential, OTP, token, setup link, or rendered
  sensitive content is persisted.

### 2.3 Source Binding

Every construction-bound internal request must contain:

- bound `sourceFeature`;
- non-empty valid `sourceEntityType`;
- positive integer `sourceEntityId`;
- non-empty valid `idempotencyKey`.

Validation occurs before rendering, persistence, or provider delivery.

## 3. FE08 Transaction And Feedback Design

- Reservation create, cancel, hold, and expiration pass their lifecycle audit
  entry into the repository transaction.
- If a lifecycle audit insert fails, the related state mutation rolls back.
- Expiration promotes the next queue item only after the expiration transaction
  commits successfully.
- A notification request remains post-commit as required by the current FE08
  contract; notification failure never rolls back a committed hold.
- `RESERVATION_NOTIFY_FAILED` is a required post-commit audit attempt. If that
  audit write also fails, the service must not swallow it: it returns an
  explicit safe warning in the queue-processing result and emits a safe
  operational log without recipient data or provider details.
- The librarian confirmation dialog describes the physical copy/current queue,
  not a cached member. Only the server-selected member may appear in the success
  message.

## 4. FE07 Business-Time And Test-Parity Design

- Replace host-local calendar-day calculations with
  `overdueDaysBetween(..., 'Asia/Ho_Chi_Minh')`.
- Use the same business date for renewal prechecks and the authoritative
  repository call.
- The in-memory return repository must return `BORROW_STATE_CONFLICT` unless
  both the detail and physical copy are currently borrowed.
- Update disposable SQL expectations to the current role-based eligibility and
  explicit concurrency-conflict outcomes.

## 5. FE12 Test-Parity And Traceability Design

- The in-memory user report applies `q` to the same approved fields as SQL.
- `newMembersByPeriod` counts every non-null historical approval in range,
  regardless of current membership/account status.
- User detail ordering remains `userId ASC`.
- FE12 traceability includes BR-FE12-016, FR-FE12-011, and AC-FE12-011, with
  coverage totals `16 BR / 11 FR / 11 AC`.

## 6. Verification

The implementation follows RED-GREEN tests and then runs:

- focused FE07/FE08/FE10/FE12 backend tests;
- focused frontend reservation tests;
- full backend and frontend suites;
- frontend lint and production build;
- traceability enforcement and `git diff --check`;
- FE07/FE08 SQL tests on a disposable local SQL Server database only;
- the system SQL integration suite on a disposable local database;
- security and final spec/standards review before H2.

Azure staging is read-only for smoke verification and is never used for mutable
SQL tests.
