import axios from 'axios';
import {
  getBorrowingErrorMessage,
  getLibraryFeatureErrorMessage,
  getInventoryErrorMessage,
  getMembershipErrorMessage,
  getReportErrorMessage,
  getReservationErrorMessage,
} from './apiErrorMessages';

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

export async function authorizedRequest(config, fallbackMessage, errorMessageResolver = getLibraryFeatureErrorMessage) {
  try {
    const response = await api.request({
      ...config,
      headers: buildHeaders(config.headers),
    });
    return response.data;
  } catch (error) {
    const shouldRefresh = error.response?.status === 401 && !config._retried;
    if (!shouldRefresh) {
      throw new Error(errorMessageResolver(error, fallbackMessage), { cause: error });
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
      throw new Error(errorMessageResolver(source, fallbackMessage), { cause: refreshError });
    }
  }
}

function authorizedBorrowingRequest(config, fallbackMessage) {
  return authorizedRequest(config, fallbackMessage, getBorrowingErrorMessage);
}

function authorizedReservationRequest(config, fallbackMessage) {
  return authorizedRequest(config, fallbackMessage, getReservationErrorMessage);
}

function authorizedMembershipRequest(config, fallbackMessage) {
  return authorizedRequest(config, fallbackMessage, getMembershipErrorMessage);
}

function authorizedReportRequest(config, fallbackMessage) {
  return authorizedRequest(config, fallbackMessage, getReportErrorMessage);
}

async function publicBrowseRequest(request, fallbackMessage) {
  try {
    const response = await request();
    return response.data;
  } catch (error) {
    throw new Error(getLibraryFeatureErrorMessage(error, fallbackMessage), { cause: error });
  }
}

export const publicBrowseApi = {
  list(params = {}) {
    return publicBrowseRequest(
      () => api.get('/books', { params }),
      'Không thể tải danh mục sách công khai.',
    );
  },
  detail(bookId) {
    return publicBrowseRequest(
      () => api.get(`/books/${bookId}`),
      'Không thể tải chi tiết sách.',
    );
  },
};

export const borrowingApi = {
  createRequest(copyIds) {
    return authorizedBorrowingRequest({ method: 'post', url: '/borrow-requests', data: { copyIds } }, 'Không thể gửi yêu cầu mượn.');
  },
  listMine(params = {}) {
    return authorizedBorrowingRequest({ method: 'get', url: '/borrow-requests/me', params }, 'Không thể tải lịch sử mượn.');
  },
  listAll(params = {}) {
    return authorizedBorrowingRequest({ method: 'get', url: '/borrow-requests', params }, 'Không thể tải danh sách yêu cầu mượn.');
  },
  listMemberBorrowings(memberId, params = {}) {
    return authorizedBorrowingRequest({ method: 'get', url: `/members/${memberId}/borrowings`, params }, 'Không thể tải thông tin mượn của thành viên.');
  },
  approve(requestId, data = {}) {
    return authorizedBorrowingRequest({ method: 'patch', url: `/borrow-requests/${requestId}/approve`, data }, 'Không thể duyệt yêu cầu mượn.');
  },
  reject(requestId, reason) {
    return authorizedBorrowingRequest({ method: 'patch', url: `/borrow-requests/${requestId}/reject`, data: { reason } }, 'Không thể từ chối yêu cầu mượn.');
  },
  returnDetail(borrowDetailId, data) {
    return authorizedBorrowingRequest({ method: 'patch', url: `/borrow-details/${borrowDetailId}/return`, data }, 'Không thể ghi nhận trả sách.');
  },
  renewDetail(borrowDetailId) {
    return authorizedBorrowingRequest({ method: 'patch', url: `/borrow-details/${borrowDetailId}/renew`, data: {} }, 'Không thể gia hạn sách.');
  },
};

export const reservationApi = {
  create(copyId) {
    return authorizedReservationRequest({ method: 'post', url: '/reservations', data: { copyId } }, 'Không thể đặt chỗ sách.');
  },
  listMine(params = {}) {
    return authorizedReservationRequest({ method: 'get', url: '/reservations/me', params }, 'Không thể tải đặt chỗ của bạn.');
  },
  cancel(reservationId, reason = 'Cancelled by member') {
    return authorizedReservationRequest({ method: 'patch', url: `/reservations/${reservationId}/cancel`, data: { reason } }, 'Không thể hủy đặt chỗ.');
  },
  listAll(params = {}) {
    return authorizedReservationRequest({ method: 'get', url: '/reservations', params }, 'Không thể tải danh sách đặt chỗ.');
  },
  processQueue(copyId) {
    return authorizedReservationRequest({ method: 'post', url: '/reservations/process-queue', data: { copyId } }, 'Không thể xử lý hàng đợi đặt chỗ.');
  },
  process(reservationId, data = {}) {
    return authorizedReservationRequest({ method: 'patch', url: `/reservations/${reservationId}/process`, data }, 'Không thể xử lý đặt chỗ.');
  },
  expireHolds() {
    return authorizedReservationRequest(
      { method: 'post', url: '/reservations/expire-holds' },
      'Không thể xử lý các lượt giữ chỗ hết hạn.',
    );
  },
};

export const reportApi = {
  borrowing(params = {}) {
    return authorizedReportRequest({ method: 'get', url: '/reports/borrowing', params }, 'Không thể tải báo cáo mượn sách.');
  },
  inventory(params = {}) {
    return authorizedReportRequest({ method: 'get', url: '/reports/inventory', params }, 'Không thể tải báo cáo tồn kho.');
  },
  users(params = {}) {
    return authorizedReportRequest({ method: 'get', url: '/reports/users', params }, 'Không thể tải thống kê người dùng.');
  },
};

export const inventoryApi = {
  list(params = {}) {
    return authorizedRequest({ method: 'get', url: '/inventory', params }, 'Không thể tải dữ liệu kho sách.', getInventoryErrorMessage);
  },
  getCopy(copyId) {
    return authorizedRequest({ method: 'get', url: `/book-copies/${copyId}` }, 'Không thể tải thông tin bản sao.', getInventoryErrorMessage);
  },
  getByBarcode(barcode) {
    return authorizedRequest({ method: 'get', url: `/book-copies/barcode/${barcode}` }, 'Không thể tìm bản sao theo mã vạch.', getInventoryErrorMessage);
  },
  createCopy(bookId, data) {
    return authorizedRequest({
      method: 'post',
      url: `/books/${bookId}/copies`,
      data: { barcode: data.barcode, location: data.location },
    }, 'Không thể thêm bản sao.', getInventoryErrorMessage);
  },
  updateCopy(copyId, data, version) {
    return authorizedRequest({
      method: 'put',
      url: `/book-copies/${copyId}`,
      headers: { 'If-Match': version },
      data,
    }, 'Không thể cập nhật bản sao.', getInventoryErrorMessage);
  },
  updateStatus(copyId, data, version) {
    return authorizedRequest({
      method: 'patch',
      url: `/book-copies/${copyId}/status`,
      headers: { 'If-Match': version },
      data,
    }, 'Không thể cập nhật trạng thái bản sao.', getInventoryErrorMessage);
  },
  deactivate(copyId, reason, version) {
    return authorizedRequest({
      method: 'delete',
      url: `/book-copies/${copyId}`,
      headers: { 'If-Match': version },
      data: { reason },
    }, 'Không thể ngừng sử dụng bản sao.', getInventoryErrorMessage);
  },
};

export const fineApi = {
  list(params = {}) {
    return authorizedRequest({ method: 'get', url: '/fines', params }, 'Không thể tải danh sách phiếu phạt.');
  },
  calculate(borrowDetailId) {
    return authorizedRequest({ method: 'post', url: '/fines/calculate', data: { borrowDetailId } }, 'Không thể tính tiền phạt.');
  },
  collect(fineId, data) {
    return authorizedRequest({ method: 'post', url: `/fines/${fineId}/collections`, data }, 'Không thể ghi nhận thu tiền.');
  },
  markPaid(fineId, data) {
    return authorizedRequest({ method: 'patch', url: `/fines/${fineId}/paid`, data }, 'Không thể đánh dấu phiếu phạt đã thanh toán.');
  },
  waive(fineId, reason) {
    return authorizedRequest({ method: 'patch', url: `/fines/${fineId}/waive`, data: { reason } }, 'Không thể miễn phiếu phạt.');
  },
  cancel(fineId, reason) {
    return authorizedRequest({ method: 'patch', url: `/fines/${fineId}/cancel`, data: { reason } }, 'Không thể hủy phiếu phạt.');
  },
};

export const membershipApi = {
  getMyStatus() {
    return authorizedMembershipRequest({ method: 'get', url: '/membership/status/me' }, 'Không thể tải trạng thái hội viên.');
  },
  apply(data = {}) {
    return authorizedMembershipRequest({ method: 'post', url: '/membership/applications', data }, 'Không thể nộp đơn đăng ký hội viên.');
  },
  listApplications(params = {}) {
    return authorizedMembershipRequest({ method: 'get', url: '/membership/applications', params }, 'Không thể tải danh sách đơn đăng ký hội viên.');
  },
  approve(applicationId) {
    return authorizedMembershipRequest({ method: 'patch', url: `/membership/applications/${applicationId}/approve`, data: {} }, 'Không thể duyệt đơn đăng ký hội viên.');
  },
  reject(applicationId, reason) {
    return authorizedMembershipRequest({ method: 'patch', url: `/membership/applications/${applicationId}/reject`, data: { reason } }, 'Không thể từ chối đơn đăng ký hội viên.');
  },
};
