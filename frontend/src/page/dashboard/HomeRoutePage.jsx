import HomePage from '../HomePage';
import { hasStoredAuth } from '../../api/libraryFeatureApi';
import { getDashboardAudience } from '../../utils/appNavigation';
import RoleDashboardPage from './RoleDashboardPage';

function readStoredUser() {
  try {
    const raw = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function HomeRoutePage() {
  const user = readStoredUser();
  const roles = user?.roles || [];
  const audience = hasStoredAuth() ? getDashboardAudience(roles) : 'guest';

  // The Admin Console owns its dashboard. Its Home navigation returns to the
  // public library homepage instead of opening a second staff dashboard.
  if (roles.includes('ADMIN')) {
    return <HomePage />;
  }

  return audience === 'guest'
    ? <HomePage />
    : <RoleDashboardPage audience={audience} roles={roles} />;
}
