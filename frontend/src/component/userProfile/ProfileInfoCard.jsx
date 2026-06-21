import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import CakeIcon from "@mui/icons-material/Cake";
import HomeIcon from "@mui/icons-material/Home";
import BadgeIcon from "@mui/icons-material/Badge";

function InfoRow({ icon, label, value }) {
  return (
    <div className="pic-row">
      <div className="pic-row-icon">{icon}</div>
      <div className="pic-row-content">
        <p className="pic-row-label">{label}</p>
        <p className="pic-row-value">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function ProfileInfoCard({ email, phone, dateOfBirth, address, userId }) {
  const formattedDob = dateOfBirth
    ? new Date(dateOfBirth).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  return (
    <div className="pic-card">
      <h2 className="pic-title">
        <span className="pic-title-bar" />
        Thông tin cá nhân
      </h2>
      <div className="pic-rows">
        <InfoRow icon={<EmailIcon fontSize="small" />} label="Email" value={email} />
        <InfoRow icon={<PhoneIcon fontSize="small" />} label="Số điện thoại" value={phone} />
        <InfoRow icon={<CakeIcon fontSize="small" />} label="Ngày sinh" value={formattedDob} />
        <InfoRow icon={<HomeIcon fontSize="small" />} label="Địa chỉ" value={address} />
        <InfoRow icon={<BadgeIcon fontSize="small" />} label="Mã người dùng" value={userId} />
      </div>
    </div>
  );
}
