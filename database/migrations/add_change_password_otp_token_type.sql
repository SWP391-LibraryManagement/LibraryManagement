-- Migration: Thêm CHANGE_PASSWORD_OTP vào CK_AuthTokens_TokenType
-- Chạy script này trên SQL Server để cập nhật constraint

-- Bước 1: Xóa constraint cũ
ALTER TABLE dbo.AuthTokens
DROP CONSTRAINT CK_AuthTokens_TokenType;

-- Bước 2: Tạo lại constraint với giá trị mới
ALTER TABLE dbo.AuthTokens
ADD CONSTRAINT CK_AuthTokens_TokenType
CHECK (TokenType IN (
  'REFRESH',
  'PASSWORD_RESET',
  'EMAIL_VERIFY',
  'ACCOUNT_SETUP',
  'CHANGE_PASSWORD_OTP'
));
