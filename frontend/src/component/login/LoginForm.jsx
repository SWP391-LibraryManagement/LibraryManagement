/**
 * LoginForm Component
 * Main login form with username, password, remember me, and social login options
 */

import { useState } from 'react';
import {
  TextField,
  IconButton,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Alert
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person,
  Lock
} from '@mui/icons-material';

export default function LoginForm({
  onSubmit,
  onForgotPassword,
  onRegister,
  feedback,
  isSubmitting = false
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(email, password, rememberMe);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      {/* Email Field */}
      <TextField
        fullWidth
        label="Email"
        placeholder="Nhập email của bạn"
        variant="outlined"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Person sx={{ color: '#8b5a2b' }} />
              </InputAdornment>
            ),
          },
        }}
      />

      {/* Password Field */}
      <TextField
        fullWidth
        label="Mật khẩu"
        placeholder="Nhập mật khẩu của bạn"
        type={showPassword ? 'text' : 'password'}
        variant="outlined"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Lock sx={{ color: '#8b5a2b' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={handleTogglePasswordVisibility}
                  edge="end"
                  aria-label="toggle password visibility"
                >
                  {showPassword ? (
                    <VisibilityOff sx={{ color: '#8b5a2b' }} />
                  ) : (
                    <Visibility sx={{ color: '#8b5a2b' }} />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      {feedback?.message && (
        <Alert severity={feedback.severity || 'info'}>
          {feedback.message}
        </Alert>
      )}

      {/* Remember Me & Forgot Password Row */}
      <div className="form-options-row">
        <FormControlLabel
          control={
            <Checkbox
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              sx={{
                color: '#8b5a2b',
                '&.Mui-checked': {
                  color: '#8b5a2b',
                },
              }}
            />
          }
          label={
            <span style={{ color: '#6d4c41', fontSize: '0.875rem' }}>
              Ghi nhớ đăng nhập
            </span>
          }
        />
        <a
          href="#"
          className="forgot-password-link"
          onClick={(e) => {
            e.preventDefault();
            if (onForgotPassword) {
              onForgotPassword();
            }
          }}
        >
          Quên mật khẩu?
        </a>
      </div>

      {/* Login Button */}
      <button
        type="submit"
        className="login-button"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </button>

      {/* Register Section */}
      <div className="register-section">
        <span className="register-text">
          Chưa có tài khoản?{' '}
          <a
            href="#"
            className="register-link"
            onClick={(e) => {
              e.preventDefault();
              if (onRegister) {
                onRegister();
              }
            }}
          >
            Đăng ký
          </a>
        </span>
      </div>
    </form>
  );
}
