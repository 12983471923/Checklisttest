// Security and validation utilities

/**
 * Strip HTML/script content from a string.
 * Defence-in-depth against stored XSS; React already escapes rendered text,
 * but this prevents malicious content from ever reaching the database.
 * Handles multi-line script/style blocks, inline JS URIs, and event handlers.
 */
export const stripHtml = (value) => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

export const validateUserInput = (input, type = 'text') => {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: 'Input is required' };
  }

  const sanitized = input.trim();

  switch (type) {
    case 'email':
      if (sanitized.length > 254) {
        return { valid: false, error: 'Email address is too long' };
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized)) {
        return { valid: false, error: 'Enter a valid email address' };
      }
      return { valid: true, value: sanitized.toLowerCase() };

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
      return { valid: true, value: stripHtml(sanitized) };

    case 'longText':
      // For handover notes and other longer free-text fields
      if (sanitized.length > 10000) {
        return { valid: false, error: 'Text must be less than 10,000 characters' };
      }
      return { valid: true, value: stripHtml(sanitized) };

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

    if (now - userAttempts.firstAttempt > windowMs) {
      attempts.set(identifier, { count: 1, firstAttempt: now });
      return { allowed: true, remaining: maxAttempts - 1 };
    }

    if (userAttempts.count >= maxAttempts) {
      const timeLeft = Math.ceil((userAttempts.firstAttempt + windowMs - now) / 1000 / 60);
      return {
        allowed: false,
        error: `Too many login attempts. Try again in ${timeLeft} minutes.`
      };
    }

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
      sanitized[key] = stripHtml(value).substring(0, 1000);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForStorage(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

export const logSecurityEvent = (event, details = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details: sanitizeForStorage(details),
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  // Only log to console during development; never persist auth events in
  // browser storage where they might leak sensitive identifiers.
  if (import.meta.env.DEV) {
    console.log('Security Event:', logEntry);
  }
};
