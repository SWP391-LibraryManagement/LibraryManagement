import { useEffect, useState } from "react";
import ProfileHeader from "./ProfileHeader";
import ProfileInfoCard from "./ProfileInfoCard";
import ProfileActions from "./ProfileActions";
import LocalLibraryIcon from "@mui/icons-material/LocalLibrary";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { fetchMyProfile, updateMyProfile, uploadMyAvatar } from "../../api/profileApi";
import "../../styles/UserProfile.css";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ALLOWED_AVATAR_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

function toDateInputValue(dateOfBirth) {
  if (!dateOfBirth) {
    return "";
  }

  return String(dateOfBirth).slice(0, 10);
}

function EditProfileDialog({
  profile,
  avatarFile,
  isSaving,
  isUploadingAvatar,
  errorMessage,
  onAvatarChange,
  onAvatarUpload,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <div className="ep-overlay">
      <div className="ep-backdrop" onClick={onClose} />
      <form className="ep-dialog" onSubmit={onSubmit}>
        <div className="ep-header">
          <div>
            <h3 className="ep-heading">Chỉnh sửa hồ sơ</h3>
            <p className="ep-desc">Cập nhật thông tin liên hệ và hồ sơ cá nhân.</p>
          </div>
          <button type="button" className="ep-close-btn" onClick={onClose} aria-label="Đóng">
            ×
          </button>
        </div>

        {errorMessage && <div className="ep-error">{errorMessage}</div>}

        <div className="ep-avatar-upload">
          <div className="ep-avatar-copy">
            <span className="ep-avatar-title">Ảnh đại diện</span>
            <span className="ep-avatar-note">JPG, JPEG, PNG hoặc WebP · tối đa 2 MB</span>
          </div>
          <label className="ep-file-picker">
            <UploadFileIcon fontSize="small" />
            <span>{avatarFile ? avatarFile.name : "Chọn ảnh"}</span>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={onAvatarChange}
              disabled={isSaving || isUploadingAvatar}
            />
          </label>
          <button
            type="button"
            className="ep-btn ep-btn-upload"
            onClick={onAvatarUpload}
            disabled={!avatarFile || isSaving || isUploadingAvatar}
          >
            {isUploadingAvatar ? "Đang tải..." : "Tải ảnh lên"}
          </button>
        </div>

        <label className="ep-field">
          <span>Họ và tên</span>
          <input
            name="fullName"
            value={profile.fullName}
            onChange={onChange}
            maxLength={100}
            placeholder="Nhập họ và tên"
          />
        </label>

        <label className="ep-field">
          <span>Số điện thoại</span>
          <input
            name="phone"
            value={profile.phone}
            onChange={onChange}
            placeholder="VD: 0912345678"
          />
        </label>

        <label className="ep-field">
          <span>Ngày sinh</span>
          <input
            type="date"
            name="dateOfBirth"
            value={profile.dateOfBirth}
            onChange={onChange}
          />
        </label>

        <label className="ep-field">
          <span>Địa chỉ</span>
          <textarea
            name="address"
            value={profile.address}
            onChange={onChange}
            maxLength={255}
            rows={3}
            placeholder="Nhập địa chỉ"
          />
        </label>

        <div className="ep-actions">
          <button type="button" className="ep-btn ep-btn-cancel" onClick={onClose} disabled={isSaving}>
            Hủy
          </button>
          <button type="submit" className="ep-btn ep-btn-save" disabled={isSaving}>
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  );
}

/** Trang User Profile — kết hợp tất cả sub-component */
export default function UserProfile() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [editForm, setEditForm] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [editErrorMessage, setEditErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const data = await fetchMyProfile();

        if (isMounted) {
          setProfile(data);
          setErrorMessage("");
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const openEditProfile = () => {
    setEditForm({
      fullName: profile?.fullName || "",
      phone: profile?.phone || "",
      dateOfBirth: toDateInputValue(profile?.dateOfBirth),
      address: profile?.address || "",
    });
    setAvatarFile(null);
    setEditErrorMessage("");
  };

  const closeEditProfile = () => {
    if (!isSaving && !isUploadingAvatar) {
      setEditForm(null);
      setAvatarFile(null);
      setEditErrorMessage("");
    }
  };

  const handleEditFormChange = (event) => {
    const { name, value } = event.target;
    setEditForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleAvatarFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setEditErrorMessage("");

    if (!file) {
      setAvatarFile(null);
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!ALLOWED_AVATAR_EXTENSIONS.includes(extension)) {
      setAvatarFile(null);
      setEditErrorMessage("Ảnh đại diện chỉ chấp nhận JPG, JPEG, PNG hoặc WebP.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarFile(null);
      setEditErrorMessage("Ảnh đại diện không được vượt quá 2 MB.");
      event.target.value = "";
      return;
    }

    setAvatarFile(file);
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      setEditErrorMessage("Vui lòng chọn ảnh trước khi tải lên.");
      return;
    }

    setIsUploadingAvatar(true);
    setEditErrorMessage("");

    try {
      const updatedProfile = await uploadMyAvatar(avatarFile);
      setProfile(updatedProfile);
      setAvatarFile(null);
    } catch (error) {
      setEditErrorMessage(error.message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleEditProfileSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setEditErrorMessage("");

    try {
      const updatedProfile = await updateMyProfile(editForm);
      setProfile(updatedProfile);
      setEditForm(null);
    } catch (error) {
      setEditErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="up-page">
      {/* ---- Breadcrumb-style page header ---- */}
      <header className="up-page-header">
        <LocalLibraryIcon className="accent-icon" fontSize="small" />
        <span>Hệ thống Quản lý Thư viện</span>
      </header>

      {isLoading && (
        <main className="up-main">
          <section className="up-col-full">
            <div className="up-status-card">Đang tải hồ sơ...</div>
          </section>
        </main>
      )}

      {!isLoading && errorMessage && (
        <main className="up-main">
          <section className="up-col-full">
            <div className="up-status-card is-error">{errorMessage}</div>
          </section>
        </main>
      )}

      {!isLoading && !errorMessage && profile && (
        <main className="up-main">
          {/* Profile header — chiếm toàn bộ chiều rộng */}
          <section className="up-col-full">
            <ProfileHeader
              fullName={profile.fullName}
              username={profile.username}
              avatarUrl={profile.avatarUrl}
              status={profile.status}
            />
          </section>

          {/* Info card — 2/3 chiều rộng (desktop) */}
          <section className="up-col-2">
            <ProfileInfoCard
              email={profile.email}
              phone={profile.phone}
              dateOfBirth={profile.dateOfBirth}
              address={profile.address}
              userId={profile.userId}
            />
          </section>

          {/* Actions sidebar — 1/3 chiều rộng (desktop) */}
          <section className="up-col-1">
            <ProfileActions onEditProfile={openEditProfile} />
          </section>
        </main>
      )}

      {editForm && (
        <EditProfileDialog
          profile={editForm}
          avatarFile={avatarFile}
          isSaving={isSaving}
          isUploadingAvatar={isUploadingAvatar}
          errorMessage={editErrorMessage}
          onAvatarChange={handleAvatarFileChange}
          onAvatarUpload={handleAvatarUpload}
          onChange={handleEditFormChange}
          onClose={closeEditProfile}
          onSubmit={handleEditProfileSubmit}
        />
      )}

      {/* ---- Footer ---- */}
      <footer className="up-footer">
        © {new Date().getFullYear()} Hệ thống Thư viện · Phiên bản 2.4.1
      </footer>
    </div>
  );
}
