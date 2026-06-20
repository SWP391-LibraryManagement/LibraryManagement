/**
 * Shared UI primitives cho FE07/FE08/FE10/FE12.
 * Dùng class trong src/styles/app-shell.css (theme thư viện kem/be).
 * Không phụ thuộc MUI/Bootstrap — chỉ React + lucide-react.
 */

import { useCallback, useEffect, useState } from 'react';
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
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="modal"
        style={width ? { width: `min(${width}px, 100%)` } : undefined}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div>
            {eyebrow && <p className="muted" style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>{eyebrow}</p>}
            <h2 className="modal-title">{title}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  );
}

/* -------- Badge -------- */
export function Badge({ status, children }) {
  const key = String(status || 'default').toLowerCase().replace(/\s+/g, '-');
  return <span className={`badge badge-${key}`}>{children || status}</span>;
}
