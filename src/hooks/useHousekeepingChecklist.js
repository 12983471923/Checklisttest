import { useState, useEffect, useCallback, useRef } from 'react';
import { housekeepingChecklists } from '../Checklists/housekeeping';
import {
  getOrCreateChecklistSession,
  updateTasks,
  subscribeToChecklistSession,
  initializeSession,
  resetSession,
} from '../firebase/database';
import { subscribeToHousekeepingConfig } from '../firebase/housekeepingConfig';

const generateSessionId = (shift) => `hsk_${shift.toLowerCase()}_current`;

export const useHousekeepingChecklist = (shift, initials) => {
  const [tasks, setTasks] = useState([]);
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  const configRef = useRef(null);
  const stateTasksRef = useRef([]);

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
          completed: !!state.completed,
          doneBy: state.doneBy || '',
          note: state.note || '',
          inProgressBy: state.inProgressBy || '',
        };
      });
    }

    return stateTasks.map((task) => ({
      ...task,
      inProgressBy: task.inProgressBy || '',
    }));
  }, []);

  const recompute = useCallback(() => {
    setTasks(buildDisplayTasks());
    setInstructions(configRef.current?.instructions || '');
  }, [buildDisplayTasks]);

  const initSession = useCallback(
    async (currentShift) => {
      try {
        setLoading(true);
        setError(null);

        const newSessionId = generateSessionId(currentShift);
        setSessionId(newSessionId);

        const initialTasks = (housekeepingChecklists[currentShift] || []).map((task) => ({
          ...task,
          completed: false,
          note: '',
          doneBy: '',
          inProgressBy: '',
        }));

        const session = await getOrCreateChecklistSession(currentShift, newSessionId);
        const sessionTasks =
          Array.isArray(session.tasks) && session.tasks.length
            ? session.tasks.map((task) => ({ ...task, inProgressBy: task.inProgressBy || '' }))
            : initialTasks;

        if (!session.tasks || !session.tasks.length) {
          await initializeSession(newSessionId, currentShift, initialTasks, []);
        }

        stateTasksRef.current = sessionTasks;
        recompute();
      } catch (err) {
        console.error('Error initializing housekeeping session:', err);
        setError(err.message);
        stateTasksRef.current = (housekeepingChecklists[currentShift] || []).map((task) => ({
          ...task,
          completed: false,
          note: '',
          doneBy: '',
          inProgressBy: '',
        }));
        recompute();
      } finally {
        setLoading(false);
      }
    },
    [recompute]
  );

  useEffect(() => {
    const unsubscribe = subscribeToHousekeepingConfig(shift, (config) => {
      configRef.current = config;
      recompute();
    });
    return () => unsubscribe();
  }, [shift, recompute]);

  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = subscribeToChecklistSession(sessionId, (data) => {
      if (data?.tasks) {
        stateTasksRef.current = data.tasks.map((task) => ({
          ...task,
          inProgressBy: task.inProgressBy || '',
        }));
        recompute();
      }
    });

    return () => unsubscribe();
  }, [sessionId, recompute]);

  useEffect(() => {
    initSession(shift);
  }, [shift, initSession]);

  const toggleTask = useCallback(
    async (id) => {
      try {
        const updatedTasks = tasks.map((task) =>
          task.id === id
            ? {
                ...task,
                completed: !task.completed,
                doneBy: !task.completed ? initials : '',
                inProgressBy: !task.completed ? '' : task.inProgressBy || '',
              }
            : { ...task, inProgressBy: task.inProgressBy || '' }
        );

        setTasks(updatedTasks);
        if (sessionId) {
          await updateTasks(sessionId, updatedTasks);
        }
      } catch (err) {
        console.error('Error toggling housekeeping task:', err);
        setError(err.message);
      }
    },
    [tasks, initials, sessionId]
  );

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
        console.error('Error updating housekeeping task note:', err);
        setError(err.message);
      }
    },
    [tasks, sessionId]
  );

  const toggleTaskInProgress = useCallback(
    async (id) => {
      try {
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
        console.error('Error toggling housekeeping task in progress:', err);
        setError(err.message);
      }
    },
    [tasks, initials, sessionId]
  );

  const resetAll = useCallback(async () => {
    try {
      const config = configRef.current;
      const baseTasks =
        config && Array.isArray(config.tasks) && config.tasks.length
          ? config.tasks
          : housekeepingChecklists[shift] || [];

      const initialTasks = baseTasks.map((task) => ({
        id: task.id,
        text: task.text,
        info: task.info || '',
        completed: false,
        note: '',
        doneBy: '',
        inProgressBy: '',
      }));

      setTasks(initialTasks);
      if (sessionId) {
        await resetSession(sessionId, shift, initialTasks, []);
      }
    } catch (err) {
      console.error('Error resetting housekeeping tasks:', err);
      setError(err.message);
    }
  }, [shift, sessionId]);

  return {
    tasks,
    instructions,
    loading,
    error,
    toggleTask,
    toggleTaskInProgress,
    updateTaskNote,
    resetAll,
  };
};
