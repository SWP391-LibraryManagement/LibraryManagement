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

## 2026-06-10

- Updated API contract policy to allow approval in `SPEC.md` unless the team reintroduces a shared API contract document.

## 2026-06-10 - Phase 1 Review Decisions Approved

- Approved open-question decisions from `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.
- Updated `SPEC.md` decision status from draft/proposed/open to approved where applicable.
- Preserved Phase 1 scope controls and deferred future-work items explicitly.

## 2026-06-15

- Updated FE11 create-account behavior so admin-created member and librarian accounts are created with `ACTIVE` status immediately.
- Kept password setup as a separate FE02 flow; admin still does not enter or view user passwords.

## 2026-06-21

- Clarified that admin-created account setup notification queuing must tolerate Phase 1 notification schema/template differences.
- Documented that a valid create-user flow must not return an internal server error solely because optional notification content columns are unavailable.

## 2026-06-25

- Bumped version 0.1.0 -> 0.2.0 (MINOR). Status unchanged (APPROVED).
- Added section 7.1 with 15 new EARS Unwanted-behavior functional requirements (FR-FE11-015 to FR-FE11-029) promoting existing Alternative Flows, Business Rules, Edge Cases, and Resolved Questions into traceable error/abnormal-condition requirements.
- Coverage of Unwanted-behavior FRs raised from ~21% (3 of 14) to ~62% (18 of 29), exceeding the >=30% target per Spec-Driven Development EARS guidance.
- Each new FR traces back to its source EC/BR/AF/Q; no new logic invented.
- Updated section 16 Traceability Matrix: added a dedicated Unwanted-Behavior table mapping each new FR to its source BR/EC/AF/Q and test case (TBD where no test is allocated yet), and refreshed the Coverage Summary totals.

## 2026-06-30

- Bumped `SPEC.md` version to 0.3.0 and updated Last Updated to 2026-06-30.
- Added admin console requirements for sidebar visibility, Dashboard, Permissions, Audit Logs, and Request Management.
- Documented that Confirm Payment and Confirm Borrow are removed from the admin sidebar in the current prototype.
- Clarified that admin Reports-style content is consolidated into Dashboard while detailed reporting remains FE12.
- Added request-management rule: pending requests may expose action controls; completed requests are view-only.
- Added BR-FE11-016..020, FR-FE11-030..035, AC-FE11-016..019, EC-FE11-016..018, and Q-FE11-011..013.
