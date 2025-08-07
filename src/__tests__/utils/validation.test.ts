import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePhone,
  validateDate,
  validateMRN,
  validatePassword,
  validateName,
  validateAge,
  validateLabResult,
  validateInsuranceNumber
} from '@/utils/validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('validates correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.org')).toBe(true);
      expect(validateEmail('user_name@sub.domain.com')).toBe(true);
    });

    it('rejects invalid email formats', () => {
      expect(validateEmail('invalid.email')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('user name@example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('user@.com')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('validates correct phone formats', () => {
      expect(validatePhone('1234567890')).toBe(true);
      expect(validatePhone('123-456-7890')).toBe(true);
      expect(validatePhone('(123) 456-7890')).toBe(true);
      expect(validatePhone('+1 123-456-7890')).toBe(true);
      expect(validatePhone('123.456.7890')).toBe(true);
    });

    it('rejects invalid phone formats', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('abcdefghij')).toBe(false);
      expect(validatePhone('')).toBe(false);
      expect(validatePhone('123-45-6789')).toBe(false);
    });
  });

  describe('validateDate', () => {
    it('validates correct date formats', () => {
      expect(validateDate('2023-12-25')).toBe(true);
      expect(validateDate('12/25/2023')).toBe(true);
      expect(validateDate('25-12-2023')).toBe(true);
      expect(validateDate(new Date().toISOString())).toBe(true);
    });

    it('rejects invalid dates', () => {
      expect(validateDate('2023-13-01')).toBe(false);
      expect(validateDate('2023-12-32')).toBe(false);
      expect(validateDate('invalid-date')).toBe(false);
      expect(validateDate('')).toBe(false);
    });

    it('validates date ranges', () => {
      const today = new Date();
      const futureDate = new Date(today.getFullYear() + 1, 0, 1);
      const pastDate = new Date(today.getFullYear() - 1, 0, 1);

      expect(validateDate(futureDate, { maxDate: today })).toBe(false);
      expect(validateDate(pastDate, { minDate: today })).toBe(false);
      expect(validateDate(today, { minDate: pastDate, maxDate: futureDate })).toBe(true);
    });
  });

  describe('validateMRN', () => {
    it('validates correct MRN formats', () => {
      expect(validateMRN('MRN001')).toBe(true);
      expect(validateMRN('123456')).toBe(true);
      expect(validateMRN('PAT-2023-001')).toBe(true);
      expect(validateMRN('A1B2C3')).toBe(true);
    });

    it('rejects invalid MRN formats', () => {
      expect(validateMRN('')).toBe(false);
      expect(validateMRN('MR')).toBe(false); // Too short
      expect(validateMRN('MRN 001')).toBe(false); // Contains space
      expect(validateMRN('MRN@001')).toBe(false); // Special characters
    });
  });

  describe('validatePassword', () => {
    it('validates strong passwords', () => {
      expect(validatePassword('StrongP@ss1')).toBe(true);
      expect(validatePassword('Complex!ty8')).toBe(true);
      expect(validatePassword('P@ssw0rd123')).toBe(true);
    });

    it('rejects weak passwords', () => {
      expect(validatePassword('weak')).toBe(false); // Too short
      expect(validatePassword('password123')).toBe(false); // No uppercase
      expect(validatePassword('PASSWORD123')).toBe(false); // No lowercase
      expect(validatePassword('Password')).toBe(false); // No number
      expect(validatePassword('Password123')).toBe(false); // No special char
      expect(validatePassword('')).toBe(false);
    });

    it('provides specific error messages', () => {
      expect(validatePassword('short', { returnError: true }))
        .toBe('Password must be at least 8 characters');
      expect(validatePassword('nouppercase1!', { returnError: true }))
        .toBe('Password must contain at least one uppercase letter');
      expect(validatePassword('NOLOWERCASE1!', { returnError: true }))
        .toBe('Password must contain at least one lowercase letter');
      expect(validatePassword('NoNumber!', { returnError: true }))
        .toBe('Password must contain at least one number');
      expect(validatePassword('NoSpecial123', { returnError: true }))
        .toBe('Password must contain at least one special character');
    });
  });

  describe('validateName', () => {
    it('validates correct names', () => {
      expect(validateName('John')).toBe(true);
      expect(validateName('Mary-Jane')).toBe(true);
      expect(validateName("O'Connor")).toBe(true);
      expect(validateName('José')).toBe(true);
      expect(validateName('Marie-Claire')).toBe(true);
    });

    it('rejects invalid names', () => {
      expect(validateName('')).toBe(false);
      expect(validateName('J')).toBe(false); // Too short
      expect(validateName('John123')).toBe(false); // Contains numbers
      expect(validateName('John@Doe')).toBe(false); // Special characters
      expect(validateName('   ')).toBe(false); // Only spaces
    });
  });

  describe('validateAge', () => {
    it('validates valid ages', () => {
      expect(validateAge(25)).toBe(true);
      expect(validateAge(0)).toBe(true);
      expect(validateAge(120)).toBe(true);
      expect(validateAge('30')).toBe(true);
    });

    it('rejects invalid ages', () => {
      expect(validateAge(-1)).toBe(false);
      expect(validateAge(150)).toBe(false);
      expect(validateAge('abc')).toBe(false);
      expect(validateAge('')).toBe(false);
      expect(validateAge(null)).toBe(false);
    });

    it('validates age ranges', () => {
      expect(validateAge(17, { min: 18 })).toBe(false);
      expect(validateAge(66, { max: 65 })).toBe(false);
      expect(validateAge(30, { min: 18, max: 65 })).toBe(true);
    });
  });

  describe('validateLabResult', () => {
    it('validates numeric results', () => {
      expect(validateLabResult('5.5', { type: 'numeric', min: 0, max: 10 })).toBe(true);
      expect(validateLabResult('100', { type: 'numeric', min: 0, max: 200 })).toBe(true);
      expect(validateLabResult('-1', { type: 'numeric', min: -10, max: 10 })).toBe(true);
    });

    it('validates text results', () => {
      expect(validateLabResult('Positive', { type: 'text', options: ['Positive', 'Negative'] })).toBe(true);
      expect(validateLabResult('Normal', { type: 'text' })).toBe(true);
    });

    it('validates range results', () => {
      expect(validateLabResult('5-10', { type: 'range' })).toBe(true);
      expect(validateLabResult('<5', { type: 'range' })).toBe(true);
      expect(validateLabResult('>100', { type: 'range' })).toBe(true);
    });

    it('rejects invalid results', () => {
      expect(validateLabResult('abc', { type: 'numeric' })).toBe(false);
      expect(validateLabResult('15', { type: 'numeric', min: 0, max: 10 })).toBe(false);
      expect(validateLabResult('Invalid', { type: 'text', options: ['Valid', 'Other'] })).toBe(false);
      expect(validateLabResult('', { required: true })).toBe(false);
    });
  });

  describe('validateInsuranceNumber', () => {
    it('validates correct insurance numbers', () => {
      expect(validateInsuranceNumber('INS123456')).toBe(true);
      expect(validateInsuranceNumber('A1B2C3D4E5')).toBe(true);
      expect(validateInsuranceNumber('123-456-789')).toBe(true);
      expect(validateInsuranceNumber('GRP.12345')).toBe(true);
    });

    it('rejects invalid insurance numbers', () => {
      expect(validateInsuranceNumber('')).toBe(false);
      expect(validateInsuranceNumber('INS')).toBe(false); // Too short
      expect(validateInsuranceNumber('INS 123')).toBe(false); // Contains space
      expect(validateInsuranceNumber('INS@123')).toBe(false); // Invalid character
    });

    it('validates by insurance provider format', () => {
      expect(validateInsuranceNumber('BCBS123456', { provider: 'BCBS' })).toBe(true);
      expect(validateInsuranceNumber('UHC-123-456', { provider: 'UnitedHealth' })).toBe(true);
      expect(validateInsuranceNumber('123456', { provider: 'Medicare' })).toBe(false); // Medicare needs specific format
    });
  });
});