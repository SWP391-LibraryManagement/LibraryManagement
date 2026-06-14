import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

function getErrorMessage(error, fallback = 'Request failed. Please try again.') {
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
    throw new Error(getErrorMessage(error, 'Registration failed. Please check your information.'));
  }
}

export async function loginAccount({ email, password }) {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Login failed. Please check your credentials.'));
  }
}

export async function forgotPassword(email) {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not send password reset email.'));
  }
}

export async function refreshAccessToken(refreshToken) {
  try {
    const response = await api.post('/auth/refresh-token', { refreshToken });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Session refresh failed.'));
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
    throw new Error(getErrorMessage(error, 'Logout failed.'));
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
    throw new Error(getErrorMessage(error, 'Password change failed.'));
  }
}

export async function resetPassword({ token, newPassword }) {
  try {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Password reset failed.'));
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
    throw new Error(getErrorMessage(error, 'Could not load current user.'));
  }
}
