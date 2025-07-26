import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useInventoryStore } from '../inventory.store';
import { inventoryService } from '@/services/inventory.service';

// Mock the inventory service
vi.mock('@/services/inventory.service', () => ({
  inventoryService: {
    getInventoryItems: vi.fn(),
    getInventoryItem: vi.fn(),
    createInventoryItem: vi.fn(),
    updateInventoryItem: vi.fn(),
    deleteInventoryItem: vi.fn(),
    recordStockMovement: vi.fn(),
    getStockMovements: vi.fn(),
    getPurchaseOrders: vi.fn(),
    createPurchaseOrder: vi.fn(),
    updatePurchaseOrder: vi.fn(),
    getSuppliers: vi.fn(),
    createSupplier: vi.fn(),
    updateSupplier: vi.fn(),
  },
}));

// Mock Firebase auth
vi.mock('@/config/firebase.config', () => ({
  auth: {
    currentUser: { uid: 'user-123' },
  },
}));

// Mock tenant store
vi.mock('@/stores/tenant.store', () => ({
  useTenantStore: {
    getState: () => ({
      currentTenant: { id: 'tenant-123' },
    }),
  },
}));

describe('Inventory Store', () => {
  beforeEach(() => {
    // Reset store state
    useInventoryStore.setState({
      items: [],
      currentItem: null,
      stockMovements: [],
      purchaseOrders: [],
      suppliers: [],
      loading: false,
      error: null,
    });
    
    // Reset all mocks
    vi.clearAllMocks();
  });

  it('fetches inventory items', async () => {
    const mockItems = [
      {
        id: 'item-1',
        name: 'Test Reagent A',
        sku: 'REA-001',
        category: 'reagent',
        quantity: 100,
        minQuantity: 20,
        unit: 'mL',
      },
      {
        id: 'item-2',
        name: 'Test Tubes',
        sku: 'TUB-001',
        category: 'consumable',
        quantity: 500,
        minQuantity: 100,
        unit: 'pcs',
      },
    ];
    
    vi.mocked(inventoryService.getInventoryItems).mockResolvedValue(mockItems);

    const { fetchInventoryItems } = useInventoryStore.getState();
    await fetchInventoryItems({ category: 'reagent' });

    expect(inventoryService.getInventoryItems).toHaveBeenCalledWith({ category: 'reagent' });
    
    const state = useInventoryStore.getState();
    expect(state.items).toEqual(mockItems);
    expect(state.loading).toBe(false);
  });

  it('fetches a single inventory item', async () => {
    const mockItem = {
      id: 'item-1',
      name: 'Test Reagent A',
      sku: 'REA-001',
      category: 'reagent',
      quantity: 100,
      minQuantity: 20,
      unit: 'mL',
    };
    
    vi.mocked(inventoryService.getInventoryItem).mockResolvedValue(mockItem);

    const { fetchInventoryItem } = useInventoryStore.getState();
    await fetchInventoryItem('item-1');

    expect(inventoryService.getInventoryItem).toHaveBeenCalledWith('item-1');
    
    const state = useInventoryStore.getState();
    expect(state.currentItem).toEqual(mockItem);
    expect(state.loading).toBe(false);
  });

  it('creates an inventory item', async () => {
    vi.mocked(inventoryService.createInventoryItem).mockResolvedValue(undefined);

    const { createInventoryItem } = useInventoryStore.getState();
    await createInventoryItem({
      name: 'New Reagent',
      sku: 'REA-002',
      category: 'reagent',
      quantity: 50,
      minQuantity: 10,
      unit: 'mL',
    });

    expect(inventoryService.createInventoryItem).toHaveBeenCalledWith({
      name: 'New Reagent',
      sku: 'REA-002',
      category: 'reagent',
      quantity: 50,
      minQuantity: 10,
      unit: 'mL',
    });
    
    const state = useInventoryStore.getState();
    expect(state.loading).toBe(false);
  });

  it('records stock movement', async () => {
    vi.mocked(inventoryService.recordStockMovement).mockResolvedValue(undefined);

    const { recordStockMovement } = useInventoryStore.getState();
    await recordStockMovement({
      itemId: 'item-1',
      type: 'in',
      quantity: 50,
      reason: 'Purchase Order',
      referenceId: 'PO-123',
    });

    expect(inventoryService.recordStockMovement).toHaveBeenCalledWith({
      itemId: 'item-1',
      type: 'in',
      quantity: 50,
      reason: 'Purchase Order',
      referenceId: 'PO-123',
    });
    
    const state = useInventoryStore.getState();
    expect(state.loading).toBe(false);
  });

  it('fetches stock movements', async () => {
    const mockMovements = [
      {
        id: 'movement-1',
        itemId: 'item-1',
        type: 'in',
        quantity: 50,
        reason: 'Purchase Order',
        createdAt: new Date(),
      },
      {
        id: 'movement-2',
        itemId: 'item-1',
        type: 'out',
        quantity: 10,
        reason: 'Lab Usage',
        createdAt: new Date(),
      },
    ];
    
    vi.mocked(inventoryService.getStockMovements).mockResolvedValue(mockMovements);

    const { fetchStockMovements } = useInventoryStore.getState();
    await fetchStockMovements('item-1');

    expect(inventoryService.getStockMovements).toHaveBeenCalledWith('item-1');
    
    const state = useInventoryStore.getState();
    expect(state.stockMovements).toEqual(mockMovements);
    expect(state.loading).toBe(false);
  });

  it('fetches purchase orders', async () => {
    const mockOrders = [
      {
        id: 'po-1',
        orderNumber: 'PO-2024-001',
        supplierId: 'supplier-1',
        status: 'pending',
        items: [],
        totalAmount: 1000,
        createdAt: new Date(),
      },
    ];
    
    vi.mocked(inventoryService.getPurchaseOrders).mockResolvedValue(mockOrders);

    const { fetchPurchaseOrders } = useInventoryStore.getState();
    await fetchPurchaseOrders({ status: 'pending' });

    expect(inventoryService.getPurchaseOrders).toHaveBeenCalledWith({ status: 'pending' });
    
    const state = useInventoryStore.getState();
    expect(state.purchaseOrders).toEqual(mockOrders);
    expect(state.loading).toBe(false);
  });

  it('creates a purchase order', async () => {
    vi.mocked(inventoryService.createPurchaseOrder).mockResolvedValue(undefined);

    const { createPurchaseOrder } = useInventoryStore.getState();
    await createPurchaseOrder({
      supplierId: 'supplier-1',
      items: [
        { itemId: 'item-1', quantity: 100, unitPrice: 5 },
      ],
      expectedDelivery: new Date(),
    });

    expect(inventoryService.createPurchaseOrder).toHaveBeenCalled();
    
    const state = useInventoryStore.getState();
    expect(state.loading).toBe(false);
  });

  it('fetches suppliers', async () => {
    const mockSuppliers = [
      {
        id: 'supplier-1',
        name: 'Lab Supplies Inc',
        contactName: 'John Doe',
        email: 'john@labsupplies.com',
        phone: '123-456-7890',
        active: true,
      },
    ];
    
    vi.mocked(inventoryService.getSuppliers).mockResolvedValue(mockSuppliers);

    const { fetchSuppliers } = useInventoryStore.getState();
    await fetchSuppliers();

    expect(inventoryService.getSuppliers).toHaveBeenCalled();
    
    const state = useInventoryStore.getState();
    expect(state.suppliers).toEqual(mockSuppliers);
    expect(state.loading).toBe(false);
  });

  it('handles errors when fetching items', async () => {
    const error = new Error('Failed to fetch items');
    vi.mocked(inventoryService.getInventoryItems).mockRejectedValue(error);

    const { fetchInventoryItems } = useInventoryStore.getState();
    await fetchInventoryItems();
    
    const state = useInventoryStore.getState();
    expect(state.error).toBe('Failed to fetch items');
    expect(state.loading).toBe(false);
  });

  it('sets loading state', () => {
    const { setLoading } = useInventoryStore.getState();
    setLoading(true);

    const state = useInventoryStore.getState();
    expect(state.loading).toBe(true);
  });

  it('sets error state', () => {
    const { setError } = useInventoryStore.getState();
    setError('Something went wrong');

    const state = useInventoryStore.getState();
    expect(state.error).toBe('Something went wrong');
  });
});