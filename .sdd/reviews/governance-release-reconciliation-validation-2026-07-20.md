# Governance And Release Reconciliation Validation - 2026-07-20

Status: LOCAL CLOSEOUT H2-APPROVED; H3 APPROVED FOR PR #59; NEW H3 AND RELEASE DECISIONS PENDING

## Decision

This closeout uses Hybrid SDD + ADD at Full depth. FE02 authentication and
sensitive OTP delivery ownership are Core; release metadata, test inventory,
localization closeout, responsive presentation, and project memory are
reversible Shell artifacts.

The earlier PR #59 batch changed no backend, schema, API, authorization,
permission, dependency, or deployment configuration. The later local closeout
candidate adds reviewed lockfile/package audit maintenance, CI audit gates, and
two mobile-only presentation fixes with bounding-box regressions. It changes no
schema, API, authorization, permission, or business behavior.
Human H2 approval was received in the Codex task on 2026-07-20 for the
published reconciliation plus responsive HomePage correction (`962ceb1` and
`daaeea6`). PR #59 then merged as `eed2688` after H3 review and green CI.
The later current-main product batch requires its own final release review.
Human H2 approval for the complete local closeout diff was received in the
Codex task on 2026-07-21. That approval authorizes this reviewed commit set and
subsequent branch/PR publication, but not H3 merge or a release tag.

## Changed Scope

- Reconciled FE02 v0.6.4 with ADR-004 and the merged FE10 requester boundary:
  FE02 owns OTP credentials; FE10 owns verification/reset rendering, delivery,
  status, attempts, and safe notification metadata.
- Preserved legacy verification/reset token compatibility, non-blocking failure,
  token-ID idempotency, and the direct FE02 `CHANGE_PASSWORD_OTP` path.
- Refreshed the canonical test-plan inventory and FE01-FE12 readiness snapshot.
- Distinguished published `v1.0.2@c988af1` from current `main@a8729f9`; any
  future `v1.0.3` must point to a human-approved reviewed SHA after the later
  current-main batch.
- Added post-integration governance and Vietnamese localization evidence without
  inventing H2/H3 approval or a release tag.
- Repaired residual Vietnamese presentation labels in user management,
  inventory, and borrowing surfaces while preserving all API/status values, and
  extended the source-level localization regression to prevent recurrence.
- Added an accessible HomePage mobile menu plus responsive nav, CTA,
  benefit-card, and footer layout rules; existing navigation/auth actions remain
  unchanged.
- Updated vulnerable dependency resolutions and added root/backend/frontend
  high-severity audit gates to CI; all three production audits report zero
  vulnerabilities.
- Added FE08 mobile card containment and FE11 Admin topbar spacing fixes plus
  Playwright geometry assertions and corrected `390px` screenshots.

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
| Human current-main desktop/mobile visual review | PASS | Project reviewer confirmed review on 2026-07-21 using the 12 screenshots retained under `output/ui-ux-audit-2026-07-20/` |
| PR #59 H3 integration review | PASS | Merge commit `eed2688` records H3 approval after green CI and responsive evidence review |
| Human H2 review of the local closeout candidate | PASS | User approved H2 in the Codex task on 2026-07-21 after RED/GREEN evidence, full scoped regression, corrected screenshots, and complete diff review |
| Human current-main release decision | PENDING | Current `main@a8729f9` is validated by CI/deployment, but tag creation remains outside this approval |

## Residual Boundaries

- The earlier focused harness could not verify public book-card/detail content
  because its E2E backend returned `INTERNAL_ERROR` for `GET /api/books`; the
  retained current UI audit screenshots were subsequently accepted by the
  project reviewer on 2026-07-21.
- Demonstration video/link remains unpublished.
- Current-main dependency audit is now enforced locally and in CI; the final
  release packet must retain the zero-vulnerability audit evidence.
- Default CI has no shared disposable SQL Server service; current E2E/system
  tests use deterministic harnesses, while historical live SQL evidence remains
  in the Phase 2 reconciliation packet.
- Backend ESLint is not configured as a script/CI gate; no backend code changed
  in this batch.

## Automated Closeout Addendum — 2026-07-21

The current working copy was fast-forwarded to `main@a8729f9`, dependencies were
reinstalled from the final lockfiles, and the following local gates passed:

| Gate | Result |
| --- | --- |
| `npm.cmd run trace:enforce` | PASS; 12/12 features, 243/243 FR tags, 100% |
| `npm.cmd --prefix backend test` | PASS; 54 suites, 923/923 tests |
| `npm.cmd --prefix backend run test:integration:system` | PASS; 10/10 |
| `npm.cmd --prefix backend run test:coverage:ci` | PASS; statements 92.61%, branches 81.55%, functions 96.68%, lines 92.54% |
| `npm.cmd --prefix frontend test` | PASS; 178/178 |
| frontend lint and build | PASS |
| `npm.cmd run test:deployment` | PASS; 8/8 |
| `npm.cmd run test:e2e` | PASS; 4/4 |
| `npm audit --audit-level=high` (root/backend/frontend) | PASS; 0 vulnerabilities in each workspace |
| `git diff --check` | PASS; no whitespace errors |

The CI workflow now enforces high-severity audits for all three workspaces.
Human desktop/mobile visual acceptance is recorded; demonstration-video
publication and the human decision to tag a new release remain intentionally open.

Artifact hygiene: removed the untracked deployment ZIPs/dump directory
(`backend/.zip`, `backend/.env.zip`, and `output/azure-mail-20260721-145625*`),
and retained only the 12 UI audit screenshots under
`output/ui-ux-audit-2026-07-20/` as review evidence.

## Local H2 Approval Addendum — 2026-07-21

Decision: **PASS — COMMIT AUTHORIZED**

- L1 automated: FE08 and FE11 geometry assertions were observed RED before the
  fixes and GREEN afterward; 178/178 frontend tests, lint, production build,
  4/4 Playwright flows, 12/12-feature and 243/243-FR traceability, and
  `git diff --check` pass.
- L2 spec: the implementation remains inside the approved Task 7 mobile visual
  remediation and the release-closeout reconciliation plan.
- L3 constitution/safety: no backend product source, schema, API, permission,
  authorization, or business rule changed; dependency changes are bounded to
  reviewed audit remediation; no secrets or real PII are included.
- L4 acceptance: corrected FE08 and FE11 screenshots were inspected at `390px`,
  with controls contained and the Admin table retaining internal scrolling.

This H2 decision authorizes the reviewed local commit set. Branch push, PR
publication, H3 merge approval, and any `v1.0.3` tag remain separate actions.
