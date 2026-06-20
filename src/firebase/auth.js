import { 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { logSecurityEvent } from '../utils/security';

// User roles for the hotel
export const USER_ROLES = {
  STAFF: 'staff',
  MANAGER: 'manager',
  ADMIN: 'admin',
  HOUSEKEEPING: 'housekeeping',
};

export const RECEPTION_ROLES = [USER_ROLES.STAFF, USER_ROLES.MANAGER, USER_ROLES.ADMIN];

// Shift types
export const SHIFT_TYPES = {
  NIGHT: 'night',
  MORNING: 'morning',
  EVENING: 'evening'
};

// Create user profile in Firestore
const createUserProfile = async (user, additionalData = {}) => {
  if (!user) return;
  
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    const { displayName, email } = user;
    const createdAt = serverTimestamp();
    
    try {
      await setDoc(userRef, {
        displayName,
        email,
        createdAt,
        role: USER_ROLES.STAFF, // Default role
        shifts: [SHIFT_TYPES.NIGHT, SHIFT_TYPES.MORNING, SHIFT_TYPES.EVENING], // Default can work all shifts
        initials: '',
        isActive: true,
        lastLogin: serverTimestamp(),
        ...additionalData
      });
      
      logSecurityEvent('user_profile_created', { 
        userId: user.uid, 
        email, 
        role: additionalData.role || USER_ROLES.STAFF 
      });
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }
  
  return userRef;
};

// Browser-side user creation is intentionally disabled. Creating accounts from
// client code can sign out the manager and lets attackers tamper with profile
// fields before rules run. Use Firebase Console or a trusted Admin SDK backend.
export const signUpUser = async () => ({
  user: null,
  error: 'User creation from the browser is disabled. Use Firebase Console or a trusted admin backend.'
});

// Sign in user
export const signInUser = async (email, password) => {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);

    // Ensure Firebase Auth users have a locked-down default profile.
    const userRef = await createUserProfile(user);
    const userSnap = await getDoc(userRef);
    const profile = userSnap.data();

    if (profile?.isActive === false) {
      await signOut(auth);
      return { user: null, error: 'This account is inactive. Contact your manager.' };
    }

    await setDoc(userRef, {
      lastLogin: serverTimestamp()
    }, { merge: true });
    
    logSecurityEvent('login_success', { 
      userId: user.uid, 
      email 
    });
    
    return { user, error: null };
  } catch (error) {
    logSecurityEvent('login_failed', { email, error: error.message });
    return { user: null, error: error.message };
  }
};

// Sign out user
export const signOutUser = async () => {
  try {
    const currentUser = auth.currentUser;
    await signOut(auth);
    
    if (currentUser) {
      logSecurityEvent('logout', { userId: currentUser.uid });
    }
    
    return { error: null };
  } catch (error) {
    logSecurityEvent('logout_failed', { error: error.message });
    return { error: error.message };
  }
};

// Get user profile from Firestore
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { profile: userSnap.data(), error: null };
    } else {
      return { profile: null, error: 'User profile not found' };
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { profile: null, error: error.message };
  }
};

// Update user profile
export const updateUserProfile = async (userId, updates) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    logSecurityEvent('profile_updated', { 
      userId, 
      updatedFields: Object.keys(updates) 
    });
    
    return { error: null };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { error: error.message };
  }
};

// Update user initials
export const updateUserInitials = async (userId, initials) => {
  return updateUserProfile(userId, { initials: initials.toUpperCase() });
};

// Send password reset email
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    logSecurityEvent('password_reset_requested', { email });
    return { error: null };
  } catch (error) {
    logSecurityEvent('password_reset_failed', { email, error: error.message });
    return { error: error.message };
  }
};

// Change user password (requires current password)
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');
    
    // Re-authenticate user
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Update password
    await updatePassword(user, newPassword);
    
    logSecurityEvent('password_changed', { userId: user.uid });
    return { error: null };
  } catch (error) {
    logSecurityEvent('password_change_failed', { 
      userId: auth.currentUser?.uid, 
      error: error.message 
    });
    return { error: error.message };
  }
};

// Auth state observer
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Get user profile from Firestore
      const { profile } = await getUserProfile(user.uid);
      callback({ user, profile });
    } else {
      callback({ user: null, profile: null });
    }
  });
};

// Check if user has specific role
export const hasRole = (userProfile, role) => {
  return userProfile?.role === role || userProfile?.role === USER_ROLES.ADMIN;
};

export const isHousekeepingRole = (userProfile) =>
  userProfile?.role === USER_ROLES.HOUSEKEEPING;

export const isReceptionRole = (userProfile) =>
  RECEPTION_ROLES.includes(userProfile?.role);

export const signInUserForPortal = async (email, password, { allowedRoles, portalLabel }) => {
  const result = await signInUser(email, password);
  if (result.error || !result.user) return result;

  const { profile } = await getUserProfile(result.user.uid);
  if (!allowedRoles.includes(profile?.role)) {
    await signOut(auth);
    logSecurityEvent('login_portal_denied', { email, role: profile?.role, portalLabel });
    return {
      user: null,
      error: `This account is not authorized for ${portalLabel}. Please use the correct login page.`,
    };
  }

  return { user: result.user, profile, error: null };
};

// Check if user can work specific shift
export const canWorkShift = (userProfile, shift) => {
  return userProfile?.shifts?.includes(shift) || userProfile?.role === USER_ROLES.ADMIN;
};

// Get current user with profile
export const getCurrentUserWithProfile = async () => {
  const user = auth.currentUser;
  if (!user) return { user: null, profile: null };
  
  const { profile } = await getUserProfile(user.uid);
  return { user, profile };
};
