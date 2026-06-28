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
        <span className="material-symbols-outlined" aria-hidden="true">explore</span>
      </button>
      
      <SimpleMapModal 
        isOpen={isMapOpen} 
        onClose={handleCloseMap} 
      />
    </>
  );
};

export default FloatingMapButton;
