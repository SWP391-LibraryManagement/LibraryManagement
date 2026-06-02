# Library Management System

SWP391 Library Management System using Hybrid Spec-Driven Development and Agent-Driven Development.

## Approved Stack

- Backend: Node.js + Express.js
- Frontend: React + Bootstrap
- Database: SQL Server
- API style: RESTful API

## Project Structure

```text
.sdd/                 SDD artifacts, specs, constraints, RFCs, reviews, skills
.agents/              Agent rules and project memory
backend/              Node.js + Express.js backend
frontend/             React + Bootstrap frontend
database/             SQL Server scripts
tests/                Unit, integration, and e2e tests
docs/                 API docs, architecture diagrams, and foundation documents
.github/workflows/    CI/CD workflows
```

Core features must be specified under `.sdd/specs/feat-{name}/` before implementation.

The official feature source of truth is [docs/phase_1_foundation/07_master_feature_list.md](docs/phase_1_foundation/07_master_feature_list.md).
