import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ensureExploreContent,
  subscribeExploreContent,
  getPublishedCategories,
  getPublishedPlaces,
  getLocalExploreContent,
} from '../firebase/exploreContent';

export const useExploreContent = ({ publishedOnly = true } = {}) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingLocalFallback, setUsingLocalFallback] = useState(false);

  useEffect(() => {
    let unsub = () => {};
    let mounted = true;

    setContent(getLocalExploreContent());
    setLoading(false);

    ensureExploreContent().then((data) => {
      if (mounted) setContent(data);
    });

    unsub = subscribeExploreContent(
      (data) => {
        if (mounted) {
          setContent(data);
          setLoading(false);
        }
      },
      () => {
        if (mounted) {
          setUsingLocalFallback(true);
          setError('Using offline content — Firestore sync unavailable.');
        }
      }
    );

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const categories = useMemo(() => {
    if (!content) return [];
    const cats = publishedOnly ? getPublishedCategories(content) : content.categories;
    return cats.map((cat) => ({
      ...cat,
      count: (publishedOnly ? getPublishedPlaces(content) : content.places).filter(
        (p) => p.categoryId === cat.id
      ).length,
    }));
  }, [content, publishedOnly]);

  const places = useMemo(() => {
    if (!content) return [];
    return publishedOnly ? getPublishedPlaces(content) : content.places;
  }, [content, publishedOnly]);

  const featuredPlaces = useMemo(
    () => places.filter((p) => p.featured && !p.hidden),
    [places]
  );

  const getPlacesByCategory = useCallback(
    (categoryId) =>
      places
        .filter((p) => p.categoryId === categoryId)
        .sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return (a.order ?? 0) - (b.order ?? 0);
        }),
    [places]
  );

  return {
    content,
    categories,
    places,
    featuredPlaces,
    getPlacesByCategory,
    loading,
    error,
    usingLocalFallback,
  };
};
