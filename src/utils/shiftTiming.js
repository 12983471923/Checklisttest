// Shift timing configuration and utilities

// Define shift time boundaries (24-hour format)
// Based on actual hotel shift patterns: Night (10PM-7AM), Day (7AM-7PM), Evening (alternative patterns)
export const SHIFT_TIMES = {
  Night: {
    start: 22, // 10 PM (some shifts start at 9:30 PM, using 22 as safe boundary)
    end: 7,    // 7 AM (next day)
    crossesMidnight: true
  },
  Morning: {
    start: 7,  // 7 AM
    end: 19,   // 7 PM (12-hour day shift)
    crossesMidnight: false
  },
  Evening: {
    start: 22, // 10 PM (alternative evening/night shift)
    end: 8,    // 8 AM (next day) - for 10PM-8AM shifts
    crossesMidnight: true
  }
};

/**
 * Generate a session date for a shift that handles midnight crossover
 * @param {string} shift - The shift name (Night, Morning, Evening)
 * @param {Date} currentTime - Current time (defaults to now)
 * @returns {Date} The appropriate session date for the shift
 */
export const getShiftSessionDate = (shift, currentTime = new Date()) => {
  const now = new Date(currentTime);
  const hour = now.getHours();
  const shiftConfig = SHIFT_TIMES[shift];
  
  if (!shiftConfig) {
    // Fallback to current date for unknown shifts
    return now;
  }
  
  if (shiftConfig.crossesMidnight) {
    // For shifts that cross midnight (Night: 10PM-7AM, Evening: 10PM-8AM)
    // If current time is before the shift end time, it's still part of the previous day's shift
    if (hour < shiftConfig.end) {
      const previousDay = new Date(now);
      previousDay.setDate(previousDay.getDate() - 1);
      return previousDay;
    }
    // Special case: If it's between 9 PM and shift start (10 PM), also use previous day
    // This handles early arrivals (like 9:30 PM start times)
    if (hour === 21) { // 9 PM hour - preparing for night shift
      const previousDay = new Date(now);
      previousDay.setDate(previousDay.getDate() - 1);
      return previousDay;
    }
  }
  
  return now;
};

/**
 * Generate a session ID based on shift and shift-specific date logic
 * @param {string} shift - The shift name
 * @param {Date} currentTime - Current time (defaults to now)
 * @returns {string} Session ID in format: "shift_YYYY-MM-DD"
 */
export const generateShiftSessionId = (shift, currentTime = new Date()) => {
  const sessionDate = getShiftSessionDate(shift, currentTime);
  const dateStr = sessionDate.toISOString().split('T')[0]; // YYYY-MM-DD format
  return `${shift.toLowerCase()}_${dateStr}`;
};

/**
 * Check if the current time is within a specific shift
 * @param {string} shift - The shift name
 * @param {Date} currentTime - Current time (defaults to now)
 * @returns {boolean} True if currently within the shift time
 */
export const isWithinShiftTime = (shift, currentTime = new Date()) => {
  const now = new Date(currentTime);
  const hour = now.getHours();
  const shiftConfig = SHIFT_TIMES[shift];
  
  if (!shiftConfig) return false;
  
  if (shiftConfig.crossesMidnight) {
    // Shift crosses midnight (e.g., 23:00 to 07:00)
    return hour >= shiftConfig.start || hour < shiftConfig.end;
  } else {
    // Normal shift within same day
    return hour >= shiftConfig.start && hour < shiftConfig.end;
  }
};

