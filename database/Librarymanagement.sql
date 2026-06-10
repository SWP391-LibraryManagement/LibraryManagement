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
    CONSTRAINT CK_AuthTokens_TokenType CHECK (TokenType IN ('REFRESH', 'PASSWORD_RESET', 'EMAIL_VERIFY', 'ACCOUNT_SETUP'))
);

CREATE INDEX IX_AuthTokens_UserId_TokenType ON AuthTokens(UserId, TokenType);
CREATE INDEX IX_AuthTokens_TokenHash ON AuthTokens(TokenHash);

CREATE TABLE Categories (
    CategoryId INT IDENTITY PRIMARY KEY,
    CategoryName NVARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE Authors (
    AuthorId INT IDENTITY PRIMARY KEY,
    AuthorName NVARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE Publishers (
    PublisherId INT IDENTITY PRIMARY KEY,
    PublisherName NVARCHAR(100) NOT NULL UNIQUE
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
    CONSTRAINT CK_BorrowRequests_Status CHECK (Status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'))
);

CREATE TABLE BorrowDetails (
    BorrowDetailId INT IDENTITY PRIMARY KEY,
    RequestId INT NOT NULL,
    CopyId INT NOT NULL,
    BorrowDate DATE NULL,
    DueDate DATE NOT NULL,
    ReturnDate DATE NULL,
    RenewalCount INT NOT NULL DEFAULT 0,
    Status NVARCHAR(20) NOT NULL DEFAULT 'BORROWED',
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,
    FOREIGN KEY (RequestId) REFERENCES BorrowRequests(RequestId),
    FOREIGN KEY (CopyId) REFERENCES BookCopies(CopyId),
    CONSTRAINT CK_BorrowDetails_Status CHECK (Status IN ('BORROWED', 'RETURNED', 'OVERDUE', 'LOST'))
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
    CONSTRAINT CK_Reservations_Status CHECK (Status IN ('ACTIVE', 'FULFILLED', 'CANCELLED', 'EXPIRED'))
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
    CONSTRAINT CK_Fines_Status CHECK (Status IN ('UNPAID', 'PAID', 'WAIVED'))
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
    TemplateId INT NULL,
    UserId INT NULL,
    RecipientEmail NVARCHAR(100) NOT NULL,
    Channel NVARCHAR(20) NOT NULL DEFAULT 'EMAIL',
    Status NVARCHAR(20) NOT NULL DEFAULT 'PENDING',
    SourceFeature NVARCHAR(20) NULL,
    SourceEntityType NVARCHAR(50) NULL,
    SourceEntityId INT NULL,
    SafePayload NVARCHAR(MAX) NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    SentAt DATETIME NULL,
    FOREIGN KEY (TemplateId) REFERENCES NotificationTemplates(TemplateId),
    FOREIGN KEY (UserId) REFERENCES Users(UserId),
    CONSTRAINT CK_Notifications_Channel CHECK (Channel IN ('EMAIL')),
    CONSTRAINT CK_Notifications_Status CHECK (Status IN ('PENDING', 'SENT', 'FAILED', 'CANCELLED'))
);

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
('demo_member', 'demo.member@example.test', '$2b$10$placeholderHashForDemoMemberOnly00000000000000000000000', '0900000003', 'ACTIVE', GETDATE());

INSERT INTO UserRoles (UserId, RoleId) VALUES
(1,1),(2,2),(3,3);

INSERT INTO UserProfiles (UserId, FullName, Address, DateOfBirth)
VALUES
(1,'Demo Admin','Hanoi','2000-01-01'),
(2,'Demo Librarian','Hanoi','2000-02-02'),
(3,'Demo Member','Hanoi','2001-03-03');

INSERT INTO Members (UserId, Status, ApprovedAt, ApprovedBy)
VALUES
(3, 'APPROVED', GETDATE(), 1);

INSERT INTO Categories (CategoryName) VALUES
('Programming'),('Database'),('AI'),('Novel');

INSERT INTO Authors (AuthorName) VALUES
('Robert Martin'),('Andrew Tanenbaum'),('Yuval Harari'),('J.K. Rowling');

INSERT INTO Publishers (PublisherName) VALUES
('OReilly'),('Pearson'),('Penguin');

INSERT INTO Books (Title, ISBN, CategoryId, AuthorId, PublisherId, PublishYear, Description, Status, CreatedBy)
VALUES
('Clean Code','B1',1,1,1,2008,'Coding rules','ACTIVE',1),
('Database System','B2',2,2,2,2015,'DB theory','ACTIVE',1),
('Sapiens','B3',4,3,3,2011,'History book','ACTIVE',1),
('Harry Potter','B4',4,4,3,2001,'Magic story','ACTIVE',1);

INSERT INTO BookCopies (BookId, Barcode, Status, Location)
VALUES
(1,'BC1','AVAILABLE','A1'),
(1,'BC2','BORROWED','A1'),
(2,'BC3','AVAILABLE','A2'),
(3,'BC4','AVAILABLE','B1'),
(4,'BC5','RESERVED','B2');

INSERT INTO BorrowRequests (UserId, Status, CreatedBy, ApprovedBy, ApprovedAt, ProcessedAt)
VALUES
(3,'APPROVED',2,2,GETDATE(),GETDATE());

INSERT INTO BorrowDetails (RequestId, CopyId, BorrowDate, DueDate, Status)
VALUES
(1,2,'2026-05-27','2026-06-10','BORROWED');

INSERT INTO Reservations (UserId, CopyId, QueuePosition, Status)
VALUES
(3,5,1,'ACTIVE');

INSERT INTO Fines (UserId, BorrowDetailId, OverdueDays, RatePerDay, Amount, Reason, Status, CreatedBy)
VALUES
(3,1,2,5000,10000,'Late return','UNPAID',2);

INSERT INTO NotificationTemplates (TemplateCode, Subject, Body)
VALUES
('ACCOUNT_VERIFICATION','Verify your account','Please verify your library account.'),
('PASSWORD_RESET','Reset your password','Please reset your library account password.'),
('RESERVATION_READY','Book reservation ready','Your reserved book is ready.'),
('DUE_OR_FINE_NOTICE','Library due date or fine notice','Please review your borrowing or fine notice.');

INSERT INTO AuditLogs (UserId, Action, TargetType, TargetId, Metadata)
VALUES
(1,'Init DB','Database',NULL,'{"seed":"phase1-demo"}'),
(2,'Add demo books','Books',NULL,'{"count":4}'),
(3,'Borrow demo book','BorrowDetails',1,'{"copyId":2}');
GO
