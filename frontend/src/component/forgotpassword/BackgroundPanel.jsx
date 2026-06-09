import '../../styles/forgot-password.css';

export default function BackgroundPanel() {
  return (
    <div className="background-panel">
      <div className="background-overlay"></div>

      <div className="background-content">
        <div className="library-quote">
          <h2>Welcome Back</h2>
          <p>
            Reset your password to continue accessing our library resources
          </p>
        </div>
      </div>
    </div>
  );
}