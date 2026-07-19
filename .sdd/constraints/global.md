# Global Constraints — Library Management System

# Version: 0.1.1

# Status: APPROVED

# Last Updated: 2026-07-20

> High-level engineering rules every feature in this project must follow. See [`business.md`](business.md) for domain rules and [`safety.md`](safety.md) for security rules.

## High-Level Engineering Rules

- GLB-001: Spec-first development. No core feature is built without an approved [`.sdd/specs/feat-{name}/SPEC.md`](../specs).
- GLB-002: Keep code simple and maintainable. Choose the smallest design that satisfies the spec.
- GLB-003: No feature creep. Implement only what the current `SPEC.md` and `TASKS.md` require.
- GLB-004: Code must follow the approved `SPEC.md`. If code conflicts with the spec, the code is wrong unless the spec is updated and re-approved.
- GLB-005: Any change in observable business behavior must update the related `SPEC.md` (and `CHANGELOG.md`) before or alongside the code change.
- GLB-006: The approved stack is Node.js + Express.js for backend, React + Bootstrap for frontend, SQL Server for database, and RESTful API for client-server communication.

> Concrete tooling rules such as logging library, formatter, dependency policy, and branching scheme may still be refined later. The main application stack is now fixed.
