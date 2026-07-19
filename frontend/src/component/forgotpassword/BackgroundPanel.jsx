import '../../styles/forgot-password.css';

export default function BackgroundPanel() {
  return (
    <div className="background-panel">
      <div className="background-overlay"></div>

      <div className="background-content">
        <div className="library-quote">
          <h2>Chào mừng trở lại</h2>
          <p>
            Đặt lại mật khẩu để tiếp tục sử dụng tài nguyên thư viện
          </p>
        </div>
      </div>
    </div>
  );
}
