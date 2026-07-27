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
        SET Subject = N'Mã xác thực tài khoản - Hệ thống Thư viện',
            Body = N'Xin chào,

Mã xác thực tài khoản của bạn:

{{otp}}

Mã có hiệu lực trong {{expiresInMinutes}} phút.
Không chia sẻ mã này với bất kỳ ai.
Nếu bạn không đăng ký tài khoản, hãy bỏ qua email này.

Hệ thống Quản lý Thư viện',
            Status = 'ACTIVE',
            UpdatedAt = GETDATE()
        WHERE TemplateCode = 'ACCOUNT_VERIFICATION';
    END
    ELSE
    BEGIN
        INSERT INTO NotificationTemplates (TemplateCode, Subject, Body, Status)
        VALUES (
            'ACCOUNT_VERIFICATION',
            N'Mã xác thực tài khoản - Hệ thống Thư viện',
            N'Xin chào,

Mã xác thực tài khoản của bạn:

{{otp}}

Mã có hiệu lực trong {{expiresInMinutes}} phút.
Không chia sẻ mã này với bất kỳ ai.
Nếu bạn không đăng ký tài khoản, hãy bỏ qua email này.

Hệ thống Quản lý Thư viện',
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
