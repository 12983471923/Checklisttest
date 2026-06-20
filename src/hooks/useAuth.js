import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChange, getCurrentUserWithProfile, isHousekeepingRole, isReceptionRole } from '../firebase/auth';
import { isAdminEmail } from '../config/admin';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(({ user, profile }) => {
      setCurrentUser(user);
      setUserProfile(profile);
      setLoading(false);
      setError(null);
    });

    return unsubscribe;
  }, []);

  // Refresh user profile (useful after updates)
  const refreshProfile = async () => {
    if (currentUser) {
      try {
        const { user, profile } = await getCurrentUserWithProfile();
        setCurrentUser(user);
        setUserProfile(profile);
      } catch (error) {
        console.error('Error refreshing profile:', error);
        setError(error.message);
      }
    }
  };

  // Admin requires BOTH the hardcoded admin email AND the Firestore role.
  // This double-check prevents a stray "admin" role on another account, or a
  // tampered token, from unlocking the admin panel.
  const hasAdminEmail = isAdminEmail(currentUser?.email);
  const isAdmin = hasAdminEmail && userProfile?.role === 'admin';

  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    refreshProfile,
    // Helper computed properties
    isAuthenticated: !!currentUser,
    isManager: userProfile?.role === 'manager' || isAdmin,
    isAdmin,
    isHousekeeping: isHousekeepingRole(userProfile),
    isReception: isReceptionRole(userProfile),
    hasAdminEmail,
    userInitials: userProfile?.initials || '',
    userName: userProfile?.displayName || currentUser?.displayName || 'Unknown User',
    userShifts: userProfile?.shifts || [],
    canWorkShift: (shift) => userProfile?.shifts?.includes(shift) || userProfile?.role === 'admin'
  };

  return React.createElement(AuthContext.Provider, { value }, children);
};
