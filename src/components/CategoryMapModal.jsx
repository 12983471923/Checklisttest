import React, { useEffect, useMemo, useState } from 'react';

const HOTEL_ADDRESS = 'Scandic Falkoner, Falkoner Alle 9, 2000 Frederiksberg, Denmark';

const categoryData = {
  attractions: {
    name: 'Must-see attractions',
    icon: '🎡',
    description: 'Classic Copenhagen sights plus easy Frederiksberg favorites.',
    note: 'Best for first-time guests and short city breaks.',
    places: [
      {
        name: 'Tivoli Gardens',
        icon: '🎢',
        distance: '15-18 min by metro',
        address: 'Vesterbrogade 3, 1630 Copenhagen V',
        website: 'https://www.tivoli.dk/en',
        summary: 'Historic amusement park by Copenhagen Central Station with rides, gardens, concerts, restaurants and strong seasonal programming.',
        staffTip: 'Tell guests to check opening seasons and ride passes before going; Copenhagen Card Discover includes admission when active.',
        tags: ['Iconic', 'Evening lights', 'Families'],
      },
      {
        name: 'Nyhavn',
        icon: '🏘️',
        distance: '18-22 min by metro',
        address: 'Nyhavn, 1051 Copenhagen K',
        website: 'https://www.visitcopenhagen.com/copenhagen/planning/nyhavn-gdk474735',
        summary: 'Colorful 17th-century harbour, canal tours, cafes and classic photo stop near Kongens Nytorv.',
        staffTip: 'Recommend a stroll and canal tour; restaurants are scenic but tourist-priced.',
        tags: ['Photo stop', 'Canal tours'],
      },
      {
        name: 'Copenhagen Zoo',
        icon: '🦁',
        distance: '12-15 min walk',
        address: 'Roskildevej 32, 2000 Frederiksberg',
        phone: '+45 72 20 02 00',
        website: 'https://www.zoo.dk/en',
        summary: 'Year-round zoo in Frederiksberg with pandas, elephants, Arctic Ring and a new leopard trail.',
        staffTip: 'A top nearby family recommendation; easy walk through Frederiksberg from the hotel.',
        tags: ['Nearby', 'Families', 'Open year-round'],
      },
      {
        name: 'Frederiksberg Gardens',
        icon: '🌳',
        distance: '8-10 min walk',
        address: 'Frederiksberg Have, 2000 Frederiksberg',
        website: 'https://www.visitcopenhagen.com/copenhagen/planning/frederiksberg-garden-gdk414182',
        summary: 'Romantic landscape garden with canals, lawns, palace views and peaceful walking routes.',
        staffTip: 'Great free option for morning walks, jogging, picnics and guests with limited time.',
        tags: ['Free', 'Nearby', 'Local favorite'],
      },
      {
        name: 'Rosenborg Castle',
        icon: '🏰',
        distance: '20-25 min by metro',
        address: 'Øster Voldgade 4A, 1350 Copenhagen K',
        website: 'https://www.kongernessamling.dk/en/rosenborg/',
        summary: 'Renaissance castle in the King\'s Garden, home to the Danish crown jewels.',
        staffTip: 'Good pairing with Torvehallerne, Botanical Garden and Nørreport.',
        tags: ['History', 'Crown jewels'],
      },
      {
        name: 'The Little Mermaid',
        icon: '🧜',
        distance: '30-35 min by metro/bus',
        address: 'Langelinie, 2100 Copenhagen Ø',
        website: 'https://www.visitcopenhagen.com/copenhagen/planning/little-mermaid-gdk586951',
        summary: 'Copenhagen\'s famous harbour statue inspired by Hans Christian Andersen.',
        staffTip: 'Set expectations: it is small and best combined with Kastellet, Gefion Fountain or Amalienborg.',
        tags: ['Classic', 'Harbour walk'],
      },
    ],
  },
  events: {
    name: 'Seasonal events',
    icon: '🎟️',
    description: 'Current festival and event pointers staff can mention year-round.',
    note: 'Always confirm exact dates, tickets and opening hours on the linked official sites.',
    places: [
      {
        name: 'Falkoner Salen at Scandic Falkoner',
        icon: '🎭',
        distance: 'On-site',
        address: 'Falkoner Alle 9, 2000 Frederiksberg',
        phone: '+45 72 42 55 00',
        email: 'meeting.falkoner@scandichotels.com',
        website: 'https://www.scandichotels.com/en/hotels/scandic-falkoner/meetings',
        summary: 'Historic in-house venue for concerts, conferences, shows and large events.',
        staffTip: 'Use this for guests asking what is happening in the building or around Frederiksberg theatre district.',
        tags: ['On-site', 'Venue'],
      },
      {
        name: 'Tivoli summer, Halloween and Christmas seasons',
        icon: '✨',
        distance: '15-18 min by metro',
        address: 'Vesterbrogade 3, 1630 Copenhagen V',
        website: 'https://www.tivoli.dk/en/plan-your-visit',
        summary: 'Tivoli runs major seasonal openings with summer entertainment, Halloween decorations and Christmas markets.',
        staffTip: 'For 2026, summer opening is listed from April 7 to September 20; check Tivoli for Halloween and Christmas periods.',
        tags: ['Seasonal', 'Families', 'Tickets'],
      },
      {
        name: 'Copenhagen Distortion',
        icon: '🎧',
        distance: 'City-wide',
        address: 'Rådhuspladsen, 1550 Copenhagen V',
        website: 'https://www.cphdistortion.dk/',
        summary: 'Major street-party and nightlife festival across Copenhagen neighborhoods.',
        staffTip: '2026 schedule lists June 3-7. Warn guests about crowds, road closures and taxi delays.',
        tags: ['June 2026', 'Nightlife'],
      },
      {
        name: 'Copenhagen Jazz Festival',
        icon: '🎷',
        distance: 'City-wide',
        address: 'Copenhagen Jazz Festival, Copenhagen',
        website: 'https://jazz.dk/en/copenhagen-jazz-festival-2026/',
        summary: 'Ten-day citywide jazz festival with concerts in clubs, cafes, parks, squares and harbour areas.',
        staffTip: '2026 dates are July 3-12; many concerts are free but popular shows sell out.',
        tags: ['July 2026', 'Music'],
      },
      {
        name: 'Copenhagen Pride Week',
        icon: '🏳️‍🌈',
        distance: 'City-wide',
        address: 'Copenhagen City Hall Square, 1550 Copenhagen V',
        website: 'https://www.copenhagenpride.dk/',
        summary: 'Inclusive citywide Pride program with talks, performances, parties and parade weekend.',
        staffTip: '2026 week is listed for August 8-16; advise early restaurant and taxi planning on parade day.',
        tags: ['August 2026', 'Free events'],
      },
      {
        name: 'Culture Night',
        icon: '🌙',
        distance: 'City-wide',
        address: 'Copenhagen City Hall Square, 1550 Copenhagen V',
        website: 'https://www.kulturnatten.dk/en',
        summary: 'One-night cultural event where museums, churches, ministries and venues open after hours.',
        staffTip: 'Usually in October; guests need a Culture Pass and should plan routes in advance.',
        tags: ['October', 'Museums'],
      },
    ],
  },
  family: {
    name: 'Family-friendly',
    icon: '🧸',
    description: 'Easy recommendations for children, rainy days and mixed-age groups.',
    note: 'Mention stroller access, ticket booking and travel time when families ask.',
    places: [
      {
        name: 'Copenhagen Zoo',
        icon: '🐼',
        distance: '12-15 min walk',
        address: 'Roskildevej 32, 2000 Frederiksberg',
        phone: '+45 72 20 02 00',
        website: 'https://www.zoo.dk/en/plan-your-visit',
        summary: 'Over 4,000 animals, daily programs and children-friendly areas right in Frederiksberg.',
        staffTip: 'Strongest nearby family answer; easy to combine with Frederiksberg Gardens.',
        tags: ['Nearby', 'All ages'],
      },
      {
        name: 'Experimentarium',
        icon: '🔬',
        distance: '30-35 min by metro/train',
        address: 'Tuborg Havnevej 7, 2900 Hellerup',
        website: 'https://www.experimentarium.dk/en/',
        summary: 'Hands-on science center with interactive exhibitions, rooftop activities and toddler-friendly Miniverse.',
        staffTip: 'Excellent rainy-day option; guests should allow 3-4 hours.',
        tags: ['Rainy day', 'Hands-on'],
      },
      {
        name: 'The Blue Planet',
        icon: '🐠',
        distance: '35-40 min by metro',
        address: 'Jacob Fortlingsvej 1, 2770 Kastrup',
        website: 'https://denblaaplanet.dk/en/',
        summary: 'Denmark\'s National Aquarium near the airport with ocean tanks, sea otters and family activities.',
        staffTip: 'Good on arrival/departure days if guests have luggage storage arranged.',
        tags: ['Aquarium', 'Airport area'],
      },
      {
        name: 'Tivoli Gardens for kids',
        icon: '🎠',
        distance: '15-18 min by metro',
        address: 'Vesterbrogade 3, 1630 Copenhagen V',
        website: 'https://www.tivoli.dk/en/the-gardens/tivoli-for-the-kids',
        summary: 'Rides for different ages, games, aquarium, kid-friendly restaurants and baby-changing facilities.',
        staffTip: 'Recommend checking height limits and buying ride passes online.',
        tags: ['Rides', 'Evening lights'],
      },
      {
        name: 'Søndermarken',
        icon: '🛝',
        distance: '12-15 min walk',
        address: 'Søndermarken, 2000 Frederiksberg',
        website: 'https://www.visitcopenhagen.com/copenhagen/planning/sondermarken-gdk412945',
        summary: 'Large green park by Copenhagen Zoo and Cisternerne, good for running, play and quiet breaks.',
        staffTip: 'Free and relaxed option when families need fresh air between paid attractions.',
        tags: ['Free', 'Park'],
      },
    ],
  },
  dining: {
    name: 'Dining nearby',
    icon: '🍽️',
    description: 'Reliable local restaurants and quick bites around Falkoner Alle.',
    note: 'For dinner, advise guests to book ahead on weekends and event nights.',
    places: [
      {
        name: 'Green Room Restaurant & Bar',
        icon: '🍸',
        distance: 'On-site',
        address: 'Falkoner Alle 9, 2000 Frederiksberg',
        website: 'https://greenroom-restaurant.dk/en/',
        summary: 'French-inspired restaurant and cocktail bar in Scandic Falkoner with theatre menus and live music on selected evenings.',
        staffTip: 'Best first recommendation for convenience, show nights and guests who prefer staying in-house.',
        tags: ['On-site', 'Cocktails', 'Live music'],
      },
      {
        name: 'San Marco JUNIOR',
        icon: '🍝',
        distance: '1 min walk',
        address: 'Falkoner Alle 10, 2000 Frederiksberg',
        phone: '+45 33 24 95 76',
        website: 'https://www.sanmarcojunior.dk/',
        summary: 'Italian-inspired restaurant directly opposite Falkoner Salen, convenient before or after shows.',
        staffTip: 'Useful when Green Room is full or guests want a very short walk.',
        tags: ['Across street', 'Italian'],
      },
      {
        name: 'Sokkelund Cafe & Brasserie',
        icon: '🥘',
        distance: '8-10 min walk',
        address: 'Smallegade 36, 2000 Frederiksberg',
        website: 'https://sokkelund.dk/',
        summary: 'Classic Frederiksberg brasserie for brunch, lunch, dinner and drinks.',
        staffTip: 'Good all-round local recommendation for couples, business travelers and small groups.',
        tags: ['Brasserie', 'Local favorite'],
      },
      {
        name: 'Restaurant Frederiks Have',
        icon: '🍷',
        distance: '8-10 min walk',
        address: 'Virginiavej 1, 2000 Frederiksberg',
        website: 'https://frederikshave.dk/',
        summary: 'Refined modern Danish/French dining in an elegant Frederiksberg setting.',
        staffTip: 'Recommend reservations; best for special occasions.',
        tags: ['Fine dining', 'Reservations'],
      },
      {
        name: 'Fasangården',
        icon: '🌿',
        distance: '15 min walk',
        address: 'Søndre Fasanvej 73, 2000 Frederiksberg',
        website: 'https://fasangaardenfrb.dk/',
        summary: 'Seasonal restaurant in historic surroundings by Frederiksberg Gardens and Søndermarken.',
        staffTip: 'Great for guests asking for a scenic lunch or garden-area dinner.',
        tags: ['Scenic', 'Seasonal'],
      },
      {
        name: 'Torvehallerne food market',
        icon: '🍴',
        distance: '15-20 min by metro',
        address: 'Frederiksborggade 21, 1360 Copenhagen K',
        website: 'https://torvehallernekbh.dk/',
        summary: 'Popular covered food market with Danish specialties, coffee, fish, tapas and casual meals.',
        staffTip: 'Good for groups who cannot agree on one cuisine; close to Nørreport.',
        tags: ['Food market', 'Casual'],
      },
    ],
  },
  transport: {
    name: 'Public transport',
    icon: '🚇',
    description: 'Metro, tickets, airport route and easy guest instructions.',
    note: 'Use Rejsebillet for tickets and Rejseplanen/Journey Planner for route checks.',
    places: [
      {
        name: 'Frederiksberg Metro Station',
        icon: '🚇',
        distance: '2-3 min walk',
        address: 'Frederiksberg Metro Station, 2000 Frederiksberg',
        website: 'https://m.dk/en/plan-your-trip/frederiksberg/',
        summary: 'Nearest station with M1, M2 and M3. Direct M2 to Copenhagen Airport and easy changes to city-center stops.',
        staffTip: 'Tell airport guests: take M2 toward Vanløse directly to Frederiksberg, then walk 240 meters to the hotel.',
        tags: ['M1', 'M2', 'M3'],
      },
      {
        name: 'Airport by metro',
        icon: '✈️',
        distance: '20-25 min by M2',
        address: 'Copenhagen Airport, Lufthavnsboulevarden 6, 2770 Kastrup',
        website: 'https://www.cph.dk/en/parking-transport/bus-train-metro-taxi/metro',
        summary: 'Metro station is at Terminal 3. M2 runs between Copenhagen Airport and Vanløse via Frederiksberg.',
        staffTip: 'Tickets are sold at airport/station machines and in the Rejsebillet app. Metro runs frequently day/evening and less often overnight.',
        tags: ['Direct route', 'Terminal 3'],
      },
      {
        name: 'City Pass Small',
        icon: '🎫',
        distance: 'Covers zones 1-4',
        address: 'Frederiksberg Metro Station, 2000 Frederiksberg',
        website: 'https://www.publictransport.dk/tickets/citypass',
        summary: 'Unlimited bus, train, metro and harbour bus travel for 24-120 hours in central Copenhagen including the airport.',
        staffTip: 'Best simple ticket answer for guests using transit multiple times; buy in Rejsebillet app or ticket machines.',
        tags: ['Airport included', '24-120 hours'],
      },
      {
        name: 'Copenhagen Card Discover',
        icon: '💳',
        distance: 'City and region',
        address: 'Copenhagen Visitor Service, Vesterbrogade 4B, 1620 Copenhagen V',
        website: 'https://copenhagencard.com/',
        summary: 'Official city card with 80+ attractions and unlimited public transport in the Capital Region, including airport travel.',
        staffTip: 'Recommend only when guests plan several paid attractions; remind them HOP does not include normal public transport.',
        tags: ['Attractions', 'Transport'],
      },
      {
        name: 'Journey Planner',
        icon: '🧭',
        distance: 'Digital tool',
        address: 'Frederiksberg Metro Station, 2000 Frederiksberg',
        website: 'https://www.rejseplanen.dk/webapp/?language=en_EN',
        summary: 'Official Danish route planner for buses, metro, trains and walking connections.',
        staffTip: 'Use this when guests ask for a route with departure time, platform or disruption details.',
        tags: ['Route planning', 'Live departures'],
      },
    ],
  },
  taxi: {
    name: 'Taxi & airport transfers',
    icon: '🚕',
    description: 'Phone numbers and practical pickup guidance.',
    note: 'For early flights, large luggage or groups, recommend pre-booking in an app.',
    places: [
      {
        name: 'TAXA 4x35',
        icon: '🚕',
        distance: '24/7 Copenhagen taxi',
        address: 'Scandic Falkoner, Falkoner Alle 9, 2000 Frederiksberg',
        phone: '+45 35 35 35 35',
        website: 'https://taxa.dk/en/',
        summary: 'Major Copenhagen taxi company with app booking, expected wait times and airport transfer options.',
        staffTip: 'For minibuses or wheelchair/luggage needs, ask guests to specify requirements when booking.',
        tags: ['24/7', 'App', 'Airport'],
      },
      {
        name: 'Dantaxi',
        icon: '🚖',
        distance: '24/7 Copenhagen taxi',
        address: 'Scandic Falkoner, Falkoner Alle 9, 2000 Frederiksberg',
        phone: '+45 48 48 48 48',
        website: 'https://dantaxi.dk/by/taxa-frederiksberg/',
        summary: 'Large taxi operator serving Frederiksberg and Copenhagen Airport with app and fixed-price airport options.',
        staffTip: 'Good backup if one provider has long wait times during festivals or peak commute hours.',
        tags: ['24/7', 'Fixed price app'],
      },
      {
        name: 'Copenhagen Airport taxi rank',
        icon: '🧳',
        distance: 'Terminal 3 arrivals',
        address: 'Copenhagen Airport Terminal 3, 2770 Kastrup',
        website: 'https://www.cph.dk/en/parking-transport/bus-train-metro-taxi/taxi',
        summary: 'Official taxi ranks are outside Terminal 3; booked taxi pickup areas are also signposted from arrivals.',
        staffTip: 'Typical airport-to-Frederiksberg taxi time is around 30-35 minutes depending on traffic; apps can show fixed prices.',
        tags: ['Airport pickup', 'Terminal 3'],
      },
    ],
  },
  shopping: {
    name: 'Shopping',
    icon: '🛍️',
    description: 'Nearby practical shopping plus Copenhagen shopping areas.',
    note: 'For quick essentials, send guests to Frederiksberg Centret first.',
    places: [
      {
        name: 'Frederiksberg Centret (FRB.C)',
        icon: '🏬',
        distance: '3 min walk',
        address: 'Falkoner Alle 21, 2000 Frederiksberg',
        website: 'https://en.frbc-shopping.dk/',
        summary: 'Award-winning indoor mall with around 90 stores, cafes, Føtex supermarket and direct metro access.',
        staffTip: 'Best answer for rain, essentials, toiletries, clothing and quick gifts near the hotel.',
        tags: ['Nearby', 'Supermarket', 'Metro'],
      },
      {
        name: 'Gammel Kongevej',
        icon: '🛒',
        distance: '8-12 min walk',
        address: 'Gammel Kongevej, 1850 Frederiksberg C',
        website: 'https://www.visitcopenhagen.com/copenhagen/planning/gammel-kongevej-gdk1106599',
        summary: 'Frederiksberg shopping street with independent boutiques, cafes, design shops and local atmosphere.',
        staffTip: 'Recommend for guests who want a neighborhood stroll rather than a mall.',
        tags: ['Boutiques', 'Cafes'],
      },
      {
        name: 'Strøget',
        icon: '👗',
        distance: '15-20 min by metro',
        address: 'Strøget, 1160 Copenhagen K',
        website: 'https://www.visitcopenhagen.com/copenhagen/planning/stroget-gdk414471',
        summary: 'Central pedestrian shopping street connecting City Hall Square and Kongens Nytorv.',
        staffTip: 'Good for international brands and classic sightseeing, but busier than Frederiksberg.',
        tags: ['City center', 'Brands'],
      },
      {
        name: 'Torvehallerne',
        icon: '🥖',
        distance: '15-20 min by metro',
        address: 'Frederiksborggade 21, 1360 Copenhagen K',
        website: 'https://torvehallernekbh.dk/',
        summary: 'Food market for edible gifts, coffee, Danish produce, flowers and casual meals.',
        staffTip: 'Suggest as a shopping-and-lunch stop near Nørreport.',
        tags: ['Food gifts', 'Market'],
      },
    ],
  },
  essentials: {
    name: 'Essentials & medical',
    icon: '💊',
    description: 'Pharmacies, hospitals, groceries and other practical guest needs.',
    note: 'For injuries or sudden illness, guests should call 1813 before going to an emergency ward.',
    places: [
      {
        name: 'Apoteket Frederiksberg Centret',
        icon: '💊',
        distance: '3 min walk',
        address: 'Falkoner Alle 21, 2000 Frederiksberg',
        phone: '+45 33 21 26 39',
        website: 'https://www.apoteket.dk/apoteker/frederiksberg-apotek/apoteket-frederiksberg-centret',
        summary: 'Closest pharmacy branch inside/at Frederiksberg Centret for prescriptions, advice and travel essentials.',
        staffTip: 'Best first pharmacy recommendation due to walking distance.',
        tags: ['Closest pharmacy', 'Falkoner Alle'],
      },
      {
        name: 'Frederiksberg Løve Apotek',
        icon: '💊',
        distance: '10-12 min walk',
        address: 'Falkoner Alle 88, 2000 Frederiksberg',
        phone: '+45 38 74 57 45',
        website: 'https://apoteket-online.dk/apotek/frederiksberg-loeve-apotek',
        summary: 'Local pharmacy on Falkoner Alle with prescription and pharmacy services.',
        staffTip: 'Useful backup if the closest pharmacy is closed or busy.',
        tags: ['Pharmacy', 'Backup'],
      },
      {
        name: 'Føtex at Frederiksberg Centret',
        icon: '🛒',
        distance: '3 min walk',
        address: 'Falkoner Alle 21, 2000 Frederiksberg',
        website: 'https://en.frbc-shopping.dk/',
        summary: 'Large supermarket in the nearby mall for snacks, toiletries, baby items and daily essentials.',
        staffTip: 'Most convenient supermarket for guests.',
        tags: ['Groceries', 'Toiletries'],
      },
      {
        name: 'Bispebjerg Hospital emergency ward',
        icon: '🏥',
        distance: '20-25 min by taxi/bus',
        address: 'Bispebjerg Bakke 23, 2400 Copenhagen NV',
        phone: '+45 35 31 35 31',
        website: 'https://www.bispebjerghospital.dk/english/',
        summary: '24-hour emergency ward serving Copenhagen/Frederiksberg acute care needs.',
        staffTip: 'Call 1813 first for non-life-threatening illness or injury; call 112 for life-threatening emergencies.',
        tags: ['Emergency ward', 'Call 1813 first'],
      },
      {
        name: 'Frederiksberg Hospital',
        icon: '🏥',
        distance: '10-15 min by taxi',
        address: 'Nordre Fasanvej 57, 2000 Frederiksberg',
        phone: '+45 38 16 38 16',
        website: 'https://www.bispebjerghospital.dk/',
        summary: 'Frederiksberg hospital campus with selected acute services; 1813 will direct guests to the correct location.',
        staffTip: 'Do not promise walk-in emergency treatment; direct guests to 1813 unless it is a 112 emergency.',
        tags: ['Medical', 'Call first'],
      },
    ],
  },
  emergency: {
    name: 'Emergency contacts',
    icon: '🚨',
    description: 'Numbers staff should know for urgent guest situations.',
    note: 'For foreign mobile phones, use +45 before 1813 or 114. 112 works without country code in Denmark.',
    places: [
      {
        name: 'Life-threatening emergency',
        icon: '🚑',
        distance: 'Call immediately',
        address: 'Bispebjerg Hospital, Bispebjerg Bakke 23, 2400 Copenhagen NV',
        phone: '112',
        website: 'https://politi.dk/en/contact-the-police/emergency-112',
        summary: 'Police, ambulance or fire for accidents, serious crime, fire, life-threatening illness or injury.',
        staffTip: 'Call 112 first. Stay with the guest and prepare hotel address: Scandic Falkoner, Falkoner Alle 9, 2000 Frederiksberg.',
        tags: ['Emergency', 'Police', 'Ambulance', 'Fire'],
      },
      {
        name: 'Medical helpline 1813',
        icon: '🩺',
        distance: 'Call before ER',
        address: 'Bispebjerg Hospital, Bispebjerg Bakke 23, 2400 Copenhagen NV',
        phone: '+45 1813',
        website: 'https://international.kk.dk/live/healthcare/medical-emergencies/emergency-numbers',
        summary: 'Capital Region nurses/doctors guide guests with injuries or sudden illness when a GP is unavailable.',
        staffTip: 'Guests should call 1813 before going to a hospital emergency department unless it is life-threatening.',
        tags: ['Medical advice', '24/7'],
      },
      {
        name: 'Police non-emergency',
        icon: '👮',
        distance: 'Call for reports/general questions',
        address: 'Copenhagen Police, Politigården, 1567 Copenhagen V',
        phone: '+45 114',
        website: 'https://politi.dk/en/contact-the-police/service-114',
        summary: 'Use for non-urgent police matters, reporting minor crime, lost/stolen items or general police enquiries.',
        staffTip: 'If calling from a foreign phone, dial +45 114.',
        tags: ['Police', 'Non-emergency'],
      },
      {
        name: 'Hotel front desk',
        icon: '🏨',
        distance: 'On-site',
        address: 'Scandic Falkoner, Falkoner Alle 9, 2000 Frederiksberg',
        phone: '+45 72 42 55 00',
        email: 'falkoner@scandichotels.com',
        website: 'https://www.scandichotels.com/en/hotels/scandic-falkoner',
        summary: 'Current main contact number and email for Scandic Falkoner.',
        staffTip: 'Use this number in guest handouts and external directions; old Radisson-era numbers are outdated.',
        tags: ['Hotel', 'Current number'],
      },
    ],
  },
  hidden: {
    name: 'Hidden gems',
    icon: '💎',
    description: 'Local, atmospheric places guests may not find first.',
    note: 'Great for repeat visitors or guests who ask for something less touristy.',
    places: [
      {
        name: 'Cisternerne',
        icon: '🕳️',
        distance: '15 min walk',
        address: 'Søndermarken opposite Zoo, 2000 Frederiksberg',
        phone: '+45 69 13 80 90',
        website: 'https://frederiksbergmuseerne.dk/en/cisternerne/',
        summary: 'Subterranean contemporary art venue in former water reservoirs beneath Søndermarken.',
        staffTip: '2026 exhibition period is listed March 14 to November 30. It is cold/damp and not wheelchair accessible.',
        tags: ['Underground', 'Art', 'Museum Pass'],
      },
      {
        name: 'Bakkehuset',
        icon: '🏛️',
        distance: '15-18 min walk',
        address: 'Rahbeks Alle 23, 1801 Frederiksberg C',
        phone: '+45 69 13 80 90',
        website: 'https://frederiksbergmuseerne.dk/en/bakkehuset/',
        summary: 'Historic Golden Age house museum with exhibitions, garden and orangery atmosphere.',
        staffTip: 'Pairs well with a walk through Søndermarken and Carlsberg Byen.',
        tags: ['Museum', 'Garden'],
      },
      {
        name: 'Møstings',
        icon: '🖼️',
        distance: '8-10 min walk',
        address: 'Andebakkesti 5, 2000 Frederiksberg',
        phone: '+45 69 13 80 90',
        website: 'https://frederiksbergmuseerne.dk/en/moestings/',
        summary: 'Small neoclassical villa with rotating contemporary art exhibitions by Frederiksberg Gardens.',
        staffTip: 'Good short cultural stop for guests who do not want a large museum.',
        tags: ['Small museum', 'Nearby'],
      },
      {
        name: 'Carlsberg Byen',
        icon: '🍺',
        distance: '15-20 min walk',
        address: 'Carlsberg Byen, 1799 Copenhagen V',
        website: 'https://www.visitcopenhagen.com/copenhagen/planning/carlsberg-city-district-gdk1089142',
        summary: 'Former brewery district turned lively neighborhood with architecture, cafes, shops and restaurants.',
        staffTip: 'Suggest as a local walk from Frederiksberg toward Vesterbro.',
        tags: ['Architecture', 'Food', 'Walkable'],
      },
      {
        name: 'Landbohøjskolens Have',
        icon: '🌺',
        distance: '12-15 min walk',
        address: 'Bülowsvej 17, 1870 Frederiksberg C',
        website: 'https://ign.ku.dk/english/outreach-publications/landbohoejskolens-have/',
        summary: 'Quiet university garden with old trees, flower beds and a calm local atmosphere.',
        staffTip: 'Lovely low-key option for guests who want a peaceful walk away from crowds.',
        tags: ['Free', 'Garden', 'Local'],
      },
    ],
  },
};

const categories = Object.entries(categoryData).map(([id, category]) => ({
  id,
  ...category,
  count: category.places.length,
}));

const getDirectionsUrl = (place) => {
  const destination = place.mapQuery || place.address || place.name;
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(HOTEL_ADDRESS)}&destination=${encodeURIComponent(destination)}&travelmode=${place.travelMode || 'transit'}`;
};

const includesSearchTerm = (place, searchTerm) => {
  const haystack = [
    place.name,
    place.summary,
    place.staffTip,
    place.address,
    place.distance,
    ...(place.tags || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(searchTerm.toLowerCase());
};

const CategoryMapModal = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('attractions');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const activeCategory = categoryData[selectedCategory];
  const visiblePlaces = useMemo(() => {
    if (!searchTerm.trim()) return activeCategory.places;
    return activeCategory.places.filter((place) => includesSearchTerm(place, searchTerm.trim()));
  }, [activeCategory, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="map-modal-overlay" onClick={onClose}>
      <div className="map-modal-content explore-modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="explore-hero">
          <div>
            <span className="explore-eyebrow">Guest recommendations from Scandic Falkoner</span>
            <h2>Explore Copenhagen</h2>
            <p>
              Current attractions, dining, transport and essentials curated for front desk staff and hotel guests.
            </p>
            <div className="explore-hero-meta">
              <span>📍 Origin: Falkoner Alle 9</span>
              <span>🔄 Refreshed June 2026</span>
              <span>🗺️ Directions open in Google Maps</span>
            </div>
          </div>
          <button className="map-modal-close explore-close" onClick={onClose} aria-label="Close Explore Copenhagen">
            ×
          </button>
        </div>

        <div className="explore-toolbar">
          <label className="explore-search">
            <span>Search recommendations</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Try: airport, pharmacy, kids, jazz, dinner..."
            />
          </label>
          <div className="explore-quick-links" aria-label="Helpful links">
            <a href="https://www.rejseplanen.dk/webapp/?language=en_EN" target="_blank" rel="noopener noreferrer">
              Journey Planner
            </a>
            <a href="https://www.publictransport.dk/tickets" target="_blank" rel="noopener noreferrer">
              Tickets
            </a>
            <a href="https://www.visitcopenhagen.com/" target="_blank" rel="noopener noreferrer">
              VisitCopenhagen
            </a>
          </div>
        </div>

        <div className="explore-layout">
          <aside className="explore-sidebar" aria-label="Explore Copenhagen categories">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`explore-category-button ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <span className="explore-category-icon">{category.icon}</span>
                <span>
                  <strong>{category.name}</strong>
                  <small>{category.count} recommendations</small>
                </span>
              </button>
            ))}
          </aside>

          <section className="explore-results">
            <div className="explore-section-header">
              <div>
                <h3>
                  <span>{activeCategory.icon}</span>
                  {activeCategory.name}
                </h3>
                <p>{activeCategory.description}</p>
              </div>
              <div className="explore-count">{visiblePlaces.length} shown</div>
            </div>

            <div className="explore-advisory">
              <strong>Staff note:</strong> {activeCategory.note}
            </div>

            {visiblePlaces.length > 0 ? (
              <div className="explore-card-grid">
                {visiblePlaces.map((place) => (
                  <article className="explore-place-card" key={`${selectedCategory}-${place.name}`}>
                    <div className="explore-card-top">
                      <div className="explore-place-icon" aria-hidden="true">{place.icon}</div>
                      <div>
                        <h4>{place.name}</h4>
                        <p className="explore-distance">{place.distance}</p>
                      </div>
                    </div>

                    <p className="explore-summary">{place.summary}</p>

                    {place.staffTip && (
                      <div className="explore-staff-tip">
                        <span>Front desk tip</span>
                        <p>{place.staffTip}</p>
                      </div>
                    )}

                    {place.tags && (
                      <div className="explore-tags">
                        {place.tags.map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                    )}

                    <div className="explore-contact-list">
                      {place.address && <span>📍 {place.address}</span>}
                      {place.phone && (
                        <a href={`tel:${place.phone.replace(/\s/g, '')}`}>📞 {place.phone}</a>
                      )}
                      {place.email && <a href={`mailto:${place.email}`}>✉️ {place.email}</a>}
                    </div>

                    <div className="explore-card-actions">
                      <a
                        className="explore-map-link"
                        href={getDirectionsUrl(place)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View on Map
                      </a>
                      {place.website && (
                        <a
                          className="explore-secondary-link"
                          href={place.website}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Official info
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="explore-empty-state">
                <h4>No matches found</h4>
                <p>Try a broader search term or choose another category.</p>
              </div>
            )}
          </section>
        </div>

        <div className="map-footer explore-footer">
          <div className="map-stats">
            📂 {categories.length} categories · 📍 {categories.reduce((sum, category) => sum + category.count, 0)} recommendations
          </div>
          <div className="map-credits">Confirm opening hours, prices and event dates before booking</div>
        </div>
      </div>
    </div>
  );
};

export default CategoryMapModal;
