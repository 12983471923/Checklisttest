import React from 'react';
import { useHskChecklist } from '../../hooks/useHskChecklist';

export default function HskChecklistPanel() {
  const { checklist, loading, toggleTask, completedCount, totalCount } = useHskChecklist();
  const progress = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) {
    return <div className="hsk-checklist"><p className="hsk-empty">Loading checklist…</p></div>;
  }

  return (
    <div className="hsk-checklist">
      <div className="hsk-panel-head">
        <h3>Housekeeping Checklist</h3>
        <span className="hsk-progress-label">{completedCount}/{totalCount} · {progress}%</span>
      </div>
      <div className="hsk-progress-bar">
        <div className="hsk-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <ul className="hsk-checklist-list">
        {(checklist?.tasks || []).map((task) => (
          <li key={task.id} className={task.completed ? 'is-done' : ''}>
            <label>
              <input
                type="checkbox"
                checked={!!task.completed}
                onChange={() => toggleTask(task.id)}
              />
              <span>{task.text}</span>
            </label>
            {task.info && <p className="hsk-task-info">{task.info}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
