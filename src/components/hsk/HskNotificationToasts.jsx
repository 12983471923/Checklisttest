import React from 'react';

export default function HskNotificationToasts({ toasts, popups, onDismissPopup }) {
  return (
    <>
      <div className="hsk-toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`hsk-toast hsk-toast--${t.type || 'info'}`}>
            <strong>{t.title}</strong>
            {t.body && <span>{t.body}</span>}
          </div>
        ))}
      </div>

      <div className="hsk-popup-stack">
        {popups.slice(0, 3).map((p) => (
          <div key={p.id} className="hsk-popup">
            <div className="hsk-popup-header">
              <strong>{p.title}</strong>
              <button type="button" onClick={() => onDismissPopup(p.id)} aria-label="Dismiss">
                ×
              </button>
            </div>
            {p.body && <p>{p.body}</p>}
          </div>
        ))}
      </div>
    </>
  );
}
