import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Card, Stack, Typography } from '@mui/material';
import { LocalLibrary } from '@mui/icons-material';
import RegisterFormHeader from './RegisterFormHeader';
import FormInput from './FormInput';
import PasswordInput from './PasswordInput';

export default function AuthCard({
  onSubmit,
  onVerifyOtp,
  onResendOtp,
  feedback,
  isSubmitting = false,
  isVerifying = false,
  isResending = false,
  registeredEmail = '',
}) {
  const navigate = useNavigate();
  const [step, setStep] = useState('register');
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!onSubmit) {
      return;
    }

    const success = await onSubmit(formData);

    if (success) {
      setFormData((current) => ({
        ...current,
        password: '',
        confirmPassword: '',
      }));
      setStep('verify');
    }
  };

  const handleOtpSubmit = async (event) => {
    event.preventDefault();

    if (!onVerifyOtp) {
      return;
    }

    const success = await onVerifyOtp(otp);

    if (success) {
      setOtp('');
    }
  };

  const handleResendOtp = async () => {
    if (!onResendOtp) {
      return;
    }

    await onResendOtp();
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

        {step === 'register' ? (
          <form onSubmit={handleSubmit}>
          <Stack spacing={2.25}>
            <FormInput
              label="Họ và tên"
              placeholder="Nhập họ và tên của bạn"
              value={formData.fullName}
              onChange={(value) => setFormData((current) => ({ ...current, fullName: value }))}
              required
            />
            <FormInput
              label="Tên đăng nhập"
              placeholder="Nhập tên đăng nhập của bạn"
              value={formData.username}
              onChange={(value) => setFormData((current) => ({ ...current, username: value }))}
              required
            />
            <FormInput
              label="Email"
              placeholder="Nhập địa chỉ email của bạn"
              type="email"
              value={formData.email}
              onChange={(value) => setFormData((current) => ({ ...current, email: value }))}
              required
            />
            <PasswordInput
              label="Mật khẩu"
              placeholder="Tạo mật khẩu của bạn"
              value={formData.password}
              onChange={(value) => setFormData((current) => ({ ...current, password: value }))}
              required
            />
            <PasswordInput
              label="Xác nhận mật khẩu"
              placeholder="Nhập lại mật khẩu của bạn"
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
              {isSubmitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </Button>

            <div className="register-section">
              <span className="register-text">
                Đã có tài khoản?{' '}
                <a
                  href="#"
                  className="register-link"
                  onClick={(event) => {
                    event.preventDefault();
                    navigate('/login');
                  }}
                >
                  Đăng nhập
                </a>
              </span>
            </div>
          </Stack>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit}>
            <Stack spacing={2.25}>
              <Box className="otp-verification-box">
                <Typography variant="h6" className="otp-title">
                  Xác thực email
                </Typography>
                <Typography variant="body2" className="otp-description">
                  Nhập mã OTP đã được gửi đến email {registeredEmail ? <strong>{registeredEmail}</strong> : 'của bạn'} để kích hoạt tài khoản.
                </Typography>
                <FormInput
                  label="Mã OTP"
                  placeholder="Nhập mã OTP từ email"
                  value={otp}
                  onChange={setOtp}
                  required
                />
              </Box>

              {feedback?.message && (
                <Alert severity={feedback.severity || 'info'}>
                  {feedback.message}
                </Alert>
              )}

              <Button type="submit" variant="contained" className="register-submit-btn" disabled={isVerifying}>
                {isVerifying ? 'Đang xác thực...' : 'Xác thực email'}
              </Button>

              <Button
                type="button"
                variant="text"
                className="resend-otp-btn"
                disabled={isResending || isVerifying}
                onClick={handleResendOtp}
              >
                {isResending ? 'Đang gửi lại...' : 'Gửi lại mã OTP'}
              </Button>

              <div className="register-section">
                <span className="register-text">
                  Đã xác thực?{' '}
                  <a
                    href="#"
                    className="register-link"
                    onClick={(event) => {
                      event.preventDefault();
                      navigate('/login');
                    }}
                  >
                    Đăng nhập
                  </a>
                </span>
              </div>
            </Stack>
          </form>
        )}
      </Card>
    </div>
  );
}
