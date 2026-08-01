# FE07 Return-Date Business Persistence H2 Review - 2026-08-02

## Decision

**APPROVED FOR SCOPED COMMIT, PUSH, AND DRAFT PR.** The user granted H2 after reviewing the uncommitted FE07 v0.9.1 remediation and its local validation evidence. This approval does not close FE07-T061, authorize merge, or grant H3.

## Frozen review boundary

- Parent commit: `944c584c4867cc1d8abfd992537d089e04468638`.
- Product change: pass the already-derived `returnBusinessDate` to `borrowingRepository.returnBorrowDetail` instead of the raw UTC `clock()` value.
- Product/test files: `backend/src/services/borrowingService.js`, `backend/tests/borrowingRoutes.test.js`.
- Governance/evidence files: `.sdd/specs/feat-borrowing-management/PLAN.md`, `.sdd/specs/feat-borrowing-management/TASKS.md`, `.sdd/reviews/release-closeout-staging-acceptance-2026-08-02.md`, `docs/superpowers/plans/2026-08-02-azure-staging-authenticated-acceptance.md`, `docs/superpowers/plans/2026-08-02-fe07-return-date-business-persistence.md`, and this frozen review.
- Explicit exclusions: every dirty auth, book-management, user-role, React Router security-exception, PR95 closeout, and worktree-hygiene file in the shared checkout.

## Standards review

- The implementation is surgical: one production argument and one boundary regression; no unrelated refactor or dependency.
- Existing parameterized `sql.Date` persistence, transaction locking, audit construction, FE08 handoff, and FE09 ownership remain unchanged.
- No schema, API shape, authorization, role, validation, secret, or PII change was introduced.

## Spec review

- AC-FE07-006 and the `returnDate` data/API contracts require the default committed date to use `Asia/Ho_Chi_Minh`.
- AC-FE07-008 requires downstream fine evidence and audit metadata to use the committed return date.
- RED proved the service-to-repository boundary received raw `2026-07-22T17:30:00.000Z` instead of canonical `2026-07-23`; GREEN passes the canonical date and preserves explicit-date behavior.

## Validation frozen at H2

- Focused FE07/FE09/repository: `114/114` under `TZ=UTC`; the boundary regression also passed under `America/New_York`.
- System integration: `11/11`.
- Full backend and coverage: `74` suites, `1,175/1,175`; statements `91.98%`, branches `81.28%`, functions `97.08%`, lines `91.94%`.
- Traceability enforcement: FE07 `44/44` (`100%`). Tracked-secret tests: `5/5`. Diff hygiene: PASS.
- Installed Tedious driver smoke: canonical `2026-07-23` maps to SQL date `2026-07-23` with `useUTC=true`; the former raw clock value maps to `2026-07-22`.

## Remaining gates

- Disposable real-SQL mutation was not run because no named non-staging database and mutation flag were configured.
- The fix is not yet deployed. A subsequent authorized staging acceptance must prove the three-day/15,000 VND invariant and cleanup before FE07-T061 can close.
- H3 is required before merge. This snapshot must not be rewritten with later commit, CI, PR, deploy, or merge facts; those belong in the PR or a separate closeout record.
