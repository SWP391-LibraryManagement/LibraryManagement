import { useState } from "react";
import { useNavigate } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import LockResetIcon from "@mui/icons-material/LockReset";
import LogoutIcon from "@mui/icons-material/Logout";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { requestChangePasswordOtp, confirmChangePassword } from "../../api/profileApi";
import { logoutAccount } from "../../api/authApi";

/* ------------------------------------------------------------------ */
/* ChangePasswordDialog                                                  */
/* ------------------------------------------------------------------ */

const STEP_FORM = "form";   // bước 1: nhập mật khẩu cũ/mới
const STEP_OTP = "otp";    // bước 2: nhập OTP
const STEP_DONE = "done";   // thành công

function StepIndicator({ step }) {
  const step2Done = step === STEP_DONE;
  const step2Active = step === STEP_OTP;

  return (
    <div className="cp-steps">
      <div className={`cp-step ${step === STEP_FORM ? "is-active" : "is-done"}`}>
        <span className="cp-step-num">{step === STEP_FORM ? "1" : "✓"}</span>
        Nhập mật khẩu
      </div>
      <div className="cp-step-connector" />
      <div className={`cp-step ${step2Active ? "is-active" : step2Done ? "is-done" : ""}`}>
        <span className="cp-step-num">{step2Done ? "✓" : "2"}</span>
        Xác nhận OTP
      </div>
    </div>
  );
}

function ChangePasswordDialog({ onClose }) {
  const [step, setStep] = useState(STEP_FORM);

  // Bước 1 — form fields
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [formError, setFormError] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Bước 2 — OTP
  const [otp, setOtp] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isResending, setIsResending] = useState(false);

  /* ---- Handlers ---- */

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormError("");
  }

  async function handleSendOtp(e) {
    e.preventDefault();

    // Validate phía client trước
    if (!form.currentPassword || !form.newPassword || !form.confirmNewPassword) {
      setFormError("Vui lòng điền đầy đủ tất cả các trường.");
      return;
    }
    if (form.newPassword !== form.confirmNewPassword) {
      setFormError("Mật khẩu mới và xác nhận mật khẩu không khớp.");
      return;
    }
    if (form.newPassword.length < 8) {
      setFormError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }

    setIsSendingOtp(true);
    setFormError("");

    try {
      const result = await requestChangePasswordOtp(form);
      setMaskedEmail(result.maskedEmail || "email của bạn");
      setStep(STEP_OTP);
      setOtp("");
      setOtpError("");
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSendingOtp(false);
    }
  }

  async function handleConfirmOtp(e) {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      setOtpError("Vui lòng nhập đúng 6 chữ số OTP.");
      return;
    }

    setIsConfirming(true);
    setOtpError("");

    try {
      await confirmChangePassword({ otp, newPassword: form.newPassword });
      setStep(STEP_DONE);
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setIsConfirming(false);
    }
  }

  async function handleResendOtp() {
    setIsResending(true);
    setOtpError("");
    setOtp("");

    try {
      const result = await requestChangePasswordOtp(form);
      setMaskedEmail(result.maskedEmail || maskedEmail);
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setIsResending(false);
    }
  }

  /* ---- Render ---- */

  return (
    <div className="cp-overlay">
      <div className="cp-backdrop" onClick={step === STEP_DONE ? onClose : undefined} />
      <div className="cp-dialog">
        {/* Header */}
        <div className="cp-header">
          <div className="cp-title-group">
            <h3 className="cp-heading">Đổi mật khẩu</h3>
            <p className="cp-desc">
              {step === STEP_FORM && "Nhập mật khẩu hiện tại và mật khẩu mới."}
              {step === STEP_OTP && "Nhập mã OTP được gửi đến email của bạn."}
              {step === STEP_DONE && "Mật khẩu đã được cập nhật thành công."}
            </p>
          </div>
          <button
            type="button"
            className="cp-close-btn"
            onClick={onClose}
            aria-label="Đóng"
            disabled={isSendingOtp || isConfirming}
          >
            <CloseIcon fontSize="small" />
          </button>
        </div>

        {/* Step indicator */}
        {step !== STEP_DONE && <StepIndicator step={step} />}

        {/* ---- Bước 1: Form ---- */}
        {step === STEP_FORM && (
          <form onSubmit={handleSendOtp} noValidate>
            {formError && <div className="cp-error">{formError}</div>}

            <label className="cp-field">
              <span>Mật khẩu hiện tại</span>
              <input
                type="password"
                name="currentPassword"
                value={form.currentPassword}
                onChange={handleFormChange}
                placeholder="Nhập mật khẩu hiện tại"
                autoComplete="current-password"
                maxLength={255}
                disabled={isSendingOtp}
              />
            </label>

            <label className="cp-field">
              <span>Mật khẩu mới</span>
              <input
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleFormChange}
                placeholder="Tối thiểu 8 ký tự"
                autoComplete="new-password"
                maxLength={255}
                disabled={isSendingOtp}
              />
            </label>

            <label className="cp-field">
              <span>Xác nhận mật khẩu mới</span>
              <input
                type="password"
                name="confirmNewPassword"
                value={form.confirmNewPassword}
                onChange={handleFormChange}
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
                maxLength={255}
                disabled={isSendingOtp}
              />
            </label>

            <div className="cp-actions">
              <button
                type="button"
                className="cp-btn cp-btn-cancel"
                onClick={onClose}
                disabled={isSendingOtp}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="cp-btn cp-btn-primary"
                disabled={isSendingOtp}
              >
                {isSendingOtp ? "Đang gửi..." : "Gửi mã OTP"}
              </button>
            </div>
          </form>
        )}

        {/* ---- Bước 2: OTP ---- */}
        {step === STEP_OTP && (
          <form onSubmit={handleConfirmOtp} noValidate>
            <p className="cp-email-hint">
              Mã OTP đã được gửi đến <strong>{maskedEmail}</strong>.
              Mã có hiệu lực trong <strong>10 phút</strong>.
            </p>

            {otpError && <div className="cp-error">{otpError}</div>}

            <label className="cp-field">
              <span>Mã OTP (6 chữ số)</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                className="cp-otp-input"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setOtpError("");
                }}
                placeholder="_ _ _ _ _ _"
                autoComplete="one-time-code"
                disabled={isConfirming}
              />
            </label>

            <div className="cp-resend">
              <span>Chưa nhận được mã?</span>
              <button
                type="button"
                className="cp-resend-btn"
                onClick={handleResendOtp}
                disabled={isResending || isConfirming}
              >
                {isResending ? "Đang gửi lại..." : "Gửi lại"}
              </button>
            </div>

            <div className="cp-actions">
              <button
                type="button"
                className="cp-btn cp-btn-cancel"
                onClick={() => setStep(STEP_FORM)}
                disabled={isConfirming}
              >
                Quay lại
              </button>
              <button
                type="submit"
                className="cp-btn cp-btn-primary"
                disabled={isConfirming || otp.length !== 6}
              >
                {isConfirming ? "Đang xác nhận..." : "Xác nhận đổi mật khẩu"}
              </button>
            </div>
          </form>
        )}

        {/* ---- Bước 3: Thành công ---- */}
        {step === STEP_DONE && (
          <div style={{ textAlign: "center", padding: "0.5rem 0 0.25rem" }}>
            <CheckCircleIcon style={{ fontSize: 48, color: "#10b981", marginBottom: "0.75rem" }} />
            <div className="cp-success">
              Mật khẩu đã được đổi thành công! Vui lòng sử dụng mật khẩu mới cho lần đăng nhập tiếp theo.
            </div>
            <div className="cp-actions" style={{ justifyContent: "center" }}>
              <button type="button" className="cp-btn cp-btn-primary" onClick={onClose}>
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* LogoutDialog                                                          */
/* ------------------------------------------------------------------ */

function LogoutDialog({ onClose, onConfirm, isLoggingOut }) {
  return (
    <div className="ld-overlay">
      <div className="ld-backdrop" onClick={!isLoggingOut ? onClose : undefined} />
      <div className="ld-dialog">
        <button className="ld-close-btn" onClick={onClose} aria-label="Đóng" disabled={isLoggingOut}>
          <CloseIcon fontSize="small" />
        </button>

        <div className="ld-icon-wrap">
          <LogoutIcon />
        </div>

        <h3 className="ld-heading">Đăng xuất?</h3>
        <p className="ld-desc">Bạn sẽ được chuyển về trang đăng nhập. Mọi phiên làm việc hiện tại sẽ kết thúc.</p>

        <div className="ld-actions">
          <button className="ld-btn ld-btn-cancel" onClick={onClose} disabled={isLoggingOut}>Hủy</button>
          <button className="ld-btn ld-btn-confirm" onClick={onConfirm} disabled={isLoggingOut}>
            {isLoggingOut ? "Đang xử lý..." : "Đăng xuất"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ProfileActions                                                         */
/* ------------------------------------------------------------------ */

export default function ProfileActions({ onEditProfile }) {
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken");

      if (accessToken && refreshToken) {
        await logoutAccount({ accessToken, refreshToken });
      }
    } catch (err) {
      console.error("Lỗi khi đăng xuất:", err);
    } finally {
      // Xoá token khỏi storage dù có lỗi hay không
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("refreshToken");
      sessionStorage.removeItem("user");

      setIsLoggingOut(false);
      setShowLogout(false);
      navigate("/login");
    }
  };

  return (
    <>
      <div className="pa-card">
        <h2 className="pa-title">
          <span className="pa-title-bar" />
          Thao tác
        </h2>

        <div className="pa-actions">
          {/* Chỉnh sửa hồ sơ */}
          <button className="pa-btn pa-btn-primary" onClick={onEditProfile}>
            <EditIcon fontSize="small" />
            <span>Chỉnh sửa hồ sơ</span>
            <span className="pa-btn-arrow">→</span>
          </button>

          {/* Đổi mật khẩu */}
          <button className="pa-btn pa-btn-secondary" onClick={() => setShowChangePassword(true)}>
            <LockResetIcon fontSize="small" />
            <span>Đổi mật khẩu</span>
            <span className="pa-btn-arrow">→</span>
          </button>

          <hr className="pa-divider" />

          {/* Đăng xuất */}
          <button className="pa-btn pa-btn-danger" onClick={() => setShowLogout(true)}>
            <LogoutIcon fontSize="small" />
            <span>Đăng xuất</span>
            <span className="pa-btn-arrow">→</span>
          </button>
        </div>
      </div>

      {showChangePassword && (
        <ChangePasswordDialog onClose={() => setShowChangePassword(false)} />
      )}

      {showLogout && <LogoutDialog onClose={() => setShowLogout(false)} onConfirm={handleLogoutConfirm} isLoggingOut={isLoggingOut} />}
    </>
  );
}
