import { useState } from 'react';
import BackgroundPanel from '../component/register/BackgroundPanel';
import AuthCard from '../component/register/AuthCard';
import { registerAccount, verifyEmail } from '../api/authApi';
import '../styles/login.css';

function maskEmailForOtp(email) {
  const [localPart = '', domain = 'gmail.com'] = String(email || '').trim().split('@');
  const firstLetter = localPart.charAt(0);
  const lastLetter = localPart.length > 1 ? localPart.charAt(localPart.length - 1) : '';
  const middleMaskLength = Math.max(localPart.length - 2, 3);
  const maskedLocalPart = `${firstLetter}${'*'.repeat(middleMaskLength)}${lastLetter}`;

  return `${maskedLocalPart}@${domain || 'gmail.com'}`;
}

export default function RegisterPage() {
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleRegister = async (formData) => {
    setFeedback(null);

    if (formData.password !== formData.confirmPassword) {
      setFeedback({ severity: 'error', message: 'Xac nhan mat khau phai trung khop voi mat khau.' });
      return false;
    }

    setIsSubmitting(true);

    try {
      const result = await registerAccount(formData);
      setRegisteredEmail(result.email || formData.email);
      setVerificationStep(true);
      setFeedback({ severity: 'success', message: result.message || 'Ma xac thuc da duoc gui.' });
      return true;
    } catch (error) {
      setFeedback({ severity: 'error', message: error.message });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyEmail = async ({ otp }) => {
    setFeedback(null);

    if (!otp?.trim()) {
      setFeedback({ severity: 'error', message: 'Vui long nhap ma xac thuc email.' });
      return false;
    }

    setIsVerifying(true);

    try {
      const result = await verifyEmail(otp.trim());
      setFeedback({ severity: 'success', message: result.message || 'Email da duoc xac thuc.' });
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
            verificationStep={verificationStep}
            registeredEmail={registeredEmail}
            maskedEmail={maskEmailForOtp(registeredEmail)}
            onBackToRegister={() => {
              setVerificationStep(false);
              setFeedback(null);
            }}
          />
        </div>
      </div>
    </div>
  );
}
