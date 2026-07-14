import { useEffect, useState } from 'react';

import { registerAccount, resendVerification, verifyEmail } from '../api/authApi';
import BackgroundPanel from '../component/register/BackgroundPanel';
import AuthCard from '../component/register/AuthCard';
import { RESEND_COOLDOWN_SECONDS, maskEmail } from '../utils/authUx';
import '../styles/login.css';

export default function RegisterPage() {
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setResendCooldown((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const handleRegister = async (formData) => {
    setFeedback(null);
    setIsSubmitting(true);

    try {
      const result = await registerAccount(formData);
      setRegisteredEmail(result.email || formData.email);
      setVerificationStep(true);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setFeedback({ severity: 'success', message: result.message || 'Mã xác thực đã được gửi.' });
      return true;
    } catch (error) {
      setFeedback({ severity: 'error', message: error.message });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async () => {
    if (!registeredEmail || isResending || resendCooldown > 0) return false;

    setFeedback(null);
    setIsResending(true);
    try {
      const result = await resendVerification(registeredEmail);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setFeedback({ severity: 'success', message: result.message || 'Mã xác thực mới đã được gửi.' });
      return true;
    } catch (error) {
      setFeedback({ severity: 'error', message: error.message });
      return false;
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyEmail = async ({ otp }) => {
    setFeedback(null);
    setIsVerifying(true);

    try {
      const result = await verifyEmail(registeredEmail, otp);
      setFeedback({ severity: 'success', message: result.message || 'Email đã được xác thực.' });
      setVerificationSuccess(true);
      return true;
    } catch (error) {
      setFeedback({ severity: 'error', message: error.message });
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="register-container">
      <BackgroundPanel />

      <div className="form-section">
        <div className="form-wrapper">
          <AuthCard
            onSubmit={handleRegister}
            onVerifyEmail={handleVerifyEmail}
            feedback={feedback}
            isSubmitting={isSubmitting}
            isVerifying={isVerifying}
            isResending={isResending}
            resendCooldown={resendCooldown}
            verificationStep={verificationStep}
            verificationSuccess={verificationSuccess}
            registeredEmail={registeredEmail}
            maskedEmail={maskEmail(registeredEmail)}
            onBackToRegister={() => {
              setVerificationStep(false);
              setVerificationSuccess(false);
              setFeedback(null);
            }}
            onResendEmail={handleResendEmail}
          />
        </div>
      </div>
    </div>
  );
}
