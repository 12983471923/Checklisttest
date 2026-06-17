import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ensureExploreContent,
  subscribeExploreContent,
  getPublishedCategories,
  getPublishedPlaces,
} from '../firebase/exploreContent';

export const useExploreContent = ({ publishedOnly = true } = {}) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsub = () => {};
    let mounted = true;

    const init = async () => {
      try {
        await ensureExploreContent();
      } catch (err) {
        console.error('Explore content init failed:', err);
        if (mounted) setError(err.message);
      }
    };

    init().then(() => {
      unsub = subscribeExploreContent(
        (data) => {
          if (mounted) {
            setContent(data);
            setLoading(false);
            setError(null);
          }
        },
        (err) => {
          console.error('Explore content subscription error:', err);
          if (mounted) {
            setError(err.message);
            setLoading(false);
          }
        }
      );
    });

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
  };
};
