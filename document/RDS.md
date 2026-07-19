**Requirement & Design Specification**
**Library Management System**
**Version: 1.0**

## Record of Changes

| Version | Date | A,M,D | In change | Change Description |
| ------- | ---- | ----- | --------- | ------------------ |
| 1.0 | 2026-06-02 | A | DungTH | FE05 Book Management specification created. |
| 1.0 | 2026-06-03 | A | DatDT | FE02 Authentication feature specification structure created. |
| 1.0 | 2026-06-03 | A | DungTH | FE11 User & Role Management feature specification structure created. |
| 1.0 | 2026-06-10 | A | DungTH | FE01 Public Browse review decisions approved. |
| 1.0 | 2026-06-10 | A | DatDT | FE02 foundation slice implemented and authentication flows ready for review. |
| 1.0 | 2026-06-10 | A | DatDT | FE03 User Profile review decisions approved. |
| 1.0 | 2026-06-10 | A | DatDT | FE04 Membership Management review decisions approved. |
| 1.0 | 2026-06-10 | A | DatDT | FE06 Inventory/Book Copy review decisions approved. |
| 1.0 | 2026-06-10 | A | NhatNHA | FE07 Borrowing backend slice ready for review. |
| 1.0 | 2026-06-10 | A | NhatNHA | FE08 Reservation backend slice ready for review. |
| 1.0 | 2026-06-10 | A | DungTH | FE09 Fine Management review decisions approved. |
| 1.0 | 2026-06-10 | A | NhatNHA | FE10 Notification backend slice ready for review. |
| 1.0 | 2026-06-10 | A | NhatNHA | FE12 Reporting backend slice ready for review. |
| 1.0 | 2026-06-20 | A | DatDT | FE03 backend and frontend avatar upload implemented. |
| 1.0 | 2026-06-20 | A | NhatNHA | FE07 frontend UI implemented and accessibility validated. |
| 1.0 | 2026-06-20 | A | NhatNHA | FE08 frontend UI implemented and accessibility validated. |
| 1.0 | 2026-06-20 | A | NhatNHA | FE12 frontend UI implemented and accessibility validated. |
| 1.0 | 2026-06-25 | A | DungTH | FE09 server-side implementation completed. |
| 1.0 | 2026-07-10 | M | NhatNHA | FE12 inventory category filter completed. |
| 1.0 | 2026-07-13 | M | NhatNHA | FE08 frontend correctness aligned with approved lifecycle. |
| 1.0 | 2026-07-13 | M | NhatNHA | FE10 hardening implemented and B7 integration closed out. |
| 1.0 | 2026-07-13 | M | NhatNHA | FE12 B7 integration and review closeout completed. |
| 1.0 | 2026-07-14 | M | NhatNHA | FE07 B7 integration and validation closeout completed. |
| 1.0 | 2026-07-15 | M | DungTH | FE01 read-only availability ownership defined. |
| 1.0 | 2026-07-15 | M | DatDT | FE02 account setup implementation and validation completed. |
| 1.0 | 2026-07-15 | M | DatDT | FE04 canonical membership contract added. |
| 1.0 | 2026-07-15 | M | DungTH | FE05 catalog ownership and deterministic contract added. |
| 1.0 | 2026-07-15 | M | DatDT | FE06 deterministic inventory contract added. |
| 1.0 | 2026-07-15 | M | NhatNHA | FE10 account setup delivery implemented and OTP security boundary approved. |
| 1.0 | 2026-07-15 | M | DungTH | FE11 account setup slice implemented and validation ready. |
| 1.0 | 2026-07-17 | M | DatDT | FE03 deterministic profile and avatar failure contracts updated. |
| 1.0 | 2026-07-18 | M | DungTH | FE01 authenticated homepage navigation updated. |
| 1.0 | 2026-07-18 | M | DatDT | FE04 member, librarian, and admin review UI integrated. |
| 1.0 | 2026-07-18 | M | DungTH | FE05 librarian book management navigation and catalog metadata timestamps updated. |
| 1.0 | 2026-07-18 | M | DatDT | FE06 navigation label clarified. |
| 1.0 | 2026-07-18 | M | NhatNHA | FE07 member and librarian borrowing workspace polished. |
| 1.0 | 2026-07-18 | M | NhatNHA | FE08 member and librarian reservation operations aligned with canonical data. |
| 1.0 | 2026-07-18 | M | DungTH | FE09 librarian fine navigation and page restored. |
| 1.0 | 2026-07-18 | M | DungTH | FE11 transactional role management, safe user reads, admin role UI, and audit log integrated. |
| 1.0 | 2026-07-19 | M | DatDT | FE02 FE11 finalization schema contract activated. |
| 1.0 | 2026-07-19 | M | DatDT | FE03 FE11 librarian column ownership activated. |
| 1.0 | 2026-07-19 | M | NhatNHA | FE10 recipient email width synchronization activated. |
| 1.0 | 2026-07-19 | M | DungTH | FE11 admin navigation permissions and finalization governance activated. |

***A - Added M - Modified D - Deleted**

## Content

Record of Changes........................................................................................................2

I. Overview................................................................................................................4
1. User Requirements....................................................................................................4
  1.1 Actors............................................................................................................4
  1.2 Use Cases.........................................................................................................4
2. Overall Functionalities.............................................................................................5
  2.1 Screens Flow.......................................................................................................5
  2.2 Screen Descriptions..............................................................................................5
  2.3 Screen Authorization.............................................................................................5
  2.4 Non-UI Functions...................................................................................................6
3. System High Level Design............................................................................................6
  3.1 Database Design....................................................................................................6
  3.2 Code Packages......................................................................................................7

II. Requirement Specifications.........................................................................................8
1. <<Feature Name>>......................................................................................................8
  1.1 <<UseCaseCode_UC Name>>..........................................................................................8
2. Common Functions.....................................................................................................11
  2.1 UC-2_Login System...............................................................................................11
3. Patron Feature.......................................................................................................12
  3.1 UC-5_Order a Meal...............................................................................................12
  3.2 UC-6_Register for Payroll Deduction...........................................................................13

III. Design Specifications............................................................................................14
1. <<Feature Name>>.....................................................................................................14
  1.1 <<SubFeature Name>>.............................................................................................14
  1.2 System Access....................................................................................................15

IV. Appendix............................................................................................................19
1. Assumptions & Dependencies........................................................................................19
2. Limitations & Exclusions..........................................................................................19
3. Business Rules.......................................................................................................19
4. .....................................................................................................................19

# I. Overview

## 1. User Requirements

### 1.1 Actors

An actor is a person, role, or external service that interacts with the Library Management System to perform a use case. The system actors are listed below.

| # | Actor | Description |
| - | ----- | ----------- |
| 1 | Guest | Unauthenticated visitor who can browse public book information and register/login to use member functions. |
| 2 | Member | Registered library user who can manage profile information, browse books, request membership, borrow books, reserve books, view borrowing/reservation history, and view fines. |
| 3 | Librarian | Library staff who manages book copies, borrowing requests, returns, reservations, membership review support, and fine-related operations. |
| 4 | Admin | System administrator who manages users, roles, permissions, audit logs, system dashboards, and administrative library operations. |
| 5 | Notification Service | Internal/external delivery service used by the system to send verification, password reset, account setup, borrowing, reservation, membership, and fine notifications. |
| 6 | Database System | Persistent storage used by the application to save users, roles, books, copies, borrowings, reservations, fines, membership applications, notifications, and audit logs. |

### 1.2 Use Cases

A use case describes a sequence of interactions between an external actor and the Library Management System that helps the actor achieve a business outcome. The use cases below are derived from the approved Phase 1 feature list and feature specifications.

#### a. Diagram(s)

##### Figure 1. Public, Account, And Member Use Cases

```mermaid
flowchart LR
  Guest[Guest]
  Member[Member]
  NotificationService[Notification Service]
  DatabaseSystem[Database System]

  subgraph LMS[Library Management System]
    UC01((Browse Books))
    UC02((Manage Account Access))
    UC03((Manage Profile))
    UC04((Apply For Membership))
    UC07((Borrow Books))
    UC08((Reserve Books))
    UC09A((View Fines))
    UC10A((Receive Notifications))
    UCDB((Persist Library Data))
  end

  Guest --> UC01
  Guest --> UC02
  Member --> UC01
  Member --> UC02
  Member --> UC03
  Member --> UC04
  Member --> UC07
  Member --> UC08
  Member --> UC09A
  Member --> UC10A
  NotificationService --> UC10A

  UC02 -. "<<include>>" .-> UC10A
  UC04 -. "<<include>>" .-> UC10A
  UC07 -. "<<include>>" .-> UC10A
  UC08 -. "<<include>>" .-> UC10A
  UC09A -. "<<include>>" .-> UC10A

  UC01 -. "<<include>>" .-> UCDB
  UC02 -. "<<include>>" .-> UCDB
  UC03 -. "<<include>>" .-> UCDB
  UC04 -. "<<include>>" .-> UCDB
  UC07 -. "<<include>>" .-> UCDB
  UC08 -. "<<include>>" .-> UCDB
  UC09A -. "<<include>>" .-> UCDB
  DatabaseSystem --> UCDB
```

##### Figure 2. Librarian And Admin Use Cases

```mermaid
flowchart LR
  Librarian[Librarian]
  Admin[Admin]
  NotificationService[Notification Service]
  DatabaseSystem[Database System]

  subgraph LMS[Library Management System]
    UC05((Manage Books))
    UC06((Manage Book Copies))
    UC07B((Process Borrowing))
    UC08B((Manage Reservations))
    UC09B((Manage Fines))
    UC10B((Send Notifications))
    UC11((Manage Users And Roles))
    UC12((Generate Reports))
    UCDB((Persist Library Data))
  end

  Librarian --> UC05
  Librarian --> UC06
  Librarian --> UC07B
  Librarian --> UC08B
  Librarian --> UC09B
  Librarian --> UC10B
  Librarian --> UC12
  Admin --> UC05
  Admin --> UC06
  Admin --> UC07B
  Admin --> UC08B
  Admin --> UC09B
  Admin --> UC10B
  Admin --> UC11
  Admin --> UC12
  NotificationService --> UC10B

  UC07B -. "<<include>>" .-> UC06
  UC08B -. "<<include>>" .-> UC06
  UC07B -. "<<extend>>" .-> UC09B
  UC09B -. "<<include>>" .-> UC10B
  UC11 -. "<<include>>" .-> UC10B

  UC05 -. "<<include>>" .-> UCDB
  UC06 -. "<<include>>" .-> UCDB
  UC07B -. "<<include>>" .-> UCDB
  UC08B -. "<<include>>" .-> UCDB
  UC09B -. "<<include>>" .-> UCDB
  UC10B -. "<<include>>" .-> UCDB
  UC11 -. "<<include>>" .-> UCDB
  UC12 -. "<<include>>" .-> UCDB
  DatabaseSystem --> UCDB
```

#### b. Use Case List

| UC ID | Use Case Name | Primary Actor(s) | Supporting Actor(s) | Outcome |
| ----- | ------------- | ---------------- | ------------------- | ------- |
| UC-01 | Browse Books | Guest, Member | Database System | Actor can search, browse, and view public book information and current availability. |
| UC-02 | Manage Account Access | Guest, Member, Admin-created user | Notification Service, Database System | Actor can register, verify email, login, logout, change password, request password reset, reset password, and complete admin-created account setup. |
| UC-03 | Manage Profile | Member | Database System | Member can view and update profile information, including avatar where supported. |
| UC-04 | Apply For Membership | Member, Librarian, Admin | Notification Service, Database System | Member can submit a membership application and authorized staff can approve or reject it. |
| UC-05 | Manage Books | Librarian, Admin | Database System | Authorized staff can create, update, deactivate, reactivate, search, and view book catalog records. |
| UC-06 | Manage Book Copies | Librarian, Admin | Database System | Authorized staff can manage physical copies, barcodes, location, status, and inventory availability. |
| UC-07 | Borrow Books | Member, Librarian, Admin | Notification Service, Database System | Member can request borrowing; authorized staff can approve, reject, process returns, renew borrowing, and maintain borrowing history. |
| UC-08 | Reserve Books | Member, Librarian, Admin | Notification Service, Database System | Member can reserve or cancel reservations; authorized staff can manage queues and fulfill held reservations. |
| UC-09 | Manage Fines | Member, Librarian, Admin | Notification Service, Database System | Member can view fine information; authorized staff can calculate, collect, mark paid, or resolve fines. |
| UC-10 | Send Notifications | Notification Service, Librarian, Admin | Database System | System can create and deliver account, reservation, due date, fine, membership, and account setup notifications. |
| UC-11 | Manage Users And Roles | Admin | Notification Service, Database System | Admin can manage users, librarian accounts, roles, permissions, admin request review view, and audit logs. |
| UC-12 | Generate Reports | Librarian, Admin | Database System | Authorized staff can view borrowing reports, inventory reports, and user statistics. |

#### c. Use Case Relationships

| Relationship | Description |
| ------------ | ----------- |
| UC-02 includes UC-10 | Account registration, verification, password reset, and admin-created account setup require notification delivery. |
| UC-04 includes UC-10 | Membership approval or rejection can queue a membership result notification. |
| UC-07 includes UC-06 | Borrowing and returning depend on current physical copy status and availability. |
| UC-07 extends UC-09 | Returning an overdue, lost, or damaged copy may trigger fine calculation or fine management. |
| UC-08 includes UC-06 | Reservation queue processing depends on physical copy availability. |
| UC-08 includes UC-10 | Reservation availability and queue events can trigger notifications. |
| UC-09 includes UC-10 | Fine and overdue events can trigger due date or fine notifications. |
| UC-11 includes UC-10 | Admin-created user accounts can trigger account setup notifications. |
| UC-01 to UC-12 include database persistence or reads | Each use case reads from or writes to the database according to its feature data contract. |
