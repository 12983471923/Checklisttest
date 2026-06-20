import React, { useEffect, useRef, useState } from 'react';
import {
  subscribeToMessages,
  sendMessage,
  markMessagesRead,
} from '../firebase/housekeeping';
import { validateUserInput } from '../utils/security';

export default function MessagingPanel({
  department,
  user,
  userProfile,
  onUnreadChange,
}) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);
  const listRef = useRef(null);

  const toDepartment = department === 'reception' ? 'housekeeping' : 'reception';
  const readField = department === 'reception' ? 'readByReception' : 'readByHousekeeping';

  useEffect(() => {
    return subscribeToMessages(setMessages);
  }, []);

  const relevantMessages = messages.filter(
    (m) =>
      (m.fromDepartment === department && m.toDepartment === toDepartment) ||
      (m.fromDepartment === toDepartment && m.toDepartment === department)
  );

  const unreadCount = relevantMessages.filter((m) => !m[readField]).length;

  useEffect(() => {
    if (onUnreadChange) onUnreadChange(unreadCount);
  }, [unreadCount, onUnreadChange]);

  useEffect(() => {
    if (open && unreadCount > 0) {
      const unreadIds = relevantMessages.filter((m) => !m[readField]).map((m) => m.id);
      markMessagesRead(unreadIds, department);
    }
  }, [open, unreadCount, relevantMessages, readField, department]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [relevantMessages, open]);

  const handleSend = async (e) => {
    e.preventDefault();
    const validation = validateUserInput(text, 'notes');
    if (!validation.valid) return;

    setSending(true);
    try {
      await sendMessage({
        fromDepartment: department,
        toDepartment,
        fromUser: {
          uid: user.uid,
          name: userProfile?.displayName || user.email,
          initials: userProfile?.initials || '',
        },
        text: validation.value,
      });
      setText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <div className="hsk-panel messaging-panel">
      <button
        type="button"
        className="hsk-panel-toggle"
        onClick={() => setOpen(!open)}
      >
        💬 Messages
        {unreadCount > 0 && <span className="hsk-badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="hsk-panel-content messaging-content">
          <div className="messaging-header">
            <strong>
              {department === 'reception' ? 'Housekeeping' : 'Reception'} Messages
            </strong>
            <button type="button" className="hsk-panel-close" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>

          <div className="messaging-list" ref={listRef}>
            {relevantMessages.length === 0 && (
              <p className="hsk-empty-state">No messages yet. Start a conversation.</p>
            )}
            {relevantMessages.map((msg) => (
              <div
                key={msg.id}
                className={`messaging-bubble ${
                  msg.fromDepartment === department ? 'messaging-bubble-sent' : 'messaging-bubble-received'
                }`}
              >
                <div className="messaging-bubble-meta">
                  <span>{msg.fromUser?.name || 'Staff'}</span>
                  <span>{formatTime(msg.createdAt)}</span>
                </div>
                <p>{msg.text}</p>
              </div>
            ))}
          </div>

          <form className="messaging-form" onSubmit={handleSend}>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message…"
              maxLength={500}
              disabled={sending}
            />
            <button type="submit" className="add-note-btn" disabled={sending || !text.trim()}>
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
