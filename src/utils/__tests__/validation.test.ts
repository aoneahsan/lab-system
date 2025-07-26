import { describe, it, expect } from 'vitest';
import { 
  validateEmail, 
  validatePassword, 
  validatePhone, 
  validateMRN,
  validateDate,
  validateAge,
  validateLabValue
} from '../validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@company.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      expect(validatePassword('Password123!')).toBe(true);
      expect(validatePassword('Str0ng@Pass')).toBe(true);
      expect(validatePassword('Complex1ty!')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(validatePassword('password')).toBe(false); // no uppercase, numbers, special chars
      expect(validatePassword('PASSWORD')).toBe(false); // no lowercase, numbers, special chars
      expect(validatePassword('Password')).toBe(false); // no numbers, special chars
      expect(validatePassword('Pass123')).toBe(false); // no special chars, too short
      expect(validatePassword('P@ss1')).toBe(false); // too short
      expect(validatePassword('')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should validate correct phone numbers', () => {
      expect(validatePhone('(555) 123-4567')).toBe(true);
      expect(validatePhone('555-123-4567')).toBe(true);
      expect(validatePhone('5551234567')).toBe(true);
      expect(validatePhone('+1 555 123 4567')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('invalid')).toBe(false);
      expect(validatePhone('')).toBe(false);
    });
  });

  describe('validateMRN', () => {
    it('should validate correct MRN formats', () => {
      expect(validateMRN('MRN123456')).toBe(true);
      expect(validateMRN('123456')).toBe(true);
      expect(validateMRN('PT-2024-001')).toBe(true);
    });

    it('should reject invalid MRN formats', () => {
      expect(validateMRN('MR')).toBe(false); // too short
      expect(validateMRN('')).toBe(false);
      expect(validateMRN('123')).toBe(false); // too short
    });
  });

  describe('validateDate', () => {
    it('should validate correct dates', () => {
      expect(validateDate('2024-01-15')).toBe(true);
      expect(validateDate('01/15/2024')).toBe(true);
      expect(validateDate(new Date())).toBe(true);
    });

    it('should reject invalid dates', () => {
      expect(validateDate('invalid')).toBe(false);
      expect(validateDate('2024-13-01')).toBe(false); // invalid month
      expect(validateDate('2024-01-32')).toBe(false); // invalid day
      expect(validateDate('')).toBe(false);
    });
  });

  describe('validateAge', () => {
    it('should validate reasonable ages', () => {
      expect(validateAge(25)).toBe(true);
      expect(validateAge(0)).toBe(true);
      expect(validateAge(100)).toBe(true);
      expect(validateAge('45')).toBe(true);
    });

    it('should reject invalid ages', () => {
      expect(validateAge(-1)).toBe(false);
      expect(validateAge(150)).toBe(false);
      expect(validateAge('invalid')).toBe(false);
      expect(validateAge('')).toBe(false);
    });
  });

  describe('validateLabValue', () => {
    it('should validate numeric lab values within range', () => {
      expect(validateLabValue(100, 70, 110)).toBe(true);
      expect(validateLabValue(70, 70, 110)).toBe(true);
      expect(validateLabValue(110, 70, 110)).toBe(true);
      expect(validateLabValue('85', 70, 110)).toBe(true);
    });

    it('should reject values outside range', () => {
      expect(validateLabValue(50, 70, 110)).toBe(false);
      expect(validateLabValue(150, 70, 110)).toBe(false);
      expect(validateLabValue('invalid', 70, 110)).toBe(false);
      expect(validateLabValue('', 70, 110)).toBe(false);
    });

    it('should handle values without range validation', () => {
      expect(validateLabValue(100)).toBe(true);
      expect(validateLabValue('50.5')).toBe(true);
      expect(validateLabValue('invalid')).toBe(false);
    });
  });
});