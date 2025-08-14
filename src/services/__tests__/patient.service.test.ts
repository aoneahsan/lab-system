import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('firebase/firestore', () => {
  // Create a mock Timestamp class inside the factory
  class MockTimestamp {
    private _date: Date;

    constructor(date: Date) {
      this._date = date;
    }

    toDate() {
      return this._date;
    }

    static now() {
      return new MockTimestamp(new Date());
    }

    static fromDate(date: Date) {
      return new MockTimestamp(date);
    }
  }

  return {
    getFirestore: vi.fn(() => ({})),
    collection: vi.fn(),
    doc: vi.fn(() => ({ id: 'mocked-doc-id' })),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    startAfter: vi.fn(),
    serverTimestamp: vi.fn(() => 'server-timestamp'),
    Timestamp: MockTimestamp,
  };
});
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
}));
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
}));
vi.mock('firebase/performance', () => ({
  getPerformance: vi.fn(() => ({})),
}));
vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(() => ({})),
}));
vi.mock('@/services/webhook.service', () => ({
  webhookService: {
    triggerWebhookEvent: vi.fn(),
  },
}));

import { patientService } from '../patient.service';
// import { firestore } from '@/config/firebase.config';

// Import all the Firebase functions from the mock
const {
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} = vi.mocked(require('firebase/firestore'));  

describe('PatientService', () => {
  const tenantId = 'test-tenant';
  const createdBy = 'test-user';

  const mockCreatePatientData = {
    mrn: 'MRN001',
    firstName: 'John',
    middleName: 'Michael',
    lastName: 'Doe',
    dateOfBirth: new Date('1990-01-01'),
    gender: 'male' as const,
    email: 'john@example.com',
    phoneNumber: '+1234567890',
    address: {
      type: 'home' as const,
      street: '123 Main St',
      apartment: '',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      country: 'USA',
    },
    emergencyContact: {
      name: 'Jane Doe',
      relationship: 'spouse',
      phoneNumber: '+0987654321',
      email: 'jane@example.com',
    },
    bloodGroup: 'O+' as const,
  };

  const mockPatient = {
    id: 'patient-1',
    patientId: 'P123456',
    tenantId,
    mrn: 'MRN001',
    firstName: 'John',
    middleName: 'Michael',
    lastName: 'Doe',
    dateOfBirth: new Date('1990-01-01'),
    gender: 'male' as const,
    email: 'john@example.com',
    phoneNumbers: [
      {
        type: 'mobile' as const,
        value: '+1234567890',
        isPrimary: true,
        isVerified: false,
      },
    ],
    addresses: [
      {
        type: 'home' as const,
        street: '123 Main St',
        apartment: '',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        country: 'USA',
        isDefault: true,
      },
    ],
    emergencyContacts: [
      {
        name: 'Jane Doe',
        relationship: 'spouse',
        phoneNumber: '+0987654321',
        email: 'jane@example.com',
      },
    ],
    bloodGroup: 'O+' as const,
    allergies: [],
    medications: [],
    medicalHistory: [],
    insurances: [],
    documents: [],
    isActive: true,
    isVip: false,
    tags: [],
    totalVisits: 0,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    createdBy,
    updatedBy: createdBy,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPatient', () => {
    it('should create a patient successfully', async () => {
      const mockDocRef = { id: 'generated-id' };
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockCreatePatientData,
          patientId: 'P123456',
          tenantId,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }),
        id: 'generated-id',
      } as any);

      const result = await patientService.createPatient(tenantId, mockCreatePatientData, createdBy);

      expect(addDoc).toHaveBeenCalled();
      expect(result).toMatchObject({
        id: 'generated-id',
        firstName: 'John',
        lastName: 'Doe',
        mrn: 'MRN001',
      });
    });

    it('should handle creation errors', async () => {
      vi.mocked(addDoc).mockRejectedValue(new Error('Database error'));

      await expect(
        patientService.createPatient(tenantId, mockCreatePatientData, createdBy)
      ).rejects.toThrow('Database error');
    });
  });

  describe('updatePatient', () => {
    it('should update a patient successfully', async () => {
      const updates = {
        phoneNumbers: [
          {
            type: 'mobile' as const,
            value: '+9876543210',
            isPrimary: true,
            isVerified: false,
          },
        ],
      };

      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockPatient,
          ...updates,
          updatedAt: Timestamp.now(),
        }),
        id: 'patient-1',
      } as any);

      await patientService.updatePatient(tenantId, 'patient-1', updates);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          ...updates,
          updatedAt: 'server-timestamp',
        })
      );
    });

    it('should handle update errors', async () => {
      vi.mocked(updateDoc).mockRejectedValue(new Error('Update failed'));

      await expect(
        patientService.updatePatient(tenantId, 'patient-1', { email: 'new@example.com' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deletePatient', () => {
    it('should delete a patient successfully', async () => {
      vi.mocked(deleteDoc).mockResolvedValue(undefined);

      await patientService.deletePatient(tenantId, 'patient-1');

      expect(deleteDoc).toHaveBeenCalled();
    });

    it('should handle deletion errors', async () => {
      vi.mocked(deleteDoc).mockRejectedValue(new Error('Delete failed'));

      await expect(patientService.deletePatient(tenantId, 'patient-1')).rejects.toThrow(
        'Delete failed'
      );
    });
  });

  describe('getPatient', () => {
    it('should get a patient by id successfully', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockPatient,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          dateOfBirth: Timestamp.fromDate(new Date('1990-01-01')),
        }),
        id: 'patient-1',
      } as any);

      const result = await patientService.getPatient(tenantId, 'patient-1');

      expect(getDoc).toHaveBeenCalled();
      expect(result).toBeTruthy();
      expect(result?.id).toBe('patient-1');
      expect(result?.firstName).toBe('John');
    });

    it('should return null if patient not found', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      const result = await patientService.getPatient(tenantId, 'non-existent');

      expect(result).toBeNull();
    });
  });

  describe('searchPatients', () => {
    it('should search patients with filters', async () => {
      const mockDocs = [
        {
          id: 'patient-1',
          data: () => ({
            ...mockPatient,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            dateOfBirth: Timestamp.fromDate(new Date('1990-01-01')),
          }),
        },
      ];

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockDocs,
        empty: false,
        size: 1,
      } as any);

      vi.mocked(query).mockReturnValue('mocked-query' as any);
      vi.mocked(where).mockReturnValue('mocked-where' as any);
      vi.mocked(orderBy).mockReturnValue('mocked-orderBy' as any);
      vi.mocked(limit).mockReturnValue('mocked-limit' as any);

      const filters = {
        isActive: true,
        gender: 'male' as const,
      };

      const result = await patientService.searchPatients(tenantId, filters);

      expect(query).toHaveBeenCalled();
      expect(result.patients).toHaveLength(1);
      expect(result.hasMore).toBe(false);
    });

    it('should handle empty results', async () => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: [],
        empty: true,
        size: 0,
      } as any);

      vi.mocked(query).mockReturnValue('mocked-query' as any);

      const result = await patientService.searchPatients(tenantId, {});

      expect(result.patients).toHaveLength(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('addDocument', () => {
    it('should add a document successfully', async () => {
      const mockDocument = {
        name: 'test-report.pdf',
        type: 'lab_report',
        url: 'https://storage.example.com/test-report.pdf',
        size: 1024,
        description: 'Test lab report',
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockPatient,
        id: 'patient-1',
      } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await patientService.addDocument(tenantId, 'patient-1', mockDocument, 'uploader-id');

      expect(updateDoc).toHaveBeenCalled();
    });

    it('should handle document upload errors', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      await expect(
        patientService.addDocument(
          tenantId,
          'patient-1',
          { name: 'test.pdf', type: 'report', url: 'test', size: 100 },
          'uploader'
        )
      ).rejects.toThrow('Patient not found');
    });
  });

  describe('getPatientStats', () => {
    it('should calculate patient statistics', async () => {
      const patients = [
        {
          data: () => ({
            isActive: true,
            isVip: false,
            gender: 'male',
            dateOfBirth: Timestamp.fromDate(new Date('1990-01-01')),
            createdAt: Timestamp.now(),
          }),
        },
        {
          data: () => ({
            isActive: true,
            isVip: true,
            gender: 'female',
            dateOfBirth: Timestamp.fromDate(new Date('1985-05-15')),
            createdAt: Timestamp.now(),
          }),
        },
        {
          data: () => ({
            isActive: false,
            isVip: false,
            gender: 'male',
            dateOfBirth: Timestamp.fromDate(new Date('2000-12-25')),
            createdAt: Timestamp.fromDate(new Date('2024-12-01')),
          }),
        },
      ];

      vi.mocked(getDocs).mockResolvedValue({
        docs: patients,
        size: patients.length,
      } as any);

      const stats = await patientService.getPatientStats(tenantId);

      expect(stats).toEqual({
        totalPatients: 3,
        activePatients: 2,
        newPatientsThisMonth: 2,
        vipPatients: 1,
        averageAge: expect.any(Number),
        genderDistribution: {
          male: 2,
          female: 1,
          other: 0,
          unknown: 0,
        },
      });
    });
  });

  describe('deactivatePatient', () => {
    it('should deactivate a patient successfully', async () => {
      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockPatient, isActive: false }),
        id: 'patient-1',
      } as any);

      await patientService.deactivatePatient(tenantId, 'patient-1', 'updater-id');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          isActive: false,
          updatedBy: 'updater-id',
          updatedAt: 'server-timestamp',
        })
      );
    });
  });

  describe('activatePatient', () => {
    it('should activate a patient successfully', async () => {
      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockPatient, isActive: true }),
        id: 'patient-1',
      } as any);

      await patientService.activatePatient(tenantId, 'patient-1', 'updater-id');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          isActive: true,
          updatedBy: 'updater-id',
          updatedAt: 'server-timestamp',
        })
      );
    });
  });
});
