# ADR-001: Architecture

Status: Approved for Week 4 scaffolding
Date: 2026-06-10

## Context

The project follows the Hybrid Spec-Driven & Agent-Driven Development playbook. Week 1-3 gates are closed, and the project is entering Week 4 Architecture & Scaffolding.

Approved stack from the Constitution:

- Backend: Node.js + Express.js
- Frontend: React + Bootstrap
- Database: SQL Server
- API style: RESTful API

The repository already contains an Express backend skeleton and a React/Vite frontend prototype. These are allowed as scaffolding/prototype artifacts, but feature implementation must still follow approved `SPEC.md`, `PLAN.md`, and `TASKS.md`.

## Decision

Use a layered modular architecture with REST API boundaries.

### Backend Layers

Backend code lives under `backend/src` and should use this structure:

```text
backend/src/
  index.js
  config/
  routes/
  controllers/
  services/
  repositories/
  models/
  middleware/
  validators/
  utils/
  CustomException/
  Constrant/
```

Layer responsibilities:

| Layer | Responsibility |
| --- | --- |
| routes | Bind HTTP method/path to controller handlers. No business logic. |
| controllers | Parse request context, call validators/services, return safe HTTP responses. |
| validators | Server-side request validation near the boundary. |
| services | Business rules and orchestration. Must be testable without UI. |
| repositories | SQL Server access using parameterized queries through `mssql`. |
| models | Data shape helpers/constants; not an ORM unless approved later. |
| middleware | Error handling, auth guard, role guard, request logging, security wrappers. |
| config | Environment loading and configuration validation. No secrets committed. |

### Frontend Layers

Frontend code lives under `frontend/src` and should use this structure:

```text
frontend/src/
  App.jsx
  main.jsx
  api/
  routes/
  page/
  component/
  hooks/
  styles/
  utils/
```

Layer responsibilities:

| Layer | Responsibility |
| --- | --- |
| page | Route-level screens and workflow composition. |
| component | Reusable UI components. No business rules that belong on the server. |
| api | Axios/client wrappers for REST endpoints. |
| hooks | Frontend state helpers. |
| routes | Route definitions/guards when needed. |
| styles | CSS and Bootstrap/MUI integration. |
| utils | Pure client helpers only. |

### API Boundary

- REST endpoints are the contract between frontend and backend.
- API contracts may live inside approved `SPEC.md` files for Week 4 unless the team creates `docs/api/api-contract.md` as a shared contract.
- Shared API changes must be reflected in the related spec before implementation.

## Constraints

- Do not introduce another backend framework, frontend framework, database, or API style without updating the Constitution and ADRs.
- Use `mssql` with parameterized queries for database access.
- Validate all user input on the backend.
- Enforce role-based authorization on the backend.
- Do not expose internal stack traces to users.
- Keep code simple enough for an SWP391 student project.

## Consequences

- Feature teams can work in parallel using common folder and layer boundaries.
- Services become the main target for unit tests.
- Repositories isolate SQL Server access and reduce SQL injection risk.
- Existing prototype UI must be refactored into the frontend structure as feature tasks are approved.

## Week 4 Scaffolding Gate

Before Week 5 feature implementation starts:

- Backend folders above should exist.
- A common error handler should exist.
- A database connection module should exist without hardcoded credentials.
- Auth and role middleware placeholders may exist, but protected behavior must be implemented through approved FE02/FE11 tasks.
- Frontend API client structure should exist.
- Build/import checks must pass in CI.
