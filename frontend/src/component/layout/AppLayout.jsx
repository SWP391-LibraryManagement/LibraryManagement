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
  LogOut,
} from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Member',
    items: [
      { key: 'borrow-request', label: 'My Borrows', icon: BookMarked, path: '/borrowing/new' },
      { key: 'borrowing-history', label: 'Borrowing History', icon: History, path: '/borrowing/history' },
      { key: 'my-reservations', label: 'My Reservations', icon: Bookmark, path: '/reservations/mine' },
    ],
  },
  {
    label: 'Librarian',
    items: [
      { key: 'borrow-requests-admin', label: 'Borrow Requests', icon: ClipboardList, path: '/librarian/borrow-requests' },
      { key: 'process-returns', label: 'Process Returns', icon: PackageCheck, path: '/librarian/returns' },
      { key: 'reservations-librarian', label: 'Reservations', icon: CalendarClock, path: '/librarian/reservations' },
      { key: 'member-details', label: 'Member Details', icon: Users, path: '/librarian/members' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { key: 'borrowing-report', label: 'Borrowing Report', icon: BarChart2, path: '/reports/borrowing' },
      { key: 'inventory-report', label: 'Inventory Report', icon: Boxes, path: '/reports/inventory' },
      { key: 'user-statistics', label: 'User Statistics', icon: UserCog, path: '/reports/users' },
    ],
  },
];

export default function AppLayout({ active, title, subtitle, actions, children }) {
  const navigate = useNavigate();

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

          {NAV_GROUPS.map((group) => (
            <div className="app-nav-group" key={group.label}>
              <div className="app-nav-label">{group.label}</div>
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
          <button type="button" className="app-nav-item" onClick={() => navigate('/login')} aria-label="Logout">
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
            <div className="app-avatar">N</div>
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
    </div>
  );
}
