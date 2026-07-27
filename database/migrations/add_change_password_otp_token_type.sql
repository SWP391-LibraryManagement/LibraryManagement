SET XACT_ABORT ON;

BEGIN TRY
  BEGIN TRANSACTION;

  IF OBJECT_ID(N'dbo.AuthTokens', N'U') IS NULL
    THROW 51000, 'AuthTokens table is missing.', 1;

  IF EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID(N'dbo.AuthTokens')
      AND name = N'CK_AuthTokens_TokenType'
  )
    ALTER TABLE dbo.AuthTokens DROP CONSTRAINT CK_AuthTokens_TokenType;

  ALTER TABLE dbo.AuthTokens WITH CHECK
  ADD CONSTRAINT CK_AuthTokens_TokenType
  CHECK (TokenType IN (
    'REFRESH',
    'PASSWORD_RESET',
    'EMAIL_VERIFY',
    'ACCOUNT_SETUP',
    'CHANGE_PASSWORD_OTP'
  ));

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
