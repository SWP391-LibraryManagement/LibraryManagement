export default function LogoutConfirmModal({ onClose, onConfirm, busy = false }) {
  return (
    <div
      role="presentation"
      onClick={busy ? undefined : onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(30,18,10,0.55)', display: 'grid', placeItems: 'center', padding: 24 }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-confirm-title"
        onClick={(event) => event.stopPropagation()}
        style={{ width: 'min(420px, 100%)', background: '#FAF7F2', borderRadius: 14, boxShadow: '0 24px 80px rgba(30,18,10,0.32)', overflow: 'hidden' }}
      >
        <div style={{ padding: '22px 24px', borderBottom: '1px solid rgba(78,52,46,0.12)' }}>
          <h2 id="logout-confirm-title" style={{ margin: '0 0 8px', fontFamily: 'var(--heading)', fontSize: 22, color: '#2C1A0E' }}>
            Xác nhận đăng xuất
          </h2>
          <p style={{ margin: 0, color: '#7A5C44', fontSize: 14, lineHeight: 1.6 }}>
            Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: 18 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={{ padding: '10px 16px', borderRadius: 8, border: '1.5px solid rgba(78,52,46,0.2)', background: 'transparent', color: '#7A5C44', cursor: busy ? 'not-allowed' : 'pointer', fontWeight: 700 }}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#C78A3B', color: '#FFF', cursor: busy ? 'not-allowed' : 'pointer', fontWeight: 700 }}
          >
            {busy ? 'Đang xử lý...' : 'Đăng xuất'}
          </button>
        </div>
      </div>
    </div>
  );
}
