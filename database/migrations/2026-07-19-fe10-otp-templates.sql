SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF EXISTS (
        SELECT 1
        FROM NotificationTemplates
        WHERE TemplateCode = 'ACCOUNT_VERIFICATION'
    )
    BEGIN
        UPDATE NotificationTemplates
        SET Subject = N'Verify your library account',
            Body = N'Verification code: {{otp}}. Expires in {{expiresInMinutes}} minutes.',
            Status = 'ACTIVE',
            UpdatedAt = GETDATE()
        WHERE TemplateCode = 'ACCOUNT_VERIFICATION';
    END
    ELSE
    BEGIN
        INSERT INTO NotificationTemplates (TemplateCode, Subject, Body, Status)
        VALUES (
            'ACCOUNT_VERIFICATION',
            N'Verify your library account',
            N'Verification code: {{otp}}. Expires in {{expiresInMinutes}} minutes.',
            'ACTIVE'
        );
    END;

    IF EXISTS (
        SELECT 1
        FROM NotificationTemplates
        WHERE TemplateCode = 'PASSWORD_RESET'
    )
    BEGIN
        UPDATE NotificationTemplates
        SET Subject = N'Reset your library password',
            Body = N'Password reset code: {{otp}}. Expires in {{expiresInMinutes}} minutes.',
            Status = 'ACTIVE',
            UpdatedAt = GETDATE()
        WHERE TemplateCode = 'PASSWORD_RESET';
    END
    ELSE
    BEGIN
        INSERT INTO NotificationTemplates (TemplateCode, Subject, Body, Status)
        VALUES (
            'PASSWORD_RESET',
            N'Reset your library password',
            N'Password reset code: {{otp}}. Expires in {{expiresInMinutes}} minutes.',
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
