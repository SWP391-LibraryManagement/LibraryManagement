import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import EmailIcon from '@mui/icons-material/Email';
import LockResetIcon from '@mui/icons-material/LockReset';
import LockIcon from '@mui/icons-material/Lock';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FormInput from './FormInput';
import AuthCard from './AuthCard';
import '../../styles/forgot-password.css';
import { forgotPassword, resetPassword } from '../../api/authApi';

const STEP_EMAIL = "email";
const STEP_OTP = "otp";
const STEP_DONE = "done";

const ForgotPasswordForm = () => {
  const [step, setStep] = useState(STEP_EMAIL);
  
  // Step 1 state
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  
  // Step 2 state
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const [feedback, setFeedback] = useState(null);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (!email || !validateEmail(email)) {
      setEmailError(true);
      return;
    }

    setEmailError(false);
    setIsSendingOtp(true);

    try {
      await forgotPassword(email);
      setStep(STEP_OTP);
      setFeedback({ severity: 'success', message: 'Mã OTP đã được gửi đến email của bạn.' });
    } catch (error) {
      setFeedback({ severity: 'error', message: error.message });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleConfirmOtp = async (e) => {
    e.preventDefault();
    setFeedback(null);
    let hasError = false;

    if (!otp || otp.length !== 6) {
      setOtpError(true);
      hasError = true;
    } else {
      setOtpError(false);
    }

    if (!newPassword || newPassword.length < 8 || newPassword !== confirmPassword) {
      setPasswordError(true);
      hasError = true;
    } else {
      setPasswordError(false);
    }

    if (hasError) return;

    setIsConfirming(true);

    try {
      await resetPassword({ email, otp, newPassword });
      setStep(STEP_DONE);
    } catch (error) {
      setFeedback({ severity: 'error', message: error.message });
    } finally {
      setIsConfirming(false);
    }
  };

  if (step === STEP_DONE) {
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
            Đổi Mật Khẩu Thành Công
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
            Mật khẩu của bạn đã được thay đổi thành công. Bây giờ bạn có thể sử dụng mật khẩu mới để đăng nhập.
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
            Quay lại Đăng nhập
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
          {step === STEP_EMAIL ? 'Quên Mật Khẩu?' : 'Khôi phục Mật Khẩu'}
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
          {step === STEP_EMAIL 
            ? "Nhập địa chỉ email của bạn và chúng tôi sẽ gửi mã OTP để khôi phục mật khẩu."
            : `Nhập mã OTP 6 chữ số được gửi tới ${email} cùng mật khẩu mới của bạn.`}
        </Typography>

        {feedback?.message && (
          <Alert severity={feedback.severity || 'info'} sx={{ mb: 3 }}>
            {feedback.message}
          </Alert>
        )}

        {step === STEP_EMAIL && (
          <Box component="form" onSubmit={handleSendOtp} noValidate>
            <Box sx={{ mb: 3 }}>
              <FormInput
                label="Địa chỉ Email"
                type="email"
                placeholder="Nhập địa chỉ email của bạn"
                icon={EmailIcon}
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(false);
                }}
                error={emailError}
                helperText={emailError ? "Vui lòng nhập địa chỉ email hợp lệ" : ""}
                disabled={isSendingOtp}
              />
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              className="reset-button"
              disabled={isSendingOtp}
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
              {isSendingOtp ? 'Đang gửi OTP...' : 'Gửi mã OTP'}
            </Button>
          </Box>
        )}

        {step === STEP_OTP && (
          <Box component="form" onSubmit={handleConfirmOtp} noValidate>
            <Box sx={{ mb: 3 }}>
              <FormInput
                label="Mã OTP 6 chữ số"
                type="text"
                placeholder="123456"
                icon={VpnKeyIcon}
                required
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setOtpError(false);
                }}
                error={otpError}
                helperText={otpError ? "Vui lòng nhập đúng mã OTP 6 chữ số" : ""}
                disabled={isConfirming}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <FormInput
                label="Mật khẩu mới"
                type="password"
                placeholder="Tối thiểu 8 ký tự"
                icon={LockIcon}
                required
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordError(false);
                }}
                error={passwordError}
                disabled={isConfirming}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <FormInput
                label="Xác nhận Mật khẩu mới"
                type="password"
                placeholder="Phải khớp với mật khẩu mới"
                icon={LockIcon}
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordError(false);
                }}
                error={passwordError}
                helperText={passwordError ? "Mật khẩu không khớp hoặc chưa đủ 8 ký tự" : ""}
                disabled={isConfirming}
              />
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              className="reset-button"
              disabled={isConfirming || otp.length !== 6}
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
              {isConfirming ? 'Đang đổi mật khẩu...' : 'Khôi phục Mật khẩu'}
            </Button>
            
            <Box sx={{ textAlign: 'center', mb: 1 }}>
              <Button 
                variant="text" 
                onClick={() => {
                  setStep(STEP_EMAIL);
                  setFeedback(null);
                }}
                disabled={isConfirming}
                sx={{ color: '#8B6B4A', textTransform: 'none', fontWeight: 600 }}
              >
                Quay lại bước nhập Email
              </Button>
            </Box>
          </Box>
        )}

        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="body2"
            sx={{ color: '#7A7A7A', display: 'inline' }}
          >
            Bạn đã nhớ mật khẩu?{' '}
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
            Đăng nhập
          </a>
        </Box>
      </Box>
    </AuthCard>
  );
};

export default ForgotPasswordForm;
