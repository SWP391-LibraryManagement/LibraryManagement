# Week 12 Security Audit Evidence

**Date:** 2026-07-14
**Branch:** `test/week11-quality-sprint`
**Scope:** production dependencies, tracked secrets, protected routes, server-side validation,
safe 5xx responses, notification payloads, CORS, and SQL query construction.

## 1. Result

**PASS:** no unresolved Critical or High production vulnerability remains after the fixes below.
The remaining Medium/Low risks are recorded in Section 7 with an owner and follow-up action.

## 2. Production Dependency Audit

| Workspace | Production dependencies | Initial result | Final result |
| --- | ---: | --- | --- |
| Root | 2 | 0 vulnerabilities | 0 vulnerabilities |
| Backend | 166 | 0 vulnerabilities | 0 vulnerabilities |
| Frontend | 115 | 1 High: `form-data` CRLF injection | 0 vulnerabilities |

The frontend finding was indirect: `axios@1.17.0 -> form-data@4.0.5`. Axios maps its Node HTTP
adapter and Node FormData implementation out of the browser build, so the affected code was not
reachable from the Vite browser bundle. The High finding was still removed because the Week 12
gate does not accept an unpatched production dependency. `frontend/package-lock.json` now resolves
the existing compatible range to `form-data@4.0.6`; no direct dependency or forced major update was
added.

Commands:

```powershell
npm.cmd audit --omit=dev --json
npm.cmd --prefix backend audit --omit=dev --json
npm.cmd --prefix frontend audit --omit=dev --json
npm.cmd --prefix frontend ls axios form-data --all
```

## 3. Secret And Credential Scan

- Current tracked files: no private key, AWS key, GitHub token, Slack token, or JWT-shaped value.
- Git history: no high-confidence secret pattern and no tracked `.env`, PEM, key, P12/PFX, or
  credential file path.
- `.gitignore` covers `.env`, `.env.*`, `*.secret`, `secrets/`, and `credentials/`.
- The broader assignment scan found 34 password/token-looking strings. Every match was a redacted
  synthetic test fixture under `backend/tests/` or an example in the system integration plan; no
  production credential or real personal data was identified.

The scan reported only file, line, and finding type. It did not print local `.env` values.

## 4. RBAC And Validation Inventory

| Area | Observed server-side control |
| --- | --- |
| FE02 Auth | `express-validator` on auth inputs; Bearer authentication on protected endpoints; account lockout and token expiry checks in the service. |
| FE03 Profile | Authentication on all routes; service rejects protected fields, validates lengths/dates/URLs, and verifies avatar MIME, extension, size, and file signature. |
| FE05 Books | Public browse/detail only; management endpoints require Librarian/Admin; service normalizes IDs, text, URLs, status, pagination, and references. |
| FE06 Inventory | Librarian/Admin middleware plus route validators for IDs, filters, barcode, status, location, page, and limit. |
| FE07 Borrowing | Member or staff middleware per action plus route validators; service repeats role and business-rule checks. |
| FE08 Reservation | Member/staff middleware per action plus route validators for IDs, status, reason, and queue processing. |
| FE09 Fines | Authentication on all routes; service enforces owner/staff/admin authorization and validates IDs, amounts, payment state, and resolution reason. |
| FE10 Notification | Librarian/Admin middleware, route and service-boundary validation, canonical template allowlist, safe payload persistence, and safe provider failures. |
| FE11 User/Admin | Admin middleware on every route; service validates IDs, role/status changes, text, pagination, and active-borrowing constraints. |
| FE12 Reports | Librarian/Admin middleware and route validators for dates, IDs, status, role, and membership filters. |

Repository review found SQL values passed through `mssql.Request.input`. Dynamic SQL fragments are
fixed clauses or identifiers selected from code-owned allowlists, such as the admin resource map;
no user-controlled value was concatenated into a query.

## 5. Findings Closed

| ID | Severity | Finding | Remediation and evidence |
| --- | --- | --- | --- |
| W12-DEP-001 | High | Frontend lockfile resolved vulnerable `form-data@4.0.5`. | Updated only the transitive lock entry to 4.0.6; frontend production audit now reports zero vulnerabilities. |
| W12-AUTH-001 | High | Book, admin, and user-management routes granted synthetic privileged users whenever `NODE_ENV` was unset or non-production. A bare `npm start` therefore risked unauthenticated privileged access. | Removed all implicit development bypasses; protected routes now always run authentication and RBAC middleware. Three regression tests cover unset `NODE_ENV`. |
| W12-ERR-001 | Medium | A 5xx error carrying a `details` property returned that internal object to the client. | Error details are now included only below status 500; regression test verifies the exact generic 5xx envelope. |
| W12-CORS-001 | Medium | Production used unrestricted `cors()` and returned `Access-Control-Allow-Origin: *`. | Production now uses the comma-separated `CORS_ORIGINS` allowlist and fails closed for unconfigured cross-origin requests; same-origin and local development behavior remains available. Two regression tests cover allowed and rejected origins. |

## 6. Safe Error And Notification Evidence

- Unknown and internal 5xx responses return only `INTERNAL_ERROR` and `Internal server error.`;
  stack traces and internal details are not returned to clients.
- Notification HTTP responses expose only IDs, status, and aggregate counts.
- Sensitive verification/reset notification records persist `title: null`, `body: null`, and
  `safePayload: { redacted: true }`; idempotency values are HMAC-derived.
- Non-sensitive queued payload strings are sanitized, sensitive nested keys are rejected, and
  provider failures persist the fixed message `Notification delivery failed.`.
- The security-focused Jest run passed 135/135 tests across auth, fine authorization,
  notification safety, user-management authorization, and the new security regressions.

## 7. Accepted Medium/Low Risks

| ID | Severity | Accepted risk | Owner | Follow-up |
| --- | --- | --- | --- | --- |
| W12-RISK-001 | Medium | Access and refresh tokens are stored in `localStorage` or `sessionStorage`, so a future XSS defect could expose them. The current ADR leaves client storage to the frontend plan. | FE02/frontend team (Nhật coordinates) | Before public deployment, move refresh tokens to Secure, HttpOnly, SameSite cookies and keep short-lived access tokens in memory where practical. |
| W12-RISK-002 | Medium | HTTPS enforcement is delegated to the deployment environment; this repository does not include a production reverse-proxy/TLS policy. | Deployment owner / team lead | Require HTTPS at the hosting proxy, configure trusted proxy headers, and verify HTTP redirect/rejection before release. |
| W12-RISK-003 | Medium | Account lockout exists, but there is no explicit per-IP login rate-limit middleware. | FE02 backend owner | Add and test an IP/user rate limiter before exposing login to the public internet. |
| W12-RISK-004 | Low | Swagger UI is available without authentication and reveals API metadata. | Backend owner | Disable or restrict `/api-docs` in production if the deployment does not intend public API documentation. |

## 8. Human Review Checklist

- Confirm removing the implicit development auth bypass is acceptable for all local workflows.
- Confirm production frontend origins are listed in `CORS_ORIGINS` when frontend/backend are hosted
  separately.
- Confirm the accepted risks and owners in Section 7 with the team lead before a public release.
- Review `backend/tests/securityRegression.test.js` and the one-entry frontend lockfile update.

## 9. Final Quality Gate

| Check | Observed result |
| --- | --- |
| Backend Jest | PASS: 307/307 tests, 24/24 suites |
| Backend coverage gate | PASS: statements 93.02%, branches 83.22%, functions 96.37%, lines 92.94% |
| SQL system integration | PASS: 1/1 mutation-gated orchestration test against the explicit local SQL environment |
| Frontend tests | PASS: 38/38 |
| Frontend lint | PASS |
| Frontend production build | PASS: 14,327 modules; existing 952.62 kB chunk-size advisory only |
| Playwright Chromium | PASS: 1/1 golden path in 17.6 seconds |
| Traceability enforcement | PASS: 6 implemented features, none below 70% |
| Generated/local artifacts | PASS: coverage, frontend dist, Playwright reports/results, and local `.env` are ignored and untracked |
| Git whitespace check | PASS: `git diff --check` exited 0 |
