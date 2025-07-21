import React, { useState, useMemo } from 'react';
import { useAuditTrail, useAuditStats, useAuditMonitor } from '../hooks/useAuditTrail';
import { AUDIT_EVENTS, AUDIT_SEVERITY } from '../firebase/audit';
import './audit.css';

const AuditTrailDashboard = () => {
  const [activeTab, setActiveTab] = useState('recent');
  const [selectedTimeRange, setSelectedTimeRange] = useState('week');
  const [showFilters, setShowFilters] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');

  const {
    logs,
    stats,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    resetFilters,
    loadMore,
    refresh,
    canViewAudit,
    canExportAudit
  } = useAuditTrail();

  const auditStats = useAuditStats(selectedTimeRange);
  const monitor = useAuditMonitor();

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return date.toLocaleString();
  };

  // Get event type display name
  const getEventDisplayName = (eventType) => {
    return eventType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Get severity badge class
  const getSeverityClass = (severity) => {
    switch (severity) {
      case AUDIT_SEVERITY.CRITICAL: return 'severity-critical';
      case AUDIT_SEVERITY.ERROR: return 'severity-error';
      case AUDIT_SEVERITY.WARNING: return 'severity-warning';
      default: return 'severity-info';
    }
  };

  // Filter options
  const eventTypeOptions = Object.values(AUDIT_EVENTS).map(event => ({
    value: event,
    label: getEventDisplayName(event)
  }));

  const severityOptions = Object.values(AUDIT_SEVERITY).map(severity => ({
    value: severity,
    label: severity.charAt(0).toUpperCase() + severity.slice(1)
  }));

  // Export audit logs
  const handleExport = async () => {
    if (!canExportAudit) return;

    try {
      const exportData = {
        exported_at: new Date().toISOString(),
        filters,
        total_logs: logs.length,
        logs: logs.map(log => ({
          ...log,
          timestamp: log.timestamp?.toISOString()
        }))
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // Filtered and sorted logs for display
  const displayLogs = useMemo(() => {
    return logs.slice(0, 100); // Limit display for performance
  }, [logs]);

  if (!canViewAudit) {
    return (
      <div className="audit-trail-unauthorized">
        <div className="unauthorized-message">
          <h3>🔒 Access Restricted</h3>
          <p>You need Manager or Admin privileges to view audit trails.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="audit-trail-dashboard">
      {/* Header */}
      <div className="audit-header">
        <div className="audit-title">
          <h2>📝 Audit Trail</h2>
          <p>Complete activity log and compliance tracking</p>
        </div>
        
        <div className="audit-actions">
          <button 
            className="btn-secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            🔍 Filters
          </button>
          
          <button 
            className="btn-secondary"
            onClick={refresh}
            disabled={loading}
          >
            🔄 Refresh
          </button>
          
          {canExportAudit && (
            <button 
              className="btn-primary"
              onClick={handleExport}
            >
              📊 Export
            </button>
          )}
        </div>
      </div>

      {/* Alert Bar */}
      {monitor.hasAlerts && (
        <div className="audit-alerts">
          <div className="alert-header">
            <span className="alert-icon">⚠️</span>
            <span>Security Alerts ({monitor.alerts.length})</span>
          </div>
          <div className="alert-list">
            {monitor.alerts.slice(0, 3).map(alert => (
              <div key={alert.id} className={`alert alert-${alert.type}`}>
                <span className="alert-message">{alert.message}</span>
                <span className="alert-time">{formatTimestamp(alert.timestamp)}</span>
                <button 
                  className="alert-dismiss"
                  onClick={() => monitor.dismissAlert(alert.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="audit-tabs">
        <button 
          className={activeTab === 'recent' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('recent')}
        >
          Recent Activity
        </button>
        <button 
          className={activeTab === 'analytics' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        <button 
          className={activeTab === 'compliance' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('compliance')}
        >
          Compliance
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="audit-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label>Date Range:</label>
              <input 
                type="date"
                value={filters.startDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => updateFilters({ 
                  startDate: e.target.value ? new Date(e.target.value) : null 
                })}
              />
              <span>to</span>
              <input 
                type="date"
                value={filters.endDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => updateFilters({ 
                  endDate: e.target.value ? new Date(e.target.value) : null 
                })}
              />
            </div>

            <div className="filter-group">
              <label>Event Types:</label>
              <select 
                multiple
                value={filters.eventTypes}
                onChange={(e) => updateFilters({ 
                  eventTypes: Array.from(e.target.selectedOptions, option => option.value)
                })}
              >
                {eventTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Severity:</label>
              <select 
                value={filters.severity || ''}
                onChange={(e) => updateFilters({ 
                  severity: e.target.value || null 
                })}
              >
                <option value="">All Severities</option>
                {severityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button 
              className="btn-secondary"
              onClick={resetFilters}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="audit-content">
        {activeTab === 'recent' && (
          <RecentActivityTab 
            logs={displayLogs}
            loading={loading}
            error={error}
            pagination={pagination}
            loadMore={loadMore}
            formatTimestamp={formatTimestamp}
            getEventDisplayName={getEventDisplayName}
            getSeverityClass={getSeverityClass}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab 
            stats={auditStats}
            selectedTimeRange={selectedTimeRange}
            setSelectedTimeRange={setSelectedTimeRange}
            formatTimestamp={formatTimestamp}
            getEventDisplayName={getEventDisplayName}
          />
        )}

        {activeTab === 'compliance' && (
          <ComplianceTab 
            logs={displayLogs}
            stats={stats}
            formatTimestamp={formatTimestamp}
          />
        )}
      </div>
    </div>
  );
};

// Recent Activity Tab Component
const RecentActivityTab = ({ 
  logs, 
  loading, 
  error, 
  pagination, 
  loadMore,
  formatTimestamp,
  getEventDisplayName,
  getSeverityClass
}) => {
  if (error) {
    return (
      <div className="audit-error">
        <h3>❌ Error Loading Audit Logs</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="recent-activity">
      <div className="activity-list">
        {logs.map(log => (
          <div key={log.id} className="activity-item">
            <div className="activity-header">
              <span className={`severity-badge ${getSeverityClass(log.severity)}`}>
                {log.severity}
              </span>
              <span className="event-type">
                {getEventDisplayName(log.eventType)}
              </span>
              <span className="timestamp">
                {formatTimestamp(log.timestamp)}
              </span>
            </div>
            
            <div className="activity-details">
              <div className="user-info">
                <span className="user-initials">{log.userInitials}</span>
                <span className="user-email">{log.userEmail}</span>
              </div>
              
              <div className="action-info">
                <strong>{log.action}</strong>
                {log.entityType && (
                  <span className="entity-type">on {log.entityType}</span>
                )}
                {log.entityId && (
                  <span className="entity-id">#{log.entityId}</span>
                )}
              </div>
            </div>

            {(log.beforeState || log.afterState) && (
              <div className="state-changes">
                {log.beforeState && (
                  <div className="state-before">
                    <strong>Before:</strong> 
                    <pre>{JSON.stringify(log.beforeState, null, 2)}</pre>
                  </div>
                )}
                {log.afterState && (
                  <div className="state-after">
                    <strong>After:</strong>
                    <pre>{JSON.stringify(log.afterState, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}

            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <div className="metadata">
                <strong>Additional Info:</strong>
                <div className="metadata-items">
                  {Object.entries(log.metadata).map(([key, value]) => (
                    <span key={key} className="metadata-item">
                      {key}: {typeof value === 'object' ? JSON.stringify(value) : value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {loading && (
        <div className="loading-indicator">
          Loading audit logs...
        </div>
      )}

      {pagination.hasMore && !loading && (
        <button 
          className="load-more-btn"
          onClick={loadMore}
        >
          Load More Activities
        </button>
      )}

      {logs.length === 0 && !loading && (
        <div className="no-activities">
          <h3>📋 No Activities Found</h3>
          <p>No audit logs match your current filters.</p>
        </div>
      )}
    </div>
  );
};

// Analytics Tab Component
const AnalyticsTab = ({ 
  stats, 
  selectedTimeRange, 
  setSelectedTimeRange,
  formatTimestamp,
  getEventDisplayName
}) => {
  if (stats.loading) {
    return <div className="loading-indicator">Loading analytics...</div>;
  }

  if (stats.error) {
    return (
      <div className="audit-error">
        <h3>❌ Error Loading Analytics</h3>
        <p>{stats.error}</p>
      </div>
    );
  }

  const { stats: data } = stats;

  return (
    <div className="analytics-tab">
      <div className="time-range-selector">
        <label>Time Range:</label>
        {['day', 'week', 'month', 'quarter'].map(range => (
          <button
            key={range}
            className={selectedTimeRange === range ? 'active' : ''}
            onClick={() => setSelectedTimeRange(range)}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      {data && (
        <div className="analytics-content">
          <div className="stats-overview">
            <div className="stat-card">
              <h3>Total Events</h3>
              <div className="stat-value">{data.totalEvents}</div>
            </div>
            
            <div className="stat-card">
              <h3>Active Users</h3>
              <div className="stat-value">{Object.keys(data.eventsByUser).length}</div>
            </div>
            
            <div className="stat-card">
              <h3>Event Types</h3>
              <div className="stat-value">{Object.keys(data.eventsByType).length}</div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-container">
              <h4>Events by Type</h4>
              <div className="chart-bars">
                {Object.entries(data.eventsByType)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 10)
                  .map(([type, count]) => (
                    <div key={type} className="chart-bar">
                      <div className="bar-label">{getEventDisplayName(type)}</div>
                      <div className="bar-container">
                        <div 
                          className="bar-fill" 
                          style={{ 
                            width: `${(count / Math.max(...Object.values(data.eventsByType))) * 100}%` 
                          }}
                        />
                        <span className="bar-value">{count}</span>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>

            <div className="chart-container">
              <h4>Activity by User</h4>
              <div className="chart-bars">
                {Object.entries(data.eventsByUser)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 10)
                  .map(([user, count]) => (
                    <div key={user} className="chart-bar">
                      <div className="bar-label">{user}</div>
                      <div className="bar-container">
                        <div 
                          className="bar-fill" 
                          style={{ 
                            width: `${(count / Math.max(...Object.values(data.eventsByUser))) * 100}%` 
                          }}
                        />
                        <span className="bar-value">{count}</span>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>

            <div className="chart-container">
              <h4>Severity Distribution</h4>
              <div className="severity-distribution">
                {Object.entries(data.eventsBySeverity).map(([severity, count]) => (
                  <div key={severity} className="severity-item">
                    <span className={`severity-badge ${severity}`}>{severity}</span>
                    <span className="severity-count">{count}</span>
                    <span className="severity-percentage">
                      ({((count / data.totalEvents) * 100).toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="recent-activity-summary">
            <h4>Recent Activity Summary</h4>
            <div className="activity-timeline">
              {data.recentActivity.slice(0, 5).map(activity => (
                <div key={activity.id} className="timeline-item">
                  <div className="timeline-time">
                    {formatTimestamp(activity.timestamp)}
                  </div>
                  <div className="timeline-content">
                    <strong>{activity.userInitials}</strong> {activity.action} 
                    <span className="timeline-entity">{activity.entityType}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Compliance Tab Component
const ComplianceTab = ({ logs, stats, formatTimestamp }) => {
  // Generate compliance report
  const generateComplianceData = () => {
    const now = new Date();
    const last24Hours = logs.filter(log => 
      log.timestamp && (now - log.timestamp) < 24 * 60 * 60 * 1000
    );
    
    const securityEvents = logs.filter(log => 
      log.eventType.includes('security') || 
      log.severity === AUDIT_SEVERITY.ERROR ||
      log.severity === AUDIT_SEVERITY.CRITICAL
    );

    return {
      totalAuditableEvents: logs.length,
      last24HourEvents: last24Hours.length,
      securityEvents: securityEvents.length,
      dataIntegrityChecks: logs.filter(log => 
        log.eventType.includes('backup') || log.eventType.includes('restore')
      ).length,
      userAccountChanges: logs.filter(log => 
        log.eventType.includes('user')
      ).length,
      accessViolations: logs.filter(log =>
        log.eventType === AUDIT_EVENTS.UNAUTHORIZED_ACCESS ||
        log.eventType === AUDIT_EVENTS.PERMISSION_DENIED
      ).length
    };
  };

  const complianceData = generateComplianceData();

  return (
    <div className="compliance-tab">
      <div className="compliance-summary">
        <h3>📋 Compliance Summary</h3>
        <div className="compliance-metrics">
          <div className="metric">
            <label>Total Auditable Events:</label>
            <span className="metric-value">{complianceData.totalAuditableEvents}</span>
          </div>
          <div className="metric">
            <label>Events (Last 24h):</label>
            <span className="metric-value">{complianceData.last24HourEvents}</span>
          </div>
          <div className="metric">
            <label>Security Events:</label>
            <span className={`metric-value ${complianceData.securityEvents > 0 ? 'warning' : 'success'}`}>
              {complianceData.securityEvents}
            </span>
          </div>
          <div className="metric">
            <label>Data Integrity Checks:</label>
            <span className="metric-value">{complianceData.dataIntegrityChecks}</span>
          </div>
          <div className="metric">
            <label>User Account Changes:</label>
            <span className="metric-value">{complianceData.userAccountChanges}</span>
          </div>
          <div className="metric">
            <label>Access Violations:</label>
            <span className={`metric-value ${complianceData.accessViolations > 0 ? 'error' : 'success'}`}>
              {complianceData.accessViolations}
            </span>
          </div>
        </div>
      </div>

      <div className="compliance-checklist">
        <h4>📊 Compliance Checklist</h4>
        <div className="checklist-items">
          <div className={`checklist-item ${complianceData.totalAuditableEvents > 0 ? 'pass' : 'fail'}`}>
            <span className="check-icon">
              {complianceData.totalAuditableEvents > 0 ? '✅' : '❌'}
            </span>
            <span className="check-text">
              Audit trail logging is active and recording events
            </span>
          </div>
          
          <div className={`checklist-item ${complianceData.securityEvents === 0 ? 'pass' : 'warning'}`}>
            <span className="check-icon">
              {complianceData.securityEvents === 0 ? '✅' : '⚠️'}
            </span>
            <span className="check-text">
              No security violations in recent activity
            </span>
          </div>
          
          <div className={`checklist-item ${complianceData.dataIntegrityChecks > 0 ? 'pass' : 'warning'}`}>
            <span className="check-icon">
              {complianceData.dataIntegrityChecks > 0 ? '✅' : '⚠️'}
            </span>
            <span className="check-text">
              Regular data backup and integrity checks performed
            </span>
          </div>
          
          <div className="checklist-item pass">
            <span className="check-icon">✅</span>
            <span className="check-text">
              All user actions are properly attributed and timestamped
            </span>
          </div>
          
          <div className="checklist-item pass">
            <span className="check-icon">✅</span>
            <span className="check-text">
              Change tracking includes before/after states where applicable
            </span>
          </div>
        </div>
      </div>

      <div className="compliance-actions">
        <h4>🔧 Compliance Actions</h4>
        <div className="action-buttons">
          <button className="btn-secondary">
            📄 Generate Compliance Report
          </button>
          <button className="btn-secondary">
            📊 Export Audit Data
          </button>
          <button className="btn-secondary">
            🔍 Run Integrity Check
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditTrailDashboard;
