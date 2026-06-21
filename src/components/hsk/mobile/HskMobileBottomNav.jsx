import React from 'react';

export const HSK_MOBILE_NAV_ITEMS = [
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'tasks', label: 'Tasks', icon: '📋' },
  { id: 'handovers', label: 'Handover', icon: '📝' },
  { id: 'info', label: 'Info', icon: '🏨' },
];

export default function HskMobileBottomNav({ active, onChange, badges = {}, items = HSK_MOBILE_NAV_ITEMS }) {
  if (!items.length) return null;

  return (
    <nav className="hsk-mobile-bottom-nav" aria-label="HSK navigation">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`hsk-mobile-nav-item ${active === item.id ? 'is-active' : ''}`}
          onClick={() => onChange(item.id)}
          aria-current={active === item.id ? 'page' : undefined}
        >
          <span className="hsk-mobile-nav-icon" aria-hidden="true">
            {item.icon}
            {badges[item.id] > 0 && (
              <span className="hsk-mobile-nav-badge">{badges[item.id] > 99 ? '99+' : badges[item.id]}</span>
            )}
          </span>
          <span className="hsk-mobile-nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
