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

// @spec AC-FE02-004 to AC-FE02-008, NFR-FE02-SEC-011, NFR-FE02-UX-001
export function validateLoginFields(values = {}) {
  const errors = {};
  const email = String(values.email || '').trim();
  const password = String(values.password || '');

  if (!email) {
    errors.email = 'Vui lòng nhập email hoặc tên đăng nhập.';
  } else if (email.length > 255) {
    errors.email = 'Email hoặc tên đăng nhập không được vượt quá 255 ký tự.';
  }

  if (!password) {
    errors.password = 'Vui lòng nhập mật khẩu.';
  } else if (password.length > 255) {
    errors.password = 'Mật khẩu không được vượt quá 255 ký tự.';
  }

  return errors;
}

// @spec AC-FE02-005 to AC-FE02-008, BR-FE02-007, NFR-FE02-UX-001
export function getLoginErrorMessage(error) {
  if (!error?.response) {
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.';
  }

  const code = error.response?.data?.error?.code;
  const messages = {
    INVALID_CREDENTIALS: 'Email hoặc tên đăng nhập hoặc mật khẩu không đúng.',
    ACCOUNT_LOCKED: 'Tài khoản đã bị khóa do đăng nhập sai quá nhiều lần. Vui lòng đặt lại mật khẩu hoặc thử lại sau 30 phút.',
    VALIDATION_ERROR: 'Thông tin đăng nhập không hợp lệ. Vui lòng kiểm tra lại.',
    HTTPS_REQUIRED: 'Kết nối không an toàn. Vui lòng tải lại trang bằng HTTPS.',
  };

  return messages[code] || 'Đăng nhập thất bại. Vui lòng thử lại.';
}

export function validatePasswordSetupFields(values = {}) {
  const errors = {};
  const newPassword = String(values.newPassword || '');
  const confirmPassword = String(values.confirmPassword || '');
  const passwordRequirements = getPasswordRequirements(newPassword);

  if (Object.values(passwordRequirements).some((met) => !met)) {
    errors.newPassword = 'Mật khẩu chưa đáp ứng đủ yêu cầu.';
  }
  if (confirmPassword !== newPassword) {
    errors.confirmPassword = 'Xác nhận mật khẩu không khớp.';
  }

  return errors;
}

export function getAccountSetupErrorMessage(error) {
  const code = error?.cause?.response?.data?.error?.code;

  if (code === 'INVALID_RESET_TOKEN' || code === 'EXPIRED_RESET_TOKEN') {
    return 'Liên kết thiết lập mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng liên hệ quản trị viên để được gửi lại.';
  }

  return error?.message || 'Không thể hoàn tất thiết lập tài khoản. Vui lòng thử lại.';
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
