import "../../styles/user-profile.css";
import ProfileHeader from "./ProfileHeader";
import ProfileInfoCard from "./ProfileInfoCard";
import ProfileActions from "./ProfileActions";
import LocalLibraryIcon from "@mui/icons-material/LocalLibrary";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import BookmarkAddedIcon from "@mui/icons-material/BookmarkAdded";

/**
 * Mock data ghép từ bảng Users + UserProfiles + Members trong database.
 * Thể hiện hội viên "Demo Member" sinh năm 2001, đang hoạt động tại Hà Nội.
 */
const mockUserData = {
  /* --- Users table --- */
  username: "demomember2001",
  email: "demo.member@thuvien.vn",
  phone: "0912 345 678",
  status: "ACTIVE",

  /* --- UserProfiles table --- */
  fullName: "Nguyễn Thị Minh Châu",
  address: "45 Phố Huế, Hai Bà Trưng, Hà Nội",
  dateOfBirth: "2001-06-15",
  avatarUrl:
    "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&h=200&fit=crop&auto=format",

  /* --- Members table --- */
  memberId: "LIB-2024-00847",
  membershipStatus: "APPROVED",

  /* --- Borrow stats (mock) --- */
  totalBorrowed: 38,
  currentlyBorrowing: 2,
  returnedOnTime: 36,
};

/** Thẻ thống kê nhỏ */
function StatCard({ icon, value, label }) {
  return (
    <div className="up-stat-card">
      <div className="up-stat-icon">{icon}</div>
      <div>
        <p className="up-stat-value">{value}</p>
        <p className="up-stat-label">{label}</p>
      </div>
    </div>
  );
}

/** Trang chính User Profile */
export default function UserProfile() {
  return (
    <div className="up-page">
      {/* Page header */}
      <header className="up-page-header">
        <span className="up-icon">
          <LocalLibraryIcon fontSize="small" />
        </span>
        <span>Hệ thống Quản lý Thư viện</span>
        <span className="up-member-id">{mockUserData.memberId}</span>
      </header>

      {/* Main layout dùng Bootstrap grid */}
      <main className="up-main">
        <div className="row g-4">
          {/* Profile header – full width */}
          <div className="col-12">
            <ProfileHeader
              fullName={mockUserData.fullName}
              username={mockUserData.username}
              avatarUrl={mockUserData.avatarUrl}
              status={mockUserData.status}
              membershipStatus={mockUserData.membershipStatus}
            />
          </div>

          {/* Stats row – 3 equal columns */}
          <div className="col-12 col-sm-4">
            <StatCard
              icon={<AutoStoriesIcon fontSize="small" />}
              value={mockUserData.totalBorrowed}
              label="Tổng sách đã mượn"
            />
          </div>
          <div className="col-12 col-sm-4">
            <StatCard
              icon={<LocalLibraryIcon fontSize="small" />}
              value={mockUserData.currentlyBorrowing}
              label="Đang mượn"
            />
          </div>
          <div className="col-12 col-sm-4">
            <StatCard
              icon={<BookmarkAddedIcon fontSize="small" />}
              value={mockUserData.returnedOnTime}
              label="Trả đúng hạn"
            />
          </div>

          {/* Info card – 8/12 cols on large */}
          <div className="col-12 col-lg-8">
            <ProfileInfoCard
              email={mockUserData.email}
              phone={mockUserData.phone}
              dateOfBirth={mockUserData.dateOfBirth}
              address={mockUserData.address}
              memberId={mockUserData.memberId}
            />
          </div>

          {/* Actions sidebar – 4/12 cols on large */}
          <div className="col-12 col-lg-4">
            <ProfileActions username={mockUserData.username} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="up-footer">
        © {new Date().getFullYear()} Hệ thống Quản Lý Thư viện
      </footer>
    </div>
  );
}