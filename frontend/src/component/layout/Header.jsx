import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import { Search } from "lucide-react";
import { fetchHeaderProfile } from "../../api/profileApi";
import { logoutAccount } from "../../api/authApi";
import UserMenuPopup from "./UserMenuPopup";

export const SIDEBAR_WIDTH = 260;

function getStoredAuthUser() {
  try {
    const raw = localStorage.getItem("authUser") || sessionStorage.getItem("authUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getRoleLabel(roles = []) {
  if (roles.includes("ADMIN")) return "Admin";
  if (roles.includes("LIBRARIAN")) return "Librarian";
  if (roles.includes("MEMBER")) return "Member";
  return "";
}

function getInitials(name, email) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length > 0) {
    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");
  }

  return String(email || "").charAt(0).toUpperCase();
}

export default function Header() {
  const navigate = useNavigate();
  const storedUser = getStoredAuthUser();
  const [anchorEl, setAnchorEl] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const data = await fetchHeaderProfile();
        if (isMounted) {
          setProfile(data);
        }
      } catch {
        // ponytail: keep header usable with stored auth data if profile fetch fails.
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const displayName = profile?.fullName || storedUser?.email || "";
  const roleLabel = getRoleLabel(storedUser?.roles || []);
  const initials = getInitials(profile?.fullName, storedUser?.email);
  const avatarUrl = profile?.avatarUrl || "";

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleAccountInfo = () => {
    navigate("/profile");
  };

  const handleBorrowingHistory = () => {
    navigate("/borrowing/history");
  };

  const handleMembership = () => {
    navigate("/membership");
  };

  const handleLogout = async () => {
    const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken");

    try {
      if (accessToken && refreshToken) {
        await logoutAccount({ accessToken, refreshToken });
      }
    } catch {
      // ponytail: local sign-out still wins if the API logout call fails.
    } finally {
      for (const storage of [localStorage, sessionStorage]) {
        storage.removeItem("accessToken");
        storage.removeItem("refreshToken");
        storage.removeItem("authUser");
      }
      navigate("/login");
    }
  };

  return (
    <header className="app-topbar">
      <div className="app-search">
        <Search size={18} />
        <input type="text" placeholder="Search books, members, loans..." aria-label="Search" />
      </div>

      <div className="app-topbar-actions">
        <button
          type="button"
          className="app-user-trigger"
          onClick={handleOpenMenu}
          aria-label="Open user menu"
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
        onClose={handleCloseMenu}
        name={displayName}
        role={roleLabel}
        initials={initials}
        avatarUrl={avatarUrl}
        onAccountInfo={handleAccountInfo}
        onBorrowingHistory={handleBorrowingHistory}
        onMembership={handleMembership}
        onLogout={handleLogout}
      />
    </header>
  );
}
