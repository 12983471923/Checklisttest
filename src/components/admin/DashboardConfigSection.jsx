import React, { useCallback, useEffect, useState } from 'react';
import {
  getDashboardConfig,
  saveDashboardConfig,
  normalizeDashboardConfig,
  DEFAULT_DASHBOARD_CONFIG,
  DEFAULT_HOTEL_INFO,
} from '../../firebase/dashboardConfig';

const SaveStatus = ({ status }) => {
  if (!status) return null;
  return (
    <span className={`admin-save-status ${status}`}>
      {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved ✓' : 'Save failed'}
    </span>
  );
};

function WidgetListEditor({ title, items, onChange, lockedIds = [] }) {
  const move = (index, dir) => {
    const sorted = [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const target = index + dir;
    if (target < 0 || target >= sorted.length) return;
    [sorted[index], sorted[target]] = [sorted[target], sorted[index]];
    onChange(sorted.map((w, i) => ({ ...w, order: i })));
  };

  const toggle = (id) => {
    onChange(
      items.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w))
    );
  };

  const sorted = [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="admin-dashboard-group">
      <h3>{title}</h3>
      <ul className="admin-dashboard-widget-list">
        {sorted.map((w, index) => {
          const locked = lockedIds.includes(w.id) || w.locked;
          return (
            <li key={w.id} className={w.visible === false ? 'is-hidden' : ''}>
              <span className="admin-dashboard-widget-label">
                {w.label || w.id}
                {locked && <em className="admin-dashboard-locked"> (required)</em>}
              </span>
              <div className="admin-dashboard-widget-actions">
                <button type="button" disabled={index === 0} onClick={() => move(index, -1)}>↑</button>
                <button type="button" disabled={index === sorted.length - 1} onClick={() => move(index, 1)}>↓</button>
                <label className="admin-dashboard-toggle">
                  <input
                    type="checkbox"
                    checked={w.visible !== false}
                    disabled={locked}
                    onChange={() => toggle(w.id)}
                  />
                  Show
                </label>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function DashboardConfigSection() {
  const [config, setConfig] = useState(() => normalizeDashboardConfig(null));
  const [saveStatus, setSaveStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardConfig().then((data) => {
      setConfig(data);
      setLoading(false);
    });
  }, []);

  const persist = useCallback(async (next) => {
    setSaveStatus('saving');
    try {
      await saveDashboardConfig(next);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch {
      setSaveStatus('error');
    }
  }, []);

  const updateHotelField = (field, value) => {
    const next = {
      ...config,
      hotelInfo: { ...config.hotelInfo, [field]: value },
    };
    setConfig(next);
  };

  const saveHotelInfo = () => persist(config);

  const updateWidgets = (section, items) => {
    const next = { ...config, [section]: { widgets: items } };
    setConfig(next);
    persist(next);
  };

  const updateTabs = (items) => {
    const next = { ...config, floatingHsk: { tabs: items } };
    setConfig(next);
    persist(next);
  };

  const resetDefaults = async () => {
    if (!window.confirm('Reset dashboard layout to defaults?')) return;
    const next = normalizeDashboardConfig(DEFAULT_DASHBOARD_CONFIG);
    setConfig(next);
    await persist(next);
  };

  if (loading) {
    return <div className="admin-loading">Loading dashboard settings…</div>;
  }

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <div>
          <h2>Dashboard Layout</h2>
          <p>Control which sections appear on the Front Desk, HSK Portal, and HSK floating panel.</p>
        </div>
        <SaveStatus status={saveStatus} />
      </div>

      <div className="admin-dashboard-grid">
        <div className="admin-dashboard-group">
          <h3>Hotel information (all dashboards)</h3>
          <div className="admin-form-grid">
            {Object.keys(DEFAULT_HOTEL_INFO).map((key) => (
              <label key={key} className="admin-field">
                <span>{key}</span>
                <input
                  className="admin-input"
                  value={config.hotelInfo[key] || ''}
                  onChange={(e) => updateHotelField(key, e.target.value)}
                  onBlur={saveHotelInfo}
                />
              </label>
            ))}
          </div>
        </div>

        <WidgetListEditor
          title="Front Desk sidebar"
          items={config.reception.widgets}
          onChange={(items) => updateWidgets('reception', items)}
        />

        <WidgetListEditor
          title="HSK Portal layout"
          items={config.hsk.widgets}
          onChange={(items) => updateWidgets('hsk', items)}
          lockedIds={['chat']}
        />

        <WidgetListEditor
          title="HSK floating panel tabs (Front Desk)"
          items={config.floatingHsk.tabs}
          onChange={updateTabs}
        />
      </div>

      <div className="admin-dashboard-footer">
        <button type="button" className="admin-btn" onClick={resetDefaults}>
          Reset to defaults
        </button>
      </div>
    </section>
  );
}
