import React, { useState } from 'react';
import { signOutUser } from '../../firebase/auth';
import ThemeToggle from '../ThemeToggle';
import HotelInfoPanel from './HotelInfoPanel';
import HskChecklistPanel from './HskChecklistPanel';
import HskRightPanel from './HskRightPanel';
import './hsk.css';

export default function HskDashboard({ currentUser, userProfile }) {
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  const displayName =
    userProfile?.displayName || currentUser?.displayName || currentUser?.email || 'Housekeeping';

  const handleLogout = async () => {
    await signOutUser();
  };

  return (
    <div className="hsk-app">
      <header className="hsk-header">
        <div>
          <h1>Housekeeping Dashboard</h1>
          <p>Scandic Falkoner · {displayName}</p>
        </div>
        <div className="hsk-header-actions">
          <ThemeToggle />
          <button type="button" className="hsk-logout-btn" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </header>

      <div className="hsk-layout">
        <main className="hsk-main">
          <HotelInfoPanel />
          <HskChecklistPanel />
        </main>

        <HskRightPanel
          user={currentUser}
          role="housekeeping"
          canManageRooms={false}
          collapsed={panelCollapsed}
          onToggleCollapse={() => setPanelCollapsed((c) => !c)}
        />
      </div>
    </div>
  );
}
