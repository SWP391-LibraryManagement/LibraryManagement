# FE07-FE08 Borrowing Reservation Integration Validation

Date: 2026-07-15

Status: HUMAN REVIEW CONFIRMED - READY FOR INTEGRATION DECISION

Branch: `fix/fe08-borrowing-reservation-integration`

## Purpose

Record the validation evidence and Nhat's completed human review for the
approved FE07 borrowing and FE08 reservation integration. This slice keeps FE07
responsible for borrow create/approval and FE08 responsible for queue processing
while enforcing reservation priority across both features.

## Validated Behavior

| Boundary | Result | Evidence |
| --- | --- | --- |
| Ordinary borrowing | PASS | An `ACTIVE` reservation queue blocks normal FE07 create and approval with the documented priority conflict. |
| Notified owner handoff | PASS | The owner of the matching `NOTIFIED` reservation may borrow its `RESERVED` copy. |
| Atomic fulfillment | PASS | FE07 approval updates the borrow request, details, copy, matching reservation, and audit records in one transaction; the reservation becomes `FULFILLED`. |
| Concurrency | PASS | Copy/reservation transitions use the shared `BookCopies -> Reservations` lock order. |
| Queue ownership | PASS | FE08 queue processing remains manual; no endpoint, table, column, or automatic job was added. |
| Error contract | PASS | Reservation-priority conflicts are exposed through stable backend/OpenAPI and Vietnamese frontend messages. |

## Automated Evidence

| Check | Result | Freshness |
| --- | --- | --- |
| Focused FE07/FE08 backend gate | PASS - 92/92 | Recorded earlier on this branch after implementation. |
| Backend full suite | PASS - 321/321 | Recorded earlier on this branch after implementation. |
| Frontend tests | PASS - 73/73 | Recorded earlier on this branch; no frontend code changed afterward. |
| Frontend lint | PASS | Recorded earlier on this branch; no frontend code changed afterward. |
| Frontend production build | PASS | Recorded earlier on this branch; only the non-blocking Vite chunk-size warning remained. |
| Azure SQL concurrency suite | PASS - 20/20 | Recorded on staging; no SQL or production repository code changed after this result. No deadlock occurred and test seed cleanup returned 0 rows. |
| Error-message contract | PASS - 7/7 | Recorded earlier on this branch. |
| OpenAPI contract | PASS - 5/5 | Recorded earlier on this branch. |
| Fixture regression suites | PASS - 2 suites, 21/21 | Fresh after commit `16fa2ed`; covers `systemIntegration.test.js` and `integration.test.js`. |
| Traceability enforcement | PASS | Fresh: FE07 24/25 FR tags (96%), FE08 23/26 FR tags (88%), 0 implemented features below 70%. |
| Branch diff check | PASS | Fresh: `git diff main...HEAD --check` exited 0. |

## Fixture Remediation

The integration and system-integration harnesses use separate in-memory FE07
and FE08 stores to model one SQL database. After FE08 holds a copy, the harness
now synchronizes both the copy status and the reservation-owner claim into the
FE07 store. This keeps the fixture faithful to production behavior and prevents
a false `RESERVATION_STATE_CONFLICT` during the cross-feature scenario.

Commit: `16fa2ed test: sync reservation claims in integration harness`

## Scope Control

- `git diff main...HEAD -- database frontend/src/page frontend/src/component backend/src/routes` is empty.
- No database schema, endpoint, route, frontend page, or frontend component was added.
- Product changes are limited to FE07/FE08 specs, borrowing/reservation repositories and service behavior, OpenAPI/error contracts, and focused tests.
- FE07 return-driven queue automation, FE10 delivery workers, automatic hold expiration, and server-side reservation pagination remain outside this slice.
- No secrets or staging credentials are included in the branch.

## Commits In Review Scope

- `c7a4e83 docs: define borrowing reservation integration`
- `2694778 docs: align reservation transaction lock order`
- `090b9e0 docs: plan borrowing reservation integration`
- `d5c5dfe docs: align borrowing reservation contracts`
- `2f8b753 feat: enforce reservation priority in borrowing`
- `8acf2af feat: fulfill reservations during borrow approval`
- `a6137d4 fix: serialize reservation and borrowing transitions`
- `39f9c1a docs: expose reservation priority conflicts`
- `16fa2ed test: sync reservation claims in integration harness`
- `cf08c0e docs: validate borrowing reservation integration`

## Human Review Checklist

- [x] Confirm FE07 create blocks ordinary borrowing when an `ACTIVE` queue exists.
- [x] Confirm only the matching `NOTIFIED` owner may borrow a held `RESERVED` copy.
- [x] Confirm approval atomically changes the matching reservation to `FULFILLED`.
- [x] Confirm the `BookCopies -> Reservations` lock order is consistent in hold, cancellation, expiration, and fulfillment paths.
- [x] Confirm queue processing remains manual and the out-of-scope list is unchanged.
- [x] Confirm error/OpenAPI messages clearly explain reservation priority conflicts.
- [x] Approve or request changes before any push or merge.

Nhat explicitly confirmed `đã review` in this Codex task on 2026-07-15. This
closes the required human review gate; it does not authorize push or merge by
itself.

## Remaining Gate

Choose the integration path for the reviewed branch. No push, pull request, or
merge has been performed.

Verdict: **Automated validation and human review complete; ready for integration decision.**
