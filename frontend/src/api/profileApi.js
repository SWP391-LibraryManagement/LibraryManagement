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

function getAuthStorage() {
  if (localStorage.getItem('refreshToken')) return localStorage;
  if (sessionStorage.getItem('refreshToken')) return sessionStorage;
  if (localStorage.getItem('accessToken')) return localStorage;
  if (sessionStorage.getItem('accessToken')) return sessionStorage;
  return null;
}

function getStoredAccessToken() {
  return getAuthStorage()?.getItem('accessToken') || null;
}

function authHeaders() {
  const accessToken = getStoredAccessToken();
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

function clearStoredAuth() {
  for (const storage of [localStorage, sessionStorage]) {
    storage.removeItem('accessToken');
    storage.removeItem('refreshToken');
    storage.removeItem('authUser');
  }
}

async function refreshStoredAccessToken() {
  const storage = getAuthStorage();
  const refreshToken = storage?.getItem('refreshToken');
  if (!storage || !refreshToken) return null;

  const response = await api.post('/auth/refresh-token', { refreshToken });
  const accessToken = response.data?.accessToken;
  if (!accessToken) return null;

  storage.setItem('accessToken', accessToken);
  return accessToken;
}

function redirectToLogin() {
  if (typeof window !== 'undefined') window.location.assign('/login');
}

function getErrorMessage(error, fallback = 'KhÃ´ng thá»ƒ táº£i há»“ sÆ¡ cÃ¡ nhÃ¢n.') {
  if (!error.response) {
    return 'KhÃ´ng káº¿t ná»‘i Ä‘Æ°á»£c backend. HÃ£y kiá»ƒm tra server API Ä‘ang cháº¡y á»Ÿ http://localhost:3000.';
  }

  if (error.response.status === 401) {
    return 'Vui lÃ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ xem há»“ sÆ¡.';
  }

  return fallback;
}

async function authorizedRequest(config, fallbackMessage) {
  try {
    const response = await api.request({
      ...config,
      headers: { ...config.headers, ...authHeaders() },
    });
    return response.data;
  } catch (error) {
    const shouldRefresh = error.response?.status === 401 && !config._retried;
    if (!shouldRefresh) {
      throw new Error(getErrorMessage(error, fallbackMessage), { cause: error });
    }

    try {
      const accessToken = await refreshStoredAccessToken();
      if (!accessToken) throw error;

      const response = await api.request({
        ...config,
        _retried: true,
        headers: { ...config.headers, Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (refreshError) {
      clearStoredAuth();
      redirectToLogin();
      const source = refreshError.response ? refreshError : error;
      throw new Error(getErrorMessage(source, fallbackMessage), { cause: refreshError });
    }
  }
}

// @spec BR-FE03-016 FR-FE03-006
function buildProfileUpdatePayload(profile) {
  return {
    fullName: profile.fullName?.trim() || null,
    address: profile.address?.trim() || null,
    dateOfBirth: profile.dateOfBirth || null,
    phone: profile.phone?.trim() || null,
  };
}

export async function fetchMyProfile() {
  return normalizeProfile(await authorizedRequest({ method: 'get', url: '/profile/me' }, 'KhÃ´ng thá»ƒ táº£i há»“ sÆ¡ cÃ¡ nhÃ¢n.'));
}

export async function fetchHeaderProfile() {
  const profile = await fetchMyProfile();

  return {
    fullName: profile?.fullName || '',
    avatarUrl: profile?.avatarUrl || '',
  };
}

export async function updateMyProfile(profile) {
  return normalizeProfile(await authorizedRequest({
    method: 'put',
    url: '/profile/me',
    data: buildProfileUpdatePayload(profile),
  }, 'KhÃ´ng thá»ƒ cáº­p nháº­t há»“ sÆ¡ cÃ¡ nhÃ¢n.'));
}

export async function uploadMyAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file);
  return normalizeProfile(await authorizedRequest({
    method: 'post',
    url: '/profile/me/avatar',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  }, 'KhÃ´ng thá»ƒ táº£i áº£nh Ä‘áº¡i diá»‡n lÃªn.'));
}

export async function requestChangePasswordOtp({ currentPassword, newPassword, confirmNewPassword }) {
  return authorizedRequest({
    method: 'post',
    url: '/auth/change-password/request-otp',
    data: { currentPassword, newPassword, confirmNewPassword },
  }, 'KhÃ´ng thá»ƒ gá»­i mÃ£ OTP. Vui lÃ²ng thá»­ láº¡i.');
}

export async function confirmChangePassword({ otp, newPassword }) {
  return authorizedRequest({
    method: 'post',
    url: '/auth/change-password/confirm',
    data: { otp, newPassword },
  }, 'KhÃ´ng thá»ƒ Ä‘á»•i máº­t kháº©u. Vui lÃ²ng kiá»ƒm tra mÃ£ OTP.');
}
