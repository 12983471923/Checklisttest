import React, { useEffect, useMemo, useState } from 'react';
import {
  subscribeRequests,
  createRequest,
  updateRequest,
  addRequestComment,
  deleteRequests,
  archiveRequests,
  restoreRequests,
  REQUEST_TYPES,
  REQUEST_PRIORITIES,
  REQUEST_VIEWS,
  countPendingRequests,
  countRequestsByView,
  filterRequestsByView,
  isRequestCompleted,
} from '../../firebase/hsk';
import HskConfirmDialog from './HskConfirmDialog';

const priorityClass = (p) => {
  const map = { Low: 'low', Medium: 'medium', High: 'high', Urgent: 'urgent' };
  return map[p] || 'medium';
};

const VIEW_LABELS = {
  active: 'Active',
  completed: 'Completed',
  archived: 'Archived',
  all: 'All',
};

export default function HskRequestsPanel({
  user,
  role,
  rooms = [],
  canCreate = false,
  isAdmin = false,
}) {
  const canManage = canCreate || isAdmin;
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('active');
  const [selected, setSelected] = useState(new Set());
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    roomNumber: '',
    requestType: REQUEST_TYPES[0],
    priority: 'Medium',
    notes: '',
  });
  const [commentDrafts, setCommentDrafts] = useState({});

  const displayName = user?.displayName || user?.email || 'Staff';

  useEffect(() => subscribeRequests(setRequests), []);

  useEffect(() => {
    setSelected(new Set());
  }, [filter]);

  const pendingCount = useMemo(
    () => countPendingRequests(requests, role),
    [requests, role]
  );

  const counts = useMemo(
    () =>
      REQUEST_VIEWS.reduce((acc, view) => {
        acc[view] = countRequestsByView(requests, view);
        return acc;
      }, {}),
    [requests]
  );

  const filtered = useMemo(
    () => filterRequestsByView(requests, filter),
    [requests, filter]
  );

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((r) => r.id)));
    }
  };

  const runAction = async (action) => {
    setBusy(true);
    try {
      await action();
      setSelected(new Set());
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const roomNumber = form.roomNumber.trim();
    if (!roomNumber) return;
    const matchedRoom = rooms.find(
      (r) => String(r.roomNumber).trim() === roomNumber
    );
    await createRequest(
      {
        ...form,
        roomNumber,
        roomId: matchedRoom?.id || '',
      },
      { uid: user?.uid, name: displayName }
    );
    setForm((f) => ({ ...f, roomNumber: '', notes: '' }));
  };

  const handleStatus = async (id, status) => {
    await updateRequest(id, { status });
  };

  const handleComment = async (id) => {
    const text = commentDrafts[id]?.trim();
    if (!text) return;
    await addRequestComment(id, text, { uid: user?.uid, name: displayName });
    setCommentDrafts((d) => ({ ...d, [id]: '' }));
  };

  const selectedRequests = filtered.filter((r) => selected.has(r.id));

  const renderRequestCard = (req) => (
    <div key={req.id} className={`hsk-request-card priority-${priorityClass(req.priority)}`}>
      {canManage && (filter === 'completed' || filter === 'archived') && (
        <label className="hsk-request-select">
          <input
            type="checkbox"
            checked={selected.has(req.id)}
            onChange={() => toggleSelect(req.id)}
            aria-label={`Select request for room ${req.roomNumber}`}
          />
        </label>
      )}

      <div className="hsk-request-top">
        <strong>{req.requestType}</strong>
        <span className={`hsk-status-pill status-${(req.status || '').replace(/\s+/g, '-')}`}>
          {req.archivedAt ? 'Archived' : req.status}
        </span>
      </div>
      <p className="hsk-request-room">
        Room {req.roomNumber || '—'} · {req.priority} priority
      </p>
      {req.notes && <p className="hsk-request-notes">{req.notes}</p>}
      <p className="hsk-request-meta">From {req.createdByName || 'Reception'}</p>

      {role === 'housekeeping' && !req.archivedAt && req.status === 'Pending' && (
        <button type="button" onClick={() => handleStatus(req.id, 'Accepted')}>
          Accept
        </button>
      )}
      {role === 'housekeeping' && !req.archivedAt && req.status === 'Accepted' && (
        <button type="button" onClick={() => handleStatus(req.id, 'In Progress')}>
          Start
        </button>
      )}
      {role === 'housekeeping' && !req.archivedAt && req.status === 'In Progress' && (
        <button type="button" onClick={() => handleStatus(req.id, 'Completed')}>
          Mark Completed
        </button>
      )}

      {canManage && isRequestCompleted(req) && (
        <div className="hsk-request-manage-actions">
          <button
            type="button"
            disabled={busy}
            onClick={() => archiveRequests([req], user)}
          >
            Archive
          </button>
          <button
            type="button"
            className="is-danger"
            disabled={busy}
            onClick={() =>
              setConfirm({
                title: 'Delete this task?',
                message: 'This completed task will be permanently removed.',
                confirmLabel: 'Delete',
                danger: true,
                action: () => deleteRequests([req.id]),
              })
            }
          >
            Delete
          </button>
        </div>
      )}

      {canManage && req.archivedAt && (
        <div className="hsk-request-manage-actions">
          <button type="button" disabled={busy} onClick={() => restoreRequests([req])}>
            Restore
          </button>
          <button
            type="button"
            className="is-danger"
            disabled={busy}
            onClick={() =>
              setConfirm({
                title: 'Delete archived task?',
                message: 'This archived task will be permanently removed.',
                confirmLabel: 'Delete',
                danger: true,
                action: () => deleteRequests([req.id]),
              })
            }
          >
            Delete
          </button>
        </div>
      )}

      {(req.comments || []).length > 0 && (
        <ul className="hsk-request-comments">
          {req.comments.map((c) => (
            <li key={c.id}>
              <strong>{c.authorName}:</strong> {c.text}
            </li>
          ))}
        </ul>
      )}

      {!req.archivedAt && (
        <div className="hsk-comment-row">
          <input
            type="text"
            placeholder="Add comment…"
            value={commentDrafts[req.id] || ''}
            onChange={(e) =>
              setCommentDrafts((d) => ({ ...d, [req.id]: e.target.value }))
            }
          />
          <button type="button" onClick={() => handleComment(req.id)}>Add</button>
        </div>
      )}
    </div>
  );

  return (
    <div className="hsk-requests">
      <div className="hsk-panel-head">
        <h4>Tasks</h4>
        {pendingCount > 0 && <span className="hsk-badge">{pendingCount}</span>}
      </div>

      {canCreate && (
        <form className="hsk-request-form" onSubmit={handleCreate}>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Room number"
            value={form.roomNumber}
            onChange={(e) => setForm((f) => ({ ...f, roomNumber: e.target.value }))}
            required
            aria-label="Room number"
          />
          <select
            value={form.requestType}
            onChange={(e) => setForm((f) => ({ ...f, requestType: e.target.value }))}
          >
            {REQUEST_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
          >
            {REQUEST_PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
          <button type="submit">Create Request</button>
        </form>
      )}

      <div className="hsk-filter-row hsk-filter-row--counts">
        {REQUEST_VIEWS.map((f) => (
          <button
            key={f}
            type="button"
            className={filter === f ? 'active' : ''}
            onClick={() => setFilter(f)}
          >
            {VIEW_LABELS[f]}
            <span className="hsk-filter-count">{counts[f]}</span>
          </button>
        ))}
      </div>

      {canManage && (filter === 'completed' || filter === 'archived') && filtered.length > 0 && (
        <div className="hsk-bulk-bar">
          <label className="hsk-bulk-select-all">
            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
            Select all ({filtered.length})
          </label>
          <div className="hsk-bulk-actions">
            {filter === 'completed' && (
              <button
                type="button"
                disabled={busy || selected.size === 0}
                onClick={() => runAction(() => archiveRequests(selectedRequests, user))}
              >
                Archive selected
              </button>
            )}
            {filter === 'archived' && (
              <button
                type="button"
                disabled={busy || selected.size === 0}
                onClick={() => runAction(() => restoreRequests(selectedRequests))}
              >
                Restore selected
              </button>
            )}
            <button
              type="button"
              className="is-danger"
              disabled={busy || selected.size === 0}
              onClick={() =>
                setConfirm({
                  title: 'Delete selected tasks?',
                  message: `${selected.size} task(s) will be permanently removed.`,
                  confirmLabel: 'Delete selected',
                  danger: true,
                  action: () => deleteRequests([...selected]),
                })
              }
            >
              Delete selected
            </button>
            <button
              type="button"
              className="is-danger"
              disabled={busy}
              onClick={() =>
                setConfirm({
                  title: filter === 'completed' ? 'Clear all completed tasks?' : 'Clear all archived tasks?',
                  message: `All ${filtered.length} task(s) in this view will be permanently removed.`,
                  confirmLabel: 'Clear all',
                  danger: true,
                  action: () => deleteRequests(filtered.map((r) => r.id)),
                })
              }
            >
              Clear all
            </button>
            {filter === 'completed' && (
              <button
                type="button"
                disabled={busy}
                onClick={() => runAction(() => archiveRequests(filtered, user))}
              >
                Archive all
              </button>
            )}
          </div>
        </div>
      )}

      <div className="hsk-requests-list">
        {filtered.length === 0 && (
          <p className="hsk-empty">
            {filter === 'active' ? 'No active tasks.' : `No ${filter} tasks.`}
          </p>
        )}
        {filtered.map(renderRequestCard)}
      </div>

      <HskConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        danger={confirm?.danger}
        onCancel={() => setConfirm(null)}
        onConfirm={() => runAction(confirm.action)}
      />
    </div>
  );
}
