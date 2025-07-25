import React from 'react';

const ChecklistTable = ({ 
  tasks, 
  loading, 
  onToggleTask,
  onToggleTaskInProgress,
  onShowInfo, 
  onShowNoteModal, 
  onEditNote,
  initials
}) => {
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading checklist...</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="checklist-table">
        <thead>
          <tr>
            <th>Task</th>
            <th>Working</th>
            <th>Done</th>
            <th>By</th>
            <th>Notes</th>
            <th>Info</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className={task.completed ? "task-completed" : ""}>
              <td className="task-text-cell">
                <span className={`task-text ${task.completed ? "task-text-completed" : ""}`}>
                  {task.text}
                </span>
              </td>
              <td>
                <button
                  className={`working-btn ${task.inProgressBy === initials ? "working-active" : (task.inProgressBy ? "working-other" : "")}`}
                  onClick={() => onToggleTaskInProgress(task.id)}
                  disabled={task.completed || (task.inProgressBy && task.inProgressBy !== initials)}
                  title={task.inProgressBy && task.inProgressBy !== initials ? `${task.inProgressBy} is working on this task` : task.inProgressBy === initials ? "Stop working on this task" : "Start working on this task"}
                >
                  {task.inProgressBy === initials ? (
                    <>
                      <span>🛑</span>
                      <span>Stop</span>
                    </>
                  ) : task.inProgressBy ? (
                    <>
                      <span>👤</span>
                      <span>{task.inProgressBy}</span>
                    </>
                  ) : (
                    <>
                      <span>�</span>
                      <span>Work</span>
                    </>
                  )}
                </button>
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => onToggleTask(task.id)}
                  aria-label={`Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`}
                />
              </td>
              <td>
                {task.completed && (
                  <span className="initials-chip">{task.doneBy}</span>
                )}
              </td>
              <td>
                {task.note ? (
                  <button 
                    onClick={() => onEditNote(task.id, task.note)}
                    className="note-btn-with-note"
                    title={`Note: ${task.note}`}
                  >
                    📝
                  </button>
                ) : (
                  <button 
                    onClick={() => onShowNoteModal(task.id)}
                    className="add-note-btn"
                  >
                    Add Note
                  </button>
                )}
              </td>
              <td>
                <button 
                  onClick={() => onShowInfo(task)}
                  className="info-btn"
                >
                  ℹ️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ChecklistTable;
