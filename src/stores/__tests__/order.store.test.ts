import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useOrderStore } from '../order.store';
import { orderService } from '@/services/order.service';

// Mock the order service
vi.mock('@/services/order.service', () => ({
  orderService: {
    createTestOrder: vi.fn(),
    getTestOrders: vi.fn(),
    getTestOrder: vi.fn(),
    updateTestOrder: vi.fn(),
    updateTestStatus: vi.fn(),
    createSpecimen: vi.fn(),
    getSpecimens: vi.fn(),
    updateSpecimen: vi.fn(),
    receiveSpecimen: vi.fn(),
    searchOrders: vi.fn(),
    getPendingCollections: vi.fn(),
    getTodayOrders: vi.fn(),
  },
}));

describe('Order Store', () => {
  beforeEach(() => {
    // Reset store state
    useOrderStore.setState({
      orders: [],
      currentOrder: null,
      specimens: [],
      pendingCollections: [],
      todayOrders: [],
      loading: false,
      error: null,
    });
    
    // Reset all mocks
    vi.clearAllMocks();
  });

  it('creates a test order successfully', async () => {
    const mockOrderId = 'order-123';
    const mockOrders = [
      {
        id: mockOrderId,
        patientId: 'patient-123',
        tests: ['test-1'],
        status: 'pending',
        createdAt: new Date(),
      },
    ];
    
    vi.mocked(orderService.createTestOrder).mockResolvedValue(mockOrderId);
    vi.mocked(orderService.getTestOrders).mockResolvedValue(mockOrders);

    const { createTestOrder } = useOrderStore.getState();
    const orderId = await createTestOrder({
      patientId: 'patient-123',
      tests: ['test-1'],
    });

    expect(orderId).toBe(mockOrderId);
    expect(orderService.createTestOrder).toHaveBeenCalledWith({
      patientId: 'patient-123',
      tests: ['test-1'],
    });
    
    const state = useOrderStore.getState();
    expect(state.orders).toEqual(mockOrders);
    expect(state.loading).toBe(false);
  });

  it('fetches test orders', async () => {
    const mockOrders = [
      {
        id: 'order-1',
        patientId: 'patient-123',
        tests: ['test-1'],
        status: 'pending',
        createdAt: new Date(),
      },
      {
        id: 'order-2',
        patientId: 'patient-456',
        tests: ['test-2'],
        status: 'completed',
        createdAt: new Date(),
      },
    ];
    
    vi.mocked(orderService.getTestOrders).mockResolvedValue(mockOrders);

    const { fetchTestOrders } = useOrderStore.getState();
    await fetchTestOrders({ status: 'pending' });

    expect(orderService.getTestOrders).toHaveBeenCalledWith({ status: 'pending' });
    
    const state = useOrderStore.getState();
    expect(state.orders).toEqual(mockOrders);
    expect(state.loading).toBe(false);
  });

  it('fetches a single test order', async () => {
    const mockOrder = {
      id: 'order-123',
      patientId: 'patient-123',
      tests: ['test-1', 'test-2'],
      status: 'pending',
      createdAt: new Date(),
    };
    
    vi.mocked(orderService.getTestOrder).mockResolvedValue(mockOrder);

    const { fetchTestOrder } = useOrderStore.getState();
    await fetchTestOrder('order-123');

    expect(orderService.getTestOrder).toHaveBeenCalledWith('order-123');
    
    const state = useOrderStore.getState();
    expect(state.currentOrder).toEqual(mockOrder);
    expect(state.loading).toBe(false);
  });

  it('handles errors when creating test order', async () => {
    const error = new Error('Failed to create order');
    vi.mocked(orderService.createTestOrder).mockRejectedValue(error);

    const { createTestOrder } = useOrderStore.getState();
    
    await expect(createTestOrder({
      patientId: 'patient-123',
      tests: ['test-1'],
    })).rejects.toThrow('Failed to create order');
    
    const state = useOrderStore.getState();
    expect(state.error).toBe('Failed to create order');
    expect(state.loading).toBe(false);
  });

  it('creates a specimen successfully', async () => {
    const mockSpecimenId = 'specimen-123';
    const mockSpecimens = [
      {
        id: mockSpecimenId,
        orderId: 'order-123',
        type: 'blood',
        status: 'collected',
        collectedAt: new Date(),
      },
    ];
    
    vi.mocked(orderService.createSpecimen).mockResolvedValue(mockSpecimenId);
    vi.mocked(orderService.getSpecimens).mockResolvedValue(mockSpecimens);

    const { createSpecimen } = useOrderStore.getState();
    const specimenId = await createSpecimen({
      orderId: 'order-123',
      type: 'blood',
    });

    expect(specimenId).toBe(mockSpecimenId);
    expect(orderService.createSpecimen).toHaveBeenCalledWith({
      orderId: 'order-123',
      type: 'blood',
    });
    
    const state = useOrderStore.getState();
    expect(state.specimens).toEqual(mockSpecimens);
  });

  it('fetches pending collections', async () => {
    const mockPendingCollections = [
      {
        id: 'order-1',
        patientId: 'patient-123',
        tests: ['test-1'],
        status: 'pending',
        createdAt: new Date(),
      },
    ];
    
    vi.mocked(orderService.getPendingCollections).mockResolvedValue(mockPendingCollections);

    const { fetchPendingCollections } = useOrderStore.getState();
    await fetchPendingCollections();

    expect(orderService.getPendingCollections).toHaveBeenCalled();
    
    const state = useOrderStore.getState();
    expect(state.pendingCollections).toEqual(mockPendingCollections);
    expect(state.loading).toBe(false);
  });

  it('searches orders', async () => {
    const mockSearchResults = [
      {
        id: 'order-1',
        patientId: 'patient-123',
        tests: ['test-1'],
        status: 'completed',
        createdAt: new Date(),
      },
    ];
    
    vi.mocked(orderService.searchOrders).mockResolvedValue(mockSearchResults);

    const { searchOrders } = useOrderStore.getState();
    await searchOrders('patient-123');

    expect(orderService.searchOrders).toHaveBeenCalledWith('patient-123');
    
    const state = useOrderStore.getState();
    expect(state.orders).toEqual(mockSearchResults);
    expect(state.loading).toBe(false);
  });

  it('updates test status', async () => {
    const mockOrder = {
      id: 'order-123',
      patientId: 'patient-123',
      tests: ['test-1', 'test-2'],
      status: 'pending',
      createdAt: new Date(),
    };
    
    vi.mocked(orderService.updateTestStatus).mockResolvedValue(undefined);
    vi.mocked(orderService.getTestOrder).mockResolvedValue(mockOrder);

    const { updateTestStatus } = useOrderStore.getState();
    await updateTestStatus('order-123', 'test-1', 'completed');

    expect(orderService.updateTestStatus).toHaveBeenCalledWith('order-123', 'test-1', 'completed');
    expect(orderService.getTestOrder).toHaveBeenCalledWith('order-123');
    
    const state = useOrderStore.getState();
    expect(state.currentOrder).toEqual(mockOrder);
    expect(state.loading).toBe(false);
  });

  it('receives specimen', async () => {
    const mockSpecimens = [
      {
        id: 'specimen-123',
        orderId: 'order-123',
        type: 'blood',
        status: 'received',
        receivedAt: new Date(),
        receivedBy: 'tech-1',
      },
    ];
    
    vi.mocked(orderService.receiveSpecimen).mockResolvedValue(undefined);
    vi.mocked(orderService.getSpecimens).mockResolvedValue(mockSpecimens);

    const { receiveSpecimen } = useOrderStore.getState();
    await receiveSpecimen('specimen-123', 'tech-1');

    expect(orderService.receiveSpecimen).toHaveBeenCalledWith('specimen-123', 'tech-1');
    expect(orderService.getSpecimens).toHaveBeenCalled();
    
    const state = useOrderStore.getState();
    expect(state.specimens).toEqual(mockSpecimens);
    expect(state.loading).toBe(false);
  });

  it('fetches today orders', async () => {
    const mockTodayOrders = [
      {
        id: 'order-1',
        patientId: 'patient-123',
        tests: ['test-1'],
        status: 'pending',
        createdAt: new Date(),
      },
      {
        id: 'order-2',
        patientId: 'patient-456',
        tests: ['test-2'],
        status: 'in_progress',
        createdAt: new Date(),
      },
    ];
    
    vi.mocked(orderService.getTodayOrders).mockResolvedValue(mockTodayOrders);

    const { fetchTodayOrders } = useOrderStore.getState();
    await fetchTodayOrders();

    expect(orderService.getTodayOrders).toHaveBeenCalled();
    
    const state = useOrderStore.getState();
    expect(state.todayOrders).toEqual(mockTodayOrders);
    expect(state.loading).toBe(false);
  });

  it('sets loading state', () => {
    const { setLoading } = useOrderStore.getState();
    setLoading(true);

    const state = useOrderStore.getState();
    expect(state.loading).toBe(true);
  });

  it('sets error state', () => {
    const { setError } = useOrderStore.getState();
    setError('Something went wrong');

    const state = useOrderStore.getState();
    expect(state.error).toBe('Something went wrong');
  });
});