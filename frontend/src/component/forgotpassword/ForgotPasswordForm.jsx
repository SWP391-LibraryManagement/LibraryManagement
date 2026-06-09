import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import EmailIcon from '@mui/icons-material/Email';
import LockResetIcon from '@mui/icons-material/LockReset';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FormInput from './FormInput';
import AuthCard from './AuthCard';
import '../../styles/forgot-password.css';

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [emailError, setEmailError] = useState(false);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email || !validateEmail(email)) {
      setEmailError(true);
      return;
    }

    setEmailError(false);
    setIsSubmitted(true);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) {
      setEmailError(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthCard>
        <Box className="success-state fade-in">
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <CheckCircleIcon
              sx={{
                fontSize: 80,
                color: '#4CAF50',
                mb: 2,
                animation: 'slideUp 0.5s ease-out',
              }}
            />
          </Box>

          <Typography
            variant="h4"
            component="h1"
            sx={{
              textAlign: 'center',
              color: '#4E342E',
              fontWeight: 600,
              mb: 2,
            }}
          >
            Email Sent Successfully
          </Typography>

          <Typography
            variant="body1"
            sx={{
              textAlign: 'center',
              color: '#7A7A7A',
              mb: 4,
              lineHeight: 1.6,
            }}
          >
            Please check your inbox and follow the instructions to reset your password.
          </Typography>

          <Button
            variant="contained"
            fullWidth
            onClick={() => (window.location.href = '/login')}
            sx={{
              background: 'linear-gradient(135deg, #4CAF50, #66BB6A)',
              color: '#fff',
              padding: '14px',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #45a049, #5cb860)',
                boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            Back to Login
          </Button>
        </Box>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <Box className="fade-in">
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <LockResetIcon
            sx={{
              fontSize: 64,
              color: '#8B6B4A',
              mb: 2,
            }}
          />
        </Box>

        <Typography
          variant="h4"
          component="h1"
          sx={{
            textAlign: 'center',
            color: '#4E342E',
            fontWeight: 600,
            mb: 1,
          }}
        >
          Forgot Your Password?
        </Typography>

        <Typography
          variant="body2"
          sx={{
            textAlign: 'center',
            color: '#7A7A7A',
            mb: 4,
            lineHeight: 1.6,
          }}
        >
          Enter your email address and we'll send you instructions to reset your password.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Box sx={{ mb: 3 }}>
            <FormInput
              label="Email Address"
              type="email"
              placeholder="Enter your email address"
              icon={EmailIcon}
              required
              value={email}
              onChange={handleEmailChange}
              error={emailError}
              helperText="Please enter a valid email address"
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            className="reset-button"
            sx={{
              background: 'linear-gradient(135deg, #8B6B4A, #C78A3B)',
              color: '#fff',
              padding: '14px',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(139, 107, 74, 0.3)',
              transition: 'all 0.3s ease',
              mb: 3,
              '&:hover': {
                background: 'linear-gradient(135deg, #6d5239, #a86f30)',
                boxShadow: '0 6px 20px rgba(139, 107, 74, 0.4)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            Reset Password
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="body2"
              sx={{ color: '#7A7A7A', display: 'inline' }}
            >
              Remember your password?{' '}
            </Typography>

            <a
              href="/login"
              style={{
                color: '#8B6B4A',
                textDecoration: 'none',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              className="login-link"
            >
              Login
            </a>
          </Box>
        </Box>
      </Box>
    </AuthCard>
  );
};

export default ForgotPasswordForm;