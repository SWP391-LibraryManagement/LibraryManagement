import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import HistoryIcon from "@mui/icons-material/History";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";

export default function UserMenuPopup({
  anchorEl,
  open,
  onClose,
  name,
  role,
  initials,
  avatarUrl,
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
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
    >
      <MenuItem disabled sx={{ opacity: "1 !important", gap: 1.5, minWidth: 240 }}>
        <Avatar src={avatarUrl || undefined} sx={{ width: 36, height: 36 }}>
          {initials}
        </Avatar>
        <div>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {name || "Người dùng"}
          </Typography>
          {role && (
            <Typography variant="caption" color="text.secondary">
              {role}
            </Typography>
          )}
        </div>
      </MenuItem>
      <Divider />
      <MenuItem onClick={() => handleClick(onAccountInfo)}>
        <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
        Thông tin cá nhân
      </MenuItem>
      <MenuItem onClick={() => handleClick(onBorrowingHistory)}>
        <ListItemIcon><HistoryIcon fontSize="small" /></ListItemIcon>
        Lịch sử mượn sách
      </MenuItem>
      <MenuItem onClick={() => handleClick(onMembership)}>
        <ListItemIcon><CardMembershipIcon fontSize="small" /></ListItemIcon>
        Đăng kí hội viên
      </MenuItem>
      <Divider />
      <MenuItem onClick={() => handleClick(onLogout)}>
        <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
        Đăng xuất
      </MenuItem>
    </Menu>
  );
}
