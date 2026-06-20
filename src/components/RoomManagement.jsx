import React, { useEffect, useState } from 'react';
import {
  subscribeToRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  ROOM_STATUSES,
  ROOM_STATUS_LABELS,
} from '../firebase/housekeeping';
import { validateUserInput } from '../utils/security';

const EMPTY_FORM = {
  roomNumber: '',
  floor: '',
  type: 'standard',
  status: ROOM_STATUSES.CLEAN,
  notes: '',
};

export default function RoomManagement({ mode = 'reception' }) {
  const [rooms, setRooms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [roomFilter, setRoomFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    return subscribeToRooms(setRooms);
  }, []);

  const filteredRooms = rooms.filter((room) => {
    if (roomFilter && !room.roomNumber.includes(roomFilter)) return false;
    if (statusFilter && room.status !== statusFilter) return false;
    return true;
  });

  const openCreate = () => {
    setEditingRoom(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (room) => {
    setEditingRoom(room);
    setForm({
      roomNumber: room.roomNumber,
      floor: room.floor || '',
      type: room.type || 'standard',
      status: room.status || ROOM_STATUSES.CLEAN,
      notes: room.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const roomValidation = validateUserInput(form.roomNumber, 'roomNumber');
    if (!roomValidation.valid) {
      alert(roomValidation.error);
      return;
    }

    const notesValidation = form.notes
      ? validateUserInput(form.notes, 'notes')
      : { valid: true, value: '' };
    if (!notesValidation.valid) {
      alert(notesValidation.error);
      return;
    }

    const payload = {
      roomNumber: roomValidation.value,
      floor: form.floor.trim(),
      type: form.type,
      status: form.status,
      notes: notesValidation.value,
    };

    try {
      if (editingRoom) {
        await updateRoom(editingRoom.id, payload);
      } else {
        await createRoom(payload);
      }
      setShowModal(false);
      setForm(EMPTY_FORM);
      setEditingRoom(null);
    } catch (err) {
      console.error('Failed to save room:', err);
      alert('Failed to save room. Please try again.');
    }
  };

  const handleDelete = async (roomId) => {
    if (!window.confirm('Delete this room?')) return;
    try {
      await deleteRoom(roomId);
    } catch (err) {
      console.error('Failed to delete room:', err);
    }
  };

  const handleStatusChange = async (roomId, status) => {
    try {
      await updateRoom(roomId, { status });
    } catch (err) {
      console.error('Failed to update room status:', err);
    }
  };

  return (
    <div className="header-card hsk-rooms-card">
      <div className="hsk-section-header">
        <strong>🚪 Room Management</strong>
        {mode === 'reception' && (
          <button type="button" className="add-note-btn hsk-add-btn" onClick={openCreate}>
            + Add Room
          </button>
        )}
      </div>

      <div className="hsk-room-filter">
        <input
          type="text"
          placeholder="Search room number…"
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(ROOM_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="hsk-rooms-list">
        {filteredRooms.length === 0 && (
          <p className="hsk-empty-state">No rooms configured yet.</p>
        )}
        {filteredRooms.map((room) => (
          <div key={room.id} className={`hsk-room-item hsk-room-${room.status}`}>
            <div className="hsk-room-info">
              <span className="hsk-room-number">Room {room.roomNumber}</span>
              {room.floor && <span className="hsk-room-floor">Floor {room.floor}</span>}
              <span className={`hsk-room-status hsk-status-${room.status}`}>
                {ROOM_STATUS_LABELS[room.status] || room.status}
              </span>
            </div>
            {room.notes && <p className="hsk-room-notes">{room.notes}</p>}
            <div className="hsk-room-actions">
              {mode === 'reception' ? (
                <>
                  <button type="button" className="reset-btn hsk-action-btn" onClick={() => openEdit(room)}>
                    Edit
                  </button>
                  <button type="button" className="reset-btn hsk-action-btn" onClick={() => handleDelete(room.id)}>
                    Delete
                  </button>
                </>
              ) : (
                <select
                  value={room.status}
                  onChange={(e) => handleStatusChange(room.id, e.target.value)}
                  className="hsk-status-select"
                >
                  {Object.entries(ROOM_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && mode === 'reception' && (
        <div className="info-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="hsk-modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="info-modal-close" onClick={() => setShowModal(false)}>
              ×
            </button>
            <h3>{editingRoom ? 'Edit Room' : 'Add Room'}</h3>
            <form onSubmit={handleSubmit} className="hsk-form">
              <label>
                Room Number
                <input
                  type="text"
                  value={form.roomNumber}
                  onChange={(e) => setForm((p) => ({ ...p, roomNumber: e.target.value }))}
                  required
                  maxLength={4}
                />
              </label>
              <label>
                Floor
                <input
                  type="text"
                  value={form.floor}
                  onChange={(e) => setForm((p) => ({ ...p, floor: e.target.value }))}
                  placeholder="e.g. 3"
                />
              </label>
              <label>
                Type
                <select
                  value={form.type}
                  onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                >
                  <option value="standard">Standard</option>
                  <option value="superior">Superior</option>
                  <option value="suite">Suite</option>
                  <option value="accessible">Accessible</option>
                </select>
              </label>
              <label>
                Status
                <select
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                >
                  {Object.entries(ROOM_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Notes
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={2}
                />
              </label>
              <button type="submit" className="add-note-btn">
                {editingRoom ? 'Save Changes' : 'Add Room'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function useRooms() {
  const [rooms, setRooms] = useState([]);
  useEffect(() => {
    return subscribeToRooms(setRooms);
  }, []);
  return rooms;
}
