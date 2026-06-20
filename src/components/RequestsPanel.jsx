import React, { useEffect, useState } from 'react';
import {
  subscribeToRequests,
  createRequest,
  updateRequestStatus,
  markRequestReadByHsk,
  REQUEST_TYPES,
  REQUEST_TYPE_LABELS,
  REQUEST_STATUSES,
  REQUEST_STATUS_LABELS,
} from '../firebase/housekeeping';
import { validateUserInput } from '../utils/security';

const QUICK_REQUESTS = [
  { type: REQUEST_TYPES.ROOM_CLEANING, label: 'Room Cleaning', icon: '🧹' },
  { type: REQUEST_TYPES.EXTRA_TOWELS, label: 'Extra Towels', icon: '🛁' },
  { type: REQUEST_TYPES.ROOM_INSPECTION, label: 'Room Inspection', icon: '🔍' },
  { type: REQUEST_TYPES.MAINTENANCE, label: 'Maintenance', icon: '🔧' },
  { type: REQUEST_TYPES.GUEST_REQUEST, label: 'Guest Request', icon: '🙋' },
];

export default function RequestsPanel({
  mode,
  user,
  userProfile,
  rooms = [],
  onUnreadChange,
  onNewRequest,
}) {
  const [requests, setRequests] = useState([]);
  const [roomFilter, setRoomFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [customRequest, setCustomRequest] = useState({
    type: REQUEST_TYPES.GUEST_REQUEST,
    description: '',
    roomNumber: '',
  });

  useEffect(() => {
    return subscribeToRequests(setRequests);
  }, []);

  const pendingCount =
    mode === 'housekeeping'
      ? requests.filter(
          (r) => !r.readByHsk && r.status !== REQUEST_STATUSES.COMPLETED
        ).length
      : requests.filter((r) => r.status === REQUEST_STATUSES.PENDING).length;

  useEffect(() => {
    if (onUnreadChange) onUnreadChange(pendingCount);
  }, [pendingCount, onUnreadChange]);

  const filteredRequests = requests.filter((r) => {
    if (mode === 'housekeeping' && roomFilter) {
      return r.roomNumber === roomFilter;
    }
    return true;
  });

  const handleQuickRequest = async (type, roomNumber = null) => {
    try {
      await createRequest({
        type,
        title: REQUEST_TYPE_LABELS[type],
        description: '',
        roomNumber,
        createdBy: {
          uid: user.uid,
          name: userProfile?.displayName || user.email,
          department: 'reception',
        },
      });
      if (onNewRequest) onNewRequest(REQUEST_TYPE_LABELS[type]);
    } catch (err) {
      console.error('Failed to create request:', err);
    }
  };

  const handleCustomRequest = async (e) => {
    e.preventDefault();
    const descValidation = validateUserInput(customRequest.description || 'Request', 'notes');
    const roomValidation = customRequest.roomNumber
      ? validateUserInput(customRequest.roomNumber, 'roomNumber')
      : { valid: true, value: null };

    if (!descValidation.valid) return;
    if (!roomValidation.valid) return;

    try {
      await createRequest({
        type: customRequest.type,
        title: REQUEST_TYPE_LABELS[customRequest.type],
        description: descValidation.value,
        roomNumber: roomValidation.value,
        createdBy: {
          uid: user.uid,
          name: userProfile?.displayName || user.email,
          department: 'reception',
        },
      });
      setShowCreate(false);
      setCustomRequest({ type: REQUEST_TYPES.GUEST_REQUEST, description: '', roomNumber: '' });
      if (onNewRequest) onNewRequest(REQUEST_TYPE_LABELS[customRequest.type]);
    } catch (err) {
      console.error('Failed to create request:', err);
    }
  };

  const handleStatusUpdate = async (requestId, status) => {
    try {
      await updateRequestStatus(requestId, status, {
        uid: user.uid,
        name: userProfile?.displayName || user.email,
        initials: userProfile?.initials || '',
      });
      await markRequestReadByHsk(requestId);
    } catch (err) {
      console.error('Failed to update request:', err);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <div className="header-card hsk-requests-card">
      <div className="hsk-section-header">
        <strong>📋 Requests</strong>
        {pendingCount > 0 && <span className="hsk-badge">{pendingCount}</span>}
      </div>

      {mode === 'reception' && (
        <div className="quick-request-grid">
          {QUICK_REQUESTS.map((qr) => (
            <button
              key={qr.type}
              type="button"
              className="quick-request-btn"
              onClick={() => handleQuickRequest(qr.type)}
            >
              <span>{qr.icon}</span>
              <span>{qr.label}</span>
            </button>
          ))}
          <button
            type="button"
            className="quick-request-btn quick-request-btn-custom"
            onClick={() => setShowCreate(true)}
          >
            <span>➕</span>
            <span>Custom Request</span>
          </button>
        </div>
      )}

      {mode === 'housekeeping' && (
        <div className="hsk-room-filter">
          <label htmlFor="room-filter">Filter by room</label>
          <select
            id="room-filter"
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
          >
            <option value="">All rooms</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.roomNumber}>
                Room {room.roomNumber}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="hsk-requests-list">
        {filteredRequests.length === 0 && (
          <p className="hsk-empty-state">No requests yet.</p>
        )}
        {filteredRequests.slice(0, mode === 'reception' ? 8 : 20).map((req) => (
          <div
            key={req.id}
            className={`hsk-request-item hsk-request-${req.status} ${
              mode === 'housekeeping' && !req.readByHsk ? 'hsk-request-unread' : ''
            }`}
          >
            <div className="hsk-request-header">
              <span className="hsk-request-title">{req.title}</span>
              <span className={`hsk-request-status hsk-status-${req.status}`}>
                {REQUEST_STATUS_LABELS[req.status]}
              </span>
            </div>
            {req.roomNumber && (
              <div className="hsk-request-room">Room {req.roomNumber}</div>
            )}
            {req.description && <p className="hsk-request-desc">{req.description}</p>}
            <div className="hsk-request-meta">
              <span>{req.createdBy?.name || 'Reception'}</span>
              <span>{formatTime(req.createdAt)}</span>
            </div>

            {mode === 'housekeeping' && req.status !== REQUEST_STATUSES.COMPLETED && (
              <div className="hsk-request-actions">
                {req.status === REQUEST_STATUSES.PENDING && (
                  <button
                    type="button"
                    className="add-note-btn hsk-action-btn"
                    onClick={() => handleStatusUpdate(req.id, REQUEST_STATUSES.ACCEPTED)}
                  >
                    Accept
                  </button>
                )}
                {(req.status === REQUEST_STATUSES.PENDING ||
                  req.status === REQUEST_STATUSES.ACCEPTED) && (
                  <button
                    type="button"
                    className="add-note-btn hsk-action-btn"
                    onClick={() => handleStatusUpdate(req.id, REQUEST_STATUSES.IN_PROGRESS)}
                  >
                    In Progress
                  </button>
                )}
                <button
                  type="button"
                  className="reset-btn hsk-action-btn"
                  onClick={() => handleStatusUpdate(req.id, REQUEST_STATUSES.COMPLETED)}
                >
                  Complete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showCreate && (
        <div className="info-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="hsk-modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="info-modal-close" onClick={() => setShowCreate(false)}>
              ×
            </button>
            <h3>Create Request</h3>
            <form onSubmit={handleCustomRequest} className="hsk-form">
              <label>
                Type
                <select
                  value={customRequest.type}
                  onChange={(e) =>
                    setCustomRequest((p) => ({ ...p, type: e.target.value }))
                  }
                >
                  {Object.entries(REQUEST_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Room (optional)
                <select
                  value={customRequest.roomNumber}
                  onChange={(e) =>
                    setCustomRequest((p) => ({ ...p, roomNumber: e.target.value }))
                  }
                >
                  <option value="">No specific room</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.roomNumber}>
                      Room {room.roomNumber}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Description
                <textarea
                  value={customRequest.description}
                  onChange={(e) =>
                    setCustomRequest((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Additional details…"
                  rows={3}
                />
              </label>
              <button type="submit" className="add-note-btn">
                Send Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
