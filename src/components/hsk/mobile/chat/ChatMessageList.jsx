import React from 'react';
import ChatBubble from './ChatBubble';

export default function ChatMessageList({
  messages,
  userId,
  bottomRef,
  emptyLabel,
  typingUsers = [],
  showTyping = false,
}) {
  return (
    <div
      className="chat-message-list"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
    >
      {messages.length === 0 && (
        <p className="chat-empty">{emptyLabel}</p>
      )}
      {messages.map((m) => (
        <ChatBubble key={m.id} message={m} isMine={m.senderId === userId} />
      ))}
      {showTyping && typingUsers.length > 0 && (
        <div className="chat-typing" aria-live="polite">
          <div className="chat-typing-bubble">
            <span className="chat-typing-dots" aria-hidden="true">
              <i /><i /><i />
            </span>
          </div>
          <span className="chat-typing-label">{typingUsers[0].name} is typing</span>
        </div>
      )}
      <div ref={bottomRef} className="chat-scroll-anchor" aria-hidden="true" />
    </div>
  );
}
