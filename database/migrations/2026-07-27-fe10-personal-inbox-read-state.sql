SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET ARITHABORT ON;
SET NUMERIC_ROUNDABORT OFF;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID('dbo.Notifications', 'U') IS NULL
        THROW 51040, 'Required FE10 Notifications table is missing.', 1;

    IF COL_LENGTH('dbo.Notifications', 'ReadAt') IS NULL
    BEGIN
        ALTER TABLE dbo.Notifications ADD ReadAt DATETIME2 NULL;

        EXEC sys.sp_executesql N'
            UPDATE dbo.Notifications
            SET ReadAt = CAST(CreatedAt AS DATETIME2)
            WHERE UserId IS NOT NULL
              AND (
                (NotificationType = ''GENERAL_SYSTEM'' AND TemplateKey = ''MEMBERSHIP_RESULT'')
                OR (NotificationType = ''RESERVATION_AVAILABLE'' AND TemplateKey = ''RESERVATION_READY'')
                OR (NotificationType = ''DUE_DATE_REMINDER'' AND TemplateKey = ''DUE_DATE_REMINDER'')
                OR (NotificationType = ''OVERDUE_NOTICE'' AND TemplateKey = ''OVERDUE_NOTICE'')
                OR (NotificationType = ''FINE_NOTICE'' AND TemplateKey = ''FINE_NOTICE'')
              );';
    END;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE object_id = OBJECT_ID('dbo.Notifications')
          AND name = 'IX_Notifications_User_ReadAt_CreatedAt'
    )
        EXEC sys.sp_executesql N'
            CREATE INDEX IX_Notifications_User_ReadAt_CreatedAt
                ON dbo.Notifications(UserId, ReadAt, CreatedAt DESC)
                INCLUDE (NotificationId, NotificationType, TemplateKey, Title, Body);';

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
