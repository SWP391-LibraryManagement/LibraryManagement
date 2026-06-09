/**
 * LoginForm Component
 * Main login form with username, password, remember me, and social login options
 */

import { useState } from 'react';
import './login.css';
import {
  TextField,
  IconButton,
  InputAdornment,
  Checkbox,
  FormControlLabel
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
  onRegister
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(username, password, rememberMe);
    }
    // In real application, handle login logic here
    console.log('Login attempt:', { username, password, rememberMe });
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      {/* Username Field */}
      <TextField
        fullWidth
        label="Username"
        placeholder="Enter your username"
        variant="outlined"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
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
        label="Password"
        placeholder="Enter your password"
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
            <span style={{ color: '#c6ac8f', fontSize: '0.875rem' }}>
              Remember me
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
            console.log('Forgot password clicked');
          }}
        >
          Forgot password?
        </a>
      </div>

      {/* Login Button */}
      <button
        type="submit"
        className="login-button"
      >
        Sign In
      </button>

      {/* Register Section */}
      <div className="register-section">
        <span className="register-text">
          Don't have an account?
          <a
            href="#"
            className="register-link"
            onClick={(e) => {
              e.preventDefault();
              if (onRegister) {
                onRegister();
              }
              console.log('Register clicked');
            }}
          >
            Register
          </a>
        </span>
      </div>
    </form>
  );
}
