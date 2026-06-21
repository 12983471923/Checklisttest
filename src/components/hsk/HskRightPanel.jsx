import React, { useState } from 'react';
import HskPanelContent from './HskPanelContent';

export default function HskRightPanel({ user, role, canManageRooms = false, collapsed, onToggleCollapse }) {
  const [badgeTotal, setBadgeTotal] = useState(0);

  return (
    <aside className={`hsk-right-panel ${collapsed ? 'is-collapsed' : ''}`}>
      <button
        type="button"
        className="hsk-right-panel-toggle"
        onClick={onToggleCollapse}
        aria-expanded={!collapsed}
      >
        <span>HSK Panel</span>
        {badgeTotal > 0 && <span className="hsk-badge">{badgeTotal}</span>}
        <span className="hsk-toggle-icon">{collapsed ? '◀' : '▶'}</span>
      </button>

      {!collapsed && (
        <HskPanelContent
          user={user}
          role={role}
          canManageRooms={canManageRooms}
          onBadgeChange={setBadgeTotal}
        />
      )}
    </aside>
  );
}
