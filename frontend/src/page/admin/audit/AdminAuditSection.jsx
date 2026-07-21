import { Activity, ClipboardList, Clock3, FilterX, RefreshCw, Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { adminApi } from '../../../api/adminApi';
import { createLatestRequestGuard } from '../../../utils/latestRequestGuard';
import { readStoredAdminAccess } from '../adminAccess';
import { AdminActionButton } from '../components/AdminActionButton';
import { AdminDateField } from '../components/AdminDateField';
import { AdminEmptyState } from '../components/AdminEmptyState';
import { AdminFilterBar } from '../components/AdminFilterBar';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminPagination } from '../components/AdminPagination';
import {
  formatAuditAction,
  getAuditActionOptions,
} from './adminAuditPresentation';

const AUDIT_TABLE_PAGE_SIZE = 20;
const EMPTY_AUDIT_FILTERS = Object.freeze({ q: '', action: '', actorId: '', from: '', to: '' });
const AUDIT_ACTION_OPTIONS = Object.freeze(getAuditActionOptions());

function buildAuditLogParams({ page = 1, limit = AUDIT_TABLE_PAGE_SIZE, ...filters } = {}) {
  const params = { page, limit };
  const q = String(filters.q || '').trim();
  const action = String(filters.action || '').trim();
  const actorIdText = String(filters.actorId ?? '').trim();
  if (q) params.q = q;
  if (action) params.action = action;
  if (actorIdText) params.actorId = /^\d+$/.test(actorIdText) ? Number(actorIdText) : actorIdText;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  return params;
}

function getAuditTarget(log) {
  const targetType = log.target?.type || '';
  const reportType = targetType.toUpperCase() === 'REPORT' ? log.details?.reportType : null;
  return {
    label: reportType || log.target?.label || (log.target?.id ? `#${log.target.id}` : '-'),
    type: targetType,
  };
}

export function AdminAuditSection({ onToast }) {
  const requestGuard = useRef(createLatestRequestGuard());
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditFilters, setAuditFilters] = useState({ ...EMPTY_AUDIT_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState({ ...EMPTY_AUDIT_FILTERS });
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [auditUpdatedAt, setAuditUpdatedAt] = useState(null);
  const [auditPagination, setAuditPagination] = useState({ page: 1, limit: AUDIT_TABLE_PAGE_SIZE, total: 0, totalPages: 0 });

  const notify = useCallback((type, message) => onToast?.({ type, message }), [onToast]);

  const loadAuditLogs = useCallback(async (
    page = 1,
    { announce = false, filters = appliedFilters } = {},
  ) => {
    const access = readStoredAdminAccess();
    if (!access.authenticated || !access.isAdmin) {
      setAuditError('Vui lòng đăng nhập bằng tài khoản quản trị viên để xem nhật ký hoạt động.');
      return;
    }

    const token = requestGuard.current.begin();
    setAuditLoading(true);
    setAuditError('');
    try {
      const result = await adminApi.auditLogs(buildAuditLogParams({ ...filters, page, limit: AUDIT_TABLE_PAGE_SIZE }));
      if (!requestGuard.current.isLatest(token)) return;
      setAuditLogs(result.data || []);
      setAuditPagination(result.pagination || { page, limit: AUDIT_TABLE_PAGE_SIZE, total: 0, totalPages: 0 });
      setAuditUpdatedAt(new Date());
      if (announce) notify('success', 'Đã làm mới nhật ký hoạt động.');
    } catch (error) {
      if (!requestGuard.current.isLatest(token)) return;
      setAuditError(error.message);
      if (announce) notify('error', error.message);
    } finally {
      if (requestGuard.current.isLatest(token)) setAuditLoading(false);
    }
  }, [appliedFilters, notify]);

  useEffect(() => {
    const timer = window.setTimeout(() => loadAuditLogs(1), 0);
    return () => window.clearTimeout(timer);
  }, [loadAuditLogs]);

  function applyFilters() {
    setAppliedFilters({ ...auditFilters });
  }

  function resetFilters() {
    setAuditFilters({ ...EMPTY_AUDIT_FILTERS });
    setAppliedFilters({ ...EMPTY_AUDIT_FILTERS });
  }

  const hasFilters = Object.values(auditFilters).some(Boolean);

  return (
    <section className="admin-audit">
      <AdminPageHeader
        eyebrow="Theo dõi hoạt động hệ thống"
        title="Nhật ký hoạt động"
        refreshing={auditLoading}
        onRefresh={() => loadAuditLogs(auditPagination.page, { announce: true })}
      />

      <section className="admin-audit-summary" aria-label="Tổng quan nhật ký">
        <article><Activity aria-hidden="true" /><div><small>Tổng sự kiện</small><strong>{auditPagination.total}</strong><span>Hoạt động đã ghi nhận</span></div></article>
        <article><ClipboardList aria-hidden="true" /><div><small>Trang hiện tại</small><strong>{auditPagination.page}<em>/{Math.max(auditPagination.totalPages, 1)}</em></strong><span>{auditLogs.length} bản ghi đang hiển thị</span></div></article>
        <article><Clock3 aria-hidden="true" /><div><small>Cập nhật gần nhất</small><strong>{auditUpdatedAt ? auditUpdatedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</strong><span>{auditUpdatedAt ? auditUpdatedAt.toLocaleDateString('vi-VN') : 'Chưa có dữ liệu'}</span></div></article>
      </section>

      <AdminFilterBar
        className="admin-audit-filter-bar"
        actions={(
          <>
            <AdminActionButton icon={Search} label="Áp dụng" tone="primary" disabled={auditLoading} onClick={applyFilters} />
            {hasFilters ? <AdminActionButton icon={FilterX} label="Xóa lọc" disabled={auditLoading} onClick={resetFilters} /> : null}
          </>
        )}
      >
        <label className="admin-field admin-field--search">
          <span>Tìm nhật ký</span>
          <input value={auditFilters.q} maxLength={100} placeholder="Hành động, người thực hiện hoặc đối tượng" onChange={(event) => setAuditFilters((current) => ({ ...current, q: event.target.value }))} />
        </label>
        <label className="admin-field">
          <span>Hành động</span>
          <input list="admin-audit-action-options" value={auditFilters.action} maxLength={100} placeholder="Nhập hoặc chọn hành động" onChange={(event) => setAuditFilters((current) => ({ ...current, action: event.target.value }))} />
          <datalist id="admin-audit-action-options">
            {AUDIT_ACTION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </datalist>
        </label>
        <label className="admin-field">
          <span>Mã người thực hiện</span>
          <input type="number" min="1" step="1" value={auditFilters.actorId} onChange={(event) => setAuditFilters((current) => ({ ...current, actorId: event.target.value }))} />
        </label>
        <AdminDateField id="audit-from" label="Từ ngày" value={auditFilters.from} onChange={(event) => setAuditFilters((current) => ({ ...current, from: event.target.value }))} max={auditFilters.to || undefined} />
        <AdminDateField id="audit-to" label="Đến ngày" value={auditFilters.to} onChange={(event) => setAuditFilters((current) => ({ ...current, to: event.target.value }))} min={auditFilters.from || undefined} />
      </AdminFilterBar>

      <section className="admin-audit-directory">
        <header><div><h2>Danh sách hoạt động</h2><p>Theo dõi các thao tác quan trọng trong hệ thống.</p></div><span>Chỉ đọc</span></header>
        <div className="admin-table-scroll">
          <table className="admin-data-table admin-audit-table">
            <colgroup>
              <col className="admin-audit-column--action" />
              <col className="admin-audit-column--actor" />
              <col className="admin-audit-column--target" />
              <col className="admin-audit-column--ip" />
              <col className="admin-audit-column--time" />
            </colgroup>
            <thead><tr><th>Hành động</th><th>Người thực hiện</th><th>Đối tượng</th><th>IP</th><th>Thời gian</th></tr></thead>
            <tbody>{auditLogs.map((log) => {
              const action = formatAuditAction(log.action);
              const target = getAuditTarget(log);
              const createdAt = new Date(log.createdAt);
              return (
                <tr key={log.logId}>
                  <td><span className="admin-audit-action" title={action.raw}>{action.label}</span></td>
                  <td className="admin-audit-actor"><strong>{log.actor?.fullName || log.actor?.email || 'Hệ thống'}</strong>{log.actor?.fullName && log.actor?.email ? <small>{log.actor.email}</small> : null}</td>
                  <td className="admin-audit-target"><strong title={target.label}>{target.label}</strong>{target.type ? <small>{target.type}</small> : null}</td>
                  <td className="admin-audit-ip"><code>{log.ipAddress || '-'}</code></td>
                  <td className="admin-audit-time">
                    <time dateTime={log.createdAt || undefined}>
                      <span>{createdAt.toLocaleDateString('vi-VN')}</span>
                      <small>{createdAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</small>
                    </time>
                  </td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>

        {auditLoading && auditLogs.length === 0 ? <AdminEmptyState icon={RefreshCw} title="Đang tải nhật ký hoạt động" description="Dữ liệu đang được đồng bộ." /> : null}
        {!auditLoading && auditError && auditLogs.length === 0 ? <AdminEmptyState icon={Activity} title="Không thể tải nhật ký hoạt động" description={auditError} action={<AdminActionButton icon={RefreshCw} label="Thử lại" tone="primary" onClick={() => loadAuditLogs(1)} />} /> : null}
        {!auditLoading && !auditError && auditLogs.length === 0 ? <AdminEmptyState icon={Activity} title="Chưa có sự kiện nào" description="Nhật ký sẽ xuất hiện khi hệ thống ghi nhận hoạt động phù hợp." /> : null}
        <AdminPagination page={auditPagination.page} totalItems={auditPagination.total} pageSize={auditPagination.limit || AUDIT_TABLE_PAGE_SIZE} onPageChange={(page) => loadAuditLogs(page)} />
      </section>
    </section>
  );
}
