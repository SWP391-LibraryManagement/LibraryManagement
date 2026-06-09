import BackgroundPanel from '../component/forgotpassword/BackgroundPanel';
import ForgotPasswordForm from '../component/forgotpassword/ForgotPasswordForm';
import '../styles/forgot-password.css';

const ForgotPasswordPage = () => {
  return (
    <div className="forgot-password-page">
      <div className="container-fluid h-100">
        <div className="row h-100 g-0">
          <div className="col-lg-7 col-md-6 d-none d-md-block">
            <BackgroundPanel />
          </div>

          <div className="col-lg-5 col-md-6 col-12 d-flex align-items-center">
            <div className="form-section">
              <ForgotPasswordForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;