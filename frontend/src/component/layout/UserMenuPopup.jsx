import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

export default function UserMenuPopup({
  anchorEl,
  open,
  onClose,
  name = '',
  role = '',
  initials = '',
  avatarUrl = '',
  onAccountInfo,
  onBorrowingHistory,
  onMembership,
  onLogout,
}) {
  const handleClick = (action) => {
    onClose?.();
    action?.();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      slotProps={{
        paper: {
          elevation: 6,
          sx: {
            mt: 1,
            minWidth: 220,
            backgroundColor: '#fffdf8',
            border: '1px solid #ded1ba',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(62, 39, 35, 0.18)',
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1.25,
              fontSize: '0.875rem',
              color: '#241d16',
              borderRadius: '8px',
              mx: 0.75,
              '&:hover': { backgroundColor: '#eee4d3' },
            },
          },
        },
      }}
    >
      <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            src={avatarUrl || undefined}
            sx={{
              width: 40,
              height: 40,
              bgcolor: '#a87532',
              border: '2px solid #ded1ba',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#fffdf8',
            }}
          >
            {initials}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#241d16', lineHeight: 1.3 }}>
              {name}
            </Typography>
            <Typography noWrap sx={{ fontSize: '0.75rem', color: '#6f6456', lineHeight: 1.3 }}>
              {role}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ borderColor: '#ded1ba', mx: 1.5, mb: 0.75 }} />

      <MenuItem onClick={() => handleClick(onAccountInfo)}>
        <ListItemIcon sx={{ color: '#7b5528', minWidth: 32 }}>
          <AccountCircleOutlinedIcon fontSize="small" />
        </ListItemIcon>
        Thông tin tài khoản
      </MenuItem>

      <MenuItem onClick={() => handleClick(onBorrowingHistory)}>
        <ListItemIcon sx={{ color: '#7b5528', minWidth: 32 }}>
          <HistoryIcon fontSize="small" />
        </ListItemIcon>
        Lịch sử mượn sách
      </MenuItem>

      <MenuItem onClick={() => handleClick(onMembership)}>
        <ListItemIcon sx={{ color: '#7b5528', minWidth: 32 }}>
          <CardMembershipIcon fontSize="small" />
        </ListItemIcon>
        Đăng ký hội viên
      </MenuItem>

      <MenuItem onClick={() => handleClick(onLogout)} sx={{ mb: 0.75 }}>
        <ListItemIcon sx={{ color: '#c1452f', minWidth: 32 }}>
          <LogoutIcon fontSize="small" />
        </ListItemIcon>
        <Typography sx={{ color: '#c1452f', fontSize: '0.875rem', fontWeight: 600 }}>
          Đăng xuất
        </Typography>
      </MenuItem>
    </Menu>
  );
}
