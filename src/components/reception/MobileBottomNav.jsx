import React from 'react';

export default function MobileBottomNav({ active, onTasks, onHsk, onExplore }) {
  return (
    <nav className="ft-mobile-bottom-nav" aria-label="Mobile navigation">
      <button
        type="button"
        className={`ft-mobile-nav-item ${active === 'tasks' ? 'is-active' : ''}`}
        onClick={onTasks}
      >
        <span className="material-symbols-outlined">checklist</span>
        <span>Tasks</span>
      </button>
      <button type="button" className="ft-mobile-nav-item" onClick={onHsk}>
        <span className="material-symbols-outlined">cleaning_services</span>
        <span>HSK</span>
      </button>
      <button
        type="button"
        className={`ft-mobile-nav-item ${active === 'explore' ? 'is-active' : ''}`}
        onClick={onExplore}
      >
        <span className="material-symbols-outlined">explore</span>
        <span>Explore</span>
      </button>
    </nav>
  );
}
