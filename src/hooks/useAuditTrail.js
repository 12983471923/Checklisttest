import { useState, useEffect, useCallback } from 'react';
import { 
  getAuditLogs, 
  getAuditStats, 
  createAuditLog, 
  AUDIT_EVENTS,
  AUDIT_SEVERITY 
} from '../firebase/audit';
import { useAuth } from './useAuth';

export const useAuditTrail = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    userId: null,
    eventTypes: [],
    entityType: null,
    severity: null
  });
  const [pagination, setPagination] = useState({
    lastDoc: null,
    hasMore: true,
    limit: 25
  });

  // Load audit logs with current filters
  const loadLogs = useCallback(async (reset = false) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      const options = {
        ...filters,
        limit: pagination.limit,
        lastDoc: reset ? null : pagination.lastDoc
      };

      const result = await getAuditLogs(options);
      
      if (result.error) {
        setError(result.error);
        return;
      }

      if (reset) {
        setLogs(result.logs);
      } else {
        setLogs(prev => [...prev, ...result.logs]);
      }

      setPagination(prev => ({
        ...prev,
        lastDoc: result.lastDoc,
        hasMore: result.hasMore
      }));

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, filters, pagination.limit, pagination.lastDoc]);

  // Load audit statistics
  const loadStats = useCallback(async (days = 30) => {
    if (!user) return;

    try {
      const result = await getAuditStats(days);
      
      if (result.error) {
        setError(result.error);
        return;
      }

      setStats(result.stats);
    } catch (err) {
      setError(err.message);
    }
  }, [user]);

  // Create audit log entry
  const logEvent = useCallback(async (eventData) => {
    if (!user) return { success: false, error: 'No user logged in' };

    const enrichedData = {
      ...eventData,
      userId: user.uid,
      userEmail: user.email,
      userInitials: user.initials || user.email?.substring(0, 2).toUpperCase() || 'UNK'
    };

    return await createAuditLog(enrichedData);
  }, [user]);

  // Update filters and reload
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, lastDoc: null }));
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({
      startDate: null,
      endDate: null,
      userId: null,
      eventTypes: [],
      entityType: null,
      severity: null
    });
    setPagination(prev => ({ ...prev, lastDoc: null }));
  }, []);

  // Load more logs (pagination)
  const loadMore = useCallback(() => {
    if (!loading && pagination.hasMore) {
      loadLogs(false);
    }
  }, [loading, pagination.hasMore, loadLogs]);

  // Refresh current view
  const refresh = useCallback(() => {
    setPagination(prev => ({ ...prev, lastDoc: null }));
    loadLogs(true);
    loadStats();
  }, [loadLogs, loadStats]);

  // Load initial data when user is available
  useEffect(() => {
    if (user) {
      loadLogs(true);
      loadStats();
    }
  }, [user, filters]);

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      // Only refresh if we're looking at recent data (no date filters)
      if (!filters.startDate && !filters.endDate) {
        refresh();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user, filters.startDate, filters.endDate, refresh]);

  return {
    // Data
    logs,
    stats,
    
    // State
    loading,
    error,
    filters,
    pagination,
    
    // Actions
    loadLogs,
    loadStats,
    logEvent,
    updateFilters,
    resetFilters,
    loadMore,
    refresh,
    
    // Helper functions
    canViewAudit: user?.role === 'manager' || user?.role === 'admin',
    canExportAudit: user?.role === 'admin'
  };
};

// Hook for audit trail statistics dashboard
export const useAuditStats = (timeRange = 'week') => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const loadStats = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const days = timeRange === 'day' ? 1 :
                  timeRange === 'week' ? 7 :
                  timeRange === 'month' ? 30 :
                  timeRange === 'quarter' ? 90 : 30;

      const result = await getAuditStats(days);
      
      if (result.error) {
        setError(result.error);
        return;
      }

      setStats(result.stats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, timeRange]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refresh: loadStats,
    timeRange
  };
};

// Hook for real-time audit monitoring
export const useAuditMonitor = () => {
  const [recentActivity, setRecentActivity] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const { user } = useAuth();

  const checkForAlerts = useCallback((logs) => {
    const newAlerts = [];
    
    logs.forEach(log => {
      // Check for suspicious activities
      if (log.severity === AUDIT_SEVERITY.ERROR || log.severity === AUDIT_SEVERITY.CRITICAL) {
        newAlerts.push({
          id: log.id,
          type: 'error',
          message: `${log.eventType}: ${log.action}`,
          timestamp: log.timestamp,
          user: log.userInitials
        });
      }

      // Check for unauthorized access attempts
      if (log.eventType === AUDIT_EVENTS.UNAUTHORIZED_ACCESS) {
        newAlerts.push({
          id: log.id,
          type: 'security',
          message: `Unauthorized access attempt by ${log.userEmail}`,
          timestamp: log.timestamp,
          user: log.userInitials
        });
      }

      // Check for unusual activity patterns
      const recentUserActions = logs.filter(l => 
        l.userId === log.userId && 
        Date.now() - l.timestamp.getTime() < 300000 // 5 minutes
      );
      
      if (recentUserActions.length > 20) {
        newAlerts.push({
          id: `rapid_${log.userId}_${Date.now()}`,
          type: 'pattern',
          message: `Rapid activity detected from ${log.userEmail}`,
          timestamp: new Date(),
          user: log.userInitials
        });
      }
    });

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 10)); // Keep last 10 alerts
    }
  }, []);

  const loadRecentActivity = useCallback(async () => {
    if (!user) return;

    try {
      const result = await getAuditLogs({
        limit: 20,
        sortOrder: 'desc'
      });

      if (!result.error) {
        setRecentActivity(result.logs);
        checkForAlerts(result.logs);
      }
    } catch (err) {
      console.error('Error loading recent audit activity:', err);
    }
  }, [user, checkForAlerts]);

  const dismissAlert = useCallback((alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  useEffect(() => {
    if (user && (user.role === 'manager' || user.role === 'admin')) {
      loadRecentActivity();
      
      // Refresh every minute for real-time monitoring
      const interval = setInterval(loadRecentActivity, 60000);
      return () => clearInterval(interval);
    }
  }, [user, loadRecentActivity]);

  return {
    recentActivity,
    alerts,
    dismissAlert,
    refresh: loadRecentActivity,
    hasAlerts: alerts.length > 0
  };
};
