import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  where, 
  limit,
  serverTimestamp,
  startAfter,
  endBefore
} from 'firebase/firestore';
import { db } from './config';

// Audit event types
export const AUDIT_EVENTS = {
  // Task operations
  TASK_COMPLETED: 'task_completed',
  TASK_UNCOMPLETED: 'task_uncompleted',
  TASK_NOTE_ADDED: 'task_note_added',
  TASK_NOTE_UPDATED: 'task_note_updated',
  TASK_NOTE_DELETED: 'task_note_deleted',
  
  // Checklist operations
  CHECKLIST_RESET: 'checklist_reset',
  SHIFT_CHANGED: 'shift_changed',
  
  // Handover operations
  HANDOVER_CREATED: 'handover_created',
  HANDOVER_UPDATED: 'handover_updated',
  HANDOVER_DELETED: 'handover_deleted',
  
  // Wake-up call operations
  WAKEUP_CREATED: 'wakeup_created',
  WAKEUP_COMPLETED: 'wakeup_completed',
  WAKEUP_DELETED: 'wakeup_deleted',
  WAKEUP_UPDATED: 'wakeup_updated',
  
  // Breakfast operations
  BREAKFAST_TIMES_UPDATED: 'breakfast_times_updated',
  
  // User operations
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DEACTIVATED: 'user_deactivated',
  
  // System operations
  BACKUP_CREATED: 'backup_created',
  BACKUP_RESTORED: 'backup_restored',
  SYSTEM_ERROR: 'system_error',
  
  // Security events
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  PERMISSION_DENIED: 'permission_denied',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity'
};

// Audit severity levels
export const AUDIT_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

// Create an audit log entry
export const createAuditLog = async (eventData) => {
  try {
    const {
      eventType,
      userId,
      userEmail,
      userInitials,
      entityType, // 'task', 'handover', 'wakeup', 'user', etc.
      entityId,
      action,
      beforeState = null,
      afterState = null,
      metadata = {},
      severity = AUDIT_SEVERITY.INFO,
      ipAddress = null,
      userAgent = null
    } = eventData;

    // Validate required fields
    if (!eventType || !userId || !action) {
      console.warn('Audit log missing required fields:', eventData);
      return { success: false, error: 'Missing required audit fields' };
    }

    const auditEntry = {
      // Event identification
      eventType,
      action,
      severity,
      timestamp: serverTimestamp(),
      
      // User information
      userId,
      userEmail: userEmail || 'unknown',
      userInitials: userInitials || 'UNK',
      
      // Entity information
      entityType: entityType || 'unknown',
      entityId: entityId || null,
      
      // Change tracking
      beforeState: beforeState ? JSON.parse(JSON.stringify(beforeState)) : null,
      afterState: afterState ? JSON.parse(JSON.stringify(afterState)) : null,
      
      // Additional context
      metadata: {
        ...metadata,
        sessionId: getSessionId(),
        shift: getCurrentShift(),
        deviceInfo: getDeviceInfo()
      },
      
      // Technical details
      ipAddress: ipAddress || getClientIP(),
      userAgent: userAgent || navigator.userAgent,
      
      // Auto-generated fields
      id: null, // Will be set by Firestore
      processed: false,
      tags: generateTags(eventType, action, entityType)
    };

    // Add to Firestore
    const auditRef = await addDoc(collection(db, 'auditTrail'), auditEntry);
    
    console.log(`📝 Audit logged: ${eventType} - ${action} (${auditRef.id})`);
    
    return { 
      success: true, 
      auditId: auditRef.id,
      error: null 
    };

  } catch (error) {
    console.error('Failed to create audit log:', error);
    
    // Try to log the failure itself (fallback)
    try {
      await addDoc(collection(db, 'auditTrail'), {
        eventType: AUDIT_EVENTS.SYSTEM_ERROR,
        action: 'audit_log_failed',
        severity: AUDIT_SEVERITY.ERROR,
        timestamp: serverTimestamp(),
        userId: eventData.userId || 'system',
        userEmail: 'system',
        userInitials: 'SYS',
        entityType: 'audit',
        error: error.message,
        originalEventData: eventData,
        metadata: {
          errorType: 'audit_creation_failed',
          originalEventType: eventData.eventType
        }
      });
    } catch (fallbackError) {
      console.error('Failed to log audit failure:', fallbackError);
    }
    
    return { 
      success: false, 
      auditId: null,
      error: error.message 
    };
  }
};

// Get audit logs with filtering and pagination
export const getAuditLogs = async (options = {}) => {
  try {
    const {
      startDate = null,
      endDate = null,
      userId = null,
      eventTypes = [],
      entityType = null,
      severity = null,
      limit: limitCount = 50,
      lastDoc = null,
      sortOrder = 'desc' // 'asc' or 'desc'
    } = options;

    let q = collection(db, 'auditTrail');
    const constraints = [];

    // Date range filtering
    if (startDate) {
      constraints.push(where('timestamp', '>=', startDate));
    }
    if (endDate) {
      constraints.push(where('timestamp', '<=', endDate));
    }

    // User filtering
    if (userId) {
      constraints.push(where('userId', '==', userId));
    }

    // Event type filtering
    if (eventTypes.length > 0) {
      constraints.push(where('eventType', 'in', eventTypes));
    }

    // Entity type filtering
    if (entityType) {
      constraints.push(where('entityType', '==', entityType));
    }

    // Severity filtering
    if (severity) {
      constraints.push(where('severity', '==', severity));
    }

    // Add ordering
    constraints.push(orderBy('timestamp', sortOrder));

    // Add limit
    constraints.push(limit(limitCount));

    // Pagination
    if (lastDoc) {
      if (sortOrder === 'desc') {
        constraints.push(startAfter(lastDoc));
      } else {
        constraints.push(endBefore(lastDoc));
      }
    }

    q = query(q, ...constraints);
    const snapshot = await getDocs(q);
    
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert timestamp to JavaScript Date for easier handling
      timestamp: doc.data().timestamp?.toDate() || new Date()
    }));

    return {
      logs,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === limitCount,
      error: null
    };

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return {
      logs: [],
      lastDoc: null,
      hasMore: false,
      error: error.message
    };
  }
};

// Get audit statistics
export const getAuditStats = async (days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { logs } = await getAuditLogs({
      startDate,
      limit: 1000 // Get more for stats
    });

    const stats = {
      totalEvents: logs.length,
      eventsByType: {},
      eventsByUser: {},
      eventsBySeverity: {},
      recentActivity: logs.slice(0, 10),
      timeRange: {
        start: startDate,
        end: new Date()
      }
    };

    // Aggregate statistics
    logs.forEach(log => {
      // By event type
      stats.eventsByType[log.eventType] = (stats.eventsByType[log.eventType] || 0) + 1;
      
      // By user
      const userKey = `${log.userInitials} (${log.userEmail})`;
      stats.eventsByUser[userKey] = (stats.eventsByUser[userKey] || 0) + 1;
      
      // By severity
      stats.eventsBySeverity[log.severity] = (stats.eventsBySeverity[log.severity] || 0) + 1;
    });

    return { stats, error: null };

  } catch (error) {
    console.error('Error getting audit stats:', error);
    return { stats: null, error: error.message };
  }
};

// Helper functions
const getSessionId = () => {
  // Create or get session ID from localStorage
  let sessionId = localStorage.getItem('audit_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('audit_session_id', sessionId);
  }
  return sessionId;
};

const getCurrentShift = () => {
  // Try to determine current shift from various sources
  const hour = new Date().getHours();
  if (hour >= 23 || hour < 7) return 'Night';
  if (hour >= 7 && hour < 15) return 'Morning';
  return 'Evening';
};

const getDeviceInfo = () => {
  return {
    platform: navigator.platform,
    language: navigator.language,
    screen: {
      width: screen.width,
      height: screen.height
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  };
};

const getClientIP = () => {
  // This would need a service to get real IP
  // For now, return a placeholder
  return 'unknown';
};

const generateTags = (eventType, action, entityType) => {
  const tags = [eventType, action, entityType];
  
  // Add contextual tags
  if (eventType.includes('task')) tags.push('checklist');
  if (eventType.includes('handover')) tags.push('communication');
  if (eventType.includes('wakeup')) tags.push('guest_service');
  if (eventType.includes('user')) tags.push('administration');
  if (eventType.includes('backup')) tags.push('system');
  
  return tags.filter(Boolean);
};

// Convenience functions for common audit events
export const auditTaskChange = async (user, task, action, beforeState = null, afterState = null) => {
  const eventType = action === 'completed' ? AUDIT_EVENTS.TASK_COMPLETED : 
                   action === 'uncompleted' ? AUDIT_EVENTS.TASK_UNCOMPLETED :
                   AUDIT_EVENTS.TASK_NOTE_UPDATED;

  return createAuditLog({
    eventType,
    userId: user.uid,
    userEmail: user.email,
    userInitials: user.initials || 'UNK',
    entityType: 'task',
    entityId: task.id,
    action,
    beforeState,
    afterState,
    metadata: {
      taskText: task.text,
      shift: task.shift || getCurrentShift()
    }
  });
};

export const auditHandoverChange = async (user, handover, action, beforeState = null, afterState = null) => {
  const eventType = action === 'created' ? AUDIT_EVENTS.HANDOVER_CREATED :
                   action === 'updated' ? AUDIT_EVENTS.HANDOVER_UPDATED :
                   AUDIT_EVENTS.HANDOVER_DELETED;

  return createAuditLog({
    eventType,
    userId: user.uid,
    userEmail: user.email,
    userInitials: user.initials || 'UNK',
    entityType: 'handover',
    entityId: handover.date || new Date().toISOString().split('T')[0],
    action,
    beforeState,
    afterState,
    metadata: {
      date: handover.date,
      wordCount: afterState ? afterState.length : 0
    }
  });
};

export const auditWakeupChange = async (user, wakeup, action, beforeState = null, afterState = null) => {
  const eventType = action === 'created' ? AUDIT_EVENTS.WAKEUP_CREATED :
                   action === 'completed' ? AUDIT_EVENTS.WAKEUP_COMPLETED :
                   action === 'updated' ? AUDIT_EVENTS.WAKEUP_UPDATED :
                   AUDIT_EVENTS.WAKEUP_DELETED;

  return createAuditLog({
    eventType,
    userId: user.uid,
    userEmail: user.email,
    userInitials: user.initials || 'UNK',
    entityType: 'wakeup',
    entityId: wakeup.id,
    action,
    beforeState,
    afterState,
    metadata: {
      roomNumber: wakeup.roomNumber,
      time: wakeup.time,
      date: wakeup.date
    }
  });
};

export const auditUserAction = async (actor, target, action, beforeState = null, afterState = null) => {
  const eventType = action === 'created' ? AUDIT_EVENTS.USER_CREATED :
                   action === 'updated' ? AUDIT_EVENTS.USER_UPDATED :
                   action === 'login' ? AUDIT_EVENTS.USER_LOGIN :
                   action === 'logout' ? AUDIT_EVENTS.USER_LOGOUT :
                   AUDIT_EVENTS.USER_DEACTIVATED;

  return createAuditLog({
    eventType,
    userId: actor.uid,
    userEmail: actor.email,
    userInitials: actor.initials || 'UNK',
    entityType: 'user',
    entityId: target.uid || target.id,
    action,
    beforeState,
    afterState,
    metadata: {
      targetEmail: target.email,
      targetRole: target.role || afterState?.role
    },
    severity: action === 'deactivated' ? AUDIT_SEVERITY.WARNING : AUDIT_SEVERITY.INFO
  });
};

export const auditSystemAction = async (user, action, details = {}) => {
  return createAuditLog({
    eventType: AUDIT_EVENTS.BACKUP_CREATED,
    userId: user?.uid || 'system',
    userEmail: user?.email || 'system',
    userInitials: user?.initials || 'SYS',
    entityType: 'system',
    entityId: details.backupId || null,
    action,
    metadata: details,
    severity: details.error ? AUDIT_SEVERITY.ERROR : AUDIT_SEVERITY.INFO
  });
};
