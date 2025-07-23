/**
 * Inventory Management Types
 * Handles reagents, supplies, and equipment tracking
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Unit of measurement for inventory items
 */
export type UnitOfMeasure = 
  | 'piece'
  | 'box'
  | 'case'
  | 'ml'
  | 'l'
  | 'mg'
  | 'g'
  | 'kg'
  | 'test'
  | 'vial'
  | 'bottle'
  | 'pack'
  | 'roll'
  | 'sheet';

/**
 * Inventory item category
 */
export type InventoryCategory = 
  | 'reagent'
  | 'control'
  | 'calibrator'
  | 'consumable'
  | 'equipment'
  | 'ppe'
  | 'office_supply'
  | 'maintenance'
  | 'other';

/**
 * Storage condition requirements
 */
export interface StorageCondition {
  temperatureMin?: number; // in Celsius
  temperatureMax?: number;
  humidity?: string;
  lightSensitive?: boolean;
  requiresRefrigeration?: boolean;
  requiresFreezing?: boolean;
  specialInstructions?: string;
}

/**
 * Vendor/Supplier information
 */
export interface Vendor {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  catalogNumber?: string;
  leadTimeDays?: number;
  notes?: string;
}

/**
 * Inventory item definition
 */
export interface InventoryItem {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  category: InventoryCategory;
  manufacturer?: string;
  catalogNumber?: string;
  unit: UnitOfMeasure;
  storageCondition?: StorageCondition;
  
  // Stock levels
  currentStock: number;
  minimumStock: number;
  maximumStock?: number;
  reorderPoint: number;
  reorderQuantity: number;
  
  // Cost information
  unitCost?: number;
  lastPurchasePrice?: number;
  averageCost?: number;
  
  // Vendor information
  preferredVendor?: Vendor;
  alternativeVendors?: Vendor[];
  
  // Usage tracking
  averageMonthlyUsage?: number;
  lastUsedDate?: Timestamp;
  
  // Compliance
  requiresLotTracking: boolean;
  requiresExpirationTracking: boolean;
  hazardous?: boolean;
  msdsUrl?: string;
  
  // Status
  isActive: boolean;
  discontinuedDate?: Timestamp;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
}

/**
 * Stock transaction types
 */
export type TransactionType = 
  | 'purchase'
  | 'usage'
  | 'adjustment'
  | 'disposal'
  | 'transfer'
  | 'return';

/**
 * Stock transaction record
 */
export interface StockTransaction {
  id: string;
  tenantId: string;
  itemId: string;
  type: TransactionType;
  quantity: number; // positive for incoming, negative for outgoing
  
  // Lot tracking
  lotNumber?: string;
  expirationDate?: Timestamp;
  
  // Transaction details
  referenceNumber?: string; // PO number, test order ID, etc.
  vendor?: Vendor;
  unitCost?: number;
  totalCost?: number;
  
  // Location tracking
  fromLocation?: string;
  toLocation?: string;
  
  // Usage details (for 'usage' type)
  testOrderId?: string;
  patientId?: string;
  
  // Reason (for adjustments/disposals)
  reason?: string;
  
  // Metadata
  performedBy: string;
  performedAt: Timestamp;
  notes?: string;
}

/**
 * Lot information for items requiring lot tracking
 */
export interface LotInfo {
  id: string;
  tenantId: string;
  itemId: string;
  lotNumber: string;
  expirationDate: Timestamp;
  quantity: number;
  
  // Receipt information
  receivedDate: Timestamp;
  vendor?: Vendor;
  purchaseOrderNumber?: string;
  
  // Quality control
  qcStatus: 'pending' | 'passed' | 'failed' | 'quarantine';
  qcDate?: Timestamp;
  qcPerformedBy?: string;
  qcNotes?: string;
  
  // Usage tracking
  quantityUsed: number;
  quantityRemaining: number;
  
  // Status
  isActive: boolean;
  isExpired: boolean;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Purchase order status
 */
export type PurchaseOrderStatus = 
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'ordered'
  | 'partial_received'
  | 'received'
  | 'cancelled';

/**
 * Purchase order line item
 */
export interface PurchaseOrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: UnitOfMeasure;
  unitPrice: number;
  totalPrice: number;
  quantityReceived?: number;
  notes?: string;
}

/**
 * Purchase order
 */
export interface PurchaseOrder {
  id: string;
  tenantId: string;
  orderNumber: string;
  status: PurchaseOrderStatus;
  
  // Vendor information
  vendor: Vendor;
  
  // Order items
  items: PurchaseOrderItem[];
  
  // Financial summary
  subtotal: number;
  tax?: number;
  shipping?: number;
  total: number;
  
  // Dates
  orderDate: Timestamp;
  expectedDeliveryDate?: Timestamp;
  actualDeliveryDate?: Timestamp;
  
  // Approval workflow
  requestedBy: string;
  approvedBy?: string;
  approvalDate?: Timestamp;
  
  // Delivery information
  shipToAddress?: string;
  trackingNumber?: string;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  notes?: string;
}

/**
 * Inventory alert types
 */
export type AlertType = 
  | 'low_stock'
  | 'expiring_soon'
  | 'expired'
  | 'reorder_needed'
  | 'overstock';

/**
 * Inventory alert
 */
export interface InventoryAlert {
  id: string;
  tenantId: string;
  type: AlertType;
  itemId: string;
  itemName: string;
  
  // Alert details
  currentValue: number;
  thresholdValue: number;
  expirationDate?: Timestamp;
  lotNumber?: string;
  
  // Status
  isActive: boolean;
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Timestamp;
  
  // Action taken
  actionTaken?: string;
  resolvedAt?: Timestamp;
  
  // Metadata
  createdAt: Timestamp;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Inventory report configuration
 */
export interface InventoryReport {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  
  // Report parameters
  categories?: InventoryCategory[];
  includeInactive?: boolean;
  includeExpired?: boolean;
  dateRange?: {
    start: Timestamp;
    end: Timestamp;
  };
  
  // Report type
  type: 'stock_level' | 'usage' | 'expiration' | 'valuation' | 'reorder';
  
  // Schedule
  schedule?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients?: string[];
  
  // Metadata
  createdAt: Timestamp;
  createdBy: string;
  lastRunAt?: Timestamp;
}

/**
 * Form data for creating/updating inventory items
 */
export interface InventoryItemFormData {
  name: string;
  description?: string;
  category: InventoryCategory;
  manufacturer?: string;
  catalogNumber?: string;
  unit: UnitOfMeasure;
  
  // Stock levels
  minimumStock: number;
  maximumStock?: number;
  reorderPoint: number;
  reorderQuantity: number;
  
  // Storage
  storageCondition?: StorageCondition;
  
  // Cost
  unitCost?: number;
  
  // Compliance
  requiresLotTracking: boolean;
  requiresExpirationTracking: boolean;
  hazardous?: boolean;
  msdsUrl?: string;
  
  // Vendor
  preferredVendor?: Vendor;
}

/**
 * Form data for stock transactions
 */
export interface StockTransactionFormData {
  itemId: string;
  type: TransactionType;
  quantity: number;
  lotNumber?: string;
  expirationDate?: Date;
  vendor?: Vendor;
  unitCost?: number;
  reason?: string;
  notes?: string;
}