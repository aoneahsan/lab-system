import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatTime,
  formatPhoneNumber,
  formatPercentage,
  formatFileSize,
  formatPatientName,
  formatMRN,
  formatAge,
  formatTestStatus,
  formatSampleStatus,
  formatAddress,
  truncateText,
  capitalizeFirst,
  formatDuration,
  formatRelativeTime,
} from '../formatters';

describe('Formatters', () => {
  describe('formatCurrency', () => {
    it('formats positive numbers correctly', () => {
      expect(formatCurrency(100)).toBe('$100.00');
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0.99)).toBe('$0.99');
    });

    it('formats negative numbers correctly', () => {
      expect(formatCurrency(-100)).toBe('-$100.00');
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
    });

    it('handles zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('handles undefined and null', () => {
      expect(formatCurrency(undefined)).toBe('$0.00');
      expect(formatCurrency(null)).toBe('$0.00');
    });
  });

  describe('formatDate', () => {
    it('formats date strings correctly', () => {
      expect(formatDate('2024-01-15')).toBe('01/15/2024');
      expect(formatDate('2024-12-31')).toBe('12/31/2024');
    });

    it('formats Date objects correctly', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date)).toBe('01/15/2024');
    });

    it('handles invalid dates', () => {
      expect(formatDate('invalid')).toBe('--');
      expect(formatDate(null)).toBe('--');
      expect(formatDate(undefined)).toBe('--');
    });

    it('supports custom format', () => {
      expect(formatDate('2024-01-15', 'YYYY-MM-DD')).toBe('2024-01-15');
      expect(formatDate('2024-01-15', 'MMM DD, YYYY')).toBe('Jan 15, 2024');
    });
  });

  describe('formatDateTime', () => {
    it('formats date and time correctly', () => {
      const date = new Date('2024-01-15T14:30:00');
      expect(formatDateTime(date)).toMatch(/01\/15\/2024.*2:30 PM/);
    });

    it('handles different time formats', () => {
      const morning = new Date('2024-01-15T09:05:00');
      expect(formatDateTime(morning)).toMatch(/9:05 AM/);
      
      const evening = new Date('2024-01-15T20:15:00');
      expect(formatDateTime(evening)).toMatch(/8:15 PM/);
    });
  });

  describe('formatPhoneNumber', () => {
    it('formats 10-digit numbers correctly', () => {
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
      expect(formatPhoneNumber('9876543210')).toBe('(987) 654-3210');
    });

    it('handles numbers with country code', () => {
      expect(formatPhoneNumber('11234567890')).toBe('+1 (123) 456-7890');
      expect(formatPhoneNumber('+11234567890')).toBe('+1 (123) 456-7890');
    });

    it('handles numbers with formatting', () => {
      expect(formatPhoneNumber('(123) 456-7890')).toBe('(123) 456-7890');
      expect(formatPhoneNumber('123-456-7890')).toBe('(123) 456-7890');
      expect(formatPhoneNumber('123.456.7890')).toBe('(123) 456-7890');
    });

    it('handles invalid phone numbers', () => {
      expect(formatPhoneNumber('123')).toBe('123');
      expect(formatPhoneNumber('')).toBe('');
      expect(formatPhoneNumber(null)).toBe('');
    });
  });

  describe('formatPercentage', () => {
    it('formats percentages correctly', () => {
      expect(formatPercentage(0.5)).toBe('50%');
      expect(formatPercentage(0.123)).toBe('12.3%');
      expect(formatPercentage(1)).toBe('100%');
      expect(formatPercentage(0)).toBe('0%');
    });

    it('handles decimal places', () => {
      expect(formatPercentage(0.12345, 2)).toBe('12.35%');
      expect(formatPercentage(0.999, 0)).toBe('100%');
    });

    it('handles edge cases', () => {
      expect(formatPercentage(null)).toBe('0%');
      expect(formatPercentage(undefined)).toBe('0%');
      expect(formatPercentage(-0.5)).toBe('-50%');
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(500)).toBe('500 B');
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('formats kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(2048)).toBe('2.0 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('formats megabytes correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(formatFileSize(5.5 * 1024 * 1024)).toBe('5.5 MB');
    });

    it('formats gigabytes correctly', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
      expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB');
    });
  });

  describe('formatPatientName', () => {
    it('formats full names correctly', () => {
      expect(formatPatientName('John', 'Doe')).toBe('Doe, John');
      expect(formatPatientName('Jane', 'Smith', 'Marie')).toBe('Smith, Jane Marie');
    });

    it('handles missing parts', () => {
      expect(formatPatientName('John', '')).toBe('John');
      expect(formatPatientName('', 'Doe')).toBe('Doe');
      expect(formatPatientName('', '')).toBe('');
    });

    it('handles suffix', () => {
      expect(formatPatientName('John', 'Doe', '', 'Jr.')).toBe('Doe Jr., John');
      expect(formatPatientName('John', 'Doe', 'Michael', 'III')).toBe('Doe III, John Michael');
    });
  });

  describe('formatMRN', () => {
    it('formats MRN with padding', () => {
      expect(formatMRN('123')).toBe('MRN-0000123');
      expect(formatMRN('12345')).toBe('MRN-0012345');
      expect(formatMRN('1234567')).toBe('MRN-1234567');
    });

    it('handles long MRNs', () => {
      expect(formatMRN('12345678')).toBe('MRN-12345678');
    });

    it('handles empty MRN', () => {
      expect(formatMRN('')).toBe('MRN-0000000');
      expect(formatMRN(null)).toBe('MRN-0000000');
    });
  });

  describe('formatAge', () => {
    it('formats age from date of birth', () => {
      const today = new Date();
      const yearAgo = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
      expect(formatAge(yearAgo)).toBe('25 years');
    });

    it('formats months for infants', () => {
      const today = new Date();
      const monthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
      expect(formatAge(monthsAgo)).toBe('6 months');
    });

    it('formats days for newborns', () => {
      const today = new Date();
      const daysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10);
      expect(formatAge(daysAgo)).toBe('10 days');
    });

    it('handles invalid dates', () => {
      expect(formatAge(null)).toBe('--');
      expect(formatAge('invalid')).toBe('--');
    });
  });

  describe('formatTestStatus', () => {
    it('formats test statuses correctly', () => {
      expect(formatTestStatus('pending')).toMatchObject({
        text: 'Pending',
        color: 'yellow',
        icon: expect.any(String)
      });

      expect(formatTestStatus('in_progress')).toMatchObject({
        text: 'In Progress',
        color: 'blue',
        icon: expect.any(String)
      });

      expect(formatTestStatus('completed')).toMatchObject({
        text: 'Completed',
        color: 'green',
        icon: expect.any(String)
      });

      expect(formatTestStatus('cancelled')).toMatchObject({
        text: 'Cancelled',
        color: 'gray',
        icon: expect.any(String)
      });
    });
  });

  describe('formatAddress', () => {
    it('formats complete address', () => {
      const address = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'USA'
      };
      expect(formatAddress(address)).toBe('123 Main St, New York, NY 10001, USA');
    });

    it('handles partial address', () => {
      const address = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY'
      };
      expect(formatAddress(address)).toBe('123 Main St, New York, NY');
    });

    it('handles empty address', () => {
      expect(formatAddress({})).toBe('');
      expect(formatAddress(null)).toBe('');
    });
  });

  describe('truncateText', () => {
    it('truncates long text', () => {
      const longText = 'This is a very long text that needs to be truncated';
      expect(truncateText(longText, 20)).toBe('This is a very long...');
    });

    it('does not truncate short text', () => {
      const shortText = 'Short text';
      expect(truncateText(shortText, 20)).toBe('Short text');
    });

    it('handles edge cases', () => {
      expect(truncateText('', 10)).toBe('');
      expect(truncateText(null, 10)).toBe('');
      expect(truncateText('test', 0)).toBe('...');
    });
  });

  describe('capitalizeFirst', () => {
    it('capitalizes first letter', () => {
      expect(capitalizeFirst('hello')).toBe('Hello');
      expect(capitalizeFirst('HELLO')).toBe('Hello');
      expect(capitalizeFirst('hello world')).toBe('Hello world');
    });

    it('handles edge cases', () => {
      expect(capitalizeFirst('')).toBe('');
      expect(capitalizeFirst(null)).toBe('');
      expect(capitalizeFirst('a')).toBe('A');
    });
  });

  describe('formatDuration', () => {
    it('formats duration in milliseconds', () => {
      expect(formatDuration(1000)).toBe('1 second');
      expect(formatDuration(60000)).toBe('1 minute');
      expect(formatDuration(3600000)).toBe('1 hour');
      expect(formatDuration(86400000)).toBe('1 day');
    });

    it('formats complex durations', () => {
      expect(formatDuration(3661000)).toBe('1 hour 1 minute');
      expect(formatDuration(90061000)).toBe('1 day 1 hour');
    });

    it('handles zero and negative', () => {
      expect(formatDuration(0)).toBe('0 seconds');
      expect(formatDuration(-1000)).toBe('0 seconds');
    });
  });

  describe('formatRelativeTime', () => {
    it('formats past times', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      expect(formatRelativeTime(yesterday)).toBe('1 day ago');
      expect(formatRelativeTime(lastWeek)).toBe('7 days ago');
    });

    it('formats future times', () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      expect(formatRelativeTime(tomorrow)).toBe('in 1 day');
      expect(formatRelativeTime(nextWeek)).toBe('in 7 days');
    });

    it('formats just now', () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe('just now');
    });
  });
});