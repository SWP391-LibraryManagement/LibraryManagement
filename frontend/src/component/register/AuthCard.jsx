import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Stack } from '@mui/material';
import { LocalLibrary } from '@mui/icons-material';
import { Check } from 'lucide-react';

import { getPasswordRequirements, normalizeOtp, validateRegistrationFields } from '../../utils/authUx';
import FormInput from './FormInput';
import PasswordInput from './PasswordInput';
import RegisterFormHeader from './RegisterFormHeader';

const PASSWORD_REQUIREMENT_LABELS = {
  minLength: 'Ít nhất 8 ký tự',
  uppercase: 'Có chữ hoa',
  lowercase: 'Có chữ thường',
  number: 'Có chữ số',
  special: 'Có ký tự đặc biệt',
};

export default function AuthCard({
  onSubmit,
  onVerifyEmail,
  feedback,
  isSubmitting = false,
  isVerifying = false,
  isResending = false,
  resendCooldown = 0,
  verificationStep = false,
  verificationSuccess = false,
  registeredEmail = '',
  maskedEmail = '',
  onBackToRegister,
  onResendEmail,
}) {
  const navigate = useNavigate();
  const otpInputRef = useRef(null);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  useEffect(() => {
    if (!verificationStep || verificationSuccess) return undefined;
    const timer = window.setTimeout(() => otpInputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [verificationStep, verificationSuccess]);

  function updateField(field, value) {
    setFormData((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateRegistrationFields(formData);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !onSubmit) return;

    const success = await onSubmit(formData);
    if (success) {
      setFormData((current) => ({
        ...current,
        password: '',
        confirmPassword: '',
      }));
    }
  };

  const handleVerifySubmit = async (event) => {
    event.preventDefault();
    if (otp.length !== 6) {
      setOtpError('Vui lòng nhập đúng mã OTP gồm 6 chữ số.');
      return;
    }
    if (!onVerifyEmail) return;

    const success = await onVerifyEmail({ otp });
    if (success) setOtp('');
  };

  const passwordRequirements = getPasswordRequirements(formData.password);
  const resendDisabled = isResending || isVerifying || resendCooldown > 0;
  const isBusy = verificationStep ? isVerifying : isSubmitting;

  return (
    <div className="register-card-wrapper">
      <Card className="auth-card" elevation={0}>
        <div className="login-header">
          <div className="login-icon-wrapper">
            <LocalLibrary sx={{ fontSize: 38, color: '#fff' }} />
          </div>
          <RegisterFormHeader
            verificationStep={verificationStep}
            verificationSuccess={verificationSuccess}
          />
        </div>

        <div className="auth-stepper" aria-label="Tiến trình đăng ký">
          <span className={!verificationStep ? 'active' : 'complete'}>1. Thông tin tài khoản</span>
          <span className={verificationStep ? 'active' : ''}>2. Xác thực email</span>
        </div>

        <form onSubmit={verificationStep ? handleVerifySubmit : handleSubmit} noValidate>
          <Stack spacing={2}>
            {verificationStep ? (
              verificationSuccess ? (
                <div className="auth-success-state">
                  <Check aria-hidden="true" />
                  <p>Email đã được xác thực. Bạn có thể đăng nhập bằng tài khoản vừa tạo.</p>
                  <Button
                    type="button"
                    variant="contained"
                    className="register-submit-btn"
                    onClick={() => navigate('/login')}
                  >
                    Đi tới đăng nhập
                  </Button>
                </div>
              ) : (
                <>
                  <Alert severity="info">
                    Mã OTP đã được gửi tới <strong>{maskedEmail || registeredEmail || formData.email}</strong>.
                    Mã có hiệu lực trong 24 giờ.
                  </Alert>
                  <FormInput
                    label="Mã OTP 6 chữ số"
                    placeholder="123456"
                    value={otp}
                    onChange={(value) => {
                      setOtp(normalizeOtp(value));
                      setOtpError('');
                    }}
                    required
                    inputRef={otpInputRef}
                    error={Boolean(otpError)}
                    helperText={otpError || 'Bạn có thể dán trực tiếp mã từ email.'}
                    disabled={isVerifying}
                    inputProps={{
                      inputMode: 'numeric',
                      autoComplete: 'one-time-code',
                      maxLength: 6,
                      pattern: '[0-9]*',
                    }}
                  />
                  <div className="auth-resend-row">
                    <span>Không nhận được email?</span>
                    <Button
                      type="button"
                      variant="text"
                      className="register-link"
                      onClick={onResendEmail}
                      disabled={resendDisabled}
                    >
                      {isResending
                        ? 'Đang gửi lại...'
                        : resendCooldown > 0
                          ? `Gửi lại mã sau ${resendCooldown}s`
                          : 'Gửi lại mã'}
                    </Button>
                  </div>
                </>
              )
            ) : (
              <>
                <FormInput
                  label="Họ và tên"
                  placeholder="Nhập họ và tên của bạn"
                  value={formData.fullName}
                  onChange={(value) => updateField('fullName', value)}
                  required
                  error={Boolean(fieldErrors.fullName)}
                  helperText={fieldErrors.fullName}
                  disabled={isSubmitting}
                />
                <FormInput
                  label="Tên đăng nhập"
                  placeholder="Từ 3 đến 50 ký tự"
                  value={formData.username}
                  onChange={(value) => updateField('username', value)}
                  required
                  error={Boolean(fieldErrors.username)}
                  helperText={fieldErrors.username}
                  disabled={isSubmitting}
                />
                <FormInput
                  label="Email"
                  placeholder="tenban@example.com"
                  type="email"
                  value={formData.email}
                  onChange={(value) => updateField('email', value)}
                  required
                  error={Boolean(fieldErrors.email)}
                  helperText={fieldErrors.email}
                  disabled={isSubmitting}
                  inputProps={{ autoComplete: 'email' }}
                />
                <PasswordInput
                  label="Mật khẩu"
                  placeholder="Tạo mật khẩu an toàn"
                  value={formData.password}
                  onChange={(value) => updateField('password', value)}
                  required
                  error={Boolean(fieldErrors.password)}
                  helperText={fieldErrors.password}
                  disabled={isSubmitting}
                />
                <ul className="auth-requirements" aria-label="Yêu cầu mật khẩu">
                  {Object.entries(PASSWORD_REQUIREMENT_LABELS).map(([key, label]) => (
                    <li className={passwordRequirements[key] ? 'met' : ''} key={key}>
                      <Check size={14} aria-hidden="true" /> {label}
                    </li>
                  ))}
                </ul>
                <PasswordInput
                  label="Xác nhận mật khẩu"
                  placeholder="Nhập lại mật khẩu"
                  value={formData.confirmPassword}
                  onChange={(value) => updateField('confirmPassword', value)}
                  required
                  error={Boolean(fieldErrors.confirmPassword)}
                  helperText={fieldErrors.confirmPassword}
                  disabled={isSubmitting}
                />
              </>
            )}

            {feedback?.message && (
              <Alert severity={feedback.severity || 'info'}>{feedback.message}</Alert>
            )}

            {!(verificationStep && verificationSuccess) && (
              <Button type="submit" variant="contained" className="register-submit-btn" disabled={isBusy}>
                {verificationStep
                  ? (isVerifying ? 'Đang xác thực...' : 'Xác thực email')
                  : (isSubmitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản')}
              </Button>
            )}

            {verificationStep && !verificationSuccess && (
              <Button
                type="button"
                variant="text"
                className="register-link"
                onClick={onBackToRegister}
                disabled={isVerifying}
              >
                Quay lại thông tin đăng ký
              </Button>
            )}

            <div className="register-section">
              <span className="register-text">
                Đã có tài khoản?{' '}
                <a
                  href="/login"
                  className="register-link"
                  onClick={(event) => {
                    event.preventDefault();
                    navigate('/login');
                  }}
                >
                  Đăng nhập
                </a>
              </span>
            </div>
          </Stack>
        </form>
      </Card>
    </div>
  );
}
