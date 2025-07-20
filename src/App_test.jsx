import React, { useState, useMemo, useCallback, useEffect } from "react";
import { checklists } from "./Checklists";
import { users } from "./users";
import { useRealtimeChecklist } from "./hooks/useRealtimeChecklist";
import { 
  saveHandoverNotes as saveHandoverNotesToDB,
  getHandoverNotes,
  deleteHandoverNotes as deleteHandoverNotesFromDB,
  subscribeToHandoverNotes,
  saveWakeUpCalls,
  subscribeToWakeUpCalls,
  saveBreakfastTimes as saveBreakfastTimesToDB,
  getBreakfastTimes,
  subscribeToBreakfastTimes
} from "./firebase/database";
import { 
  LoginForm, 
  InitialsForm, 
  ShiftSelector, 
  Sidebar, 
  ChecklistTable, 
  ProgressBar 
} from "./components";
import "./App.css";

// Login session constants
const LOGIN_STORAGE_KEY = 'checklistapp_login_session';
const SESSION_DURATION = 5 * 60 * 60 * 1000; // 5 hours in milliseconds

function App() {
  // Test to see if basic rendering works
  return (
    <div style={{ padding: '20px', background: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#333' }}>🧪 Testing App Components</h1>
      <div style={{ marginBottom: '20px' }}>
        <h2>1. Testing LoginForm:</h2>
        <LoginForm 
          onLogin={(user) => console.log('Login:', user)}
          onError={(error) => console.log('Error:', error)}
        />
      </div>
    </div>
  );
}

export default App;
