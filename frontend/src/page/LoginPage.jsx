/**
 * LoginPage Component
 * Main login page with split screen layout
 * Left: Background image with branding
 * Right: Login form with glassmorphism effect
 */

import BackgroundPanel from '../component/login/BackgroundPanel';
import AuthCard from '../component/login/AuthCard';

export default function LoginPage() {
  // Background image URL from Unsplash - Modern library with warm lighting
  const backgroundImageUrl =
    './wwwroot/login/loginimage.jpg';

  // Handler functions (for demo purposes - would connect to actual auth in production)
  const handleLogin = (username, password, rememberMe) => {
    console.log('Login submitted:', { username, password, rememberMe });
    alert(`Login attempt with username: ${username}`);
    // In production: call authentication API here
  };

  const handleForgotPassword = () => {
    console.log('Forgot password clicked');
    alert('Forgot password functionality would redirect to password recovery page');
    // In production: redirect to password recovery flow
  };

  const handleRegister = () => {
    console.log('Register clicked');
    alert('Register functionality would redirect to registration page');
    // In production: redirect to registration page
  };

  return (
    <div className="login-page">
      {/* Left Side - Background Panel */}
      <BackgroundPanel
        imageUrl={backgroundImageUrl}
        title="Library Management System"
        subtitle="Empowering knowledge, one book at a time"
      />

      {/* Right Side - Login Form Section */}
      <div className="login-form-section">
        <AuthCard
          onSubmit={handleLogin}
          onForgotPassword={handleForgotPassword}
          onRegister={handleRegister}
        />
      </div>
    </div>
  );
}
