# Vietnamese UI Localization Validation - 2026-07-20

## Decision

This is a Hybrid SDD + ADD validation at Standard depth. The localization
design is a reversible Shell change around an accepted FE01-FE12 Core. Raw
status values, API contracts, permissions, authentication semantics, business
rules, and user-owned catalog/profile data remain unchanged.

PR #58 is merged as `cce59d0`. This packet records application-baseline evidence; it
does not invent a separate H2/H3 review record where GitHub metadata is absent.

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

The later H2-approved reconciliation adds one bounded localization regression
and fixes the remaining presentation-only labels without changing raw values or
workflow behavior. Fresh local validation passes 172/172 frontend tests; the
171/171 result above remains the exact historical result of CI run
`29712597463`.

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
| Vietnamese generated copy and labels | PASS | Fresh local 172/172 frontend tests and `vietnameseUi.test.js` audit guard; remote CI `29712597463` passed the earlier 171-test baseline |
| Raw values and user-owned content preserved | PASS | Source assertions and existing workflow tests |
| Vietnamese metadata and typography wiring | PASS | Source tests and production build |
| Current deployed frontend/backend remain healthy | PASS | Staging workflow `29712612188` six-check smoke |
| Dedicated localized desktop/mobile visual review | PENDING HUMAN REVIEW | Current E2E covers workflow behavior; no separate screenshot packet was created in this batch |

## Residual Boundaries

- GitHub PR metadata does not contain a dedicated review record for PR #58;
  any future reconciliation/release PR must record its own H2/H3 evidence before
  a new release tag is created. This does not retroactively review PR #58.
- Demonstration video/link remains unpublished.
- Shared disposable SQL CI, durable avatar storage, and a production SLA remain
  outside the approved student-release scope.
