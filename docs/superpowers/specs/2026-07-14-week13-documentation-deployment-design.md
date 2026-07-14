# Week 13 Documentation And Azure Staging Design

**Date:** 2026-07-14
**Status:** Approved direction; written design pending human document review
**Branch:** `docs/week13-documentation-deployment`

## 1. Goal

Complete the playbook Week 13 deliverables without adding product features:

- close the acceptance evidence package for the six implemented features;
- publish a coherent technical documentation set and user manual;
- provision an Azure staging environment using the Azure for Students subscription;
- add a controlled GitHub Actions deployment pipeline;
- deploy and smoke-test a working staging frontend, API, and Azure SQL database.

The target deliverable is a recorded staging URL, a working API URL, a technical documentation
draft, a complete repository README, a user manual, and repeatable deployment/smoke evidence.

## 2. Scope

### In Scope

- FE02 Authentication
- FE07 Borrowing Management
- FE08 Reservation Management
- FE09 production-aligned server API
- FE10 Notification Management
- FE12 Reporting And Statistics
- Existing public/book/profile/admin/inventory routes only as required to document or deploy them
- Azure Static Web Apps frontend staging
- Azure App Service backend staging
- Azure SQL Database staging
- GitHub Actions deployment and smoke-test automation

### Out Of Scope

- New product features
- FE09 legacy frontend alignment
- Closing features currently marked `NOT STARTED` or `DRAFT`
- Automatic production deployment
- Automatic database schema mutation from CI
- Paid Azure resources outside the Azure for Students credit without explicit human approval
- Migrating from SQL Server to another database

## 3. Selected Azure Architecture

### 3.1 Components

| Component | Azure service | Responsibility |
| --- | --- | --- |
| Frontend | Azure Static Web Apps Free | Serve the Vite production build over HTTPS. |
| Backend | Azure App Service for Node.js | Run the Express API with `NODE_ENV=production`. |
| Database | Azure SQL Database | Host the staging copy of `LibraryManagement`. |
| Source and automation | GitHub + GitHub Actions | Run quality gates, deploy approved commits, and execute smoke checks. |
| Secrets | GitHub Environment secrets + App Service configuration | Store deployment token, database credentials, JWT secret, SMTP settings, and URLs. |

Cost policy:

- App Service starts on the F1 Free plan. If F1 is unavailable or cannot run the application, stop
  before selecting B1 or another paid plan and request explicit approval.
- Azure SQL is created only when the portal cost estimate identifies a free allowance or confirms
  that the selected configuration is covered by the Azure for Students credit. The estimate is
  recorded before creation.
- Static Web Apps remains on the Free plan for Week 13.

Default region:

- App Service and Azure SQL: Southeast Asia.
- Static Web Apps: East Asia when Southeast Asia is not offered by the free plan.

Resource names use a stable project prefix plus a short uniqueness suffix:

```text
rg-library-staging
swa-library-staging-<suffix>
app-library-api-staging-<suffix>
sql-library-staging-<suffix>
LibraryManagementStaging
```

The suffix is selected once during provisioning and recorded in the deployment evidence. It is not
embedded in application source.

### 3.2 Request Flow

```text
Browser
  -> Azure Static Web Apps (React/Vite)
  -> HTTPS API request using VITE_API_BASE_URL
  -> Azure App Service (Express)
  -> encrypted SQL connection
  -> Azure SQL Database
```

The frontend and backend have separate URLs. App Service `CORS_ORIGINS` contains only the Static Web
Apps staging origin. Same-origin tools and requests without an Origin header remain supported.

## 4. Acceptance Gate

Week 11 and Week 12 automated gates are complete, but the project test plan still marks Week 10
core-feature acceptance as in progress. Week 13 begins by assembling one acceptance record for the
six implemented features.

The record must:

- link each feature to its approved `SPEC.md`, `TASKS.md`, `TEST_PLAN.md`, and review evidence;
- distinguish automated L1-L3 evidence from human L4 acceptance;
- reuse the Playwright golden path and system integration evidence;
- identify FE09 browser alignment and FE10 inbox UI as documented limitations;
- use `READY FOR HUMAN ACCEPTANCE` until a human records the visual/demo result;
- never mark a manual observation as PASS based only on agent output.

No feature status is upgraded solely because Week 13 documentation exists.

## 5. Documentation Set

### 5.1 Root README

The root `README.md` becomes the entry point and includes:

- system purpose and implemented scope;
- architecture and technology stack;
- repository map;
- local prerequisites and setup;
- safe environment configuration using tracked example files;
- local development, test, build, traceability, E2E, and SQL commands;
- Azure staging architecture and links to deployment documentation;
- current limitations and security notes;
- links to API reference, user manual, acceptance evidence, and presentation runbook.

### 5.2 Technical Documentation

Create or consolidate:

- `docs/architecture/system-architecture.md`: runtime components, trust boundaries, data flow,
  deployment topology, and links to the existing feature integration map.
- `docs/deployment/azure-staging-guide.md`: Azure resources, configuration, secrets, database
  initialization, GitHub Environment setup, first deployment, rollback, cleanup, and cost guardrails.
- `docs/release/week13-acceptance-record.md`: six-feature acceptance matrix and human sign-off area.
- Existing `backend/src/docs/openapi.yaml` remains the machine-readable API reference; the README and
  deployment guide link to `/api-docs` and the source file.

### 5.3 User Manual

Create `docs/user-manual.md` for Guest, Member, Librarian, and Admin workflows. It must describe only
implemented behavior and include the critical presentation flow:

- login;
- browse/select a copy;
- create and approve a borrow request;
- return an overdue item;
- calculate and record a fine through the production-aligned API boundary;
- view the borrowing report;
- recover from common authentication, role, API, and connectivity errors.

Screenshots may be captured from the deterministic local Playwright environment or the final staging
deployment. They must contain synthetic data only and must not show passwords, tokens, notification
bodies, connection strings, or local `.env` content.

## 6. Environment Contract

Tracked templates contain placeholders only:

```text
backend/.env.example
frontend/.env.example
```

Required backend staging settings:

```text
NODE_ENV=production
PORT=8080
JWT_SECRET=<App Service secret>
DB_SERVER=<azure-sql-server>.database.windows.net
DB_NAME=LibraryManagementStaging
DB_USER=<App Service secret>
DB_PASSWORD=<App Service secret>
DB_PORT=1433
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false
CORS_ORIGINS=https://<static-web-app-host>
FRONTEND_BASE_URL=https://<static-web-app-host>
```

Optional SMTP variables stay unset unless the team configures a staging mail provider. SMTP absence
must not be presented as successful email delivery.

Required frontend build setting:

```text
VITE_API_BASE_URL=https://<app-service-host>/api
```

No environment value is committed. GitHub deployment secrets live in a protected `staging`
Environment; runtime secrets live in App Service configuration.

## 7. Database Deployment

`database/Librarymanagement.sql` remains the schema source. The first staging database initialization
is an explicit operator action through Azure Query Editor, SSMS, or `sqlcmd` after the target server
and database are confirmed.

Guardrails:

- CI does not automatically execute schema SQL.
- The operator records the target server and database name before execution.
- The operator reviews the SQL diff and confirms no production/shared database is selected.
- Only synthetic staging accounts and data are used.
- Database credentials are entered interactively or stored in Azure configuration, never in Git.
- Azure SQL firewall access is limited to the App Service outbound addresses and the operator's
  temporary administration address; no permanent all-Internet rule is accepted.
- The deployment evidence records schema initialization and a read-only connectivity check, not
  credential values.

## 8. CI/CD Design

Add `.github/workflows/deploy-staging.yml` with a manual `workflow_dispatch` trigger. Automatic
deployment from every push is intentionally deferred until the first staging deployment is verified.

Pipeline jobs:

1. `quality-gate`
   - install root, backend, and frontend dependencies;
   - run backend tests and coverage threshold;
   - run frontend tests, lint, and build;
   - run traceability enforcement.
2. `deploy-backend`
   - deploy the `backend/` package to the named App Service using a web-app-scoped publish profile
     stored in the GitHub `staging` Environment;
   - rely on App Service build automation to install production dependencies;
   - do not include `.env`, tests, coverage, uploads, or local artifacts.
3. `deploy-frontend`
   - build `frontend/` with the staging API URL;
   - deploy `frontend/dist` using the Static Web Apps deployment token stored in the GitHub
     `staging` Environment.
4. `smoke-test`
   - run only after both deployments succeed;
   - call the staging frontend and API URLs using the repository smoke script;
   - fail the workflow on an unavailable frontend, unhealthy API, permissive CORS response, or
     protected endpoint that does not reject an unauthenticated request.

The pipeline uses least-scope deployment credentials and prints no secret values.

## 9. Smoke-Test Interface

Add a Node.js script with this command:

```powershell
$env:STAGING_FRONTEND_URL='https://<static-web-app-host>'
$env:STAGING_API_URL='https://<app-service-host>'
npm.cmd run smoke:staging
```

Checks:

1. Frontend root returns HTTP 200 and HTML.
2. `GET <api>/health` returns HTTP 200 with `status: "ok"`.
3. An allowed-origin request receives the exact configured CORS origin.
4. An untrusted-origin request does not receive an allow-origin header.
5. `GET <api>/api/auth/me` without a Bearer token returns HTTP 401.

The script is read-only. It creates no users, borrowings, fines, notifications, or reports.

## 10. Error Handling And Rollback

- A quality-gate failure prevents deployment.
- A backend deployment failure prevents smoke testing and leaves the previous App Service version
  available through Azure deployment history.
- A frontend deployment failure does not change the configured backend database.
- A smoke-test failure marks the workflow failed and blocks the staging acceptance record.
- Rollback redeploys the last known-good Git commit; database rollback is manual because CI does not
  mutate schema.
- If Azure proposes a non-free SKU or cost outside the student credit, provisioning stops before the
  resource is created and the cost decision returns to the user.

## 11. Verification Strategy

Before the first deployment:

- existing backend, coverage, frontend, build, E2E, SQL integration, dependency audit, and
  traceability evidence remains green;
- environment templates contain no secrets;
- documentation links and commands are reviewed from a clean checkout;
- the smoke script is test-driven against local HTTP fixtures;
- workflow changes pass syntax review and `git diff --check`.

After deployment:

- run the automated staging smoke script;
- perform one human login and critical-flow visual check using synthetic staging data;
- record the frontend URL, API URL, deployed commit, smoke timestamp, and human reviewer result;
- run the five-minute presentation rehearsal against staging, with the existing deterministic local
  evidence as fallback.

## 12. Completion Criteria

Week 13 is complete only when:

- the six-feature acceptance record is ready and human-reviewed;
- README, architecture document, deployment guide, and user manual are committed;
- environment templates are tracked without credentials;
- the GitHub staging Environment and deployment secrets are configured;
- Azure Static Web Apps, App Service, and Azure SQL staging resources exist within approved credit;
- the database schema is initialized against the confirmed staging database;
- GitHub Actions deploys the selected commit successfully;
- the smoke script passes against the public staging URLs;
- staging evidence records URLs, commit, test results, limitations, and rollback instructions.
