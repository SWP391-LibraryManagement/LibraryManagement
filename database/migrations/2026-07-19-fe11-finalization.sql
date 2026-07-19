SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID('dbo.Users', 'U') IS NULL
       OR OBJECT_ID('dbo.UserProfiles', 'U') IS NULL
       OR OBJECT_ID('dbo.Notifications', 'U') IS NULL
        THROW 51000, 'Required FE11 tables are missing.', 1;

    IF COL_LENGTH('dbo.Users', 'Email') IS NULL
       OR COL_LENGTH('dbo.Notifications', 'RecipientEmail') IS NULL
        THROW 51001, 'Required FE11 email columns are missing.', 1;

    IF EXISTS (
        SELECT LOWER(LTRIM(RTRIM(Email)))
        FROM dbo.Users
        GROUP BY LOWER(LTRIM(RTRIM(Email)))
        HAVING COUNT(*) > 1
    )
        THROW 51002, 'Users.Email contains case-insensitive duplicates.', 1;

    IF EXISTS (SELECT 1 FROM dbo.Users WHERE LEN(Email) > 255)
        THROW 51003, 'Users.Email contains a value longer than 255 characters.', 1;

    IF EXISTS (SELECT 1 FROM dbo.Notifications WHERE LEN(RecipientEmail) > 255)
        THROW 51004, 'Notifications.RecipientEmail contains a value longer than 255 characters.', 1;

    DECLARE @EmailIndexCount INT = 0;
    DECLARE @EmailIndexName SYSNAME;
    DECLARE @EmailIndexIsConstraint BIT;
    DECLARE @EmailIndexKeyCount INT;
    DECLARE @EmailMaxLength SMALLINT;
    DECLARE @EmailTypeName SYSNAME;
    DECLARE @EmailIsNullable BIT;
    DECLARE @DropEmailIndexSql NVARCHAR(MAX);

    SELECT
        @EmailMaxLength = c.max_length,
        @EmailTypeName = t.name,
        @EmailIsNullable = c.is_nullable
    FROM sys.columns c
    INNER JOIN sys.types t ON t.user_type_id = c.user_type_id
    WHERE c.object_id = OBJECT_ID('dbo.Users')
      AND c.name = 'Email';

    SELECT @EmailIndexCount = COUNT(DISTINCT i.index_id)
    FROM sys.indexes i
    INNER JOIN sys.index_columns ic
        ON ic.object_id = i.object_id
       AND ic.index_id = i.index_id
    INNER JOIN sys.columns c
        ON c.object_id = ic.object_id
       AND c.column_id = ic.column_id
    WHERE i.object_id = OBJECT_ID('dbo.Users')
      AND c.name = 'Email';

    IF @EmailIndexCount > 1
        THROW 51005, 'Users.Email has unsupported multiple dependent indexes.', 1;

    SELECT TOP (1)
        @EmailIndexName = i.name,
        @EmailIndexIsConstraint = i.is_unique_constraint,
        @EmailIndexKeyCount = (
            SELECT COUNT(*)
            FROM sys.index_columns keys
            WHERE keys.object_id = i.object_id
              AND keys.index_id = i.index_id
              AND keys.key_ordinal > 0
        )
    FROM sys.indexes i
    INNER JOIN sys.index_columns ic
        ON ic.object_id = i.object_id
       AND ic.index_id = i.index_id
    INNER JOIN sys.columns c
        ON c.object_id = ic.object_id
       AND c.column_id = ic.column_id
    WHERE i.object_id = OBJECT_ID('dbo.Users')
      AND c.name = 'Email';

    IF @EmailIndexName IS NOT NULL AND (
        NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE object_id = OBJECT_ID('dbo.Users')
              AND name = @EmailIndexName
              AND is_unique = 1
        )
        OR @EmailIndexKeyCount <> 1
    )
        THROW 51006, 'Users.Email has an unsupported dependent index.', 1;

    IF @EmailTypeName <> 'nvarchar'
       OR @EmailMaxLength <> 510
       OR @EmailIsNullable <> 0
       OR ISNULL(@EmailIndexName, '') <> 'UX_Users_Email'
    BEGIN
        IF @EmailIndexName IS NOT NULL
        BEGIN
            IF @EmailIndexIsConstraint = 1
                SET @DropEmailIndexSql = N'ALTER TABLE dbo.Users DROP CONSTRAINT '
                    + QUOTENAME(@EmailIndexName);
            ELSE
                SET @DropEmailIndexSql = N'DROP INDEX '
                    + QUOTENAME(@EmailIndexName)
                    + N' ON dbo.Users';

            EXEC sys.sp_executesql @DropEmailIndexSql;
        END;

        IF @EmailTypeName <> 'nvarchar'
           OR @EmailMaxLength <> 510
           OR @EmailIsNullable <> 0
            ALTER TABLE dbo.Users ALTER COLUMN Email NVARCHAR(255) NOT NULL;
    END;

    IF COL_LENGTH('dbo.Users', 'DeactivatedAt') IS NULL
        ALTER TABLE dbo.Users ADD DeactivatedAt DATETIME NULL;
    ELSE IF EXISTS (
        SELECT 1
        FROM sys.columns c
        INNER JOIN sys.types t ON t.user_type_id = c.user_type_id
        WHERE c.object_id = OBJECT_ID('dbo.Users')
          AND c.name = 'DeactivatedAt'
          AND (t.name <> 'datetime' OR c.is_nullable = 0)
    )
        ALTER TABLE dbo.Users ALTER COLUMN DeactivatedAt DATETIME NULL;

    IF COL_LENGTH('dbo.UserProfiles', 'Department') IS NULL
        ALTER TABLE dbo.UserProfiles ADD Department NVARCHAR(100) NULL;
    ELSE IF EXISTS (
        SELECT 1
        FROM sys.columns c
        INNER JOIN sys.types t ON t.user_type_id = c.user_type_id
        WHERE c.object_id = OBJECT_ID('dbo.UserProfiles')
          AND c.name = 'Department'
          AND (t.name <> 'nvarchar' OR c.max_length <> 200 OR c.is_nullable = 0)
    )
        ALTER TABLE dbo.UserProfiles ALTER COLUMN Department NVARCHAR(100) NULL;

    IF COL_LENGTH('dbo.UserProfiles', 'Specialization') IS NULL
        ALTER TABLE dbo.UserProfiles ADD Specialization NVARCHAR(100) NULL;
    ELSE IF EXISTS (
        SELECT 1
        FROM sys.columns c
        INNER JOIN sys.types t ON t.user_type_id = c.user_type_id
        WHERE c.object_id = OBJECT_ID('dbo.UserProfiles')
          AND c.name = 'Specialization'
          AND (t.name <> 'nvarchar' OR c.max_length <> 200 OR c.is_nullable = 0)
    )
        ALTER TABLE dbo.UserProfiles ALTER COLUMN Specialization NVARCHAR(100) NULL;

    IF EXISTS (
        SELECT 1
        FROM sys.columns c
        INNER JOIN sys.types t ON t.user_type_id = c.user_type_id
        WHERE c.object_id = OBJECT_ID('dbo.Notifications')
          AND c.name = 'RecipientEmail'
          AND (t.name <> 'nvarchar' OR c.max_length <> 510 OR c.is_nullable = 1)
    )
        ALTER TABLE dbo.Notifications ALTER COLUMN RecipientEmail NVARCHAR(255) NOT NULL;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE object_id = OBJECT_ID('dbo.Users')
          AND name = 'UX_Users_Email'
    )
        CREATE UNIQUE INDEX UX_Users_Email ON dbo.Users(Email);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
