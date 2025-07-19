const night = [
  {
    id: 1,
    text: "Handover + Security Round + Outdoor Music (by 22:00)",
    info: `• Speak with the evening shift and ask if there are any updates, guest issues, or special situations that the night shift should be aware of.
• Conduct a security round: check that signage is in place, public areas are secure, and that no guests are loitering unsafely.
• Go to the back office. Near the emergency kit, there is a small control screen for the speakers.
• Use that screen to turn off ONLY the outdoor speakers by 22:00. Do not turn off the indoor speakers.`
  },
  {
    id: 2,
    text: "Count Cash Float (10,000 DKK - Danish currency only)",
    info: `• Before the evening shift leaves, open the cash drawer and count all physical money.
• Make sure the float total is exactly 10,000 DKK. If it's more or less, inform the evening shift and resolve the discrepancy.
• Use only Danish currency—no Euros or foreign bills.
• After 00:00, avoid accepting any further cash payments unless necessary (optional procedure).`
  },
  {
    id: 3,
    text: "Assign Remaining Rooms / Handle Overbookings / Set Country Code",
    info: `• Go to Opera Cloud: Front Desk → Arrivals → Search.
• Find unassigned reservations and assign available rooms to each guest.
• In case of overbookings or full house, make smart decisions (e.g., prioritize loyal members, VIPs, or guests already checked in).
• Ensure every reservation has a country code entered. If it's missing, ask the guest during check-in.`
  },
  {
    id: 4,
    text: "Extend Paymaster (PM) Reservations",
    info: `• In Opera Cloud: Front Desk → Departures → Search for Paymaster (PM) reservations.
• Click on the reservation number, then click "Edit."
• Scroll to the stay duration section and add +5 nights to extend.`
  },
  {
    id: 5,
    text: "Scan & Archive Registration Cards",
    info: `• Collect all signed registration cards from the shift.
• At the printer/scanner, place the papers in the top scanner tray.
• On the screen, select "Scanner."
• Choose Destination: Reception and set DPI to 100.
• After scanning, place the scanned cards in the archive folder in the cabinet behind the reception desk.`
  },
  {
    id: 6,
    text: "Print Event List + Package Forecast",
    info: `• After 00:01, check the Reception email inbox.
• Look for emails with attached PDF files titled "Event List" and "Package Forecast."
• Print both documents and delete the email afterward.

Optional Manual Process:
• Go to Opera Cloud → Reports → Manage Reports.
• Search: "Event List Details"
  - Set date to tomorrow.
  - Set filters: ACT, DEF, OPT, TEN.
  - Print and post it in the staff kitchen.
• Search: "Package Forecast"
  - Set date range: Today +14 days.
  - Print and post on the kitchen board.`
  },
  {
    id: 7,
    text: "Fill Out dagens tal",
    info: `- You can find the Excel for dagens tal on our OneDrive. Use the total adults and children from today's and tomorrow's shift and enter them in dagens tal.
- Go to Opera Cloud and check the Property Availability page. Enter the availability numbers and occupancy rate for tomorrow, as well as the number of arrivals, departures, and out of service/out of order rooms.
- For the event field, use the printed Event Details List paper to fill out the field.
- Both the Package Forecast and the Event List will be in the mail by 00:01, so look out for them.`
  },
  {
    id: 8,
    text: "Add Stayover Cleaning Requests",
    info: `• Go to: www.easyguest.dk → Statistics → Services → Cleaning Requests.
• Identify which rooms need cleaning.
• In Opera Cloud: Front Desk → In House → Find Room.
• Click on the arrow → Housekeeping → New → Type "Stayover."
• Set the cleaning date to the next day.`
  },
  {
    id: 9,
    text: "Check Netcompany Guests Have Been Charged",
    info: `• Open Opera Cloud → Bookings → Traces.
• Search for Netcompany guests.
• If charges are missing, verify them via emails or booking notes.
• If something seems off, notify the MOD or write it in the handover email.`
  },
  {
    id: 10,
    text: "Verify Virtual Cards (Booking.com)",
    info: `• Login to Booking.com Extranet.
• Go to: Finance → Virtual Card Management.
• For each virtual card:
  - Copy the Booking Number.
  - In Opera Cloud: Go to Bookings → Manage Reservation → Confirmation No.
  - Paste the Booking Number, but add a % symbol in front (e.g., %123456789).
  - Click arrow → Deposit and Cancellation → New → Type amount to be charged (usually 100%).
  - Save.
  - Click 3 dots (More Actions) → Post Payment.
• Repeat for all virtual cards that require action.`
  },
  {
    id: 11,
    text: "Enter Lufthansa Wake-Up Calls",
    info: `• Open Opera Cloud: Front Desk → Wake-Up Calls → New.
• Input each Lufthansa room number, correct date, and requested time.
• Double-check dates—some guests stay multiple nights.
• Print wake-up list:
  - Reports → Manage Reports → Search "Wake-Up."
  - Set date: Next day → Print.
• If already emailed, print from email instead.`
  },
  {
    id: 12,
    text: "Clean Coffee Machine + Restock Shop",
    info: `Coffee Machine:
• Tap bottom-left of coffee machine screen.
• Click settings icon → Schedule Cleaning.
• Follow step-by-step instructions.
• Cleaning items are stored near the kitchen notice board.
• Use 3 cartons of milk from the breakfast freezer near dishwashing area.

Shop Restocking:
• Inventory Room 1: Corridor behind reception (by foyer doors).
• Inventory Room 2: Basement, across the staff changing rooms. Use staff elevator.
• Take products from inventory → restock minibar/shop shelves in reception.`
  },
  {
    id: 13,
    text: "Delete Unnecessary 6PM Bookings",
    info: `• In Opera Cloud: Front Desk → Arrivals → Search.
• Cancel all reservations marked with 6PM guarantee before night audit begins.
• This prevents overbooking and reporting issues.`
  },
  {
    id: 14,
    text: "Check Mailbox",
    info: `• All pending emails must be replied to by 03:00.
• Prioritize guest inquiries, Booking.com, Lufthansa, and internal communication.`
  },
  {
    id: 15,
    text: "After 03:15 - Cash Count + Drop + Night Audit",
    info: `Cash Drop:
• Count all money again.
• If there's extra (e.g., 175 DKK), go to: Finance → Cashier Closure.
• Match amount with drop → Close cashier → Print PDF.
• Print only the page showing the dropped amount.
• Fill Excel sheet (Scorpio) → Log drop amount → Ensure balance is 0.
• Print both the PDF and Excel → Sign → Archive in reception cabinet.

Night Audit:
• Final checks: delete 6PM bookings, reply to all emails, confirm pre-check-ins.
• Go to: Finance → End of Day → Proceed to Next Day.
• After processing:
  - Print: Financial Transactions, Reservations, No-Shows.`
  },
  {
    id: 16,
    text: "03:40 - Wake Lufthansa Crew + Prepare Breakfast",
    info: `Wake-Up:
• Use reception phone.
• Dial "3" before the room number (e.g., Room 345 → Dial 3345).
• Gently wake them up using a soft, polite voice.

Breakfast:
• Staff canteen → Find Freezer #4 (last in the row).
• Take Lufthansa breakfast trolley.
• Preheat oven: 160°C / 35% humidity / 10 mins.
• Heat bread → Place on marble table near shop/coffee machine.`
  },
  {
    id: 17,
    text: "Financial Transactions + Reservations + No-Shows",
    info: `• Print each document:
  - Financial Transactions → Archive behind Camilla's desk.
  - Reservations → Same archive folder.
  - No-Shows → Place on Mie's desk.`
  },
  {
    id: 18,
    text: "Restart Interface PC",
    info: `• Use 4th front desk PC (named Frontdesk719_04).
• Login:
  - Username: Frontdesk719_04
  - Password: Scandichotels2025
• Open "Interface" program:
  - Password: Funct1on
  - Close all open windows.
  - Log out → Log back in.
  - Reopen Interface → Launch all 5 necessary programs.
  - Close interface → Log out.`
  },
  {
    id: 19,
    text: "Check In Today's PMs",
    info: `• Opera Cloud → Arrivals → Filter: Room Type = "PM" → Search.
• Assign rooms → Check them in.`
  },
  {
    id: 20,
    text: "Check Traces (Fruit Baskets, RB to CC, Stayover Notes)",
    info: `• Opera Cloud → Bookings → Traces.
• Review and confirm all action items have been handled.
• If any pending tasks remain, add to the handover notes.`
  },
  {
    id: 21,
    text: "Shred Old Downtime Reports + Reg Cards (GDPR)",
    info: `• Collect outdated papers from back office.
• Take to garbage room (in front of Freezer #4).
• Put into GDPR bin.
• If full:
  - Opera Cloud → Inventory → Room Maintenance → New.
  - Room: 9007 → Reason: OTHER.
  - Comment: "GDPR bin is full. Please replace."`
  },
  
];

export default night;