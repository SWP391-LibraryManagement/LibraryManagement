import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Card, Button, Stack } from '@mui/material';
import { LocalLibrary } from '@mui/icons-material';
import RegisterFormHeader from './RegisterFormHeader';
import FormInput from './FormInput';
import PasswordInput from './PasswordInput';

export default function AuthCard({
  onSubmit,
  feedback,
  isSubmitting = false,
}) {
  const navigate = useNavigate();
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
      </Card>
    </div>
  );
}
