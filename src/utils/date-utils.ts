/**
 * Date formatting and manipulation utilities
 */

/**
 * Format a date to a localized string
 * @param date - Date to format (Date object, timestamp, or ISO string)
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | number | string,
  options?: Intl.DateTimeFormatOptions
): string => {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }

    // Default options for consistent formatting
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    };

    return dateObj.toLocaleDateString(undefined, defaultOptions);
  } catch {
    return 'Invalid date';
  }
};

/**
 * Format a date with time
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date and time string
 */
export const formatDateTime = (
  date: Date | number | string,
  options?: Intl.DateTimeFormatOptions
): string => {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options
    };

    return dateObj.toLocaleDateString(undefined, defaultOptions);
  } catch {
    return 'Invalid date';
  }
};

/**
 * Format a date as relative time (e.g., "2 hours ago")
 * @param date - Date to format
 * @returns Relative time string
 */
export const formatRelativeTime = (date: Date | number | string): string => {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return formatDate(dateObj);
    }
  } catch {
    return 'Invalid date';
  }
};

/**
 * Get the start of day for a given date
 * @param date - Date to process
 * @returns Date object set to start of day (00:00:00.000)
 */
export const startOfDay = (date: Date = new Date()): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

/**
 * Get the end of day for a given date
 * @param date - Date to process
 * @returns Date object set to end of day (23:59:59.999)
 */
export const endOfDay = (date: Date = new Date()): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

/**
 * Add days to a date
 * @param date - Starting date
 * @param days - Number of days to add (can be negative)
 * @returns New date
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Check if a date is today
 * @param date - Date to check
 * @returns True if date is today
 */
export const isToday = (date: Date | number | string): boolean => {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    const today = new Date();
    
    return (
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear()
    );
  } catch {
    return false;
  }
};

/**
 * Check if a date is in the past
 * @param date - Date to check
 * @returns True if date is in the past
 */
export const isPast = (date: Date | number | string): boolean => {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.getTime() < new Date().getTime();
  } catch {
    return false;
  }
};

/**
 * Check if a date is in the future
 * @param date - Date to check
 * @returns True if date is in the future
 */
export const isFuture = (date: Date | number | string): boolean => {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.getTime() > new Date().getTime();
  } catch {
    return false;
  }
};

/**
 * Get age from birth date
 * @param birthDate - Birth date
 * @returns Age in years
 */
export const calculateAge = (birthDate: Date | number | string): number => {
  try {
    const birth = birthDate instanceof Date ? birthDate : new Date(birthDate);
    const today = new Date();
    
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  } catch {
    return 0;
  }
};

/**
 * Format a duration in milliseconds to human readable string
 * @param milliseconds - Duration in milliseconds
 * @returns Human readable duration
 */
export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return `${seconds} second${seconds > 1 ? 's' : ''}`;
  }
};