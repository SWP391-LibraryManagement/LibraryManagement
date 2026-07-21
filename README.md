# Library Management System

## Overview

This SWP391 project implements a role-based library management system for Guests, Members,
Librarians, and Administrators. The team follows Hybrid Spec-Driven and Agent-Driven Development:
approved specifications define business behavior, while agents support implementation, testing,
documentation, and review.

## Project Status

- Phase 2 Core Development: the approved FE01-FE12 scope is integrated, subject to the documented release limitations below.
- Current phase: Phase 3 - Polish and Delivery is integrated on `main`; the validated post-release application baseline is `cce59d0` after PR #57/#58. The current governance/localization reconciliation is H2-approved with H3 pending.
- Published source release: `v1.0.2` at `c988af1`. The application baseline is 20 commits ahead; this reconciliation must merge through H3 and pass exact post-merge CI before the team chooses whether to tag the resulting later `main` SHA as `v1.0.3`.
- Canonical Phase 2 evidence: PR #40/#41 for full reconciliation and PR #42-#44 for the FE02/FE10 OTP follow-up.
- Deferred operational items remain explicit and do not become implied product claims during Phase 3.
- Remote application-baseline CI `29712597463` and staging workflow `29712612188` pass traceability, 917 backend tests, 171 frontend tests, browser E2E, deployment, and the six-check staging smoke for `cce59d0`.
- Fresh local reconciliation evidence passes 917 backend tests across 53 suites and 172 frontend tests. Human H2 is approved; H3, dedicated localized desktop/mobile visual review, and demonstration-video publication remain pending.

## Implemented Scope

The production-aligned FE01-FE12 reconciliation baseline is merged and accepted. The table preserves the approved Phase 1 scope and documented non-blocking limitations:

| Feature | Scope | Status boundary |
| --- | --- | --- |
| FE01 Public / Browse | Public catalog search, detail, and availability summary | Accepted in PR #40 |
| FE02 Authentication | Register, verification, login, refresh, logout, password change/reset, token validation | Accepted in PR #40 |
| FE03 User Profile | Profile read/update, avatar, validation, and ownership boundaries | Accepted in PR #40 |
| FE04 Membership | Member application, status, approval/rejection, role boundaries | Accepted in PR #40 |
| FE05 Book Management | Catalog reads, metadata, versioned status commands, derived availability | Accepted in PR #40 |
| FE06 Inventory | Copy metadata/status, rowversion, locked workflow/parent checks, audit | Accepted in PR #40 |
| FE07 Borrowing | Member requests, staff approval/rejection, return, renewal, member history | Accepted in PR #40 |
| FE08 Reservation | Member reservation lifecycle and staff queue/hold processing | Accepted; TD-028 Option A complete |
| FE09 Fine | Server-side overdue calculation, collection, paid/waive/cancel, owner/staff access | Accepted server boundary; legacy frontend remains non-authoritative |
| FE10 Notification | Safe templates, sensitive delivery boundaries, queue processing, retry, audit | Accepted backend boundary; inbox UI remains deferred |
| FE11 User & Role | Admin users, role actions, lifecycle, permissions, and audit surfaces | Accepted approved Phase 1 scope |
| FE12 Reporting | Borrowing, inventory, and user aggregate reports | Accepted in PR #40 |

Explicitly deferred work remains outside the approved Phase 1 release scope.

## Architecture

The React frontend calls an Express REST API. The backend owns validation, authorization, business
rules, audit writes, and parameterized SQL Server access.

- [System architecture](docs/architecture/system-architecture.md)
- [Feature integration map](docs/architecture/feature-integration-map.md)
- [Architecture decisions](.sdd/rfcs/)

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 8, Material UI, Bootstrap |
| Backend | Node.js, Express 5, `mssql`, JWT, bcrypt |
| Database | SQL Server locally; Azure SQL for staging |
| Tests | Jest, Node test runner, Supertest, Playwright Chromium |
| CI/CD | GitHub Actions |
| Staging | Azure Static Web Apps, Azure App Service, Azure SQL |

CI uses Node.js 22. Use a current Node.js 22 release locally for the closest parity.

## Repository Structure

```text
.agents/                 Agent instructions and project memory
.sdd/                    Constitution, specs, constraints, reviews, and test policy
.github/workflows/       CI and staging deployment workflows
backend/                 Express API, services, repositories, validators, and tests
database/                Canonical SQL Server schema
docs/                    Architecture, deployment, release, testing, and user documentation
frontend/                React/Vite application and frontend tests
scripts/                 Repository quality and deployment utilities
tests/e2e/               Playwright system browser tests
```

## Prerequisites

- Node.js 22 and npm
- SQL Server for local database-backed workflows
- Git
- Chromium installed through Playwright for browser tests
- Azure for Students only when provisioning staging resources

## Local Setup

Install each workspace from the repository root:

```powershell
npm.cmd ci
npm.cmd --prefix backend ci
npm.cmd --prefix frontend ci
npx.cmd playwright install chromium
```

Create local environment files from the tracked examples:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Generate a local JWT secret without committing it:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set the SQL Server values in `backend/.env`, then start both applications:

```powershell
npm.cmd run dev
```

Default local endpoints:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Health: `http://localhost:3000/health`
- Swagger UI: `http://localhost:3000/api-docs`

## Environment Configuration

The tracked environment examples contain names and safe defaults only. Real `.env` files remain
ignored.

Backend configuration groups:

- authentication: `JWT_SECRET`, bcrypt and token lifetime settings;
- SQL Server: `DB_SERVER`, `DB_NAME`, optional SQL credentials, encryption settings;
- browser boundary: `CORS_ORIGINS`, `FRONTEND_BASE_URL`;
- optional email: SMTP host, port, credentials, and sender.

Frontend builds use `VITE_API_BASE_URL`. Vite variables are public build-time values and must never
contain secrets.

## Development Commands

```powershell
npm.cmd run dev                         # backend and frontend
npm.cmd --prefix backend test          # full backend suite
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run test:system                # deterministic system integration
npm.cmd run test:e2e                   # browser golden path
npm.cmd run test:deployment            # deployment utility tests
npm.cmd run schema:azure:prepare       # derive Azure SQL schema under tmp/
npm.cmd run smoke:staging              # read-only checks against staging URLs
npm.cmd run phase3:performance          # bundle and deterministic auth timing evidence
npm.cmd run docs:screenshots           # regenerate synthetic user-manual images
npm.cmd run trace:enforce              # FR @spec traceability gate
```

The SQL shared-state suite is mutation-gated. Use only an approved local/test database and follow
the [system integration runbook](docs/testing/system-integration-demo-runbook.md).

## Test And Quality Gates

The observed baselines are intentionally separated by evidence source:

- remote CI run `29712597463` for application baseline `cce59d0`: 917 backend tests across 53 suites and 171 frontend tests;
- fresh local H2-approved reconciliation: 917 backend tests across 53 suites and 172 frontend tests;
- local coverage: statements 92.68%, branches 81.66%, functions 96.59%, and lines 92.61%;
- Playwright system golden path: 4/4 passing in the fresh local reconciliation;
- traceability: all twelve feature specs currently report 100% FR tag coverage; implementation completion remains a separate gate;
- production dependency audit: no unresolved Critical/High finding.

Evidence:

- [Week 13 acceptance record](docs/release/week13-acceptance-record.md)
- [System integration evidence](.sdd/reviews/system-integration-evidence-2026-07-14.md)
- [Week 11 coverage evidence](.sdd/reviews/week11-coverage-evidence-2026-07-14.md)
- [Week 11 E2E evidence](.sdd/reviews/week11-e2e-evidence-2026-07-14.md)
- [Week 12 security audit](.sdd/reviews/week12-security-audit-2026-07-14.md)
- [Phase 3 final report](docs/release/phase3-final-report.md)
- [Phase 3 final validation](.sdd/reviews/phase3-final-validation-2026-07-19.md)
- [Final governance closeout validation](.sdd/reviews/final-governance-closeout-validation-2026-07-20.md)
- [Final submission checklist](docs/release/final-submission-checklist-2026-07-20.md)

## API Documentation

- Machine-readable source: [OpenAPI YAML](backend/src/docs/openapi.yaml)
- Local interactive documentation: `GET /api-docs`
- Supporting contract notes: [API contract](docs/api/api-contract.md)

Protected behavior must be verified against the related feature `SPEC.md`; Swagger does not replace
the specification.

## Azure Staging

Week 13 uses separate staging services:

- Azure Static Web Apps Free for the frontend;
- Azure App Service F1 for the backend;
- Azure SQL Database only inside the confirmed free allowance or Azure for Students credit.

Deployment is staging-only and automatically triggered by pushes to `main` after the quality gates
pass; `workflow_dispatch` remains available for a manual rerun. Database schema changes are never
executed automatically by CI.

Observed Phase 3 staging origins:

- frontend: `https://lemon-wave-04db51100.7.azurestaticapps.net`;
- backend health: `https://app-library-api-staging-nhat714.azurewebsites.net/health`.

The independent six-check smoke passed frontend HTML, health, SQL-backed catalog,
strict CORS allow/deny, and anonymous protected-route rejection. Live run
`c6e0c46421f0` additionally passed authenticated Admin/Member/Librarian role
flows, protected reads, borrow request/approval/return, and real SMTP inbox
delivery. Sanitized evidence is recorded in
`docs/release/phase3-staging-evidence-2026-07-19.md`.

- [Azure staging guide](docs/deployment/azure-staging-guide.md)
- [Week 13 design](docs/superpowers/specs/2026-07-14-week13-documentation-deployment-design.md)
- [Week 13 implementation plan](docs/superpowers/plans/2026-07-14-week13-documentation-deployment.md)

## User Documentation

- [User manual](docs/user-manual.md)
- [Presentation demo runbook](docs/testing/system-integration-demo-runbook.md)
- [Vietnamese system overview](docs/tong-quan-he-thong-vi.md)

## Current Limitations

- FE09 legacy React UI can use local browser records for classroom continuity; release evidence uses
  the production-aligned server API instead.
- FE10 notification inbox UI is not part of the completed acceptance scope.
- The current Vietnamese localization reconciliation still requires dedicated human desktop/mobile visual acceptance.
- The demonstration video/link is not published.
- SQL integration is local/manual because CI does not host a shared disposable SQL Server service.
- Deployed authentication transport must set `NODE_ENV=production`; set `TRUST_PROXY=true` only behind a trusted TLS-terminating proxy, and optionally set `HTTPS_REDIRECT=true` with a validated `HTTPS_CANONICAL_HOST` to redirect plain HTTP auth requests.
- Route-level code splitting reduced the initial JavaScript entry from 999,203 to 320,688 bytes; further total-byte optimization is optional.
- SMTP delivery requires a valid staging mail provider configuration; the
  configured provider path was observed in live run `c6e0c46421f0` after a
  malformed `SMTP_USER` shape was corrected without recording its value.

## Security Notes

- Never commit `.env` files, credentials, passwords, JWT secrets, deployment tokens, or real personal
  data.
- Production CORS is an explicit allowlist.
- Protected actions enforce authentication and role checks on the server.
- SQL values use parameterized `mssql` inputs; dynamic identifiers come from code-owned allowlists.
- Internal 5xx details and sensitive notification payloads are not returned to clients.
- Review the accepted Medium/Low risks in the [Week 12 security audit](.sdd/reviews/week12-security-audit-2026-07-14.md) before public deployment.

## Team Workflow

1. Update or approve the relevant feature specification.
2. Create/review `PLAN.md` and `TASKS.md`.
3. Implement on a feature branch or isolated worktree.
4. Add tests and traceability.
5. Run automated, spec, constitution, and acceptance gates.
6. Obtain human review before merge or deployment.

Project rules are defined in [`.agents/AGENTS.md`](.agents/AGENTS.md) and the
[constitution](.sdd/constitution.md).
