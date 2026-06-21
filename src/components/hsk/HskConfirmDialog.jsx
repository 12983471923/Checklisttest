import React from 'react';

export default function HskConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="hsk-confirm-overlay" role="presentation" onClick={onCancel}>
      <div
        className="hsk-confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="hsk-confirm-title"
        aria-describedby="hsk-confirm-message"
        onClick={(e) => e.stopPropagation()}
      >
        <h4 id="hsk-confirm-title">{title}</h4>
        <p id="hsk-confirm-message">{message}</p>
        <div className="hsk-confirm-actions">
          <button type="button" className="hsk-confirm-cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`hsk-confirm-submit ${danger ? 'is-danger' : ''}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
