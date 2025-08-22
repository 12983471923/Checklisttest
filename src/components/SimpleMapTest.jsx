import React from 'react';
import './SimpleMapTest.css';

const SimpleMapTest = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="simple-modal-overlay" onClick={onClose}>
      <div className="simple-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="simple-modal-header">
          <h2>Test Modal</h2>
          <button className="simple-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="simple-modal-body">
          <h3>🗺️ Map Coming Soon!</h3>
          <p>This is a test to make sure the modal displays correctly.</p>
          <div className="recommended-places-list">
            <h4>Recommended Places in Copenhagen:</h4>
            <ul>
              <li>🍽️ <strong>Noma</strong> - World-renowned restaurant</li>
              <li>🎡 <strong>Tivoli Gardens</strong> - Historic amusement park</li>
              <li>🧜‍♀️ <strong>The Little Mermaid</strong> - Iconic statue</li>
              <li>🏰 <strong>Rosenborg Castle</strong> - Renaissance castle</li>
              <li>🛍️ <strong>Strøget</strong> - Pedestrian shopping street</li>
              <li>🌳 <strong>King's Garden</strong> - Beautiful royal garden</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleMapTest;
