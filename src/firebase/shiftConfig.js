import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';
import { checklists } from '../Checklists';

// Admin-managed configuration for each shift.
//
// This collection holds the *definitions* (task list, shift instructions and
// downtime check times) and is writable by the admin only (see firestore.rules).
// Completion state (who ticked what) continues to live in the `checklists`
// collection which every active staff member can write to.
const SHIFT_CONFIG_COLLECTION = 'shiftConfig';

export const SHIFTS = ['Night', 'Morning', 'Evening'];

// Default downtime check times per shift (used when seeding the config).
export const DEFAULT_DOWNTIME_TIMES = {
  Night: ['01:00', '04:00', '07:00'],
  Morning: ['09:00', '12:00', '15:00'],
  Evening: ['18:00', '21:00', '23:00']
};

const configId = (shift) => String(shift).toLowerCase();

// Build the default config for a shift straight from the bundled checklist
// definitions. This is what gets written to Firestore the first time the
// admin opens the panel (or the first time a staff member loads the app).
export const getDefaultShiftConfig = (shift) => ({
  shift,
  tasks: (checklists[shift] || []).map((task) => ({
    id: task.id,
    text: task.text,
    info: task.info || ''
  })),
  instructions: '',
  downtimeTimes: DEFAULT_DOWNTIME_TIMES[shift] || DEFAULT_DOWNTIME_TIMES.Night
});

// Live subscription used by the staff checklist so admin edits appear instantly.
export const subscribeToShiftConfig = (shift, callback) => {
  const ref = doc(db, SHIFT_CONFIG_COLLECTION, configId(shift));

  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() });
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error listening to shift config updates:', error);
    }
  );
};

export const getShiftConfig = async (shift) => {
  const ref = doc(db, SHIFT_CONFIG_COLLECTION, configId(shift));
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// Merge-write so updating one section (e.g. instructions) never clobbers the
// others (tasks / downtime times).
export const saveShiftConfig = async (shift, data) => {
  const ref = doc(db, SHIFT_CONFIG_COLLECTION, configId(shift));
  await setDoc(
    ref,
    {
      shift,
      ...data,
      updatedAt: Timestamp.now()
    },
    { merge: true }
  );
};

export const saveShiftTasks = (shift, tasks) =>
  saveShiftConfig(shift, { tasks });

export const saveShiftInstructions = (shift, instructions) =>
  saveShiftConfig(shift, { instructions });

export const saveShiftDowntimeTimes = (shift, downtimeTimes) =>
  saveShiftConfig(shift, { downtimeTimes });

// Create the config document from defaults if it does not exist yet. Admin only
// (rules block staff writes), so it is called from the admin panel.
export const ensureShiftConfig = async (shift) => {
  const existing = await getShiftConfig(shift);
  if (existing) return existing;

  const defaults = getDefaultShiftConfig(shift);
  await saveShiftConfig(shift, defaults);
  return defaults;
};
