SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID('dbo.Notifications', 'U') IS NULL
       OR OBJECT_ID('dbo.NotificationAttempts', 'U') IS NULL
        THROW 51020, 'Required FE10 notification tables are missing.', 1;

    IF COL_LENGTH('dbo.Notifications', 'NotificationType') IS NULL
        ALTER TABLE dbo.Notifications ADD NotificationType NVARCHAR(50) NULL;

    IF COL_LENGTH('dbo.Notifications', 'TemplateKey') IS NULL
        ALTER TABLE dbo.Notifications ADD TemplateKey NVARCHAR(100) NULL;

    IF COL_LENGTH('dbo.Notifications', 'Title') IS NULL
        ALTER TABLE dbo.Notifications ADD Title NVARCHAR(255) NULL;

    IF COL_LENGTH('dbo.Notifications', 'Body') IS NULL
        ALTER TABLE dbo.Notifications ADD Body NVARCHAR(MAX) NULL;

    IF COL_LENGTH('dbo.Notifications', 'IdempotencyKey') IS NULL
        ALTER TABLE dbo.Notifications ADD IdempotencyKey NVARCHAR(100) NULL;

    IF COL_LENGTH('dbo.Notifications', 'AttemptCount') IS NULL
        ALTER TABLE dbo.Notifications
            ADD AttemptCount INT NOT NULL
                CONSTRAINT DF_Notifications_AttemptCount DEFAULT (0) WITH VALUES;

    IF COL_LENGTH('dbo.Notifications', 'LastErrorMessage') IS NULL
        ALTER TABLE dbo.Notifications ADD LastErrorMessage NVARCHAR(500) NULL;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE parent_object_id = OBJECT_ID('dbo.Notifications')
          AND name = 'CK_Notifications_Type'
    )
        EXEC sys.sp_executesql N'
            ALTER TABLE dbo.Notifications WITH CHECK
                ADD CONSTRAINT CK_Notifications_Type CHECK (
                    NotificationType IS NULL OR NotificationType IN (
                        ''ACCOUNT_VERIFICATION'',
                        ''PASSWORD_RESET'',
                        ''ACCOUNT_SETUP'',
                        ''RESERVATION_AVAILABLE'',
                        ''DUE_DATE_REMINDER'',
                        ''OVERDUE_NOTICE'',
                        ''FINE_NOTICE'',
                        ''GENERAL_SYSTEM''
                    )
                );';

    EXEC sys.sp_executesql N'
        IF EXISTS (
            SELECT IdempotencyKey
            FROM dbo.Notifications
            WHERE IdempotencyKey IS NOT NULL
            GROUP BY IdempotencyKey
            HAVING COUNT(*) > 1
        )
            THROW 51021, ''Notifications contains duplicate idempotency keys.'', 1;';

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE object_id = OBJECT_ID('dbo.Notifications')
          AND name = 'UX_Notifications_IdempotencyKey_NotNull'
    )
        EXEC sys.sp_executesql N'
            CREATE UNIQUE INDEX UX_Notifications_IdempotencyKey_NotNull
                ON dbo.Notifications(IdempotencyKey)
                WHERE IdempotencyKey IS NOT NULL;';

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
