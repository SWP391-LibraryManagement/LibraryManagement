import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import PersonIcon from "@mui/icons-material/Person";

const statusConfig = {
  ACTIVE:   { label: "Hoạt động",       cls: "badge-active"   },
  INACTIVE: { label: "Ngừng hoạt động", cls: "badge-inactive" },
  LOCKED:   { label: "Bị khóa",          cls: "badge-locked"   },
};

export default function ProfileHeader({
  fullName,
  username,
  avatarUrl,
  status,
  membershipStatus,
}) {
  const { label: statusLabel, cls: statusCls } = statusConfig[status];
  const isMember = membershipStatus === "APPROVED";

  return (
    <div className="lms-card">
      {/* Hero banner — bo góc trên bằng CSS riêng */}
      <div className="profile-banner" />

      {/* Avatar + thông tin định danh */}
      <div className="profile-identity">
        {/* Avatar với online dot */}
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt={fullName} />
            ) : (
              <PersonIcon style={{ fontSize: 48, color: "#1b3a6b" }} />
            )}
          </div>
          {status === "ACTIVE" && <span className="profile-online-dot" />}
        </div>

        {/* Tên, username, badges */}
        <div className="profile-identity-info">
          <h1 className="profile-name">{fullName}</h1>
          <p className="profile-username">@{username}</p>

          <div className="profile-badges">
            {/* Trạng thái tài khoản */}
            <span className={`badge-status ${statusCls}`}>
              <span className="dot" />
              {statusLabel}
            </span>

            {/* Trạng thái hội viên */}
            <span className={`badge-member ${isMember ? "badge-member-approved" : "badge-member-pending"}`}>
              {isMember
                ? <VerifiedUserIcon style={{ fontSize: 13 }} />
                : <HourglassEmptyIcon style={{ fontSize: 13 }} />}
              {isMember ? "Hội viên" : "Chờ duyệt"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}