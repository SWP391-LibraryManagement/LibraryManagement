import UserProfile from "../component/userProfile/UserProfile";
import Header from "../component/layout/Header";

export default function App() {
  return (
    <div className="profile-route-shell">
      <Header />
      <UserProfile />
    </div>
  );
}
