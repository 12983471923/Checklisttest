import React, { useState, useEffect } from 'react';
import { 
  createBackup, 
  getBackupsList, 
  getBackupDetails,
  restoreFromBackup,
  exportBackupAsJSON,
  deleteBackup 
} from '../firebase/backup';
import { useAuth } from '../hooks/useAuth';

const BackupManagement = ({ onClose }) => {
  const { isManager, isAdmin, currentUser } = useAuth();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreOptions, setRestoreOptions] = useState({
    selectedCollections: ['checklists', 'handoverNotes', 'wakeUpCalls', 'breakfastTimes'],
    restoreMode: 'replace',
    confirmRestore: false
  });
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({
    totalBackups: 0,
    totalSize: 0,
    lastBackup: null,
    successRate: 0
  });

  // Only managers and admins can access backup management
  if (!isManager && !isAdmin) {
    return (
      <div className="access-denied">
        <h3>Access Denied</h3>
        <p>You don't have permission to manage backups.</p>
        <button onClick={onClose} className="add-note-btn">Close</button>
      </div>
    );
  }

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const { backups: backupsList, error } = await getBackupsList();
      if (error) {
        setMessage(`Error loading backups: ${error}`);
        return;
      }

      setBackups(backupsList);
      
      // Calculate stats
      const successful = backupsList.filter(b => b.status === 'completed');
      const failed = backupsList.filter(b => b.status === 'failed');
      const totalSize = successful.reduce((sum, b) => sum + (b.metadata?.totalSize || 0), 0);
      const lastBackup = backupsList.length > 0 ? backupsList[0] : null;

      setStats({
        totalBackups: backupsList.length,
        totalSize,
        lastBackup,
        successRate: backupsList.length > 0 ? (successful.length / backupsList.length) * 100 : 0
      });

    } catch (error) {
      console.error('Error loading backups:', error);
      setMessage('Failed to load backups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    setMessage('');

    try {
      const result = await createBackup(currentUser.uid, 'manual');
      if (result.success) {
        setMessage(`✅ Backup created successfully! ID: ${result.backupId}`);
        loadBackups(); // Refresh list
      } else {
        setMessage(`❌ Backup failed: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Backup failed: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleExportBackup = async (backupId) => {
    try {
      setMessage('📤 Exporting backup...');
      const result = await exportBackupAsJSON(backupId);
      
      if (result.success) {
        // Create download link
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { 
          type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setMessage('✅ Backup exported successfully!');
      } else {
        setMessage(`❌ Export failed: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Export failed: ${error.message}`);
    }
  };

  const handleRestoreBackup = async () => {
    if (!restoreOptions.confirmRestore) {
      setMessage('❌ Please confirm the restore operation');
      return;
    }

    try {
      setMessage('🔄 Restoring backup...');
      const result = await restoreFromBackup(selectedBackup.id, restoreOptions);
      
      if (result.success) {
        setMessage(`✅ Restore completed! ${result.restored} documents restored.`);
        setShowRestoreModal(false);
        setRestoreOptions(prev => ({ ...prev, confirmRestore: false }));
      } else {
        setMessage(`❌ Restore failed: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Restore failed: ${error.message}`);
    }
  };

  const handleDeleteBackup = async (backupId) => {
    if (!window.confirm('Are you sure you want to delete this backup? This cannot be undone.')) {
      return;
    }

    try {
      const result = await deleteBackup(backupId);
      if (result.success) {
        setMessage('✅ Backup deleted successfully');
        loadBackups(); // Refresh list
      } else {
        setMessage(`❌ Delete failed: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Delete failed: ${error.message}`);
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="backup-loading">
        <div className="loading-spinner"></div>
        <p>Loading backups...</p>
      </div>
    );
  }

  return (
    <div className="info-modal-overlay" onClick={onClose}>
      <div className="backup-management-container" onClick={e => e.stopPropagation()}>
        <div className="backup-management-header">
          <h2>📊 Backup Management</h2>
          <button className="info-modal-close" onClick={onClose}>&times;</button>
        </div>

        {message && (
          <div className={`backup-message ${message.includes('❌') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="backup-management-content">
          {/* Stats Dashboard */}
          <div className="backup-stats">
            <div className="backup-stat-card">
              <div className="backup-stat-number">{stats.totalBackups}</div>
              <div className="backup-stat-label">Total Backups</div>
            </div>
            <div className="backup-stat-card">
              <div className="backup-stat-number">{formatSize(stats.totalSize)}</div>
              <div className="backup-stat-label">Total Size</div>
            </div>
            <div className="backup-stat-card">
              <div className="backup-stat-number">{stats.successRate.toFixed(1)}%</div>
              <div className="backup-stat-label">Success Rate</div>
            </div>
            <div className="backup-stat-card">
              <div className="backup-stat-number">
                {stats.lastBackup ? formatDate(stats.lastBackup.timestamp).split(' ')[0] : 'Never'}
              </div>
              <div className="backup-stat-label">Last Backup</div>
            </div>
          </div>

          {/* Actions */}
          <div className="backup-actions">
            <button 
              className="backup-create-btn"
              onClick={handleCreateBackup}
              disabled={creating}
            >
              {creating ? '🔄 Creating...' : '📦 Create Backup'}
            </button>
            <div className="backup-info">
              <span>💡 Automatic backups run daily. Manual backups can be created anytime.</span>
            </div>
          </div>

          {/* Backups List */}
          <div className="backups-list">
            <h3>Backup History ({backups.length})</h3>
            
            {backups.length === 0 ? (
              <div className="no-backups">
                <div className="no-backups-icon">📦</div>
                <h4>No Backups Found</h4>
                <p>Create your first backup to get started.</p>
                <button className="backup-create-btn" onClick={handleCreateBackup}>
                  Create First Backup
                </button>
              </div>
            ) : (
              <div className="backups-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Documents</th>
                      <th>Size</th>
                      <th>Duration</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map(backup => (
                      <tr key={backup.id} className={backup.status === 'failed' ? 'backup-failed' : ''}>
                        <td>{formatDate(backup.timestamp)}</td>
                        <td>
                          <span className={`backup-type-badge ${backup.type}`}>
                            {backup.type === 'automatic' ? '🤖 Auto' : '👤 Manual'}
                          </span>
                        </td>
                        <td>
                          <span className={`backup-status-badge ${backup.status}`}>
                            {backup.status === 'completed' && '✅ Success'}
                            {backup.status === 'failed' && '❌ Failed'}
                            {backup.status === 'in_progress' && '🔄 Running'}
                          </span>
                        </td>
                        <td>{backup.metadata?.totalDocuments || 0}</td>
                        <td>{formatSize(backup.metadata?.totalSize || 0)}</td>
                        <td>{backup.metadata?.duration ? `${backup.metadata.duration}ms` : '-'}</td>
                        <td>
                          <div className="backup-actions-cell">
                            {backup.status === 'completed' && (
                              <>
                                <button
                                  className="backup-action-btn export"
                                  onClick={() => handleExportBackup(backup.id)}
                                  title="Export as JSON"
                                >
                                  📤
                                </button>
                                {isAdmin && (
                                  <button
                                    className="backup-action-btn restore"
                                    onClick={() => {
                                      setSelectedBackup(backup);
                                      setShowRestoreModal(true);
                                    }}
                                    title="Restore from backup"
                                  >
                                    🔄
                                  </button>
                                )}
                              </>
                            )}
                            {isAdmin && (
                              <button
                                className="backup-action-btn delete"
                                onClick={() => handleDeleteBackup(backup.id)}
                                title="Delete backup"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Restore Modal */}
        {showRestoreModal && selectedBackup && (
          <div className="restore-modal-overlay">
            <div className="restore-modal">
              <h3>🔄 Restore from Backup</h3>
              <div className="restore-warning">
                ⚠️ <strong>Warning:</strong> This will replace current data with backup data. This action cannot be undone.
              </div>
              
              <div className="restore-info">
                <strong>Backup Details:</strong><br/>
                Date: {formatDate(selectedBackup.timestamp)}<br/>
                Documents: {selectedBackup.metadata?.totalDocuments || 0}<br/>
                Size: {formatSize(selectedBackup.metadata?.totalSize || 0)}
              </div>

              <div className="restore-options">
                <h4>Collections to Restore:</h4>
                {['checklists', 'handoverNotes', 'wakeUpCalls', 'breakfastTimes', 'users', 'auditTrail'].map(collection => (
                  <label key={collection} className="restore-collection">
                    <input
                      type="checkbox"
                      checked={restoreOptions.selectedCollections.includes(collection)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setRestoreOptions(prev => ({
                            ...prev,
                            selectedCollections: [...prev.selectedCollections, collection]
                          }));
                        } else {
                          setRestoreOptions(prev => ({
                            ...prev,
                            selectedCollections: prev.selectedCollections.filter(c => c !== collection)
                          }));
                        }
                      }}
                    />
                    {collection}
                  </label>
                ))}
              </div>

              <div className="restore-mode">
                <h4>Restore Mode:</h4>
                <label>
                  <input
                    type="radio"
                    name="restoreMode"
                    value="replace"
                    checked={restoreOptions.restoreMode === 'replace'}
                    onChange={(e) => setRestoreOptions(prev => ({ ...prev, restoreMode: e.target.value }))}
                  />
                  Replace existing data
                </label>
                <label>
                  <input
                    type="radio"
                    name="restoreMode"
                    value="merge"
                    checked={restoreOptions.restoreMode === 'merge'}
                    onChange={(e) => setRestoreOptions(prev => ({ ...prev, restoreMode: e.target.value }))}
                  />
                  Merge with existing data
                </label>
              </div>

              <div className="restore-confirm">
                <label>
                  <input
                    type="checkbox"
                    checked={restoreOptions.confirmRestore}
                    onChange={(e) => setRestoreOptions(prev => ({ ...prev, confirmRestore: e.target.checked }))}
                  />
                  I understand this will replace current data and cannot be undone
                </label>
              </div>

              <div className="restore-actions">
                <button 
                  className="restore-btn"
                  onClick={handleRestoreBackup}
                  disabled={!restoreOptions.confirmRestore || restoreOptions.selectedCollections.length === 0}
                >
                  🔄 Restore Data
                </button>
                <button 
                  className="cancel-btn"
                  onClick={() => {
                    setShowRestoreModal(false);
                    setRestoreOptions(prev => ({ ...prev, confirmRestore: false }));
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackupManagement;
