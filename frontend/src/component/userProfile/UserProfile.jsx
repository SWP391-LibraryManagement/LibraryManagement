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
  avatarUrl: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&h=200&fit=crop&auto=format",

  /* --- Members table --- */
  memberId: "LIB-2024-00847",
  membershipStatus: "APPROVED",

  /* --- Borrow stats (mock) --- */
  totalBorrowed: 38,
  currentlyBorrowing: 2,
  returnedOnTime: 36,
};

/** Một thẻ thống kê nhỏ hiển thị con số và mô tả */
function StatCard({ icon, value, label }) {
  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground leading-none"
           style={{ fontFamily: "'DM Serif Display', serif" }}>
          {value}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/** Trang chính User Profile — kết hợp tất cả các sub-component */
export default function UserProfile() {
  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6">
      {/* Page header */}
      <header className="max-w-5xl mx-auto mb-6 flex items-center gap-3">
        <LocalLibraryIcon className="text-accent" />
        <span className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
          Hệ thống Quản lý Thư viện
        </span>
        <span className="ml-auto text-xs text-muted-foreground font-mono hidden sm:block">
          {mockUserData.memberId}
        </span>
      </header>

      {/* Main layout — 2-column on desktop, single on mobile */}
      <main className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile header — full width */}
        <section className="lg:col-span-3">
          <ProfileHeader
            fullName={mockUserData.fullName}
            username={mockUserData.username}
            avatarUrl={mockUserData.avatarUrl}
            status={mockUserData.status}
            membershipStatus={mockUserData.membershipStatus}
          />
        </section>

        {/* Stats row */}
        <section className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={<AutoStoriesIcon fontSize="small" />}
            value={mockUserData.totalBorrowed}
            label="Tổng sách đã mượn"
          />
          <StatCard
            icon={<LocalLibraryIcon fontSize="small" />}
            value={mockUserData.currentlyBorrowing}
            label="Đang mượn"
          />
          <StatCard
            icon={<BookmarkAddedIcon fontSize="small" />}
            value={mockUserData.returnedOnTime}
            label="Trả đúng hạn"
          />
        </section>

        {/* Info card — takes 2 of 3 columns */}
        <section className="lg:col-span-2">
          <ProfileInfoCard
            email={mockUserData.email}
            phone={mockUserData.phone}
            dateOfBirth={mockUserData.dateOfBirth}
            address={mockUserData.address}
            memberId={mockUserData.memberId}
          />
        </section>

        {/* Actions sidebar — takes 1 of 3 columns */}
        <section className="lg:col-span-1">
          <ProfileActions username={mockUserData.username} />
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto mt-10 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Hệ thống Quản Lý Thư viện
      </footer>
    </div>
  );
}