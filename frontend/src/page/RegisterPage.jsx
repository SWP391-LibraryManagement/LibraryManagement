import { useState } from 'react';
import BackgroundPanel from '../component/register/BackgroundPanel';
import AuthCard from '../component/register/AuthCard';
import { registerAccount, resendVerificationEmail, verifyEmailToken } from '../api/authApi';
import '../styles/login.css';

export default function RegisterPage() {
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleRegister = async (formData) => {
    setFeedback(null);

    if (formData.password !== formData.confirmPassword) {
      setFeedback({ severity: 'error', message: 'Xác nhận mật khẩu phải trùng khớp với mật khẩu.' });
      return false;
    }

    setIsSubmitting(true);

    try {
      const result = await registerAccount(formData);
      setRegisteredEmail(result.email || formData.email);
      setFeedback({
        severity: 'success',
        message: result.message || 'Mã OTP xác thực đã được gửi qua email. Vui lòng nhập mã để kích hoạt tài khoản.',
      });
      return true;
    } catch (error) {
      setFeedback({ severity: 'error', message: error.message });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (otp) => {
    setFeedback(null);

    if (!otp?.trim()) {
      setFeedback({ severity: 'error', message: 'Vui lòng nhập mã OTP được gửi qua email.' });
      return false;
    }

    setIsVerifying(true);

    try {
      const result = await verifyEmailToken(otp.trim());
      setFeedback({ severity: 'success', message: result.message || 'Xác thực email thành công. Bạn có thể đăng nhập.' });
      return true;
    } catch (error) {
      setFeedback({ severity: 'error', message: error.message });
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!registeredEmail) {
      setFeedback({ severity: 'error', message: 'Không tìm thấy email đăng ký để gửi lại OTP.' });
      return false;
    }

    setFeedback(null);
    setIsResending(true);

    try {
      const result = await resendVerificationEmail(registeredEmail);
      setFeedback({ severity: 'success', message: result.message || 'Mã OTP mới đã được gửi qua email.' });
      return true;
    } catch (error) {
      setFeedback({ severity: 'error', message: error.message });
      return false;
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="register-container">
      {/* Left Section - Background Image */}
      <BackgroundPanel />

      {/* Right Section - Register Form */}
      <div className="form-section">
        <div className="form-wrapper">
          <AuthCard
            onSubmit={handleRegister}
            onVerifyOtp={handleVerifyOtp}
            onResendOtp={handleResendOtp}
            feedback={feedback}
            isSubmitting={isSubmitting}
            isVerifying={isVerifying}
            isResending={isResending}
            registeredEmail={registeredEmail}
          />
        </div>
      </div>
    </div>
  );
}
