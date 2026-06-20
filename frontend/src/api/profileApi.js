import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export async function fetchMyProfile() {
  try {
    const response = await api.get('/profile/me', {
      headers: authHeaders(),
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error });
  }
}
