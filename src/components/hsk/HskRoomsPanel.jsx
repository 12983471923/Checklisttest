import React, { useEffect, useMemo, useState } from 'react';
import {
  subscribeRooms,
  saveRoom,
  deleteRoom,
  updateRoomStatus,
  ROOM_STATUSES,
} from '../../firebase/hsk';

export default function HskRoomsPanel({ user, canManage = false, role }) {
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState({ roomNumber: '', status: 'Available', notes: '', floor: '' });
  const [editingId, setEditingId] = useState(null);

  const displayName = user?.displayName || user?.email || 'Staff';

  useEffect(() => subscribeRooms(setRooms), []);

  const filtered = useMemo(() => {
    return rooms.filter((r) => {
      const matchSearch = !search || String(r.roomNumber).includes(search.trim());
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [rooms, search, statusFilter]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.roomNumber.trim()) return;
    await saveRoom(
      editingId ? { ...form, id: editingId } : form,
      { uid: user?.uid, name: displayName }
    );
    setForm({ roomNumber: '', status: 'Available', notes: '', floor: '' });
    setEditingId(null);
  };

  const startEdit = (room) => {
    setEditingId(room.id);
    setForm({
      roomNumber: room.roomNumber,
      status: room.status,
      notes: room.notes || '',
      floor: room.floor || '',
    });
  };

  const handleStatusChange = async (roomId, status) => {
    await updateRoomStatus(roomId, status, { uid: user?.uid, name: displayName });
  };

  return (
    <div className="hsk-rooms">
      <div className="hsk-panel-head">
        <h4>Rooms</h4>
        <span className="hsk-muted">{filtered.length} shown</span>
      </div>

      <div className="hsk-room-filters">
        <input
          type="search"
          placeholder="Search room number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {ROOM_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {canManage && (
        <form className="hsk-room-form" onSubmit={handleSave}>
          <input
            type="text"
            placeholder="Room number"
            value={form.roomNumber}
            onChange={(e) => setForm((f) => ({ ...f, roomNumber: e.target.value }))}
            required
          />
          <input
            type="text"
            placeholder="Floor (optional)"
            value={form.floor}
            onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))}
          />
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            {ROOM_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
          <button type="submit">{editingId ? 'Update Room' : 'Add Room'}</button>
          {editingId && (
            <button
              type="button"
              className="hsk-btn-secondary"
              onClick={() => {
                setEditingId(null);
                setForm({ roomNumber: '', status: 'Available', notes: '', floor: '' });
              }}
            >
              Cancel
            </button>
          )}
        </form>
      )}

      <div className="hsk-rooms-list">
        {filtered.length === 0 && <p className="hsk-empty">No rooms match your filters.</p>}
        {filtered.map((room) => (
          <div key={room.id} className="hsk-room-card">
            <div className="hsk-room-card-top">
              <strong>Room {room.roomNumber}</strong>
              <span className={`hsk-status-pill status-${(room.status || '').replace(/\s+/g, '-')}`}>
                {room.status}
              </span>
            </div>
            {room.floor && <p className="hsk-muted">Floor {room.floor}</p>}
            {room.notes && <p>{room.notes}</p>}

            {(canManage || role === 'housekeeping') && (
              <select
                value={room.status}
                onChange={(e) => handleStatusChange(room.id, e.target.value)}
                className="hsk-room-status-select"
              >
                {ROOM_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}

            {canManage && (
              <div className="hsk-room-actions">
                <button type="button" onClick={() => startEdit(room)}>Edit</button>
                <button
                  type="button"
                  className="hsk-btn-danger"
                  onClick={() => {
                    if (window.confirm(`Remove room ${room.roomNumber}?`)) {
                      deleteRoom(room.id);
                    }
                  }}
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
