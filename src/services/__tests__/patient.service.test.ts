import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createPatient,
  updatePatient,
  deletePatient,
  getPatient,
  getPatients,
  searchPatients,
  addMedicalHistory,
  addAllergy,
  addMedication,
  uploadPatientDocument,
  getPatientTestResults,
  getPatientTimeline,
  mergePatientRecords,
  exportPatientData,
} from '../patient.service';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';

// Mock Firestore
vi.mock('firebase/firestore');

describe('PatientService', () => {
  const mockPatientData = {
    id: 'patient-123',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01',
    gender: 'male',
    email: 'john.doe@example.com',
    phone: '1234567890',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
    },
    mrn: 'MRN-0001234',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPatient', () => {
    it('successfully creates a new patient', async () => {
      const newPatientData = {
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: '1985-05-15',
        gender: 'female',
        email: 'jane.smith@example.com',
        phone: '9876543210',
      };

      vi.mocked(setDoc).mockResolvedValue(undefined);
      vi.mocked(doc).mockReturnValue({ id: 'new-patient-id' } as any);

      const result = await createPatient(newPatientData);

      expect(setDoc).toHaveBeenCalled();
      expect(result).toMatchObject({
        ...newPatientData,
        id: 'new-patient-id',
      });
    });

    it('generates MRN automatically', async () => {
      const patientData = {
        firstName: 'Test',
        lastName: 'User',
        dateOfBirth: '2000-01-01',
        gender: 'other',
      };

      vi.mocked(setDoc).mockResolvedValue(undefined);
      vi.mocked(doc).mockReturnValue({ id: 'test-id' } as any);

      const result = await createPatient(patientData);

      expect(result.mrn).toMatch(/^MRN-\d{7}$/);
    });

    it('validates required fields', async () => {
      const invalidData = {
        firstName: '',
        lastName: '',
        // Missing required fields
      };

      await expect(createPatient(invalidData as any)).rejects.toThrow(
        'Missing required patient information'
      );
    });

    it('validates email format', async () => {
      const invalidEmailData = {
        firstName: 'Test',
        lastName: 'User',
        dateOfBirth: '2000-01-01',
        gender: 'male',
        email: 'invalid-email',
      };

      await expect(createPatient(invalidEmailData as any)).rejects.toThrow(
        'Invalid email format'
      );
    });
  });

  describe('updatePatient', () => {
    it('successfully updates patient data', async () => {
      const updates = {
        phone: '5555555555',
        address: {
          street: '456 New St',
          city: 'Los Angeles',
          state: 'CA',
          zip: '90001',
        },
      };

      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockPatientData, ...updates }),
        id: 'patient-123',
      } as any);

      const result = await updatePatient('patient-123', updates);

      expect(updateDoc).toHaveBeenCalled();
      expect(result).toMatchObject(updates);
    });

    it('throws error if patient not found', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      await expect(updatePatient('non-existent', {})).rejects.toThrow(
        'Patient not found'
      );
    });

    it('updates updatedAt timestamp', async () => {
      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockPatientData,
        id: 'patient-123',
      } as any);

      await updatePatient('patient-123', { phone: '1111111111' });

      const updateCall = vi.mocked(updateDoc).mock.calls[0][1];
      expect(updateCall).toHaveProperty('updatedAt');
    });
  });

  describe('deletePatient', () => {
    it('successfully deletes a patient', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
      } as any);
      vi.mocked(deleteDoc).mockResolvedValue(undefined);

      await deletePatient('patient-123');

      expect(deleteDoc).toHaveBeenCalled();
    });

    it('throws error if patient not found', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      await expect(deletePatient('non-existent')).rejects.toThrow(
        'Patient not found'
      );
    });

    it('soft deletes by default', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
      } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await deletePatient('patient-123', { soft: true });

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          deletedAt: expect.any(Object),
          isDeleted: true,
        })
      );
    });
  });

  describe('getPatient', () => {
    it('successfully retrieves a patient', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockPatientData,
        id: 'patient-123',
      } as any);

      const result = await getPatient('patient-123');

      expect(result).toMatchObject(mockPatientData);
    });

    it('returns null if patient not found', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      const result = await getPatient('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('searchPatients', () => {
    it('searches patients by name', async () => {
      const mockResults = [
        { id: '1', ...mockPatientData, firstName: 'John' },
        { id: '2', ...mockPatientData, firstName: 'Johnny' },
      ];

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockResults.map(data => ({
          id: data.id,
          data: () => data,
        })),
      } as any);

      const results = await searchPatients({ query: 'John' });

      expect(results).toHaveLength(2);
      expect(results[0].firstName).toBe('John');
    });

    it('searches patients by MRN', async () => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: [{
          id: 'patient-123',
          data: () => mockPatientData,
        }],
      } as any);

      const results = await searchPatients({ mrn: 'MRN-0001234' });

      expect(results).toHaveLength(1);
      expect(results[0].mrn).toBe('MRN-0001234');
    });

    it('filters by date range', async () => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: [{
          id: 'patient-123',
          data: () => mockPatientData,
        }],
      } as any);

      const results = await searchPatients({
        dateFrom: '2023-01-01',
        dateTo: '2023-12-31',
      });

      expect(query).toHaveBeenCalled();
      expect(where).toHaveBeenCalled();
    });

    it('paginates results', async () => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: Array(10).fill(null).map((_, i) => ({
          id: `patient-${i}`,
          data: () => ({ ...mockPatientData, id: `patient-${i}` }),
        })),
      } as any);

      const results = await searchPatients({ limit: 5, offset: 0 });

      expect(results).toHaveLength(5);
      expect(limit).toHaveBeenCalledWith(5);
    });
  });

  describe('addMedicalHistory', () => {
    it('adds medical history entry', async () => {
      const historyEntry = {
        condition: 'Hypertension',
        diagnosisDate: '2023-01-15',
        notes: 'Managed with medication',
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockPatientData,
      } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await addMedicalHistory('patient-123', historyEntry);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          medicalHistory: expect.arrayContaining([
            expect.objectContaining(historyEntry)
          ])
        })
      );
    });

    it('validates medical history data', async () => {
      const invalidEntry = {
        condition: '', // Empty condition
        diagnosisDate: 'invalid-date',
      };

      await expect(
        addMedicalHistory('patient-123', invalidEntry as any)
      ).rejects.toThrow('Invalid medical history data');
    });
  });

  describe('addAllergy', () => {
    it('adds allergy to patient record', async () => {
      const allergy = {
        allergen: 'Peanuts',
        severity: 'severe',
        reaction: 'Anaphylaxis',
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockPatientData,
      } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await addAllergy('patient-123', allergy);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          allergies: expect.arrayContaining([
            expect.objectContaining(allergy)
          ])
        })
      );
    });

    it('prevents duplicate allergies', async () => {
      const existingAllergy = { allergen: 'Peanuts', severity: 'severe' };
      
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockPatientData,
          allergies: [existingAllergy],
        }),
      } as any);

      await expect(
        addAllergy('patient-123', existingAllergy)
      ).rejects.toThrow('Allergy already exists');
    });
  });

  describe('getPatientTestResults', () => {
    it('retrieves patient test results', async () => {
      const mockTestResults = [
        {
          id: 'test-1',
          testName: 'CBC',
          date: '2023-12-01',
          status: 'completed',
        },
        {
          id: 'test-2',
          testName: 'Lipid Panel',
          date: '2023-12-15',
          status: 'completed',
        },
      ];

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockTestResults.map(data => ({
          id: data.id,
          data: () => data,
        })),
      } as any);

      const results = await getPatientTestResults('patient-123');

      expect(results).toHaveLength(2);
      expect(results[0].testName).toBe('CBC');
    });

    it('filters by date range', async () => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: [],
      } as any);

      await getPatientTestResults('patient-123', {
        startDate: '2023-01-01',
        endDate: '2023-12-31',
      });

      expect(query).toHaveBeenCalled();
      expect(where).toHaveBeenCalledWith('date', '>=', '2023-01-01');
      expect(where).toHaveBeenCalledWith('date', '<=', '2023-12-31');
    });
  });

  describe('exportPatientData', () => {
    it('exports patient data in JSON format', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockPatientData,
      } as any);

      const result = await exportPatientData('patient-123', 'json');

      expect(result).toMatchObject({
        format: 'json',
        data: expect.stringContaining('John'),
        filename: expect.stringContaining('patient-export'),
      });
    });

    it('exports patient data in CSV format', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockPatientData,
      } as any);

      const result = await exportPatientData('patient-123', 'csv');

      expect(result.format).toBe('csv');
      expect(result.data).toContain('firstName,lastName');
      expect(result.data).toContain('John,Doe');
    });

    it('includes related data when requested', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockPatientData,
      } as any);
      
      vi.mocked(getDocs).mockResolvedValue({
        docs: [],
      } as any);

      const result = await exportPatientData('patient-123', 'json', {
        includeTestResults: true,
        includeBilling: true,
      });

      const data = JSON.parse(result.data);
      expect(data).toHaveProperty('testResults');
      expect(data).toHaveProperty('billingInfo');
    });
  });
});