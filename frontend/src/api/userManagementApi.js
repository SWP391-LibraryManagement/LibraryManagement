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

function getErrorMessage(error, fallback = 'Request failed. Please try again.') {
  const code = error.response?.data?.error?.code;

  if (code === 'UNAUTHORIZED' || error.response?.status === 401) {
    return 'Please login with an Admin account before doing this action.';
  }

  if (code === 'ADMIN_REQUIRED' || error.response?.status === 403) {
    return 'Your account does not have Admin permission for this action.';
  }

  return error.response?.data?.error?.message || fallback;
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
    throw new Error(getErrorMessage(error, 'Could not load users.'), { cause: error });
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
    throw new Error(getErrorMessage(error, 'Could not load roles.'), { cause: error });
  }
}

export async function fetchAuditLogs(limit = 30) {
  try {
    const response = await authorizedRequest({
      method: 'get',
      url: '/users/audit-logs',
      params: { limit },
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not load audit logs.'), { cause: error });
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
    throw new Error(getErrorMessage(error, 'Could not create user.'), { cause: error });
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
    throw new Error(getErrorMessage(error, 'Could not update user.'), { cause: error });
  }
}

export async function deactivateManagedUser(userId) {
  try {
    const response = await authorizedRequest({
      method: 'patch',
      url: `/users/${userId}/status`,
      data: { status: 'INACTIVE' },
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not deactivate user.'), { cause: error });
  }
}

export async function assignManagedUserRole(userId, roleName) {
  try {
    const response = await authorizedRequest({
      method: 'post',
      url: `/users/${userId}/roles`,
      data: { roleName },
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not assign role.'), { cause: error });
  }
}

export async function revokeManagedUserRole(userId, roleName) {
  try {
    const response = await authorizedRequest({
      method: 'delete',
      url: `/users/${userId}/roles/${roleName}`,
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not revoke role.'), { cause: error });
  }
}
