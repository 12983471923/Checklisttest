import React, { useState } from 'react';
import SimpleMapModal from './CategoryMapModal';
import './FloatingMapButton.css';

const FloatingMapButton = () => {
  const [isMapOpen, setIsMapOpen] = useState(false);

  const handleOpenMap = () => {
    setIsMapOpen(true);
  };

  const handleCloseMap = () => {
    setIsMapOpen(false);
  };

  return (
    <>
      <button
        className="floating-map-button"
        onClick={handleOpenMap}
        title="Explore Copenhagen"
        aria-label="Open map with recommended places in Copenhagen"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z"
            fill="currentColor"
          />
        </svg>
        <span className="floating-map-label">Explore</span>
      </button>
      
      <SimpleMapModal 
        isOpen={isMapOpen} 
        onClose={handleCloseMap} 
      />
    </>
  );
};

export default FloatingMapButton;
