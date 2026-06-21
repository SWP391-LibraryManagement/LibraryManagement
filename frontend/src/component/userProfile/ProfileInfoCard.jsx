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
    <li className="info-row">
      <div className="info-icon-wrap">{icon}</div>
      <div>
        <p className="info-label">{label}</p>
        <p className="info-value">{value}</p>
      </div>
    </li>
  );
}

/** Component hiển thị thông tin chi tiết của người dùng */
export default function ProfileInfoCard({
  email,
  phone,
  dateOfBirth,
  address,
  memberId,
}) {
  const formattedDob = format(new Date(dateOfBirth), "dd MMMM, yyyy", { locale: vi });

  return (
    <div className="lms-card info-card">
      <h2 className="info-card-title">Thông tin cá nhân</h2>

      <ul className="info-list">
        <InfoRow
          icon={<BadgeIcon fontSize="small" />}
          label="Mã hội viên"
          value={memberId}
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
      </ul>
    </div>
  );
}