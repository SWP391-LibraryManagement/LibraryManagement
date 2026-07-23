SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID('dbo.Notifications', 'U') IS NULL
        THROW 51030, 'Required FE10 Notifications table is missing.', 1;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE name = 'CK_Notifications_Status'
          AND parent_object_id = OBJECT_ID('dbo.Notifications')
          AND definition LIKE '%PROCESSING%'
    )
    BEGIN
        IF EXISTS (
            SELECT 1
            FROM sys.check_constraints
            WHERE name = 'CK_Notifications_Status'
              AND parent_object_id = OBJECT_ID('dbo.Notifications')
        )
            ALTER TABLE dbo.Notifications
                DROP CONSTRAINT CK_Notifications_Status;

        ALTER TABLE dbo.Notifications WITH CHECK
            ADD CONSTRAINT CK_Notifications_Status
            CHECK (Status IN (
                'PENDING',
                'PROCESSING',
                'SENT',
                'DELIVERED',
                'FAILED',
                'SKIPPED',
                'CANCELLED'
            ));
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
