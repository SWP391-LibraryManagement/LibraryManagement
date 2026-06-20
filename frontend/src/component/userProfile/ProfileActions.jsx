import { useState } from "react";
import EditIcon from "@mui/icons-material/Edit";
import LockResetIcon from "@mui/icons-material/LockReset";
import LogoutIcon from "@mui/icons-material/Logout";
import CloseIcon from "@mui/icons-material/Close";

/** Modal xác nhận đăng xuất */
function LogoutDialog({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Dialog box */}
      <div className="relative bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm mx-4 p-6 animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Đóng"
        >
          <CloseIcon fontSize="small" />
        </button>

        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-50 text-red-600 mb-4 mx-auto">
          <LogoutIcon />
        </div>
        <h3 className="text-center text-lg font-semibold text-foreground mb-1"
          style={{ fontFamily: "'DM Serif Display', serif" }}>
          Đăng xuất?
        </h3>
        <p className="text-center text-sm text-muted-foreground mb-6">
          Bạn sẽ được chuyển về trang đăng nhập. Mọi phiên làm việc hiện tại sẽ kết thúc.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 active:scale-95 transition-all"
          >
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
      <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
        <h2
          className="text-base font-semibold text-foreground mb-4 flex items-center gap-2"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <span className="w-1 h-4 rounded-full bg-accent inline-block" />
          Thao tác
        </h2>

        <div className="flex flex-col gap-3">
          {/* Edit Profile */}
          <button
            onClick={handleEditProfile}
            className="group flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
          >
            <EditIcon fontSize="small" />
            <span>Chỉnh sửa hồ sơ</span>
            <span className="ml-auto opacity-60 group-hover:opacity-100 transition-opacity">→</span>
          </button>

          {/* Change Password */}
          <button
            onClick={handleChangePassword}
            className="group flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary active:scale-[0.98] transition-all"
          >
            <LockResetIcon fontSize="small" className="text-muted-foreground" />
            <span>Đổi mật khẩu</span>
            <span className="ml-auto opacity-0 group-hover:opacity-60 transition-opacity">→</span>
          </button>

          {/* Divider */}
          <hr className="border-border my-1" />

          {/* Logout */}
          <button
            onClick={() => setShowLogout(true)}
            className="group flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 active:scale-[0.98] transition-all"
          >
            <LogoutIcon fontSize="small" />
            <span>Đăng xuất</span>
            <span className="ml-auto opacity-0 group-hover:opacity-60 transition-opacity">→</span>
          </button>
        </div>
      </div>

      {showLogout && <LogoutDialog onClose={() => setShowLogout(false)} />}
    </>
  );
}