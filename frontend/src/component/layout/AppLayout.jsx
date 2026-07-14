/**
 * AppLayout
 * Khung dùng chung cho các màn nội bộ (sidebar + topbar) của FE07/FE08/FE10/FE12.
 * Dùng lucide-react + class trong src/styles/app-shell.css (theme thư viện kem/be).
 *
 * Props:
 *  - active:   key của mục nav đang mở (vd "borrowing-history")
 *  - title:    tiêu đề trang
 *  - subtitle: mô tả ngắn dưới tiêu đề
 *  - actions:  node hiển thị bên phải header (nút...) - tuỳ chọn
 *  - children: nội dung trang
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  LayoutDashboard,
  BookMarked,
  History,
  Bookmark,
  ClipboardList,
  PackageCheck,
  Users,
  CalendarClock,
  BarChart2,
  Boxes,
  UserCog,
  User,
  LogOut,
} from 'lucide-react';

import LogoutConfirmModal from './LogoutConfirmModal';

const NAV_GROUPS = [
  {
    label: 'Member',
    roles: ['MEMBER'],
    items: [
      { key: 'borrow-request', label: 'My Borrows', icon: BookMarked, path: '/borrowing/new' },
      { key: 'membership', label: 'Membership', icon: UserCog, path: '/membership' },
      { key: 'borrowing-history', label: 'Borrowing History', icon: History, path: '/borrowing/history' },
      { key: 'my-reservations', label: 'My Reservations', icon: Bookmark, path: '/reservations/mine' },
    ],
  },
  {
    label: 'Librarian',
    roles: ['LIBRARIAN', 'ADMIN'],
    items: [
      { key: 'borrow-requests-admin', label: 'Borrow Requests', icon: ClipboardList, path: '/librarian/borrow-requests' },
      { key: 'process-returns', label: 'Process Returns', icon: PackageCheck, path: '/librarian/returns' },
      { key: 'reservations-librarian', label: 'Reservations', icon: CalendarClock, path: '/librarian/reservations' },
      { key: 'membership-review', label: 'Membership', icon: UserCog, path: '/librarian/membership' },
      { key: 'member-details', label: 'Member Details', icon: Users, path: '/librarian/members' },
    ],
  },
  {
    label: 'Reports',
    roles: ['LIBRARIAN', 'ADMIN'],
    items: [
      { key: 'borrowing-report', label: 'Borrowing Report', icon: BarChart2, path: '/reports/borrowing' },
      { key: 'inventory-report', label: 'Inventory Report', icon: Boxes, path: '/reports/inventory' },
      { key: 'user-statistics', label: 'User Statistics', icon: UserCog, path: '/reports/users' },
    ],
  },
];

// Vai trò của người dùng hiện tại, đọc từ token đã lưu khi đăng nhập.
function getCurrentRoles() {
  try {
    const raw = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
    const roles = raw ? JSON.parse(raw).roles : null;
    return Array.isArray(roles) ? roles : [];
  } catch {
    return [];
  }
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function AppLayout({ active, title, subtitle, actions, children }) {
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);
  const currentUser = getCurrentUser();
  const roles = getCurrentRoles();
  const avatarInitial = String(currentUser?.email || 'TV').charAt(0).toUpperCase();
  // Chỉ hiển thị nhóm menu mà vai trò hiện tại được phép xem (khớp RBAC backend).
  const visibleGroups = NAV_GROUPS.filter((group) =>
    group.roles.some((role) => roles.includes(role))
  );

  function handleLogout() {
    for (const storage of [localStorage, sessionStorage]) {
      storage.removeItem('accessToken');
      storage.removeItem('refreshToken');
      storage.removeItem('authUser');
    }
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div
          className="app-brand"
          onClick={() => navigate('/home')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              navigate('/home');
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Go home"
        >
          <span className="app-brand-mark"><BookOpen size={20} /></span>
          <span className="app-brand-text">Library<br />Management</span>
        </div>

        <nav className="app-nav">
          <button
            type="button"
            className="app-nav-item"
            onClick={() => navigate('/home')}
            aria-label="Home"
          >
            <LayoutDashboard size={18} />
            <span>Home</span>
          </button>
          <button
            type="button"
            className={`app-nav-item${active === 'profile' ? ' active' : ''}`}
            onClick={() => navigate('/profile')}
            aria-label="Thông tin cá nhân"
            aria-current={active === 'profile' ? 'page' : undefined}
          >
            <User size={18} />
            <span>Thông tin cá nhân</span>
          </button>

          {visibleGroups.map((group) => (
            <div className="app-nav-group" key={group.label}>
              {group.label !== 'Member' && <div className="app-nav-label">{group.label}</div>}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.key === active;
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`app-nav-item${isActive ? ' active' : ''}`}
                    onClick={() => navigate(item.path)}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="app-sidebar-footer">
          <button type="button" className="app-nav-item" onClick={() => setShowLogout(true)} aria-label="Logout">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="app-search">
            <Search size={18} />
            <input type="text" placeholder="Search books, members, loans..." aria-label="Search" />
          </div>
          <div className="app-topbar-actions">
            <div className="app-avatar app-layout-avatar">{avatarInitial}</div>
          </div>
        </header>

        <main className="app-content">
          {(title || actions) && (
            <div className="ph">
              <div>
                {title && <h1 className="ph-title">{title}</h1>}
                {subtitle && <p className="ph-sub">{subtitle}</p>}
              </div>
              {actions && <div className="ph-actions">{actions}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
      {showLogout && <LogoutConfirmModal onClose={() => setShowLogout(false)} onConfirm={handleLogout} />}
    </div>
  );
}
