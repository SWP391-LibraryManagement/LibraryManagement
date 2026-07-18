import { CheckCircle2, Send } from 'lucide-react';

export default function MembershipApplicationForm({ disabled, saving, onSubmit }) {
  function submit(event) {
    event.preventDefault();
    onSubmit({});
  }

  return (
    <form className="lib-card membership-apply-card" onSubmit={submit}>
      <h2 className="lib-card-title">Gửi đơn đăng ký</h2>
      <p className="muted">Đơn sử dụng thông tin tài khoản và hồ sơ cá nhân đã xác thực của bạn.</p>
      <div className="membership-benefits">
        <span><CheckCircle2 size={16} /> Mượn tối đa 5 sách</span>
        <span><CheckCircle2 size={16} /> Gia hạn theo quy định</span>
        <span><CheckCircle2 size={16} /> Tham gia hàng đợi đặt chỗ</span>
      </div>
      <button type="submit" className="btn btn-primary membership-submit" disabled={disabled || saving}>
        <Send size={16} /> {saving ? 'Đang gửi...' : 'Gửi đơn đăng ký'}
      </button>
      {disabled && <p className="field-hint">Bạn chỉ có thể gửi khi chưa có đơn chờ duyệt hoặc hội viên đã được duyệt.</p>}
    </form>
  );
}
