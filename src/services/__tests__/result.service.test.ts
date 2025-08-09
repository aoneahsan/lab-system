import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resultService } from '../result.service';
import { db } from '@/config/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  getCountFromServer
} from 'firebase/firestore';
import type { TestResult } from '@/types/result.types';
import type { TestOrder } from '@/types/test.types';

// Mock Firebase modules
vi.mock('firebase/firestore');
vi.mock('@/config/firebase', () => ({
  db: {},
}));

describe('ResultService', () => {
  const mockTenantId = 'tenant1';
  const mockUserId = 'user1';
  
  const mockResult: TestResult = {
    id: 'result1',
    tenantId: mockTenantId,
    orderId: 'order1',
    testId: 'test1',
    patientId: 'patient1',
    sampleId: 'sample1',
    testName: 'Glucose',
    testCode: 'GLU',
    category: 'Chemistry',
    value: '95',
    unit: 'mg/dL',
    referenceRange: {
      normal: '70-100',
      min: 70,
      max: 100,
    },
    flag: undefined,
    status: 'verified',
    enteredBy: mockUserId,
    enteredAt: Timestamp.now(),
    verifiedBy: mockUserId,
    verifiedAt: Timestamp.now(),
    isCritical: false,
    comments: '',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const mockOrder: TestOrder = {
    id: 'order1',
    tenantId: mockTenantId,
    patientId: 'patient1',
    orderNumber: 'ORD-2025-001',
    status: 'completed',
    priority: 'routine',
    tests: [
      {
        testId: 'test1',
        testCode: 'GLU',
        testName: 'Glucose',
        category: 'Chemistry',
        price: 50,
      }
    ],
    totalAmount: 50,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: mockUserId,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getResult', () => {
    it('should get result by id', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        id: mockResult.id,
        data: () => mockResult,
      } as any);

      const result = await resultService.getResult(mockTenantId, mockResult.id);

      expect(getDoc).toHaveBeenCalledWith(doc(db, 'labflow_results', mockResult.id));
      expect(result).toEqual(mockResult);
    });

    it('should return null if result not found', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      const result = await resultService.getResult(mockTenantId, 'non-existent');

      expect(result).toBeNull();
    });
  });

  describe('calculateFlag', () => {
    it('should calculate low flag', () => {
      const flag = resultService.calculateFlag(65, 70, 100);
      expect(flag).toBe('L');
    });

    it('should calculate very low flag', () => {
      const flag = resultService.calculateFlag(30, 70, 100);
      expect(flag).toBe('LL');
    });

    it('should calculate high flag', () => {
      const flag = resultService.calculateFlag(105, 70, 100);
      expect(flag).toBe('H');
    });

    it('should calculate very high flag', () => {
      const flag = resultService.calculateFlag(160, 70, 100);
      expect(flag).toBe('HH');
    });

    it('should return undefined for normal value', () => {
      const flag = resultService.calculateFlag(85, 70, 100);
      expect(flag).toBeUndefined();
    });

    it('should return undefined when no reference range', () => {
      const flag = resultService.calculateFlag(100);
      expect(flag).toBeUndefined();
    });
  });

  describe('validateResult', () => {
    const mockValidationRules = [
      {
        id: 'rule1',
        ruleType: 'range',
        enabled: true,
        action: 'warn',
        parameters: { min: 70, max: 100 },
      },
      {
        id: 'rule2',
        ruleType: 'critical',
        enabled: true,
        action: 'block',
        parameters: { criticalLow: 50, criticalHigh: 150 },
      },
      {
        id: 'rule3',
        ruleType: 'delta',
        enabled: true,
        action: 'warn',
        parameters: { deltaPercent: 20 },
      },
    ];

    beforeEach(() => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockValidationRules.map(rule => ({
          id: rule.id,
          data: () => rule,
        })),
      } as any);
    });

    it('should validate result within normal range', async () => {
      const validation = await resultService.validateResult(mockTenantId, 'test1', 85);

      expect(validation).toEqual({
        valid: true,
        warnings: [],
        errors: [],
      });
    });

    it('should warn for out of range value', async () => {
      const validation = await resultService.validateResult(mockTenantId, 'test1', 105);

      expect(validation).toEqual({
        valid: true,
        warnings: ['Value 105 is above maximum 100'],
        errors: [],
      });
    });

    it('should error for critical value', async () => {
      const validation = await resultService.validateResult(mockTenantId, 'test1', 45);

      expect(validation).toEqual({
        valid: false,
        warnings: ['Value 45 is below minimum 70'],
        errors: ['Critical low value: 45 < 50'],
      });
    });

    it('should warn for significant delta', async () => {
      const validation = await resultService.validateResult(mockTenantId, 'test1', 130, 100);

      expect(validation).toEqual({
        valid: true,
        warnings: [
          'Value 130 is above maximum 100',
          'Value changed by 30.0%',
        ],
        errors: [],
      });
    });
  });

  describe('createResult', () => {
    it('should create new result', async () => {
      const mockDocRef = { id: 'new-result-id' };
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as any);

      const resultData = {
        orderId: 'order1',
        testId: 'test1',
        patientId: 'patient1',
        sampleId: 'sample1',
        testName: 'Glucose',
        testCode: 'GLU',
        category: 'Chemistry',
        value: '95',
        unit: 'mg/dL',
        referenceRange: { normal: '70-100' },
      };

      const result = await resultService.createResult(mockTenantId, mockUserId, resultData);

      expect(addDoc).toHaveBeenCalledWith(
        collection(db, 'labflow_results'),
        expect.objectContaining({
          ...resultData,
          tenantId: mockTenantId,
          enteredBy: mockUserId,
          status: 'entered',
        })
      );
      expect(result).toEqual(expect.objectContaining({ id: mockDocRef.id }));
    });
  });

  describe('verifyResult', () => {
    it('should verify result', async () => {
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await resultService.verifyResult(mockTenantId, mockUserId, 'result1');

      expect(updateDoc).toHaveBeenCalledWith(
        doc(db, 'labflow_results', 'result1'),
        expect.objectContaining({
          status: 'verified',
          verifiedBy: mockUserId,
          verifiedAt: expect.any(Timestamp),
        })
      );
    });
  });

  describe('amendResult', () => {
    it('should amend result and create audit log', async () => {
      vi.mocked(getDocs).mockResolvedValue({
        empty: false,
        docs: [{
          data: () => ({ value: '95', unit: 'mg/dL', flag: undefined }),
        }],
      } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(addDoc).mockResolvedValue({ id: 'audit1' } as any);

      const amendment = {
        newValue: '98',
        newUnit: 'mg/dL',
        reason: 'Correction after re-test',
        amendedBy: mockUserId,
        amendedByName: 'Test User',
      };

      await resultService.amendResult(mockTenantId, 'result1', amendment);

      expect(addDoc).toHaveBeenCalledWith(
        collection(db, 'labflow_audit_logs'),
        expect.objectContaining({
          entityType: 'result',
          entityId: 'result1',
          action: 'amendment',
          changes: expect.objectContaining({
            previousValue: '95',
            newValue: '98',
            reason: 'Correction after re-test',
          }),
        })
      );
      expect(updateDoc).toHaveBeenCalledWith(
        doc(db, 'labflow_results', 'result1'),
        expect.objectContaining({
          value: '98',
          status: 'amended',
          amendmentReason: 'Correction after re-test',
        })
      );
    });
  });

  describe('markCritical', () => {
    it('should mark result as critical and create audit log', async () => {
      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(addDoc).mockResolvedValue({ id: 'audit1' } as any);

      const criticalInfo = {
        markedBy: mockUserId,
        markedByName: 'Test User',
        notificationSent: true,
        notifiedPersonnel: ['doctor1', 'nurse1'],
      };

      await resultService.markCritical(mockTenantId, 'result1', criticalInfo);

      expect(updateDoc).toHaveBeenCalledWith(
        doc(db, 'labflow_results', 'result1'),
        expect.objectContaining({
          isCritical: true,
          criticalMarkedBy: mockUserId,
          criticalNotificationSent: true,
          criticalNotifiedPersonnel: ['doctor1', 'nurse1'],
        })
      );
      expect(addDoc).toHaveBeenCalledWith(
        collection(db, 'labflow_audit_logs'),
        expect.objectContaining({
          entityType: 'result',
          action: 'marked_critical',
          details: expect.objectContaining({
            notificationSent: true,
            notifiedPersonnel: ['doctor1', 'nurse1'],
          }),
        })
      );
    });
  });

  describe('enterBatchResults', () => {
    it('should enter multiple results for an order', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockOrder,
      } as any);
      vi.mocked(addDoc).mockResolvedValue({ id: 'result1' } as any);

      const results = [
        {
          testId: 'test1',
          testCode: 'GLU',
          testName: 'Glucose',
          value: '95',
          unit: 'mg/dL',
          referenceRange: '70-100',
        },
        {
          testId: 'test2',
          testCode: 'CHOL',
          testName: 'Cholesterol',
          value: '180',
          unit: 'mg/dL',
          referenceRange: '<200',
        },
      ];

      await resultService.enterBatchResults(
        mockTenantId,
        'order1',
        results,
        mockUserId,
        'Test User'
      );

      expect(addDoc).toHaveBeenCalledTimes(2);
      expect(addDoc).toHaveBeenCalledWith(
        collection(db, 'labflow_results'),
        expect.objectContaining({
          tenantId: mockTenantId,
          orderId: 'order1',
          patientId: 'patient1',
          testName: 'Glucose',
          value: '95',
          status: 'preliminary',
        })
      );
    });
  });

  describe('getResultStatistics', () => {
    it('should get result statistics', async () => {
      vi.mocked(getCountFromServer).mockImplementation(async () => ({
        data: () => ({ count: 10 }),
      } as any));
      vi.mocked(getDocs).mockResolvedValue({
        size: 2,
        docs: [],
      } as any);

      const stats = await resultService.getResultStatistics(mockTenantId);

      expect(stats).toEqual({
        total: 10,
        pending: 10,
        pendingCount: 10,
        verified: 10,
        critical: 2,
        todayCount: 10,
      });
    });
  });

  describe('getResultGroups', () => {
    it('should group results by panel', async () => {
      const mockResults = [
        { ...mockResult, panelId: 'panel1', panelName: 'Basic Metabolic Panel' },
        { ...mockResult, id: 'result2', testName: 'Sodium', panelId: 'panel1' },
        { ...mockResult, id: 'result3', testName: 'Hemoglobin', panelId: undefined },
      ];

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockResults.map(result => ({
          id: result.id,
          data: () => result,
        })),
      } as any);

      const groups = await resultService.getResultGroups(mockTenantId, 'order1');

      expect(groups).toHaveLength(2);
      expect(groups[0]).toEqual({
        panelId: 'panel1',
        panelName: 'Basic Metabolic Panel',
        results: expect.arrayContaining([
          expect.objectContaining({ testName: 'Glucose' }),
          expect.objectContaining({ testName: 'Sodium' }),
        ]),
      });
      expect(groups[1]).toEqual({
        panelId: 'ungrouped',
        panelName: 'Individual Tests',
        results: expect.arrayContaining([
          expect.objectContaining({ testName: 'Hemoglobin' }),
        ]),
      });
    });
  });
});