import { useState } from 'react';
import { Alert, Card, Button, Stack } from '@mui/material';
import { LocalLibrary } from '@mui/icons-material';
import RegisterFormHeader from './RegisterFormHeader';
import FormInput from './FormInput';
import PasswordInput from './PasswordInput';
import { registerAccount } from '../../api/authApi';

export default function AuthCard() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);

    if (formData.password !== formData.confirmPassword) {
      setFeedback({ severity: 'error', message: 'Password confirmation must match password.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await registerAccount(formData);
      setFeedback({ severity: 'success', message: result.message || 'Verification email sent.' });
      setFormData((current) => ({
        ...current,
        password: '',
        confirmPassword: '',
      }));
    } catch (error) {
      setFeedback({ severity: 'error', message: error.message });
    } finally {
      setIsSubmitting(false);
    }
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
            {feedback?.message && (
              <Alert severity={feedback.severity || 'info'}>
                {feedback.message}
              </Alert>
            )}
            <Button type="submit" variant="contained" className="register-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </Button>
          </Stack>
        </form>
      </Card>
    </div>
  );
}
