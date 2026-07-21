import { BookOpen } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import Header from '../../../component/layout/Header';
import { ADMIN_NAVIGATION } from '../adminNavigation';

function AdminNavigation({ activeSection, onNavigate }) {
  return (
    <nav className="app-nav" aria-label="Điều hướng quản trị">
      <div className="app-nav-group">
        <div className="app-nav-label">Quản trị</div>
        {ADMIN_NAVIGATION.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className={`app-nav-item${id !== 'home' && activeSection === id ? ' active' : ''}`}
            type="button"
            aria-current={id !== 'home' && activeSection === id ? 'page' : undefined}
            onClick={() => onNavigate(id)}
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

export function AdminShell({ activeSection, onSectionChange, onHome, children }) {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const menuTriggerRef = useRef(null);

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

  function handleNavigate(section) {
    if (section === 'home') onHome();
    else onSectionChange(section);
    closeNavigation();
  }

  return (
    <div className="admin-console app-shell">
      <aside id="app-navigation" className={`app-sidebar${navigationOpen ? ' app-sidebar-open' : ''}`}>
        <button type="button" className="app-brand" onClick={onHome} aria-label="Về trang tổng quan">
          <span className="app-brand-mark"><BookOpen size={20} /></span>
          <span className="app-brand-text">Quản lý<br />thư viện</span>
        </button>
        <AdminNavigation activeSection={activeSection} onNavigate={handleNavigate} />
      </aside>

      {navigationOpen ? (
        <button
          type="button"
          className="app-sidebar-backdrop"
          aria-label="Đóng điều hướng"
          onClick={() => closeNavigation({ restoreFocus: true })}
        />
      ) : null}

      <div className="app-main">
        <Header
          onOpenNavigation={(event) => {
            menuTriggerRef.current = event.currentTarget;
            setNavigationOpen((open) => !open);
          }}
          navigationOpen={navigationOpen}
        />
        <main className="app-content admin-shell__main">{children}</main>
      </div>
    </div>
  );
}
