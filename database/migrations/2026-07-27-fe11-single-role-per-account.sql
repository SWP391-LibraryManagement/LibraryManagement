SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF EXISTS (
        SELECT UserId
        FROM UserRoles WITH (UPDLOCK, HOLDLOCK)
        GROUP BY UserId
        HAVING COUNT(*) > 1
    )
    BEGIN
        THROW 51001, 'Cannot enforce one role per account while duplicate UserRoles mappings exist.', 1;
    END;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.UserRoles')
          AND name = N'UX_UserRoles_UserId'
    )
    BEGIN
        CREATE UNIQUE INDEX UX_UserRoles_UserId ON dbo.UserRoles(UserId);
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
