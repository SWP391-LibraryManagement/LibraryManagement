SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @ExpectedTemplates TABLE (
        TemplateCode NVARCHAR(100) PRIMARY KEY,
        Subject NVARCHAR(255) NOT NULL,
        Body NVARCHAR(MAX) NOT NULL,
        BadSubject NVARCHAR(255) NOT NULL
    );

    INSERT INTO @ExpectedTemplates (TemplateCode, Subject, Body, BadSubject)
    VALUES
        (
            N'BORROW_REQUEST_APPROVED',
            N'Yêu cầu mượn đã được duyệt',
            N'Yêu cầu mượn #{{requestId}} đã được duyệt. Hạn trả: {{dueDate}}.',
            N'YÃªu cáº§u mÆ°á»£n Ä‘Ã£ Ä‘Æ°á»£c duyá»‡t'
        ),
        (
            N'BORROW_REQUEST_REJECTED',
            N'Yêu cầu mượn đã bị từ chối',
            N'Yêu cầu mượn #{{requestId}} đã bị từ chối.',
            N'YÃªu cáº§u mÆ°á»£n Ä‘Ã£ bá»‹ tá»« chá»‘i'
        ),
        (
            N'BORROW_RENEWED',
            N'Khoản mượn đã được gia hạn',
            N'Khoản mượn #{{borrowDetailId}} đã được gia hạn đến {{dueDate}}.',
            N'Khoáº£n mÆ°á»£n Ä‘Ã£ Ä‘Æ°á»£c gia háº¡n'
        ),
        (
            N'BORROW_RETURNED',
            N'Đã ghi nhận trả sách',
            N'Khoản mượn #{{borrowDetailId}} đã được ghi nhận trả với trạng thái {{returnStatus}}.',
            N'ÄÃ£ ghi nháº­n tráº£ sÃ¡ch'
        );

    UPDATE nt
    SET Subject = expected.Subject,
        Body = expected.Body,
        Status = N'ACTIVE',
        UpdatedAt = GETDATE()
    FROM dbo.NotificationTemplates AS nt
    INNER JOIN @ExpectedTemplates AS expected
        ON expected.TemplateCode = nt.TemplateCode
    WHERE nt.Subject COLLATE Latin1_General_100_BIN2
              <> expected.Subject COLLATE Latin1_General_100_BIN2
       OR nt.Body COLLATE Latin1_General_100_BIN2
              <> expected.Body COLLATE Latin1_General_100_BIN2
       OR nt.Status <> N'ACTIVE';

    INSERT INTO dbo.NotificationTemplates (TemplateCode, Subject, Body, Status)
    SELECT expected.TemplateCode, expected.Subject, expected.Body, N'ACTIVE'
    FROM @ExpectedTemplates AS expected
    WHERE NOT EXISTS (
        SELECT 1
        FROM dbo.NotificationTemplates AS nt
        WHERE nt.TemplateCode = expected.TemplateCode
    );

    UPDATE n
    SET Title = CASE
            WHEN n.Title COLLATE Latin1_General_100_BIN2
                 = expected.BadSubject COLLATE Latin1_General_100_BIN2
            THEN expected.Subject
            ELSE n.Title
        END,
        Body = CASE n.TemplateKey
            WHEN N'BORROW_REQUEST_APPROVED' THEN
                REPLACE(
                    REPLACE(
                        n.Body,
                        N'YÃªu cáº§u mÆ°á»£n #',
                        N'Yêu cầu mượn #'
                    ),
                    N' Ä‘Ã£ Ä‘Æ°á»£c duyá»‡t. Háº¡n tráº£: ',
                    N' đã được duyệt. Hạn trả: '
                )
            WHEN N'BORROW_REQUEST_REJECTED' THEN
                REPLACE(
                    REPLACE(
                        n.Body,
                        N'YÃªu cáº§u mÆ°á»£n #',
                        N'Yêu cầu mượn #'
                    ),
                    N' Ä‘Ã£ bá»‹ tá»« chá»‘i.',
                    N' đã bị từ chối.'
                )
            WHEN N'BORROW_RENEWED' THEN
                REPLACE(
                    REPLACE(
                        n.Body,
                        N'Khoáº£n mÆ°á»£n #',
                        N'Khoản mượn #'
                    ),
                    N' Ä‘Ã£ Ä‘Æ°á»£c gia háº¡n Ä‘áº¿n ',
                    N' đã được gia hạn đến '
                )
            WHEN N'BORROW_RETURNED' THEN
                REPLACE(
                    REPLACE(
                        n.Body,
                        N'Khoáº£n mÆ°á»£n #',
                        N'Khoản mượn #'
                    ),
                    N' Ä‘Ã£ Ä‘Æ°á»£c ghi nháº­n tráº£ vá»›i tráº¡ng thÃ¡i ',
                    N' đã được ghi nhận trả với trạng thái '
                )
            ELSE n.Body
        END
    FROM dbo.Notifications AS n
    INNER JOIN @ExpectedTemplates AS expected
        ON expected.TemplateCode = n.TemplateKey
    WHERE n.SourceFeature = 'FE07'
      AND n.TemplateKey IN (
          N'BORROW_REQUEST_APPROVED',
          N'BORROW_REQUEST_REJECTED',
          N'BORROW_RENEWED',
          N'BORROW_RETURNED'
      )
      AND (
          n.Title COLLATE Latin1_General_100_BIN2
              = expected.BadSubject COLLATE Latin1_General_100_BIN2
          OR CHARINDEX(N'YÃªu cáº§u mÆ°á»£n #', n.Body) > 0
          OR CHARINDEX(N'Khoáº£n mÆ°á»£n #', n.Body) > 0
          OR CHARINDEX(N'Ä‘Ã£', n.Body) > 0
          OR CHARINDEX(N'Háº¡n tráº£', n.Body) > 0
      );

    IF EXISTS (
        SELECT 1
        FROM @ExpectedTemplates AS expected
        LEFT JOIN dbo.NotificationTemplates AS nt
            ON nt.TemplateCode = expected.TemplateCode
        WHERE nt.TemplateId IS NULL
           OR nt.Subject COLLATE Latin1_General_100_BIN2
                <> expected.Subject COLLATE Latin1_General_100_BIN2
           OR nt.Body COLLATE Latin1_General_100_BIN2
                <> expected.Body COLLATE Latin1_General_100_BIN2
           OR nt.Status <> N'ACTIVE'
    )
        THROW 51031, 'FE10 Unicode template verification failed.', 1;

    IF EXISTS (
        SELECT 1
        FROM dbo.Notifications AS n
        WHERE n.SourceFeature = 'FE07'
          AND n.TemplateKey IN (
              N'BORROW_REQUEST_APPROVED',
              N'BORROW_REQUEST_REJECTED',
              N'BORROW_RENEWED',
              N'BORROW_RETURNED'
          )
          AND (
              CHARINDEX(N'YÃªu cáº§u mÆ°á»£n', COALESCE(n.Title, N'')) > 0
              OR CHARINDEX(N'Khoáº£n mÆ°á»£n', COALESCE(n.Title, N'')) > 0
              OR CHARINDEX(N'ÄÃ£ ghi nháº­n', COALESCE(n.Title, N'')) > 0
              OR CHARINDEX(N'YÃªu cáº§u mÆ°á»£n #', COALESCE(n.Body, N'')) > 0
              OR CHARINDEX(N'Khoáº£n mÆ°á»£n #', COALESCE(n.Body, N'')) > 0
              OR CHARINDEX(N'Ä‘Ã£', COALESCE(n.Body, N'')) > 0
              OR CHARINDEX(N'Háº¡n tráº£', COALESCE(n.Body, N'')) > 0
          )
    )
        THROW 51032, 'FE10 Unicode notification verification failed.', 1;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
