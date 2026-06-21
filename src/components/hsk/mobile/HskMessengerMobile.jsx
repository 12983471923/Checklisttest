import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  subscribeMessages,
  sendMessage,
  markMessageRead,
  countUnreadMessages,
  setTypingStatus,
  subscribeTyping,
} from '../../../firebase/hsk';

const QUICK_EMOJIS = ['👍', '❤️', '😊', '🙏', '✅', '🏨', '🛏️', '🧹'];

export default function HskMessengerMobile({ user, role, onNewMessage }) {
  const [messages, setMessages] = useState([]);
  const [view, setView] = useState('list');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachmentName, setAttachmentName] = useState('');
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const fileRef = useRef(null);
  const prevCountRef = useRef(0);

  const userId = user?.uid;
  const displayName = user?.displayName || user?.email || 'Staff';
  const peerLabel = role === 'housekeeping' ? 'Reception' : 'Housekeeping';

  useEffect(() => subscribeMessages(setMessages), []);
  useEffect(() => subscribeTyping(setTypingUsers, userId), [userId]);

  useEffect(() => {
    if (!userId || view !== 'thread') return;
    messages.forEach((m) => {
      if (m.senderId !== userId && !(m.readBy || []).includes(userId)) {
        markMessageRead(m.id, userId, m.readBy || []);
      }
    });
  }, [messages, userId, view]);

  useEffect(() => {
    if (view === 'thread') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, view, typingUsers.length]);

  useEffect(() => {
    if (messages.length > prevCountRef.current && prevCountRef.current > 0) {
      const latest = messages[messages.length - 1];
      if (latest?.senderId !== userId && onNewMessage) {
        onNewMessage(latest);
      }
    }
    prevCountRef.current = messages.length;
  }, [messages, userId, onNewMessage, view]);

  const unread = useMemo(
    () => countUnreadMessages(messages, userId, role),
    [messages, userId, role]
  );

  const lastMessage = messages[messages.length - 1];

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatListTime = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return formatTime(ts);
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleTyping = (value) => {
    setText(value);
    clearTimeout(typingTimer.current);
    setTypingStatus({ uid: userId, name: displayName }, role, true);
    typingTimer.current = setTimeout(() => {
      setTypingStatus({ uid: userId, name: displayName }, role, false);
    }, 2000);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    const body = text.trim();
    if (!body && !attachmentName) return;
    if (sending) return;
    setSending(true);
    try {
      let payload = body;
      if (attachmentName) {
        payload = body ? `${body}\n📎 ${attachmentName}` : `📎 ${attachmentName}`;
      }
      await sendMessage(payload, { uid: userId, name: displayName }, role, { attachmentName });
      setText('');
      setAttachmentName('');
      setShowEmoji(false);
      await setTypingStatus({ uid: userId, name: displayName }, role, false);
    } finally {
      setSending(false);
    }
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
    }
    e.target.value = '';
  };

  const appendEmoji = (emoji) => {
    setText((t) => `${t}${emoji}`);
  };

  if (view === 'list') {
    return (
      <div className="hsk-messenger-mobile">
        <header className="hsk-messenger-mobile-header">
          <h2>Messages</h2>
        </header>
        <button
          type="button"
          className="hsk-conversation-card"
          onClick={() => setView('thread')}
        >
          <div className="hsk-conversation-avatar">{role === 'housekeeping' ? '🛎️' : '🧹'}</div>
          <div className="hsk-conversation-body">
            <div className="hsk-conversation-top">
              <strong>{peerLabel}</strong>
              {lastMessage && (
                <span className="hsk-conversation-time">{formatListTime(lastMessage.createdAt)}</span>
              )}
            </div>
            <p className="hsk-conversation-preview">
              {lastMessage
                ? `${lastMessage.senderId === userId ? 'You: ' : ''}${lastMessage.text}`
                : 'Start a conversation…'}
            </p>
          </div>
          {unread > 0 && <span className="hsk-conversation-unread">{unread}</span>}
        </button>
      </div>
    );
  }

  return (
    <div className="hsk-messenger-mobile hsk-messenger-mobile--thread">
      <header className="hsk-messenger-thread-header">
        <button type="button" className="hsk-messenger-back" onClick={() => setView('list')} aria-label="Back">
          ←
        </button>
        <div className="hsk-messenger-thread-title">
          <strong>{peerLabel}</strong>
          <span>Active now</span>
        </div>
      </header>

      <div className="hsk-messenger-bubbles" role="log" aria-live="polite">
        {messages.length === 0 && (
          <p className="hsk-messenger-empty">Say hello to {peerLabel}</p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === userId;
          const read = (m.readBy || []).length > 1;
          return (
            <div key={m.id} className={`hsk-bubble-row ${mine ? 'is-mine' : 'is-theirs'}`}>
              {!mine && (
                <span className="hsk-bubble-avatar" aria-hidden="true">
                  {(m.senderName || 'S')[0]}
                </span>
              )}
              <div className={`hsk-bubble ${mine ? 'is-mine' : 'is-theirs'}`}>
                <p>{m.text}</p>
                <div className="hsk-bubble-meta">
                  <span>{formatTime(m.createdAt)}</span>
                  {mine && <span className="hsk-read-receipt">{read ? 'Read ✓✓' : 'Delivered ✓'}</span>}
                </div>
              </div>
            </div>
          );
        })}
        {typingUsers.length > 0 && (
          <div className="hsk-typing-indicator" aria-live="polite">
            <span className="hsk-typing-dots"><i /><i /><i /></span>
            {typingUsers[0].name} is typing…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {showEmoji && (
        <div className="hsk-emoji-bar" role="toolbar" aria-label="Emoji">
          {QUICK_EMOJIS.map((em) => (
            <button key={em} type="button" onClick={() => appendEmoji(em)}>{em}</button>
          ))}
        </div>
      )}

      <form className="hsk-messenger-compose" onSubmit={handleSend}>
        <button type="button" className="hsk-compose-icon" onClick={() => setShowEmoji((s) => !s)} aria-label="Emoji">
          😊
        </button>
        <button type="button" className="hsk-compose-icon" onClick={() => fileRef.current?.click()} aria-label="Attach file">
          📎
        </button>
        <input ref={fileRef} type="file" className="hsk-file-input" onChange={handleFile} hidden />
        <input
          type="text"
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          placeholder="Message…"
          disabled={sending}
          aria-label="Message text"
        />
        <button type="submit" className="hsk-compose-send" disabled={sending || (!text.trim() && !attachmentName)}>
          ↑
        </button>
      </form>
      {attachmentName && (
        <div className="hsk-attachment-chip">
          📎 {attachmentName}
          <button type="button" onClick={() => setAttachmentName('')}>×</button>
        </div>
      )}
    </div>
  );
}
