import { useState } from 'react';
import { Button, Typography, Box } from '@mui/material';
import { AccountCircle, Email, Phone, MenuBook } from '@mui/icons-material';
import FormField from './FormField';

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  const handleChange = (field) => (value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Registration data:', formData);
  };

  const passwordsMatch =
    formData.confirmPassword === '' ||
    formData.password === formData.confirmPassword;

  return (
    <>
      {/* Header */}
      <Box className="register-header">
        <div className="icon-wrapper">
          <MenuBook sx={{ fontSize: 48, color: '#8B4513' }} />
        </div>
        <Typography variant="h4" component="h1" className="register-title">
          Create Your Library Account
        </Typography>
        <Typography variant="body1" className="register-subtitle">
          Join the Library Management System
        </Typography>
      </Box>

      {/* Form */}
      <form onSubmit={handleSubmit} className="register-form">
        {/* Username */}
        <FormField
          required
          label="Username"
          placeholder="Enter username"
          value={formData.username}
          onChange={handleChange('username')}
          icon={<AccountCircle sx={{ color: '#8B4513' }} />}
        />

        {/* Email */}
        <FormField
          required
          type="email"
          label="Email Address"
          placeholder="Enter email address"
          value={formData.email}
          onChange={handleChange('email')}
          icon={<Email sx={{ color: '#8B4513' }} />}
        />

        {/* Password */}
        <FormField
          required
          type="password"
          label="Password"
          placeholder="Create password"
          value={formData.password}
          onChange={handleChange('password')}
        />

        {/* Confirm Password */}
        <FormField
          required
          type="password"
          label="Confirm Password"
          placeholder="Confirm password"
          value={formData.confirmPassword}
          onChange={handleChange('confirmPassword')}
          error={!passwordsMatch}
          helperText={!passwordsMatch ? 'Passwords do not match' : ''}
        />

        {/* Phone Number */}
        <FormField
          required
          type="tel"
          label="Phone Number"
          placeholder="Enter phone number"
          value={formData.phone}
          onChange={handleChange('phone')}
          icon={<Phone sx={{ color: '#8B4513' }} />}
        />

        {/* Register Button */}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          className="register-button"
        >
          Create Account
        </Button>

        {/* Login Redirect */}
        <Box className="login-redirect">
          <Typography variant="body2">
            Already have an account?{' '}
            <a href="#" className="login-link">
              Login
            </a>
          </Typography>
        </Box>
      </form>
    </>
  );
}