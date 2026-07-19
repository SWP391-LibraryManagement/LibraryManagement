# Phase 3 Final Validation - 2026-07-19

Validation commit: `80d81e4`

## Decision

Phase 3 is **integrated and validated** on `main` at merge commit `4d02fc4`.
The package satisfies the four Hybrid SDD validation layers for the observed
scope. Authenticated Azure acceptance, real SMTP inbox delivery, durable avatar
storage, shared SQL CI, and production SLA remain explicit residual boundaries;
none is marked as passed by inference.

## L1 - Automated checks

All commands below were run in the isolated Phase 3 worktree.

| Command | Result |
| --- | --- |
| `npm.cmd run trace:enforce` | PASS; 12/12 features, 100% FR coverage, zero below threshold. |
| `npm.cmd run test:deployment` | PASS; 8/8 deployment utility tests. |
| `npm.cmd --prefix backend run test:coverage:ci` | PASS; 916 tests, 53 suites; statements 92.68%, branches 81.66%, functions 96.59%, lines 92.61%. |
| `npm.cmd --prefix backend run test:integration:system` | PASS; 10/10 system integration tests. |
| `npm.cmd --prefix frontend test` | PASS; 151/151 tests. |
| `npm.cmd --prefix frontend run lint` | PASS. |
| `npm.cmd --prefix frontend run build` | PASS; 57 JS assets, 320,688-byte entry, no entry-chunk warning. |
| `E2E_FRONTEND_PORT=4273 E2E_BACKEND_PORT=3200 E2E_FRONTEND_URL=http://127.0.0.1:4273 E2E_BACKEND_URL=http://127.0.0.1:3200 npm.cmd run test:e2e` | PASS; 4/4 Playwright tests in 24.4 seconds. |
| `npm.cmd run phase3:performance` | PASS; login p95 66.95 ms, `/auth/me` p95 1.45 ms, bcrypt cost 10. |
| `npm.cmd run smoke:staging` with observed staging URLs | PASS; frontend, health, SQL catalog, allowed CORS, blocked CORS, protected route. |
| `git diff --check` | PASS; no whitespace errors. |

The placeholder/secret scan returned only the scan command itself and
historical setup-plan examples such as `JWT_SECRET=<App Service secret>`;
there are no committed secret values or untracked release URL placeholders in
the Phase 3 deliverables.

## L2 - Spec and traceability

- Phase 3 preserves the accepted FE01-FE12 contracts; no new business rule or
  role permission was introduced.
- The FE05 migration correction is covered by RED-GREEN tests and is documented
  in `docs/release/phase3-staging-evidence-2026-07-19.md`.
- Route-level lazy loading is covered by frontend contract tests and leaves
  route guards, API clients, and authorization boundaries in the entry module.
- Deliverables map to the Phase 3 design/plan, performance report, user-testing
  record, defense deck/source record, and this validation packet.

## L3 - Constitution and safety

- Approved stack remains Node.js + Express.js, React + Bootstrap, SQL Server,
  and REST APIs.
- No secrets, tokens, raw OTPs, database passwords, SMTP bodies, or real PII
  are present in tracked Phase 3 evidence.
- Temporary Azure SQL operator firewall access was removed and the connection
  policy was restored to `Default` after diagnosis.
- Public staging smoke verifies exact allowed CORS and rejection of an
  untrusted origin; anonymous protected access returns a safe `401` envelope.
- App Service `TRUST_PROXY=true` is documented as non-secret configuration for
  correct HTTPS enforcement behind Azure's proxy.

## L4 - Acceptance verification

Observed acceptance is intentionally split by evidence boundary:

| Acceptance item | Status | Evidence |
| --- | --- | --- |
| Public frontend and backend | PASS | Independent six-check staging smoke. |
| SQL-backed public catalog | PASS | `/api/books?page=1&limit=1` returned the canonical envelope after five migrations ran twice. |
| Strict CORS | PASS | Exact staging origin allowed; untrusted origin blocked. |
| Anonymous protected route | PASS | `/api/auth/me` returned `401`. |
| Synthetic local authenticated golden path | PASS | 4/4 Playwright suites; login -> borrow -> approve -> return -> fine -> report. |
| Responsive layout evidence | PASS | Desktop/mobile screenshots and no horizontal overflow assertion. |
| Authenticated Azure Member/Librarian flow | NOT OBSERVED | No safe staging credential was created or disclosed. |
| Real SMTP inbox delivery | NOT OBSERVED | Provider delivery was not executed. |
| Durable avatar storage | LIMITATION | App Service filesystem is not production-durable storage. |
| Shared SQL CI | LIMITATION | CI does not provide a disposable SQL Server service. |
| Production SLA | OUT OF SCOPE | Student-credit staging environment only. |

## Reproducibility and artifacts

- Staging endpoints and SQL diagnosis: `docs/release/phase3-staging-evidence-2026-07-19.md`.
- Performance measurements: `docs/performance/phase3-performance-report-2026-07-19.md`.
- User testing and rehearsal: `docs/release/phase3-user-testing-record-2026-07-19.md` and `docs/testing/system-integration-demo-runbook.md`.
- Final narrative and timed path: `docs/release/phase3-final-report.md` and `docs/release/phase3-rehearsal-record.md`.
- Presentation and claim sources: `docs/presentation/phase3-defense-deck.pptx` and `docs/presentation/phase3-defense-deck-source.md`.
- Render QA: 10 slides rendered; `slides_test.py` reported `Test passed. No overflow detected.`

## Integration gate

The branch was merged as PR #48. Post-merge `main` CI run `29696519912` passed,
and fresh staging workflow `29696612260` passed the quality gate, both deploys,
and the current six-check SQL-aware smoke. Historical run `29694280002` remains
context only because it predates the SQL-aware smoke assertion.
