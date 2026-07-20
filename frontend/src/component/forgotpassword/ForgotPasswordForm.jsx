import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import LockResetIcon from '@mui/icons-material/LockReset';
import VpnKeyIcon from '@mui/icons-material/VpnKey';

import { forgotPassword, resetPassword, resetPasswordWithToken } from '../../api/authApi';
import {
  RESEND_COOLDOWN_SECONDS,
  getAccountSetupErrorMessage,
  getPasswordRequirements,
  maskEmail,
  normalizeOtp,
  validatePasswordSetupFields,
} from '../../utils/authUx';
import '../../styles/forgot-password.css';
import AuthCard from './AuthCard';
import FormInput from './FormInput';

const STEP_EMAIL = 'email';
const STEP_OTP = 'otp';
const STEP_SETUP = 'setup';
const STEP_DONE = 'done';

const GENERIC_REQUEST_MESSAGE =
  'Nếu email khớp với một tài khoản hợp lệ, hệ thống sẽ gửi mã OTP để đặt lại mật khẩu.';
const GENERIC_REQUEST_ERROR =
  'Không thể gửi yêu cầu lúc này. Vui lòng thử lại sau.';
const PASSWORD_REQUIREMENT_LABELS = {
  minLength: 'Ít nhất 8 ký tự',
  uppercase: 'Có chữ hoa',
  lowercase: 'Có chữ thường',
  number: 'Có chữ số',
  special: 'Có ký tự đặc biệt',
};

export default function ForgotPasswordForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setupToken = searchParams.get('token')?.trim() || '';
  const isSetupMode = Boolean(setupToken);
  const otpInputRef = useRef(null);
  const [step, setStep] = useState(isSetupMode ? STEP_SETUP : STEP_EMAIL);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (step !== STEP_OTP) return undefined;
    const timer = window.setTimeout(() => otpInputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [step]);

  useEffect(() => {
    if (resendCooldown === 0) return undefined;
    const timer = window.setTimeout(() => {
      setResendCooldown((current) => Math.max(current - 1, 0));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const passwordRequirements = getPasswordRequirements(newPassword);
  const maskedEmail = maskEmail(email);

  const clearFieldError = (field) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSendOtp = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setFieldErrors({ email: 'Vui lòng nhập địa chỉ email hợp lệ.' });
      return;
    }

    setEmail(normalizedEmail);
    setFieldErrors({});
    setFeedback(null);
    setIsSendingOtp(true);

    try {
      await forgotPassword(normalizedEmail);
      setStep(STEP_OTP);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setFeedback({ severity: 'success', message: GENERIC_REQUEST_MESSAGE });
    } catch {
      setFeedback({ severity: 'error', message: GENERIC_REQUEST_ERROR });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (isResending || resendCooldown > 0) return;

    setFeedback(null);
    setIsResending(true);
    try {
      await forgotPassword(email);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setFeedback({ severity: 'success', message: GENERIC_REQUEST_MESSAGE });
    } catch {
      setFeedback({ severity: 'error', message: GENERIC_REQUEST_ERROR });
    } finally {
      setIsResending(false);
    }
  };

  const handleConfirmOtp = async (event) => {
    event.preventDefault();
    const nextErrors = validatePasswordSetupFields({ newPassword, confirmPassword });

    if (otp.length !== 6) {
      nextErrors.otp = 'Vui lòng nhập đúng mã OTP gồm 6 chữ số.';
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setFeedback(null);
    setIsConfirming(true);
    try {
      await resetPassword({ email, otp, newPassword });
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setFieldErrors({});
      setStep(STEP_DONE);
    } catch (error) {
      setFeedback({ severity: 'error', message: error.message });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCompleteSetup = async (event) => {
    event.preventDefault();
    const nextErrors = validatePasswordSetupFields({ newPassword, confirmPassword });

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setFeedback(null);
    setIsConfirming(true);
    try {
      // @spec FR-FE02-024, FR-FE02-025
      await resetPasswordWithToken({ token: setupToken, newPassword });
      setNewPassword('');
      setConfirmPassword('');
      setFieldErrors({});
      setStep(STEP_DONE);
    } catch (error) {
      setFeedback({ severity: 'error', message: getAccountSetupErrorMessage(error) });
    } finally {
      setIsConfirming(false);
    }
  };

  if (step === STEP_DONE) {
    return (
      <AuthCard>
        <Box className="recovery-success" role="status">
          <CheckCircleIcon className="recovery-success-icon" aria-hidden="true" />
          <Typography variant="h4" component="h1">
            {isSetupMode ? 'Thiết lập tài khoản thành công' : 'Đổi mật khẩu thành công'}
          </Typography>
          <Typography>
            {isSetupMode
              ? 'Tài khoản đã được kích hoạt. Bạn có thể đăng nhập bằng mật khẩu vừa tạo.'
              : 'Bạn có thể đăng nhập bằng mật khẩu mới vừa tạo.'}
          </Typography>
          <Button
            type="button"
            variant="contained"
            fullWidth
            className="reset-button recovery-success-button"
            onClick={() => navigate('/login')}
          >
            Quay lại đăng nhập
          </Button>
        </Box>
      </AuthCard>
    );
  }

  const resendDisabled = isResending || isConfirming || resendCooldown > 0;

  return (
    <AuthCard>
      <Box className="recovery-card-content">
        <Box className="recovery-header">
          <LockResetIcon className="recovery-header-icon" aria-hidden="true" />
          <Typography variant="h4" component="h1">
            {isSetupMode
              ? 'Thiết lập mật khẩu'
              : step === STEP_EMAIL
                ? 'Quên mật khẩu?'
                : 'Đặt lại mật khẩu'}
          </Typography>
          <Typography variant="body2">
            {isSetupMode
              ? 'Tạo mật khẩu an toàn để kích hoạt tài khoản thư viện của bạn.'
              : step === STEP_EMAIL
              ? 'Nhập email đã đăng ký để nhận mã OTP đặt lại mật khẩu.'
              : <>Mã OTP gồm 6 chữ số đã được yêu cầu gửi tới <strong>{maskedEmail}</strong>.</>}
          </Typography>
        </Box>

        {!isSetupMode && (
          <div className="recovery-stepper" aria-label="Tiến trình đặt lại mật khẩu">
            <span className={step === STEP_EMAIL ? 'active' : 'complete'}>1. Xác nhận email</span>
            <span className={step === STEP_OTP ? 'active' : ''}>2. Tạo mật khẩu mới</span>
          </div>
        )}

        {feedback?.message && (
          <Alert severity={feedback.severity || 'info'} className="recovery-feedback">
            {feedback.message}
          </Alert>
        )}

        {!isSetupMode && step === STEP_EMAIL ? (
          <Box component="form" className="recovery-form" onSubmit={handleSendOtp} noValidate>
            <FormInput
              label="Địa chỉ email"
              type="email"
              placeholder="tenban@example.com"
              icon={EmailIcon}
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                clearFieldError('email');
              }}
              error={Boolean(fieldErrors.email)}
              helperText={fieldErrors.email}
              disabled={isSendingOtp}
              inputProps={{ autoComplete: 'email' }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              className="reset-button"
              disabled={isSendingOtp}
            >
              {isSendingOtp ? 'Đang gửi mã...' : 'Gửi mã OTP'}
            </Button>

            <Button type="button" variant="text" onClick={() => navigate('/login')}>
              Quay lại đăng nhập
            </Button>
          </Box>
        ) : (
          <Box
            component="form"
            className="recovery-form"
            onSubmit={isSetupMode ? handleCompleteSetup : handleConfirmOtp}
            noValidate
          >
            {!isSetupMode && (
              <FormInput
                label="Mã OTP 6 chữ số"
                placeholder="123456"
                icon={VpnKeyIcon}
                required
                value={otp}
                onChange={(event) => {
                  setOtp(normalizeOtp(event.target.value));
                  clearFieldError('otp');
                }}
                error={Boolean(fieldErrors.otp)}
                helperText={fieldErrors.otp || 'Bạn có thể dán trực tiếp mã từ email.'}
                disabled={isConfirming}
                inputRef={otpInputRef}
                inputProps={{
                  inputMode: 'numeric',
                  autoComplete: 'one-time-code',
                  maxLength: 6,
                  pattern: '[0-9]*',
                }}
              />
            )}

            <FormInput
              label="Mật khẩu mới"
              type="password"
              placeholder="Tạo mật khẩu an toàn"
              icon={LockIcon}
              required
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value);
                clearFieldError('newPassword');
              }}
              error={Boolean(fieldErrors.newPassword)}
              helperText={fieldErrors.newPassword}
              disabled={isConfirming}
              inputProps={{ autoComplete: 'new-password' }}
            />

            <ul className="recovery-requirements" aria-label="Yêu cầu mật khẩu">
              {Object.entries(PASSWORD_REQUIREMENT_LABELS).map(([key, label]) => (
                <li className={passwordRequirements[key] ? 'met' : ''} key={key}>
                  {label}
                </li>
              ))}
            </ul>

            <FormInput
              label="Xác nhận mật khẩu mới"
              type="password"
              placeholder="Nhập lại mật khẩu mới"
              icon={LockIcon}
              required
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                clearFieldError('confirmPassword');
              }}
              error={Boolean(fieldErrors.confirmPassword)}
              helperText={fieldErrors.confirmPassword}
              disabled={isConfirming}
              inputProps={{ autoComplete: 'new-password' }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              className="reset-button"
              disabled={isConfirming}
            >
              {isConfirming
                ? isSetupMode
                  ? 'Đang hoàn tất...'
                  : 'Đang đổi mật khẩu...'
                : isSetupMode
                  ? 'Hoàn tất thiết lập'
                  : 'Đổi mật khẩu'}
            </Button>

            {!isSetupMode && (
              <div className="recovery-resend-row">
                <span>Không nhận được mã?</span>
                <Button
                  type="button"
                  variant="text"
                  onClick={handleResendOtp}
                  disabled={resendDisabled}
                >
                  {isResending
                    ? 'Đang gửi lại...'
                    : resendCooldown > 0
                      ? `Gửi lại mã sau ${resendCooldown}s`
                      : 'Gửi lại mã'}
                </Button>
              </div>
            )}

            <div className="recovery-secondary-actions">
              {!isSetupMode && (
                <Button
                  type="button"
                  variant="text"
                  onClick={() => {
                    setStep(STEP_EMAIL);
                    setFeedback(null);
                  }}
                  disabled={isConfirming}
                >
                  Đổi email
                </Button>
              )}
              {!isSetupMode && (
                <Button
                  type="button"
                  variant="text"
                  onClick={() => navigate('/verify-email', { state: { email } })}
                >
                  Xác thực email
                </Button>
              )}
              <Button type="button" variant="text" onClick={() => navigate('/login')}>
                Quay lại đăng nhập
              </Button>
            </div>
          </Box>
        )}
      </Box>
    </AuthCard>
  );
}
