import { useState } from 'react';
import { Card, Button, Stack } from '@mui/material';
import { LocalLibrary } from '@mui/icons-material';
import RegisterFormHeader from './RegisterFormHeader';
import FormInput from './FormInput';
import PasswordInput from './PasswordInput';

export default function AuthCard() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log('Register submitted:', formData);
  };

  return (
    <div className="register-card-wrapper">
      <Card className="auth-card" elevation={0}>
        <div className="login-header">
          <div className="login-icon-wrapper">
            <LocalLibrary sx={{ fontSize: 40, color: '#fff' }} />
          </div>

          <RegisterFormHeader />
        </div>

        <form onSubmit={handleSubmit}>
          <Stack spacing={2.25}>
            <FormInput
              label="Full name"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(value) => setFormData((current) => ({ ...current, fullName: value }))}
              required
            />
            <FormInput
              label="Email"
              placeholder="Enter your email"
              type="email"
              value={formData.email}
              onChange={(value) => setFormData((current) => ({ ...current, email: value }))}
              required
            />
            <PasswordInput
              label="Password"
              placeholder="Create a password"
              value={formData.password}
              onChange={(value) => setFormData((current) => ({ ...current, password: value }))}
              required
            />
            <PasswordInput
              label="Confirm password"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={(value) => setFormData((current) => ({ ...current, confirmPassword: value }))}
              required
            />
            <Button type="submit" variant="contained" className="register-submit-btn">
              Create account
            </Button>
          </Stack>
        </form>
      </Card>
    </div>
  );
}