import React from 'react';
import TeamHandoverPanel from '../TeamHandoverPanel';
import WeatherWidget from '../WeatherWidget';
import { getVisibleBreakfastItems, formatBreakfastPrice } from '../../firebase/database';

function PageHeader({ label, title, subtitle, showWeather = false }) {
  return (
    <header className="ft-page-header">
      <div className="ft-page-header-text">
        {label && <span className="ft-page-eyebrow">{label}</span>}
        <h1 className="ft-display-title">{title}</h1>
        {subtitle && <p className="ft-page-subtitle">{subtitle}</p>}
      </div>
      {showWeather && (
        <div className="ft-weather-pill">
          <WeatherWidget variant="pill" />
        </div>
      )}
    </header>
  );
}

function HotelInfoPanel({ hotelInfo }) {
  return (
    <div className="ft-page">
      <PageHeader
        title="Hotel Information"
        subtitle="Property specifications and operational contact directory."
        showWeather
      />
      <div className="ft-bento-grid">
        <article className="ft-card ft-card-span-8">
          <div className="ft-card-top">
            <div>
              <span className="ft-label-caps">Primary Destination</span>
              <h2 className="ft-card-title">{hotelInfo.name || 'Scandic Falkoner'}</h2>
            </div>
            <div className="ft-icon-circle">
              <span className="material-symbols-outlined">apartment</span>
            </div>
          </div>
          <div className="ft-info-grid">
            <div className="ft-info-row">
              <span className="material-symbols-outlined ft-info-icon">location_on</span>
              <div>
                <span className="ft-label-caps">Address</span>
                <p className="ft-info-value">{hotelInfo.address}</p>
              </div>
            </div>
            <div className="ft-info-row">
              <span className="material-symbols-outlined ft-info-icon">call</span>
              <div>
                <span className="ft-label-caps">Phone</span>
                <p className="ft-info-value">{hotelInfo.phone}</p>
              </div>
            </div>
            <div className="ft-info-row">
              <span className="material-symbols-outlined ft-info-icon">mail</span>
              <div>
                <span className="ft-label-caps">Email</span>
                <p className="ft-info-value">
                  <a href={`mailto:${hotelInfo.email}`}>{hotelInfo.email}</a>
                </p>
              </div>
            </div>
            <div className="ft-info-row">
              <span className="material-symbols-outlined ft-info-icon">login</span>
              <div>
                <span className="ft-label-caps">Check-In</span>
                <p className="ft-info-value">{hotelInfo.checkIn}</p>
              </div>
            </div>
            <div className="ft-info-row">
              <span className="material-symbols-outlined ft-info-icon">logout</span>
              <div>
                <span className="ft-label-caps">Check-Out</span>
                <p className="ft-info-value">{hotelInfo.checkOut}</p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

function TimesPanel({ hotelInfo, breakfastTimes, onBreakfastEdit }) {
  const windows = [
    { title: 'Breakfast', icon: 'restaurant', time: `${breakfastTimes.start} – ${breakfastTimes.end}`, desc: 'Buffet service hours.', editable: true },
    { title: 'Check-Out', icon: 'logout', time: `Until ${hotelInfo.checkOut}`, desc: 'Express check-out available.' },
    { title: 'Check-In', icon: 'login', time: `From ${hotelInfo.checkIn}`, desc: 'Early arrivals via priority queue.' },
  ];

  return (
    <div className="ft-page">
      <PageHeader
        label="Global Standards"
        title="Operational Hours"
        subtitle="Daily service windows and critical operational transitions."
      />
      <div className="ft-times-grid">
        {windows.map((window) => (
          <article key={window.title} className="ft-card ft-time-card">
            <div className="ft-time-card-top">
              <div className="ft-icon-tile">
                <span className="material-symbols-outlined">{window.icon}</span>
              </div>
              {window.editable && (
                <button type="button" className="ft-icon-btn" onClick={onBreakfastEdit} aria-label={`Edit ${window.title}`}>
                  <span className="material-symbols-outlined">edit</span>
                </button>
              )}
            </div>
            <h3 className="ft-time-card-title">{window.title}</h3>
            <p className="ft-time-card-desc">{window.desc}</p>
            <div className="ft-time-card-value">{window.time}</div>
          </article>
        ))}
      </div>
    </div>
  );
}

function PricingPanel({ pricingInfo }) {
  return (
    <div className="ft-page">
      <PageHeader
        title="Service Pricing"
        subtitle="Manage and adjust real-time rates for guest amenities and partner agreements."
      />
      <div className="ft-pricing-grid">
        <article className="ft-card ft-pricing-card">
          <div className="ft-pricing-card-head">
            <div className="ft-pricing-card-brand">
              <div className="ft-icon-tile">
                <span className="material-symbols-outlined">pedal_bike</span>
              </div>
              <div>
                <h3 className="ft-card-title">Bike Rental</h3>
                <p className="ft-label-caps">In-house Guest Rates</p>
              </div>
            </div>
          </div>
          <div className="ft-price-rows">
            <div className="ft-price-row">
              <span className="ft-price-label">Regular rate</span>
              <span className="ft-price-amount">{pricingInfo.bikeRegular} DKK</span>
            </div>
            <div className="ft-price-row">
              <span className="ft-price-label">Lufthansa rate</span>
              <span className="ft-price-amount">{pricingInfo.bikeLufthansa} DKK</span>
            </div>
          </div>
        </article>

        <article className="ft-card ft-pricing-card">
          <div className="ft-pricing-card-head">
            <div className="ft-pricing-card-brand">
              <div className="ft-icon-tile">
                <span className="material-symbols-outlined">restaurant</span>
              </div>
              <div>
                <h3 className="ft-card-title">Breakfast Pricing</h3>
                <p className="ft-label-caps">Buffet &amp; Service</p>
              </div>
            </div>
          </div>
          <div className="ft-price-rows">
            {getVisibleBreakfastItems(pricingInfo).map((item) => (
              <div className="ft-price-row" key={item.id}>
                <span className="ft-price-label">{item.label}</span>
                <span className="ft-price-amount">{formatBreakfastPrice(item)}</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}

function WakeUpPanel({
  wakeUpCalls,
  onAdd,
  onViewAll,
  onToggleComplete,
  onDelete,
  onClearOld,
}) {
  const today = new Date().toISOString().split('T')[0];
  const upcoming = wakeUpCalls.filter((call) => call.date >= today);
  const pending = upcoming.filter((call) => !call.completed);
  const completed = wakeUpCalls.filter((call) => call.completed);

  return (
    <div className="ft-page">
      <PageHeader
        title="Wake-Up Calls"
        subtitle={`${pending.length} pending calls for this shift`}
      />
      <div className="ft-wakeup-layout">
        <div className="ft-wakeup-main">
          {upcoming.length === 0 ? (
            <article className="ft-card ft-wakeup-empty-card">
              <span className="material-symbols-outlined">alarm_off</span>
              <p>No upcoming wake-up calls</p>
            </article>
          ) : (
            <div className="ft-wakeup-grid">
              {upcoming.map((call) => {
                const isOverdue = !call.completed && call.time < new Date().toTimeString().slice(0, 5) && call.date === today;
                return (
                  <article
                    key={call.id}
                    className={`ft-card ft-wakeup-call-card ${call.completed ? 'is-completed' : ''} ${isOverdue ? 'is-overdue' : ''}`}
                  >
                    <div className="ft-wakeup-call-top">
                      <div>
                        <span className={`ft-label-caps ${isOverdue ? 'is-error' : ''}`}>
                          Room {call.roomNumber}{isOverdue ? ' • Overdue' : ''}
                        </span>
                        <h3 className="ft-wakeup-time">{call.time}</h3>
                      </div>
                      <span className="material-symbols-outlined ft-wakeup-call-icon">
                        {isOverdue ? 'error' : 'alarm_on'}
                      </span>
                    </div>
                    <div className="ft-wakeup-call-actions">
                      <button
                        type="button"
                        className={`ft-btn-pill ${call.completed ? 'ft-btn-ghost' : 'ft-btn-primary'}`}
                        onClick={() => onToggleComplete(call.id)}
                      >
                        {call.completed ? 'Mark Pending' : 'Complete'}
                      </button>
                      <button type="button" className="ft-icon-btn" onClick={() => onDelete(call.id)} aria-label="Delete call">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <aside className="ft-wakeup-side">
          <article className="ft-card ft-card-dark ft-wakeup-summary-card">
            <span className="material-symbols-outlined">trending_up</span>
            <div>
              <span className="ft-label-caps ft-on-dark-muted">Call Summary</span>
              <h3 className="ft-wakeup-summary-value">{pending.length} Pending</h3>
            </div>
          </article>
          <article className="ft-card ft-wakeup-stats-card">
            <h4 className="ft-label-caps">Call Summary</h4>
            <div className="ft-stat-rows">
              <div className="ft-stat-row"><span>Pending</span><strong>{pending.length}</strong></div>
              <div className="ft-stat-row"><span>Completed</span><strong>{completed.length}</strong></div>
              <div className="ft-stat-row"><span>Total</span><strong>{wakeUpCalls.length}</strong></div>
            </div>
            <div className="ft-wakeup-side-actions">
              <button type="button" className="ft-btn-primary ft-btn-full" onClick={onAdd}>Add Wake-Up Call</button>
              <button type="button" className="ft-btn-outline ft-btn-full" onClick={onViewAll}>View All</button>
              {wakeUpCalls.length > 0 && (
                <button type="button" className="ft-btn-ghost ft-btn-full" onClick={onClearOld}>Clear Old</button>
              )}
            </div>
          </article>
        </aside>
      </div>
    </div>
  );
}

function HandoverPanel({
  handoverDate,
  savedHandovers,
  onDateChange,
  onEdit,
  onViewAll,
  currentUser,
  isAdmin,
  showDaily,
  showTeam,
}) {
  return (
    <div className="ft-page">
      <PageHeader
        title="Team Handover Log"
        subtitle="Real-time shift transitions and operational updates."
      />
      <div className="ft-handover-layout">
        {showDaily && (
        <aside className="ft-card ft-handover-metrics">
          <span className="ft-label-caps">Shift Metrics</span>
          <div className="ft-stat-rows">
            <div className="ft-stat-row"><span>Days recorded</span><strong>{Object.keys(savedHandovers).length}</strong></div>
          </div>
          <div className="ft-handover-daily">
            <span className="ft-label-caps">Daily Handover</span>
            <input
              type="date"
              value={handoverDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="ft-date-input"
            />
            <div className="ft-handover-preview">
              {savedHandovers[handoverDate] ? (
                <p>{savedHandovers[handoverDate].substring(0, 120)}{savedHandovers[handoverDate].length > 120 ? '...' : ''}</p>
              ) : (
                <p className="ft-muted">No notes for this date</p>
              )}
            </div>
            <button type="button" className="ft-btn-primary ft-btn-full" onClick={onEdit}>
              {savedHandovers[handoverDate] ? 'Edit Notes' : 'Add Notes'}
            </button>
            <button type="button" className="ft-btn-outline ft-btn-full" onClick={onViewAll}>View All Handovers</button>
          </div>
        </aside>
        )}
        {showTeam && (
        <div className="ft-handover-feed">
          <div className="ft-card team-handover-sidebar-card">
            <TeamHandoverPanel user={currentUser} role="reception" isAdmin={isAdmin} embedded />
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

function HubPanel({
  hotelInfo,
  breakfastTimes,
  pricingInfo,
  wakeUpCalls,
  savedHandovers,
  handoverDate,
  onBreakfastEdit,
  onHandoverEdit,
  onWakeUpViewAll,
  onNavigate,
  isWidgetVisible,
}) {
  const today = new Date().toISOString().split('T')[0];
  const pendingWakeups = wakeUpCalls.filter((call) => !call.completed && call.date >= today).length;

  return (
    <div className="ft-page ft-hub-page">
      <header className="ft-hub-header">
        <span className="ft-page-eyebrow">{hotelInfo.name || 'Scandic Falkoner'}</span>
        <h1 className="ft-display-title">Operations Hub</h1>
      </header>

      <div className="ft-hub-stack">
        {isWidgetVisible('hotel-info') && (
          <article className="ft-card ft-hub-card">
            <span className="ft-pill">Property Details</span>
            <h2 className="ft-card-title">{hotelInfo.name || 'Scandic Falkoner'}</h2>
            <div className="ft-hub-lines">
              <div className="ft-hub-line"><span className="material-symbols-outlined">location_on</span><span>{hotelInfo.address}</span></div>
              <div className="ft-hub-line"><span className="material-symbols-outlined">call</span><span>{hotelInfo.phone}</span></div>
              <div className="ft-hub-line"><span className="material-symbols-outlined">mail</span><span>{hotelInfo.email}</span></div>
            </div>
          </article>
        )}

        {isWidgetVisible('hotel-times') && (
          <article className="ft-card ft-card-dark ft-hub-schedule">
            <div className="ft-hub-schedule-head">
              <span className="ft-pill ft-pill-dark">Daily Schedule</span>
              <span className="material-symbols-outlined">schedule</span>
            </div>
            <div className="ft-hub-schedule-rows">
              <div className="ft-hub-schedule-row"><span>Breakfast</span><strong>{breakfastTimes.start} - {breakfastTimes.end}</strong></div>
              <div className="ft-hub-schedule-row"><span>Check-In</span><strong>{hotelInfo.checkIn}</strong></div>
              <div className="ft-hub-schedule-row"><span>Check-Out</span><strong>{hotelInfo.checkOut}</strong></div>
            </div>
            <button type="button" className="ft-btn-ghost-dark" onClick={onBreakfastEdit}>Edit Breakfast Times</button>
          </article>
        )}

        {isWidgetVisible('wakeup') && (
          <article className="ft-card ft-hub-card">
            <div className="ft-hub-card-head">
              <h2 className="ft-card-title">Wake-Up Calls</h2>
              <span className="ft-pill ft-pill-dark">{pendingWakeups}</span>
            </div>
            <div className="ft-hub-wakeup-list">
              {wakeUpCalls.filter((call) => call.date >= today).slice(0, 3).map((call) => (
                <div key={call.id} className="ft-hub-wakeup-item">
                  <span className="material-symbols-outlined">alarm_on</span>
                  <span>Room {call.roomNumber}</span>
                  <strong>{call.time}</strong>
                </div>
              ))}
              {pendingWakeups === 0 && <p className="ft-muted">No upcoming wake-up calls</p>}
            </div>
            <button type="button" className="ft-btn-outline ft-btn-full" onClick={() => onNavigate('wake-up')}>Manage Calls</button>
          </article>
        )}

        {isWidgetVisible('pricing') && (
          <article className="ft-card ft-hub-card">
            <h2 className="ft-card-title">Service Pricing</h2>
            <div className="ft-hub-pricing-grid">
              <div>
                <div className="ft-hub-pricing-label"><span className="material-symbols-outlined">directions_bike</span> Bike Rental</div>
                <div className="ft-hub-price-line"><span>Regular</span><strong>{pricingInfo.bikeRegular} DKK</strong></div>
                <div className="ft-hub-price-line"><span>Lufthansa</span><strong>{pricingInfo.bikeLufthansa} DKK</strong></div>
              </div>
              <div>
                <div className="ft-hub-pricing-label"><span className="material-symbols-outlined">restaurant</span> Breakfast</div>
                {getVisibleBreakfastItems(pricingInfo).slice(0, 2).map((item) => (
                  <div className="ft-hub-price-line" key={item.id}><span>{item.label}</span><strong>{formatBreakfastPrice(item)}</strong></div>
                ))}
              </div>
            </div>
            <button type="button" className="ft-btn-ghost ft-btn-full" onClick={() => onNavigate('pricing')}>View Pricing</button>
          </article>
        )}

        {isWidgetVisible('handover-daily') && (
          <article className="ft-card ft-hub-card">
            <div className="ft-hub-card-head">
              <h2 className="ft-card-title">Team Handover</h2>
              <span className="ft-pill">{Object.keys(savedHandovers).length} Entries</span>
            </div>
            <button type="button" className="ft-btn-primary ft-btn-full" onClick={onHandoverEdit}>New Handover</button>
            {savedHandovers[handoverDate] && (
              <p className="ft-hub-handover-preview">{savedHandovers[handoverDate].substring(0, 100)}...</p>
            )}
            <button type="button" className="ft-btn-ghost ft-btn-full" onClick={() => onNavigate('handover')}>View All History</button>
          </article>
        )}
      </div>
    </div>
  );
}

export default function ReceptionPanels({
  activeView,
  hotelInfo,
  breakfastTimes,
  pricingInfo,
  wakeUpCalls,
  savedHandovers,
  handoverDate,
  currentUser,
  isAdmin,
  isReceptionWidgetVisible,
  onBreakfastEdit,
  onHandoverDateChange,
  onHandoverEdit,
  onHandoverViewAll,
  onWakeUpAdd,
  onWakeUpViewAll,
  onWakeUpToggle,
  onWakeUpDelete,
  onWakeUpClearOld,
  onNavigate,
}) {
  switch (activeView) {
    case 'hub':
      return (
        <HubPanel
          hotelInfo={hotelInfo}
          breakfastTimes={breakfastTimes}
          pricingInfo={pricingInfo}
          wakeUpCalls={wakeUpCalls}
          savedHandovers={savedHandovers}
          handoverDate={handoverDate}
          onBreakfastEdit={onBreakfastEdit}
          onHandoverEdit={onHandoverEdit}
          onWakeUpViewAll={onWakeUpViewAll}
          onNavigate={onNavigate}
          isWidgetVisible={isReceptionWidgetVisible}
        />
      );
    case 'hotel-info':
      if (!isReceptionWidgetVisible('hotel-info')) return null;
      return <HotelInfoPanel hotelInfo={hotelInfo} />;
    case 'times':
      if (!isReceptionWidgetVisible('hotel-times')) return null;
      return <TimesPanel hotelInfo={hotelInfo} breakfastTimes={breakfastTimes} onBreakfastEdit={onBreakfastEdit} />;
    case 'pricing':
      if (!isReceptionWidgetVisible('pricing')) return null;
      return <PricingPanel pricingInfo={pricingInfo} />;
    case 'wake-up':
      if (!isReceptionWidgetVisible('wakeup')) return null;
      return (
        <WakeUpPanel
          wakeUpCalls={wakeUpCalls}
          onAdd={onWakeUpAdd}
          onViewAll={onWakeUpViewAll}
          onToggleComplete={onWakeUpToggle}
          onDelete={onWakeUpDelete}
          onClearOld={onWakeUpClearOld}
        />
      );
    case 'handover':
      if (!isReceptionWidgetVisible('handover-daily') && !isReceptionWidgetVisible('team-handovers')) return null;
      return (
        <HandoverPanel
          handoverDate={handoverDate}
          savedHandovers={savedHandovers}
          onDateChange={onHandoverDateChange}
          onEdit={onHandoverEdit}
          onViewAll={onHandoverViewAll}
          currentUser={currentUser}
          isAdmin={isAdmin}
          showDaily={isReceptionWidgetVisible('handover-daily')}
          showTeam={isReceptionWidgetVisible('team-handovers')}
        />
      );
    default:
      return null;
  }
}
