# Project Scope

## 1. Purpose

This document defines the scope of the Library Management System. It identifies which features are included in the project and which features are excluded to avoid scope creep during development.

The official feature source of truth is [`07_master_feature_list.md`](07_master_feature_list.md).

## 2. In Scope

The system includes the following features.

### 2.1 FE01 - Public / Browse

The system allows guests and members to search, browse, and view public book information.

Included functions:

- View home page
- Search books
- Browse book catalog
- View book information
- View book details

### 2.2 FE02 - Authentication

The system supports account authentication.

Included functions:

- Register account
- Login
- Logout
- Change password
- Forgot password
- Reset password

### 2.3 FE03 - User Profile

The system allows members and librarians to manage their personal profile.

Included functions:

- View profile
- Update profile

### 2.4 FE04 - Membership Management

The system supports membership application and membership status management.

Included functions:

- Apply for membership
- Approve membership application
- Reject membership application
- View membership status

### 2.5 FE05 - Book Management

The system allows librarians to manage book information.

Included functions:

- View book list
- Add book
- Update book information
- Deactivate book
- View book details
- Search books by guest or member

Note: The system does not permanently delete books. It only deactivates or changes book status to preserve borrowing and fine history.

### 2.6 FE06 - Inventory / Book Copy Management

The system manages physical book copies.

Included functions:

- View inventory
- Check book copy status
- Update book copy availability
- Manage book copies, barcode, location, and status

### 2.7 FE07 - Borrowing Management

The system supports borrowing, returning, renewal, and borrowing history.

Included functions:

- Create borrow request
- View borrowing history
- Renew borrowed books
- Process borrow request
- Process return request
- View member borrowing information
- Approve borrow request

### 2.8 FE08 - Reservation Management

The system allows members to reserve books that are currently unavailable.

Included functions:

- Reserve book
- Cancel reservation
- View reservation list
- Process reservation queue
- Trigger book available notification

### 2.9 FE09 - Fine Management

The system manages fines related to overdue, lost, or damaged books.

Included functions:

- View fine information
- Calculate fine
- Record fine collection
- Mark fine as paid

Note: Real online payment gateway integration is out of scope. The system records fine collection and paid status only.

### 2.10 FE10 - Notification Management

The system sends basic email or in-app notifications.

Included notification types:

- Account verification notification
- Password reset notification
- Book reservation notification
- Due date notification
- Fine notification

### 2.11 FE11 - User & Role Management

The system allows administrators to manage users, librarians, and roles.

Included functions:

- View user list
- View user information
- Create user account
- Update user information
- Deactivate user account
- Create librarian account
- Update librarian account
- Deactivate librarian account
- Manage roles

Note: The system does not permanently delete users. It only deactivates accounts or changes user status.

### 2.12 FE12 - Reporting & Statistics

The system provides basic reports and statistics for administrators.

Included reports:

- Borrowing report
- Inventory report
- User statistics

## 3. Out of Scope

The following features are not included in this project:

- Mobile application
- RFID or QR hardware integration
- Real online payment gateway
- AI book recommendation
- E-book reader
- Complex multi-branch library management
- Social login using Facebook or Google
- Room booking
- Study seat reservation
- Visual seat map management
- QR/RFID seat check-in
- Room or seat access control hardware
- Advanced financial accounting
- Advanced data analytics dashboard

## 4. Scope Notes

The project focuses on core library operations: public browsing, authentication, user profile, membership management, book management, book copy inventory, borrowing, reservation, fine management, notification, user and role management, and basic reporting.

Borrowing Management and Reservation Management are intentionally separated:

- FE07 Borrowing Management handles borrow requests, return processing, renewal, and borrowing history.
- FE08 Reservation Management handles book reservation, cancellation, and reservation queue management.

Any new feature outside FE01-FE12 must first be added to the Master Feature List and approved before specification or implementation.
