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
    onRegister
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
            Library Management System
          </h2>

          <p className="login-subtitle">
            Welcome back, sign in to continue.
          </p>
        </div>

        {/* Login Form */}
        <LoginForm
          onSubmit={onSubmit}
          onForgotPassword={onForgotPassword}
          onRegister={onRegister}
        />
      </Card>
    </div>
  );
}