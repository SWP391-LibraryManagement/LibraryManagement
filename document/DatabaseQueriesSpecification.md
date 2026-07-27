# ĐẶC TẢ DATABASE QUERIES

## 1. Mục đích và phạm vi

Tài liệu tách phần Database Queries trong `document/SDS.md` thành một đặc tả độc lập cho 10 module Code Design. Các câu SQL dưới đây thể hiện mục đích truy vấn và tham số chính; code repository hiện hành là bằng chứng triển khai cuối cùng.

Quy ước chung:

- Database: Microsoft SQL Server.
- Mọi dữ liệu đầu vào phải truyền qua parameter binding; không nối chuỗi SQL từ input người dùng.
- Các thao tác nhiều bước làm thay đổi cùng một nghiệp vụ phải chạy trong transaction.
- Tên tham số có tiền tố `@`; thời gian cập nhật dùng `GETDATE()` hoặc giá trị thời gian do service truyền vào.
- FE05/FE06 và FE07/FE08 được gộp theo cấu trúc module của SDS.

## 2. Nguồn triển khai tham chiếu

| Module | Repository chính |
|---|---|
| Authentication | `backend/src/repositories/userRepository.js`, `authTokenRepository.js` |
| Public Browse | `backend/src/repositories/bookRepository.js` |
| User Profile | `backend/src/repositories/profileRepository.js`, `auditLogRepository.js` |
| Membership Management | `backend/src/repositories/membershipRepository.js` |
| Book and Inventory Management | `backend/src/repositories/bookRepository.js`, `inventoryRepository.js` |
| Borrowing and Reservation | `backend/src/repositories/borrowingRepository.js`, `reservationRepository.js` |
| Fine Management | `backend/src/repositories/fineRepository.js` |
| Notification | `backend/src/repositories/notificationRepository.js` |
| User and Role Management | `backend/src/repositories/userRepository.js`, `userRoleRepository.js` |
| Reporting and Statistics | `backend/src/repositories/reportRepository.js` |

## 3. Query specification theo module

### 3.1. Authentication

**Mục đích:** tìm tài khoản, tạo tài khoản/hồ sơ, đọc role và quản lý vòng đời token.

```sql
SELECT TOP 1 * FROM Users WHERE LOWER(Email) = LOWER(@Email);
SELECT TOP 1 * FROM Users WHERE LOWER(Email) = LOWER(@Identifier) OR LOWER(Username) = LOWER(@Identifier);
INSERT INTO Users (Username, Email, PasswordHash, Phone, Status) VALUES (@Username, @Email, @PasswordHash, @Phone, @Status);
INSERT INTO UserProfiles (UserId, FullName) VALUES (@UserId, @FullName);
SELECT r.RoleName FROM UserRoles ur INNER JOIN Roles r ON ur.RoleId = r.RoleId WHERE ur.UserId = @UserId;
INSERT INTO AuthTokens (UserId, TokenType, TokenHash, ExpiresAt, CreatedByIp) VALUES (@UserId, @TokenType, @TokenHash, @ExpiresAt, @CreatedByIp);
SELECT TOP 1 * FROM AuthTokens WHERE TokenType = @TokenType AND TokenHash = @TokenHash AND UsedAt IS NULL AND RevokedAt IS NULL ORDER BY CreatedAt DESC;
UPDATE AuthTokens SET UsedAt = COALESCE(UsedAt, GETDATE()) WHERE TokenId = @TokenId;
UPDATE AuthTokens SET RevokedAt = COALESCE(RevokedAt, GETDATE()) WHERE UserId = @UserId AND UsedAt IS NULL AND RevokedAt IS NULL;
UPDATE Users SET EmailVerifiedAt = COALESCE(EmailVerifiedAt, GETDATE()), UpdatedAt = GETDATE() WHERE UserId = @UserId;
UPDATE Users SET PasswordHash = @PasswordHash, UpdatedAt = GETDATE() WHERE UserId = @UserId;
```

### 3.2. Public Browse

**Mục đích:** trả danh mục sách công khai cùng metadata và số bản sao khả dụng.

```sql
SELECT b.BookId, b.Title, b.ISBN, c.CategoryName, a.AuthorName, p.PublisherName,
       b.RowVersion, COUNT(bc.CopyId) AS TotalCopies,
       SUM(CASE WHEN bc.Status = 'AVAILABLE' THEN 1 ELSE 0 END) AS AvailableCopies
FROM Books b
LEFT JOIN Categories c ON b.CategoryId = c.CategoryId
LEFT JOIN Authors a ON b.AuthorId = a.AuthorId
LEFT JOIN Publishers p ON b.PublisherId = p.PublisherId
LEFT JOIN BookCopies bc ON b.BookId = bc.BookId
WHERE b.Status = 'ACTIVE'
GROUP BY b.BookId, b.Title, b.ISBN, c.CategoryName, a.AuthorName, p.PublisherName, b.RowVersion;
SELECT * FROM Categories WHERE Status = 'ACTIVE' ORDER BY CategoryName;
SELECT * FROM Authors WHERE Status = 'ACTIVE' ORDER BY AuthorName;
SELECT * FROM Publishers WHERE Status = 'ACTIVE' ORDER BY PublisherName;
```

### 3.3. User Profile

**Mục đích:** đọc/cập nhật hồ sơ, avatar và ghi audit cho thay đổi nhạy cảm.

```sql
SELECT u.UserId, u.Email, u.Phone, up.FullName, up.Address, up.DateOfBirth, up.AvatarUrl
FROM Users u LEFT JOIN UserProfiles up ON u.UserId = up.UserId
WHERE u.UserId = @UserId;
UPDATE UserProfiles SET FullName = @FullName, Address = @Address, DateOfBirth = @DateOfBirth, UpdatedAt = GETDATE() WHERE UserId = @UserId;
UPDATE UserProfiles SET AvatarUrl = @AvatarUrl, UpdatedAt = GETDATE() WHERE UserId = @UserId;
INSERT INTO AuditLogs (UserId, Action, TargetType, TargetId, Metadata, IpAddress, UserAgent)
VALUES (@UserId, @Action, @TargetType, @TargetId, @Metadata, @IpAddress, @UserAgent);
```

### 3.4. Membership Management

**Mục đích:** nộp, tra cứu, duyệt hoặc từ chối đơn thành viên và đồng bộ bản ghi `Members`.

```sql
INSERT INTO MembershipApplications (UserId, Status) VALUES (@UserId, 'PENDING');
SELECT TOP 1 * FROM MembershipApplications WHERE UserId = @UserId ORDER BY AppliedAt DESC;
SELECT ma.*, u.Email, up.FullName FROM MembershipApplications ma INNER JOIN Users u ON ma.UserId = u.UserId LEFT JOIN UserProfiles up ON u.UserId = up.UserId WHERE ma.Status = @Status;
UPDATE MembershipApplications SET Status = 'APPROVED', ApprovedAt = GETDATE(), ReviewedBy = @ReviewedBy, ReviewNote = @ReviewNote WHERE ApplicationId = @ApplicationId;
MERGE Members AS target USING (SELECT @UserId AS UserId) AS source ON target.UserId = source.UserId
WHEN MATCHED THEN UPDATE SET Status = 'APPROVED', ApprovedAt = GETDATE(), ApprovedBy = @ReviewedBy, UpdatedAt = GETDATE()
WHEN NOT MATCHED THEN INSERT (UserId, Status, ApprovedAt, ApprovedBy) VALUES (@UserId, 'APPROVED', GETDATE(), @ReviewedBy);
UPDATE MembershipApplications SET Status = 'REJECTED', ReviewedBy = @ReviewedBy, ReviewNote = @ReviewNote WHERE ApplicationId = @ApplicationId;
```

### 3.5. Book and Inventory Management

**Mục đích:** tạo/cập nhật/ngưng kích hoạt sách và quản lý từng bản sao với optimistic concurrency.

```sql
INSERT INTO Books (Title, ISBN, CategoryId, AuthorId, PublisherId, PublishYear, Description, CoverUrl, Rating, Pages, CreatedBy)
VALUES (@Title, @ISBN, @CategoryId, @AuthorId, @PublisherId, @PublishYear, @Description, @CoverUrl, @Rating, @Pages, @CreatedBy);
UPDATE Books SET Title = @Title, ISBN = @ISBN, CategoryId = @CategoryId, AuthorId = @AuthorId, PublisherId = @PublisherId, PublishYear = @PublishYear, Description = @Description, CoverUrl = @CoverUrl, Rating = @Rating, Pages = @Pages, UpdatedBy = @UpdatedBy, UpdatedAt = GETDATE() WHERE BookId = @BookId AND RowVersion = @ExpectedRowVersion;
UPDATE Books SET Status = @Status, UpdatedBy = @UpdatedBy, UpdatedAt = GETDATE() WHERE BookId = @BookId AND RowVersion = @ExpectedRowVersion;
INSERT INTO BookCopies (BookId, Barcode, Status, Location) VALUES (@BookId, @Barcode, @Status, @Location);
UPDATE BookCopies SET Barcode = @Barcode, Location = @Location, UpdatedAt = GETDATE() WHERE CopyId = @CopyId AND Version = @ExpectedVersion;
UPDATE BookCopies SET Status = @Status, UpdatedAt = GETDATE() WHERE CopyId = @CopyId AND Version = @ExpectedVersion;
SELECT bc.*, bc.Version, b.Title FROM BookCopies bc INNER JOIN Books b ON bc.BookId = b.BookId WHERE bc.CopyId = @CopyId;
```

### 3.6. Borrowing and Reservation

**Mục đích:** kiểm tra điều kiện mượn, tạo/duyệt yêu cầu, cập nhật trạng thái bản sao và hàng đợi đặt trước.

```sql
SELECT * FROM Members WHERE UserId = @UserId AND Status = 'APPROVED';
SELECT * FROM BookCopies WHERE CopyId IN (@CopyIds) AND Status = 'AVAILABLE';
INSERT INTO BorrowRequests (UserId, Status, CreatedBy) VALUES (@UserId, 'PENDING', @CreatedBy);
INSERT INTO BorrowDetails (RequestId, CopyId, Status) VALUES (@RequestId, @CopyId, 'REQUESTED');
UPDATE BorrowRequests SET Status = 'APPROVED', ApprovedBy = @ApprovedBy, ApprovedAt = GETDATE(), UpdatedAt = GETDATE() WHERE RequestId = @RequestId;
UPDATE BorrowDetails SET BorrowDate = @BorrowDate, DueDate = @DueDate, Status = 'BORROWED', UpdatedAt = GETDATE() WHERE RequestId = @RequestId;
UPDATE BookCopies SET Status = 'BORROWED', UpdatedAt = GETDATE() WHERE CopyId = @CopyId;
UPDATE BorrowDetails SET ReturnDate = @ReturnDate, Status = @Status, UpdatedAt = GETDATE() WHERE BorrowDetailId = @BorrowDetailId;
INSERT INTO Reservations (UserId, CopyId, QueuePosition, Status) VALUES (@UserId, @CopyId, @QueuePosition, 'ACTIVE');
UPDATE Reservations SET Status = @Status, UpdatedAt = GETDATE() WHERE ReservationId = @ReservationId;
```

### 3.7. Fine Management

**Mục đích:** xác định khoản phạt theo lượt mượn, lập khoản phạt và ghi nhận thu tiền.

```sql
SELECT bd.*, br.UserId FROM BorrowDetails bd INNER JOIN BorrowRequests br ON bd.RequestId = br.RequestId WHERE bd.BorrowDetailId = @BorrowDetailId;
SELECT TOP 1 * FROM Fines WHERE BorrowDetailId = @BorrowDetailId AND Status IN ('UNPAID', 'PAID');
INSERT INTO Fines (UserId, BorrowDetailId, OverdueDays, RatePerDay, Amount, Reason, CreatedBy)
VALUES (@UserId, @BorrowDetailId, @OverdueDays, @RatePerDay, @Amount, @Reason, @CreatedBy);
SELECT f.*, u.Email FROM Fines f INNER JOIN Users u ON f.UserId = u.UserId WHERE f.UserId = @UserId;
UPDATE Fines SET PaidAmount = Amount, Status = 'PAID', PaidAt = @PaidAt, CollectedBy = @CollectedBy, PaymentMethod = @PaymentMethod, UpdatedAt = GETDATE() WHERE FineId = @FineId AND Status = 'UNPAID';
UPDATE Fines SET Status = @Status, Reason = @Reason, UpdatedAt = GETDATE() WHERE FineId = @FineId;
```

### 3.8. Notification

**Mục đích:** lấy template, tạo notification idempotent, xử lý hàng đợi và lưu từng lần gửi.

```sql
SELECT TOP 1 * FROM NotificationTemplates WHERE TemplateCode = @TemplateCode AND Status = 'ACTIVE';
INSERT INTO Notifications (NotificationType, TemplateId, TemplateKey, UserId, RecipientEmail, Channel, Status, Title, Body, SourceFeature, SourceEntityType, SourceEntityId, IdempotencyKey, SafePayload)
VALUES (@NotificationType, @TemplateId, @TemplateKey, @UserId, @RecipientEmail, @Channel, @Status, @Title, @Body, @SourceFeature, @SourceEntityType, @SourceEntityId, @IdempotencyKey, @SafePayload);
SELECT TOP (@Limit) * FROM Notifications WHERE Status = 'PENDING' ORDER BY CreatedAt ASC;
UPDATE Notifications SET Status = 'SENT', SentAt = GETDATE(), AttemptCount = AttemptCount + 1 WHERE NotificationId = @NotificationId;
UPDATE Notifications SET Status = 'FAILED', LastErrorMessage = @SafeErrorMessage, AttemptCount = AttemptCount + 1 WHERE NotificationId = @NotificationId;
INSERT INTO NotificationAttempts (NotificationId, Status, SafeErrorMessage, ProviderMessageId)
VALUES (@NotificationId, @Status, @SafeErrorMessage, @ProviderMessageId);
```

### 3.9. User and Role Management

**Mục đích:** quản lý tài khoản và thay thế role duy nhất, đồng thời bảo vệ Admin cuối cùng, thu hồi refresh token và ghi audit.

```sql
SELECT u.UserId, u.Username, u.Email, u.Phone, u.Status, up.FullName, r.RoleId, r.RoleName
FROM Users u
LEFT JOIN UserProfiles up ON u.UserId = up.UserId
LEFT JOIN UserRoles ur ON u.UserId = ur.UserId
LEFT JOIN Roles r ON ur.RoleId = r.RoleId;
SELECT RoleId, RoleName FROM Roles WHERE UPPER(RoleName) IN ('ADMIN', 'LIBRARIAN', 'MEMBER');
SELECT ur.RoleId, UPPER(r.RoleName) AS RoleName FROM UserRoles ur WITH (UPDLOCK, HOLDLOCK)
INNER JOIN Roles r WITH (UPDLOCK, HOLDLOCK) ON r.RoleId = ur.RoleId WHERE ur.UserId = @UserId;
DELETE FROM UserRoles WHERE UserId = @UserId;
INSERT INTO UserRoles (UserId, RoleId, CreatedAt) VALUES (@UserId, @RoleId, @Now);
UPDATE AuthTokens SET RevokedAt = COALESCE(RevokedAt, @Now)
WHERE UserId = @UserId AND TokenType = 'REFRESH' AND UsedAt IS NULL AND RevokedAt IS NULL;
INSERT INTO AuditLogs (UserId, Action, TargetType, TargetId, Metadata, IpAddress, UserAgent, CreatedAt)
VALUES (@AdminUserId, 'USER_ROLE_REPLACE', 'USER', @UserId, @Metadata, @IpAddress, @UserAgent, @Now);
```

**Transaction:** khóa actor, target, role và mapping bằng `UPDLOCK, HOLDLOCK`; kiểm tra Admin hoạt động cuối cùng trước khi xóa/ghi role. Toàn bộ thay role, thu hồi token và audit phải commit hoặc rollback cùng nhau.

### 3.10. Reporting and Statistics

**Mục đích:** tổng hợp trạng thái mượn/trả, kho, danh mục, tài khoản, role và membership cho báo cáo.

```sql
SELECT Status, COUNT(*) AS Total FROM BorrowRequests GROUP BY Status;
SELECT bd.Status, COUNT(*) AS Total FROM BorrowDetails bd GROUP BY bd.Status;
SELECT bc.Status, COUNT(*) AS Total FROM BookCopies bc GROUP BY bc.Status;
SELECT c.CategoryName, COUNT(b.BookId) AS BookCount FROM Categories c LEFT JOIN Books b ON c.CategoryId = b.CategoryId GROUP BY c.CategoryName;
SELECT u.Status, COUNT(*) AS Total FROM Users u GROUP BY u.Status;
SELECT r.RoleName, COUNT(ur.UserId) AS Total FROM Roles r LEFT JOIN UserRoles ur ON r.RoleId = ur.RoleId GROUP BY r.RoleName;
SELECT m.Status, COUNT(*) AS Total FROM Members m GROUP BY m.Status;
```

## 4. Yêu cầu an toàn và đồng bộ

- Query ghi dữ liệu phải kiểm tra quyền ở middleware/service trước khi gọi repository.
- Query có điều kiện concurrency (`RowVersion`, `Version`) phải trả lỗi xung đột khi không cập nhật được bản ghi.
- Query ghi nhiều bảng cho cùng nghiệp vụ phải dùng transaction và rollback khi có lỗi.
- Không lưu password, token hoặc thông tin nhạy cảm dạng rõ; chỉ lưu hash hoặc safe metadata theo thiết kế.
- Khi schema hoặc repository thay đổi, cập nhật đồng thời feature SPEC, `document/SDS.md` và tài liệu này.
