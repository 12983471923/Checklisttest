import React from 'react';
import { formatListTime } from './chatUtils';

export default function ConversationListItem({
  peerLabel,
  peerIcon,
  lastMessage,
  userId,
  unread,
  onOpen,
}) {
  const preview = lastMessage
    ? `${lastMessage.senderId === userId ? 'You: ' : ''}${lastMessage.text}`
    : 'Start a conversation…';

  return (
    <button type="button" className="chat-conversation-item" onClick={onOpen}>
      <div className="chat-conversation-avatar" aria-hidden="true">
        {peerIcon}
      </div>
      <div className="chat-conversation-main">
        <div className="chat-conversation-top">
          <strong>{peerLabel}</strong>
          {lastMessage && (
            <time className="chat-conversation-time">{formatListTime(lastMessage.createdAt)}</time>
          )}
        </div>
        <p className="chat-conversation-preview">{preview}</p>
      </div>
      {unread > 0 && (
        <span className="chat-conversation-badge" aria-label={`${unread} unread`}>
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </button>
  );
}
