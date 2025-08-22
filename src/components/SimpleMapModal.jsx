import React from 'react';

const SimpleMapModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const places = [
    { name: "Frederiksberg Gardens", type: "� Park", description: "Beautiful romantic park right next to the hotel with lakes, bridges and walking paths" },
    { name: "Copenhagen Zoo", type: "🦁 Attraction", description: "One of Europe's oldest zoos, just 5 minutes walk from the hotel", website: "https://www.zoo.dk" },
    { name: "Frederiksberg Palace", type: "� Attraction", description: "Baroque palace and gardens, 10 minutes walk through Frederiksberg Gardens" },
    { name: "Cisternerne", type: "🎨 Art Gallery", description: "Unique underground art space in former water reservoirs, 8 minutes walk", website: "https://cisternerne.dk" },
    { name: "KB18", type: "�️ Restaurant", description: "Cozy neighborhood restaurant with excellent Danish cuisine, 3 minutes walk" },
    { name: "Restaurant Formel B", type: "�️ Restaurant", description: "Michelin-starred restaurant specializing in Nordic cuisine, 12 minutes walk", website: "https://formelb.dk" },
    { name: "Foodmarket", type: "🛍️ Shopping", description: "Large shopping center with restaurants and shops, 15 minutes by metro", website: "https://foodmarket.dk" },
    { name: "Vesterbro District", type: "�️ Area", description: "Trendy neighborhood with cafes, bars and vintage shops, 10 minutes by metro" },
    { name: "Carlsberg Brewery", type: "� Attraction", description: "Historic brewery with tours and tastings, 15 minutes by bus", website: "https://visitcarlsberg.dk" },
    { name: "Frederiksberg Allé", type: "🛍️ Shopping", description: "Main shopping street with boutiques and cafes, 5 minutes walk" },
    { name: "Solbjerg Lake", type: "� Nature", description: "Peaceful lake perfect for morning walks, located within Frederiksberg Gardens" },
    { name: "Forum Copenhagen", type: "🎪 Venue", description: "Concert and event venue, 10 minutes walk from the hotel", website: "https://forumcopenhagen.dk" }
  ];

  return (
    <div className="map-modal-overlay" onClick={onClose}>
      <div className="map-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="map-modal-header">
          <h2>🎯 Near Scandic Falkoner</h2>
          <button className="map-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="map-info-bar">
          <p>✨ Discover amazing places within walking distance of your hotel</p>
        </div>
        
        <div className="simple-places-container">
          <div className="places-grid">
            {places.map((place, index) => (
              <div key={index} className="place-card">
                <h4>{place.type} {place.name}</h4>
                <p>{place.description}</p>
                {place.website && (
                  <a 
                    href={place.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="place-link"
                  >
                    🌐 Visit Website
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="map-footer">
          <div className="map-stats">📍 {places.length} nearby locations</div>
          <div className="map-credits">Curated for Scandic Falkoner guests</div>
        </div>
      </div>
    </div>
  );
};

export default SimpleMapModal;
