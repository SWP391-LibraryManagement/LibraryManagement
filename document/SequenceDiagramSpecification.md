# ĐẶC TẢ SEQUENCE DIAGRAM

## 1. Mục đích và phạm vi

Tài liệu tách các Sequence Diagram trong `document/SDS.md` thành một đặc tả độc lập, mô tả luồng tương tác từ actor/giao diện đến API, service, repository và SQL Server.

- Phạm vi gồm 10 module Code Design hiện có trong SDS.
- FE05 và FE06 được mô tả chung trong module Book and Inventory Management.
- FE07 và FE08 được mô tả chung trong module Borrowing and Reservation.
- FE11 được đồng bộ với cơ chế hiện tại: mỗi người dùng có đúng một role và role được thay thế qua `PUT /api/users/:userId/role`.
- Diagram mô tả luồng thiết kế chính; nhánh lỗi chi tiết tuân theo SPEC và xử lý hiện có của từng feature.

## 2. Danh mục diagram

| STT | Module | Feature liên quan | Luồng chính |
|---:|---|---|---|
| 1 | Authentication | FE02 | Đăng nhập/đăng ký và quản lý token |
| 2 | Public Browse | FE01 | Tra cứu danh mục công khai |
| 3 | User Profile | FE03 | Cập nhật hồ sơ cá nhân |
| 4 | Membership Management | FE04 | Duyệt đơn thành viên |
| 5 | Book and Inventory Management | FE05, FE06 | Lưu sách hoặc bản sao |
| 6 | Borrowing and Reservation | FE07, FE08 | Tạo yêu cầu mượn |
| 7 | Fine Management | FE09 | Ghi nhận thanh toán tiền phạt |
| 8 | Notification | FE10 | Tạo và gửi thông báo |
| 9 | User and Role Management | FE11 | Thay thế role duy nhất |
| 10 | Reporting and Statistics | FE12 | Lấy dữ liệu báo cáo tổng hợp |

## 3. Sequence Diagram theo module

### 3.1. Authentication

**Điểm vào:** `POST /api/auth/*`  
**Thành phần dữ liệu:** `Users`, `UserProfiles`, `UserRoles`, `Roles`, `AuthTokens`.

```mermaid
sequenceDiagram
  actor User
  participant UI as Login/Register UI
  participant API as Auth API
  participant C as AuthController
  participant S as AuthService
  participant U as UserRepository
  participant T as AuthTokenRepository
  participant DB as SQL Server
  User->>UI: Submit credentials or registration data
  UI->>API: POST /api/auth/*
  API->>C: Route request
  C->>S: Call matching auth method
  S->>U: Read or write user data
  U->>DB: SELECT/INSERT/UPDATE Users
  S->>T: Create, validate, use, or revoke token
  T->>DB: SELECT/INSERT/UPDATE AuthTokens
  S-->>C: Result or validation error
  C-->>UI: JSON response
```

### 3.2. Public Browse

**Điểm vào:** `GET /api/books`  
**Thành phần dữ liệu:** `Books`, `BookCopies`, `Categories`, `Authors`, `Publishers`.

```mermaid
sequenceDiagram
  actor Visitor
  participant UI as Home/Catalog Page
  participant API as Book API
  participant S as BookService
  participant R as BookRepository
  participant DB as SQL Server
  Visitor->>UI: Search or open catalog
  UI->>API: GET /api/books
  API->>S: getHomeBooks(filters)
  S->>R: listPublicBooks(filters)
  R->>DB: SELECT books, metadata, availability
  DB-->>R: Book rows
  R-->>S: Mapped books
  S-->>UI: Catalog response
```

### 3.3. User Profile

**Điểm vào:** `PUT /api/profile/me`  
**Thành phần dữ liệu:** `Users`, `UserProfiles`, `AuditLogs`.

```mermaid
sequenceDiagram
  actor Member
  participant UI as Profile Page
  participant API as Profile API
  participant S as ProfileService
  participant R as ProfileRepository
  participant DB as SQL Server
  Member->>UI: Edit profile
  UI->>API: PUT /api/profile/me
  API->>S: updateMyProfile(userId, input)
  S->>R: updateProfile(userId, updates)
  R->>DB: UPDATE UserProfiles
  S-->>UI: Updated profile
```

### 3.4. Membership Management

**Điểm vào:** `POST /api/membership/applications/:id/approve`  
**Thành phần dữ liệu:** `MembershipApplications`, `Members`, `Notifications`.

```mermaid
sequenceDiagram
  actor Staff
  participant UI as Membership Review UI
  participant API as Membership API
  participant S as MembershipService
  participant R as MembershipRepository
  participant N as NotificationService
  participant DB as SQL Server
  Staff->>UI: Approve application
  UI->>API: POST /api/membership/applications/:id/approve
  API->>S: approve(applicationId, actor)
  S->>R: approveApplication(...)
  R->>DB: UPDATE application and UPSERT member
  S->>N: notifyMembershipResult(...)
  S-->>UI: Approved status
```

### 3.5. Book and Inventory Management

**Điểm vào:** `/api/books`, `/api/books/:bookId/copies`, `/api/book-copies/:copyId`  
**Thành phần dữ liệu:** `Books`, `BookCopies` và dữ liệu danh mục liên quan.

```mermaid
sequenceDiagram
  actor Librarian
  participant UI as Book/Inventory UI
  participant API as Book or Inventory API
  participant S as BookService/InventoryService
  participant R as Repository
  participant DB as SQL Server
  Librarian->>UI: Save book or copy
  UI->>API: POST/PUT/PATCH book or copy endpoint
  API->>S: Validate and process
  S->>R: Insert or update record
  R->>DB: Parameterized SQL write
  S-->>UI: Saved entity
```

### 3.6. Borrowing and Reservation

**Điểm vào:** `POST /api/borrow-requests`  
**Thành phần dữ liệu:** `Members`, `Fines`, `BookCopies`, `BorrowRequests`, `BorrowDetails`, `Reservations`.

```mermaid
sequenceDiagram
  actor Member
  participant UI as Borrow/Reservation UI
  participant API as Borrowing API
  participant S as BorrowingService
  participant R as BorrowingRepository
  participant DB as SQL Server
  Member->>UI: Create borrow request
  UI->>API: POST /api/borrow-requests
  API->>S: createBorrowRequest(input, actor)
  S->>R: Check eligibility and copy status
  R->>DB: SELECT Members, Fines, BookCopies
  S->>R: Create request and details
  R->>DB: INSERT BorrowRequests/BorrowDetails
  S-->>UI: Pending request
```

### 3.7. Fine Management

**Điểm vào:** `POST /api/fines/:id/collections`  
**Thành phần dữ liệu:** `BorrowDetails`, `BorrowRequests`, `Fines`.

```mermaid
sequenceDiagram
  actor Librarian
  participant UI as Fine UI
  participant API as Fine API
  participant S as FineManagementService
  participant R as FineRepository
  participant DB as SQL Server
  Librarian->>UI: Record payment
  UI->>API: POST /api/fines/:id/collections
  API->>S: recordCollection(fineId, input)
  S->>R: Load and update fine
  R->>DB: SELECT/UPDATE Fines
  S-->>UI: Updated fine
```

### 3.8. Notification

**Điểm vào:** lời gọi nội bộ từ các feature service  
**Thành phần dữ liệu:** `NotificationTemplates`, `Notifications`, `NotificationAttempts`.

```mermaid
sequenceDiagram
  participant Feature as Feature Service
  participant N as NotificationService
  participant R as NotificationRepository
  participant E as EmailService
  participant DB as SQL Server
  Feature->>N: createNotificationRequestWithSource(...)
  N->>R: createNotification(payload)
  R->>DB: INSERT Notifications
  N->>E: Send email
  E-->>N: Provider result
  N->>R: Record attempt and update status
  R->>DB: INSERT attempt and UPDATE notification
```

### 3.9. User and Role Management

**Điểm vào:** `PUT /api/users/:userId/role`  
**Thành phần dữ liệu:** `Users`, `Roles`, `UserRoles`, `AuthTokens`, `AuditLogs`.

```mermaid
sequenceDiagram
  actor Admin
  participant UI as User Management UI
  participant API as User API
  participant S as UserManagementService
  participant U as UserRepository
  participant UR as UserRoleRepository
  participant DB as SQL Server
  Admin->>UI: Select replacement role
  UI->>API: PUT /api/users/:userId/role
  API->>S: replaceRole(userId, roleId, context)
  S->>U: Load target and validate request
  S->>UR: replaceUserRole(userId, roleId, actorId)
  UR->>DB: Lock rows and validate last Admin
  UR->>DB: DELETE old role and INSERT selected role
  UR->>DB: Revoke refresh tokens and INSERT audit log
  S-->>UI: Updated single role
```

**Ràng buộc:** thao tác thay role chạy trong một transaction; không cho phép loại bỏ role của Admin hoạt động cuối cùng.

### 3.10. Reporting and Statistics

**Điểm vào:** `GET /api/reports/borrowing` và các endpoint báo cáo liên quan  
**Thành phần dữ liệu:** dữ liệu tổng hợp từ mượn/trả, kho, người dùng, role và membership.

```mermaid
sequenceDiagram
  actor Admin
  participant UI as Report Page
  participant API as Report API
  participant S as ReportService
  participant R as ReportRepository
  participant DB as SQL Server
  Admin->>UI: Open report
  UI->>API: GET /api/reports/borrowing
  API->>S: getBorrowingReport(filters, actor)
  S->>R: getBorrowingReport(filters)
  R->>DB: Aggregate SQL query
  S-->>UI: Chart/table data
```

## 4. Quy ước kiểm tra

- Mỗi diagram phải render được bằng Mermaid CLI.
- Tên route, service và repository phải khớp code hiện hành.
- Thay đổi luồng nghiệp vụ phải được cập nhật đồng thời trong feature SPEC, `document/SDS.md` và tài liệu này.
- SQL chi tiết của các bước repository được đặc tả trong `document/DatabaseQueriesSpecification.md`.
