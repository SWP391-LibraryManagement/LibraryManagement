/**
 * LoginPage Component
 * Main login page with split screen layout
 * Left: Background image with branding
 * Right: Login form with glassmorphism effect
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackgroundPanel from '../component/login/BackgroundPanel';
import AuthCard from '../component/login/AuthCard';
import { loginAccount } from '../api/authApi';
import '../styles/login.css';

function getPostLoginPath(roles = []) {
  return roles.map((role) => String(role).toUpperCase()).includes('ADMIN') ? '/admin/users' : '/home';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const backgroundImageUrl =
    '/images/login/loginimage.jpg';

  const handleLogin = async (email, password, rememberMe) => {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const result = await loginAccount({ email, password });
      const storage = rememberMe ? localStorage : sessionStorage;
      const otherStorage = rememberMe ? sessionStorage : localStorage;
      otherStorage.removeItem('accessToken');
      otherStorage.removeItem('refreshToken');
      otherStorage.removeItem('authUser');
      storage.setItem('accessToken', result.accessToken);
      storage.setItem('refreshToken', result.refreshToken);
      storage.setItem('authUser', JSON.stringify({
        userId: result.userId,
        email: result.email,
        roles: result.roles,
      }));
      setFeedback({ severity: 'success', message: 'Đăng nhập thành công.' });
      navigate(getPostLoginPath(result.roles));
    } catch (error) {
      setFeedback({ severity: 'error', message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const handleBackHome = () => {
    navigate('/homepage');
  };

  return (
    <div className="login-page">
      {/* Left Side - Background Panel */}
      <BackgroundPanel
        imageUrl={backgroundImageUrl}
        title="Hệ thống Quản lý Thư viện"
        subtitle="Lan tỏa tri thức, kết nối tương lai"
      />

      {/* Right Side - Login Form Section */}
      <div className="login-form-section">
        <AuthCard
          onSubmit={handleLogin}
          onForgotPassword={handleForgotPassword}
          onRegister={handleRegister}
          onBackHome={handleBackHome}
          feedback={feedback}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
