import React, { useState } from 'react';

const SimpleMapModal = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  if (!isOpen) return null;

  const categories = [
    { id: 'restaurants', name: 'Restaurants', icon: '🍽️', description: 'Dining options near the hotel' },
    { id: 'bars', name: 'Bars & Nightlife', icon: '🍺', description: 'Pubs, bars and nightlife venues' },
    { id: 'hotels', name: 'Other Scandic Hotels', icon: '🏨', description: 'Other Scandic properties in Copenhagen' },
    { id: 'attractions', name: 'Attractions', icon: '🎡', description: 'Tourist sites and entertainment' },
    { id: 'shopping', name: 'Shopping', icon: '🛍️', description: 'Shops and markets' },
    { id: 'transport', name: 'Transport', icon: '🚇', description: 'Metro, bus stops and stations' },
    { id: 'medical', name: 'Medical', icon: '🏥', description: 'Pharmacies and hospitals' },
    { id: 'services', name: 'Services', icon: '🔧', description: 'Banks, post office, etc.' }
  ];

  const places = {
    restaurants: [
  { name: "Green Room Restaurant & Bar", description: "French-inspired bistro housed within Scandic Falkoner. Offers seasonal menus, relaxing ambiance, and occasional live jazz or performances.", distance: "On-site", website: "https://greenroom-restaurant.dk", icon: "🍽️" },
  { name: "Bouillon", description: "Warm, casual dining spot serving hearty European-style meals known locally and convenient for quick meals.", distance: "3 min walk", icon: "🍽️" },
  { name: "Frb Rådhuskælder", description: "Charming basement café/bar with a quiet, local atmosphere great for relaxed lunches or light dinners.", distance: "3 min walk", website: "https://frbraadhuskaelder.dk", icon: "☕" },
  { name: "Café Vivaldi", description: "Cozy café/bar offering coffee, wine, simple bites, and a calm environment great for informal meets.", distance: "1 min walk", website: "https://cafevivaldi.dk", icon: "☕" },
  { name: "Lagkagehuset", description: "Popular Danish bakery chain serving top-quality pastries, coffee, and snacks ideal for casual or non-alcoholic options.", distance: "1 min walk", website: "https://lagkagehuset.dk", icon: "🥐" },
  { name: "McDonald's", description: "International fast-food chain good for convenient, quick bites or for younger guests.", distance: "1 min walk", icon: "🍔" },
  { name: "Restaurant Frederiks Have", description: "Refined gourmet restaurant in an elegant 19th-century setting. Known for seasonal Nordic menus, thoughtful ambiance, and Bib Gourmand recognition.", distance: "5 min walk", website: "http://frederikshave.dk", icon: "🍷" },
  { name: "Mielcke & Hurtigkarl", description: "Artistic fine-dining nestled in the Frederiksberg Gardens. Features creative tasting menus inspired by global influences.", distance: "8 min walk", website: "https://www.mhcph.com", icon: "🍷" },
  { name: "Sokkelund Brasserie", description: "Classic Danish brasserie offering all-day dining from brunch to dinner in a comfortable, welcoming setting.", distance: "5 min walk", website: "http://sokkelund.dk", icon: "🍽️" },
  { name: "Josty (Café in Frederiksberg Gardens)", description: "Historic café venue set within Frederiksberg Gardens. Known for its charming veranda and brunch great for scenic, leisurely meals.", distance: "10 min walk", website: "http://josty.dk", icon: "☕" }
    ],
    bars: [
  { name: "Green Room", description: "Elegant cocktail bar located inside Scandic Falkoner. Theatre-inspired décor, creative cocktails, and live jazz or DJs on select nights. Perfect if you don't want to leave the hotel.", distance: "On-site", website: "https://greenroom-restaurant.dk", icon: "🍸" },
  { name: "Bootleggers", description: "Casual craft beer bar with 24 rotating taps, free popcorn, and big screens showing sports. Great for beer lovers or a laid-back evening out.", distance: "~1 min walk", website: "https://bootleggers.dk", icon: "🍺" },
  { name: "Café Vivaldi", description: "Cozy café/bar just around the corner. Offers coffee, wine, cocktails, and simple bites in a relaxed setting ideal for a quiet drink or small group.", distance: "~1 min walk", website: "https://cafevivaldi.dk", icon: "☕" },
  { name: "Lagkagehuset", description: "Famous Danish bakery chain, also serving coffee and light refreshments. Not a bar, but perfect for snacks, a morning stop, or a non-alcoholic option nearby.", distance: "~1 min walk", website: "https://lagkagehuset.dk", icon: "🥐" },
  { name: "Frb Rådhuskælder", description: "Charming basement café/bar close to Frederiksberg Town Hall. Quieter, more local vibe good for casual drinks away from the bustle.", distance: "~3 min walk", website: "https://frbraadhuskaelder.dk", icon: "☕" },
  { name: "Frederik VI", description: "Classic Danish pub with a retro atmosphere. Around 26 beers on tap, hearty pub food, and a history dating back to the 1970s. A true locals' hangout.", distance: "~5 min walk", website: "https://frederik-vi.dk", icon: "🥃" },
  { name: "Duck and Cover", description: "Award-winning cocktail bar with a speakeasy feel. Expertly mixed drinks in a dimly lit, intimate space great for a stylish evening out.", distance: "~10 min walk", website: "https://duckandcover.dk", icon: "🍸" },
  { name: "Curfew", description: "Trendy, upscale cocktail bar with innovative mixes and sleek décor. Known for its buzzing atmosphere and creative presentation of drinks.", distance: "~10 min walk", website: "https://curfew.dk", icon: "🍸" },
  { name: "Ruby", description: "One of Copenhagen's most famous cocktail bars. Elegant setting inside a historic townhouse, offering refined cocktails in a stylish yet relaxed lounge.", distance: "~10 min walk", website: "https://rby.dk", icon: "🍸" },
  { name: "Lidkoeb", description: "Popular multi-floor cocktail bar with a cozy courtyard. Offers both lively social vibes and quieter corners upstairs great for groups or date nights.", distance: "~10 min walk", website: "https://lidkoeb.dk", icon: "🍸" }
    ],
    hotels: [
  { name: "Scandic Nørreport", description: "Central, boutique with rooftop bar", distance: "20 min by metro", phone: "+45 33 43 18 00", email: "norreport@scandichotels.com" },
  { name: "Scandic Kødbyen", description: "Trendy Meatpacking District, nightlife hub", distance: "22 min by metro", phone: "+45 33 77 66 11", email: "kodbyen@scandichotels.com" },
  { name: "Scandic Palace", description: "Historic, at City Hall Square, pet-friendly", distance: "18 min by metro", phone: "+45 33 14 40 50", email: "palace@scandichotels.com" },
  { name: "Scandic Webers", description: "Hip Vesterbro, terraces, near Tivoli & Central Station", distance: "20 min by metro", phone: "+45 33 31 14 32", email: "webers@scandichotels.com" },
  { name: "Scandic Copenhagen", description: "Large, lakeside views, big conference hotel", distance: "18 min by metro", phone: "+45 33 14 35 35", email: "copenhagen@scandichotels.com" },
  { name: "Scandic Spectrum", description: "Modern by the canal, cafés, concerts", distance: "25 min by metro", phone: "+45 32 88 11 88", email: "spectrum@scandichotels.com" },
  { name: "Scandic Front", description: "Near Nyhavn & Amalienborg, gym & parking", distance: "25 min by metro", phone: "+45 32 46 10 00", email: "front@scandichotels.com" },
  { name: "Scandic Sydhavnen", description: "Near airport, free parking, conference rooms", distance: "30 min by metro", phone: "+45 32 46 10 00", email: "sydhavnen@scandichotels.com" },
  { name: "Scandic Sluseholmen", description: "Modern, free parking, conference-friendly", distance: "28 min by metro", phone: "+45 32 46 81 00", email: "sluseholmen@scandichotels.com" }
    ],
    attractions: [
      { name: "Frederiksberg Gardens (Frederiksberg Have)", description: "A beautiful 64‑hectare landscaped park with winding paths, canals, lakes, waterfalls, and graceful 18th‑century architecture perfect for a peaceful stroll or picnic.", icon: "🌳" },
      { name: "Frederiksberg Palace (Frederiksberg Slot)", description: "This grand Baroque summer palace (built 1699–1735) overlooks the gardens and now houses the Royal Danish Military Academy. A walk around here blends history with stunning views.", icon: "🏰" },
      { name: "Copenhagen Zoo", description: "One of Europe's oldest zoos, featuring over 3,000 animals, the iconic Elephant House by Norman Foster, and the Arctic Ring with underwater polar bear viewing. Right next to the gardens.", icon: "🦁" },
      { name: "Storm P. Museum", description: "Dedicated to cartoonist and humorist Robert Storm Petersen ('Storm P.'), this quirky museum showcases his cartoons, paintings, satirical works, and even his reconstructed studio.", icon: "🎨" },
      { name: "Cisternerne (Museum of Modern Glass Art)", description: "A unique underground museum housed in former water cisterns beneath Søndermarken park. Stained glass art and sculptures in atmospheric, cathedral-like surroundings.", icon: "🕳️" },
      { name: "Bakkehuset", description: "A historic house museum dating back to the 1520s, closely associated with Denmark's Golden Age cultural salons. It served various roles over time from inn to private residence.", icon: "🏛️" },
      { name: "Møstings Hus", description: "A small Neoclassical country house now used as an intimate exhibition and cultural venue complete with a tranquil pond ideal for events or a quiet visit.", icon: "🖼️" },
      { name: "Frederiksberg – City Within a City", description: "Beyond the formal sights, the area embodies a unique 'city within a city' experience known for its green oases, charming architecture, independent shops, cafés, and relaxed ambiance.", icon: "☕" },
      { name: "Copenhagen Canal Picnic Boat (GoBoat)", description: "Rent your own solar-powered picnic boat for a fun and scenic outing along Copenhagen's canals bring your own snacks or order ahead. A memorable and enjoyable experience.", icon: "🛶" },
      { name: "Carlsberg Brewery Visitors Centre & Other Nearby Spots", description: "A bit beyond walking distance but easily accessible by metro: explore Carlsberg's history, enjoy the vibrant Frederiksberg Allé, or visit nearby attractions like the Planetarium or City Museum.", icon: "🔬" }
    ],
    shopping: [
  { name: "Frederiksberg Allé", description: "Main shopping street with boutiques and cafes", distance: "5 min walk", icon: "🛍️" },
  { name: "Foodmarket", description: "Large shopping center with restaurants and shops", distance: "15 min by metro", website: "https://foodmarket.dk", icon: "🏬" },
  { name: "Frederiksberg Centret", description: "Local shopping center with supermarket and stores", distance: "7 min walk", icon: "🏬" },
  { name: "Vesterbro District", description: "Trendy area with vintage shops and designer boutiques", distance: "10 min by metro", icon: "👗" },
  { name: "Gammel Kongevej", description: "Shopping street with various stores and services", distance: "8 min walk", icon: "🛒" },
  { name: "Netto Supermarket", description: "Convenient grocery store for daily needs", distance: "3 min walk", icon: "🛒" }
    ],
    transport: [
  { name: "Frederiksberg Metro Station", description: "Metro line M1/M2 - Direct connection to city center", distance: "12 min walk", icon: "🚇" },
  { name: "Forum Station", description: "Metro line M1/M2 - Alternative metro access", distance: "8 min walk", icon: "🚇" },
  { name: "Bus Stop Frederiksberg Allé", description: "Multiple bus lines including 6A, 18, 26", distance: "5 min walk", icon: "🚌" },
  { name: "Bus Stop Falkoner Allé", description: "Bus line 6A - Direct to city center", distance: "2 min walk", icon: "🚌" },
  { name: "Taxi Stand", description: "24/7 taxi service available", distance: "Right outside hotel", icon: "🚕" },
  { name: "Bike Rental", description: "City bike rental station", distance: "4 min walk", icon: "🚲" }
    ],
    medical: [
  { name: "Frederiksberg Apotek", description: "Full-service pharmacy with prescription services", distance: "6 min walk", icon: "💊" },
  { name: "Boots Apotek", description: "Pharmacy chain with health and beauty products", distance: "8 min walk", icon: "💊" },
  { name: "Frederiksberg Hospital", description: "Major hospital with emergency services", distance: "15 min by bus", icon: "🏥" },
  { name: "Lægevagt (Emergency Doctor)", description: "After-hours medical service", distance: "10 min by taxi", phone: "1813", icon: "🚑" },
  { name: "Dental Emergency", description: "Emergency dental service", distance: "12 min by metro", phone: "35 38 02 51", icon: "🦷" },
  { name: "24/7 Pharmacy", description: "Steno Apotek - 24-hour pharmacy", distance: "20 min by metro", icon: "💊" }
    ],
    services: [
  { name: "Danske Bank", description: "Full-service bank with ATM", distance: "5 min walk", icon: "🏦" },
  { name: "Post Nord", description: "Post office and package services", distance: "7 min walk", icon: "📮" },
  { name: "Currency Exchange", description: "Forex currency exchange", distance: "12 min by metro", icon: "💱" },
  { name: "Laundromat", description: "Self-service laundry facility", distance: "6 min walk", icon: "🧺" },
  { name: "Tourist Information", description: "Copenhagen tourist information center", distance: "15 min by metro", icon: "ℹ️" },
  { name: "Police Station", description: "Local police station", distance: "10 min walk", phone: "114", icon: "🚓" }
    ]
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
  };

  return (
    <div className="map-modal-overlay" onClick={onClose}>
      <div className="map-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="map-modal-header">
          <h2>
            {selectedCategory ? (
              <>
                <button className="back-button" onClick={handleBackToCategories}>
                  ← Back
                </button>
                {categories.find(c => c.id === selectedCategory)?.icon} {categories.find(c => c.id === selectedCategory)?.name}
              </>
            ) : (
              '🎯 Near Scandic Falkoner'
            )}
          </h2>
          <button className="map-modal-close" onClick={onClose}>×</button>
        </div>
        
        {!selectedCategory ? (
          <>
            <div className="map-info-bar">
              <p>✨ Choose a category to explore nearby places</p>
            </div>
            
            <div className="categories-container">
              <div className="categories-grid">
                {categories.map((category) => (
                  <div 
                    key={category.id} 
                    className="category-card"
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    <div className="category-icon">{category.icon}</div>
                    <h3>{category.name}</h3>
                    <p>{category.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="map-info-bar">
              <p>📍 {places[selectedCategory]?.length || 0} options found</p>
            </div>
            
            <div className="simple-places-container">
              <div className="places-grid">
                {places[selectedCategory]?.map((place, index) => (
                  <div key={index} className="place-card">
                    <h4>
                      {place.icon && <span className="place-icon">{place.icon}</span>}
                      {place.name}
                      {place.website && (
                        <a 
                          href={place.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="website-icon"
                          title="Visit website"
                        >
                          🌐
                        </a>
                      )}
                    </h4>
                    <p className="place-distance">{place.distance}</p>
                    <p>{place.description}</p>
                    {place.phone && (
                      <p className="place-phone">📞 {place.phone}</p>
                    )}
                    {place.email && (
                      <p className="place-email">✉️ {place.email}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        
        <div className="map-footer">
          <div className="map-stats">
            {selectedCategory ? (
              `📍 ${places[selectedCategory]?.length || 0} ${categories.find(c => c.id === selectedCategory)?.name.toLowerCase()}`
            ) : (
              `📂 ${categories.length} categories available`
            )}
          </div>
          <div className="map-credits">Curated for Scandic Falkoner guests</div>
        </div>
      </div>
    </div>
  );
};

export default SimpleMapModal;
