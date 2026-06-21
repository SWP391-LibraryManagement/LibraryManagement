import { useState } from "react";
import EditIcon from "@mui/icons-material/Edit";
import LockResetIcon from "@mui/icons-material/LockReset";
import LogoutIcon from "@mui/icons-material/Logout";
import CloseIcon from "@mui/icons-material/Close";

/** Dialog xác nhận đăng xuất */
function LogoutDialog({ onClose }) {
  return (
    <div className="logout-backdrop" onClick={onClose}>
      {/* Chặn sự kiện click từ nội dung dialog lan ra backdrop */}
      <div className="logout-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="logout-dialog-close" onClick={onClose} aria-label="Đóng">
          <CloseIcon fontSize="small" />
        </button>

        <div className="logout-dialog-icon">
          <LogoutIcon />
        </div>

        <h3>Đăng xuất?</h3>
        <p>Bạn sẽ được chuyển về trang đăng nhập. Mọi phiên làm việc hiện tại sẽ kết thúc.</p>

        <div className="logout-dialog-actions">
          <button className="logout-btn-cancel" onClick={onClose}>Hủy</button>
          <button className="logout-btn-confirm" onClick={onClose}>Đăng xuất</button>
        </div>
      </div>
    </div>
  );
}

export default function ProfileActions({ username }) {
  const [showLogout, setShowLogout] = useState(false);

  const handleEdit = () => alert(`Mở form chỉnh sửa cho @${username}`);
  const handleChangePassword = () => alert("Mở form đổi mật khẩu");

  return (
    <>
      <div className="lms-card actions-card">
        <h2 className="actions-card-title">Thao tác</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {/* Chỉnh sửa hồ sơ */}
          <button className="action-btn action-btn-primary" onClick={handleEdit}>
            <EditIcon fontSize="small" />
            <span>Chỉnh sửa hồ sơ</span>
            <span className="action-btn-arrow">→</span>
          </button>

          {/* Đổi mật khẩu */}
          <button className="action-btn action-btn-secondary" onClick={handleChangePassword}>
            <LockResetIcon fontSize="small" style={{ color: "#6b6b7a" }} />
            <span>Đổi mật khẩu</span>
            <span className="action-btn-arrow">→</span>
          </button>

          <hr className="action-divider" />

          {/* Đăng xuất */}
          <button className="action-btn action-btn-danger" onClick={() => setShowLogout(true)}>
            <LogoutIcon fontSize="small" />
            <span>Đăng xuất</span>
            <span className="action-btn-arrow">→</span>
          </button>
        </div>
      </div>

      {showLogout && <LogoutDialog onClose={() => setShowLogout(false)} />}
    </>
  );
}