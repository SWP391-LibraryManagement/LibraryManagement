import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import PersonIcon from "@mui/icons-material/Person";

const statusConfig = {
  ACTIVE:   { label: "Hoạt động",       cls: "ph-badge-active"   },
  INACTIVE: { label: "Ngừng hoạt động", cls: "ph-badge-inactive" },
  LOCKED:   { label: "Bị khóa",         cls: "ph-badge-locked"   },
};

/** Component hiển thị phần header của profile */
export default function ProfileHeader({
  fullName,
  username,
  avatarUrl,
  status,
  membershipStatus,
}) {
  const { label: statusLabel, cls: statusCls } = statusConfig[status] ?? statusConfig.INACTIVE;
  const isMember = membershipStatus === "APPROVED";

  return (
    <div className="ph-card">
      {/* Hero banner */}
      <div className="ph-banner" />

      {/* Avatar + thông tin định danh */}
      <div className="ph-body">
        <div className="ph-identity-row">
          {/* Avatar với online dot */}
          <div className="ph-avatar-wrap">
            <div className="ph-avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt={fullName} />
              ) : (
                <PersonIcon className="ph-avatar-icon" />
              )}
            </div>
            {status === "ACTIVE" && <span className="ph-online-dot" />}
          </div>

          {/* Tên, username, badges */}
          <div className="ph-info">
            <h1 className="ph-name">{fullName}</h1>
            <p className="ph-username">@{username}</p>

            <div className="ph-badges">
              {/* Trạng thái tài khoản */}
              <span className={`ph-badge ${statusCls}`}>
                <span className="ph-badge-dot" />
                {statusLabel}
              </span>

              {/* Trạng thái hội viên */}
              <span className={`ph-badge ${isMember ? "ph-badge-active" : "ph-badge-inactive"}`}>
                {isMember
                  ? <VerifiedUserIcon style={{ fontSize: 13 }} />
                  : <HourglassEmptyIcon style={{ fontSize: 13 }} />}
                {isMember ? "Hội viên" : "Chờ duyệt"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}