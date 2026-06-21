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
  writeBatch,
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
export const MESSAGE_VIEWS = ['active', 'archived', 'trash', 'all'];
export const REQUEST_VIEWS = ['active', 'completed', 'archived', 'all'];
export const TRASH_RETENTION_DAYS = 30;
export const TRASH_RETENTION_MS = TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;
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

const tsToMs = (ts) => {
  if (!ts) return 0;
  if (ts.toDate) return ts.toDate().getTime();
  return new Date(ts).getTime();
};

export const isMessageInTrash = (message, atMs = Date.now()) => {
  if (!message?.deletedAt) return false;
  return atMs - tsToMs(message.deletedAt) < TRASH_RETENTION_MS;
};

export const isMessageArchived = (message) => Boolean(message?.archivedAt && !message?.deletedAt);

export const isMessageActive = (message) => !message?.deletedAt && !message?.archivedAt;

export const isRequestArchived = (request) => Boolean(request?.archivedAt);

export const isRequestCompleted = (request) =>
  request?.status === 'Completed' && !request?.archivedAt;

export const isRequestActive = (request) =>
  request?.status !== 'Completed' && !request?.archivedAt;

export const filterMessagesByView = (messages, view, atMs = Date.now()) => {
  switch (view) {
    case 'archived':
      return messages.filter(isMessageArchived);
    case 'trash':
      return messages.filter((m) => isMessageInTrash(m, atMs));
    case 'all':
      return messages.filter((m) => !m.deletedAt || isMessageInTrash(m, atMs));
    case 'active':
    default:
      return messages.filter(isMessageActive);
  }
};

export const filterRequestsByView = (requests, view) => {
  switch (view) {
    case 'completed':
      return requests.filter(isRequestCompleted);
    case 'archived':
      return requests.filter(isRequestArchived);
    case 'all':
      return requests;
    case 'active':
    default:
      return requests.filter(isRequestActive);
  }
};

export const countMessagesByView = (messages, view, atMs = Date.now()) =>
  filterMessagesByView(messages, view, atMs).length;

export const countRequestsByView = (requests, view) =>
  filterRequestsByView(requests, view).length;

const batchUpdateMessages = async (messages, updates, user) => {
  if (!messages.length) return;
  const batch = writeBatch(db);
  messages.forEach((m) => {
    batch.update(doc(db, MESSAGES, m.id), { ...updates, updatedAt: now() });
  });
  await batch.commit();
};

export const archiveMessages = async (messages, user) =>
  batchUpdateMessages(messages, {
    archivedAt: now(),
    archivedBy: user?.uid || '',
    deletedAt: null,
    deletedBy: '',
  }, user);

export const softDeleteMessages = async (messages, user) =>
  batchUpdateMessages(messages, {
    deletedAt: now(),
    deletedBy: user?.uid || '',
    archivedAt: null,
    archivedBy: '',
  }, user);

export const restoreMessages = async (messages) =>
  batchUpdateMessages(messages, {
    deletedAt: null,
    deletedBy: '',
    archivedAt: null,
    archivedBy: '',
  });

export const permanentlyDeleteMessages = async (messages) => {
  if (!messages.length) return;
  const batch = writeBatch(db);
  messages.forEach((m) => batch.delete(doc(db, MESSAGES, m.id)));
  await batch.commit();
};

export const purgeExpiredTrashMessages = async (messages, atMs = Date.now()) => {
  const expired = messages.filter(
    (m) => m.deletedAt && !isMessageInTrash(m, atMs)
  );
  await permanentlyDeleteMessages(expired);
  return expired.length;
};

export const deleteRequest = async (requestId) => deleteDoc(doc(db, REQUESTS, requestId));

export const deleteRequests = async (requestIds) => {
  if (!requestIds.length) return;
  const batch = writeBatch(db);
  requestIds.forEach((id) => batch.delete(doc(db, REQUESTS, id)));
  await batch.commit();
};

export const archiveRequests = async (requests, user) => {
  if (!requests.length) return;
  const batch = writeBatch(db);
  requests.forEach((r) => {
    batch.update(doc(db, REQUESTS, r.id), {
      archivedAt: now(),
      archivedBy: user?.uid || '',
      updatedAt: now(),
    });
  });
  await batch.commit();
};

export const restoreRequests = async (requests) => {
  if (!requests.length) return;
  const batch = writeBatch(db);
  requests.forEach((r) => {
    batch.update(doc(db, REQUESTS, r.id), {
      archivedAt: null,
      archivedBy: '',
      updatedAt: now(),
    });
  });
  await batch.commit();
};

export const subscribeMessages = (callback) => {
  const q = query(collection(db, MESSAGES), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (err) => console.error('messages sub error', err));
};

export const sendMessage = async (text, user, senderRole, extras = {}) => {
  const id = `msg-${Date.now()}`;
  await setDoc(doc(db, MESSAGES, id), {
    text: text.trim(),
    senderId: user?.uid || '',
    senderName: user?.name || 'Staff',
    senderRole,
    receiverRole: senderRole === 'housekeeping' ? 'reception' : 'housekeeping',
    createdAt: now(),
    readBy: [user?.uid].filter(Boolean),
    attachmentName: extras.attachmentName || '',
  });
  return id;
};

const TYPING_COLLECTION = 'hsk-typing';

export const setTypingStatus = async (user, role, isTyping) => {
  if (!user?.uid) return;
  const ref = doc(db, TYPING_COLLECTION, user.uid);
  if (!isTyping) {
    await deleteDoc(ref).catch(() => {});
    return;
  }
  await setDoc(ref, {
    userId: user.uid,
    name: user.name || 'Staff',
    role,
    updatedAt: now(),
  });
};

export const subscribeTyping = (callback, excludeUserId) =>
  onSnapshot(collection(db, TYPING_COLLECTION), (snap) => {
    const typing = snap.docs
      .map((d) => d.data())
      .filter((t) => t.userId !== excludeUserId);
    callback(typing);
  }, (err) => console.error('typing sub error', err));

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
      isMessageActive(m) &&
      m.senderId !== userId &&
      m.senderRole !== role &&
      !(m.readBy || []).includes(userId)
  ).length;

export const countPendingRequests = (requests, role) => {
  const active = requests.filter(isRequestActive);
  if (role === 'housekeeping') {
    return active.filter((r) => r.status === 'Pending' || r.status === 'Accepted').length;
  }
  return active.length;
};
