# Week 2 Spec Draft Coverage Review

Date: 2026-06-10
Source: `C:/Users/admin/Downloads/Library Management (4).xlsx`
Scope: Compare Excel UC/FT assignment list against `.sdd/specs/*/SPEC.md`.

## Verdict

Week 2 Spec Draft is broadly complete: every Excel UC/FT item has a likely matching requirement or acceptance criterion by name in the approved feature specs.

Remaining cleanup before closing Week 2: add or normalize explicit UC/FT IDs in specs where the name is present but the exact Excel ID is missing.

## Summary

| Feature | Excel Items | Exact UC/FT IDs Found | Name Match Found | Status |
|---|---:|---:|---:|---|
| FE01 | 8 | 8 | 8 | OK |
| FE02 | 13 | 7 | 13 | OK |
| FE03 | 4 | 4 | 4 | OK |
| FE04 | 8 | 8 | 8 | OK |
| FE05 | 16 | 16 | 16 | OK |
| FE06 | 8 | 8 | 8 | OK |
| FE07 | 14 | 14 | 14 | OK |
| FE08 | 10 | 10 | 10 | OK |
| FE09 | 8 | 8 | 8 | OK |
| FE10 | 8 | 4 | 8 | OK |
| FE11 | 18 | 9 | 18 | OK |
| FE12 | 6 | 6 | 6 | OK |

## Exact ID Cleanup Needed

| Feature | ID | Excel Name | Owner | Name Score | Spec |
|---|---|---|---|---:|---|
| FE02 | UC05 | Register Account | Đạt | 1.00 | `.sdd/specs/feat-auth/SPEC.md` |
| FE02 | UC06 | Login | Đạt | 1.00 | `.sdd/specs/feat-auth/SPEC.md` |
| FE02 | UC07 | Logout | Đạt | 1.00 | `.sdd/specs/feat-auth/SPEC.md` |
| FE02 | UC08 | Change Password | Đạt | 1.00 | `.sdd/specs/feat-auth/SPEC.md` |
| FE02 | UC09 | Forgot Password | Đạt | 1.00 | `.sdd/specs/feat-auth/SPEC.md` |
| FE02 | UC10 | Reset Password | Đạt | 1.00 | `.sdd/specs/feat-auth/SPEC.md` |
| FE10 | UC45 | Send Account Verification Notification | Nhật | 1.00 | `.sdd/specs/feat-notification-management/SPEC.md` |
| FE10 | UC46 | Send Password Reset Notification | Nhật | 1.00 | `.sdd/specs/feat-notification-management/SPEC.md` |
| FE10 | UC47 | Send Book Reservation Notification | Nhật | 1.00 | `.sdd/specs/feat-notification-management/SPEC.md` |
| FE10 | UC48 | Send Due Date Or Fine Notification | Nhật | 1.00 | `.sdd/specs/feat-notification-management/SPEC.md` |
| FE11 | UC49 | View User List | Dũng | 1.00 | `.sdd/specs/feat-user-role-management/SPEC.md` |
| FE11 | UC50 | View User Information | Dũng | 1.00 | `.sdd/specs/feat-user-role-management/SPEC.md` |
| FE11 | UC51 | Create User Account | Dũng | 1.00 | `.sdd/specs/feat-user-role-management/SPEC.md` |
| FE11 | UC52 | Update User Information | Dũng | 1.00 | `.sdd/specs/feat-user-role-management/SPEC.md` |
| FE11 | UC53 | Deactivate User Account | Dũng | 1.00 | `.sdd/specs/feat-user-role-management/SPEC.md` |
| FE11 | UC54 | Create Librarian Account | Dũng | 1.00 | `.sdd/specs/feat-user-role-management/SPEC.md` |
| FE11 | UC55 | Update Librarian Account | Dũng | 1.00 | `.sdd/specs/feat-user-role-management/SPEC.md` |
| FE11 | UC56 | Deactivate Librarian Account | Dũng | 1.00 | `.sdd/specs/feat-user-role-management/SPEC.md` |
| FE11 | UC57 | Manage Roles | Dũng | 1.00 | `.sdd/specs/feat-user-role-management/SPEC.md` |

## Recommended Week 2 Closeout Actions

1. Team owners review the ID cleanup table and decide whether specs must include the Excel UC/FT IDs explicitly.
2. If yes, update the related SPEC.md traceability matrix only; do not change business behavior.
3. After owner sign-off, mark Week 2 Spec Draft as closed and proceed to Week 3 review/finalization gates.

