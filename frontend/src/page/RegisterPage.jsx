import BackgroundPanel from '../component/register/BackgroundPanel';
import AuthCard from '../component/register/AuthCard';
import '../styles/login.css';

export default function RegisterPage() {
  return (
    <div className="register-container">
      {/* Left Section - Background Image */}
      <BackgroundPanel />

      {/* Right Section - Register Form */}
      <div className="form-section">
        <div className="form-wrapper">
          <AuthCard />
        </div>
      </div>
    </div>
  );
}
