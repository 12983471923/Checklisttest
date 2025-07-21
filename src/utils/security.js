// Security and validation utilities
export const validateUserInput = (input, type = 'text') => {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: 'Input is required' };
  }

  const sanitized = input.trim();
  
  switch (type) {
    case 'initials':
      if (sanitized.length < 2 || sanitized.length > 4) {
        return { valid: false, error: 'Initials must be 2-4 characters' };
      }
      if (!/^[A-Za-z]+$/.test(sanitized)) {
        return { valid: false, error: 'Initials must contain only letters' };
      }
      return { valid: true, value: sanitized.toUpperCase() };
      
    case 'username':
      if (sanitized.length < 3 || sanitized.length > 20) {
        return { valid: false, error: 'Username must be 3-20 characters' };
      }
      if (!/^[A-Za-z0-9]+$/.test(sanitized)) {
        return { valid: false, error: 'Username must contain only letters and numbers' };
      }
      return { valid: true, value: sanitized.toLowerCase() };
      
    case 'roomNumber':
      if (!/^[0-9]{1,4}$/.test(sanitized)) {
        return { valid: false, error: 'Room number must be 1-4 digits' };
      }
      return { valid: true, value: sanitized.padStart(3, '0') };
      
    case 'time':
      if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(sanitized)) {
        return { valid: false, error: 'Time must be in HH:MM format' };
      }
      return { valid: true, value: sanitized };
      
    case 'notes':
      if (sanitized.length > 500) {
        return { valid: false, error: 'Notes must be less than 500 characters' };
      }
      // Basic XSS prevention
      const cleanNotes = sanitized
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<[^>]*>/g, '');
      return { valid: true, value: cleanNotes };
      
    default:
      if (sanitized.length > 1000) {
        return { valid: false, error: 'Input too long' };
      }
      return { valid: true, value: sanitized };
  }
};

export const rateLimitLogin = (() => {
  const attempts = new Map();
  const maxAttempts = 5;
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  return (identifier) => {
    const now = Date.now();
    const userAttempts = attempts.get(identifier) || { count: 0, firstAttempt: now };
    
    // Reset if window has passed
    if (now - userAttempts.firstAttempt > windowMs) {
      attempts.set(identifier, { count: 1, firstAttempt: now });
      return { allowed: true, remaining: maxAttempts - 1 };
    }
    
    // Check if limit exceeded
    if (userAttempts.count >= maxAttempts) {
      const timeLeft = Math.ceil((userAttempts.firstAttempt + windowMs - now) / 1000 / 60);
      return { 
        allowed: false, 
        error: `Too many login attempts. Try again in ${timeLeft} minutes.` 
      };
    }
    
    // Increment attempts
    userAttempts.count++;
    attempts.set(identifier, userAttempts);
    
    return { allowed: true, remaining: maxAttempts - userAttempts.count };
  };
})();

export const sanitizeForStorage = (data) => {
  if (typeof data !== 'object' || data === null) return data;
  
  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Basic sanitization
      sanitized[key] = value
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .substring(0, 1000); // Limit length
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForStorage(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

export const logSecurityEvent = (event, details = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    details: sanitizeForStorage(details),
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  // In production, send to logging service
  console.log('Security Event:', logEntry);
  
  // Store locally for debugging
  try {
    const logs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
    logs.push(logEntry);
    // Keep only last 100 logs
    if (logs.length > 100) logs.splice(0, logs.length - 100);
    localStorage.setItem('securityLogs', JSON.stringify(logs));
  } catch (error) {
    console.error('Failed to store security log:', error);
  }
};
