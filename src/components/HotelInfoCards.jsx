import React, { useEffect, useState } from 'react';
import {
  subscribeToBreakfastTimes,
  subscribeToPricingInfo,
  DEFAULT_PRICING,
} from '../firebase/database';

export default function HotelInfoCards({ editableBreakfast = false, onEditBreakfast }) {
  const [breakfastTimes, setBreakfastTimes] = useState({ start: '07:00', end: '11:00' });
  const [pricingInfo, setPricingInfo] = useState({ ...DEFAULT_PRICING });

  useEffect(() => {
    const unsubBreakfast = subscribeToBreakfastTimes(setBreakfastTimes);
    const unsubPricing = subscribeToPricingInfo(setPricingInfo);
    return () => {
      unsubBreakfast();
      unsubPricing();
    };
  }, []);

  return (
    <>
      <div className="header-card">
        <strong>🏨 Scandic Falkoner</strong>
        <div className="hotel-info-section">
          <div className="info-item">
            <span className="info-icon">📍</span>
            <div className="info-content">
              <span className="info-label">Address</span>
              <span className="info-value">Falkoner Alle 9, 2000 Frederiksberg, Denmark</span>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">📞</span>
            <div className="info-content">
              <span className="info-label">Phone</span>
              <span className="info-value">+45 72 42 55 00</span>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">✉️</span>
            <div className="info-content">
              <span className="info-label">Email</span>
              <span className="info-value">
                <a href="mailto:falkoner@scandichotels.com">falkoner@scandichotels.com</a>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="header-card">
        <strong>⏰ Hotel Times</strong>
        <div className="hotel-times-section">
          <div className="time-item">
            <span className="time-icon">🍳</span>
            <div className="time-content">
              <span className="time-label">Breakfast</span>
              <div className="breakfast-display">
                <span
                  className={`time-value ${editableBreakfast ? 'time-value-clickable' : ''}`}
                  onClick={editableBreakfast && onEditBreakfast ? onEditBreakfast : undefined}
                  title={editableBreakfast ? 'Click to edit breakfast times' : undefined}
                >
                  {breakfastTimes.start} - {breakfastTimes.end}
                </span>
              </div>
            </div>
          </div>
          <div className="time-item">
            <span className="time-icon">🚪</span>
            <div className="time-content">
              <span className="time-label">Check-Out</span>
              <span className="time-value">12:00</span>
            </div>
          </div>
          <div className="time-item">
            <span className="time-icon">🔑</span>
            <div className="time-content">
              <span className="time-label">Check-In</span>
              <span className="time-value">16:00</span>
            </div>
          </div>
        </div>
      </div>

      <div className="header-card">
        <strong>Pricing Information</strong>
        <div className="pricing-section">
          <div className="pricing-category">
            <strong>🚴 Bike Rental</strong>
            <div className="price-list">
              <div className="price-item">
                <span className="price-label">Regular rate:</span>
                <span className="price-value">{pricingInfo.bikeRegular} DKK per person</span>
              </div>
              <div className="price-item">
                <span className="price-label">Lufthansa rate:</span>
                <span className="price-value">{pricingInfo.bikeLufthansa} DKK per person</span>
              </div>
            </div>
          </div>
          <div className="pricing-category">
            <strong>🍳 Breakfast Pricing</strong>
            <div className="price-list">
              <div className="price-item">
                <span className="price-label">During booking:</span>
                <span className="price-value">{pricingInfo.breakfastDuringBooking} DKK</span>
              </div>
              <div className="price-item">
                <span className="price-label">At check-in:</span>
                <span className="price-value">{pricingInfo.breakfastAtCheckIn} DKK</span>
              </div>
              <div className="price-item">
                <span className="price-label">On the day:</span>
                <span className="price-value">{pricingInfo.breakfastOnTheDay} DKK</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
