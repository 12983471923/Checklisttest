import React, { useCallback, useEffect, useMemo, useState } from 'react';
import HotelInfoPanel from '../HotelInfoPanel';
import HskMessengerMobile from './HskMessengerMobile';
import HskPanelContent from '../HskPanelContent';
import HskMobileBottomNav, { HSK_MOBILE_NAV_ITEMS } from './HskMobileBottomNav';
import HskNotificationToasts from '../HskNotificationToasts';
import TeamHandoverPanel from '../../TeamHandoverPanel';
import { useHskNotifications } from '../../../hooks/useHskNotifications';
import { useDashboardConfig } from '../../../hooks/useDashboardConfig';
import { countUnreadMessages, countPendingRequests, subscribeMessages, subscribeRequests } from '../../../firebase/hsk';

const DEFAULT_SIDE_TABS = ['requests', 'rooms', 'alerts'];

export default function HskMobilePortal({ user, role, canManageRooms = false, isAdmin = false }) {
  const [messages, setMessages] = useState([]);
  const [requests, setRequests] = useState([]);
  const { hotelInfo, isHskWidgetVisible } = useDashboardConfig();
  const { toasts, popups, pushNotification, dismissPopup } = useHskNotifications();

  const userId = user?.uid;

  useEffect(() => subscribeMessages(setMessages), []);
  useEffect(() => subscribeRequests(setRequests), []);

  const handleNewMessage = useCallback(
    (msg) => {
      pushNotification({ type: 'message', title: 'New message', body: msg.text });
    },
    [pushNotification]
  );

  const badges = useMemo(
    () => ({
      chat: countUnreadMessages(messages, userId, role),
      tasks: countPendingRequests(requests, role),
    }),
    [messages, requests, userId, role]
  );

  const showChat = isHskWidgetVisible('chat');
  const showHandovers = isHskWidgetVisible('team-handovers');
  const showTools = isHskWidgetVisible('tools');
  const showHotelInfo = isHskWidgetVisible('hotel-info');

  const navItems = useMemo(
    () =>
      HSK_MOBILE_NAV_ITEMS.filter((item) => {
        if (item.id === 'chat') return showChat;
        if (item.id === 'tasks') return showTools;
        if (item.id === 'handovers') return showHandovers;
        if (item.id === 'info') return showHotelInfo;
        return false;
      }),
    [showChat, showTools, showHandovers, showHotelInfo]
  );

  const [tab, setTab] = useState(() => navItems[0]?.id || 'chat');

  useEffect(() => {
    if (!navItems.some((item) => item.id === tab)) {
      setTab(navItems[0]?.id || 'chat');
    }
  }, [navItems, tab]);

  return (
    <>
      <HskNotificationToasts toasts={toasts} popups={popups} onDismissPopup={dismissPopup} />

      <div className="hsk-mobile-portal">
        <main className="hsk-mobile-content">
          {tab === 'chat' && showChat && (
            <HskMessengerMobile user={user} role={role} onNewMessage={handleNewMessage} />
          )}
          {tab === 'tasks' && showTools && (
            <div className="hsk-mobile-panel">
              <header className="hsk-mobile-panel-header">
                <h2>Tasks &amp; Rooms</h2>
              </header>
              <HskPanelContent
                user={user}
                role={role}
                canManageRooms={canManageRooms}
                isAdmin={isAdmin}
                visibleTabs={DEFAULT_SIDE_TABS}
              />
            </div>
          )}
          {tab === 'handovers' && showHandovers && (
            <div className="hsk-mobile-panel">
              <header className="hsk-mobile-panel-header">
                <h2>Team Handovers</h2>
              </header>
              <TeamHandoverPanel user={user} role={role} isAdmin={isAdmin} compact embedded />
            </div>
          )}
          {tab === 'info' && showHotelInfo && (
            <div className="hsk-mobile-panel">
              <header className="hsk-mobile-panel-header">
                <h2>Hotel Info</h2>
              </header>
              <HotelInfoPanel hidePricing compact hotelInfo={hotelInfo} />
            </div>
          )}
        </main>

        <HskMobileBottomNav active={tab} onChange={setTab} badges={badges} items={navItems} />
      </div>
    </>
  );
}
