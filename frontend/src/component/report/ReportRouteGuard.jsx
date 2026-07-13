import { Navigate } from 'react-router-dom';

import { getReportRouteRedirect } from '../../utils/reportAccess';

function readStoredReportAccess() {
  try {
    const storage = localStorage.getItem('authUser') ? localStorage : sessionStorage;
    const rawUser = storage.getItem('authUser');
    const user = rawUser ? JSON.parse(rawUser) : null;
    const authenticated = Boolean(
      storage.getItem('accessToken') || storage.getItem('refreshToken')
    );

    return { authenticated, roles: user?.roles || [] };
  } catch {
    return { authenticated: false, roles: [] };
  }
}

export default function ReportRouteGuard({ children }) {
  const redirect = getReportRouteRedirect(readStoredReportAccess());

  return redirect ? <Navigate to={redirect} replace /> : children;
}
