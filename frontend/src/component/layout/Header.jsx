import Avatar from '@mui/material/Avatar';
import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { logoutAccount } from '../../api/authApi';
import { fetchHeaderProfile } from '../../api/profileApi';
import { getRoleLabel } from '../../utils/uiLabels';
import UserMenuPopup from './UserMenuPopup';

function getStoredAuthUser() {
  try {
    const raw = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getInitials(name, email) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length > 0) {
    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('');
  }

  return String(email || '').charAt(0).toUpperCase();
}

export default function Header({ onOpenNavigation, navigationOpen = false }) {
  const navigate = useNavigate();
  const storedUser = getStoredAuthUser();
  const [anchorEl, setAnchorEl] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const data = await fetchHeaderProfile();
        if (isMounted) setProfile(data);
      } catch {
        // Keep the header usable with stored auth data when profile loading fails.
      }
    }

    loadProfile();
    return () => { isMounted = false; };
  }, []);

  const displayName = profile?.fullName || storedUser?.email || 'Tài khoản';
  const storedRoles = storedUser?.roles || [];
  const primaryRole = ['ADMIN', 'LIBRARIAN', 'MEMBER'].find((role) => storedRoles.includes(role));
  const roleLabel = getRoleLabel(primaryRole);
  const showMemberActions = storedRoles.includes('MEMBER')
    && !storedRoles.some((role) => ['ADMIN', 'LIBRARIAN'].includes(role));
  const initials = getInitials(profile?.fullName, storedUser?.email) || 'T';
  const avatarUrl = profile?.avatarUrl || '';

  const handleLogout = async () => {
    const accessToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');

    try {
      if (accessToken && refreshToken) await logoutAccount({ accessToken, refreshToken });
    } catch {
      // Local sign-out still wins if the API logout call fails.
    } finally {
      for (const storage of [localStorage, sessionStorage]) {
        storage.removeItem('accessToken');
        storage.removeItem('refreshToken');
        storage.removeItem('authUser');
      }
      navigate('/login');
    }
  };

  return (
    <header className="app-topbar">
      {onOpenNavigation && (
        <button
          type="button"
          className="app-icon-btn app-menu-trigger"
          onClick={onOpenNavigation}
          aria-label="Mở điều hướng"
          aria-controls="app-navigation"
          aria-expanded={navigationOpen}
        >
          <Menu size={20} />
        </button>
      )}

      <div className="app-topbar-actions">
        <button
          type="button"
          className="app-user-trigger"
          onClick={(event) => setAnchorEl(event.currentTarget)}
          aria-label="Mở menu tài khoản"
        >
          <div className="app-user-copy">
            <span className="app-user-name">{displayName}</span>
            <span className="app-user-role">{roleLabel}</span>
          </div>
          <Avatar
            src={avatarUrl || undefined}
            className="app-avatar app-avatar-image"
            sx={{ width: 40, height: 40 }}
          >
            {initials}
          </Avatar>
        </button>
      </div>

      <UserMenuPopup
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        name={displayName}
        role={roleLabel}
        initials={initials}
        avatarUrl={avatarUrl}
        showMemberActions={showMemberActions}
        onAccountInfo={() => navigate('/profile')}
        onAdminConsole={storedRoles.includes('ADMIN') ? () => navigate('/admin/users') : undefined}
        onLibrarianConsole={storedRoles.includes('LIBRARIAN') && !storedRoles.includes('ADMIN') ? () => navigate('/home') : undefined}
        onBorrowingHistory={() => navigate('/borrowing/history')}
        onMembership={() => navigate('/membership')}
        onLogout={handleLogout}
      />
    </header>
  );
}
