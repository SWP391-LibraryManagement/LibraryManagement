import Inventory2Icon from '@mui/icons-material/Inventory2';
import { Navigate } from 'react-router-dom';

import InventoryManagement from '../component/inventory/InventoryManagement';
import AppLayout from '../component/layout/AppLayout';

function getCurrentRoles() {
  try {
    const raw = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
    const roles = raw ? JSON.parse(raw).roles : null;
    return Array.isArray(roles) ? roles.map((role) => String(role).toUpperCase()) : null;
  } catch {
    return null;
  }
}

export default function InventoryPage() {
  const roles = getCurrentRoles();

  if (!roles) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.some((role) => ['ADMIN', 'LIBRARIAN'].includes(role))) {
    return <Navigate to="/home" replace />;
  }

  return (
    <AppLayout
      active="inventory-management"
      title="Quản lý kho sách"
      subtitle="Theo dõi đầu sách, bản sao vật lý, barcode, vị trí và trạng thái lưu thông."
      actions={<span className="stat-chip"><Inventory2Icon fontSize="small" /> FE06</span>}
    >
      <InventoryManagement />
    </AppLayout>
  );
}
