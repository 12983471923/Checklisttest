import React from 'react';

const SHIFTS = ['Night', 'Morning', 'Evening'];

const ShiftSelector = ({ currentShift, onShiftChange }) => {
  return (
    <div className="shift-selector">
      {SHIFTS.map((shiftName) => (
        <button
          key={shiftName}
          onClick={() => onShiftChange(shiftName)}
          className={`shift-btn ${currentShift === shiftName ? 'active' : ''}`}
        >
          {shiftName}
        </button>
      ))}
    </div>
  );
};

export default ShiftSelector;
