import PersonIcon from "@mui/icons-material/Person";

const statusConfig = {
  ACTIVE:   { label: "Hoạt động",        className: "ph-badge-active" },
  INACTIVE: { label: "Ngừng hoạt động",  className: "ph-badge-inactive" },
  LOCKED:   { label: "Bị khóa",          className: "ph-badge-locked" },
};

/** Dữ liệu cần thiết để render phần header của profile */
export default function ProfileHeader({ fullName, username, avatarUrl, status }) {
  const { label: statusLabel, className: statusClass } =
    statusConfig[status] || statusConfig.INACTIVE;
  const displayName = fullName || username || "Người dùng";

  return (
    <div className="ph-card">
      {/* Banner gradient */}
      <div className="ph-banner" />

      {/* Avatar + identity row */}
      <div className="ph-body">
        <div className="ph-identity-row">
          {/* Avatar */}
          <div className="ph-avatar-wrap">
            <div className="ph-avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} />
              ) : (
                <PersonIcon className="ph-avatar-icon" />
              )}
            </div>
            {status === "ACTIVE" && <span className="ph-online-dot" />}
          </div>

          {/* Name + badges */}
          <div className="ph-info">
            <h1 className="ph-name">{displayName}</h1>
            {username && <p className="ph-username">@{username}</p>}
            <div className="ph-badges">
              <span className={`ph-badge ${statusClass}`}>
                <span className="ph-badge-dot" />
                {statusLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
