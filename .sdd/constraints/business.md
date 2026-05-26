# Business Constraints — Library Management System

# Version: 0.1.0

# Status: DRAFT

> Project-wide business rules that every feature must respect. Feature-specific rules live in each feature's `SPEC.md` under `.sdd/specs/feat-{name}/SPEC.md`.

## 1. Domain Scope

The system manages:

- Books and book categories
- Members and membership status
- Borrowing transactions
- Returning transactions
- Overdue fines
- Reports and statistics
- User accounts, roles, and permissions

## 2. Roles

- **Admin**: full access to system configuration, user management, and all reports.
- **Librarian**: manages books, members, borrowing, returning, and fines.
- **Member**: can search the catalog and view their own borrowing history.
- **Guest**: read-only access to the public catalog.

Role definitions may be refined per feature, but no feature may grant a role broader access than declared here.

## 3. Core Business Rules

- BR-G-001: A book cannot be borrowed if its available quantity is 0.
- BR-G-002: A member cannot borrow more than the configured borrowing limit.
- BR-G-003: A member with overdue books or unpaid fines may be restricted from borrowing.
- BR-G-004: Every borrow and return transaction must be recorded with actor, timestamp, and book.
- BR-G-005: Fine calculation must be deterministic, traceable, and testable.
- BR-G-006: Admin actions affecting books, members, borrowing, returning, or fines must be auditable.

## 4. Data Integrity

- Soft-delete is preferred over hard-delete for entities tied to historical transactions (members, books, transactions).
- Every transaction record is immutable once committed; corrections happen through compensating records.

## 5. Identifiers

- Business identifiers visible to users (book code, member code, transaction code) must be human-readable and stable across the lifetime of the entity.
- Internal database primary keys must not be exposed in URLs or API responses unless explicitly required.

## 6. Time and Localization

- All timestamps are stored in UTC.
- Display timezone defaults to `Asia/Saigon` for the SWP391 context.
- Currency for fines defaults to VND.

## 7. Out of Scope

The Library Management System does **not** include:

- E-commerce or paid digital subscriptions.
- Inter-library loan with external libraries.
- Public-facing recommendation engines based on personal data.
