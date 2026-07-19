# Phase 3 Staging Evidence - 2026-07-19

## Decision

Current deployment status: **PASS WITH EXPLICIT ACCEPTANCE BOUNDARIES**.

The public frontend, backend runtime, SQL-backed catalog, strict CORS,
anonymous protected-route rejection, authenticated role flows, and real SMTP
inbox delivery are observed. Evidence is limited to the recorded live run and
does not retain credentials, tokens, message bodies, or provider secrets.

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

Post-merge workflow `29696612260` ran from merge commit `4d02fc423c2fc06374d71ec945b7593dfd10c7e6` and passed its quality gate, backend deploy, frontend deploy, and six-check `smoke-test` job. This is the current SQL-aware staging acceptance evidence.

## Authenticated Azure and SMTP observation

Final live observation run: `c6e0c46421f0`.

| Scenario | Observed result | Status |
| --- | --- | --- |
| Role login | Synthetic Admin, Member, and Librarian logins completed. | PASS |
| Role verification | `/api/auth/me` returned the expected role for each login. | PASS |
| Member protected read | Member borrowing-history endpoint returned the protected response. | PASS |
| Librarian protected read | Librarian queue endpoint returned the protected response. | PASS |
| Borrow lifecycle | Member request, Librarian approval, and Librarian return completed. | PASS |
| SMTP notification | Notification `8` reached `SENT` in one attempt; 2 processed and 0 failed. | PASS |
| Provider acceptance | SMTP provider accepted the delivery. | PASS |
| Inbox observation | Gmail IMAP search observed the message (`MESSAGE_SEARCHED`). | PASS |

The SMTP investigation found a malformed `SMTP_USER` configuration shape with
two `@` characters. The App Service setting was corrected to the valid sender
address already configured as `MAIL_FROM`, then the app was restarted and
health was rechecked. No email address, password, OTP, token, message body,
or connection string is recorded here.

The run used ephemeral synthetic fixtures. Final cleanup verification returned
`AuthFixtures=0`, `BookFixtures=0`, and `NotificationFixtures=0`; all temporary
`phase3-live-observation*` SQL firewall rules were deleted.

## Acceptance boundaries

| Boundary | Status | Reason |
| --- | --- | --- |
| Public frontend/backend/SQL | PASS | Observed by the six-check read-only smoke run. |
| Strict CORS | PASS | Exact staging frontend allowed; untrusted origin blocked. |
| Anonymous protected route | PASS | `/api/auth/me` returned `401`. |
| Authenticated Azure golden path | PASS | Live run `c6e0c46421f0` verified role login, protected reads, borrow request, approval, and return. |
| Real SMTP inbox delivery | PASS | Notification `8` was `SENT`; provider acceptance and Gmail IMAP message search were observed. |
| Durable avatar storage | LIMITATION | App Service filesystem is not production-durable storage. |
| Production SLA | OUT OF SCOPE | Student-credit staging has no production availability commitment. |

## Post-merge workflow

| Workflow | Commit | Result |
| --- | --- | --- |
| `deploy-staging.yml` run `29696612260` | `4d02fc4` | PASS: quality gate, backend deploy, frontend deploy, and SQL-aware six-check smoke. |
