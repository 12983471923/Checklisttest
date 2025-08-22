import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet - this is crucial for the map to work
const fixLeafletIcons = () => {
  // Delete the default icon prototype
  delete L.Icon.Default.prototype._getIconUrl;
  
  // Set the default icon options
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

// Call the fix immediately
fixLeafletIcons();

// Recommended places near Copenhagen with simple default markers
const recommendedPlaces = [
  {
    id: 1,
    name: "Noma",
    type: "🍽️ Restaurant",
    position: [55.6867, 12.6097],
    description: "World-renowned restaurant with innovative Nordic cuisine",
    website: "https://noma.dk"
  },
  {
    id: 2,
    name: "Geranium",
    type: "🍽️ Restaurant", 
    position: [55.7104, 12.5414],
    description: "Three Michelin-starred restaurant with stunning views",
    website: "https://geranium.dk"
  },
  {
    id: 3,
    name: "Tivoli Gardens",
    type: "🎡 Attraction",
    position: [55.6738, 12.5681],
    description: "Historic amusement park in the heart of Copenhagen",
    website: "https://tivoli.dk"
  },
  {
    id: 4,
    name: "The Little Mermaid",
    type: "🧜‍♀️ Attraction",
    position: [55.6928, 12.5993],
    description: "Iconic bronze statue based on Hans Christian Andersen's fairy tale",
    website: null
  },
  {
    id: 5,
    name: "Nyhavn",
    type: "🏘️ Attraction",
    position: [55.6796, 12.5912],
    description: "Historic waterfront canal with colorful townhouses",
    website: null
  },
  {
    id: 6,
    name: "Rosenborg Castle",
    type: "🏰 Attraction",
    position: [55.6856, 12.5773],
    description: "Renaissance castle housing the Crown Jewels",
    website: "https://www.rosenborgslot.dk"
  },
  {
    id: 7,
    name: "Strøget",
    type: "🛍️ Shopping",
    position: [55.6794, 12.5703],
    description: "Europe's longest pedestrian shopping street",
    website: null
  },
  {
    id: 8,
    name: "Torvehallerne",
    type: "🍴 Market",
    position: [55.6854, 12.5702],
    description: "Gourmet food market with local and international cuisine",
    website: "https://torvehallernekbh.dk"
  },
  {
    id: 9,
    name: "King's Garden",
    type: "🌳 Park",
    position: [55.6856, 12.5773],
    description: "Beautiful royal garden surrounding Rosenborg Castle",
    website: null
  },
  {
    id: 10,
    name: "Fælledparken",
    type: "🌳 Park",
    position: [55.7016, 12.5725],
    description: "Large public park perfect for walks and picnics",
    website: null
  }
];

const MapModal = ({ isOpen, onClose }) => {
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Force re-render of map when modal opens
      setMapKey(prev => prev + 1);
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="map-modal-overlay" onClick={onClose}>
      <div className="map-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="map-modal-header">
          <h2>🗺️ Recommended Places Near Copenhagen</h2>
          <button className="map-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="map-info-bar">
          <p>🎯 Click on markers to learn more about each location</p>
        </div>
        
        <div className="map-container">
          <MapContainer
            key={mapKey} // Force re-render when modal opens
            center={[55.6761, 12.5683]} // Copenhagen center
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {recommendedPlaces.map((place) => (
              <Marker
                key={place.id}
                position={place.position}
              >
                <Popup>
                  <div className="map-popup">
                    <h4>{place.type} {place.name}</h4>
                    <p>{place.description}</p>
                    {place.website && (
                      <a 
                        href={place.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="popup-link"
                      >
                        🌐 Visit Website
                      </a>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        
        <div className="map-footer">
          <div className="map-stats">
            📍 {recommendedPlaces.length} recommended locations
          </div>
          <div className="map-credits">
            Powered by OpenStreetMap & Leaflet
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapModal;
