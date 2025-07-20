import React, { useState } from 'react';

const InitialsForm = ({ onSubmit, currentInitials = '' }) => {
  const [initials, setInitials] = useState(currentInitials);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedInitials = initials.trim().toUpperCase();
    
    if (trimmedInitials.length < 2) {
      alert("Please enter at least 2 letters for initials.");
      return;
    }
    
    onSubmit(trimmedInitials);
  };

  return (
    <div className="initials-container">
      <div className="initials-box">
        <h2 className="initials-title">Enter Your Initials</h2>
        <p className="initials-subtitle">
          This will be used to track task completion
        </p>
        
        <form onSubmit={handleSubmit} className="initials-form">
          <div className="form-group">
            <label htmlFor="initials">Your Initials</label>
            <input
              id="initials"
              type="text"
              value={initials}
              onChange={(e) => setInitials(e.target.value)}
              placeholder="e.g., JD"
              className="form-input initials-input"
              maxLength="4"
              required
            />
          </div>
          
          <button type="submit" className="initials-btn">
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default InitialsForm;
