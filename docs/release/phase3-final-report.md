# Phase 3 Final Report - Polish and Delivery

Date: 2026-07-19  
Branch: `docs/phase3-polish-delivery`  
Decision: **Integrated on `main`**

## Scope

Phase 3 hardens and demonstrates the accepted FE01-FE12 release without adding
new business scope. Work covered Azure staging evidence, Live SQL reconciliation,
frontend performance polish, synthetic browser rehearsal, release documentation,
and a source-linked defense deck.

Integration evidence: PR #48 merged as `4d02fc4`; post-merge `main` CI
`29696519912` passed; staging workflow `29696612260` passed its quality gate,
both deployments, and the SQL-aware six-check smoke.

At the time of this report, `v1.0.2` was the next canonical source release.
It is now published at `c988af1`; `main@cce59d0` is the validated post-release
application baseline after PR #57/#58, not a pre-authorized `v1.0.3` release
SHA. Any future `v1.0.3` must use the later reviewed post-reconciliation `main`
SHA after H2, H3, and exact post-merge CI.

## Architecture and traceability

The approved Node.js/Express, React/Bootstrap, SQL Server, and REST stack is
unchanged. Runtime boundaries are React on Azure Static Web Apps, Express on
Azure App Service, and Azure SQL. The historical PR #48 snapshot recorded all
12 feature packages at 100% FR traceability; the 2026-08-02 closeout refresh
below supersedes that count. Route guards and backend authorization remain authoritative.

## Evidence summary

The table below preserves the historical PR #48 Phase 3 snapshot. Its 916
backend and 151 frontend test counts are not the current reconciliation totals.

| Area | Observed result |
| --- | --- |
| Backend quality | 916 tests across 53 suites; coverage statements 92.68%, branches 81.66%, functions 96.59%, lines 92.61%. |
| Frontend quality | 151 tests, lint pass, production build pass. |
| Deployment utilities | 8/8 tests pass. |
| System integration | 10/10 tests pass. |
| Browser rehearsal | 4/4 Playwright flows pass in 24.4 seconds on custom ports. |
| Frontend bundle | Initial entry reduced from 999,203 to 320,688 bytes (-67.9%); 57 route-level assets. |
| Local auth timing | Login p95 66.95 ms; `/auth/me` p95 1.45 ms with bcrypt cost 10. |
| Azure staging | Frontend, health, SQL catalog, exact CORS allow/deny, and anonymous protected-route checks pass. |
| Authenticated Azure | Live run `c6e0c46421f0` passed Admin/Member/Librarian login, protected reads, borrow request, approval, and return. |
| SMTP delivery | Notification `8` was `SENT` in one attempt; provider acceptance and Gmail IMAP message search passed. |

## Full-project closeout refresh — 2026-08-02

The current pre-batch baseline is `main@161cc28ddd8fed522a90d8bcbcd0daf6b0e51b27` after PR #97. CI `30726791185` and staging deployment `30726924615` pass for that exact SHA. The staging smoke covers frontend, health, schema readiness, SQL catalog, allowed and blocked CORS, and an anonymous protected route.

The enforced traceability baseline passes while preserving implementation truth: FE02 is `PARTIAL` at 27/27 FR tags, FE04 is `PARTIAL` at 14/14, FE11 is `PARTIAL` at 35/43, and the other nine feature packages are `COMPLETE` at 100%. PR #95 already proves FE02-T067, FE05-T019, and FE11-CAT01; PR A publishes only those bounded documentation closeouts.

The remaining work is governed by the approved four-PR design: PR B FE11 Core, PR C FE04 acceptance and FE02 reconciliation, and PR D final integration/release evidence. `v1.0.3` is not authorized by this interim report. Demonstration video is `WAIVED — NOT REQUIRED` by Nhat on 2026-08-02; no link or artifact will be fabricated.

Historical localized desktop/mobile acceptance passed on 2026-07-21. The later responsive corrections are integrated in the current pre-batch candidate and covered by its exact CI/deployment evidence, but they remain outside published `v1.0.2` until the final closeout release decision.

## Live SQL and migration result

The SQL-aware smoke exposed missing `Books.RowVersion` and a filtered ISBN
index dependency in the FE05 migration. The migration now drops and recreates
the filtered index in the same transaction. FE04, FE05, FE06, FE10, and FE11
migrations ran twice against `LibraryManagementStaging`; 20 tables and the
required rowversion/width columns were validated. The temporary firewall rule
was removed and SQL connection policy restored to `Default`.

## Acceptance boundaries

The public staging surface, authenticated Azure role flow, and real SMTP inbox
delivery are observed as passing. The live run used ephemeral synthetic
fixtures; cleanup returned zero auth, book, and notification fixtures. Durable
avatar storage, shared SQL CI, and production SLA remain documented
limitations.

The SMTP issue was traced to a malformed `SMTP_USER` configuration shape. The
App Service setting was corrected to the valid `MAIL_FROM` address and the app
was restarted; no credential or message content is included in this report.

## Reproduction commands

```powershell
npm.cmd run trace:enforce
npm.cmd run test:deployment
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix backend run test:integration:system
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
$env:E2E_FRONTEND_PORT='4273'; $env:E2E_BACKEND_PORT='3200'
$env:E2E_FRONTEND_URL='http://127.0.0.1:4273'; $env:E2E_BACKEND_URL='http://127.0.0.1:3200'
npm.cmd run test:e2e
npm.cmd run phase3:performance
$env:STAGING_FRONTEND_URL='https://lemon-wave-04db51100.7.azurestaticapps.net'
$env:STAGING_API_URL='https://app-library-api-staging-nhat714.azurewebsites.net'
npm.cmd run smoke:staging
```

## Delivery artifacts

- Staging and SQL evidence: `docs/release/phase3-staging-evidence-2026-07-19.md`.
- Performance report: `docs/performance/phase3-performance-report-2026-07-19.md`.
- User testing record: `docs/release/phase3-user-testing-record-2026-07-19.md`.
- Rehearsal record: `docs/release/phase3-rehearsal-record.md`.
- Defense deck and source record: `docs/presentation/phase3-defense-deck.pptx` and `docs/presentation/phase3-defense-deck-source.md`.
- Vietnamese project presentation briefing: `docs/briefing-thuyet-trinh-du-an-vi.docx`.
- Four-layer validation: `.sdd/reviews/phase3-final-validation-2026-07-19.md`.
