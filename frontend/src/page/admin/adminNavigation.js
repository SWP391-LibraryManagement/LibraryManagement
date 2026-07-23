import {
  BookCopy,
  ClipboardList,
  Home,
  LayoutDashboard,
  Library,
  UserCheck,
  Users,
} from 'lucide-react';

export const ADMIN_NAVIGATION = Object.freeze([
  { id: 'home', icon: Home, label: 'Trang chủ', path: '/home' },
  { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
  { id: 'library', icon: Library, label: 'Thư viện' },
  { id: 'circulation', icon: BookCopy, label: 'Quản lý mượn trả' },
  { id: 'requests', icon: ClipboardList, label: 'Quản lý yêu cầu' },
  { id: 'users', icon: Users, label: 'Quản lý người dùng' },
  { id: 'membership', icon: UserCheck, label: 'Duyệt hội viên' },
  { id: 'audit', icon: ClipboardList, label: 'Nhật ký hoạt động' },
]);
