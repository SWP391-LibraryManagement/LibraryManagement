import { useNavigate } from 'react-router-dom';
import BlockIcon from '@mui/icons-material/Block';
import HomeIcon from '@mui/icons-material/Home';

import AppLayout from '../../component/layout/AppLayout';

function getStoredRoles() {
  try {
    const raw = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
    const roles = raw ? JSON.parse(raw).roles : null;
    return Array.isArray(roles) ? roles : [];
  } catch {
    return [];
  }
}

function ForbiddenContent() {
  const navigate = useNavigate();

  return (
    <div className="lib-card" style={{ maxWidth: 680 }}>
      <div className="row-flex" style={{ alignItems: 'flex-start', gap: 16 }}>
        <span className="kpi-icon" style={{ color: 'var(--st-red)', background: 'var(--st-red-bg)' }}>
          <BlockIcon fontSize="small" />
        </span>
        <div>
          <h1 className="ph-title" style={{ marginBottom: 8 }}>403 Forbidden</h1>
          <p className="ph-sub" style={{ marginBottom: 18 }}>
            Tài khoản của bạn không có quyền truy cập trang này.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/home')}>
            <HomeIcon fontSize="small" /> Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ForbiddenPage() {
  const roles = getStoredRoles();

  if (roles.length > 0) {
    return (
      <AppLayout title="Không có quyền truy cập" subtitle="Mã lỗi 403">
        <ForbiddenContent />
      </AppLayout>
    );
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <ForbiddenContent />
    </main>
  );
}
