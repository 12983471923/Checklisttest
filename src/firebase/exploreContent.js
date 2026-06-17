import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { EXPLORE_SEED } from '../data/exploreSeedData';

const EXPLORE_DOC = 'exploreContent';
const EXPLORE_ID = 'published';

export const PLACE_FIELDS = [
  'name',
  'icon',
  'distance',
  'address',
  'phone',
  'email',
  'website',
  'openingHours',
  'summary',
  'staffTip',
  'tags',
  'mapQuery',
  'travelMode',
  'categoryId',
  'type',
];

export const CATEGORY_FIELDS = ['name', 'icon', 'description', 'note'];

const docRef = () => doc(db, EXPLORE_DOC, EXPLORE_ID);

const nowIso = () => new Date().toISOString();

const sortCategories = (categories) =>
  [...categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

const sortPlaces = (places) =>
  [...places].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return (a.order ?? 0) - (b.order ?? 0);
  });

export const normalizeExploreContent = (data) => {
  if (!data) return null;
  return {
    version: data.version ?? 1,
    lastAutoSync: data.lastAutoSync ?? null,
    categories: sortCategories(data.categories || []),
    places: sortPlaces(data.places || []),
  };
};

export const getPublishedPlaces = (content) =>
  (content?.places || []).filter((p) => p.status === 'published' && !p.hidden);

export const getPublishedCategories = (content) =>
  (content?.categories || []).filter((c) => c.status === 'published' && !c.hidden);

export const getPendingPlaces = (content) =>
  (content?.places || []).filter((p) => p.status === 'pending' || p.pendingUpdate);

export const ensureExploreContent = async () => {
  const ref = docRef();
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return normalizeExploreContent(snap.data());
  }
  await setDoc(ref, EXPLORE_SEED);
  return normalizeExploreContent(EXPLORE_SEED);
};

export const subscribeExploreContent = (callback, onError) => {
  return onSnapshot(
    docRef(),
    (snap) => {
      if (snap.exists()) {
        callback(normalizeExploreContent(snap.data()));
      } else {
        callback(normalizeExploreContent(EXPLORE_SEED));
      }
    },
    onError
  );
};

export const saveExploreContent = async (content) => {
  const payload = {
    ...content,
    version: (content.version ?? 0) + 1,
  };
  await setDoc(docRef(), payload);
  return payload;
};

const withEditorMeta = (item, user, source = 'manual') => ({
  ...item,
  updateSource: source,
  lastUpdated: nowIso(),
  lastUpdatedBy: user
    ? { uid: user.uid, name: user.name, email: user.email }
    : item.lastUpdatedBy ?? null,
});

export const updateCategory = async (content, categoryId, updates, user, { publish = false } = {}) => {
  const categories = content.categories.map((cat) => {
    if (cat.id !== categoryId) return cat;
    const next = { ...cat, ...updates };
    if (publish || user?.isManager) {
      return withEditorMeta({ ...next, status: 'published' }, user);
    }
    return withEditorMeta({ ...next, status: 'pending' }, user);
  });
  return saveExploreContent({ ...content, categories });
};

export const addCategory = async (content, category, user) => {
  const id = category.id || `custom-${Date.now()}`;
  const order = content.categories.length;
  const nextCategory = withEditorMeta(
    {
      id,
      name: category.name || 'New category',
      icon: category.icon || '📁',
      description: category.description || '',
      note: category.note || '',
      order,
      hidden: false,
      custom: true,
      status: user?.isManager ? 'published' : 'pending',
    },
    user
  );
  return saveExploreContent({
    ...content,
    categories: [...content.categories, nextCategory],
  });
};

export const removeCategory = async (content, categoryId) => {
  return saveExploreContent({
    ...content,
    categories: content.categories.filter((c) => c.id !== categoryId),
    places: content.places.filter((p) => p.categoryId !== categoryId),
  });
};

export const reorderCategories = async (content, categoryId, direction) => {
  const sorted = sortCategories(content.categories);
  const index = sorted.findIndex((c) => c.id === categoryId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= sorted.length) return content;
  [sorted[index], sorted[target]] = [sorted[target], sorted[index]];
  const categories = sorted.map((cat, order) => ({ ...cat, order }));
  return saveExploreContent({ ...content, categories });
};

export const updatePlace = async (
  content,
  placeId,
  updates,
  user,
  { publish = false, markManualFields = true } = {}
) => {
  const places = content.places.map((place) => {
    if (place.id !== placeId) return place;
    const manualOverrides = { ...(place.manualOverrides || {}) };
    if (markManualFields) {
      Object.keys(updates).forEach((key) => {
        if (PLACE_FIELDS.includes(key)) manualOverrides[key] = true;
      });
    }
    const status =
      publish || user?.isManager ? 'published' : updates.status ?? 'pending';
    return withEditorMeta(
      {
        ...place,
        ...updates,
        manualOverrides,
        status,
        pendingUpdate: publish ? null : place.pendingUpdate,
      },
      user
    );
  });
  return saveExploreContent({ ...content, places });
};

export const addPlace = async (content, place, user) => {
  const categoryId = place.categoryId || 'attractions';
  const categoryPlaces = content.places.filter((p) => p.categoryId === categoryId);
  const id = place.id || `${categoryId}-${Date.now()}`;
  const newPlace = withEditorMeta(
    {
      id,
      categoryId,
      type: place.type || 'place',
      name: place.name || (place.type === 'event' ? 'New event' : 'New place'),
      icon: place.icon || (place.type === 'event' ? '🎟️' : '📍'),
      distance: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      openingHours: '',
      summary: '',
      staffTip: '',
      tags: [],
      mapQuery: '',
      travelMode: 'transit',
      order: categoryPlaces.length,
      hidden: false,
      pinned: false,
      featured: false,
      status: user?.isManager ? 'published' : 'pending',
      manualOverrides: {},
      pendingUpdate: null,
      ...place,
    },
    user
  );
  return saveExploreContent({
    ...content,
    places: [...content.places, newPlace],
  });
};

export const removePlace = async (content, placeId) => {
  return saveExploreContent({
    ...content,
    places: content.places.filter((p) => p.id !== placeId),
  });
};

export const reorderPlaces = async (content, placeId, direction) => {
  const place = content.places.find((p) => p.id === placeId);
  if (!place) return content;
  const siblings = sortPlaces(content.places.filter((p) => p.categoryId === place.categoryId));
  const index = siblings.findIndex((p) => p.id === placeId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= siblings.length) return content;
  [siblings[index], siblings[target]] = [siblings[target], siblings[index]];
  const orderMap = Object.fromEntries(siblings.map((p, order) => [p.id, order]));
  const places = content.places.map((p) =>
    orderMap[p.id] !== undefined ? { ...p, order: orderMap[p.id] } : p
  );
  return saveExploreContent({ ...content, places });
};

export const togglePlacePin = async (content, placeId, user) => {
  const place = content.places.find((p) => p.id === placeId);
  if (!place) return content;
  return updatePlace(content, placeId, { pinned: !place.pinned }, user, {
    publish: true,
    markManualFields: false,
  });
};

export const togglePlaceFeatured = async (content, placeId, user) => {
  const place = content.places.find((p) => p.id === placeId);
  if (!place) return content;
  return updatePlace(content, placeId, { featured: !place.featured }, user, {
    publish: true,
    markManualFields: false,
  });
};

export const togglePlaceHidden = async (content, placeId, user) => {
  const place = content.places.find((p) => p.id === placeId);
  if (!place) return content;
  return updatePlace(content, placeId, { hidden: !place.hidden }, user, {
    publish: true,
    markManualFields: false,
  });
};

export const approvePlace = async (content, placeId, user) => {
  const places = content.places.map((place) => {
    if (place.id !== placeId) return place;
    let next = { ...place, status: 'published', pendingUpdate: null };
    if (place.pendingUpdate?.changes) {
      const manualOverrides = { ...(place.manualOverrides || {}) };
      Object.entries(place.pendingUpdate.changes).forEach(([key, value]) => {
        if (!manualOverrides[key]) next[key] = value;
      });
    }
    return withEditorMeta(next, user);
  });
  return saveExploreContent({ ...content, places });
};

export const rejectPlaceUpdate = async (content, placeId, user) => {
  const places = content.places.map((place) => {
    if (place.id !== placeId) return place;
    if (place.pendingUpdate) {
      return withEditorMeta({ ...place, pendingUpdate: null }, user);
    }
    return withEditorMeta({ ...place, status: 'rejected', hidden: true }, user);
  });
  return saveExploreContent({ ...content, places });
};

export const approveAllPending = async (content, user) => {
  const places = content.places.map((place) => {
    if (!place.pendingUpdate && place.status !== 'pending') return place;
    let next = { ...place, status: 'published', pendingUpdate: null };
    if (place.pendingUpdate?.changes) {
      const manualOverrides = { ...(place.manualOverrides || {}) };
      Object.entries(place.pendingUpdate.changes).forEach(([key, value]) => {
        if (!manualOverrides[key]) next[key] = value;
      });
    }
    return withEditorMeta(next, user);
  });
  return saveExploreContent({ ...content, places });
};

// Simulated live data sources — proposes updates without overwriting manual fields
const LIVE_DATA_HINTS = {
  'attractions-tivoli-gardens': {
    summary:
      'Historic amusement park by Copenhagen Central Station with rides, gardens, concerts, restaurants and seasonal programming.',
    openingHours: 'Seasonal — check tivoli.dk for current hours',
    website: 'https://www.tivoli.dk/en',
  },
  'events-tivoli-summer-halloween-and-christmas-seasons': {
    staffTip:
      'Check Tivoli.dk for current seasonal dates; summer, Halloween and Christmas each have dedicated opening periods.',
    openingHours: 'Varies by season',
  },
  'transport-frederiksberg-metro-station': {
    staffTip:
      'M2 toward Vanløse serves the airport. M1/M3 connect to city center. Station is ~240m from hotel entrance.',
  },
  'dining-green-room-restaurant-bar': {
    openingHours: 'Restaurant hours vary — check greenroom-restaurant.dk',
  },
};

export const runAutoSync = async (content, user) => {
  const places = content.places.map((place) => {
    const hints = LIVE_DATA_HINTS[place.id];
    if (!hints) return place;

    const changes = {};
    Object.entries(hints).forEach(([key, value]) => {
      if (place.manualOverrides?.[key]) return;
      if ((place[key] || '') !== value) changes[key] = value;
    });

    if (Object.keys(changes).length === 0) return place;

    return {
      ...place,
      pendingUpdate: {
        changes,
        source: 'automatic',
        proposedAt: nowIso(),
      },
      updateSource: 'automatic',
      lastUpdated: nowIso(),
    };
  });

  return saveExploreContent({
    ...content,
    places,
    lastAutoSync: Timestamp.now(),
  });
};

export const formatLastUpdated = (iso, source) => {
  if (!iso) return { label: 'Not yet updated', type: 'unknown' };
  const date = new Date(iso);
  const formatted = date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const type = source === 'automatic' ? 'automatic' : 'manual';
  return {
    label: `${formatted} · ${type === 'automatic' ? 'Auto' : 'Manual'}`,
    type,
    formatted,
  };
};
