import { Typography, Box } from '@mui/material';
import { MenuBook } from '@mui/icons-material';

export default function RegisterFormHeader() {
  return (
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
  );
}
