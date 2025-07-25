/**
 * Inventory Service
 * Handles all inventory-related operations
 */

import {
	collection,
	doc,
	addDoc,
	updateDoc,
	getDoc,
	getDocs,
	query,
	where,
	orderBy,
	limit,
	startAfter,
	DocumentSnapshot,
	Timestamp,
	runTransaction,
	serverTimestamp,
	increment,
} from 'firebase/firestore';
import { firestore, auth } from '@/config/firebase.config';
import { getFirestoreCollectionName, COLLECTION_NAMES } from '@/config/firebase-collections-helper';
import { useTenantStore } from '@/stores/tenant.store';
import type {
	InventoryItem,
	StockTransaction,
	LotInfo,
	PurchaseOrder,
	InventoryAlert,
	InventoryItemFormData,
	StockTransactionFormData,
} from '@/types/inventory.types';

class InventoryService {
	/**
	 * Create a new inventory item
	 */
	async createItem(
		tenantId: string,
		data: InventoryItemFormData,
		userId: string
	): Promise<string> {
		const itemData = {
			...data,
			tenantId,
			currentStock: 0,
			isActive: true,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
			createdBy: userId,
			updatedBy: userId,
		};

		const docRef = await addDoc(
			collection(firestore, getFirestoreCollectionName(COLLECTION_NAMES.INVENTORY_ITEMS, tenantId)),
			itemData
		);

		return docRef.id;
	}

	/**
	 * Update an inventory item
	 */
	async updateItem(
		tenantId: string,
		itemId: string,
		data: Partial<InventoryItemFormData>,
		userId: string
	): Promise<void> {
		const updateData = {
			...data,
			updatedAt: serverTimestamp(),
			updatedBy: userId,
		};

		await updateDoc(
			doc(firestore, getFirestoreCollectionName(COLLECTION_NAMES.INVENTORY_ITEMS, tenantId), itemId),
			updateData
		);
	}

	/**
	 * Get an inventory item by ID
	 */
	async getItem(
		tenantId: string,
		itemId: string
	): Promise<InventoryItem | null> {
		const docSnap = await getDoc(
			doc(firestore, getFirestoreCollectionName(COLLECTION_NAMES.INVENTORY_ITEMS, tenantId), itemId)
		);

		if (!docSnap.exists()) {
			return null;
		}

		return {
			id: docSnap.id,
			...docSnap.data(),
		} as InventoryItem;
	}

	/**
	 * Get all inventory items
	 */
	async getItems(
		tenantId: string,
		filters?: {
			category?: string;
			isActive?: boolean;
			search?: string;
		},
		pageSize: number = 20,
		lastDoc?: DocumentSnapshot
	): Promise<{
		items: InventoryItem[];
		lastDoc: DocumentSnapshot | null;
		hasMore: boolean;
	}> {
		let q = query(
			collection(firestore, getFirestoreCollectionName(COLLECTION_NAMES.INVENTORY_ITEMS, tenantId)),
			orderBy('name')
		);

		if (filters?.category) {
			q = query(q, where('category', '==', filters.category));
		}

		if (filters?.isActive !== undefined) {
			q = query(q, where('isActive', '==', filters.isActive));
		}

		q = query(q, limit(pageSize + 1));

		if (lastDoc) {
			q = query(q, startAfter(lastDoc));
		}

		const snapshot = await getDocs(q);
		const items = snapshot.docs.slice(0, pageSize).map((doc) => ({
			id: doc.id,
			...doc.data(),
		})) as InventoryItem[];

		return {
			items,
			lastDoc: snapshot.docs[pageSize - 1] || null,
			hasMore: snapshot.docs.length > pageSize,
		};
	}

	/**
	 * Record a stock transaction
	 */
	async recordTransaction(
		tenantId: string,
		data: StockTransactionFormData,
		userId: string
	): Promise<string> {
		return runTransaction(firestore, async (transaction) => {
			// Get the inventory item
			const itemRef = doc(
				firestore,
				getFirestoreCollectionName(COLLECTION_NAMES.INVENTORY_ITEMS, tenantId),
				data.itemId
			);
			const itemDoc = await transaction.get(itemRef);

			if (!itemDoc.exists()) {
				throw new Error('Inventory item not found');
			}

			const item = itemDoc.data() as InventoryItem;

			// Calculate quantity change
			let quantityChange = data.quantity;
			if (['usage', 'disposal', 'transfer'].includes(data.type)) {
				quantityChange = -Math.abs(data.quantity);
			}

			// Check if we have enough stock for outgoing transactions
			if (quantityChange < 0 && item.currentStock + quantityChange < 0) {
				throw new Error('Insufficient stock');
			}

			// Create transaction record
			const transactionData: Omit<StockTransaction, 'id'> = {
				tenantId,
				itemId: data.itemId,
				type: data.type,
				quantity: quantityChange,
				lotNumber: data.lotNumber,
				expirationDate: data.expirationDate
					? Timestamp.fromDate(data.expirationDate)
					: undefined,
				vendor: data.vendor,
				unitCost: data.unitCost,
				totalCost: data.unitCost
					? Math.abs(data.quantity) * data.unitCost
					: undefined,
				reason: data.reason,
				notes: data.notes,
				performedBy: userId,
				performedAt: serverTimestamp() as Timestamp,
			};

			// Add transaction
			const transactionRef = doc(
				collection(firestore, getFirestoreCollectionName(COLLECTION_NAMES.STOCK_TRANSACTIONS, tenantId))
			);
			transaction.set(transactionRef, transactionData);

			// Update item stock
			transaction.update(itemRef, {
				currentStock: increment(quantityChange),
				lastUsedDate: data.type === 'usage' ? serverTimestamp() : undefined,
				updatedAt: serverTimestamp(),
				updatedBy: userId,
			});

			// If lot tracking is required, update lot info
			if (
				item.requiresLotTracking &&
				data.lotNumber &&
				data.type === 'purchase'
			) {
				const lotData: Omit<LotInfo, 'id'> = {
					tenantId,
					itemId: data.itemId,
					lotNumber: data.lotNumber,
					expirationDate: data.expirationDate
						? Timestamp.fromDate(data.expirationDate)
						: Timestamp.now(),
					quantity: data.quantity,
					receivedDate: serverTimestamp() as Timestamp,
					vendor: data.vendor,
					qcStatus: 'pending',
					quantityUsed: 0,
					quantityRemaining: data.quantity,
					isActive: true,
					isExpired: false,
					createdAt: serverTimestamp() as Timestamp,
					updatedAt: serverTimestamp() as Timestamp,
				};

				const lotRef = doc(
					collection(firestore, getFirestoreCollectionName(COLLECTION_NAMES.LOTS, tenantId))
				);
				transaction.set(lotRef, lotData);
			}

			// Check for alerts
			if (item.currentStock + quantityChange <= item.reorderPoint) {
				const alertData: Omit<InventoryAlert, 'id'> = {
					tenantId,
					type: 'reorder_needed',
					itemId: data.itemId,
					itemName: item.name,
					currentValue: item.currentStock + quantityChange,
					thresholdValue: item.reorderPoint,
					isActive: true,
					isAcknowledged: false,
					createdAt: serverTimestamp() as Timestamp,
					priority:
						item.currentStock + quantityChange <= item.minimumStock
							? 'critical'
							: 'high',
				};

				const alertRef = doc(
					collection(firestore, getFirestoreCollectionName(COLLECTION_NAMES.INVENTORY_ALERTS, tenantId))
				);
				transaction.set(alertRef, alertData);
			}

			return transactionRef.id;
		});
	}

	/**
	 * Get stock transactions for an item
	 */
	async getTransactions(
		tenantId: string,
		itemId: string,
		pageSize: number = 50,
		lastDoc?: DocumentSnapshot
	): Promise<{
		transactions: StockTransaction[];
		lastDoc: DocumentSnapshot | null;
		hasMore: boolean;
	}> {
		let q = query(
			collection(firestore, getFirestoreCollectionName(COLLECTION_NAMES.STOCK_TRANSACTIONS, tenantId)),
			where('itemId', '==', itemId),
			orderBy('performedAt', 'desc'),
			limit(pageSize + 1)
		);

		if (lastDoc) {
			q = query(q, startAfter(lastDoc));
		}

		const snapshot = await getDocs(q);
		const transactions = snapshot.docs.slice(0, pageSize).map((doc) => ({
			id: doc.id,
			...doc.data(),
		})) as StockTransaction[];

		return {
			transactions,
			lastDoc: snapshot.docs[pageSize - 1] || null,
			hasMore: snapshot.docs.length > pageSize,
		};
	}

	/**
	 * Get active lots for an item
	 */
	async getActiveLots(tenantId: string, itemId: string): Promise<LotInfo[]> {
		const q = query(
			collection(firestore, getFirestoreCollectionName(COLLECTION_NAMES.LOTS, tenantId)),
			where('itemId', '==', itemId),
			where('isActive', '==', true),
			where('quantityRemaining', '>', 0),
			orderBy('expirationDate')
		);

		const snapshot = await getDocs(q);
		return snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		})) as LotInfo[];
	}

	/**
	 * Get items needing reorder
	 */
	async getReorderItems(tenantId: string): Promise<InventoryItem[]> {
		const q = query(
			collection(firestore, getFirestoreCollectionName(COLLECTION_NAMES.INVENTORY_ITEMS, tenantId)),
			where('isActive', '==', true),
			where('currentStock', '<=', where('reorderPoint', '>', 0))
		);

		const snapshot = await getDocs(q);
		return snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		})) as InventoryItem[];
	}

	/**
	 * Get expiring items
	 */
	async getExpiringItems(
		tenantId: string,
		daysAhead: number = 30
	): Promise<LotInfo[]> {
		const expirationDate = new Date();
		expirationDate.setDate(expirationDate.getDate() + daysAhead);

		const q = query(
			collection(firestore, getFirestoreCollectionName(COLLECTION_NAMES.LOTS, tenantId)),
			where('isActive', '==', true),
			where('quantityRemaining', '>', 0),
			where('expirationDate', '<=', Timestamp.fromDate(expirationDate)),
			orderBy('expirationDate')
		);

		const snapshot = await getDocs(q);
		return snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		})) as LotInfo[];
	}

	/**
	 * Create a purchase order
	 */
	async createPurchaseOrder(
		tenantId: string,
		data: Omit<
			PurchaseOrder,
			'id' | 'tenantId' | 'orderNumber' | 'createdAt' | 'updatedAt'
		>,
		userId: string
	): Promise<string> {
		// Generate order number
		const orderNumber = `PO-${Date.now()}`;

		const orderData = {
			...data,
			tenantId,
			orderNumber,
			status: 'draft',
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
			requestedBy: userId,
		};

		const docRef = await addDoc(
			collection(firestore, getFirestoreCollectionName(COLLECTION_NAMES.PURCHASE_ORDERS, tenantId)),
			orderData
		);

		return docRef.id;
	}

	/**
	 * Update purchase order status
	 */
	async updatePurchaseOrderStatus(
		tenantId: string,
		orderId: string,
		status: PurchaseOrder['status'],
		userId: string
	): Promise<void> {
		const updateData: Record<string, unknown> = {
			status,
			updatedAt: serverTimestamp(),
		};

		if (status === 'approved') {
			updateData.approvedBy = userId;
			updateData.approvalDate = serverTimestamp();
		}

		await updateDoc(
			doc(firestore, getFirestoreCollectionName(COLLECTION_NAMES.PURCHASE_ORDERS, tenantId), orderId),
			updateData as any
		);
	}

	/**
	 * Get active alerts
	 */
	async getActiveAlerts(tenantId: string): Promise<InventoryAlert[]> {
		const q = query(
			collection(firestore, getFirestoreCollectionName(COLLECTION_NAMES.INVENTORY_ALERTS, tenantId)),
			where('isActive', '==', true),
			where('isAcknowledged', '==', false),
			orderBy('priority', 'desc'),
			orderBy('createdAt', 'desc')
		);

		const snapshot = await getDocs(q);
		return snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		})) as InventoryAlert[];
	}

	/**
	 * Acknowledge an alert
	 */
	async acknowledgeAlert(
		tenantId: string,
		alertId: string,
		userId: string,
		actionTaken?: string
	): Promise<void> {
		await updateDoc(
			doc(firestore, getFirestoreCollectionName(COLLECTION_NAMES.INVENTORY_ALERTS, tenantId), alertId),
			{
				isAcknowledged: true,
				acknowledgedBy: userId,
				acknowledgedAt: serverTimestamp(),
				actionTaken,
				isActive: false,
				resolvedAt: serverTimestamp(),
			}
		);
	}

	/**
	 * Get inventory value summary
	 */
	async getInventoryValue(tenantId: string): Promise<{
		totalValue: number;
		itemCount: number;
		categoryBreakdown: Record<string, number>;
	}> {
		const q = query(
			collection(firestore, getFirestoreCollectionName(COLLECTION_NAMES.INVENTORY_ITEMS, tenantId)),
			where('isActive', '==', true)
		);

		const snapshot = await getDocs(q);
		let totalValue = 0;
		const categoryBreakdown: Record<string, number> = {};

		snapshot.docs.forEach((doc) => {
			const item = doc.data() as InventoryItem;
			const itemValue = (item.unitCost || 0) * item.currentStock;
			totalValue += itemValue;

			if (!categoryBreakdown[item.category]) {
				categoryBreakdown[item.category] = 0;
			}
			categoryBreakdown[item.category] += itemValue;
		});

		return {
			totalValue,
			itemCount: snapshot.size,
			categoryBreakdown,
		};
	}
}

class InventoryServiceWrapper extends InventoryService {
	// Wrapper methods to match store expectations
	async getInventoryItems(filters?: any) {
		const tenantId = useTenantStore.getState().currentTenant?.id;
		if (!tenantId) throw new Error('No tenant selected');
		return this.getItems(tenantId, filters);
	}

	async getInventoryItem(id: string) {
		const tenantId = useTenantStore.getState().currentTenant?.id;
		if (!tenantId) throw new Error('No tenant selected');
		return this.getItem(tenantId, id);
	}

	async createInventoryItem(data: InventoryItemFormData) {
		const tenantId = useTenantStore.getState().currentTenant?.id;
		const userId = auth.currentUser?.uid;
		if (!tenantId || !userId) throw new Error('No tenant or user');
		return this.createItem(tenantId, data, userId);
	}

	async updateInventoryItem(id: string, data: Partial<InventoryItem>) {
		const tenantId = useTenantStore.getState().currentTenant?.id;
		const userId = auth.currentUser?.uid;
		if (!tenantId || !userId) throw new Error('No tenant or user');
		return this.updateItem(tenantId, id, data, userId);
	}

	async deleteInventoryItem(id: string) {
		const tenantId = useTenantStore.getState().currentTenant?.id;
		const userId = auth.currentUser?.uid;
		if (!tenantId || !userId) throw new Error('No tenant or user');
		return this.updateItem(tenantId, id, { isActive: false }, userId);
	}

	async recordStockMovement(data: StockTransactionFormData) {
		const tenantId = useTenantStore.getState().currentTenant?.id;
		const userId = auth.currentUser?.uid;
		if (!tenantId || !userId) throw new Error('No tenant or user');
		return this.recordTransaction(tenantId, data, userId);
	}

	async getStockMovements(itemId: string) {
		const tenantId = useTenantStore.getState().currentTenant?.id;
		if (!tenantId) throw new Error('No tenant selected');
		const result = await this.getTransactions(tenantId, itemId);
		return result.transactions;
	}

	async getPurchaseOrders() {
		// This needs to be implemented in the base class
		return [];
	}

	async updatePurchaseOrder(id: string, data: any) {
		const tenantId = useTenantStore.getState().currentTenant?.id;
		if (!tenantId) throw new Error('No tenant selected');
		// For now, update status if provided
		if (data.status) {
			return this.updatePurchaseOrderStatus(tenantId, id, data.status);
		}
	}

	async getSuppliers() {
		// This needs to be implemented - return empty for now
		return [];
	}

	async createSupplier(data: any) {
		// This needs to be implemented
		return '';
	}

	async updateSupplier(id: string, data: any) {
		// This needs to be implemented
		return;
	}
}

export const inventoryService = new InventoryServiceWrapper();
