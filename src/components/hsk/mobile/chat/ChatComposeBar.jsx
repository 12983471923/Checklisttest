import React from 'react';
import { QUICK_EMOJIS } from './chatUtils';

export default function ChatComposeBar({
  text,
  sending,
  attachmentName,
  showEmoji,
  onTextChange,
  onToggleEmoji,
  onAttach,
  onRemoveAttachment,
  onSend,
  onAppendEmoji,
  fileRef,
  onFileChange,
}) {
  const canSend = !sending && (text.trim() || attachmentName);

  return (
    <div className="chat-compose-wrap">
      {attachmentName && (
        <div className="chat-attachment-chip">
          <span>📎 {attachmentName}</span>
          <button type="button" onClick={onRemoveAttachment} aria-label="Remove attachment">
            ×
          </button>
        </div>
      )}

      {showEmoji && (
        <div className="chat-emoji-strip" role="toolbar" aria-label="Quick emoji">
          {QUICK_EMOJIS.map((em) => (
            <button key={em} type="button" onClick={() => onAppendEmoji(em)}>
              {em}
            </button>
          ))}
        </div>
      )}

      <form className="chat-compose-bar" onSubmit={onSend}>
        <button
          type="button"
          className="chat-compose-action"
          onClick={onToggleEmoji}
          aria-label="Emoji"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
            <path d="M8.5 10.5h.01M15.5 10.5h.01M8.8 14.5c.9.9 2.1 1.4 3.2 1.4s2.3-.5 3.2-1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <button
          type="button"
          className="chat-compose-action"
          onClick={onAttach}
          aria-label="Attach file"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M16 8.5V16.5C16 18.985 13.985 21 11.5 21C9.015 21 7 18.985 7 16.5V7.5C7 5.567 8.567 4 10.5 4C12.433 4 14 5.567 14 7.5V15.5C14 16.328 13.328 17 12.5 17C11.672 17 11 16.328 11 15.5V8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <input ref={fileRef} type="file" className="chat-file-input" onChange={onFileChange} hidden />
        <label className="chat-input-field">
          <input
            type="text"
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Message"
            disabled={sending}
            aria-label="Message text"
            enterKeyHint="send"
            autoComplete="off"
          />
        </label>
        <button type="submit" className="chat-send-btn" disabled={!canSend} aria-label="Send message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 5L12 19M12 5L6 11M12 5L18 11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
    </div>
  );
}
