import { Navigate } from 'react-router-dom';

import { getBorrowingRouteRedirect } from '../../utils/borrowingAccess';

function readStoredBorrowingAccess() {
  try {
    for (const storage of [localStorage, sessionStorage]) {
      const rawUser = storage.getItem('authUser');
      const authenticated = Boolean(
        storage.getItem('accessToken') || storage.getItem('refreshToken')
      );

      if (rawUser || authenticated) {
        const user = rawUser ? JSON.parse(rawUser) : null;
        return { authenticated, roles: user?.roles || [] };
      }
    }
  } catch {
    return { authenticated: false, roles: [] };
  }

  return { authenticated: false, roles: [] };
}

export default function BorrowingRouteGuard({ audience, children }) {
  const redirect = getBorrowingRouteRedirect(readStoredBorrowingAccess(), audience);

  return redirect ? <Navigate to={redirect} replace /> : children;
}
