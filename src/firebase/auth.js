import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { logSecurityEvent } from '../utils/security';
import { auditUserAction } from './audit';

// User roles for the hotel
export const USER_ROLES = {
  STAFF: 'staff',
  MANAGER: 'manager',
  ADMIN: 'admin'
};

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

// Sign up new user (for managers to create staff accounts)
export const signUpUser = async (email, password, userData = {}) => {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update display name
    if (userData.displayName) {
      await updateProfile(user, { displayName: userData.displayName });
    }
    
    // Create user profile in Firestore
    await createUserProfile(user, userData);
    
    logSecurityEvent('user_created', { 
      userId: user.uid, 
      email,
      role: userData.role || USER_ROLES.STAFF 
    });
    
    return { user, error: null };
  } catch (error) {
    logSecurityEvent('signup_failed', { email, error: error.message });
    return { user: null, error: error.message };
  }
};

// Sign in user
export const signInUser = async (email, password) => {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    
    // Get user profile for audit logging
    const userProfile = await getUserProfile(user.uid);
    
    // Update last login time
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      lastLogin: serverTimestamp()
    });
    
    logSecurityEvent('login_success', { 
      userId: user.uid, 
      email 
    });

    // Audit log the login
    await auditUserAction(
      userProfile, 
      userProfile, 
      'login',
      null,
      { lastLogin: new Date() }
    );
    
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
    
    if (currentUser) {
      // Get user profile for audit logging
      const userProfile = await getUserProfile(currentUser.uid);
      
      // Audit log the logout
      await auditUserAction(
        userProfile, 
        userProfile, 
        'logout'
      );
      
      logSecurityEvent('logout', { userId: currentUser.uid });
    }
    
    await signOut(auth);
    
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
