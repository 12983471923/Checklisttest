import React from 'react';

const Sidebar = ({ 
  breakfastTimes, 
  onBreakfastEdit,
  handoverDate,
  onHandoverDateChange,
  savedHandovers,
  onHandoverEdit,
  onHandoverViewAll,
  wakeUpCalls,
  onWakeUpAdd,
  onWakeUpViewAll
}) => {
  return (
    <div className="left-sidebar">
      {/* Hotel Information Card */}
      <div className="header-card">
        <strong>🏨 Hotel Information</strong>
        
        <div className="hotel-info-section">
          <div className="info-item">
            <span className="info-icon">📞</span>
            <div className="info-content">
              <span className="info-label">Main Phone:</span>
              <span className="info-value">+45 38 15 80 01</span>
            </div>
          </div>
          
          <div className="info-item">
            <span className="info-icon">📍</span>
            <div className="info-content">
              <span className="info-label">Address:</span>
              <span className="info-value">Falkoner Allé 9, 2000 Frederiksberg</span>
            </div>
          </div>
          
          <div className="info-item">
            <span className="info-icon">🌐</span>
            <div className="info-content">
              <span className="info-label">WiFi Password:</span>
              <span className="info-value">scandic2024</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hotel Times Card */}
      <div className="header-card">
        <strong>⏰ Hotel Times</strong>
        
        <div className="hotel-times-section">
          <div className="time-item">
            <span className="time-icon">🍳</span>
            <div className="time-content">
              <span className="time-label">Breakfast</span>
              <div className="breakfast-display">
                <span 
                  className="time-value time-value-clickable"
                  onClick={onBreakfastEdit}
                  title="Click to edit breakfast times"
                >
                  {breakfastTimes.start} - {breakfastTimes.end}
                </span>
              </div>
            </div>
          </div>
          
          <div className="time-item">
            <span className="time-icon">🚪</span>
            <div className="time-content">
              <span className="time-label">Check-Out</span>
              <span className="time-value">12:00</span>
            </div>
          </div>
          
          <div className="time-item">
            <span className="time-icon">🔑</span>
            <div className="time-content">
              <span className="time-label">Check-In</span>
              <span className="time-value">16:00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Information Card */}
      <div className="header-card">
        <strong>Pricing Information</strong>
        
        <div className="pricing-section">
          <div className="pricing-category">
            <strong>🚴 Bike Rental</strong>
            <div className="price-list">
              <div className="price-item">
                <span className="price-label">Regular rate:</span>
                <span className="price-value">175 DKK per person</span>
              </div>
              <div className="price-item">
                <span className="price-label">Lufthansa rate:</span>
                <span className="price-value">100 DKK per person</span>
              </div>
            </div>
          </div>

          <div className="pricing-category">
            <strong>🍳 Breakfast Pricing</strong>
            <div className="price-list">
              <div className="price-item">
                <span className="price-label">During booking:</span>
                <span className="price-value">140 DKK</span>
              </div>
              <div className="price-item">
                <span className="price-label">At check-in:</span>
                <span className="price-value">179 DKK</span>
              </div>
              <div className="price-item">
                <span className="price-label">On the day:</span>
                <span className="price-value">229 DKK</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Handover Card */}
      <div className="header-card">
        <strong>📝 Daily Handover</strong>
        
        <div className="handover-section">
          <div className="handover-date-selector">
            <input
              type="date"
              value={handoverDate}
              onChange={(e) => onHandoverDateChange(e.target.value)}
              className="handover-date-input"
            />
          </div>
          
          <div className="handover-preview">
            {savedHandovers[handoverDate] ? (
              <div className="handover-preview-text">
                {savedHandovers[handoverDate].substring(0, 80)}
                {savedHandovers[handoverDate].length > 80 ? "..." : ""}
              </div>
            ) : (
              <div className="handover-preview-empty">
                No notes for this date
              </div>
            )}
          </div>
          
          <button 
            onClick={onHandoverEdit}
            className="handover-btn"
          >
            📝 Edit Handover Notes
          </button>
          
          <button 
            onClick={onHandoverViewAll}
            className="handover-view-all-btn"
          >
            📋 View All Handovers
          </button>
        </div>
      </div>

      {/* Wake-Up Calls Card */}
      <div className="header-card">
        <strong>📞 Wake-Up Calls</strong>
        
        <div className="wakeup-section">
          <div className="wakeup-list">
            {wakeUpCalls.length === 0 ? (
              <div className="wakeup-empty">
                <span className="wakeup-empty-text">No wake-up calls scheduled</span>
              </div>
            ) : (
              wakeUpCalls.slice(0, 3).map((call) => (
                <div key={call.id} className={`wakeup-item ${call.completed ? 'completed' : ''}`}>
                  <div className="wakeup-info">
                    <div className="wakeup-room">Room {call.roomNumber}</div>
                    <div className="wakeup-time">{call.time}</div>
                    <div className="wakeup-date">{call.date}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="wakeup-buttons">
            <button 
              onClick={onWakeUpAdd}
              className="wakeup-add-btn"
            >
              ➕ Add Wake-Up Call
            </button>
            
            <button 
              onClick={onWakeUpViewAll}
              className="handover-view-all-btn"
            >
              📞 View All Calls
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
