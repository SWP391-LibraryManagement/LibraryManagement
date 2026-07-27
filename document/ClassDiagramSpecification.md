# Library Management Class Diagram Specification

## 1. Purpose and Notation

This document specifies the backend class structure of the Library Management System by feature (FE01-FE12). It is derived from the current route, controller, service, repository, model, and approved SDS artifacts.

The Node.js implementation uses CommonJS objects and factory functions rather than JavaScript `class` declarations. Each UML class below therefore represents a logical runtime component.

| Relationship | Meaning |
| --- | --- |
| `A --> B` | A calls or depends on B. |
| `A ..> B` | A uses B as a cross-feature dependency. |
| `Repository --> Model` | Repository maps rows using model metadata. |

## 2. FE01 - Public Browse

### Class Diagram

```mermaid
classDiagram
  class BookRoutes
  class BookController {
    +getHomeBooks(req, res, next)
    +getBookById(req, res, next)
    +getMetadata(req, res, next)
  }
  class BookService {
    +getHomeBooks(filters)
    +getBookById(bookId, options)
    +getMetadata()
    +getCategories()
  }
  class BookRepository {
    +getHomeBooks(filters)
    +getBookById(bookId)
    +getMetadata()
    +getCategories()
  }
  class BookModel
  class BookCopyModel
  BookRoutes --> BookController
  BookController --> BookService
  BookService --> BookRepository
  BookRepository --> BookModel
  BookRepository --> BookCopyModel
```

| Component | Responsibility | Source |
| --- | --- | --- |
| `BookRoutes` | Exposes public catalogue, detail, and metadata endpoints. | `backend/src/routes/bookRoutes.js` |
| `BookController` | Maps HTTP queries and identifiers to service calls. | `backend/src/controllers/bookController.js` |
| `BookService` | Enforces public-safe visibility and validates catalogue requests. | `backend/src/services/bookService.js` |
| `BookRepository` | Reads active books, metadata, copy counts, and availability. | `backend/src/repositories/bookRepository.js` |
| `BookModel`, `BookCopyModel` | Define row mappings for catalogue and copy data. | `backend/src/models/Book.js`, `backend/src/models/BookCopy.js` |

## 3. FE02 - Authentication

### Class Diagram

```mermaid
classDiagram
  class AuthRoutes
  class AuthController {
    +register(req, res, next)
    +verifyEmail(req, res, next)
    +login(req, res, next)
    +refreshToken(req, res, next)
    +logout(req, res, next)
    +changePassword(req, res, next)
    +forgotPassword(req, res, next)
    +resetPassword(req, res, next)
    +me(req, res, next)
  }
  class AuthService {
    +register(input, context)
    +verifyEmail(input, context)
    +login(input, context)
    +refreshToken(input, context)
    +logout(input, context)
    +changePassword(input, context)
    +resetPassword(input, context)
    +authenticateToken(token)
  }
  class UserRepository {
    +findByEmailOrUsername(identifier)
    +createRegisteredUser(payload)
    +recordFailedLogin(userId)
    +resetFailedLoginsAndSetLastLogin(userId)
    +getRolesByUserId(userId)
  }
  class AuthTokenRepository {
    +createToken(payload)
    +findActiveTokenByHash(type, hash)
    +markTokenUsed(tokenId)
    +revokeActiveTokensForUser(userId)
  }
  class NotificationService
  class EmailService
  class AuditLogRepository
  AuthRoutes --> AuthController
  AuthController --> AuthService
  AuthService --> UserRepository
  AuthService --> AuthTokenRepository
  AuthService ..> NotificationService
  AuthService --> EmailService
  AuthService --> AuditLogRepository
```

| Component | Responsibility | Source |
| --- | --- | --- |
| `AuthRoutes` | Declares authentication endpoints, validators, and middleware. | `backend/src/routes/authRoutes.js` |
| `AuthController` | Converts authentication HTTP requests into service commands. | `backend/src/controllers/authController.js` |
| `AuthService` | Implements registration, verification, sessions, password flows, and authorization identity. | `backend/src/services/authService.js` |
| `UserRepository` | Persists accounts, rolling login failures, verification, passwords, and role reads. | `backend/src/repositories/userRepository.js` |
| `AuthTokenRepository` | Persists only hashed refresh and one-time token records. | `backend/src/repositories/authTokenRepository.js` |
| `NotificationService`, `EmailService` | Deliver feature-owned verification/reset/setup messages. | `backend/src/services/notificationService.js`, `backend/src/services/emailService.js` |
| `AuditLogRepository` | Records security-sensitive authentication events. | `backend/src/repositories/auditLogRepository.js` |

## 4. FE03 - User Profile

### Class Diagram

```mermaid
classDiagram
  class ProfileRoutes
  class ProfileController {
    +getMyProfile(req, res, next)
    +updateMyProfile(req, res, next)
    +updateMyAvatar(req, res, next)
  }
  class ProfileService {
    +getMyProfile(userId)
    +updateMyProfile(userId, input, context)
    +updateMyAvatar(userId, file, context)
  }
  class ProfileRepository {
    +findByUserId(userId)
    +createBlankProfile(userId)
    +updateByUserId(userId, updates)
    +updateAvatarByUserId(userId, avatarUrl)
  }
  class UserProfileModel
  class AuditLogRepository
  ProfileRoutes --> ProfileController
  ProfileController --> ProfileService
  ProfileService --> ProfileRepository
  ProfileService --> AuditLogRepository
  ProfileRepository --> UserProfileModel
```

| Component | Responsibility | Source |
| --- | --- | --- |
| `ProfileRoutes` | Protects profile and avatar endpoints. | `backend/src/routes/profileRoutes.js` |
| `ProfileController` | Reads the authenticated identity and request payload/file. | `backend/src/controllers/profileController.js` |
| `ProfileService` | Validates editable fields and JPG/JPEG/PNG/WebP avatars up to 2 MB. | `backend/src/services/profileService.js` |
| `ProfileRepository` | Reads and updates `Users` and `UserProfiles`. | `backend/src/repositories/profileRepository.js` |
| `AuditLogRepository` | Records profile and avatar changes. | `backend/src/repositories/auditLogRepository.js` |

## 5. FE04 - Membership Management

### Class Diagram

```mermaid
classDiagram
  class MembershipRoutes
  class MembershipController {
    +apply(req, res, next)
    +getMyStatus(req, res, next)
    +listApplications(req, res, next)
    +approve(req, res, next)
    +reject(req, res, next)
  }
  class MembershipService {
    +apply(actor, context)
    +getMyStatus(actor)
    +listApplications(filters, actor)
    +approve(applicationId, actor, context)
    +reject(applicationId, reason, actor, context)
  }
  class MembershipRepository {
    +createApplication(userId)
    +findLatestByUserId(userId)
    +listApplications(filters)
    +approve(applicationId, reviewerId)
    +reject(applicationId, reviewerId, reason)
  }
  class NotificationService
  class AuditLogRepository
  MembershipRoutes --> MembershipController
  MembershipController --> MembershipService
  MembershipService --> MembershipRepository
  MembershipService ..> NotificationService
  MembershipService --> AuditLogRepository
```

| Component | Responsibility | Source |
| --- | --- | --- |
| `MembershipRoutes` | Separates member self-service from staff review endpoints. | `backend/src/routes/membershipRoutes.js` |
| `MembershipController` | Maps application/review requests to the service. | `backend/src/controllers/membershipController.js` |
| `MembershipService` | Enforces application eligibility and review permissions. | `backend/src/services/membershipService.js` |
| `MembershipRepository` | Persists applications and the canonical member projection transactionally. | `backend/src/repositories/membershipRepository.js` |
| `NotificationService`, `AuditLogRepository` | Notify applicants and record review actions. | Shared FE10 and audit components. |

## 6. FE05 - Book Management

### Class Diagram

```mermaid
classDiagram
  class BookRoutes
  class BookController {
    +getManagementBooks(req, res, next)
    +createBook(req, res, next)
    +updateBook(req, res, next)
    +deactivateBook(req, res, next)
    +reactivateBook(req, res, next)
  }
  class BookService {
    +getManagementBooks(filters)
    +createBook(input, actorUserId)
    +updateBook(bookId, input, actorUserId, ifMatch)
    +deactivateBook(bookId, input, actorUserId, ifMatch)
    +reactivateBook(bookId, input, actorUserId, ifMatch)
  }
  class BookRepository {
    +getManagementBooks(filters)
    +isbnExists(isbn, excludeBookId)
    +referenceExists(type, id)
    +createBook(payload)
    +updateBook(bookId, payload, rowVersion)
    +changeBookStatus(bookId, status, rowVersion)
  }
  class BookModel
  class CategoryModel
  class AuthorModel
  class PublisherModel
  class AuditLogRepository
  BookRoutes --> BookController
  BookController --> BookService
  BookService --> BookRepository
  BookService --> AuditLogRepository
  BookRepository --> BookModel
  BookRepository --> CategoryModel
  BookRepository --> AuthorModel
  BookRepository --> PublisherModel
```

| Component | Responsibility | Source |
| --- | --- | --- |
| `BookRoutes` | Exposes Librarian/Admin catalogue-management endpoints. | `backend/src/routes/bookRoutes.js` |
| `BookController` | Reads payloads, uploads, and `If-Match` tokens. | `backend/src/controllers/bookController.js` |
| `BookService` | Validates catalogue fields, references, ISBN, cover upload, reason, and concurrency. | `backend/src/services/bookService.js` |
| `BookRepository` | Executes parameterized catalogue and metadata queries. | `backend/src/repositories/bookRepository.js` |
| Catalogue models | Map `Books`, `Categories`, `Authors`, and `Publishers`. | `backend/src/models/` |

## 7. FE06 - Inventory / Book Copy

### Class Diagram

```mermaid
classDiagram
  class InventoryRoutes
  class InventoryController {
    +listInventory(req, res, next)
    +getCopy(req, res, next)
    +createCopy(req, res, next)
    +updateCopy(req, res, next)
    +updateCopyStatus(req, res, next)
    +deactivateCopy(req, res, next)
  }
  class InventoryService {
    +listInventory(filters, actor)
    +getCopy(copyId, actor)
    +createCopy(bookId, input, actor, context)
    +updateCopy(copyId, input, actor, context, ifMatch)
    +updateCopyStatus(copyId, input, actor, context, ifMatch)
    +deactivateCopy(copyId, actor, context, ifMatch)
  }
  class InventoryRepository {
    +findBookById(bookId)
    +findCopyById(copyId)
    +listInventory(filters)
    +createCopy(payload)
    +updateCopy(copyId, payload, version)
    +updateCopyStatus(copyId, status, version)
    +hasActiveBorrow(copyId)
    +hasActiveReservation(copyId)
  }
  class BookCopyModel
  class AuditLogRepository
  InventoryRoutes --> InventoryController
  InventoryController --> InventoryService
  InventoryService --> InventoryRepository
  InventoryService --> AuditLogRepository
  InventoryRepository --> BookCopyModel
```

| Component | Responsibility | Source |
| --- | --- | --- |
| `InventoryRoutes` | Exposes protected physical-copy endpoints. | `backend/src/routes/inventoryRoutes.js` |
| `InventoryController` | Maps copy identifiers, payloads, and concurrency headers. | `backend/src/controllers/inventoryController.js` |
| `InventoryService` | Enforces copy status ownership, parent-book state, active use, and `If-Match`. | `backend/src/services/inventoryService.js` |
| `InventoryRepository` | Persists copy metadata/status and checks active borrowing/reservations. | `backend/src/repositories/inventoryRepository.js` |
| `BookCopyModel` | Maps `BookCopies`, including `Version`. | `backend/src/models/BookCopy.js` |

## 8. FE07 - Borrowing Management

### Class Diagram

```mermaid
classDiagram
  class BorrowingRoutes
  class BorrowingController {
    +createBorrowRequest(req, res, next)
    +listMyBorrowRequests(req, res, next)
    +listBorrowRequests(req, res, next)
    +approveBorrowRequest(req, res, next)
    +rejectBorrowRequest(req, res, next)
    +returnBorrowDetail(req, res, next)
    +renewBorrowDetail(req, res, next)
  }
  class BorrowingService {
    +createBorrowRequest(input, actor, context)
    +listMyBorrowRequests(filters, actor)
    +approveBorrowRequest(requestId, input, actor, context)
    +rejectBorrowRequest(requestId, input, actor, context)
    +returnBorrowDetail(detailId, input, actor, context)
    +renewBorrowDetail(detailId, input, actor, context)
  }
  class BorrowingRepository {
    +getMemberEligibility(userId)
    +findBorrowabilityByCopyIds(copyIds)
    +createBorrowRequest(payload)
    +approveBorrowRequest(requestId, payload)
    +rejectBorrowRequest(requestId, payload)
    +returnBorrowDetail(detailId, payload)
    +renewBorrowDetail(detailId, payload)
  }
  class NotificationService
  class FineManagementService
  class AuditLogRepository
  BorrowingRoutes --> BorrowingController
  BorrowingController --> BorrowingService
  BorrowingService --> BorrowingRepository
  BorrowingService ..> NotificationService
  BorrowingService ..> FineManagementService
  BorrowingService --> AuditLogRepository
```

| Component | Responsibility | Source |
| --- | --- | --- |
| `BorrowingRoutes` | Exposes member requests/history and staff processing endpoints. | `backend/src/routes/borrowingRoutes.js` |
| `BorrowingController` | Maps request/detail identifiers and lifecycle commands. | `backend/src/controllers/borrowingController.js` |
| `BorrowingService` | Enforces membership, blockers, daily/active limits, 14-day loan, return, and renewal rules. | `backend/src/services/borrowingService.js` |
| `BorrowingRepository` | Executes eligibility reads and transactional request/detail/copy mutations. | `backend/src/repositories/borrowingRepository.js` |
| Cross-feature services | Send notices and trigger fine calculation where required. | FE10 and FE09 services. |

## 9. FE08 - Reservation Management

### Class Diagram

```mermaid
classDiagram
  class ReservationRoutes
  class ReservationController {
    +createReservation(req, res, next)
    +listMyReservations(req, res, next)
    +cancelReservation(req, res, next)
    +listReservations(req, res, next)
    +processQueue(req, res, next)
  }
  class ReservationService {
    +createReservation(input, actor, context)
    +listMyReservations(filters, actor)
    +cancelReservation(reservationId, input, actor, context)
    +listReservations(filters, actor)
    +processQueue(input, actor, context)
  }
  class ReservationRepository {
    +getMemberEligibility(userId)
    +findCopyById(copyId)
    +createReservation(payload)
    +listReservations(filters)
    +cancelReservation(reservationId, payload)
    +findNextActiveReservationForCopy(copyId)
    +holdReservation(reservationId)
    +expireOverdueHolds()
  }
  class NotificationService
  class AuditLogRepository
  ReservationRoutes --> ReservationController
  ReservationController --> ReservationService
  ReservationService --> ReservationRepository
  ReservationService ..> NotificationService
  ReservationService --> AuditLogRepository
```

| Component | Responsibility | Source |
| --- | --- | --- |
| `ReservationRoutes` | Exposes member reservation and staff queue endpoints. | `backend/src/routes/reservationRoutes.js` |
| `ReservationController` | Maps reservation filters, identifiers, and queue commands. | `backend/src/controllers/reservationController.js` |
| `ReservationService` | Enforces eligibility, duplicate prevention, queue order, holds, cancellation, and expiry. | `backend/src/services/reservationService.js` |
| `ReservationRepository` | Persists queue state and performs locked queue selection/mutation. | `backend/src/repositories/reservationRepository.js` |
| `NotificationService` | Sends availability and reservation lifecycle notifications. | `backend/src/services/notificationService.js` |

## 10. FE09 - Fine Management

### Class Diagram

```mermaid
classDiagram
  class FineRoutes
  class FineManagementController {
    +calculateFine(req, res, next)
    +listMyFines(req, res, next)
    +listFines(req, res, next)
    +getFine(req, res, next)
    +recordCollection(req, res, next)
    +waiveFine(req, res, next)
    +cancelFine(req, res, next)
  }
  class FineManagementService {
    +calculateFine(input, actor, context)
    +listMyFines(filters, actor)
    +listFines(filters, actor)
    +recordCollection(fineId, input, actor, context)
    +waiveFine(fineId, input, actor, context)
    +cancelFine(fineId, input, actor, context)
  }
  class FineRepository {
    +getBorrowDetailForFine(detailId)
    +findActiveFineByBorrowDetail(detailId)
    +findFineById(fineId)
    +listFines(filters)
    +createFine(payload)
    +recordCollection(payload)
    +resolveFine(fineId, status)
  }
  class FineModel
  class AuditLogRepository
  FineRoutes --> FineManagementController
  FineManagementController --> FineManagementService
  FineManagementService --> FineRepository
  FineManagementService --> AuditLogRepository
  FineRepository --> FineModel
```

| Component | Responsibility | Source |
| --- | --- | --- |
| `FineRoutes` | Separates member reads, staff collection, and Admin-only resolution. | `backend/src/routes/fineRoutes.js` |
| `FineManagementController` | Maps fine identifiers and collection/waiver/cancellation commands. | `backend/src/controllers/fineManagementController.js` |
| `FineManagementService` | Calculates 5,000 VND/day fines, rejects partial payment, and enforces resolution permissions. | `backend/src/services/fineManagementService.js` |
| `FineRepository` | Persists traceable calculation and terminal fine state. | `backend/src/repositories/fineRepository.js` |
| `AuditLogRepository` | Records collection, waiver, and cancellation actions. | `backend/src/repositories/auditLogRepository.js` |

## 11. FE10 - Notification Management

### Class Diagram

```mermaid
classDiagram
  class NotificationRoutes
  class NotificationController {
    +createNotificationRequest(req, res, next)
    +retryNotification(req, res, next)
    +processPendingNotifications(req, res, next)
  }
  class NotificationService {
    +createNotificationRequest(input, actor, context)
    +createNotificationRequestWithSource(input, actor, context)
    +retryNotification(notificationId, actor, context)
    +processPendingNotifications(input, actor, context)
  }
  class NotificationRepository {
    +findTemplateByCode(code)
    +findByIdempotencyKey(key)
    +createNotification(payload)
    +claimNextPending()
    +markClaimSent(id, providerId)
    +markClaimFailed(id, safeError)
  }
  class EmailService {
    +sendEmail(message)
  }
  class NotificationModel
  class NotificationAttemptModel
  class AuditLogRepository
  NotificationRoutes --> NotificationController
  NotificationController --> NotificationService
  NotificationService --> NotificationRepository
  NotificationService --> EmailService
  NotificationService --> AuditLogRepository
  NotificationRepository --> NotificationModel
  NotificationRepository --> NotificationAttemptModel
```

| Component | Responsibility | Source |
| --- | --- | --- |
| `NotificationRoutes` | Exposes authorized non-sensitive request/retry/worker endpoints. | `backend/src/routes/notificationRoutes.js` |
| `NotificationController` | Maps HTTP commands to the notification service. | `backend/src/controllers/notificationController.js` |
| `NotificationService` | Enforces source ownership, sensitive boundaries, templates, idempotency, and delivery lifecycle. | `backend/src/services/notificationService.js` |
| `NotificationRepository` | Claims durable work and atomically records terminal state plus attempts. | `backend/src/repositories/notificationRepository.js` |
| `EmailService` | Performs provider I/O without persisting raw credentials. | `backend/src/services/emailService.js` |

## 12. FE11 - User and Role Management

### Class Diagram

```mermaid
classDiagram
  class UserManagementRoutes
  class UserManagementController {
    +listUsers(req, res, next)
    +getUser(req, res, next)
    +listRoles(req, res, next)
    +createUser(req, res, next)
    +updateUser(req, res, next)
    +updateStatus(req, res, next)
    +replaceRole(req, res, next)
  }
  class UserManagementService {
    +listUsers(query)
    +getUser(userId)
    +createUser(input, context)
    +updateUser(userId, input, context)
    +updateStatus(userId, input, context)
    +replaceRole(userId, input, context)
  }
  class UserRepository {
    +listManagedUsers(filters)
    +getManagedUserDetailById(userId)
    +createAdminManagedUser(payload)
    +updateManagedUserStatus(userId, status)
    +listRoles()
  }
  class UserRoleRepository {
    +replaceUserRole(userId, roleId, actorId)
  }
  class AccountSetupRepository
  class NotificationService
  class AuditLogRepository
  UserManagementRoutes --> UserManagementController
  UserManagementController --> UserManagementService
  UserManagementService --> UserRepository
  UserManagementService --> UserRoleRepository
  UserManagementService --> AccountSetupRepository
  UserManagementService ..> NotificationService
  UserManagementService --> AuditLogRepository
```

| Component | Responsibility | Source |
| --- | --- | --- |
| `UserManagementRoutes` | Exposes Admin-only user, status, role, and setup operations. | `backend/src/routes/userManagementRoutes.js` |
| `UserManagementController` | Maps management requests and request context to the service. | `backend/src/controllers/userManagementController.js` |
| `UserManagementService` | Enforces safe fields, lifecycle rules, exactly-one role, last-Admin protection, setup delivery, and audit. | `backend/src/services/userManagementService.js` |
| `UserRepository` | Reads and persists managed account/profile state. | `backend/src/repositories/userRepository.js` |
| `UserRoleRepository` | Atomically replaces the current role and audit entry. | `backend/src/repositories/userRoleRepository.js` |
| `AccountSetupRepository` | Creates/revokes account-setup credentials. | `backend/src/repositories/accountSetupRepository.js` |

## 13. FE12 - Reporting and Statistics

### Class Diagram

```mermaid
classDiagram
  class ReportRoutes
  class ReportController {
    +getBorrowingReport(req, res, next)
    +getInventoryReport(req, res, next)
    +getUserStatistics(req, res, next)
  }
  class ReportService {
    +getBorrowingReport(filters, actor, context)
    +getInventoryReport(filters, actor, context)
    +getUserStatistics(filters, actor, context)
  }
  class ReportRepository {
    +getBorrowingReport(filters)
    +getInventoryReport(filters)
    +getUserStatistics(filters)
  }
  class AuditLogRepository
  class BorrowRequestModel
  class BookCopyModel
  class UserModel
  ReportRoutes --> ReportController
  ReportController --> ReportService
  ReportService --> ReportRepository
  ReportService --> AuditLogRepository
  ReportRepository --> BorrowRequestModel
  ReportRepository --> BookCopyModel
  ReportRepository --> UserModel
```

| Component | Responsibility | Source |
| --- | --- | --- |
| `ReportRoutes` | Exposes authorized borrowing, inventory, and user reports. | `backend/src/routes/reportRoutes.js` |
| `ReportController` | Maps report filters and returns chart/table DTOs. | `backend/src/controllers/reportController.js` |
| `ReportService` | Validates access and filters, then audits report access. | `backend/src/services/reportService.js` |
| `ReportRepository` | Executes read-only aggregate queries over source tables. | `backend/src/repositories/reportRepository.js` |
| `AuditLogRepository` | Records protected report access. | `backend/src/repositories/auditLogRepository.js` |

## 14. Cross-Feature Dependency Summary

| Source feature | Target component | Reason |
| --- | --- | --- |
| FE02 | FE10 `NotificationService` | Verification, reset, and account security delivery. |
| FE04 | FE10 `NotificationService` | Membership review result delivery. |
| FE07 | FE09 `FineManagementService` | Fine calculation after overdue/lost/damaged returns. |
| FE07, FE08 | FE10 `NotificationService` | Borrowing and reservation lifecycle delivery. |
| FE09 | `AuditLogRepository` | Fine collection and resolution traceability. |
| FE11 | FE10 `NotificationService` | Account-setup delivery. |
| FE12 | `AuditLogRepository` | Protected report-access traceability. |

## 15. Source-of-Truth Boundary

- The diagrams describe implemented logical components, not a proposal to introduce JavaScript classes.
- Route files own HTTP wiring; controllers own request/response mapping; services own business rules; repositories own parameterized SQL; models own table metadata and row mapping.
- Feature permissions and business behavior remain authoritative in each `.sdd/specs/feat-*/SPEC.md`.
- Database entities and columns are specified separately in `document/DatabaseSpecification.md`.
