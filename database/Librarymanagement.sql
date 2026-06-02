
CREATE DATABASE LibraryManagementDB;
GO

USE LibraryManagementDB;
GO


CREATE TABLE Roles (
    RoleId INT IDENTITY PRIMARY KEY,
    RoleName NVARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE Users (
    UserId INT IDENTITY PRIMARY KEY,
    Username NVARCHAR(50) UNIQUE NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    Phone NVARCHAR(20),
    Status NVARCHAR(20) DEFAULT 'ACTIVE',
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE UserRoles (
    UserId INT,
    RoleId INT,
    PRIMARY KEY (UserId, RoleId),
    FOREIGN KEY (UserId) REFERENCES Users(UserId),
    FOREIGN KEY (RoleId) REFERENCES Roles(RoleId)
);


CREATE TABLE UserProfiles (
    ProfileId INT IDENTITY PRIMARY KEY,
    UserId INT UNIQUE,
    FullName NVARCHAR(100),
    Address NVARCHAR(255),
    DateOfBirth DATE,
    AvatarUrl NVARCHAR(255),
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);


CREATE TABLE MembershipApplications (
    ApplicationId INT IDENTITY PRIMARY KEY,
    UserId INT,
    Status NVARCHAR(20) DEFAULT 'PENDING',
    AppliedAt DATETIME DEFAULT GETDATE(),
    ApprovedAt DATETIME NULL,
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);



CREATE TABLE Categories (
    CategoryId INT IDENTITY PRIMARY KEY,
    CategoryName NVARCHAR(100) NOT NULL
);

CREATE TABLE Authors (
    AuthorId INT IDENTITY PRIMARY KEY,
    AuthorName NVARCHAR(100) NOT NULL
);

CREATE TABLE Publishers (
    PublisherId INT IDENTITY PRIMARY KEY,
    PublisherName NVARCHAR(100) NOT NULL
);

CREATE TABLE Books (
    BookId INT IDENTITY PRIMARY KEY,
    Title NVARCHAR(255) NOT NULL,
    ISBN NVARCHAR(50),
    CategoryId INT,
    AuthorId INT,
    PublisherId INT,
    PublishYear INT,
    Description NVARCHAR(MAX),
    CoverUrl NVARCHAR(255),

    FOREIGN KEY (CategoryId) REFERENCES Categories(CategoryId),
    FOREIGN KEY (AuthorId) REFERENCES Authors(AuthorId),
    FOREIGN KEY (PublisherId) REFERENCES Publishers(PublisherId)
);


CREATE TABLE BookCopies (
    CopyId INT IDENTITY PRIMARY KEY,
    BookId INT NOT NULL,
    Barcode NVARCHAR(100) UNIQUE NOT NULL,
    Status NVARCHAR(20) DEFAULT 'AVAILABLE',
    Location NVARCHAR(100),

    FOREIGN KEY (BookId) REFERENCES Books(BookId)
);


CREATE TABLE BorrowRequests (
    RequestId INT IDENTITY PRIMARY KEY,
    UserId INT NOT NULL,
    RequestDate DATETIME DEFAULT GETDATE(),
    Status NVARCHAR(20) DEFAULT 'PENDING',

    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

CREATE TABLE BorrowDetails (
    BorrowDetailId INT IDENTITY PRIMARY KEY,
    RequestId INT NOT NULL,
    CopyId INT NOT NULL,
    DueDate DATE,
    ReturnDate DATE NULL,
    Status NVARCHAR(20) DEFAULT 'BORROWED',

    FOREIGN KEY (RequestId) REFERENCES BorrowRequests(RequestId),
    FOREIGN KEY (CopyId) REFERENCES BookCopies(CopyId)
);


CREATE TABLE Reservations (
    ReservationId INT IDENTITY PRIMARY KEY,
    UserId INT NOT NULL,
    CopyId INT NOT NULL,
    ReservedAt DATETIME DEFAULT GETDATE(),
    Status NVARCHAR(20) DEFAULT 'ACTIVE',

    FOREIGN KEY (UserId) REFERENCES Users(UserId),
    FOREIGN KEY (CopyId) REFERENCES BookCopies(CopyId)
);


CREATE TABLE Fines (
    FineId INT IDENTITY PRIMARY KEY,
    UserId INT NOT NULL,
    BorrowDetailId INT NOT NULL,
    Amount DECIMAL(10,2),
    Reason NVARCHAR(255),
    Status NVARCHAR(20) DEFAULT 'UNPAID',
    PaidAt DATETIME NULL,

    FOREIGN KEY (UserId) REFERENCES Users(UserId),
    FOREIGN KEY (BorrowDetailId) REFERENCES BorrowDetails(BorrowDetailId)
);


CREATE TABLE AuditLogs (
    LogId INT IDENTITY PRIMARY KEY,
    UserId INT,
    Action NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);
GO


/* =========================
   ROLES
   ========================= */
INSERT INTO Roles (RoleName) VALUES
('ADMIN'), ('LIBRARIAN'), ('MEMBER'), ('GUEST');


/* =========================
   USERS
   ========================= */
INSERT INTO Users (Username, Email, PasswordHash, Phone, Status)
VALUES
('admin', 'admin@lib.com', '123', '0900000001', 'ACTIVE'),
('librarian', 'lib@lib.com', '123', '0900000002', 'ACTIVE'),
('member', 'member@lib.com', '123', '0900000003', 'ACTIVE'),
('guest', 'guest@lib.com', '123', '0900000004', 'ACTIVE');


/* =========================
   USER ROLES
   ========================= */
INSERT INTO UserRoles VALUES
(1,1),(2,2),(3,3),(4,4);


/* =========================
   PROFILES
   ========================= */
INSERT INTO UserProfiles (UserId, FullName, Address, DateOfBirth)
VALUES
(1,'Admin User','Hanoi','2000-01-01'),
(2,'Librarian User','Hanoi','2000-02-02'),
(3,'Member A','Hanoi','2001-03-03'),
(4,'Guest User','Hanoi','2002-04-04');


/* =========================
   CATEGORY - AUTHOR - PUBLISHER
   ========================= */
INSERT INTO Categories VALUES
('Programming'),('Database'),('AI'),('Novel');

INSERT INTO Authors VALUES
('Robert Martin'),('Andrew Tanenbaum'),('Yuval Harari'),('J.K. Rowling');

INSERT INTO Publishers VALUES
('OReilly'),('Pearson'),('Penguin');


/* =========================
   BOOKS
   ========================= */
INSERT INTO Books (Title, ISBN, CategoryId, AuthorId, PublisherId, PublishYear, Description)
VALUES
('Clean Code','B1',1,1,1,2008,'Coding rules'),
('Database System','B2',2,2,2,2015,'DB theory'),
('Sapiens','B3',4,3,3,2011,'History book'),
('Harry Potter','B4',4,4,3,2001,'Magic story');


/* =========================
   BOOK COPIES
   ========================= */
INSERT INTO BookCopies (BookId, Barcode, Status, Location)
VALUES
(1,'BC1','AVAILABLE','A1'),
(1,'BC2','BORROWED','A1'),
(2,'BC3','AVAILABLE','A2'),
(3,'BC4','AVAILABLE','B1'),
(4,'BC5','RESERVED','B2');


/* =========================
   BORROW
   ========================= */
INSERT INTO BorrowRequests (UserId, Status)
VALUES
(3,'APPROVED');

INSERT INTO BorrowDetails (RequestId, CopyId, DueDate, Status)
VALUES
(1,2,'2026-06-10','BORROWED');


/* =========================
   RESERVATION
   ========================= */
INSERT INTO Reservations (UserId, CopyId, Status)
VALUES
(3,5,'ACTIVE');


/* =========================
   FINE
   ========================= */
INSERT INTO Fines (UserId, BorrowDetailId, Amount, Reason, Status)
VALUES
(3,1,10000,'Late return','UNPAID');


/* =========================
   AUDIT LOG
   ========================= */
INSERT INTO AuditLogs (UserId, Action)
VALUES
(1,'Init DB'),
(2,'Add books'),
(3,'Borrow book');