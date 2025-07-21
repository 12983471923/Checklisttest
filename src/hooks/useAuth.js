import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChange, getCurrentUserWithProfile } from '../firebase/auth';

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

  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    refreshProfile,
    // Helper computed properties
    isAuthenticated: !!currentUser,
    isManager: userProfile?.role === 'manager' || userProfile?.role === 'admin',
    isAdmin: userProfile?.role === 'admin',
    userInitials: userProfile?.initials || '',
    userName: userProfile?.displayName || currentUser?.displayName || 'Unknown User',
    userShifts: userProfile?.shifts || [],
    canWorkShift: (shift) => userProfile?.shifts?.includes(shift) || userProfile?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
