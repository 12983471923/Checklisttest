import React, { useState, useMemo, useCallback } from "react";
import { checklists } from "./Checklists";
import { users } from "./users";
import { useRealtimeChecklist } from "./hooks/useRealtimeChecklist";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [initials, setInitials] = useState("");
  const [initialsSubmitted, setInitialsSubmitted] = useState(false);
  const [showChangeInitials, setShowChangeInitials] = useState(false);
  const [newInitials, setNewInitials] = useState("");
  const [shift, setShift] = useState("Night");
  const [showInfo, setShowInfo] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [showInitialsModal, setShowInitialsModal] = useState(false);
  const [showDowntimeInfo, setShowDowntimeInfo] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [handoverDate, setHandoverDate] = useState(new Date().toISOString().split('T')[0]);
  const [handoverNotes, setHandoverNotes] = useState("");
  const [savedHandovers, setSavedHandovers] = useState(() => {
    const saved = localStorage.getItem('hotel-handovers');
    return saved ? JSON.parse(saved) : {};
  });
  const [wakeUpCalls, setWakeUpCalls] = useState(() => {
    const saved = localStorage.getItem('hotel-wakeup-calls');
    return saved ? JSON.parse(saved) : [];
  });
  const [showWakeUpModal, setShowWakeUpModal] = useState(false);
  const [newWakeUpCall, setNewWakeUpCall] = useState({
    roomNumber: '',
    time: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Use the real-time checklist hook
  const {
    tasks,
    downtimeChecklist,
    loading,
    error,
    toggleTask,
    updateTaskNote,
    toggleDowntimeTask,
    resetAll
  } = useRealtimeChecklist(shift, initials);

  // Handle login submit
  const handleLogin = (e) => {
    e.preventDefault();
    const match = users.find(
      (u) => u.username === loginForm.username && u.password === loginForm.password
    );
    if (match) {
      setUser(match);
      setLoginForm({ username: "", password: "" });
      setLoginError("");
    } else {
      setLoginError("Incorrect username or password.");
    }
  };

  // Handle initials submit
  const handleInitialsSubmit = (e) => {
    e.preventDefault();
    const trimmedInitials = initials.trim().toUpperCase();
    if (trimmedInitials.length < 2) {
      alert("Please enter at least 2 letters for initials.");
      return;
    }
    setInitials(trimmedInitials);
    setInitialsSubmitted(true);
  };

  // Progress calculation - memoized for performance
  const percent = useMemo(() => 
    Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100),
    [tasks]
  );

  const handleShiftChange = useCallback((newShift) => {
    setShift(newShift);
    setShowInfo(null);
  }, []);

  const handleNote = useCallback((id) => {
    const task = tasks.find(t => t.id === id);
    setNoteText(task?.note || "");
    setShowNoteModal(id);
  }, [tasks]);

  const saveNote = useCallback(() => {
    if (showNoteModal) {
      updateTaskNote(showNoteModal, noteText);
      setShowNoteModal(null);
      setNoteText("");
    }
  }, [showNoteModal, noteText, updateTaskNote]);

  const cancelNote = useCallback(() => {
    setShowNoteModal(null);
    setNoteText("");
  }, []);

  const handleResetAll = useCallback(() => {
    if (window.confirm("Are you sure you want to reset all tasks? This cannot be undone.")) {
      resetAll();
      setShowInfo(null);
    }
  }, [resetAll]);

  const handleLogout = () => {
    setUser(null);
    setInitials("");
    setInitialsSubmitted(false);
    setShowChangeInitials(false);
    setNewInitials("");
  };

  // Handover functions
  const loadHandoverNotes = useCallback((date) => {
    setHandoverNotes(savedHandovers[date] || "");
  }, [savedHandovers]);

  const saveHandoverNotes = useCallback(() => {
    const updatedHandovers = {
      ...savedHandovers,
      [handoverDate]: handoverNotes
    };
    setSavedHandovers(updatedHandovers);
    localStorage.setItem('hotel-handovers', JSON.stringify(updatedHandovers));
    setShowHandoverModal(false);
  }, [savedHandovers, handoverDate, handoverNotes]);

  const openHandoverModal = useCallback(() => {
    loadHandoverNotes(handoverDate);
    setShowHandoverModal(true);
  }, [handoverDate, loadHandoverNotes]);

  const handleDateChange = useCallback((newDate) => {
    setHandoverDate(newDate);
    loadHandoverNotes(newDate);
  }, [loadHandoverNotes]);

  const deleteHandoverNotes = useCallback((dateToDelete) => {
    if (window.confirm(`Are you sure you want to delete handover notes for ${new Date(dateToDelete).toLocaleDateString('en-GB')}? This cannot be undone.`)) {
      const updatedHandovers = { ...savedHandovers };
      delete updatedHandovers[dateToDelete];
      setSavedHandovers(updatedHandovers);
      localStorage.setItem('hotel-handovers', JSON.stringify(updatedHandovers));
      
      // If we're deleting the currently selected date, clear the notes
      if (dateToDelete === handoverDate) {
        setHandoverNotes("");
      }
      
      return true;
    }
    return false;
  }, [savedHandovers, handoverDate]);

  // Wake-up call functions
  const addWakeUpCall = useCallback(() => {
    if (!newWakeUpCall.roomNumber || !newWakeUpCall.time) {
      alert('Please enter both room number and wake-up time.');
      return;
    }

    const wakeUpCallWithId = {
      ...newWakeUpCall,
      id: Date.now(),
      roomNumber: newWakeUpCall.roomNumber.toString().padStart(3, '0'),
      createdBy: initials,
      completed: false
    };

    const updatedCalls = [...wakeUpCalls, wakeUpCallWithId].sort((a, b) => {
      // Sort by date first, then by time
      if (a.date !== b.date) {
        return new Date(a.date) - new Date(b.date);
      }
      return a.time.localeCompare(b.time);
    });

    setWakeUpCalls(updatedCalls);
    localStorage.setItem('hotel-wakeup-calls', JSON.stringify(updatedCalls));
    
    setNewWakeUpCall({
      roomNumber: '',
      time: '',
      notes: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowWakeUpModal(false);
  }, [newWakeUpCall, wakeUpCalls, initials]);

  const deleteWakeUpCall = useCallback((id) => {
    if (window.confirm('Are you sure you want to delete this wake-up call?')) {
      const updatedCalls = wakeUpCalls.filter(call => call.id !== id);
      setWakeUpCalls(updatedCalls);
      localStorage.setItem('hotel-wakeup-calls', JSON.stringify(updatedCalls));
    }
  }, [wakeUpCalls]);

  const toggleWakeUpCallComplete = useCallback((id) => {
    const updatedCalls = wakeUpCalls.map(call => 
      call.id === id 
        ? { ...call, completed: !call.completed, completedBy: call.completed ? null : initials }
        : call
    );
    setWakeUpCalls(updatedCalls);
    localStorage.setItem('hotel-wakeup-calls', JSON.stringify(updatedCalls));
  }, [wakeUpCalls, initials]);

  const clearOldWakeUpCalls = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const activeCalls = wakeUpCalls.filter(call => call.date >= today);
    
    if (activeCalls.length === wakeUpCalls.length) {
      alert('No old wake-up calls to clear.');
      return;
    }

    if (window.confirm(`Clear ${wakeUpCalls.length - activeCalls.length} old wake-up calls?`)) {
      setWakeUpCalls(activeCalls);
      localStorage.setItem('hotel-wakeup-calls', JSON.stringify(activeCalls));
    }
  }, [wakeUpCalls]);

  // Show login form if not logged in
  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <form
          className="login-form"
          onSubmit={handleLogin}
          style={{ maxWidth: "320px", padding: "24px", minWidth: "280px" }}
        >
          <h2 className="form-title" style={{ fontSize: "1.3rem", marginBottom: "20px" }}>Staff Login</h2>
          <div style={{ marginBottom: 16 }}>
            <input
              className="form-input"
              type="text"
              placeholder="User ID"
              value={loginForm.username}
              onChange={e => setLoginForm(f => ({ ...f, username: e.target.value.trim() }))}
              autoFocus
              required
              autoComplete="username"
              style={{ padding: "10px 14px", fontSize: "0.95rem" }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <input
              className="form-input"
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
              required
              autoComplete="current-password"
              style={{ padding: "10px 14px", fontSize: "0.95rem" }}
            />
          </div>
          {loginError && (
            <div className="form-error" style={{ padding: "10px 12px", fontSize: "0.9rem", marginBottom: "12px" }}>
              {loginError}
            </div>
          )}
          <button
            type="submit"
            className="add-note-btn"
            style={{ width: "100%", fontSize: "1rem", padding: "12px 16px" }}
          >
            Log In
          </button>
        </form>
      </div>
    );
  }

  // Show initials input after login if not set yet
  if (!initialsSubmitted) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <form
          className="initials-form"
          style={{ textAlign: "center", maxWidth: "320px", padding: "24px", minWidth: "280px" }}
          onSubmit={handleInitialsSubmit}
        >
          <h2 className="form-title" style={{ fontSize: "1.3rem", marginBottom: "20px" }}>Enter Your Initials</h2>
          <input
            className="form-input"
            type="text"
            placeholder="e.g. AG"
            value={initials}
            onChange={e => setInitials(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase())}
            style={{
              textAlign: "center",
              letterSpacing: "2px",
              fontSize: "1.1rem",
              fontWeight: "700",
              marginBottom: "20px",
              padding: "10px 14px"
            }}
            maxLength={4}
            required
            autoFocus
          />
          <button
            type="submit"
            className="add-note-btn"
            style={{ width: "100%", fontSize: "1rem", padding: "12px 16px", marginBottom: "10px" }}
          >
            Continue
          </button>
          <button
            type="button"
            className="reset-btn"
            style={{ width: "100%", fontSize: "0.95rem", padding: "10px 16px" }}
            onClick={handleLogout}
          >
            Log Out
          </button>
        </form>
      </div>
    );
  }

    return (
    <div className="checklist-container">
      {/* Main layout with sidebar and content */}
      <div className="main-layout">
        {/* Left sidebar with hotel info */}
        <div className="left-sidebar">
          <div className="header-card">
            <strong>🏨 Scandic Falkoner</strong>
            
            <div className="hotel-info-section">
              <div className="info-item">
                <span className="info-icon">📍</span>
                <div className="info-content">
                  <span className="info-label">Address</span>
                  <span className="info-value">Falkoner Alle 9, 2000 Frederiksberg, Denmark</span>
                </div>
              </div>
              
              <div className="info-item">
                <span className="info-icon">📞</span>
                <div className="info-content">
                  <span className="info-label">Phone</span>
                  <span className="info-value">+45 72 42 55 00</span>
                </div>
              </div>
              
              <div className="info-item">
                <span className="info-icon">✉️</span>
                <div className="info-content">
                  <span className="info-label">Email</span>
                  <span className="info-value">
                    <a href="mailto:falkoner@scandichotels.com">falkoner@scandichotels.com</a>
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="header-card">
            <strong>⏰ Hotel Times</strong>
            
            <div className="hotel-times-section">
              <div className="time-item">
                <span className="time-icon">🍳</span>
                <div className="time-content">
                  <span className="time-label">Breakfast</span>
                  <span className="time-value">07:00 - 11:00</span>
                </div>
              </div>
              
              <div className="time-item">
                <span className="time-icon">🚪</span>
                <div className="time-content">
                  <span className="time-label">Check-Out</span>
                  <span className="time-value">12:00</span>
                </div>
              </div>
              
              <div className="time-item">
                <span className="time-icon">🔑</span>
                <div className="time-content">
                  <span className="time-label">Check-In</span>
                  <span className="time-value">16:00</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="header-card">
            <strong>Pricing Information</strong>
            
            <div className="pricing-section">
              <div className="pricing-category">
                <strong>🚴 Bike Rental</strong>
                <div className="price-list">
                  <div className="price-item">
                    <span className="price-label">Regular rate:</span>
                    <span className="price-value">175 DKK per person</span>
                  </div>
                  <div className="price-item">
                    <span className="price-label">Lufthansa rate:</span>
                    <span className="price-value">100 DKK per person</span>
                  </div>
                </div>
              </div>

              <div className="pricing-category">
                <strong>🍳 Breakfast Pricing</strong>
                <div className="price-list">
                  <div className="price-item">
                    <span className="price-label">During booking:</span>
                    <span className="price-value">140 DKK</span>
                  </div>
                  <div className="price-item">
                    <span className="price-label">At check-in:</span>
                    <span className="price-value">179 DKK</span>
                  </div>
                  <div className="price-item">
                    <span className="price-label">On the day:</span>
                    <span className="price-value">229 DKK</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="header-card">
            <strong>📝 Daily Handover</strong>
            
            <div className="handover-section">
              <div className="handover-date-selector">
                <input
                  type="date"
                  value={handoverDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="handover-date-input"
                />
              </div>
              
              <div className="handover-preview">
                {savedHandovers[handoverDate] ? (
                  <div className="handover-preview-text">
                    {savedHandovers[handoverDate].substring(0, 80)}
                    {savedHandovers[handoverDate].length > 80 ? "..." : ""}
                  </div>
                ) : (
                  <div className="handover-preview-empty">
                    No notes for this date
                  </div>
                )}
              </div>
              
              <button
                className="handover-btn"
                onClick={openHandoverModal}
              >
                {savedHandovers[handoverDate] ? "Edit Notes" : "Add Notes"}
              </button>
              
              <div className="handover-stats">
                <span className="handover-stat">
                  📅 {Object.keys(savedHandovers).length} days recorded
                </span>
              </div>
            </div>
          </div>
          
          <div className="header-card">
            <strong>☎️ Wake-Up Calls</strong>
            
            <div className="wakeup-section">
              <div className="wakeup-summary">
                <div className="wakeup-stats">
                  <span className="wakeup-stat">
                    📞 {wakeUpCalls.filter(call => !call.completed && call.date >= new Date().toISOString().split('T')[0]).length} pending
                  </span>
                  <span className="wakeup-stat">
                    ✅ {wakeUpCalls.filter(call => call.completed).length} completed
                  </span>
                </div>
              </div>
              
              <div className="wakeup-list">
                {wakeUpCalls
                  .filter(call => call.date >= new Date().toISOString().split('T')[0])
                  .slice(0, 4)
                  .map(call => (
                    <div key={call.id} className={`wakeup-item ${call.completed ? 'completed' : ''}`}>
                      <div className="wakeup-info">
                        <span className="wakeup-room">Room {call.roomNumber}</span>
                        <span className="wakeup-time">{call.time}</span>
                        {call.date !== new Date().toISOString().split('T')[0] && (
                          <span className="wakeup-date">{new Date(call.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}</span>
                        )}
                      </div>
                      <div className="wakeup-actions">
                        <button
                          className={`wakeup-toggle ${call.completed ? 'completed' : ''}`}
                          onClick={() => toggleWakeUpCallComplete(call.id)}
                          title={call.completed ? 'Mark as pending' : 'Mark as completed'}
                        >
                          {call.completed ? '✅' : '⏰'}
                        </button>
                        <button
                          className="wakeup-delete"
                          onClick={() => deleteWakeUpCall(call.id)}
                          title="Delete wake-up call"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                
                {wakeUpCalls.filter(call => call.date >= new Date().toISOString().split('T')[0]).length === 0 && (
                  <div className="wakeup-empty">
                    No upcoming wake-up calls
                  </div>
                )}
              </div>
              
              <div className="wakeup-buttons">
                <button
                  className="wakeup-add-btn"
                  onClick={() => setShowWakeUpModal(true)}
                >
                  + Add Wake-Up Call
                </button>
                {wakeUpCalls.length > 0 && (
                  <button
                    className="wakeup-clear-btn"
                    onClick={clearOldWakeUpCalls}
                  >
                    Clear Old
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right content area */}
        <div className="main-content">
          {/* Top right header with title and shift selector */}
          <div className="top-header">
            <h2 className="night-title">{shift} Checklist</h2>
            <div className="shift-selector">
              {Object.keys(checklists).map((shiftName) => (
                <button
                  key={shiftName}
                  onClick={() => handleShiftChange(shiftName)}
                  className={`shift-btn ${shift === shiftName ? 'active' : ''}`}
                >
                  {shiftName}
                </button>
              ))}
            </div>
          </div>

          {/* Meta bar */}
          <div className="meta-bar">
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ color: "#718096", fontSize: "0.85rem", fontWeight: "500" }}>
            Logged in as <strong style={{ color: "#4a5568" }}>{user.username}</strong>
          </span>
          <span>
            <span role="img" aria-label="calendar">📅</span>
            &nbsp;{new Date().toLocaleString([], { dateStyle: "full", timeStyle: "short" })}
          </span>
        </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <button className="reset-btn" onClick={handleResetAll}>Reset All</button>
            <span
              className="initials-chip"
              style={{
                cursor: "pointer",
                transition: "all 0.3s ease",
                background: showInitialsModal ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)",
                color: showInitialsModal ? "white" : "#4a5568",
                border: showInitialsModal ? "2px solid #667eea" : "2px solid #e2e8f0",
                transform: showInitialsModal ? "translateY(-1px)" : "none"
              }}
              title="Click to change initials"
              onClick={() => {
                setNewInitials(initials);
                setShowInitialsModal(true);
              }}
            >
              {initials}
            </span>
            <button
              className="add-note-btn"
              style={{
                background: "linear-gradient(135deg, #4a5568 0%, #2d3748 100%)",
                fontWeight: 600,
                fontSize: "0.9rem",
                padding: "8px 16px"
              }}
              onClick={handleLogout}
            >
              Log Out
            </button>
          </div>
          </div>

          {/* Progress bar */}
          <div className="progress-bar">
            <div className="progress-bar-inner" style={{ width: percent + "%" }}></div>
          </div>
          <div style={{ fontSize: "1.1rem", color: "#667eea", marginBottom: 8, fontWeight: "600" }}>
            {percent}% Complete ({tasks.filter(t => t.completed).length}/{tasks.length} tasks)
          </div>

          {/* Loading and Error states */}
          {/* Loading state hidden - syncing happens silently in background */}
          {false && loading && (
            <div style={{ 
              position: "fixed",
              top: "20px",
              left: "20px",
              background: "#f7fafc", 
              border: "1px solid #e2e8f0", 
              borderRadius: "6px", 
              padding: "12px", 
              color: "#4a5568",
              fontSize: "0.95rem",
              zIndex: 1000,
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
              maxWidth: "250px"
            }}>
              🔄 Syncing with database...
            </div>
          )}
          
          {error && (
            <div style={{ 
              position: "fixed",
              top: "20px",
              left: "20px",
              background: "#fed7d7", 
              border: "1px solid #feb2b2", 
              borderRadius: "6px", 
              padding: "12px", 
              color: "#c53030",
              fontSize: "0.95rem",
              zIndex: 1000,
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
              maxWidth: "250px"
            }}>
              ⚠️ Database sync error: {error}. Changes are saved locally and will sync when reconnected.
            </div>
          )}

          {/* Checklist table */}
          <div className="table-wrap">
            <table className="checklist-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Done</th>
                  <th>Initials</th>
                  <th>Info</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td className={task.completed ? "task-completed" : "task-incomplete"}>
                      {task.text}
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        aria-label={`Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`}
                      />
                    </td>
                    <td>
                      {task.completed ? <span className="initials-chip">{task.doneBy}</span> : ""}
                    </td>
                    <td>
                      <button
                        className="info-btn"
                        onClick={() => setShowInfo(showInfo === task.id ? null : task.id)}
                        aria-label={`${showInfo === task.id ? 'Hide' : 'Show'} information for ${task.text}`}
                      >
                        i
                      </button>
                    </td>
                    <td>
                      <button
                        className={task.note ? "edit-note-btn" : "add-note-btn"}
                        onClick={() => handleNote(task.id)}
                        title={task.note ? "View/Edit Note" : "Add Note"}
                      >
                        {task.note ? "Edit" : "Add Note"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Downtime Reports Mini-Checklist */}
          <div className="downtime-checklist">
            <div className="downtime-header">
              <h3 className="downtime-title">
                Print Downtime Every 3 Hours 
                <button
                  className="info-btn"
                  onClick={() => setShowDowntimeInfo(!showDowntimeInfo)}
                  aria-label="Show downtime report instructions"
                >
                  i
                </button>
              </h3>
            </div>
            <div className="downtime-items">
              {downtimeChecklist.map((item) => (
                <div key={item.id} className="downtime-item">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleDowntimeTask(item.id)}
                    aria-label={`Mark ${item.text} as ${item.completed ? 'incomplete' : 'complete'}`}
                  />
                  <span className={item.completed ? "downtime-text-completed" : "downtime-text"}>
                    {item.text}
                  </span>
                  {item.completed && <span className="initials-chip">{item.doneBy}</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="footer-text">
            Contact Ayush if you find issues with the page.
            <br />
            <a href="mailto:ayush.gurung@scandichotels.com">ayush.gurung@scandichotels.com</a>
          </div>

      {/* Info Modal */}
      {showInfo && (() => {
        const task = tasks.find(t => t.id === showInfo) || {};
        return (
          <div
            className="info-modal-overlay"
            onClick={() => setShowInfo(null)}
          >
            <div
              className="info-modal-box"
              onClick={e => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
              <button className="info-modal-close" onClick={() => setShowInfo(null)} title="Close">&times;</button>
              <h3>{task.text || "Task Info"}</h3>
              <div className="info-detail">{task.info}</div>
            </div>
          </div>
        );
      })()}

      {/* Note Modal */}
      {showNoteModal && (() => {
        const task = tasks.find(t => t.id === showNoteModal) || {};
        return (
          <div
            className="info-modal-overlay"
            onClick={cancelNote}
          >
            <div
              className="note-modal-box"
              onClick={e => e.stopPropagation()}
            >
              <button className="info-modal-close" onClick={cancelNote} title="Close">&times;</button>
              <h3>{task.note ? "Edit Note" : "Add Note"}</h3>
              <textarea
                className="note-textarea"
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Enter your note here..."
                rows={4}
                autoFocus
              />
              <div className="note-modal-buttons">
                <button className="add-note-btn" onClick={saveNote}>
                  Save Note
                </button>
                <button className="reset-btn" onClick={cancelNote} style={{ marginRight: 0 }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Initials Modal */}
      {showInitialsModal && (
        <div
          className="info-modal-overlay"
          onClick={() => setShowInitialsModal(false)}
        >
          <div
            className="initials-modal-box"
            onClick={e => e.stopPropagation()}
          >
            <button className="info-modal-close" onClick={() => setShowInitialsModal(false)} title="Close">&times;</button>
            <h3>Change Initials</h3>
            <form
              onSubmit={e => {
                e.preventDefault();
                const trimmedInitials = newInitials.trim().toUpperCase();
                if (trimmedInitials.length < 2) {
                  alert("Please enter at least 2 letters for initials.");
                  return;
                }
                setInitials(trimmedInitials);
                setShowInitialsModal(false);
              }}
            >
              <input
                type="text"
                className="initials-input"
                value={newInitials}
                onChange={e => setNewInitials(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase())}
                placeholder="Enter initials"
                maxLength={4}
                autoFocus
                required
              />
              <div className="note-modal-buttons">
                <button type="submit" className="add-note-btn">
                  Save
                </button>
                <button type="button" className="reset-btn" onClick={() => setShowInitialsModal(false)} style={{ marginRight: 0 }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Downtime Info Modal */}
      {showDowntimeInfo && (
        <div
          className="info-modal-overlay"
          onClick={() => setShowDowntimeInfo(false)}
        >
          <div
            className="info-modal-box"
            onClick={e => e.stopPropagation()}
          >
            <button className="info-modal-close" onClick={() => setShowDowntimeInfo(false)} title="Close">&times;</button>
            <h3>Downtime Reports Instructions</h3>
            <div className="info-detail">
              • Check reception email for report attachments at 01:00, 04:00, and 07:00.
              
              • If missing:
                - Opera Cloud → Reports → Manage Reports → Search "Downtime."
                - Select "Shift Report" → Set correct time → Print.
              
              • Replace old report in drawer (above "PET Food").
              
              • These reports are critical for emergencies.
              
              • Use the checkboxes above to track completion of each time period.
            </div>
          </div>
        </div>
      )}

      {/* Handover Modal */}
      {showHandoverModal && (
        <div
          className="handover-modal-overlay"
          onClick={() => setShowHandoverModal(false)}
        >
          <div
            className="handover-modal-container"
            onClick={e => e.stopPropagation()}
          >
            <div className="handover-modal-header">
              <h2>📝 Daily Handover Management</h2>
              <button className="handover-modal-close" onClick={() => setShowHandoverModal(false)} title="Close">
                &times;
              </button>
            </div>

            <div className="handover-modal-content">
              {/* Left side - Date selection and navigation */}
              <div className="handover-sidebar">
                <div className="handover-current-date">
                  <h3>Select Date</h3>
                  <input
                    type="date"
                    value={handoverDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="handover-main-date-input"
                  />
                  <div className="handover-date-display">
                    {new Date(handoverDate).toLocaleDateString('en-GB', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>

                <div className="handover-quick-nav">
                  <h4>Quick Navigation</h4>
                  <div className="handover-nav-buttons">
                    <button
                      className="handover-nav-btn"
                      onClick={() => {
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        handleDateChange(yesterday.toISOString().split('T')[0]);
                      }}
                    >
                      ← Yesterday
                    </button>
                    <button
                      className="handover-nav-btn"
                      onClick={() => handleDateChange(new Date().toISOString().split('T')[0])}
                    >
                      Today
                    </button>
                    <button
                      className="handover-nav-btn"
                      onClick={() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        handleDateChange(tomorrow.toISOString().split('T')[0]);
                      }}
                    >
                      Tomorrow →
                    </button>
                  </div>
                </div>

                <div className="handover-history">
                  <h4>Recent Days with Notes</h4>
                  <div className="handover-history-list">
                    {Object.keys(savedHandovers)
                      .sort((a, b) => new Date(b) - new Date(a))
                      .slice(0, 8)
                      .map(date => (
                        <div
                          key={date}
                          className={`handover-history-item ${date === handoverDate ? 'active' : ''}`}
                        >
                          <button
                            className="handover-history-btn"
                            onClick={() => handleDateChange(date)}
                          >
                            <div className="handover-history-date">
                              {new Date(date).toLocaleDateString('en-GB', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </div>
                            <div className="handover-history-preview">
                              {savedHandovers[date].substring(0, 40)}...
                            </div>
                          </button>
                          <button
                            className="handover-history-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteHandoverNotes(date);
                            }}
                            title={`Delete notes for ${new Date(date).toLocaleDateString('en-GB')}`}
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                  </div>
                  
                  <div className="handover-stats-detailed">
                    <div className="handover-stat-item">
                      <span className="handover-stat-number">{Object.keys(savedHandovers).length}</span>
                      <span className="handover-stat-label">Total Days</span>
                    </div>
                    <div className="handover-stat-item">
                      <span className="handover-stat-number">
                        {Object.keys(savedHandovers).filter(date => {
                          const noteDate = new Date(date);
                          const weekAgo = new Date();
                          weekAgo.setDate(weekAgo.getDate() - 7);
                          return noteDate >= weekAgo;
                        }).length}
                      </span>
                      <span className="handover-stat-label">This Week</span>
                    </div>
                  </div>

                  {Object.keys(savedHandovers).length > 0 && (
                    <div className="handover-bulk-actions">
                      <h4>Bulk Actions</h4>
                      <button
                        className="handover-bulk-delete-btn"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete ALL ${Object.keys(savedHandovers).length} handover notes? This cannot be undone.`)) {
                            setSavedHandovers({});
                            localStorage.setItem('hotel-handovers', JSON.stringify({}));
                            setHandoverNotes("");
                          }
                        }}
                      >
                        🗑️ Delete All Notes
                      </button>
                      <button
                        className="handover-bulk-delete-old-btn"
                        onClick={() => {
                          const oneWeekAgo = new Date();
                          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                          
                          const oldDates = Object.keys(savedHandovers).filter(date => 
                            new Date(date) < oneWeekAgo
                          );
                          
                          if (oldDates.length === 0) {
                            alert('No notes older than 7 days found.');
                            return;
                          }
                          
                          if (window.confirm(`Delete ${oldDates.length} notes older than 7 days? This cannot be undone.`)) {
                            const updatedHandovers = { ...savedHandovers };
                            oldDates.forEach(date => delete updatedHandovers[date]);
                            setSavedHandovers(updatedHandovers);
                            localStorage.setItem('hotel-handovers', JSON.stringify(updatedHandovers));
                            
                            if (oldDates.includes(handoverDate)) {
                              setHandoverNotes("");
                            }
                          }
                        }}
                      >
                        🧹 Delete Old Notes (7+ days)
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right side - Notes editing */}
              <div className="handover-editor">
                <div className="handover-editor-header">
                  <h3>
                    {savedHandovers[handoverDate] ? '📝 Edit Notes' : '➕ Add New Notes'}
                  </h3>
                  <div className="handover-editor-info">
                    {savedHandovers[handoverDate] && (
                      <span className="handover-word-count">
                        {handoverNotes.split(' ').filter(word => word.length > 0).length} words
                      </span>
                    )}
                  </div>
                </div>

                <textarea
                  className="handover-main-textarea"
                  value={handoverNotes}
                  onChange={e => setHandoverNotes(e.target.value)}
                  placeholder={`What happened on ${new Date(handoverDate).toLocaleDateString('en-GB')}?

🏨 Hotel Operations:
• Guest requests and special needs
• Room status updates
• Equipment issues

🔧 Maintenance & Repairs:
• Broken or malfunctioning equipment
• Scheduled maintenance
• Repair requests

👥 Staff & Schedule:
• Staff schedule changes
• Important announcements
• Training or meetings

📦 Supplies & Inventory:
• Low stock items
• Supply deliveries
• Restocking needs

⚠️ Incidents & Issues:
• Guest complaints
• Safety incidents
• System problems

📋 Next Shift Notes:
• Urgent tasks for next shift
• Follow-up required
• Special instructions`}
                  rows={20}
                  autoFocus
                />

                <div className="handover-editor-actions">
                  <button className="handover-save-btn" onClick={saveHandoverNotes}>
                    💾 Save Notes
                  </button>
                  <button className="handover-cancel-btn" onClick={() => setShowHandoverModal(false)}>
                    ❌ Cancel
                  </button>
                  {savedHandovers[handoverDate] && (
                    <button 
                      className="handover-delete-btn"
                      onClick={() => deleteHandoverNotes(handoverDate)}
                    >
                      🗑️ Delete Notes
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wake-Up Call Modal */}
      {showWakeUpModal && (
        <div
          className="info-modal-overlay"
          onClick={() => setShowWakeUpModal(false)}
        >
          <div
            className="wakeup-modal-box"
            onClick={e => e.stopPropagation()}
          >
            <button className="info-modal-close" onClick={() => setShowWakeUpModal(false)} title="Close">&times;</button>
            <h3>☎️ Add Wake-Up Call</h3>
            <form
              onSubmit={e => {
                e.preventDefault();
                addWakeUpCall();
              }}
            >
              <div className="wakeup-form-group">
                <label htmlFor="roomNumber">Room Number</label>
                <input
                  id="roomNumber"
                  type="text"
                  className="wakeup-input"
                  value={newWakeUpCall.roomNumber}
                  onChange={e => setNewWakeUpCall(prev => ({ ...prev, roomNumber: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  placeholder="e.g. 102"
                  maxLength={4}
                  autoFocus
                  required
                />
              </div>
              
              <div className="wakeup-form-group">
                <label htmlFor="wakeupTime">Wake-Up Time</label>
                <input
                  id="wakeupTime"
                  type="time"
                  className="wakeup-input"
                  value={newWakeUpCall.time}
                  onChange={e => setNewWakeUpCall(prev => ({ ...prev, time: e.target.value }))}
                  required
                />
              </div>
              
              <div className="wakeup-form-group">
                <label htmlFor="wakeupDate">Date</label>
                <input
                  id="wakeupDate"
                  type="date"
                  className="wakeup-input"
                  value={newWakeUpCall.date}
                  onChange={e => setNewWakeUpCall(prev => ({ ...prev, date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              
              <div className="wakeup-form-group">
                <label htmlFor="wakeupNotes">Notes (Optional)</label>
                <textarea
                  id="wakeupNotes"
                  className="wakeup-textarea"
                  value={newWakeUpCall.notes}
                  onChange={e => setNewWakeUpCall(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Special instructions or guest preferences..."
                  rows={3}
                />
              </div>
              
              <div className="note-modal-buttons">
                <button type="submit" className="add-note-btn">
                  Add Wake-Up Call
                </button>
                <button type="button" className="reset-btn" onClick={() => setShowWakeUpModal(false)} style={{ marginRight: 0 }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}

export default App;