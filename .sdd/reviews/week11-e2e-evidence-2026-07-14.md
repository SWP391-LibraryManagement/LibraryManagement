# Week 11 Browser E2E Evidence - 2026-07-14

Branch: `test/week11-quality-sprint`

## Scope

`E2E-SYS-001` proves one critical hybrid journey against the real React frontend and production-aligned services:

```text
Member browser login
  -> FE07 browser borrow request
  -> Librarian browser login and approval
  -> FE07 browser overdue return
  -> FE09 calculate and paid through Playwright API context
  -> FE12 browser borrowing report
```

The FE09 step is intentionally API-level because `FineManagement.jsx` remains a local prototype. This evidence does not claim full FE09 browser coverage.

## Architecture Boundary

- Frontend: Vite on `127.0.0.1:4173`.
- Backend: localhost-only Node HTTP host on `127.0.0.1:3100`.
- Business services: existing production-aligned service factories from `makeSystemIntegrationApp()`.
- Data: in-memory repositories with runtime-generated users and passwords.
- Controls: `/__e2e__/*` exists only in `tests/e2e/support/systemTestServer.js` and is not mounted by the production app.

## Red-Green Evidence

1. Initial test run failed with `ECONNREFUSED 127.0.0.1:3100`, confirming the test required the missing E2E host.
2. The first integrated run reached the librarian page and exposed an ambiguous `Pending` locator.
3. The second run reached return processing and exposed an ambiguous `14 ngay` locator.
4. Locators were scoped to their table/panel containers; no production behavior was changed for those failures.
5. Browser output then exposed a real MUI compatibility warning caused by legacy `InputProps`; a frontend regression test was added before migrating to `slotProps`.

## Passing Evidence

```powershell
npm.cmd --prefix frontend test
npm.cmd run test:e2e
```

Observed results:

- Frontend: 38 tests passed.
- Playwright Chromium: 1 test passed in 17.6 seconds during the final quality gate.
- Desktop viewport: report rendered the completed request/detail state with no incoherent overlap.
- Mobile viewport `390x844`: no horizontal overflow; filters and KPI cards remained readable.
- Browser console after the MUI fix: no React `InputProps` error. SMTP-not-configured and `NO_COLOR` messages remained test-environment advisories.

## Artifact Policy

Screenshots, traces, videos, `playwright-report/`, and `test-results/` are ignored. Failure artifacts remain local and are not committed. CI installs Chromium and runs `npm run test:e2e`.
