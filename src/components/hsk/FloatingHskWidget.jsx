import React, { useCallback, useEffect, useState } from 'react';
import HskPanelContent from './HskPanelContent';
import './hsk.css';
import './mobile/hsk-mobile.css';

import { useDashboardConfig } from '../../hooks/useDashboardConfig';
import { isAdminEmail } from '../../config/admin';
import {
  subscribeMessages,
  subscribeRequests,
  countUnreadMessages,
  countPendingRequests,
} from '../../firebase/hsk';

export default function FloatingHskWidget({ currentUser, userProfile }) {
  const { visibleFloatingTabs } = useDashboardConfig();
  const isAdmin = isAdminEmail(currentUser?.email) && userProfile?.role === 'admin';
  const [open, setOpen] = useState(false);
  const [badgeTotal, setBadgeTotal] = useState(0);

  const user = {
    uid: currentUser?.uid,
    displayName: userProfile?.displayName || currentUser?.displayName,
    email: currentUser?.email,
  };

  const userId = user?.uid;

  useEffect(() => {
    if (!userId) return undefined;
    let messages = [];
    let requests = [];
    const refreshBadge = () => {
      const msgUnread = countUnreadMessages(messages, userId, 'reception');
      const reqPending = countPendingRequests(requests, 'reception');
      setBadgeTotal(msgUnread + reqPending);
    };
    const unsubMessages = subscribeMessages((next) => {
      messages = next;
      refreshBadge();
    });
    const unsubRequests = subscribeRequests((next) => {
      requests = next;
      refreshBadge();
    });
    return () => {
      unsubMessages();
      unsubRequests();
    };
  }, [userId]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleOpen = () => setOpen(true);
  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        className="floating-hsk-button"
        onClick={handleOpen}
        title="Housekeeping (HSK)"
        aria-label="Open HSK Management panel"
        aria-expanded={open}
      >
        <span className="material-symbols-outlined" aria-hidden="true">cleaning_services</span>
        {badgeTotal > 0 && (
          <span className="floating-hsk-badge" aria-label={`${badgeTotal} notifications`}>
            {badgeTotal > 99 ? '99+' : badgeTotal}
          </span>
        )}
      </button>

      {open && (
        <div className="hsk-modal-overlay" onClick={handleClose} role="presentation">
          <div
            className="hsk-modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hsk-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="hsk-modal-header">
              <div className="hsk-modal-header-text">
                <span className="hsk-modal-eyebrow">Front Desk · Scandic Falkoner</span>
                <h2 id="hsk-modal-title">HSK Management</h2>
                <p>Messages, tasks, handovers, and room status — all in one place.</p>
              </div>
              <button
                type="button"
                className="hsk-modal-close"
                onClick={handleClose}
                aria-label="Close HSK Management panel"
              >
                ×
              </button>
            </header>

            <div className="hsk-modal-body">
              <HskPanelContent
                user={user}
                role="reception"
                canManageRooms
                isAdmin={isAdmin}
                visibleTabs={visibleFloatingTabs.length ? visibleFloatingTabs : undefined}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
