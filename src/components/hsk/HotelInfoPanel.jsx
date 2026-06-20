import { useEffect, useState } from 'react';
import {
  subscribeToBreakfastTimes,
  subscribeToPricingInfo,
  subscribeToHandoverNotes,
  DEFAULT_PRICING,
  getVisibleBreakfastItems,
  formatBreakfastPrice,
} from '../../firebase/database';

export default function HotelInfoPanel({ compact = false }) {
  const [breakfastTimes, setBreakfastTimes] = useState({ start: '07:00', end: '11:00' });
  const [pricingInfo, setPricingInfo] = useState({ ...DEFAULT_PRICING });
  const [savedHandovers, setSavedHandovers] = useState({});
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const u1 = subscribeToBreakfastTimes(setBreakfastTimes);
    const u2 = subscribeToPricingInfo(setPricingInfo);
    const u3 = subscribeToHandoverNotes(setSavedHandovers);
    return () => {
      u1();
      u2();
      u3();
    };
  }, []);

  const breakfastItems = getVisibleBreakfastItems(pricingInfo);
  const todayHandover = savedHandovers[today];

  return (
    <div className={`hsk-hotel-info ${compact ? 'hsk-hotel-info--compact' : ''}`}>
      <h3 className="hsk-panel-title">Hotel Information</h3>

      <div className="hsk-hotel-card-block">
        <strong>Scandic Falkoner</strong>
        <div className="hsk-info-row">
          <span className="hsk-info-icon">📍</span>
          <div>
            <span className="hsk-hotel-label">Address</span>
            <p>Falkoner Alle 9, 2000 Frederiksberg, Denmark</p>
          </div>
        </div>
        <div className="hsk-info-row">
          <span className="hsk-info-icon">📞</span>
          <div>
            <span className="hsk-hotel-label">Phone</span>
            <p>+45 72 42 55 00</p>
          </div>
        </div>
        <div className="hsk-info-row">
          <span className="hsk-info-icon">✉️</span>
          <div>
            <span className="hsk-hotel-label">Email</span>
            <p>
              <a href="mailto:falkoner@scandichotels.com">falkoner@scandichotels.com</a>
            </p>
          </div>
        </div>
      </div>

      <div className="hsk-hotel-card-block">
        <strong>Hotel Times</strong>
        <div className="hsk-times-grid">
          <div>
            <span className="hsk-hotel-label">Breakfast</span>
            <p>{breakfastTimes.start} – {breakfastTimes.end}</p>
          </div>
          <div>
            <span className="hsk-hotel-label">Check-Out</span>
            <p>12:00</p>
          </div>
          <div>
            <span className="hsk-hotel-label">Check-In</span>
            <p>16:00</p>
          </div>
        </div>
      </div>

      <div className="hsk-hotel-card-block">
        <strong>Pricing</strong>
        <div className="hsk-price-row">
          <span>Regular bike rental</span>
          <strong>{pricingInfo.bikeRegular} DKK</strong>
        </div>
        <div className="hsk-price-row">
          <span>Lufthansa bike rate</span>
          <strong>{pricingInfo.bikeLufthansa} DKK</strong>
        </div>
        {breakfastItems.map((item) => (
          <div className="hsk-price-row" key={item.id}>
            <span>{item.label}</span>
            <strong>{formatBreakfastPrice(item)}</strong>
          </div>
        ))}
      </div>

      <div className="hsk-hotel-card-block">
        <strong>Today&apos;s Handover</strong>
        {todayHandover ? (
          <p className="hsk-handover-preview">{todayHandover}</p>
        ) : (
          <p className="hsk-handover-empty">No handover notes for today yet.</p>
        )}
      </div>
    </div>
  );
}
