# Vietnamese UI Localization Validation - 2026-07-20

## Decision

This is a Hybrid SDD + ADD validation at Standard depth. The localization
design is a reversible Shell change around an accepted FE01-FE12 Core. Raw
status values, API contracts, permissions, authentication semantics, business
rules, and user-owned catalog/profile data remain unchanged.

PR #58 is merged as `cce59d0`. PR #59 later merged the H3-reviewed reconciliation
as `eed2688`; current-main CI/deployment evidence is recorded separately below.
Human desktop/mobile visual acceptance was confirmed by the project reviewer in
the Codex session on 2026-07-21 using the retained UI audit screenshots.

## L1 - Automated Checks

Application-baseline CI run `29712597463` passed:

- Traceability: 12/12 features, 243/243 FR tags.
- Backend: 53/53 suites, 917/917 tests; statements 92.68%, branches 81.66%, functions 96.59%, lines 92.61%.
- Frontend: 171/171 tests, lint, and production build.
- Browser acceptance: 4/4 Playwright suites.
- Backend import and deployment foundation checks.

Application-baseline staging workflow `29712612188` passed quality gate, backend and
frontend deployment, and the six-check smoke: `frontend`, `health`,
`sql-catalog`, `allowed-cors`, `blocked-cors`, and `protected-route`.

The later reconciliation adds bounded localization regressions, repairs the
remaining presentation-only labels, and adds a responsive HomePage navigation,
footer, and CTA layout contract without changing raw values or workflow
behavior. Fresh local validation passes 173/173 frontend tests; the 171/171
result above remains the exact historical result of CI run `29712597463`.

The focused responsive browser review passed 1/1 at 1440px and 390px and
produced screenshots under `output/playwright/h3-visual/`. The visual harness
also observed an `INTERNAL_ERROR` from `GET /api/books`, so book-card/detail
content was not accepted as visual evidence in that run.

Current-main follow-up: `origin/main@a8729f9` passed CI `29824756487` (923 backend
tests, 178 frontend tests, lint, build, deployment checks, and 4/4 browser E2E)
and staging deployment `29824944954` (frontend/backend deployment and smoke).
These automated results are complemented by the human desktop/mobile acceptance
recorded below.

Local H2-candidate follow-up on 2026-07-21 identified two narrow `390px`
presentation regressions that document-level overflow checks did not detect: the
FE08 candidate badge extended beyond its card, and the FE11 Admin action row had
no separation from the page heading. Test-first containment/spacing assertions
failed on the original layout, then passed after mobile-only CSS remediation.
Fresh evidence is 178/178 frontend tests, lint, production build, 4/4 Playwright
flows, and screenshots
`output/playwright/release-member-reservations-mobile-fixed.png` and
`output/playwright/release-admin-users-mobile-fixed.png`. APIs, workflow behavior,
desktop layout, and the Admin table's internal horizontal scrolling are unchanged.

## L2 - Spec And Traceability

- The design scope is implemented in `frontend/src/i18n/vi.js`,
  `frontend/src/utils/uiLabels.js`, localized page/component surfaces, and
  Vietnamese API fallback resolvers.
- `frontend/test/vietnameseUi.test.js` verifies copy, role/status display
  mappings, raw-value preservation, metadata/font wiring, safe API fallbacks,
  and the audited English-copy absence guard.
- All twelve feature changelogs record the cross-feature presentation change.

## L3 - Constitution And Safety

- No database schema, API payload, role permission, authentication business
  rule, or library workflow contract changed in the localization batch.
- Technical values such as `Email`, `OTP`, `Barcode`, raw enum/status codes,
  book titles, author names, email addresses, and barcode values remain
  unmodified at the logic/data boundary.
- Unknown backend failures use safe Vietnamese fallbacks rather than exposing
  raw technical messages.

## L4 - Acceptance Verification

| Acceptance item | Status | Evidence |
| --- | --- | --- |
| Vietnamese generated copy and labels | PASS | Fresh local 173/173 frontend tests and `vietnameseUi.test.js` audit guard; remote CI `29712597463` passed the earlier 171-test baseline |
| Raw values and user-owned content preserved | PASS | Source assertions and existing workflow tests |
| Vietnamese metadata and typography wiring | PASS | Source tests and production build |
| Current deployed frontend/backend remain healthy | PASS | Staging workflow `29712612188` six-check smoke |
| Responsive desktop/mobile layout capture | PASS — H2-APPROVED LOCAL CANDIDATE | Focused Playwright review 1/1 at 1440px and 390px; later FE08/FE11 bounding-box regressions pass on the remediated candidate; fixed screenshots are retained under `output/playwright/` |
| Dedicated localized desktop/mobile visual acceptance | PASS — H2-APPROVED LOCAL CANDIDATE | Project reviewer confirmed the original 12-screen review on 2026-07-21; the corrective review additionally inspected FE08 reservations and FE11 Admin users at 390px after the two minimal fixes |

## Residual Boundaries

- GitHub PR metadata does not contain a dedicated review record for PR #58;
  any future reconciliation/release PR must record its own H2/H3 evidence before
  a new release tag is created. This does not retroactively review PR #58.
- Human visual acceptance is recorded; the demonstration video/link remains unpublished.
- Shared disposable SQL CI, durable avatar storage, and a production SLA remain
  outside the approved student-release scope.
