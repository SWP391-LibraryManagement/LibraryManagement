import UserProfile from "../component/userProfile/UserProfile";
import AppLayout from "../component/layout/AppLayout";

export default function App() {
  return (
    <AppLayout active="profile" title="Thông tin cá nhân">
      <UserProfile />
    </AppLayout>
  );
}
