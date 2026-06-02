# Actor List

## 1. Purpose

This document identifies the actors that interact with the Library Management System. Each actor represents a user role or an external system that exchanges information with the system.

Actor responsibilities must stay consistent with the Master Feature List in [`07_master_feature_list.md`](07_master_feature_list.md).

## 2. Actor List

| Actor                | Type            | Role / Responsibility |
| -------------------- | --------------- | --------------------- |
| Guest                | Human actor     | A visitor who can search and view public book information and register for an account. |
| Member               | Human actor     | A registered library user who can borrow books, reserve unavailable books, renew loans, view borrowing history, and view fines. |
| Librarian            | Human actor     | A library staff member who manages books, book copies, members, borrowing, returning, book reservations, and fines. |
| Admin                | Human actor     | A system administrator who manages users, roles, loan policies, fine policies, reports, and audit logs. |
| Notification Service | External system | An external service that sends account verification, password reset, due date, overdue, book reservation, and fine notifications. |

## 3. Actor Details

### 3.1 Guest

A Guest is a user who has not logged in or has not registered as a member.

Main interactions:

- Search books
- Filter and browse books
- View book details
- Register for an account

Limitations:

- Cannot borrow books
- Cannot reserve books
- Cannot renew loans
- Cannot view borrowing history or fines

### 3.2 Member

A Member is a registered user of the library.

Main interactions:

- Login
- Update personal profile
- Apply for membership
- View membership status
- Search, filter, and browse books
- View book details
- Request to borrow books
- Reserve unavailable books
- Cancel own reservations when allowed
- Renew borrowed books
- View borrowing history
- View fine information
- Receive notifications

### 3.3 Librarian

A Librarian is responsible for daily library operations.

Main interactions:

- Login
- Update personal profile
- Manage book information
- Manage book copies
- Manage categories, authors, and publishers when needed by book management
- Manage member information
- Approve or reject membership applications
- Process borrow requests
- Confirm book returns
- Handle overdue, lost, or damaged books
- Manage fines
- Record fine collection
- Manage book reservation queue
- View member borrowing records

### 3.4 Admin

An Admin is responsible for system-level management and monitoring.

Main interactions:

- Login
- Manage users
- Manage librarian accounts
- Manage roles and permissions
- Configure loan policies
- Configure fine policies
- View reports and statistics
- Export report data if supported
- View audit logs

### 3.5 Notification Service

Notification Service is an external system used by the Library Management System to send notifications.

Main interactions:

- Receive notification requests from the system
- Send account verification notifications
- Send password reset notifications
- Send due date reminders
- Send overdue notifications
- Send borrow request results
- Send book reservation updates
- Send fine notifications
- Return delivery status to the system

## 4. Notes

The following items are not actors:

- Book
- Book Copy
- Loan
- Reservation
- Fine
- Category
- Author
- Publisher
- Report

These are system entities or data objects, not external users or external systems.

The system does not need a separate "Manager" actor because Admin and Librarian already cover management responsibilities.

Study seat reservation is out of scope for the current project version and is not represented as an actor responsibility.
