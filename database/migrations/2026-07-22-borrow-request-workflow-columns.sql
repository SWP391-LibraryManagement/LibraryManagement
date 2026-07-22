SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.BorrowRequests', N'U') IS NULL
        THROW 51010, 'Required BorrowRequests table is missing.', 1;

    IF COL_LENGTH(N'dbo.BorrowRequests', N'ApprovedAt') IS NULL
        ALTER TABLE dbo.BorrowRequests ADD ApprovedAt DATETIME NULL;

    IF COL_LENGTH(N'dbo.BorrowRequests', N'RejectedAt') IS NULL
        ALTER TABLE dbo.BorrowRequests ADD RejectedAt DATETIME NULL;

    IF COL_LENGTH(N'dbo.BorrowRequests', N'ProcessedAt') IS NULL
        ALTER TABLE dbo.BorrowRequests ADD ProcessedAt DATETIME NULL;

    IF COL_LENGTH(N'dbo.BorrowRequests', N'UpdatedAt') IS NULL
        ALTER TABLE dbo.BorrowRequests ADD UpdatedAt DATETIME NULL;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
