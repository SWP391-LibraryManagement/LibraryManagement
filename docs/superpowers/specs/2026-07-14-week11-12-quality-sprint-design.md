# Week 11-12 Quality Sprint Design

## Goal

Complete the next playbook quality gates after system integration: measurable coverage, focused gap closure, an enforced coverage threshold, one critical browser journey, and a recorded security audit.

## Scope

The sprint covers completed production-aligned modules FE07 Borrowing, FE08 Reservation, FE10 Notification, and FE12 Reporting, plus the FE09 server-side fine handoff used by the integrated journey.

The sprint does not add new business behavior, redesign pages, align the legacy FE09 frontend, change the SQL schema, or introduce production-only test endpoints.

## Approach

### Coverage

Use the existing Jest coverage scope in `backend/package.json` as the authoritative Week 11 module set. Generate a baseline, identify uncovered branches/functions by file, add spec-traceable tests for meaningful gaps, then enforce at least 80 percent for statements, branches, functions, and lines.

Coverage evidence is recorded separately from generated `backend/coverage/` artifacts. Generated HTML/LCOV output remains untracked.

### Browser E2E

Add Playwright at the repository root. A test-only Express host starts the existing `makeSystemIntegrationApp()` services and in-memory repositories. The host exposes control endpoints under `/__e2e__` before mounting the production app; these endpoints seed runtime-generated accounts, make the selected loan overdue, synchronize the FE07 return into FE09 input state, and expose non-sensitive IDs needed by the test.

The browser journey uses the real React frontend for:

1. Member login.
2. Borrow request creation.
3. Librarian login and approval.
4. Librarian return processing.
5. FE12 borrowing report display.

Playwright's API context performs FE09 calculate and paid transitions because the current `FineManagement.jsx` remains a local prototype. The test must state this boundary and must not claim full FE09 UI coverage.

The E2E server is reachable only on localhost during tests. It uses runtime-generated passwords and synthetic `example.test` emails. No credential is committed.

### Security Audit

Run production dependency audits for root, backend, and frontend; inspect any Critical/High finding before changing dependencies. Review tracked files for credential patterns, confirm protected route middleware and validator coverage, and record accepted lower-severity risks with owner/action.

Security fixes are limited to verified Critical/High blockers or minimal dependency updates that preserve the approved stack. No blanket `npm audit fix --force` is allowed.

## Evidence

Create:

- `.sdd/reviews/week11-coverage-evidence-2026-07-14.md`
- `.sdd/reviews/week12-security-audit-2026-07-14.md`
- `tests/e2e/system-golden-path.spec.js`
- Playwright HTML/report artifacts under ignored output directories.

CI runs the coverage gate and Playwright Chromium journey. The SQL mutation suite remains local-only because CI has no disposable SQL Server service.

## Success Criteria

- Coverage for the configured completed backend modules is at least 80 percent for statements, branches, functions, and lines.
- Coverage thresholds run in CI and block regression.
- The Playwright golden path passes on Chromium and produces trace/screenshot artifacts on failure.
- No Critical/High production dependency vulnerability remains undocumented.
- Secret, RBAC, validation, and safe-error checks are recorded with concrete commands and findings.
- Existing backend, frontend, SQL integration, lint, build, and traceability gates remain green.
