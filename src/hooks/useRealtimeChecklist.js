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
import { auditTaskChange } from '../firebase/audit';
import { useAuth } from './useAuth';
import { generateShiftSessionId } from '../utils/shiftTiming';

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
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [downtimeChecklist, setDowntimeChecklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  // Generate session ID using proper shift timing logic
  const generateSessionId = useCallback((currentShift) => {
    return generateShiftSessionId(currentShift);
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
          doneBy: "",
          inProgressBy: ""
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
        doneBy: "",
        inProgressBy: ""
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
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      const beforeState = {
        completed: task.completed,
        doneBy: task.doneBy,
        note: task.note,
        inProgressBy: task.inProgressBy
      };

      const updatedTasks = tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
              doneBy: !task.completed ? initials : "",
              inProgressBy: !task.completed ? "" : task.inProgressBy, // Clear in progress when completing
            }
          : task
      );
      
      setTasks(updatedTasks);
      
      if (sessionId) {
        await updateTasks(sessionId, updatedTasks);
      }

      // Audit log the change
      if (user) {
        const updatedTask = updatedTasks.find(t => t.id === id);
        const afterState = {
          completed: updatedTask.completed,
          doneBy: updatedTask.doneBy,
          note: updatedTask.note,
          inProgressBy: updatedTask.inProgressBy
        };

        await auditTaskChange(
          user,
          { id, text: task.text, shift },
          updatedTask.completed ? 'completed' : 'uncompleted',
          beforeState,
          afterState
        );
      }
    } catch (err) {
      console.error('Error toggling task:', err);
      setError(err.message);
    }
  }, [tasks, initials, sessionId, user, shift]);

  // Update task note
  const updateTaskNote = useCallback(async (id, note) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      const beforeState = {
        completed: task.completed,
        doneBy: task.doneBy,
        note: task.note,
        inProgressBy: task.inProgressBy
      };

      const updatedTasks = tasks.map(t => 
        t.id === id ? { ...t, note } : t
      );
      
      setTasks(updatedTasks);
      
      if (sessionId) {
        await updateTasks(sessionId, updatedTasks);
      }

      // Audit log the note change
      if (user && beforeState.note !== note) {
        const afterState = {
          completed: task.completed,
          doneBy: task.doneBy,
          note: note,
          inProgressBy: task.inProgressBy
        };

        await auditTaskChange(
          user,
          { id, text: task.text, shift },
          'note_updated',
          beforeState,
          afterState
        );
      }
    } catch (err) {
      console.error('Error updating task note:', err);
      setError(err.message);
    }
  }, [tasks, sessionId, user, shift]);

  // Toggle task in progress status
  const toggleTaskInProgress = useCallback(async (id) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      const beforeState = {
        completed: task.completed,
        doneBy: task.doneBy,
        note: task.note,
        inProgressBy: task.inProgressBy
      };

      const updatedTasks = tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              inProgressBy: task.inProgressBy === initials ? "" : initials,
            }
          : task
      );
      
      setTasks(updatedTasks);
      
      if (sessionId) {
        await updateTasks(sessionId, updatedTasks);
      }

      // Audit log the change
      if (user) {
        const updatedTask = updatedTasks.find(t => t.id === id);
        const afterState = {
          completed: updatedTask.completed,
          doneBy: updatedTask.doneBy,
          note: updatedTask.note,
          inProgressBy: updatedTask.inProgressBy
        };

        await auditTaskChange(
          user,
          { id, text: task.text, shift },
          updatedTask.inProgressBy ? 'started_working' : 'stopped_working',
          beforeState,
          afterState
        );
      }
    } catch (err) {
      console.error('Error toggling task in progress:', err);
      setError(err.message);
    }
  }, [tasks, initials, sessionId, user, shift]);

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
        doneBy: "",
        inProgressBy: ""
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
    toggleTaskInProgress,
    updateTaskNote,
    toggleDowntimeTask,
    resetAll
  };
};
