import React, { useCallback, useEffect, useState } from 'react';
import HskMessagesPanel from './HskMessagesPanel';
import HskRequestsPanel from './HskRequestsPanel';
import HskRoomsPanel from './HskRoomsPanel';
import HskNotificationToasts from './HskNotificationToasts';
import {
  subscribeRooms,
  subscribeRequests,
  subscribeMessages,
  countPendingRequests,
  countUnreadMessages,
} from '../../firebase/hsk';
import { useHskNotifications } from '../../hooks/useHskNotifications';

const ALL_TABS = [
  { id: 'messages', label: 'Messages', icon: '💬' },
  { id: 'requests', label: 'Requests', icon: '📋' },
  { id: 'rooms', label: 'Rooms', icon: '🚪' },
  { id: 'alerts', label: 'Alerts', icon: '🔔' },
];

export default function HskPanelContent({
  user,
  role,
  canManageRooms = false,
  onBadgeChange,
  visibleTabs,
}) {
  const tabs = visibleTabs
    ? ALL_TABS.filter((t) => visibleTabs.includes(t.id))
    : ALL_TABS;
  const [tab, setTab] = useState(tabs[0]?.id || 'messages');
  useEffect(() => {
    if (!tabs.some((t) => t.id === tab)) {
      setTab(tabs[0]?.id || 'messages');
    }
  }, [tabs, tab]);

  const [rooms, setRooms] = useState([]);
  const [requests, setRequests] = useState([]);
  const [messages, setMessages] = useState([]);
  const {
    toasts,
    popups,
    unreadCount,
    pushNotification,
    notifyIfNew,
    markAllRead,
    dismissPopup,
  } = useHskNotifications();

  const userId = user?.uid;

  useEffect(() => subscribeRooms(setRooms), []);
  useEffect(() => subscribeRequests(setRequests), []);
  useEffect(() => subscribeMessages(setMessages), []);

  useEffect(() => {
    requests.forEach((r) => {
      if (r.status === 'Pending') {
        notifyIfNew(`req-${r.id}`, {
          type: 'request',
          title: 'New request',
          body: `${r.requestType} · Room ${r.roomNumber || '—'}`,
        });
      }
    });
  }, [requests, notifyIfNew]);

  useEffect(() => {
    messages.forEach((m) => {
      if (m.senderId !== userId) {
        notifyIfNew(`msg-${m.id}`, {
          type: 'message',
          title: 'New message',
          body: m.text,
        });
      }
    });
  }, [messages, userId, notifyIfNew]);

  const handleNewMessage = useCallback(
    (msg) => {
      pushNotification({
        type: 'message',
        title: 'New message',
        body: msg.text,
      });
    },
    [pushNotification]
  );

  const msgUnread = countUnreadMessages(messages, userId, role);
  const reqPending = countPendingRequests(requests, role);
  const badgeTotal = msgUnread + reqPending + unreadCount;

  useEffect(() => {
    onBadgeChange?.(badgeTotal);
  }, [badgeTotal, onBadgeChange]);

  const alerts = [
    ...messages
      .filter((m) => m.senderId !== userId)
      .slice(-5)
      .reverse()
      .map((m) => ({ id: m.id, type: 'message', title: 'Message', body: m.text })),
    ...requests
      .filter((r) => r.status !== 'Completed')
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        type: 'request',
        title: r.requestType,
        body: `Room ${r.roomNumber} · ${r.status}`,
      })),
  ];

  return (
    <>
      <HskNotificationToasts toasts={toasts} popups={popups} onDismissPopup={dismissPopup} />

      <div className="hsk-panel-content">
        <div className="hsk-right-tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={tab === t.id ? 'active' : ''}
              onClick={() => setTab(t.id)}
            >
              <span>{t.icon}</span>
              {t.label}
              {t.id === 'messages' && msgUnread > 0 && (
                <span className="hsk-tab-badge">{msgUnread}</span>
              )}
              {t.id === 'requests' && reqPending > 0 && (
                <span className="hsk-tab-badge">{reqPending}</span>
              )}
            </button>
          ))}
        </div>

        <div className="hsk-right-body">
          {tab === 'messages' && (
            <HskMessagesPanel user={user} role={role} onNewMessage={handleNewMessage} />
          )}
          {tab === 'requests' && (
            <HskRequestsPanel user={user} role={role} rooms={rooms} canCreate={canManageRooms} />
          )}
          {tab === 'rooms' && (
            <HskRoomsPanel user={user} role={role} canManage={canManageRooms} />
          )}
          {tab === 'alerts' && (
            <div className="hsk-alerts">
              <div className="hsk-panel-head">
                <h4>Notification Center</h4>
                <button type="button" onClick={markAllRead}>Mark all read</button>
              </div>
              {alerts.length === 0 && <p className="hsk-empty">No notifications.</p>}
              {alerts.map((a) => (
                <div key={`${a.type}-${a.id}`} className="hsk-alert-item">
                  <strong>{a.title}</strong>
                  <p>{a.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
