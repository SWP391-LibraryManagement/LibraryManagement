export function readStoredAdminAccess() {
  for (const storage of [localStorage, sessionStorage]) {
    const rawUser = storage.getItem('authUser');
    const hasToken = Boolean(storage.getItem('accessToken') || storage.getItem('refreshToken'));
    if (!rawUser || !hasToken) continue;

    try {
      const user = JSON.parse(rawUser);
      const roles = Array.isArray(user.roles)
        ? user.roles.map((role) => String(role || '').toUpperCase())
        : [];
      return { authenticated: true, isAdmin: roles.includes('ADMIN'), user };
    } catch {
      // Continue in case the other storage contains a valid session.
    }
  }

  return { authenticated: false, isAdmin: false, user: null };
}
