import { CheckCircle2, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MembershipApplicationForm({ profile, disabled, saving, onSubmit }) {
  const missingFields = [
    ['họ tên', profile?.fullName],
    ['số điện thoại', profile?.phone],
    ['ngày sinh', profile?.dateOfBirth],
    ['địa chỉ', profile?.address],
  ].filter(([, value]) => !String(value || '').trim()).map(([label]) => label);

  function submit(event) {
    event.preventDefault();
    onSubmit({});
  }

  return (
    <form className="lib-card membership-apply-card" onSubmit={submit}>
      <h2 className="lib-card-title">Gửi đơn đăng ký</h2>
      <p className="muted">Đơn sử dụng thông tin tài khoản và hồ sơ cá nhân đã xác thực của bạn.</p>
      <div className="membership-benefits">
        <span><CheckCircle2 size={16} /> Tăng hạn mức từ 3 lên 5 sách mỗi ngày</span>
        <span><CheckCircle2 size={16} /> Gia hạn theo quy định</span>
        <span><CheckCircle2 size={16} /> Tham gia hàng đợi đặt chỗ</span>
      </div>
      <button type="submit" className="btn btn-primary membership-submit" disabled={disabled || saving || missingFields.length > 0}>
        <Send size={16} /> {saving ? 'Đang gửi...' : 'Gửi đơn đăng ký'}
      </button>
      {missingFields.length > 0 && (
        <p className="field-hint">
          Vui lòng bổ sung {missingFields.join(', ')}. <Link to="/profile">Cập nhật hồ sơ</Link>
        </p>
      )}
      {disabled && <p className="field-hint">Bạn chỉ có thể gửi khi chưa có đơn chờ duyệt hoặc hội viên đã được duyệt.</p>}
    </form>
  );
}
