import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { DataToolbar } from '../shared/OperationalPatterns';

export default function Filter({ filters, onChange, onReset }) {
  function update(field, value) {
    onChange({ ...filters, [field]: value });
  }

  const hasFilters = Object.values(filters).some((value) => String(value).trim());

  return (
    <div className="lib-card" style={{ marginBottom: 18 }}>
      <DataToolbar
        primary={<input className="input" value={filters.barcode} onChange={(event) => update('barcode', event.target.value)} placeholder="Barcode" aria-label="Lọc theo barcode" />}
        filters={(
          <>
            <input className="input" value={filters.location} onChange={(event) => update('location', event.target.value)} placeholder="Vị trí" aria-label="Lọc theo vị trí" />
            <select className="select" value={filters.status} onChange={(event) => update('status', event.target.value)} aria-label="Lọc theo trạng thái">
              <option value="">Mọi trạng thái</option>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="BORROWED">BORROWED</option>
              <option value="RESERVED">RESERVED</option>
              <option value="DAMAGED">DAMAGED</option>
              <option value="LOST">LOST</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </>
        )}
        actions={<button type="button" className="btn btn-outline" onClick={onReset} disabled={!hasFilters}><RestartAltIcon fontSize="small" /> Đặt lại</button>}
      />
    </div>
  );
}
