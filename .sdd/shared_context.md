# Shared Context — Library Management System

# Version: 1.0.0

# Status: APPROVED

# Last Updated: 2026-06-25

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
- BR-GEN-005: A member cannot borrow more than 5 active borrowed copies at the same time. Per business day, an FE04-approved member may request/receive at most 5 copies, while a `MEMBER` account without approved FE04 membership may request/receive at most 3 copies.
- BR-GEN-006: A member with overdue books or unpaid fines may be restricted from borrowing.
- BR-GEN-007: Every borrow transaction must store member, book, borrow date, due date, status, and creator. The default loan duration is 14 calendar days.
- BR-GEN-008: Every return transaction must update the related borrowing transaction.
- BR-GEN-009: Fine calculation must be traceable and testable. For Phase 1, overdue fine is 5,000 VND per overdue day per copy, starting the day after the due date.
- BR-GEN-010: Important administrative actions must be logged.

---

## 5.1 Phase 1 Baseline Business Decisions

These decisions close the shared Phase 0 business questions so that feature specs can use the same assumptions. If the teacher or team lead changes any decision, update this file first, then update the affected feature specs.

| Decision ID | Decision | Applies To |
| ----------- | -------- | ---------- |
| DEC-GEN-001 | A member may have at most 5 active borrowed copies at the same time. | FE07 Borrowing, FE08 Reservation, FE09 Fine, FE12 Reporting |
| DEC-GEN-002 | The default loan duration is 14 calendar days from the borrow approval date. | FE07 Borrowing, FE10 Notification, FE12 Reporting |
| DEC-GEN-003 | Overdue fine is 5,000 VND per overdue day per copy, starting the day after the due date. | FE07 Borrowing, FE09 Fine, FE10 Notification, FE12 Reporting |
| DEC-GEN-004 | Final user roles for Phase 1 are Guest, Member, Librarian, and Admin. System/Scheduler is an internal actor, not a login role. | FE02 Authentication, FE10 Notification, FE11 User & Role |

---

## 6. Data Entities (Confirmed)

These are the actual tables in the shared schema (`database/Librarymanagement.sql`). For how they
relate to each other, see the system ERD in
[`docs/architecture/feature-integration-map.md`](../docs/architecture/feature-integration-map.md) (Section 4.1).

| Entity | Purpose | Owning Feature(s) |
| ------ | ------- | ----------------- |
| `Users` | Login account information and status | FE02, FE11 |
| `Roles` | System permission roles | FE11 |
| `UserRoles` | Maps users to roles (many-to-many) | FE02, FE11 |
| `UserProfiles` | Personal profile details | FE03 |
| `Members` | Library reader record | FE04 |
| `MembershipApplications` | Membership apply/approval records | FE04 |
| `AuthTokens` | Hashed verification/reset/refresh tokens | FE02 |
| `Categories` | Book categories | FE05 |
| `Authors` | Author information | FE05 |
| `Publishers` | Publisher information | FE05 |
| `Books` | Book metadata | FE05 |
| `BookCopies` | Physical copies, barcode, status, availability | FE06 |
| `BorrowRequests` | Borrow request header | FE07 |
| `BorrowDetails` | Per-copy borrow/return/renewal records | FE07 |
| `Reservations` | Reservation queue / hold records | FE08 |
| `Fines` | Overdue/lost/damaged fine records | FE09 |
| `NotificationTemplates` | Reusable notification templates | FE10 |
| `Notifications` | Notification records | FE10 |
| `NotificationAttempts` | Delivery attempts / status | FE10 |
| `AuditLogs` | Important administrative actions | Cross-feature |

Any schema change must update `database/Librarymanagement.sql`, the relevant feature `SPEC.md`, and
`ADR-002-database-design.md` before implementation (see Migration Policy in ADR-002).

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

## 11. Phase 1 Baseline Decisions

| ID    | Question                                                          | Owner          | Status |
| ----- | ----------------------------------------------------------------- | -------------- | ------ |
| Q-001 | What technology stack will the team use for backend and frontend? | Team           | Resolved: Node.js + Express.js, React + Bootstrap, SQL Server, RESTful API |
| Q-002 | What is the maximum number of books a member can borrow?          | Team / Teacher | Resolved for Phase 1: 5 active borrowed copies per member |
| Q-003 | How many days can a member keep a borrowed book?                  | Team / Teacher | Resolved for Phase 1: 14 calendar days |
| Q-004 | How is overdue fine calculated?                                   | Team / Teacher | Resolved for Phase 1: 5,000 VND per overdue day per copy, starting the day after due date |
| Q-005 | Which roles are required in the final system?                     | Team           | Resolved for Phase 1: Guest, Member, Librarian, Admin. System/Scheduler is internal actor only |

These are Phase 1 baseline decisions. They may be revised only after team/teacher approval and must be propagated to all affected feature specs.

---

## 12. Notes for AI/Agent

When assisting this project, AI/agent must:

- Read [`.sdd/constitution.md`](constitution.md) first.
- Read this shared context before drafting specs.
- Never implement a core feature without its SPEC.md.
- Ask questions when business rules are missing.
- Keep the project suitable for a student SWP391 software engineering project.
