import React, { useState, useMemo, useCallback } from "react";
import { checklists } from "./Checklists";
import { users } from "./users";
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
  const [tasks, setTasks] = useState(
    checklists[shift].map((task) => ({ ...task, completed: false, note: "", doneBy: "" }))
  );
  const [showInfo, setShowInfo] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [showInitialsModal, setShowInitialsModal] = useState(false);
  
  // Generate downtime checklist based on current shift
  const getDowntimeChecklist = (currentShift) => {
    const downtimeTimes = {
      Night: [
        { id: 1, text: "1st 01:00", completed: false, doneBy: "" },
        { id: 2, text: "2nd 04:00", completed: false, doneBy: "" },
        { id: 3, text: "3rd 07:00", completed: false, doneBy: "" }
      ],
      Morning: [
        { id: 1, text: "1st 09:00", completed: false, doneBy: "" },
        { id: 2, text: "2nd 12:00", completed: false, doneBy: "" },
        { id: 3, text: "3rd 15:00", completed: false, doneBy: "" }
      ],
      Evening: [
        { id: 1, text: "1st 18:00", completed: false, doneBy: "" },
        { id: 2, text: "2nd 21:00", completed: false, doneBy: "" },
        { id: 3, text: "3rd 23:00", completed: false, doneBy: "" }
      ]
    };
    return downtimeTimes[currentShift] || downtimeTimes.Night;
  };
  
  const [downtimeChecklist, setDowntimeChecklist] = useState(getDowntimeChecklist(shift));
  const [showDowntimeInfo, setShowDowntimeInfo] = useState(false);

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
    // Assign current initials to any already-completed tasks
    setTasks(tasks =>
      tasks.map(t =>
        t.completed ? { ...t, doneBy: trimmedInitials } : t
      )
    );
  };

  // Progress calculation - memoized for performance
  const percent = useMemo(() => 
    Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100),
    [tasks]
  );

  const handleShiftChange = useCallback((newShift) => {
    setShift(newShift);
    setTasks(checklists[newShift].map((task) => ({ ...task, completed: false, note: "", doneBy: "" })));
    setDowntimeChecklist(getDowntimeChecklist(newShift));
    setShowInfo(null);
  }, []);

  const toggleTask = useCallback((id) => {
    setTasks((tasks) =>
      tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
              doneBy: !task.completed ? initials : "", // Set initials when marking complete, remove when unchecking
            }
          : task
      )
    );
  }, [initials]);

  const handleNote = useCallback((id) => {
    const task = tasks.find(t => t.id === id);
    setNoteText(task?.note || "");
    setShowNoteModal(id);
  }, [tasks]);

  const saveNote = useCallback(() => {
    if (showNoteModal) {
      setTasks(tasks =>
        tasks.map(t => t.id === showNoteModal ? { ...t, note: noteText } : t)
      );
      setShowNoteModal(null);
      setNoteText("");
    }
  }, [showNoteModal, noteText]);

  const cancelNote = useCallback(() => {
    setShowNoteModal(null);
    setNoteText("");
  }, []);

  const toggleDowntimeTask = useCallback((id) => {
    setDowntimeChecklist((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
              doneBy: !task.completed ? initials : "",
            }
          : task
      )
    );
  }, [initials]);

  const resetAll = useCallback(() => {
    if (window.confirm("Are you sure you want to reset all tasks? This cannot be undone.")) {
      setTasks(checklists[shift].map(task => ({ ...task, completed: false, note: "", doneBy: "" })));
      setDowntimeChecklist(getDowntimeChecklist(shift));
      setShowInfo(null);
    }
  }, [shift]);

  const handleLogout = () => {
    setUser(null);
    setInitials("");
    setInitialsSubmitted(false);
    setShowChangeInitials(false);
    setNewInitials("");
  };

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
            <strong>Scandic Falkoner</strong>
            Address: Falkoner Alle 9, 2000 Frederiksberg, Denmark<br />
            Phone: +45 72 42 55 00<br />
            Email: <a href="mailto:falkoner@scandichotels.com">falkoner@scandichotels.com</a>
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
            <button className="reset-btn" onClick={resetAll}>Reset All</button>
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
        </div>
      </div>
    </div>
  );
}

export default App;