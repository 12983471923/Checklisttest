import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  subscribeMessages,
  sendMessage,
  markMessageRead,
  countUnreadMessages,
  setTypingStatus,
  subscribeTyping,
  isMessageActive,
} from '../../../firebase/hsk';
import HskMessageAdminControls, { filterMessagesByView } from '../HskMessageAdminControls';
import ChatMessageList from './chat/ChatMessageList';
import ChatThreadHeader from './chat/ChatThreadHeader';
import ChatComposeBar from './chat/ChatComposeBar';
import ConversationListItem from './chat/ConversationListItem';
import { messageViewLabel } from './chat/chatUtils';
import './chat/messenger-chat.css';

export default function HskMessengerMobile({ user, role, onNewMessage, canManage = false }) {
  const [messages, setMessages] = useState([]);
  const [messageView, setMessageView] = useState('active');
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
  const peerIcon = role === 'housekeeping' ? '🛎️' : '🧹';

  useEffect(() => subscribeMessages(setMessages), []);
  useEffect(() => subscribeTyping(setTypingUsers, userId), [userId]);

  const visibleMessages = useMemo(
    () => filterMessagesByView(messages, messageView),
    [messages, messageView]
  );

  const activeMessages = useMemo(
    () => filterMessagesByView(messages, 'active'),
    [messages]
  );

  useEffect(() => {
    if (!userId || view !== 'thread') return;
    visibleMessages.forEach((m) => {
      if (isMessageActive(m) && m.senderId !== userId && !(m.readBy || []).includes(userId)) {
        markMessageRead(m.id, userId, m.readBy || []);
      }
    });
  }, [visibleMessages, userId, view]);

  useEffect(() => {
    if (view !== 'thread') return;
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, [visibleMessages.length, view, typingUsers.length]);

  useEffect(() => {
    if (activeMessages.length > prevCountRef.current && prevCountRef.current > 0) {
      const latest = activeMessages[activeMessages.length - 1];
      if (latest?.senderId !== userId && onNewMessage) {
        onNewMessage(latest);
      }
    }
    prevCountRef.current = activeMessages.length;
  }, [activeMessages, userId, onNewMessage, view]);

  const unread = useMemo(
    () => countUnreadMessages(messages, userId, role),
    [messages, userId, role]
  );

  const lastMessage = activeMessages[activeMessages.length - 1];

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
      setMessageView('active');
      await setTypingStatus({ uid: userId, name: displayName }, role, false);
    } finally {
      setSending(false);
    }
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) setAttachmentName(file.name);
    e.target.value = '';
  };

  if (view === 'list') {
    return (
      <div className="chat-ui">
        <header className="chat-inbox-header">
          <h2>Chats</h2>
        </header>
        {canManage && (
          <HskMessageAdminControls
            messages={messages}
            user={user}
            canManage={canManage}
            messageView={messageView}
            onViewChange={setMessageView}
            compact
          />
        )}
        {messageView === 'active' ? (
          <ConversationListItem
            peerLabel={peerLabel}
            peerIcon={peerIcon}
            lastMessage={lastMessage}
            userId={userId}
            unread={unread}
            onOpen={() => setView('thread')}
          />
        ) : (
          <p className="chat-empty">
            Open the conversation to review {messageView} messages.
          </p>
        )}
      </div>
    );
  }

  const subtitle =
    messageView === 'active' ? messageViewLabel(messageView) : messageViewLabel(messageView);

  return (
    <div className="chat-ui chat-ui--thread">
      <ChatThreadHeader
        title={peerLabel}
        subtitle={subtitle}
        onBack={() => setView('list')}
      />

      {canManage && (
        <HskMessageAdminControls
          messages={messages}
          user={user}
          canManage={canManage}
          messageView={messageView}
          onViewChange={setMessageView}
          compact
        />
      )}

      <ChatMessageList
        messages={visibleMessages}
        userId={userId}
        bottomRef={bottomRef}
        emptyLabel={`No ${messageView} messages.`}
        typingUsers={typingUsers}
        showTyping={messageView === 'active'}
      />

      {messageView === 'active' && (
        <ChatComposeBar
          text={text}
          sending={sending}
          attachmentName={attachmentName}
          showEmoji={showEmoji}
          onTextChange={handleTyping}
          onToggleEmoji={() => setShowEmoji((s) => !s)}
          onAttach={() => fileRef.current?.click()}
          onRemoveAttachment={() => setAttachmentName('')}
          onSend={handleSend}
          onAppendEmoji={(emoji) => handleTyping(text + emoji)}
          fileRef={fileRef}
          onFileChange={handleFile}
        />
      )}
    </div>
  );
}
