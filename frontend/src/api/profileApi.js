import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

function getApiOrigin() {
  return api.defaults.baseURL.replace(/\/api\/?$/, '');
}

function normalizeProfile(profile) {
  if (!profile?.avatarUrl || /^https?:\/\//i.test(profile.avatarUrl)) {
    return profile;
  }

  return {
    ...profile,
    avatarUrl: `${getApiOrigin()}${profile.avatarUrl}`,
  };
}

function denormalizeAvatarUrl(avatarUrl) {
  const apiOrigin = getApiOrigin();

  if (avatarUrl?.startsWith(`${apiOrigin}/uploads/avatars/`)) {
    return avatarUrl.slice(apiOrigin.length);
  }

  return avatarUrl;
}

function getStoredAccessToken() {
  return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
}

function authHeaders() {
  const accessToken = getStoredAccessToken();
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

function getErrorMessage(error, fallback = 'Could not load profile.') {
  if (!error.response) {
    return 'Không kết nối được backend. Hãy kiểm tra server API đang chạy ở http://localhost:3000.';
  }

  if (error.response.status === 401) {
    return 'Vui lòng đăng nhập để xem hồ sơ.';
  }

  return error.response?.data?.error?.message || fallback;
}

function buildProfileUpdatePayload(profile) {
  return {
    fullName: profile.fullName?.trim() || null,
    address: profile.address?.trim() || null,
    dateOfBirth: profile.dateOfBirth || null,
    avatarUrl: denormalizeAvatarUrl(profile.avatarUrl?.trim()) || null,
    phone: profile.phone?.trim() || null,
  };
}

export async function fetchMyProfile() {
  try {
    const response = await api.get('/profile/me', {
      headers: authHeaders(),
    });
    return normalizeProfile(response.data);
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error });
  }
}

export async function updateMyProfile(profile) {
  try {
    const response = await api.put('/profile/me', buildProfileUpdatePayload(profile), {
      headers: authHeaders(),
    });
    return normalizeProfile(response.data);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not update profile.'), { cause: error });
  }
}

export async function uploadMyAvatar(file) {
  try {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post('/profile/me/avatar', formData, {
      headers: {
        ...authHeaders(),
        'Content-Type': 'multipart/form-data',
      },
    });
    return normalizeProfile(response.data);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not upload avatar.'), { cause: error });
  }
}

export async function requestChangePasswordOtp({ currentPassword, newPassword, confirmNewPassword }) {
  try {
    const response = await api.post(
      '/auth/change-password/request-otp',
      { currentPassword, newPassword, confirmNewPassword },
      { headers: authHeaders() }
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, 'Không thể gửi mã OTP. Vui lòng thử lại.'),
      { cause: error }
    );
  }
}

export async function confirmChangePassword({ otp, newPassword }) {
  try {
    const response = await api.post(
      '/auth/change-password/confirm',
      { otp, newPassword },
      { headers: authHeaders() }
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, 'Không thể đổi mật khẩu. Vui lòng kiểm tra mã OTP.'),
      { cause: error }
    );
  }
}
