import axios from 'axios';
import { buildManagedUserListParams } from '../utils/userManagementQuery';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

function authHeaders() {
  const accessToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

function getAuthStorage() {
  if (localStorage.getItem('refreshToken')) {
    return localStorage;
  }

  if (sessionStorage.getItem('refreshToken')) {
    return sessionStorage;
  }

  return null;
}

function clearStoredAuth() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('authUser');
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
  sessionStorage.removeItem('authUser');
}

async function refreshStoredAccessToken() {
  const storage = getAuthStorage();
  const refreshToken = storage?.getItem('refreshToken');

  if (!storage || !refreshToken) {
    return null;
  }

  const response = await api.post('/auth/refresh-token', { refreshToken });
  const accessToken = response.data?.accessToken;

  if (!accessToken) {
    return null;
  }

  storage.setItem('accessToken', accessToken);
  return accessToken;
}

export async function ensureManagedUserAccess() {
  if (authHeaders().Authorization) {
    return true;
  }

  const accessToken = await refreshStoredAccessToken();
  return Boolean(accessToken);
}

async function authorizedRequest(config) {
  try {
    return await api.request({
      ...config,
      headers: {
        ...config.headers,
        ...authHeaders(),
      },
    });
  } catch (error) {
    const shouldRefresh = error.response?.status === 401 && !config._retried;

    if (!shouldRefresh) {
      throw error;
    }

    try {
      const accessToken = await refreshStoredAccessToken();

      if (!accessToken) {
        throw error;
      }

      return await api.request({
        ...config,
        _retried: true,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (refreshError) {
      clearStoredAuth();
      throw refreshError.response ? refreshError : error;
    }
  }
}

function getErrorMessage(error, fallback = 'Yêu cầu thất bại. Vui lòng thử lại.') {
  const code = error.response?.data?.error?.code;

  if (code === 'UNAUTHORIZED' || error.response?.status === 401) {
    return 'Vui lòng đăng nhập bằng tài khoản quản trị viên để thực hiện thao tác này.';
  }

  if (code === 'ADMIN_REQUIRED' || error.response?.status === 403) {
    return 'Tài khoản của bạn không có quyền quản trị viên cho thao tác này.';
  }

  const messages = {
    EMAIL_ALREADY_EXISTS: 'Email đã được sử dụng bởi tài khoản khác.',
    USERNAME_ALREADY_EXISTS: 'Username đã tồn tại.',
    INVALID_EMAIL: 'Email không hợp lệ.',
    INVALID_PHONE: 'Số điện thoại không hợp lệ.',
    FULL_NAME_REQUIRED: 'Họ và tên là bắt buộc.',
    ACTIVE_BORROWINGS_EXIST: 'Không thể vô hiệu hóa người dùng đang mượn sách.',
    PENDING_BORROW_REQUESTS_EXIST: 'Không thể vô hiệu hóa người dùng khi còn yêu cầu mượn đang chờ xử lý.',
    MEMBER_BORROWING_WORKFLOW_EXISTS: 'Không thể đổi role MEMBER khi người dùng còn yêu cầu chờ xử lý hoặc sách đang mượn.',
    ACCOUNT_PENDING_ACTIVATION: 'Tài khoản đang chờ kích hoạt nên chưa thể vô hiệu hóa.',
    ACCOUNT_SETUP_NOT_ELIGIBLE: 'Tài khoản không hợp lệ để gửi lại email thiết lập (đã kích hoạt, đã hoàn tất thiết lập, hoặc không phải tài khoản do quản trị viên tạo).',
    ACCOUNT_SETUP_RESEND_COOLDOWN: 'Vui lòng đợi 60 giây sau lần gửi gần nhất trước khi gửi lại email thiết lập.',
    CANNOT_DEACTIVATE_SELF: 'Quản trị viên không thể tự vô hiệu hóa tài khoản của mình.',
    LAST_ADMIN_ROLE: 'Không thể thay vai trò của quản trị viên đang hoạt động cuối cùng.',
    ROLE_NOT_FOUND: 'Vai trò được chọn không tồn tại hoặc không được phép sử dụng.',
    INVALID_ROLE_ID: 'Vai trò được chọn không hợp lệ.',
    INVALID_USER_ID: 'Tài khoản người dùng không hợp lệ.',
    STALE_USER_STATE: 'Thông tin người dùng đã thay đổi. Vui lòng tải lại trước khi lưu.',
    MANAGED_USER_UPDATE_FORBIDDEN: 'Quản trị viên chỉ được cập nhật họ tên, số điện thoại và địa chỉ.',
  };

  if (messages[code]) return messages[code];

  return fallback;
}

export async function fetchUsers(params = {}) {
  try {
    const response = await authorizedRequest({
      method: 'get',
      url: '/users',
      params: buildManagedUserListParams(params),
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Không thể tải danh sách người dùng.'), { cause: error });
  }
}

export async function fetchManagedUser(userId) {
  try {
    const response = await authorizedRequest({
      method: 'get',
      url: `/users/${userId}`,
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Không thể tải chi tiết người dùng.'), { cause: error });
  }
}

export async function fetchRoles() {
  try {
    const response = await authorizedRequest({
      method: 'get',
      url: '/users/roles',
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Không thể tải danh sách vai trò.'), { cause: error });
  }
}

export async function createManagedUser(payload) {
  try {
    const response = await authorizedRequest({
      method: 'post',
      url: '/users',
      data: payload,
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Không thể tạo người dùng.'), { cause: error });
  }
}

export async function updateManagedUser(userId, payload) {
  try {
    const response = await authorizedRequest({
      method: 'put',
      url: `/users/${userId}`,
      data: payload,
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Không thể cập nhật người dùng.'), { cause: error });
  }
}

export async function deactivateManagedUser(userId, expectedUpdatedAt) {
  try {
    const response = await authorizedRequest({
      method: 'patch',
      url: `/users/${userId}/status`,
      data: { status: 'INACTIVE', expectedUpdatedAt },
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Không thể vô hiệu hóa người dùng.'), { cause: error });
  }
}

export async function replaceManagedUserRole(userId, roleId) {
  const normalizedUserId = Number(userId);
  const normalizedRoleId = Number(roleId);
  if (!Number.isInteger(normalizedUserId) || normalizedUserId <= 0) {
    throw new Error('Tài khoản người dùng không hợp lệ.');
  }
  if (!Number.isInteger(normalizedRoleId) || normalizedRoleId <= 0) {
    throw new Error('Vai trò được chọn không hợp lệ.');
  }

  try {
    const response = await authorizedRequest({
      method: 'put',
      url: `/users/${normalizedUserId}/role`,
      data: { roleId: normalizedRoleId },
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Không thể thay đổi vai trò.'), { cause: error });
  }
}

// @spec MF-FE11-014, FR-FE11-036..038, AC-FE11-021/022, ADR-005
export async function resendSetupEmail(userId) {
  const normalizedUserId = Number(userId);
  if (!Number.isInteger(normalizedUserId) || normalizedUserId <= 0) {
    throw new Error('Tài khoản người dùng không hợp lệ.');
  }

  try {
    const response = await authorizedRequest({
      method: 'post',
      url: `/users/${normalizedUserId}/resend-setup`,
      data: {},
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Không thể gửi lại email thiết lập.'), { cause: error });
  }
}
