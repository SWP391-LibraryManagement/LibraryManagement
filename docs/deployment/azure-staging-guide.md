# Azure Staging Deployment Guide

## Purpose

This guide deploys the Week 13 release candidate to Azure for Students using separate frontend,
backend, and database resources. It is a staging deployment, not a production deployment.

The operator must stop before creating or resizing any resource that is not clearly covered by a
free allowance or the approved Azure for Students credit.

## Cost Guardrails

- Use Azure Static Web Apps Free.
- Create the App Service plan with F1 Free. Do not retry with B1 or another paid SKU without explicit
  team approval.
- Create Azure SQL only after the portal pricing page shows the selected database is inside a free
  allowance or the Azure for Students credit.
- Review Azure Cost Management after provisioning and again after the first deployment.
- Delete the resource group when staging is no longer needed; deleting the resource group removes
  all resources in this guide.

## Resource Names And Regions

| Resource | Name | Region/SKU |
| --- | --- | --- |
| Resource group | `rg-library-staging` | Southeast Asia |
| App Service plan | `plan-library-staging` | Malaysia West, Linux, F1 Free |
| Backend web app | `app-library-api-staging-nhat714` | Malaysia West, Node.js 22 LTS |
| Static Web App | `swa-library-staging-nhat714` | East Asia, Free |
| SQL logical server | `sql-library-staging-ea-nhat714` | East Asia |
| SQL database | `LibraryManagementStaging` | Portal-confirmed free/student-credit configuration |
| SQL administrator | `libraryadmin` | Password entered privately by the operator |

Azure resource names such as the web app and SQL server are globally unique. If Azure reports that
one of the names is unavailable, stop and record the alternative suffix before changing workflow or
documentation values.

## Install And Sign In To Azure CLI

Azure CLI was not present during the Week 13 design check. Install and authenticate from an
interactive PowerShell terminal:

```powershell
winget install --exact --id Microsoft.AzureCLI
az login --use-device-code
az account list --output table
az account show --output table
```

Confirm the selected subscription is Azure for Students. If another subscription is selected, use:

```powershell
az account set --subscription 'Azure for Students'
az account show --output table
```

Do not continue until the correct subscription is active.

## Create Resource Group And App Service F1

```powershell
az group create --name rg-library-staging --location southeastasia

az appservice plan create `
  --name plan-library-staging `
  --resource-group rg-library-staging `
  --location malaysiawest `
  --is-linux `
  --sku F1

az webapp create `
  --name app-library-api-staging-nhat714 `
  --resource-group rg-library-staging `
  --plan plan-library-staging `
  --runtime "NODE:22-lts"

az webapp config set `
  --name app-library-api-staging-nhat714 `
  --resource-group rg-library-staging `
  --startup-file "npm start"
```

Verify the plan before continuing:

```powershell
az appservice plan show `
  --name plan-library-staging `
  --resource-group rg-library-staging `
  --query '{name:name,sku:sku.name,tier:sku.tier,kind:kind}' `
  --output table
```

Expected SKU: `F1`. Stop rather than resizing automatically.

## Create Azure Static Web Apps Free

In Azure Portal:

1. Create Static Web App `swa-library-staging-nhat714` in `rg-library-staging`.
2. Select the Free plan and East Asia.
3. Select `Other` as deployment source so the repository workflow controls deployment.
4. Record the generated `https://*.azurestaticapps.net` URL.
5. Copy the deployment token directly into the GitHub `staging` Environment secret named
   `AZURE_STATIC_WEB_APPS_API_TOKEN`.

Do not store the deployment token in a local file, shell profile, document, screenshot, or chat.

## Create Azure SQL Inside Student Credit

Use Azure Portal so the operator can review the displayed cost before creation:

1. Create SQL server `sql-library-staging-ea-nhat714` in `rg-library-staging`, East Asia. The free
   limit API rejected Malaysia West during provisioning even though the portal displayed the offer.
2. Set SQL administrator username to `libraryadmin` and generate a new staging-only password.
3. Create database `LibraryManagementStaging`.
4. On the compute/storage page, choose a free allowance when Azure offers it. Otherwise confirm the
   displayed estimate is covered by the remaining Azure for Students credit.
5. Stop if the estimate is unclear or exceeds approved credit.
6. Record only the chosen SKU and free/credit decision in deployment evidence, never the password.

## Configure Azure SQL Firewall

Get the backend outbound addresses:

```powershell
az webapp show `
  --name app-library-api-staging-nhat714 `
  --resource-group rg-library-staging `
  --query outboundIpAddresses `
  --output tsv
```

In Azure SQL Networking:

- add rules for the App Service outbound addresses;
- add the operator's current IP only while initializing or reviewing the database;
- remove the temporary operator rule when it is no longer needed;
- do not leave a `0.0.0.0` to `255.255.255.255` rule or other all-Internet range.

## Prepare And Execute The Azure-Compatible Schema

Generate the derived deployment script from the canonical schema:

```powershell
npm.cmd run schema:azure:prepare
```

The generated file is `tmp/azure/LibraryManagementStaging.sql`. It is ignored by Git and removes the
local `CREATE DATABASE` and `USE` batches while retaining application tables and constraints.

Before executing:

1. Review the generated SQL.
2. Before touching staging, execute every candidate migration twice on a specifically named,
   disposable local SQL Server database, retain the result as idempotence evidence, and remove that
   database.
3. If operator access is required, add one exact temporary firewall rule for the operator's current
   IP. Do not widen the range.
4. Confirm the connected database is `LibraryManagementStaging`.
5. Execute through Azure Query Editor, SSMS, or `sqlcmd`: use the generated schema once for an empty
   database, or execute the following operator-owned migrations once and in order for an existing
   pre-reconciliation database:

   Book Management will return the safe `INTERNAL_ERROR`/`Không thể xử lý yêu cầu` response when
   `Books.RowVersion` or the metadata `Status` columns are absent. FE10 delivery requests cannot
   enter the durable `PROCESSING` state until the notification status constraint is upgraded.
   Most SQL migrations remain operator-applied. The one documented exception is
   `2026-07-22-library-metadata-compatibility.sql`: the backend package carries this reviewed,
   idempotent script and applies it before opening the HTTP listener so legacy author, publisher,
   and category tables cannot leave the deployed Admin Library page broken.

```text
database/migrations/2026-07-19-fe04-membership-concurrency.sql
database/migrations/2026-07-19-fe05-book-rowversion.sql
database/migrations/2026-07-19-fe06-bookcopy-rowversion.sql
database/migrations/2026-07-19-fe10-otp-templates.sql
database/migrations/2026-07-19-fe11-finalization.sql
database/migrations/2026-07-22-borrow-request-workflow-columns.sql
database/migrations/2026-07-23-fe10-processing-status.sql
database/migrations/2026-07-27-fe10-personal-inbox-read-state.sql
```

Do not run `2026-07-22-library-metadata-compatibility.sql` manually. The backend startup gate owns
that one packaged migration and applies it before the HTTP listener opens.

6. Verify the target, table count, and reconciliation columns:

```sql
SELECT
  DB_NAME() AS DatabaseName,
  (SELECT COUNT(*) FROM sys.tables) AS TableCount,
  COL_LENGTH(N'dbo.Books', N'RowVersion') AS BooksRowVersionBytes,
  COL_LENGTH(N'dbo.BookCopies', N'Version') AS BookCopiesVersionBytes,
  COL_LENGTH(N'dbo.Users', N'DeactivatedAt') AS UsersDeactivatedAtBytes,
  CASE WHEN EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID(N'dbo.Notifications')
      AND name = N'CK_Notifications_Status'
      AND definition LIKE N'%PROCESSING%'
  ) THEN 1 ELSE 0 END AS NotificationProcessingAllowed;
```

Expected database: `LibraryManagementStaging`, table count `21`, and each listed reconciliation
column length `8`; `NotificationProcessingAllowed` must be `1`. CI must not execute this schema
automatically.

7. Remove the exact temporary operator firewall rule immediately after the reviewed migration and
   read-only checks. Staging must not be used to prove migration idempotence.

If deployment cannot start or reports `API schema readiness check failed with HTTP 503`, do not
remove or skip the readiness check. Inspect App Service startup logs for the safe
`Backend startup failed` message. Confirm that the configured application database principal can
alter `Authors`, `Publishers`, and `Categories`; the startup gate must add only the missing
`Status`/`CreatedAt` columns through the packaged reviewed migration. Do not expose Azure SQL to
GitHub-hosted runner IP ranges or widen the firewall.

After startup succeeds, verify `GET /health/ready` returns HTTP `200` with
`checks.catalogMetadata = "ok"`. A successful `main` CI run automatically starts the staging
workflow for that exact commit; `workflow_dispatch` remains available for an operator rerun. Both
paths are fail-closed behind the exact FE10 migration file hash stored in the GitHub `staging`
Environment. The workflow itself does not connect to SQL or execute SQL; schema reconciliation runs
inside the configured backend application identity before listen. The deployment package includes
both the catalog metadata compatibility migration and the `CHANGE_PASSWORD_OTP` token-type
compatibility migration; startup verifies both postconditions before serving requests.

### FE10 Personal Inbox Migration Gate

The FE10 inbox migration is operator-owned and must finish before either application is deployed.
Apply `database/migrations/2026-07-27-fe10-personal-inbox-read-state.sql` twice with `sqlcmd -b`.
The second execution is an idempotence check; it must not backfill notifications created after the
first execution.

1. Resolve the operator's current public IP without logging credentials.
2. Add one temporary Azure SQL firewall rule whose start and end values are that exact IP.
3. Set the target server, database, and approved operator identity in the interactive shell. Keep the
   password in a secure process environment or interactive prompt; never save it in the repository.
4. Run the migration twice, stopping on the first SQL error:

```powershell
$fe10Migration = Resolve-Path 'database/migrations/2026-07-27-fe10-personal-inbox-read-state.sql'

sqlcmd -S $env:FE10_SQL_SERVER -d $env:FE10_SQL_DATABASE `
  -U $env:FE10_SQL_USER -P $env:FE10_SQL_PASSWORD -b -i $fe10Migration
sqlcmd -S $env:FE10_SQL_SERVER -d $env:FE10_SQL_DATABASE `
  -U $env:FE10_SQL_USER -P $env:FE10_SQL_PASSWORD -b -i $fe10Migration
```

5. Query only aggregate postconditions: one nullable `ReadAt` column; one
   `IX_Notifications_User_ReadAt_CreatedAt` index; eligible historical rows backfilled to
   `CreatedAt`; sensitive, userless, and post-first-run rows still unread; and unchanged row count,
   delivery status, attempt count, and idempotency-key count.
6. Remove the exact temporary firewall rule immediately, even when a command fails.
7. Compute the reviewed migration SHA-256 and store it as the non-secret GitHub `staging`
   Environment variable `FE10_INBOX_MIGRATION_SHA256`. This value proves the exact migration file
   hash that was applied; never set or update it before steps 1-6 pass:

```powershell
$fe10MigrationHash = (Get-FileHash -Algorithm SHA256 $fe10Migration).Hash.ToLowerInvariant()
gh variable set FE10_INBOX_MIGRATION_SHA256 `
  --env staging `
  --repo SWP391-LibraryManagement/LibraryManagement `
  --body $fe10MigrationHash
```

8. Before H3, run `Deploy staging` manually for the exact PR branch with
   `fe10_inbox_migration_confirmed=true`. The boolean is an additional operator acknowledgement;
   preflight still compares the checked-out migration file with `FE10_INBOX_MIGRATION_SHA256`.

Deployment then proceeds in a fixed order: preflight, backend, frontend, fail-closed smoke, and
browser verification. Verify backend `/health`, `/health/ready`, and anonymous inbox `401` before
checking the frontend bell/page or custom-domain browser behavior.

## Configure App Service Runtime Settings

Set non-secret values with Azure CLI:

```powershell
az webapp config appsettings set `
  --name app-library-api-staging-nhat714 `
  --resource-group rg-library-staging `
  --settings `
    NODE_ENV=production `
    TRUST_PROXY=true `
    PORT=8080 `
    DB_SERVER=sql-library-staging-ea-nhat714.database.windows.net `
    DB_NAME=LibraryManagementStaging `
    DB_PORT=1433 `
    DB_ENCRYPT=true `
    DB_TRUST_SERVER_CERTIFICATE=false `
    SCM_DO_BUILD_DURING_DEPLOYMENT=true
```

`TRUST_PROXY=true` is required on Azure App Service because TLS terminates at
the Azure proxy. The backend uses the forwarded protocol when enforcing HTTPS
for `/api/auth/*`; without this setting a real HTTPS request can be interpreted
as the internal HTTP hop and return `400 HTTPS_REQUIRED` instead of reaching
authentication and returning the expected `401` for an anonymous request.

Use App Service -> Configuration to enter secret values:

- `JWT_SECRET`
- `DB_USER=libraryadmin`
- `DB_PASSWORD`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `MAIL_FROM`

SMTP is required for staging registration, verification/reset OTP, and account-setup delivery. A
successful code deployment does not create or replace these App Service settings. For Gmail SMTP,
use an account with two-step verification and a dedicated App Password; never use or commit the
normal mailbox password. `MAIL_FROM` must be an address the configured SMTP account is permitted
to send as.

Generate `JWT_SECRET` locally:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste it directly into Azure configuration. Do not save or print it again.

After Static Web Apps exists, configure its exact URL:

```powershell
$staticUrl = Read-Host 'Paste the exact Azure Static Web Apps URL'

az webapp config appsettings set `
  --name app-library-api-staging-nhat714 `
  --resource-group rg-library-staging `
  --settings `
    "CORS_ORIGINS=$staticUrl" `
    "FRONTEND_BASE_URL=$staticUrl"
```

Restart the web app after changing runtime settings:

```powershell
az webapp restart `
  --name app-library-api-staging-nhat714 `
  --resource-group rg-library-staging
```

## Configure GitHub Environment Variables And Secrets

In GitHub repository Settings -> Environments, create `staging`.

Variables:

```text
AZURE_WEBAPP_NAME=app-library-api-staging-nhat714
STAGING_API_URL=https://app-library-api-staging-nhat714.azurewebsites.net
FE10_INBOX_MIGRATION_SHA256=<lowercase SHA-256 set only after the verified migration>
```

Create `STAGING_FRONTEND_URL` using the exact Azure-generated Static Web Apps URL.

Secrets:

```text
AZURE_WEBAPP_PUBLISH_PROFILE
AZURE_STATIC_WEB_APPS_API_TOKEN
```

Download the backend publish profile from App Service and paste it directly into the first secret.
Paste the Static Web Apps deployment token directly into the second. Enable required reviewer
approval for the environment when the repository plan supports it.

## CI-Gated Continuous Deployment

The staging workflow deploys after a successful `main` CI run only when its migration preflight
passes. For FE10, the operator-owned migration must be proven before merge because successful
`main` CI can deploy automatically:

1. Wait for exact-head PR CI to pass.
2. Apply the FE10 migration twice, verify only aggregate postconditions, and remove the exact
   temporary firewall rule.
3. Set `FE10_INBOX_MIGRATION_SHA256` to the exact migration file hash.
4. Manually run `Deploy staging` for the exact PR branch with
   `fe10_inbox_migration_confirmed=true`.
5. Confirm preflight, backend startup reconciles the packaged catalog and auth-token migrations,
   `/health/ready` returns `200`, frontend and smoke pass, and MEMBER/LIBRARIAN/ADMIN browser checks
   succeed before H3.
6. After H3, merge the approved head into `main`.
7. GitHub Actions completes `CI` for the resulting `main` commit and `Deploy staging` checks out that
   same commit automatically.
8. Confirm the automatic preflight matches the stored migration hash, backend finishes first,
   frontend starts only after backend success, and fail-closed smoke passes.

Failed CI runs do not deploy. `workflow_dispatch` remains available for an operator rerun after any
required operator-owned migration is applied. A missing or mismatched migration hash blocks both
automatic and manual deployment without changing Azure SQL.

After changing App Service settings, allow the F1 instance to warm up before
judging the smoke result. A first request may return `503` while the application
restarts. Re-run the read-only smoke check after `/health` returns `200`; do not
hide a persistent `503` as warm-up.

## Free-Tier Staging Keepalive

The `Staging keepalive` GitHub Actions workflow sends a read-only request to the
public backend `/health` endpoint every 10 minutes. It also supports
`workflow_dispatch` for an operator check. The workflow needs no repository
secret and must not call an authentication, notification-processing, or other
mutation endpoint.

This is a best-effort staging/demo measure. GitHub can delay scheduled workflow
runs, and Azure App Service F1 can unload an idle application. Do not describe
this configuration as guaranteed uptime or guaranteed notification timing.
GitHub also disables scheduled workflows in a public repository after 60 days
without repository activity. Check and re-enable this workflow when reviving an
inactive staging environment:

```powershell
gh workflow view staging-keepalive.yml
gh workflow enable staging-keepalive.yml
```

Keep the backend on B1 with Always On enabled until the workflow is merged into
the default branch. Scheduled workflows do not protect staging while they exist
only on a feature branch. Use this transition order:

1. Merge the reviewed workflow into `main` and require the exact `main` CI run
   to pass.
2. Start the workflow manually:

   ```powershell
   gh workflow run staging-keepalive.yml --ref main
   gh run list --workflow staging-keepalive.yml --limit 1
   ```

3. Wait until the manual `Staging keepalive` run succeeds.
4. Disable Always On:

   ```powershell
   az webapp config set `
     --name app-library-api-staging-nhat714 `
     --resource-group rg-library-staging `
     --always-on false
   ```

5. Confirm `alwaysOn=false`, then scale `plan-library-staging` to F1:

   ```powershell
   az appservice plan update `
     --name plan-library-staging `
     --resource-group rg-library-staging `
     --sku F1
   ```

6. Verify the live state without printing secret settings:

   ```powershell
   az appservice plan show `
     --name plan-library-staging `
     --resource-group rg-library-staging `
     --query '{sku:sku.name,tier:sku.tier}' `
     --output table

   az webapp config show `
     --name app-library-api-staging-nhat714 `
     --resource-group rg-library-staging `
     --query '{alwaysOn:alwaysOn}' `
     --output table

   az webapp config appsettings list `
     --name app-library-api-staging-nhat714 `
     --resource-group rg-library-staging `
     --query "[?starts_with(name, 'NOTIFICATION_WORKER_')].[name,value]" `
     --output table

   Invoke-WebRequest `
     -Uri 'https://app-library-api-staging-nhat714.azurewebsites.net/health' `
     -UseBasicParsing

   Invoke-WebRequest `
     -Uri 'https://app-library-api-staging-nhat714.azurewebsites.net/api/books' `
     -UseBasicParsing
   ```

Expected settings are `NOTIFICATION_WORKER_ENABLED=true`,
`NOTIFICATION_WORKER_INTERVAL_MS=60000`, and
`NOTIFICATION_WORKER_BATCH_SIZE=20`. Record only aggregate notification queue
counts; do not include recipients, rendered content, tokens, credentials, or
connection strings in deployment evidence.

If the keepalive repeatedly fails or staging becomes unreliable,
scale the plan back to B1 and set `alwaysOn=true`, then repeat the health, public catalog,
worker-setting, and aggregate queue checks. Disabling the workflow alone does not restore availability
on F1.

## Run Smoke Tests

Run an independent local check after GitHub Actions succeeds:

```powershell
$env:STAGING_FRONTEND_URL = Read-Host 'Paste the exact Azure Static Web Apps URL'
$env:STAGING_API_URL='https://app-library-api-staging-nhat714.azurewebsites.net'
npm.cmd run smoke:staging
```

The smoke script is read-only and checks frontend HTML, API health, allowed/blocked CORS, and
anonymous rejection from `/api/auth/me`.

## Rollback

- Backend: redeploy the last known-good commit or use App Service deployment history.
- Frontend: rerun the workflow from the last known-good commit.
- Database: CI performs no schema mutation. The backend startup exception only adds the canonical
  metadata compatibility columns through the reviewed idempotent script; any database rollback
  remains an explicit operator action.
- FE10 inbox rollback is non-destructive: keep `Notifications.ReadAt` and its index, then disable or
  redeploy only the inbox API/frontend use. Do not erase read history or roll back email delivery rows.
- Smoke failure: do not mark staging accepted; inspect App Service logs and GitHub job output without
  printing secret settings.

## Stop/Delete Resources

Stop the backend temporarily:

```powershell
az webapp stop `
  --name app-library-api-staging-nhat714 `
  --resource-group rg-library-staging
```

Delete the full staging environment only after confirming no required evidence or data remains:

```powershell
az group delete --name rg-library-staging
```

Azure asks for confirmation. Deleting the resource group is irreversible and removes the web app,
Static Web App, SQL server, and database.
