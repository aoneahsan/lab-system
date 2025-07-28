import { api } from './api';

export interface InventoryItem {
  itemId: string;
  name: string;
  category: 'reagent' | 'consumable' | 'equipment' | 'other';
  sku: string;
  barcode?: string;
  manufacturer: string;
  lot?: string;
  expiryDate?: Date;
  quantity: number;
  unit: string;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  location: string;
  status: 'active' | 'inactive' | 'expired' | 'recalled';
  price: number;
  lastRestocked?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockMovement {
  movementId: string;
  itemId: string;
  type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  reason: string;
  reference?: string;
  fromLocation?: string;
  toLocation?: string;
  performedBy: string;
  performedAt: Date;
  notes?: string;
}

export interface PurchaseOrder {
  orderId: string;
  orderNumber: string;
  supplier: SupplierInfo;
  items: PurchaseOrderItem[];
  status: 'draft' | 'pending' | 'approved' | 'ordered' | 'partial' | 'received' | 'cancelled';
  totals: {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  };
  orderDate?: Date;
  expectedDate?: Date;
  receivedDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderItem {
  itemId: string;
  name: string;
  sku: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  received?: number;
}

export interface SupplierInfo {
  supplierId: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
}

export interface StockAlert {
  alertId: string;
  itemId: string;
  type: 'low_stock' | 'expiring' | 'expired' | 'reorder';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  createdAt: Date;
}

class InventoryService {
  // Inventory Items
  async getInventoryItems(filters?: {
    category?: string;
    status?: string;
    location?: string;
    search?: string;
    lowStock?: boolean;
    expiringSoon?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ items: InventoryItem[]; total: number }> {
    const response = await api.get('/api/inventory', { params: filters });
    return response.data;
  }

  async getItemById(itemId: string): Promise<InventoryItem> {
    const response = await api.get(`/api/inventory/${itemId}`);
    return response.data;
  }

  async createItem(item: Partial<InventoryItem>): Promise<InventoryItem> {
    const response = await api.post('/api/inventory', item);
    return response.data;
  }

  async updateItem(itemId: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    const response = await api.put(`/api/inventory/${itemId}`, updates);
    return response.data;
  }

  async deleteItem(itemId: string): Promise<void> {
    await api.delete(`/api/inventory/${itemId}`);
  }

  // Stock Movements
  async recordStockMovement(movement: Partial<StockMovement>): Promise<StockMovement> {
    const response = await api.post('/api/inventory/movements', movement);
    return response.data;
  }

  async getStockMovements(filters?: {
    itemId?: string;
    type?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ movements: StockMovement[]; total: number }> {
    const response = await api.get('/api/inventory/movements', { params: filters });
    return response.data;
  }

  async adjustStock(
    itemId: string,
    adjustment: {
      quantity: number;
      reason: string;
      notes?: string;
    }
  ): Promise<StockMovement> {
    const response = await api.post(`/api/inventory/${itemId}/adjust`, adjustment);
    return response.data;
  }

  // Purchase Orders
  async getPurchaseOrders(filters?: {
    status?: string;
    supplier?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ orders: PurchaseOrder[]; total: number }> {
    const response = await api.get('/api/inventory/purchase-orders', { params: filters });
    return response.data;
  }

  async getPurchaseOrderById(orderId: string): Promise<PurchaseOrder> {
    const response = await api.get(`/api/inventory/purchase-orders/${orderId}`);
    return response.data;
  }

  async createPurchaseOrder(order: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    const response = await api.post('/api/inventory/purchase-orders', order);
    return response.data;
  }

  async updatePurchaseOrder(
    orderId: string,
    updates: Partial<PurchaseOrder>
  ): Promise<PurchaseOrder> {
    const response = await api.put(`/api/inventory/purchase-orders/${orderId}`, updates);
    return response.data;
  }

  async approvePurchaseOrder(orderId: string): Promise<PurchaseOrder> {
    const response = await api.post(`/api/inventory/purchase-orders/${orderId}/approve`);
    return response.data;
  }

  async receivePurchaseOrder(
    orderId: string,
    receipt: {
      items: Array<{
        itemId: string;
        received: number;
        lot?: string;
        expiryDate?: Date;
      }>;
      notes?: string;
    }
  ): Promise<PurchaseOrder> {
    const response = await api.post(`/api/inventory/purchase-orders/${orderId}/receive`, receipt);
    return response.data;
  }

  // Stock Alerts
  async getStockAlerts(filters?: {
    type?: string;
    severity?: string;
    acknowledged?: boolean;
  }): Promise<StockAlert[]> {
    const response = await api.get('/api/inventory/alerts', { params: filters });
    return response.data;
  }

  async acknowledgeAlert(alertId: string): Promise<StockAlert> {
    const response = await api.post(`/api/inventory/alerts/${alertId}/acknowledge`);
    return response.data;
  }

  // Reports
  async getStockSummary(): Promise<{
    totalItems: number;
    totalValue: number;
    lowStockCount: number;
    expiringCount: number;
    categoryBreakdown: Record<string, number>;
  }> {
    const response = await api.get('/api/inventory/reports/summary');
    return response.data;
  }

  async getExpiryReport(days: number = 30): Promise<InventoryItem[]> {
    const response = await api.get('/api/inventory/reports/expiry', {
      params: { days },
    });
    return response.data;
  }

  async getUsageReport(period: { startDate: Date; endDate: Date; itemId?: string }): Promise<{
    items: Array<{
      itemId: string;
      name: string;
      totalUsed: number;
      averageDaily: number;
      projectedDaysRemaining: number;
    }>;
  }> {
    const response = await api.get('/api/inventory/reports/usage', { params: period });
    return response.data;
  }

  // Barcode
  async scanBarcode(barcode: string): Promise<InventoryItem | null> {
    const response = await api.get('/api/inventory/barcode', {
      params: { barcode },
    });
    return response.data;
  }

  async generateBarcode(itemId: string): Promise<string> {
    const response = await api.get(`/api/inventory/${itemId}/barcode`);
    return response.data.barcode;
  }

  // Export
  async exportInventory(format: 'csv' | 'excel' | 'pdf'): Promise<Blob> {
    const response = await api.get('/api/inventory/export', {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  }
}

export const inventoryService = new InventoryService();
