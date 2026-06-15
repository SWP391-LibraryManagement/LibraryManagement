/**
 * AuthCard Component
 * Card wrapper for the login form with header and icon
 */

import { Card } from '@mui/material';
import { LocalLibrary } from '@mui/icons-material';
import LoginForm from './LoginForm';

export default function AuthCard(props) {
  const {
    onSubmit,
    onForgotPassword,
    onRegister,
    feedback,
    isSubmitting
  } = props;

  return (
    <div className="login-card-wrapper">
      <Card className="auth-card" elevation={0}>
        {/* Header Section */}
        <div className="login-header">
          {/* Icon */}
          <div className="login-icon-wrapper">
            <LocalLibrary
              sx={{
                fontSize: 40,
                color: '#fff'
              }}
            />
          </div>

          {/* Title and Subtitle */}
          <h2 className="login-title">
            Hệ thống Quản lý Thư viện
          </h2>

          <p className="login-subtitle">
            Chào mừng quay trở lại, hãy đăng nhập để tiếp tục.
          </p>
        </div>

        {/* Login Form */}
        <LoginForm
          onSubmit={onSubmit}
          onForgotPassword={onForgotPassword}
          onRegister={onRegister}
          feedback={feedback}
          isSubmitting={isSubmitting}
        />
      </Card>
    </div>
  );
}
