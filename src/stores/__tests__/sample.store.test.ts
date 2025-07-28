import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSampleStore } from '../sample.store';
import { sampleService } from '@/services/sample.service';

// Mock the sample service
vi.mock('@/services/sample.service', () => ({
  sampleService: {
    getSamples: vi.fn(),
    getSample: vi.fn(),
    getSampleByBarcode: vi.fn(),
    createSample: vi.fn(),
    updateSample: vi.fn(),
    updateSampleStatus: vi.fn(),
    deleteSample: vi.fn(),
    getSampleCollections: vi.fn(),
    createSampleCollection: vi.fn(),
    completeSampleCollection: vi.fn(),
    getSampleStatistics: vi.fn(),
    batchUpdateSamples: vi.fn(),
    updateBatchStatus: vi.fn(),
  },
}));

describe('Sample Store', () => {
  beforeEach(() => {
    // Reset store state
    useSampleStore.setState({
      samples: [],
      currentSample: null,
      sampleCollections: [],
      statistics: null,
      loading: false,
      error: null,
    });

    // Reset all mocks
    vi.clearAllMocks();
  });

  it('fetches samples', async () => {
    const mockSamples = [
      {
        id: 'sample-1',
        barcode: 'BC123456',
        type: 'blood',
        status: 'collected',
        patientId: 'patient-123',
        collectedAt: new Date(),
      },
      {
        id: 'sample-2',
        barcode: 'BC123457',
        type: 'urine',
        status: 'in_transit',
        patientId: 'patient-456',
        collectedAt: new Date(),
      },
    ];

    vi.mocked(sampleService.getSamples).mockResolvedValue(mockSamples);

    const { fetchSamples } = useSampleStore.getState();
    await fetchSamples('tenant-123', { status: 'collected' });

    expect(sampleService.getSamples).toHaveBeenCalledWith('tenant-123', { status: 'collected' });

    const state = useSampleStore.getState();
    expect(state.samples).toEqual(mockSamples);
    expect(state.loading).toBe(false);
  });

  it('fetches a single sample', async () => {
    const mockSample = {
      id: 'sample-1',
      barcode: 'BC123456',
      type: 'blood',
      status: 'collected',
      patientId: 'patient-123',
      collectedAt: new Date(),
    };

    vi.mocked(sampleService.getSample).mockResolvedValue(mockSample);

    const { fetchSample } = useSampleStore.getState();
    await fetchSample('tenant-123', 'sample-1');

    expect(sampleService.getSample).toHaveBeenCalledWith('tenant-123', 'sample-1');

    const state = useSampleStore.getState();
    expect(state.currentSample).toEqual(mockSample);
    expect(state.loading).toBe(false);
  });

  it('gets sample by barcode', async () => {
    const mockSample = {
      id: 'sample-1',
      barcode: 'BC123456',
      type: 'blood',
      status: 'collected',
      patientId: 'patient-123',
      collectedAt: new Date(),
    };

    // Set sample in store
    useSampleStore.setState({ samples: [mockSample] });

    const { getSampleByBarcode } = useSampleStore.getState();
    const sample = await getSampleByBarcode('BC123456');

    expect(sample).toEqual(mockSample);
  });

  it('creates a sample', async () => {
    const mockSample = { id: 'sample-123' };
    vi.mocked(sampleService.createSample).mockResolvedValue(mockSample);
    vi.mocked(sampleService.getSamples).mockResolvedValue([]);

    const { createSample } = useSampleStore.getState();
    const sampleId = await createSample('tenant-123', 'user-123', {
      type: 'blood',
      patientId: 'patient-123',
      orderId: 'order-123',
    });

    expect(sampleId).toBe('sample-123');
    expect(sampleService.createSample).toHaveBeenCalledWith('tenant-123', 'user-123', {
      type: 'blood',
      patientId: 'patient-123',
      orderId: 'order-123',
    });
  });

  it('updates sample status', async () => {
    vi.mocked(sampleService.updateSampleStatus).mockResolvedValue(undefined);

    const { updateSampleStatus } = useSampleStore.getState();
    await updateSampleStatus(
      'tenant-123',
      'user-123',
      'sample-1',
      'processed',
      'Sample processed successfully',
      'Lab A'
    );

    expect(sampleService.updateSampleStatus).toHaveBeenCalledWith(
      'tenant-123',
      'user-123',
      'sample-1',
      'processed',
      'Sample processed successfully',
      'Lab A'
    );

    const state = useSampleStore.getState();
    expect(state.loading).toBe(false);
  });

  it('fetches sample collections', async () => {
    const mockCollections = [
      {
        id: 'collection-1',
        scheduledFor: new Date(),
        patientId: 'patient-123',
        samples: ['sample-1', 'sample-2'],
        status: 'scheduled',
      },
    ];

    vi.mocked(sampleService.getSampleCollections).mockResolvedValue(mockCollections);

    const { fetchSampleCollections } = useSampleStore.getState();
    await fetchSampleCollections('tenant-123', { status: 'scheduled' });

    expect(sampleService.getSampleCollections).toHaveBeenCalledWith('tenant-123', {
      status: 'scheduled',
    });

    const state = useSampleStore.getState();
    expect(state.sampleCollections).toEqual(mockCollections);
    expect(state.loading).toBe(false);
  });

  it('creates sample collection', async () => {
    const mockCollection = { id: 'collection-123' };
    vi.mocked(sampleService.createSampleCollection).mockResolvedValue(mockCollection);
    vi.mocked(sampleService.getSampleCollections).mockResolvedValue([]);

    const { createSampleCollection } = useSampleStore.getState();
    const collectionId = await createSampleCollection('tenant-123', 'user-123', {
      patientId: 'patient-123',
      scheduledFor: new Date(),
      samples: ['sample-1', 'sample-2'],
    });

    expect(collectionId).toBe('collection-123');
    expect(sampleService.createSampleCollection).toHaveBeenCalledWith('tenant-123', 'user-123', {
      patientId: 'patient-123',
      scheduledFor: expect.any(Date),
      samples: ['sample-1', 'sample-2'],
    });
  });

  it('batch updates sample status', async () => {
    vi.mocked(sampleService.updateBatchStatus).mockResolvedValue(undefined);
    vi.mocked(sampleService.getSamples).mockResolvedValue([]);

    const updates = [
      { sampleId: 'sample-1', status: 'received', notes: 'Received at lab' },
      { sampleId: 'sample-2', status: 'received', notes: 'Received at lab' },
    ];

    const { updateBatchStatus } = useSampleStore.getState();
    await updateBatchStatus('tenant-123', 'user-123', updates);

    expect(sampleService.updateBatchStatus).toHaveBeenCalledWith('tenant-123', 'user-123', updates);

    const state = useSampleStore.getState();
    expect(state.loading).toBe(false);
  });

  it('handles errors when fetching samples', async () => {
    const error = new Error('Failed to fetch samples');
    vi.mocked(sampleService.getSamples).mockRejectedValue(error);

    const { fetchSamples } = useSampleStore.getState();
    await fetchSamples('tenant-123');

    const state = useSampleStore.getState();
    expect(state.error).toBe('Failed to fetch samples');
    expect(state.loading).toBe(false);
  });

  it('sets loading state', () => {
    const { setLoading } = useSampleStore.getState();
    setLoading(true);

    const state = useSampleStore.getState();
    expect(state.loading).toBe(true);
  });

  it('sets error state', () => {
    const { setError } = useSampleStore.getState();
    setError('Something went wrong');

    const state = useSampleStore.getState();
    expect(state.error).toBe('Something went wrong');
  });
});
