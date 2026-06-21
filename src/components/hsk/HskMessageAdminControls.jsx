import React, { useEffect, useMemo, useState } from 'react';
import HskConfirmDialog from './HskConfirmDialog';
import {
  MESSAGE_VIEWS,
  TRASH_RETENTION_DAYS,
  filterMessagesByView,
  countMessagesByView,
  archiveMessages,
  softDeleteMessages,
  restoreMessages,
  permanentlyDeleteMessages,
  purgeExpiredTrashMessages,
} from '../../firebase/hsk';

const VIEW_LABELS = {
  active: 'Active',
  archived: 'Archived',
  trash: 'Trash',
  all: 'All',
};

export default function HskMessageAdminControls({
  messages,
  user,
  canManage = false,
  messageView,
  onViewChange,
  compact = false,
}) {
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const counts = useMemo(
    () =>
      MESSAGE_VIEWS.reduce((acc, view) => {
        acc[view] = countMessagesByView(messages, view);
        return acc;
      }, {}),
    [messages]
  );

  useEffect(() => {
    if (!canManage || messageView !== 'trash') return;
    purgeExpiredTrashMessages(messages, user).catch(() => {});
  }, [canManage, messageView, messages, user]);

  const runAction = async (action) => {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (err) {
      console.error('HSK message admin action failed:', err);
      setError(err?.message || 'Could not complete that action. Please try again.');
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const requestConfirm = (config) => setConfirm(config);

  if (!canManage) return null;

  return (
    <>
      <div className={`hsk-admin-bar ${compact ? 'hsk-admin-bar--compact' : ''}`}>
        <div className="hsk-filter-row hsk-filter-row--counts">
          {MESSAGE_VIEWS.map((view) => (
            <button
              key={view}
              type="button"
              className={messageView === view ? 'active' : ''}
              onClick={() => onViewChange(view)}
            >
              {VIEW_LABELS[view]}
              <span className="hsk-filter-count">{counts[view]}</span>
            </button>
          ))}
        </div>

        <div className="hsk-admin-actions">
          {messageView === 'active' && counts.active > 0 && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  runAction(() => archiveMessages(filterMessagesByView(messages, 'active'), user))
                }
              >
                Archive all
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  requestConfirm({
                    title: 'Move messages to trash?',
                    message: 'All active messages will move to Trash for 30 days before permanent removal.',
                    confirmLabel: 'Move to trash',
                    danger: true,
                    action: () =>
                      softDeleteMessages(filterMessagesByView(messages, 'active'), user),
                  })
                }
              >
                Clear all
              </button>
            </>
          )}

          {messageView === 'archived' && counts.archived > 0 && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  runAction(() => restoreMessages(filterMessagesByView(messages, 'archived')))
                }
              >
                Restore all
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  requestConfirm({
                    title: 'Move archived to trash?',
                    message: 'Archived messages will move to Trash for 30 days.',
                    confirmLabel: 'Move to trash',
                    danger: true,
                    action: () =>
                      softDeleteMessages(filterMessagesByView(messages, 'archived'), user),
                  })
                }
              >
                Trash all
              </button>
            </>
          )}

          {messageView === 'trash' && counts.trash > 0 && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  runAction(() => restoreMessages(filterMessagesByView(messages, 'trash')))
                }
              >
                Restore all
              </button>
              <button
                type="button"
                className="is-danger"
                disabled={busy}
                onClick={() =>
                  requestConfirm({
                    title: 'Permanently delete all trash?',
                    message: 'This cannot be undone. All messages in Trash will be permanently removed.',
                    confirmLabel: 'Delete permanently',
                    danger: true,
                    action: () =>
                      permanentlyDeleteMessages(filterMessagesByView(messages, 'trash'), user),
                  })
                }
              >
                Empty trash
              </button>
            </>
          )}
        </div>

        {error && <p className="hsk-admin-error" role="alert">{error}</p>}

        {messageView === 'trash' && (
          <p className="hsk-admin-hint">
            Trash items are kept for {TRASH_RETENTION_DAYS} days, then removed automatically.
          </p>
        )}
      </div>

      <HskConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        danger={confirm?.danger}
        onCancel={() => setConfirm(null)}
        onConfirm={() => runAction(confirm.action)}
      />
    </>
  );
}

export { filterMessagesByView, countMessagesByView };
