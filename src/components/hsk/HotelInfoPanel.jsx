import { useEffect, useState } from 'react';
import {
  subscribeToBreakfastTimes,
  subscribeToPricingInfo,
  subscribeToHandoverNotes,
  DEFAULT_PRICING,
  getVisibleBreakfastItems,
  formatBreakfastPrice,
} from '../../firebase/database';
import { DEFAULT_HOTEL_INFO } from '../../firebase/dashboardConfig';

export default function HotelInfoPanel({ compact = false, hidePricing = false, hotelInfo: hotelInfoProp }) {
  const [breakfastTimes, setBreakfastTimes] = useState({ start: '07:00', end: '11:00' });
  const [pricingInfo, setPricingInfo] = useState({ ...DEFAULT_PRICING });
  const [savedHandovers, setSavedHandovers] = useState({});
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const u1 = subscribeToBreakfastTimes(setBreakfastTimes);
    const u2 = hidePricing ? () => {} : subscribeToPricingInfo(setPricingInfo);
    const u3 = subscribeToHandoverNotes(setSavedHandovers);
    return () => {
      u1();
      u2();
      u3();
    };
  }, [hidePricing]);

  const breakfastItems = hidePricing ? [] : getVisibleBreakfastItems(pricingInfo);
  const todayHandover = savedHandovers[today];
  const hotel = { ...DEFAULT_HOTEL_INFO, ...hotelInfoProp };

  return (
    <div className={`hsk-hotel-info ${compact ? 'hsk-hotel-info--compact' : ''}`}>
      <h3 className="hsk-panel-title">Hotel Information</h3>

      <div className="hsk-hotel-card-block">
        <strong>{hotel.name}</strong>
        <div className="hsk-info-row">
          <span className="hsk-info-icon">📍</span>
          <div>
            <span className="hsk-hotel-label">Address</span>
            <p>{hotel.address}</p>
          </div>
        </div>
        <div className="hsk-info-row">
          <span className="hsk-info-icon">📞</span>
          <div>
            <span className="hsk-hotel-label">Phone</span>
            <p>{hotel.phone}</p>
          </div>
        </div>
        <div className="hsk-info-row">
          <span className="hsk-info-icon">✉️</span>
          <div>
            <span className="hsk-hotel-label">Email</span>
            <p>
              <a href={`mailto:${hotel.email}`}>{hotel.email}</a>
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
            <p>{hotel.checkOut}</p>
          </div>
          <div>
            <span className="hsk-hotel-label">Check-In</span>
            <p>{hotel.checkIn}</p>
          </div>
        </div>
      </div>

      {!hidePricing && (
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
      )}

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
