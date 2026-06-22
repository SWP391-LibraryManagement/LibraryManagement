import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CakeIcon from "@mui/icons-material/Cake";
import BadgeIcon from "@mui/icons-material/Badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

/** Một hàng thông tin: icon + nhãn + giá trị */
function InfoRow({ icon, label, value }) {
  return (
    <div className="pic-row">
      <div className="pic-row-icon">{icon}</div>
      <div className="pic-row-content">
        <p className="pic-row-label">{label}</p>
        <p className="pic-row-value">{value ?? "—"}</p>
      </div>
    </div>
  );
}

/** Component hiển thị thông tin chi tiết của người dùng */
export default function ProfileInfoCard({
  email,
  phone,
  dateOfBirth,
  address,
  userId,
}) {
  const formattedDob = dateOfBirth
    ? format(new Date(dateOfBirth), "dd MMMM, yyyy", { locale: vi })
    : "—";

  return (
    <div className="pic-card">
      <h2 className="pic-title">
        <span className="pic-title-bar" />
        Thông tin cá nhân
      </h2>

      <div className="pic-rows">
        <InfoRow
          icon={<BadgeIcon fontSize="small" />}
          label="Mã người dùng"
          value={userId}
        />
        <InfoRow
          icon={<EmailIcon fontSize="small" />}
          label="Email"
          value={email}
        />
        <InfoRow
          icon={<PhoneIcon fontSize="small" />}
          label="Số điện thoại"
          value={phone}
        />
        <InfoRow
          icon={<CakeIcon fontSize="small" />}
          label="Ngày sinh"
          value={formattedDob}
        />
        <InfoRow
          icon={<LocationOnIcon fontSize="small" />}
          label="Địa chỉ"
          value={address}
        />
      </div>
    </div>
  );
}