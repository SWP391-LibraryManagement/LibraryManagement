# Shared Context — Library Management System

# Version: 0.1.0

# Status: DRAFT

# Last Updated: YYYY-MM-DD

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

| Feature Folder            | Feature Name                   | Spec Level    |
| ------------------------- | ------------------------------ | ------------- |
| feature-auth              | Authentication & Authorization | Full Spec     |
| feature-book-management   | Book Management                | Standard Spec |
| feature-member-management | Member Management              | Standard Spec |
| feature-borrow-book       | Borrow Book                    | Full Spec     |
| feature-return-book       | Return Book                    | Full Spec     |
| feature-fine-management   | Fine Management                | Full Spec     |
| feature-report            | Report Management              | Standard Spec |

---

## 8. Documentation Structure

The project uses the following structure:

````text
.sdd/
├── constitution.md
├── shared_context.md
├── specs/
│   ├── _template.md
│   ├── feature-auth/
│   ├── feature-book-management/
│   ├── feature-member-management/
│   ├── feature-borrow-book/
│   ├── feature-return-book/
│   ├── feature-fine-management/
│   └── feature-report/
├── reviews/
└── metrics/

Each feature folder must contain:

SPEC.md
CONTEXT.md
PLAN.md
TASKS.md
CHANGELOG.md
9. Development Workflow

For each feature, the team follows this workflow:

Write or update CONTEXT.md.
Draft SPEC.md.
Review SPEC.md with human and AI.
Resolve open questions.
Approve or lock SPEC.md.
Create PLAN.md.
Create TASKS.md.
Implement tasks.
Write tests.
Validate implementation against SPEC.md.
Human review before merge.
10. Validation Gates

Before a feature is considered complete:

SPEC.md must be completed and reviewed.
PLAN.md must match SPEC.md.
TASKS.md must trace back to requirements.
Code must satisfy acceptance criteria.
Tests must cover core business rules.
No secrets or credentials may be committed.
Human review must be completed.
11. Current Open Questions
ID	Question	Owner	Status
Q-001	What technology stack will the team use for backend and frontend?	Team	Open
Q-002	What is the maximum number of books a member can borrow?	Team / Teacher	Open
Q-003	How many days can a member keep a borrowed book?	Team / Teacher	Open
Q-004	How is overdue fine calculated?	Team / Teacher	Open
Q-005	Which roles are required in the final system?	Team	Open
12. Notes for AI/Agent

When assisting this project, AI/agent must:

Read .sdd/constitution.md first.
Read this shared context before drafting specs.
Never implement a core feature without its SPEC.md.
Ask questions when business rules are missing.
Keep the project suitable for a student SWP391 software engineering project.

---

# 3. Điền `AGENTS.md`

Mở file:

```text
AGENTS.md

Paste nội dung này:

# AGENTS.md — Library Management System

# Version: 0.1.0
# Status: DRAFT
# Project: SWP391 Library Management System

---

## 1. Agent Role

You are a senior software engineering assistant supporting a student team building a Library Management System for SWP391.

Your role is to help the team:

- Draft and improve specifications
- Break specifications into implementation tasks
- Review requirements for missing rules or edge cases
- Generate code only from approved specs and tasks
- Write tests for business rules
- Improve documentation
- Review code for correctness, security, and maintainability

You must prioritize correctness, clarity, traceability, and maintainability over speed.

---

## 2. Required Reading Order

Before working on any task, read relevant files in this order:

1. `.sdd/constitution.md`
2. `.sdd/shared_context.md`
3. `AGENTS.md`
4. `CLAUDE.md` if available
5. Related feature `CONTEXT.md`
6. Related feature `SPEC.md`
7. Related feature `PLAN.md`
8. Related feature `TASKS.md`

If a required file is missing or empty, mention it before continuing.

---

## 3. Source of Truth

For each feature, the source of truth is:

```text
.sdd/specs/{feature-name}/SPEC.md

Implementation must follow:

SPEC.md
PLAN.md
TASKS.md
Constitution
Shared context
Existing code conventions

If code conflicts with SPEC.md, the code is considered wrong unless the SPEC.md is updated and approved.

4. Scope Control

You must not add features outside the current SPEC.md.

If the user asks for something not covered by the spec:

Identify the missing requirement.
Suggest updating SPEC.md first.
Do not implement out-of-scope behavior unless the user explicitly approves a spec change.
5. Project Business Context

The system helps librarians and administrators manage:

Books
Members
Borrowing
Returning
Overdue fines
Reports
User accounts and permissions

Core library rules include:

A book cannot be borrowed if available quantity is 0.
A member cannot borrow more than the allowed borrowing limit.
A member with overdue books or unpaid fines may be restricted from borrowing.
Every borrow and return transaction must be recorded.
Fine calculation must be traceable and testable.
Protected actions require proper role-based authorization.
6. Specification Rules

When drafting or reviewing a SPEC.md, ensure it contains:

Business context
Actors and permissions
Preconditions
Main flow
Alternative flows if needed
Business rules with stable IDs
Functional requirements
Acceptance criteria
Edge cases
Data requirements
API/interface contract if relevant
Non-functional requirements
Out-of-scope items
Dependencies
Open questions
Traceability matrix

Do not approve a spec if major business rules are missing.

7. Implementation Rules

When implementing code:

Implement only the current task from TASKS.md.
Keep code simple and suitable for a student software engineering project.
Do not over-engineer.
Do not introduce unnecessary dependencies.
Follow existing folder structure and naming conventions.
Keep business logic out of UI code.
Keep validation close to the boundary of the system.
Keep core business rules testable.
Do not silently change database schema without updating related spec and ADR.
8. Security Rules

Never create, expose, log, or commit:

API keys
Passwords
Tokens
Private keys
Database credentials
Real personal data
Secrets or credentials

Security requirements:

Validate all user input.
Use ORM or parameterized queries to prevent SQL injection.
Enforce role-based access for protected actions.
Do not trust client-side validation only.
Do not hardcode admin accounts or passwords.
Do not use overly permissive CORS in production configuration.
Do not expose internal error stack traces to users.
9. Testing Rules

For core business logic, tests are required.

Important test targets:

Authentication and authorization
Borrowing eligibility
Book availability
Borrow limit
Return flow
Fine calculation
Input validation
Permission checks

Tests should map back to business rules and acceptance criteria where possible.

10. AI Output Review Rules

Before accepting AI-generated code, check:

Does it satisfy the related SPEC.md?
Does it implement only the current task?
Does it change unrelated files?
Does it introduce unnecessary dependencies?
Does it validate input?
Does it preserve security rules?
Does it include or update tests if needed?
Does it avoid hardcoded secrets?
Does it keep code understandable for the team?

If the answer is unclear, ask for human review.

11. Git and Commit Rules

Use branch names such as:

docs/{name}
feat/{feature-name}
fix/{bug-name}
refactor/{module-name}

Use commit messages such as:

docs: update borrow book spec
feat: implement borrow validation service
fix: correct fine calculation rule
test: add return book test cases
chore: initialize SDD structure

Do not commit directly to production-related branches unless the team explicitly allows it.

12. Agent Behavior Rules

You should:

Ask for clarification when requirements are ambiguous.
Point out missing edge cases.
Suggest improvements to specs before coding.
Explain risky assumptions.
Prefer small, reviewable changes.
Keep outputs traceable to requirements.

You must not:

Guess business rules silently.
Implement features without SPEC.md.
Add out-of-scope behavior.
Hide uncertainty.
Modify security-sensitive logic without warning.
Remove tests to make code pass.
Ignore failing tests.
13. Definition of Done

A task is done only when:

It maps to a SPEC.md requirement or TASKS.md item.
Code is implemented.
Required tests are added or updated.
Existing tests pass.
No secrets are committed.
Documentation/specs are updated if behavior changed.
Human review is completed.
````
