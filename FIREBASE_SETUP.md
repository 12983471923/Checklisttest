# Firebase Setup Guide for Real-time Checklist

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter a project name (e.g., "scandic-checklist")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## 2. Enable Firestore Database

1. In your Firebase project console, click on "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" for now (you can secure it later)
4. Select a location close to your users (e.g., europe-west1 for Europe)
5. Click "Done"

## 3. Get Firebase Configuration

1. In your Firebase project console, click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon `</>` to add a web app
5. Enter an app nickname (e.g., "scandic-checklist-web")
6. Don't check "Also set up Firebase Hosting" unless you want to host on Firebase
7. Click "Register app"
8. Copy the configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef..."
};
```

## 4. Update Configuration

1. Open `src/firebase/config.js`
2. Replace the placeholder values with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com", 
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

## 5. Test the Connection

1. Start your development server: `npm run dev`
2. Log in to your checklist app
3. Check the browser's developer console for any Firebase errors
4. Try checking/unchecking tasks - they should sync in real-time

## 6. Security Rules (Optional but Recommended)

Once you've tested that everything works, you should secure your database:

1. Go to Firestore Database in Firebase Console
2. Click on "Rules" tab
3. Replace the rules with something like:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to checklist documents
    match /checklists/{document} {
      allow read, write: if true; // You can add authentication later
    }
  }
}
```

## Features Added

✅ **Real-time Synchronization**: Multiple users can see updates instantly
✅ **Daily Sessions**: Each shift gets its own document per day
✅ **Persistent Storage**: Tasks, notes, and completion status are saved
✅ **Offline Resilience**: App works offline and syncs when reconnected
✅ **Error Handling**: Shows sync status and handles connection issues

## How It Works

- Each shift (Night/Morning/Evening) creates a session document per day
- Session ID format: `night_2025-07-19`, `morning_2025-07-19`, etc.
- All task changes are synced to Firestore in real-time
- Multiple users can work on the same checklist simultaneously
- Changes appear instantly across all connected devices

## Troubleshooting

**Can't connect to Firebase?**
- Check your internet connection
- Verify the Firebase config values are correct
- Check browser console for detailed error messages

**Data not syncing?**
- Check Firestore rules allow read/write access
- Verify the project ID in your config matches your Firebase project

**Want to reset everything?**
- Go to Firestore Database → Data tab
- Delete the `checklists` collection to start fresh
