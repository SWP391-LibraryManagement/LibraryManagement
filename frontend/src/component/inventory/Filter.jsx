import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { DataToolbar } from '../shared/OperationalPatterns';
import { getStatusLabel } from '../../utils/uiLabels';

const STATUS_OPTIONS = ['AVAILABLE', 'BORROWED', 'RESERVED', 'DAMAGED', 'LOST', 'INACTIVE'];

export default function Filter({ filters, onChange, onApply, onReset, loading }) {
  function update(field, value) {
    onChange({ ...filters, [field]: value });
  }

  const hasFilters = Object.values(filters).some((value) => String(value).trim());

  return (
    <form className="lib-card" style={{ marginBottom: 18 }} onSubmit={onApply}>
      <DataToolbar
        primary={<input className="input" value={filters.q} onChange={(event) => update('q', event.target.value)} placeholder="Tìm đầu sách, tác giả, ISBN, barcode..." aria-label="Tìm trong kho" />}
        filters={(
          <>
            <input className="input" value={filters.barcode} onChange={(event) => update('barcode', event.target.value)} placeholder="Barcode" aria-label="Lọc theo barcode" />
            <input className="input" value={filters.location} onChange={(event) => update('location', event.target.value)} placeholder="Vị trí" aria-label="Lọc theo vị trí" />
            <select className="select" value={filters.status} onChange={(event) => update('status', event.target.value)} aria-label="Lọc theo trạng thái">
              <option value="">Mọi trạng thái</option>
              {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{getStatusLabel(status)}</option>)}
            </select>
          </>
        )}
        actions={<><button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Đang tải...' : 'Áp dụng'}</button><button type="button" className="btn btn-outline" onClick={onReset} disabled={loading || !hasFilters}><RestartAltIcon fontSize="small" /> Đặt lại</button></>}
      />
    </form>
  );
}
