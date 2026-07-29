SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF EXISTS (
        SELECT 1
        FROM dbo.NotificationTemplates
        WHERE TemplateCode = 'BORROW_REQUEST_APPROVED'
    )
    BEGIN
        UPDATE dbo.NotificationTemplates
        SET Subject = N'Yêu cầu mượn đã được duyệt',
            Body = N'Yêu cầu mượn #{{requestId}} đã được duyệt. Hạn trả: {{dueDate}}.',
            Status = 'ACTIVE'
        WHERE TemplateCode = 'BORROW_REQUEST_APPROVED';
    END
    ELSE
    BEGIN
        INSERT INTO dbo.NotificationTemplates (TemplateCode, Subject, Body, Status)
        VALUES (
            'BORROW_REQUEST_APPROVED',
            N'Yêu cầu mượn đã được duyệt',
            N'Yêu cầu mượn #{{requestId}} đã được duyệt. Hạn trả: {{dueDate}}.',
            'ACTIVE'
        );
    END;

    IF EXISTS (
        SELECT 1
        FROM dbo.NotificationTemplates
        WHERE TemplateCode = 'BORROW_REQUEST_REJECTED'
    )
    BEGIN
        UPDATE dbo.NotificationTemplates
        SET Subject = N'Yêu cầu mượn đã bị từ chối',
            Body = N'Yêu cầu mượn #{{requestId}} đã bị từ chối.',
            Status = 'ACTIVE'
        WHERE TemplateCode = 'BORROW_REQUEST_REJECTED';
    END
    ELSE
    BEGIN
        INSERT INTO dbo.NotificationTemplates (TemplateCode, Subject, Body, Status)
        VALUES (
            'BORROW_REQUEST_REJECTED',
            N'Yêu cầu mượn đã bị từ chối',
            N'Yêu cầu mượn #{{requestId}} đã bị từ chối.',
            'ACTIVE'
        );
    END;

    IF EXISTS (
        SELECT 1
        FROM dbo.NotificationTemplates
        WHERE TemplateCode = 'BORROW_RENEWED'
    )
    BEGIN
        UPDATE dbo.NotificationTemplates
        SET Subject = N'Khoản mượn đã được gia hạn',
            Body = N'Khoản mượn #{{borrowDetailId}} đã được gia hạn đến {{dueDate}}.',
            Status = 'ACTIVE'
        WHERE TemplateCode = 'BORROW_RENEWED';
    END
    ELSE
    BEGIN
        INSERT INTO dbo.NotificationTemplates (TemplateCode, Subject, Body, Status)
        VALUES (
            'BORROW_RENEWED',
            N'Khoản mượn đã được gia hạn',
            N'Khoản mượn #{{borrowDetailId}} đã được gia hạn đến {{dueDate}}.',
            'ACTIVE'
        );
    END;

    IF EXISTS (
        SELECT 1
        FROM dbo.NotificationTemplates
        WHERE TemplateCode = 'BORROW_RETURNED'
    )
    BEGIN
        UPDATE dbo.NotificationTemplates
        SET Subject = N'Đã ghi nhận trả sách',
            Body = N'Khoản mượn #{{borrowDetailId}} đã được ghi nhận trả với trạng thái {{returnStatus}}.',
            Status = 'ACTIVE'
        WHERE TemplateCode = 'BORROW_RETURNED';
    END
    ELSE
    BEGIN
        INSERT INTO dbo.NotificationTemplates (TemplateCode, Subject, Body, Status)
        VALUES (
            'BORROW_RETURNED',
            N'Đã ghi nhận trả sách',
            N'Khoản mượn #{{borrowDetailId}} đã được ghi nhận trả với trạng thái {{returnStatus}}.',
            'ACTIVE'
        );
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
