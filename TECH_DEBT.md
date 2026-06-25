# TECH_DEBT.md — Library Management System

> Technical-debt register for the project (playbook Ch.12 "Human-Led Refactoring" + Ch.13
> anti-pattern "Context Amnesia"). Each item is a known, intentional gap with an ID, priority,
> source, and status. Resolve in priority order; update `Status` when an item is closed and add a
> link to the closing commit/PR.
>
> Most items below were surfaced by the Validation Gate runs on the CORE features (FE02, FE06–FE09,
> FE11) on 2026-06-25. Items already fixed are listed under "Resolved" for traceability.
>
> Priority: **P1** = should fix before the feature is considered "done" / Full-Spec compliant.
> **P2** = improvement or follow-up; not blocking. **Risk** notes money/security/data sensitivity.

Last Updated: 2026-06-25

---

## Open debt

| ID | Feature | Priority | Description | Source | Status |
| -- | ------- | -------- | ----------- | ------ | ------ |
| TD-001 | FE09 Fine | P1 (high-risk: money) | Fine is still an in-memory CRUD prototype. Calculate fines **server-side** from `BorrowDetails` (overdue days, rate, amount) instead of trusting client `amount`/`overdueDays`; move to a repository + DB with transactions. | VG FE09 P0-2 (spec §11.1 ack.) | OPEN |
| TD-002 | FE09 Fine | P1 | Add a real collection flow: `collectedAmount` field + `POST /fines/{id}/collections`; enforce `0 ≤ collectedAmount ≤ amount` and PAID iff fully collected (INV-4/5, FR-FE09-007). | VG FE09 P1-2 | OPEN |
| TD-003 | FE09 Fine | P1 | Write audit logs for fine calculate/collect/mark-paid/waive/cancel (NFR-FE09-LOG-001, INV-8). | VG FE09 P1-3 | OPEN |
| TD-004 | FE09 Fine | P2 | Align endpoints to spec §11 (`/calculate`, `/me`, `/{id}/collections`, `PATCH /{id}/paid`); add member-only `GET /fines/me` (FR-FE09-001) and pagination. | VG FE09 P1-5/P2-1 | OPEN |
| TD-005 | FE06 Inventory | P1 (deferred) | Implement the whole FE06 layer: routes + controller + service + repository + validators, with transition guards (FR-FE06-014/015/016), conflict checks, optimistic locking (FR-FE06-018), audit (FR-FE06-010) and tests. Currently only the `BookCopies` model exists. | VG FE06 (spec marked NOT IMPLEMENTED) | DEFERRED |
| TD-006 | FE07 Borrowing | P1 | Add tests for Unwanted FRs / ACs currently marked "TBD": AC-002 (inactive), AC-003 (borrow limit), AC-005 (copy unavailable at approve), AC-006 (normal return → AVAILABLE), FR-FE07-019 (concurrent approve), FR-FE07-021 (invalid state/date). Update Traceability test IDs. | VG FE07 P1-2 | OPEN |
| TD-007 | FE07 Borrowing | P2 (decision) | Clarify policy: borrow request is currently all-or-nothing when any copy is unavailable, while FR-FE07-003/017/AF-002 imply per-item reject. Decide and align spec or code. | VG FE07 P1-1 | OPEN |
| TD-008 | FE07 Borrowing | P2 | `models/BorrowDetail.js` `allowedValues` is missing `REQUESTED` and `DAMAGED` (used by service/repo and present in SQL CHECK). Sync model metadata. | VG FE07 P2-1 | OPEN |
| TD-009 | FE08 Reservation | P1 | Add tests for Unwanted FRs marked "TBD": FR-FE08-012/013/014 (eligibility), FR-FE08-017 EXPIRED branch, FR-FE08-018 (skip ineligible), FR-FE08-020 (empty queue), FR-FE08-022 (concurrency). Update Traceability test IDs. | VG FE08 P1-1 | OPEN |
| TD-010 | FE08 Reservation | P2 | `cancelReservation` (FR-FE08-017) should return the current reservation state alongside the 409, not just an error code. | VG FE08 P1-3 | OPEN |
| TD-011 | FE08 Reservation | P2 | Cross-feature checks FR-FE08-023/024 (held copy blocks other members borrowing/renewal) are enforced in FE07; add an integration test proving it end-to-end. | VG FE08 P1-4 | OPEN |
| TD-012 | FE11 User & Role | P1 | Persist & validate librarian fields `department`/`specialization` (FR-FE11-010/028, API §11). Currently dropped by `updateUser`/repo; AC-011 cannot pass. | VG FE11 P1-3 | OPEN |
| TD-013 | FE11 User & Role | P1 | Assign-existing-role is a silent no-op and remove-missing-role returns success. Should reject with a clear error (FR-FE11-025/026, EC-FE11-011). | VG FE11 P1-4/5 | OPEN |
| TD-014 | FE11 User & Role | P1 | Use 404 (not 400) for not-found user/role (FR-FE11-016/017/024) and verify `adminUserId` exists before acting. | VG FE11 P1-6/7 | OPEN |
| TD-015 | FE11 User & Role | P1 | No service-level tests: 13/15 ACs and most Unwanted FRs untested (`userManagementService.test.js` missing). Add them. | VG FE11 P0-2 | OPEN |
| TD-016 | FE11 User & Role | P2 | Make user create atomic (token + notification + audit currently outside the create transaction, NFR-TXN-001); email max length 100 → 255 (FR-FE11-021); consider optimistic locking (FR-FE11-023). | VG FE11 P1/P2 | OPEN |
| TD-017 | FE11 User & Role | P2 (config risk) | `allowDevUserManagementWithoutLogin` dev-bypass grants ADMIN when `NODE_ENV` is unset — guard against accidental non-production deploys. | VG FE11 L3 | OPEN |
| TD-018 | FE02 Auth | P2 | Add tests for FR-FE02-015 (duplicate email) and FR-FE02-019 (weak password) via the API, and for the OTP verify/reset branches (currently only token branch is tested). | VG FE02 P2 | OPEN |
| TD-019 | FE02 Auth | P2 | IP-based rate limiting (NFR-FE02-SEC-005) is not implemented (only per-user lockout). Confirm whether per-user is sufficient for Phase 1. | VG FE02 P2 | OPEN |
| TD-020 | FE02 Auth | P2 (decision) | Login returns `ACCOUNT_INACTIVE` (403) for existing-but-unverified accounts, which is a mild user-enumeration signal vs NFR-SEC-010. Confirm intended vs generic message. | VG FE02 P2 | OPEN |
| TD-021 | Cross-feature | P2 | No browser E2E test and no SQL-Server-backed integration test prove full cross-feature flows (integration map §7 known gaps). | Integration map | OPEN |

---

## Resolved (kept for traceability)

| Feature | What was fixed | Commit |
| ------- | -------------- | ------ |
| FE11 | RBAC hole: GET user-management routes now require Admin | 7cec354 |
| FE09 | Auth + role guard on fine routes; state-machine guards (terminal immutable, amount immutable, no double-collect); add CANCELLED | c7d245c |
| FE08 | Add NOTIFIED status + ACTIVE→NOTIFIED transition | 1729a38 |
| FE08 | Expire overdue holds → promote next; tolerate notification failure | 4c86fb2 |
| FE07 | OVERDUE clarified as derived (non-persisted) in Phase 1 (spec aligned to code) | 90a7600 |
| FE02 | Block changing password to the current one (FR-FE02-020); auto-unlock after lock window (AF-FE02-003) | 2aa4c44 |

---

## How to use this file

- When you start work that closes an item, set its `Status` to `IN PROGRESS`, then `RESOLVED` with the
  commit hash when merged (move it to the Resolved table).
- When a Validation Gate or review finds new debt, add a new `TD-###` row — do not fix silently.
- Review this file during each Demo/Retro and before the final defense (playbook ceremony calendar).
