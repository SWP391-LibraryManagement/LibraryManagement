import SearchIcon from '@mui/icons-material/Search';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

export default function Filter({ filters, onChange, onReset }) {
  function update(field, value) {
    onChange({ ...filters, [field]: value });
  }

  return (
    <div className="lib-card" style={{ marginBottom: 18 }}>
      <div className="toolbar" style={{ marginBottom: 0 }}>
        <div className="search-input">
          <SearchIcon fontSize="small" />
          <input
            value={filters.title}
            onChange={(event) => update('title', event.target.value)}
            placeholder="Tên đầu sách"
            aria-label="Lọc theo tên đầu sách"
          />
        </div>
        <input
          className="input"
          style={{ width: 220 }}
          value={filters.author}
          onChange={(event) => update('author', event.target.value)}
          placeholder="Tác giả"
          aria-label="Lọc theo tác giả"
        />
        <input
          className="input"
          style={{ width: 140 }}
          type="number"
          value={filters.fromYear}
          onChange={(event) => update('fromYear', event.target.value)}
          placeholder="Từ năm"
          aria-label="Lọc từ năm xuất bản"
        />
        <input
          className="input"
          style={{ width: 140 }}
          type="number"
          value={filters.toYear}
          onChange={(event) => update('toYear', event.target.value)}
          placeholder="Đến năm"
          aria-label="Lọc đến năm xuất bản"
        />
        <span className="spacer" />
        <button type="button" className="btn btn-outline" onClick={onReset}>
          <RestartAltIcon fontSize="small" /> Đặt lại
        </button>
      </div>
    </div>
  );
}
