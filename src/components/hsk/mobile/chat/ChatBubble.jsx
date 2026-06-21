import React from 'react';
import { formatMessageTime } from './chatUtils';

export default function ChatBubble({ message, isMine }) {
  const read = (message.readBy || []).length > 1;

  return (
    <div className={`chat-bubble-row ${isMine ? 'is-sent' : 'is-received'}`}>
      <div className={`chat-bubble ${isMine ? 'is-sent' : 'is-received'}`}>
        <p className="chat-bubble-text">{message.text}</p>
        <div className="chat-bubble-footer">
          <time dateTime={message.createdAt?.toDate?.()?.toISOString?.()}>
            {formatMessageTime(message.createdAt)}
          </time>
          {isMine && (
            <span className="chat-receipt" aria-label={read ? 'Read' : 'Delivered'}>
              {read ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
