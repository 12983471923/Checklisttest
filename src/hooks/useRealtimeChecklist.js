import { useState, useEffect, useCallback, useRef } from 'react';
import { checklists } from '../Checklists';
import {
  getOrCreateChecklistSession,
  updateTasks,
  updateDowntimeChecklist,
  subscribeToChecklistSession,
  initializeSession,
  resetSession
} from '../firebase/database';
import {
  subscribeToShiftConfig,
  DEFAULT_DOWNTIME_TIMES,
  isTaskHighlighted
} from '../firebase/shiftConfig';

const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
const ordinal = (n) => ORDINALS[n - 1] || `${n}th`;

// Fallback downtime times used only when no admin config exists yet.
const getDefaultDowntimeTimes = (currentShift) =>
  DEFAULT_DOWNTIME_TIMES[currentShift] || DEFAULT_DOWNTIME_TIMES.Night;

export const useRealtimeChecklist = (shift, initials) => {
  const [tasks, setTasks] = useState([]);
  const [downtimeChecklist, setDowntimeChecklist] = useState([]);
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  // Latest admin-managed config (definitions) and the latest completion state
  // straight from Firestore. We merge these two to produce what staff see.
  const configRef = useRef(null);
  const stateTasksRef = useRef([]);
  const stateDowntimeRef = useRef([]);

  // Generate session ID (persistent across dates)
  const generateSessionId = useCallback((currentShift) => {
    return `${currentShift.toLowerCase()}_current`;
  }, []);

  // Merge admin task definitions (config) with completion state, keyed by id.
  // Falls back to the raw state tasks when no config exists yet (legacy data).
  const buildDisplayTasks = useCallback(() => {
    const config = configRef.current;
    const stateTasks = stateTasksRef.current || [];
    const stateById = new Map(stateTasks.map((task) => [task.id, task]));

    if (config && Array.isArray(config.tasks) && config.tasks.length) {
      return config.tasks.map((cfg) => {
        const state = stateById.get(cfg.id) || {};
        return {
          id: cfg.id,
          text: cfg.text,
          info: cfg.info || '',
          highlighted: isTaskHighlighted(cfg),
          completed: !!state.completed,
          doneBy: state.doneBy || '',
          note: state.note || '',
          inProgressBy: state.inProgressBy || ''
        };
      });
    }

    return stateTasks.map((task) => ({
      ...task,
      inProgressBy: task.inProgressBy || ''
    }));
  }, []);

  // Build downtime items from the admin-configured times, merged with the
  // completion state (matched by position/id).
  const buildDowntime = useCallback(
    (currentShift) => {
      const config = configRef.current;
      const stateDowntime = stateDowntimeRef.current || [];
      const stateById = new Map(stateDowntime.map((item) => [item.id, item]));

      const times =
        config && Array.isArray(config.downtimeTimes) && config.downtimeTimes.length
          ? config.downtimeTimes
          : getDefaultDowntimeTimes(currentShift);

      return times.map((time, index) => {
        const id = index + 1;
        const state = stateById.get(id) || {};
        return {
          id,
          text: `${ordinal(id)} ${time}`,
          completed: !!state.completed,
          doneBy: state.doneBy || ''
        };
      });
    },
    []
  );

  const recompute = useCallback(() => {
    setTasks(buildDisplayTasks());
    setDowntimeChecklist(buildDowntime(shift));
    setInstructions(configRef.current?.instructions || '');
  }, [buildDisplayTasks, buildDowntime, shift]);

  // Initialize session (seeds the completion-state document if it is empty)
  const initSession = useCallback(
    async (currentShift) => {
      try {
        setLoading(true);
        setError(null);

        const newSessionId = generateSessionId(currentShift);
        setSessionId(newSessionId);

        const initialTasks = (checklists[currentShift] || []).map((task) => ({
          ...task,
          completed: false,
          note: '',
          doneBy: '',
          inProgressBy: ''
        }));
        const initialDowntime = getDefaultDowntimeTimes(currentShift).map((time, index) => ({
          id: index + 1,
          text: `${ordinal(index + 1)} ${time}`,
          completed: false,
          doneBy: ''
        }));

        const session = await getOrCreateChecklistSession(currentShift);
        const sessionTasks =
          Array.isArray(session.tasks) && session.tasks.length
            ? session.tasks.map((task) => ({ ...task, inProgressBy: task.inProgressBy || '' }))
            : initialTasks;
        const sessionDowntime =
          Array.isArray(session.downtimeChecklist) && session.downtimeChecklist.length
            ? session.downtimeChecklist
            : initialDowntime;

        if (
          !session.tasks ||
          !session.tasks.length ||
          !session.downtimeChecklist ||
          !session.downtimeChecklist.length
        ) {
          await initializeSession(newSessionId, currentShift, initialTasks, initialDowntime);
        }

        stateTasksRef.current = sessionTasks;
        stateDowntimeRef.current = sessionDowntime;
        recompute();
      } catch (err) {
        console.error('Error initializing session:', err);
        setError(err.message);
        stateTasksRef.current = (checklists[currentShift] || []).map((task) => ({
          ...task,
          completed: false,
          note: '',
          doneBy: '',
          inProgressBy: ''
        }));
        stateDowntimeRef.current = getDefaultDowntimeTimes(currentShift).map((time, index) => ({
          id: index + 1,
          text: `${ordinal(index + 1)} ${time}`,
          completed: false,
          doneBy: ''
        }));
        recompute();
      } finally {
        setLoading(false);
      }
    },
    [generateSessionId, recompute]
  );

  // Subscribe to the admin-managed shift config (definitions / instructions).
  useEffect(() => {
    const unsubscribe = subscribeToShiftConfig(shift, (config) => {
      configRef.current = config;
      recompute();
    });

    return () => unsubscribe();
  }, [shift, recompute]);

  // Subscribe to real-time completion-state updates.
  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = subscribeToChecklistSession(sessionId, (data) => {
      if (data) {
        if (data.tasks) {
          stateTasksRef.current = data.tasks.map((task) => ({
            ...task,
            inProgressBy: task.inProgressBy || ''
          }));
        }
        if (data.downtimeChecklist) {
          stateDowntimeRef.current = data.downtimeChecklist;
        }
        recompute();
      }
    });

    return () => unsubscribe();
  }, [sessionId, recompute]);

  // Initialize when shift changes
  useEffect(() => {
    initSession(shift);
  }, [shift, initSession]);

  // Toggle task completion
  const toggleTask = useCallback(
    async (id) => {
      try {
        const updatedTasks = tasks.map((task) =>
          task.id === id
            ? {
                ...task,
                completed: !task.completed,
                doneBy: !task.completed ? initials : '',
                inProgressBy: !task.completed ? '' : task.inProgressBy || ''
              }
            : { ...task, inProgressBy: task.inProgressBy || '' }
        );

        setTasks(updatedTasks);

        if (sessionId) {
          await updateTasks(sessionId, updatedTasks);
        }
      } catch (err) {
        console.error('Error toggling task:', err);
        setError(err.message);
      }
    },
    [tasks, initials, sessionId]
  );

  // Update task note
  const updateTaskNote = useCallback(
    async (id, note) => {
      try {
        const updatedTasks = tasks.map((task) =>
          task.id === id
            ? { ...task, note, inProgressBy: task.inProgressBy || '' }
            : { ...task, inProgressBy: task.inProgressBy || '' }
        );

        setTasks(updatedTasks);

        if (sessionId) {
          await updateTasks(sessionId, updatedTasks);
        }
      } catch (err) {
        console.error('Error updating task note:', err);
        setError(err.message);
      }
    },
    [tasks, sessionId]
  );

  // Toggle downtime task
  const toggleDowntimeTask = useCallback(
    async (id) => {
      try {
        const updatedDowntime = downtimeChecklist.map((task) =>
          task.id === id
            ? { ...task, completed: !task.completed, doneBy: !task.completed ? initials : '' }
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
    },
    [downtimeChecklist, initials, sessionId]
  );

  // Toggle task in progress status
  const toggleTaskInProgress = useCallback(
    async (id) => {
      try {
        const task = tasks.find((t) => t.id === id);
        if (!task) return;

        const updatedTasks = tasks.map((task) =>
          task.id === id
            ? { ...task, inProgressBy: (task.inProgressBy || '') === initials ? '' : initials }
            : { ...task, inProgressBy: task.inProgressBy || '' }
        );

        setTasks(updatedTasks);

        if (sessionId) {
          await updateTasks(sessionId, updatedTasks);
        }
      } catch (err) {
        console.error('Error toggling task in progress:', err);
        setError(err.message);
      }
    },
    [tasks, initials, sessionId]
  );

  // Reset all tasks (completion state only — keeps admin definitions intact)
  const resetAll = useCallback(async () => {
    try {
      const config = configRef.current;
      const baseTasks =
        config && Array.isArray(config.tasks) && config.tasks.length
          ? config.tasks
          : checklists[shift] || [];

      const initialTasks = baseTasks.map((task) => ({
        id: task.id,
        text: task.text,
        info: task.info || '',
        completed: false,
        note: '',
        doneBy: '',
        inProgressBy: ''
      }));
      const initialDowntime = buildDowntime(shift).map((item) => ({
        ...item,
        completed: false,
        doneBy: ''
      }));

      setTasks(initialTasks);
      setDowntimeChecklist(initialDowntime);

      if (sessionId) {
        await resetSession(sessionId, shift, initialTasks, initialDowntime);
      }
    } catch (err) {
      console.error('Error resetting tasks:', err);
      setError(err.message);
    }
  }, [shift, sessionId, buildDowntime]);

  return {
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
  };
};
