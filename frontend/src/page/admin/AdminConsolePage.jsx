import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { readStoredAdminAccess } from './adminAccess';
import './admin-console.css';
import { AdminAuditSection } from './audit/AdminAuditSection';
import { AdminShell } from './components/AdminShell';
import { AdminDashboardSection } from './dashboard/AdminDashboardSection';
import { AdminPermissionsSection } from './permissions/AdminPermissionsSection';
import { AdminRequestsSection } from './requests/AdminRequestsSection';
import { AdminUsersSection } from './users/AdminUsersSection';

export default function AdminConsolePage() {
  const navigate = useNavigate();
  const access = readStoredAdminAccess();
  const [activeSection, setActiveSection] = useState('users');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!access.authenticated) return <Navigate to="/login" replace />;
  if (!access.isAdmin) return <Navigate to="/home" replace />;

  function handleLogout() {
    for (const storage of [localStorage, sessionStorage]) {
      storage.removeItem('accessToken');
      storage.removeItem('refreshToken');
      storage.removeItem('authUser');
    }
    navigate('/login', { replace: true });
  }

  return (
    <AdminShell
      activeSection={activeSection}
      currentUser={access.user}
      onSectionChange={setActiveSection}
      onHome={() => navigate('/home')}
      onLogout={handleLogout}
    >
      {activeSection === 'users' ? (
        <AdminUsersSection onToast={setToast} />
      ) : activeSection === 'dashboard' ? (
        <AdminDashboardSection />
      ) : activeSection === 'requests' ? (
        <AdminRequestsSection onToast={setToast} />
      ) : activeSection === 'permissions' ? (
        <AdminPermissionsSection />
      ) : activeSection === 'audit' ? (
        <AdminAuditSection onToast={setToast} />
      ) : (
        <section className="admin-section-placeholder">
          <p className="admin-page-eyebrow">Admin Console</p>
          <h1>Đang chuẩn bị khu vực {activeSection}</h1>
          <p>Các nghiệp vụ hiện tại vẫn hoạt động trên màn hình Admin cũ trong giai đoạn chuyển đổi.</p>
        </section>
      )}
      {toast ? <div className={`admin-toast admin-toast--${toast.type}`} role="status">{toast.message}</div> : null}
    </AdminShell>
  );
}
