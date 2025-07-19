import React, { useState } from "react";
import { checklists } from "./checklists";
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

  // Handle login submit
  const handleLogin = (e) => {
    e.preventDefault();
    const match = users.find(
      (u) =>
        u.username === loginForm.username && u.password === loginForm.password
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
    if (initials.trim().length < 2) {
      alert("Please enter at least 2 letters for initials.");
      return;
    }
    setInitialsSubmitted(true);
    // Assign current initials to any already-completed tasks
    setTasks(tasks =>
      tasks.map(t =>
        t.completed ? { ...t, doneBy: initials.trim().toUpperCase() } : t
      )
    );
  };

  // Progress calculation
  const percent = Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100);

  const handleShiftChange = (e) => {
    const newShift = e.target.value;
    setShift(newShift);
    setTasks(checklists[newShift].map((task) => ({ ...task, completed: false, note: "", doneBy: "" })));
    setShowInfo(null);
  };

  const toggleTask = (id) => {
    setTasks((tasks) =>
      tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
              doneBy: !task.completed ? initials.trim().toUpperCase() : "", // Set initials when marking complete, remove when unchecking
            }
          : task
      )
    );
  };

  const handleNote = (id) => {
    const note = prompt("Add a note for this task:");
    if (note !== null) {
      setTasks(tasks =>
        tasks.map(t => t.id === id ? { ...t, note } : t)
      );
    }
  };

  const resetAll = () => {
    setTasks(checklists[shift].map(task => ({ ...task, completed: false, note: "", doneBy: "" })));
    setShowInfo(null);
  };

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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f6f8fa" }}>
        <form
          style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 2px 24px rgba(50,50,93,0.10)",
            padding: 40,
            minWidth: 300
          }}
          onSubmit={handleLogin}
        >
          <h2 style={{ textAlign: "center", marginBottom: 24 }}>Staff Login</h2>
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              placeholder="User ID"
              value={loginForm.username}
              onChange={e => setLoginForm(f => ({ ...f, username: e.target.value }))}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #b3c7ee",
                fontSize: "1.03em"
              }}
              autoFocus
              required
            />
          </div>
          <div style={{ marginBottom: 18 }}>
            <input
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #b3c7ee",
                fontSize: "1.03em"
              }}
              required
            />
          </div>
          {loginError && (
            <div style={{ color: "#e53935", marginBottom: 12, textAlign: "center" }}>
              {loginError}
            </div>
          )}
          <button
            type="submit"
            className="add-note-btn"
            style={{ width: "100%", fontWeight: 700, fontSize: "1.05em" }}
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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f6f8fa" }}>
        <form
          style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 2px 24px rgba(50,50,93,0.10)",
            padding: 36,
            minWidth: 260,
            textAlign: "center"
          }}
          onSubmit={handleInitialsSubmit}
        >
          <h2 style={{ marginBottom: 18 }}>Enter Your Initials</h2>
          <input
            type="text"
            placeholder="Your initials (e.g. AG)"
            value={initials}
            onChange={e => setInitials(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase())}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #b3c7ee",
              fontSize: "1.2em",
              textAlign: "center",
              letterSpacing: "2px"
            }}
            maxLength={4}
            required
            autoFocus
          />
          <button
            type="submit"
            className="add-note-btn"
            style={{ width: "100%", fontWeight: 700, marginTop: 22 }}
          >
            Continue
          </button>
          <button
            type="button"
            className="add-note-btn"
            style={{ width: "100%", marginTop: 10, background: "#aaa" }}
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
      {/* Header card */}
      <div className="header-card">
        <strong>Scandic Falkoner</strong>
        Address: Falkoner Alle 9, 2000 Frederiksberg, Denmark<br />
        Phone: +45 72 42 55 00<br />
        Email: <a href="mailto:falkoner@scandichotels.com">falkoner@scandichotels.com</a>
      </div>

      {/* Page Title */}
      <h2 className="night-title">{shift} Checklist</h2>

      {/* Shift Selector */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24, gap: 12 }}>
        {Object.keys(checklists).map((shiftName) => (
          <button
            key={shiftName}
            onClick={() => {
              setShift(shiftName);
              setTasks(checklists[shiftName].map((task) => ({ ...task, completed: false, note: "" })));
              setShowInfo(null);
            }}
            className="add-note-btn"
            style={{
              background: shift === shiftName ? "#1976d2" : "#e3eaf6",
              color: shift === shiftName ? "#fff" : "#222",
              border: shift === shiftName ? "none" : "1px solid #b6d4fa",
              fontWeight: shift === shiftName ? 700 : 500,
              boxShadow: shift === shiftName ? "0 2px 8px #b3c7ee33" : "none"
            }}
          >
            {shiftName}
          </button>
        ))}
      </div>

      {/* Meta bar */}
      <div className="meta-bar">
        <span>
          <span role="img" aria-label="calendar">📅</span>
          &nbsp;{new Date().toLocaleString([], { dateStyle: "full", timeStyle: "short" })}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button className="reset-btn" onClick={resetAll}>Reset All</button>
          <span
            className="initials-chip"
            style={{
              cursor: "pointer",
              transition: "background 0.2s, color 0.2s",
              background: showChangeInitials ? "#1976d2" : "#ececec",
              color: showChangeInitials ? "#fff" : "#222",
              border: showChangeInitials ? "1px solid #1976d2" : "1px solid #bbb"
            }}
            title="Click to change initials"
            onClick={() => {
              setNewInitials(initials);
              setShowChangeInitials(true);
            }}
          >
            {initials}
          </span>
          <button
            className="add-note-btn"
            style={{
              background: "#444",
              fontWeight: 600,
              fontSize: "0.98em",
              padding: "4px 18px"
            }}
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Change Initials Form */}
      {showChangeInitials && (
        <div style={{ marginBottom: 16 }}>
          <form
            onSubmit={e => {
              e.preventDefault();
              if (newInitials.trim().length < 2) {
                alert("Please enter at least 2 letters for initials.");
                return;
              }
              setInitials(newInitials.trim().toUpperCase());
              setShowChangeInitials(false);
            }}
            style={{
              background: "#fff",
              border: "1px solid #cce3fa",
              borderRadius: 8,
              padding: 10,
              marginTop: 10,
              textAlign: "center"
            }}
          >
            <input
              type="text"
              value={newInitials}
              onChange={e => setNewInitials(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase())}
              placeholder="New initials"
              maxLength={4}
              style={{
                padding: 7,
                borderRadius: 6,
                border: "1px solid #b3c7ee",
                fontSize: "1.1em",
                letterSpacing: "2px",
                textAlign: "center",
                width: 80,
                marginRight: 8
              }}
              autoFocus
              required
            />
            <button
              type="submit"
              className="add-note-btn"
              style={{ fontSize: "1em", marginRight: 6 }}
            >
              Save
            </button>
            <button
              type="button"
              className="add-note-btn"
              style={{ background: "#ccc", color: "#333", fontSize: "1em" }}
              onClick={() => setShowChangeInitials(false)}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Progress bar */}
      <div className="progress-bar">
        <div className="progress-bar-inner" style={{ width: percent + "%" }}></div>
      </div>
      <div style={{ fontSize: "0.98em", color: "#1565c0", marginBottom: 5 }}>
        {percent}% Complete<br />
        <span style={{ color: "#333" }}>Logged in as <strong>{user.username}</strong></span>
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
                <td style={{
                  color: task.completed ? "#bbb" : "#222",
                  textDecoration: task.completed ? "line-through" : "none",
                  fontWeight: task.completed ? "400" : "500",
                  opacity: task.completed ? 0.6 : 1
                }}>
                  {task.text}
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                  />
                </td>
                <td>
                  {task.completed ? <span className="initials-chip">{task.doneBy}</span> : ""}
                </td>
                <td>
                  <button
                    className="info-btn"
                    onClick={() => setShowInfo(showInfo === task.id ? null : task.id)}
                  >
                    i
                  </button>
                </td>
                <td>
                  <button
                    className="add-note-btn"
                    onClick={() => handleNote(task.id)}
                  >
                    {task.note ? "Edit Note" : "Add Note"}
                  </button>
                  {task.note && (
                    <div style={{
                      fontSize: "0.92em",
                      color: "#1565c0",
                      marginTop: 3,
                      maxWidth: 150,
                      whiteSpace: "pre-line"
                    }}>
                      {task.note}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{
        textAlign: "center",
        color: "#888",
        fontSize: "1em",
        marginTop: 25
      }}>
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
    </div>
  );
}

export default App;