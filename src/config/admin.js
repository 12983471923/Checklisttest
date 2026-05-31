// Single source of truth for admin identity.
//
// Admin access is granted ONLY when BOTH of the following are true:
//   1. The signed-in Firebase Auth email matches ADMIN_EMAIL (hardcoded here)
//   2. The Firestore users/{uid} document has role === "admin"
//
// This double-check is enforced on the frontend (see useAuth) AND in
// firestore.rules, so a tampered profile or a stray "admin" role on a
// different account can never unlock the admin panel.
export const ADMIN_EMAIL = 'admin@falkoner.com';

// Case-insensitive comparison helper for the admin email.
export const isAdminEmail = (email) =>
  typeof email === 'string' && email.trim().toLowerCase() === ADMIN_EMAIL;
