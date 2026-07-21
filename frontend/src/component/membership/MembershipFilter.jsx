import { RefreshCw, Search } from 'lucide-react';

export default function MembershipFilter({ status, search, onStatusChange, onSearchChange, onSearch, onReload, loading }) {
  return (
    <div className="toolbar membership-toolbar">
      <div className="search-input">
        <Search size={16} />
        <input value={search} onChange={(event) => onSearchChange(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') onSearch(); }} placeholder="Tìm theo tên, email hoặc mã đơn..." aria-label="Tìm đơn đăng ký hội viên" />
      </div>
      <span className="spacer" />
      <select className="select" style={{ width: 190 }} value={status} onChange={(event) => onStatusChange(event.target.value)} aria-label="Lọc trạng thái">
        <option value="PENDING">Đang chờ duyệt</option>
        <option value="APPROVED">Đã duyệt</option>
        <option value="REJECTED">Đã từ chối</option>
        <option value="ALL">Tất cả</option>
      </select>
      <button type="button" className="btn btn-outline" onClick={onSearch} disabled={loading}><Search size={16} /> Tìm kiếm</button>
      {onReload && (
        <button type="button" className="btn btn-outline" onClick={onReload} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'is-spinning' : ''} /> {loading ? 'Đang tải...' : 'Tải lại'}
        </button>
      )}
    </div>
  );
}
