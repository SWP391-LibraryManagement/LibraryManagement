import React from 'react';
import { Box } from '@mui/material';
import './login.css';

/**
 * BackgroundPanel Component
 * Provides a premium, warm library-themed background with abstract glassmorphism elements
 */
export default function BackgroundPanel({ children }) {
  return (
    <Box className="auth-background">
      {/* Decorative background glass/glow shapes */}
      <Box className="bg-shape bg-shape-1" />
      <Box className="bg-shape bg-shape-2" />
      <Box className="bg-shape bg-shape-3" />
      
      {/* Container for centering the login card */}
      <Box className="auth-container">
        {children}
      </Box>
    </Box>
  );
}
