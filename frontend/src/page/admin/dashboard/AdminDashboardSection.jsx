import {
  AlertCircle,
  AlertTriangle,
  BarChart2,
  BookCopy,
  BookOpen,
  RefreshCw,
  UserCog,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { adminApi } from '../../../api/adminApi';
import { createLatestRequestGuard } from '../../../utils/latestRequestGuard';
import { AdminActionButton } from '../components/AdminActionButton';
import { AdminEmptyState } from '../components/AdminEmptyState';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { selectOperationalChartRows } from './adminDashboardViewModel';

function formatChartLabel(label, maxLength = 15) {
  const normalized = String(label ?? '').trim() || 'Không tên';
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 1)}…`
    : normalized;
}

function AdminLineChart({ title, rows }) {
  if (rows.length === 0) {
    return (
      <article className="admin-chart admin-chart--empty">
        <div className="admin-chart__head">
          <h2>{title}</h2>
          <span>0 lượt</span>
        </div>
        <div className="admin-chart__empty">
          <BarChart2 aria-hidden="true" />
          <strong>Chưa có dữ liệu</strong>
          <span>Dữ liệu sẽ xuất hiện khi có giao dịch phù hợp.</span>
        </div>
      </article>
    );
  }

  const maxValue = Math.max(...rows.map((item) => item.value), 1);
  const width = 720;
  const height = 230;
  const padding = 36;
  const points = rows.map((item, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(rows.length - 1, 1);
    const y = height - padding - (item.value / maxValue) * (height - padding * 2);
    return { ...item, x, y };
  });
  const path = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
  const total = rows.reduce((sum, item) => sum + item.value, 0);

  return (
    <article className="admin-chart">
      <div className="admin-chart__head">
        <h2>{title}</h2>
        <span>{total} lượt</span>
      </div>
      <svg className="admin-chart__plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
        {[0, 1, 2, 3, 4].map((line) => {
          const y = padding + (line * (height - padding * 2)) / 4;
          const tickValue = Number((maxValue * (1 - line / 4)).toFixed(maxValue < 4 ? 2 : 0));
          return (
            <g key={line}>
              <line x1={padding} x2={width - padding} y1={y} y2={y} />
              <text className="admin-chart__axis" x={padding - 10} y={y + 3}>{tickValue}</text>
            </g>
          );
        })}
        <path d={path} />
        {points.map((point) => (
          <g key={point.label}>
            <title>{`${point.label}: ${point.value} lượt`}</title>
            <circle cx={point.x} cy={point.y} r="5" />
            <text className="admin-chart__value" x={point.x} y={Math.max(point.y - 11, 16)}>
              {point.value}
            </text>
            <text x={point.x} y={height - 9}>{formatChartLabel(point.label)}</text>
          </g>
        ))}
      </svg>
      <ol className="admin-chart__list">
        {rows.map((item) => (
          <li key={item.label}>
            <span title={String(item.label)}>{formatChartLabel(item.label, 28)}</span>
            <strong>{item.value}</strong>
          </li>
        ))}
      </ol>
    </article>
  );
}

export function AdminDashboardSection() {
  const requestGuard = useRef(createLatestRequestGuard());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);

  const loadDashboard = useCallback(async () => {
    const token = requestGuard.current.begin();
    setLoading(true);
    setError('');

    try {
      const result = await adminApi.dashboard();
      if (!requestGuard.current.isLatest(token)) return;
      setData(result);
      setUpdatedAt(new Date());
    } catch (loadError) {
      if (!requestGuard.current.isLatest(token)) return;
      setError(loadError.message || 'Không thể tải tổng quan quản trị.');
    } finally {
      if (requestGuard.current.isLatest(token)) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(loadDashboard, 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  const mostBorrowed = selectOperationalChartRows(data?.charts?.mostBorrowed);
  const overdue = selectOperationalChartRows(data?.charts?.overdue);
  const returnedToday = selectOperationalChartRows(data?.charts?.returnedToday);

  const summary = [
    { label: 'Tổng số sách', value: data?.summary?.totalBooks || 0, icon: BookOpen },
    { label: 'Tổng số thành viên', value: data?.summary?.totalMembers || 0, icon: Users },
    { label: 'Tác giả', value: data?.summary?.totalAuthors || 0, icon: UserCog },
    { label: 'Sách đang được mượn', value: data?.summary?.totalBorrowed || 0, icon: BookCopy },
    { label: 'Sách mượn quá hạn', value: data?.summary?.overdueBorrowed || 0, icon: AlertTriangle },
  ];

  return (
    <section className="admin-dashboard">
      <AdminPageHeader
        eyebrow="Tình hình vận hành"
        title="Tổng quan"
        refreshing={loading && Boolean(data)}
        onRefresh={loadDashboard}
      />

      <div className="admin-section-status" aria-live="polite">
        <span>
          {loading && data
            ? 'Đang cập nhật...'
            : updatedAt
              ? `Cập nhật lần cuối lúc ${updatedAt.toLocaleTimeString('vi-VN')}`
              : 'Chưa có lần cập nhật thành công.'}
        </span>
        {error && data ? (
          <span className="admin-inline-error">
            <AlertCircle aria-hidden="true" />
            Không thể làm mới: {error}
            <AdminActionButton icon={RefreshCw} label="Thử lại" onClick={loadDashboard} />
          </span>
        ) : null}
      </div>

      {!data && loading ? (
        <AdminEmptyState
          icon={RefreshCw}
          title="Đang đồng bộ dữ liệu"
          description="Hệ thống đang lấy số liệu vận hành mới nhất."
        />
      ) : null}

      {!data && error ? (
        <AdminEmptyState
          icon={AlertCircle}
          title="Chưa thể tải tổng quan"
          description={error}
          action={<AdminActionButton icon={RefreshCw} label="Thử lại" tone="primary" onClick={loadDashboard} />}
        />
      ) : null}

      {data ? (
        <>
          <section className="admin-dashboard__stats" aria-label="Chỉ số tổng quan">
            {summary.map(({ label, value, icon: Icon }) => (
              <article className="admin-dashboard__stat" key={label}>
                <Icon aria-hidden="true" />
                <div>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              </article>
            ))}
          </section>

          <section className="admin-dashboard__charts" aria-label="Biểu đồ vận hành">
            <AdminLineChart title="Top sách được mượn" rows={mostBorrowed} />
            <AdminLineChart title="Sách đang mượn quá hạn" rows={overdue} />
            <AdminLineChart title="Sách trả trong hôm nay" rows={returnedToday} />
          </section>
        </>
      ) : null}
    </section>
  );
}
