SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF EXISTS (
        SELECT 1
        FROM NotificationTemplates
        WHERE TemplateCode = 'ACCOUNT_SETUP'
    )
    BEGIN
        UPDATE NotificationTemplates
        SET Subject = N'Set up your library account',
            Body = N'Complete your library account setup: {{setupLink}}. This link expires in {{expiresInHours}} hours.',
            Status = 'ACTIVE',
            UpdatedAt = GETDATE()
        WHERE TemplateCode = 'ACCOUNT_SETUP';
    END
    ELSE
    BEGIN
        INSERT INTO NotificationTemplates (TemplateCode, Subject, Body, Status)
        VALUES (
            'ACCOUNT_SETUP',
            N'Set up your library account',
            N'Complete your library account setup: {{setupLink}}. This link expires in {{expiresInHours}} hours.',
            'ACTIVE'
        );
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
