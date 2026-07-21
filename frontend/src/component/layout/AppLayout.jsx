import { useEffect, useRef, useState } from 'react';
import {
  BarChart2,
  Bookmark,
  BookMarked,
  BookOpen,
  Boxes,
  CalendarClock,
  ClipboardList,
  History,
  Home,
  LayoutDashboard,
  PackageCheck,
  ReceiptText,
  UserCog,
  Users,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  APP_NAV_GROUPS,
  getActiveNavigationKey,
  getVisibleNavigation,
} from '../../utils/appNavigation';
import Header from './Header';
import { PageHeader } from '../shared/OperationalPatterns';

const NAV_ICONS = {
  'library-home': Home,
  home: LayoutDashboard,
  membership: UserCog,
  'borrow-request': BookMarked,
  'borrowing-history': History,
  'my-reservations': Bookmark,
  'my-fines': ReceiptText,
  'borrow-requests-admin': ClipboardList,
  'process-returns': PackageCheck,
  'reservations-librarian': CalendarClock,
  'member-details': Users,
  'membership-review': UserCog,
  'book-management': BookOpen,
  'inventory-management': Boxes,
  'fine-management': ReceiptText,
  'borrowing-report': BarChart2,
  'inventory-report': Boxes,
  'user-statistics': UserCog,
  profile: UserCog,
};

function getCurrentRoles() {
  try {
    const raw = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
    const roles = raw ? JSON.parse(raw).roles : null;
    return Array.isArray(roles) ? roles : [];
  } catch {
    return [];
  }
}

export default function AppLayout({ title, subtitle, actions, children, showSidebar = true, contentClassName = '' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [navigationOpenState, setNavigationOpen] = useState(false);
  const [navigationPath, setNavigationPath] = useState(null);
  const menuTriggerRef = useRef(null);
  const roles = getCurrentRoles();
  const isMember = roles.includes('MEMBER') && !roles.some((role) => ['LIBRARIAN', 'ADMIN'].includes(role));
  const activeKey = getActiveNavigationKey(location.pathname);
  const navigationOpen = navigationOpenState && navigationPath === location.pathname;
  const visibleNavigationKeys = new Set(getVisibleNavigation(roles).map((item) => item.key));
  const visibleGroups = APP_NAV_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => visibleNavigationKeys.has(item.key)),
    }))
    .filter((group) => group.items.length > 0);

  useEffect(() => {
    if (!navigationOpen) return undefined;

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setNavigationOpen(false);
        window.requestAnimationFrame(() => menuTriggerRef.current?.focus());
      }
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [navigationOpen]);

  function closeNavigation({ restoreFocus = false } = {}) {
    setNavigationOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => menuTriggerRef.current?.focus());
    }
  }

  function navigateFromShell(path) {
    closeNavigation();
    navigate(path);
  }

  const HomeIcon = NAV_ICONS.home;
  const LibraryHomeIcon = NAV_ICONS['library-home'];
  const showLibraryHome = visibleNavigationKeys.has('library-home');
  const libraryHomeIsActive = activeKey === 'library-home';
  const homeIsActive = activeKey === 'home';

  return (
    <div className="app-shell">
      {showSidebar && <aside
        id="app-navigation"
        className={`app-sidebar${navigationOpen ? ' app-sidebar-open' : ''}`}
      >
        <button
          type="button"
          className="app-brand"
          onClick={() => navigateFromShell('/home')}
          aria-label="Về trang tổng quan"
        >
          <span className="app-brand-mark"><BookOpen size={20} /></span>
          <span className="app-brand-text">Quản lý<br />thư viện</span>
        </button>

        <nav className="app-nav" aria-label="Điều hướng chính">
          {showLibraryHome && (
            <button
              type="button"
              className={`app-nav-item${libraryHomeIsActive ? ' active' : ''}`}
              onClick={() => navigateFromShell('/homepage')}
              aria-label={isMember ? 'Home' : 'Thư viện'}
              aria-current={libraryHomeIsActive ? 'page' : undefined}
            >
              <LibraryHomeIcon size={18} />
              <span>{isMember ? 'Home' : 'Thư viện'}</span>
            </button>
          )}

          <button
            type="button"
            className={`app-nav-item${homeIsActive ? ' active' : ''}`}
            onClick={() => navigateFromShell('/home')}
            aria-label="Tổng quan"
            aria-current={homeIsActive ? 'page' : undefined}
          >
            <HomeIcon size={18} />
            <span>Tổng quan</span>
          </button>

          {visibleGroups.map((group) => (
            <div className="app-nav-group" key={group.label}>
              <div className="app-nav-label">{group.label}</div>
              {group.items.map((item) => {
                const Icon = NAV_ICONS[item.key];
                const isActive = item.path === location.pathname;
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`app-nav-item${isActive ? ' active' : ''}`}
                    onClick={() => navigateFromShell(item.path)}
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
      </aside>}

      {showSidebar && navigationOpen && (
        <button
          type="button"
          className="app-sidebar-backdrop"
          onClick={() => closeNavigation({ restoreFocus: true })}
          aria-label="Đóng điều hướng"
        />
      )}

      <div className="app-main">
        <Header
          onOpenNavigation={showSidebar ? (event) => {
            menuTriggerRef.current = event.currentTarget;
            if (navigationOpen) {
              closeNavigation();
            } else {
              setNavigationPath(location.pathname);
              setNavigationOpen(true);
            }
          } : undefined}
          navigationOpen={navigationOpen}
        />

        <main className={`app-content ${contentClassName}`.trim()}>
          <PageHeader title={title} subtitle={subtitle} actions={actions} />
          {children}
        </main>
      </div>
    </div>
  );
}
