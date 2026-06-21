 import ProfileHeader from "./ProfileHeader";
import ProfileInfoCard from "./ProfileInfoCard";
import ProfileActions from "./ProfileActions";
import LocalLibraryIcon from "@mui/icons-material/LocalLibrary";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import BookmarkAddedIcon from "@mui/icons-material/BookmarkAdded";

/** Thẻ thống kê nhỏ hiển thị icon + con số + mô tả */
function StatCard({ icon, value, label }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <p className="stat-value">{value}</p>
        <p className="stat-label">{label}</p>
      </div>
    </div>
  );
}

/** Trang User Profile — kết hợp tất cả sub-component */
export default function UserProfile({ user }) {
  // Phòng trường hợp dữ liệu user chưa kịp load (bị null/undefined)
  if (!user) return <div className="lms-page">Đang tải dữ liệu...</div>;

  return (
    <div className="lms-page">
      {/* ---- Breadcrumb-style page header ---- */}
      <header className="lms-page-header">
        <LocalLibraryIcon className="accent-icon" fontSize="small" />
        <span>Hệ thống Quản lý Thư viện</span>
        <span className="member-id">{user.memberId}</span>
      </header>

      {/* ---- Main grid ---- */}
      <main className="lms-main">
        {/* Profile header — chiếm toàn bộ chiều rộng */}
        <section className="lms-col-3">
          <ProfileHeader
            fullName={user.fullName}
            username={user.username}
            avatarUrl={user.avatarUrl}
            status={user.status}
            membershipStatus={user.membershipStatus}
          />
        </section>

        {/* Stats — 3 thẻ ngang nhau */}
        <section className="lms-col-3">
          {/* Bootstrap row/col để chia đều trên mọi màn hình */}
          <div className="row g-3">
            <div className="col-12 col-sm-4">
              <StatCard
                icon={<AutoStoriesIcon fontSize="small" />}
                value={user.totalBorrowed}
                label="Tổng sách đã mượn"
              />
            </div>
            <div className="col-12 col-sm-4">
              <StatCard
                icon={<LocalLibraryIcon fontSize="small" />}
                value={user.currentlyBorrowing}
                label="Đang mượn"
              />
            </div>
            <div className="col-12 col-sm-4">
              <StatCard
                icon={<BookmarkAddedIcon fontSize="small" />}
                value={user.returnedOnTime}
                label="Trả đúng hạn"
              />
            </div>
          </div>
        </section>

        {/* Info card — 2/3 chiều rộng (desktop) */}
        <section className="lms-col-2">
          <ProfileInfoCard
            email={user.email}
            phone={user.phone}
            dateOfBirth={user.dateOfBirth}
            address={user.address}
            memberId={user.memberId}
          />
        </section>

        {/* Actions sidebar — 1/3 chiều rộng (desktop) */}
        <section className="lms-col-1">
          <ProfileActions username={user.username} />
        </section>
      </main>

      {/* ---- Footer ---- */}
      <footer className="lms-footer">
        © {new Date().getFullYear()} Hệ thống Thư viện · Phiên bản 2.4.1
      </footer>
    </div>
  );
}