import React, { useState, useMemo, useCallback, useEffect } from "react";
import { checklists } from "./Checklists";
import { useRealtimeChecklist } from "./hooks/useRealtimeChecklist";
import { useAuth } from "./hooks/useAuth";
import { useDashboardConfig } from "./hooks/useDashboardConfig";
import TeamHandoverPanel from "./components/TeamHandoverPanel";
import { validateUserInput } from "./utils/security";
import { 
  saveHandoverNotes as saveHandoverNotesToDB,
  getHandoverNotes,
  deleteHandoverNotes as deleteHandoverNotesFromDB,
  subscribeToHandoverNotes,
  saveWakeUpCalls,
  subscribeToWakeUpCalls,
  saveBreakfastTimes as saveBreakfastTimesToDB,
  getBreakfastTimes,
  subscribeToBreakfastTimes,
  subscribeToPricingInfo,
  DEFAULT_PRICING,
  getVisibleBreakfastItems,
  formatBreakfastPrice,
} from "./firebase/database";
import { signOutUser } from "./firebase/auth";
import { isAdminEmail } from "./config/admin";
import AuthLoginForm from "./components/AuthLoginForm";
import HskLoginForm from "./components/hsk/HskLoginForm";
import HskDashboard from "./components/hsk/HskDashboard";
import FloatingHskWidget from "./components/hsk/FloatingHskWidget";
import AdminPanel from "./components/AdminPanel";
import WeatherWidget from "./components/WeatherWidget";
import FloatingMapButton from "./components/FloatingMapButton";
import ThemeToggle from "./components/ThemeToggle";
import 'leaflet/dist/leaflet.css';
import "./App.css";
import "./responsive.css";
import "./components/auth.css";
import "./components/hsk/hsk.css";
import "./components/team-handover.css";

function ProfileMissingScreen({ currentUser, loginPortal, onUseHskLogin, onLogout }) {
  return (
    <div className="app-loading-screen">
      <div className="profile-missing-card">
        <h2>Profile not found</h2>
        <p>
          You are signed in as <strong>{currentUser.email}</strong>, but Firestore has no
          matching profile at <code>users/{currentUser.uid}</code>.
        </p>
        <ul>
          <li>In Firestore, create document <strong>users/{currentUser.uid}</strong> (use the UID from Authentication, not the email).</li>
          <li>Add fields: <strong>role</strong>, <strong>isActive</strong> (true), <strong>email</strong>, <strong>displayName</strong>.</li>
          <li>Housekeeping staff: set <strong>role</strong> to <code>housekeeping</code> and use the <strong>Housekeeping (HSK)</strong> login.</li>
          <li>Admin: set <strong>role</strong> to <code>admin</code> and use the main Sign In (Reception) or HSK login for the HSK Dashboard.</li>
        </ul>
        {loginPortal !== "housekeeping" && (
          <button type="button" className="hsk-portal-switch" onClick={onUseHskLogin}>
            Switch to Housekeeping (HSK) login
          </button>
        )}
        <button type="button" className="hsk-login-back" onClick={onLogout}>
          Back to login
        </button>
      </div>
    </div>
  );
}

function App() {
  const { currentUser, userProfile, loading, error } = useAuth();
  const [loginError, setLoginError] = useState("");
  const [loginPortal, setLoginPortal] = useState(
    () => sessionStorage.getItem("loginPortal") || "reception"
  );
  const [profileWait, setProfileWait] = useState(true);

  useEffect(() => {
    sessionStorage.setItem("loginPortal", loginPortal);
  }, [loginPortal]);

  useEffect(() => {
    if (!currentUser) {
      setProfileWait(false);
      return undefined;
    }
    if (userProfile) {
      setProfileWait(false);
      return undefined;
    }
    setProfileWait(true);
    const timer = window.setTimeout(() => setProfileWait(false), 1500);
    return () => window.clearTimeout(timer);
  }, [currentUser, userProfile]);

  const handleLogout = async () => {
    await signOutUser();
    setLoginError("");
    sessionStorage.removeItem("loginPortal");
    setLoginPortal("reception");
  };

  const role = userProfile?.role ?? userProfile?.Role;
  const useHskDashboard =
    role === "housekeeping" || (role === "admin" && loginPortal === "housekeeping");

  if (loading || (currentUser && !userProfile && profileWait)) {
    return (
      <div className="app-loading-screen">
        <div className="app-loading-text">Loading…</div>
      </div>
    );
  }

  if (!currentUser) {
    if (loginPortal === "housekeeping") {
      return (
        <HskLoginForm
          onLogin={() => setLoginError("")}
          onBack={() => setLoginPortal("reception")}
          externalError={loginError || error}
        />
      );
    }
    return (
      <AuthLoginForm
        onLogin={() => setLoginError("")}
        onError={setLoginError}
        externalError={loginError || error}
        onShowHsk={() => setLoginPortal("housekeeping")}
      />
    );
  }

  if (!userProfile) {
    return (
      <ProfileMissingScreen
        currentUser={currentUser}
        loginPortal={loginPortal}
        onUseHskLogin={() => {
          handleLogout();
          setLoginPortal("housekeeping");
        }}
        onLogout={handleLogout}
      />
    );
  }

  if (useHskDashboard) {
    return (
      <HskDashboard
        currentUser={currentUser}
        userProfile={userProfile}
        isAdminView={role === "admin"}
        onSwitchToReception={() => setLoginPortal("reception")}
      />
    );
  }

  return <ChecklistApp userProfile={userProfile} currentUser={currentUser} />;
}

function ChecklistApp({ userProfile, currentUser }) {
  const profileInitials = userProfile?.initials?.trim().toUpperCase() || "";
  const displayName = userProfile?.displayName || currentUser?.displayName || currentUser?.email || "Authenticated user";
  // Admin requires BOTH the hardcoded admin email AND the Firestore role.
  const isAdmin = isAdminEmail(currentUser?.email) && userProfile?.role === "admin";
  const { isReceptionWidgetVisible, hotelInfo } = useDashboardConfig();
  const [showAdmin, setShowAdmin] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(
    () => typeof window !== 'undefined' && window.innerWidth > 1024
  );
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
  const [showHandoverFullscreen, setShowHandoverFullscreen] = useState(false);
  const [handoverDate, setHandoverDate] = useState(new Date().toISOString().split('T')[0]);
  const [handoverNotes, setHandoverNotes] = useState("");
  const [savedHandovers, setSavedHandovers] = useState({});
  const [wakeUpCalls, setWakeUpCalls] = useState([]);
  const [showWakeUpModal, setShowWakeUpModal] = useState(false);
  const [showWakeUpFullscreen, setShowWakeUpFullscreen] = useState(false);
  const [newWakeUpCall, setNewWakeUpCall] = useState({
    roomNumber: '',
    time: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [breakfastTimes, setBreakfastTimes] = useState({ start: '07:00', end: '11:00' });
  const [pricingInfo, setPricingInfo] = useState({ ...DEFAULT_PRICING });
  const [showBreakfastModal, setShowBreakfastModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [lastCompletedShift, setLastCompletedShift] = useState('');

  // Use the real-time checklist hook
  const {
    tasks,
    downtimeChecklist,
    instructions,
    loading,
    error,
    toggleTask,
    toggleTaskInProgress,
    updateTaskNote,
    toggleDowntimeTask,
    resetAll
  } = useRealtimeChecklist(shift, initials);

  // Subscribe to Firebase data
  useEffect(() => {
    const unsubscribeHandovers = subscribeToHandoverNotes(setSavedHandovers);
    const unsubscribeWakeUpCalls = subscribeToWakeUpCalls(setWakeUpCalls);
    const unsubscribeBreakfastTimes = subscribeToBreakfastTimes(setBreakfastTimes);
    const unsubscribePricingInfo = subscribeToPricingInfo(setPricingInfo);

    // Load handover notes for current date
    getHandoverNotes(handoverDate).then(setHandoverNotes);

    return () => {
      unsubscribeHandovers();
      unsubscribeWakeUpCalls();
      unsubscribeBreakfastTimes();
      unsubscribePricingInfo();
    };
  }, []);

  // Load handover notes when date changes
  useEffect(() => {
    getHandoverNotes(handoverDate).then(setHandoverNotes);
  }, [handoverDate]);

  // Check for shift completion and trigger celebration
  useEffect(() => {
    if (tasks.length > 0 && tasks.every(task => task.completed)) {
      const currentShiftKey = `${shift}-${new Date().toDateString()}`;
      if (lastCompletedShift !== currentShiftKey) {
        setShowCelebrationModal(true);
        setLastCompletedShift(currentShiftKey);
      }
    }
  }, [tasks, shift, lastCompletedShift]);

  // Enhanced scroll animations for left sidebar
  useEffect(() => {
    let scrollTimeout;
    let isScrolling = false;

    const handleScroll = () => {
      const sidebarCards = document.querySelectorAll('.left-sidebar .header-card');
      
      if (!isScrolling) {
        isScrolling = true;
        sidebarCards.forEach((card, index) => {
          setTimeout(() => {
            card.classList.add('floating');
          }, index * 50);
        });
      }

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
        sidebarCards.forEach(card => {
          card.classList.remove('floating');
        });
      }, 150);
    };

    // Add intersection observer for initial animation
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('scroll-visible');
        }
      });
    }, observerOptions);

    // Observe all header cards
    const sidebarCards = document.querySelectorAll('.left-sidebar .header-card');
    sidebarCards.forEach(card => {
      observer.observe(card);
    });

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
      clearTimeout(scrollTimeout);
    };
  }, []);

  // Prefer verified profile initials when they are available from Firebase.
  useEffect(() => {
    if (profileInitials) {
      setInitials(profileInitials);
      setInitialsSubmitted(true);
    }
  }, [profileInitials]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setMobileSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle initials submit
  const handleInitialsSubmit = (e) => {
    e.preventDefault();
    const validation = validateUserInput(initials, 'initials');
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    setInitials(validation.value);
    setInitialsSubmitted(true);
    setShowWelcomeModal(true);
  };

  // Progress calculation - memoized for performance
  const percent = useMemo(() => 
    tasks.length ? Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100) : 0,
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
      const validation = validateUserInput(noteText, 'notes');
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
      updateTaskNote(showNoteModal, validation.value);
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

  const handleLogout = async () => {
    await signOutUser();
    setInitials("");
    setInitialsSubmitted(false);
    setShowChangeInitials(false);
    setNewInitials("");
  };

  // Handover functions
  const loadHandoverNotes = useCallback(async (date) => {
    const notes = await getHandoverNotes(date);
    setHandoverNotes(notes);
  }, []);

  const saveHandoverNotes = useCallback(async () => {
    try {
      const validation = validateUserInput(handoverNotes, 'longText');
      const safeNotes = validation.valid ? validation.value : handoverNotes.substring(0, 10000);
      await saveHandoverNotesToDB(handoverDate, safeNotes);
      setShowHandoverModal(false);
    } catch (error) {
      console.error('Error saving handover notes:', error);
      alert('Failed to save handover notes. Please try again.');
    }
  }, [handoverDate, handoverNotes]);

  const openHandoverModal = useCallback(() => {
    setShowHandoverModal(true);
  }, []);

  const handleDateChange = useCallback((newDate) => {
    setHandoverDate(newDate);
    loadHandoverNotes(newDate);
  }, [loadHandoverNotes]);

  const deleteHandoverNotes = useCallback(async (dateToDelete) => {
    if (window.confirm(`Are you sure you want to delete handover notes for ${new Date(dateToDelete).toLocaleDateString('en-GB')}? This cannot be undone.`)) {
      try {
        await deleteHandoverNotesFromDB(dateToDelete);
        
        // If we're deleting the currently selected date, clear the notes
        if (dateToDelete === handoverDate) {
          setHandoverNotes("");
        }
        
        return true;
      } catch (error) {
        console.error('Error deleting handover notes:', error);
        alert('Failed to delete handover notes. Please try again.');
        return false;
      }
    }
    return false;
  }, [handoverDate]);

  // Bulk operations for handover notes
  const deleteAllHandoverNotes = useCallback(async () => {
    if (window.confirm(`Are you sure you want to delete ALL ${Object.keys(savedHandovers).length} handover notes? This cannot be undone.`)) {
      try {
        // Delete all handover notes by setting each one to empty
        const deletePromises = Object.keys(savedHandovers).map(date => 
          deleteHandoverNotesFromDB(date)
        );
        await Promise.all(deletePromises);
        setHandoverNotes("");
      } catch (error) {
        console.error('Error deleting all handover notes:', error);
        alert('Failed to delete all handover notes. Please try again.');
      }
    }
  }, [savedHandovers]);

  const deleteOldHandoverNotes = useCallback(async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];
    
    const oldDates = Object.keys(savedHandovers).filter(date => date < cutoffDate);
    
    if (oldDates.length === 0) {
      alert('No old handover notes to delete.');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${oldDates.length} handover notes older than 7 days? This cannot be undone.`)) {
      try {
        const deletePromises = oldDates.map(date => deleteHandoverNotesFromDB(date));
        await Promise.all(deletePromises);
      } catch (error) {
        console.error('Error deleting old handover notes:', error);
        alert('Failed to delete old handover notes. Please try again.');
      }
    }
  }, [savedHandovers]);

  // Bulk operations for wake-up calls
  const completeAllPendingWakeUpCalls = useCallback(async () => {
    const pendingCalls = wakeUpCalls.filter(call => !call.completed);
    
    if (pendingCalls.length === 0) {
      alert('No pending wake-up calls to complete.');
      return;
    }
    
    if (window.confirm(`Are you sure you want to mark all ${pendingCalls.length} pending wake-up calls as completed?`)) {
      try {
        const updatedCalls = wakeUpCalls.map(call => 
          !call.completed ? { ...call, completed: true, completedBy: initials } : call
        );
        await saveWakeUpCalls(updatedCalls);
      } catch (error) {
        console.error('Error completing all wake-up calls:', error);
        alert('Failed to complete all wake-up calls. Please try again.');
      }
    }
  }, [wakeUpCalls, initials]);

  // Breakfast time functions
  const saveBreakfastTimes = useCallback(async () => {
    try {
      await saveBreakfastTimesToDB(breakfastTimes);
      setShowBreakfastModal(false);
    } catch (error) {
      console.error('Error saving breakfast times:', error);
      alert('Failed to save breakfast times. Please try again.');
    }
  }, [breakfastTimes]);

  const cancelBreakfastEdit = useCallback(async () => {
    try {
      const savedTimes = await getBreakfastTimes();
      setBreakfastTimes(savedTimes);
      setShowBreakfastModal(false);
    } catch (error) {
      console.error('Error getting breakfast times:', error);
      setBreakfastTimes({ start: '07:00', end: '11:00' });
      setShowBreakfastModal(false);
    }
  }, []);

  // Wake-up call functions
  const addWakeUpCall = useCallback(async () => {
    if (!newWakeUpCall.roomNumber || !newWakeUpCall.time) {
      alert('Please enter both room number(s) and wake-up time.');
      return;
    }

    const timeValidation = validateUserInput(newWakeUpCall.time, 'time');
    if (!timeValidation.valid) {
      alert(timeValidation.error);
      return;
    }

    // Parse and validate each room number
    const rawRooms = newWakeUpCall.roomNumber
      .split(/[,;\s]+/)
      .map(room => room.trim())
      .filter(room => room.length > 0);

    const roomNumbers = [];
    for (const room of rawRooms) {
      const roomValidation = validateUserInput(room, 'roomNumber');
      if (!roomValidation.valid) {
        alert(`Invalid room number "${room}": ${roomValidation.error}`);
        return;
      }
      roomNumbers.push(roomValidation.value);
    }

    if (roomNumbers.length === 0) {
      alert('Please enter valid room number(s).');
      return;
    }

    const notesValidation = validateUserInput(newWakeUpCall.notes || '', 'notes');
    const safeNotes = notesValidation.valid ? notesValidation.value : '';

    // Create separate wake-up call for each room
    const newCalls = roomNumbers.map(roomNumber => ({
      ...newWakeUpCall,
      id: Date.now() + Math.random(),
      roomNumber,
      time: timeValidation.value,
      notes: safeNotes,
      createdBy: initials,
      completed: false
    }));

    const updatedCalls = [...wakeUpCalls, ...newCalls].sort((a, b) => {
      // Sort by date first, then by time
      if (a.date !== b.date) {
        return new Date(a.date) - new Date(b.date);
      }
      return a.time.localeCompare(b.time);
    });

    try {
      await saveWakeUpCalls(updatedCalls);
      
      setNewWakeUpCall({
        roomNumber: '',
        time: '',
        notes: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowWakeUpModal(false);
    } catch (error) {
      console.error('Error saving wake-up calls:', error);
      alert('Failed to save wake-up call. Please try again.');
    }
  }, [newWakeUpCall, wakeUpCalls, initials]);

  const deleteWakeUpCall = useCallback(async (id) => {
    if (window.confirm('Are you sure you want to delete this wake-up call?')) {
      try {
        const updatedCalls = wakeUpCalls.filter(call => call.id !== id);
        await saveWakeUpCalls(updatedCalls);
      } catch (error) {
        console.error('Error deleting wake-up call:', error);
        alert('Failed to delete wake-up call. Please try again.');
      }
    }
  }, [wakeUpCalls]);

  const toggleWakeUpCallComplete = useCallback(async (id) => {
    try {
      const updatedCalls = wakeUpCalls.map(call => 
        call.id === id 
          ? { ...call, completed: !call.completed, completedBy: call.completed ? null : initials }
          : call
      );
      await saveWakeUpCalls(updatedCalls);
    } catch (error) {
      console.error('Error updating wake-up call:', error);
      alert('Failed to update wake-up call. Please try again.');
    }
  }, [wakeUpCalls, initials]);

  const clearOldWakeUpCalls = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const activeCalls = wakeUpCalls.filter(call => call.date >= today);
    
    if (activeCalls.length === wakeUpCalls.length) {
      alert('No old wake-up calls to clear.');
      return;
    }

    if (window.confirm(`Clear ${wakeUpCalls.length - activeCalls.length} old wake-up calls?`)) {
      try {
        await saveWakeUpCalls(activeCalls);
      } catch (error) {
        console.error('Error clearing old wake-up calls:', error);
        alert('Failed to clear old wake-up calls. Please try again.');
      }
    }
  }, [wakeUpCalls]);

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
        <button
          type="button"
          className="mobile-sidebar-toggle"
          aria-expanded={mobileSidebarOpen}
          onClick={() => setMobileSidebarOpen((open) => !open)}
        >
          <span>Hotel info &amp; quick links</span>
          <span className="mobile-sidebar-toggle-icon" aria-hidden="true">▼</span>
        </button>

        <div className={`left-sidebar ${mobileSidebarOpen ? '' : 'is-collapsed'}`}>
          {isReceptionWidgetVisible('hotel-info') && (
          <div className="header-card">
            <strong>🏨 {hotelInfo.name || 'Scandic Falkoner'}</strong>
            
            <div className="hotel-info-section">
              <div className="info-item">
                <span className="info-icon">📍</span>
                <div className="info-content">
                  <span className="info-label">Address</span>
                  <span className="info-value">{hotelInfo.address}</span>
                </div>
              </div>
              
              <div className="info-item">
                <span className="info-icon">📞</span>
                <div className="info-content">
                  <span className="info-label">Phone</span>
                  <span className="info-value">{hotelInfo.phone}</span>
                </div>
              </div>
              
              <div className="info-item">
                <span className="info-icon">✉️</span>
                <div className="info-content">
                  <span className="info-label">Email</span>
                  <span className="info-value">
                    <a href={`mailto:${hotelInfo.email}`}>{hotelInfo.email}</a>
                  </span>
                </div>
              </div>
            </div>
          </div>
          )}
          
          {isReceptionWidgetVisible('hotel-times') && (
          <div className="header-card">
            <strong>⏰ Hotel Times</strong>
            
            <div className="hotel-times-section">
              <div className="time-item">
                <span className="time-icon">🍳</span>
                <div className="time-content">
                  <span className="time-label">Breakfast</span>
                  <div className="breakfast-display">
                    <span 
                      className="time-value time-value-clickable"
                      onClick={() => setShowBreakfastModal(true)}
                      title="Click to edit breakfast times"
                    >
                      {breakfastTimes.start} - {breakfastTimes.end}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="time-item">
                <span className="time-icon">🚪</span>
                <div className="time-content">
                  <span className="time-label">Check-Out</span>
                  <span className="time-value">{hotelInfo.checkOut}</span>
                </div>
              </div>
              
              <div className="time-item">
                <span className="time-icon">🔑</span>
                <div className="time-content">
                  <span className="time-label">Check-In</span>
                  <span className="time-value">{hotelInfo.checkIn}</span>
                </div>
              </div>
            </div>
          </div>
          )}
          
          {isReceptionWidgetVisible('pricing') && (
          <div className="header-card">
            <strong>Pricing Information</strong>
            
            <div className="pricing-section">
              <div className="pricing-category">
                <strong>🚴 Bike Rental</strong>
                <div className="price-list">
                  <div className="price-item">
                    <span className="price-label">Regular rate:</span>
                    <span className="price-value">{pricingInfo.bikeRegular} DKK per person</span>
                  </div>
                  <div className="price-item">
                    <span className="price-label">Lufthansa rate:</span>
                    <span className="price-value">{pricingInfo.bikeLufthansa} DKK per person</span>
                  </div>
                </div>
              </div>

              <div className="pricing-category">
                <strong>🍳 Breakfast Pricing</strong>
                <div className="price-list">
                  {getVisibleBreakfastItems(pricingInfo).map((item) => (
                    <div className="price-item" key={item.id}>
                      <span className="price-label">{item.label}:</span>
                      <span className="price-value">{formatBreakfastPrice(item)}</span>
                      {item.note && <span className="price-note">{item.note}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          )}
          
          {isReceptionWidgetVisible('handover-daily') && (
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
              
              <button
                className="handover-view-all-btn"
                onClick={() => setShowHandoverFullscreen(true)}
              >
                View All Handovers
              </button>
              
              <div className="handover-stats">
                <span className="handover-stat">
                  📅 {Object.keys(savedHandovers).length} days recorded
                </span>
              </div>
            </div>
          </div>
          )}

          {isReceptionWidgetVisible('team-handovers') && (
          <div className="header-card team-handover-sidebar-card">
            <TeamHandoverPanel
              user={currentUser}
              role="reception"
              isAdmin={isAdmin}
              compact
            />
          </div>
          )}
          
          {isReceptionWidgetVisible('wakeup') && (
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
                <button
                  className="wakeup-fullscreen-btn"
                  onClick={() => setShowWakeUpFullscreen(true)}
                  title="View all wake-up calls"
                >
                  📋 View All
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
          )}
        </div>

        {/* Right content area */}
        <div className="main-content">
          {/* Top right header with title and shift selector */}
          <div className="top-header">
            <h2 className="night-title">{shift} Checklist</h2>
          <div className={`shift-selector shift-selector-${shift.toLowerCase()}`}>
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
        <div className="meta-bar-info">
          <span className="meta-bar-user">
            Logged in as <strong>{displayName}</strong>
          </span>
          <span>
            <span role="img" aria-label="calendar">📅</span>
            &nbsp;{new Date().toLocaleString([], { dateStyle: "full", timeStyle: "short" })}
          </span>
        </div>
          <div className="meta-bar-actions">
            <ThemeToggle />
            <WeatherWidget />
            {isAdmin && (
              <button className="add-note-btn admin-panel-btn" onClick={() => setShowAdmin(true)}>
                🛠️ Admin Panel
              </button>
            )}
            <button className="reset-btn" onClick={handleResetAll}>Reset All</button>
            <span
              className={`initials-chip initials-chip-action ${showInitialsModal ? "active" : ""}`}
              title="Click to change initials"
              onClick={() => {
                setNewInitials(initials);
                setShowInitialsModal(true);
              }}
            >
              {initials}
            </span>
            <button className="add-note-btn logout-btn" onClick={handleLogout}>
              Log Out
            </button>
          </div>
          </div>

          {/* Progress bar */}
          <div className="progress-bar">
            <div className="progress-bar-inner" style={{ width: percent + "%" }}></div>
          </div>
          <div className="progress-summary">
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

          {/* Shift instructions (read-only, set by admin) */}
          {instructions && instructions.trim() && (
            <div className="shift-instructions-card">
              <div className="shift-instructions-title">
                <span role="img" aria-label="clipboard">📋</span> {shift} Shift Notes
              </div>
              <p className="shift-instructions-text">{instructions}</p>
            </div>
          )}

          {/* Checklist tasks */}
          <div className="checklist-section-label">Shift tasks</div>
          <div className="task-list" role="list" aria-label={`${shift} checklist tasks`}>
            {tasks.map((task) => {
              const isInProgress = Boolean(task.inProgressBy);
              const isMine = task.inProgressBy === initials;
              const isCritical = task.text.includes("Cash Count + Drop + Night Audit");

              return (
                <article
                  key={task.id}
                  className={`task-card ${task.completed ? "is-completed" : ""} ${isInProgress ? "is-in-progress" : ""} ${isCritical ? "task-critical" : ""}`}
                  role="listitem"
                >
                  <label className="task-checkbox-control">
                    <input
                      className="ios-checkbox-input"
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      aria-label={`Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`}
                    />
                    <span className="ios-checkbox" aria-hidden="true"></span>
                  </label>

                  <div className="task-card-body">
                    <div className="task-title-row">
                      <h3 className="task-title">{task.text}</h3>
                      {isInProgress && (
                        <span className="in-progress-indicator">
                          <span className="in-progress-dot" aria-hidden="true"></span>
                          {isMine ? "In progress" : `${task.inProgressBy} working`}
                        </span>
                      )}
                    </div>
                    {task.note && (
                      <p className="task-note-preview">{task.note}</p>
                    )}
                  </div>

                  <div className="task-card-actions">
                    {task.completed && <span className="initials-chip">{task.doneBy}</span>}
                    <button
                      className={`working-btn ${isMine ? "working-active" : (isInProgress ? "working-other" : "")}`}
                      onClick={() => toggleTaskInProgress(task.id)}
                      disabled={task.completed || (isInProgress && !isMine)}
                      title={isInProgress && !isMine ? `${task.inProgressBy} is working on this task` : isMine ? "Stop working on this task" : "Start working on this task"}
                    >
                      {isMine ? (
                        <>
                          <span>●</span>
                          <span>Stop</span>
                        </>
                      ) : isInProgress ? (
                        <>
                          <span>●</span>
                          <span>{task.inProgressBy}</span>
                        </>
                      ) : (
                        <>
                          <span>○</span>
                          <span>Work</span>
                        </>
                      )}
                    </button>
                    <button
                      className="info-btn"
                      onClick={() => setShowInfo(showInfo === task.id ? null : task.id)}
                      aria-label={`${showInfo === task.id ? 'Hide' : 'Show'} information for ${task.text}`}
                    >
                      i
                    </button>
                    <button
                      className={task.note ? "edit-note-btn" : "add-note-btn"}
                      onClick={() => handleNote(task.id)}
                      title={task.note ? "View/Edit Note" : "Add Note"}
                    >
                      {task.note ? "Edit note" : "Add note"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Downtime Reports Mini-Checklist */}
          <div className="checklist-section-label downtime-section-label">Downtime checklist</div>
          <div className="downtime-checklist">
            <div className="downtime-header">
              <div className="downtime-header-top">
                <h3 className="downtime-title">
                  Print Downtime Every 3 Hours
                </h3>
                <button
                  className="downtime-info-icon-btn"
                  onClick={() => setShowDowntimeInfo(!showDowntimeInfo)}
                  aria-label="Show downtime report instructions"
                  data-tooltip="Downtime Instructions"
                >
                  i
                </button>
              </div>
              <p className="downtime-callout">
                Important: Print and file the new downtime report every 3 hours during your shift.
              </p>
            </div>
            <div className="downtime-items">
              {downtimeChecklist.map((item) => (
                <div key={item.id} className={`downtime-item ${item.completed ? "is-completed" : ""}`}>
                  <label className="task-checkbox-control downtime-checkbox-control">
                    <input
                      className="ios-checkbox-input"
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleDowntimeTask(item.id)}
                      aria-label={`Mark ${item.text} as ${item.completed ? 'incomplete' : 'complete'}`}
                    />
                    <span className="ios-checkbox" aria-hidden="true"></span>
                  </label>
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
                updateSessionInitials(trimmedInitials, true); // Update session with new initials
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
            <h3>📊 Downtime Reports Instructions</h3>
            <div className="downtime-info-content">
              <div className="downtime-info-section">
                <div className="downtime-info-header">
                  <span className="downtime-info-icon">🖨️</span>
                  <h4>Print New Report</h4>
                </div>
                <ol className="downtime-info-steps">
                  <li>Open <strong>Cloud Opera</strong> system</li>
                  <li>Navigate to <strong>Reports</strong> → <strong>Shift reports</strong></li>
                  <li>Print the <strong>downtime</strong> from there</li>
                </ol>
              </div>

              <div className="downtime-info-section">
                <div className="downtime-info-header">
                  <span className="downtime-info-icon">📁</span>
                  <h4>File the Report</h4>
                </div>
                <ol className="downtime-info-steps">
                  <li>Locate the <strong>downtime report cabinet</strong></li>
                  <li>Remove the <strong>old downtime report</strong></li>
                  <li>Replace with the <strong>newly printed report</strong></li>
                  <li>Ensure proper chronological filing</li>
                </ol>
              </div>

              <div className="downtime-info-section downtime-info-important">
                <div className="downtime-info-header">
                  <span className="downtime-info-icon">⚠️</span>
                  <h4>Important Notes</h4>
                </div>
                <ul className="downtime-info-points">
                  <li><strong>Critical for emergencies:</strong> These reports provide essential system status information</li>
                  <li><strong>Required frequency:</strong> Must be printed every 3 hours during shift</li>
                  <li><strong>Tracking:</strong> Use the checkboxes above to track each 3-hour period</li>
                  <li><strong>Compliance:</strong> Essential for audit and regulatory requirements</li>
                </ul>
              </div>
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
                        onClick={deleteAllHandoverNotes}
                      >
                        🗑️ Delete All Notes
                      </button>
                      <button
                        className="handover-bulk-delete-old-btn"
                        onClick={deleteOldHandoverNotes}
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
                <label htmlFor="roomNumber">Room Number(s)</label>
                <input
                  id="roomNumber"
                  type="text"
                  className="wakeup-input"
                  value={newWakeUpCall.roomNumber}
                  onChange={e => setNewWakeUpCall(prev => ({ ...prev, roomNumber: e.target.value }))}
                  placeholder="e.g. 102 or 102, 103, 205"
                  autoFocus
                  required
                />
                <div className="wakeup-input-help">
                  Separate multiple rooms with commas (e.g., 102, 103, 205)
                </div>
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

      {/* Wake-Up Calls Fullscreen Modal */}
      {showWakeUpFullscreen && (
        <div
          className="wakeup-fullscreen-overlay"
          onClick={() => setShowWakeUpFullscreen(false)}
        >
          <div
            className="wakeup-fullscreen-container"
            onClick={e => e.stopPropagation()}
          >
            <div className="wakeup-fullscreen-header">
              <h2>☎️ All Wake-Up Calls</h2>
              <div className="wakeup-fullscreen-actions">
                <button
                  className="wakeup-add-btn"
                  onClick={() => {
                    setShowWakeUpFullscreen(false);
                    setShowWakeUpModal(true);
                  }}
                >
                  + Add New
                </button>
                <button className="wakeup-fullscreen-close" onClick={() => setShowWakeUpFullscreen(false)} title="Close">
                  &times;
                </button>
              </div>
            </div>

            <div className="wakeup-fullscreen-content">
              <div className="wakeup-fullscreen-stats">
                <div className="wakeup-fullscreen-stat">
                  <span className="stat-number">{wakeUpCalls.filter(call => !call.completed && call.date >= new Date().toISOString().split('T')[0]).length}</span>
                  <span className="stat-label">Pending Calls</span>
                </div>
                <div className="wakeup-fullscreen-stat">
                  <span className="stat-number">{wakeUpCalls.filter(call => call.completed).length}</span>
                  <span className="stat-label">Completed</span>
                </div>
                <div className="wakeup-fullscreen-stat">
                  <span className="stat-number">{wakeUpCalls.length}</span>
                  <span className="stat-label">Total Calls</span>
                </div>
              </div>

              <div className="wakeup-fullscreen-filters">
                <div className="wakeup-filter-tabs">
                  <button className="wakeup-filter-tab active">All Calls</button>
                  <button className="wakeup-filter-tab">Today</button>
                  <button className="wakeup-filter-tab">Pending</button>
                  <button className="wakeup-filter-tab">Completed</button>
                </div>
              </div>

              <div className="wakeup-fullscreen-table-container is-mobile-cards">
                <table className="wakeup-fullscreen-table">
                  <thead>
                    <tr>
                      <th>Room</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Notes</th>
                      <th>Created By</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wakeUpCalls
                      .sort((a, b) => {
                        // Sort by date first, then by time
                        if (a.date !== b.date) {
                          return new Date(a.date) - new Date(b.date);
                        }
                        return a.time.localeCompare(b.time);
                      })
                      .map(call => (
                        <tr key={call.id} className={call.completed ? 'wakeup-row-completed' : ''}>
                          <td className="wakeup-room-cell" data-label="Room">
                            <span className="wakeup-room-number">Room {call.roomNumber}</span>
                          </td>
                          <td className="wakeup-date-cell" data-label="Date">
                            {new Date(call.date).toLocaleDateString('en-GB', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                            {call.date === new Date().toISOString().split('T')[0] && (
                              <span className="wakeup-today-badge">Today</span>
                            )}
                          </td>
                          <td className="wakeup-time-cell" data-label="Time">
                            <span className="wakeup-time-display">{call.time}</span>
                          </td>
                          <td className="wakeup-notes-cell" data-label="Notes">
                            {call.notes ? (
                              <span className="wakeup-notes-preview" title={call.notes}>
                                {call.notes.length > 30 ? call.notes.substring(0, 30) + '...' : call.notes}
                              </span>
                            ) : (
                              <span className="wakeup-no-notes">No notes</span>
                            )}
                          </td>
                          <td className="wakeup-created-cell" data-label="Created by">
                            <span className="wakeup-initials-small">{call.createdBy}</span>
                          </td>
                          <td className="wakeup-status-cell" data-label="Status">
                            {call.completed ? (
                              <span className="wakeup-status-completed">
                                ✅ Completed by {call.completedBy}
                              </span>
                            ) : (
                              <span className="wakeup-status-pending">
                                ⏰ Pending
                              </span>
                            )}
                          </td>
                          <td className="wakeup-actions-cell" data-label="Actions">
                            <div className="wakeup-action-buttons">
                              <button
                                className={`wakeup-toggle-btn ${call.completed ? 'completed' : 'pending'}`}
                                onClick={() => toggleWakeUpCallComplete(call.id)}
                                title={call.completed ? 'Mark as pending' : 'Mark as completed'}
                              >
                                {call.completed ? '↩️' : '✅'}
                              </button>
                              <button
                                className="wakeup-delete-btn"
                                onClick={() => deleteWakeUpCall(call.id)}
                                title="Delete wake-up call"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                {wakeUpCalls.length === 0 && (
                  <div className="wakeup-fullscreen-empty">
                    <div className="wakeup-empty-icon">☎️</div>
                    <h3>No Wake-Up Calls</h3>
                    <p>Create your first wake-up call to get started.</p>
                    <button
                      className="wakeup-add-btn"
                      onClick={() => {
                        setShowWakeUpFullscreen(false);
                        setShowWakeUpModal(true);
                      }}
                    >
                      + Add Wake-Up Call
                    </button>
                  </div>
                )}
              </div>

              <div className="wakeup-fullscreen-footer">
                <div className="wakeup-bulk-actions">
                  {wakeUpCalls.length > 0 && (
                    <>
                      <button
                        className="wakeup-bulk-btn"
                        onClick={completeAllPendingWakeUpCalls}
                      >
                        ✅ Complete All Pending
                      </button>
                      <button
                        className="wakeup-bulk-btn wakeup-bulk-clear"
                        onClick={clearOldWakeUpCalls}
                      >
                        🧹 Clear Old Calls
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Handover Fullscreen Modal */}
      {showHandoverFullscreen && (
        <div className="handover-fullscreen-overlay">
          <div className="handover-fullscreen-container">
            <div className="handover-fullscreen-header">
              <h2>📝 All Handover Notes</h2>
              <div className="handover-fullscreen-actions">
                <button
                  className="handover-add-btn"
                  onClick={() => {
                    setShowHandoverFullscreen(false);
                    setShowHandoverModal(true);
                  }}
                >
                  + Add New
                </button>
                <button
                  className="handover-fullscreen-close"
                  onClick={() => setShowHandoverFullscreen(false)}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="handover-fullscreen-content">
              <div className="handover-fullscreen-stats">
                <div className="handover-fullscreen-stat">
                  <span className="stat-number">{Object.keys(savedHandovers).length}</span>
                  <span className="stat-label">Total Days</span>
                </div>
                <div className="handover-fullscreen-stat">
                  <span className="stat-number">
                    {Object.values(savedHandovers).reduce((total, notes) => total + notes.split(' ').length, 0)}
                  </span>
                  <span className="stat-label">Total Words</span>
                </div>
                <div className="handover-fullscreen-stat">
                  <span className="stat-number">
                    {Object.keys(savedHandovers).filter(date => 
                      new Date(date).toDateString() === new Date().toDateString()
                    ).length > 0 ? '✅' : '❌'}
                  </span>
                  <span className="stat-label">Today's Notes</span>
                </div>
              </div>

              <div className="handover-fullscreen-table-container is-mobile-cards">
                {Object.keys(savedHandovers).length === 0 ? (
                  <div className="handover-fullscreen-empty">
                    <div className="handover-empty-icon">📝</div>
                    <h3>No Handover Notes Yet</h3>
                    <p>Click "Add New" to create your first handover note.</p>
                    <button
                      className="handover-add-btn"
                      onClick={() => {
                        setShowHandoverFullscreen(false);
                        setShowHandoverModal(true);
                      }}
                    >
                      + Add First Note
                    </button>
                  </div>
                ) : (
                  <table className="handover-fullscreen-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Day</th>
                        <th>Preview</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(savedHandovers)
                        .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
                        .map(([date, notes]) => {
                          const dateObj = new Date(date);
                          const isToday = dateObj.toDateString() === new Date().toDateString();
                          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                          
                          return (
                            <tr key={date} className={isToday ? 'handover-row-today' : ''}>
                              <td className="handover-date-cell">
                                <span className="handover-date-display">
                                  {dateObj.toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                                {isToday && <span className="handover-today-badge">Today</span>}
                              </td>
                              <td className="handover-day-cell">
                                <span className="handover-day-name">{dayName}</span>
                              </td>
                              <td className="handover-notes-cell">
                                <div className="handover-notes-preview">
                                  {notes.length > 100 ? `${notes.substring(0, 100)}...` : notes}
                                </div>
                              </td>
                              <td className="handover-actions-cell">
                                <div className="handover-action-buttons">
                                  <button
                                    className="handover-edit-btn"
                                    onClick={() => {
                                      setHandoverDate(date);
                                      setShowHandoverFullscreen(false);
                                      setShowHandoverModal(true);
                                    }}
                                    title="Edit"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    className="handover-delete-small-btn"
                                    onClick={() => deleteHandoverNotes(date)}
                                    title="Delete"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="handover-fullscreen-footer">
              <div className="handover-bulk-actions">
                {Object.keys(savedHandovers).length > 0 && (
                  <>
                    <button
                      className="handover-export-btn"
                      onClick={() => {
                        const handoverText = Object.entries(savedHandovers)
                          .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
                          .map(([date, notes]) => {
                            const dateObj = new Date(date);
                            const formattedDate = dateObj.toLocaleDateString('en-US', { 
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            });
                            return `${formattedDate}\n${'='.repeat(formattedDate.length)}\n${notes}\n\n`;
                          }).join('');
                        
                        const blob = new Blob([handoverText], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `handover-notes-${new Date().toISOString().split('T')[0]}.txt`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                    >
                      📄 Export All
                    </button>
                    <button
                      className="handover-bulk-delete-btn"
                      onClick={deleteAllHandoverNotes}
                    >
                      🗑️ Clear All
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Breakfast Time Modal */}
      {showBreakfastModal && (
        <div className="info-modal-overlay" onClick={() => setShowBreakfastModal(false)}>
          <div className="breakfast-modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Breakfast Times</h3>
            <div className="breakfast-modal-content">
              <div className="breakfast-modal-inputs">
                <div className="breakfast-input-group">
                  <label>Start Time:</label>
                  <input
                    type="time"
                    value={breakfastTimes.start}
                    onChange={(e) => setBreakfastTimes({...breakfastTimes, start: e.target.value})}
                    className="breakfast-modal-input"
                  />
                </div>
                <div className="breakfast-input-group">
                  <label>End Time:</label>
                  <input
                    type="time"
                    value={breakfastTimes.end}
                    onChange={(e) => setBreakfastTimes({...breakfastTimes, end: e.target.value})}
                    className="breakfast-modal-input"
                  />
                </div>
              </div>
              <div className="breakfast-modal-buttons">
                <button 
                  className="breakfast-modal-save-btn"
                  onClick={saveBreakfastTimes}
                >
                  Save Times
                </button>
                <button 
                  className="breakfast-modal-cancel-btn"
                  onClick={cancelBreakfastEdit}
                >
                  Cancel
                </button>
              </div>
            </div>
            <button 
              className="info-modal-close"
              onClick={() => setShowBreakfastModal(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Celebration Modal for Completed Shift */}
      {showCelebrationModal && (
        <div className="celebration-modal-overlay" onClick={() => setShowCelebrationModal(false)}>
          <div className="celebration-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="celebration-content">
              <div className="celebration-emoji-burst">
                🎉 🎊 ✨ 🌟 🎉 🎊 ✨ 🌟
              </div>
              <h2 className="celebration-title">
                🎉 SHIFT COMPLETED! 🎉
              </h2>
              <div className="celebration-message">
                <p className="celebration-main-text">
                  Fantastic work, <strong>{initials}</strong>! 
                </p>
                <p className="celebration-sub-text">
                  You've successfully completed all <strong>{tasks.length}</strong> tasks for the <strong>{shift}</strong> shift!
                </p>
              </div>
              
              <div className="celebration-stats">
                <div className="celebration-stat-item">
                  <span className="celebration-stat-number">{tasks.length}</span>
                  <span className="celebration-stat-label">Tasks Completed</span>
                </div>
                <div className="celebration-stat-item">
                  <span className="celebration-stat-number">100%</span>
                  <span className="celebration-stat-label">Success Rate</span>
                </div>
                <div className="celebration-stat-item">
                  <span className="celebration-stat-number">⭐</span>
                  <span className="celebration-stat-label">Excellence</span>
                </div>
              </div>

              <div className="celebration-achievement">
                <div className="celebration-badge">
                  <div className="celebration-badge-icon">🏆</div>
                  <div className="celebration-badge-text">
                    <span className="celebration-badge-title">{shift} Shift Champion</span>
                    <span className="celebration-badge-subtitle">All tasks completed flawlessly</span>
                  </div>
                </div>
              </div>

              <div className="celebration-quotes">
                <p className="celebration-quote">
                  {shift === 'Night' && '"The night team keeps the hotel running smoothly while the world sleeps."'}
                  {shift === 'Morning' && '"Every great day starts with a dedicated morning team."'}
                  {shift === 'Evening' && '"The evening team ensures every guest feels welcomed and cared for."'}
                </p>
              </div>

              <div className="celebration-actions">
                <button 
                  className="celebration-continue-btn"
                  onClick={() => setShowCelebrationModal(false)}
                >
                  🌟 Keep Up The Great Work! 🌟
                </button>
              </div>

              <div className="celebration-footer">
                <p>Thanks for your dedication to excellent guest service! 🏨</p>
              </div>
            </div>
            
            <button 
              className="celebration-modal-close"
              onClick={() => setShowCelebrationModal(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Welcome Modal for Test Week */}
      {showWelcomeModal && (
        <div className="info-modal-overlay" onClick={() => setShowWelcomeModal(false)}>
          <div className="welcome-modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#2c3e50' }}>
              🎉 Welcome to the Digital Checklist System!
            </h3>
            <div className="welcome-modal-content">
              <p style={{ textAlign: 'center', lineHeight: '1.6', marginBottom: '20px' }}>
                Welcome to the new digital way of doing checklists. 
              </p>
              <p style={{ textAlign: 'center', lineHeight: '1.6', marginBottom: '20px' }}>
                This is the <strong>test week</strong> - I am evaluating how well this system works for our daily operations.
              </p>
              <p style={{ textAlign: 'center', lineHeight: '1.6', marginBottom: '20px' }}>
                If you find any bugs, errors, or have suggestions for improvement, please contact <strong>Ayush</strong>.
              </p>
              <p style={{ textAlign: 'center', lineHeight: '1.6', fontSize: '0.9rem', color: '#7f8c8d' }}>
                Your feedback will help make this system even better! 🚀
              </p>
            </div>
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button 
                className="add-note-btn"
                onClick={() => setShowWelcomeModal(false)}
                style={{ padding: '12px 24px', fontSize: '1rem' }}
              >
                Let's Get Started!
              </button>
            </div>
            <button 
              className="info-modal-close"
              onClick={() => setShowWelcomeModal(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}
        </div>
      </div>

      <FloatingHskWidget currentUser={currentUser} userProfile={userProfile} />
      <FloatingMapButton />

      {/* Admin Panel (admin only) */}
      {showAdmin && isAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
}

export default App;