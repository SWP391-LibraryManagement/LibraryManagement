import { useState } from "react";
import EditIcon from "@mui/icons-material/Edit";
import LockResetIcon from "@mui/icons-material/LockReset";
import LogoutIcon from "@mui/icons-material/Logout";
import CloseIcon from "@mui/icons-material/Close";

function LogoutDialog({ onClose }) {
  return (
    <div className="ld-overlay">
      <div className="ld-backdrop" onClick={onClose} />

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

export default function ProfileActions({ onEditProfile, onChangePassword }) {
  const [showLogout, setShowLogout] = useState(false);

  return (
    <>
      <div className="pa-card">
        <h2 className="pa-title">
          <span className="pa-title-bar" />
          Thao tác
        </h2>

        <div className="pa-actions">
          <button onClick={onEditProfile} className="pa-btn pa-btn-primary">
            <EditIcon fontSize="small" />
            <span>Chỉnh sửa hồ sơ</span>
            <span className="pa-btn-arrow">→</span>
          </button>

          <button type="button" onClick={onChangePassword} className="pa-btn pa-btn-secondary">
            <LockResetIcon fontSize="small" />
            <span>Đổi mật khẩu</span>
            <span className="pa-btn-arrow">→</span>
          </button>

          <hr className="pa-divider" />

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
