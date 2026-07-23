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

## 7. H3 Remediation Addendum

**Approved:** 2026-07-23

The first H3 integration review found one response-propagation defect, one
test-parity gap, and stale deployment/governance evidence. This addendum keeps
the original business behavior and narrows the correction to those findings.

### 7.1 FE08 Expiration-Promotion Warning Contract

- `processQueue` keeps its existing singular top-level `notificationWarning`
  response.
- `expireHolds` keeps the existing `expiredCount`, `expired`, and `promoted`
  response fields and adds top-level `notificationWarnings` only when at least
  one promoted hold cannot persist its required notification-failure audit.
- Each `notificationWarnings` entry contains only `reservationId`, `copyId`,
  `code`, and safe `message`. It must not contain member identity, recipient
  data, provider detail, rendered notification content, or an error stack.
- The promoted reservation DTO remains canonical and does not gain an
  enumerable warning field. Multiple promotions may therefore report multiple
  warnings without changing the existing `promoted` item shape.

### 7.2 FE12 SQL `LIKE` Test-Parity Contract

- Production SQL keeps its current parameterized `LIKE` behavior; this
  remediation does not escape or reject wildcard input.
- The in-memory user-report repository matches the current case-insensitive SQL
  behavior for `%`, `_`, bracket classes/ranges, negated bracket classes, and
  literal characters in the effective `%${q}%` pattern.
- Parity applies to the approved searchable values only: user ID, account
  status, membership status, and role names.
- Regression tests cover wildcard input and retain the existing literal,
  mixed-case, filtering, historical approval, and deterministic-order cases.

### 7.3 Azure Migration Verification Boundary

- Every mutable migration, including
  `2026-07-23-fe10-processing-status.sql`, must first run twice on a named
  disposable local SQL Server database to prove idempotence.
- The reviewed migration runs once on the intended Azure staging database.
- Staging acceptance then uses read-only schema/constraint queries and the
  existing read-only application smoke suite. Staging is not used to prove
  migration idempotence.
- Temporary operator firewall access must be exact, short-lived, and removed
  immediately after the reviewed migration.

### 7.4 Governance State

- The completed implementation and documentation commits have passed H2 and
  the H2 addendum; task records must no longer say that those reviews are
  pending.
- This H3 remediation returns the branch to implementation. Its RED-GREEN diff
  requires a fresh H2 review, commit, push, and CI run before H3 can be repeated.
- Merge remains prohibited until the repeated H3 review passes against the
  latest `main`.

### 7.5 Verification

- Add a service/route regression proving `expire-holds` serializes every safe
  promotion warning.
- Add in-memory report parity cases for SQL wildcard behavior.
- Run focused FE08/FE12 tests, deployment utility tests, traceability, full
  backend/frontend verification, security/diff checks, and the repository CI
  suite before repeated H3.

## 8. Repeated H3 Remediation Addendum

**Approved:** 2026-07-23

The repeated H3 review passed the implemented FE08 response propagation, FE12
baseline wildcard cases, Azure procedure, virtual merge, and security
boundaries, but found four bounded completeness gaps. This addendum preserves
all approved production behavior and limits the next uncommitted remediation
to those findings.

### 8.1 Complete SQL `LIKE` Bracket-Class Parity

- Production SQL and its parameterized `%${q}%` binding remain unchanged.
- The in-memory compiler must treat a right bracket immediately after `[` or
  `[^` as a bracket-class member and continue to the later closing bracket.
- The compiler must preserve the already approved `%`, `_`, ranges, negated
  classes, ordinary literals, and invalid/unclosed-bracket fallback behavior.
- RED-GREEN parity cases cover both a class that matches `]` (`[]]`) and a
  negated class that excludes `]` (`[^]]`).
- No dependency, new searchable field, database mutation, or production API
  behavior is introduced.

### 8.2 Prove Multiple FE08 Promotion Warnings

- Add service and route regressions with at least two expired copies, two
  promoted holds, and two independent notification-failure audit failures.
- Assert that `notificationWarnings[]` contains every warning in promotion
  order and that each item contains only `reservationId`, `copyId`, `code`, and
  the safe message.
- Assert serialized output contains no recipient identity, provider detail,
  rendered notification content, or internal error text.
- The existing implementation may remain unchanged when the new regressions
  prove the loop already satisfies this contract.

### 8.3 Complete The Singular Warning OpenAPI Contract

- Document the `POST /api/reservations/process-queue` `200` response as an
  object with required `selectedReservation` and optional
  `notificationWarning`.
- The singular warning contains only `code` and `message`;
  `additionalProperties: false` prevents accidental contract expansion.
- Preserve the separately documented `expire-holds.notificationWarnings[]`
  shape with `reservationId` and `copyId`.

### 8.4 Make Governance Evidence Current

- Record that fresh H2 approved commit
  `b931e005e50dc9c0ec9c177f2874f88a1df943b0`, PR #62 became ready and
  mergeable, and CI run `30019439505` passed for that exact head.
- Record that repeated H3 then returned this bounded second finding set.
- Mark the completed H2, commit/push, and CI checklist items as complete while
  leaving repeated H3, merge, post-merge CI, and staging verification open.
- Update the four feature task records and execution plan so the historical
  H2 evidence is accurate and this new uncommitted diff explicitly requires
  another fresh H2, updated CI, and repeated H3.

### 8.5 Verification And Gate

- Run the focused FE08/FE12 tests first, then the repository-equivalent L1-L4
  suite, dependency audits, traceability, OpenAPI parsing, security review,
  latest-main virtual merge, and diff hygiene.
- Keep every change from this addendum uncommitted until a fresh H2 review.
- Do not merge PR #62, mutate Azure SQL, or redeploy staging before a repeated
  H3 passes on the next reviewed head.
