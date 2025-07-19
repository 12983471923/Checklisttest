const evening = [
  {
    id: 2,
    text: "Læs handover og få overblik over vagten",
    info: "Åbn Outlook/mail. Læs handover fra morgenshiftet. Notér VIP'er, grupper, uafklarede traces og events."
  },
  {
    id: 3,
    text: "Opdater SAS-hjemmesiden med ledige værelser",
    info: "Gå til Front Desk > House Status i Opera og se ledighed. Opdater manuelt i channel manager (f.eks. SiteMinder) hvis nødvendigt."
  },
  {
    id: 4,
    text: "Tjek cykelnøgler og følg op",
    info: "Se hvem der har lånt cykler i dag. Tjek hvilke der skal afleveres i dag. Ring til værelser hvis nødvendigt."
  },
  {
    id: 5,
    text: "Tæl kassebeholdningen",
    info: "Gå til Cashiering > Cashier Summary. Tæl alle kontanter (kun DKK). Sammenlign med Opera-beløb. Notér afvigelser i logbogen – ingen Euro tilladt."
  },
  {
    id: 6,
    text: "Tjek Event Overview for gruppemiddage",
    info: "Gå til Miscellaneous > Event Overview. Se om der er grupper med middag. Tjek også printet oversigt i receptionen."
  },
  {
    id: 7,
    text: "Udlign og tilret blocks",
    info: "Tryk Shift + F3 for House Status. Tryk Ctrl + F2 → Gå til Reservations > Blocks > Manage Blocks. Justér blocks i forhold til faktisk ledighed."
  },
  {
    id: 8,
    text: "Tjek Out of Order / Out of Service værelser",
    info: "Gå til Front Desk > Room Maintenance. Forlæng perioden hvis der ikke er ny status fra teknik. Tilføj kommentar hvis nødvendigt."
  },
  {
    id: 9,
    text: "Tilret værelseskategorier (OTA)",
    info: "Gå til Rooms > Room Types > Mapping. Tjek at kategorier matcher med Booking.com/Expedia via channel manager."
  },
  {
    id: 10,
    text: "Gennemgå dagens ankomster",
    info: "Gå til Reports > Arrival: Detailed. Filtrér på dags dato og marker relevante bokse. Tjek for: Dobbeltbookinger, Noter, routing, præferencer."
  },
  {
    id: 11,
    text: "Gennemgå uløste traces (FRO + HSK)",
    info: "Gå til Front Desk > Traces. Filtrér efter afdeling og uløste. Udfør handlinger eller notér status."
  },
  {
    id: 12,
    text: "Tjek agentbookinger (Miki, SiteMinder m.fl.)",
    info: "Åbn reservation → Billing > Routing Instructions. Tilføj korrekt routing og agentnavn i Custom Reference Number."
  },
  {
    id: 13,
    text: "Forbered Lufthansa check-in",
    info: "Print ankomstliste og registreringskort. Lav nøgler og konvolutter. Brug Front Desk > Key Management."
  },
  {
    id: 14,
    text: "Tjek Expedia reservationer",
    info: "Gå til Reservation > Billing. Bekræft at kortbetaling er gennemført."
  },
  {
    id: 15,
    text: "Tjek Booking.com reservationer",
    info: "Gennemgå for ugyldige kort, manglende info. Tjek virtual card-kommentarer. Træk betaling hvis nødvendigt."
  },
  {
    id: 16,
    text: "Tjek breakfast boxes & Lufthansa morgenmad",
    info: "Gå til natte-køleskab og kontroller antal og labels. Sammenlign med gæsteliste."
  },
  {
    id: 17,
    text: "Gennemgå 18:00 reservationer",
    info: "Tjek Arrivals > Time of Booking. Ring til medlemmer, spørg om de ankommer. Slet/annullér hvis intet svar."
  },
  {
    id: 18,
    text: "Tjek dagens nye bookinger (efter 16:00)",
    info: "Filtrér efter bookings oprettet efter kl. 16:00. Tjek ZM priser og print registreringskort."
  },
  {
    id: 19,
    text: "Tjek Netcompany til i morgen",
    info: "Søg bookinger for Netcompany. Lav trace med note 'RB til CC'. Tilføj i notes eller routing."
  },
  {
    id: 20,
    text: "Gennemgå morgendagens ankomstliste",
    info: "Gå til Reports > Arrival: Detailed → vælg i morgen. Brug listen til forberedelser."
  },
  {
    id: 21,
    text: "Tildel værelser til i morgen",
    info: "Brug Front Desk > Room Assignment. Fordel værelser og tilføj noter/VIP-tags."
  },
  {
    id: 22,
    text: "Ancillary – print REC-traces",
    info: "Gå til Reports > Reservation Traces. Filtrér: Dep. = REC, Res. = Individual, Status = Reserved. Print og giv til køkken + restaurant."
  },
  {
    id: 23,
    text: "Tjek extrasenge/babycots/PETR/Master Suites",
    info: "Søg under Specials i morgendagens ankomster. Tildel værelser, lav packages og tilføj traces."
  },
  {
    id: 24,
    text: "Følg op på beskidte værelser",
    info: "Gå til Housekeeping > Dirty Room List. Prioritér opfølgning – vigtigt ved fuld belægning."
  },
  {
    id: 25,
    text: "Faundit – Lost & Found",
    info: "Søg i Scorpio efter gæstens e-mail. Gå til Faundit.com. Registrér kontaktinfo på mistet genstand."
  },
  {
    id: 26,
    text: "CBS bookinger til i morgen",
    info: "Find reservationer. Opret routing hvis faktura skal sendes. Tilføj e-mail i Custom Reference Number."
  },
  {
    id: 27,
    text: "Lav kasseafregning",
    info: "Gå til Cashiering > Cash Drop. Læg pengene i safen. Skriv i logbogen når nattevagten har talt. PM: 9901 skal stå i 0,- Ingen Euro!"
  },
  {
    id: 28,
    text: "Udfyld og print handover til nattevagt",
    info: "Brug skabelon. Tilføj: VIP'er, uafsluttede traces, uanmeldte gæster osv. Print og læg ved receptionen."
  },
  {
    id: 29,
    text: "Svar på e-mails",
    info: "Brug Outlook eller Scandics fællespost. Prioritér haste-mails og bekræftelser."
  },
  {
    id: 30,
    text: "Fyld shoppen og kaffe op",
    info: "Fyld sodavand, snacks og varer i shoppen. Fyld kaffe, mælk og bønner i maskinen."
  },
  {
    id: 31,
    text: "Makuler følsomme papirer",
    info: "Tag printede rapporter med persondata. Smid i makuleringsbeholder i kælderen."
  },
  {
    id: 32,
    text: "Besvar Booking.com & Expedia beskeder",
    info: "Brug portaler eller Outlook-integrationen. Besvar venligt og log beskeden."
  },
  {
    id: 33,
    text: "Tag flaget (Dannebro) ned ved solnedgang",
    info: "Tjek solnedgangstid online. Tag flaget ned før det bliver mørkt."
  },
];

export default evening;
