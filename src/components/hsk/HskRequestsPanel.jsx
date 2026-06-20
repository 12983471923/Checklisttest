import React, { useEffect, useMemo, useState } from 'react';
import {
  subscribeRequests,
  createRequest,
  updateRequest,
  addRequestComment,
  REQUEST_TYPES,
  REQUEST_PRIORITIES,
  REQUEST_STATUSES,
  countPendingRequests,
} from '../../firebase/hsk';

const priorityClass = (p) => {
  const map = { Low: 'low', Medium: 'medium', High: 'high', Urgent: 'urgent' };
  return map[p] || 'medium';
};

export default function HskRequestsPanel({
  user,
  role,
  rooms = [],
  canCreate = false,
}) {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({
    roomId: '',
    requestType: REQUEST_TYPES[0],
    priority: 'Medium',
    notes: '',
  });
  const [commentDrafts, setCommentDrafts] = useState({});

  const displayName = user?.displayName || user?.email || 'Staff';

  useEffect(() => subscribeRequests(setRequests), []);

  const pendingCount = useMemo(
    () => countPendingRequests(requests, role),
    [requests, role]
  );

  const filtered = requests.filter((r) => {
    if (filter === 'all') return true;
    if (filter === 'active') return r.status !== 'Completed';
    return r.status === filter;
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    const room = rooms.find((r) => r.id === form.roomId);
    await createRequest(
      {
        ...form,
        roomNumber: room?.roomNumber || '',
      },
      { uid: user?.uid, name: displayName }
    );
    setForm((f) => ({ ...f, notes: '' }));
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

  return (
    <div className="hsk-requests">
      <div className="hsk-panel-head">
        <h4>Requests</h4>
        {pendingCount > 0 && <span className="hsk-badge">{pendingCount}</span>}
      </div>

      {canCreate && (
        <form className="hsk-request-form" onSubmit={handleCreate}>
          <select
            value={form.roomId}
            onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}
            required
          >
            <option value="">Select room</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                Room {r.roomNumber}
              </option>
            ))}
          </select>
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

      <div className="hsk-filter-row">
        {['all', 'active', ...REQUEST_STATUSES].map((f) => (
          <button
            key={f}
            type="button"
            className={filter === f ? 'active' : ''}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="hsk-requests-list">
        {filtered.length === 0 && <p className="hsk-empty">No requests found.</p>}
        {filtered.map((req) => (
          <div key={req.id} className={`hsk-request-card priority-${priorityClass(req.priority)}`}>
            <div className="hsk-request-top">
              <strong>{req.requestType}</strong>
              <span className={`hsk-status-pill status-${(req.status || '').replace(/\s+/g, '-')}`}>
                {req.status}
              </span>
            </div>
            <p className="hsk-request-room">
              Room {req.roomNumber || '—'} · {req.priority} priority
            </p>
            {req.notes && <p className="hsk-request-notes">{req.notes}</p>}
            <p className="hsk-request-meta">From {req.createdByName || 'Reception'}</p>

            {role === 'housekeeping' && req.status === 'Pending' && (
              <button type="button" onClick={() => handleStatus(req.id, 'Accepted')}>
                Accept
              </button>
            )}
            {role === 'housekeeping' && req.status === 'Accepted' && (
              <button type="button" onClick={() => handleStatus(req.id, 'In Progress')}>
                Start
              </button>
            )}
            {role === 'housekeeping' && req.status === 'In Progress' && (
              <button type="button" onClick={() => handleStatus(req.id, 'Completed')}>
                Mark Completed
              </button>
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
          </div>
        ))}
      </div>
    </div>
  );
}
