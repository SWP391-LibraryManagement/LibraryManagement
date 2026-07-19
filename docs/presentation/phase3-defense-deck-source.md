# Phase 3 Defense Deck Source Record

Date: 2026-07-19  
Deck: `docs/presentation/phase3-defense-deck.pptx`  
Authoring: `@oai/artifact-tool` via the Phase 3 presentation skill  
Visual system: Codex Grid, white/black/gray foundation, warm-brown accent,
Helvetica Neue, 1280x720.

## Source policy

Every claim in the deck is grounded in a tracked project file, a reproducible
local command, or an observed staging check. No external research was used.
Unobserved authenticated Azure acceptance, SMTP inbox delivery, durable avatar
storage, and production SLA are intentionally presented as open boundaries.

## Slide-by-slide traceability

| Slide | Claim / purpose | Source files and commands |
| --- | --- | --- |
| 1 | Phase 3 scope: staging, Live SQL, performance, user testing, delivery evidence. | `docs/superpowers/specs/2026-07-19-phase3-polish-delivery-design.md`; `docs/superpowers/plans/2026-07-19-phase3-polish-delivery.md` |
| 2 | Phase 3 preserves the 12 accepted feature contracts, four role audiences, full FR traceability, and four validation layers. | `.sdd/constitution.md`; `.sdd/test-plan.md`; `.sdd/specs/feat-*/SPEC.md`; Phase 2 exit evidence |
| 3 | Runtime topology and observable deployment boundaries: React, Express API, Azure SQL, strict CORS, protected 401, and SQL-backed catalog. | `docs/release/phase3-staging-evidence-2026-07-19.md`; `npm.cmd run smoke:staging` with `STAGING_FRONTEND_URL` and `STAGING_API_URL` set to the observed Azure origins |
| 4 | Quality totals and traceability: 916 backend tests, 151 frontend tests, deployment utilities 8/8, browser E2E 4/4, and 100% FR coverage. | `npm.cmd --prefix backend test`; `npm.cmd --prefix frontend test`; `npm.cmd run test:deployment`; `npm.cmd run trace:enforce`; `docs/release/phase3-user-testing-record-2026-07-19.md` |
| 5 | SQL-aware smoke detected schema drift, diagnosed FE05 migration/index interaction, and proved repeatable reconciliation. | `docs/release/phase3-staging-evidence-2026-07-19.md`; `database/migrations/2026-07-19-fe05-book-rowversion.sql`; `tests/deployment/staging-smoke.test.js`; six-check staging smoke output |
| 6 | Route-level code splitting reduced initial JavaScript from 999,203 to 320,688 bytes (-67.9%); local auth timing stayed under documented targets. | `frontend/src/App.jsx`; `scripts/phase3-performance.js`; `tests/performance/phase3-performance.test.js`; `docs/performance/phase3-performance-report-2026-07-19.md`; `npm.cmd run phase3:performance` |
| 7 | Synthetic local browser golden path and responsive evidence remain coherent after delivery polish. | `docs/release/phase3-user-testing-record-2026-07-19.md`; `tests/e2e/system-golden-path.spec.js`; `npm.cmd run test:e2e`; `docs/assets/phase3/system-golden-path-desktop.png`; `docs/assets/phase3/system-golden-path-mobile.png` |
| 8 | Explicit PASS, NOT OBSERVED, LIMITATION, and OUT OF SCOPE boundaries. | `docs/release/phase3-staging-evidence-2026-07-19.md`; `docs/release/phase3-user-testing-record-2026-07-19.md` |
| 9 | Repeatable six-step five-minute defense path and fallback evidence. | `docs/testing/system-integration-demo-runbook.md`; `npm.cmd run test:system`; six-check smoke; verified screenshots |
| 10 | Release decision: branch is ready for integration, while authenticated Azure and SMTP remain open until observed. | `docs/release/phase3-staging-evidence-2026-07-19.md`; `docs/release/phase3-user-testing-record-2026-07-19.md` |

## Visual asset provenance

- Slide 7 uses the tracked synthetic screenshots under `docs/assets/phase3/`.
- No real user identity, credential, token, OTP, SMTP body, or production data is
  embedded in the deck.
- The deck was rendered to PNG with the presentation container tooling and
  passed `slides_test.py` with no overflow detected.

## Verification record

```text
node create-phase3-deck.mjs
render_presentation.mjs --input docs/presentation/phase3-defense-deck.pptx
slides_test.py docs/presentation/phase3-defense-deck.pptx
Result: 10 slides rendered; Test passed. No overflow detected.
```

The historical GitHub runs `29693848682` and `29694280002` are cited only as
quality/deployment context in the staging evidence. They predate the final
SQL-aware smoke merge and are not used as proof of the current six-check gate.
