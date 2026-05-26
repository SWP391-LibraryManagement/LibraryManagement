# CONTEXT.md — Borrow Book

# Version: 0.1.0

# Status: DRAFT (Week 3)

# Feature folder: `.sdd/specs/feat-borrow-book/`

---

## 1. Feature Purpose

Allow a library to record when a member borrows one or more books, while keeping the catalog quantity, the member's borrowing history, and the eligibility rules consistent. This feature is the entry point of the borrow → return → fine flow, so it must produce a transaction record that the other features can rely on.

---

## 2. Real-World Library Workflow

The typical workflow at a small/medium library:

1. A member walks up to the librarian's desk with one or more books and their member card.
2. The librarian identifies the member in the system and confirms the member is in good standing (not blocked, not over the borrowing limit, no unpaid fines that block borrowing).
3. For each book, the librarian scans or types the book code, the system checks that the book exists and that at least one copy is available.
4. The system creates a borrowing transaction with: member, book(s), borrow date, due date, status `BORROWED`, and the librarian who performed the action.
5. The available quantity of each borrowed book is decreased by 1.
6. The system gives the librarian a confirmation (printable or on-screen) and the member walks away with the books.

The same workflow is the source of the "Return Book" and "Fine Management" features later. Therefore, this feature must produce a clean, queryable transaction record.

---

## 3. Actors Involved

| Actor     | Role in this feature                                                                |
| --------- | ----------------------------------------------------------------------------------- |
| Librarian | Primary actor. Performs borrowing on behalf of the member at the desk.              |
| Member    | Person receiving the books. Identified by member code/ID. Does not borrow directly. |
| Admin     | May review borrowing records, override blocked members, and configure limits.       |
| Guest     | Out of scope for this feature. A guest cannot borrow.                               |

---

## 4. Known Business Rules (high-level)

These come from [`.sdd/constraints/business.md`](../../constraints/business.md) and [`.sdd/constitution.md`](../../constitution.md):

- A book cannot be borrowed if its available quantity is 0.
- A member cannot borrow more than the configured borrowing limit.
- A member with overdue books or unpaid fines may be restricted from borrowing.
- Every borrow transaction must be recorded with member, book(s), borrow date, due date, status, and creator.
- Only authorized roles (Librarian or Admin) may create borrow transactions.

Detailed values (exact limit number, due-date duration) are still **open questions**, see section 6.

---

## 5. Things This Feature Depends On

This feature reads or relies on data from other features:

- `feat-auth` — to know who is logged in and which role they have.
- `feat-member-management` — to look up the member, their status, and any active block.
- `feat-book-management` — to look up the book, its availability, and to update available quantity.
- `feat-fine-management` — to know whether a member has unpaid fines that should block borrowing.

If any of those features are not ready, the borrowing flow can still be drafted, but its acceptance criteria may need to mark the integration points as TBD.

---

## 6. Open Questions for Teacher / Team

| ID       | Question                                                                            | Owner          | Status |
| -------- | ----------------------------------------------------------------------------------- | -------------- | ------ |
| Q-BB-001 | What is the maximum number of books a member can borrow at the same time?           | Team / Teacher | Open   |
| Q-BB-002 | How many days is the default loan period for a borrowed book?                       | Team / Teacher | Open   |
| Q-BB-003 | Can a member borrow more books while they have unpaid fines? Hard block or warning? | Team / Teacher | Open   |
| Q-BB-004 | Can a librarian override the limit/eligibility checks, and is that override logged? | Team / Teacher | Open   |
| Q-BB-005 | Should a single transaction support multiple books, or one transaction per book?    | Team / Teacher | Open   |
| Q-BB-006 | Can a member self-request a borrow online (reservation), or is this librarian-only? | Team / Teacher | Open   |

These must be resolved before `SPEC.md` is moved out of `DRAFT`.

---

## 7. Assumptions (Marked As Assumptions)

These are **assumptions only**, used to make the Week 3 SPEC.md draftable. They are not approved rules. Each one must be confirmed before approval.

- ASSUMPTION-001: Borrowing is performed by a Librarian on behalf of a Member, in person, at the librarian's terminal. Self-service borrowing is not in scope this week.
- ASSUMPTION-002: A member is identified by a unique member code that is already issued by `feat-member-management`.
- ASSUMPTION-003: A book has an available-quantity counter that is updated synchronously when borrowing succeeds.
- ASSUMPTION-004: One borrow request creates one transaction record, even if multiple book copies are taken at the same time. Each book line inside the transaction tracks its own status.
- ASSUMPTION-005: The default loan period and the maximum borrowing limit are stored as system configuration, not hardcoded.
- ASSUMPTION-006: A member with unpaid fines above an unspecified threshold is blocked from borrowing. The threshold is configurable.
- ASSUMPTION-007: Borrow transactions are append-only. Corrections happen via separate operations (cancel/return), not by editing past records.

If any assumption is rejected by the teacher or team, the SPEC.md and CONTEXT.md must be updated together.

---

## 8. Out Of Scope For This Feature

The Borrow Book feature does not cover:

- Returning a borrowed book — handled by `feat-return-book`.
- Fine calculation and payment — handled by `feat-fine-management`.
- Member registration and member status changes — handled by `feat-member-management`.
- Adding or editing books and stock — handled by `feat-book-management`.
- Reports and statistics on borrowing — handled by `feat-report`.

---

## 9. Notes

- This CONTEXT.md is intentionally short and Week-3 sized. It will grow when the team confirms business answers and starts integrating with other features.
- The SPEC.md ([`SPEC.md`](SPEC.md)) is the source of truth once approved. This file just helps reviewers understand why the SPEC says what it says.
