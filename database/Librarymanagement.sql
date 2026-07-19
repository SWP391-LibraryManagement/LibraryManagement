SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

CREATE DATABASE LibraryManagementDB;
GO

USE LibraryManagementDB;
GO

CREATE TABLE Roles (
    RoleId INT IDENTITY PRIMARY KEY,
    RoleName NVARCHAR(50) UNIQUE NOT NULL,
    CONSTRAINT CK_Roles_RoleName CHECK (RoleName IN ('ADMIN', 'LIBRARIAN', 'MEMBER', 'GUEST'))
);

CREATE TABLE Users (
    UserId INT IDENTITY PRIMARY KEY,
    Username NVARCHAR(50) UNIQUE NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    Phone NVARCHAR(20),
    Status NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    EmailVerifiedAt DATETIME NULL,
    FailedLoginCount INT NOT NULL DEFAULT 0,
    LockedUntil DATETIME NULL,
    LastLoginAt DATETIME NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,
    CONSTRAINT CK_Users_Status CHECK (Status IN ('ACTIVE', 'INACTIVE', 'LOCKED'))
);

CREATE TABLE UserRoles (
    UserId INT NOT NULL,
    RoleId INT NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY (UserId, RoleId),
    FOREIGN KEY (UserId) REFERENCES Users(UserId),
    FOREIGN KEY (RoleId) REFERENCES Roles(RoleId)
);

CREATE TABLE UserProfiles (
    ProfileId INT IDENTITY PRIMARY KEY,
    UserId INT UNIQUE NOT NULL,
    FullName NVARCHAR(100),
    Address NVARCHAR(255),
    DateOfBirth DATE,
    AvatarUrl NVARCHAR(255),
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

CREATE TABLE Members (
    MemberId INT IDENTITY PRIMARY KEY,
    UserId INT UNIQUE NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'PENDING',
    ApprovedAt DATETIME NULL,
    ApprovedBy INT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,
    FOREIGN KEY (UserId) REFERENCES Users(UserId),
    FOREIGN KEY (ApprovedBy) REFERENCES Users(UserId),
    CONSTRAINT CK_Members_Status CHECK (Status IN ('PENDING', 'APPROVED', 'REJECTED', 'INACTIVE'))
);

CREATE TABLE MembershipApplications (
    ApplicationId INT IDENTITY PRIMARY KEY,
    UserId INT NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'PENDING',
    AppliedAt DATETIME NOT NULL DEFAULT GETDATE(),
    ApprovedAt DATETIME NULL,
    ReviewedBy INT NULL,
    ReviewNote NVARCHAR(500) NULL,
    FOREIGN KEY (UserId) REFERENCES Users(UserId),
    FOREIGN KEY (ReviewedBy) REFERENCES Users(UserId),
    CONSTRAINT CK_MembershipApplications_Status CHECK (Status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

CREATE TABLE AuthTokens (
    TokenId INT IDENTITY PRIMARY KEY,
    UserId INT NOT NULL,
    TokenType NVARCHAR(30) NOT NULL,
    TokenHash NVARCHAR(255) NOT NULL,
    ExpiresAt DATETIME NOT NULL,
    UsedAt DATETIME NULL,
    RevokedAt DATETIME NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    CreatedByIp NVARCHAR(50) NULL,
    FOREIGN KEY (UserId) REFERENCES Users(UserId),
    CONSTRAINT CK_AuthTokens_TokenType CHECK (TokenType IN ('REFRESH', 'PASSWORD_RESET', 'EMAIL_VERIFY', 'ACCOUNT_SETUP', 'CHANGE_PASSWORD_OTP'))
);

CREATE INDEX IX_AuthTokens_UserId_TokenType ON AuthTokens(UserId, TokenType);
CREATE INDEX IX_AuthTokens_TokenHash ON AuthTokens(TokenHash);

CREATE TABLE Categories (
    CategoryId INT IDENTITY PRIMARY KEY,
    CategoryName NVARCHAR(100) NOT NULL UNIQUE,
    Status NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
);

CREATE TABLE Authors (
    AuthorId INT IDENTITY PRIMARY KEY,
    AuthorName NVARCHAR(100) NOT NULL UNIQUE,
    Status NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
);

CREATE TABLE Publishers (
    PublisherId INT IDENTITY PRIMARY KEY,
    PublisherName NVARCHAR(100) NOT NULL UNIQUE,
    Status NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
);

CREATE TABLE Books (
    BookId INT IDENTITY PRIMARY KEY,
    Title NVARCHAR(255) NOT NULL,
    ISBN NVARCHAR(50) NULL,
    CategoryId INT,
    AuthorId INT,
    PublisherId INT,
    PublishYear INT,
    Description NVARCHAR(MAX),
    CoverUrl NVARCHAR(255),
    Rating DECIMAL(2,1) NULL,
    Pages INT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    CreatedBy INT NULL,
    UpdatedBy INT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,
    FOREIGN KEY (CategoryId) REFERENCES Categories(CategoryId),
    FOREIGN KEY (AuthorId) REFERENCES Authors(AuthorId),
    FOREIGN KEY (PublisherId) REFERENCES Publishers(PublisherId),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserId),
    FOREIGN KEY (UpdatedBy) REFERENCES Users(UserId),
    CONSTRAINT CK_Books_Status CHECK (Status IN ('ACTIVE', 'INACTIVE'))
);

CREATE UNIQUE INDEX UX_Books_ISBN_NotNull ON Books(ISBN) WHERE ISBN IS NOT NULL;

CREATE TABLE BookCopies (
    CopyId INT IDENTITY PRIMARY KEY,
    BookId INT NOT NULL,
    Barcode NVARCHAR(100) UNIQUE NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    Location NVARCHAR(100),
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,
    FOREIGN KEY (BookId) REFERENCES Books(BookId),
    CONSTRAINT CK_BookCopies_Status CHECK (Status IN ('AVAILABLE', 'BORROWED', 'RESERVED', 'DAMAGED', 'LOST', 'INACTIVE'))
);

CREATE TABLE BorrowRequests (
    RequestId INT IDENTITY PRIMARY KEY,
    UserId INT NOT NULL,
    RequestDate DATETIME NOT NULL DEFAULT GETDATE(),
    Status NVARCHAR(20) NOT NULL DEFAULT 'PENDING',
    CreatedBy INT NULL,
    ApprovedBy INT NULL,
    ApprovedAt DATETIME NULL,
    RejectedAt DATETIME NULL,
    ProcessedAt DATETIME NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,
    FOREIGN KEY (UserId) REFERENCES Users(UserId),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserId),
    FOREIGN KEY (ApprovedBy) REFERENCES Users(UserId),
    CONSTRAINT CK_BorrowRequests_Status CHECK (Status IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'))
);

CREATE TABLE BorrowDetails (
    BorrowDetailId INT IDENTITY PRIMARY KEY,
    RequestId INT NOT NULL,
    CopyId INT NOT NULL,
    BorrowDate DATE NULL,
    DueDate DATE NULL,
    ReturnDate DATE NULL,
    RenewalCount INT NOT NULL DEFAULT 0,
    Status NVARCHAR(20) NOT NULL DEFAULT 'REQUESTED',
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,
    FOREIGN KEY (RequestId) REFERENCES BorrowRequests(RequestId),
    FOREIGN KEY (CopyId) REFERENCES BookCopies(CopyId),
    CONSTRAINT CK_BorrowDetails_Status CHECK (Status IN ('REQUESTED', 'BORROWED', 'RETURNED', 'LOST', 'DAMAGED'))
);

CREATE TABLE Reservations (
    ReservationId INT IDENTITY PRIMARY KEY,
    UserId INT NOT NULL,
    CopyId INT NOT NULL,
    ReservedAt DATETIME NOT NULL DEFAULT GETDATE(),
    QueuePosition INT NULL,
    ExpiresAt DATETIME NULL,
    NotifiedAt DATETIME NULL,
    CancelledAt DATETIME NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,
    FOREIGN KEY (UserId) REFERENCES Users(UserId),
    FOREIGN KEY (CopyId) REFERENCES BookCopies(CopyId),
    CONSTRAINT CK_Reservations_Status CHECK (Status IN ('ACTIVE', 'FULFILLED', 'CANCELLED', 'EXPIRED', 'NOTIFIED'))
);

CREATE TABLE Fines (
    FineId INT IDENTITY PRIMARY KEY,
    UserId INT NOT NULL,
    BorrowDetailId INT NOT NULL,
    OverdueDays INT NOT NULL DEFAULT 0,
    RatePerDay DECIMAL(10,2) NOT NULL DEFAULT 5000,
    Amount DECIMAL(10,2) NOT NULL,
    PaidAmount DECIMAL(10,2) NOT NULL DEFAULT 0,
    Reason NVARCHAR(255),
    Status NVARCHAR(20) NOT NULL DEFAULT 'UNPAID',
    CalculatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    PaidAt DATETIME NULL,
    CreatedBy INT NULL,
    CollectedBy INT NULL,
    PaymentMethod NVARCHAR(50) NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,
    FOREIGN KEY (UserId) REFERENCES Users(UserId),
    FOREIGN KEY (BorrowDetailId) REFERENCES BorrowDetails(BorrowDetailId),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserId),
    FOREIGN KEY (CollectedBy) REFERENCES Users(UserId),
    CONSTRAINT CK_Fines_Status CHECK (Status IN ('UNPAID', 'PAID', 'WAIVED', 'CANCELLED'))
);

CREATE TABLE NotificationTemplates (
    TemplateId INT IDENTITY PRIMARY KEY,
    TemplateCode NVARCHAR(100) UNIQUE NOT NULL,
    Subject NVARCHAR(255) NOT NULL,
    Body NVARCHAR(MAX) NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,
    CONSTRAINT CK_NotificationTemplates_Status CHECK (Status IN ('ACTIVE', 'INACTIVE'))
);

CREATE TABLE Notifications (
    NotificationId INT IDENTITY PRIMARY KEY,
    NotificationType NVARCHAR(50) NULL,
    TemplateId INT NULL,
    TemplateKey NVARCHAR(100) NULL,
    UserId INT NULL,
    RecipientEmail NVARCHAR(100) NOT NULL,
    Channel NVARCHAR(20) NOT NULL DEFAULT 'EMAIL',
    Status NVARCHAR(20) NOT NULL DEFAULT 'PENDING',
    Title NVARCHAR(255) NULL,
    Body NVARCHAR(MAX) NULL,
    SourceFeature NVARCHAR(20) NULL,
    SourceEntityType NVARCHAR(50) NULL,
    SourceEntityId INT NULL,
    IdempotencyKey NVARCHAR(100) NULL,
    SafePayload NVARCHAR(MAX) NULL,
    AttemptCount INT NOT NULL DEFAULT 0,
    LastErrorMessage NVARCHAR(500) NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    SentAt DATETIME NULL,
    FOREIGN KEY (TemplateId) REFERENCES NotificationTemplates(TemplateId),
    FOREIGN KEY (UserId) REFERENCES Users(UserId),
    CONSTRAINT CK_Notifications_Type CHECK (NotificationType IS NULL OR NotificationType IN ('ACCOUNT_VERIFICATION', 'PASSWORD_RESET', 'ACCOUNT_SETUP', 'RESERVATION_AVAILABLE', 'DUE_DATE_REMINDER', 'OVERDUE_NOTICE', 'FINE_NOTICE', 'GENERAL_SYSTEM')),
    CONSTRAINT CK_Notifications_Channel CHECK (Channel IN ('EMAIL')),
    CONSTRAINT CK_Notifications_Status CHECK (Status IN ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'SKIPPED', 'CANCELLED'))
);

CREATE UNIQUE INDEX UX_Notifications_IdempotencyKey_NotNull
ON Notifications(IdempotencyKey)
WHERE IdempotencyKey IS NOT NULL;

CREATE TABLE NotificationAttempts (
    AttemptId INT IDENTITY PRIMARY KEY,
    NotificationId INT NOT NULL,
    AttemptedAt DATETIME NOT NULL DEFAULT GETDATE(),
    Status NVARCHAR(20) NOT NULL,
    SafeErrorMessage NVARCHAR(500) NULL,
    ProviderMessageId NVARCHAR(255) NULL,
    FOREIGN KEY (NotificationId) REFERENCES Notifications(NotificationId),
    CONSTRAINT CK_NotificationAttempts_Status CHECK (Status IN ('SENT', 'FAILED'))
);

CREATE TABLE AuditLogs (
    LogId INT IDENTITY PRIMARY KEY,
    UserId INT NULL,
    Action NVARCHAR(255) NOT NULL,
    TargetType NVARCHAR(100) NULL,
    TargetId INT NULL,
    Metadata NVARCHAR(MAX) NULL,
    IpAddress NVARCHAR(50) NULL,
    UserAgent NVARCHAR(255) NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);
GO

/* =========================
   SAFE DEMO SEED DATA
   These password hashes are placeholders for local demos only.
   Do not treat seeded users as production accounts.
   ========================= */
INSERT INTO Roles (RoleName) VALUES
('ADMIN'), ('LIBRARIAN'), ('MEMBER'), ('GUEST');

INSERT INTO Users (Username, Email, PasswordHash, Phone, Status, EmailVerifiedAt)
VALUES
('demo_admin', 'demo.admin@example.test', '$2b$10$placeholderHashForDemoAdminOnly00000000000000000000000000', '0900000001', 'ACTIVE', GETDATE()),
('demo_librarian', 'demo.librarian@example.test', '$2b$10$placeholderHashForDemoLibrarianOnly000000000000000000000', '0900000002', 'ACTIVE', GETDATE()),
('member_an', 'member.an@example.test', '$2b$10$placeholderHashForSeedMemberOnly00000000000000000000000', '0900000003', 'ACTIVE', GETDATE());

INSERT INTO UserRoles (UserId, RoleId) VALUES
(1,1),(2,2),(3,3);

INSERT INTO UserProfiles (UserId, FullName, Address, DateOfBirth)
VALUES
(1,'Demo Admin','Hanoi','2000-01-01'),
(2,'Demo Librarian','Hanoi','2000-02-02'),
(3,N'Nguyễn Minh An',N'Hà Nội','2001-03-03');

DECLARE @SeedMembershipApprovedAt DATETIME = GETDATE();

INSERT INTO Members (UserId, Status, ApprovedAt, ApprovedBy)
VALUES
(3, 'APPROVED', @SeedMembershipApprovedAt, 1);

-- Keep the immutable application history consistent with the canonical
-- approved Members projection used by borrowing and reservation eligibility.
INSERT INTO MembershipApplications (UserId, Status, AppliedAt, ApprovedAt, ReviewedBy, ReviewNote)
VALUES
(3, 'APPROVED', DATEADD(DAY, -1, @SeedMembershipApprovedAt), @SeedMembershipApprovedAt, 1, N'Hồ sơ hội viên đã được duyệt.');

INSERT INTO Categories (CategoryName) VALUES
('Programming'),('Database'),('AI'),('Novel');

INSERT INTO Authors (AuthorName) VALUES
(N'Robert Martin'),(N'Andrew Tanenbaum'),(N'Yuval Harari'),(N'J.K. Rowling'),(N'Stuart Russell'),(N'Ian Goodfellow'),(N'Aurélien Géron'),(N'Martin Fowler'),(N'Kent Beck'),(N'George Orwell'),(N'Dan Brown'),(N'Paulo Coelho'),(N'Abraham Silberschatz'),(N'Elmasri Navathe'),(N'Donald Knuth');

INSERT INTO Publishers (PublisherName) VALUES
(N'OReilly'),(N'Pearson'),(N'Penguin'),(N'MIT Press'),(N'Addison-Wesley'),(N'HarperCollins'),(N'McGraw-Hill'),(N'No Starch Press');

INSERT INTO Books 
(Title, ISBN, CategoryId, AuthorId, PublisherId, PublishYear, Description, CoverUrl, Rating, Pages, Status, CreatedBy)
VALUES
(
    N'Clean Code',
    'B1',
    1,
    1,
    1,
    2008,
    N'Sách hướng dẫn viết code sạch, dễ đọc, dễ bảo trì và phù hợp cho lập trình viên.',
    N'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=300&h=420&fit=crop&auto=format',
    4.8,
    464,
    'ACTIVE',
    1
),
(
    N'Database System',
    'B2',
    2,
    2,
    2,
    2015,
    N'Tài liệu nền tảng về cơ sở dữ liệu, mô hình dữ liệu, SQL và hệ quản trị cơ sở dữ liệu.',
    N'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=300&h=420&fit=crop&auto=format',
    4.4,
    520,
    'ACTIVE',
    1
),
(
    N'Sapiens',
    'B3',
    4,
    3,
    3,
    2011,
    N'Cuốn sách kể về lịch sử phát triển của loài người qua góc nhìn sinh học, xã hội và văn minh.',
    N'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=300&h=420&fit=crop&auto=format',
    4.7,
    443,
    'ACTIVE',
    1
),
(
    N'Harry Potter',
    'B4',
    4,
    4,
    3,
    2001,
    N'Câu chuyện phép thuật nổi tiếng về Harry Potter và hành trình trưởng thành tại trường Hogwarts.',
    N'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=420&fit=crop&auto=format',
    4.9,
    350,
    'ACTIVE',
    1
),
(
    N'Artificial Intelligence: A Modern Approach',
    'B5',
    3,
    5,
    2,
    2021,
    N'Cuốn sách nền tảng về trí tuệ nhân tạo, bao gồm tìm kiếm, suy luận, học máy và tác tử thông minh.',
    N'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=300&h=420&fit=crop&auto=format',
    4.6,
    1152,
    'ACTIVE',
    1
),
(
    N'Deep Learning',
    'B6',
    3,
    6,
    4,
    2016,
    N'Sách chuyên sâu về deep learning, mạng nơ-ron và các kỹ thuật học sâu hiện đại.',
    N'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=300&h=420&fit=crop&auto=format',
    4.5,
    800,
    'ACTIVE',
    1
),
(
    N'Hands-On Machine Learning',
    'B7',
    3,
    7,
    1,
    2019,
    N'Sách thực hành machine learning với ví dụ trực quan, phù hợp cho người học lập trình AI.',
    N'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=300&h=420&fit=crop&auto=format',
    4.7,
    856,
    'ACTIVE',
    1
),
(
    N'Refactoring',
    'B8',
    1,
    8,
    5,
    2018,
    N'Hướng dẫn cải tiến cấu trúc code, giúp phần mềm dễ hiểu, dễ mở rộng và dễ bảo trì hơn.',
    N'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300&h=420&fit=crop&auto=format',
    4.6,
    448,
    'ACTIVE',
    1
),
(
    N'Test Driven Development',
    'B9',
    1,
    9,
    5,
    2003,
    N'Sách giới thiệu phương pháp phát triển phần mềm dựa trên kiểm thử, giúp code ổn định hơn.',
    N'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300&h=420&fit=crop&auto=format',
    4.3,
    240,
    'ACTIVE',
    1
),
(
    N'Database System Concepts',
    'B10',
    2,
    13,
    7,
    2019,
    N'Sách trình bày các khái niệm quan trọng của hệ quản trị cơ sở dữ liệu, giao dịch và tối ưu truy vấn.',
    N'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=300&h=420&fit=crop&auto=format',
    4.4,
    1376,
    'ACTIVE',
    1
),
(
    N'Fundamentals of Database Systems',
    'B11',
    2,
    14,
    2,
    2016,
    N'Tài liệu nền tảng về thiết kế cơ sở dữ liệu, ERD, chuẩn hóa dữ liệu và kiến trúc hệ quản trị dữ liệu.',
    N'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=420&fit=crop&auto=format',
    4.2,
    1272,
    'ACTIVE',
    1
),
(
    N'The Art of Computer Programming',
    'B12',
    1,
    15,
    5,
    1997,
    N'Bộ sách nổi tiếng về thuật toán, cấu trúc dữ liệu và nền tảng khoa học máy tính.',
    N'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=300&h=420&fit=crop&auto=format',
    4.8,
    672,
    'ACTIVE',
    1
),
(
    N'1984',
    'B13',
    4,
    10,
    3,
    1949,
    N'Tiểu thuyết phản địa đàng nổi tiếng về xã hội toàn trị, giám sát và kiểm soát tư tưởng.',
    N'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=300&h=420&fit=crop&auto=format',
    4.7,
    328,
    'ACTIVE',
    1
),
(
    N'The Da Vinci Code',
    'B14',
    4,
    11,
    6,
    2003,
    N'Tiểu thuyết trinh thám xoay quanh bí mật lịch sử, nghệ thuật và các cuộc truy tìm căng thẳng.',
    N'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=300&h=420&fit=crop&auto=format',
    4.1,
    489,
    'ACTIVE',
    1
),
(
    N'The Alchemist',
    'B15',
    4,
    12,
    6,
    1988,
    N'Câu chuyện biểu tượng về hành trình theo đuổi ước mơ, khám phá bản thân và ý nghĩa cuộc sống.',
    N'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=300&h=420&fit=crop&auto=format',
    4.6,
    208,
    'ACTIVE',
    1
);

INSERT INTO BookCopies (BookId, Barcode, Status, Location)
VALUES
(1, 'BC1', 'AVAILABLE', N'A1'),
(1, 'BC2', 'BORROWED', N'A1'),
(2, 'BC3', 'AVAILABLE', N'A2'),
(3, 'BC4', 'AVAILABLE', N'B1'),
(4, 'BC5', 'AVAILABLE', N'B2'),
(5, 'BC6', 'AVAILABLE', N'AI-01'),
(6, 'BC7', 'AVAILABLE', N'AI-02'),
(7, 'BC8', 'AVAILABLE', N'AI-03'),
(8, 'BC9', 'AVAILABLE', N'PR-01'),
(9, 'BC10', 'AVAILABLE', N'PR-02'),
(10, 'BC11', 'AVAILABLE', N'DB-01'),
(11, 'BC12', 'AVAILABLE', N'DB-02'),
(12, 'BC13', 'AVAILABLE', N'PR-03'),
(13, 'BC14', 'AVAILABLE', N'NV-01'),
(14, 'BC15', 'AVAILABLE', N'NV-02'),
(15, 'BC16', 'AVAILABLE', N'NV-03');

/* Canonical circulation seed: one active loan and one completed return. */
INSERT INTO BorrowRequests (UserId, Status, CreatedBy, ApprovedBy, ApprovedAt, ProcessedAt)
VALUES
(3, 'APPROVED', 3, 2, DATEADD(DAY, -7, GETDATE()), DATEADD(DAY, -7, GETDATE())),
(3, 'COMPLETED', 3, 2, DATEADD(DAY, -30, GETDATE()), DATEADD(DAY, -15, GETDATE()));

INSERT INTO BorrowDetails
(RequestId, CopyId, BorrowDate, DueDate, ReturnDate, RenewalCount, Status)
VALUES
(1, 2, CAST(DATEADD(DAY, -7, GETDATE()) AS DATE), CAST(DATEADD(DAY, 7, GETDATE()) AS DATE), NULL, 0, 'BORROWED'),
(2, 3, CAST(DATEADD(DAY, -30, GETDATE()) AS DATE), CAST(DATEADD(DAY, -16, GETDATE()) AS DATE), CAST(DATEADD(DAY, -15, GETDATE()) AS DATE), 1, 'RETURNED');

/* Canonical FE09 seed: the completed return above is one day overdue. */
INSERT INTO Fines
(UserId, BorrowDetailId, OverdueDays, RatePerDay, Amount, PaidAmount, Reason, Status, CalculatedAt, CreatedBy)
SELECT br.UserId, bd.BorrowDetailId, 1, 5000, 5000, 0, 'OVERDUE', 'UNPAID', GETDATE(), 2
FROM BorrowDetails bd
JOIN BorrowRequests br ON br.RequestId = bd.RequestId
WHERE bd.RequestId = 2
  AND bd.CopyId = 3
  AND bd.Status = 'RETURNED';

INSERT INTO NotificationTemplates (TemplateCode, Subject, Body)
VALUES
('ACCOUNT_VERIFICATION','Verify your account','Please verify your library account: {{verificationLink}}.'),
('PASSWORD_RESET','Reset your password','Please reset your library account password: {{resetLink}}.'),
('ACCOUNT_SETUP','Set up your library account','Complete your library account setup: {{setupLink}}. This link expires in {{expiresInHours}} hours.'),
('RESERVATION_READY','Book reservation ready','Your reserved book is ready.'),
('DUE_DATE_REMINDER','Library due date reminder','Please review your borrowing due date.'),
('OVERDUE_NOTICE','Library overdue notice','Please review your overdue borrowing item.'),
('FINE_NOTICE','Library fine notice','Please review your library fine notice.'),
('MEMBERSHIP_RESULT','Membership result','Please review your membership result.');

INSERT INTO AuditLogs (UserId, Action, TargetType, TargetId, Metadata)
VALUES
(1,'Init DB','Database',NULL,'{"seed":"phase1-demo"}'),
(2,'Add demo books','Books',NULL,'{"count":4}'),
(2,'BORROW_REQUEST_APPROVE','BORROW_REQUEST',1,'{"seed":"canonical-circulation"}'),
(2,'BORROW_DETAIL_RETURN','BORROW_DETAIL',2,'{"condition":"NORMAL","seed":"canonical-circulation"}'),
(2,'FINE_CALCULATE','FINE',1,'{"borrowDetailId":2,"overdueDays":1,"ratePerDay":5000,"amount":5000,"seed":"canonical-fine"}');
GO
