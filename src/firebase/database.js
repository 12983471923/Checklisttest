import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from './config';
import { generateShiftSessionId } from '../utils/shiftTiming';

// Collection names
const CHECKLISTS_COLLECTION = 'checklists';
const DOWNTIME_COLLECTION = 'downtime';

// Get or create a checklist session
export const getOrCreateChecklistSession = async (shift) => {
  const sessionId = generateShiftSessionId(shift);
  const docRef = doc(db, CHECKLISTS_COLLECTION, sessionId);
  
  try {
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: sessionId, ...docSnap.data() };
    } else {
      // Create new session with default data
      const newSession = {
        shift,
        date: Timestamp.now(),
        tasks: [],
        downtimeChecklist: [],
        createdAt: Timestamp.now(),
        lastUpdated: Timestamp.now()
      };
      
      await setDoc(docRef, newSession);
      return { id: sessionId, ...newSession };
    }
  } catch (error) {
    console.error('Error getting/creating checklist session:', error);
    throw error;
  }
};

// Update task in database
export const updateTask = async (sessionId, taskId, updates) => {
  const docRef = doc(db, CHECKLISTS_COLLECTION, sessionId);
  
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const updatedTasks = data.tasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      );
      
      await updateDoc(docRef, {
        tasks: updatedTasks,
        lastUpdated: Timestamp.now()
      });
    }
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

// Update entire tasks array
export const updateTasks = async (sessionId, tasks) => {
  const docRef = doc(db, CHECKLISTS_COLLECTION, sessionId);
  
  try {
    await updateDoc(docRef, {
      tasks: tasks,
      lastUpdated: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating tasks:', error);
    throw error;
  }
};

// Update downtime checklist
export const updateDowntimeChecklist = async (sessionId, downtimeChecklist) => {
  const docRef = doc(db, CHECKLISTS_COLLECTION, sessionId);
  
  try {
    await updateDoc(docRef, {
      downtimeChecklist: downtimeChecklist,
      lastUpdated: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating downtime checklist:', error);
    throw error;
  }
};

// Listen to real-time updates for a checklist session
export const subscribeToChecklistSession = (sessionId, callback) => {
  const docRef = doc(db, CHECKLISTS_COLLECTION, sessionId);
  
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error listening to checklist updates:', error);
  });
};

// Initialize session with tasks
export const initializeSession = async (sessionId, shift, initialTasks, initialDowntime) => {
  const docRef = doc(db, CHECKLISTS_COLLECTION, sessionId);
  
  try {
    await setDoc(docRef, {
      shift,
      date: Timestamp.now(),
      tasks: initialTasks,
      downtimeChecklist: initialDowntime,
      createdAt: Timestamp.now(),
      lastUpdated: Timestamp.now()
    });
  } catch (error) {
    console.error('Error initializing session:', error);
    throw error;
  }
};

// Reset all tasks for a session
export const resetSession = async (sessionId, shift, initialTasks, initialDowntime) => {
  const docRef = doc(db, CHECKLISTS_COLLECTION, sessionId);
  
  try {
    await updateDoc(docRef, {
      tasks: initialTasks,
      downtimeChecklist: initialDowntime,
      lastUpdated: Timestamp.now()
    });
  } catch (error) {
    console.error('Error resetting session:', error);
    throw error;
  }
};

// Handover Notes Functions
const HANDOVER_COLLECTION = 'handover-notes';

export const saveHandoverNotes = async (date, notes) => {
  const docRef = doc(db, HANDOVER_COLLECTION, date);
  
  try {
    await setDoc(docRef, {
      date,
      notes,
      lastUpdated: Timestamp.now()
    });
  } catch (error) {
    console.error('Error saving handover notes:', error);
    throw error;
  }
};

export const getHandoverNotes = async (date) => {
  const docRef = doc(db, HANDOVER_COLLECTION, date);
  
  try {
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data().notes : '';
  } catch (error) {
    console.error('Error getting handover notes:', error);
    return '';
  }
};

export const deleteHandoverNotes = async (date) => {
  const docRef = doc(db, HANDOVER_COLLECTION, date);
  
  try {
    await setDoc(docRef, {
      date,
      notes: '',
      lastUpdated: Timestamp.now()
    });
  } catch (error) {
    console.error('Error deleting handover notes:', error);
    throw error;
  }
};

export const subscribeToHandoverNotes = (callback) => {
  const collectionRef = collection(db, HANDOVER_COLLECTION);
  
  return onSnapshot(collectionRef, (querySnapshot) => {
    const handovers = {};
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.notes && data.notes.trim()) {
        handovers[doc.id] = data.notes;
      }
    });
    callback(handovers);
  }, (error) => {
    console.error('Error listening to handover updates:', error);
  });
};

// Wake-up Calls Functions
const WAKEUP_COLLECTION = 'wake-up-calls';

export const saveWakeUpCalls = async (calls) => {
  const docRef = doc(db, WAKEUP_COLLECTION, 'current');
  
  try {
    await setDoc(docRef, {
      calls,
      lastUpdated: Timestamp.now()
    });
  } catch (error) {
    console.error('Error saving wake-up calls:', error);
    throw error;
  }
};

export const getWakeUpCalls = async () => {
  const docRef = doc(db, WAKEUP_COLLECTION, 'current');
  
  try {
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data().calls : [];
  } catch (error) {
    console.error('Error getting wake-up calls:', error);
    return [];
  }
};

export const subscribeToWakeUpCalls = (callback) => {
  const docRef = doc(db, WAKEUP_COLLECTION, 'current');
  
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data().calls || []);
    } else {
      callback([]);
    }
  }, (error) => {
    console.error('Error listening to wake-up calls updates:', error);
  });
};

// Breakfast Times Functions
const BREAKFAST_COLLECTION = 'breakfast-times';

export const saveBreakfastTimes = async (times) => {
  const docRef = doc(db, BREAKFAST_COLLECTION, 'current');
  
  try {
    await setDoc(docRef, {
      ...times,
      lastUpdated: Timestamp.now()
    });
  } catch (error) {
    console.error('Error saving breakfast times:', error);
    throw error;
  }
};

export const getBreakfastTimes = async () => {
  const docRef = doc(db, BREAKFAST_COLLECTION, 'current');
  
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return { start: data.start, end: data.end };
    } else {
      return { start: '07:00', end: '11:00' };
    }
  } catch (error) {
    console.error('Error getting breakfast times:', error);
    return { start: '07:00', end: '11:00' };
  }
};

export const subscribeToBreakfastTimes = (callback) => {
  const docRef = doc(db, BREAKFAST_COLLECTION, 'current');
  
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      callback({ start: data.start, end: data.end });
    } else {
      callback({ start: '07:00', end: '11:00' });
    }
  }, (error) => {
    console.error('Error listening to breakfast times updates:', error);
  });
};
