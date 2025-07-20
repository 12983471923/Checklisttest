import React from 'react';

const ProgressBar = ({ percent, tasksCompleted, totalTasks }) => {
  return (
    <>
      <div className="progress-bar">
        <div 
          className="progress-bar-inner" 
          style={{ width: `${percent}%` }}
        ></div>
      </div>
      
      <div className="meta-bar">
        <span>{tasksCompleted} of {totalTasks} tasks completed</span>
        <span>{percent}%</span>
      </div>
    </>
  );
};

export default ProgressBar;
