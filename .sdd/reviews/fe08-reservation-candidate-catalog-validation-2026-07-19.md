# FE08 Reservation Candidate Catalog Validation - 2026-07-19

## Decision

- Method: Hybrid SDD+ADD at Full depth. SDD covers the member-only API, physical `CopyId` contract, SQL projection, authorization, privacy, and pagination Core; ADD covers the reversible frontend catalog migration and browser evidence.
- Scope: FE08-T035 through FE08-T039 and TD-028.
- Human decision: the requestor approved `TD-028 - Option A` and the written FE08 design on 2026-07-19.
- Integration state: implementation and automated validation are complete on `feat/full-reconciliation`; final H3, merge, and post-merge `main` CI remain open.

## Contract Evidence

- `GET /api/reservations/candidates` is member-only and returns `{ data, pagination }`.
- Each row contains exactly `copyId`, `bookId`, `title`, nullable `authorName`, `copyStatus`, and `activeReservationCount`.
- SQL returns only active-book copies with `BORROWED` or `RESERVED` status, orders by title/book/copy ID, and applies parameterized `q`, `page`, and `limit`.
- Barcode, location, owner, email, timestamps, version, and staff metadata are not returned.
- `POST /api/reservations` remains the authoritative mutation and still accepts physical `copyId`; no schema migration or `DEMO_RESERVABLE` fallback remains.

## Fresh Validation

| Gate | Command / check | Result |
| --- | --- | --- |
| Focused backend | FE08 reservation route/candidate contract tests | 23/23 passed |
| FE08 SQL | `npm.cmd --prefix backend test -- --runInBand --testMatch "**/reservationCandidates.sqltest.js"` | 2/2 passed |
| Aggregate Live SQL | `npm.cmd --prefix backend test -- --runInBand --testMatch "**/*.sqltest.js"` | 9/9 suites, 63/63 tests passed |
| SQL schema/migrations | Canonical baseline plus five migrations, applied twice to disposable SQL Server | Pass; both migration passes succeeded |
| SQL connectivity | TCP SQL-auth `sqlcmd` and direct Node `mssql` probe | Pass |
| SQL cleanup | Disposable database/login checked in `finally` | `DB_CLEAN`; `LOGIN_CLEAN` |
| Full backend | `npm.cmd --prefix backend test` | 52/52 suites, 896/896 tests passed |
| Backend coverage | `npm.cmd --prefix backend run test:coverage:ci` | 92.68% statements, 81.66% branches, 96.59% functions, 92.61% lines |
| Frontend | `npm.cmd --prefix frontend test` | 147/147 passed |
| Frontend quality | `npm.cmd --prefix frontend run lint`; `npm.cmd --prefix frontend run build` | Pass; existing Vite chunk warning is non-blocking |
| System integration | `npm.cmd --prefix backend run test:integration:system` | 10/10 passed |
| Deployment | `npm.cmd run test:deployment` | 7/7 passed |
| Traceability | `npm.cmd run trace:enforce` | FE01-FE12 100%; FE08 29/29 |
| API/import safety | OpenAPI parse and backend import checks | `OPENAPI_PARSE_OK`; `BACKEND_IMPORT_OK` |
| Dependency safety | Root/backend/frontend production audits | 0 vulnerabilities |
| Focused browser | `tests/e2e/fe08-reservation-candidate-catalog.spec.js` | 1/1 passed |
| Full browser | Playwright with `E2E_FRONTEND_URL=http://127.0.0.1:4185` and `E2E_BACKEND_URL=http://127.0.0.1:3101` | 4/4 passed |

## Validation Layers

1. **L1 Automated:** backend, coverage, frontend, lint/build, integration, deployment, SQL, traceability, safety, and Playwright gates pass.
2. **L2 Spec compliance:** FR-FE08-029, AC-FE08-015/016, NFR-FE08-SEC-004, and NFR-FE08-PERF-003 map through SPEC, PLAN, TASKS, implementation, and tests.
3. **L3 Constitution/safety:** approved Node/Express/React/SQL Server stack is preserved; server RBAC and validation are enforced; SQL is parameterized; synthetic credentials are process-local; no secrets or PII are committed.
4. **L4 Acceptance:** focused FE08 browser evidence proves candidate search, safe payload, real numeric `copyId` mutation, canonical refresh, and mobile overflow behavior; the broader human walkthrough is still required.

## Defect Found During Validation

The first aggregate SQL run exposed a fixture-isolation issue: the canonical baseline contains a borrowed copy, so an unscoped candidate query added that baseline row to the synthetic expected list. The production contract correctly returns all eligible candidates. The SQL test now scopes its first assertion by the generated `seed.key`, preserving server search and deterministic ordering without mutating baseline data.

## Residual Gates

- Decision Gate B / H3 human integration review remains unchecked in the full acceptance packet.
- PR publication and CI association are complete: PR #40 / CI run `29682997784` passed on head `ed7376f`. Merge approval, human H3, and exact post-merge `main` CI evidence remain required before the project goal can be marked complete.
