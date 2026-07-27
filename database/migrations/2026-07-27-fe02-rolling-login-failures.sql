IF OBJECT_ID('dbo.LoginFailureAttempts', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.LoginFailureAttempts (
        AttemptId BIGINT IDENTITY PRIMARY KEY,
        UserId INT NOT NULL,
        AttemptedAt DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_LoginFailureAttempts_Users
            FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId)
    );

    CREATE INDEX IX_LoginFailureAttempts_User_AttemptedAt
        ON dbo.LoginFailureAttempts(UserId, AttemptedAt);
END;
