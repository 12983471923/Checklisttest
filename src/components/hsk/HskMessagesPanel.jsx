import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  subscribeMessages,
  sendMessage,
  markMessageRead,
  countUnreadMessages,
  isMessageActive,
} from '../../firebase/hsk';
import HskMessageAdminControls, { filterMessagesByView } from './HskMessageAdminControls';

export default function HskMessagesPanel({
  user,
  role,
  onNewMessage,
  primary = false,
  canManage = false,
}) {
  const [messages, setMessages] = useState([]);
  const [messageView, setMessageView] = useState('active');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const prevCountRef = useRef(0);

  const userId = user?.uid;
  const displayName = user?.displayName || user?.email || 'Staff';

  useEffect(() => subscribeMessages(setMessages), []);

  const visibleMessages = useMemo(
    () => filterMessagesByView(messages, messageView),
    [messages, messageView]
  );

  useEffect(() => {
    if (!userId) return;
    visibleMessages.forEach((m) => {
      if (isMessageActive(m) && m.senderId !== userId && !(m.readBy || []).includes(userId)) {
        markMessageRead(m.id, userId, m.readBy || []);
      }
    });
  }, [visibleMessages, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages.length]);

  useEffect(() => {
    if (messages.length > prevCountRef.current && prevCountRef.current > 0) {
      const latest = messages[messages.length - 1];
      if (latest?.senderId !== userId && onNewMessage) {
        onNewMessage(latest);
      }
    }
    prevCountRef.current = messages.length;
  }, [messages, userId, onNewMessage]);

  const unread = useMemo(
    () => countUnreadMessages(messages, userId, role),
    [messages, userId, role]
  );

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage(text, { uid: userId, name: displayName }, role);
      setText('');
      setMessageView('active');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`hsk-messages ${primary ? 'hsk-messages--primary' : ''}`}>
      {!primary && (
        <div className="hsk-panel-head">
          <h4>Messages</h4>
          {unread > 0 && <span className="hsk-badge">{unread}</span>}
        </div>
      )}

      {canManage && (
        <HskMessageAdminControls
          messages={messages}
          user={user}
          canManage={canManage}
          messageView={messageView}
          onViewChange={setMessageView}
          compact={primary}
        />
      )}

      <div className="hsk-messages-list">
        {visibleMessages.length === 0 && (
          <p className="hsk-empty">
            {messageView === 'active'
              ? 'No messages yet. Start a conversation with Reception.'
              : `No ${messageView} messages.`}
          </p>
        )}
        {visibleMessages.map((m) => {
          const mine = m.senderId === userId;
          const read = (m.readBy || []).length > 1;
          return (
            <div key={m.id} className={`hsk-message ${mine ? 'is-mine' : 'is-theirs'}`}>
              <div className="hsk-message-meta">
                <strong>{m.senderName || 'Staff'}</strong>
                <span>{formatTime(m.createdAt)}</span>
              </div>
              <p>{m.text}</p>
              {mine && (
                <span className="hsk-message-status">{read ? 'Read' : 'Delivered'}</span>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {messageView === 'active' && (
        <form className="hsk-message-compose" onSubmit={handleSend}>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            disabled={sending}
          />
          <button type="submit" disabled={sending || !text.trim()}>
            Send
          </button>
        </form>
      )}
    </div>
  );
}
