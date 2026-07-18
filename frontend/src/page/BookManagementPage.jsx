import { Navigate } from 'react-router-dom';

import AppLayout from '../component/layout/AppLayout';
import BookManagement from './BookManagement';

function getCurrentRoles() {
  try {
    const raw = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
    const roles = raw ? JSON.parse(raw).roles : null;
    return Array.isArray(roles) ? roles.map((role) => String(role).toUpperCase()) : null;
  } catch {
    return null;
  }
}

export default function BookManagementPage() {
  const roles = getCurrentRoles();

  if (!roles) return <Navigate to="/login" replace />;
  if (!roles.some((role) => ['ADMIN', 'LIBRARIAN'].includes(role))) {
    return <Navigate to="/home" replace />;
  }

  return (
    <AppLayout
      title="Quản lý sách"
      subtitle="Quản lý thông tin đầu sách, tác giả, danh mục và nhà xuất bản."
    >
      <BookManagement />
    </AppLayout>
  );
}
