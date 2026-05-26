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

| Module                         | Description                                                           |
| ------------------------------ | --------------------------------------------------------------------- |
| Authentication & Authorization | Login, logout, role-based access control                              |
| Book Management                | Manage books, categories, authors, publishers, quantity, and status   |
| Member Management              | Manage library members/readers and their borrowing eligibility        |
| Borrow Book                    | Create borrowing transactions and update available quantity           |
| Return Book                    | Record returned books, update transaction status, and update quantity |
| Fine Management                | Calculate and manage overdue fines                                    |
| Report Management              | Generate reports for books, members, borrowing, returning, and fines  |

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

This list is not final. Database design must be confirmed in ADR and related feature specs.

---

## 7. Feature List

The current planned features are:

| Feature Folder         | Feature Name                   | Spec Level    |
| ---------------------- | ------------------------------ | ------------- |
| feat-auth              | Authentication & Authorization | Full Spec     |
| feat-book-management   | Book Management                | Standard Spec |
| feat-member-management | Member Management              | Standard Spec |
| feat-borrow-book       | Borrow Book                    | Full Spec     |
| feat-return-book       | Return Book                    | Full Spec     |
| feat-fine-management   | Fine Management                | Full Spec     |
| feat-report            | Report Management              | Standard Spec |

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
    └── feat-borrow-book/
```

Each feature folder must contain:

- SPEC.md
- CONTEXT.md
- PLAN.md
- TASKS.md
- CHANGELOG.md

Agent-facing memory lives under [`.agents/`](../.agents/) (see `.agents/AGENTS.md` and `.agents/CLAUDE.md`).

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
| Q-001 | What technology stack will the team use for backend and frontend? | Team           | Open   |
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
