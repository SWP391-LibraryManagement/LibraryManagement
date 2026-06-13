import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

function authHeaders() {
  const accessToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
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
    const response = await api.get('/users', {
      params,
      headers: authHeaders(),
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not load users.'), { cause: error });
  }
}

export async function fetchRoles() {
  try {
    const response = await api.get('/users/roles', {
      headers: authHeaders(),
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not load roles.'), { cause: error });
  }
}

export async function fetchAuditLogs(limit = 30) {
  try {
    const response = await api.get('/users/audit-logs', {
      params: { limit },
      headers: authHeaders(),
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not load audit logs.'), { cause: error });
  }
}

export async function createManagedUser(payload) {
  try {
    const response = await api.post('/users', payload, {
      headers: authHeaders(),
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not create user.'), { cause: error });
  }
}

export async function updateManagedUser(userId, payload) {
  try {
    const response = await api.put(`/users/${userId}`, payload, {
      headers: authHeaders(),
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not update user.'), { cause: error });
  }
}

export async function deactivateManagedUser(userId) {
  try {
    const response = await api.patch(
      `/users/${userId}/status`,
      { status: 'INACTIVE' },
      {
        headers: authHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not deactivate user.'), { cause: error });
  }
}

export async function assignManagedUserRole(userId, roleName) {
  try {
    const response = await api.post(
      `/users/${userId}/roles`,
      { roleName },
      {
        headers: authHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not assign role.'), { cause: error });
  }
}

export async function revokeManagedUserRole(userId, roleName) {
  try {
    const response = await api.delete(`/users/${userId}/roles/${roleName}`, {
      headers: authHeaders(),
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not revoke role.'), { cause: error });
  }
}
