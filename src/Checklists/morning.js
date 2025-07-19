const morning = [
  {
    id: 1,
    text: "Læs handover og infomails",
    info: "Åbn Outlook/mailprogrammet på frontoffice-PC'en. Gennemgå seneste mails og evt. noter fra nattevagt/aftenvagt. Notér arrangementer, VIP'er, grupper, særlige ankomster."
  },
  {
    id: 2,
    text: "Tæl kassebeholdningen og opdater SAS-værelser",
    info: "Kasse: Gå til Cashiering > Cashier Functions > Cashier Summary. Vælg din bruger og tæl den fysiske kasse. Sammenlign beløbet med det, der står i Opera. SAS-opdatering: Gå til SAS ekstranet eller bookingkanalens admin-panel. Tjek ledige værelser i Front Desk > House Status. Opdater tilgængelighed manuelt hvis systemet ikke gør det automatisk."
  },
  {
    id: 3,
    text: "Tjek Event Overview og husoverblik",
    info: "Åbn Miscellaneous > Event Overview. Vælg dato og se om der er events eller grupper med middag. Tjek receptionens printede ark for hurtig oversigt."
  },
  {
    id: 4,
    text: "Udlign og tilret blocks",
    info: "Tryk Shift + F3 for at åbne House Status. Tryk Ctrl + F2 eller gå til Reservations > Blocks > Manage Blocks. Tjek at blocks matcher ledige værelser. Juster hvis nødvendigt."
  },
  {
    id: 5,
    text: "Tjek Out of Order/Out of Service værelser",
    info: "Gå til Front Desk > Room Maintenance > Out of Order/Out of Service. Se hvilke værelser der er markeret som ude af drift. Hvis ingen opdatering fra teknik, forlæng datoen manuelt. Tilføj kommentar i notefeltet."
  },
  {
    id: 6,
    text: "Tilret værelseskategorier (Booking.com / Expedia)",
    info: "Gå til Rooms > Room Types > Mapping. Sammenlign interne kategorier med OTA (Booking/Expedia). Brug channel manager (f.eks. SiteMinder) hvis integration bruges. Sørg for at beskrivelse og tildelinger stemmer overens."
  },
  {
    id: 7,
    text: "Ring til renseriet og mærk poser",
    info: "Find hotellets vaskepose. Påfør teksten 'Falkoner' tydeligt. Ring til leverandøren inden kl. 09:00 (nummer findes typisk på opslagstavle i back office)."
  },
  {
    id: 8,
    text: "Gennemgå dagens ankomster",
    info: "Gå til Reports > Miscellaneous > Arrival: Detailed. Filtrer på dagens dato og udskriv. Se efter: Dobbeltbookinger, VIP-tags, Routing, Særlige ønsker (Preferences)."
  },
  {
    id: 9,
    text: "Gennemgå FRO traces",
    info: "Gå til Front Desk > Traces. Filtrer på 'Today' og afdeling: Front Office. Klik hver trace og tag nødvendige handlinger (notér hvis udført)."
  },
  {
    id: 10,
    text: "Tjek agentbookinger (Miki, SiteMinder, etc.)",
    info: "Søg på reservation → Gå til Reservation > Billing > Routing Instructions. Kontrollér at: Beløb er trukket (tjek under folio), Reference (f.eks. Miki) står under Custom Reference Number."
  },
  {
    id: 11,
    text: "CBS bookinger: Routing + reference",
    info: "Søg efter CBS-reservationer. Gå til Billing > Routing Instructions og lav korrekt routing. Tilføj kundens e-mail i Custom Reference Number."
  },
  {
    id: 12,
    text: "Mail til Aneta vedr. grupper",
    info: "Åbn dagens gruppebooking under Blocks > Manage Blocks. Bekræft evt. check-in før kl. 16:00 og om nøgler skal laves. Skriv mail med liste og notér navne + tidspunkter."
  },
  {
    id: 13,
    text: "Sæt Lufthansa wake-up call",
    info: "Gå til Front Desk > Telephone Services > Wake-Up Call. Søg gæstens værelsesnummer. Indstil tidspunkt og bekræft."
  },
  {
    id: 14,
    text: "Tjek REC-traces + køkkenstatus",
    info: "Åbn Traces > Filter by REC. Dagens og morgendagens traces vises. Kontakt køkkenet og bekræft detaljer."
  },
  {
    id: 15,
    text: "Tjek Expedia betalinger",
    info: "Gå til Reservation > Billing > Folio. Bekræft at betaling er trukket på Expedia Virtual Card. Hvis ikke, kontakt OTA-team eller træk manuelt."
  },
  {
    id: 16,
    text: "Tjek Booking.com reservationer",
    info: "Gå til reservationslisten. Kig efter gæster uden korrekt kort eller med ugyldigt kort. Tjek Virtual Card-kommentarer under reservationens notefelter. Træk betaling hvis ikke gjort."
  },
  {
    id: 17,
    text: "Tjek Smartbox & Scandic gavekort",
    info: "Søg reservation → Tilføj alert: 'Modtag gavekort og skriv ref.' Gå til Billing > Routing og lav routing. Indløs kort fysisk og aflever det til Mie."
  },
  {
    id: 18,
    text: "TDC/Nuuday AO-nummer",
    info: "Søg booking → Tilføj AO-nummer i Custom Reference Number felt."
  },
  {
    id: 19,
    text: "Værelsestildeling + mandagsgaver",
    info: "Gå til Front Desk > Room Assignment. Tildel værelser, VIP-tags og tilføj note: 'Mandagsgodte' hvis mandag."
  },
  {
    id: 20,
    text: "Tildel værelser til gæster",
    info: "Brug Room Assignment og Specials/Features til CR/PR-søgning. Brug Billing > Routing og Reservation Notes som dokumentation."
  },
  {
    id: 21,
    text: "Tildel VIP værelser",
    info: "Brug Room Assignment til VIP-gæster. Tilføj VIP-tags og særlige noter."
  },
  {
    id: 22,
    text: "Tildel værelser til kæledyr",
    info: "Brug Room Assignment og søg efter pets i Specials/Features."
  },
  {
    id: 23,
    text: "Tildel staff værelser",
    info: "Brug Room Assignment til personale bookinger."
  },
  {
    id: 24,
    text: "Håndter ZM-bookinger",
    info: "Brug Room Assignment til ZM (Zone Manager) bookinger."
  },
  {
    id: 25,
    text: "Tildel gruppe værelser",
    info: "Print nøgler via Front Desk > Key Management (efter 12:00 for grupper)."
  },
  {
    id: 26,
    text: "Gruppebooking dokumentation",
    info: "Brug Billing > Routing og Reservation Notes som dokumentation for grupper."
  },
  {
    id: 27,
    text: "Kasseafregning",
    info: "Gå til Cashiering > Cashier Functions > Cash Drop. Bekræft beløb → Drop pengene i safen → Skriv i logbogen. Tjek PM 9901 + 9004 → Skal stå i 0,-"
  },
  {
    id: 28,
    text: "Pre check-in",
    info: "Gennemgå Arrivals for pre check-ins."
  },
  {
    id: 29,
    text: "Tjek kaffe",
    info: "Tjek kaffe manuelt → Fyld op som nødvendigt."
  },
  {
    id: 30,
    text: "Tjek shop",
    info: "Tjek shop manuelt → Fyld op som nødvendigt."
  },
  {
    id: 31,
    text: "Besvar mails",
    info: "Besvar mails og Booking.com/Expedia beskeder i respektive portaler."
  },
];

export default morning;