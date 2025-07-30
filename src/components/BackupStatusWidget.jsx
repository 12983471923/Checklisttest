import React, { useState, useEffect } from 'react';
import { getBackupsList } from '../firebase/backup';
import { useAuth } from '../hooks/useAuth.jsx';

const BackupStatusWidget = ({ onClick }) => {
  const { isManager, isAdmin } = useAuth();
  const [backupStatus, setBackupStatus] = useState({
    lastBackup: null,
    status: 'unknown',
    daysAgo: 0,
    loading: true
  });

  useEffect(() => {
    if (isManager || isAdmin) {
      checkBackupStatus();
    }
  }, [isManager, isAdmin]);

  const checkBackupStatus = async () => {
    try {
      const { backups } = await getBackupsList();
      
      if (backups.length === 0) {
        setBackupStatus({
          lastBackup: null,
          status: 'none',
          daysAgo: 0,
          loading: false
        });
        return;
      }

      const lastBackup = backups[0];
      const lastBackupDate = lastBackup.timestamp.seconds 
        ? new Date(lastBackup.timestamp.seconds * 1000)
        : new Date(lastBackup.timestamp);
      
      const now = new Date();
      const daysAgo = Math.floor((now - lastBackupDate) / (1000 * 60 * 60 * 24));
      
      let status = 'good';
      if (daysAgo > 7) status = 'critical';
      else if (daysAgo > 3) status = 'warning';
      else if (lastBackup.status === 'failed') status = 'failed';

      setBackupStatus({
        lastBackup,
        status,
        daysAgo,
        loading: false
      });

    } catch (error) {
      console.error('Error checking backup status:', error);
      setBackupStatus({
        lastBackup: null,
        status: 'error',
        daysAgo: 0,
        loading: false
      });
    }
  };

  // Don't show for regular staff
  if (!isManager && !isAdmin) {
    return null;
  }

  if (backupStatus.loading) {
    return (
      <div className="backup-status-widget loading">
        <div className="backup-status-icon">⏳</div>
        <div className="backup-status-text">Checking...</div>
      </div>
    );
  }

  const getStatusInfo = () => {
    switch (backupStatus.status) {
      case 'none':
        return {
          icon: '❌',
          color: '#e53e3e',
          text: 'No backups found',
          detail: 'Create your first backup'
        };
      case 'critical':
        return {
          icon: '🚨',
          color: '#e53e3e',
          text: `${backupStatus.daysAgo} days ago`,
          detail: 'Backup overdue!'
        };
      case 'warning':
        return {
          icon: '⚠️',
          color: '#dd6b20',
          text: `${backupStatus.daysAgo} days ago`,
          detail: 'Backup needed soon'
        };
      case 'failed':
        return {
          icon: '❌',
          color: '#e53e3e',
          text: 'Last backup failed',
          detail: 'Check backup logs'
        };
      case 'good':
        return {
          icon: '✅',
          color: '#38a169',
          text: backupStatus.daysAgo === 0 ? 'Today' : `${backupStatus.daysAgo} day${backupStatus.daysAgo > 1 ? 's' : ''} ago`,
          detail: 'Backup up to date'
        };
      case 'error':
        return {
          icon: '⚠️',
          color: '#dd6b20',
          text: 'Check failed',
          detail: 'Unable to verify'
        };
      default:
        return {
          icon: '❓',
          color: '#718096',
          text: 'Unknown',
          detail: 'Status unclear'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div 
      className="backup-status-widget"
      onClick={onClick}
      style={{ 
        borderColor: statusInfo.color,
        cursor: 'pointer'
      }}
      title="Click to open backup management"
    >
      <div className="backup-status-header">
        <span className="backup-status-icon">{statusInfo.icon}</span>
        <span className="backup-status-label">Backup Status</span>
      </div>
      <div className="backup-status-info">
        <div className="backup-status-text" style={{ color: statusInfo.color }}>
          {statusInfo.text}
        </div>
        <div className="backup-status-detail">
          {statusInfo.detail}
        </div>
      </div>
    </div>
  );
};

export default BackupStatusWidget;
