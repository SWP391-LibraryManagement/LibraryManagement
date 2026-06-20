/**
 * Biểu đồ CSS đơn giản (không cần thư viện chart) cho FE12.
 * Dùng class .bars / .donut / .legend trong app-shell.css.
 */

const PALETTE = ['#c78a3b', '#a86f28', '#2f8f5b', '#3a6ea5', '#c1452f', '#6b6153'];

/** Biểu đồ cột. data: [{ label, value, alt? }] */
export function BarChart({ data, height = 220, format = (v) => v }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="bars" style={{ height }}>
      {data.map((d) => (
        <div className="bar-col" key={d.label}>
          <span className="bar-val">{format(d.value)}</span>
          <div className={`bar${d.alt ? ' alt' : ''}`} style={{ height: `${(d.value / max) * 100}%` }} />
          <span className="bar-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Biểu đồ đường dạng SVG đơn giản. data: [{ label, value }] */
export function LineChart({ data, height = 220, format = (v) => v }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 600;
  const H = height;
  const pad = 28;
  const step = data.length > 1 ? (W - pad * 2) / (data.length - 1) : 0;
  const points = data.map((d, i) => {
    const x = pad + i * step;
    const y = H - pad - (d.value / max) * (H - pad * 2);
    return [x, y];
  });
  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${path} L${points[points.length - 1][0].toFixed(1)},${H - pad} L${pad},${H - pad} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height }} role="img">
      <path d={area} fill="rgba(199,138,59,0.12)" />
      <path d={path} fill="none" stroke="#c78a3b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="4" fill="#c78a3b" />
          <text x={x} y={y - 10} textAnchor="middle" fontSize="11" fill="#6b6153">{format(data[i].value)}</text>
          <text x={x} y={H - 8} textAnchor="middle" fontSize="11" fill="#6b6153">{data[i].label}</text>
        </g>
      ))}
    </svg>
  );
}

/** Biểu đồ donut. data: [{ label, value, color? }] */
export function DonutChart({ data, centerLabel, centerValue }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const segments = data.map((d, i) => {
    const prev = data.slice(0, i).reduce((s, x) => s + x.value, 0);
    const start = (prev / total) * 360;
    const end = ((prev + d.value) / total) * 360;
    return `${d.color || PALETTE[i % PALETTE.length]} ${start}deg ${end}deg`;
  });

  return (
    <div className="row-flex" style={{ gap: 24, flexWrap: 'wrap' }}>
      <div className="donut" style={{ background: `conic-gradient(${segments.join(', ')})` }}>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', zIndex: 1, flexDirection: 'column' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="kpi-value" style={{ fontSize: 24 }}>{centerValue ?? total}</div>
            {centerLabel && <div className="muted" style={{ fontSize: 12 }}>{centerLabel}</div>}
          </div>
        </div>
      </div>
      <div className="legend">
        {data.map((d, i) => (
          <div className="legend-item" key={d.label}>
            <span className="legend-dot" style={{ background: d.color || PALETTE[i % PALETTE.length] }} />
            <span style={{ flex: 1 }}>{d.label}</span>
            <strong>{d.value}</strong>
            <span className="muted" style={{ fontSize: 12 }}>({Math.round((d.value / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
