# CHANGELOG.md - FE11 User & Role Management

## 2026-06-03

- Created FE11 User & Role Management feature specification structure.
- Established specification files: CONTEXT.md, SPEC.md, PLAN.md, TASKS.md, and CHANGELOG.md.
- Expanded scope to include user list viewing, account creation (members/librarians), user information updates, account deactivation, librarian account management, and role management.
- Added stable requirement IDs for business rules, functional requirements, acceptance criteria, edge cases, and open questions.
- Identified key risks related to access control, account lockout, and audit logging.
- Clarified secure admin-created account setup: no admin-entered passwords, inactive before setup, setup completed through FE02.

## 2026-06-09

- Set FE11 owner to Dung according to the latest assignment sheet.
- Merged relevant scope from the legacy `.sdd/specs/feat-role-and-management` draft into the canonical `.sdd/specs/feat-user-role-management` folder.
- Aligned FE11 use cases and feature tests with the assignment sheet: UC49-UC57 and FT50-FT58.
- Kept update/deactivate librarian account flows from the legacy draft.
- Moved account unlock, account reactivation, and admin-initiated password reset out of the main FE11 assignment scope unless explicitly approved later.
