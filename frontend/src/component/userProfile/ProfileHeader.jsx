import PersonIcon from "@mui/icons-material/Person";

const statusConfig = {
  ACTIVE: { label: "Hoạt động", className: "bg-emerald-100 text-emerald-800 border border-emerald-200" },
  INACTIVE: { label: "Ngừng hoạt động", className: "bg-gray-100 text-gray-600 border border-gray-200" },
  LOCKED: { label: "Bị khóa", className: "bg-red-100 text-red-700 border border-red-200" },
};

/** Dữ liệu cần thiết để render phần header của profile */
export default function ProfileHeader({
  fullName,
  username,
  avatarUrl,
  status,
}) {
  const { label: statusLabel, className: statusClass } =
    statusConfig[status] || statusConfig.INACTIVE;
  const displayName = fullName || username || "Người dùng";

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
      {/* Banner gradient — navy to navy-dark */}
      <div
        className="h-36 w-full"
        style={{
          background: "linear-gradient(135deg, #1B3A6B 0%, #0D2247 60%, #C9752A 100%)",
        }}
      />

      {/* Avatar + identity row */}
      <div className="px-8 pb-8 -mt-14">
        <div className="flex flex-col sm:flex-row sm:items-end gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-2xl ring-4 ring-card shadow-lg overflow-hidden bg-secondary">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary">
                  <PersonIcon className="text-primary" style={{ fontSize: 48 }} />
                </div>
              )}
            </div>
            {/* Online dot */}
            {status === "ACTIVE" && (
              <span className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-card rounded-full" />
            )}
          </div>

          {/* Name + badges */}
          <div className="flex-1 min-w-0 mb-1">
            <h1
              className="text-2xl text-foreground leading-tight truncate"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              {displayName}
            </h1>

            {username && (
              <p className="text-sm text-muted-foreground font-mono mt-0.5">@{username}</p>
            )}

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {/* Account status */}
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${statusClass}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                {statusLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
