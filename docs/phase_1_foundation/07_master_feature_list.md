# Master Feature List

## 1. Purpose

This document is the official source of truth for the feature list of the Library Management System.

All use cases, feature specs, API contracts, database changes, tests, and team assignments must map back to one of the feature IDs in this list.

## 2. Master Feature List

| Feature ID | Feature Name                     | Spec Folder                   | Spec Level | Description |
| ---------- | -------------------------------- | ----------------------------- | ---------- | ----------- |
| FE01       | Public / Browse                  | feat-public-browse            | Standard   | Allow guests to search books, browse the book catalog, and view book details. |
| FE02       | Authentication                   | feat-auth                     | Full       | Support account registration, login, logout, forgot password, and reset password. |
| FE03       | User Profile                     | feat-user-profile             | Standard   | Manage personal profile information for members and librarians. |
| FE04       | Membership Management            | feat-membership-management    | Standard   | Support membership application, approval/rejection, and membership status management. |
| FE05       | Book Management                  | feat-book-management          | Standard   | Add, update, deactivate, and display book information in the library. |
| FE06       | Inventory / Book Copy Management | feat-inventory-book-copy      | Full       | Manage physical book copies, barcodes, locations, statuses, and borrow availability. |
| FE07       | Borrowing Management             | feat-borrowing-management     | Full       | Support borrowing, returning, renewal, and borrowing history management. |
| FE08       | Reservation Management           | feat-reservation-management   | Standard   | Support book reservation, reservation cancellation, and reservation queue management. |
| FE09       | Fine Management                  | feat-fine-management          | Full       | Calculate fines, record fine collection, mark fines as paid, and notify overdue violations. |
| FE10       | Notification Management          | feat-notification-management  | Standard   | Send email or in-app notifications for account verification, reservations, due dates, and fines. |
| FE11       | User & Role Management           | feat-user-role-management     | Full       | Manage users, librarians, roles, and system permissions. |
| FE12       | Reporting & Statistics           | feat-reporting-statistics     | Standard   | Provide statistics for books, borrowing, members, and system reports. |

## 3. Scope Notes

- FE07 Borrowing Management and FE08 Reservation Management are separate features.
- FE07 maps to borrow and return flows.
- FE08 maps to reservation and reservation queue flows.
- Online payment gateway is out of scope. FE09 only records fine collection and paid status.
- Study seat reservation is out of scope for the current project version.
- Empty feature IDs such as FE13-FE15 must not be kept in planning documents unless the team formally adds new scope.

## 4. Traceability Rules

- Every use case must reference one feature ID.
- Every feature test must reference one feature ID.
- Every `SPEC.md` must use the corresponding `Spec Folder` value from this document.
- Any change to this list requires updating `.sdd/shared_context.md`, related specs, and assignment documents.
