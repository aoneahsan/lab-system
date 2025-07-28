import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useQualityControlStore } from '../quality-control.store';
import { qualityControlService } from '@/services/quality-control.service';

// Mock the quality control service
vi.mock('@/services/quality-control.service', () => ({
  qualityControlService: {
    getQCTests: vi.fn(),
    createQCTest: vi.fn(),
    recordQCResult: vi.fn(),
    getQCResults: vi.fn(),
    calculateStatistics: vi.fn(),
    getLeveyJenningsData: vi.fn(),
  },
}));

describe('Quality Control Store', () => {
  beforeEach(() => {
    // Reset store state
    useQualityControlStore.setState({
      qcTests: [],
      currentTest: null,
      qcResults: [],
      statistics: null,
      leveyJenningsData: [],
      loading: false,
      error: null,
    });

    // Reset all mocks
    vi.clearAllMocks();
  });

  it('fetches QC tests', async () => {
    const mockTests = [
      {
        id: 'qc-test-1',
        name: 'Glucose Control',
        testId: 'test-1',
        levels: ['normal', 'high'],
        active: true,
      },
      {
        id: 'qc-test-2',
        name: 'Chemistry Control',
        testId: 'test-2',
        levels: ['normal', 'abnormal'],
        active: true,
      },
    ];

    vi.mocked(qualityControlService.getQCTests).mockResolvedValue(mockTests);

    const { fetchQCTests } = useQualityControlStore.getState();
    await fetchQCTests({ active: true });

    expect(qualityControlService.getQCTests).toHaveBeenCalledWith({ active: true });

    const state = useQualityControlStore.getState();
    expect(state.qcTests).toEqual(mockTests);
    expect(state.loading).toBe(false);
  });

  it('creates a QC test', async () => {
    const mockTests = [
      {
        id: 'qc-test-1',
        name: 'New QC Test',
        testId: 'test-1',
        levels: ['normal'],
        active: true,
      },
    ];

    vi.mocked(qualityControlService.createQCTest).mockResolvedValue(undefined);
    vi.mocked(qualityControlService.getQCTests).mockResolvedValue(mockTests);

    const { createQCTest } = useQualityControlStore.getState();
    await createQCTest({
      name: 'New QC Test',
      testId: 'test-1',
      levels: ['normal'],
    });

    expect(qualityControlService.createQCTest).toHaveBeenCalledWith({
      name: 'New QC Test',
      testId: 'test-1',
      levels: ['normal'],
    });
    expect(qualityControlService.getQCTests).toHaveBeenCalled();

    const state = useQualityControlStore.getState();
    expect(state.qcTests).toEqual(mockTests);
    expect(state.loading).toBe(false);
  });

  it('records QC result with violations', async () => {
    const mockResult = { violations: ['13s', '22s'] };
    const mockResults = [
      {
        id: 'result-1',
        qcTestId: 'qc-test-1',
        levelId: 'normal',
        value: 102,
        timestamp: new Date(),
        violations: ['13s', '22s'],
      },
    ];

    vi.mocked(qualityControlService.recordQCResult).mockResolvedValue(mockResult);
    vi.mocked(qualityControlService.getQCResults).mockResolvedValue(mockResults);

    const { recordQCResult } = useQualityControlStore.getState();
    const result = await recordQCResult({
      qcTestId: 'qc-test-1',
      levelId: 'normal',
      value: 102,
    });

    expect(result).toEqual(mockResult);
    expect(qualityControlService.recordQCResult).toHaveBeenCalledWith({
      qcTestId: 'qc-test-1',
      levelId: 'normal',
      value: 102,
    });

    const state = useQualityControlStore.getState();
    expect(state.qcResults).toEqual(mockResults);
    expect(state.loading).toBe(false);
  });

  it('fetches QC results', async () => {
    const mockResults = [
      {
        id: 'result-1',
        qcTestId: 'qc-test-1',
        levelId: 'normal',
        value: 100,
        timestamp: new Date(),
      },
      {
        id: 'result-2',
        qcTestId: 'qc-test-1',
        levelId: 'normal',
        value: 102,
        timestamp: new Date(),
      },
    ];

    vi.mocked(qualityControlService.getQCResults).mockResolvedValue(mockResults);

    const { fetchQCResults } = useQualityControlStore.getState();
    await fetchQCResults('qc-test-1', 'normal', 30);

    expect(qualityControlService.getQCResults).toHaveBeenCalledWith('qc-test-1', 'normal', 30);

    const state = useQualityControlStore.getState();
    expect(state.qcResults).toEqual(mockResults);
    expect(state.loading).toBe(false);
  });

  it('calculates statistics', async () => {
    const mockStatistics = {
      mean: 100,
      sd: 2.5,
      cv: 2.5,
      n: 50,
      min: 95,
      max: 105,
    };

    vi.mocked(qualityControlService.calculateStatistics).mockResolvedValue(mockStatistics);

    const { calculateStatistics } = useQualityControlStore.getState();
    await calculateStatistics('qc-test-1', 'normal', 'monthly');

    expect(qualityControlService.calculateStatistics).toHaveBeenCalledWith(
      'qc-test-1',
      'normal',
      'monthly'
    );

    const state = useQualityControlStore.getState();
    expect(state.statistics).toEqual(mockStatistics);
    expect(state.loading).toBe(false);
  });

  it('fetches Levey-Jennings data', async () => {
    const mockLJData = [
      {
        date: new Date('2024-01-01'),
        value: 98,
        mean: 100,
        sd: 2,
        violations: [],
      },
      {
        date: new Date('2024-01-02'),
        value: 105,
        mean: 100,
        sd: 2,
        violations: ['13s'],
      },
    ];

    vi.mocked(qualityControlService.getLeveyJenningsData).mockResolvedValue(mockLJData);

    const { fetchLeveyJenningsData } = useQualityControlStore.getState();
    await fetchLeveyJenningsData('qc-test-1', 'normal', 30);

    expect(qualityControlService.getLeveyJenningsData).toHaveBeenCalledWith(
      'qc-test-1',
      'normal',
      30
    );

    const state = useQualityControlStore.getState();
    expect(state.leveyJenningsData).toEqual(mockLJData);
    expect(state.loading).toBe(false);
  });

  it('handles errors when fetching QC tests', async () => {
    const error = new Error('Failed to fetch QC tests');
    vi.mocked(qualityControlService.getQCTests).mockRejectedValue(error);

    const { fetchQCTests } = useQualityControlStore.getState();
    await fetchQCTests();

    const state = useQualityControlStore.getState();
    expect(state.error).toBe('Failed to fetch QC tests');
    expect(state.loading).toBe(false);
  });

  it('handles errors when recording QC result', async () => {
    const error = new Error('Failed to record result');
    vi.mocked(qualityControlService.recordQCResult).mockRejectedValue(error);

    const { recordQCResult } = useQualityControlStore.getState();

    await expect(
      recordQCResult({
        qcTestId: 'qc-test-1',
        levelId: 'normal',
        value: 102,
      })
    ).rejects.toThrow('Failed to record result');

    const state = useQualityControlStore.getState();
    expect(state.error).toBe('Failed to record result');
    expect(state.loading).toBe(false);
  });

  it('sets loading state', () => {
    const { setLoading } = useQualityControlStore.getState();
    setLoading(true);

    const state = useQualityControlStore.getState();
    expect(state.loading).toBe(true);
  });

  it('sets error state', () => {
    const { setError } = useQualityControlStore.getState();
    setError('Something went wrong');

    const state = useQualityControlStore.getState();
    expect(state.error).toBe('Something went wrong');
  });
});
