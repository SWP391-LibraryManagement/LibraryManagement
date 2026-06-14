import { useState } from 'react';
import BackgroundPanel from '../component/register/BackgroundPanel';
import AuthCard from '../component/register/AuthCard';
import { registerAccount } from '../api/authApi';
import '../styles/login.css';

export default function RegisterPage() {
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (formData) => {
    setFeedback(null);

    if (formData.password !== formData.confirmPassword) {
      setFeedback({ severity: 'error', message: 'Xác nhận mật khẩu phải trùng khớp với mật khẩu.' });
      return false;
    }

    setIsSubmitting(true);

    try {
      const result = await registerAccount(formData);
      setFeedback({ severity: 'success', message: result.message || 'Thư xác thực đã được gửi.' });
      return true;
    } catch (error) {
      setFeedback({ severity: 'error', message: error.message });
      return false;
    } finally {
      setIsSubmitting(false);
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
            feedback={feedback}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}
