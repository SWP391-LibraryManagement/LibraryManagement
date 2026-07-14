import { RefreshCw, Search } from 'lucide-react';

export default function MembershipFilter({ status, search, onStatusChange, onSearchChange, onReload, loading }) {
  return (
    <div className="toolbar">
      <div className="search-input">
        <Search size={16} />
        <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Tim ten, email, ma don..." aria-label="Tim don membership" />
      </div>
      <span className="spacer" />
      <select className="select" style={{ width: 180 }} value={status} onChange={(event) => onStatusChange(event.target.value)} aria-label="Loc trang thai">
        <option value="PENDING">Dang cho duyet</option>
        <option value="APPROVED">Da duyet</option>
        <option value="REJECTED">Da tu choi</option>
        <option value="ALL">Tat ca</option>
      </select>
      <button type="button" className="btn btn-outline" onClick={onReload} disabled={loading}>
        <RefreshCw size={16} /> Tai lai
      </button>
    </div>
  );
}
