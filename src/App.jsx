import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { isHousekeepingRole, isReceptionRole } from './firebase/auth';
import AuthLoginForm from './components/AuthLoginForm';
import HousekeepingLoginForm from './components/HousekeepingLoginForm';
import HousekeepingApp from './components/HousekeepingApp';
import ReceptionApp from './components/ReceptionApp';

function AppLoading() {
  return (
    <div className="app-loading-screen">
      <div className="app-loading-text">Loading…</div>
    </div>
  );
}

function ReceptionRoute() {
  const { currentUser, userProfile, loading, error } = useAuth();
  const [loginError, setLoginError] = React.useState('');

  if (loading) return <AppLoading />;

  if (!currentUser) {
    return (
      <AuthLoginForm
        onLogin={() => setLoginError('')}
        onError={setLoginError}
        externalError={loginError || error}
      />
    );
  }

  if (isHousekeepingRole(userProfile)) {
    return <Navigate to="/housekeeping" replace />;
  }

  if (!isReceptionRole(userProfile)) {
    return (
      <div className="app-loading-screen">
        <div className="app-loading-text">
          Access denied. Contact your manager for the correct portal.
        </div>
      </div>
    );
  }

  return <ReceptionApp userProfile={userProfile} currentUser={currentUser} />;
}

function HousekeepingRoute() {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) return <AppLoading />;

  if (!currentUser) {
    return <HousekeepingLoginForm />;
  }

  if (!isHousekeepingRole(userProfile)) {
    return <Navigate to="/" replace />;
  }

  return <HousekeepingApp userProfile={userProfile} currentUser={currentUser} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ReceptionRoute />} />
      <Route path="/housekeeping" element={<HousekeepingRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
