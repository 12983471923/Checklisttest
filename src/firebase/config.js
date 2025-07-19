// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (optional)
const analytics = getAnalytics(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
export default app;
