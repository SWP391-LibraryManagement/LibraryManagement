SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.Books', N'U') IS NULL
        THROW 51050, 'Books table is required before the FE05 migration.', 1;

    IF EXISTS (SELECT 1 FROM dbo.Books WHERE LEN(ISBN) > 20)
        THROW 51051, 'Books.ISBN contains values longer than the approved 20-character contract.', 1;

    IF COL_LENGTH(N'dbo.Books', N'RowVersion') IS NULL
        ALTER TABLE dbo.Books ADD RowVersion ROWVERSION NOT NULL;

    IF EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.Books')
          AND name = N'ISBN'
          AND max_length <> 40
    )
        ALTER TABLE dbo.Books ALTER COLUMN ISBN NVARCHAR(20) NULL;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
