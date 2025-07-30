import React, { useState, useEffect } from 'react';
import { signUpUser, USER_ROLES, SHIFT_TYPES } from '../firebase/auth';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';

const UserManagement = ({ onClose }) => {
  const { isManager, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    displayName: '',
    initials: '',
    role: USER_ROLES.STAFF,
    shifts: [SHIFT_TYPES.NIGHT, SHIFT_TYPES.MORNING, SHIFT_TYPES.EVENING]
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Only managers and admins can access this
  if (!isManager && !isAdmin) {
    return (
      <div className="access-denied">
        <h3>Access Denied</h3>
        <p>You don't have permission to manage users.</p>
        <button onClick={onClose} className="add-note-btn">Close</button>
      </div>
    );
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setMessage('');

    try {
      const { user, error } = await signUpUser(newUser.email, newUser.password, {
        displayName: newUser.displayName,
        initials: newUser.initials.toUpperCase(),
        role: newUser.role,
        shifts: newUser.shifts
      });

      if (error) {
        setMessage(`Error: ${error}`);
      } else {
        setMessage('User created successfully!');
        setNewUser({
          email: '',
          password: '',
          displayName: '',
          initials: '',
          role: USER_ROLES.STAFF,
          shifts: [SHIFT_TYPES.NIGHT, SHIFT_TYPES.MORNING, SHIFT_TYPES.EVENING]
        });
        setShowAddUser(false);
        loadUsers(); // Refresh user list
      }
    } catch (error) {
      setMessage('Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  };

  const toggleUserActive = async (userId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isActive: !currentStatus
      });
      loadUsers(); // Refresh list
      setMessage(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating user status:', error);
      setMessage('Failed to update user status');
    }
  };

  const handleShiftToggle = (shift) => {
    setNewUser(prev => ({
      ...prev,
      shifts: prev.shifts.includes(shift)
        ? prev.shifts.filter(s => s !== shift)
        : [...prev.shifts, shift]
    }));
  };

  if (loading) {
    return (
      <div className="user-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="info-modal-overlay" onClick={onClose}>
      <div className="user-management-container" onClick={e => e.stopPropagation()}>
        <div className="user-management-header">
          <h2>👥 User Management</h2>
          <button className="info-modal-close" onClick={onClose}>&times;</button>
        </div>

        {message && (
          <div className={`user-management-message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="user-management-content">
          <div className="user-management-actions">
            <button 
              className="add-note-btn"
              onClick={() => setShowAddUser(!showAddUser)}
            >
              {showAddUser ? 'Cancel' : '+ Add New User'}
            </button>
          </div>

          {showAddUser && (
            <div className="add-user-form">
              <h3>Create New User</h3>
              <form onSubmit={handleCreateUser}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="user@scandichotels.com"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Strong password"
                      minLength="6"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Display Name</label>
                    <input
                      type="text"
                      value={newUser.displayName}
                      onChange={(e) => setNewUser(prev => ({ ...prev, displayName: e.target.value }))}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Initials</label>
                    <input
                      type="text"
                      value={newUser.initials}
                      onChange={(e) => setNewUser(prev => ({ ...prev, initials: e.target.value.toUpperCase() }))}
                      placeholder="JD"
                      maxLength="4"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                    >
                      <option value={USER_ROLES.STAFF}>Staff</option>
                      <option value={USER_ROLES.MANAGER}>Manager</option>
                      {isAdmin && <option value={USER_ROLES.ADMIN}>Admin</option>}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Allowed Shifts</label>
                  <div className="shift-checkboxes">
                    {Object.values(SHIFT_TYPES).map(shift => (
                      <label key={shift} className="shift-checkbox">
                        <input
                          type="checkbox"
                          checked={newUser.shifts.includes(shift)}
                          onChange={() => handleShiftToggle(shift)}
                        />
                        {shift.charAt(0).toUpperCase() + shift.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="add-note-btn"
                    disabled={createLoading}
                  >
                    {createLoading ? 'Creating...' : 'Create User'}
                  </button>
                  <button 
                    type="button" 
                    className="reset-btn"
                    onClick={() => setShowAddUser(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="users-list">
            <h3>Existing Users ({users.length})</h3>
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Initials</th>
                    <th>Role</th>
                    <th>Shifts</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className={!user.isActive ? 'user-inactive' : ''}>
                      <td>{user.displayName}</td>
                      <td>{user.email}</td>
                      <td><span className="initials-chip">{user.initials}</span></td>
                      <td><span className={`role-badge role-${user.role}`}>{user.role}</span></td>
                      <td>{user.shifts?.join(', ') || 'None'}</td>
                      <td>
                        <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        {user.lastLogin ? 
                          new Date(user.lastLogin.seconds * 1000).toLocaleDateString() : 
                          'Never'
                        }
                      </td>
                      <td>
                        <button
                          className={`user-action-btn ${user.isActive ? 'deactivate' : 'activate'}`}
                          onClick={() => toggleUserActive(user.id, user.isActive)}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
