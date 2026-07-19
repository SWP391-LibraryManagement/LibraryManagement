SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.MembershipApplications', N'U') IS NULL
        THROW 51040, 'MembershipApplications table is required before the FE04 migration.', 1;

    IF EXISTS (
        SELECT UserId
        FROM dbo.MembershipApplications
        WHERE Status = 'PENDING'
        GROUP BY UserId
        HAVING COUNT_BIG(*) > 1
    )
        THROW 51041, 'Duplicate pending membership applications must be resolved before migration.', 1;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.MembershipApplications')
          AND name = N'UX_MembershipApplications_User_Pending'
    )
    BEGIN
        CREATE UNIQUE INDEX UX_MembershipApplications_User_Pending
        ON dbo.MembershipApplications(UserId)
        WHERE Status = 'PENDING';
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
