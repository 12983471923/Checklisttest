import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { housekeepingChecklists } from '../Checklists/housekeeping';
import { useHousekeepingChecklist } from '../hooks/useHousekeepingChecklist';
import { signOutUser, updateUserInitials } from '../firebase/auth';
import { validateUserInput } from '../utils/security';
import HotelInfoCards from './HotelInfoCards';
import MessagingPanel from './MessagingPanel';
import RequestsPanel from './RequestsPanel';
import RoomManagement, { useRooms } from './RoomManagement';
import NotificationToasts, { useNotifications, useRealtimeNotifications } from './NotificationToasts';
import ThemeToggle from './ThemeToggle';
import '../App.css';
import './auth.css';
import { subscribeToMessages, subscribeToRequests } from '../firebase/housekeeping';

export default function HousekeepingApp({ userProfile, currentUser }) {
  const profileInitials = userProfile?.initials?.trim().toUpperCase() || '';
  const displayName = userProfile?.displayName || currentUser?.displayName || currentUser?.email || 'Housekeeping';
  const rooms = useRooms();

  const [initials, setInitials] = useState('');
  const [initialsSubmitted, setInitialsSubmitted] = useState(false);
  const [shift, setShift] = useState('AM');
  const [showInfo, setShowInfo] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [showInitialsModal, setShowInitialsModal] = useState(false);
  const [newInitials, setNewInitials] = useState('');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadRequests, setUnreadRequests] = useState(0);
  const [messages, setMessages] = useState([]);
  const [requests, setRequests] = useState([]);

  const { toasts, showToast, dismissToast } = useNotifications();

  const {
    tasks,
    instructions,
    error,
    toggleTask,
    toggleTaskInProgress,
    updateTaskNote,
    resetAll,
  } = useHousekeepingChecklist(shift, initials);

  useEffect(() => {
    const unsubMessages = subscribeToMessages(setMessages);
    const unsubRequests = subscribeToRequests(setRequests);
    return () => {
      unsubMessages();
      unsubRequests();
    };
  }, []);

  useRealtimeNotifications(messages, {
    showToast,
    type: 'message',
    filter: (m) => m.fromDepartment === 'reception' && !m.readByHousekeeping,
    formatMessage: (m) => `New message from Reception: ${m.text}`,
  });

  useRealtimeNotifications(requests, {
    showToast,
    type: 'request',
    filter: (r) => !r.readByHsk && r.status !== 'completed',
    formatMessage: (r) => `New request: ${r.title}${r.roomNumber ? ` (Room ${r.roomNumber})` : ''}`,
  });

  useEffect(() => {
    if (profileInitials) {
      setInitials(profileInitials);
      setInitialsSubmitted(true);
    }
  }, [profileInitials]);

  const percent = useMemo(() => {
    if (!tasks.length) return 0;
    return Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100);
  }, [tasks]);

  const handleInitialsSubmit = async (e) => {
    e.preventDefault();
    const validation = validateUserInput(initials, 'initials');
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    setInitials(validation.value);
    setInitialsSubmitted(true);
    if (currentUser) {
      await updateUserInitials(currentUser.uid, validation.value);
    }
  };

  const handleLogout = async () => {
    await signOutUser();
    setInitials('');
    setInitialsSubmitted(false);
  };

  const handleNote = useCallback((taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    setNoteText(task?.note || '');
    setShowNoteModal(taskId);
  }, [tasks]);

  const saveNote = useCallback(async () => {
    if (showNoteModal == null) return;
    const validation = validateUserInput(noteText, 'notes');
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    await updateTaskNote(showNoteModal, validation.value);
    setShowNoteModal(null);
    setNoteText('');
  }, [showNoteModal, noteText, updateTaskNote]);

  const handleResetAll = useCallback(() => {
    if (window.confirm('Reset all checklist items? This cannot be undone.')) {
      resetAll();
    }
  }, [resetAll]);

  if (!initialsSubmitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <form
          className="initials-form"
          style={{ textAlign: 'center', maxWidth: '320px', padding: '24px', minWidth: '280px' }}
          onSubmit={handleInitialsSubmit}
        >
          <h2 className="form-title" style={{ fontSize: '1.3rem', marginBottom: '20px' }}>
            Enter Your Initials
          </h2>
          <input
            className="form-input"
            type="text"
            placeholder="e.g. AG"
            value={initials}
            onChange={(e) => setInitials(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase())}
            style={{ textAlign: 'center', letterSpacing: '2px', fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', padding: '10px 14px' }}
            maxLength={4}
            required
            autoFocus
          />
          <button type="submit" className="add-note-btn" style={{ width: '100%', marginBottom: '10px' }}>
            Continue
          </button>
          <button type="button" className="reset-btn" style={{ width: '100%' }} onClick={handleLogout}>
            Log Out
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="checklist-container hsk-portal">
      <NotificationToasts toasts={toasts} onDismiss={dismissToast} />

      <div className="main-layout">
        <div className="left-sidebar">
          <HotelInfoCards />
          <RequestsPanel
            mode="housekeeping"
            user={currentUser}
            userProfile={userProfile}
            rooms={rooms}
            onUnreadChange={setUnreadRequests}
          />
          <RoomManagement mode="housekeeping" />
        </div>

        <div className="main-content">
          <div className="top-header">
            <h2 className="night-title">Housekeeping Dashboard</h2>
            <div className="shift-selector shift-selector-am">
              {Object.keys(housekeepingChecklists).map((shiftName) => (
                <button
                  key={shiftName}
                  onClick={() => setShift(shiftName)}
                  className={`shift-btn ${shift === shiftName ? 'active' : ''}`}
                >
                  {shiftName}
                </button>
              ))}
            </div>
          </div>

          <div className="meta-bar">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span className="meta-bar-user">
                Logged in as <strong>{displayName}</strong>
              </span>
              <span>
                <span role="img" aria-label="calendar">📅</span>
                &nbsp;{new Date().toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <Link to="/" className="portal-nav-btn">
                Reception
              </Link>
              <MessagingPanel
                department="housekeeping"
                user={currentUser}
                userProfile={userProfile}
                onUnreadChange={setUnreadMessages}
              />
              {(unreadMessages > 0 || unreadRequests > 0) && (
                <span className="hsk-notification-summary">
                  {unreadMessages + unreadRequests} unread
                </span>
              )}
              <ThemeToggle />
              <button className="reset-btn" onClick={handleResetAll}>Reset All</button>
              <span
                className="initials-chip initials-chip-action"
                onClick={() => { setNewInitials(initials); setShowInitialsModal(true); }}
              >
                {initials}
              </span>
              <button className="add-note-btn logout-btn" onClick={handleLogout}>
                Log Out
              </button>
            </div>
          </div>

          <div className="progress-bar">
            <div className="progress-bar-inner" style={{ width: `${percent}%` }} />
          </div>
          <div className="progress-summary">
            {percent}% Complete ({tasks.filter((t) => t.completed).length}/{tasks.length} tasks)
          </div>

          {error && (
            <div className="hsk-error-banner">⚠️ Sync error: {error}</div>
          )}

          {instructions?.trim() && (
            <div className="shift-instructions-card">
              <div className="shift-instructions-title">
                <span role="img" aria-label="clipboard">📋</span> {shift} Shift Notes
              </div>
              <p className="shift-instructions-text">{instructions}</p>
            </div>
          )}

          <div className="checklist-section-label">Assigned checklist</div>
          <div className="task-list" role="list">
            {tasks.map((task) => {
              const isInProgress = Boolean(task.inProgressBy);
              const isMine = task.inProgressBy === initials;

              return (
                <article
                  key={task.id}
                  className={`task-card ${task.completed ? 'is-completed' : ''} ${isInProgress ? 'is-in-progress' : ''}`}
                  role="listitem"
                >
                  <label className="task-checkbox-control">
                    <input
                      className="ios-checkbox-input"
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                    />
                    <span className="ios-checkbox" aria-hidden="true" />
                  </label>

                  <div className="task-card-body">
                    <div className="task-title-row">
                      <h3 className="task-title">{task.text}</h3>
                      {isInProgress && (
                        <span className="in-progress-indicator">
                          <span className="in-progress-dot" aria-hidden="true" />
                          {isMine ? 'In progress' : `${task.inProgressBy} working`}
                        </span>
                      )}
                    </div>
                    {task.note && <p className="task-note-preview">{task.note}</p>}
                  </div>

                  <div className="task-card-actions">
                    {task.completed && <span className="initials-chip">{task.doneBy}</span>}
                    <button
                      className={`working-btn ${isMine ? 'working-active' : isInProgress ? 'working-other' : ''}`}
                      onClick={() => toggleTaskInProgress(task.id)}
                      disabled={task.completed || (isInProgress && !isMine)}
                    >
                      {isMine ? '● Stop' : isInProgress ? `● ${task.inProgressBy}` : '○ Work'}
                    </button>
                    {task.info && (
                      <button className="info-btn" onClick={() => setShowInfo(showInfo === task.id ? null : task.id)}>
                        i
                      </button>
                    )}
                    <button
                      className={task.note ? 'edit-note-btn' : 'add-note-btn'}
                      onClick={() => handleNote(task.id)}
                    >
                      {task.note ? 'Edit note' : 'Add note'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      {showInfo != null && (
        <div className="info-modal-overlay" onClick={() => setShowInfo(null)}>
          <div className="info-modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="info-modal-close" onClick={() => setShowInfo(null)}>×</button>
            <h3>Task Information</h3>
            <p>{tasks.find((t) => t.id === showInfo)?.info}</p>
          </div>
        </div>
      )}

      {showNoteModal != null && (
        <div className="info-modal-overlay" onClick={() => setShowNoteModal(null)}>
          <div className="info-modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="info-modal-close" onClick={() => setShowNoteModal(null)}>×</button>
            <h3>Task Note</h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
              style={{ width: '100%', marginBottom: '12px' }}
            />
            <button className="add-note-btn" onClick={saveNote}>Save Note</button>
          </div>
        </div>
      )}

      {showInitialsModal && (
        <div className="info-modal-overlay" onClick={() => setShowInitialsModal(false)}>
          <div className="info-modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="info-modal-close" onClick={() => setShowInitialsModal(false)}>×</button>
            <h3>Change Initials</h3>
            <input
              type="text"
              value={newInitials}
              onChange={(e) => setNewInitials(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase())}
              maxLength={4}
              style={{ width: '100%', marginBottom: '12px', textAlign: 'center', letterSpacing: '2px' }}
            />
            <button
              className="add-note-btn"
              onClick={async () => {
                const validation = validateUserInput(newInitials, 'initials');
                if (!validation.valid) { alert(validation.error); return; }
                setInitials(validation.value);
                await updateUserInitials(currentUser.uid, validation.value);
                setShowInitialsModal(false);
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
