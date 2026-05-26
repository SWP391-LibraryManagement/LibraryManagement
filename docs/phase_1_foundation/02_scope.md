# Project Scope

## 1. Purpose

This document defines the scope of the Library Management System. It identifies which features are included in the project and which features are excluded to avoid scope creep during development.

## 2. In Scope

The system will include the following features:

### 2.1 Authentication and Role Management

The system supports user authentication and role-based access control for Guest, Member, Librarian, and Admin.

Included functions:

- Login
- Register
- Reset password
- Change password
- Verify email
- Update user profile
- Role-based access control

### 2.2 User and Member Management

The system allows librarians and administrators to manage user and member information.

Included functions:

- Create user/member
- Read user/member information
- Update user/member information
- Change user/member status
- View member borrowing information

Note: The system does not permanently delete users. It only changes user status, such as active or inactive.

### 2.3 Book Management

The system allows librarians to manage book information.

Included functions:

- Create book
- Read book information
- Update book information
- Change book status
- Manage book availability

Note: The system does not permanently delete books. It only changes book status.

### 2.4 Book Copy Management

The system manages physical copies of books.

Included functions:

- Add book copies
- Update book copy information
- Track book copy status
- Manage available, borrowed, lost, or damaged copies

### 2.5 Category and Author Management

The system allows librarians to manage book categories and authors.

Included functions:

- Manage categories
- Manage authors
- Search and filter authors
- Assign categories and authors to books

### 2.6 Search, Filter, and Browse Books

The system allows guests and members to search and browse books.

Included functions:

- Search books by keyword
- Filter books by category, author, or availability
- Sort books by alphabet, newest, or most borrowed
- View book details

### 2.7 Borrow Book

The system supports the borrowing process for members.

Included functions:

- Create borrow request
- Check member eligibility
- Check book copy availability
- Record loan information
- Update book copy status after borrowing

### 2.8 Return Book

The system supports the book return process.

Included functions:

- Confirm returned book
- Update loan status
- Update book copy status
- Detect overdue, lost, or damaged books
- Generate fine information when needed

### 2.9 Renew Loan

The system allows members to renew borrowed books if allowed by library rules.

Included functions:

- Request loan renewal
- Check renewal eligibility
- Update due date
- Notify renewal result

### 2.10 Borrowing History

The system allows members and librarians to view borrowing history.

Included functions:

- View current loans
- View past loans
- View due dates
- View return status

### 2.11 Book Reservation and Reservation Queue

The system allows members to reserve books that are currently unavailable.

Included functions:

- Reserve unavailable book
- Add member to reservation queue
- Manage reservation status
- Notify member when the book becomes available

### 2.12 Study Seat Reservation

The system supports simple study seat reservation in library study areas.

Included functions:

- View available study areas or seat slots
- Select study area, date, and time slot
- Submit seat booking request
- Check seat availability based on area capacity and time slot
- View seat booking status
- Cancel seat booking request if allowed
- Notify member about seat booking result

Note: The system manages seat booking at the study area and time slot level. It does not manage a detailed visual seat map.

### 2.13 Fine Management

The system manages fines related to overdue, lost, or damaged books.

Included functions:

- Calculate overdue fine
- Calculate lost book fine
- Calculate damaged book fine
- View fine information
- Update fine status

### 2.14 Basic Notification

The system sends basic notifications to users.

Included notification types:

- Email verification notification
- Password reset notification
- Due date reminder
- Overdue notification
- Borrow request result
- Book reservation notification
- Seat booking notification

Notifications may be sent through email or displayed inside the system.

### 2.15 Basic Reports and Data Export

The system provides basic reports for administrators.

Included reports:

- Borrowing statistics
- Overdue book statistics
- Fine statistics
- Most borrowed books
- Member activity summary
- Seat booking statistics
- Export report data

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
- Complex room scheduling
- Visual seat map management
- QR/RFID seat check-in
- Room or seat access control hardware
- Advanced financial accounting
- Advanced data analytics dashboard

## 4. Scope Notes

The project focuses on core library operations, including book management, borrowing, returning, book reservation, fine management, study seat reservation, notification, and basic reporting.

The study seat reservation feature is limited to simple booking by study area, date, and time slot. The system checks availability based on the capacity of each study area and the number of existing bookings.

Features related to hardware integration, real online payment, AI recommendation, detailed seat map management, room booking, and complex multi-branch operation are excluded to keep the project manageable for the current development timeline.
