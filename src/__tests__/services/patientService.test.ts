import { describe, it, expect, vi, beforeEach } from 'vitest';
import { patientService } from '@/services/patientService';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';

// Mock Firestore functions
vi.mock('firebase/firestore');

describe('PatientService', () => {
  const mockTenantId = 'test-tenant';
  const mockPatient = {
    id: 'patient-123',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01',
    gender: 'M',
    email: 'john.doe@example.com',
    phone: '1234567890',
    mrn: 'MRN001',
    address: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zip: '12345',
      country: 'USA'
    },
    insurance: {
      provider: 'Test Insurance',
      policyNumber: 'POL123',
      groupNumber: 'GRP456'
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPatient', () => {
    it('creates a new patient successfully', async () => {
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await patientService.createPatient(mockTenantId, mockPatient);

      expect(setDoc).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
      expect(result.firstName).toBe(mockPatient.firstName);
      expect(result.lastName).toBe(mockPatient.lastName);
    });

    it('validates required fields', async () => {
      const invalidPatient = { ...mockPatient, firstName: '' };

      await expect(
        patientService.createPatient(mockTenantId, invalidPatient)
      ).rejects.toThrow('First name is required');
    });

    it('validates email format', async () => {
      const invalidPatient = { ...mockPatient, email: 'invalid-email' };

      await expect(
        patientService.createPatient(mockTenantId, invalidPatient)
      ).rejects.toThrow('Invalid email format');
    });

    it('validates date of birth', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const invalidPatient = { ...mockPatient, dateOfBirth: futureDate.toISOString() };

      await expect(
        patientService.createPatient(mockTenantId, invalidPatient)
      ).rejects.toThrow('Date of birth cannot be in the future');
    });
  });

  describe('getPatient', () => {
    it('retrieves a patient by ID', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockPatient,
        id: mockPatient.id
      } as any);

      const result = await patientService.getPatient(mockTenantId, mockPatient.id);

      expect(getDoc).toHaveBeenCalled();
      expect(result).toEqual(mockPatient);
    });

    it('throws error when patient not found', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false
      } as any);

      await expect(
        patientService.getPatient(mockTenantId, 'non-existent')
      ).rejects.toThrow('Patient not found');
    });
  });

  describe('searchPatients', () => {
    it('searches patients by name', async () => {
      const mockResults = [mockPatient];
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockResults.map(p => ({
          id: p.id,
          data: () => p
        }))
      } as any);

      const results = await patientService.searchPatients(mockTenantId, {
        searchTerm: 'John'
      });

      expect(query).toHaveBeenCalled();
      expect(results).toHaveLength(1);
      expect(results[0].firstName).toBe('John');
    });

    it('searches patients by MRN', async () => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: [{
          id: mockPatient.id,
          data: () => mockPatient
        }]
      } as any);

      const results = await patientService.searchPatients(mockTenantId, {
        mrn: 'MRN001'
      });

      expect(where).toHaveBeenCalledWith('mrn', '==', 'MRN001');
      expect(results).toHaveLength(1);
    });

    it('applies filters correctly', async () => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: []
      } as any);

      await patientService.searchPatients(mockTenantId, {
        gender: 'F',
        isActive: true,
        limit: 10
      });

      expect(where).toHaveBeenCalledWith('gender', '==', 'F');
      expect(where).toHaveBeenCalledWith('isActive', '==', true);
      expect(limit).toHaveBeenCalledWith(10);
    });
  });

  describe('updatePatient', () => {
    it('updates patient data', async () => {
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const updates = { phone: '9876543210' };
      await patientService.updatePatient(mockTenantId, mockPatient.id, updates);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          phone: '9876543210',
          updatedAt: expect.any(Object)
        })
      );
    });

    it('validates updates', async () => {
      const invalidUpdates = { email: 'invalid-email' };

      await expect(
        patientService.updatePatient(mockTenantId, mockPatient.id, invalidUpdates)
      ).rejects.toThrow('Invalid email format');
    });
  });

  describe('deletePatient', () => {
    it('soft deletes a patient', async () => {
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await patientService.deletePatient(mockTenantId, mockPatient.id);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          isActive: false,
          deletedAt: expect.any(Object)
        })
      );
    });

    it('permanently deletes when specified', async () => {
      vi.mocked(deleteDoc).mockResolvedValue(undefined);

      await patientService.deletePatient(mockTenantId, mockPatient.id, true);

      expect(deleteDoc).toHaveBeenCalled();
      expect(updateDoc).not.toHaveBeenCalled();
    });
  });

  describe('validatePatientData', () => {
    it('accepts valid patient data', () => {
      expect(() => 
        patientService.validatePatientData(mockPatient)
      ).not.toThrow();
    });

    it('requires first name', () => {
      const invalid = { ...mockPatient, firstName: '' };
      expect(() => 
        patientService.validatePatientData(invalid)
      ).toThrow('First name is required');
    });

    it('requires last name', () => {
      const invalid = { ...mockPatient, lastName: '' };
      expect(() => 
        patientService.validatePatientData(invalid)
      ).toThrow('Last name is required');
    });

    it('validates phone number format', () => {
      const invalid = { ...mockPatient, phone: '123' };
      expect(() => 
        patientService.validatePatientData(invalid)
      ).toThrow('Invalid phone number format');
    });

    it('validates gender values', () => {
      const invalid = { ...mockPatient, gender: 'X' as any };
      expect(() => 
        patientService.validatePatientData(invalid)
      ).toThrow('Invalid gender value');
    });
  });

  describe('calculateAge', () => {
    it('calculates age correctly', () => {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - 30);
      
      const age = patientService.calculateAge(dob.toISOString());
      expect(age).toBe(30);
    });

    it('handles leap year birthdays', () => {
      const age = patientService.calculateAge('1992-02-29');
      // Age will vary based on current date
      expect(age).toBeGreaterThan(0);
    });
  });
});