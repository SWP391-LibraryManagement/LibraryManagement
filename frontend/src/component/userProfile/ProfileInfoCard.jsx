import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import CakeIcon from "@mui/icons-material/Cake";
import HomeIcon from "@mui/icons-material/Home";
import BadgeIcon from "@mui/icons-material/Badge";

/** Một hàng thông tin gồm icon + nhãn + giá trị */
function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-primary shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value || "—"}</p>
      </div>
    </div>
  );
}

/** Card hiển thị thông tin cá nhân của người dùng */
export default function ProfileInfoCard({
  email,
  phone,
  dateOfBirth,
  address,
  userId,
}) {
  const formattedDob = dateOfBirth
    ? new Date(dateOfBirth).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    : null;

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
      <h2
        className="text-base font-semibold text-foreground mb-4 flex items-center gap-2"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <span className="w-1 h-4 rounded-full bg-accent inline-block" />
        Thông tin cá nhân
      </h2>

      <div className="divide-y divide-border">
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
          icon={<HomeIcon fontSize="small" />}
          label="Địa chỉ"
          value={address}
        />
        <InfoRow
          icon={<BadgeIcon fontSize="small" />}
          label="Mã người dùng"
          value={userId}
        />
      </div>
    </div>
  );
}
