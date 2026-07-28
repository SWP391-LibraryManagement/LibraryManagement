import { Navigate } from 'react-router-dom';

import { hasStoredAuth } from '../../api/libraryFeatureApi';

export default function AuthenticatedRouteGuard({ children }) {
  return hasStoredAuth() ? children : <Navigate to="/login" replace />;
}
