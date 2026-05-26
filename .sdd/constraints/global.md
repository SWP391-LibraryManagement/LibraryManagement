# Global Constraints — Library Management System

# Version: 0.1.0

# Status: DRAFT

> Cross-cutting technical constraints that apply to every feature in this project. Specific business rules belong in [`business.md`](business.md). Safety, security, and compliance rules belong in [`safety.md`](safety.md).

## 1. Tech Stack

- Backend: Java + Maven web application located in [`backend/LibraryManagement/`](../../backend/LibraryManagement).
- Frontend: to be defined; placeholder folder [`frontend/`](../../frontend).
- Database scripts and migrations live in [`database/`](../../database).
- Shared and integration tests live in [`tests/`](../../tests).
- Architecture diagrams, ADRs, and API docs live in [`docs/`](../../docs).

## 2. Coding Standards

- Follow the conventions already in use in the existing source tree before introducing new ones.
- Names of packages, classes, and files must reflect the feature they belong to (for example, code for `feat-borrow-book` lives under a package whose name aligns with that feature).
- No commented-out code in committed files.
- No TODOs without an owner and a referenced task ID from the corresponding `TASKS.md`.

## 3. Configuration and Environment

- No secrets, API keys, tokens, or credentials in source code.
- Local development settings live in `.env` files which must remain ignored by Git.
- Environment-specific values must be injected through configuration, not hardcoded.

## 4. Logging

- Use the project's standard logger; no `System.out.println` or equivalent in committed code.
- Log levels: ERROR for failures, WARN for recoverable issues, INFO for business events, DEBUG for development only.
- Never log secrets, tokens, passwords, or full request bodies that may contain PII.

## 5. Error Handling

- Catch exceptions at the layer that can act on them; do not swallow exceptions silently.
- Return meaningful error responses to API clients without exposing internal stack traces.

## 6. Testing

- Each feature must have at least unit tests for its business rules.
- Integration tests for cross-feature flows live in [`tests/`](../../tests).
- Tests must be deterministic; no reliance on real time, network, or random seeds without isolation.

## 7. Documentation

- Every core feature has a `SPEC.md`, `CONTEXT.md`, `PLAN.md`, `TASKS.md`, and `CHANGELOG.md` inside [`.sdd/specs/feat-{name}/`](../specs).
- ADRs for major architectural decisions live in [`docs/adr/`](../../docs/adr).
- API contracts live in [`docs/api/`](../../docs/api).

## 8. Branching and Commits

- Branch names: `feat/{feature-name}`, `fix/{bug-name}`, `docs/{name}`, `chore/{name}`.
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`).
- No direct commits to `main` or `master`.

## 9. Dependencies

- Pin dependency versions; no open ranges.
- Justify any new dependency in the relevant feature `PLAN.md` or in an ADR.
