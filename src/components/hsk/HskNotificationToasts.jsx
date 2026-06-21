import React from 'react';

export default function HskNotificationToasts({ toasts }) {
  return (
    <div className="hsk-toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`hsk-toast hsk-toast--${t.type || 'info'}`}>
          <strong>{t.title}</strong>
          {t.body && <span>{t.body}</span>}
        </div>
      ))}
    </div>
  );
}
