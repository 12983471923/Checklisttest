import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported as analyticsIsSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyD_mOV2hawstyrJPsYCQ5HvmSXpa37K9qU",
  authDomain: "realbase-e7569.firebaseapp.com",
  databaseURL: "https://realbase-e7569-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "realbase-e7569",
  storageBucket: "realbase-e7569.firebasestorage.app",
  messagingSenderId: "546086381983",
  appId: "1:546086381983:web:fc5bff60ad05eb3ddeb5aa",
  measurementId: "G-X2GWBR1VE8"
};

const app = initializeApp(firebaseConfig);

// Auth and Firestore are required — initialize these first so they are always
// exported even if the optional Analytics initialization below fails.
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics is optional. We guard it with isSupported() (which returns a
// Promise) to avoid blocking the module in environments where Analytics is
// unavailable (e.g. ad-blockers, SSR, Vite HMR edge cases).
// A synchronous failure here was previously preventing auth from exporting.
analyticsIsSupported().then((supported) => {
  if (supported) {
    getAnalytics(app);
  }
}).catch(() => {
  // Analytics unavailable — safe to ignore, app works without it
});

export default app;
