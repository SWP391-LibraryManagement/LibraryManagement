SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.Books', N'U') IS NULL
        THROW 51050, 'Books table is required before the FE05 migration.', 1;

    IF EXISTS (SELECT 1 FROM dbo.Books WHERE LEN(ISBN) > 20)
        THROW 51051, 'Books.ISBN contains values longer than the approved 20-character contract.', 1;

    IF COL_LENGTH(N'dbo.Books', N'RowVersion') IS NULL
        ALTER TABLE dbo.Books ADD RowVersion ROWVERSION NOT NULL;

    DECLARE @IsbnNeedsAlter BIT = 0;

    IF EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.Books')
          AND name = N'ISBN'
          AND max_length <> 40
    )
        SET @IsbnNeedsAlter = 1;

    IF @IsbnNeedsAlter = 1
    BEGIN
        IF EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE object_id = OBJECT_ID(N'dbo.Books')
              AND name = N'UX_Books_ISBN_NotNull'
        )
            DROP INDEX UX_Books_ISBN_NotNull ON dbo.Books;

        ALTER TABLE dbo.Books ALTER COLUMN ISBN NVARCHAR(20) NULL;
    END;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.Books')
          AND name = N'UX_Books_ISBN_NotNull'
    )
        CREATE UNIQUE INDEX UX_Books_ISBN_NotNull
            ON dbo.Books(ISBN)
            WHERE ISBN IS NOT NULL;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
