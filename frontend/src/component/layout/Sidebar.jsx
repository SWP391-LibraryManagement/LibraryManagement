import { useState } from "react";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";

// MUI icons for each nav item
import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import InventoryIcon from "@mui/icons-material/Inventory2";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import AssessmentIcon from "@mui/icons-material/Assessment";
import BarChartIcon from "@mui/icons-material/BarChart";

import { SIDEBAR_WIDTH } from "./Header";

// Warm palette
const DARK_BROWN = "#3E2723";
const SOFT_BROWN = "#6D4C41";
const BEIGE = "#F5ECD7";
const GOLDEN = "#D4A96A";
const ACTIVE_BG = "#5D3A2E";   // warm highlight for active item

const navItems = [
  { label: "Profile",     icon: <PersonIcon /> },
  { label: "User",        icon: <GroupIcon /> },
  { label: "Borrowing",   icon: <SwapHorizIcon /> },
  { label: "Inventory",   icon: <InventoryIcon /> },
  { label: "Book",        icon: <MenuBookIcon /> },
  { label: "Reservation", icon: <EventAvailableIcon /> },
  { label: "Report",      icon: <AssessmentIcon /> },
  { label: "Statistic",   icon: <BarChartIcon /> },
];

export default function Sidebar({ activeItem: controlled, onItemClick }) {
  const [internalActive, setInternalActive] = useState("Book");

  const active = controlled ?? internalActive;

  const handleClick = (label) => {
    setInternalActive(label);
    onItemClick?.(label);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: SIDEBAR_WIDTH,
          boxSizing: "border-box",
          backgroundColor: "#4E342E",  // mid-dark brown
          borderRight: `1px solid ${SOFT_BROWN}`,
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Sidebar header / logo block */}
      <Box
        sx={{
          px: 2.5,
          py: 2.5,
          backgroundColor: DARK_BROWN,
          borderBottom: `1px solid ${SOFT_BROWN}`,
          minHeight: 64,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 32,
            borderRadius: 1,
            backgroundColor: GOLDEN,
            mr: 1.5,
            flexShrink: 0,
          }}
        />
        <Typography
          variant="subtitle1"
          sx={{
            fontFamily: "'Playfair Display', serif",
            color: BEIGE,
            fontWeight: 700,
            fontSize: "1rem",
            letterSpacing: "0.03em",
            lineHeight: 1.3,
          }}
        >
          Admin Panel
        </Typography>
      </Box>

      {/* Section label */}
      <Box sx={{ px: 2.5, pt: 2.5, pb: 0.5 }}>
        <Typography
          variant="overline"
          sx={{ color: "#A1887F", fontSize: "0.68rem", letterSpacing: "0.12em", fontWeight: 600 }}
        >
          Navigation
        </Typography>
      </Box>

      {/* Nav items */}
      <List sx={{ px: 1.5, flexGrow: 1 }}>
        {navItems.map((item) => {
          const isActive = active === item.label;
          return (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleClick(item.label)}
                sx={{
                  borderRadius: "10px",
                  px: 1.5,
                  py: 1,
                  backgroundColor: isActive ? ACTIVE_BG : "transparent",
                  "&:hover": {
                    backgroundColor: isActive ? ACTIVE_BG : "rgba(255,255,255,0.06)",
                  },
                  transition: "background-color 0.18s ease",
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? GOLDEN : "#BCAAA4",
                    minWidth: 36,
                    "& svg": { fontSize: 20 },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: "0.875rem",
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? BEIGE : "#D7CCC8",
                    letterSpacing: isActive ? "0.01em" : "normal",
                  }}
                />
                {/* Active accent bar */}
                {isActive && (
                  <Box
                    sx={{
                      width: 3,
                      height: 20,
                      borderRadius: 2,
                      backgroundColor: GOLDEN,
                      flexShrink: 0,
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: SOFT_BROWN, mx: 2 }} />

      {/* Footer hint */}
      <Box sx={{ px: 2.5, py: 2 }}>
        <Typography variant="caption" sx={{ color: "#8D6E63", fontSize: "0.72rem" }}>
          © 2026 Library System
        </Typography>
      </Box>
    </Drawer>
  );
}