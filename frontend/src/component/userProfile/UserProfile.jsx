import { useEffect, useState } from "react";
import ProfileHeader from "./ProfileHeader";
import ProfileInfoCard from "./ProfileInfoCard";
import ProfileActions from "./ProfileActions";
import LocalLibraryIcon from "@mui/icons-material/LocalLibrary";
import { fetchMyProfile } from "../../api/profileApi";

/** Trang User Profile — kết hợp tất cả sub-component */
export default function UserProfile() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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

  return (
    <div className="lms-page">
      {/* ---- Breadcrumb-style page header ---- */}
      <header className="lms-page-header">
        <LocalLibraryIcon className="accent-icon" fontSize="small" />
        <span>Hệ thống Quản lý Thư viện</span>
      </header>

      {isLoading && (
        <main className="lms-main">
          <section className="lms-col-3">
            <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
              Đang tải hồ sơ...
            </div>
          </section>
        </main>
      )}

      {!isLoading && errorMessage && (
        <main className="lms-main">
          <section className="lms-col-3">
            <div className="bg-card rounded-2xl shadow-sm border border-border p-6 text-red-600">
              {errorMessage}
            </div>
          </section>
        </main>
      )}

      {!isLoading && !errorMessage && profile && (
        <main className="lms-main">
          {/* Profile header — chiếm toàn bộ chiều rộng */}
          <section className="lms-col-3">
            <ProfileHeader
              fullName={profile.fullName}
              username={profile.username}
              avatarUrl={profile.avatarUrl}
              status={profile.status}
            />
          </section>

          {/* Info card — 2/3 chiều rộng (desktop) */}
          <section className="lms-col-2">
            <ProfileInfoCard
              email={profile.email}
              phone={profile.phone}
              dateOfBirth={profile.dateOfBirth}
              address={profile.address}
              userId={profile.userId}
            />
          </section>

          {/* Actions sidebar — 1/3 chiều rộng (desktop) */}
          <section className="lms-col-1">
            <ProfileActions username={profile.username} />
          </section>
        </main>
      )}

      {/* ---- Footer ---- */}
      <footer className="lms-footer">
        © {new Date().getFullYear()} Hệ thống Thư viện · Phiên bản 2.4.1
      </footer>
    </div>
  );
}
