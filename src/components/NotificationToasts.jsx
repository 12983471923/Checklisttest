import React, { useEffect, useState, useRef } from 'react';

let toastId = 0;

export function useNotifications() {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info', duration = 5000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, showToast, dismissToast };
}

export default function NotificationToasts({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="notification-toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`notification-toast notification-toast-${toast.type}`}
          role="alert"
        >
          <span className="notification-toast-message">{toast.message}</span>
          <button
            type="button"
            className="notification-toast-close"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export function useRealtimeNotifications(items, { showToast, type, filter, formatMessage }) {
  const [seenIds, setSeenIds] = useState(new Set());
  const [initialized, setInitialized] = useState(false);
  const optionsRef = useRef({ showToast, type, filter, formatMessage });
  optionsRef.current = { showToast, type, filter, formatMessage };

  useEffect(() => {
    const { showToast: notify, filter: filterFn, formatMessage: format } = optionsRef.current;

    if (!items.length) {
      if (!initialized) setInitialized(true);
      return;
    }

    if (!initialized) {
      setSeenIds(new Set(items.map((item) => item.id)));
      setInitialized(true);
      return;
    }

    const newItems = items.filter((item) => !seenIds.has(item.id));
    newItems.forEach((item) => {
      if (filterFn && !filterFn(item)) return;
      notify(format(item), optionsRef.current.type || 'info');
    });

    if (newItems.length) {
      setSeenIds((prev) => {
        const next = new Set(prev);
        newItems.forEach((item) => next.add(item.id));
        return next;
      });
    }
  }, [items, initialized, seenIds]);
}
