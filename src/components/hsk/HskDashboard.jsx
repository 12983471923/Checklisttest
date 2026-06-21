import React from 'react';
import { signOutUser } from '../../firebase/auth';
import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from '../ThemeToggle';
import HskPortalLayout from './HskPortalLayout';
import './hsk.css';

export default function HskDashboard({ currentUser, userProfile, isAdminView = false, onSwitchToReception }) {
  const { isAdmin } = useAuth();
  const displayName =
    userProfile?.displayName || currentUser?.displayName || currentUser?.email || 'Housekeeping';

  const handleLogout = async () => {
    await signOutUser();
  };

  return (
    <div className="hsk-app hsk-app--portal">
      <header className="hsk-header">
        <div>
          <h1>Housekeeping Dashboard</h1>
          <p>Scandic Falkoner · {displayName}</p>
        </div>
        <div className="hsk-header-actions">
          {isAdminView && onSwitchToReception && (
            <button type="button" className="hsk-logout-btn" onClick={onSwitchToReception}>
              Reception Dashboard
            </button>
          )}
          <ThemeToggle />
          <button type="button" className="hsk-logout-btn" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </header>

      <HskPortalLayout
        user={currentUser}
        role="housekeeping"
        canManageRooms={false}
        isAdmin={isAdmin}
      />
    </div>
  );
}
