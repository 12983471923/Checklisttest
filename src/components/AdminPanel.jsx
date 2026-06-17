import React, { useCallback, useEffect, useRef, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import { validateUserInput, stripHtml } from '../utils/security';
import {
  SHIFTS,
  ensureShiftConfig,
  getShiftConfig,
  saveShiftTasks,
  saveShiftInstructions,
  saveShiftDowntimeTimes,
  getDefaultShiftConfig
} from '../firebase/shiftConfig';
import {
  getBreakfastTimes,
  saveBreakfastTimes as saveBreakfastTimesToDB,
  getPricingInfo,
  savePricingInfo as savePricingInfoToDB,
  DEFAULT_PRICING,
} from '../firebase/database';
import { ADMIN_EMAIL } from '../config/admin';
import './admin.css';
import ThemeToggle from './ThemeToggle';

import ExploreAdminSection from './ExploreAdminSection';

const SECTIONS = [
  { id: 'tasks', label: 'Tasks', icon: '✅' },
  { id: 'explore', label: 'Explore Copenhagen', icon: '🗺️' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'instructions', label: 'Instructions', icon: '📋' },
  { id: 'downtime', label: 'Downtime Times', icon: '⏱️' },
  { id: 'breakfast', label: 'Breakfast Times', icon: '🍳' },
  { id: 'pricing', label: 'Pricing', icon: '💰' },
];

const AdminPanel = ({ onClose }) => {
  const { isAdmin } = useAuth();
  const [activeSection, setActiveSection] = useState('tasks');

  // Hard frontend guard — non-admins can never see this panel.
  if (!isAdmin) {
    return (
      <div className="admin-overlay" onClick={onClose}>
        <div className="admin-access-denied" onClick={(e) => e.stopPropagation()}>
          <h2>Access Denied</h2>
          <p>You do not have permission to access the admin panel.</p>
          <button className="admin-btn admin-btn-primary" onClick={onClose}>
            Back to Checklist
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-overlay">
      <div className="admin-panel">
        <header className="admin-topbar">
          <div className="admin-topbar-title">
            <span className="admin-topbar-icon">🛠️</span>
            <div>
              <h1>Admin Panel</h1>
              <p>Scandic Falkoner · {ADMIN_EMAIL}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ThemeToggle />
            <button className="admin-close-btn" onClick={onClose} title="Back to checklist">
              ✕ Exit
            </button>
          </div>
        </header>

        <div className="admin-body">
          <nav className="admin-nav">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                className={`admin-nav-item ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                <span className="admin-nav-icon">{section.icon}</span>
                {section.label}
              </button>
            ))}
          </nav>

          <main className="admin-content">
            {activeSection === 'tasks' && <TasksSection />}
            {activeSection === 'explore' && <ExploreAdminSection />}
            {activeSection === 'users' && <UsersSection />}
            {activeSection === 'instructions' && <InstructionsSection />}
            {activeSection === 'downtime' && <DowntimeSection />}
            {activeSection === 'breakfast' && <BreakfastSection />}
            {activeSection === 'pricing' && <PricingSection />}
          </main>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Shared save-status pill                                            */
/* ------------------------------------------------------------------ */
const SaveStatus = ({ status, message }) => {
  if (!status) return null;
  if (status === 'error' && message) {
    return <span className="admin-save-status error" title={message}>Save failed</span>;
  }
  return <span className={`admin-save-status ${status}`}>{status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved ✓' : 'Save failed'}</span>;
};

const useShiftPicker = () => {
  const [shift, setShift] = useState('Night');
  const picker = (
    <div className="admin-shift-picker">
      {SHIFTS.map((s) => (
        <button
          key={s}
          className={`admin-shift-btn ${shift === s ? 'active' : ''}`}
          onClick={() => setShift(s)}
        >
          {s}
        </button>
      ))}
    </div>
  );
  return [shift, picker];
};

/* ------------------------------------------------------------------ */
/* TASKS                                                              */
/* ------------------------------------------------------------------ */
const TasksSection = () => {
  const [shift, shiftPicker] = useShiftPicker();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const statusTimer = useRef(null);

  const flash = useCallback((value) => {
    setStatus(value);
    if (statusTimer.current) clearTimeout(statusTimer.current);
    if (value === 'saved' || value === 'error') {
      statusTimer.current = setTimeout(() => setStatus(null), 2000);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const config = await ensureShiftConfig(shift);
      setTasks(Array.isArray(config.tasks) ? config.tasks : []);
    } catch (error) {
      console.error('Error loading tasks config:', error);
      setTasks(getDefaultShiftConfig(shift).tasks);
    } finally {
      setLoading(false);
    }
  }, [shift]);

  useEffect(() => {
    load();
  }, [load]);

  const persist = useCallback(
    async (next) => {
      flash('saving');
      try {
        await saveShiftTasks(shift, next);
        flash('saved');
      } catch (error) {
        console.error('Error saving tasks:', error);
        flash('error');
      }
    },
    [shift, flash]
  );

  const commit = useCallback(
    (next) => {
      setTasks(next);
      persist(next);
    },
    [persist]
  );

  const nextId = useCallback(
    () => (tasks.length ? Math.max(...tasks.map((t) => Number(t.id) || 0)) + 1 : 1),
    [tasks]
  );

  const updateField = (index, field, value) => {
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  };

  const commitField = (index, field) => {
    const value = stripHtml(tasks[index]?.[field] || '');
    const next = tasks.map((t, i) => (i === index ? { ...t, [field]: value } : t));
    commit(next);
  };

  const addTask = () => {
    const next = [...tasks, { id: nextId(), text: 'New task', info: '' }];
    commit(next);
  };

  const deleteTask = (index) => {
    const task = tasks[index];
    if (!window.confirm(`Delete task "${task?.text || ''}"? This affects all staff.`)) return;
    commit(tasks.filter((_, i) => i !== index));
  };

  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= tasks.length) return;
    const next = [...tasks];
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  };

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <div>
          <h2>Manage Tasks</h2>
          <p>Add, edit, reorder or remove checklist tasks. Changes save automatically and appear live for all staff.</p>
        </div>
        <SaveStatus status={status} />
      </div>

      {shiftPicker}

      {loading ? (
        <div className="admin-loading">Loading tasks…</div>
      ) : (
        <>
          <div className="admin-task-list">
            {tasks.map((task, index) => (
              <div className="admin-task-card" key={task.id}>
                <div className="admin-task-reorder">
                  <button
                    className="admin-icon-btn"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    title="Move up"
                  >
                    ▲
                  </button>
                  <span className="admin-task-number">{index + 1}</span>
                  <button
                    className="admin-icon-btn"
                    onClick={() => move(index, 1)}
                    disabled={index === tasks.length - 1}
                    title="Move down"
                  >
                    ▼
                  </button>
                </div>

                <div className="admin-task-fields">
                  <input
                    className="admin-input"
                    type="text"
                    value={task.text}
                    placeholder="Task name"
                    onChange={(e) => updateField(index, 'text', e.target.value)}
                    onBlur={() => commitField(index, 'text')}
                  />
                  <textarea
                    className="admin-textarea"
                    value={task.info || ''}
                    placeholder="Task description / instructions (optional)"
                    rows={3}
                    onChange={(e) => updateField(index, 'info', e.target.value)}
                    onBlur={() => commitField(index, 'info')}
                  />
                </div>

                <button
                  className="admin-icon-btn admin-delete-btn"
                  onClick={() => deleteTask(index)}
                  title="Delete task"
                >
                  🗑️
                </button>
              </div>
            ))}

            {tasks.length === 0 && (
              <div className="admin-empty">No tasks yet. Add the first one below.</div>
            )}
          </div>

          <button className="admin-btn admin-btn-primary" onClick={addTask}>
            + Add Task
          </button>
        </>
      )}
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* USERS                                                              */
/* ------------------------------------------------------------------ */
const UsersSection = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      setUsers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setMessage('');
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const toggleActive = async (user) => {
    const next = user.isActive === false ? true : false;
    try {
      await updateDoc(doc(db, 'users', user.id), { isActive: next });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isActive: next } : u)));
      setMessage(`${user.displayName || user.email} ${next ? 'activated' : 'deactivated'}.`);
    } catch (error) {
      console.error('Error updating user:', error);
      setMessage('Failed to update user status.');
    }
  };

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <div>
          <h2>Manage Users</h2>
          <p>Activate or deactivate staff. Inactive users cannot log in. User creation/deletion stays in the Firebase Console.</p>
        </div>
      </div>

      {message && <div className="admin-message">{message}</div>}

      {loading ? (
        <div className="admin-loading">Loading users…</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const active = user.isActive !== false;
                return (
                  <tr key={user.id} className={active ? '' : 'admin-row-inactive'}>
                    <td>{user.displayName || '—'}</td>
                    <td>{user.email || '—'}</td>
                    <td>
                      <span className={`admin-role-badge role-${user.role || 'staff'}`}>
                        {user.role || 'staff'}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-status-badge ${active ? 'active' : 'inactive'}`}>
                        {active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`admin-btn ${active ? 'admin-btn-danger' : 'admin-btn-primary'}`}
                        onClick={() => toggleActive(user)}
                      >
                        {active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-empty">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* INSTRUCTIONS                                                       */
/* ------------------------------------------------------------------ */
const InstructionsSection = () => {
  const [shift, shiftPicker] = useShiftPicker();
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const config = await ensureShiftConfig(shift);
        if (!cancelled) setInstructions(config.instructions || '');
      } catch (error) {
        console.error('Error loading instructions:', error);
        if (!cancelled) setInstructions('');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shift]);

  const save = async () => {
    setStatus('saving');
    try {
      const validation = validateUserInput(instructions || ' ', 'longText');
      const safe = validation.valid ? validation.value : stripHtml(instructions).substring(0, 10000);
      await saveShiftInstructions(shift, safe);
      setStatus('saved');
      setTimeout(() => setStatus(null), 2000);
    } catch (error) {
      console.error('Error saving instructions:', error);
      setStatus('error');
      setTimeout(() => setStatus(null), 2000);
    }
  };

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <div>
          <h2>Shift Instructions / Notes</h2>
          <p>Shown read-only at the top of the staff checklist for the selected shift.</p>
        </div>
        <SaveStatus status={status} />
      </div>

      {shiftPicker}

      {loading ? (
        <div className="admin-loading">Loading instructions…</div>
      ) : (
        <>
          <textarea
            className="admin-textarea admin-textarea-large"
            value={instructions}
            placeholder={`Notes for the ${shift} shift that all staff should see…`}
            onChange={(e) => setInstructions(e.target.value)}
            rows={10}
          />
          <button className="admin-btn admin-btn-primary" onClick={save}>
            Save Instructions
          </button>
        </>
      )}
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* DOWNTIME TIMES                                                     */
/* ------------------------------------------------------------------ */
const DowntimeSection = () => {
  const [shift, shiftPicker] = useShiftPicker();
  const [times, setTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const config = await ensureShiftConfig(shift);
        if (!cancelled) setTimes(Array.isArray(config.downtimeTimes) ? config.downtimeTimes : []);
      } catch (error) {
        console.error('Error loading downtime times:', error);
        if (!cancelled) setTimes(getDefaultShiftConfig(shift).downtimeTimes);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shift]);

  const updateTime = (index, value) => {
    setTimes((prev) => prev.map((t, i) => (i === index ? value : t)));
  };

  const addTime = () => setTimes((prev) => [...prev, '00:00']);
  const removeTime = (index) => setTimes((prev) => prev.filter((_, i) => i !== index));

  const save = async () => {
    setStatus('saving');
    for (const time of times) {
      const validation = validateUserInput(time, 'time');
      if (!validation.valid) {
        setStatus('error');
        alert(`Invalid time "${time}": ${validation.error}`);
        setTimeout(() => setStatus(null), 2000);
        return;
      }
    }
    try {
      await saveShiftDowntimeTimes(shift, times);
      setStatus('saved');
      setTimeout(() => setStatus(null), 2000);
    } catch (error) {
      console.error('Error saving downtime times:', error);
      setStatus('error');
      setTimeout(() => setStatus(null), 2000);
    }
  };

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <div>
          <h2>Downtime Check Times</h2>
          <p>Set the times staff must print the downtime report for the {shift} shift.</p>
        </div>
        <SaveStatus status={status} />
      </div>

      {shiftPicker}

      {loading ? (
        <div className="admin-loading">Loading times…</div>
      ) : (
        <>
          <div className="admin-time-grid">
            {times.map((time, index) => (
              <div className="admin-time-item" key={index}>
                <label>Check {index + 1}</label>
                <div className="admin-time-row">
                  <input
                    className="admin-input"
                    type="time"
                    value={time}
                    onChange={(e) => updateTime(index, e.target.value)}
                  />
                  <button
                    className="admin-icon-btn admin-delete-btn"
                    onClick={() => removeTime(index)}
                    title="Remove time"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="admin-button-row">
            <button className="admin-btn" onClick={addTime}>
              + Add Time
            </button>
            <button className="admin-btn admin-btn-primary" onClick={save}>
              Save Times
            </button>
          </div>
        </>
      )}
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* BREAKFAST TIMES                                                    */
/* ------------------------------------------------------------------ */
const BreakfastSection = () => {
  const [times, setTimes] = useState({ start: '07:00', end: '11:00' });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const saved = await getBreakfastTimes();
        if (!cancelled) setTimes(saved);
      } catch (error) {
        console.error('Error loading breakfast times:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async () => {
    setStatus('saving');
    const startValid = validateUserInput(times.start, 'time');
    const endValid = validateUserInput(times.end, 'time');
    if (!startValid.valid || !endValid.valid) {
      setStatus('error');
      alert('Please enter valid breakfast times (HH:MM).');
      setTimeout(() => setStatus(null), 2000);
      return;
    }
    try {
      await saveBreakfastTimesToDB(times);
      setStatus('saved');
      setTimeout(() => setStatus(null), 2000);
    } catch (error) {
      console.error('Error saving breakfast times:', error);
      setStatus('error');
      setTimeout(() => setStatus(null), 2000);
    }
  };

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <div>
          <h2>Breakfast Times</h2>
          <p>Set the breakfast service start and end time shown to all staff.</p>
        </div>
        <SaveStatus status={status} />
      </div>

      {loading ? (
        <div className="admin-loading">Loading breakfast times…</div>
      ) : (
        <>
          <div className="admin-time-grid">
            <div className="admin-time-item">
              <label>Start</label>
              <input
                className="admin-input"
                type="time"
                value={times.start}
                onChange={(e) => setTimes((prev) => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div className="admin-time-item">
              <label>End</label>
              <input
                className="admin-input"
                type="time"
                value={times.end}
                onChange={(e) => setTimes((prev) => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
          <button className="admin-btn admin-btn-primary" onClick={save}>
            Save Breakfast Times
          </button>
        </>
      )}
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* PRICING INFORMATION                                                */
/* ------------------------------------------------------------------ */
const PRICING_FIELDS = [
  {
    group: 'Bike Rental',
    icon: '🚴',
    fields: [
      { key: 'bikeRegular', label: 'Regular rate (DKK per person)' },
      { key: 'bikeLufthansa', label: 'Lufthansa rate (DKK per person)' },
    ],
  },
  {
    group: 'Breakfast Pricing',
    icon: '🍳',
    fields: [
      { key: 'breakfastDuringBooking', label: 'During booking (DKK)' },
      { key: 'breakfastAtCheckIn', label: 'At check-in (DKK)' },
      { key: 'breakfastOnTheDay', label: 'On the day (DKK)' },
    ],
  },
];

const isValidPrice = (value) => /^\d{1,4}$/.test(String(value).trim());

const PricingSection = () => {
  const [pricing, setPricing] = useState({ ...DEFAULT_PRICING });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const saved = await getPricingInfo();
        if (!cancelled) setPricing(saved);
      } catch (error) {
        console.error('Error loading pricing info:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updatePrice = (key, value) => {
    setPricing((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setStatus('saving');
    setErrorMessage('');
    for (const group of PRICING_FIELDS) {
      for (const field of group.fields) {
        if (!isValidPrice(pricing[field.key])) {
          setStatus('error');
          setErrorMessage(`Invalid price for "${field.label}"`);
          alert(`Please enter a valid price for "${field.label}" (1-4 digits).`);
          setTimeout(() => setStatus(null), 2000);
          return;
        }
      }
    }

    const normalizedPricing = Object.fromEntries(
      Object.entries(pricing).map(([key, value]) => [key, String(value).trim()])
    );

    try {
      await savePricingInfoToDB(normalizedPricing);
      setPricing(normalizedPricing);
      setStatus('saved');
      setErrorMessage('');
      setTimeout(() => setStatus(null), 2000);
    } catch (error) {
      console.error('Error saving pricing info:', error);
      const message = error?.message || 'Unknown error while saving pricing.';
      setErrorMessage(message);
      setStatus('error');
      alert(`Could not save pricing: ${message}`);
      setTimeout(() => setStatus(null), 4000);
    }
  };

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <div>
          <h2>Pricing Information</h2>
          <p>Update bike rental and breakfast prices shown in the left sidebar.</p>
        </div>
        <SaveStatus status={status} message={errorMessage} />
      </div>

      {loading ? (
        <div className="admin-loading">Loading pricing…</div>
      ) : (
        <>
          {PRICING_FIELDS.map((group) => (
            <div className="admin-pricing-group" key={group.group}>
              <h3 className="admin-pricing-group-title">{group.icon} {group.group}</h3>
              <div className="admin-time-grid">
                {group.fields.map((field) => (
                  <div className="admin-time-item" key={field.key}>
                    <label htmlFor={`pricing-${field.key}`}>{field.label}</label>
                    <input
                      id={`pricing-${field.key}`}
                      className="admin-input"
                      type="number"
                      min="0"
                      max="9999"
                      inputMode="numeric"
                      value={pricing[field.key]}
                      onChange={(e) => updatePrice(field.key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button className="admin-btn admin-btn-primary" onClick={save}>
            Save Pricing
          </button>
        </>
      )}
    </section>
  );
};

export default AdminPanel;
