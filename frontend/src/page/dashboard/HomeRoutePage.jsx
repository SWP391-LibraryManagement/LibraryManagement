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
  const audience = hasStoredAuth() ? getDashboardAudience(user?.roles || []) : 'guest';

  return audience === 'guest'
    ? <HomePage />
    : <RoleDashboardPage audience={audience} roles={user?.roles || []} />;
}
