# Phase 3 Staging Evidence - 2026-07-19

## Decision

Current deployment status: **PASS WITH EXPLICIT ACCEPTANCE BOUNDARIES**.

The public frontend, backend runtime, SQL-backed catalog, strict CORS, and
anonymous protected-route rejection are observed. Authenticated live-user
flows and real SMTP inbox delivery are not claimed by this record.

## Deployed baseline

| Item | Observed value |
| --- | --- |
| Source commit | `64831fea844d8bd0554520fe9466f865d7f11d22` |
| Frontend | `https://lemon-wave-04db51100.7.azurestaticapps.net` |
| Backend | `https://app-library-api-staging-nhat714.azurewebsites.net` |
| Backend health | `https://app-library-api-staging-nhat714.azurewebsites.net/health` |
| SQL database | `LibraryManagementStaging` on `sql-library-staging-ea-nhat714` |
| GitHub environment | `staging` |

GitHub environment configuration was inspected by name only. The required
deployment secrets exist, and the environment defines `AZURE_WEBAPP_NAME`,
`STAGING_API_URL`, and `STAGING_FRONTEND_URL`. No secret value was printed or
written to this record.

## CI/CD evidence

| Run | Result | Meaning |
| --- | --- | --- |
| `29693848682` | Quality/deploy PASS; smoke FAIL | The first current-main run reached the backend during App Service restart and observed `503`. After warm-up, `/health` returned `200`. |
| `29694280002` | PASS | Current-main quality gate, backend deploy, frontend deploy, browser E2E, deployment utilities, and the original five-check smoke gate passed. |

The first run also exposed missing `TRUST_PROXY=true`: production HTTPS auth
requests were interpreted as the internal HTTP proxy hop and returned
`400 HTTPS_REQUIRED`. The App Service setting was added, the app restarted, and
an anonymous `GET /api/auth/me` then returned the required safe `401` envelope.

## Live SQL diagnosis and correction

The original smoke script checked `/health`, which does not query SQL. A new
test-first smoke check now reads `/api/books?page=1&limit=1` and validates the
public list envelope.

That check initially returned `500`. The evidence chain was:

1. Azure SQL resource status was `Online`; the database contained 20 tables.
2. A temporary operator firewall rule allowed a direct non-secret query using
   the App Service settings; it returned `LibraryManagementStaging`, 20 tables,
   and was removed immediately afterward.
3. Running the production FE05 public catalog query against the same database
   reproduced SQL error 207: `Books.RowVersion` was missing.
4. The existing FE05 migration then reproduced SQL error 4922 because the
   legacy filtered ISBN index depended on the column being narrowed.
5. The migration was corrected through RED-GREEN coverage to drop/recreate
   `UX_Books_ISBN_NotNull` in the same transaction.
6. All five approved reconciliation migrations ran twice successfully in this
   order: FE04, FE05, FE06, FE10, FE11.

Post-migration validation returned:

```text
DatabaseName=LibraryManagementStaging
TableCount=20
Books.RowVersion=8 bytes
BookCopies.Version=8 bytes
Users.DeactivatedAt=8 bytes
UserProfiles.Department=200 bytes
UserProfiles.Specialization=200 bytes
Notifications.RecipientEmail=510 bytes
```

The temporary operator firewall rule was removed. The SQL connection policy
was restored to `Default` after a diagnostic `Proxy` experiment did not affect
the schema error.

## Independent staging smoke

Command:

```powershell
$env:STAGING_FRONTEND_URL='https://lemon-wave-04db51100.7.azurestaticapps.net'
$env:STAGING_API_URL='https://app-library-api-staging-nhat714.azurewebsites.net'
npm.cmd run smoke:staging
```

Observed result after migration: **PASS**.

```text
frontend
health
sql-catalog
allowed-cors
blocked-cors
protected-route
```

The six-check version exists on `docs/phase3-polish-delivery` and must pass in
the post-merge staging workflow before Phase 3 closeout.

## Acceptance boundaries

| Boundary | Status | Reason |
| --- | --- | --- |
| Public frontend/backend/SQL | PASS | Observed by the six-check read-only smoke run. |
| Strict CORS | PASS | Exact staging frontend allowed; untrusted origin blocked. |
| Anonymous protected route | PASS | `/api/auth/me` returned `401`. |
| Authenticated Azure golden path | NOT OBSERVED | No safe staging member/librarian credential was created or disclosed for this run. |
| Real SMTP inbox delivery | NOT OBSERVED | Provider delivery was not executed; settings existence is not delivery evidence. |
| Durable avatar storage | LIMITATION | App Service filesystem is not production-durable storage. |
| Production SLA | OUT OF SCOPE | Student-credit staging has no production availability commitment. |
