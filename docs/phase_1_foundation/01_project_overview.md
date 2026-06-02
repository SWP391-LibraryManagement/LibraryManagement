# Project Overview

## 1. Project Name

**Library Management System**

## 2. Problem Statement

Many libraries still manage books, members, borrowing records, returns, reservations, and fines manually or with separated tools. This can lead to duplicated records, difficulty in tracking book availability, delayed return management, and inaccurate fine calculation.

The Library Management System is developed to help the library manage books, book copies, members, borrowing and returning activities, book reservations, fines, notifications, users, roles, and basic reports in a centralized system.

## 3. Project Objectives

The main objectives of the Library Management System are:

- To allow guests to search, browse, and view book information.
- To support account registration, authentication, and user profile management.
- To support membership application and membership status management.
- To manage book information and physical book copies.
- To support members in borrowing, returning, reserving, and renewing books.
- To help librarians process borrow requests, returns, reservations, and fines.
- To allow administrators to manage users, roles, loan policies, fine policies, and reports.
- To provide basic notifications for account verification, password reset, due dates, overdue books, book reservations, and fines.
- To reduce manual work and improve the accuracy and traceability of library operations.

## 4. Target Users

The system serves the following user groups:

| User Group           | Description |
| -------------------- | ----------- |
| Guest                | A visitor who can search and view public book information and register for an account. |
| Member               | A registered library user who can borrow books, reserve books, renew loans, view borrowing history, and view fines. |
| Librarian            | A staff member who manages books, book copies, members, loans, returns, reservations, and fines. |
| Admin                | A system administrator who manages users, roles, loan policies, fine policies, reports, and audit logs. |
| Notification Service | An external service used to send account, due date, overdue, book reservation, and fine notifications. |

## 5. Main Features

The main features of the system are defined in the Master Feature List:

- FE01 Public / Browse
- FE02 Authentication
- FE03 User Profile
- FE04 Membership Management
- FE05 Book Management
- FE06 Inventory / Book Copy Management
- FE07 Borrowing Management
- FE08 Reservation Management
- FE09 Fine Management
- FE10 Notification Management
- FE11 User & Role Management
- FE12 Reporting & Statistics

See [`07_master_feature_list.md`](07_master_feature_list.md) for the official feature IDs, spec folders, spec levels, and scope notes.

## 6. Expected Outcome

After completion, the system is expected to provide a centralized platform for managing library operations. Guests can search for books, members can manage their borrowing and reservation activities, librarians can handle daily library transactions, and administrators can monitor system data and basic reports.

The system should improve the efficiency, accuracy, and traceability of book browsing, authentication, user management, book management, inventory management, borrowing, returning, reservation, fine management, notification, and reporting processes.
