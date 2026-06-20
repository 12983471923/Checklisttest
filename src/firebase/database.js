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

// Generate a session ID based on shift only (persistent across dates)
const generateSessionId = (shift) => {
  return `${shift.toLowerCase()}_current`;
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
        lastReset: Timestamp.now(),
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
      lastReset: Timestamp.now(),
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
      lastReset: Timestamp.now(),
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

// Pricing Information Functions
// Stored under breakfast-times/pricing so reads/writes use the existing
// deployed Firestore rules for that collection (pricing-info is not deployed).
const PRICING_DOC_ID = 'pricing';

export const DEFAULT_PRICING = {
  bikeRegular: '175',
  bikeLufthansa: '100',
  breakfastDuringBooking: '140',
  breakfastAtCheckIn: '179',
  breakfastOnTheDay: '229',
};

export const DEFAULT_BREAKFAST_ITEMS = [
  {
    id: 'breakfast-during-booking',
    label: 'During booking',
    value: '140',
    suffix: 'DKK',
    note: '',
    order: 0,
    hidden: false,
  },
  {
    id: 'breakfast-at-check-in',
    label: 'At check-in',
    value: '179',
    suffix: 'DKK',
    note: '',
    order: 1,
    hidden: false,
  },
  {
    id: 'breakfast-on-the-day',
    label: 'On the day',
    value: '229',
    suffix: 'DKK',
    note: '',
    order: 2,
    hidden: false,
  },
];

const normalizeBreakfastItem = (item, index = 0) => ({
  id: item.id || `breakfast-${Date.now()}-${index}`,
  label: String(item.label ?? 'New rate').trim(),
  value: String(item.value ?? '0').trim(),
  suffix: String(item.suffix ?? 'DKK').trim(),
  note: String(item.note ?? '').trim(),
  order: typeof item.order === 'number' ? item.order : index,
  hidden: item.hidden === true,
});

const migrateBreakfastItems = (data = {}) => {
  if (Array.isArray(data.breakfastItems) && data.breakfastItems.length > 0) {
    return data.breakfastItems
      .map(normalizeBreakfastItem)
      .sort((a, b) => a.order - b.order)
      .map((item, order) => ({ ...item, order }));
  }

  return DEFAULT_BREAKFAST_ITEMS.map((item, index) =>
    normalizeBreakfastItem(
      {
        ...item,
        value:
          index === 0
            ? data.breakfastDuringBooking ?? item.value
            : index === 1
              ? data.breakfastAtCheckIn ?? item.value
              : data.breakfastOnTheDay ?? item.value,
      },
      index
    )
  );
};

const normalizePricing = (data = {}) => {
  const breakfastItems = migrateBreakfastItems(data);
  return {
    bikeRegular: String(data.bikeRegular ?? DEFAULT_PRICING.bikeRegular),
    bikeLufthansa: String(data.bikeLufthansa ?? DEFAULT_PRICING.bikeLufthansa),
    breakfastDuringBooking: String(
      breakfastItems[0]?.value ?? data.breakfastDuringBooking ?? DEFAULT_PRICING.breakfastDuringBooking
    ),
    breakfastAtCheckIn: String(
      breakfastItems[1]?.value ?? data.breakfastAtCheckIn ?? DEFAULT_PRICING.breakfastAtCheckIn
    ),
    breakfastOnTheDay: String(
      breakfastItems[2]?.value ?? data.breakfastOnTheDay ?? DEFAULT_PRICING.breakfastOnTheDay
    ),
    breakfastItems,
  };
};

export const getVisibleBreakfastItems = (pricing) =>
  (pricing?.breakfastItems || [])
    .filter((item) => !item.hidden)
    .sort((a, b) => a.order - b.order);

export const formatBreakfastPrice = (item) => {
  const suffix = item.suffix?.trim();
  return suffix ? `${item.value} ${suffix}` : item.value;
};

export const savePricingInfo = async (pricing) => {
  const docRef = doc(db, BREAKFAST_COLLECTION, PRICING_DOC_ID);
  const normalized = normalizePricing(pricing);

  try {
    await setDoc(docRef, {
      bikeRegular: normalized.bikeRegular,
      bikeLufthansa: normalized.bikeLufthansa,
      breakfastDuringBooking: normalized.breakfastDuringBooking,
      breakfastAtCheckIn: normalized.breakfastAtCheckIn,
      breakfastOnTheDay: normalized.breakfastOnTheDay,
      breakfastItems: normalized.breakfastItems,
      lastUpdated: Timestamp.now(),
    });
    return normalized;
  } catch (error) {
    console.error('Error saving pricing info:', error);
    throw error;
  }
};

export const getPricingInfo = async () => {
  const docRef = doc(db, BREAKFAST_COLLECTION, PRICING_DOC_ID);

  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return normalizePricing(docSnap.data());
    }
    return { ...DEFAULT_PRICING };
  } catch (error) {
    console.error('Error getting pricing info:', error);
    return { ...DEFAULT_PRICING };
  }
};

export const subscribeToPricingInfo = (callback) => {
  const docRef = doc(db, BREAKFAST_COLLECTION, PRICING_DOC_ID);

  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(normalizePricing(docSnap.data()));
    } else {
      callback({ ...DEFAULT_PRICING });
    }
  }, (error) => {
    console.error('Error listening to pricing info updates:', error);
  });
};
