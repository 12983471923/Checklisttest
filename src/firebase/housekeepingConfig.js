import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { housekeepingChecklists } from '../Checklists/housekeeping';

const HOUSEKEEPING_CONFIG_COLLECTION = 'housekeepingConfig';

export const HSK_SHIFTS = ['AM', 'PM'];

const configId = (shift) => String(shift).toLowerCase();

export const getDefaultHousekeepingConfig = (shift) => ({
  shift,
  tasks: (housekeepingChecklists[shift] || []).map((task) => ({
    id: task.id,
    text: task.text,
    info: task.info || '',
  })),
  instructions: '',
});

export const subscribeToHousekeepingConfig = (shift, callback) => {
  const ref = doc(db, HOUSEKEEPING_CONFIG_COLLECTION, configId(shift));

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
      console.error('Error listening to housekeeping config updates:', error);
    }
  );
};

export const getHousekeepingConfig = async (shift) => {
  const ref = doc(db, HOUSEKEEPING_CONFIG_COLLECTION, configId(shift));
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const saveHousekeepingConfig = async (shift, data) => {
  const ref = doc(db, HOUSEKEEPING_CONFIG_COLLECTION, configId(shift));
  await setDoc(
    ref,
    {
      shift,
      ...data,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
};

export const ensureHousekeepingConfig = async (shift) => {
  const existing = await getHousekeepingConfig(shift);
  if (!existing) {
    await saveHousekeepingConfig(shift, getDefaultHousekeepingConfig(shift));
  }
};
