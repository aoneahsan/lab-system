import { Timestamp } from 'firebase/firestore';

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  category: 'reagent' | 'consumable' | 'equipment' | 'chemical' | 'other';
  sku: string;
  unit: string;
  currentStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  location?: string;
  supplier?: string;
  unitCost?: number;
  expirationDate?: Timestamp;
  lotNumber?: string;
  manufacturer?: string;
  status: 'active' | 'discontinued' | 'backordered';
  lastRestockDate?: Timestamp;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  type: 'in' | 'out' | 'adjustment' | 'return' | 'disposal';
  quantity: number;
  reason?: string;
  referenceNumber?: string;
  performedBy: string;
  notes?: string;
  cost?: number;
  createdAt: Timestamp;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  status: 'draft' | 'pending' | 'approved' | 'ordered' | 'partial' | 'received' | 'cancelled';
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  orderDate?: Timestamp;
  expectedDate?: Timestamp;
  receivedDate?: Timestamp;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  approvedBy?: string;
}

export interface PurchaseOrderItem {
  itemId: string;
  quantity: number;
  unitCost: number;
  total: number;
  received?: number;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  accountNumber?: string;
  paymentTerms?: string;
  notes?: string;
  status: 'active' | 'inactive';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
