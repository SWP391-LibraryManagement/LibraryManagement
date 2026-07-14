import { Box, Typography } from '@mui/material';
import { MenuBook } from '@mui/icons-material';

export default function RegisterFormHeader({ verificationStep = false, verificationSuccess = false }) {
  const title = verificationSuccess
    ? 'Xác thực hoàn tất'
    : verificationStep
      ? 'Xác thực email'
      : 'Tạo tài khoản thư viện';
  const subtitle = verificationSuccess
    ? 'Tài khoản của bạn đã sẵn sàng để đăng nhập.'
    : verificationStep
      ? 'Nhập mã OTP được gửi tới hộp thư của bạn.'
      : 'Điền thông tin tài khoản để bắt đầu.';

  return (
    <Box className="register-header">
      <div className="icon-wrapper">
        <MenuBook sx={{ fontSize: 44, color: '#8B4513' }} />
      </div>
      <Typography variant="h4" component="h1" className="register-title" sx={{ color: '#5d3a1a' }}>
        {title}
      </Typography>
      <Typography variant="body1" className="register-subtitle">
        {subtitle}
      </Typography>
    </Box>
  );
}
