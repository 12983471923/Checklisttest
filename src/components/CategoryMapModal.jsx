import React, { useEffect, useMemo, useState } from 'react';
import { useExploreContent } from '../hooks/useExploreContent';
import { formatLastUpdated } from '../firebase/exploreContent';
import { useAuth } from '../hooks/useAuth';
import ExploreAdminSection from './ExploreAdminSection';

const HOTEL_ADDRESS = 'Scandic Falkoner, Falkoner Alle 9, 2000 Frederiksberg, Denmark';

const getDirectionsUrl = (place) => {
  const destination = place.mapQuery || place.address || place.name;
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(HOTEL_ADDRESS)}&destination=${encodeURIComponent(destination)}&travelmode=${place.travelMode || 'transit'}`;
};

const includesSearchTerm = (place, searchTerm) => {
  const haystack = [
    place.name,
    place.summary,
    place.staffTip,
    place.address,
    place.distance,
    place.openingHours,
    ...(place.tags || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(searchTerm.toLowerCase());
};

const PlaceCard = ({ place, categoryId }) => {
  const updated = formatLastUpdated(place.lastUpdated, place.updateSource);

  return (
    <article
      className={`explore-place-card ${place.pinned ? 'is-pinned' : ''} ${place.featured ? 'is-featured' : ''}`}
      key={`${categoryId}-${place.id}`}
    >
      <div className="explore-card-top">
        <div className="explore-place-icon" aria-hidden="true">{place.icon}</div>
        <div className="explore-card-heading">
          <div className="explore-card-title-row">
            <h4>{place.name}</h4>
            {place.pinned && <span className="explore-pin-badge" title="Pinned recommendation">📌</span>}
            {place.featured && <span className="explore-featured-badge" title="Featured">⭐</span>}
          </div>
          {place.distance && <p className="explore-distance">{place.distance}</p>}
          {place.lastUpdated && (
            <span className={`explore-card-updated ${updated.type}`} title={updated.label}>
              {updated.label}
            </span>
          )}
        </div>
      </div>

      {place.summary && <p className="explore-summary">{place.summary}</p>}

      {place.staffTip && (
        <div className="explore-staff-tip">
          <span>Front desk tip</span>
          <p>{place.staffTip}</p>
        </div>
      )}

      {place.tags?.length > 0 && (
        <div className="explore-tags">
          {place.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      )}

      <div className="explore-contact-list">
        {place.address && <span>📍 {place.address}</span>}
        {place.openingHours && <span>🕐 {place.openingHours}</span>}
        {place.phone && (
          <a href={`tel:${place.phone.replace(/\s/g, '')}`}>📞 {place.phone}</a>
        )}
        {place.email && <a href={`mailto:${place.email}`}>✉️ {place.email}</a>}
      </div>

      <div className="explore-card-actions">
        <a
          className="explore-map-link"
          href={getDirectionsUrl(place)}
          target="_blank"
          rel="noopener noreferrer"
        >
          View on Map
        </a>
        {place.website && (
          <a
            className="explore-secondary-link"
            href={place.website}
            target="_blank"
            rel="noopener noreferrer"
          >
            Official info
          </a>
        )}
      </div>
    </article>
  );
};

const CategoryMapModal = ({ isOpen, onClose }) => {
  const { isAuthenticated } = useAuth();
  const { categories, getPlacesByCategory, featuredPlaces, loading, content, usingLocalFallback } = useExploreContent();
  const [selectedCategory, setSelectedCategory] = useState('attractions');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    if (categories.length && !categories.find((c) => c.id === selectedCategory)) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const activeCategory = categories.find((c) => c.id === selectedCategory) || categories[0];

  const visiblePlaces = useMemo(() => {
    const places = getPlacesByCategory(selectedCategory);
    if (!searchTerm.trim()) return places;
    return places.filter((place) => includesSearchTerm(place, searchTerm.trim()));
  }, [getPlacesByCategory, selectedCategory, searchTerm]);

  const totalPlaces = useMemo(
    () => categories.reduce((sum, cat) => sum + cat.count, 0),
    [categories]
  );

  if (!isOpen) return null;

  if (showEditor && isAuthenticated) {
    return (
      <div className="map-modal-overlay explore-overlay" onClick={onClose}>
        <div className="explore-staff-editor" onClick={(e) => e.stopPropagation()}>
          <header className="explore-staff-editor-header">
            <div>
              <h2>Manage Explore Copenhagen</h2>
              <p>Edit recommendations, events, and categories. Changes may require manager approval.</p>
            </div>
            <div className="explore-staff-editor-actions">
              <button type="button" className="explore-secondary-link" onClick={() => setShowEditor(false)}>
                ← Back to guide
              </button>
              <button type="button" className="map-modal-close explore-close" onClick={onClose} aria-label="Close">
                ×
              </button>
            </div>
          </header>
          <div className="explore-staff-editor-body">
            <ExploreAdminSection />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="map-modal-overlay explore-overlay" onClick={onClose}>
      <div className="map-modal-content explore-modal-content explore-premium" onClick={(event) => event.stopPropagation()}>
        <div className="explore-hero">
          <div>
            <span className="explore-eyebrow">Digital concierge · Scandic Falkoner</span>
            <h2>Explore Copenhagen</h2>
            <p>
              Live recommendations for attractions, events, dining, transport and local essentials — curated for front desk and guests.
            </p>
            <div className="explore-hero-meta">
              <span>📍 Falkoner Alle 9</span>
              {content?.lastAutoSync && (
                <span>🔄 Live sync active</span>
              )}
              <span>🗺️ Directions via Google Maps</span>
            </div>
          </div>
          <div className="explore-hero-actions">
            {isAuthenticated && (
              <button
                type="button"
                className="explore-manage-btn"
                onClick={() => setShowEditor(true)}
                title="Manage content"
              >
                ✏️ Manage
              </button>
            )}
            <button className="map-modal-close explore-close" onClick={onClose} aria-label="Close Explore Copenhagen">
              ×
            </button>
          </div>
        </div>

        {featuredPlaces.length > 0 && !searchTerm && (
          <div className="explore-featured-strip">
            <h3>Featured recommendations</h3>
            <div className="explore-featured-scroll">
              {featuredPlaces.slice(0, 6).map((place) => (
                <button
                  key={place.id}
                  type="button"
                  className="explore-featured-chip"
                  onClick={() => {
                    setSelectedCategory(place.categoryId);
                    setSearchTerm('');
                  }}
                >
                  <span>{place.icon}</span>
                  <span>{place.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {usingLocalFallback && (
          <div className="explore-offline-banner" role="status">
            Showing saved recommendations — live sync will resume when Firestore is available.
          </div>
        )}

        <div className="explore-toolbar">
          <label className="explore-search">
            <span>Search</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Airport, pharmacy, jazz, dinner…"
            />
          </label>
          <div className="explore-quick-links" aria-label="Helpful links">
            <a href="https://www.rejseplanen.dk/webapp/?language=en_EN" target="_blank" rel="noopener noreferrer">
              Journey Planner
            </a>
            <a href="https://www.publictransport.dk/tickets" target="_blank" rel="noopener noreferrer">
              Tickets
            </a>
            <a href="https://www.visitcopenhagen.com/" target="_blank" rel="noopener noreferrer">
              VisitCopenhagen
            </a>
          </div>
        </div>

        {loading ? (
          <div className="explore-loading">
            <div className="explore-loading-spinner" />
            <p>Loading recommendations…</p>
          </div>
        ) : (
          <div className="explore-layout">
            <aside className="explore-sidebar" aria-label="Explore Copenhagen categories">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`explore-category-button ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <span className="explore-category-icon">{category.icon}</span>
                  <span className="explore-category-text">
                    <strong>{category.name}</strong>
                    <small>{category.count} recommendations</small>
                  </span>
                </button>
              ))}
            </aside>

            <section className="explore-results">
              {activeCategory && (
                <>
                  <div className="explore-section-header">
                    <div>
                      <h3>
                        <span>{activeCategory.icon}</span>
                        {activeCategory.name}
                      </h3>
                      <p>{activeCategory.description}</p>
                    </div>
                    <div className="explore-count">{visiblePlaces.length} shown</div>
                  </div>

                  {activeCategory.note && (
                    <div className="explore-advisory">
                      <strong>Staff note:</strong> {activeCategory.note}
                    </div>
                  )}

                  {visiblePlaces.length > 0 ? (
                    <div className="explore-card-grid">
                      {visiblePlaces.map((place) => (
                        <PlaceCard key={place.id} place={place} categoryId={selectedCategory} />
                      ))}
                    </div>
                  ) : (
                    <div className="explore-empty-state">
                      <h4>No matches found</h4>
                      <p>Try a broader search term or choose another category.</p>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        )}

        <div className="map-footer explore-footer">
          <div className="map-stats">
            📂 {categories.length} categories · 📍 {totalPlaces} recommendations
          </div>
          <div className="map-credits">Confirm opening hours, prices and event dates before booking</div>
        </div>
      </div>
    </div>
  );
};

export default CategoryMapModal;
