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

Last Updated: 2026-07-19

> Traceability note: every implemented feature now meets the Validation-Gate L2 bar (FR `@spec`
> coverage ≥ 70%). FE07 and FE08 are at 100%, FE02 was completed to 100%, and the CI workflow now runs
> `npm run trace:enforce` (was report-only) so the gate is enforced on every PR.

---

## Open debt

| ID | Feature | Priority | Description | Source | Status |
| -- | ------- | -------- | ----------- | ------ | ------ |
| TD-004 | FE09 Fine | P2 | Complete browser/L4 acceptance and, if required by the owner, move the **frontend** `FineManagement.jsx` list search/filter/pagination fully onto the server query contract. Canonical API ownership is implemented, and legacy create/update/delete mutation routes now return `404`. | VG FE09 P1-5/P2-1 | OPEN |
| TD-005 | FE06 Inventory | P1 | The FE06 routes, controller, service, repository, validators, transition/conflict guards, rowversion `If-Match`, transactional audit, frontend workflow, and live SQL tests are implemented. Draft PR #40 CI run `29679154327` passes; final H2/human integration acceptance remains. | FE06 reconciliation validation; FE06 PLAN/TASKS; Live SQL review; PR #40 | IN REVIEW |
| TD-012 | FE11 User & Role | P1 | Nullable 100-character `department`/`specialization` columns and role-gated create/read/update persistence are implemented with schema/model/API tests. Draft PR #40 CI run `29679154327` passes; H2/H3 and final closeout remain. | FE11 Wave A validation; FE11 Finalization Batch; PR #40 | IN REVIEW |
| TD-013 | FE11 User & Role | P1 | Resolved in the transactional role slice: duplicate assignment returns `409 USER_ALREADY_HAS_ROLE`; absent revocation returns `404 USER_ROLE_NOT_FOUND`; neither branch mutates or audits. Evidence: `0805363`, `d04ebfb`, `817039d`. | VG FE11 P1-4/5 | RESOLVED |
| TD-014 | FE11 User & Role | P1 | Create/resend/update/deactivation actor, target, lifecycle, pending-activation, rollback, and FE07 serialization outcomes are implemented locally and validated. H2/H3 and integration evidence remain. | FE11 Wave A validation; FE11 Finalization Batch | IN REVIEW |
| TD-015 | FE11 User & Role | P1 | Focused lifecycle repository/service/route rollback evidence and Wave B request/browser acceptance are implemented; full automated regression and draft PR #40 CI run `29679154327` are green. H2/H3 and human acceptance remain. | FE11 Wave A/Wave B validations; PR #40 | IN REVIEW |
| TD-016 | FE11 User & Role | P2 | Canonical 255-character user/notification email persistence and effective `COALESCE(UpdatedAt, CreatedAt)` concurrency are implemented; the idempotent migration passed the disposable SQL Server gate twice. Integration closeout remains. | FE11 Wave A validation; ADR-005; ADR-002; Live SQL review | IN REVIEW |
| TD-017 | FE11 User & Role | P2 (config risk) | The implicit Vite development Admin bypass is removed; every mode now requires stored authenticated Admin state, with frontend and isolated browser regression evidence. Integration closeout remains. | FE11 Wave A/Wave B validations | IN REVIEW |
| TD-018 | FE02 Auth | P2 | Add tests for FR-FE02-015 (duplicate email) and FR-FE02-019 (weak password) via the API, and for the OTP verify/reset branches (currently only token branch is tested). | VG FE02 P2 | OPEN |
| TD-019 | FE02 Auth | P2 | IP-based rate limiting (NFR-FE02-SEC-005) is not implemented (only per-user lockout). Confirm whether per-user is sufficient for Phase 1. | VG FE02 P2 | OPEN |
| TD-020 | FE02 Auth | P2 (decision) | Login returns `ACCOUNT_INACTIVE` (403) for existing-but-unverified accounts, which is a mild user-enumeration signal vs NFR-SEC-010. Confirm intended vs generic message. | VG FE02 P2 | OPEN |
| TD-021 | Cross-feature | P2 | Disposable SQL Server validation passes 8/8 suites and 61/61 tests with two-pass migrations and cleanup; FE11 Request Management plus the global golden path pass together 2/2 on isolated ports. Draft PR #40 CI run `29679154327` passes on integrated commit `422246b`; final human integration acceptance is pending. | Full-reconciliation Live SQL review; FE11 Wave B validation; PR #40 | PARTIAL |
| TD-025 | FE11 Request Management | P1 | Canonical Admin request list/detail, server pagination, safe all-filtered-row CSV, FE07-owned terminal actions, Dashboard evidence, and focused browser acceptance are implemented. `FE11-REQ01..REQ03` are H2-ready and draft PR #40 CI run `29679154327` passes; H2/H3 and final closeout remain. | FE11 Wave B validation; FR-FE11-031/034/035; Finalization Batch; PR #40 | IN REVIEW |
| TD-028 | FE08 Reservation Candidate Catalog | P1 (contract decision) | `MyReservationsPage` still builds the reservation candidate list from hardcoded `DEMO_RESERVABLE` copy IDs. Reservation mutations use the real protected API and do not simulate success, but the visible candidates can drift from SQL. Define an approved member-safe FE01/FE06/FE08 copy-selection contract, then replace the static catalog before final product acceptance. | Final full-reconciliation product-drift scan; FE08 create-reservation flow | OPEN |

---

## Resolved (kept for traceability)

| Feature | What was fixed | Commit |
| ------- | -------------- | ------ |
| FE11 | TD-023: aligned the Admin Console to the exact eight-entry sidebar, added Admin-only `GET /api/admin/permissions` with the canonical three-role/15-permission policy, and composed independent FE12 role counts with derived read-only coverage/matrix state. PR #37; post-merge CI `29655548150`. | 356130e |
| FE11 | TD-024: replaced the legacy Audit Log read path with Admin-first canonical filtering, stable SQL pagination, action-aware default-deny redaction, safe frontend rendering, and legacy `404 NOT_FOUND`. PR #33; post-merge CI `29651173195`. | 3c88e43 |
| FE11 | TD-026: restored `GET /api/users` to exactly `{ data, pagination }` and moved global Admin counters to independent FE12 `/api/reports/users` statistics with numeric zero defaults. PR #34; post-merge CI `29652243809`. | 411fa25 |
| FE11 | TD-027: reconciled exactly 22 approved FE11 Test Case/Status cells while preserving requirement text, deferred rows, and whole-feature `DEFERRED` state. PR #35; post-merge CI `29652617587`. | c286cd9 |
| FE11 | TD-022: Admin role actions now use numeric IDs from the authenticated catalog, validate the full diff, assign before revoke, preserve no-op/non-editable roles, and reconcile partial failures. PR #30 merged as `c20d3251`; post-merge CI `29644292781` passed. | c20d3251 |
| FE07 | TD-006: added tests for FR-FE07-019 (no double-borrow on concurrent approve), FR-FE07-016 (unpaid-fine block), FR-FE07-020 (overdue renewal block); tagged FR-FE07-014..022 with `@spec` → 100% traceability | 16e8134 |
| FE07 | TD-008: synced `models/BorrowDetail.js` `allowedValues` + default to the SQL CHECK set (`REQUESTED..DAMAGED`) | 3ae1d82 |
| FE08 | TD-010: `cancelReservation` now returns the current reservation state (`{reservationId, status}`) alongside the 409 (`safeErrors.conflict` + errorHandler carry `details`) | 3ae1d82 |
| FE10 | Added error/edge tests (unsupported type/channel, unknown template, recipient errors, sanitize, audit, empty pending) → 10 tests | 3ae1d82 |
| FE12 | Added error/edge tests (RBAC 401/403 ×3, invalid filter/range, empty inventory, audit) → 7 tests | 3ae1d82 |
| FE07 | TD-007: decided Phase 1 = all-or-nothing borrow policy; aligned SPEC (FR-FE07-003/017/018, AF-FE07-002, new BR-FE07-022) to the existing code; per-item deferred | ba0556c |
| FE08 | TD-011: added cross-feature integration tests proving a held (RESERVED) copy blocks another member's borrow (FR-FE08-023) and an active reservation blocks renewal (FR-FE08-024) | ba0556c |
| FE08 | TD-009: added test for FR-FE08-022 (concurrent queue holds copy once); tagged FR-FE08-011..024 (incl. cross-feature 023/024 in FE07) with `@spec` → 100% traceability | 16e8134 |
| FE02 | AI-001: tagged FR-FE02-015..021 with `@spec` → 100% traceability; CI `trace:enforce` gate enabled | 16e8134 |
| FE09 | TD-001/002/003: server-side fine calculation from `BorrowDetails` (repo + DB transactions, locked dedupe), collection flow (PAID iff fully collected), and audit logs for calculate/collect/paid/waive/cancel. New SPEC §11 endpoints were added; the later v0.4.1 boundary removes legacy create/update/delete mutations; `@spec` remains 100%. | 16e8134 |
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
