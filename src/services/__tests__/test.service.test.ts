import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: vi.fn(() => 'server-timestamp'),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn(),
  })),
}));

vi.mock('@/config/firebase.config', () => ({
  db: {},
}));

import { testService } from '../test.service';

describe('TestService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTests', () => {
    it('should fetch tests for a tenant', async () => {
      const mockTests = [{ id: 'test-1', name: 'Blood Glucose', tenantId: 'tenant-1' }];

      const { getDocs } = vi.mocked(await import('firebase/firestore'));
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockTests.map((test) => ({
          id: test.id,
          data: () => test,
        })),
      } as any);

      const result = await testService.getTests('tenant-1');

      expect(getDocs).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Blood Glucose');
    });
  });
});
