import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import LogoutIcon from "@mui/icons-material/Logout";

const BEIGE = "#F5ECD7";

export default function UserMenuPopup({
  anchorEl,
  open,
  onClose,
  name = "Eleanor Voss",
  role = "Head Librarian",
  initials = "EV",
  avatarUrl = "",
  onAccountInfo,
  onLogout,
}) {
  const handleAccountInfo = () => {
    onClose();
    onAccountInfo?.();
  };

  const handleLogout = () => {
    onClose();
    onLogout?.();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      transformOrigin={{ horizontal: "right", vertical: "top" }}
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      slotProps={{
        paper: {
          elevation: 6,
          sx: {
            mt: 1,
            minWidth: 220,
            backgroundColor: "#FBF5E9",
            border: "1px solid #DDD0B8",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(62,39,35,0.18)",
            "& .MuiMenuItem-root": {
              px: 2,
              py: 1.25,
              fontSize: "0.875rem",
              color: "#3E2723",
              borderRadius: "8px",
              mx: 0.75,
              "&:hover": { backgroundColor: "#EDD9BC" },
              transition: "background-color 0.15s ease",
            },
          },
        },
      }}
    >
      {/* User identity block */}
      <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar
            src={avatarUrl || undefined}
            sx={{
              width: 40,
              height: 40,
              bgcolor: "#8D6E63",
              border: "2px solid #D4A96A",
              fontSize: "0.9rem",
              fontWeight: 700,
              color: BEIGE,
            }}
          >
            {initials}
          </Avatar>
          <Box>
            <Typography
              sx={{ fontWeight: 700, fontSize: "0.875rem", color: "#3E2723", lineHeight: 1.3 }}
            >
              {name}
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "#8D6E63", lineHeight: 1.3 }}>
              {role}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ borderColor: "#DDD0B8", mx: 1.5, mb: 0.75 }} />

      <MenuItem onClick={handleAccountInfo}>
        <ListItemIcon sx={{ color: "#6D4C41", minWidth: 32 }}>
          <AccountCircleOutlinedIcon fontSize="small" />
        </ListItemIcon>
        Thông tin tài khoản
      </MenuItem>

      <MenuItem onClick={handleLogout} sx={{ mb: 0.75 }}>
        <ListItemIcon sx={{ color: "#A05050", minWidth: 32 }}>
          <LogoutIcon fontSize="small" />
        </ListItemIcon>
        <Typography sx={{ color: "#A05050", fontSize: "0.875rem", fontWeight: 500 }}>
          Đăng xuất
        </Typography>
      </MenuItem>
    </Menu>
  );
}
