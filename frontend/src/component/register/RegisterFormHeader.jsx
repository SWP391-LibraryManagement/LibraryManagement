import { Typography, Box } from '@mui/material';
import { MenuBook } from '@mui/icons-material';

export default function RegisterFormHeader() {
  return (
    <Box className="register-header">
      <div className="icon-wrapper">
        <MenuBook sx={{ fontSize: 48, color: '#8B4513' }} />
      </div>
      <Typography variant="h4" component="h1" className="register-title" sx={{ color: '#5d3a1a' }}>
        Tạo Tài Khoản Thư Viện
      </Typography>
      <Typography variant="body1" className="register-subtitle">
        Tham gia Hệ thống Quản lý Thư viện
      </Typography>
    </Box>
  );
}
