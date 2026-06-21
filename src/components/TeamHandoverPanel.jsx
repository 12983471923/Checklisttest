import React, { useEffect, useMemo, useState } from 'react';
import {
  subscribeTeamHandovers,
  createTeamHandover,
  updateTeamHandover,
  deleteTeamHandover,
  HANDOVER_PRIORITIES,
  HANDOVER_STATUSES,
  formatHandoverTime,
} from '../firebase/teamHandovers';
import './team-handover.css';

const priorityClass = (p) => {
  const map = { Low: 'low', Medium: 'medium', High: 'high', Urgent: 'urgent' };
  return map[p] || 'medium';
};

const statusClass = (s) => (s || 'Open').replace(/\s+/g, '-').toLowerCase();

export default function TeamHandoverPanel({
  user,
  role,
  isAdmin = false,
  compact = false,
  embedded = false,
}) {
  const [handovers, setHandovers] = useState([]);
  const [filter, setFilter] = useState('active');
  const [form, setForm] = useState({ text: '', priority: 'Medium', audience: 'all' });
  const [saving, setSaving] = useState(false);

  const userId = user?.uid;
  const displayName = user?.displayName || user?.email || 'Staff';

  useEffect(() => subscribeTeamHandovers(setHandovers), []);

  const filtered = useMemo(() => {
    return handovers.filter((h) => {
      if (filter === 'active') return h.status !== 'Completed';
      if (filter === 'all') return true;
      return h.status === filter;
    });
  }, [handovers, filter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.text.trim() || saving) return;
    setSaving(true);
    try {
      await createTeamHandover(form, { uid: userId, name: displayName }, role);
      setForm({ text: '', priority: 'Medium', audience: 'all' });
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (id, status) => {
    await updateTeamHandover(id, { status });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this handover note?')) {
      await deleteTeamHandover(id);
    }
  };

  const audienceLabel = (a) => {
    if (a === 'housekeeping') return '→ HSK';
    if (a === 'reception') return '→ Reception';
    return '→ All teams';
  };

  return (
    <div className={`team-handover ${compact ? 'team-handover--compact' : ''} ${embedded ? 'team-handover--embedded' : ''}`}>
      {!embedded && (
        <div className="team-handover-head">
          <h4>Team Handovers</h4>
          <span className="team-handover-count">{filtered.length} shown</span>
        </div>
      )}

      <form className="team-handover-form" onSubmit={handleCreate}>
        <textarea
          value={form.text}
          onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
          placeholder="Write a handover note for the team…"
          rows={compact ? 2 : 3}
          required
        />
        <div className="team-handover-form-row">
          <select
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
          >
            {HANDOVER_PRIORITIES.map((p) => (
              <option key={p} value={p}>{p} priority</option>
            ))}
          </select>
          <select
            value={form.audience}
            onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}
          >
            <option value="all">All teams</option>
            <option value="housekeeping">Housekeeping</option>
            <option value="reception">Reception</option>
          </select>
          <button type="submit" disabled={saving || !form.text.trim()}>
            {saving ? 'Sending…' : 'Submit'}
          </button>
        </div>
      </form>

      <div className="team-handover-filters">
        {['active', 'Open', 'In Progress', 'Completed', 'all'].map((f) => (
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

      <div className="team-handover-list">
        {filtered.length === 0 && (
          <p className="team-handover-empty">No handover notes yet.</p>
        )}
        {filtered.map((h) => (
          <article
            key={h.id}
            className={`team-handover-card priority-${priorityClass(h.priority)} status-${statusClass(h.status)}`}
          >
            <div className="team-handover-card-top">
              <span className={`team-handover-status status-${statusClass(h.status)}`}>
                {h.status}
              </span>
              <span className={`team-handover-priority priority-${priorityClass(h.priority)}`}>
                {h.priority}
              </span>
            </div>
            <p className="team-handover-text">{h.text}</p>
            <div className="team-handover-meta">
              <span>{h.authorName || 'Staff'}</span>
              <span>{formatHandoverTime(h.createdAt)}</span>
              <span>{audienceLabel(h.audience)}</span>
            </div>
            <div className="team-handover-actions">
              {h.status === 'Open' && (
                <button type="button" onClick={() => handleStatus(h.id, 'In Progress')}>
                  Start
                </button>
              )}
              {h.status === 'In Progress' && (
                <button type="button" onClick={() => handleStatus(h.id, 'Completed')}>
                  Complete
                </button>
              )}
              {h.status === 'Completed' && (
                <button type="button" onClick={() => handleStatus(h.id, 'Open')}>
                  Reopen
                </button>
              )}
              {isAdmin && (
                <button type="button" className="danger" onClick={() => handleDelete(h.id)}>
                  Delete
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
