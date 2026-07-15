import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

function getErrorMessage(error, fallback = 'Yêu cầu thất bại. Vui lòng thử lại.') {
  if (!error.response) {
    return 'Không kết nối được backend. Hãy kiểm tra server API đang chạy ở http://localhost:3000.';
  }

  const apiError = error.response?.data?.error;
  const details = Array.isArray(apiError?.details)
    ? apiError.details.map((item) => item.message).filter(Boolean)
    : [];

  if (details.length > 0) {
    return details.join('\n');
  }

  return apiError?.message || fallback;
}

export async function registerAccount(payload) {
  try {
    const response = await api.post('/auth/register', payload);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.'), {
      cause: error,
    });
  }
}

export async function verifyEmail(email, otp) {
  try {
    const response = await api.post('/auth/verify-email', { email, otp });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Xác thực email thất bại. Vui lòng kiểm tra lại mã OTP.'), {
      cause: error,
    });
  }
}

export async function loginAccount({ email, password }) {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập.'), {
      cause: error,
    });
  }
}

export async function forgotPassword(email) {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Không thể gửi email đặt lại mật khẩu.'), {
      cause: error,
    });
  }
}

export async function refreshAccessToken(refreshToken) {
  try {
    const response = await api.post('/auth/refresh-token', { refreshToken });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Làm mới phiên đăng nhập thất bại.'), {
      cause: error,
    });
  }
}

export async function logoutAccount({ accessToken, refreshToken }) {
  try {
    const response = await api.post(
      '/auth/logout',
      { refreshToken },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Đăng xuất thất bại.'), {
      cause: error,
    });
  }
}

export async function changePassword({ accessToken, currentPassword, newPassword }) {
  try {
    const response = await api.post(
      '/auth/change-password',
      { currentPassword, newPassword },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Đổi mật khẩu thất bại.'), {
      cause: error,
    });
  }
}

export async function resetPassword({ email, otp, newPassword }) {
  try {
    const response = await api.post('/auth/reset-password', { email, otp, newPassword });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Đặt lại mật khẩu thất bại.'), {
      cause: error,
    });
  }
}

// @spec FR-FE02-024, FR-FE02-025 - consume an FE11 setup token without exposing it.
export async function resetPasswordWithToken({ token, newPassword }) {
  try {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Không thể hoàn tất thiết lập tài khoản.'), {
      cause: error,
    });
  }
}

export async function getCurrentUser(accessToken) {
  try {
    const response = await api.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Không thể tải thông tin người dùng hiện tại.'), {
      cause: error,
    });
  }
}

export async function resendVerification(email) {
  try {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Gửi lại email xác thực thất bại.'), {
      cause: error,
    });
  }
}
