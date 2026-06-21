import React, { useCallback } from 'react';
import HotelInfoPanel from './HotelInfoPanel';
import HskMessagesPanel from './HskMessagesPanel';
import HskPanelContent from './HskPanelContent';
import HskNotificationToasts from './HskNotificationToasts';
import { useHskNotifications } from '../../hooks/useHskNotifications';

const PORTAL_SIDE_TABS = ['requests', 'rooms', 'alerts'];

export default function HskPortalLayout({ user, role, canManageRooms = false }) {
  const {
    toasts,
    popups,
    pushNotification,
    dismissPopup,
  } = useHskNotifications();

  const handleNewMessage = useCallback(
    (msg) => {
      pushNotification({
        type: 'message',
        title: 'New message from Reception',
        body: msg.text,
      });
    },
    [pushNotification]
  );

  return (
    <>
      <HskNotificationToasts toasts={toasts} popups={popups} onDismissPopup={dismissPopup} />

      <div className="hsk-layout-portal">
        <aside className="hsk-portal-sidebar">
          <HotelInfoPanel hidePricing compact />
        </aside>

        <section className="hsk-portal-center" aria-label="HSK Chat">
          <div className="hsk-chat-primary">
            <header className="hsk-chat-primary-header">
              <div>
                <h2>HSK Chat</h2>
                <p>Real-time messaging with Reception</p>
              </div>
            </header>
            <HskMessagesPanel
              user={user}
              role={role}
              onNewMessage={handleNewMessage}
              primary
            />
          </div>
        </section>

        <aside className="hsk-portal-tools">
          <div className="hsk-tools-card">
            <header className="hsk-tools-header">
              <h3>Tasks &amp; Rooms</h3>
            </header>
            <HskPanelContent
              user={user}
              role={role}
              canManageRooms={canManageRooms}
              visibleTabs={PORTAL_SIDE_TABS}
            />
          </div>
        </aside>
      </div>
    </>
  );
}
