import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';

const ROOMS_COLLECTION = 'rooms';
const REQUESTS_COLLECTION = 'requests';
const MESSAGES_COLLECTION = 'messages';

export const REQUEST_TYPES = {
  ROOM_CLEANING: 'room_cleaning',
  EXTRA_TOWELS: 'extra_towels',
  ROOM_INSPECTION: 'room_inspection',
  MAINTENANCE: 'maintenance',
  GUEST_REQUEST: 'guest_request',
};

export const REQUEST_TYPE_LABELS = {
  [REQUEST_TYPES.ROOM_CLEANING]: 'Room Cleaning',
  [REQUEST_TYPES.EXTRA_TOWELS]: 'Extra Towels',
  [REQUEST_TYPES.ROOM_INSPECTION]: 'Room Inspection',
  [REQUEST_TYPES.MAINTENANCE]: 'Maintenance Follow-up',
  [REQUEST_TYPES.GUEST_REQUEST]: 'Guest Request',
};

export const REQUEST_STATUSES = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
};

export const REQUEST_STATUS_LABELS = {
  [REQUEST_STATUSES.PENDING]: 'Pending',
  [REQUEST_STATUSES.ACCEPTED]: 'Accepted',
  [REQUEST_STATUSES.IN_PROGRESS]: 'In Progress',
  [REQUEST_STATUSES.COMPLETED]: 'Completed',
};

export const ROOM_STATUSES = {
  CLEAN: 'clean',
  DIRTY: 'dirty',
  INSPECTED: 'inspected',
  OUT_OF_ORDER: 'out_of_order',
};

export const ROOM_STATUS_LABELS = {
  [ROOM_STATUSES.CLEAN]: 'Clean',
  [ROOM_STATUSES.DIRTY]: 'Dirty',
  [ROOM_STATUSES.INSPECTED]: 'Inspected',
  [ROOM_STATUSES.OUT_OF_ORDER]: 'Out of Order',
};

// ─── Rooms ───────────────────────────────────────────────────────────────────

export const subscribeToRooms = (callback) => {
  const q = query(collection(db, ROOMS_COLLECTION), orderBy('roomNumber', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const rooms = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(rooms);
    },
    (error) => console.error('Error listening to rooms:', error)
  );
};

export const createRoom = async (roomData) => {
  const docRef = doc(collection(db, ROOMS_COLLECTION));
  const payload = {
    roomNumber: roomData.roomNumber,
    floor: roomData.floor || '',
    type: roomData.type || 'standard',
    status: roomData.status || ROOM_STATUSES.CLEAN,
    notes: roomData.notes || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(docRef, payload);
  return { id: docRef.id, ...payload };
};

export const updateRoom = async (roomId, updates) => {
  const docRef = doc(db, ROOMS_COLLECTION, roomId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const deleteRoom = async (roomId) => {
  await deleteDoc(doc(db, ROOMS_COLLECTION, roomId));
};

// ─── Requests ────────────────────────────────────────────────────────────────

export const subscribeToRequests = (callback) => {
  const q = query(collection(db, REQUESTS_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const requests = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(requests);
    },
    (error) => console.error('Error listening to requests:', error)
  );
};

export const createRequest = async (requestData) => {
  const docRef = await addDoc(collection(db, REQUESTS_COLLECTION), {
    type: requestData.type,
    title: requestData.title,
    description: requestData.description || '',
    roomNumber: requestData.roomNumber || null,
    status: REQUEST_STATUSES.PENDING,
    createdBy: requestData.createdBy,
    assignedTo: null,
    readByHsk: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateRequestStatus = async (requestId, status, assignedTo = null) => {
  const updates = {
    status,
    updatedAt: serverTimestamp(),
  };
  if (assignedTo) {
    updates.assignedTo = assignedTo;
  }
  await updateDoc(doc(db, REQUESTS_COLLECTION, requestId), updates);
};

export const markRequestReadByHsk = async (requestId) => {
  await updateDoc(doc(db, REQUESTS_COLLECTION, requestId), {
    readByHsk: true,
    updatedAt: serverTimestamp(),
  });
};

// ─── Messages ────────────────────────────────────────────────────────────────

export const subscribeToMessages = (callback) => {
  const q = query(collection(db, MESSAGES_COLLECTION), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(messages);
    },
    (error) => console.error('Error listening to messages:', error)
  );
};

export const sendMessage = async (messageData) => {
  const docRef = await addDoc(collection(db, MESSAGES_COLLECTION), {
    fromDepartment: messageData.fromDepartment,
    toDepartment: messageData.toDepartment,
    fromUser: messageData.fromUser,
    text: messageData.text,
    readByReception: messageData.fromDepartment === 'reception',
    readByHousekeeping: messageData.fromDepartment === 'housekeeping',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const markMessagesRead = async (messageIds, department) => {
  const field = department === 'housekeeping' ? 'readByHousekeeping' : 'readByReception';
  await Promise.all(
    messageIds.map((id) =>
      updateDoc(doc(db, MESSAGES_COLLECTION, id), { [field]: true })
    )
  );
};
