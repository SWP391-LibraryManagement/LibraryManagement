import { BellRing, CheckCheck, Inbox, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { notificationInboxApi } from '../../api/libraryFeatureApi';
import AppLayout from '../../component/layout/AppLayout';
import { DataNotice, EmptyState, LoadingBlock, Toast, useToast } from '../../component/shared/Feedback';
import { DataToolbar, Pagination } from '../../component/shared/OperationalPatterns';
import { useNotificationInbox } from '../../context/NotificationInboxContext';

const FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'unread', label: 'Chưa đọc' },
  { key: 'read', label: 'Đã đọc' },
];
const PAGE_SIZE = 20;

const TYPE_LABELS = {
  GENERAL_SYSTEM: 'Hội viên',
  RESERVATION_AVAILABLE: 'Đặt chỗ',
  DUE_DATE_REMINDER: 'Hạn trả',
  OVERDUE_NOTICE: 'Quá hạn',
  FINE_NOTICE: 'Tiền phạt',
};

function formatNotificationDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Không rõ thời gian';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function emptyPagination(page) {
  return { page, limit: PAGE_SIZE, total: 0, totalPages: 0 };
}

export default function NotificationsPage() {
  const { markAllRead, openNotification } = useNotificationInbox();
  const [items, setItems] = useState([]);
  const [readState, setReadState] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(emptyPagination(1));
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState(null);
  const [toast, showToast, clearToast] = useToast();
  const requestSequenceRef = useRef(0);

  const loadNotifications = useCallback(async (requestedPage) => {
    const requestSequence = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestSequence;
    setLoading(true);
    setError(null);

    try {
      let response = await notificationInboxApi.listMine({ page: requestedPage, limit: PAGE_SIZE, readState });
      if (!Array.isArray(response?.notifications)) {
        throw new Error('Phản hồi danh sách thông báo không hợp lệ.');
      }

      const reportedTotalPages = Number(response.pagination?.totalPages);
      const lastValidPage = Number.isInteger(reportedTotalPages) && reportedTotalPages > 0
        ? reportedTotalPages
        : 1;

      if (response.notifications.length === 0 && requestedPage > lastValidPage) {
        response = await notificationInboxApi.listMine({ page: lastValidPage, limit: PAGE_SIZE, readState });
        if (!Array.isArray(response?.notifications)) {
          throw new Error('Phản hồi danh sách thông báo không hợp lệ.');
        }
        if (requestSequence === requestSequenceRef.current) setPage(lastValidPage);
      }

      if (requestSequence === requestSequenceRef.current) {
        setItems(response.notifications);
        setPagination(response.pagination || emptyPagination(requestedPage));
      }
    } catch (loadError) {
      if (requestSequence === requestSequenceRef.current) {
        setError(loadError?.message || 'Không thể tải hộp thư thông báo.');
      }
    } finally {
      if (requestSequence === requestSequenceRef.current) setLoading(false);
    }
  }, [readState]);

  useEffect(() => {
    const timer = window.setTimeout(() => loadNotifications(page), 0);
    return () => window.clearTimeout(timer);
  }, [loadNotifications, page]);

  async function handleMarkAllRead() {
    if (markingAll) return;
    setMarkingAll(true);
    try {
      const result = await markAllRead();
      await loadNotifications(page);
      showToast(
        result?.updated > 0
          ? `Đã đánh dấu ${result.updated} thông báo là đã đọc.`
          : 'Không còn thông báo chưa đọc.',
        'success',
      );
    } catch (markError) {
      showToast(markError?.message || 'Không thể đánh dấu tất cả thông báo đã đọc.', 'error');
    } finally {
      setMarkingAll(false);
    }
  }

  const totalPages = Math.max(1, Number(pagination.totalPages) || 0);
  const currentPage = Math.min(Number(pagination.page) || page, totalPages);

  return (
    <AppLayout
      title="Thông báo của bạn"
      subtitle="Theo dõi các cập nhật nghiệp vụ dành riêng cho tài khoản đang đăng nhập."
      actions={(
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => loadNotifications(page)}
          disabled={loading || markingAll}
        >
          <RefreshCw size={16} aria-hidden="true" />
          Tải lại
        </button>
      )}
    >
      {error && (
        <DataNotice
          type="error"
          title="Không thể tải hộp thư"
          action={(
            <button type="button" className="btn btn-outline btn-sm" onClick={() => loadNotifications(page)}>
              Thử lại
            </button>
          )}
        >
          {error}
        </DataNotice>
      )}

      <section className="lib-card notifications-page-card" aria-labelledby="notifications-list-title">
        <DataToolbar
          primary={(
            <div className="tabs" role="tablist" aria-label="Lọc trạng thái thông báo">
              {FILTERS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={readState === item.key}
                  className={`tab${readState === item.key ? ' active' : ''}`}
                  onClick={() => { setReadState(item.key); setPage(1); }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
          summary={<span>{pagination.total || 0} thông báo</span>}
          actions={(
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleMarkAllRead}
              disabled={loading || markingAll || items.length === 0}
            >
              <CheckCheck size={16} aria-hidden="true" />
              {markingAll ? 'Đang cập nhật...' : 'Đánh dấu tất cả đã đọc'}
            </button>
          )}
        />

        <h2 id="notifications-list-title" className="sr-only">Danh sách thông báo cá nhân</h2>
        {loading && <LoadingBlock rows={5} label="Đang tải thông báo..." />}

        {!loading && !error && items.length === 0 && (
          <EmptyState icon={Inbox} title="Chưa có thông báo">
            Các cập nhật mới về hội viên, đặt chỗ, hạn trả và tiền phạt sẽ xuất hiện tại đây.
          </EmptyState>
        )}

        {!loading && items.length > 0 && (
          <div className="notifications-list">
            {items.map((item) => (
              <button
                key={item.notificationId}
                type="button"
                className={`notification-item${item.readAt ? ' read' : ' unread'}`}
                onClick={() => openNotification(item)}
              >
                <span className="notification-item-mark" aria-hidden="true"><BellRing size={17} /></span>
                <span className="notification-item-body">
                  <span className="notification-item-meta">
                    <span className="notification-type">{TYPE_LABELS[item.type] || 'Thông báo'}</span>
                    <time dateTime={item.createdAt}>{formatNotificationDate(item.createdAt)}</time>
                  </span>
                  <strong>{item.title}</strong>
                  <span>{item.message}</span>
                </span>
                <span className="notification-read-state">
                  {item.readAt ? 'Đã đọc' : 'Chưa đọc'}
                </span>
              </button>
            ))}
          </div>
        )}

        {!loading && !error && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
            summary={`Trang ${currentPage}/${totalPages}`}
            ariaLabel="Phân trang thông báo"
          />
        )}
      </section>
      <Toast toast={toast} onClose={clearToast} />
    </AppLayout>
  );
}
