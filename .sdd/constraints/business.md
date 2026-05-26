# Business Constraints — Library Management System

# Version: 0.1.0

# Status: DRAFT (Week 3)

> Project-wide, high-level business rules every feature must respect. Detailed rules live in each feature's `SPEC.md` under [`.sdd/specs/feat-{name}/SPEC.md`](../specs).

## High-Level Business Rules

- BR-G-001: A book cannot be borrowed if its available quantity is 0.
- BR-G-002: A member cannot borrow more than the configured borrowing limit.
- BR-G-003: A member with overdue books or unpaid fines may be restricted from borrowing.
- BR-G-004: Every borrow and return transaction must be recorded.
- BR-G-005: Fine calculation must be traceable and testable.

> Additional domain decisions (data integrity, identifiers, localization, out-of-scope items) will be added in later weeks once the core flows are approved.
