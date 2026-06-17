import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { stripHtml } from '../utils/security';
import {
  ensureExploreContent,
  subscribeExploreContent,
  updateCategory,
  addCategory,
  removeCategory,
  reorderCategories,
  updatePlace,
  addPlace,
  removePlace,
  reorderPlaces,
  togglePlacePin,
  togglePlaceFeatured,
  togglePlaceHidden,
  approvePlace,
  rejectPlaceUpdate,
  approveAllPending,
  runAutoSync,
  formatLastUpdated,
  getPendingPlaces,
  getLocalExploreContent,
} from '../firebase/exploreContent';
import './explore-admin.css';

const SaveStatus = ({ status }) => {
  if (!status) return null;
  return (
    <span className={`explore-admin-save-status ${status}`}>
      {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved ✓' : 'Save failed'}
    </span>
  );
};

const LastUpdatedBadge = ({ item }) => {
  const meta = formatLastUpdated(item.lastUpdated, item.updateSource);
  return (
    <span className={`explore-updated-badge ${meta.type}`} title={meta.label}>
      {meta.label}
    </span>
  );
};

const TagsInput = ({ value, onChange, onCommit }) => {
  const tags = Array.isArray(value) ? value : [];
  const [draft, setDraft] = useState(tags.join(', '));

  useEffect(() => {
    setDraft(tags.join(', '));
  }, [tags.join(', ')]);

  const commit = () => {
    const parsed = draft
      .split(',')
      .map((t) => stripHtml(t.trim()))
      .filter(Boolean);
    onChange(parsed);
    onCommit(parsed);
  };

  return (
    <input
      className="admin-input"
      type="text"
      value={draft}
      placeholder="Tag1, Tag2, Tag3"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
    />
  );
};

const PlaceEditor = ({ place, categories, onSave, onDelete, onMove, onToggle, canApprove }) => {
  const [draft, setDraft] = useState(place);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setDraft(place);
  }, [place]);

  const setField = (field, value) => setDraft((prev) => ({ ...prev, [field]: value }));

  const saveField = async (field, value) => {
    const clean = typeof value === 'string' ? stripHtml(value) : value;
    await onSave(place.id, { [field]: clean }, { publish: canApprove });
  };

  const hasPending = place.status === 'pending' || place.pendingUpdate;

  return (
    <article className={`explore-admin-place-card ${place.hidden ? 'is-hidden' : ''} ${hasPending ? 'is-pending' : ''}`}>
      <div className="explore-admin-place-header" onClick={() => setExpanded(!expanded)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setExpanded(!expanded)}>
        <div className="explore-admin-place-title">
          <span className="explore-admin-place-icon">{draft.icon}</span>
          <div>
            <strong>{draft.name || 'Untitled'}</strong>
            <div className="explore-admin-place-meta">
              {place.pinned && <span className="explore-admin-chip pin">📌 Pinned</span>}
              {place.featured && <span className="explore-admin-chip featured">⭐ Featured</span>}
              {place.hidden && <span className="explore-admin-chip hidden">Hidden</span>}
              {hasPending && <span className="explore-admin-chip pending">Pending review</span>}
              <LastUpdatedBadge item={place} />
            </div>
          </div>
        </div>
        <div className="explore-admin-place-actions">
          <button type="button" className="admin-icon-btn" onClick={(e) => { e.stopPropagation(); onMove(-1); }} title="Move up">▲</button>
          <button type="button" className="admin-icon-btn" onClick={(e) => { e.stopPropagation(); onMove(1); }} title="Move down">▼</button>
          <button type="button" className={`admin-icon-btn ${place.pinned ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onToggle('pin'); }} title="Pin to top">📌</button>
          <button type="button" className={`admin-icon-btn ${place.featured ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onToggle('featured'); }} title="Featured">⭐</button>
          <button type="button" className={`admin-icon-btn ${place.hidden ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onToggle('hidden'); }} title="Hide">👁</button>
          <span className="explore-admin-expand">{expanded ? '−' : '+'}</span>
        </div>
      </div>

      {place.pendingUpdate && (
        <div className="explore-admin-pending-banner">
          <strong>Automatic update proposed</strong>
          <ul>
            {Object.entries(place.pendingUpdate.changes || {}).map(([key, val]) => (
              <li key={key}>
                <code>{key}</code>: {String(val).slice(0, 120)}
                {place.manualOverrides?.[key] && ' (manual override — skipped)'}
              </li>
            ))}
          </ul>
          {canApprove && (
            <div className="explore-admin-pending-actions">
              <button type="button" className="admin-btn admin-btn-primary" onClick={() => onSave(place.id, {}, { approve: true })}>Approve</button>
              <button type="button" className="admin-btn" onClick={() => onSave(place.id, {}, { reject: true })}>Reject</button>
            </div>
          )}
        </div>
      )}

      {expanded && (
        <div className="explore-admin-place-fields">
          <div className="explore-admin-field-grid">
            <label>
              Name
              <input className="admin-input" value={draft.name} onChange={(e) => setField('name', e.target.value)} onBlur={() => saveField('name', draft.name)} />
            </label>
            <label>
              Icon
              <input className="admin-input" value={draft.icon} onChange={(e) => setField('icon', e.target.value)} onBlur={() => saveField('icon', draft.icon)} />
            </label>
            <label>
              Category
              <select
                className="admin-input"
                value={draft.categoryId}
                onChange={(e) => { setField('categoryId', e.target.value); saveField('categoryId', e.target.value); }}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </label>
            <label>
              Distance / travel time
              <input className="admin-input" value={draft.distance} onChange={(e) => setField('distance', e.target.value)} onBlur={() => saveField('distance', draft.distance)} />
            </label>
            <label className="full-width">
              Address
              <input className="admin-input" value={draft.address} onChange={(e) => setField('address', e.target.value)} onBlur={() => saveField('address', draft.address)} />
            </label>
            <label>
              Phone
              <input className="admin-input" value={draft.phone} onChange={(e) => setField('phone', e.target.value)} onBlur={() => saveField('phone', draft.phone)} />
            </label>
            <label>
              Email
              <input className="admin-input" value={draft.email} onChange={(e) => setField('email', e.target.value)} onBlur={() => saveField('email', draft.email)} />
            </label>
            <label>
              Website
              <input className="admin-input" value={draft.website} onChange={(e) => setField('website', e.target.value)} onBlur={() => saveField('website', draft.website)} />
            </label>
            <label className="full-width">
              Opening hours
              <input className="admin-input" value={draft.openingHours} onChange={(e) => setField('openingHours', e.target.value)} onBlur={() => saveField('openingHours', draft.openingHours)} />
            </label>
            <label className="full-width">
              Summary
              <textarea className="admin-textarea" rows={3} value={draft.summary} onChange={(e) => setField('summary', e.target.value)} onBlur={() => saveField('summary', draft.summary)} />
            </label>
            <label className="full-width">
              Staff tip
              <textarea className="admin-textarea" rows={2} value={draft.staffTip} onChange={(e) => setField('staffTip', e.target.value)} onBlur={() => saveField('staffTip', draft.staffTip)} />
            </label>
            <label className="full-width">
              Tags (comma-separated)
              <TagsInput
                value={draft.tags}
                onChange={(tags) => setField('tags', tags)}
                onCommit={(tags) => saveField('tags', tags)}
              />
            </label>
          </div>

          {Object.keys(place.manualOverrides || {}).filter((k) => place.manualOverrides[k]).length > 0 && (
            <div className="explore-admin-overrides">
              <strong>Manual overrides active:</strong>{' '}
              {Object.keys(place.manualOverrides).filter((k) => place.manualOverrides[k]).join(', ')}
              <p>Auto-sync will not overwrite these fields unless you approve an update.</p>
            </div>
          )}

          <div className="explore-admin-place-footer">
            {canApprove && place.status === 'pending' && (
              <button type="button" className="admin-btn admin-btn-primary" onClick={() => onSave(place.id, { status: 'published' }, { publish: true })}>
                Publish
              </button>
            )}
            <button type="button" className="admin-icon-btn admin-delete-btn" onClick={() => onDelete(place.id)} title="Remove">
              🗑️ Remove
            </button>
          </div>
        </div>
      )}
    </article>
  );
};

const ExploreAdminSection = () => {
  const { currentUser, userName, isManager } = useAuth();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [activeCategory, setActiveCategory] = useState('attractions');
  const [view, setView] = useState('content');
  const [syncWarning, setSyncWarning] = useState('');
  const statusTimer = useRef(null);

  const editor = useMemo(
    () => ({
      uid: currentUser?.uid,
      name: userName,
      email: currentUser?.email,
      isManager,
    }),
    [currentUser, userName, isManager]
  );

  const flash = useCallback((value) => {
    setStatus(value);
    if (statusTimer.current) clearTimeout(statusTimer.current);
    if (value === 'saved' || value === 'error') {
      statusTimer.current = setTimeout(() => setStatus(null), 2000);
    }
  }, []);

  useEffect(() => {
    let unsub = () => {};
    setContent(getLocalExploreContent());
    setLoading(false);

    ensureExploreContent().then((data) => {
      setContent(data);
      setSyncWarning('');
    });

    unsub = subscribeExploreContent(
      (data) => {
        setContent(data);
        setSyncWarning('');
      },
      () => {
        setSyncWarning('Showing offline content — Firestore sync unavailable. Deploy updated Firestore rules to enable live sync.');
      }
    );

    return () => unsub();
  }, []);

  const activeContent = content || getLocalExploreContent();

  const pendingPlaces = useMemo(
    () => getPendingPlaces(activeContent),
    [activeContent]
  );

  const categoryPlaces = useMemo(() => {
    return activeContent.places
      .filter((p) => p.categoryId === activeCategory)
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return (a.order ?? 0) - (b.order ?? 0);
      });
  }, [activeContent, activeCategory]);

  const activeCat = activeContent.categories.find((c) => c.id === activeCategory);

  const runAction = async (action) => {
    if (!activeContent) return;
    flash('saving');
    try {
      const next = await action(activeContent);
      setContent(next);
      flash('saved');
    } catch (err) {
      console.error(err);
      setSyncWarning(err.message || 'Save failed — changes may only be stored on this device.');
      flash('error');
    }
  };

  const handlePlaceSave = async (placeId, updates, opts = {}) => {
    if (opts.approve) {
      await runAction((c) => approvePlace(c, placeId, editor));
      return;
    }
    if (opts.reject) {
      await runAction((c) => rejectPlaceUpdate(c, placeId, editor));
      return;
    }
    await runAction((c) => updatePlace(c, placeId, updates, editor, { publish: opts.publish }));
  };

  const handleAddPlace = (type) => {
    runAction((c) => addPlace(c, { categoryId: activeCategory, type }, editor));
  };

  const handlePlaceToggle = (placeId, type) => {
    const fn = type === 'pin' ? togglePlacePin : type === 'featured' ? togglePlaceFeatured : togglePlaceHidden;
    runAction((c) => fn(c, placeId, editor));
  };

  if (loading && !content) {
    return <div className="admin-loading">Loading Explore Copenhagen content…</div>;
  }

  return (
    <section className="admin-section explore-admin-section">
      {syncWarning && (
        <div className="explore-admin-sync-warning" role="status">
          {syncWarning}
        </div>
      )}
      <div className="admin-section-head">
        <div>
          <h2>Explore Copenhagen</h2>
          <p>
            Manage attractions, events, dining, transport and recommendations. Staff edits go to review;
            managers can publish immediately. Manual fields are protected from automatic updates.
          </p>
        </div>
        <SaveStatus status={status} />
      </div>

      <div className="explore-admin-toolbar">
        <div className="explore-admin-view-tabs">
          <button type="button" className={view === 'content' ? 'active' : ''} onClick={() => setView('content')}>
            Content
          </button>
          <button type="button" className={view === 'pending' ? 'active' : ''} onClick={() => setView('pending')}>
            Review {pendingPlaces.length > 0 && <span className="explore-admin-badge">{pendingPlaces.length}</span>}
          </button>
          <button type="button" className={view === 'categories' ? 'active' : ''} onClick={() => setView('categories')}>
            Categories
          </button>
        </div>
        <div className="explore-admin-toolbar-actions">
          <button
            type="button"
            className="admin-btn"
            onClick={() => runAction((c) => runAutoSync(c, editor))}
            title="Check live sources and propose updates"
          >
            🔄 Sync live data
          </button>
        </div>
      </div>

      {view === 'pending' && (
        <div className="explore-admin-pending-list">
          {pendingPlaces.length === 0 ? (
            <div className="admin-empty">No items awaiting review.</div>
          ) : (
            <>
              {isManager && (
                <button type="button" className="admin-btn admin-btn-primary" onClick={() => runAction((c) => approveAllPending(c, editor))}>
                  Approve all ({pendingPlaces.length})
                </button>
              )}
              {pendingPlaces.map((place) => (
                <PlaceEditor
                  key={place.id}
                  place={place}
                  categories={activeContent.categories}
                  onSave={handlePlaceSave}
                  onDelete={(id) => {
                    if (window.confirm(`Remove "${place.name}"?`)) runAction((c) => removePlace(c, id));
                  }}
                  onMove={(dir) => runAction((c) => reorderPlaces(c, place.id, dir))}
                  onToggle={(type) => handlePlaceToggle(place.id, type)}
                  canApprove={isManager}
                />
              ))}
            </>
          )}
        </div>
      )}

      {view === 'categories' && (
        <div className="explore-admin-categories">
          {[...activeContent.categories].sort((a, b) => a.order - b.order).map((cat, index) => (
            <div key={cat.id} className="explore-admin-category-row">
              <div className="explore-admin-category-reorder">
                <button type="button" className="admin-icon-btn" disabled={index === 0} onClick={() => runAction((c) => reorderCategories(c, cat.id, -1))}>▲</button>
                <button type="button" className="admin-icon-btn" disabled={index === activeContent.categories.length - 1} onClick={() => runAction((c) => reorderCategories(c, cat.id, 1))}>▼</button>
              </div>
              <input
                className="admin-input explore-admin-cat-icon"
                value={cat.icon}
                onChange={(e) => setContent({ ...activeContent, categories: activeContent.categories.map((c) => c.id === cat.id ? { ...c, icon: e.target.value } : c) })}
                onBlur={() => runAction((c) => updateCategory(c, cat.id, { icon: cat.icon }, editor, { publish: isManager }))}
              />
              <input
                className="admin-input"
                value={cat.name}
                onChange={(e) => setContent({ ...activeContent, categories: activeContent.categories.map((c) => c.id === cat.id ? { ...c, name: e.target.value } : c) })}
                onBlur={() => runAction((c) => updateCategory(c, cat.id, { name: stripHtml(cat.name) }, editor, { publish: isManager }))}
              />
              <input
                className="admin-input"
                value={cat.description}
                placeholder="Description"
                onChange={(e) => setContent({ ...activeContent, categories: activeContent.categories.map((c) => c.id === cat.id ? { ...c, description: e.target.value } : c) })}
                onBlur={() => runAction((c) => updateCategory(c, cat.id, { description: stripHtml(cat.description) }, editor, { publish: isManager }))}
              />
              {cat.custom && (
                <button type="button" className="admin-icon-btn admin-delete-btn" onClick={() => {
                  if (window.confirm(`Delete category "${cat.name}" and all its places?`)) {
                    runAction((c) => removeCategory(c, cat.id));
                  }
                }}>🗑️</button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={() => runAction((c) => addCategory(c, { name: 'Custom category', icon: '📁' }, editor))}
          >
            + Add category
          </button>
        </div>
      )}

      {view === 'content' && (
        <div className="explore-admin-layout">
          <nav className="explore-admin-sidebar">
            {[...activeContent.categories].sort((a, b) => a.order - b.order).map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`explore-admin-cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <small>{activeContent.places.filter((p) => p.categoryId === cat.id).length}</small>
              </button>
            ))}
          </nav>

          <div className="explore-admin-main">
            {activeCat && (
              <div className="explore-admin-category-editor">
                <label>
                  Staff note
                  <textarea
                    className="admin-textarea"
                    rows={2}
                    value={activeCat.note}
                    onChange={(e) =>
                      setContent({
                        ...activeContent,
                        categories: activeContent.categories.map((c) =>
                          c.id === activeCategory ? { ...c, note: e.target.value } : c
                        ),
                      })
                    }
                    onBlur={() =>
                      runAction((c) =>
                        updateCategory(c, activeCategory, { note: stripHtml(activeCat.note) }, editor, { publish: isManager })
                      )
                    }
                  />
                </label>
              </div>
            )}

            <div className="explore-admin-add-row">
              <button type="button" className="admin-btn admin-btn-primary" onClick={() => handleAddPlace('place')}>
                + Add New Place
              </button>
              <button type="button" className="admin-btn" onClick={() => handleAddPlace('event')}>
                + Add New Event
              </button>
            </div>

            <div className="explore-admin-place-list">
              {categoryPlaces.map((place) => (
                <PlaceEditor
                  key={place.id}
                  place={place}
                  categories={activeContent.categories}
                  onSave={handlePlaceSave}
                  onDelete={(id) => {
                    if (window.confirm(`Remove "${place.name}"?`)) runAction((c) => removePlace(c, id));
                  }}
                  onMove={(dir) => runAction((c) => reorderPlaces(c, place.id, dir))}
                  onToggle={(type) => handlePlaceToggle(place.id, type)}
                  canApprove={isManager}
                />
              ))}
              {categoryPlaces.length === 0 && (
                <div className="admin-empty">No places in this category yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ExploreAdminSection;
