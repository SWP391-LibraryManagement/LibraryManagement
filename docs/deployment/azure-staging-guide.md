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
2. Confirm the connected database is `LibraryManagementStaging`.
3. Execute using Azure Query Editor, SSMS, or `sqlcmd`.
4. For an existing pre-reconciliation database, execute these approved idempotent migrations in
   order:

```text
database/migrations/2026-07-19-fe04-membership-concurrency.sql
database/migrations/2026-07-19-fe05-book-rowversion.sql
database/migrations/2026-07-19-fe06-bookcopy-rowversion.sql
database/migrations/2026-07-19-fe10-otp-templates.sql
database/migrations/2026-07-19-fe11-finalization.sql
database/migrations/2026-07-22-library-metadata-compatibility.sql
database/migrations/2026-07-22-borrow-request-workflow-columns.sql
```

5. Execute the migration sequence a second time to prove idempotence before accepting the staging
   schema.
6. Verify the target, table count, and reconciliation columns:

```sql
SELECT
  DB_NAME() AS DatabaseName,
  (SELECT COUNT(*) FROM sys.tables) AS TableCount,
  COL_LENGTH(N'dbo.Books', N'RowVersion') AS BooksRowVersionBytes,
  COL_LENGTH(N'dbo.BookCopies', N'Version') AS BookCopiesVersionBytes,
  COL_LENGTH(N'dbo.Users', N'DeactivatedAt') AS UsersDeactivatedAtBytes;
```

Expected database: `LibraryManagementStaging`, table count `20`, and each listed reconciliation
column length `8`. CI must not execute this schema automatically.

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
- optional SMTP credentials

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

## Automatic Deployment After Merge

The staging workflow runs automatically for every push to `main` (including a pull-request merge):

1. Merge the approved change into `main`.
2. GitHub Actions starts `Deploy staging` automatically.
3. Approve the `staging` Environment when prompted, if environment approval is enabled.
4. Confirm quality, backend deploy, frontend deploy, and smoke jobs all pass.

`workflow_dispatch` remains enabled for a manual rerun from GitHub Actions when needed.

No deployment should run if the quality gate fails.

After changing App Service settings, allow the F1 instance to warm up before
judging the smoke result. A first request may return `503` while the application
restarts. Re-run the read-only smoke check after `/health` returns `200`; do not
hide a persistent `503` as warm-up.

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
- Database: CI performs no schema mutation, so database rollback remains an explicit operator action.
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
