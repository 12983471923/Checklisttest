import React, { useCallback, useState } from 'react';
import HskPanelContent from './HskPanelContent';
import './hsk.css';

import { useDashboardConfig } from '../../hooks/useDashboardConfig';
import { isAdminEmail } from '../../config/admin';

export default function FloatingHskWidget({ currentUser, userProfile }) {
  const { visibleFloatingTabs } = useDashboardConfig();
  const isAdmin = isAdminEmail(currentUser?.email) && userProfile?.role === 'admin';
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [badgeTotal, setBadgeTotal] = useState(0);

  const user = {
    uid: currentUser?.uid,
    displayName: userProfile?.displayName || currentUser?.displayName,
    email: currentUser?.email,
  };

  const handleOpen = () => {
    setClosing(false);
    setOpen(true);
  };

  const handleClose = useCallback(() => {
    setClosing(true);
    window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 260);
  }, []);

  const showWindow = open || closing;

  return (
    <>
      <button
        type="button"
        className="floating-hsk-button"
        onClick={handleOpen}
        title="Housekeeping (HSK)"
        aria-label="Open Housekeeping panel"
        aria-expanded={open}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 10.5V19C4 20.1 4.9 21 6 21H9V14H15V21H18C19.1 21 20 20.1 20 19V10.5L12 4.5L4 10.5Z"
            fill="currentColor"
          />
        </svg>
        <span className="floating-hsk-label">HSK</span>
        {badgeTotal > 0 && (
          <span className="floating-hsk-badge" aria-label={`${badgeTotal} notifications`}>
            {badgeTotal > 99 ? '99+' : badgeTotal}
          </span>
        )}
      </button>

      {/* Keep mounted for live badge counts and toast notifications */}
      <div
        className={`hsk-floating-window ${showWindow ? 'is-visible' : ''} ${closing ? 'is-closing' : showWindow ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="false"
        aria-label="Housekeeping panel"
        aria-hidden={!showWindow}
      >
        <header className="hsk-floating-header">
          <div>
            <h3>Housekeeping</h3>
            <p>Messages, handovers, requests &amp; rooms</p>
          </div>
          <button
            type="button"
            className="hsk-floating-close"
            onClick={handleClose}
            aria-label="Close Housekeeping panel"
          >
            ×
          </button>
        </header>
        <HskPanelContent
          user={user}
          role="reception"
          canManageRooms
          isAdmin={isAdmin}
          onBadgeChange={setBadgeTotal}
          visibleTabs={visibleFloatingTabs.length ? visibleFloatingTabs : undefined}
        />
      </div>
    </>
  );
}
