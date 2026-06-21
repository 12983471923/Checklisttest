import { useCallback, useEffect, useRef, useState } from 'react';

export function useHskNotifications() {
  const [toasts, setToasts] = useState([]);
  const [popups, setPopups] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const seenRef = useRef(new Set());

  const pushNotification = useCallback((item) => {
    const id = item.id || `${Date.now()}-${Math.random()}`;
    const entry = { ...item, id, read: false, createdAt: Date.now() };

    setPopups((prev) => [entry, ...prev].slice(0, 5));
    setToasts((prev) => [entry, ...prev].slice(0, 6));
    setUnreadCount((c) => c + 1);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const notifyIfNew = useCallback(
    (key, payload) => {
      if (seenRef.current.has(key)) return;
      seenRef.current.add(key);
      pushNotification(payload);
    },
    [pushNotification]
  );

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
    setPopups((prev) => prev.map((p) => ({ ...p, read: true })));
  }, []);

  const dismissPopup = useCallback((id) => {
    setPopups((prev) => prev.filter((p) => p.id !== id));
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      if (seenRef.current.size > 500) seenRef.current.clear();
    }, 600000);
    return () => clearInterval(t);
  }, []);

  return {
    toasts,
    popups,
    unreadCount,
    pushNotification,
    notifyIfNew,
    markAllRead,
    dismissPopup,
  };
}
