export const RESEND_COOLDOWN_SECONDS = 60;

export function maskEmail(email) {
  const [localPart = '', domain = ''] = String(email || '').trim().split('@');
  if (!localPart) return domain ? `***@${domain}` : '***';

  const maskedLocal = localPart.length === 1
    ? `${localPart}***`
    : `${localPart.charAt(0)}***${localPart.charAt(localPart.length - 1)}`;
  return domain ? `${maskedLocal}@${domain}` : maskedLocal;
}

export function getPasswordRequirements(password) {
  const value = String(password || '');
  return {
    minLength: value.length >= 8,
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    number: /\d/.test(value),
    special: /[^A-Za-z0-9]/.test(value),
  };
}

export function normalizeOtp(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 6);
}

export function validateRegistrationFields(values = {}) {
  const errors = {};
  const fullName = String(values.fullName || '').trim();
  const username = String(values.username || '').trim();
  const email = String(values.email || '').trim();
  const password = String(values.password || '');
  const confirmPassword = String(values.confirmPassword || '');
  const passwordRequirements = getPasswordRequirements(password);

  if (!fullName) errors.fullName = 'Vui lòng nhập họ và tên.';
  if (username.length < 3 || username.length > 50) {
    errors.username = 'Tên đăng nhập phải có từ 3 đến 50 ký tự.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Vui lòng nhập địa chỉ email hợp lệ.';
  }
  if (Object.values(passwordRequirements).some((met) => !met)) {
    errors.password = 'Mật khẩu chưa đáp ứng đủ yêu cầu.';
  }
  if (confirmPassword !== password) {
    errors.confirmPassword = 'Xác nhận mật khẩu không khớp.';
  }

  return errors;
}
