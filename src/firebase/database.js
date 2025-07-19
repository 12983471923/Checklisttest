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

// Collection names
const CHECKLISTS_COLLECTION = 'checklists';
const DOWNTIME_COLLECTION = 'downtime';

// Generate a session ID based on shift and date
const generateSessionId = (shift) => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
  return `${shift.toLowerCase()}_${dateStr}`;
};

// Get or create a checklist session
export const getOrCreateChecklistSession = async (shift) => {
  const sessionId = generateSessionId(shift);
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
