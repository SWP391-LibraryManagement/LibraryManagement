# Actor List

## 1. Purpose

This document identifies the actors that interact with the Library Management System. Each actor represents a user role or an external system that exchanges information with the system.

## 2. Actor List

| Actor                | Type            | Role / Responsibility                                                                                                                                                                            |
| -------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Guest                | Human actor     | A visitor who can search and view public book information and register for a member account.                                                                                                     |
| Member               | Human actor     | A registered library user who can borrow books, reserve unavailable books, renew loans, view borrowing history, view fines, and reserve study seats.                                             |
| Librarian            | Human actor     | A library staff member who manages books, book copies, members, borrowing, returning, book reservations, fines, and seat booking requests.                                                       |
| Admin                | Human actor     | A system administrator who manages users, roles, loan policies, fine policies, seat booking policies, reports, and audit logs.                                                                   |
| Notification Service | External system | An external service that sends email or system notifications such as email verification, password reset, due date reminders, overdue alerts, book reservation updates, and seat booking results. |

## 3. Actor Details

### 3.1 Guest

A Guest is a user who has not logged in or has not registered as a member.

Main interactions:

- Search books
- Filter and browse books
- View book details
- Register for a member account

Limitations:

- Cannot borrow books
- Cannot reserve books
- Cannot renew loans
- Cannot reserve study seats
- Cannot view borrowing history or fines

### 3.2 Member

A Member is a registered user of the library.

Main interactions:

- Login
- Update personal profile
- Search, filter, and browse books
- View book details
- Request to borrow books
- Reserve unavailable books
- Renew borrowed books
- View borrowing history
- View fine information
- Submit study seat booking request
- View seat booking status
- Cancel seat booking request if allowed
- Receive notifications

### 3.3 Librarian

A Librarian is responsible for daily library operations.

Main interactions:

- Login
- Manage book information
- Manage book copies
- Manage categories and authors
- Manage member information
- Process borrow requests
- Confirm book returns
- Handle overdue, lost, or damaged books
- Manage fines
- Manage book reservation queue
- Manage seat booking requests
- View member borrowing records

### 3.4 Admin

An Admin is responsible for system-level management and monitoring.

Main interactions:

- Login
- Manage users
- Manage roles and permissions
- Configure loan policies
- Configure fine policies
- Configure seat booking policies
- View reports and statistics
- Export report data
- View audit logs

### 3.5 Notification Service

Notification Service is an external system used by the Library Management System to send notifications.

Main interactions:

- Receive notification requests from the system
- Send email verification notifications
- Send password reset notifications
- Send due date reminders
- Send overdue notifications
- Send borrow request results
- Send book reservation updates
- Send seat booking results
- Return delivery status to the system

## 4. Notes

The following items are not actors:

- Book
- Book Copy
- Loan
- Fine
- Study Area
- Seat
- Category
- Author
- Report

These are system entities or data objects, not external users or external systems.

The system does not need a separate "Manager" actor because Admin and Librarian already cover management responsibilities.

Study seat reservation does not require a new actor unless the project specifically has a separate seat or area manager role. In this project, Librarian handles seat booking requests and Admin configures seat booking policies.
