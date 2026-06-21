import { doc, getDoc, setDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from './config';

const COLLECTION = 'dashboardConfig';
const DOC_ID = 'published';

export const DEFAULT_HOTEL_INFO = {
  name: 'Scandic Falkoner',
  address: 'Falkoner Alle 9, 2000 Frederiksberg, Denmark',
  phone: '+45 72 42 55 00',
  email: 'falkoner@scandichotels.com',
  checkIn: '16:00',
  checkOut: '12:00',
};

export const DEFAULT_DASHBOARD_CONFIG = {
  hotelInfo: { ...DEFAULT_HOTEL_INFO },
  reception: {
    widgets: [
      { id: 'hotel-info', label: 'Hotel Info', visible: true, order: 0 },
      { id: 'hotel-times', label: 'Hotel Times', visible: true, order: 1 },
      { id: 'pricing', label: 'Pricing', visible: true, order: 2 },
      { id: 'handover-daily', label: 'Daily Handover', visible: true, order: 3 },
      { id: 'team-handovers', label: 'Team Handovers', visible: true, order: 4 },
      { id: 'wakeup', label: 'Wake-Up Calls', visible: true, order: 5 },
    ],
  },
  hsk: {
    widgets: [
      { id: 'hotel-info', label: 'Hotel Info', visible: true, order: 0 },
      { id: 'team-handovers', label: 'Team Handovers', visible: true, order: 1 },
      { id: 'chat', label: 'HSK Chat', visible: true, order: 2, locked: true },
      { id: 'tools', label: 'Tasks & Rooms', visible: true, order: 3 },
    ],
  },
  floatingHsk: {
    tabs: [
      { id: 'messages', label: 'Messages', visible: true, order: 0 },
      { id: 'handovers', label: 'Handovers', visible: true, order: 1 },
      { id: 'requests', label: 'Requests', visible: true, order: 2 },
      { id: 'rooms', label: 'Rooms', visible: true, order: 3 },
      { id: 'alerts', label: 'Alerts', visible: true, order: 4 },
    ],
  },
};

const mergeWidgets = (defaults, saved) => {
  const savedMap = new Map((saved || []).map((w) => [w.id, w]));
  const merged = defaults.map((def) => ({ ...def, ...savedMap.get(def.id) }));
  (saved || []).forEach((w) => {
    if (!defaults.some((d) => d.id === w.id)) merged.push(w);
  });
  return merged.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

export const normalizeDashboardConfig = (data) => {
  const base = data || {};
  return {
    hotelInfo: { ...DEFAULT_HOTEL_INFO, ...(base.hotelInfo || {}) },
    reception: {
      widgets: mergeWidgets(
        DEFAULT_DASHBOARD_CONFIG.reception.widgets,
        base.reception?.widgets
      ),
    },
    hsk: {
      widgets: mergeWidgets(DEFAULT_DASHBOARD_CONFIG.hsk.widgets, base.hsk?.widgets),
    },
    floatingHsk: {
      tabs: mergeWidgets(
        DEFAULT_DASHBOARD_CONFIG.floatingHsk.tabs,
        base.floatingHsk?.tabs
      ),
    },
    updatedAt: base.updatedAt || null,
  };
};

export const subscribeDashboardConfig = (callback) =>
  onSnapshot(doc(db, COLLECTION, DOC_ID), (snap) => {
    callback(snap.exists() ? normalizeDashboardConfig(snap.data()) : normalizeDashboardConfig(null));
  }, (err) => {
    console.error('dashboard config sub error', err);
    callback(normalizeDashboardConfig(null));
  });

export const getDashboardConfig = async () => {
  const snap = await getDoc(doc(db, COLLECTION, DOC_ID));
  return snap.exists() ? normalizeDashboardConfig(snap.data()) : normalizeDashboardConfig(null);
};

export const saveDashboardConfig = async (config) => {
  await setDoc(doc(db, COLLECTION, DOC_ID), {
    ...config,
    updatedAt: Timestamp.now(),
  });
};

export const isWidgetVisible = (widgets, id) => {
  const w = widgets?.find((item) => item.id === id);
  return w ? w.visible !== false : true;
};

export const getVisibleTabIds = (tabs) =>
  (tabs || [])
    .filter((t) => t.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((t) => t.id);
