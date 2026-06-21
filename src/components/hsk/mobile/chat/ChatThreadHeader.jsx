import React from 'react';

export default function ChatThreadHeader({ title, subtitle, onBack }) {
  return (
    <header className="chat-thread-header">
      <button type="button" className="chat-back-btn" onClick={onBack} aria-label="Back to conversations">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M15 18L9 12L15 6"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div className="chat-thread-title">
        <strong>{title}</strong>
        {subtitle && <span>{subtitle}</span>}
      </div>
    </header>
  );
}
