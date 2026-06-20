import { useState } from "react";
import EditIcon      from "@mui/icons-material/Edit";
import LockResetIcon from "@mui/icons-material/LockReset";
import LogoutIcon    from "@mui/icons-material/Logout";
import CloseIcon     from "@mui/icons-material/Close";

/** Modal xác nhận đăng xuất */
function LogoutDialog({ onClose }) {
  return (
    <div className="ld-overlay">
      {/* Backdrop */}
      <div className="ld-backdrop" onClick={onClose} />

      {/* Dialog box */}
      <div className="ld-dialog">
        <button onClick={onClose} className="ld-close-btn" aria-label="Đóng">
          <CloseIcon fontSize="small" />
        </button>

        <div className="ld-icon-wrap">
          <LogoutIcon />
        </div>

        <h3 className="ld-heading">Đăng xuất?</h3>
        <p className="ld-desc">
          Bạn sẽ được chuyển về trang đăng nhập. Mọi phiên làm việc hiện tại sẽ kết thúc.
        </p>

        <div className="ld-actions">
          <button onClick={onClose} className="ld-btn ld-btn-cancel">
            Hủy
          </button>
          <button onClick={onClose} className="ld-btn ld-btn-confirm">
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}

/** Các hành động khả dụng cho người dùng trên trang profile */
export default function ProfileActions({ username }) {
  const [showLogout, setShowLogout] = useState(false);

  const handleEditProfile = () => {
    /* TODO: navigate to edit page or open edit modal */
    alert(`Mở form chỉnh sửa cho @${username}`);
  };

  const handleChangePassword = () => {
    /* TODO: navigate to change-password flow */
    alert("Mở form đổi mật khẩu");
  };

  return (
    <>
      <div className="pa-card">
        <h2 className="pa-title">
          <span className="pa-title-bar" />
          Thao tác
        </h2>

        <div className="pa-actions">
          {/* Edit Profile */}
          <button onClick={handleEditProfile} className="pa-btn pa-btn-primary">
            <EditIcon fontSize="small" />
            <span>Chỉnh sửa hồ sơ</span>
            <span className="pa-btn-arrow">→</span>
          </button>

          {/* Change Password */}
          <button onClick={handleChangePassword} className="pa-btn pa-btn-secondary">
            <LockResetIcon fontSize="small" />
            <span>Đổi mật khẩu</span>
            <span className="pa-btn-arrow">→</span>
          </button>

          <hr className="pa-divider" />

          {/* Logout */}
          <button onClick={() => setShowLogout(true)} className="pa-btn pa-btn-danger">
            <LogoutIcon fontSize="small" />
            <span>Đăng xuất</span>
            <span className="pa-btn-arrow">→</span>
          </button>
        </div>
      </div>

      {showLogout && <LogoutDialog onClose={() => setShowLogout(false)} />}
    </>
  );
}