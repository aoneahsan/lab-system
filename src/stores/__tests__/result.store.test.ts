import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useResultStore } from '../result.store';
import { resultService } from '@/services/result.service';

// Mock the result service
vi.mock('@/services/result.service', () => ({
  resultService: {
    getResultsByOrder: vi.fn(),
    getResultsByPatient: vi.fn(),
    createResult: vi.fn(),
    updateResult: vi.fn(),
    verifyResult: vi.fn(),
    validateResult: vi.fn(),
  },
}));

describe('Result Store', () => {
  beforeEach(() => {
    // Reset store state
    useResultStore.setState({
      results: [],
      currentResult: null,
      loading: false,
      error: null,
      validationWarnings: [],
      validationErrors: [],
    });

    // Reset all mocks
    vi.clearAllMocks();
  });

  it('fetches results by order', async () => {
    const mockResults = [
      {
        id: 'result-1',
        orderId: 'order-123',
        patientId: 'patient-123',
        testId: 'test-1',
        value: 102,
        unit: 'mg/dL',
        status: 'pending',
        enteredAt: new Date(),
      },
    ];

    vi.mocked(resultService.getResultsByOrder).mockResolvedValue(mockResults);

    const { fetchResultsByOrder } = useResultStore.getState();
    await fetchResultsByOrder('tenant-123', 'order-123');

    expect(resultService.getResultsByOrder).toHaveBeenCalledWith('tenant-123', 'order-123');

    const state = useResultStore.getState();
    expect(state.results).toEqual(mockResults);
    expect(state.loading).toBe(false);
  });

  it('fetches results by patient', async () => {
    const mockResults = [
      {
        id: 'result-1',
        orderId: 'order-123',
        patientId: 'patient-123',
        testId: 'test-1',
        value: 102,
        unit: 'mg/dL',
        status: 'verified',
        enteredAt: new Date(),
      },
      {
        id: 'result-2',
        orderId: 'order-456',
        patientId: 'patient-123',
        testId: 'test-2',
        value: 150,
        unit: 'mg/dL',
        status: 'verified',
        enteredAt: new Date(),
      },
    ];

    vi.mocked(resultService.getResultsByPatient).mockResolvedValue(mockResults);

    const { fetchResultsByPatient } = useResultStore.getState();
    await fetchResultsByPatient('tenant-123', 'patient-123');

    expect(resultService.getResultsByPatient).toHaveBeenCalledWith('tenant-123', 'patient-123');

    const state = useResultStore.getState();
    expect(state.results).toEqual(mockResults);
    expect(state.loading).toBe(false);
  });

  it('enters results successfully', async () => {
    const mockResults = [
      {
        id: 'result-1',
        orderId: 'order-123',
        patientId: 'patient-123',
        testId: 'test-1',
        value: 102,
        unit: 'mg/dL',
        status: 'pending',
        enteredAt: new Date(),
      },
    ];

    vi.mocked(resultService.createResult).mockResolvedValue(undefined);
    vi.mocked(resultService.getResultsByOrder).mockResolvedValue(mockResults);

    const { enterResults } = useResultStore.getState();
    await enterResults('tenant-123', 'user-123', {
      orderId: 'order-123',
      sampleId: 'sample-123',
      tests: [
        {
          testId: 'test-1',
          testName: 'Glucose',
          value: 102,
          unit: 'mg/dL',
          flag: 'N',
          comments: '',
        },
      ],
    });

    expect(resultService.createResult).toHaveBeenCalledWith(
      'tenant-123',
      'user-123',
      expect.objectContaining({
        orderId: 'order-123',
        sampleId: 'sample-123',
        testId: 'test-1',
        testName: 'Glucose',
        value: 102,
        unit: 'mg/dL',
      })
    );

    const state = useResultStore.getState();
    expect(state.loading).toBe(false);
  });

  it('verifies result', async () => {
    vi.mocked(resultService.verifyResult).mockResolvedValue(undefined);

    const { verifyResult } = useResultStore.getState();
    await verifyResult('tenant-123', 'user-123', 'result-123');

    expect(resultService.verifyResult).toHaveBeenCalledWith('tenant-123', 'user-123', 'result-123');

    const state = useResultStore.getState();
    expect(state.loading).toBe(false);
  });

  it('validates result with warnings', async () => {
    const mockValidation = {
      warnings: ['Value is slightly above normal range'],
      errors: [],
    };

    vi.mocked(resultService.validateResult).mockResolvedValue(mockValidation);

    const { validateResult } = useResultStore.getState();
    await validateResult('tenant-123', 'test-1', 110);

    expect(resultService.validateResult).toHaveBeenCalledWith('tenant-123', 'test-1', 110);

    const state = useResultStore.getState();
    expect(state.validationWarnings).toEqual(['Value is slightly above normal range']);
    expect(state.validationErrors).toEqual([]);
    expect(state.loading).toBe(false);
  });

  it('validates result with errors', async () => {
    const mockValidation = {
      warnings: [],
      errors: ['Value is critically high'],
    };

    vi.mocked(resultService.validateResult).mockResolvedValue(mockValidation);

    const { validateResult } = useResultStore.getState();
    await validateResult('tenant-123', 'test-1', 500);

    expect(resultService.validateResult).toHaveBeenCalledWith('tenant-123', 'test-1', 500);

    const state = useResultStore.getState();
    expect(state.validationWarnings).toEqual([]);
    expect(state.validationErrors).toEqual(['Value is critically high']);
    expect(state.loading).toBe(false);
  });

  it('handles errors when fetching results', async () => {
    const error = new Error('Failed to fetch results');
    vi.mocked(resultService.getResultsByOrder).mockRejectedValue(error);

    const { fetchResultsByOrder } = useResultStore.getState();
    await fetchResultsByOrder('tenant-123', 'order-123');

    const state = useResultStore.getState();
    expect(state.error).toBe('Failed to fetch results');
    expect(state.loading).toBe(false);
  });

  it('sets loading state', () => {
    const { setLoading } = useResultStore.getState();
    setLoading(true);

    const state = useResultStore.getState();
    expect(state.loading).toBe(true);
  });

  it('sets error state', () => {
    const { setError } = useResultStore.getState();
    setError('Something went wrong');

    const state = useResultStore.getState();
    expect(state.error).toBe('Something went wrong');
  });
});
