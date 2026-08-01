import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { hasStoredAuth, notificationInboxApi } from '../api/libraryFeatureApi';
import { Toast } from '../component/shared/Feedback';
import { openNotificationInboxItem } from '../utils/notificationInboxViewModel';

const NotificationInboxContext = createContext(null);
// @spec FR-FE10-016 - authenticated roles receive the canonical inbox refresh/read workflow.
const INBOX_POLL_INTERVAL_MS = 60000;
const INBOX_ROLES = ['MEMBER', 'LIBRARIAN', 'ADMIN'];

function hasEligibleStoredRole() {
  if (!hasStoredAuth()) return false;

  for (const storage of [localStorage, sessionStorage]) {
    const hasToken = Boolean(
      storage.getItem('accessToken') || storage.getItem('refreshToken'),
    );
    const rawUser = storage.getItem('authUser');
    if (!hasToken || !rawUser) continue;

    try {
      const user = JSON.parse(rawUser);
      const roles = Array.isArray(user?.roles)
        ? user.roles.map((role) => String(role || '').toUpperCase())
        : [];
      if (roles.some((role) => INBOX_ROLES.includes(role))) return true;
    } catch {
      // Ignore damaged browser storage and keep the rest of the app available.
    }
  }

  return false;
}

export function NotificationInboxProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [countError, setCountError] = useState(null);
  const [warningToast, setWarningToast] = useState(null);
  const countRequestRef = useRef(null);

  const showWarning = useCallback((message) => {
    setWarningToast({ type: 'warning', message });
  }, []);

  const clearWarning = useCallback(() => setWarningToast(null), []);

  const refreshUnreadCount = useCallback(() => {
    if (!hasEligibleStoredRole()) {
      setUnreadCount(0);
      setCountError(null);
      return Promise.resolve(0);
    }

    if (countRequestRef.current) return countRequestRef.current;

    const request = notificationInboxApi.unreadCount()
      .then((response) => {
        const nextCount = Number(response?.unreadCount);
        if (!Number.isInteger(nextCount) || nextCount < 0) {
          throw new Error('Phản hồi số thông báo chưa đọc không hợp lệ.');
        }
        setUnreadCount(nextCount);
        setCountError(null);
        return nextCount;
      })
      .catch((error) => {
        setCountError(error?.message || 'Không thể cập nhật số thông báo chưa đọc.');
        throw error;
      })
      .finally(() => {
        if (countRequestRef.current === request) countRequestRef.current = null;
      });

    countRequestRef.current = request;
    return request;
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => refreshUnreadCount().catch(() => {}), 0);
    return () => window.clearTimeout(timer);
  }, [location.pathname, refreshUnreadCount]);

  useEffect(() => {
    const refreshSafely = () => refreshUnreadCount().catch(() => {});
    const timer = window.setInterval(refreshSafely, INBOX_POLL_INTERVAL_MS);
    window.addEventListener('focus', refreshSafely);
    window.addEventListener('storage', refreshSafely);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshSafely);
      window.removeEventListener('storage', refreshSafely);
    };
  }, [refreshUnreadCount]);

  const openNotification = useCallback((notification) => (
    openNotificationInboxItem({
      notification,
      markRead: (notificationId) => notificationInboxApi.markRead(notificationId),
      refreshUnreadCount,
      navigate,
      onWarning: showWarning,
    })
  ), [navigate, refreshUnreadCount, showWarning]);

  const markAllRead = useCallback(async () => {
    try {
      const result = await notificationInboxApi.markAllRead();
      await refreshUnreadCount();
      return result;
    } catch (error) {
      showWarning(error?.message || 'Không thể đánh dấu tất cả thông báo đã đọc.');
      throw error;
    }
  }, [refreshUnreadCount, showWarning]);

  const value = useMemo(() => ({
    unreadCount,
    countError,
    refreshUnreadCount,
    openNotification,
    markAllRead,
  }), [countError, markAllRead, openNotification, refreshUnreadCount, unreadCount]);

  return (
    <NotificationInboxContext.Provider value={value}>
      {children}
      <Toast toast={warningToast} onClose={clearWarning} />
    </NotificationInboxContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotificationInbox() {
  const context = useContext(NotificationInboxContext);
  if (!context) {
    throw new Error('useNotificationInbox must be used within NotificationInboxProvider.');
  }
  return context;
}
