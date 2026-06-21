import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';

const COLLECTION = 'team-handovers';

export const HANDOVER_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
export const HANDOVER_STATUSES = ['Open', 'In Progress', 'Completed'];

const now = () => Timestamp.now();

export const subscribeTeamHandovers = (callback) => {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => console.error('team handovers sub error', err)
  );
};

export const createTeamHandover = async (payload, user, role) => {
  const id = `th-${Date.now()}`;
  await setDoc(doc(db, COLLECTION, id), {
    text: payload.text.trim(),
    priority: payload.priority || 'Medium',
    status: 'Open',
    audience: payload.audience || 'all',
    authorId: user?.uid || '',
    authorName: user?.name || 'Staff',
    authorRole: role,
    createdAt: now(),
    updatedAt: now(),
  });
  return id;
};

export const updateTeamHandover = async (id, updates) => {
  await updateDoc(doc(db, COLLECTION, id), { ...updates, updatedAt: now() });
};

export const deleteTeamHandover = async (id) => deleteDoc(doc(db, COLLECTION, id));

export const formatHandoverTime = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
};
