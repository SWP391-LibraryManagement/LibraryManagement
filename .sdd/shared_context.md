# Shared Context — Library Management System

# Version: 0.1.0

# Status: DRAFT

# Last Updated: 2026-05-26

---

## 1. Project Summary

This project is a Library Management System for SWP391.

The system helps a library manage:

- Books
- Book categories
- Members / readers
- Borrowing transactions
- Returning transactions
- Overdue fines
- Reports and statistics
- User accounts and roles

The main goal is to reduce manual work, improve data accuracy, and help librarians track book availability and borrowing status.

---

## 1.1 Approved Technical Stack

| Layer    | Decision              |
| -------- | --------------------- |
| Backend  | Node.js + Express.js  |
| Frontend | React + Bootstrap     |
| Database | SQL Server            |
| API      | RESTful API           |

These stack choices are locked for the current project phase. Any change must update the Constitution, shared context, and related ADR/spec files.

---

## 2. Development Approach

The team follows Hybrid Spec-Driven & Agent-Driven Development.

### Spec-Driven Development is used for:

- Core business requirements
- Borrowing and returning rules
- Fine calculation
- Role permissions
- Database design
- API contracts
- Security-sensitive logic

### Agent-Driven Development is used for:

- Drafting documentation
- Breaking specs into tasks
- Implementing approved tasks
- Writing tests
- Refactoring
- Generating boilerplate code
- Reviewing possible edge cases

AI/agent output must always be reviewed by a human before commit or merge.

---

## 3. System Users / Actors

| Actor     | Description                                                                       |
| --------- | --------------------------------------------------------------------------------- |
| Guest     | Unauthenticated visitor who may view public information if the system supports it |
| Member    | Library reader who can borrow books and view borrowing history                    |
| Librarian | Staff member who manages borrowing, returning, books, and members                 |
| Admin     | System manager who manages users, roles, system settings, and reports             |

---

## 4. Core Modules

| Module                         | Description |
| ------------------------------ | ----------- |
| Public / Browse                | Search, browse, and view public book information. |
| Authentication                 | Register, login, logout, forgot password, and reset password. |
| User Profile                   | View and update personal profile information. |
| Membership Management          | Apply for membership and manage membership approval/status. |
| Book Management                | Manage book information. |
| Inventory / Book Copy          | Manage physical book copies, barcode, location, status, and availability. |
| Borrowing Management           | Manage borrowing, returning, renewal, and borrowing history. |
| Reservation Management         | Manage book reservations and reservation queue. |
| Fine Management                | Calculate fines and record fine collection/paid status. |
| Notification Management        | Send account, reservation, due date, and fine notifications. |
| User & Role Management         | Manage users, librarians, roles, and permissions. |
| Reporting & Statistics         | Generate basic reports and statistics. |

---

## 5. Core Business Rules

- BR-GEN-001: A book must have a unique identifier.
- BR-GEN-002: A member must have a unique identifier.
- BR-GEN-003: Only authorized users can manage books, members, borrowing, returning, and fines.
- BR-GEN-004: A book cannot be borrowed if its available quantity is 0.
- BR-GEN-005: A member cannot borrow more than the configured borrowing limit.
- BR-GEN-006: A member with overdue books or unpaid fines may be restricted from borrowing.
- BR-GEN-007: Every borrow transaction must store member, book, borrow date, due date, status, and creator.
- BR-GEN-008: Every return transaction must update the related borrowing transaction.
- BR-GEN-009: Fine calculation must be traceable and testable.
- BR-GEN-010: Important administrative actions must be logged.

---

## 6. Suggested Data Entities

Initial entities may include:

| Entity            | Purpose                                           |
| ----------------- | ------------------------------------------------- |
| User              | Stores login account information                  |
| Role              | Defines system permissions                        |
| Member            | Stores library reader information                 |
| Book              | Stores book information                           |
| Category          | Groups books by category                          |
| Author            | Stores author information if needed               |
| Publisher         | Stores publisher information if needed            |
| BorrowTransaction | Stores borrowing records                          |
| ReturnTransaction | Stores return records if separated from borrowing |
| Fine              | Stores overdue fine information                   |
| AuditLog          | Stores important actions                          |

This list is not final. Database design must be confirmed in ADR/RFC files under [`.sdd/rfcs/`](rfcs) and related feature specs.

---

## 7. Feature List

The official source of truth for the project feature list is [`docs/phase_1_foundation/07_master_feature_list.md`](../docs/phase_1_foundation/07_master_feature_list.md).

| Feature ID | Feature Name                     | Feature Folder               | Spec Level |
| ---------- | -------------------------------- | ---------------------------- | ---------- |
| FE01       | Public / Browse                  | feat-public-browse           | Standard   |
| FE02       | Authentication                   | feat-auth                    | Full       |
| FE03       | User Profile                     | feat-user-profile            | Standard   |
| FE04       | Membership Management            | feat-membership-management   | Standard   |
| FE05       | Book Management                  | feat-book-management         | Standard   |
| FE06       | Inventory / Book Copy Management | feat-inventory-book-copy     | Full       |
| FE07       | Borrowing Management             | feat-borrowing-management    | Full       |
| FE08       | Reservation Management           | feat-reservation-management  | Standard   |
| FE09       | Fine Management                  | feat-fine-management         | Full       |
| FE10       | Notification Management          | feat-notification-management | Standard   |
| FE11       | User & Role Management           | feat-user-role-management    | Full       |
| FE12       | Reporting & Statistics           | feat-reporting-statistics    | Standard   |

Feature folders should be created only when the team starts drafting the related `SPEC.md`. Empty feature folders should not be kept.

---

## 8. Documentation Structure

The project uses the following structure:

```text
.sdd/
├── constitution.md
├── shared_context.md
├── constraints/
│   ├── global.md
│   ├── business.md
│   └── safety.md
└── specs/
    ├── _template.md
    └── feat-{name}/
```

Each feature folder must contain:

- SPEC.md
- CONTEXT.md
- PLAN.md
- TASKS.md
- CHANGELOG.md

Agent-facing memory lives under [`.agents/`](../.agents/) (see `.agents/AGENTS.md` and `.agents/CLAUDE.md`). Root-level `AGENTS.md` and `CLAUDE.md` point agents to those files.

Current repository structure also includes the remaining Hybrid Project folders from the playbook:

```text
.sdd/skills/
.sdd/rfcs/
.sdd/reviews/
backend/
frontend/
tests/unit/
tests/integration/
tests/e2e/
database/
.github/workflows/
```

---

## 9. Development Workflow

For each feature, the team follows this workflow:

1. Write or update CONTEXT.md.
2. Draft SPEC.md.
3. Review SPEC.md with human and AI.
4. Resolve open questions.
5. Approve or lock SPEC.md.
6. Create PLAN.md.
7. Create TASKS.md.
8. Implement tasks.
9. Write tests.
10. Validate implementation against SPEC.md.
11. Human review before merge.

---

## 10. Validation Gates

Before a feature is considered complete:

- SPEC.md must be completed and reviewed.
- PLAN.md must match SPEC.md.
- TASKS.md must trace back to requirements.
- Code must satisfy acceptance criteria.
- Tests must cover core business rules.
- No secrets or credentials may be committed.
- Human review must be completed.

---

## 11. Current Open Questions

| ID    | Question                                                          | Owner          | Status |
| ----- | ----------------------------------------------------------------- | -------------- | ------ |
| Q-001 | What technology stack will the team use for backend and frontend? | Team           | Resolved: Node.js + Express.js, React + Bootstrap, SQL Server, RESTful API |
| Q-002 | What is the maximum number of books a member can borrow?          | Team / Teacher | Open   |
| Q-003 | How many days can a member keep a borrowed book?                  | Team / Teacher | Open   |
| Q-004 | How is overdue fine calculated?                                   | Team / Teacher | Open   |
| Q-005 | Which roles are required in the final system?                     | Team           | Open   |

---

## 12. Notes for AI/Agent

When assisting this project, AI/agent must:

- Read [`.sdd/constitution.md`](constitution.md) first.
- Read this shared context before drafting specs.
- Never implement a core feature without its SPEC.md.
- Ask questions when business rules are missing.
- Keep the project suitable for a student SWP391 software engineering project.
