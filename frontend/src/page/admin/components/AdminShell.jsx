import { LogOut, Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { ADMIN_NAVIGATION } from '../adminNavigation';

function AdminNavigation({ activeSection, onNavigate }) {
  return (
    <nav className="admin-shell__navigation" aria-label="Điều hướng quản trị">
      {ADMIN_NAVIGATION.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          className="admin-shell__nav-item"
          type="button"
          aria-current={id !== 'home' && activeSection === id ? 'page' : undefined}
          onClick={() => onNavigate(id)}
        >
          <Icon aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

export function AdminShell({
  activeSection,
  currentUser,
  onSectionChange,
  onHome,
  onLogout,
  children,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const mobilePanelRef = useRef(null);

  function closeMobilePanel({ restoreFocus = false } = {}) {
    setMobileOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => menuButtonRef.current?.focus());
    }
  }

  function handleNavigate(section) {
    if (section === 'home') onHome();
    else onSectionChange(section);
    closeMobilePanel();
  }

  useEffect(() => {
    if (!mobileOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') closeMobilePanel({ restoreFocus: true });
    }

    document.addEventListener('keydown', handleKeyDown);
    mobilePanelRef.current?.querySelector('button')?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  const displayName = currentUser?.fullName || currentUser?.name || currentUser?.email || 'Quản trị viên';

  return (
    <div className="admin-console admin-shell">
      <aside className="admin-shell__sidebar">
        <div className="admin-shell__brand">
          <span className="admin-shell__brand-mark" aria-hidden="true">L</span>
          <div>
            <strong>Library Admin</strong>
            <span>Không gian vận hành</span>
          </div>
        </div>
        <AdminNavigation activeSection={activeSection} onNavigate={handleNavigate} />
        <div className="admin-shell__identity">
          <span>{displayName}</span>
          <small>Quản trị viên</small>
          <button type="button" onClick={onLogout}>
            <LogOut aria-hidden="true" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <header className="admin-shell__mobile-header">
        <div className="admin-shell__brand admin-shell__brand--mobile">
          <span className="admin-shell__brand-mark" aria-hidden="true">L</span>
          <strong>Library Admin</strong>
        </div>
        <button
          ref={menuButtonRef}
          className="admin-shell__menu-button"
          type="button"
          aria-label={mobileOpen ? 'Đóng menu quản trị' : 'Mở menu quản trị'}
          aria-expanded={mobileOpen}
          aria-controls="admin-mobile-navigation"
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          <span>Menu</span>
        </button>
      </header>

      {mobileOpen ? (
        <>
          <button
            className="admin-shell__scrim"
            type="button"
            aria-label="Đóng menu quản trị"
            onClick={() => closeMobilePanel({ restoreFocus: true })}
          />
          <aside
            ref={mobilePanelRef}
            id="admin-mobile-navigation"
            className="admin-shell__mobile-panel"
            aria-label="Menu quản trị"
          >
            <AdminNavigation activeSection={activeSection} onNavigate={handleNavigate} />
            <button className="admin-shell__mobile-logout" type="button" onClick={onLogout}>
              <LogOut aria-hidden="true" />
              <span>Đăng xuất</span>
            </button>
          </aside>
        </>
      ) : null}

      <main className="admin-shell__main">{children}</main>
    </div>
  );
}
