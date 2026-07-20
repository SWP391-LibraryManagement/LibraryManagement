# Governance And Release Reconciliation Validation - 2026-07-20

Status: H2-APPROVED - H3 PENDING

## Decision

This closeout uses Hybrid SDD + ADD at Full depth. FE02 authentication and
sensitive OTP delivery ownership are Core; release metadata, test inventory,
localization closeout, responsive presentation, and project memory are
reversible Shell artifacts.

The batch changes no backend, schema, API, authorization, permission,
dependency, or deployment configuration. Frontend changes are bounded to six
presentation-only surfaces plus two localization regressions; raw values,
requests, comparisons, CSS state keys, and business behavior remain unchanged.
Human H2 approval was received in the Codex task on 2026-07-20 for the
published reconciliation plus responsive HomePage correction (`962ceb1` and
`daaeea6`). H3 remains required before merge.

## Changed Scope

- Reconciled FE02 v0.6.4 with ADR-004 and the merged FE10 requester boundary:
  FE02 owns OTP credentials; FE10 owns verification/reset rendering, delivery,
  status, attempts, and safe notification metadata.
- Preserved legacy verification/reset token compatibility, non-blocking failure,
  token-ID idempotency, and the direct FE02 `CHANGE_PASSWORD_OTP` path.
- Refreshed the canonical test-plan inventory and FE01-FE12 readiness snapshot.
- Distinguished published `v1.0.2@c988af1` from the validated post-release
  application baseline `cce59d0`; any future `v1.0.3` must point to the later
  reviewed `main` SHA after this reconciliation merges.
- Added post-integration governance and Vietnamese localization evidence without
  inventing H2/H3 approval or a release tag.
- Repaired residual Vietnamese presentation labels in user management,
  inventory, and borrowing surfaces while preserving all API/status values, and
  extended the source-level localization regression to prevent recurrence.
- Added an accessible HomePage mobile menu plus responsive nav, CTA,
  benefit-card, and footer layout rules; existing navigation/auth actions remain
  unchanged.

## L1 - Automated Checks

Fresh local validation on the current responsive correction diff:

| Command | Result |
| --- | --- |
| `npm.cmd run trace:enforce` | PASS; 12/12 features, 243/243 FR tags, 100% |
| `npm.cmd run test:traceability-state` | PASS; 3/3 |
| `npm.cmd --prefix backend run test:coverage:ci` | PASS; 53/53 suites, 917/917 tests; statements 92.68%, branches 81.66%, functions 96.59%, lines 92.61% |
| `npm.cmd --prefix backend run test:integration:system` | PASS; 10/10 |
| `npm.cmd --prefix frontend test` | PASS; 173/173 (remote CI `29712597463` remains the earlier 171/171 baseline) |
| `npm.cmd --prefix frontend run lint` | PASS |
| `npm.cmd --prefix frontend run build` | PASS |
| `npm.cmd run test:deployment` | PASS; 8/8 |
| `npm.cmd run test:e2e` | PASS; 4/4 in 31.0 seconds |
| PR #59 CI run `29719151571` | PASS; foundation-checks completed successfully after commits `962ceb1` and `daaeea6` |
| Focused H3 responsive Playwright review | PASS (automated); 1/1 at 1440px and 390px; screenshots under `output/playwright/h3-visual/` |
| OpenAPI parse | PASS; `OPENAPI_PARSE_OK` |
| Backend import | PASS; `BACKEND_IMPORT_OK` |
| `git diff --check` | PASS for tracked files; no whitespace errors |
| `git status --short` and `git diff --stat` | PASS; temporary visual harness removed after evidence capture |

## L2 - Spec And Traceability

- FE02 no longer describes verification/reset delivery through a duplicate
  direct `emailService` or notification-repository path.
- FE02, FE10, ADR-004, TASKS, TEST_PLAN, and implementation now agree on the
  FE02-bound requester, `AuthTokens.TokenId` idempotency, and no public debug OTP
  response fields.
- FE01, FE04, FE05, FE06, FE07, FE08, FE09, and FE12 current-state headers now
  report the completed Phase 2 scope and explicitly identify retained open-gate
  text as historical/superseded. FE08 reports 29/29 traceability, and FE11
  schema/finalization metadata points to merged evidence. FE10 records the live
  provider observation while preserving inbox UI and FE09 caller deferrals.
- The enforced traceability gate remains 100% for all twelve features.

## L3 - Constitution And Safety

- The reviewed diff is limited to SDD/release/plan/review/agent-memory artifacts,
  six bounded frontend presentation files, and two frontend regression tests.
- No backend product source, schema, API contract, permission, dependency,
  workflow, or deployment file changed. Frontend edits only localize displayed
  labels and do not alter raw status values, request payloads, comparisons,
  class keys, or business/security behavior.
- No secret, credential, token value, provider payload, or real PII was added.
- Raw verification/reset OTPs remain prohibited from persistence, logs, audits,
  and public HTTP responses; tests capture them through injected dependencies.

## L4 - Acceptance Verification

| Acceptance item | Status | Evidence |
| --- | --- | --- |
| FE02 source-of-truth matches merged delivery behavior | PASS | ADR-004/FE10 comparison, auth tests, traceability |
| Canonical project test inventory matches current gates | PASS | Fresh L1 results above |
| Published release and post-release source are distinguished | PASS | Local Git/tag inspection and GitHub release evidence |
| Localization implementation has a dedicated L1-L4 packet | PASS | `.sdd/reviews/vietnamese-ui-localization-validation-2026-07-20.md` |
| Human H2 review of the complete reconciliation diff | PASS | Approved in the Codex task on 2026-07-20; commits `962ceb1` and `daaeea6` contain the reviewed responsive/evidence correction |
| Automated responsive desktop/mobile review | PASS | Focused Playwright 1/1 with menu/footer/CTA checks and screenshots; the run logged `GET /api/books` `INTERNAL_ERROR`, so public book-card/detail content remains unverified |
| Human H3/new `v1.0.3` release decision | PENDING | H3 remains mandatory before merge; tag creation remains outside this approval |

## Residual Boundaries

- A dedicated localized desktop/mobile visual review remains pending human
  acceptance; the focused run could not verify public book-card/detail content
  because the E2E backend returned `INTERNAL_ERROR` for `GET /api/books`.
- Demonstration video/link remains unpublished.
- Default CI has no shared disposable SQL Server service; current E2E/system
  tests use deterministic harnesses, while historical live SQL evidence remains
  in the Phase 2 reconciliation packet.
- Backend ESLint is not configured as a script/CI gate; no backend code changed
  in this batch.
