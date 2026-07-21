# Business Constraints — Library Management System

# Version: 0.1.1

# Status: APPROVED - PHASE 1 BASELINE

# Last Updated: 2026-07-20

> Project-wide, high-level business rules every feature must respect. Detailed rules live in each feature's `SPEC.md` under [`.sdd/specs/feat-{name}/SPEC.md`](../specs).

## High-Level Business Rules

- BR-G-001: A book cannot be borrowed if its available quantity is 0.
- BR-G-002: A member cannot borrow more than 5 active borrowed copies at the same time. Daily borrowing is tiered by FE04 status: `APPROVED` members have a 5-copy daily limit; other active `MEMBER` accounts have a 3-copy daily limit.
- BR-G-003: A member with overdue books or unpaid fines may be restricted from borrowing.
- BR-G-004: Every borrow and return transaction must be recorded.
- BR-G-005: Fine calculation must be traceable and testable.
- BR-G-006: The default loan duration is 14 calendar days from the borrow approval date.
- BR-G-007: Overdue fine is 5,000 VND per overdue day per copy, starting the day after the due date.
- BR-G-008: Phase 1 user roles are Guest, Member, Librarian, and Admin. System/Scheduler is an internal actor, not a login role.

> These Phase 1 baseline decisions come from `.sdd/shared_context.md`. If the teacher or team lead changes them, update shared context, this file, and all affected feature specs together.
