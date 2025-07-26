import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import * as testService from '../test.service';
import { db } from '@/lib/firebase';

vi.mock('firebase/firestore');

describe('TestService', () => {
  const mockTest = {
    id: 'test-1',
    code: 'CBC',
    name: 'Complete Blood Count',
    shortName: 'CBC',
    category: 'hematology' as const,
    description: 'Comprehensive blood cell analysis',
    loincCode: '58410-2',
    cptCode: '85025',
    specimen: {
      type: 'blood',
      volume: 3,
      unit: 'mL',
      container: 'EDTA tube',
      handling: 'Room temperature',
      stability: '24 hours',
    },
    components: ['WBC', 'RBC', 'Hemoglobin', 'Hematocrit', 'Platelets'],
    referenceRanges: [
      {
        component: 'WBC',
        gender: 'both',
        ageMin: 18,
        ageMax: 100,
        min: 4.5,
        max: 11.0,
        unit: '10^9/L',
      },
    ],
    methodology: 'Flow cytometry',
    turnaroundTime: '4 hours',
    price: 45.00,
    requiresApproval: false,
    active: true,
    tags: ['routine', 'common'],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockTestPanel = {
    id: 'panel-1',
    code: 'BMP',
    name: 'Basic Metabolic Panel',
    category: 'chemistry' as const,
    description: 'Basic metabolic tests',
    tests: ['test-1', 'test-2', 'test-3'],
    price: 120.00,
    turnaroundTime: '8 hours',
    active: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const tenantId = 'test-tenant';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTest', () => {
    it('should create a test successfully', async () => {
      const newTestData = {
        code: 'GLU',
        name: 'Glucose',
        shortName: 'Glucose',
        category: 'chemistry' as const,
        loincCode: '2345-7',
        price: 25.00,
      };

      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await testService.createTest(newTestData, tenantId);

      expect(setDoc).toHaveBeenCalled();
      expect(result).toMatchObject({
        ...newTestData,
        id: expect.any(String),
      });
    });

    it('should handle creation errors', async () => {
      vi.mocked(setDoc).mockRejectedValue(new Error('Database error'));

      await expect(
        testService.createTest(mockTest, tenantId)
      ).rejects.toThrow('Database error');
    });
  });

  describe('updateTest', () => {
    it('should update a test successfully', async () => {
      const updates = {
        price: 50.00,
        turnaroundTime: '6 hours',
      };

      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await testService.updateTest('test-1', updates, tenantId);

      expect(updateDoc).toHaveBeenCalledWith(
        doc(db, `${tenantId}_tests`, 'test-1'),
        {
          ...updates,
          updatedAt: serverTimestamp(),
        }
      );
    });

    it('should handle update errors', async () => {
      vi.mocked(updateDoc).mockRejectedValue(new Error('Update failed'));

      await expect(
        testService.updateTest('test-1', { price: 60 }, tenantId)
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deleteTest', () => {
    it('should delete a test successfully', async () => {
      vi.mocked(deleteDoc).mockResolvedValue(undefined);

      await testService.deleteTest('test-1', tenantId);

      expect(deleteDoc).toHaveBeenCalledWith(
        doc(db, `${tenantId}_tests`, 'test-1')
      );
    });

    it('should handle deletion errors', async () => {
      vi.mocked(deleteDoc).mockRejectedValue(new Error('Delete failed'));

      await expect(
        testService.deleteTest('test-1', tenantId)
      ).rejects.toThrow('Delete failed');
    });
  });

  describe('getTest', () => {
    it('should get a test by id successfully', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockTest,
        id: 'test-1',
      } as any);

      const result = await testService.getTest('test-1', tenantId);

      expect(getDoc).toHaveBeenCalledWith(
        doc(db, `${tenantId}_tests`, 'test-1')
      );
      expect(result).toEqual({ ...mockTest, id: 'test-1' });
    });

    it('should return null if test not found', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      const result = await testService.getTest('non-existent', tenantId);

      expect(result).toBeNull();
    });
  });

  describe('getTests', () => {
    it('should get tests with filters', async () => {
      const mockDocs = [
        {
          id: 'test-1',
          data: () => mockTest,
        },
        {
          id: 'test-2',
          data: () => ({ ...mockTest, id: 'test-2', name: 'Glucose' }),
        },
      ];

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockDocs,
        empty: false,
        size: 2,
      } as any);

      vi.mocked(query).mockReturnValue('mocked-query' as any);
      vi.mocked(where).mockReturnValue('mocked-where' as any);
      vi.mocked(orderBy).mockReturnValue('mocked-orderBy' as any);
      vi.mocked(limit).mockReturnValue('mocked-limit' as any);

      const filters = {
        search: 'blood',
        category: 'hematology' as const,
        tags: ['routine'],
        active: true,
        pageSize: 10,
      };

      const result = await testService.getTests(filters, tenantId);

      expect(query).toHaveBeenCalled();
      expect(result.tests).toHaveLength(2);
      expect(result.hasMore).toBe(false);
    });

    it('should handle empty results', async () => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: [],
        empty: true,
        size: 0,
      } as any);

      vi.mocked(query).mockReturnValue('mocked-query' as any);

      const result = await testService.getTests({}, tenantId);

      expect(result.tests).toHaveLength(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('Test Panels', () => {
    describe('createTestPanel', () => {
      it('should create a test panel successfully', async () => {
        const newPanelData = {
          code: 'CMP',
          name: 'Comprehensive Metabolic Panel',
          category: 'chemistry' as const,
          tests: ['test-1', 'test-2', 'test-3', 'test-4'],
          price: 150.00,
        };

        vi.mocked(setDoc).mockResolvedValue(undefined);

        const result = await testService.createTestPanel(newPanelData, tenantId);

        expect(setDoc).toHaveBeenCalled();
        expect(result).toMatchObject({
          ...newPanelData,
          id: expect.any(String),
        });
      });
    });

    describe('getTestPanel', () => {
      it('should get a test panel by id successfully', async () => {
        vi.mocked(getDoc).mockResolvedValue({
          exists: () => true,
          data: () => mockTestPanel,
          id: 'panel-1',
        } as any);

        const result = await testService.getTestPanel('panel-1', tenantId);

        expect(getDoc).toHaveBeenCalledWith(
          doc(db, `${tenantId}_test_panels`, 'panel-1')
        );
        expect(result).toEqual({ ...mockTestPanel, id: 'panel-1' });
      });
    });

    describe('getTestPanels', () => {
      it('should get test panels', async () => {
        const mockDocs = [
          {
            id: 'panel-1',
            data: () => mockTestPanel,
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

        const result = await testService.getTestPanels({ active: true }, tenantId);

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({ ...mockTestPanel, id: 'panel-1' });
      });
    });
  });

  describe('searchTests', () => {
    it('should search tests by name or code', async () => {
      const mockDocs = [
        {
          id: 'test-1',
          data: () => mockTest,
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

      const result = await testService.searchTests('CBC', tenantId);

      expect(getDocs).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ ...mockTest, id: 'test-1' });
    });
  });

  describe('getTestsByCategory', () => {
    it('should get tests by category', async () => {
      const mockDocs = [
        {
          id: 'test-1',
          data: () => mockTest,
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

      const result = await testService.getTestsByCategory('hematology', tenantId);

      expect(where).toHaveBeenCalledWith('category', '==', 'hematology');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ ...mockTest, id: 'test-1' });
    });
  });

  describe('getTestStats', () => {
    it('should calculate test statistics', async () => {
      const tests = [
        mockTest,
        { ...mockTest, id: '2', category: 'chemistry', active: false },
        { ...mockTest, id: '3', category: 'hematology', requiresApproval: true },
      ];

      vi.mocked(getDocs).mockResolvedValue({
        docs: tests.map(t => ({
          id: t.id,
          data: () => t,
        })),
        size: tests.length,
      } as any);

      vi.mocked(query).mockReturnValue('mocked-query' as any);

      const stats = await testService.getTestStats(tenantId);

      expect(stats).toEqual({
        total: 3,
        active: 2,
        inactive: 1,
        byCategory: {
          hematology: 2,
          chemistry: 1,
        },
        requiresApproval: 1,
        averagePrice: 45.00,
      });
    });
  });
});