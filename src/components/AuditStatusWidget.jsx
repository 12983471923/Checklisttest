import React from 'react';
import { useAuditMonitor } from '../hooks/useAuditTrail';
import { useAuth } from '../hooks/useAuth';
import './audit.css';

const AuditStatusWidget = ({ onViewDetails }) => {
  const { user } = useAuth();
  const { recentActivity, alerts, hasAlerts } = useAuditMonitor();

  // Don't show to regular employees
  if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
    return null;
  }

  // Format timestamp for widget display
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const now = new Date();
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Get activity summary
  const getActivitySummary = () => {
    if (recentActivity.length === 0) return 'No recent activity';
    
    const lastActivity = recentActivity[0];
    return `Last: ${lastActivity.userInitials} ${lastActivity.action}`;
  };

  return (
    <div className="audit-status-widget">
      <div className="widget-header">
        <div className="widget-title">
          <span className="widget-icon">📝</span>
          <span className="widget-name">Audit Trail</span>
          {hasAlerts && (
            <span className="alert-indicator">⚠️</span>
          )}
        </div>
        
        <button 
          className="widget-expand"
          onClick={onViewDetails}
          title="View full audit trail"
        >
          📊
        </button>
      </div>

      <div className="widget-content">
        {/* Alerts Section */}
        {hasAlerts && (
          <div className="widget-alerts">
            <div className="alert-summary">
              <span className="alert-count">{alerts.length}</span>
              <span className="alert-text">Security Alert{alerts.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="latest-alert">
              {alerts[0]?.message}
            </div>
          </div>
        )}

        {/* Activity Summary */}
        <div className="activity-summary">
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-label">Events Today:</span>
              <span className="stat-value">
                {recentActivity.filter(activity => {
                  const today = new Date();
                  const activityDate = activity.timestamp instanceof Date ? 
                    activity.timestamp : activity.timestamp.toDate();
                  return activityDate.toDateString() === today.toDateString();
                }).length}
              </span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Last Activity:</span>
              <span className="stat-value">
                {recentActivity.length > 0 ? formatTimeAgo(recentActivity[0].timestamp) : 'None'}
              </span>
            </div>
          </div>

          <div className="recent-summary">
            {getActivitySummary()}
          </div>
        </div>

        {/* Recent Activity Preview */}
        <div className="recent-preview">
          <div className="preview-header">Recent Events:</div>
          <div className="preview-list">
            {recentActivity.slice(0, 3).map((activity, index) => (
              <div key={activity.id || index} className="preview-item">
                <span className="preview-user">{activity.userInitials}</span>
                <span className="preview-action">{activity.action}</span>
                <span className="preview-time">{formatTimeAgo(activity.timestamp)}</span>
              </div>
            ))}
            
            {recentActivity.length === 0 && (
              <div className="preview-empty">No recent activity</div>
            )}
          </div>
        </div>
      </div>

      <div className="widget-footer">
        <button 
          className="view-details-btn"
          onClick={onViewDetails}
        >
          View Full Audit Trail →
        </button>
      </div>
    </div>
  );
};

export default AuditStatusWidget;
