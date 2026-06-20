import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { housekeepingChecklist } from '../Checklists/housekeeping';

const ROOMS = 'hsk-rooms';
const REQUESTS = 'hsk-requests';
const MESSAGES = 'hsk-messages';
const CHECKLIST = 'hsk-checklists';
const CHECKLIST_ID = 'current';

export const ROOM_STATUSES = [
  'Available',
  'Occupied',
  'Dirty',
  'Cleaning In Progress',
  'Cleaned',
  'Out of Service',
];

export const REQUEST_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
export const REQUEST_STATUSES = ['Pending', 'Accepted', 'In Progress', 'Completed'];
export const REQUEST_TYPES = [
  'Room cleaning',
  'Extra towels',
  'Guest amenities',
  'Room inspection',
  'Maintenance follow-up',
  'VIP room preparation',
  'Special guest request',
];

const now = () => Timestamp.now();

const sortRooms = (rooms) =>
  [...rooms].sort((a, b) => String(a.roomNumber).localeCompare(String(b.roomNumber), undefined, { numeric: true }));

export const subscribeRooms = (callback) =>
  onSnapshot(collection(db, ROOMS), (snap) => {
    callback(sortRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, (err) => console.error('rooms sub error', err));

export const saveRoom = async (room, user) => {
  const id = room.id || `room-${Date.now()}`;
  await setDoc(doc(db, ROOMS, id), {
    roomNumber: String(room.roomNumber).trim(),
    status: room.status || 'Available',
    notes: room.notes || '',
    floor: room.floor || '',
    lastUpdated: now(),
    updatedBy: user?.uid || null,
  });
  return id;
};

export const deleteRoom = async (roomId) => deleteDoc(doc(db, ROOMS, roomId));

export const updateRoomStatus = async (roomId, status, user, notes) => {
  await updateDoc(doc(db, ROOMS, roomId), {
    status,
    notes: notes ?? undefined,
    lastUpdated: now(),
    updatedBy: user?.uid || null,
  });
};

export const subscribeRequests = (callback) => {
  const q = query(collection(db, REQUESTS), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (err) => console.error('requests sub error', err));
};

export const createRequest = async (payload, user) => {
  const id = `req-${Date.now()}`;
  await setDoc(doc(db, REQUESTS, id), {
    roomId: payload.roomId || '',
    roomNumber: payload.roomNumber || '',
    requestType: payload.requestType || 'Room cleaning',
    priority: payload.priority || 'Medium',
    status: 'Pending',
    notes: payload.notes || '',
    comments: [],
    assignedTo: payload.assignedTo || '',
    createdBy: user?.uid || '',
    createdByName: user?.name || 'Reception',
    createdAt: now(),
    updatedAt: now(),
  });
  return id;
};

export const updateRequest = async (requestId, updates) => {
  await updateDoc(doc(db, REQUESTS, requestId), { ...updates, updatedAt: now() });
};

export const addRequestComment = async (requestId, comment, user) => {
  const ref = doc(db, REQUESTS, requestId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const comments = [...(snap.data().comments || []), {
    id: `c-${Date.now()}`,
    text: comment,
    authorId: user?.uid,
    authorName: user?.name || 'Staff',
    createdAt: new Date().toISOString(),
  }];
  await updateDoc(ref, { comments, updatedAt: now() });
};

export const subscribeMessages = (callback) => {
  const q = query(collection(db, MESSAGES), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (err) => console.error('messages sub error', err));
};

export const sendMessage = async (text, user, senderRole) => {
  const id = `msg-${Date.now()}`;
  await setDoc(doc(db, MESSAGES, id), {
    text: text.trim(),
    senderId: user?.uid || '',
    senderName: user?.name || 'Staff',
    senderRole,
    receiverRole: senderRole === 'housekeeping' ? 'reception' : 'housekeeping',
    createdAt: now(),
    readBy: [user?.uid].filter(Boolean),
  });
  return id;
};

export const markMessageRead = async (messageId, userId, currentReadBy = []) => {
  if (!userId || currentReadBy.includes(userId)) return;
  await updateDoc(doc(db, MESSAGES, messageId), {
    readBy: [...currentReadBy, userId],
  });
};

export const getDefaultHskTasks = () =>
  housekeepingChecklist.map((t) => ({
    ...t,
    completed: false,
    doneBy: '',
    note: '',
  }));

export const subscribeHskChecklist = (callback) =>
  onSnapshot(doc(db, CHECKLIST, CHECKLIST_ID), (snap) => {
    if (snap.exists()) callback(snap.data());
    else callback(null);
  }, (err) => console.error('hsk checklist sub error', err));

export const ensureHskChecklist = async () => {
  const ref = doc(db, CHECKLIST, CHECKLIST_ID);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data();
  const data = { tasks: getDefaultHskTasks(), lastUpdated: now() };
  await setDoc(ref, data);
  return data;
};

export const updateHskChecklistTasks = async (tasks) => {
  await setDoc(doc(db, CHECKLIST, CHECKLIST_ID), { tasks, lastUpdated: now() });
};

export const countUnreadMessages = (messages, userId, role) =>
  messages.filter(
    (m) =>
      m.senderId !== userId &&
      m.senderRole !== role &&
      !(m.readBy || []).includes(userId)
  ).length;

export const countPendingRequests = (requests, role) => {
  if (role === 'housekeeping') {
    return requests.filter((r) => r.status === 'Pending' || r.status === 'Accepted').length;
  }
  return requests.filter((r) => r.status !== 'Completed').length;
};
