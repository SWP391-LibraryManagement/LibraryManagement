import { Activity, ClipboardList, Clock3, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { adminApi } from '../../../api/adminApi';
import { createLatestRequestGuard } from '../../../utils/latestRequestGuard';
import { readStoredAdminAccess } from '../adminAccess';
import { AdminActionButton } from '../components/AdminActionButton';
import { AdminEmptyState } from '../components/AdminEmptyState';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminPagination } from '../components/AdminPagination';
import { formatAuditAction } from './adminAuditPresentation';

const AUDIT_TABLE_PAGE_SIZE = 20;

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
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [auditUpdatedAt, setAuditUpdatedAt] = useState(null);
  const [auditPagination, setAuditPagination] = useState({ page: 1, limit: AUDIT_TABLE_PAGE_SIZE, total: 0, totalPages: 0 });

  const notify = useCallback((type, message) => onToast?.({ type, message }), [onToast]);

  const loadAuditLogs = useCallback(async (
    page = 1,
    { announce = false } = {},
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
      const result = await adminApi.auditLogs({ page, limit: AUDIT_TABLE_PAGE_SIZE });
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
  }, [notify]);

  useEffect(() => {
    const timer = window.setTimeout(() => loadAuditLogs(1), 0);
    return () => window.clearTimeout(timer);
  }, [loadAuditLogs]);

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
