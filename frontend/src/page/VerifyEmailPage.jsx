import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Stack } from '@mui/material';
import { Email, LocalLibrary, VpnKey } from '@mui/icons-material';

import { resendVerification, verifyEmail } from '../api/authApi';
import BackgroundPanel from '../component/register/BackgroundPanel';
import FormInput from '../component/register/FormInput';
import { RESEND_COOLDOWN_SECONDS, maskEmail, normalizeOtp } from '../utils/authUx';
import '../styles/login.css';

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const otpInputRef = useRef(null);
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [fieldError, setFieldError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setResendCooldown((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    otpInputRef.current?.focus();
  }, []);

  const normalizedEmail = email.trim();
  const resendDisabled = isResending || isVerifying || resendCooldown > 0;

  const handleVerify = async (event) => {
    event.preventDefault();
    if (!isValidEmail(normalizedEmail)) {
      setFieldError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    if (otp.length !== 6) {
      setFieldError('Vui lòng nhập đúng mã OTP gồm 6 chữ số.');
      return;
    }

    setFieldError('');
    setFeedback(null);
    setIsVerifying(true);
    try {
      const result = await verifyEmail(normalizedEmail, otp);
      setVerificationSuccess(true);
      setFeedback({ severity: 'success', message: result.message || 'Email đã được xác thực.' });
    } catch (error) {
      setFeedback({ severity: 'error', message: error.message });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendDisabled) return;
    if (!isValidEmail(normalizedEmail)) {
      setFieldError('Vui lòng nhập địa chỉ email hợp lệ trước khi gửi lại mã.');
      return;
    }

    setFieldError('');
    setFeedback(null);
    setIsResending(true);
    try {
      await resendVerification(normalizedEmail);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setFeedback({ severity: 'success', message: 'Nếu email hợp lệ, mã xác thực mới đã được gửi.' });
    } catch (error) {
      setFeedback({ severity: 'error', message: error.message });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="register-container">
      <BackgroundPanel />
      <div className="form-section">
        <div className="form-wrapper">
          <Card className="auth-card" elevation={0}>
            <div className="login-header">
              <div className="login-icon-wrapper">
                <LocalLibrary sx={{ fontSize: 38, color: '#fff' }} />
              </div>
              <h2 className="login-title">Xác thực email</h2>
              <p className="login-subtitle">Khôi phục bước xác thực tài khoản của bạn.</p>
            </div>

            {verificationSuccess ? (
              <Stack spacing={2}>
                {feedback?.message && <Alert severity={feedback.severity}>{feedback.message}</Alert>}
                <Button type="button" variant="contained" className="register-submit-btn" onClick={() => navigate('/login')}>
                  Đi tới đăng nhập
                </Button>
              </Stack>
            ) : (
              <form onSubmit={handleVerify} noValidate>
                <Stack spacing={2}>
                  <Alert severity="info">
                    Nhập email đã đăng ký và mã OTP 6 chữ số. Email hiện tại: <strong>{maskEmail(normalizedEmail) || 'chưa nhập'}</strong>.
                  </Alert>
                  <FormInput
                    label="Email"
                    type="email"
                    placeholder="tenban@example.com"
                    icon={<Email />}
                    value={email}
                    onChange={(value) => {
                      setEmail(value);
                      setFieldError('');
                    }}
                    required
                    error={Boolean(fieldError && !isValidEmail(normalizedEmail))}
                    helperText={fieldError && !isValidEmail(normalizedEmail) ? fieldError : ''}
                    disabled={isVerifying}
                    inputProps={{ autoComplete: 'email' }}
                  />
                  <FormInput
                    label="Mã OTP 6 chữ số"
                    placeholder="123456"
                    icon={<VpnKey />}
                    value={otp}
                    onChange={(value) => {
                      setOtp(normalizeOtp(value));
                      setFieldError('');
                    }}
                    required
                    inputRef={otpInputRef}
                    error={Boolean(fieldError && isValidEmail(normalizedEmail))}
                    helperText={fieldError && isValidEmail(normalizedEmail) ? fieldError : 'Bạn có thể dán trực tiếp mã từ email.'}
                    disabled={isVerifying}
                    inputProps={{ inputMode: 'numeric', autoComplete: 'one-time-code', maxLength: 6, pattern: '[0-9]*' }}
                  />
                  {feedback?.message && <Alert severity={feedback.severity}>{feedback.message}</Alert>}
                  <Button type="submit" variant="contained" className="register-submit-btn" disabled={isVerifying}>
                    {isVerifying ? 'Đang xác thực...' : 'Xác thực email'}
                  </Button>
                  <div className="auth-resend-row">
                    <span>Không nhận được email?</span>
                    <Button type="button" variant="text" className="register-link" onClick={handleResend} disabled={resendDisabled}>
                      {isResending ? 'Đang gửi lại...' : resendCooldown > 0 ? `Gửi lại mã sau ${resendCooldown}s` : 'Gửi lại mã'}
                    </Button>
                  </div>
                  <div className="recovery-secondary-actions">
                    <Button type="button" variant="text" onClick={() => navigate('/register')}>
                      Quay lại đăng ký
                    </Button>
                    <Button type="button" variant="text" onClick={() => navigate('/login')}>
                      Quay lại đăng nhập
                    </Button>
                  </div>
                </Stack>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
