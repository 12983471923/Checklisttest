import React, { useCallback } from 'react';
import HotelInfoPanel from './HotelInfoPanel';
import HskMessagesPanel from './HskMessagesPanel';
import HskPanelContent from './HskPanelContent';
import HskNotificationToasts from './HskNotificationToasts';
import HskMobilePortal from './mobile/HskMobilePortal';
import TeamHandoverPanel from '../TeamHandoverPanel';
import { useHskNotifications } from '../../hooks/useHskNotifications';
import { useDashboardConfig } from '../../hooks/useDashboardConfig';
import { useIsMobile } from '../../hooks/useIsMobile';
import '../team-handover.css';

const DEFAULT_SIDE_TABS = ['requests', 'rooms', 'alerts'];

export default function HskPortalLayout({ user, role, canManageRooms = false, isAdmin = false }) {
  const isMobile = useIsMobile();
  const { hotelInfo, isHskWidgetVisible } = useDashboardConfig();
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

  const showHotelInfo = isHskWidgetVisible('hotel-info');
  const showHandovers = isHskWidgetVisible('team-handovers');
  const showChat = isHskWidgetVisible('chat');
  const showTools = isHskWidgetVisible('tools');

  if (isMobile) {
    return (
      <HskMobilePortal
        user={user}
        role={role}
        canManageRooms={canManageRooms}
        isAdmin={isAdmin}
      />
    );
  }

  return (
    <>
      <HskNotificationToasts toasts={toasts} popups={popups} onDismissPopup={dismissPopup} />

      <div className={`hsk-layout-portal ${!showHotelInfo && !showHandovers ? 'hsk-layout-portal--chat-only' : ''}`}>
        {(showHotelInfo || showHandovers) && (
          <aside className="hsk-portal-sidebar">
            {showHotelInfo && (
              <HotelInfoPanel hidePricing compact hotelInfo={hotelInfo} />
            )}
            {showHandovers && (
              <div className="team-handover-sidebar-card">
                <TeamHandoverPanel
                  user={user}
                  role={role}
                  isAdmin={isAdmin}
                  compact
                />
              </div>
            )}
          </aside>
        )}

        {showChat && (
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
        )}

        {showTools && (
          <aside className="hsk-portal-tools">
            <div className="hsk-tools-card">
              <header className="hsk-tools-header">
                <h3>Tasks &amp; Rooms</h3>
              </header>
              <HskPanelContent
                user={user}
                role={role}
                canManageRooms={canManageRooms}
                isAdmin={isAdmin}
                visibleTabs={DEFAULT_SIDE_TABS}
              />
            </div>
          </aside>
        )}
      </div>
    </>
  );
}
