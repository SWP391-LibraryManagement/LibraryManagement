import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { readStoredAdminAccess } from './adminAccess';
import './admin-console.css';
import { AdminShell } from './components/AdminShell';
import { AdminDashboardSection } from './dashboard/AdminDashboardSection';

export default function AdminConsolePage() {
  const navigate = useNavigate();
  const access = readStoredAdminAccess();
  const [activeSection, setActiveSection] = useState('users');

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
      {activeSection === 'dashboard' ? (
        <AdminDashboardSection />
      ) : (
        <section className="admin-section-placeholder">
          <p className="admin-page-eyebrow">Admin Console</p>
          <h1>Đang chuẩn bị khu vực {activeSection}</h1>
          <p>Các nghiệp vụ hiện tại vẫn hoạt động trên màn hình Admin cũ trong giai đoạn chuyển đổi.</p>
        </section>
      )}
    </AdminShell>
  );
}
