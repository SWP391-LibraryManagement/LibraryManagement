# CONTEXT.md - FE04 Membership Management

# Version: 0.1.0

# Status: DRAFT

# Owner: Dat

# Last Updated: 2026-06-10

# Feature folder: `.sdd/specs/feat-membership-management/`

---

## 1. Feature Purpose

Membership Management exists to control when a registered user becomes an approved library member who can use member-only services such as borrowing and reservation.

This feature must keep four things clear:

- Account registration belongs to FE02.
- Membership application and approval belong to FE04.
- Borrowing eligibility consumes membership status but does not approve membership.
- User role assignment belongs to FE11.

FE04 is a Standard Spec feature because it controls business eligibility and requires approval/rejection workflow, but it does not implement borrowing itself.

---

## 2. Real-World Workflow

The typical membership workflow:

1. A registered user applies for membership.
2. The system creates a membership application with status `PENDING`.
3. A librarian/admin reviews pending applications.
4. The librarian/admin approves or rejects the application.
5. The system records approval/rejection status and timestamp.
6. The member can view membership status.
7. FE07 and FE08 later use approved membership status to decide borrowing/reservation eligibility.

---

## 3. Feature Boundary

FE04 includes:

- Apply for membership.
- Approve membership application.
- Reject membership application.
- View membership status.
- Maintain membership application status and review timestamps.

FE04 does not include:

- Account registration, login, logout, password, or email verification. Those belong to FE02.
- Role assignment or user account activation/deactivation. That belongs to FE11.
- Profile editing. That belongs to FE03.
- Borrowing, renewal, return, or reservation execution. Those belong to FE07 and FE08.
- Fine calculation or payment. That belongs to FE09.

---

## 4. Current Data Model Notes

The current SQL script includes:

- `Users(UserId, Username, Email, PasswordHash, Phone, Status, CreatedAt)`
- `MembershipApplications(ApplicationId, UserId, Status, AppliedAt, ApprovedAt)`
- `UserRoles(UserId, RoleId)`

Potential issues to review:

- The current table has `ApprovedAt` but no `RejectedAt`, `ReviewedBy`, or rejection reason.
- The current schema does not separately store membership expiry or membership number.
- The current schema does not define whether one user can submit multiple applications over time.
- The current schema does not define a final membership status separate from latest application status.
- FE07/FE08 need a stable way to determine whether membership is approved.

These are not blockers for drafting, but they must be resolved before implementation.

---

## 5. Main Use Cases From Assignment Sheet

| Use Case ID | Use Case Name | Owner |
| ----------- | ------------- | ----- |
| UC13 | Apply for Membership | Dat |
| UC14 | Approve Membership Application | Dat |
| UC15 | Reject Membership Application | Dat |
| UC16 | View Membership Status | Dat |

---

## 6. Feature Tests From Assignment Sheet

| Test ID | Test Name | Owner |
| ------- | --------- | ----- |
| FT14 | Submit membership application | Dat |
| FT15 | Approve membership | Dat |
| FT16 | Reject membership | Dat |
| FT17 | View membership status | Dat |

---

## 7. Key Risks

- Duplicate pending applications may create inconsistent approval decisions.
- Borrowing/reservation features may read membership status differently if status rules are unclear.
- Rejection without reason may confuse applicants and librarians.
- Approval/rejection actions may be performed by unauthorized users if RBAC is missing.
- Data model may not support future membership expiry or re-application unless decisions are recorded.

---

## 8. Dependencies

| Dependency | Why It Matters |
| ---------- | -------------- |
| FE02 Authentication | User must have an account before applying. |
| FE03 User Profile | Profile data may help review membership applications. |
| FE07 Borrowing Management | Requires approved membership before borrowing. |
| FE08 Reservation Management | Requires approved membership before reservation if policy says so. |
| FE11 User & Role Management | Provides librarian/admin roles for approval and rejection. |
| SQL Server database | Stores users and membership applications. |

---

## 9. Open Questions For Team / Teacher

| ID | Question | Owner | Status |
| -- | -------- | ----- | ------ |
| Q-FE04-001 | Can a user submit a new application after rejection? | Team/Teacher | Open |
| Q-FE04-002 | Should rejection reason be required? | Team/Teacher | Open |
| Q-FE04-003 | Should membership have expiry date or renewal? | Team/Teacher | Open |
| Q-FE04-004 | Does approved membership change user role, or only application status? | Team/Teacher | Open |
| Q-FE04-005 | Should librarians and admins both approve/reject membership applications? | Team/Teacher | Open |

---

## 10. Notes For Implementation Later

- Do not implement until `SPEC.md` is reviewed and approved.
- `PLAN.md` and `TASKS.md` stay `NOT STARTED` until approval.
- Approval/rejection must be server-side role-protected.
- Avoid duplicate active/pending applications for the same user.
- Keep FE04 status rules easy for FE07 and FE08 to consume.
