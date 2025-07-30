import { useState, useEffect, useCallback } from 'react';
import { checklists } from '../Checklists';
import {
  getOrCreateChecklistSession,
  updateTasks,
  updateDowntimeChecklist,
  subscribeToChecklistSession,
  initializeSession,
  resetSession
} from '../firebase/database';

// Generate downtime checklist based on shift
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

export const useRealtimeChecklist = (shift, initials) => {
  const [tasks, setTasks] = useState([]);
  const [downtimeChecklist, setDowntimeChecklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  // Generate session ID (persistent across dates)
  const generateSessionId = useCallback((currentShift) => {
    return `${currentShift.toLowerCase()}_current`;
  }, []);

  // Initialize session
  const initSession = useCallback(async (currentShift) => {
    try {
      setLoading(true);
      setError(null);
      
      const newSessionId = generateSessionId(currentShift);
      setSessionId(newSessionId);

      // Get existing session or create new one
      const session = await getOrCreateChecklistSession(currentShift);
      
      if (session.tasks && session.tasks.length > 0) {
        // Session exists with data
        setTasks(session.tasks);
        setDowntimeChecklist(session.downtimeChecklist || getDowntimeChecklist(currentShift));
      } else {
        // New session or empty session - initialize with default data
        const initialTasks = checklists[currentShift].map((task) => ({ 
          ...task, 
          completed: false, 
          note: "", 
          doneBy: "" 
        }));
        const initialDowntime = getDowntimeChecklist(currentShift);
        
        await initializeSession(newSessionId, currentShift, initialTasks, initialDowntime);
        setTasks(initialTasks);
        setDowntimeChecklist(initialDowntime);
      }
    } catch (err) {
      console.error('Error initializing session:', err);
      setError(err.message);
      // Fallback to local state
      const fallbackTasks = checklists[currentShift].map((task) => ({ 
        ...task, 
        completed: false, 
        note: "", 
        doneBy: "" 
      }));
      setTasks(fallbackTasks);
      setDowntimeChecklist(getDowntimeChecklist(currentShift));
    } finally {
      setLoading(false);
    }
  }, [generateSessionId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = subscribeToChecklistSession(sessionId, (data) => {
      if (data) {
        if (data.tasks) setTasks(data.tasks);
        if (data.downtimeChecklist) setDowntimeChecklist(data.downtimeChecklist);
      }
    });

    return () => unsubscribe();
  }, [sessionId]);

  // Initialize when shift changes
  useEffect(() => {
    initSession(shift);
  }, [shift, initSession]);

  // Toggle task completion
  const toggleTask = useCallback(async (id) => {
    try {
      const updatedTasks = tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
              doneBy: !task.completed ? initials : "",
            }
          : task
      );
      
      setTasks(updatedTasks);
      
      if (sessionId) {
        await updateTasks(sessionId, updatedTasks);
      }
    } catch (err) {
      console.error('Error toggling task:', err);
      setError(err.message);
    }
  }, [tasks, initials, sessionId]);

  // Update task note
  const updateTaskNote = useCallback(async (id, note) => {
    try {
      const updatedTasks = tasks.map(t => 
        t.id === id ? { ...t, note } : t
      );
      
      setTasks(updatedTasks);
      
      if (sessionId) {
        await updateTasks(sessionId, updatedTasks);
      }
    } catch (err) {
      console.error('Error updating task note:', err);
      setError(err.message);
    }
  }, [tasks, sessionId]);

  // Toggle downtime task
  const toggleDowntimeTask = useCallback(async (id) => {
    try {
      const updatedDowntime = downtimeChecklist.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
              doneBy: !task.completed ? initials : "",
            }
          : task
      );
      
      setDowntimeChecklist(updatedDowntime);
      
      if (sessionId) {
        await updateDowntimeChecklist(sessionId, updatedDowntime);
      }
    } catch (err) {
      console.error('Error toggling downtime task:', err);
      setError(err.message);
    }
  }, [downtimeChecklist, initials, sessionId]);

  // Reset all tasks
  const resetAll = useCallback(async () => {
    try {
      const initialTasks = checklists[shift].map(task => ({ 
        ...task, 
        completed: false, 
        note: "", 
        doneBy: "" 
      }));
      const initialDowntime = getDowntimeChecklist(shift);
      
      setTasks(initialTasks);
      setDowntimeChecklist(initialDowntime);
      
      if (sessionId) {
        await resetSession(sessionId, shift, initialTasks, initialDowntime);
      }
    } catch (err) {
      console.error('Error resetting tasks:', err);
      setError(err.message);
    }
  }, [shift, sessionId]);

  return {
    tasks,
    downtimeChecklist,
    loading,
    error,
    toggleTask,
    updateTaskNote,
    toggleDowntimeTask,
    resetAll
  };
};
