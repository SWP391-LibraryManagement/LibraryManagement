import { Bell, ChevronRight, Inbox, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { notificationInboxApi } from '../../api/libraryFeatureApi';
import { useNotificationInbox } from '../../context/NotificationInboxContext';
import { formatUnreadBadge } from '../../utils/notificationInboxViewModel';

function formatNotificationTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount, openNotification } = useNotificationInbox();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const rootRef = useRef(null);
  const bellRef = useRef(null);
  const requestSequenceRef = useRef(0);
  const titleId = useId();
  const badge = formatUnreadBadge(unreadCount);

  const loadPreview = useCallback(async () => {
    const requestSequence = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestSequence;
    setLoading(true);
    setError(null);

    try {
      const response = await notificationInboxApi.listMine({ readState: 'unread', page: 1, limit: 5 });
      if (!Array.isArray(response?.notifications)) {
        throw new Error('Phản hồi danh sách thông báo không hợp lệ.');
      }
      if (requestSequence === requestSequenceRef.current) {
        setItems(response.notifications.slice(0, 5));
      }
    } catch (requestError) {
      if (requestSequence === requestSequenceRef.current) {
        setError(requestError?.message || 'Không thể tải thông báo.');
      }
    } finally {
      if (requestSequence === requestSequenceRef.current) setLoading(false);
    }
  }, []);

  function togglePreview() {
    if (!open) {
      setOpen(true);
      loadPreview();
      return;
    }
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return undefined;

    function closeOnOutsidePointer(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        setOpen(false);
        window.requestAnimationFrame(() => bellRef.current?.focus());
      }
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    const timer = window.setTimeout(() => setOpen(false), 0);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  async function selectNotification(notification) {
    setOpen(false);
    await openNotification(notification);
  }

  function viewAll() {
    setOpen(false);
    navigate('/notifications');
  }

  return (
    <div className="notification-bell" ref={rootRef}>
      <button
        ref={bellRef}
        type="button"
        className="app-icon-btn notification-bell-trigger"
        onClick={togglePreview}
        aria-label="Mở thông báo"
        aria-expanded={open}
        aria-controls="notification-preview"
      >
        <Bell size={20} aria-hidden="true" />
        {badge && <span className="notification-badge" aria-label={`${unreadCount} thông báo chưa đọc`}>{badge}</span>}
      </button>

      {open && (
        <section
          id="notification-preview"
          className="notification-popover"
          role="region"
          aria-labelledby={titleId}
        >
          <header className="notification-popover-header">
            <div>
              <span className="notification-kicker">Hộp thư cá nhân</span>
              <h2 id={titleId}>Thông báo mới</h2>
            </div>
            {badge && <span className="notification-count-copy">{badge} chưa đọc</span>}
          </header>

          <div className="notification-preview-list" aria-live="polite">
            {loading && (
              <div className="notification-preview-state" role="status">
                <RefreshCw size={18} className="notification-spin" aria-hidden="true" />
                <span>Đang tải thông báo...</span>
              </div>
            )}

            {!loading && error && (
              <div className="notification-preview-state notification-preview-error" role="alert">
                <span>Không thể tải thông báo.</span>
                <button type="button" className="notification-retry" onClick={loadPreview}>Thử lại</button>
              </div>
            )}

            {!loading && !error && items.length === 0 && (
              <div className="notification-preview-state">
                <Inbox size={20} aria-hidden="true" />
                <span>Chưa có thông báo mới.</span>
              </div>
            )}

            {!loading && !error && items.map((item) => (
              <button
                key={item.notificationId}
                type="button"
                className="notification-preview-item"
                onClick={() => selectNotification(item)}
              >
                <span className="notification-preview-copy">
                  <strong>{item.title}</strong>
                  <span>{item.message}</span>
                  <time dateTime={item.createdAt}>{formatNotificationTime(item.createdAt)}</time>
                </span>
                <ChevronRight size={17} aria-hidden="true" />
              </button>
            ))}
          </div>

          <button type="button" className="notification-view-all" onClick={viewAll}>
            Xem tất cả
            <ChevronRight size={17} aria-hidden="true" />
          </button>
        </section>
      )}
    </div>
  );
}
