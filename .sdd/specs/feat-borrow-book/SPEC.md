# SPEC.md — Borrow Book

# Version: 0.1.0

# Status: DRAFT

# Owner: TBD

# Last Updated: 2026-05-26

# Feature folder: `.sdd/specs/feat-borrow-book/`

> Source of truth for the Borrow Book feature. This is a Week 3 DRAFT. It must not be approved or implemented until the open questions in [`CONTEXT.md`](CONTEXT.md) are resolved.

---

## 1. Business Context

In a Library Management System, "Borrow Book" is the action of recording that a Member takes one or more books out of the library for a limited time. It is the operational core of the system, because every later flow (return, overdue, fine, report) depends on the data this feature produces.

The goal of this feature is to:

- Make sure only eligible members can borrow.
- Make sure only available books can be borrowed.
- Produce a clean, auditable transaction record.
- Keep the available-quantity of each book consistent with reality.

A more detailed narrative is in [`CONTEXT.md`](CONTEXT.md).

---

## 2. Actors

| Actor     | Description                                    | Permission in this feature                                                        |
| --------- | ---------------------------------------------- | --------------------------------------------------------------------------------- |
| Librarian | Library staff at the desk                      | Can create a borrow transaction on behalf of a member                             |
| Admin     | System manager                                 | Can do everything a librarian can; may override blocked-member checks (TBD)       |
| Member    | Library reader who actually receives the books | Identified by member code; cannot self-create borrow transactions in Week 3 scope |
| Guest     | Unauthenticated visitor                        | Cannot borrow                                                                     |

---

## 3. Preconditions

The Borrow Book flow can only start when:

- PRE-001: The acting user is authenticated and has role `Librarian` or `Admin`.
- PRE-002: The target member exists and is identified by a unique member code.
- PRE-003: The target member is in an active state (not deactivated or blocked).
- PRE-004: At least one selected book exists in the catalog.
- PRE-005: At least one selected book has `available_quantity >= 1`.
- PRE-006: System configuration for borrowing limit and default loan period is loaded (see [`ASSUMPTION-005` in CONTEXT.md](CONTEXT.md#7-assumptions-marked-as-assumptions)).

If any precondition fails, the system must reject the borrow attempt with a clear, non-technical error message.

---

## 4. Main Flow

> **Week 3 assumption:** This flow models a borrow as a single transaction that may contain multiple book lines (one transaction, many books). This is an assumption for Week 3 and must be confirmed via [`Q-BB-005`](CONTEXT.md#6-open-questions-for-teacher--team) before this SPEC leaves DRAFT. If the team decides on "one transaction per book" instead, sections 4, 5, 6, and 8 must be revised.

1. Librarian opens the "Borrow Book" screen and selects a member by member code.
2. System loads the member, their current borrowed-count, and any active block reasons.
3. System validates the member is eligible to borrow (BR-001..BR-003).
4. Librarian adds one or more books to the borrow basket by book code.
5. For each book, the system verifies that `available_quantity >= 1` (BR-004) and that adding it does not exceed the borrowing limit for the member (BR-002).
6. Librarian confirms the borrow.
7. The system creates one borrow transaction containing: member, list of book lines, borrow date (now), due date (now + configured loan period), status `BORROWED`, and the acting librarian.
8. For each borrowed book, the system decreases `available_quantity` by 1.
9. The system records an audit log entry for the transaction (BR-006).
10. The system returns a success confirmation to the librarian.

If any step fails, the entire borrow transaction is rejected; partial borrows are not allowed.

---

## 5. Alternative Flows

> Alternative flows will be expanded once the open questions in [`CONTEXT.md`](CONTEXT.md) are answered. For Week 3, only the most important rejection path is documented.

### AF-001: Borrow rejected because member is not eligible

1. Librarian selects a member.
2. System detects: member is blocked, has unpaid fines above threshold, or has hit the borrowing limit.
3. System rejects the borrow before any book is reserved.
4. System shows the librarian the specific reason.
5. No transaction is created and no quantity is changed.

### AF-002: Borrow rejected because a book is not available

1. Librarian adds a book whose `available_quantity` is 0.
2. System rejects that book line and prompts the librarian to remove it.
3. The librarian may continue with the remaining books or cancel the whole borrow.

---

## 6. Business Rules

Stable IDs so requirements can be traced to tasks and tests.

- BR-001: Only users with role `Librarian` or `Admin` may create a borrow transaction.
- BR-002: A member cannot exceed the configured borrowing limit (`MAX_ACTIVE_BORROWS`). The exact value is TBD; see [`Q-BB-001`](CONTEXT.md#6-open-questions-for-teacher--team).
- BR-003: A member who is blocked, deactivated, or has unpaid fines above the configured threshold cannot borrow. The threshold and override behavior are TBD; see [`Q-BB-003`](CONTEXT.md#6-open-questions-for-teacher--team) and [`Q-BB-004`](CONTEXT.md#6-open-questions-for-teacher--team).
- BR-004: A book cannot be borrowed if its `available_quantity` is 0.
- BR-005: Every successful borrow transaction must record member, book(s), borrow date, due date, status, and the acting user.
- BR-006: Every borrow attempt — successful or rejected — must create an audit log entry that names the actor, the member, and the outcome.
- BR-007: Available quantity must be updated atomically with the borrow transaction. The system must never produce a transaction without updating quantity, and must never decrease quantity without producing a transaction.
- BR-008: A borrow transaction, once committed, is immutable. Corrections happen through separate flows (cancel, return) handled by other features.

---

## 7. Functional Requirements

EARS-style.

- FR-001: When the librarian submits a borrow request, the system shall validate the actor's role, the member's eligibility, and each book's availability before creating any record.
- FR-002: If any validation in FR-001 fails, the system shall reject the entire borrow request and shall not change any data.
- FR-003: When validations pass, the system shall create exactly one borrow transaction, decrease available quantities, and write an audit log atomically.
- FR-004: The system shall compute `due_date` as `borrow_date + LOAN_PERIOD_DAYS`, where `LOAN_PERIOD_DAYS` is loaded from system configuration. The exact value is TBD; see [`Q-BB-002`](CONTEXT.md#6-open-questions-for-teacher--team).
- FR-005: The system shall return a confirmation to the librarian with the new transaction code, member, list of borrowed books, borrow date, and due date.

---

## 8. Acceptance Criteria

Given / When / Then.

- AC-001: Given an authenticated librarian and an eligible member with one available book selected, when the librarian confirms the borrow, then a transaction is created with status `BORROWED`, the book's `available_quantity` decreases by 1, an audit log is written, and the librarian sees a success confirmation.
- AC-002: Given a member who has reached `MAX_ACTIVE_BORROWS`, when the librarian tries to add another book, then the system rejects the borrow before any record is created and shows a "borrowing limit reached" message.
- AC-003: Given a member who is blocked or has unpaid fines above the configured threshold, when the librarian tries to borrow, then the system rejects the borrow and shows the specific reason.
- AC-004: Given a book whose `available_quantity` is 0, when the librarian adds it to the basket, then the system rejects that line and does not let the borrow be confirmed with that book.
- AC-005: Given a successful borrow of N books, when the system commits, then exactly one transaction is created, exactly N book quantities are decreased by 1 each, and the audit log contains exactly one entry referencing the new transaction.
- AC-006: Given any failure during commit (validation, concurrency, database error), when the system aborts, then no transaction record exists and no available-quantity values are changed.
- AC-007: Given a borrow attempt that is rejected for any reason (ineligible member, unavailable book, validation error, role denied), when the system rejects the request, then an audit log entry is created that records the actor, the target member, the attempted books, the rejection reason, and the timestamp; no borrow transaction is created and no available-quantity is changed.

---

## 9. Edge Cases

| ID     | Edge Case                                                                    | Expected System Behavior                                                                  |
| ------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| EC-001 | Two librarians try to borrow the last copy of the same book at the same time | Only one succeeds; the other gets a "no longer available" rejection                       |
| EC-002 | Member's fines change between the eligibility check and the commit           | The commit re-checks eligibility; if it fails, the borrow is rejected                     |
| EC-003 | Network or database failure mid-commit                                       | The whole borrow is rolled back; no transaction, no quantity change, no audit drift       |
| EC-004 | Librarian submits an empty basket                                            | The system rejects with "at least one book is required"                                   |
| EC-005 | Librarian submits a basket with the same book listed twice                   | The system either rejects with a duplicate error or treats it as quantity 2 — TBD by team |
| EC-006 | Member code is not found                                                     | The system rejects with "member not found"                                                |
| EC-007 | Book code is not found                                                       | The system rejects with "book not found" for that line                                    |

---

## 10. Out Of Scope

This feature does not include:

- Returning a book or recording return state. Owned by `feat-return-book`.
- Fine calculation, payment, or waiver. Owned by `feat-fine-management`.
- Creating or editing members. Owned by `feat-member-management`.
- Creating or editing books and stock. Owned by `feat-book-management`.
- Reservations or holds for unavailable books.
- Self-service borrow by members without a librarian.
- Reporting on borrowing trends. Owned by `feat-report`.
- Detailed API contract and database schema (still TBD; see section 12).

---

## 11. Open Questions

Mirrors [`CONTEXT.md` section 6](CONTEXT.md#6-open-questions-for-teacher--team). Must be resolved before this SPEC leaves `DRAFT`.

| ID       | Question                                                                               | Status |
| -------- | -------------------------------------------------------------------------------------- | ------ |
| Q-BB-001 | What is `MAX_ACTIVE_BORROWS`?                                                          | Open   |
| Q-BB-002 | What is `LOAN_PERIOD_DAYS`?                                                            | Open   |
| Q-BB-003 | How do unpaid fines block borrowing? Hard block, soft warn, or threshold?              | Open   |
| Q-BB-004 | Can librarians/admins override eligibility checks, and is the override logged?         | Open   |
| Q-BB-005 | Single transaction with multiple book lines, or one transaction per book?              | Open   |
| Q-BB-006 | Will members be able to self-request a borrow (reservation flow) in a later milestone? | Open   |

---

## 12. API And Data Notes (TBD)

- API contract: TBD. Will be added once Q-BB-005 is decided and a tech stack is chosen. The endpoint will live behind authentication and require role `Librarian` or `Admin`.
- Database schema: TBD. Likely entities are `BorrowTransaction`, `BorrowLine`, and `AuditLog`, but the exact shape will be confirmed in an ADR under [`docs/adr/`](../../../docs/adr).

---

## 13. Non-functional Requirements (Draft)

These are initial NFR targets for the Borrow Book feature. Concrete numbers will be confirmed once the tech stack is chosen.

- NFR-001 (Performance): A single borrow request with up to 5 book lines should complete within a reasonable interactive time at the librarian desk (target TBD, e.g. < 2 seconds at p95 under normal load).
- NFR-002 (Consistency): The borrow transaction, the available-quantity decrement, and the audit log entry must be committed atomically. The system must never leave any of these three in a partial state.
- NFR-003 (Concurrency): When two librarians try to borrow the last copy of a book at the same time, only one must succeed; the other must receive a clear "no longer available" rejection (see EC-001).
- NFR-004 (Auditability): Every borrow attempt, successful or rejected, must produce exactly one audit log entry that is sufficient for after-the-fact review (see BR-006, AC-005, AC-007).
- NFR-005 (Security): The borrow endpoint must require authentication and the `Librarian` or `Admin` role. All input must be validated server-side; client-side validation alone is not sufficient.
- NFR-006 (Usability): Rejection messages shown to the librarian must be specific and non-technical (for example, "borrowing limit reached" rather than a stack trace or error code).

---

## 14. Traceability Placeholder

To be filled in once `PLAN.md` and `TASKS.md` are written.

| Requirement ID | Related Task ID | Related Test Case ID | Status |
| -------------- | --------------- | -------------------- | ------ |
| BR-001         | TBD             | TBD                  | Draft  |
| BR-002         | TBD             | TBD                  | Draft  |
| BR-003         | TBD             | TBD                  | Draft  |
| BR-004         | TBD             | TBD                  | Draft  |
| BR-005         | TBD             | TBD                  | Draft  |
| BR-007         | TBD             | TBD                  | Draft  |
| FR-001         | TBD             | TBD                  | Draft  |
| FR-003         | TBD             | TBD                  | Draft  |
| AC-001         | TBD             | TBD                  | Draft  |
| AC-005         | TBD             | TBD                  | Draft  |

---

## 15. Review Checklist

This SPEC.md is **not** ready for approval until:

- [ ] Open questions Q-BB-001 .. Q-BB-006 are answered.
- [ ] Section 11 (Open Questions) is empty or all marked `Resolved`.
- [ ] API contract section is filled in or explicitly deferred to a follow-up ADR.
- [ ] Database notes are confirmed against an ADR.
- [ ] PLAN.md and TASKS.md are drafted and trace back to the IDs above.
- [ ] Human reviewer has signed off in [`.sdd/reviews/`](../../reviews).
