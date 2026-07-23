# TASKS.md - FE12 Reporting & Statistics

Status: COMPLETE - PHASE 2 EXIT EVIDENCE RECORDED
Implementation State: COMPLETE

Owner: Nhat

Updated: 2026-07-19

Workflow State: COMPLETE for the approved Phase 2 scope; H3, merge, and exact post-merge `main` CI are recorded in `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`. Pending/open gate statements retained below are historical execution snapshots superseded by that evidence.

---

## 1. Backend Tasks

- [x] FE12-T01 Add borrowing, inventory, and user report routes.
- [x] FE12-T02 Add validators for report filters and date-range ordering.
- [x] FE12-T03 Add read-only reporting service with role checks.
- [x] FE12-T04 Add borrowing aggregate queries and metrics.
- [x] FE12-T05 Add inventory aggregate queries and metrics.
- [x] FE12-T06 Add user statistics aggregate queries and metrics.
- [x] FE12-T07 Add audit logs for successful report access.
- [x] FE12-T08 Keep report responses aggregate-only and free of unnecessary personal data.

## 2. Test Tasks

- [x] FE12-T09 Add in-memory report repository helper.
- [x] FE12-T10 Test borrowing report metrics and zero-result handling.
- [x] FE12-T11 Test inventory report metrics.
- [x] FE12-T12 Test user statistics and personal-data suppression.
- [x] FE12-T13 Test invalid range and role protection.

## 3. Frontend Tasks

- [x] FE12-T14 Implement borrowing report screen with date filters and charts.
- [x] FE12-T15 Implement inventory report screen with category filters and charts.
- [x] FE12-T16 Implement user statistics screen with date filters and charts.
- [x] FE12-T17 Wire frontend screens to backend APIs.
- [x] FE12-T18 Add accessibility: table captions, header scopes, form labels, keyboard support.
- [x] FE12-T19 Add loading, empty, and error states on all screens.

## 4. Historical Base-Slice Validation (2026-07-13)

These results describe the previously integrated base slice and remain historical evidence only;
the deterministic-wave evidence is recorded in Section 9.1.

- [x] `npm.cmd --prefix backend test` passed: 18 suites, 236 tests.
- [x] `npm.cmd --prefix frontend test` passed: 24 tests.
- [x] `npm.cmd --prefix frontend run lint` passed.
- [x] `npm.cmd --prefix frontend run build` passed.
- [x] `npm.cmd run trace:enforce` passed; FE12 has 8/8 tagged FRs (100%).
- [x] Fresh browser verification passed at `http://127.0.0.1:5173`: Admin success for
  borrowing/inventory/users, Guest redirect to `/login`, Member redirect to `/forbidden`,
  inventory category filtering, truthful error/empty states, and responsive layout checks.

## 5. Base Traceability

| Spec ID | Covered by |
| --- | --- |
| BR-FE12-001 | FE12-T03, FE12-T10, FE12-T11, FE12-T12 |
| BR-FE12-002 | FE12-T13 |
| BR-FE12-003 | FE12-T03, FE12-T13 |
| BR-FE12-004 | FE12-T04, FE12-T10 |
| BR-FE12-005 | FE12-T05, FE12-T11 |
| BR-FE12-006 | FE12-T06, FE12-T12 |
| BR-FE12-007 | FE12-T06, FE12-T12, FE12-N02, FE12-N03 |
| BR-FE12-008 | FE12-T02, FE12-T13 |
| BR-FE12-009 | FE12-T02, FE12-T13 |
| BR-FE12-010 | FE12-T04, FE12-T05, FE12-T06 |
| BR-FE12-011 | FE12-T06, FE12-T12 |
| BR-FE12-012 | FE12-T04, FE12-T05, FE12-T06 |
| BR-FE12-013 | FE12-N03 |
| BR-FE12-014 | FE12-N02, FE12-N03 |
| BR-FE12-015 | FE12-N02, FE12-N03, FE12-N04 |
| FR-FE12-001 | FE12-T10 |
| FR-FE12-002 | FE12-T11 |
| FR-FE12-003 | FE12-T12 |
| FR-FE12-004 | FE12-T13 |
| FR-FE12-005 | FE12-T02, FE12-T13 |
| FR-FE12-006 | FE12-T10 |
| FR-FE12-007 | FE12-T03, FE12-T10, FE12-T11, FE12-T12 |
| FR-FE12-008 | FE12-T06, FE12-T12 |
| FR-FE12-009 | FE12-N02, FE12-N03 |
| FR-FE12-010 | FE12-N02, FE12-N03, FE12-N04 |

## 6. Still Outside This Slice

- CSV/PDF export.
- Dashboards.
- BI warehouse integration.

## 7. FE12 B6 Validation Hardening

B5 implementation status: COMPLETE. The initial B6 automated/manual browser validation
completed, then independent reviews opened follow-up findings. Remediation and fresh full
verification pass, the final independent re-review is clean, and Nhat confirmed human review.

- [x] FE12-H01 Add regression tests for request deduplication, inclusive date-only filters,
  membership approval periods, inventory category counts, and low-stock copy totals.
- [x] FE12-H02 Correct repository aggregation and date-boundary behavior.
- [x] FE12-H03 Add safe audit entries for failed report access and align all OpenAPI filters.
- [x] FE12-H04 Protect all FE12 frontend routes and remove fabricated demo fallback data.
- [x] FE12-H05 Restore inventory category options from the authorized metadata payload.
- [x] FE12-H06 Run focused and full automated validation.
- [x] FE12-H07 Capture fresh staff/member/guest browser evidence, responsive measurements,
  inventory filter behavior, and loading/empty/error states.
- [x] FE12-H08 Remove raw query values from successful report audit metadata.
- [x] FE12-H09 Apply user date ranges only to `newMembersByPeriod` by `Members.ApprovedAt`.
- [x] FE12-H10 Add strict date-only validation and complete OpenAPI `400` responses.
- [x] FE12-H11 Default report date filters to blank and omit empty query parameters.
- [x] FE12-H12 Align production/test low-stock behavior to `availableCopies <= 2`.
- [x] FE12-H13 Obtain clean independent re-review after fresh full validation.
- [x] FE12-H14 Obtain Nhat's human review before commit/push/merge.

Detailed evidence is recorded in
`.sdd/reviews/fe12-b6-validation-review-2026-07-13.md`.

## 8. Historical B7 Integration And Review Closeout

- [x] Nhat confirmed the human review gate and selected local merge.
- [x] Commit `58747bc10657ed1accb44950ae0c5edbd178a242` reached `main` and `origin/main`.
- [x] GitHub Actions CI run `29249491818` passed for the same commit.
- [x] CI covered traceability enforcement, backend tests, frontend lint/tests/build, and the
  backend health import check.
- [x] Detailed evidence is recorded in
  `.sdd/reviews/fe12-b7-integration-review-closeout-2026-07-13.md`.

## 9. Deterministic Policy Follow-up

- [x] FE12-N01 Normalize all-report access, unknown-ID/status behavior, pagination/order, audit, export scope, and traceability in documentation.
- [x] FE12-N02 Align access, validation, canonical metrics/rows envelopes, unknown status/ID policy, stable ordering, safe success audit, and date-only row serialization with the approved deterministic contract.
- [x] FE12-N03 Add focused contract tests for unknown IDs, `UNKNOWN` status grouping, page/limit bounds, stable ordering, successful audit, date-only borrowing rows, and absence of export surfaces.
- [x] FE12-N04 Align all three frontend report consumers and cross-feature integration assertions to `{ metrics, rows, page, limit, totalRows }` without legacy response fields.
- [x] FE12-N05 Apply inventory `status` and `location` to the same SQL copy row, retain full-book availability for low-stock calculations, and evaluate user approval-period date bounds in SQL without changing global totals.
- [x] FE12-N06 Run focused/full automated validation, lint, build, traceability, and diff hygiene; record the deterministic-wave evidence.
- [x] FE12-N07 Run fresh browser acceptance for canonical borrowing/inventory/user screens, zero-result filtering, mobile layout, and Member/Guest denial.
- [ ] FE12-N08 Obtain human integration review before commit, push, merge, or deterministic-wave B7 closeout.
- [x] FE12-N09 Add canonical search and complete report filters, remove successful-load banners, and order user rows by increasing `UserId`.

### 9.1 Deterministic-Wave Automated Evidence

- [x] Focused FE12 backend gate passed: 6 suites, 46 tests.
- [x] Full backend suite passed: 39 suites, 615 tests.
- [x] Backend coverage threshold passed: 92.54% statements, 82.33% branches, 97.14% functions, 92.47% lines.
- [x] Focused FE12 frontend gate passed: 12 tests; full frontend suite passed: 121 tests.
- [x] Frontend lint and production build passed.
- [x] Traceability enforcement passed with FE12 at 10/10 tagged FRs (100%).
- [x] `git diff --check` passed.
- [x] Playwright system golden path passed: 1/1 before repository review remediation; exact-diff isolated Playwright CLI acceptance then re-verified all three deterministic report screens, zero-result behavior, mobile overflow, Member 403, and Guest login redirect on port 4184 without reusing the occupied FE03 port 4173.
- [x] SQL-backed system integration passes in `backend/tests/sql/systemIntegration.sqltest.js` on the disposable reconciliation database with cleanup evidence.
- [ ] Human B7/L4 acceptance remains pending.

Detailed automated evidence is recorded in
`.sdd/reviews/fe12-deterministic-policy-validation-2026-07-19.md`.
## 2026-07-22 corrective batch

- [x] Reconfirm borrowing, inventory, and user report filters map to server query parameters.
- [x] Reconfirm charts consume deterministic backend metrics with no fake fallback.
- [x] Reduce report-only bottom whitespace and retain responsive layout tests.
- [~] **FE12-N10 - Restore in-memory report parity and traceability.**
  - Maps to: BR-FE12-009, BR-FE12-015/016, FR-FE12-003/011, AC-FE12-003/011.
  - RED: user `q` failed to match ID/status/membership/role and SQL wildcard patterns, inactive historical approvals disappeared from growth metrics, and fixture order leaked into detail rows.
  - GREEN: the in-memory repository matches production parameterized SQL `LIKE` search including `%`, `_`, bracket ranges, and negated classes over approved fields, plus historical `ApprovedAt` and `UserId ASC` semantics; traceability remains `16/11/11`.
  - Verification: the initial H2 and H2 addendum passed; commit `97aca62` and PR CI run `30014066260` passed. Fresh H2 then approved remediation commit `b931e00`, and PR CI run `30019439505` passed. The repeated H3 review found the valid SQL `LIKE` closing-bracket parity edge plus bounded cross-feature evidence gaps. Fresh H2 approved the round-two package on 2026-07-23 and authorized its reviewed commit/push; updated PR CI and repeated H3 remain mandatory before merge.
