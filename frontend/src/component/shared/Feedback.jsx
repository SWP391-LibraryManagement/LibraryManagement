/**
 * Shared UI primitives cho FE07/FE08/FE10/FE12.
 * Dùng class trong src/styles/app-shell.css (theme thư viện kem/be).
 * Không phụ thuộc MUI/Bootstrap - phù hợp React + lucide-react.
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

/* -------- Toast -------- */
export function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(onClose, 3200);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const Icon = toast.type === 'error' ? AlertTriangle : toast.type === 'info' ? Info : CheckCircle2;

  return (
    <div className={`lib-toast ${toast.type || 'success'}`} role="status">
      <Icon size={18} />
      <span>{toast.message}</span>
    </div>
  );
}

/** Hook tiện dụng: const [toast, showToast] = useToast(); showToast('msg', 'success') */
// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((message, type = 'success') => setToast({ message, type }), []);
  const clear = useCallback(() => setToast(null), []);
  return [toast, show, clear];
}

/* -------- Modal -------- */
export function Modal({ title, eyebrow, onClose, children, actions, width }) {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const dialog = dialogRef.current;
    const getFocusable = () => Array.from(dialog?.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    ) || []);

    (getFocusable()[0] || dialog)?.focus();

    function onKey(e) {
      if (e.key === 'Escape') onClose?.();

      if (e.key === 'Tab') {
        const focusable = getFocusable();
        if (!focusable.length) {
          e.preventDefault();
          dialog?.focus();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [onClose]);

  return (
    <div className="lib-modal-backdrop" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        className="lib-modal"
        style={width ? { width: `min(${width}px, 100%)` } : undefined}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="lib-modal-header">
          <div>
            {eyebrow && <p className="muted" style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>{eyebrow}</p>}
            <h2 id={titleId} className="lib-modal-title">{title}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="lib-modal-body">{children}</div>
        {actions && <div className="lib-modal-actions">{actions}</div>}
      </div>
    </div>
  );
}

/* -------- Badge -------- */
export function Badge({ status, children }) {
  const key = String(status || 'default').toLowerCase().replace(/\s+/g, '-');
  return <span className={`badge badge-${key}`}>{children || status}</span>;
}

/* -------- Data state primitives -------- */
export function DataNotice({ type = 'info', title, children }) {
  const Icon = type === 'error' ? AlertTriangle : type === 'success' ? CheckCircle2 : Info;
  return (
    <div className={`data-notice ${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon size={17} />
      <div>
        {title && <strong>{title}</strong>}
        {children && <p>{children}</p>}
      </div>
    </div>
  );
}

export function LoadingBlock({ rows = 3, label = 'Đang tải dữ liệu...' }) {
  return (
    <div className="loading-block" aria-busy="true" aria-label={label}>
      <span className="muted">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <i key={index} style={{ width: `${92 - index * 10}%` }} />
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon = Info, title = 'Chưa có dữ liệu', children }) {
  return (
    <div className="empty">
      <Icon size={36} />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}
