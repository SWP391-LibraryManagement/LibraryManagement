import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
});

function getAuthStorage() {
  if (localStorage.getItem('refreshToken')) return localStorage;
  if (sessionStorage.getItem('refreshToken')) return sessionStorage;
  if (localStorage.getItem('accessToken')) return localStorage;
  if (sessionStorage.getItem('accessToken')) return sessionStorage;
  return null;
}

function getAccessToken() {
  return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
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

function buildHeaders(headers = {}) {
  const token = getAccessToken();
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
}

export function hasStoredAuth() {
  return Boolean(getAccessToken() || localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken'));
}

function getErrorMessage(error, fallback = 'Không thể tải dữ liệu từ backend.') {
  if (!error.response) {
    return 'Không kết nối được backend. UI đang dùng dữ liệu demo để bạn vẫn kiểm tra được màn hình.';
  }

  const code = error.response?.data?.error?.code;
  if (code === 'UNAUTHORIZED' || error.response?.status === 401) {
    return 'Bạn chưa đăng nhập hoặc phiên đã hết hạn. UI đang hiển thị dữ liệu demo.';
  }
  if (code === 'ROLE_REQUIRED' || code === 'STAFF_ROLE_REQUIRED' || code === 'MEMBER_ROLE_REQUIRED' || error.response?.status === 403) {
    return 'Tài khoản hiện tại không có quyền xem dữ liệu này. UI đang hiển thị dữ liệu demo.';
  }

  const details = error.response?.data?.error?.details;
  if (Array.isArray(details) && details.length) {
    return details.map((item) => item.message).filter(Boolean).join('\n') || fallback;
  }

  return error.response?.data?.error?.message || fallback;
}

export async function authorizedRequest(config, fallbackMessage) {
  try {
    const response = await api.request({
      ...config,
      headers: buildHeaders(config.headers),
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
      const source = refreshError.response ? refreshError : error;
      throw new Error(getErrorMessage(source, fallbackMessage), { cause: refreshError });
    }
  }
}

export const borrowingApi = {
  createRequest(copyIds) {
    return authorizedRequest({ method: 'post', url: '/borrow-requests', data: { copyIds } }, 'Không thể gửi yêu cầu mượn.');
  },
  listMine(params = {}) {
    return authorizedRequest({ method: 'get', url: '/borrow-requests/me', params }, 'Không thể tải lịch sử mượn.');
  },
  listAll(params = {}) {
    return authorizedRequest({ method: 'get', url: '/borrow-requests', params }, 'Không thể tải danh sách yêu cầu mượn.');
  },
  listMemberBorrowings(memberId, params = {}) {
    return authorizedRequest({ method: 'get', url: `/members/${memberId}/borrowings`, params }, 'Không thể tải thông tin mượn của thành viên.');
  },
  approve(requestId, data = {}) {
    return authorizedRequest({ method: 'patch', url: `/borrow-requests/${requestId}/approve`, data }, 'Không thể duyệt yêu cầu mượn.');
  },
  reject(requestId, reason) {
    return authorizedRequest({ method: 'patch', url: `/borrow-requests/${requestId}/reject`, data: { reason } }, 'Không thể từ chối yêu cầu mượn.');
  },
  returnDetail(borrowDetailId, data) {
    return authorizedRequest({ method: 'patch', url: `/borrow-details/${borrowDetailId}/return`, data }, 'Không thể ghi nhận trả sách.');
  },
  renewDetail(borrowDetailId) {
    return authorizedRequest({ method: 'patch', url: `/borrow-details/${borrowDetailId}/renew`, data: {} }, 'Không thể gia hạn sách.');
  },
};

export const reservationApi = {
  create(copyId) {
    return authorizedRequest({ method: 'post', url: '/reservations', data: { copyId } }, 'Không thể đặt chỗ sách.');
  },
  listMine(params = {}) {
    return authorizedRequest({ method: 'get', url: '/reservations/me', params }, 'Không thể tải đặt chỗ của bạn.');
  },
  cancel(reservationId, reason = 'Cancelled by member') {
    return authorizedRequest({ method: 'patch', url: `/reservations/${reservationId}/cancel`, data: { reason } }, 'Không thể hủy đặt chỗ.');
  },
  listAll(params = {}) {
    return authorizedRequest({ method: 'get', url: '/reservations', params }, 'Không thể tải danh sách đặt chỗ.');
  },
  processQueue(copyId) {
    return authorizedRequest({ method: 'post', url: '/reservations/process-queue', data: { copyId } }, 'Không thể xử lý hàng đợi đặt chỗ.');
  },
  process(reservationId, data = {}) {
    return authorizedRequest({ method: 'patch', url: `/reservations/${reservationId}/process`, data }, 'Không thể xử lý đặt chỗ.');
  },
};

export const reportApi = {
  borrowing(params = {}) {
    return authorizedRequest({ method: 'get', url: '/reports/borrowing', params }, 'Không thể tải báo cáo mượn sách.');
  },
  inventory(params = {}) {
    return authorizedRequest({ method: 'get', url: '/reports/inventory', params }, 'Không thể tải báo cáo tồn kho.');
  },
  users(params = {}) {
    return authorizedRequest({ method: 'get', url: '/reports/users', params }, 'Không thể tải thống kê người dùng.');
  },
};
