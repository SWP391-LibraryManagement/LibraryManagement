SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.Authors', N'U') IS NULL
       OR OBJECT_ID(N'dbo.Publishers', N'U') IS NULL
       OR OBJECT_ID(N'dbo.Categories', N'U') IS NULL
        THROW 51000, 'Required library metadata tables are missing.', 1;

    IF COL_LENGTH(N'dbo.Authors', N'Status') IS NULL
        ALTER TABLE dbo.Authors ADD Status NVARCHAR(20) NOT NULL
            CONSTRAINT DF_Authors_Status DEFAULT N'ACTIVE' WITH VALUES;
    IF COL_LENGTH(N'dbo.Authors', N'CreatedAt') IS NULL
        ALTER TABLE dbo.Authors ADD CreatedAt DATETIME NOT NULL
            CONSTRAINT DF_Authors_CreatedAt DEFAULT GETDATE() WITH VALUES;

    IF COL_LENGTH(N'dbo.Publishers', N'Status') IS NULL
        ALTER TABLE dbo.Publishers ADD Status NVARCHAR(20) NOT NULL
            CONSTRAINT DF_Publishers_Status DEFAULT N'ACTIVE' WITH VALUES;
    IF COL_LENGTH(N'dbo.Publishers', N'CreatedAt') IS NULL
        ALTER TABLE dbo.Publishers ADD CreatedAt DATETIME NOT NULL
            CONSTRAINT DF_Publishers_CreatedAt DEFAULT GETDATE() WITH VALUES;

    IF COL_LENGTH(N'dbo.Categories', N'Status') IS NULL
        ALTER TABLE dbo.Categories ADD Status NVARCHAR(20) NOT NULL
            CONSTRAINT DF_Categories_Status DEFAULT N'ACTIVE' WITH VALUES;
    IF COL_LENGTH(N'dbo.Categories', N'CreatedAt') IS NULL
        ALTER TABLE dbo.Categories ADD CreatedAt DATETIME NOT NULL
            CONSTRAINT DF_Categories_CreatedAt DEFAULT GETDATE() WITH VALUES;

    IF EXISTS (SELECT 1 FROM dbo.Authors WHERE Status NOT IN (N'ACTIVE', N'INACTIVE'))
       OR EXISTS (SELECT 1 FROM dbo.Publishers WHERE Status NOT IN (N'ACTIVE', N'INACTIVE'))
       OR EXISTS (SELECT 1 FROM dbo.Categories WHERE Status NOT IN (N'ACTIVE', N'INACTIVE'))
        THROW 51001, 'Library metadata contains an unsupported status.', 1;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
